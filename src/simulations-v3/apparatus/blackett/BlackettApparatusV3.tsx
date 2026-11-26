"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Nuclide } from "@/components/learning/Nuclide";
import { loadStudentNotebook } from "@/lib/chapter4-lessons";
import { usePersistedLabState } from "@/lib/use-persisted-lab-state";
import { probeWebGLSupport } from "../rutherford/parts";
import {
  buildBlackettTrackDataset,
  getBlackettStageAtProgress,
  verifyBlackettConservation,
  type BlackettRunMode,
} from "../../physics/blackett-engine";
import { BlackettFallbackDiagram } from "./BlackettFallbackDiagram";
import { buildBlackettApparatus, type BlackettSceneHandles } from "./geometry";
import {
  BLACKETT_CAMERA_PRESETS,
  BLACKETT_COMPONENTS,
  BLACKETT_PART_GUIDES,
  BLACKETT_V3_STORAGE_KEY,
  INITIAL_BLACKETT_V3_STATE,
  parseBlackettV3State,
  resolveBlackettRaycastPart,
  type BlackettCameraMode,
} from "./parts";

const CAMERA_TARGETS: Record<
  BlackettCameraMode,
  { readonly pos: [number, number, number]; readonly target: [number, number, number]; readonly fov: number }
> = {
  overview: {
    pos: [0.35, 3.85, 5.15],
    target: [0, 0.45, 0],
    fov: 41,
  },
  window: {
    pos: [0, 5.85, 0.04],
    target: [0, 0.45, 0],
    fov: 42,
  },
  port: {
    pos: [-2.85, 2.25, 3.25],
    target: [-0.85, 0.48, 0.05],
    fov: 40,
  },
};

function disposeObject3D(root: THREE.Object3D): void {
  const geos = new Set<THREE.BufferGeometry>();
  const mats = new Set<THREE.Material>();
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
      if (obj.geometry && !geos.has(obj.geometry)) {
        geos.add(obj.geometry);
        obj.geometry.dispose();
      }
      const mList = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mList) {
        if (m && !mats.has(m)) {
          mats.add(m);
          m.dispose();
        }
      }
    }
  });
}

const NOOP_SUB = () => () => {};
const SERVER_SNAP = () => true;
let cachedBlackettWebGL: boolean | null = null;
function getBlackettWebGLSnap(): boolean {
  if (cachedBlackettWebGL === null) {
    cachedBlackettWebGL = probeWebGLSupport();
  }
  return cachedBlackettWebGL;
}

function subscribeStorage(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("storage", handler);
  window.addEventListener("chapter4-storage-changed", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("chapter4-storage-changed", handler);
  };
}

function getB22NotebookLockedSnap(): boolean {
  if (typeof window === "undefined") return false;
  const nb = loadStudentNotebook("B22");
  return Boolean((nb.initialPredictionChoice ?? nb.preClassPredictionChoice ?? "").trim());
}

const SERVER_LOCKED_SNAP = () => false;

interface ProjectedPin {
  readonly id: string;
  readonly xPct: number;
  readonly yPct: number;
  readonly visible: boolean;
}

export interface BlackettApparatusV3Props {
  /** Khi nhúng trong Pha 1 (/hoc-lieu/truc-quan?bai=B22), trạng thái khóa dự đoán lấy trực tiếp từ sổ tay Pha 1 */
  readonly externalPredictionLocked?: boolean;
  /** Khi nhúng trong Pha 1, phần giải thích đặt ngay sau Bước Khóa dự đoán của Pha 1 nên ẩn khối dự đoán độc lập */
  readonly hideStandalonePrediction?: boolean;
  /** Ẩn thẻ đối chiếu Hình 22.1 – 22.2 nội bộ nếu trang cha đã hiển thị riêng */
  readonly hideBuiltInComparisonCards?: boolean;
  readonly onRunsObservedChange?: (status: {
    readonly hasRunStraight: boolean;
    readonly hasRunYFork: boolean;
  }) => void;
}

export function BlackettApparatusV3({
  externalPredictionLocked,
  hideStandalonePrediction = false,
  hideBuiltInComparisonCards = false,
  onRunsObservedChange,
}: BlackettApparatusV3Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    handles: BlackettSceneHandles;
    frameId: number;
  } | null>(null);

  const [state, setState] = usePersistedLabState(
    BLACKETT_V3_STORAGE_KEY,
    INITIAL_BLACKETT_V3_STATE,
    parseBlackettV3State,
  );

  const {
    cameraMode,
    selectedPartId,
    activeRun,
    completedRuns,
    standalonePredictionChoice,
    standalonePredictionReason,
    standalonePredictionLocked,
    azVerified,
  } = state;

  const notebookLocked = useSyncExternalStore(
    subscribeStorage,
    getB22NotebookLockedSnap,
    SERVER_LOCKED_SNAP,
  );
  const identitiesUnlocked =
    externalPredictionLocked !== undefined
      ? externalPredictionLocked
      : notebookLocked || standalonePredictionLocked;

  const [progress, setProgress] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [showPartPins, setShowPartPins] = useState<boolean>(true);
  const [partPins, setPartPins] = useState<readonly ProjectedPin[]>([]);
  const [segmentPins, setSegmentPins] = useState<readonly ProjectedPin[]>([]);

  const probedWebGL = useSyncExternalStore(NOOP_SUB, getBlackettWebGLSnap, SERVER_SNAP);
  const [webglError, setWebglError] = useState(false);
  const [isHiddenAncestor, setIsHiddenAncestor] = useState(false);

  const canUseWebGL = probedWebGL && !webglError;
  const shouldMountWebGL = canUseWebGL && !isHiddenAncestor;

  const progressRef = useRef(progress);
  const activeRunRef = useRef(activeRun);
  useEffect(() => {
    progressRef.current = progress;
    activeRunRef.current = activeRun;
    sceneRef.current?.handles.updateTracks(activeRun, progress);
  }, [activeRun, progress]);

  useEffect(() => {
    sceneRef.current?.handles.setHighlightPart(selectedPartId);
  }, [selectedPartId]);

  const hasRunStraight = completedRuns.includes("straight");
  const hasRunYFork = completedRuns.includes("y_fork");

  useEffect(() => {
    onRunsObservedChange?.({ hasRunStraight, hasRunYFork });
  }, [hasRunStraight, hasRunYFork, onRunsObservedChange]);

  // Watch ancestor [hidden] so GPU context releases cleanly when switching lesson tabs
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof MutationObserver === "undefined") return;
    const checkHidden = () => {
      setIsHiddenAncestor(Boolean(el.closest("[hidden]")));
    };
    checkHidden();
    const obs = new MutationObserver(checkHidden);
    obs.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ["hidden"],
    });
    return () => obs.disconnect();
  }, []);

  // Playback loop using wall-clock elapsed time (FPS-independent across software & hardware WebGL)
  useEffect(() => {
    if (!isPlaying) return;
    const durationMs = activeRun === "straight" ? 2100 : 3300;
    const startTs = performance.now();
    const startProg = progressRef.current >= 0.995 ? 0 : progressRef.current;
    let raf = 0;

    const step = (now: number) => {
      const elapsed = Math.max(0, now - startTs);
      const next = Math.min(1, startProg + elapsed / durationMs);
      progressRef.current = next;
      setProgress(next);

      if (next >= 1) {
        setIsPlaying(false);
        setState((prev) => ({
          ...prev,
          completedRuns: prev.completedRuns.includes(prev.activeRun)
            ? prev.completedRuns
            : [...prev.completedRuns, prev.activeRun],
        }));
        return;
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, activeRun, setState]);

  const startOrReplayRun = useCallback(
    (mode: BlackettRunMode) => {
      setState((prev) => ({ ...prev, activeRun: mode }));
      progressRef.current = 0;
      setProgress(0);
      setIsPlaying(true);
    },
    [setState],
  );

  const showCompletedRunInstant = useCallback(
    (mode: BlackettRunMode) => {
      setIsPlaying(false);
      progressRef.current = 1;
      setProgress(1);
      setState((prev) => ({
        ...prev,
        activeRun: mode,
        completedRuns: prev.completedRuns.includes(mode)
          ? prev.completedRuns
          : [...prev.completedRuns, mode],
      }));
    },
    [setState],
  );

  const applyCameraPreset = useCallback((mode: BlackettCameraMode) => {
    const inst = sceneRef.current;
    if (!inst) return;
    const spec = CAMERA_TARGETS[mode];
    inst.camera.fov = spec.fov;
    inst.camera.position.set(...spec.pos);
    inst.controls.target.set(...spec.target);
    inst.camera.updateProjectionMatrix();
    inst.controls.update();
  }, []);

  // Mount & tear down Three.js WebGL scene
  useEffect(() => {
    if (!shouldMountWebGL) return;
    const host = canvasHostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      cachedBlackettWebGL = false;
      queueMicrotask(() => setWebglError(true));
      return;
    }

    const width = Math.max(300, host.clientWidth || 720);
    const height = Math.max(320, host.clientHeight || 420);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.innerHTML = "";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060b16);

    const initCam = CAMERA_TARGETS[cameraMode];
    const camera = new THREE.PerspectiveCamera(initCam.fov, width / height, 0.1, 80);
    camera.position.set(...initCam.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.4;
    controls.maxDistance = 12.5;
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set(...initCam.target);
    controls.update();

    scene.add(new THREE.AmbientLight(0xe2e8f0, 0.95));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
    keyLight.position.set(4.5, 7.5, 5.5);
    scene.add(keyLight);
    const sideLampLight = new THREE.PointLight(0x38bdf8, 1.15, 9);
    sideLampLight.position.set(0, 0.65, -2.0);
    scene.add(sideLampLight);

    const handles = buildBlackettApparatus(BLACKETT_COMPONENTS);
    handles.updateTracks(activeRunRef.current, progressRef.current);
    handles.setHighlightPart(selectedPartId);
    scene.add(handles.root);

    const yDataset = buildBlackettTrackDataset("y_fork");
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let downPos: { x: number; y: number } | null = null;

    const onPointerDown = (ev: PointerEvent) => {
      downPos = { x: ev.clientX, y: ev.clientY };
    };

    const onPointerUp = (ev: PointerEvent) => {
      if (!downPos) return;
      const moved = Math.hypot(ev.clientX - downPos.x, ev.clientY - downPos.y);
      downPos = null;
      if (moved > 6) return;

      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerNdc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(handles.root.children, true);
      const orderedIds: string[] = [];
      for (const h of hits) {
        const pid = h.object.userData?.partId;
        if (typeof pid === "string" && !orderedIds.includes(pid)) {
          orderedIds.push(pid);
        }
      }
      const chosen = resolveBlackettRaycastPart(orderedIds);
      if (chosen) {
        setState((prev) => ({ ...prev, selectedPartId: chosen }));
      }
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      setWebglError(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost, false);

    const ro = new ResizeObserver(() => {
      const w = Math.max(280, host.clientWidth);
      const h = Math.max(300, host.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(host);

    const tmpVec = new THREE.Vector3();
    let lastPinSync = 0;

    const projectWorld = (wx: number, wy: number, wz: number, id: string): ProjectedPin => {
      tmpVec.set(wx, wy, wz).project(camera);
      const inFront = tmpVec.z >= -1 && tmpVec.z <= 1;
      const xPct = (tmpVec.x * 0.5 + 0.5) * 100;
      const yPct = (-tmpVec.y * 0.5 + 0.5) * 100;
      return {
        id,
        xPct,
        yPct,
        visible: inFront && xPct >= 4 && xPct <= 96 && yPct >= 6 && yPct <= 94,
      };
    };

    let frameId = 0;
    const animate = (now: number) => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);

      if (now - lastPinSync > 85) {
        lastPinSync = now;
        const nextPartPins: ProjectedPin[] = [];
        for (const guide of BLACKETT_PART_GUIDES) {
          const built = handles.components.get(guide.partId);
          if (!built) continue;
          const a = built.labelAnchorLocal;
          nextPartPins.push(projectWorld(a.x, a.y, a.z, guide.partId));
        }
        setPartPins(nextPartPins);

        const anc = yDataset.anchors;
        setSegmentPins([
          projectWorld(anc.incidentMid.x, anc.incidentMid.y, anc.incidentMid.z, "1"),
          projectWorld(anc.vertex.x, anc.vertex.y, anc.vertex.z, "2"),
          projectWorld(anc.thinBranchTip.x, anc.thinBranchTip.y, anc.thinBranchTip.z, "3"),
          projectWorld(anc.thickBranchTip.x, anc.thickBranchTip.y, anc.thickBranchTip.z, "4"),
        ]);
      }
    };
    frameId = requestAnimationFrame(animate);

    sceneRef.current = { renderer, scene, camera, controls, handles, frameId };

    return () => {
      cancelAnimationFrame(frameId);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      controls.dispose();
      handles.disposeExtra();
      disposeObject3D(handles.root);
      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldMountWebGL]);

  useEffect(() => {
    applyCameraPreset(cameraMode);
  }, [cameraMode, applyCameraPreset]);

  const stageInfo = useMemo(
    () => getBlackettStageAtProgress(activeRun, progress),
    [activeRun, progress],
  );
  const conservation = useMemo(() => verifyBlackettConservation(), []);
  const selectedGuide = useMemo(
    () => BLACKETT_PART_GUIDES.find((g) => g.partId === selectedPartId) ?? null,
    [selectedPartId],
  );

  // Student interactive A/Z check fields inside standalone mode
  const [checkO17A, setCheckO17A] = useState("17");
  const [checkO17Z, setCheckO17Z] = useState("8");
  const [checkP1A, setCheckP1A] = useState("1");
  const [checkP1Z, setCheckP1Z] = useState("1");
  const standaloneAzOk =
    Number(checkO17A.trim()) === 17 &&
    Number(checkO17Z.trim()) === 8 &&
    Number(checkP1A.trim()) === 1 &&
    Number(checkP1Z.trim()) === 1;

  return (
    <div
      ref={rootRef}
      data-testid="blackett-apparatus-v3"
      style={{
        border: "1px solid #cbd5e1",
        borderRadius: "12px",
        background: "#ffffff",
        overflow: "hidden",
        marginBottom: "16px",
      }}
    >
      {/* Top scientific header & model convention note */}
      <div
        style={{
          padding: "12px 16px",
          background: "#0f172a",
          color: "#f8fafc",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#38bdf8",
              display: "block",
            }}
          >
            Thiết bị 3D chuẩn V3 · Tư liệu P. M. S. Blackett (1925, Proc. R. Soc. A 107)
          </span>
          <strong style={{ fontSize: "15.5px" }}>
            Buồng sương giãn nở Blackett 3D — Khảo sát vệt thẳng &amp; vết rẽ nhánh chữ Y (Hình 22.2 SGK tr. 96)
          </strong>
        </div>

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12.5px",
            color: "#e2e8f0",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            data-blackett-toggle-pins
            checked={showPartPins}
            onChange={(e) => setShowPartPins(e.target.checked)}
          />
          <span>Hiện nhãn bộ phận 3D</span>
        </label>
      </div>

      {/* Explicit scale & time convention banner */}
      <div
        data-testid="blackett-convention-note"
        style={{
          padding: "8px 14px",
          background: "#fffbeb",
          borderBottom: "1px solid #fde68a",
          fontSize: "12.5px",
          color: "#78350f",
          lineHeight: 1.5,
        }}
      >
        <strong>Quy ước mô hình:</strong> Kích thước vỏ buồng, bề dày giọt sương ngưng tụ và tốc độ xuất hiện tuần tự các đoạn vệt theo thời gian là <strong>tỉ lệ quy ước trực quan</strong> (trong thực tế phản ứng hạt nhân diễn ra tức thời cỡ <code>10⁻²¹ – 10⁻¹⁸ s</code> và vệt sương dài vài cm được chụp lại ngay sau cú giãn pít-tông).
      </div>

      {/* Built-in comparison cards for standalone /hoc-lieu/phong-hat-nhan-v2?bai=B22 */}
      {!hideBuiltInComparisonCards && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: "10px",
            padding: "12px 14px",
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div style={{ padding: "10px 12px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px" }}>
            <strong style={{ display: "block", fontSize: "13px", color: "#0f172a", marginBottom: "4px" }}>
              Hình 22.1 SGK (tr. 96) · Sơ đồ thí nghiệm Rutherford (1919)
            </strong>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#334155", lineHeight: 1.5 }}>
              Nguồn <code>P</code> phát hạt α trong bình khí Nitrogen; màn huỳnh quang <code>S</code> và kính hiển vi <code>K</code> đặt bên ngoài chỉ ghi nhận đốm chớp sáng của hạt phóng ra, <strong>chưa quan sát trực tiếp được điểm va chạm</strong>.
            </p>
          </div>
          <div style={{ padding: "10px 12px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px" }}>
            <strong style={{ display: "block", fontSize: "13px", color: "#0369a1", marginBottom: "4px" }}>
              Hình 22.2 SGK (tr. 96) · Ảnh vết buồng sương Blackett (1925)
            </strong>
            <p style={{ margin: 0, fontSize: "12.5px", color: "#0c4a6e", lineHeight: 1.5 }}>
              Chụp qua cửa sổ kính phía trên hơn 23 000 tấm ảnh (~400 000 vệt α): phát hiện các vết chữ Y nơi <strong>vệt α kết thúc tại đỉnh</strong> và chỉ tách làm <strong>2 nhánh</strong> (không có nhánh thứ ba).
            </p>
          </div>
        </div>
      )}

      {/* 3D / Fallback Stage */}
      <div
        data-blackett-stage
        data-blackett-render-mode={
          !canUseWebGL ? "fallback" : isHiddenAncestor ? "webgl-released" : "webgl-active"
        }
        style={{
          position: "relative",
          background: "#060b16",
          minHeight: "390px",
        }}
      >
        {/* Camera preset bar overlaid top-left */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 5,
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
          }}
        >
          {BLACKETT_CAMERA_PRESETS.map((preset) => {
            const active = cameraMode === preset.mode;
            return (
              <button
                key={preset.mode}
                type="button"
                data-blackett-camera-preset={preset.mode}
                aria-pressed={active}
                onClick={() => setState((prev) => ({ ...prev, cameraMode: preset.mode }))}
                style={{
                  padding: "6px 11px",
                  minHeight: "34px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  borderRadius: "7px",
                  border: active ? "1.5px solid #38bdf8" : "1px solid rgba(148,163,184,0.45)",
                  background: active ? "rgba(3, 105, 161, 0.92)" : "rgba(15, 23, 42, 0.82)",
                  color: "#f8fafc",
                  cursor: "pointer",
                }}
              >
                {preset.label}
              </button>
            );
          })}
          {canUseWebGL && (
            <button
              type="button"
              data-blackett-reset-camera-btn
              onClick={() => applyCameraPreset(cameraMode)}
              style={{
                padding: "6px 10px",
                minHeight: "34px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "7px",
                border: "1px solid rgba(148,163,184,0.4)",
                background: "rgba(15, 23, 42, 0.78)",
                color: "#cbd5e1",
                cursor: "pointer",
              }}
            >
              Đặt lại góc nhìn
            </button>
          )}
        </div>

        {!canUseWebGL ? (
          <div data-testid="blackett-webgl-fallback" style={{ paddingTop: "52px" }}>
            <div
              role="status"
              style={{
                margin: "0 12px 8px",
                padding: "8px 12px",
                borderRadius: "7px",
                background: "rgba(30, 41, 59, 0.95)",
                border: "1px solid #38bdf8",
                color: "#e0f2fe",
                fontSize: "12.5px",
              }}
            >
              Trình duyệt hiện tại chưa bật WebGL 3D — đang hiển thị <strong>Sơ đồ quan sát dự phòng</strong> dùng chung 100% trạng thái góc nhìn, chọn bộ phận và hai lượt chạy với mô hình 3D.
            </div>
            <BlackettFallbackDiagram
              cameraMode={cameraMode}
              selectedPartId={selectedPartId}
              onSelectPart={(pid) => setState((prev) => ({ ...prev, selectedPartId: pid }))}
              activeRun={activeRun}
              progress={progress}
              identitiesUnlocked={identitiesUnlocked}
            />
          </div>
        ) : (
          <>
            <div
              ref={canvasHostRef}
              data-blackett-canvas
              style={{
                width: "100%",
                height: "410px",
                touchAction: "pan-y",
                cursor: "grab",
              }}
            />

            {/* 3D Part Pins */}
            {showPartPins &&
              partPins.map((pin) => {
                if (!pin.visible) return null;
                const guide = BLACKETT_PART_GUIDES.find((g) => g.partId === pin.id);
                if (!guide) return null;
                const isSel = selectedPartId === guide.partId;
                return (
                  <button
                    key={pin.id}
                    type="button"
                    data-blackett-3d-pin={guide.partId}
                    onClick={() =>
                      setState((prev) => ({ ...prev, selectedPartId: guide.partId }))
                    }
                    style={{
                      position: "absolute",
                      left: `${pin.xPct}%`,
                      top: `${pin.yPct}%`,
                      transform: "translate(-50%, -50%)",
                      zIndex: 4,
                      padding: "3px 9px",
                      borderRadius: "999px",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      border: isSel ? "2px solid #22d3ee" : "1px solid rgba(56,189,248,0.65)",
                      background: isSel ? "rgba(8, 51, 68, 0.96)" : "rgba(15, 23, 42, 0.84)",
                      color: "#f0f9ff",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {guide.buttonLabel}
                  </button>
                );
              })}

            {/* Sequential Y-Fork Segment Labels (1), (2), (3), (4) */}
            {activeRun === "y_fork" &&
              segmentPins.map((sp) => {
                if (!sp.visible) return null;
                const vis = stageInfo.visibleLabels;
                if (sp.id === "1" && !vis.show1) return null;
                if (sp.id === "2" && !vis.show2) return null;
                if (sp.id === "3" && !vis.show3) return null;
                if (sp.id === "4" && !vis.show4) return null;

                let text = "";
                let color = "#f8fafc";
                let border = "#38bdf8";
                if (sp.id === "1") {
                  text = "(1) Vệt α tới";
                  color = "#bae6fd";
                  border = "#38bdf8";
                } else if (sp.id === "2") {
                  text = "(2) Đỉnh";
                  color = "#fef08a";
                  border = "#facc15";
                } else if (sp.id === "3") {
                  text = identitiesUnlocked ? "(3) Proton ¹₁H" : "(3) Nhánh mảnh dài";
                  color = "#fef9c3";
                  border = "#eab308";
                } else {
                  text = identitiesUnlocked ? "(4) Hạt nhân ¹⁷₈O" : "(4) Nhánh đậm ngắn";
                  color = "#ffe4e6";
                  border = "#fb7185";
                }

                return (
                  <span
                    key={sp.id}
                    data-blackett-segment-badge={sp.id}
                    style={{
                      position: "absolute",
                      left: `${sp.xPct}%`,
                      top: `${sp.yPct}%`,
                      transform: "translate(-50%, -125%)",
                      zIndex: 3,
                      pointerEvents: "none",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      background: "rgba(2, 6, 23, 0.88)",
                      border: `1.5px solid ${border}`,
                      color,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {text}
                  </span>
                );
              })}
          </>
        )}

        {/* Bottom HUD */}
        <div
          style={{
            padding: "7px 12px",
            background: "rgba(2, 6, 23, 0.92)",
            borderTop: "1px solid #1e293b",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "#cbd5e1",
          }}
        >
          <span data-testid="blackett-stage-badge" style={{ color: "#7dd3fc", fontWeight: 700 }}>
            {stageInfo.stepBadge}
          </span>
          <span>Kéo để xoay 360° · Cuộn/chụm 2 ngón để thu phóng · Chạm bộ phận để xem chức năng</span>
        </div>
      </div>

      {/* Quick Part Selector Bar + Selected Part Inspection Card */}
      <div style={{ padding: "12px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
          <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#334155", marginRight: "4px" }}>
            Chọn bộ phận buồng sương:
          </span>
          {BLACKETT_PART_GUIDES.map((guide) => {
            const active = selectedPartId === guide.partId;
            return (
              <button
                key={guide.partId}
                type="button"
                data-blackett-part-btn={guide.partId}
                aria-pressed={active}
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    selectedPartId: prev.selectedPartId === guide.partId ? null : guide.partId,
                  }))
                }
                style={{
                  padding: "5px 10px",
                  minHeight: "34px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: active ? "2px solid #0284c7" : "1px solid #cbd5e1",
                  background: active ? "#e0f2fe" : "#ffffff",
                  color: active ? "#0c4a6e" : "#1e293b",
                  cursor: "pointer",
                }}
              >
                {guide.buttonLabel}
              </button>
            );
          })}
        </div>

        {selectedGuide && (
          <div
            data-blackett-selected-part-card={selectedGuide.partId}
            role="status"
            style={{
              marginTop: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              background: "#f0f9ff",
              border: "1.5px solid #0284c7",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <div style={{ fontSize: "13px", lineHeight: 1.55, color: "#0f172a" }}>
              <strong style={{ color: "#0369a1", display: "block", marginBottom: "2px" }}>
                Bộ phận đang chọn: {selectedGuide.shortName}
              </strong>
              <span>{selectedGuide.detailFunction}</span>
            </div>
            <button
              type="button"
              onClick={() => setState((prev) => ({ ...prev, selectedPartId: null }))}
              style={{
                padding: "4px 9px",
                fontSize: "12px",
                borderRadius: "6px",
                border: "1px solid #94a3b8",
                background: "#ffffff",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              Bỏ chọn
            </button>
          </div>
        )}
      </div>

      {/* Two Replayable Runs Controls */}
      <div style={{ padding: "14px 16px", background: "#ffffff" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <button
            type="button"
            data-blackett-run-straight-btn
            onClick={() => startOrReplayRun("straight")}
            style={{
              padding: "8px 14px",
              minHeight: "40px",
              fontSize: "13.5px",
              fontWeight: 700,
              borderRadius: "8px",
              border: activeRun === "straight" ? "2px solid #0284c7" : "1px solid #94a3b8",
              background: activeRun === "straight" ? "#e0f2fe" : "#f8fafc",
              color: "#0f172a",
              cursor: "pointer",
            }}
          >
            ▶ Chạy Lượt 1: Vệt thẳng (Hạt α đi xuyên qua) {hasRunStraight ? "✓" : ""}
          </button>

          <button
            type="button"
            data-blackett-run-yfork-btn
            onClick={() => startOrReplayRun("y_fork")}
            style={{
              padding: "8px 14px",
              minHeight: "40px",
              fontSize: "13.5px",
              fontWeight: 700,
              borderRadius: "8px",
              border: activeRun === "y_fork" ? "2px solid #1d4ed8" : "1px solid #1d4ed8",
              background: activeRun === "y_fork" ? "#1d4ed8" : "#eff6ff",
              color: activeRun === "y_fork" ? "#ffffff" : "#1e3a8a",
              cursor: "pointer",
            }}
          >
            ▶ Chạy Lượt 2: Vết chữ Y (1)→(2)→(3)→(4) {hasRunYFork ? "✓" : ""}
          </button>

          {isPlaying ? (
            <button
              type="button"
              data-blackett-pause-btn
              onClick={() => setIsPlaying(false)}
              style={{
                padding: "8px 12px",
                minHeight: "40px",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "8px",
                border: "1px solid #d97706",
                background: "#fef3c7",
                color: "#92400e",
                cursor: "pointer",
              }}
            >
              ⏸ Tạm dừng
            </button>
          ) : (
            <button
              type="button"
              data-blackett-complete-instant-btn
              onClick={() => showCompletedRunInstant(activeRun)}
              style={{
                padding: "8px 12px",
                minHeight: "40px",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                color: "#334155",
                cursor: "pointer",
              }}
            >
              Hiện trọn vệt ({activeRun === "y_fork" ? "Chữ Y" : "Vệt thẳng"})
            </button>
          )}
        </div>

        {/* Live stage explanation */}
        <div
          role="status"
          data-testid="blackett-live-stage-description"
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            background: "#f8fafc",
            borderLeft: "4px solid #0284c7",
            fontSize: "13.5px",
            lineHeight: 1.55,
            color: "#1e293b",
          }}
        >
          <strong>{stageInfo.stepBadge}:</strong> {stageInfo.descriptionVi}
        </div>

        {/* Standalone prediction + post-prediction explanation for /hoc-lieu/phong-hat-nhan-v2?bai=B22 */}
        {!hideStandalonePrediction && (
          <div
            data-testid="blackett-standalone-inquiry"
            style={{
              marginTop: "14px",
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              background: "#f8fafc",
            }}
          >
            {!identitiesUnlocked ? (
              <div>
                <strong style={{ display: "block", fontSize: "14px", marginBottom: "6px", color: "#0f172a" }}>
                  Dự đoán trước khi mở giải thích của Blackett:
                </strong>
                <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#334155" }}>
                  Vì sao ở Lượt 2 vệt hạt α tới <code>(1)</code> dừng hẳn tại đỉnh <code>(2)</code> và chỉ tách ra <strong>2 nhánh</strong> <code>(3)</code>, <code>(4)</code> (không có nhánh thứ ba)?
                </p>
                <div style={{ display: "grid", gap: "6px", marginBottom: "8px" }}>
                  {[
                    [
                      "scatter",
                      "Hạt α chỉ va chạm đàn hồi rồi tự biến mất không để lại hạt nhân mới.",
                    ],
                    [
                      "transmute",
                      "Hạt α bị hạt nhân ¹⁴₇N bắt giữ tạo biến đổi hạt nhân sinh ra hai hạt nhân mới (nhánh mảnh dài và nhánh đậm ngắn).",
                    ],
                  ].map(([val, label]) => (
                    <label
                      key={val}
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "flex-start",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name="blackett-standalone-pred"
                        checked={standalonePredictionChoice === val}
                        onChange={() =>
                          setState((prev) => ({ ...prev, standalonePredictionChoice: val }))
                        }
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
                <input
                  type="text"
                  value={standalonePredictionReason}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, standalonePredictionReason: e.target.value }))
                  }
                  placeholder="Nhập ngắn gọn lí do dự đoán của em…"
                  style={{
                    width: "100%",
                    minHeight: "38px",
                    padding: "6px 10px",
                    border: "1px solid #94a3b8",
                    borderRadius: "6px",
                    fontSize: "13px",
                    marginBottom: "8px",
                  }}
                />
                <button
                  type="button"
                  data-blackett-standalone-lock-btn
                  disabled={!standalonePredictionChoice || !standalonePredictionReason.trim()}
                  onClick={() =>
                    setState((prev) => ({ ...prev, standalonePredictionLocked: true }))
                  }
                  style={{
                    padding: "7px 14px",
                    minHeight: "38px",
                    borderRadius: "7px",
                    border: "none",
                    fontWeight: 700,
                    fontSize: "13px",
                    background:
                      standalonePredictionChoice && standalonePredictionReason.trim()
                        ? "#1d4ed8"
                        : "#94a3b8",
                    color: "#ffffff",
                    cursor:
                      standalonePredictionChoice && standalonePredictionReason.trim()
                        ? "pointer"
                        : "not-allowed",
                  }}
                >
                  Khóa dự đoán &amp; mở giải thích hai nhánh (3), (4)
                </button>
              </div>
            ) : (
              <div data-testid="blackett-post-prediction-explanation">
                <strong style={{ display: "block", fontSize: "14px", color: "#065f46", marginBottom: "6px" }}>
                  ✓ Giải thích sau bước dự đoán &amp; Kiểm tra bảo toàn A, Z ở hai vế:
                </strong>
                <ul style={{ margin: "0 0 10px", paddingLeft: "18px", fontSize: "13px", lineHeight: 1.6 }}>
                  <li>
                    <strong>Vệt α tới (1) kết thúc tại đỉnh (2):</strong> Hạt <Nuclide sym="He" a={4} z={2} /> đã nhập vào hạt nhân <Nuclide sym="N" a={14} z={7} /> tại đỉnh va chạm, không còn hạt α bay tiếp.
                  </li>
                  <li>
                    <strong>Nhánh mảnh, dài (3) là proton <Nuclide sym="H" a={1} z={1} />:</strong> Khối lượng nhỏ (<code>A = 1</code>), điện tích <code>+1e</code> nên bay vọt đi rất xa với mật độ giọt sương mảnh.
                  </li>
                  <li>
                    <strong>Nhánh đậm, ngắn (4) là hạt nhân oxygen-17 <Nuclide sym="O" a={17} z={8} />:</strong> Hạt nhân nặng (<code>A = 17</code>), điện tích lớn <code>+8e</code> nên ion hóa khí cực mạnh tạo vệt rất dày và dừng lại nhanh.
                  </li>
                </ul>

                <div
                  style={{
                    padding: "10px 12px",
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: "6px" }}>
                    Phương trình: <Nuclide sym="He" a={4} z={2} /> + <Nuclide sym="N" a={14} z={7} /> →{" "}
                    <Nuclide sym="O" a={17} z={8} /> + <Nuclide sym="H" a={1} z={1} /> — Kiểm tra bảo toàn hai vế:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
                    <label style={{ fontSize: "12.5px" }}>
                      A(O):{" "}
                      <input
                        type="number"
                        value={checkO17A}
                        onChange={(e) => setCheckO17A(e.target.value)}
                        style={{ width: "54px", padding: "3px 6px" }}
                      />
                    </label>
                    <label style={{ fontSize: "12.5px" }}>
                      Z(O):{" "}
                      <input
                        type="number"
                        value={checkO17Z}
                        onChange={(e) => setCheckO17Z(e.target.value)}
                        style={{ width: "54px", padding: "3px 6px" }}
                      />
                    </label>
                    <label style={{ fontSize: "12.5px" }}>
                      A(p):{" "}
                      <input
                        type="number"
                        value={checkP1A}
                        onChange={(e) => setCheckP1A(e.target.value)}
                        style={{ width: "54px", padding: "3px 6px" }}
                      />
                    </label>
                    <label style={{ fontSize: "12.5px" }}>
                      Z(p):{" "}
                      <input
                        type="number"
                        value={checkP1Z}
                        onChange={(e) => setCheckP1Z(e.target.value)}
                        style={{ width: "54px", padding: "3px 6px" }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setState((prev) => ({ ...prev, azVerified: standaloneAzOk }))
                      }
                      style={{
                        padding: "4px 10px",
                        borderRadius: "6px",
                        border: "1px solid #0284c7",
                        background: "#e0f2fe",
                        fontWeight: 700,
                        fontSize: "12.5px",
                        cursor: "pointer",
                      }}
                    >
                      Đối chiếu ∑A &amp; ∑Z
                    </button>
                  </div>
                  <div style={{ color: standaloneAzOk ? "#15803d" : "#b91c1c", fontWeight: 600 }}>
                    {standaloneAzOk || azVerified
                      ? `✓ Bảo toàn số nucleon A: ${conservation.reactants.alpha.a} + ${conservation.reactants.nitrogen.a} = ${conservation.products.oxygen17.a} + ${conservation.products.proton.a} = ${conservation.reactants.sumA} · Bảo toàn điện tích Z: ${conservation.reactants.alpha.z} + ${conservation.reactants.nitrogen.z} = ${conservation.products.oxygen17.z} + ${conservation.products.proton.z} = ${conservation.reactants.sumZ}.`
                      : "Kiểm tra lại: ¹⁷₈O có A = 17, Z = 8 và proton ¹₁H có A = 1, Z = 1."}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
