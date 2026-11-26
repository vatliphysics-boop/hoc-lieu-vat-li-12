"use client";

/**
 * RadiationFieldApparatusV3 — Buồng sương & Vùng điện – từ trường 3D khảo sát α, β⁻, β⁺, γ
 * (Bài 23 — Hiện tượng phóng xạ, SGK Vật lí 12 KNTT, trang 105–107, Hình 23.3a, 23.3b & 23.4)
 *
 * Bảo đảm:
 * - Phân biệt rõ “Vết ngưng tụ quan sát được” (giọt sương quanh ion dọc đường bay; γ không tạo vệt trực tiếp)
 *   với “Đường đi trong Mô hình giải thích” (quỹ đạo lý tưởng, điện tích, vectơ lực F_E / F_B)
 * - Dựng bộ phận tạo trường 3D phù hợp riêng cho Điện trường (2 bản cực phẳng song song +/-)
 *   và Từ trường (cặp cực nam châm / cuộn dây N–S vuông góc mặt phẳng bay)
 * - Bật từng loại trường, Đảo cực và quan sát α, β⁻, β⁺, γ (riêng từng tia hoặc đồng thời cả 4 tia)
 * - Xử lí WebGL an toàn + giải phóng GPU khi rời mục + sơ đồ dự phòng SVG dùng chung trạng thái
 */

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { usePersistedLabState, useSyncLabProgress } from "@/lib/use-persisted-lab-state";
import { probeWebGLSupport } from "../rutherford/parts";
import {
  computeRadiationFieldTrajectory,
  getFieldVectors,
  getRadiationSpeciesMeta,
  getTransmissionFactor,
  RADIATION_SPECIES_LIST,
  type AbsorberMaterial,
  type FieldPolarity,
  type FieldRegionMode,
  type RadiationSpecies,
} from "../../physics/radiation-field-engine";

export const B23_RADIATION_FIELD_STORAGE_KEY = "b23-radiation-field-v3-v1";

export type BeamSelectionMode = "all" | RadiationSpecies;

interface PersistedRadiationFieldState {
  readonly beamSelection: BeamSelectionMode;
  readonly fieldMode: FieldRegionMode;
  readonly polarity: FieldPolarity;
  readonly absorber: AbsorberMaterial;
  readonly showCondensation: boolean;
  readonly showExplanatoryModel: boolean;
  readonly testedElectric: boolean;
  readonly testedMagnetic: boolean;
  readonly testedPolarityFlip: boolean;
  readonly quizChoice: number | null;
  readonly quizSubmitted: boolean;
}

const INITIAL_RADIATION_FIELD_STATE: PersistedRadiationFieldState = {
  beamSelection: "all",
  fieldMode: "electric",
  polarity: "normal",
  absorber: "none",
  showCondensation: true,
  showExplanatoryModel: true,
  testedElectric: true,
  testedMagnetic: false,
  testedPolarityFlip: false,
  quizChoice: null,
  quizSubmitted: false,
};

function parseRadiationFieldState(
  raw: unknown,
  fallback: PersistedRadiationFieldState,
): PersistedRadiationFieldState {
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  const validBeam =
    o.beamSelection === "all" ||
    o.beamSelection === "alpha" ||
    o.beamSelection === "beta_minus" ||
    o.beamSelection === "beta_plus" ||
    o.beamSelection === "gamma"
      ? o.beamSelection
      : fallback.beamSelection;
  const validField: FieldRegionMode =
    o.fieldMode === "none" || o.fieldMode === "electric" || o.fieldMode === "magnetic"
      ? o.fieldMode
      : fallback.fieldMode;
  const validPolarity: FieldPolarity =
    o.polarity === "normal" || o.polarity === "reversed" ? o.polarity : fallback.polarity;
  const validAbsorber: AbsorberMaterial =
    o.absorber === "none" ||
    o.absorber === "paper" ||
    o.absorber === "aluminum" ||
    o.absorber === "lead"
      ? o.absorber
      : fallback.absorber;

  return {
    beamSelection: validBeam,
    fieldMode: validField,
    polarity: validPolarity,
    absorber: validAbsorber,
    showCondensation:
      typeof o.showCondensation === "boolean" ? o.showCondensation : fallback.showCondensation,
    showExplanatoryModel:
      typeof o.showExplanatoryModel === "boolean"
        ? o.showExplanatoryModel
        : fallback.showExplanatoryModel,
    testedElectric: Boolean(o.testedElectric) || validField === "electric",
    testedMagnetic: Boolean(o.testedMagnetic) || validField === "magnetic",
    testedPolarityFlip: Boolean(o.testedPolarityFlip) || validPolarity === "reversed",
    quizChoice:
      typeof o.quizChoice === "number" && [0, 1, 2, 3].includes(o.quizChoice)
        ? o.quizChoice
        : null,
    quizSubmitted: Boolean(o.quizSubmitted),
  };
}

function disposeThreeTree(root: THREE.Object3D) {
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
let cachedFieldWebGL: boolean | null = null;
function getFieldWebGLSnap(): boolean {
  if (cachedFieldWebGL === null) {
    cachedFieldWebGL = probeWebGLSupport();
  }
  return cachedFieldWebGL;
}

const ABSORBER_LABELS: Record<AbsorberMaterial, string> = {
  none: "Không đặt vật chắn",
  paper: "Tờ giấy (~1 mm)",
  aluminum: "Tấm nhôm (vài mm)",
  lead: "Khối chì dày (vài cm)",
};

const QUIZ_OPTIONS = [
  "Tia α lệch mạnh hơn tia β⁻ vì điện tích +2e có độ lớn gấp đôi −e; tia γ lệch nhẹ về bản dương.",
  "Trong cả điện trường và từ trường, tia β⁻ và β⁺ lệch mạnh theo hai chiều ngược nhau, tia α lệch cùng chiều với β⁺ nhưng ít cong hơn nhiều (do m_α ≈ 7 300 m_e), còn tia γ đi thẳng không lệch.",
  "Khi đảo cực điện trường hoặc đảo cực từ trường, chiều lệch của α, β⁻, β⁺ giữ nguyên không đổi.",
  "Trong buồng sương, tia γ để lại vệt ngưng tụ dày và đậm nhất vì đâm xuyên mạnh nhất.",
] as const;
const CORRECT_QUIZ_INDEX = 1;

export interface RadiationFieldApparatusV3Props {
  readonly onProgress?: (done: boolean) => void;
}

export function RadiationFieldApparatusV3({ onProgress }: RadiationFieldApparatusV3Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const dynamicGroupRef = useRef<THREE.Group | null>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;
    frameId: number;
  } | null>(null);
  const syncSceneRef = useRef<(() => void) | null>(null);

  const [state, setState] = usePersistedLabState(
    B23_RADIATION_FIELD_STORAGE_KEY,
    INITIAL_RADIATION_FIELD_STATE,
    parseRadiationFieldState,
  );

  const {
    beamSelection,
    fieldMode,
    polarity,
    absorber,
    showCondensation,
    showExplanatoryModel,
    testedElectric,
    testedMagnetic,
    testedPolarityFlip,
    quizChoice,
    quizSubmitted,
  } = state;

  const [webglError, setWebglError] = useState(false);
  const [isHostVisible, setIsHostVisible] = useState(true);
  const supportsWebGL = useSyncExternalStore(NOOP_SUB, getFieldWebGLSnap, SERVER_SNAP);
  const isWebGLActive = supportsWebGL && !webglError;

  const activeSpeciesList: readonly RadiationSpecies[] = useMemo(
    () =>
      beamSelection === "all"
        ? (["alpha", "beta_minus", "beta_plus", "gamma"] as const)
        : [beamSelection],
    [beamSelection],
  );

  const trajectories = useMemo(
    () =>
      activeSpeciesList.map((sp) =>
        computeRadiationFieldTrajectory(sp, fieldMode, polarity, absorber),
      ),
    [activeSpeciesList, fieldMode, polarity, absorber],
  );

  const isQuizCorrect = quizSubmitted && quizChoice === CORRECT_QUIZ_INDEX;
  const isComplete = testedElectric && testedMagnetic && testedPolarityFlip && isQuizCorrect;
  useSyncLabProgress(isComplete, onProgress);

  // Track [hidden] ancestor so GPU context is freed when leaving section
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

  // Sync dynamic 3D field hardware (E plates vs B coils), absorber slab, condensation droplets & explanatory curves
  useEffect(() => {
    const rebuildDynamic3D = () => {
      const ctx = sceneRef.current;
      if (!ctx) return;
      if (dynamicGroupRef.current) {
        ctx.scene.remove(dynamicGroupRef.current);
        disposeThreeTree(dynamicGroupRef.current);
        dynamicGroupRef.current = null;
      }

      const dyn = new THREE.Group();

      // 1) Field-generating 3D apparatus appropriate to fieldMode
      if (fieldMode === "electric") {
        const topPositive = polarity === "normal";
        const posMat = new THREE.MeshStandardMaterial({
          color: 0xdc2626,
          metalness: 0.45,
          roughness: 0.32,
        });
        const negMat = new THREE.MeshStandardMaterial({
          color: 0x2563eb,
          metalness: 0.45,
          roughness: 0.32,
        });

        const topPlate = new THREE.Mesh(
          new THREE.BoxGeometry(6.2, 0.22, 2.8),
          topPositive ? posMat : negMat,
        );
        topPlate.position.set(0, 2.52, 0);
        dyn.add(topPlate);

        const bottomPlate = new THREE.Mesh(
          new THREE.BoxGeometry(6.2, 0.22, 2.8),
          topPositive ? negMat : posMat,
        );
        bottomPlate.position.set(0, -2.52, 0);
        dyn.add(bottomPlate);

        // HV feedthrough posts
        const postMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.8, roughness: 0.2 });
        const topPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.55, 16), postMat);
        topPost.position.set(0, 2.88, 0);
        dyn.add(topPost);
        const botPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.55, 16), postMat);
        botPost.position.set(0, -2.88, 0);
        dyn.add(botPost);

        // Translucent E-field lines between plates (from + to -)
        if (showExplanatoryModel) {
          const eArrowMat = new THREE.MeshBasicMaterial({
            color: 0xfde047,
            transparent: true,
            opacity: 0.38,
          });
          const dirDown = topPositive;
          for (const ex of [-2.0, 0, 2.0]) {
            const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 4.1, 8), eArrowMat);
            shaft.position.set(ex, 0, -0.5);
            dyn.add(shaft);
            const cone = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.28, 12), eArrowMat);
            cone.position.set(ex, dirDown ? -2.05 : 2.05, -0.5);
            if (dirDown) cone.rotation.x = Math.PI;
            dyn.add(cone);
          }
        }
      } else if (fieldMode === "magnetic") {
        // Pair of electromagnetic Helmholtz coils & N-S pole shoes on +Z (front) and -Z (back)
        const frontIsNorth = polarity === "normal"; // normal: N at +Z, S at -Z => B points -Z (into screen ⊗)
        const northMat = new THREE.MeshStandardMaterial({
          color: 0xb91c1c,
          transparent: true,
          opacity: 0.55,
          metalness: 0.4,
          roughness: 0.3,
        });
        const southMat = new THREE.MeshStandardMaterial({
          color: 0x1d4ed8,
          transparent: true,
          opacity: 0.55,
          metalness: 0.4,
          roughness: 0.3,
        });
        const copperCoilMat = new THREE.MeshStandardMaterial({
          color: 0xd97706,
          metalness: 0.72,
          roughness: 0.28,
        });

        // Back pole (-Z)
        const backPole = new THREE.Mesh(
          new THREE.CylinderGeometry(2.35, 2.35, 0.48, 36),
          frontIsNorth ? southMat : northMat,
        );
        backPole.rotation.x = Math.PI / 2;
        backPole.position.set(0, 0, -1.88);
        dyn.add(backPole);

        const backCoil = new THREE.Mesh(new THREE.TorusGeometry(2.42, 0.18, 14, 48), copperCoilMat);
        backCoil.position.set(0, 0, -1.88);
        dyn.add(backCoil);

        // Front coil ring (+Z, open center ring so students see clearly into the cloud chamber!)
        const frontCoil = new THREE.Mesh(new THREE.TorusGeometry(2.42, 0.18, 14, 48), copperCoilMat);
        frontCoil.position.set(0, 0, 1.88);
        dyn.add(frontCoil);

        const frontPoleRing = new THREE.Mesh(
          new THREE.TorusGeometry(2.18, 0.12, 12, 48),
          frontIsNorth ? northMat : southMat,
        );
        frontPoleRing.position.set(0, 0, 1.78);
        dyn.add(frontPoleRing);

        if (showExplanatoryModel) {
          const bMat = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.42,
          });
          const intoScreen = frontIsNorth; // +Z -> -Z
          for (const bx of [-1.6, 0, 1.6]) {
            for (const by of [-1.1, 1.1]) {
              const bShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 3.0, 8), bMat);
              bShaft.rotation.x = Math.PI / 2;
              bShaft.position.set(bx, by, 0);
              dyn.add(bShaft);
              const bTip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.26, 10), bMat);
              bTip.rotation.x = intoScreen ? -Math.PI / 2 : Math.PI / 2;
              bTip.position.set(bx, by, intoScreen ? -1.42 : 1.42);
              dyn.add(bTip);
            }
          }
        }
      }

      // 2) Optional Absorber Sheet at x = +3.65 (Hình 23.4 SGK)
      if (absorber !== "none") {
        const thickness = absorber === "paper" ? 0.06 : absorber === "aluminum" ? 0.18 : 0.55;
        const absColor =
          absorber === "paper" ? 0xf8fafc : absorber === "aluminum" ? 0x94a3b8 : 0x334155;
        const slab = new THREE.Mesh(
          new THREE.BoxGeometry(thickness, 4.6, 2.5),
          new THREE.MeshStandardMaterial({
            color: absColor,
            roughness: absorber === "paper" ? 0.9 : 0.35,
            metalness: absorber === "paper" ? 0.05 : 0.65,
          }),
        );
        slab.position.set(3.65, 0, 0);
        dyn.add(slab);
      }

      // 3) Render Layer 1 (Condensation Droplets) & Layer 2 (Explanatory Model Curves)
      for (const traj of trajectories) {
        const meta = getRadiationSpeciesMeta(traj.species);
        const zOffset =
          beamSelection === "all"
            ? traj.species === "alpha"
              ? 0.28
              : traj.species === "beta_minus"
                ? 0.1
                : traj.species === "beta_plus"
                  ? -0.1
                  : -0.28
            : 0;

        if (showCondensation) {
          const dropMat = new THREE.MeshBasicMaterial({
            color: traj.species === "gamma" ? 0xbbf7d0 : 0xe2e8f0,
            transparent: true,
            opacity: traj.species === "alpha" ? 0.88 : 0.68,
          });
          for (const drop of traj.condensationDroplets) {
            const sphere = new THREE.Mesh(
              new THREE.SphereGeometry(drop.radius, 8, 8),
              dropMat,
            );
            sphere.position.set(drop.x, drop.y, drop.z + zOffset);
            dyn.add(sphere);
          }
        }

        if (showExplanatoryModel && traj.explanatoryPoints.length >= 2) {
          const pts = traj.explanatoryPoints.map(
            (p) => new THREE.Vector3(p.x, p.y, p.z + zOffset),
          );
          const curve = new THREE.CatmullRomCurve3(pts);
          const radius = traj.species === "alpha" ? 0.075 : 0.052;
          const transFactor = getTransmissionFactor(traj.species, absorber);
          const tube = new THREE.Mesh(
            new THREE.TubeGeometry(curve, 48, radius, 10, false),
            new THREE.MeshBasicMaterial({
              color: new THREE.Color(meta.colorHex),
              transparent: transFactor < 1 && transFactor > 0,
              opacity: transFactor === 0.22 ? 0.65 : 1,
            }),
          );
          dyn.add(tube);

          // Arrowhead at end of explanatory curve
          const last = pts[pts.length - 1];
          const prev = pts[pts.length - 2];
          const dir = last.clone().sub(prev).normalize();
          const tip = new THREE.Mesh(
            new THREE.ConeGeometry(radius * 2.3, 0.28, 12),
            new THREE.MeshBasicMaterial({ color: new THREE.Color(meta.colorHex) }),
          );
          tip.position.copy(last);
          tip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          dyn.add(tip);
        }
      }

      ctx.scene.add(dyn);
      dynamicGroupRef.current = dyn;
    };

    syncSceneRef.current = rebuildDynamic3D;
    rebuildDynamic3D();
  }, [trajectories, fieldMode, polarity, absorber, showCondensation, showExplanatoryModel, beamSelection]);

  // Setup & teardown Three.js scene
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
      cachedFieldWebGL = false;
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
    scene.background = new THREE.Color(0x070e1b);

    const camera = new THREE.PerspectiveCamera(40, w0 / h0, 0.1, 150);
    camera.position.set(0.2, 1.8, 12.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4.5;
    controls.maxDistance = 24;
    controls.target.set(0.1, 0, 0);
    controls.update();

    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(7, 12, 10);
    scene.add(dirLight);

    // Static apparatus: Lead collimator block on left (-5.35, 0, 0) + Cloud chamber floor & glass frame
    const staticGroup = new THREE.Group();
    const leadBlock = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 1.7, 1.7),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.65, roughness: 0.35 }),
    );
    leadBlock.position.set(-5.35, 0, 0);
    staticGroup.add(leadBlock);

    const bore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.4, 20),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
    );
    bore.rotation.z = Math.PI / 2;
    bore.position.set(-4.58, 0, 0);
    staticGroup.add(bore);

    // Dark cooled condensation base plate of cloud chamber
    const chamberFloor = new THREE.Mesh(
      new THREE.BoxGeometry(9.6, 0.16, 3.3),
      new THREE.MeshStandardMaterial({ color: 0x0b1324, roughness: 0.7, metalness: 0.2 }),
    );
    chamberFloor.position.set(0.3, -2.78, 0);
    staticGroup.add(chamberFloor);

    // Subtle glass chamber wireframe edges
    const chamberBoxGeo = new THREE.BoxGeometry(9.6, 5.4, 3.3);
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(chamberBoxGeo),
      new THREE.LineBasicMaterial({ color: 0x334155 }),
    );
    edges.position.set(0.3, -0.05, 0);
    staticGroup.add(edges);

    scene.add(staticGroup);

    sceneRef.current = { renderer, scene, camera, controls, frameId: 0 };
    syncSceneRef.current?.();

    let last = 0;
    function animate(now = 0) {
      if (disposed || !sceneRef.current) return;
      sceneRef.current.frameId = requestAnimationFrame(animate);
      if (now - last < 33) return;
      last = now;
      sceneRef.current.controls.update();
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
      ro.disconnect();
      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.frameId);
        sceneRef.current.controls.dispose();
        disposeThreeTree(sceneRef.current.scene);
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
      dynamicGroupRef.current = null;
      sceneRef.current = null;
    };
  }, [isWebGLActive, isHostVisible]);

  const fieldVectors = getFieldVectors(fieldMode, polarity);

  return (
    <div
      ref={rootRef}
      data-testid="radiation-field-apparatus-v3"
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
      {/* 1. Thanh điều khiển loại trường (Tắt / Điện trường E / Từ trường B), Đảo cực & Chọn tia α, β⁻, β⁺, γ */}
      <div
        style={{
          display: "grid",
          gap: "12px",
          padding: "14px",
          background: "#f8fafc",
          border: "1px solid #cbd5e1",
          borderRadius: "10px",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <strong style={{ fontSize: "13.5px", color: "#0f172a", marginRight: "4px" }}>
            1. Chọn vùng trường 3D:
          </strong>
          {(
            [
              { mode: "none", label: "Buồng sương tự do (Tắt trường)" },
              { mode: "electric", label: "⚡ Điện trường đều E (2 bản tụ phẳng)" },
              { mode: "magnetic", label: "🧲 Từ trường đều B (Cực nam châm N–S)" },
            ] as const
          ).map((item) => {
            const active = fieldMode === item.mode;
            return (
              <button
                key={item.mode}
                type="button"
                data-field-mode-btn={item.mode}
                onClick={() =>
                  setState((prev) => ({
                    ...prev,
                    fieldMode: item.mode,
                    testedElectric: prev.testedElectric || item.mode === "electric",
                    testedMagnetic: prev.testedMagnetic || item.mode === "magnetic",
                  }))
                }
                style={{
                  padding: "7px 12px",
                  minHeight: "38px",
                  fontSize: "13px",
                  fontWeight: 700,
                  borderRadius: "7px",
                  border: active ? "2px solid #0f62fe" : "1px solid #94a3b8",
                  background: active ? "#edf5ff" : "#ffffff",
                  color: active ? "#002d9c" : "#0f172a",
                  cursor: "pointer",
                }}
              >
                {item.label}
              </button>
            );
          })}

          {fieldMode !== "none" && (
            <button
              type="button"
              data-flip-polarity-btn
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  polarity: prev.polarity === "normal" ? "reversed" : "normal",
                  testedPolarityFlip: true,
                }))
              }
              style={{
                padding: "7px 14px",
                minHeight: "38px",
                fontSize: "13px",
                fontWeight: 700,
                borderRadius: "7px",
                border: "1.5px solid #d97706",
                background: "#fffbeb",
                color: "#92400e",
                cursor: "pointer",
              }}
            >
              ⇄ Đảo cực{" "}
              {fieldMode === "electric"
                ? polarity === "normal"
                  ? "(Đang: Trên + / Dưới −)"
                  : "(Đang: Trên − / Dưới +)"
                : polarity === "normal"
                  ? "(Đang: B ⊗ hướng vào trong)"
                  : "(Đang: B ⊙ hướng ra ngoài)"}
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <strong style={{ fontSize: "13.5px", color: "#0f172a", marginRight: "4px" }}>
            2. Tia phóng xạ khảo sát:
          </strong>
          <button
            type="button"
            data-beam-select-btn="all"
            onClick={() => setState((prev) => ({ ...prev, beamSelection: "all" }))}
            style={{
              padding: "6px 12px",
              minHeight: "36px",
              fontSize: "13px",
              fontWeight: 700,
              borderRadius: "6px",
              border: beamSelection === "all" ? "2px solid #0f62fe" : "1px solid #94a3b8",
              background: beamSelection === "all" ? "#edf5ff" : "#ffffff",
              color: beamSelection === "all" ? "#002d9c" : "#0f172a",
              cursor: "pointer",
            }}
          >
            Cả 4 tia (α, β⁻, β⁺, γ)
          </button>
          {RADIATION_SPECIES_LIST.map((sp) => {
            const active = beamSelection === sp.id;
            return (
              <button
                key={sp.id}
                type="button"
                data-beam-select-btn={sp.id}
                onClick={() => setState((prev) => ({ ...prev, beamSelection: sp.id }))}
                style={{
                  padding: "6px 12px",
                  minHeight: "36px",
                  fontSize: "13px",
                  fontWeight: 700,
                  borderRadius: "6px",
                  border: active ? "2px solid #0f62fe" : "1px solid #94a3b8",
                  background: active ? "#edf5ff" : "#ffffff",
                  color: active ? "#002d9c" : "#0f172a",
                  cursor: "pointer",
                }}
              >
                {sp.nameVi}
              </button>
            );
          })}
        </div>

        {/* Tấm chắn kiểm chứng độ đâm xuyên Hình 23.4 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <strong style={{ fontSize: "13.5px", color: "#0f172a", marginRight: "4px" }}>
            3. Vật chắn (Hình 23.4):
          </strong>
          {(Object.keys(ABSORBER_LABELS) as AbsorberMaterial[]).map((abs) => {
            const active = absorber === abs;
            return (
              <button
                key={abs}
                type="button"
                data-absorber-btn={abs}
                onClick={() => setState((prev) => ({ ...prev, absorber: abs }))}
                style={{
                  padding: "5px 10px",
                  minHeight: "34px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: active ? "1.5px solid #0f62fe" : "1px solid #cbd5e1",
                  background: active ? "#e0f2fe" : "#ffffff",
                  color: "#0f172a",
                  cursor: "pointer",
                }}
              >
                {ABSORBER_LABELS[abs]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Phân biệt rạch ròi 2 lớp hiển thị: Vết ngưng tụ thực nghiệm vs Đường đi trong Mô hình giải thích */}
      <div
        role="group"
        aria-label="Phân biệt vết ngưng tụ buồng sương và đường đi trong Mô hình giải thích"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))",
          gap: "10px",
        }}
      >
        <label
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            padding: "10px 12px",
            borderRadius: "8px",
            border: showCondensation ? "1.5px solid #16a34a" : "1px solid #cbd5e1",
            background: showCondensation ? "#f0fdf4" : "#ffffff",
            cursor: "pointer",
            fontSize: "13px",
            lineHeight: 1.45,
          }}
        >
          <input
            type="checkbox"
            data-toggle-condensation-layer
            checked={showCondensation}
            onChange={(e) =>
              setState((prev) => ({ ...prev, showCondensation: e.target.checked }))
            }
            style={{ marginTop: "3px" }}
          />
          <span>
            <strong style={{ display: "block", color: "#14532d" }}>
              Lớp 1: Vết ngưng tụ quan sát được (Thực nghiệm buồng sương)
            </strong>
            <span style={{ fontSize: "12px", color: "#475569" }}>
              Các giọt sương hơi rượu/nước ngưng tụ quanh ion: vết α dày đậm, vết β mảnh dài; tia γ không tạo vệt trực tiếp.
            </span>
          </span>
        </label>

        <label
          style={{
            display: "flex",
            gap: "10px",
            alignItems: "flex-start",
            padding: "10px 12px",
            borderRadius: "8px",
            border: showExplanatoryModel ? "1.5px solid #0284c7" : "1px solid #cbd5e1",
            background: showExplanatoryModel ? "#f0f9ff" : "#ffffff",
            cursor: "pointer",
            fontSize: "13px",
            lineHeight: 1.45,
          }}
        >
          <input
            type="checkbox"
            data-toggle-field-explanatory-layer
            checked={showExplanatoryModel}
            onChange={(e) =>
              setState((prev) => ({ ...prev, showExplanatoryModel: e.target.checked }))
            }
            style={{ marginTop: "3px" }}
          />
          <span>
            <strong style={{ display: "block", color: "#0c4a6e" }}>
              Lớp 2: Đường đi trong “Mô hình giải thích”
            </strong>
            <span style={{ fontSize: "12px", color: "#475569" }}>
              Hiện đường quỹ đạo lý tưởng của α, β⁻, β⁺, γ và đường sức trường E / B (mắt không thấy trực tiếp hạt nhân hay đường sức).
            </span>
          </span>
        </label>
      </div>

      {/* 3. Khung 3D Vùng trường & Buồng sương (hoặc Sơ đồ dự phòng khi thiếu WebGL) */}
      <div
        data-radiation-field-stage
        data-field-render-mode={
          !isWebGLActive
            ? "fallback-no-webgl"
            : isHostVisible
              ? "webgl-active"
              : "webgl-released"
        }
        style={{
          position: "relative",
          width: "100%",
          minHeight: "420px",
          borderRadius: "12px",
          overflow: "hidden",
          background: "#070e1b",
          border: "1px solid #1e293b",
        }}
      >
        {!isWebGLActive ? (
          <div
            data-testid="radiation-field-webgl-fallback"
            style={{ padding: "14px", color: "#f8fafc" }}
          >
            <div
              role="status"
              style={{
                padding: "8px 12px",
                marginBottom: "10px",
                borderRadius: "8px",
                background: "rgba(30, 41, 59, 0.95)",
                border: "1px solid #f59e0b",
                color: "#fef3c7",
                fontSize: "12.5px",
              }}
            >
              <strong>Sơ đồ buồng sương &amp; vùng trường dự phòng:</strong> Trình duyệt hiện không khả dụng WebGL 3D. Em vẫn bật/đảo cực Điện trường E, Từ trường B và quan sát đầy đủ vết ngưng tụ cùng đường đi mô hình giải thích của α, β⁻, β⁺, γ.
            </div>
            <svg
              viewBox="0 0 680 310"
              role="img"
              aria-label="Sơ đồ dự phòng vùng điện trường và từ trường khảo sát tia alpha, beta trừ, beta cộng và gamma"
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              <rect x="0" y="0" width="680" height="310" fill="#070e1b" rx="8" />
              {/* Buồng nguồn chì bên trái */}
              <rect x="28" y="122" width="76" height="66" rx="5" fill="#475569" stroke="#94a3b8" />
              <text x="66" y="159" textAnchor="middle" fill="#fef08a" fontSize="11.5" fontWeight="700">
                Nguồn ☢
              </text>

              {/* Bộ phận tạo trường E hoặc B */}
              {fieldMode === "electric" && (
                <g>
                  <rect
                    x="138"
                    y="28"
                    width="370"
                    height="16"
                    rx="3"
                    fill={polarity === "normal" ? "#dc2626" : "#2563eb"}
                  />
                  <text x="323" y="22" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="700">
                    {polarity === "normal" ? "Bản cực Dương (+)" : "Bản cực Âm (−)"}
                  </text>
                  <rect
                    x="138"
                    y="266"
                    width="370"
                    height="16"
                    rx="3"
                    fill={polarity === "normal" ? "#2563eb" : "#dc2626"}
                  />
                  <text x="323" y="298" textAnchor="middle" fill="#f8fafc" fontSize="12" fontWeight="700">
                    {polarity === "normal" ? "Bản cực Âm (−)" : "Bản cực Dương (+)"}
                  </text>
                </g>
              )}
              {fieldMode === "magnetic" && (
                <g>
                  <rect
                    x="148"
                    y="34"
                    width="350"
                    height="242"
                    rx="14"
                    fill="rgba(30, 58, 138, 0.2)"
                    stroke="#d97706"
                    strokeWidth="2.5"
                    strokeDasharray="7 4"
                  />
                  <text x="323" y="54" textAnchor="middle" fill="#7dd3fc" fontSize="12" fontWeight="700">
                    Cặp cực nam châm N–S: {polarity === "normal" ? "Từ trường đều B ⊗ (hướng vào trong)" : "Từ trường đều B ⊙ (hướng ra ngoài)"}
                  </text>
                </g>
              )}

              {/* Tấm chắn Hình 23.4 */}
              {absorber !== "none" && (
                <g>
                  <rect
                    x="536"
                    y="38"
                    width={absorber === "paper" ? 6 : absorber === "aluminum" ? 14 : 28}
                    height="234"
                    fill={absorber === "paper" ? "#f8fafc" : absorber === "aluminum" ? "#94a3b8" : "#334155"}
                  />
                  <text x="548" y="30" textAnchor="middle" fill="#cbd5e1" fontSize="10.5" fontWeight="700">
                    {ABSORBER_LABELS[absorber]}
                  </text>
                </g>
              )}

              {/* Vết ngưng tụ & Quỹ đạo mô hình giải thích */}
              {trajectories.map((traj) => {
                const meta = getRadiationSpeciesMeta(traj.species);
                const toSvgX = (wx: number) => 104 + ((wx + 4.6) / 9.7) * 536;
                const toSvgY = (wy: number) => 155 - (wy / 2.45) * 106;
                const polyPts = traj.explanatoryPoints
                  .map((pt) => `${toSvgX(pt.x).toFixed(1)},${toSvgY(pt.y).toFixed(1)}`)
                  .join(" ");
                const endPt = traj.explanatoryPoints[traj.explanatoryPoints.length - 1];

                return (
                  <g key={traj.species}>
                    {showCondensation &&
                      traj.condensationDroplets.map((d, idx) => (
                        <circle
                          key={idx}
                          cx={toSvgX(d.x)}
                          cy={toSvgY(d.y)}
                          r={d.radius * 26}
                          fill={traj.species === "gamma" ? "#bbf7d0" : "#e2e8f0"}
                          fillOpacity={traj.species === "alpha" ? 0.78 : 0.55}
                        />
                      ))}
                    {showExplanatoryModel && (
                      <>
                        <polyline
                          points={polyPts}
                          fill="none"
                          stroke={meta.colorHex}
                          strokeWidth={traj.species === "alpha" ? 3.8 : 2.5}
                        />
                        {endPt && (
                          <text
                            x={Math.min(655, toSvgX(endPt.x) + 10)}
                            y={toSvgY(endPt.y) + 4}
                            fill={meta.colorHex}
                            fontSize="12"
                            fontWeight="700"
                          >
                            {meta.symbol}
                          </text>
                        )}
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        ) : (
          <div
            ref={canvasHostRef}
            data-radiation-field-canvas
            style={{ width: "100%", height: "420px", cursor: "grab", touchAction: "none" }}
          />
        )}

        {/* Chú thích chế độ hiển thị ngay trên khung */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            right: "10px",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "8px",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              padding: "4px 10px",
              borderRadius: "6px",
              background: "rgba(15, 23, 42, 0.88)",
              border: "1px solid #38bdf8",
              color: "#e0f2fe",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            {fieldMode === "none"
              ? "Buồng sương tự do (E = 0, B = 0)"
              : fieldMode === "electric"
                ? `Điện trường đều E hướng ${fieldVectors.E.y < 0 ? "xuống dưới (−Y)" : "lên trên (+Y)"}`
                : `Từ trường đều B hướng ${fieldVectors.B.z < 0 ? "vào trong màn hình (⊗)" : "ra ngoài màn hình (⊙)"}`}
          </span>
          {showExplanatoryModel && (
            <span
              data-testid="field-explanatory-model-badge"
              style={{
                padding: "4px 10px",
                borderRadius: "6px",
                background: "rgba(12, 74, 110, 0.92)",
                border: "1px solid #38bdf8",
                color: "#bae6fd",
                fontSize: "11.5px",
                fontWeight: 700,
              }}
            >
              Mô hình giải thích: Quỹ đạo &amp; chiều lệch α, β⁻, β⁺, γ
            </span>
          )}
        </div>
      </div>

      {/* 4. Bảng đối chiếu trực tiếp chiều lệch & vết ngưng tụ của các tia đang quan sát */}
      <div style={{ overflowX: "auto" }}>
        <table
          data-testid="radiation-deflection-summary-table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
            background: "#ffffff",
          }}
        >
          <thead>
            <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
              <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Tia phóng xạ</th>
              <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Vết ngưng tụ quan sát được</th>
              <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>
                Đường đi trong Mô hình giải thích (trường hiện tại)
              </th>
              <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Độ đâm xuyên (Hình 23.4)</th>
            </tr>
          </thead>
          <tbody>
            {trajectories.map((traj) => {
              const meta = getRadiationSpeciesMeta(traj.species);
              return (
                <tr key={traj.species} data-ray-row={traj.species}>
                  <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", fontWeight: 700 }}>
                    {meta.nameVi}
                  </td>
                  <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>
                    {meta.cloudTrackDescVi}
                  </td>
                  <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", fontWeight: 600, color: "#0f172a" }}>
                    {traj.summaryVi}
                  </td>
                  <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>
                    {meta.penetrationVi}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Câu hỏi kiểm chứng & điều kiện hoàn thành mục */}
      <div
        style={{
          padding: "14px",
          borderRadius: "10px",
          background: "#f8fafc",
          border: "1px solid #cbd5e1",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px", color: "#0f172a" }}>
          Kiểm tra kết luận từ vùng trường 3D: Nhận định nào dưới đây đúng về α, β⁻, β⁺ và γ?
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
                name="b23-radiation-field-quiz"
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
          data-submit-radiation-field-quiz
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
              ? "✓ Chính xác! Tia β⁻ (−e) và β⁺ (+e) lệch mạnh theo hai phía đối diện; tia α (+2e) lệch cùng chiều với β⁺ nhưng ít cong hơn nhiều vì khối lượng lớn gấp ~7 300 lần electron; còn tia γ không mang điện (q = 0) nên luôn truyền thẳng."
              : "Chưa đúng. Hãy bật lần lượt Điện trường E, Từ trường B và bấm Đảo cực trên mô hình để quan sát lại độ cong của α so với β⁺, chiều lệch ngược nhau của β⁻/β⁺ và đường đi thẳng của tia γ."}
          </div>
        )}

        <div style={{ marginTop: "10px", fontSize: "12.5px", color: "#475569" }}>
          Tiến độ hoàn thành mục: Thử Điện trường E {testedElectric ? "✓" : "○"} · Thử Từ trường B{" "}
          {testedMagnetic ? "✓" : "○"} · Thử Đảo cực {testedPolarityFlip ? "✓" : "○"} · Trả lời đúng câu hỏi{" "}
          {isQuizCorrect ? "✓" : "○"}
          {isComplete && <strong style={{ color: "#15803d" }}> — ✓ Đã hoàn thành!</strong>}
        </div>
      </div>
    </div>
  );
}

export default RadiationFieldApparatusV3;
