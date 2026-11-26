"use client";

/**
 * HalfLifeApparatusV3 — Mô hình hạt nhân 3D đồng bộ bảng số liệu và đồ thị N(t) / H(t) (Bq)
 * (Bài 23 — Hiện tượng phóng xạ, SGK Vật lí 12 KNTT, trang 107–109)
 *
 * Bảo đảm:
 * - Đồng bộ tuyệt đối mô hình hạt 3D, bảng số liệu và đồ thị N(t)/H(t) bằng CÙNG thời gian t và CÙNG chu kì bán rã T
 * - Điều khiển đầy đủ: Bắt đầu / Tiếp tục, Tạm dừng, Đặt lại (về t = 0) và Đổi lượt ngẫu nhiên mới
 * - Làm rõ sự đối lập giữa:
 *     (1) Tính ngẫu nhiên của từng hạt riêng lẻ (chọn theo dõi 1 hạt bất kì #k trên khối 3D)
 *     (2) Xu hướng giảm hàm mũ có quy luật của cả quần thể lớn: N(t) = N₀·2^(−t/T), H(t) = λN(t) = H₀·2^(−t/T) (Bq)
 * - Xử lí WebGL an toàn + giải phóng GPU khi rời mục + sơ đồ hạt dự phòng dùng chung đồng hồ t & chu kì T
 */

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { usePersistedLabState, useSyncLabProgress } from "@/lib/use-persisted-lab-state";
import { probeWebGLSupport } from "../rutherford/parts";
import {
  createHalfLifeEnsemble,
  evaluateHalfLifeAtTime,
} from "../../physics/half-life-engine";

export const B23_HALF_LIFE_V3_STORAGE_KEY = "b23-half-life-v3-state-v1";

export type HalfLifeChartMode = "N" | "H";

interface PersistedHalfLifeV3State {
  readonly initialCount: 64 | 125 | 216;
  readonly halfLifeSec: number;
  readonly seed: number;
  readonly chartMode: HalfLifeChartMode;
  readonly trackedIndex: number;
  readonly savedTimeSec: number;
  readonly hasObservedDecay: boolean;
  readonly hasChangedParam: boolean;
  readonly quizChoice: number | null;
  readonly quizSubmitted: boolean;
}

const INITIAL_HALF_LIFE_V3_STATE: PersistedHalfLifeV3State = {
  initialCount: 125,
  halfLifeSec: 8,
  seed: 23,
  chartMode: "H",
  trackedIndex: 0,
  savedTimeSec: 0,
  hasObservedDecay: false,
  hasChangedParam: false,
  quizChoice: null,
  quizSubmitted: false,
};

function parseHalfLifeV3State(
  raw: unknown,
  fallback: PersistedHalfLifeV3State,
): PersistedHalfLifeV3State {
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  const initialCount: 64 | 125 | 216 =
    o.initialCount === 64 || o.initialCount === 125 || o.initialCount === 216
      ? o.initialCount
      : fallback.initialCount;
  const halfLifeSec =
    typeof o.halfLifeSec === "number" && Number.isFinite(o.halfLifeSec)
      ? Math.max(4, Math.min(20, Math.round(o.halfLifeSec)))
      : fallback.halfLifeSec;
  const seed =
    typeof o.seed === "number" && Number.isFinite(o.seed) && o.seed >= 1
      ? Math.floor(o.seed)
      : fallback.seed;
  const chartMode: HalfLifeChartMode =
    o.chartMode === "N" || o.chartMode === "H" ? o.chartMode : fallback.chartMode;
  const trackedIndex =
    typeof o.trackedIndex === "number" && Number.isFinite(o.trackedIndex)
      ? Math.max(0, Math.min(initialCount - 1, Math.floor(o.trackedIndex)))
      : 0;
  const maxDuration = halfLifeSec * 4;
  const savedTimeSec =
    typeof o.savedTimeSec === "number" && Number.isFinite(o.savedTimeSec)
      ? Math.max(0, Math.min(maxDuration, Number(o.savedTimeSec)))
      : 0;

  return {
    initialCount,
    halfLifeSec,
    seed,
    chartMode,
    trackedIndex,
    savedTimeSec,
    hasObservedDecay: Boolean(o.hasObservedDecay) || savedTimeSec >= 1,
    hasChangedParam: Boolean(o.hasChangedParam),
    quizChoice:
      typeof o.quizChoice === "number" && [0, 1, 2].includes(o.quizChoice)
        ? o.quizChoice
        : null,
    quizSubmitted: Boolean(o.quizSubmitted),
  };
}

function disposeTree(root: THREE.Object3D) {
  const geos = new Set<THREE.BufferGeometry>();
  const mats = new Set<THREE.Material>();
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      if (obj.geometry && !geos.has(obj.geometry)) {
        geos.add(obj.geometry);
        obj.geometry.dispose();
      }
      const list = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const m of list) {
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
let cachedHalfLifeWebGL: boolean | null = null;
function getHalfLifeWebGLSnap(): boolean {
  if (cachedHalfLifeWebGL === null) {
    cachedHalfLifeWebGL = probeWebGLSupport();
  }
  return cachedHalfLifeWebGL;
}

const QUIZ_OPTIONS = [
  "Sau 2 chu kì bán rã (t = 2T), toàn bộ 100% hạt nhân mẹ đã phân rã hết nên N(2T) = 0 và H(2T) = 0 Bq.",
  "Không thể dự đoán thời điểm phân rã của một hạt nhân riêng lẻ, nhưng với quần thể lớn thì số hạt còn lại N(t) và độ phóng xạ H(t) = λN(t) (Bq) giảm theo quy luật hàm mũ 2^(−t/T) (sau 2T còn 1/4).",
  "Độ phóng xạ H(t) (Bq) không phụ thuộc chu kì bán rã T, chỉ phụ thuộc khối lượng bình chứa.",
] as const;
const CORRECT_QUIZ_INDEX = 1;

export interface HalfLifeApparatusV3Props {
  readonly onProgress?: (done: boolean) => void;
}

export function HalfLifeApparatusV3({ onProgress }: HalfLifeApparatusV3Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const particleMeshesRef = useRef<THREE.Mesh[]>([]);
  const trackedRingRef = useRef<THREE.Mesh | null>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    latticeGroup: THREE.Group;
    parentMat: THREE.MeshStandardMaterial;
    daughterMat: THREE.MeshStandardMaterial;
    flashMat: THREE.MeshStandardMaterial;
    frameId: number;
  } | null>(null);
  const syncParticlesRef = useRef<(() => void) | null>(null);

  const [state, setState] = usePersistedLabState(
    B23_HALF_LIFE_V3_STORAGE_KEY,
    INITIAL_HALF_LIFE_V3_STATE,
    parseHalfLifeV3State,
  );

  const {
    initialCount,
    halfLifeSec,
    seed,
    chartMode,
    trackedIndex,
    savedTimeSec,
    hasObservedDecay,
    hasChangedParam,
    quizChoice,
    quizSubmitted,
  } = state;

  const totalDurationSec = halfLifeSec * 4;
  const [liveTimeSec, setLiveTimeSec] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const timeSec = Math.min(totalDurationSec, liveTimeSec ?? savedTimeSec);
  const timeSecRef = useRef(timeSec);
  useEffect(() => {
    timeSecRef.current = timeSec;
  }, [timeSec]);

  const [webglError, setWebglError] = useState(false);
  const [isHostVisible, setIsHostVisible] = useState(true);
  const supportsWebGL = useSyncExternalStore(NOOP_SUB, getHalfLifeWebGLSnap, SERVER_SNAP);
  const isWebGLActive = supportsWebGL && !webglError;

  const ensemble = useMemo(
    () => createHalfLifeEnsemble(initialCount, halfLifeSec, seed),
    [initialCount, halfLifeSec, seed],
  );

  const currentSnapshot = useMemo(
    () => evaluateHalfLifeAtTime(ensemble, timeSec),
    [ensemble, timeSec],
  );

  const milestones = useMemo(
    () =>
      [0, 1, 2, 3, 4].map((k) => {
        const mTime = k * halfLifeSec;
        return {
          k,
          label: k === 0 ? "0" : k === 1 ? "T" : `${k}T`,
          snap: evaluateHalfLifeAtTime(ensemble, mTime),
        };
      }),
    [ensemble, halfLifeSec],
  );

  const safeTrackedIdx = Math.min(ensemble.particles.length - 1, Math.max(0, trackedIndex));
  const trackedParticle = ensemble.particles[safeTrackedIdx];
  const trackedHasDecayed = trackedParticle ? trackedParticle.decayTimeSec <= timeSec : false;

  const isQuizCorrect = quizSubmitted && quizChoice === CORRECT_QUIZ_INDEX;
  const isComplete = (hasObservedDecay || timeSec >= 1) && isQuizCorrect;
  useSyncLabProgress(isComplete, onProgress);

  // Track [hidden] ancestor so GPU context is released when leaving section
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof MutationObserver === "undefined") return;
    const check = () => setIsHostVisible(el.closest("[hidden]") === null);
    check();
    const obs = new MutationObserver(check);
    let p: HTMLElement | null = el.parentElement;
    while (p) {
      obs.observe(p, { attributes: true, attributeFilter: ["hidden"] });
      p = p.parentElement;
    }
    return () => obs.disconnect();
  }, []);

  // Shared simulation clock (drives 3D spheres, table, and N(t)/H(t) chart in lockstep!)
  useEffect(() => {
    if (!isRunning) return;
    const startWall = performance.now();
    const startSim = timeSecRef.current >= totalDurationSec ? 0 : timeSecRef.current;
    let rafId = 0;

    function tick(now: number) {
      const nextT = Math.min(totalDurationSec, startSim + (now - startWall) / 1000);
      setLiveTimeSec(nextT);
      if (nextT >= totalDurationSec) {
        setIsRunning(false);
        setState((prev) => ({
          ...prev,
          savedTimeSec: totalDurationSec,
          hasObservedDecay: true,
        }));
        return;
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isRunning, totalDurationSec, setState]);

  // Rebuild 3D lattice positions when ensemble changes
  useEffect(() => {
    const ctx = sceneRef.current;
    if (!ctx) return;

    while (ctx.latticeGroup.children.length > 0) {
      const child = ctx.latticeGroup.children[0];
      ctx.latticeGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    }
    particleMeshesRef.current = [];

    const sphereRadius = initialCount <= 64 ? 0.27 : initialCount <= 125 ? 0.22 : 0.18;
    const spread = 2.05;
    const sharedGeo = new THREE.SphereGeometry(sphereRadius, 18, 18);

    for (const p of ensemble.particles) {
      const mesh = new THREE.Mesh(sharedGeo, ctx.parentMat);
      mesh.position.set(p.gx * spread, p.gy * spread, p.gz * spread);
      mesh.userData.nucleusIndex = p.index;
      ctx.latticeGroup.add(mesh);
      particleMeshesRef.current.push(mesh);
    }

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(sphereRadius * 1.65, 0.045, 10, 32),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
    );
    ctx.latticeGroup.add(ring);
    trackedRingRef.current = ring;

    syncParticlesRef.current?.();
  }, [ensemble, initialCount]);

  // Synchronize 3D sphere materials (parent vs daughter vs recent decay flash) & tracked ring at exact timeSec
  useEffect(() => {
    const syncMaterials = () => {
      const ctx = sceneRef.current;
      if (!ctx) return;
      const meshes = particleMeshesRef.current;
      for (let i = 0; i < ensemble.particles.length; i++) {
        const p = ensemble.particles[i];
        const m = meshes[i];
        if (!m) continue;
        if (p.decayTimeSec > timeSec) {
          m.material = ctx.parentMat;
        } else if (timeSec - p.decayTimeSec <= 0.4) {
          m.material = ctx.flashMat;
        } else {
          m.material = ctx.daughterMat;
        }
      }
      if (trackedRingRef.current && meshes[safeTrackedIdx]) {
        trackedRingRef.current.position.copy(meshes[safeTrackedIdx].position);
        trackedRingRef.current.lookAt(ctx.camera.position);
      }
    };

    syncParticlesRef.current = syncMaterials;
    syncMaterials();
  }, [ensemble, timeSec, safeTrackedIdx]);

  // Initialize & dispose Three.js scene cleanly
  useEffect(() => {
    if (!isWebGLActive || !isHostVisible) return;
    const host = canvasHostRef.current;
    if (!host) return;

    const w0 = Math.max(host.clientWidth, 1);
    const h0 = Math.max(host.clientHeight, 1);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      cachedHalfLifeWebGL = false;
      queueMicrotask(() => setWebglError(true));
      return;
    }

    let disposed = false;
    renderer.setSize(w0, h0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      if (!disposed) setWebglError(true);
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x081120);

    const camera = new THREE.PerspectiveCamera(40, w0 / h0, 0.1, 120);
    camera.position.set(4.8, 3.6, 6.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 3.5;
    controls.maxDistance = 16;
    controls.target.set(0, 0, 0);
    controls.update();

    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
    keyLight.position.set(6, 10, 8);
    scene.add(keyLight);

    const parentMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0x7c2d12,
      emissiveIntensity: 0.35,
      roughness: 0.28,
      metalness: 0.2,
    });
    const daughterMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.55,
      metalness: 0.35,
    });
    const flashMat = new THREE.MeshStandardMaterial({
      color: 0x86efac,
      emissive: 0x22c55e,
      emissiveIntensity: 0.95,
      roughness: 0.15,
    });

    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 3.0, 0.24, 36),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 }),
    );
    pedestal.position.set(0, -2.55, 0);
    scene.add(pedestal);

    const latticeGroup = new THREE.Group();
    scene.add(latticeGroup);

    sceneRef.current = {
      renderer,
      scene,
      camera,
      controls,
      latticeGroup,
      parentMat,
      daughterMat,
      flashMat,
      frameId: 0,
    };

    // Build initial spheres into fresh scene
    const sphereRadius = initialCount <= 64 ? 0.27 : initialCount <= 125 ? 0.22 : 0.18;
    const spread = 2.05;
    const sharedGeo = new THREE.SphereGeometry(sphereRadius, 18, 18);
    particleMeshesRef.current = [];
    for (const p of ensemble.particles) {
      const mesh = new THREE.Mesh(sharedGeo, parentMat);
      mesh.position.set(p.gx * spread, p.gy * spread, p.gz * spread);
      mesh.userData.nucleusIndex = p.index;
      latticeGroup.add(mesh);
      particleMeshesRef.current.push(mesh);
    }
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(sphereRadius * 1.65, 0.045, 10, 32),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
    );
    latticeGroup.add(ring);
    trackedRingRef.current = ring;
    syncParticlesRef.current?.();

    const raycaster = new THREE.Raycaster();
    let downPt: { x: number; y: number } | null = null;
    const onDown = (e: PointerEvent) => {
      downPt = { x: e.clientX, y: e.clientY };
    };
    const onClick = (e: MouseEvent) => {
      if (disposed || !sceneRef.current) return;
      if (downPt && Math.hypot(e.clientX - downPt.x, e.clientY - downPt.y) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(particleMeshesRef.current, false);
      if (hits.length > 0) {
        const idx = hits[0].object.userData.nucleusIndex;
        if (typeof idx === "number") {
          setState((prev) => ({ ...prev, trackedIndex: idx }));
        }
      }
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("click", onClick);

    let last = 0;
    function animate(now = 0) {
      if (disposed || !sceneRef.current) return;
      sceneRef.current.frameId = requestAnimationFrame(animate);
      if (now - last < 33) return;
      last = now;
      sceneRef.current.controls.update();
      if (trackedRingRef.current) {
        trackedRingRef.current.lookAt(sceneRef.current.camera.position);
      }
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
    }
    animate();

    const ro = new ResizeObserver(() => {
      if (disposed || !host || !sceneRef.current) return;
      const nw = Math.max(host.clientWidth, 1);
      const nh = Math.max(host.clientHeight, 1);
      sceneRef.current.camera.aspect = nw / nh;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(nw, nh);
    });
    ro.observe(host);

    return () => {
      disposed = true;
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("click", onClick);
      ro.disconnect();
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.frameId);
        sceneRef.current.controls.dispose();
        disposeTree(sceneRef.current.scene);
      }
      try {
        renderer.forceContextLoss?.();
      } catch {
        // Ignore
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
      particleMeshesRef.current = [];
      trackedRingRef.current = null;
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWebGLActive, isHostVisible]);

  function handleStart() {
    if (timeSec >= totalDurationSec) {
      setLiveTimeSec(0);
      timeSecRef.current = 0;
    }
    setIsRunning(true);
  }

  function handlePause() {
    setIsRunning(false);
    setState((prev) => ({
      ...prev,
      savedTimeSec: Number(timeSecRef.current.toFixed(2)),
      hasObservedDecay: prev.hasObservedDecay || timeSecRef.current >= 0.8,
    }));
  }

  function handleReset() {
    setIsRunning(false);
    setLiveTimeSec(0);
    timeSecRef.current = 0;
    setState((prev) => ({
      ...prev,
      savedTimeSec: 0,
    }));
  }

  function handleNewRandomSample() {
    setIsRunning(false);
    setLiveTimeSec(0);
    timeSecRef.current = 0;
    setState((prev) => ({
      ...prev,
      seed: prev.seed + 1,
      savedTimeSec: 0,
      hasChangedParam: true,
    }));
  }

  // Build synchronized SVG chart coordinates for N(t) or H(t)
  const chartW = 540;
  const chartH = 248;
  const padL = 62;
  const padR = 20;
  const padT = 24;
  const padB = 42;
  const maxY = chartMode === "N" ? ensemble.initialCount : ensemble.initialActivityBq;
  const toX = (t: number) => padL + ((chartW - padL - padR) * t) / Math.max(0.1, totalDurationSec);
  const toY = (val: number) =>
    padT + (chartH - padT - padB) * (1 - Math.min(1, Math.max(0, val / Math.max(1e-6, maxY))));

  const expectedCurvePoints = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const t = (totalDurationSec * i) / 60;
      const snap = evaluateHalfLifeAtTime(ensemble, t);
      const val = chartMode === "N" ? snap.expectedCount : snap.expectedActivityBq;
      pts.push(`${toX(t).toFixed(1)},${toY(val).toFixed(1)}`);
    }
    return pts.join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ensemble, totalDurationSec, chartMode, maxY]);

  const simStepPoints = useMemo(() => {
    const pts: string[] = [];
    const steps = 64;
    for (let i = 0; i <= steps; i++) {
      const t = (timeSec * i) / steps;
      const snap = evaluateHalfLifeAtTime(ensemble, t);
      const val = chartMode === "N" ? snap.remainingSimCount : snap.simActivityBq;
      pts.push(`${toX(t).toFixed(1)},${toY(val).toFixed(1)}`);
    }
    return pts.join(" ");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ensemble, timeSec, chartMode, maxY, totalDurationSec]);

  const currentYVal =
    chartMode === "N" ? currentSnapshot.remainingSimCount : currentSnapshot.simActivityBq;

  return (
    <div
      ref={rootRef}
      data-testid="half-life-apparatus-v3"
      style={{
        display: "grid",
        gap: "16px",
        padding: "16px",
        background: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #cbd5e1",
        minWidth: 0,
        maxWidth: "100%",
      }}
    >
      {/* 1. Thanh điều khiển đồng hồ chung: Bắt đầu / Tạm dừng / Đặt lại + Chu kì bán rã T & Số hạt N₀ */}
      <div
        style={{
          display: "grid",
          gap: "12px",
          padding: "14px",
          background: "#0f172a",
          color: "#f8fafc",
          borderRadius: "10px",
          border: "1px solid #334155",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              data-halflife-start-btn
              onClick={handleStart}
              disabled={isRunning}
              style={{
                padding: "9px 16px",
                minHeight: "40px",
                fontSize: "13.5px",
                fontWeight: 700,
                borderRadius: "8px",
                border: "none",
                background: isRunning ? "#475569" : "#2563eb",
                color: "#ffffff",
                cursor: isRunning ? "not-allowed" : "pointer",
              }}
            >
              {timeSec > 0 && timeSec < totalDurationSec ? "Tiếp tục" : "Bắt đầu"}
            </button>

            <button
              type="button"
              data-halflife-pause-btn
              onClick={handlePause}
              disabled={!isRunning}
              style={{
                padding: "9px 16px",
                minHeight: "40px",
                fontSize: "13.5px",
                fontWeight: 700,
                borderRadius: "8px",
                border: "1px solid #f59e0b",
                background: isRunning ? "#d97706" : "#1e293b",
                color: "#ffffff",
                cursor: isRunning ? "pointer" : "not-allowed",
                opacity: isRunning ? 1 : 0.6,
              }}
            >
              Tạm dừng
            </button>

            <button
              type="button"
              data-halflife-reset-btn
              onClick={handleReset}
              style={{
                padding: "9px 16px",
                minHeight: "40px",
                fontSize: "13.5px",
                fontWeight: 700,
                borderRadius: "8px",
                border: "1px solid #94a3b8",
                background: "#1e293b",
                color: "#f8fafc",
                cursor: "pointer",
              }}
            >
              Đặt lại (t = 0)
            </button>

            <button
              type="button"
              data-halflife-reseed-btn
              onClick={handleNewRandomSample}
              style={{
                padding: "9px 14px",
                minHeight: "40px",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "8px",
                border: "1px solid #38bdf8",
                background: "rgba(14, 165, 233, 0.16)",
                color: "#bae6fd",
                cursor: "pointer",
              }}
            >
              Đổi lượt mẫu ngẫu nhiên (#{seed})
            </button>
          </div>

          <div
            data-testid="half-life-shared-clock"
            data-time-sec={timeSec.toFixed(2)}
            data-half-life-sec={halfLifeSec}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              background: "#020617",
              border: "1.5px solid #38bdf8",
              fontSize: "13.5px",
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            Thời gian chung: <span style={{ color: "#fde047" }}>t = {timeSec.toFixed(1)} s</span>{" "}
            ({(timeSec / halfLifeSec).toFixed(2)} T) · Chu kì{" "}
            <span style={{ color: "#38bdf8" }}>T = {halfLifeSec} s</span>
          </div>
        </div>

        {/* Chỉnh chu kì bán rã T, số hạt ban đầu N₀ và tua nhanh thời điểm t để kiểm tra mốc */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
            gap: "12px",
            alignItems: "end",
          }}
        >
          <label style={{ display: "grid", gap: "4px", fontSize: "12.5px" }}>
            <span>
              Chu kì bán rã chung <strong>T = {halfLifeSec} s</strong> (λ ={" "}
              {ensemble.lambdaPerSec.toFixed(3)} s⁻¹):
            </span>
            <input
              type="range"
              data-halflife-slider-t
              min={4}
              max={20}
              step={2}
              value={halfLifeSec}
              onChange={(e) => {
                const nextT = Number(e.target.value);
                setIsRunning(false);
                setLiveTimeSec(0);
                timeSecRef.current = 0;
                setState((prev) => ({
                  ...prev,
                  halfLifeSec: nextT,
                  savedTimeSec: 0,
                  hasChangedParam: true,
                }));
              }}
            />
          </label>

          <div style={{ display: "grid", gap: "4px", fontSize: "12.5px" }}>
            <span>Số hạt nhân mẹ ban đầu N₀:</span>
            <div style={{ display: "flex", gap: "6px" }}>
              {([64, 125, 216] as const).map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  data-halflife-n0-btn={cnt}
                  onClick={() => {
                    setIsRunning(false);
                    setLiveTimeSec(0);
                    timeSecRef.current = 0;
                    setState((prev) => ({
                      ...prev,
                      initialCount: cnt,
                      trackedIndex: Math.min(prev.trackedIndex, cnt - 1),
                      savedTimeSec: 0,
                      hasChangedParam: true,
                    }));
                  }}
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    minHeight: "34px",
                    fontSize: "12.5px",
                    fontWeight: 700,
                    borderRadius: "6px",
                    border: initialCount === cnt ? "1.5px solid #38bdf8" : "1px solid #475569",
                    background: initialCount === cnt ? "rgba(56, 189, 248, 0.25)" : "#1e293b",
                    color: "#f8fafc",
                    cursor: "pointer",
                  }}
                >
                  {cnt} hạt
                </button>
              ))}
            </div>
          </div>

          <label style={{ display: "grid", gap: "4px", fontSize: "12.5px" }}>
            <span>Dóng thời điểm t trên cả 3 khung (0 → 4T = {totalDurationSec} s):</span>
            <input
              type="range"
              data-halflife-scrub-t
              min={0}
              max={totalDurationSec}
              step={0.2}
              value={timeSec}
              onChange={(e) => {
                const nextT = Number(e.target.value);
                setIsRunning(false);
                setLiveTimeSec(nextT);
                timeSecRef.current = nextT;
                setState((prev) => ({
                  ...prev,
                  savedTimeSec: nextT,
                  hasObservedDecay: prev.hasObservedDecay || nextT >= 0.8,
                }));
              }}
            />
          </label>
        </div>
      </div>

      {/* 2. Khung đôi đồng bộ: Mô hình hạt nhân 3D ↔ Đồ thị N(t) / H(t) (Bq) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          gap: "16px",
          alignItems: "stretch",
        }}
      >
        {/* Cột trái: Mô hình tập hợp hạt nhân 3D + Theo dõi 1 hạt riêng lẻ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            minWidth: 0,
          }}
        >
          <div
            data-halflife-stage
            data-halflife-render-mode={
              !isWebGLActive
                ? "fallback-no-webgl"
                : isHostVisible
                  ? "webgl-active"
                  : "webgl-released"
            }
            style={{
              position: "relative",
              width: "100%",
              minHeight: "320px",
              borderRadius: "10px",
              overflow: "hidden",
              background: "#081120",
              border: "1px solid #1e293b",
            }}
          >
            {!isWebGLActive ? (
              <div
                data-testid="half-life-webgl-fallback"
                style={{ padding: "12px", color: "#f8fafc" }}
              >
                <div
                  role="status"
                  style={{
                    padding: "6px 10px",
                    marginBottom: "8px",
                    borderRadius: "6px",
                    background: "rgba(30, 41, 59, 0.95)",
                    border: "1px solid #f59e0b",
                    color: "#fef3c7",
                    fontSize: "12px",
                  }}
                >
                  <strong>Sơ đồ mẫu hạt nhân dự phòng:</strong> Đồng bộ trực tiếp với bảng và đồ thị N(t)/H(t) theo cùng t = {timeSec.toFixed(1)} s và T = {halfLifeSec} s.
                </div>
                <svg
                  viewBox="0 0 360 230"
                  role="img"
                  aria-label={`Mẫu ${ensemble.initialCount} hạt nhân tại t = ${timeSec.toFixed(1)} giây: còn ${currentSnapshot.remainingSimCount} hạt nhân mẹ chưa phân rã`}
                  style={{ width: "100%", height: "auto", display: "block" }}
                >
                  {ensemble.particles.map((p) => {
                    const cols = Math.ceil(Math.sqrt(ensemble.initialCount * 1.4));
                    const rows = Math.ceil(ensemble.initialCount / cols);
                    const col = p.index % cols;
                    const row = Math.floor(p.index / cols);
                    const cx = 24 + (col / Math.max(1, cols - 1)) * 312;
                    const cy = 22 + (row / Math.max(1, rows - 1)) * 186;
                    const undecayed = p.decayTimeSec > timeSec;
                    const isTracked = p.index === safeTrackedIdx;
                    return (
                      <g
                        key={p.index}
                        onClick={() => setState((prev) => ({ ...prev, trackedIndex: p.index }))}
                        style={{ cursor: "pointer" }}
                      >
                        {isTracked && (
                          <circle cx={cx} cy={cy} r="9.5" fill="none" stroke="#22d3ee" strokeWidth="2.2" />
                        )}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={ensemble.initialCount <= 64 ? 6.5 : 5}
                          fill={undecayed ? "#f97316" : "#475569"}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div
                ref={canvasHostRef}
                data-halflife-canvas
                style={{ width: "100%", height: "320px", cursor: "grab", touchAction: "none" }}
              />
            )}

            <div
              style={{
                position: "absolute",
                bottom: "8px",
                left: "8px",
                right: "8px",
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "6px",
                pointerEvents: "none",
                fontSize: "11.5px",
              }}
            >
              <span
                style={{
                  padding: "4px 8px",
                  borderRadius: "5px",
                  background: "rgba(15, 23, 42, 0.88)",
                  color: "#fdba74",
                  fontWeight: 700,
                }}
              >
                ● Hạt mẹ chưa phân rã: {currentSnapshot.remainingSimCount}/{ensemble.initialCount}
              </span>
              <span
                style={{
                  padding: "4px 8px",
                  borderRadius: "5px",
                  background: "rgba(15, 23, 42, 0.88)",
                  color: "#cbd5e1",
                }}
              >
                ● Đã phân rã: {currentSnapshot.decayedSimCount}
              </span>
            </div>
          </div>

          {/* Hộp làm rõ tính ngẫu nhiên của từng hạt riêng lẻ vs quy luật quần thể */}
          <div
            data-testid="single-nucleus-randomness-card"
            style={{
              padding: "12px 14px",
              borderRadius: "8px",
              background: "#eff6ff",
              border: "1px solid #93c5fd",
              borderLeft: "4px solid #0284c7",
              fontSize: "13px",
              lineHeight: 1.55,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <strong style={{ color: "#0c4a6e" }}>
                Theo dõi hạt riêng lẻ #{safeTrackedIdx + 1} (vòng tròn xanh trên mô hình):
              </strong>
              <button
                type="button"
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    trackedIndex: (safeTrackedIdx + 17) % ensemble.initialCount,
                  }))
                }
                style={{
                  padding: "3px 9px",
                  minHeight: "28px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "5px",
                  border: "1px solid #0284c7",
                  background: "#ffffff",
                  color: "#0369a1",
                  cursor: "pointer",
                }}
              >
                Chọn hạt khác
              </button>
            </div>
            <div style={{ marginTop: "4px", color: "#1e293b" }}>
              • Trạng thái tại <strong>t = {timeSec.toFixed(1)} s</strong>:{" "}
              {trackedHasDecayed ? (
                <strong style={{ color: "#b45309" }}>
                  Đã phân rã ngẫu nhiên ở t = {trackedParticle.decayTimeSec.toFixed(2)} s
                </strong>
              ) : (
                <strong style={{ color: "#15803d" }}>
                  Chưa phân rã (không thể đoán trước thời điểm phân rã khi chưa xảy ra!)
                </strong>
              )}
            </div>
            <div style={{ marginTop: "3px", fontSize: "12px", color: "#475569" }}>
              <strong>Kết luận cốt lõi:</strong> Mỗi hạt nhân riêng lẻ phân rã hoàn toàn ngẫu nhiên, nhưng cả quần thể lớn giảm đều đặn theo quy luật hàm mũ <code>2^(−t/T)</code>.
            </div>
          </div>
        </div>

        {/* Cột phải: Đồ thị N(t) và H(t) (Bq) đồng bộ cùng thời gian t và chu kì T */}
        <div
          style={{
            padding: "12px 14px",
            borderRadius: "10px",
            background: "#081120",
            color: "#f8fafc",
            border: "1px solid #1e293b",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
            <strong style={{ fontSize: "13.5px", color: "#e0f2fe" }}>
              Đồ thị đồng bộ theo t = {timeSec.toFixed(1)} s &amp; T = {halfLifeSec} s:
            </strong>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                data-chart-mode-btn="H"
                onClick={() => setState((prev) => ({ ...prev, chartMode: "H" }))}
                style={{
                  padding: "5px 10px",
                  minHeight: "32px",
                  fontSize: "12px",
                  fontWeight: 700,
                  borderRadius: "6px",
                  border: chartMode === "H" ? "1.5px solid #4ade80" : "1px solid #475569",
                  background: chartMode === "H" ? "rgba(34, 197, 94, 0.22)" : "#1e293b",
                  color: "#f8fafc",
                  cursor: "pointer",
                }}
              >
                Độ phóng xạ H(t) (Bq)
              </button>
              <button
                type="button"
                data-chart-mode-btn="N"
                onClick={() => setState((prev) => ({ ...prev, chartMode: "N" }))}
                style={{
                  padding: "5px 10px",
                  minHeight: "32px",
                  fontSize: "12px",
                  fontWeight: 700,
                  borderRadius: "6px",
                  border: chartMode === "N" ? "1.5px solid #38bdf8" : "1px solid #475569",
                  background: chartMode === "N" ? "rgba(56, 189, 248, 0.22)" : "#1e293b",
                  color: "#f8fafc",
                  cursor: "pointer",
                }}
              >
                Số hạt còn lại N(t)
              </button>
            </div>
          </div>

          <svg
            data-testid="half-life-sync-chart"
            viewBox={`0 0 ${chartW} ${chartH}`}
            role="img"
            aria-label={`Đồ thị ${chartMode === "N" ? "số hạt nhân N(t)" : "độ phóng xạ H(t) theo đơn vị Bq"} đồng bộ tại t = ${timeSec.toFixed(1)} giây`}
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            {/* Lưới ngang N₀, N₀/2, N₀/4, N₀/8 */}
            {[1, 0.5, 0.25, 0.125, 0].map((frac) => {
              const yPos = toY(frac * maxY);
              const labelVal =
                chartMode === "N"
                  ? (frac * ensemble.initialCount).toFixed(frac === 1 || frac === 0 ? 0 : 1)
                  : (frac * ensemble.initialActivityBq).toFixed(2);
              return (
                <g key={frac}>
                  <line
                    x1={padL}
                    y1={yPos}
                    x2={chartW - padR}
                    y2={yPos}
                    stroke="#1e293b"
                    strokeDasharray={frac === 0 || frac === 1 ? undefined : "3 3"}
                  />
                  <text x={padL - 6} y={yPos + 4} textAnchor="end" fill="#94a3b8" fontSize="10.5">
                    {labelVal}
                  </text>
                </g>
              );
            })}

            {/* Mốc chu kì bán rã T, 2T, 3T, 4T */}
            {[1, 2, 3, 4].map((k) => {
              const tMark = k * halfLifeSec;
              const xMark = toX(tMark);
              const yMark = toY(maxY * Math.pow(2, -k));
              return (
                <g key={k}>
                  <line
                    x1={xMark}
                    y1={yMark}
                    x2={xMark}
                    y2={chartH - padB}
                    stroke="#f59e0b"
                    strokeDasharray="4 3"
                    strokeOpacity="0.7"
                  />
                  <circle cx={xMark} cy={yMark} r="3.5" fill="#fbbf24" />
                  <text x={xMark} y={chartH - padB + 15} textAnchor="middle" fill="#fde68a" fontSize="10.5" fontWeight="700">
                    {k === 1 ? "T" : `${k}T`} ({tMark}s)
                  </text>
                </g>
              );
            })}

            {/* Trục tọa độ */}
            <path d={`M ${padL} ${padT - 6} V ${chartH - padB} H ${chartW - padR}`} fill="none" stroke="#64748b" strokeWidth="1.5" />
            <text x="10" y="15" fill="#e0f2fe" fontSize="11.5" fontWeight="700">
              {chartMode === "N" ? "N(t) (hạt)" : "H(t) (Bq)"}
            </text>
            <text x={chartW - padR} y={chartH - 6} textAnchor="end" fill="#94a3b8" fontSize="11">
              Thời gian t (s)
            </text>

            {/* Đường lý thuyết hàm mũ 2^(-t/T) */}
            <polyline
              points={expectedCurvePoints}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2.4"
              strokeDasharray="6 4"
            />

            {/* Đường bậc thang thực tế của khối 3D tính tới t */}
            <polyline points={simStepPoints} fill="none" stroke="#4ade80" strokeWidth="2.6" />

            {/* Con trỏ thời gian hiện tại t */}
            <line x1={toX(timeSec)} y1={padT} x2={toX(timeSec)} y2={chartH - padB} stroke="#fde047" strokeWidth="1.6" />
            <circle cx={toX(timeSec)} cy={toY(currentYVal)} r="5" fill="#4ade80" stroke="#ffffff" strokeWidth="1.4" />
          </svg>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "11.5px", color: "#cbd5e1", marginTop: "6px" }}>
            <span>
              <strong style={{ color: "#4ade80" }}>━</strong> Khối hạt 3D thực tế ({chartMode === "N" ? `${currentSnapshot.remainingSimCount} hạt` : `${currentSnapshot.simActivityBq.toFixed(2)} Bq`})
            </span>
            <span>
              <strong style={{ color: "#60a5fa" }}>┅</strong> Quy luật lý thuyết{" "}
              {chartMode === "N"
                ? `N(t) = N₀·2^(−t/T) = ${currentSnapshot.expectedCount.toFixed(1)} hạt`
                : `H(t) = H₀·2^(−t/T) = ${currentSnapshot.expectedActivityBq.toFixed(2)} Bq`}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Bảng số liệu đồng bộ cùng thời gian t và chu kì bán rã T (trình bày rõ hoạt độ H theo đơn vị Bq) */}
      <div style={{ overflowX: "auto" }}>
        <table
          data-testid="half-life-sync-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
            background: "#ffffff",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Mốc thời gian</th>
              <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>t (giây)</th>
              <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>N_mẫu trên 3D (hạt)</th>
              <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>N(t) lý thuyết (hạt)</th>
              <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Hoạt độ H(t) = λN(t) (Bq)</th>
            </tr>
          </thead>
          <tbody>
            <tr
              data-testid="half-life-live-row"
              style={{ background: "#fef9c3", fontWeight: 700 }}
            >
              <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>
                ▶ Đang xem ({currentSnapshot.elapsedHalfLives.toFixed(2)} T)
              </td>
              <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>
                {timeSec.toFixed(1)} s
              </td>
              <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", color: "#c2410c" }}>
                {currentSnapshot.remainingSimCount}
              </td>
              <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>
                {currentSnapshot.expectedCount.toFixed(1)}
              </td>
              <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", color: "#0369a1" }}>
                {currentSnapshot.expectedActivityBq.toFixed(2)} Bq
              </td>
            </tr>
            {milestones.map((m) => {
              const reached = timeSec + 1e-6 >= m.snap.timeSec;
              return (
                <tr
                  key={m.k}
                  style={{ background: reached ? "#f0fdf4" : "#ffffff" }}
                >
                  <td style={{ padding: "7px 10px", border: "1px solid #cbd5e1", fontWeight: 600 }}>
                    Mốc {m.label} {reached ? "✓" : ""}
                  </td>
                  <td style={{ padding: "7px 10px", border: "1px solid #cbd5e1" }}>
                    {m.snap.timeSec.toFixed(1)} s
                  </td>
                  <td style={{ padding: "7px 10px", border: "1px solid #cbd5e1" }}>
                    {m.snap.remainingSimCount}
                  </td>
                  <td style={{ padding: "7px 10px", border: "1px solid #cbd5e1" }}>
                    {m.snap.expectedCount.toFixed(1)}
                  </td>
                  <td style={{ padding: "7px 10px", border: "1px solid #cbd5e1" }}>
                    {m.snap.expectedActivityBq.toFixed(2)} Bq
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Câu hỏi tự kiểm tra & tiến độ hoàn thành */}
      <div
        style={{
          padding: "14px",
          borderRadius: "10px",
          background: "#f8fafc",
          border: "1px solid #cbd5e1",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px", color: "#0f172a" }}>
          Kiểm tra hiểu biết về tính ngẫu nhiên vi mô, chu kì bán rã T và hoạt độ H (Bq):
        </div>
        <div style={{ display: "grid", gap: "8px", marginBottom: "10px" }}>
          {QUIZ_OPTIONS.map((opt, idx) => (
            <label
              key={idx}
              style={{
                display: "flex",
                gap: "8px",
                alignItems: "flex-start",
                padding: "8px 12px",
                borderRadius: "6px",
                border: quizChoice === idx ? "2px solid #0f62fe" : "1px solid #cbd5e1",
                background: quizChoice === idx ? "#edf5ff" : "#ffffff",
                cursor: "pointer",
                fontSize: "13.5px",
              }}
            >
              <input
                type="radio"
                name="b23-halflife-v3-quiz"
                checked={quizChoice === idx}
                onChange={() =>
                  setState((prev) => ({
                    ...prev,
                    quizChoice: idx,
                    quizSubmitted: false,
                  }))
                }
                style={{ marginTop: "3px" }}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
        <button
          type="button"
          data-submit-halflife-quiz
          disabled={quizChoice === null}
          onClick={() => setState((prev) => ({ ...prev, quizSubmitted: true }))}
          style={{
            padding: "8px 16px",
            minHeight: "38px",
            fontSize: "13.5px",
            fontWeight: 700,
            borderRadius: "7px",
            border: "none",
            background: quizChoice !== null ? "#1d4ed8" : "#94a3b8",
            color: "#ffffff",
            cursor: quizChoice !== null ? "pointer" : "not-allowed",
          }}
        >
          Kiểm tra câu trả lời
        </button>

        {quizSubmitted && (
          <div
            role="status"
            style={{
              marginTop: "10px",
              padding: "10px 12px",
              borderRadius: "6px",
              background: isQuizCorrect ? "#ecfdf5" : "#fef2f2",
              borderLeft: isQuizCorrect ? "4px solid #16a34a" : "4px solid #dc2626",
              fontSize: "13px",
              lineHeight: 1.55,
            }}
          >
            {isQuizCorrect
              ? "✓ Chính xác! Từng hạt nhân phân rã ngẫu nhiên không biết trước, còn cả quần thể lớn giảm theo hàm mũ N(t) = N₀·2^(−t/T) và hoạt độ H(t) = λN(t) = H₀·2^(−t/T) (đơn vị Bq)."
              : "Chưa chính xác. Hãy bấm Bắt đầu và dừng ở mốc t = 2T để quan sát: sau mỗi chu kì T mẫu giảm đi một nửa số hạt hiện có, nên sau 2T mẫu còn 1/4 chứ không về 0."}
          </div>
        )}

        <div style={{ marginTop: "10px", fontSize: "12.5px", color: "#475569" }}>
          Tiến độ hoàn thành mục: Vận hành đồng hồ bán rã (≥ 1 s){" "}
          {hasObservedDecay || timeSec >= 1 ? "✓" : "○"} · Trả lời đúng câu hỏi{" "}
          {isQuizCorrect ? "✓" : "○"}
          {hasChangedParam ? " · Đã thử thay đổi tham số ✓" : ""}
          {isComplete && <strong style={{ color: "#15803d" }}> — ✓ Đã hoàn thành!</strong>}
        </div>
      </div>
    </div>
  );
}

export default HalfLifeApparatusV3;
