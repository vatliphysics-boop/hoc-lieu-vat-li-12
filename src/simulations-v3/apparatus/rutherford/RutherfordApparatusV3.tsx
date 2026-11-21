"use client";

/**
 * RutherfordApparatusV3 — Apparatus-first 3D Rutherford scattering simulation
 *
 * Features:
 * - Interactive 3D apparatus built from scientific equipment components
 * - 10 camera presets (orbit, front, top, cutaway, exploded, instrument POV, etc.)
 * - Click any component to see its name, function, and role
 * - Real-time physics from Coulomb scattering engine
 * - Measurement: count events, angular histogram
 * - Inquiry questions for students
 *
 * Physics model: Classical Coulomb repulsion, fixed gold nucleus.
 * References: Geiger & Marsden (1909), Rutherford (1911), CODATA 2022.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  createRutherfordRun,
  generateRutherfordDistribution,
  sampleRutherford,
  rutherfordTrail,
  RUTHERFORD_LIMITS,
  type RutherfordSettings,
} from "../../physics/rutherford-engine";
import { buildRutherfordApparatus, type BuiltComponent } from "./geometry";
import { RUTHERFORD_COMPONENTS } from "./parts";
import {
  CAMERA_PRESETS,
  type CameraMode,
} from "../../core/CameraPresets";
import type { HistogramBin } from "../../core/types";
import { RutherfordInquiryTask, type InquiryRun } from "@/components/learning/RutherfordInquiryTask";

/** Camera positions for each preset (Three.js units) */
const CAMERA_POSITIONS: Record<CameraMode, { pos: [number, number, number]; target: [number, number, number] }> = {
  orbit: { pos: [12, 10, 18], target: [0, 0, 0] },
  front: { pos: [-24, 6, 0], target: [-5, 0, 0] },
  back: { pos: [24, 6, 0], target: [5, 0, 0] },
  left: { pos: [0, 6, -20], target: [0, 0, 0] },
  right: { pos: [0, 6, 20], target: [0, 0, 0] },
  top: { pos: [2, 24, 2], target: [0, 0, 0] },
  cutaway: { pos: [14, 8, 14], target: [0, 0, 0] },
  exploded: { pos: [0, 8, 30], target: [0, 0, 0] },
  instrument: { pos: [7.5, 7.5, 0], target: [0, 0, 0] },
  measurement: { pos: [10, 12, 6], target: [0, 0, 0] },
};

/** Exploded view offsets per component */
const EXPLODED_OFFSETS: Record<string, [number, number, number]> = {
  "alpha-source": [-10, 0, 0],
  collimator: [-4, 0, 0],
  "gold-foil": [0, 0, 0],
  "scintillation-screen": [4, 0, 0],
  "rotating-microscope": [6, 4, 0],
  "angular-scale": [2, -4, 0],
  "vacuum-chamber": [0, 8, 0],
  "base-platform": [0, -4, 0],
};

export interface RutherfordApparatusV3Props {
  onProgress?: (done: boolean) => void;
}

export function RutherfordApparatusV3({ onProgress }: RutherfordApparatusV3Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    components: Map<string, BuiltComponent>;
    raycaster: THREE.Raycaster;
    trailLine: THREE.Line | null;
    frameId: number;
  } | null>(null);

  const [cameraMode, setCameraMode] = useState<CameraMode>("orbit");
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [settings, setSettings] = useState<RutherfordSettings>({
    impactFm: 10,
    energyMeV: 8,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedZs, setElapsedZs] = useState(0);
  const [showBeam, setShowBeam] = useState(true);
  const [histogram] = useState<HistogramBin[]>(() => generateRutherfordDistribution(1000, 10, 42));

  const run = useMemo(() => {
    try {
      return createRutherfordRun(settings);
    } catch {
      return null;
    }
  }, [settings]);

  const trail = useMemo(() => {
    if (!run) return null;
    return rutherfordTrail(run, run.durationZs, 80);
  }, [run]);

  const selectedComponent = useMemo(() => {
    if (!selectedPartId) return null;
    return RUTHERFORD_COMPONENTS.find((c) => c.id === selectedPartId) ?? null;
  }, [selectedPartId]);

  /** Số liệu hiện tại, dùng chung cho bảng đo và nhiệm vụ điều tra */
  const currentInquiryRun = useMemo<InquiryRun | null>(
    () =>
      run
        ? { b: settings.impactFm, e: settings.energyMeV, theta: run.scatteringAngleDeg }
        : null,
    [run, settings],
  );

  const done =
    !isRunning && elapsedZs > 0 && elapsedZs >= (run?.durationZs ?? 1);

  useEffect(() => {
    onProgress?.(done);
  }, [done, onProgress]);

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x0a0f1a, 1);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0f1a, 40, 80);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(10, 15, 12);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.4);
    fillLight.position.set(-10, -5, -10);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffaa66, 0.3);
    rimLight.position.set(0, -10, 15);
    scene.add(rimLight);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      200,
    );
    const preset = CAMERA_POSITIONS.orbit;
    camera.position.set(...preset.pos);
    camera.lookAt(...preset.target);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 8;
    controls.maxDistance = 50;
    controls.target.set(...preset.target);

    // Grid and ground
    const grid = new THREE.GridHelper(60, 30, 0x2a3a5a, 0x1a2a3a);
    grid.position.y = -6;
    scene.add(grid);

    // Build apparatus
    const components = buildRutherfordApparatus(RUTHERFORD_COMPONENTS);
    for (const [, built] of components) {
      scene.add(built.mesh);
    }

    const raycaster = new THREE.Raycaster();

    sceneRef.current = {
      renderer,
      scene,
      camera,
      controls,
      components,
      raycaster,
      trailLine: null,
      frameId: 0,
    };

    // Animation loop
    function animate() {
      if (!sceneRef.current) return;
      sceneRef.current.controls.update();
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
      sceneRef.current.frameId = requestAnimationFrame(animate);
    }
    animate();

    // Resize handler
    function onResize() {
      if (!container || !sceneRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      sceneRef.current.camera.aspect = w / h;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(w, h);
    }
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    // Click handler
    function onClick(event: MouseEvent) {
      if (!container || !sceneRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      sceneRef.current.raycaster.setFromCamera(mouse, sceneRef.current.camera);
      const allObjects: THREE.Object3D[] = [];
      for (const [, built] of sceneRef.current.components) {
        allObjects.push(built.mesh);
      }
      const hits = sceneRef.current.raycaster.intersectObjects(allObjects, true);
      if (hits.length > 0) {
        // Walk up to find the root component group
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj) {
          for (const [id, built] of sceneRef.current.components) {
            if (built.mesh === obj) {
              setSelectedPartId(id);
              return;
            }
          }
          obj = obj.parent;
        }
      } else {
        setSelectedPartId(null);
      }
    }
    renderer.domElement.addEventListener("click", onClick);

    return () => {
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.frameId);
        sceneRef.current.renderer.dispose();
        sceneRef.current.scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            if (Array.isArray(obj.material)) {
              obj.material.forEach((m) => m.dispose());
            } else {
              obj.material.dispose();
            }
          }
        });
      }
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("click", onClick);
      container.removeChild(renderer.domElement);
      sceneRef.current = null;
    };
  }, []);

  // Update camera when mode changes
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    const preset = CAMERA_POSITIONS[cameraMode];
    state.camera.position.set(...preset.pos);
    state.camera.lookAt(...preset.target);
    state.controls.target.set(...preset.target);
    state.controls.update();
  }, [cameraMode]);

  // Update exploded view positions
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    for (const [id, built] of state.components) {
      const base = built.originalPosition;
      if (cameraMode === "exploded") {
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
  }, [cameraMode]);

  // Update cutaway view visibility
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;
    // In cutaway mode, hide outer shells to reveal internal components
    for (const [id, built] of state.components) {
      if (cameraMode === "cutaway") {
        // Hide vacuum chamber (glass walls) and base platform to see inside
        built.mesh.visible = !(id === "vacuum-chamber" || id === "base-platform");
      } else {
        built.mesh.visible = true;
      }
    }
  }, [cameraMode]);

  // Update trail line from physics
  useEffect(() => {
    const state = sceneRef.current;
    if (!state) return;

    // Remove old trail
    if (state.trailLine) {
      state.scene.remove(state.trailLine);
      state.trailLine.geometry.dispose();
      (state.trailLine.material as THREE.Material).dispose();
      state.trailLine = null;
    }

    if (!trail || !run) return;

    // Take only visible portion
    const visibleCount =
      elapsedZs > 0
        ? Math.max(2, Math.floor((elapsedZs / run.durationZs) * trail.length))
        : showBeam
        ? trail.length
        : 0;

    if (visibleCount === 0) return;

    const points = trail.slice(0, visibleCount).map((s) => {
      // Map fm coordinates to Three.js units
      // Detector radius 180 fm = 7.5 units, so scale = 7.5/180
      const scale = 7.5 / 180;
      return new THREE.Vector3(s.xFm * scale, s.yFm * scale, 0);
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      linewidth: 2,
      transparent: true,
      opacity: showBeam ? 0.9 : 0.4,
    });
    const line = new THREE.Line(geometry, material);
    state.scene.add(line);
    state.trailLine = line;
  }, [trail, run, elapsedZs, showBeam]);

  // Animation timer
  useEffect(() => {
    if (!isRunning || !run) return;
    let previous = performance.now();
    let frameId: number;
    const MODEL_TIME_PER_SECOND_ZS = 5;

    function tick(now: number) {
      const delta = now - previous;
      if (delta >= 1000 / 35) {
        previous = now;
        setElapsedZs((current) => {
          const next = current + Math.min(delta / 1000, 0.12) * MODEL_TIME_PER_SECOND_ZS;
          if (next >= run!.durationZs) {
            setIsRunning(false);
            return run!.durationZs;
          }
          return next;
        });
      }
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isRunning, run]);

  // Reset when settings change
  useEffect(() => {
    setElapsedZs(0);
    setIsRunning(false);
  }, [settings]);

  function handleRunPause() {
    if (!run) return;
    if (elapsedZs >= run.durationZs) {
      setElapsedZs(0);
      setIsRunning(true);
    } else {
      setIsRunning((r) => !r);
    }
  }

  function handleReset() {
    setElapsedZs(0);
    setIsRunning(false);
    setSettings({ impactFm: 10, energyMeV: 8 });
    setCameraMode("orbit");
    setSelectedPartId(null);
  }

  const format = (n: number, digits = 1) => n.toFixed(digits);

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      {/* 3D viewport */}
      <div
        style={{
          position: "relative",
          borderRadius: "12px",
          overflow: "hidden",
          border: "1px solid var(--border-light, #cbd5e1)",
          background: "#0a0f1a",
        }}
      >
        <div
          ref={containerRef}
          style={{ width: "100%", height: "500px", display: "block" }}
          data-rutherford-canvas
        />

        {/* Camera mode selector overlay */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            maxWidth: "calc(100% - 24px)",
          }}
        >
          {CAMERA_PRESETS.map((preset) => (
            <button
              key={preset.mode}
              type="button"
              onClick={() => setCameraMode(preset.mode)}
              title={preset.description}
              style={{
                padding: "6px 10px",
                fontSize: "12px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor:
                  cameraMode === preset.mode ? "#22d3ee" : "rgba(255,255,255,0.2)",
                background:
                  cameraMode === preset.mode
                    ? "rgba(34, 211, 238, 0.2)"
                    : "rgba(0,0,0,0.5)",
                color: cameraMode === preset.mode ? "#22d3ee" : "#e0e8f0",
                cursor: "pointer",
                minHeight: "32px",
              }}
            >
              {preset.nameVi}
            </button>
          ))}
        </div>

        {/* Selected component info */}
        {selectedComponent && (
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              right: "12px",
              maxWidth: "420px",
              padding: "12px 14px",
              background: "rgba(20, 30, 50, 0.95)",
              border: "1px solid rgba(34,211,238,0.4)",
              borderRadius: "8px",
              color: "#e0e8f0",
              fontSize: "13px",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "4px", color: "#22d3ee" }}>
              {selectedComponent.nameVi}
            </div>
            <div style={{ fontStyle: "italic", color: "#94a3b8", marginBottom: "6px", fontSize: "12px" }}>
              {selectedComponent.nameEn}
            </div>
            <div>{selectedComponent.role}</div>
            <button
              type="button"
              onClick={() => setSelectedPartId(null)}
              style={{
                marginTop: "8px",
                padding: "4px 8px",
                fontSize: "11px",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "#94a3b8",
                cursor: "pointer",
              }}
            >
              Đóng
            </button>
          </div>
        )}

        {/* Hint */}
        {!selectedComponent && (
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              padding: "8px 12px",
              background: "rgba(0,0,0,0.6)",
              borderRadius: "6px",
              color: "#94a3b8",
              fontSize: "12px",
            }}
          >
            Nhấp vào linh kiện để xem tên và chức năng
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          onClick={handleRunPause}
          disabled={!run}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 600,
            borderRadius: "8px",
            border: "none",
            background: "#2b3b93",
            color: "white",
            cursor: run ? "pointer" : "not-allowed",
            minHeight: "44px",
          }}
        >
          {isRunning ? "Tạm dừng" : elapsedZs > 0 && run && elapsedZs < run.durationZs ? "Tiếp tục" : "Chạy"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          style={{
            padding: "10px 20px",
            fontSize: "14px",
            borderRadius: "8px",
            border: "1px solid var(--border-light, #cbd5e1)",
            background: "transparent",
            color: "inherit",
            cursor: "pointer",
            minHeight: "44px",
          }}
        >
          Đặt lại
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px" }}>
          <input
            type="checkbox"
            checked={showBeam}
            onChange={(e) => setShowBeam(e.target.checked)}
          />
          Hiện đường đi hạt
        </label>
      </div>

      {/* Physics controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <label style={{ display: "grid", gap: "4px" }}>
          <span style={{ fontSize: "13px", fontWeight: 500 }}>
            Tham số va chạm b: {format(settings.impactFm)} fm
          </span>
          <input
            type="range"
            min={RUTHERFORD_LIMITS.impactFm.min}
            max={RUTHERFORD_LIMITS.impactFm.max}
            step={1}
            value={settings.impactFm}
            onChange={(e) =>
              setSettings((s) => ({ ...s, impactFm: Number(e.target.value) }))
            }
          />
        </label>
        <label style={{ display: "grid", gap: "4px" }}>
          <span style={{ fontSize: "13px", fontWeight: 500 }}>
            Động năng E: {format(settings.energyMeV)} MeV
          </span>
          <input
            type="range"
            min={RUTHERFORD_LIMITS.energyMeV.min}
            max={RUTHERFORD_LIMITS.energyMeV.max}
            step={0.5}
            value={settings.energyMeV}
            onChange={(e) =>
              setSettings((s) => ({ ...s, energyMeV: Number(e.target.value) }))
            }
          />
        </label>
      </div>

      {/* Measurements */}
      {run && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "12px",
            padding: "16px",
            background: "var(--bg-surface-elevated, #f8fafc)",
            borderRadius: "10px",
          }}
        >
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", textTransform: "uppercase" }}>
              Góc tán xạ
            </div>
            <div style={{ fontSize: "20px", fontWeight: 600 }}>
              {format(run.scatteringAngleDeg)}°
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", textTransform: "uppercase" }}>
              Góc vị trí trên màn
            </div>
            <div style={{ fontSize: "20px", fontWeight: 600 }}>
              {format(run.detectorAngleDeg)}°
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", textTransform: "uppercase" }}>
              Khoảng cách gần nhất
            </div>
            <div style={{ fontSize: "20px", fontWeight: 600 }}>
              {format(run.closestApproachFm)} fm
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", textTransform: "uppercase" }}>
              Thời gian mô hình
            </div>
            <div style={{ fontSize: "20px", fontWeight: 600 }}>
              {format(elapsedZs)} zs
            </div>
          </div>
        </div>
      )}

      {/* Histogram */}
      <div>
        <h4 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
          Phân bố góc tán xạ (mô hình 1/sin⁴(θ/2))
        </h4>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "120px", padding: "8px", background: "var(--bg-surface-elevated, #f8fafc)", borderRadius: "8px" }}>
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
                  background: "#22d3ee",
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
                      color: "var(--text-muted, #64748b)",
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
        <p style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", marginTop: "24px" }}>
          Mô hình phân bố cho thấy: đa số hạt tán xạ góc nhỏ, rất ít hạt ở góc lớn — phù hợp với thí nghiệm Geiger–Marsden.
        </p>
      </div>

      {/* Nhiệm vụ điều tra cho học sinh */}
      <RutherfordInquiryTask current={currentInquiryRun} />
    </div>
  );
}

export default RutherfordApparatusV3;
