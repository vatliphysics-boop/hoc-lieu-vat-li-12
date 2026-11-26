"use client";

/**
 * RutherfordApparatusV3 — Thiết bị 3D & Bàn khảo sát thí nghiệm tán xạ hạt alpha (SGK Hình 21.2, tr. 91–92)
 *
 * Tính năng cốt lõi:
 * - Thiết bị 3D bám sát Hình 21.2a & 21.2b: Nguồn hạt α (R), Lá vàng mỏng (D), Màn huỳnh quang (S),
 *   Kính hiển vi xoay (M), Hộp chân không (G) và Chân đế (P)
 * - Góc nhìn: Toàn cảnh (xoay & zoom 360°), Cắt lớp (Hình 21.2a), Qua kính hiển vi M, Mặt cắt (Hình 21.2b)...
 * - Chỉ rõ Vị trí (1) (0°, đối diện R) và Vị trí (2) (> 90°, lệch ngược về phía R) ngay trên 3D & mặt cắt
 * - Khi hạt α đến màn S: phát đốm lóe huỳnh quang xanh lục trên màn S
 * - Chế độ “Mô hình giải thích”: gắn nhãn riêng cho Đường đi hạt α và Góc lệch θ
 * - Lưu độc lập Lượt 1 & Lượt 2 vào localStorage ("b21-rutherford-v3-state-v1"), khôi phục sau khi tải lại trang
 */

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  createRutherfordRun,
  generateRutherfordDistribution,
  rutherfordTrail,
  RUTHERFORD_LIMITS,
  type RutherfordSettings,
} from "../../physics/rutherford-engine";
import {
  buildExplanatoryModelLayer,
  buildRutherfordApparatus,
  buildScintillationLayer,
  DETECTOR_RADIUS_UNITS,
  engineFmToWorld,
  polarAngleToWorld,
  setMicroscopeAngle,
  type BuiltComponent,
} from "./geometry";
import {
  CORE_SGK_21_2_PARTS,
  CUTAWAY_HIDDEN_PARTS,
  describeObserverPosition,
  INITIAL_RUTHERFORD_V3_STATE,
  parseRutherfordV3State,
  resolveRutherfordRaycastPart,
  RUTHERFORD_COMPONENTS,
  sampleEqualTimeFlashCount,
} from "./parts";
import { evaluateRutherfordInquiry } from "./inquiry";
import {
  CAMERA_PRESETS,
  type CameraMode,
} from "../../core/CameraPresets";
import type { HistogramBin } from "../../core/types";
import {
  getRutherfordV3RawSnapshot,
  RutherfordInquiryTask,
  subscribeRutherfordV3Storage,
  writeRutherfordV3State,
  type InquiryRun,
  type LockedPhase1PredictionInfo,
} from "@/components/learning/RutherfordInquiryTask";

const EMPTY_RAW = () => "";

const PRIMARY_CAMERA_MODES: readonly CameraMode[] = [
  "orbit",
  "cutaway",
  "instrument",
  "top",
  "exploded",
];

/**
 * Camera positions in Three.js world space (horizontal scattering plane XZ, +Y up).
 * Looking from -Z toward +Z places Source R (-X) on the right and Position (1) (+X) on the left,
 * matching both Hình 21.2a and Hình 21.2b in SGK Vật lí 12 tr. 91!
 */
const CAMERA_POSITIONS: Record<
  CameraMode,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  orbit: { pos: [-2.4, 10.6, -22.8], target: [0, -1.15, 0] },
  cutaway: { pos: [-1.6, 9.6, -18.5], target: [0, -0.6, 0] },
  instrument: { pos: [11.8, 0.55, 0], target: [7.2, 0, 0] },
  top: { pos: [0, 23.5, -0.08], target: [0, 0, 0] },
  exploded: { pos: [-2.0, 12.5, -27.5], target: [0, -0.5, 0] },
  measurement: { pos: [3.2, 14.5, -15.5], target: [0, -0.4, 0] },
  front: { pos: [-16.5, 4.8, -4.5], target: [2.0, 0, 0] },
  back: { pos: [16.5, 4.8, -4.5], target: [-2.0, 0, 0] },
  left: { pos: [0, 3.8, -22.0], target: [0, -1.0, 0] },
  right: { pos: [0, 5.2, 22.0], target: [0, -0.8, 0] },
};

/** Exploded view offsets per component */
const EXPLODED_OFFSETS: Record<string, [number, number, number]> = {
  "alpha-source": [-3.6, 1.4, 0],
  "source-housing": [-4.8, -0.6, 0],
  collimator: [-1.8, 0.8, 0],
  "gold-foil": [0, 2.2, 0],
  "foil-holder": [0, -0.8, 0],
  "scintillation-screen": [0, 2.8, 0],
  "rotating-microscope": [2.8, 1.2, -2.0],
  "angular-scale": [0, -1.6, 0],
  "vacuum-chamber": [0, 6.2, 0],
  "chamber-window": [0, 4.8, 0],
  "base-platform": [0, -2.8, 0],
};

/** Tọa độ đốm sáng mẫu cố định trong thị trường kính hiển vi M */
const EYEPIECE_FLASH_SPOTS: readonly [number, number, number][] = [
  [0, 0, 4.2],
  [-14, -8, 3.4],
  [16, 10, 3.6],
  [-8, 18, 3.0],
  [12, -16, 3.2],
  [-24, 6, 2.8],
  [22, -4, 2.9],
  [4, 26, 2.7],
  [-18, -24, 2.6],
  [28, 18, 2.5],
  [-30, -10, 2.6],
  [8, -30, 2.5],
  [-6, -12, 3.3],
  [19, 24, 2.4],
  [-26, 24, 2.4],
  [34, -14, 2.3],
];

const OBSERVER_QUICK_PRESETS: readonly { readonly deg: number; readonly label: string }[] = [
  { deg: 0, label: "0° · Vị trí (1)" },
  { deg: 35, label: "35° · Góc lệch nhỏ" },
  { deg: 90, label: "90° · Vuông góc" },
  { deg: 140, label: "140° · Vị trí (2)" },
  { deg: 160, label: "160° · Vị trí (2)" },
];

function disposeGroup(group: THREE.Object3D) {
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
}

export interface RutherfordApparatusV3Props {
  readonly onProgress?: (done: boolean) => void;
  /** Dự đoán ban đầu đã khóa từ Pha 1 để đối chiếu ngay tại bảng so sánh hai lượt */
  readonly lockedPhase1Prediction?: LockedPhase1PredictionInfo | null;
  readonly onOpenPhase1?: () => void;
}

export function RutherfordApparatusV3({
  onProgress,
  lockedPhase1Prediction,
  onOpenPhase1,
}: RutherfordApparatusV3Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelElsRef = useRef<Record<string, HTMLDivElement | HTMLButtonElement | null>>({});
  const anchorsRef = useRef<{
    R: THREE.Vector3;
    D: THREE.Vector3;
    S: THREE.Vector3;
    M: THREE.Vector3;
    pos1: THREE.Vector3;
    pos2: THREE.Vector3;
    hitFlash: THREE.Vector3 | null;
    trajectory: THREE.Vector3 | null;
    angle: THREE.Vector3 | null;
  }>({
    R: new THREE.Vector3(-6.6, 1.35, 0),
    D: new THREE.Vector3(0, 1.85, 0),
    S: polarAngleToWorld(54, DETECTOR_RADIUS_UNITS, 1.05),
    M: polarAngleToWorld(0, 11.5, 0.9),
    pos1: polarAngleToWorld(-9, DETECTOR_RADIUS_UNITS, 2.05),
    pos2: polarAngleToWorld(140, DETECTOR_RADIUS_UNITS + 0.3, 1.35),
    hitFlash: null,
    trajectory: null,
    angle: null,
  });

  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    components: Map<string, BuiltComponent>;
    raycaster: THREE.Raycaster;
    trailGroup: THREE.Group | null;
    scintillationGroup: THREE.Group | null;
    selectionRing: THREE.Mesh | null;
    frameId: number;
  } | null>(null);

  const storedRaw = useSyncExternalStore(
    subscribeRutherfordV3Storage,
    getRutherfordV3RawSnapshot,
    EMPTY_RAW,
  );
  const persisted = useMemo(() => parseRutherfordV3State(storedRaw), [storedRaw]);

  const {
    cameraMode,
    selectedPartId,
    showScintillation,
    showBeam,
    observerAngleDeg,
    countPos1 = null,
    countPos2 = null,
    countTrialSeed = 1,
  } = persisted;

  const settings = useMemo<RutherfordSettings>(
    () => ({
      impactFm: persisted.impactFm,
      energyMeV: persisted.energyMeV,
    }),
    [persisted.impactFm, persisted.energyMeV],
  );

  const [isRunning, setIsRunning] = useState(false);
  // Mặc định lúc mới mở hiển thị trọn tia mẫu đã tới màn S; khi học sinh kéo thanh trượt mới đặt về 0 để bấm Chạy
  const [elapsedZs, setElapsedZs] = useState<number | "completed">("completed");
  const elapsedZsRef = useRef<number | "completed">("completed");
  useEffect(() => {
    elapsedZsRef.current = elapsedZs;
  }, [elapsedZs]);
  const [showMoreCameras, setShowMoreCameras] = useState(false);
  const [show3DPins, setShow3DPins] = useState(true);
  const [eyepiecePaused, setEyepiecePaused] = useState(false);
  const [flashBeat, setFlashBeat] = useState(0);
  const [histogram] = useState<HistogramBin[]>(() =>
    generateRutherfordDistribution(1000, 10, 42),
  );

  useEffect(() => {
    if (!showScintillation || eyepiecePaused) return;
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(() => {
      setFlashBeat((b) => (b + 1) % 24);
    }, 680);
    return () => window.clearInterval(id);
  }, [showScintillation, eyepiecePaused]);

  const run = useMemo(() => {
    try {
      return createRutherfordRun(settings);
    } catch {
      return null;
    }
  }, [settings]);

  const effectiveElapsedZs = useMemo(() => {
    if (!run) return 0;
    if (elapsedZs === "completed") return run.durationZs;
    return Math.min(elapsedZs, run.durationZs);
  }, [elapsedZs, run]);

  const hasReachedScreen = useMemo(() => {
    if (!run) return false;
    return elapsedZs === "completed" || effectiveElapsedZs >= run.durationZs * 0.96;
  }, [run, elapsedZs, effectiveElapsedZs]);

  const trail = useMemo(() => {
    if (!run) return null;
    return rutherfordTrail(run, run.durationZs, 96);
  }, [run]);

  const selectedComponent = useMemo(() => {
    if (!selectedPartId) return null;
    return RUTHERFORD_COMPONENTS.find((c) => c.id === selectedPartId) ?? null;
  }, [selectedPartId]);

  const activeCorePartId = useMemo(() => {
    if (!selectedPartId) return null;
    if (selectedPartId === "source-housing" || selectedPartId === "collimator") return "alpha-source";
    if (selectedPartId === "foil-holder") return "gold-foil";
    if (selectedPartId === "chamber-window") return "vacuum-chamber";
    if (selectedPartId === "angular-scale") return "rotating-microscope";
    return selectedPartId;
  }, [selectedPartId]);

  const observerSummary = useMemo(
    () => describeObserverPosition(observerAngleDeg),
    [observerAngleDeg],
  );

  const currentInquiryRun = useMemo<InquiryRun | null>(
    () =>
      run
        ? { b: settings.impactFm, e: settings.energyMeV, theta: run.scatteringAngleDeg }
        : null,
    [run, settings],
  );

  const inquiryEvaluation = useMemo(
    () =>
      evaluateRutherfordInquiry({
        prediction: persisted.prediction,
        run1: persisted.run1,
        run2: persisted.run2,
        lastCapturedSlot: persisted.lastCapturedSlot,
        conclusion: persisted.conclusion,
      }),
    [
      persisted.prediction,
      persisted.run1,
      persisted.run2,
      persisted.lastCapturedSlot,
      persisted.conclusion,
    ],
  );

  // Bảo vệ tiến độ khi chuyển tab/pha hoặc F5 tải lại trang
  const hadCompleteRef = useRef(inquiryEvaluation.isComplete);
  useEffect(() => {
    if (inquiryEvaluation.isComplete || hadCompleteRef.current) {
      onProgress?.(inquiryEvaluation.isComplete);
    }
    hadCompleteRef.current = inquiryEvaluation.isComplete;
  }, [inquiryEvaluation.isComplete, onProgress]);

  // Initialize Three.js scene & 2D projection loop for 3D labels
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initW = Math.max(container.clientWidth, 1);
    const initH = Math.max(container.clientHeight, 1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(initW, initH);
    renderer.setClearColor(0x080f1e, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x080f1e, 38, 78);

    // Rich scientific studio lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.68));

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.35);
    keyLight.position.set(-8, 18, -14);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.58);
    fillLight.position.set(14, 10, 12);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfde68a, 0.42);
    rimLight.position.set(0, -8, -15);
    scene.add(rimLight);

    const camera = new THREE.PerspectiveCamera(42, initW / initH, 0.1, 200);
    const preset = CAMERA_POSITIONS.orbit;
    camera.position.set(...preset.pos);
    camera.lookAt(...preset.target);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 5.5;
    controls.maxDistance = 46;
    controls.target.set(...preset.target);

    // Lab bench grid beneath pedestal P
    const grid = new THREE.GridHelper(54, 27, 0x233554, 0x132038);
    grid.position.y = -5.95;
    scene.add(grid);

    const components = buildRutherfordApparatus(RUTHERFORD_COMPONENTS);
    for (const [, built] of components) {
      scene.add(built.mesh);
    }

    const raycaster = new THREE.Raycaster();
    const projected = new THREE.Vector3();

    sceneRef.current = {
      renderer,
      scene,
      camera,
      controls,
      components,
      raycaster,
      trailGroup: null,
      scintillationGroup: null,
      selectionRing: null,
      frameId: 0,
    };

    function updateProjectedLabel(key: string, worldPos: THREE.Vector3 | null, w: number, h: number) {
      const el = labelElsRef.current[key];
      if (!el) return;
      if (!worldPos) {
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        return;
      }
      projected.copy(worldPos).project(camera);
      // Hide if behind camera or outside viewport bounds
      if (
        projected.z > 1 ||
        projected.x < -0.96 ||
        projected.x > 0.96 ||
        projected.y < -0.94 ||
        projected.y > 0.92
      ) {
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        return;
      }
      const px = (projected.x * 0.5 + 0.5) * w;
      const py = (-projected.y * 0.5 + 0.5) * h;
      const nextTransform = `translate(-50%, -50%) translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
      const nextPE = el.tagName === "BUTTON" ? "auto" : "none";
      if (el.style.opacity !== "1") el.style.opacity = "1";
      if (el.style.pointerEvents !== nextPE) el.style.pointerEvents = nextPE;
      if (el.style.transform !== nextTransform) el.style.transform = nextTransform;
    }

    let lastRender = 0;
    function animate(now = 0) {
      if (!sceneRef.current || !container) return;
      sceneRef.current.frameId = requestAnimationFrame(animate);
      if (now - lastRender < 33) return;
      lastRender = now;
      sceneRef.current.controls.update();
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);

      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        const a = anchorsRef.current;
        updateProjectedLabel("R", a.R, w, h);
        updateProjectedLabel("D", a.D, w, h);
        updateProjectedLabel("S", a.S, w, h);
        updateProjectedLabel("M", a.M, w, h);
        updateProjectedLabel("pos1", a.pos1, w, h);
        updateProjectedLabel("pos2", a.pos2, w, h);
        updateProjectedLabel("hitFlash", a.hitFlash, w, h);
        updateProjectedLabel("trajectory", a.trajectory, w, h);
        updateProjectedLabel("angle", a.angle, w, h);
      }
    }
    animate();

    function onResize() {
      if (!container || !sceneRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
    }
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    // Distinguish orbit drag from genuine tap/click
    let pointerDownPos: { x: number; y: number } | null = null;
    function onPointerDown(e: PointerEvent) {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    }

    function onClick(event: MouseEvent) {
      if (!container || !sceneRef.current) return;
      if (pointerDownPos) {
        const dist = Math.hypot(event.clientX - pointerDownPos.x, event.clientY - pointerDownPos.y);
        if (dist > 6) return;
      }
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      sceneRef.current.raycaster.setFromCamera(mouse, sceneRef.current.camera);

      const visibleRoots: THREE.Object3D[] = [];
      for (const [, built] of sceneRef.current.components) {
        if (built.mesh.visible) {
          visibleRoots.push(built.mesh);
        }
      }

      const hits = sceneRef.current.raycaster.intersectObjects(visibleRoots, true);
      const hitPartIds: string[] = [];

      for (const hit of hits) {
        if (!hit.object.visible) continue;
        let obj: THREE.Object3D | null = hit.object;
        let hiddenAncestor = false;
        let matchedId: string | null = null;

        while (obj) {
          if (!obj.visible) {
            hiddenAncestor = true;
            break;
          }
          if (!matchedId) {
            for (const [id, built] of sceneRef.current.components) {
              if (built.mesh === obj) {
                matchedId = id;
                break;
              }
            }
          }
          obj = obj.parent;
        }

        if (!hiddenAncestor && matchedId && !hitPartIds.includes(matchedId)) {
          hitPartIds.push(matchedId);
        }
      }

      const chosenId = resolveRutherfordRaycastPart(hitPartIds);
      writeRutherfordV3State((prev) => ({
        ...prev,
        selectedPartId: chosenId,
      }));
    }
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("click", onClick);

    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.frameId);
        sceneRef.current.renderer.dispose();
        disposeGroup(sceneRef.current.scene);
      }
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("click", onClick);
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, []);

  // Update camera preset & follow observerAngleDeg in Microscope POV ("instrument")
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    if (cameraMode === "instrument") {
      const eyeWorld = polarAngleToWorld(observerAngleDeg, 12.2, 0.72);
      const screenTarget = polarAngleToWorld(observerAngleDeg, DETECTOR_RADIUS_UNITS - 0.2, 0);
      state.controls.target.copy(screenTarget);
      state.camera.position.copy(eyeWorld);
      state.controls.saveState();
      state.controls.reset();
      state.camera.lookAt(screenTarget);
      return;
    }
    const preset = CAMERA_POSITIONS[cameraMode];
    state.controls.target.set(...preset.target);
    state.camera.position.set(...preset.pos);
    state.controls.saveState();
    state.controls.reset();
    state.camera.lookAt(...preset.target);
  }, [cameraMode, observerAngleDeg]);

  // Update exploded positions & rotating microscope M angle + 3D label anchors
  useEffect(() => {
    const state = sceneRef.current;
    const isExploded = cameraMode === "exploded";

    anchorsRef.current.M = polarAngleToWorld(
      observerAngleDeg,
      11.55,
      0.85 + (isExploded ? EXPLODED_OFFSETS["rotating-microscope"][1] : 0),
    );
    anchorsRef.current.R = new THREE.Vector3(
      -6.6 + (isExploded ? EXPLODED_OFFSETS["alpha-source"][0] : 0),
      1.35 + (isExploded ? EXPLODED_OFFSETS["alpha-source"][1] : 0),
      0,
    );
    anchorsRef.current.D = new THREE.Vector3(
      0,
      1.85 + (isExploded ? EXPLODED_OFFSETS["gold-foil"][1] : 0),
      0,
    );
    anchorsRef.current.S = polarAngleToWorld(
      54,
      DETECTOR_RADIUS_UNITS,
      1.05 + (isExploded ? EXPLODED_OFFSETS["scintillation-screen"][1] : 0),
    );

    if (!state) return;
    for (const [id, built] of state.components) {
      if (id === "rotating-microscope") {
        const offset = isExploded ? EXPLODED_OFFSETS[id] : undefined;
        setMicroscopeAngle(built, observerAngleDeg, offset);
        continue;
      }
      const base = built.originalPosition;
      if (isExploded) {
        const offset = EXPLODED_OFFSETS[id] ?? [0, 0, 0];
        built.mesh.position.set(
          base.x + offset[0],
          base.y + offset[1],
          base.z + offset[2],
        );
      } else {
        built.mesh.position.copy(base);
      }
    }
  }, [cameraMode, observerAngleDeg]);

  // Update cutaway visibility (hides vacuum-chamber, chamber-window)
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    for (const [id, built] of state.components) {
      const shouldHide =
        cameraMode === "cutaway" && CUTAWAY_HIDDEN_PARTS.includes(id);
      built.mesh.traverse((obj) => {
        obj.visible = !shouldHide;
      });
    }
  }, [cameraMode]);

  // Highlight selected 3D part with an indicator ring
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;

    if (state.selectionRing) {
      state.scene.remove(state.selectionRing);
      state.selectionRing.geometry.dispose();
      (state.selectionRing.material as THREE.Material).dispose();
      state.selectionRing = null;
    }

    if (!selectedPartId) return;
    const targetBuilt = state.components.get(selectedPartId);
    if (!targetBuilt || !targetBuilt.mesh.visible) return;

    const ringRadius =
      selectedPartId === "scintillation-screen" || selectedPartId === "angular-scale"
        ? 7.65
        : selectedPartId === "vacuum-chamber" || selectedPartId === "chamber-window"
          ? 9.25
          : selectedPartId === "base-platform"
            ? 5.2
            : selectedPartId === "gold-foil" || selectedPartId === "foil-holder"
              ? 1.65
              : 1.55;

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(ringRadius, 0.085, 12, 64),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
    );

    if (selectedPartId === "rotating-microscope") {
      const mFocus = polarAngleToWorld(observerAngleDeg, 9.4, 0);
      ring.position.copy(mFocus);
      ring.rotation.x = Math.PI / 2;
    } else {
      ring.position.copy(targetBuilt.mesh.position);
      if (selectedPartId === "base-platform") {
        ring.position.y = -4.2;
      }
      ring.rotation.x = Math.PI / 2;
    }

    state.scene.add(ring);
    state.selectionRing = ring;
  }, [selectedPartId, cameraMode, observerAngleDeg]);

  // Layer 1: Experimental ZnS scintillation flashes on screen S
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;

    if (state.scintillationGroup) {
      state.scene.remove(state.scintillationGroup);
      disposeGroup(state.scintillationGroup);
      state.scintillationGroup = null;
    }

    if (!showScintillation) {
      anchorsRef.current.hitFlash = null;
      return;
    }

    const hitVec = run ? engineFmToWorld(run.hit.xFm, run.hit.yFm) : null;
    anchorsRef.current.hitFlash =
      hitVec && hasReachedScreen
        ? hitVec.clone().add(new THREE.Vector3(0, 0.92, 0))
        : null;

    const group = buildScintillationLayer(hitVec, hasReachedScreen);
    state.scene.add(group);
    state.scintillationGroup = group;
  }, [showScintillation, run, hasReachedScreen]);

  // Layer 2: "Mô hình giải thích" (trajectory curve + 3D angle arc + dedicated label anchors)
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;

    if (state.trailGroup) {
      state.scene.remove(state.trailGroup);
      disposeGroup(state.trailGroup);
      state.trailGroup = null;
    }

    if (!showBeam || !trail || !run) {
      anchorsRef.current.trajectory = null;
      anchorsRef.current.angle = null;
      return;
    }

    const ratio =
      elapsedZs === "completed"
        ? 1
        : run.durationZs > 0
          ? Math.min(1, effectiveElapsedZs / run.durationZs)
          : 1;
    const visibleCount = Math.max(2, Math.floor(ratio * trail.length));

    const points3D = trail
      .slice(0, visibleCount)
      .map((s) => engineFmToWorld(s.xFm, s.yFm));

    const builtModel = buildExplanatoryModelLayer(
      points3D,
      settings.impactFm,
      run.scatteringAngleDeg,
      run.detectorAngleDeg,
    );

    anchorsRef.current.trajectory = builtModel.trajectoryLabelAnchor;
    anchorsRef.current.angle = builtModel.angleLabelAnchor;

    state.scene.add(builtModel.group);
    state.trailGroup = builtModel.group;
  }, [trail, run, elapsedZs, effectiveElapsedZs, showBeam, settings.impactFm]);

  // Flight animation timer (~0.95s wall-clock flight from source R through foil D to screen S)
  useEffect(() => {
    if (!isRunning || !run) return;
    const startTime = performance.now();
    const rawStart = elapsedZsRef.current;
    const startZs =
      rawStart === "completed" || rawStart >= run.durationZs ? 0 : rawStart;
    const flightDurationMs = 950;
    const remainingFraction = Math.max(0.05, 1 - startZs / run.durationZs);
    const totalMs = flightDurationMs * remainingFraction;
    let frameId = 0;

    function tick(now: number) {
      const progress = Math.min(1, Math.max(0, (now - startTime) / totalMs));
      if (progress >= 1) {
        setElapsedZs("completed");
        setIsRunning(false);
        return;
      }
      setElapsedZs(startZs + progress * (run!.durationZs - startZs));
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isRunning, run]);

  function handleRunPause() {
    if (!run) return;
    if (isRunning) {
      setIsRunning(false);
      return;
    }
    if (elapsedZs === "completed" || effectiveElapsedZs >= run.durationZs) {
      elapsedZsRef.current = 0;
      setElapsedZs(0);
      setIsRunning(true);
    } else {
      setIsRunning(true);
    }
  }

  function handleReset() {
    setElapsedZs("completed");
    setIsRunning(false);
    if (sceneRef.current) {
      const preset = CAMERA_POSITIONS[INITIAL_RUTHERFORD_V3_STATE.cameraMode];
      sceneRef.current.controls.target.set(...preset.target);
      sceneRef.current.camera.position.set(...preset.pos);
      sceneRef.current.controls.saveState();
      sceneRef.current.controls.reset();
      sceneRef.current.camera.lookAt(...preset.target);
    }
    writeRutherfordV3State((prev) => ({
      ...prev,
      impactFm: INITIAL_RUTHERFORD_V3_STATE.impactFm,
      energyMeV: INITIAL_RUTHERFORD_V3_STATE.energyMeV,
      cameraMode: INITIAL_RUTHERFORD_V3_STATE.cameraMode,
      selectedPartId: null,
      showScintillation: true,
      showBeam: true,
      observerAngleDeg: 0,
    }));
  }

  const format = (n: number, digits = 1) => n.toFixed(digits);

  const primaryPresets = CAMERA_PRESETS.filter((p) => PRIMARY_CAMERA_MODES.includes(p.mode));
  const secondaryPresets = CAMERA_PRESETS.filter((p) => !PRIMARY_CAMERA_MODES.includes(p.mode));

  // Cross-section SVG coordinates matching Hình 21.2b EXACTLY:
  // Center D at (130, 112), Screen radius = 72 px.
  // Source R on RIGHT (x > 130) shooting LEFT toward Position (1) (0° at x = 130 - 72 = 58)!
  // Position (2) (> 90°) on LOWER-RIGHT!
  const svgCx = 130;
  const svgCy = 112;
  const svgR = 72;
  const obsRad = (observerAngleDeg * Math.PI) / 180;
  // Angle 0° -> left (-cos, +sin downward so 90° is bottom, 140° is lower-right!)
  const obsScreenX = Number((svgCx - svgR * Math.cos(obsRad)).toFixed(2));
  const obsScreenY = Number((svgCy + svgR * Math.sin(obsRad)).toFixed(2));
  const obsEyeX = Number((svgCx - (svgR + 23) * Math.cos(obsRad)).toFixed(2));
  const obsEyeY = Number((svgCy + (svgR + 23) * Math.sin(obsRad)).toFixed(2));

  const hitDeg = run ? Math.abs(run.detectorAngleDeg) : 0;
  const hitRad = (hitDeg * Math.PI) / 180;
  const hitSvgX = Number((svgCx - svgR * Math.cos(hitRad)).toFixed(2));
  const hitSvgY = Number((svgCy + svgR * Math.sin(hitRad)).toFixed(2));

  const isHitInsideMicroscopeWindow =
    run !== null &&
    hasReachedScreen &&
    Math.abs(Math.abs(run.detectorAngleDeg) - observerAngleDeg) <= 12;

  return (
    <div style={{ display: "grid", gap: "16px", minWidth: 0 }}>
      {/* 1. Nhận diện 4 bộ phận cốt lõi R–D–S–M (và G, P) đối chiếu Hình 21.2 SGK tr. 91 */}
      <section
        aria-label="Nhận diện 4 bộ phận R, D, S, M theo Hình 21.2 SGK"
        style={{
          padding: "14px",
          background: "var(--bg-surface-elevated, #f8fafc)",
          border: "1px solid var(--border-light, #cbd5e1)",
          borderRadius: "10px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "8px",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
            Cấu tạo bộ thí nghiệm Hình 21.2 (R – D – S – M) · Chạm từng bộ phận hoặc nhấp trên mô hình 3D để đọc công dụng:
          </div>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              color: "#334155",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={show3DPins}
              onChange={(e) => setShow3DPins(e.target.checked)}
            />
            Hiện nhãn R–D–S–M &amp; (1), (2) trên 3D
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(152px, 1fr))",
            gap: "8px",
          }}
        >
          {CORE_SGK_21_2_PARTS.map((item) => {
            const isSelected = activeCorePartId === item.partId;
            return (
              <button
                key={item.partId}
                type="button"
                aria-pressed={isSelected}
                data-core-part-btn={item.partId}
                onClick={() =>
                  writeRutherfordV3State((prev) => ({
                    ...prev,
                    selectedPartId:
                      prev.selectedPartId === item.partId ? null : item.partId,
                  }))
                }
                style={{
                  minHeight: "46px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: isSelected
                    ? "2px solid #0f62fe"
                    : item.isPrimaryRDSM
                      ? "1.5px solid #64748b"
                      : "1px solid #cbd5e1",
                  background: isSelected
                    ? "#edf5ff"
                    : item.isPrimaryRDSM
                      ? "#ffffff"
                      : "#f8fafc",
                  color: isSelected ? "#002d9c" : "#0f172a",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  touchAction: "manipulation",
                  textAlign: "left",
                }}
              >
                <span>{item.buttonLabel}</span>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 500,
                    color: isSelected ? "#0f62fe" : "#475569",
                    marginTop: "2px",
                  }}
                >
                  {item.questionCue}
                </span>
              </button>
            );
          })}
        </div>

        {/* Thẻ công dụng chi tiết hiển thị ngay trên web khi học sinh chọn bộ phận */}
        {selectedComponent ? (
          <div
            role="status"
            data-selected-part-card={selectedComponent.id}
            style={{
              marginTop: "10px",
              padding: "12px 14px",
              background: "#eff6ff",
              border: "1.5px solid #3b82f6",
              borderRadius: "8px",
              fontSize: "13.5px",
              lineHeight: 1.55,
              color: "#0f172a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            <div>
              <strong style={{ color: "#1d4ed8", fontSize: "14px" }}>
                Đang chọn: {selectedComponent.nameVi}
              </strong>{" "}
              <span style={{ fontSize: "12px", color: "#475569", fontStyle: "italic" }}>
                ({selectedComponent.nameEn})
              </span>
              <div style={{ marginTop: "4px" }}>{selectedComponent.role}</div>
            </div>
            <button
              type="button"
              onClick={() =>
                writeRutherfordV3State((prev) => ({
                  ...prev,
                  selectedPartId: null,
                }))
              }
              style={{
                padding: "5px 10px",
                fontSize: "12px",
                borderRadius: "6px",
                border: "1px solid #93c5fd",
                background: "#ffffff",
                color: "#1e3a8a",
                cursor: "pointer",
                flexShrink: 0,
                minHeight: "32px",
              }}
            >
              Bỏ chọn
            </button>
          </div>
        ) : (
          <div
            style={{
              marginTop: "10px",
              padding: "9px 12px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "12.5px",
              lineHeight: 1.55,
              color: "#334155",
            }}
          >
            <strong>4 bộ phận chính (Hình 21.2 SGK tr. 91):</strong>{" "}
            <strong>R</strong> (nguồn phát chùm hạt α mang điện dương) →{" "}
            <strong>D</strong> (lá vàng rất mỏng ~4·10⁻⁷ m đặt trong hộp chân không <strong>G</strong> trên chân đế <strong>P</strong>) →{" "}
            <strong>S</strong> (màn phủ chất huỳnh quang phát đốm sáng khi hạt α đập vào) →{" "}
            <strong>M</strong> (kính hiển vi di chuyển từ vị trí <strong>(1)</strong> đến vị trí <strong>(2)</strong> để quan sát đốm sáng).
          </div>
        )}
      </section>

      {/* 2. Khung mô hình 3D Rutherford (Toàn cảnh, Cắt lớp, Qua kính hiển vi, Mặt cắt 21.2b) */}
      <div
        style={{
          position: "relative",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid #334155",
          background: "#080f1e",
        }}
      >
        <div
          ref={containerRef}
          style={{ width: "100%", height: "490px", display: "block", touchAction: "none" }}
          data-rutherford-canvas
        />

        {/* Lớp nhãn 3D chiếu trực tiếp lên tọa độ linh kiện, vị trí (1)-(2), đốm lóe & Mô hình giải thích */}
        <div
          aria-hidden={!show3DPins && !showBeam}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          {/* 4 nhãn R, D, S, M bám theo vật thể 3D */}
          {(
            [
              { key: "R", partId: "alpha-source", text: "R · Nguồn hạt α", accent: "#fbbf24" },
              { key: "D", partId: "gold-foil", text: "D · Lá vàng", accent: "#fde047" },
              { key: "S", partId: "scintillation-screen", text: "S · Màn huỳnh quang", accent: "#4ade80" },
              { key: "M", partId: "rotating-microscope", text: `M · Kính (${observerAngleDeg}°)`, accent: "#38bdf8" },
            ] as const
          ).map((pin) => {
            const selected = activeCorePartId === pin.partId;
            return (
              <button
                key={pin.key}
                ref={(el) => {
                  labelElsRef.current[pin.key] = el;
                }}
                type="button"
                data-3d-pin={pin.key}
                onClick={() =>
                  writeRutherfordV3State((prev) => ({
                    ...prev,
                    selectedPartId:
                      prev.selectedPartId === pin.partId ? null : pin.partId,
                  }))
                }
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  display: show3DPins ? "inline-flex" : "none",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "999px",
                  border: selected ? "2px solid #22d3ee" : `1px solid ${pin.accent}`,
                  background: selected ? "rgba(8, 47, 73, 0.94)" : "rgba(15, 23, 42, 0.86)",
                  color: "#f8fafc",
                  fontSize: "11.5px",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
                  opacity: 0,
                }}
              >
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: pin.accent,
                  }}
                />
                {pin.text}
              </button>
            );
          })}

          {/* Nhãn Vị trí (1) và Vị trí (2) chuẩn Hình 21.2b */}
          <div
            ref={(el) => {
              labelElsRef.current.pos1 = el;
            }}
            data-3d-pos-marker="1"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              display: show3DPins ? "block" : "none",
              padding: "2px 7px",
              borderRadius: "4px",
              background: "rgba(20, 83, 45, 0.9)",
              border: "1px solid #4ade80",
              color: "#bbf7d0",
              fontSize: "11px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              opacity: 0,
            }}
          >
            Vị trí (1) · 0°
          </div>

          <div
            ref={(el) => {
              labelElsRef.current.pos2 = el;
            }}
            data-3d-pos-marker="2"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              display: show3DPins ? "block" : "none",
              padding: "2px 7px",
              borderRadius: "4px",
              background: "rgba(136, 19, 55, 0.9)",
              border: "1px solid #fb7185",
              color: "#fecdd3",
              fontSize: "11px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              opacity: 0,
            }}
          >
            Vị trí (2) · &gt; 90°
          </div>

          {/* Nhãn Đốm lóe trên màn S khi hạt α chạm màn */}
          <div
            ref={(el) => {
              labelElsRef.current.hitFlash = el;
            }}
            data-scintillation-flash-label={showScintillation && hasReachedScreen ? "visible" : "hidden"}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              display: showScintillation && hasReachedScreen ? "block" : "none",
              padding: "3px 8px",
              borderRadius: "4px",
              background: "rgba(5, 46, 22, 0.92)",
              border: "1.5px solid #4ade80",
              color: "#86efac",
              fontSize: "11.5px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              boxShadow: "0 0 12px rgba(74, 222, 128, 0.45)",
              opacity: 0,
            }}
          >
            ✦ Đốm lóe trên màn S
          </div>

          {/* HAI NHÃN RIÊNG TRONG CHẾ ĐỘ “MÔ HÌNH GIẢI THÍCH” (đường đi & góc lệch θ) */}
          <div
            ref={(el) => {
              labelElsRef.current.trajectory = el;
            }}
            data-explanatory-label="trajectory"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              display: showBeam ? "block" : "none",
              padding: "3px 8px",
              borderRadius: "4px",
              background: "rgba(12, 74, 110, 0.92)",
              border: "1px solid #38bdf8",
              color: "#e0f2fe",
              fontSize: "11.5px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              opacity: 0,
            }}
          >
            Đường đi hạt α (mô hình)
          </div>

          <div
            ref={(el) => {
              labelElsRef.current.angle = el;
            }}
            data-explanatory-label="angle"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              display: showBeam && run ? "block" : "none",
              padding: "3px 8px",
              borderRadius: "4px",
              background: "rgba(120, 53, 15, 0.92)",
              border: "1px solid #fbbf24",
              color: "#fef08a",
              fontSize: "11.5px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              opacity: 0,
            }}
          >
            {run ? `Góc lệch θ = ${format(run.scatteringAngleDeg)}°` : "Góc lệch θ"}
          </div>
        </div>

        {/* Thanh chọn góc nhìn camera trên khung 3D */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            right: "10px",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {primaryPresets.map((preset) => (
            <button
              key={preset.mode}
              type="button"
              data-camera-preset={preset.mode}
              onClick={() =>
                writeRutherfordV3State((prev) => ({
                  ...prev,
                  cameraMode: preset.mode,
                }))
              }
              title={preset.description}
              style={{
                padding: "6px 10px",
                fontSize: "12px",
                fontWeight: 600,
                borderRadius: "6px",
                border: "1px solid",
                borderColor:
                  cameraMode === preset.mode ? "#22d3ee" : "rgba(255,255,255,0.28)",
                background:
                  cameraMode === preset.mode
                    ? "rgba(8, 145, 178, 0.42)"
                    : "rgba(10, 15, 28, 0.82)",
                color: cameraMode === preset.mode ? "#a5f3fc" : "#f1f5f9",
                cursor: "pointer",
                minHeight: "34px",
                touchAction: "manipulation",
              }}
            >
              {preset.nameVi}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setShowMoreCameras((v) => !v)}
            aria-expanded={showMoreCameras}
            style={{
              padding: "6px 10px",
              fontSize: "12px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.25)",
              background: "rgba(15, 23, 42, 0.78)",
              color: "#cbd5e1",
              cursor: "pointer",
              minHeight: "34px",
            }}
          >
            {showMoreCameras ? "Thu gọn góc phụ" : "+ Góc nhìn khác"}
          </button>

          {showMoreCameras &&
            secondaryPresets.map((preset) => (
              <button
                key={preset.mode}
                type="button"
                data-camera-preset={preset.mode}
                onClick={() =>
                  writeRutherfordV3State((prev) => ({
                    ...prev,
                    cameraMode: preset.mode,
                  }))
                }
                title={preset.description}
                style={{
                  padding: "5px 9px",
                  fontSize: "11.5px",
                  borderRadius: "6px",
                  border: "1px solid",
                  borderColor:
                    cameraMode === preset.mode ? "#22d3ee" : "rgba(255,255,255,0.2)",
                  background:
                    cameraMode === preset.mode
                      ? "rgba(8, 145, 178, 0.42)"
                      : "rgba(10, 15, 28, 0.78)",
                  color: cameraMode === preset.mode ? "#a5f3fc" : "#e2e8f0",
                  cursor: "pointer",
                  minHeight: "32px",
                }}
              >
                {preset.nameVi}
              </button>
            ))}
        </div>

        {/* HUD Thị kính hiển vi M khi học sinh chọn góc nhìn “Qua kính hiển vi” */}
        {cameraMode === "instrument" && (
          <div
            role="region"
            aria-label="Góc nhìn qua thị kính hiển vi M"
            data-microscope-pov-hud
            style={{
              position: "absolute",
              top: "54px",
              right: "12px",
              width: "min(250px, calc(100% - 24px))",
              padding: "10px 12px",
              background: "rgba(4, 15, 12, 0.92)",
              border: "1.5px solid #4ade80",
              borderRadius: "10px",
              color: "#ecfdf5",
              fontSize: "12px",
              lineHeight: 1.45,
            }}
          >
            <div style={{ fontWeight: 700, color: "#86efac", marginBottom: "4px" }}>
              🔬 Đang nhìn qua kính hiển vi M ({observerAngleDeg}°)
            </div>
            <div style={{ fontWeight: 600, color: "#fde047", marginBottom: "4px" }}>
              {observerSummary.shortBadge}
            </div>
            <div style={{ color: "#cbd5e1" }}>
              {isHitInsideMicroscopeWindow
                ? "✦ Hạt α đang xét vừa đập vào vùng màn S trong thị trường kính M!"
                : observerSummary.relativeFrequencyLabel}
            </div>
          </div>
        )}

        {/* Thanh chỉ dẫn thao tác xoay / zoom / chọn linh kiện ở đáy khung 3D */}
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "10px",
            right: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              padding: "5px 10px",
              borderRadius: "6px",
              background: "rgba(10, 15, 28, 0.85)",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              color: "#e2e8f0",
              fontSize: "12px",
            }}
          >
            Kính M đang đặt tại: <strong style={{ color: "#86efac" }}>{observerSummary.shortBadge}</strong>
          </span>
          <span
            style={{
              padding: "5px 10px",
              borderRadius: "6px",
              background: "rgba(10, 15, 28, 0.82)",
              color: "#cbd5e1",
              fontSize: "11.5px",
            }}
          >
            Kéo để xoay 360° · Cuộn/chụm 2 ngón để zoom · Chạm linh kiện để đọc công dụng
          </span>
        </div>
      </div>

      {/* 3. Thanh điều khiển Chạy bắn hạt α + Chế độ Quan sát thực nghiệm vs “Mô hình giải thích” */}
      <div
        style={{
          display: "grid",
          gap: "12px",
          padding: "14px",
          background: "var(--bg-surface-elevated, #f8fafc)",
          border: "1px solid var(--border-light, #cbd5e1)",
          borderRadius: "10px",
        }}
      >
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            data-run-alpha-btn
            onClick={handleRunPause}
            disabled={!run}
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 700,
              borderRadius: "8px",
              border: "none",
              background: "#1d4ed8",
              color: "#ffffff",
              cursor: run ? "pointer" : "not-allowed",
              minHeight: "44px",
            }}
          >
            {isRunning
              ? "Tạm dừng"
              : elapsedZs !== "completed" && effectiveElapsedZs > 0 && run && effectiveElapsedZs < run.durationZs
                ? "Tiếp tục đường bay"
                : "Chạy bắn hạt α"}
          </button>

          <button
            type="button"
            data-reset-rutherford-btn
            onClick={handleReset}
            style={{
              padding: "10px 16px",
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1px solid #94a3b8",
              background: "#ffffff",
              color: "#0f172a",
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            Đặt lại thiết bị &amp; góc nhìn
          </button>

          <span
            role="status"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: hasReachedScreen ? "#15803d" : "#0369a1",
            }}
          >
            {isRunning
              ? "Đang bắn hạt α từ nguồn R qua lá vàng D tới màn S..."
              : hasReachedScreen && run
                ? `✦ Hạt α đã đến màn S: lóe đốm sáng tại góc lệch θ = ${format(run.scatteringAngleDeg)}°`
                : "Đã đổi thông số — bấm “Chạy bắn hạt α” để quan sát hạt chạm màn S"}
          </span>
        </div>

        {/* Hai chế độ hiển thị độc lập: Đốm lóe thực nghiệm trên màn S & Chế độ “Mô hình giải thích” */}
        <div
          role="group"
          aria-label="Chế độ hiển thị thực nghiệm và Mô hình giải thích"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "10px",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: showScintillation ? "1.5px solid #16a34a" : "1px solid #cbd5e1",
              background: showScintillation ? "#f0fdf4" : "#ffffff",
              cursor: "pointer",
              fontSize: "13.5px",
              lineHeight: 1.45,
            }}
          >
            <input
              type="checkbox"
              data-toggle-scintillation
              checked={showScintillation}
              onChange={(e) => {
                const checked = e.target.checked;
                writeRutherfordV3State((prev) => ({
                  ...prev,
                  showScintillation: checked,
                }));
              }}
              style={{ marginTop: "3px" }}
            />
            <span>
              <strong style={{ display: "block", color: "#14532d" }}>
                Lớp 1: Đốm sáng trên màn ZnS (S) — Quan sát thực nghiệm
              </strong>
              <span style={{ fontSize: "12px", color: "#475569" }}>
                Thể hiện đốm lóe xanh lục khi hạt α đến màn S cùng phân bố thực nghiệm tại vị trí (1) và (2).
              </span>
            </span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              padding: "10px 12px",
              borderRadius: "8px",
              border: showBeam ? "1.5px solid #0284c7" : "1px solid #cbd5e1",
              background: showBeam ? "#f0f9ff" : "#ffffff",
              cursor: "pointer",
              fontSize: "13.5px",
              lineHeight: 1.45,
            }}
          >
            <input
              type="checkbox"
              data-toggle-explanatory-model
              checked={showBeam}
              onChange={(e) => {
                const checked = e.target.checked;
                writeRutherfordV3State((prev) => ({
                  ...prev,
                  showBeam: checked,
                }));
              }}
              style={{ marginTop: "3px" }}
            />
            <span>
              <strong style={{ display: "block", color: "#0c4a6e" }}>
                Lớp 2: Quỹ đạo hạt α — Chế độ “Mô hình giải thích”
              </strong>
              <span style={{ fontSize: "12px", color: "#475569" }}>
                Hiện đường đi hyperbol và cung góc lệch θ kèm 2 nhãn riêng trên 3D (mắt không thấy trực tiếp qua kính M).
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* 4. Điều khiển Kính hiển vi M từ Vị trí (1) đến Vị trí (2) theo Hình 21.2b SGK */}
      <section
        aria-label="Di chuyển kính hiển vi M giữa vị trí (1) và vị trí (2) theo Hình 21.2b"
        style={{
          padding: "16px",
          background: "#0f172a",
          color: "#f8fafc",
          borderRadius: "12px",
          border: "1px solid #334155",
          display: "grid",
          gap: "14px",
        }}
      >
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "6px" }}>
            <label htmlFor="rutherford-observer-slider" style={{ fontSize: "14px", fontWeight: 700, color: "#38bdf8" }}>
              Di chuyển kính hiển vi M từ vị trí (1) đến vị trí (2) (Hình 21.2b): {observerAngleDeg}° — {observerSummary.shortBadge}
            </label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {run && (
                <button
                  type="button"
                  onClick={() => {
                    const targetDeg = Math.min(160, Math.max(0, Math.round(Math.abs(run.detectorAngleDeg))));
                    writeRutherfordV3State((prev) => ({
                      ...prev,
                      observerAngleDeg: targetDeg,
                    }));
                  }}
                  style={{
                    padding: "4px 10px",
                    fontSize: "12px",
                    borderRadius: "6px",
                    border: "1px solid #38bdf8",
                    background: "rgba(56, 189, 248, 0.15)",
                    color: "#bae6fd",
                    cursor: "pointer",
                    minHeight: "32px",
                  }}
                >
                  Đưa kính M tới điểm hạt đang chạm ({Math.min(160, Math.max(0, Math.round(Math.abs(run.detectorAngleDeg))))}°)
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  writeRutherfordV3State((prev) => ({
                    ...prev,
                    cameraMode: prev.cameraMode === "instrument" ? "orbit" : "instrument",
                  }))
                }
                style={{
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "1px solid #4ade80",
                  background: cameraMode === "instrument" ? "rgba(74, 222, 128, 0.28)" : "rgba(20, 83, 45, 0.5)",
                  color: "#bbf7d0",
                  cursor: "pointer",
                  minHeight: "32px",
                }}
              >
                {cameraMode === "instrument" ? "Thoát góc nhìn kính M" : "Bật góc nhìn qua kính M"}
              </button>
            </div>
          </div>

          <input
            id="rutherford-observer-slider"
            type="range"
            min={0}
            max={160}
            step={5}
            value={observerAngleDeg}
            onChange={(e) => {
              const deg = Number(e.target.value);
              writeRutherfordV3State((prev) => ({
                ...prev,
                observerAngleDeg: deg,
              }));
            }}
            style={{ width: "100%" }}
          />

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
            {OBSERVER_QUICK_PRESETS.map((p) => {
              const active = observerAngleDeg === p.deg;
              return (
                <button
                  key={p.deg}
                  type="button"
                  data-observer-preset={p.deg}
                  onClick={() =>
                    writeRutherfordV3State((prev) => ({
                      ...prev,
                      observerAngleDeg: p.deg,
                    }))
                  }
                  style={{
                    padding: "6px 10px",
                    minHeight: "36px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "6px",
                    border: active ? "1.5px solid #4ade80" : "1px solid #475569",
                    background: active ? "rgba(74, 222, 128, 0.2)" : "rgba(30, 41, 59, 0.85)",
                    color: active ? "#86efac" : "#cbd5e1",
                    cursor: "pointer",
                    touchAction: "manipulation",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Đối chiếu song song: Sơ đồ mặt cắt Hình 21.2b đúng chiều SGK ↔ Thị trường kính hiển vi M */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "14px",
            alignItems: "stretch",
          }}
        >
          {/* Hình vẽ mặt cắt chuẩn Hình 21.2b SGK tr. 91 (R bên phải bắn sang trái tới (1), (2) lệch > 90° bên phải) */}
          <div
            style={{
              background: "#080e1a",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "10px",
            }}
          >
            <div style={{ fontSize: "12.5px", fontWeight: 700, color: "#e2e8f0", marginBottom: "6px" }}>
              Sơ đồ mặt cắt Hình 21.2b (SGK tr. 91) — Chỉ rõ vị trí (1) và (2)
            </div>
            <svg
              viewBox="0 0 265 224"
              width="265"
              height="224"
              role="img"
              aria-label={`Sơ đồ mặt cắt Hình 21.2b SGK: nguồn R bên phải bắn sang trái qua lá vàng D tới vị trí (1) 0 độ, vị trí (2) lệch trên 90 độ bên dưới phải; kính hiển vi M đang ở góc ${observerAngleDeg} độ`}
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              {/* Thành hộp chân không G */}
              <circle cx={svgCx} cy={svgCy} r="94" fill="none" stroke="#64748b" strokeWidth="1.8" />
              <text x={svgCx} y="12" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="600">
                Chân không (G)
              </text>

              {/* Vòng màn huỳnh quang S */}
              <circle cx={svgCx} cy={svgCy} r={svgR} fill="none" stroke="#4ade80" strokeWidth="2.8" strokeOpacity="0.65" />
              <text x="64" y="176" fill="#86efac" fontSize="10.5" fontWeight="700">
                S
              </text>

              {/* Nguồn phát hạt α (R) bên phải bắn sang trái giống hệt Hình 21.2b SGK */}
              <path
                d="M 188 100 L 206 100 L 206 124 L 188 124 L 188 117 L 198 117 L 198 107 L 188 107 Z"
                fill="#0ea5e9"
                stroke="#bae6fd"
                strokeWidth="1.1"
              />
              <text x="192" y="94" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="700">
                R
              </text>
              <text x="234" y="109" textAnchor="middle" fill="#cbd5e1" fontSize="8.8" fontWeight="600">
                Nguồn hạt α
              </text>

              {/* Lá vàng mỏng D tại tâm */}
              <line x1={svgCx} y1="94" x2={svgCx} y2="130" stroke="#facc15" strokeWidth="3.5" />
              <text x={svgCx - 8} y="89" textAnchor="middle" fill="#fde047" fontSize="11" fontWeight="700">
                D
              </text>

              {/* Đường đi & góc lệch trong chế độ Mô hình giải thích */}
              {showBeam && (
                <g>
                  <line x1="196" y1={svgCy} x2={svgCx - svgR} y2={svgCy} stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3 2" />
                  {run && (
                    <polyline
                      points={`196,${svgCy} ${svgCx},${svgCy} ${hitSvgX.toFixed(1)},${hitSvgY.toFixed(1)}`}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.2"
                    />
                  )}
                </g>
              )}

              {/* Đốm lóe trên màn S */}
              {showScintillation && (
                <g>
                  {[-6, -3, 0, 3, 6].map((deg) => {
                    const r = (deg * Math.PI) / 180;
                    return (
                      <circle
                        key={deg}
                        cx={svgCx - svgR * Math.cos(r)}
                        cy={svgCy + svgR * Math.sin(r)}
                        r="2.4"
                        fill="#4ade80"
                      />
                    );
                  })}
                  <circle
                    cx={svgCx - svgR * Math.cos((140 * Math.PI) / 180)}
                    cy={svgCy + svgR * Math.sin((140 * Math.PI) / 180)}
                    r="2.4"
                    fill="#fb7185"
                  />
                  {run && hasReachedScreen && (
                    <circle cx={hitSvgX} cy={hitSvgY} r="4.8" fill="#86efac" stroke="#16a34a" strokeWidth="1.6" />
                  )}
                </g>
              )}

              {/* Chỉ rõ Vị trí (1) và Vị trí (2) đúng Hình 21.2b */}
              <circle cx={svgCx - svgR} cy={svgCy} r="4.5" fill="none" stroke="#86efac" strokeWidth="1.6" />
              <text x="12" y={svgCy + 4} fill="#86efac" fontSize="10.5" fontWeight="700">
                (1) 0°
              </text>

              <circle
                cx={svgCx - svgR * Math.cos((140 * Math.PI) / 180)}
                cy={svgCy + svgR * Math.sin((140 * Math.PI) / 180)}
                r="4.5"
                fill="none"
                stroke="#fda4af"
                strokeWidth="1.6"
              />
              <text x="196" y="176" fill="#fda4af" fontSize="10.5" fontWeight="700">
                (2) &gt;90°
              </text>

              {/* Kính hiển vi M đang quan sát */}
              <line
                x1={svgCx}
                y1={svgCy}
                x2={obsScreenX}
                y2={obsScreenY}
                stroke="#94a3b8"
                strokeWidth="1.1"
                strokeDasharray="2 2"
              />
              <line
                x1={obsScreenX}
                y1={obsScreenY}
                x2={obsEyeX}
                y2={obsEyeY}
                stroke="#eab308"
                strokeWidth="5.5"
                strokeLinecap="round"
              />
              <circle cx={obsEyeX} cy={obsEyeY} r="5" fill="#0f62fe" stroke="#ffffff" strokeWidth="1.2" />
              <text
                x={obsEyeX}
                y={obsEyeY > svgCy ? obsEyeY + 14 : obsEyeY - 8}
                textAnchor="middle"
                fill="#fef08a"
                fontSize="10.5"
                fontWeight="700"
              >
                M ({observerAngleDeg}°)
              </text>
            </svg>
          </div>

          {/* Thị trường qua kính hiển vi M & phép đếm cùng Δt = 10 s */}
          <div
            style={{
              background: "#080e1a",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <svg
                viewBox="-56 -56 112 112"
                width="104"
                height="104"
                role="img"
                aria-label={`Thị trường qua kính hiển vi M tại góc ${observerAngleDeg} độ`}
                style={{ flexShrink: 0 }}
              >
                <circle cx="0" cy="0" r="50" fill="#04130d" stroke="#eab308" strokeWidth="2.8" />
                <line x1="-48" y1="0" x2="48" y2="0" stroke="#14532d" strokeWidth="0.8" />
                <line x1="0" y1="-48" x2="0" y2="48" stroke="#14532d" strokeWidth="0.8" />
                {showScintillation &&
                  (() => {
                    const activeSpots: { cx: number; cy: number; r: number; opacity: number }[] = [];
                    if (isHitInsideMicroscopeWindow) {
                      activeSpots.push({ cx: 0, cy: 0, r: 5.2, opacity: 1 });
                    }
                    if (observerSummary.zone === "position_1") {
                      for (let k = 0; k < 4; k++) {
                        const spotIdx = (flashBeat * 3 + k * 5) % EYEPIECE_FLASH_SPOTS.length;
                        const [cx, cy, r] = EYEPIECE_FLASH_SPOTS[spotIdx];
                        activeSpots.push({ cx, cy, r, opacity: k === 0 ? 1 : 0.55 });
                      }
                    } else if (observerSummary.zone === "intermediate") {
                      if (flashBeat % 2 === 0) {
                        const spotIdx = (flashBeat * 2) % 8;
                        const [cx, cy, r] = EYEPIECE_FLASH_SPOTS[spotIdx];
                        activeSpots.push({ cx, cy, r, opacity: 0.95 });
                      }
                    } else if (flashBeat % 6 === 0) {
                      const [cx, cy, r] = EYEPIECE_FLASH_SPOTS[(flashBeat / 6) % 4];
                      activeSpots.push({ cx, cy, r: r + 0.6, opacity: 1 });
                    }
                    return activeSpots.map((sp, idx) => (
                      <g key={idx}>
                        <circle cx={sp.cx} cy={sp.cy} r={sp.r * 1.9} fill="#4ade80" fillOpacity={sp.opacity * 0.26} />
                        <circle cx={sp.cx} cy={sp.cy} r={sp.r} fill="#86efac" fillOpacity={sp.opacity} />
                      </g>
                    ));
                  })()}
                {!showScintillation && (
                  <text x="0" y="4" textAnchor="middle" fill="#94a3b8" fontSize="9.5">
                    Đã tắt Lớp 1
                  </text>
                )}
              </svg>

              <div style={{ fontSize: "13px", lineHeight: 1.5, flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, color: "#86efac", marginBottom: "2px" }}>
                  Qua kính M: {observerSummary.positionTitle}
                </div>
                <div style={{ color: "#fde047", fontWeight: 600, fontSize: "12px", marginBottom: "4px" }}>
                  {observerSummary.relativeFrequencyLabel}
                </div>
                <div style={{ fontSize: "11.5px", color: "#cbd5e1", marginBottom: "6px" }}>
                  {observerSummary.physicalMeaning}
                </div>
                <button
                  type="button"
                  onClick={() => setEyepiecePaused((p) => !p)}
                  style={{
                    padding: "4px 10px",
                    minHeight: "30px",
                    fontSize: "11.5px",
                    borderRadius: "5px",
                    border: "1px solid #475569",
                    background: "rgba(30, 41, 59, 0.9)",
                    color: "#e2e8f0",
                    cursor: "pointer",
                  }}
                >
                  {eyepiecePaused ? "Tiếp tục chớp đốm" : "Tạm dừng chớp đốm"}
                </button>
              </div>
            </div>

            {/* Phép đếm cùng khoảng thời gian Δt = 10 s ở vị trí (1) và vị trí (2) */}
            <div
              data-rutherford-equal-time-counter
              style={{
                padding: "10px 12px",
                background: "rgba(15, 23, 42, 0.92)",
                border: "1px solid #334155",
                borderRadius: "6px",
                fontSize: "12.5px",
                lineHeight: 1.55,
              }}
            >
              <div style={{ fontWeight: 700, color: "#bae6fd", marginBottom: "6px" }}>
                Đối chiếu số đốm lóe tại vị trí (1) và (2) trong cùng Δt = 10 s (lượt #{countTrialSeed}):
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                <button
                  type="button"
                  data-count-pos1-btn
                  onClick={() => {
                    const s1 = sampleEqualTimeFlashCount(0, countTrialSeed);
                    writeRutherfordV3State((prev) => ({
                      ...prev,
                      observerAngleDeg: 0,
                      countPos1: s1.count,
                    }));
                  }}
                  style={{
                    padding: "6px 10px",
                    minHeight: "34px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "5px",
                    border: "1px solid #22c55e",
                    background: "rgba(34, 197, 94, 0.18)",
                    color: "#bbf7d0",
                    cursor: "pointer",
                  }}
                >
                  Đếm ở Vị trí (1) · 0°
                </button>
                <button
                  type="button"
                  data-count-pos2-btn
                  onClick={() => {
                    const s2 = sampleEqualTimeFlashCount(140, countTrialSeed);
                    writeRutherfordV3State((prev) => ({
                      ...prev,
                      observerAngleDeg: 140,
                      countPos2: s2.count,
                    }));
                  }}
                  style={{
                    padding: "6px 10px",
                    minHeight: "34px",
                    fontSize: "12px",
                    fontWeight: 600,
                    borderRadius: "5px",
                    border: "1px solid #fb7185",
                    background: "rgba(251, 113, 133, 0.18)",
                    color: "#fecdd3",
                    cursor: "pointer",
                  }}
                >
                  Đếm ở Vị trí (2) · 140°
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextSeed = countTrialSeed + 1;
                    writeRutherfordV3State((prev) => ({
                      ...prev,
                      countTrialSeed: nextSeed,
                      countPos1:
                        prev.countPos1 !== null
                          ? sampleEqualTimeFlashCount(0, nextSeed).count
                          : null,
                      countPos2:
                        prev.countPos2 !== null
                          ? sampleEqualTimeFlashCount(140, nextSeed).count
                          : null,
                    }));
                  }}
                  style={{
                    padding: "6px 10px",
                    minHeight: "34px",
                    fontSize: "12px",
                    borderRadius: "5px",
                    border: "1px solid #64748b",
                    background: "transparent",
                    color: "#cbd5e1",
                    cursor: "pointer",
                  }}
                >
                  Lặp lượt đếm mới
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "8px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <div style={{ padding: "6px 8px", background: "#0b1324", border: "1px solid #1e293b", borderRadius: "4px" }}>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: "11px" }}>Vị trí (1) · Δt = 10 s</span>
                  <strong style={{ color: "#86efac", fontSize: "14px" }}>
                    {countPos1 !== null ? `${countPos1.toLocaleString("vi-VN")} đốm` : "Chưa đếm"}
                  </strong>
                  <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Kì vọng: ~10 000 đốm</span>
                </div>
                <div style={{ padding: "6px 8px", background: "#0b1324", border: "1px solid #1e293b", borderRadius: "4px" }}>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: "11px" }}>Vị trí (2) · Δt = 10 s</span>
                  <strong style={{ color: "#fda4af", fontSize: "14px" }}>
                    {countPos2 !== null ? `${countPos2.toLocaleString("vi-VN")} đốm` : "Chưa đếm"}
                  </strong>
                  <span style={{ color: "#64748b", display: "block", fontSize: "11px" }}>Kì vọng: ~1 đốm (~10⁻⁴ lần)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Thanh trượt chọn thông số khảo sát E (MeV) và b (fm) */}
      <div style={{ display: "grid", gap: "12px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            padding: "14px 16px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
          }}
        >
          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a" }}>
              Tham số va chạm b: <span style={{ color: "#0369a1" }}>{settings.impactFm} fm</span>
            </span>
            <input
              type="range"
              data-slider-impact-b
              min={RUTHERFORD_LIMITS.impactFm.min}
              max={RUTHERFORD_LIMITS.impactFm.max}
              step={1}
              value={settings.impactFm}
              onChange={(e) => {
                const nextImpact = Number(e.target.value);
                setElapsedZs(0);
                setIsRunning(false);
                writeRutherfordV3State((prev) => ({
                  ...prev,
                  impactFm: nextImpact,
                }));
              }}
            />
            <span style={{ fontSize: "11.5px", color: "#64748b" }}>
              Khoảng cách từ đường bay ban đầu của hạt α tới tâm hạt nhân vàng (0 – 100 fm; 1 fm = 10⁻¹⁵ m)
            </span>
          </label>

          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a" }}>
              Động năng hạt α tới E: <span style={{ color: "#0369a1" }}>{format(settings.energyMeV)} MeV</span>
            </span>
            <input
              type="range"
              data-slider-energy-e
              min={RUTHERFORD_LIMITS.energyMeV.min}
              max={RUTHERFORD_LIMITS.energyMeV.max}
              step={0.5}
              value={settings.energyMeV}
              onChange={(e) => {
                const nextEnergy = Number(e.target.value);
                setElapsedZs(0);
                setIsRunning(false);
                writeRutherfordV3State((prev) => ({
                  ...prev,
                  energyMeV: nextEnergy,
                }));
              }}
            />
            <span style={{ fontSize: "11.5px", color: "#64748b" }}>
              Giữ nguyên E giữa hai lượt lưu khi khảo sát vai trò của tham số va chạm b (3,0 – 10,0 MeV)
            </span>
          </label>
        </div>

        {/* Lưu ý khoa học bắt buộc */}
        <div
          role="note"
          data-rutherford-single-beam-note
          style={{
            padding: "11px 14px",
            background: "#fffbeb",
            border: "1px solid #f59e0b",
            borderLeft: "4px solid #d97706",
            borderRadius: "8px",
            fontSize: "12.5px",
            lineHeight: 1.55,
            color: "#78350f",
          }}
        >
          <strong>Lưu ý giới hạn mô hình:</strong> Quỹ đạo ở trên khảo sát 1 hạt α đơn lẻ bay gần hạt nhân vàng ở quy mô femtômét (<strong>KHÔNG đại diện cho tần suất của cả chùm hạt α</strong>). Trong thực tế nguyên tử rộng ~10⁵ fm nên đa số hạt có <code>b</code> rất lớn đi thẳng tới vị trí (1), chỉ ~10⁻⁴ số hạt đi rất sát tâm mới lệch &gt; 90° về vị trí (2).
        </div>
      </div>

      {/* 6. Bảng số liệu đo của thông số hiện tại */}
      {run && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))",
            gap: "12px",
            padding: "14px 16px",
            background: "var(--bg-surface-elevated, #f8fafc)",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
              Động năng E
            </div>
            <div style={{ fontSize: "19px", fontWeight: 700 }}>{format(settings.energyMeV)} MeV</div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
              Tham số va chạm b
            </div>
            <div style={{ fontSize: "19px", fontWeight: 700 }}>{settings.impactFm} fm</div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
              Góc lệch (tán xạ) θ
            </div>
            <div style={{ fontSize: "19px", fontWeight: 700, color: "#0369a1" }}>
              {format(run.scatteringAngleDeg, 2)}°
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
              Khoảng cách gần nhất
            </div>
            <div style={{ fontSize: "19px", fontWeight: 700 }}>
              {format(run.closestApproachFm)} fm
            </div>
          </div>
        </div>
      )}

      {/* 7. Phân bố góc tán xạ tổng hợp */}
      <details
        style={{
          padding: "12px 14px",
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "10px",
        }}
      >
        <summary style={{ cursor: "pointer", fontSize: "13.5px", fontWeight: 700, color: "#0f172a" }}>
          Biểu đồ phân bố góc tán xạ của chùm hạt α (quy luật 1/sin⁴(θ/2) — phù hợp thí nghiệm Geiger–Marsden)
        </summary>
        <div style={{ marginTop: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "2px",
              height: "110px",
              padding: "8px",
              background: "#f8fafc",
              borderRadius: "8px",
            }}
          >
            {histogram.map((bin, i) => {
              const maxCount = Math.max(...histogram.map((b) => b.count), 1);
              const heightPct = (bin.count / maxCount) * 100;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${heightPct}%`,
                    minHeight: bin.count > 0 ? "2px" : "0",
                    background: "#0284c7",
                    borderRadius: "2px 2px 0 0",
                    position: "relative",
                  }}
                  title={`${bin.angleDeg}°: ${bin.count} sự kiện`}
                >
                  {i % 3 === 0 && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "-18px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontSize: "10px",
                        color: "#64748b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {bin.angleDeg}°
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "24px", marginBottom: 0 }}>
            Đa số tuyệt đối hạt α tập trung ở góc nhỏ quanh vị trí (1) (0°), rất hiếm hạt lệch góc lớn &gt; 90° về vị trí (2).
          </p>
        </div>
      </details>

      {/* 8. Phiếu khảo sát 2 lượt độc lập + Đối chiếu ngay với Dự đoán Pha 1 đã khóa */}
      <RutherfordInquiryTask
        current={currentInquiryRun}
        hasObservedCurrentRun={hasReachedScreen}
        lockedPhase1Prediction={lockedPhase1Prediction}
        onOpenPhase1={onOpenPhase1}
        onSyncEnergyToAnchor={(anchorE) => {
          setElapsedZs(0);
          setIsRunning(false);
          writeRutherfordV3State((prev) => ({
            ...prev,
            energyMeV: anchorE,
          }));
        }}
        onCompleteChange={(done) => onProgress?.(done)}
      />
    </div>
  );
}

export default RutherfordApparatusV3;
