"use client";

/**
 * GeigerApparatusV3 — Bộ đếm Geiger–Müller 3D tương tác (Hình 23.2 SGK Vật lí 12 KNTT, trang 105)
 *
 * Tính năng cốt lõi:
 * - Dựng chi tiết 3D theo Hình 23.2: Giá giữ mẫu (1), Ống đếm Geiger–Müller (2), Đầu nối đồng trục BNC (3),
 *   Dây cáp tín hiệu (4), Bộ đếm xung có màn hình nhảy số trực tiếp & loa (5), Bộ định thời cửa sổ đo 5,0 giây (6)
 * - Ba góc nhìn chuyên biệt: Toàn cảnh, Cận đầu dò, Đọc màn hình + Xoay 360°, thu phóng, chạm từng bộ phận đọc chức năng
 * - Quy trình thực hành: Đặt lại bộ đếm → Bấm đo 5 giây → Đọc số xung trên màn hình thiết bị → Lưu lượt → Đo lại
 * - Lưu độc lập thời lượng (s) và số xung (kể cả lượt 0 xung) vào localStorage ("b23-geiger-v3-state-v1")
 * - Tách bạch rõ nhãn Kết quả mô phỏng của học sinh với Bảng 23.1 SGK (1, 3, 2, 0, 3, 1); làm rõ số xung cửa sổ đo ≠ hoạt độ H (Bq)
 * - Xử lí WebGL an toàn + giải phóng GPU khi rời mục + sơ đồ dự phòng tương tác dùng chung trạng thái mô phỏng
 */

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { probeWebGLSupport } from "../rutherford/parts";
import {
  countGeigerPulsesAtTime,
  GEIGER_GATE_DURATION_SEC,
  generateGeigerMeasurementWindow,
  getRecentPulseProgress,
  SGK_TABLE_23_1_ROWS,
} from "../../physics/geiger-engine";
import {
  GEIGER_CAMERA_PRESETS,
  GEIGER_COMPONENTS,
  GEIGER_SIGNAL_PATH_PARTS,
  GEIGER_V3_STORAGE_KEY,
  getGeigerComponent,
  INITIAL_GEIGER_V3_STATE,
  parseGeigerV3State,
  resolveGeigerRaycastPart,
  type GeigerCameraMode,
  type GeigerV3PersistedState,
} from "./parts";
import { buildGeigerApparatus, type BuiltGeigerComponent, type GeigerLiveVisualHandles } from "./geometry";
import { GeigerFallbackDiagram } from "./GeigerFallbackDiagram";

const EMPTY_RAW = () => "";
const GEIGER_STORAGE_EVENT = "b23-geiger-v3-changed";

function subscribeGeigerStorage(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(GEIGER_STORAGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(GEIGER_STORAGE_EVENT, listener);
  };
}

function getGeigerRawSnapshot(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(GEIGER_V3_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeGeigerV3State(
  updater:
    | GeigerV3PersistedState
    | ((prev: GeigerV3PersistedState) => GeigerV3PersistedState),
): void {
  if (typeof window === "undefined") return;
  const current = parseGeigerV3State(getGeigerRawSnapshot());
  const next = typeof updater === "function" ? updater(current) : updater;
  try {
    window.localStorage.setItem(GEIGER_V3_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(GEIGER_STORAGE_EVENT));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

const CAMERA_TARGETS: Record<
  GeigerCameraMode,
  { pos: [number, number, number]; target: [number, number, number]; fov: number }
> = {
  overview: { pos: [-0.25, 4.15, 11.8], target: [-0.35, 0.25, 0.25], fov: 40 },
  probe: { pos: [-3.55, 1.45, 5.1], target: [-3.55, 0.22, 0], fov: 38 },
  display: { pos: [3.2, 0.92, 6.95], target: [3.2, 0.62, 0.85], fov: 39 },
};

const PIN_ANCHORS: Readonly<Record<string, THREE.Vector3>> = {
  "sample-holder": new THREE.Vector3(-6.25, 1.28, 0),
  "gm-tube": new THREE.Vector3(-3.05, 1.38, 0),
  "signal-connectors": new THREE.Vector3(-1.08, 1.05, 0),
  "signal-cable": new THREE.Vector3(0.35, -0.95, 1.65),
  "counter-display": new THREE.Vector3(3.35, -1.52, 1.45),
  "timer-unit": new THREE.Vector3(3.45, 2.52, 0),
};

const SELECTION_RING_LAYOUT: Readonly<
  Record<string, { pos: [number, number, number]; radius: number }>
> = {
  "sample-holder": { pos: [-6.2, -0.2, 0], radius: 0.92 },
  "gm-tube": { pos: [-3.05, 0.38, 0], radius: 1.75 },
  "signal-connectors": { pos: [-1.08, 0.38, 0], radius: 0.72 },
  "signal-cable": { pos: [0.35, -0.45, 1.5], radius: 1.05 },
  "counter-display": { pos: [3.45, -0.08, 0.2], radius: 2.65 },
  "timer-unit": { pos: [3.45, 1.68, -0.05], radius: 1.75 },
};

function isolateGeigerMaterials(components: Map<string, BuiltGeigerComponent>) {
  for (const [, built] of components) {
    built.mesh.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh) || obj.userData.isHitVolume) return;
      if (Array.isArray(obj.material)) {
        obj.material = obj.material.map((m) => m.clone());
      } else if (obj.material) {
        obj.material = obj.material.clone();
      }
    });
  }
}

function applyGeigerPartHighlight(
  components: Map<string, BuiltGeigerComponent>,
  selectedPartId: string | null,
) {
  for (const [id, built] of components) {
    const active = id === selectedPartId;
    built.mesh.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh) || obj.userData.isHitVolume) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (m instanceof THREE.MeshStandardMaterial) {
          if (m.userData.origEmissiveHex === undefined) {
            m.userData.origEmissiveHex = m.emissive.getHex();
            m.userData.origEmissiveIntensity = m.emissiveIntensity;
          }
          if (active) {
            m.emissive.setHex(0x06b6d4);
            m.emissiveIntensity = 0.42;
          } else {
            m.emissive.setHex(m.userData.origEmissiveHex as number);
            m.emissiveIntensity = m.userData.origEmissiveIntensity as number;
          }
        }
      }
    });
  }
}

function disposeObjectTree(root: THREE.Object3D) {
  const seenGeos = new Set<THREE.BufferGeometry>();
  const seenMats = new Set<THREE.Material>();
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      if (obj.geometry && !seenGeos.has(obj.geometry)) {
        seenGeos.add(obj.geometry);
        obj.geometry.dispose();
      }
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of mats) {
        if (m && !seenMats.has(m)) {
          seenMats.add(m);
          m.dispose();
        }
      }
    }
  });
}

const NOOP_SUBSCRIBE = () => () => {};
const SERVER_WEBGL_SNAPSHOT = () => true;
let cachedGeigerWebGLSupport: boolean | null = null;

function getClientWebGLSnapshot(): boolean {
  if (cachedGeigerWebGLSupport === null) {
    cachedGeigerWebGLSupport = probeWebGLSupport();
  }
  return cachedGeigerWebGLSupport;
}

interface GeigerSceneState {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  handles: GeigerLiveVisualHandles;
  raycaster: THREE.Raycaster;
  selectionRing: THREE.Mesh | null;
  frameId: number;
}

export interface GeigerApparatusV3Props {
  /** Gọi khi học sinh đã đo và lưu được tối thiểu 2 lượt đo Geiger độc lập */
  readonly onProgress?: (done: boolean) => void;
}

export function GeigerApparatusV3({ onProgress }: GeigerApparatusV3Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<GeigerSceneState | null>(null);
  const pinElsRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const syncSceneRef = useRef<(() => void) | null>(null);
  const prevCameraModeRef = useRef<string>("");

  const storedRaw = useSyncExternalStore(
    subscribeGeigerStorage,
    getGeigerRawSnapshot,
    EMPTY_RAW,
  );
  const persisted = useMemo(
    () => (storedRaw ? parseGeigerV3State(storedRaw) : INITIAL_GEIGER_V3_STATE),
    [storedRaw],
  );

  const {
    cameraMode,
    selectedPartId,
    trialSeed,
    status: persistedStatus,
    durationSec,
    completedPulses,
    currentWindowSaved,
    savedRuns,
  } = persisted;

  // Live wall-clock measurement state (when measuring the 5.0 s gate window)
  const [measuringRun, setMeasuringRun] = useState<{
    active: boolean;
    seed: number;
    duration: number;
    elapsedSec: number;
  } | null>(null);

  const [showPins, setShowPins] = useState(true);
  const [webglRuntimeError, setWebglRuntimeError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [isHostVisible, setIsHostVisible] = useState(true);

  const browserSupportsWebGL = useSyncExternalStore(
    NOOP_SUBSCRIBE,
    getClientWebGLSnapshot,
    SERVER_WEBGL_SNAPSHOT,
  );
  const isWebGLActive = browserSupportsWebGL && !webglRuntimeError;
  const isFallbackActive = !isWebGLActive;

  // Current Poisson measurement window for active or completed trialSeed
  const activeSeed = measuringRun?.active ? measuringRun.seed : trialSeed;
  const activeDuration = measuringRun?.active ? measuringRun.duration : durationSec;

  const measurementWindow = useMemo(
    () => generateGeigerMeasurementWindow(activeSeed, activeDuration),
    [activeSeed, activeDuration],
  );

  const effectiveStatus = measuringRun?.active ? "measuring" : persistedStatus;
  const effectiveElapsedSec = measuringRun?.active
    ? measuringRun.elapsedSec
    : effectiveStatus === "completed"
      ? durationSec
      : 0;

  const displayedPulses = measuringRun?.active
    ? countGeigerPulsesAtTime(measurementWindow, measuringRun.elapsedSec)
    : effectiveStatus === "completed" && completedPulses !== null
      ? completedPulses
      : 0;

  const pulseProgress = measuringRun?.active
    ? getRecentPulseProgress(measurementWindow, measuringRun.elapsedSec)
    : null;

  // Report completion upward once >= 2 runs have been saved
  const hasTwoSavedRuns = savedRuns.length >= 2;
  const hadReportedRef = useRef(hasTwoSavedRuns);
  useEffect(() => {
    if (hasTwoSavedRuns || hadReportedRef.current) {
      onProgress?.(hasTwoSavedRuns);
    }
    hadReportedRef.current = hasTwoSavedRuns;
  }, [hasTwoSavedRuns, onProgress]);

  // Observe ancestor [hidden] in VisualLearningStudio so GPU context is released when leaving section
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof MutationObserver === "undefined") return;
    const check = () => setIsHostVisible(el.closest("[hidden]") === null);
    check();
    const obs = new MutationObserver(check);
    let node: HTMLElement | null = el.parentElement;
    while (node) {
      obs.observe(node, { attributes: true, attributeFilter: ["hidden"] });
      node = node.parentElement;
    }
    return () => obs.disconnect();
  }, []);

  // 5-second wall-clock gate timer animation
  useEffect(() => {
    if (!measuringRun?.active) return;
    const runSeed = measuringRun.seed;
    const gateSec = measuringRun.duration;
    const win = generateGeigerMeasurementWindow(runSeed, gateSec);
    const startMs = performance.now();
    let rafId = 0;

    function tick(now: number) {
      const elapsed = Math.min(gateSec, Math.max(0, (now - startMs) / 1000));
      if (elapsed >= gateSec) {
        setMeasuringRun(null);
        writeGeigerV3State((prev) => ({
          ...prev,
          trialSeed: runSeed,
          durationSec: gateSec,
          status: "completed",
          completedPulses: win.totalPulses,
          currentWindowSaved: false,
        }));
        return;
      }
      setMeasuringRun((prev) =>
        prev && prev.active ? { ...prev, elapsedSec: elapsed } : prev,
      );
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [measuringRun?.active, measuringRun?.seed, measuringRun?.duration]);

  // Synchronize 3D camera, selection highlight, and live 3D CanvasTexture screens
  useEffect(() => {
    const syncNow = () => {
      const state = sceneRef.current;
      if (!state) return;

      if (prevCameraModeRef.current !== cameraMode) {
        prevCameraModeRef.current = cameraMode;
        const preset = CAMERA_TARGETS[cameraMode];
        state.camera.fov = preset.fov;
        state.camera.updateProjectionMatrix();
        state.controls.target.set(...preset.target);
        state.camera.position.set(...preset.pos);
        state.controls.saveState();
        state.controls.reset();
        state.camera.lookAt(...preset.target);
      }

      applyGeigerPartHighlight(state.handles.components, selectedPartId);

      if (state.selectionRing) {
        state.scene.remove(state.selectionRing);
        state.selectionRing.geometry.dispose();
        (state.selectionRing.material as THREE.Material).dispose();
        state.selectionRing = null;
      }

      if (selectedPartId && SELECTION_RING_LAYOUT[selectedPartId]) {
        const cfg = SELECTION_RING_LAYOUT[selectedPartId];
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(cfg.radius, 0.065, 12, 56),
          new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
        );
        ring.position.set(...cfg.pos);
        ring.rotation.x = Math.PI / 2;
        state.scene.add(ring);
        state.selectionRing = ring;
      }

      state.handles.updateReadoutScreens({
        pulses: displayedPulses,
        elapsedSec: effectiveElapsedSec,
        durationSec: activeDuration,
        status: effectiveStatus,
        pulseProgress,
      });
    };

    syncSceneRef.current = syncNow;
    syncNow();
  }, [
    cameraMode,
    selectedPartId,
    displayedPulses,
    effectiveElapsedSec,
    activeDuration,
    effectiveStatus,
    pulseProgress,
  ]);

  // Initialize & dispose Three.js WebGL context cleanly
  useEffect(() => {
    if (!isWebGLActive || !isHostVisible) return;
    const container = containerRef.current;
    if (!container) return;

    const initW = Math.max(container.clientWidth, 1);
    const initH = Math.max(container.clientHeight, 1);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      cachedGeigerWebGLSupport = false;
      queueMicrotask(() => setWebglRuntimeError(true));
      return;
    }

    let disposed = false;
    renderer.setSize(initW, initH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      if (!disposed) {
        setWebglRuntimeError(true);
      }
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09111f);

    const camera = new THREE.PerspectiveCamera(40, initW / initH, 0.1, 160);
    camera.position.set(...CAMERA_TARGETS.overview.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.8;
    controls.maxDistance = 26;
    controls.target.set(...CAMERA_TARGETS.overview.target);
    controls.update();

    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
    keyLight.position.set(8, 14, 11);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.45);
    rimLight.position.set(-10, 6, -8);
    scene.add(rimLight);

    const handles = buildGeigerApparatus(GEIGER_COMPONENTS);
    isolateGeigerMaterials(handles.components);
    scene.add(handles.benchBase);
    for (const [, built] of handles.components) {
      scene.add(built.mesh);
    }

    const raycaster = new THREE.Raycaster();
    const projected = new THREE.Vector3();

    sceneRef.current = {
      renderer,
      scene,
      camera,
      controls,
      handles,
      raycaster,
      selectionRing: null,
      frameId: 0,
    };

    prevCameraModeRef.current = "";
    syncSceneRef.current?.();

    function updatePinPosition(partId: string, worldPos: THREE.Vector3, w: number, h: number) {
      const el = pinElsRef.current[partId];
      if (!el) return;
      projected.copy(worldPos).project(camera);
      if (
        projected.z > 1 ||
        projected.x < -0.95 ||
        projected.x > 0.95 ||
        projected.y < -0.93 ||
        projected.y > 0.91
      ) {
        if (el.style.opacity !== "0") el.style.opacity = "0";
        if (el.style.pointerEvents !== "none") el.style.pointerEvents = "none";
        return;
      }
      const px = (projected.x * 0.5 + 0.5) * w;
      const py = (-projected.y * 0.5 + 0.5) * h;
      const nextTransform = `translate(-50%, -50%) translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
      if (el.style.opacity !== "1") el.style.opacity = "1";
      if (el.style.pointerEvents !== "auto") el.style.pointerEvents = "auto";
      if (el.style.transform !== nextTransform) el.style.transform = nextTransform;
    }

    let lastRender = 0;
    function animate(now = 0) {
      if (disposed || !sceneRef.current || !container) return;
      sceneRef.current.frameId = requestAnimationFrame(animate);
      if (now - lastRender < 33) return;
      lastRender = now;
      sceneRef.current.controls.update();
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);

      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        for (const [partId, anchor] of Object.entries(PIN_ANCHORS)) {
          updatePinPosition(partId, anchor, w, h);
        }
      }
    }
    animate();

    const onResize = () => {
      if (disposed || !container || !sceneRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    let downPt: { x: number; y: number } | null = null;
    const onPointerDown = (e: PointerEvent) => {
      downPt = { x: e.clientX, y: e.clientY };
    };
    const onClick = (e: MouseEvent) => {
      if (disposed || !sceneRef.current) return;
      if (downPt && Math.hypot(e.clientX - downPt.x, e.clientY - downPt.y) > 6) {
        return;
      }
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      sceneRef.current.raycaster.setFromCamera(mouse, sceneRef.current.camera);

      const roots: THREE.Object3D[] = [];
      for (const [, built] of sceneRef.current.handles.components) {
        if (built.mesh.visible) roots.push(built.mesh);
      }

      const hits = sceneRef.current.raycaster.intersectObjects(roots, true);
      const hitIds: string[] = [];
      for (const hit of hits) {
        let cur: THREE.Object3D | null = hit.object;
        while (cur) {
          for (const [id, built] of sceneRef.current.handles.components) {
            if (built.mesh === cur && !hitIds.includes(id)) {
              hitIds.push(id);
            }
          }
          cur = cur.parent;
        }
      }
      const chosen = resolveGeigerRaycastPart(hitIds);
      writeGeigerV3State((prev) => ({
        ...prev,
        selectedPartId: chosen,
      }));
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("click", onClick);

    return () => {
      disposed = true;
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("click", onClick);
      resizeObserver.disconnect();

      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.frameId);
        sceneRef.current.controls.dispose();
        sceneRef.current.handles.disposeLiveTextures();
        disposeObjectTree(sceneRef.current.scene);
      }

      try {
        renderer.forceContextLoss?.();
      } catch {
        // Ignore if context already lost
      }
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, [isWebGLActive, isHostVisible, retryNonce]);

  const handleSelectPart = useCallback((partId: string) => {
    writeGeigerV3State((prev) => ({
      ...prev,
      selectedPartId: prev.selectedPartId === partId ? null : partId,
    }));
  }, []);

  function handleResetCounter() {
    setMeasuringRun(null);
    writeGeigerV3State((prev) => ({
      ...prev,
      // Advance seed if previous measurement had completed so next measurement is fresh, while keeping all savedRuns!
      trialSeed: prev.status === "completed" ? prev.trialSeed + 1 : prev.trialSeed,
      status: "idle",
      completedPulses: null,
      currentWindowSaved: false,
    }));
  }

  function handleStartMeasure5s() {
    if (measuringRun?.active) return;
    const nextSeed = persistedStatus === "completed" ? trialSeed + 1 : trialSeed;
    writeGeigerV3State((prev) => ({
      ...prev,
      trialSeed: nextSeed,
      status: "measuring",
      durationSec: GEIGER_GATE_DURATION_SEC,
      completedPulses: null,
      currentWindowSaved: false,
    }));
    setMeasuringRun({
      active: true,
      seed: nextSeed,
      duration: GEIGER_GATE_DURATION_SEC,
      elapsedSec: 0,
    });
  }

  function handleSaveCurrentRun() {
    if (effectiveStatus !== "completed" || completedPulses === null || currentWindowSaved) {
      return;
    }
    writeGeigerV3State((prev) => {
      if (prev.status !== "completed" || prev.completedPulses === null || prev.currentWindowSaved) {
        return prev;
      }
      const nextRunNum = prev.savedRuns.length + 1;
      const nextId =
        prev.savedRuns.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;
      return {
        ...prev,
        currentWindowSaved: true,
        savedRuns: [
          ...prev.savedRuns,
          {
            id: nextId,
            runNumber: nextRunNum,
            durationSec: prev.durationSec,
            pulses: prev.completedPulses,
            trialSeed: prev.trialSeed,
          },
        ],
      };
    });
  }

  function handleRemeasureNewWindow() {
    const nextSeed = activeSeed + 1;
    writeGeigerV3State((prev) => ({
      ...prev,
      trialSeed: nextSeed,
      status: "measuring",
      durationSec: GEIGER_GATE_DURATION_SEC,
      completedPulses: null,
      currentWindowSaved: false,
    }));
    setMeasuringRun({
      active: true,
      seed: nextSeed,
      duration: GEIGER_GATE_DURATION_SEC,
      elapsedSec: 0,
    });
  }

  function handleResetCameraView() {
    writeGeigerV3State((prev) => ({
      ...prev,
      cameraMode: "overview",
    }));
    if (sceneRef.current) {
      const preset = CAMERA_TARGETS.overview;
      sceneRef.current.camera.fov = preset.fov;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.controls.target.set(...preset.target);
      sceneRef.current.camera.position.set(...preset.pos);
      sceneRef.current.controls.saveState();
      sceneRef.current.controls.reset();
    }
  }

  const selectedComponent = selectedPartId ? getGeigerComponent(selectedPartId) : undefined;
  const formattedReadout = String(Math.max(0, Math.round(displayedPulses))).padStart(4, "0");

  return (
    <div
      ref={rootRef}
      data-testid="geiger-apparatus-v3"
      style={{
        display: "grid",
        gap: "16px",
        padding: "16px",
        background: "var(--bg-surface, #ffffff)",
        borderRadius: "12px",
        border: "1px solid var(--border-light, #cbd5e1)",
        minWidth: 0,
        maxWidth: "100%",
      }}
    >
      {/* 1. Thanh lần theo đường tín hiệu & chọn bộ phận Hình 23.2 */}
      <div
        style={{
          padding: "12px 14px",
          background: "#f8fafc",
          border: "1px solid #cbd5e1",
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
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
            Cấu tạo &amp; đường đi tín hiệu bộ đếm Geiger–Müller (Hình 23.2 SGK tr. 105) — chạm bộ phận để xem tên &amp; chức năng:
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
              checked={showPins}
              onChange={(e) => setShowPins(e.target.checked)}
            />
            Hiện nhãn đường tín hiệu trên mô hình
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "8px",
          }}
        >
          {GEIGER_SIGNAL_PATH_PARTS.map((item) => {
            const active = selectedPartId === item.partId;
            return (
              <button
                key={item.partId}
                type="button"
                aria-pressed={active}
                data-geiger-part-btn={item.partId}
                onClick={() => handleSelectPart(item.partId)}
                style={{
                  minHeight: "46px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  border: active ? "2px solid #0f62fe" : "1px solid #94a3b8",
                  background: active ? "#edf5ff" : "#ffffff",
                  color: active ? "#002d9c" : "#0f172a",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>{item.shortBadge}</span>
                <span
                  style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 500,
                    color: active ? "#0f62fe" : "#475569",
                    marginTop: "2px",
                  }}
                >
                  {item.signalCue}
                </span>
              </button>
            );
          })}
        </div>

        {selectedComponent ? (
          <div
            role="status"
            data-geiger-selected-part-card={selectedComponent.id}
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
                writeGeigerV3State((prev) => ({
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
              padding: "8px 12px",
              background: "#ffffff",
              border: "1px dashed #cbd5e1",
              borderRadius: "6px",
              fontSize: "12.5px",
              color: "#475569",
            }}
          >
            Đường đi tín hiệu: <strong>Mẫu phóng xạ (1)</strong> → tia làm ion hóa khí trong{" "}
            <strong>Ống đếm GM (2)</strong> → <strong>Đầu nối BNC ra (OUT)</strong> →{" "}
            <strong>Dây cáp tín hiệu đồng trục</strong> → <strong>Đầu nối BNC vào (SIGNAL IN)</strong> →{" "}
            <strong>Bộ đếm tăng màn hình +1</strong> trong cửa sổ <strong>Bộ định thời 5,0 giây</strong>.
          </div>
        )}
      </div>

      {/* 2. Khung mô phỏng 3D WebGL hoặc Sơ đồ dự phòng tương tác */}
      <div
        data-geiger-stage
        data-geiger-render-mode={
          isFallbackActive
            ? "fallback-no-webgl"
            : isHostVisible
              ? "webgl-active"
              : "webgl-released"
        }
        style={{
          position: "relative",
          width: "100%",
          minHeight: "460px",
          borderRadius: "12px",
          overflow: "hidden",
          background: "#09111f",
          border: "1px solid #1e293b",
        }}
      >
        {isFallbackActive ? (
          <GeigerFallbackDiagram
            cameraMode={cameraMode}
            selectedPartId={selectedPartId}
            displayedPulses={displayedPulses}
            elapsedSec={effectiveElapsedSec}
            durationSec={activeDuration}
            status={effectiveStatus}
            isPulseFlashing={pulseProgress !== null}
            showPins={showPins}
            onSelectPart={handleSelectPart}
            onRetryWebGL={() => {
              cachedGeigerWebGLSupport = probeWebGLSupport();
              setWebglRuntimeError(!cachedGeigerWebGLSupport);
              setRetryNonce((n) => n + 1);
            }}
          />
        ) : (
          <>
            <div
              ref={containerRef}
              data-geiger-canvas
              style={{
                width: "100%",
                height: "460px",
                cursor: "grab",
                touchAction: "none",
              }}
            />

            {/* Các nhãn ghim 3D bám theo từng bộ phận */}
            <div
              aria-hidden={!showPins}
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                overflow: "hidden",
              }}
            >
              {GEIGER_SIGNAL_PATH_PARTS.map((pin) => {
                const active = selectedPartId === pin.partId;
                return (
                  <button
                    key={pin.partId}
                    ref={(el) => {
                      pinElsRef.current[pin.partId] = el;
                    }}
                    type="button"
                    data-geiger-3d-pin={pin.partId}
                    onClick={() => handleSelectPart(pin.partId)}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      display: showPins ? "inline-flex" : "none",
                      alignItems: "center",
                      gap: "4px",
                      padding: "3px 8px",
                      borderRadius: "999px",
                      border: active ? "2px solid #22d3ee" : "1px solid #38bdf8",
                      background: active ? "rgba(8, 47, 73, 0.94)" : "rgba(15, 23, 42, 0.86)",
                      color: "#f8fafc",
                      fontSize: "11px",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
                      opacity: 0,
                    }}
                  >
                    {pin.shortBadge}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Thanh chọn góc nhìn camera trên khung mô phỏng */}
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
            zIndex: 3,
          }}
        >
          {GEIGER_CAMERA_PRESETS.map((preset) => {
            const active = cameraMode === preset.mode;
            return (
              <button
                key={preset.mode}
                type="button"
                data-geiger-camera-preset={preset.mode}
                onClick={() =>
                  writeGeigerV3State((prev) => ({
                    ...prev,
                    cameraMode: preset.mode,
                  }))
                }
                title={preset.description}
                style={{
                  padding: "6px 12px",
                  minHeight: "34px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  borderRadius: "6px",
                  border: active ? "1.5px solid #22d3ee" : "1px solid rgba(255,255,255,0.28)",
                  background: active ? "rgba(8, 145, 178, 0.44)" : "rgba(10, 15, 28, 0.84)",
                  color: active ? "#a5f3fc" : "#f1f5f9",
                  cursor: "pointer",
                }}
              >
                {preset.nameVi}
              </button>
            );
          })}

          <button
            type="button"
            data-geiger-reset-camera-btn
            onClick={handleResetCameraView}
            style={{
              padding: "6px 10px",
              minHeight: "34px",
              fontSize: "12px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.26)",
              background: "rgba(15, 23, 42, 0.8)",
              color: "#cbd5e1",
              cursor: "pointer",
            }}
          >
            Đặt lại góc nhìn
          </button>
        </div>

        {/* Chân khung: hướng dẫn xoay/zoom + trạng thái màn hình */}
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
            zIndex: 3,
          }}
        >
          <span
            style={{
              padding: "5px 10px",
              borderRadius: "6px",
              background: "rgba(10, 15, 28, 0.86)",
              border: "1px solid rgba(56, 189, 248, 0.45)",
              color: "#e2e8f0",
              fontSize: "12px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Màn hình thiết bị: <strong style={{ color: "#fda4af" }}>{formattedReadout} xung</strong> · Cổng đo:{" "}
            <strong style={{ color: "#fde68a" }}>
              {effectiveElapsedSec.toFixed(1)} / {activeDuration.toFixed(1)} s
            </strong>
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
            {isFallbackActive
              ? "Sơ đồ dự phòng đồng bộ trực tiếp · Chạm linh kiện để xem tên & chức năng"
              : "Kéo để xoay 360° · Cuộn/chụm 2 ngón để zoom · Chạm bộ phận để đọc chức năng"}
          </span>
        </div>
      </div>

      {/* 3. Màn hình đọc số & Thanh thao tác chuẩn: Đặt lại bộ đếm → Bấm đo 5 giây → Đọc số xung → Lưu lượt → Đo lại */}
      <div
        data-testid="geiger-live-readout-panel"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
          gap: "14px",
          padding: "16px",
          background: "#0f172a",
          color: "#f8fafc",
          borderRadius: "10px",
          border: "1px solid #334155",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "14px",
            alignItems: "center",
            flexWrap: "wrap",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              background: "#020617",
              border: pulseProgress !== null ? "2px solid #4ade80" : "2px solid #38bdf8",
              borderRadius: "8px",
              minWidth: "150px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
              Số đọc trên bộ đếm
            </div>
            <div
              data-testid="geiger-screen-pulse-count"
              data-geiger-pulses={displayedPulses}
              style={{
                fontSize: "32px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontWeight: 800,
                color: pulseProgress !== null ? "#86efac" : "#fb7185",
                letterSpacing: "2px",
                lineHeight: 1.2,
              }}
            >
              {formattedReadout}
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#fde047" }}>
              {displayedPulses} xung ghi nhận
            </div>
          </div>

          <div
            style={{
              padding: "10px 14px",
              background: "#020617",
              border: "1.5px solid #f59e0b",
              borderRadius: "8px",
              minWidth: "142px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#fde68a", textTransform: "uppercase" }}>
              Bộ định thời cửa sổ
            </div>
            <div
              data-testid="geiger-timer-value"
              style={{
                fontSize: "24px",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontWeight: 800,
                color: "#38bdf8",
                lineHeight: 1.35,
              }}
            >
              {effectiveElapsedSec.toFixed(1)} / {activeDuration.toFixed(1)} s
            </div>
            <div style={{ fontSize: "11.5px", color: "#cbd5e1" }}>
              {effectiveStatus === "measuring"
                ? "Đang mở cổng đếm..."
                : effectiveStatus === "completed"
                  ? "Đã đóng cổng 5,0 giây"
                  : "Đã đặt về 0,0 giây"}
            </div>
          </div>
        </div>

        {/* Các nút thao tác theo đúng trình tự thực hành */}
        <div style={{ display: "grid", gap: "10px" }}>
          <div style={{ fontSize: "12.5px", color: "#bae6fd", fontWeight: 600 }}>
            Quy trình đo: <strong>1. Đặt lại bộ đếm</strong> → <strong>2. Bấm đo 5 giây</strong> →{" "}
            <strong>3. Đọc số xung &amp; Lưu lượt</strong> → <strong>4. Đo lại</strong>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              data-geiger-reset-btn
              onClick={handleResetCounter}
              disabled={effectiveStatus === "measuring"}
              style={{
                padding: "9px 14px",
                minHeight: "42px",
                fontSize: "13.5px",
                fontWeight: 700,
                borderRadius: "8px",
                border: "1px solid #94a3b8",
                background: "#1e293b",
                color: "#f8fafc",
                cursor: effectiveStatus === "measuring" ? "not-allowed" : "pointer",
                opacity: effectiveStatus === "measuring" ? 0.6 : 1,
              }}
            >
              Đặt lại bộ đếm
            </button>

            <button
              type="button"
              data-geiger-measure-btn
              onClick={handleStartMeasure5s}
              disabled={effectiveStatus === "measuring"}
              style={{
                padding: "9px 16px",
                minHeight: "42px",
                fontSize: "13.5px",
                fontWeight: 700,
                borderRadius: "8px",
                border: "none",
                background: effectiveStatus === "measuring" ? "#0369a1" : "#2563eb",
                color: "#ffffff",
                cursor: effectiveStatus === "measuring" ? "not-allowed" : "pointer",
              }}
            >
              {effectiveStatus === "measuring" ? "Đang đo 5 giây..." : "Bấm đo 5 giây"}
            </button>

            <button
              type="button"
              data-geiger-save-run-btn
              onClick={handleSaveCurrentRun}
              disabled={effectiveStatus !== "completed" || currentWindowSaved}
              style={{
                padding: "9px 16px",
                minHeight: "42px",
                fontSize: "13.5px",
                fontWeight: 700,
                borderRadius: "8px",
                border: "none",
                background:
                  effectiveStatus === "completed" && !currentWindowSaved
                    ? "#16a34a"
                    : "#475569",
                color: "#ffffff",
                cursor:
                  effectiveStatus === "completed" && !currentWindowSaved
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              {currentWindowSaved ? "✓ Đã lưu lượt này" : "Lưu lượt"}
            </button>

            <button
              type="button"
              data-geiger-remeasure-btn
              onClick={handleRemeasureNewWindow}
              disabled={effectiveStatus === "measuring"}
              style={{
                padding: "9px 16px",
                minHeight: "42px",
                fontSize: "13.5px",
                fontWeight: 700,
                borderRadius: "8px",
                border: "1.5px solid #38bdf8",
                background: "rgba(14, 165, 233, 0.18)",
                color: "#e0f2fe",
                cursor: effectiveStatus === "measuring" ? "not-allowed" : "pointer",
                opacity: effectiveStatus === "measuring" ? 0.6 : 1,
              }}
            >
              Đo lại
            </button>
          </div>
        </div>
      </div>

      {/* 4. Lưu ý phân biệt số xung ghi nhận trong cửa sổ đo với hoạt độ H (Bq) */}
      <div
        role="note"
        data-testid="geiger-unit-distinction-note"
        style={{
          padding: "11px 14px",
          background: "#fffbeb",
          border: "1px solid #f59e0b",
          borderLeft: "4px solid #d97706",
          borderRadius: "8px",
          fontSize: "13px",
          lineHeight: 1.55,
          color: "#78350f",
        }}
      >
        <strong>Lưu ý bản chất số đọc của máy:</strong> Số hiển thị trên màn hình là{" "}
        <strong>số xung ghi nhận trong cửa sổ đo</strong> (ví dụ <code>5,0 giây</code>, có thể bằng{" "}
        <code>0, 1, 2, 3… xung</code> tùy sự phóng xạ ngẫu nhiên và chỉ hứng một góc nhỏ chùm tia qua cửa sổ ống đếm). Đại lượng{" "}
        <strong>Độ phóng xạ (hoạt độ) H</strong> của toàn bộ nguồn có đơn vị{" "}
        <strong>Becquerel (Bq, phân rã/giây)</strong> và được trình bày riêng trong phần{" "}
        <strong>Định luật phóng xạ &amp; Chu kì bán rã</strong>.
      </div>

      {/* 5. Hai bảng đối chiếu gắn nhãn riêng biệt: Kết quả mô phỏng của học sinh ↔ Bảng 23.1 SGK */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: "16px",
          alignItems: "start",
        }}
      >
        {/* Bảng A: Kết quả mô phỏng của học sinh */}
        <section
          data-testid="geiger-sim-results-card"
          aria-label="Kết quả mô phỏng của học sinh"
          style={{
            padding: "14px",
            borderRadius: "10px",
            border: "2px solid #0284c7",
            background: "#f8fafc",
            minWidth: 0,
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
            <span
              style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: "999px",
                background: "#e0f2fe",
                color: "#0369a1",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              Kết quả mô phỏng (Các lượt đo của em)
            </span>

            {savedRuns.length > 0 && (
              <button
                type="button"
                data-geiger-clear-saved-btn
                onClick={() =>
                  writeGeigerV3State((prev) => ({
                    ...prev,
                    savedRuns: [],
                    currentWindowSaved: false,
                  }))
                }
                style={{
                  padding: "4px 10px",
                  minHeight: "30px",
                  fontSize: "12px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Xóa các lượt đã lưu
              </button>
            )}
          </div>

          <p style={{ margin: "0 0 10px", fontSize: "12.5px", color: "#475569", lineHeight: 1.5 }}>
            Mỗi lượt lưu độc lập <strong>thời lượng cửa sổ đo</strong> và <strong>số xung ghi nhận</strong> (kể cả lượt có <code>0 xung</code>). Hãy lưu ít nhất <strong>2 lượt đo</strong> để đối chiếu tính ngẫu nhiên.
          </p>

          {savedRuns.length === 0 ? (
            <div
              style={{
                padding: "14px",
                borderRadius: "8px",
                background: "#ffffff",
                border: "1px dashed #94a3b8",
                fontSize: "13px",
                color: "#64748b",
              }}
            >
              Chưa có lượt đo nào được lưu. Hãy bấm <strong>“Bấm đo 5 giây”</strong> rồi bấm <strong>“Lưu lượt”</strong>.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table
                data-testid="geiger-sim-results-table"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "#ffffff",
                  fontSize: "13px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <thead>
                  <tr style={{ background: "#e0f2fe", textAlign: "left" }}>
                    <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Lượt đã lưu</th>
                    <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Thời lượng cửa sổ</th>
                    <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Số xung ghi nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {savedRuns.map((r, idx) => (
                    <tr key={r.id} data-geiger-saved-row={idx + 1}>
                      <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", fontWeight: 700 }}>
                        Lượt {idx + 1}
                      </td>
                      <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>
                        {r.durationSec.toFixed(1)} s
                      </td>
                      <td
                        style={{
                          padding: "8px 10px",
                          border: "1px solid #cbd5e1",
                          fontWeight: 700,
                          color: r.pulses === 0 ? "#b45309" : "#0369a1",
                        }}
                      >
                        {r.pulses} xung
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div
            role="status"
            data-geiger-saved-status={hasTwoSavedRuns ? "ready" : "pending"}
            style={{
              marginTop: "10px",
              fontSize: "12.5px",
              fontWeight: 600,
              color: hasTwoSavedRuns ? "#15803d" : "#475569",
            }}
          >
            {hasTwoSavedRuns
              ? `✓ Đã lưu ${savedRuns.length} lượt đo độc lập (khôi phục nguyên vẹn sau khi tải lại trang).`
              : `Tiến độ thực hành bộ đếm: đã lưu ${savedRuns.length}/2 lượt đo 5 giây.`}
          </div>
        </section>

        {/* Bảng B: Bảng 23.1 chuẩn SGK trang 105 */}
        <section
          data-testid="geiger-sgk-table-23-1-card"
          aria-label="Bảng 23.1 SGK Vật lí 12 trang 105"
          style={{
            padding: "14px",
            borderRadius: "10px",
            border: "2px solid #475569",
            background: "#ffffff",
            minWidth: 0,
          }}
        >
          <div style={{ marginBottom: "8px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: "999px",
                background: "#f1f5f9",
                color: "#1e293b",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              Bảng 23.1 SGK (trang 105) — Số liệu thí nghiệm trong sách giáo khoa
            </span>
          </div>

          <p style={{ margin: "0 0 10px", fontSize: "12.5px", color: "#475569", lineHeight: 1.5 }}>
            Dãy số xung chuẩn ghi nhận trong <strong>6 khoảng 5 giây liên tiếp</strong> trên SGK:{" "}
            <strong>1, 3, 2, 0, 3, 1</strong> (chú ý khoảng <code>15 – 20 s</code> có <code>0 xung</code>).
          </p>

          <div style={{ overflowX: "auto" }}>
            <table
              data-testid="sgk-table-23-1"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "13px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                  <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Khoảng thời gian (s)</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Độ rộng cửa sổ</th>
                  <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Số xung (Bảng 23.1 SGK)</th>
                </tr>
              </thead>
              <tbody>
                {SGK_TABLE_23_1_ROWS.map((row) => (
                  <tr key={row.index}>
                    <td style={{ padding: "7px 10px", border: "1px solid #cbd5e1" }}>
                      {row.windowLabel}
                    </td>
                    <td style={{ padding: "7px 10px", border: "1px solid #cbd5e1" }}>
                      {row.durationSec} s
                    </td>
                    <td
                      style={{
                        padding: "7px 10px",
                        border: "1px solid #cbd5e1",
                        fontWeight: 700,
                        color: row.pulses === 0 ? "#b45309" : "#0f172a",
                      }}
                    >
                      {row.pulses}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                  <td style={{ padding: "7px 10px", border: "1px solid #cbd5e1" }}>
                    Tổng cộng (0 – 30 s)
                  </td>
                  <td style={{ padding: "7px 10px", border: "1px solid #cbd5e1" }}>30 s</td>
                  <td style={{ padding: "7px 10px", border: "1px solid #cbd5e1" }}>10</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default GeigerApparatusV3;
