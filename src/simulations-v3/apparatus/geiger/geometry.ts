/**
 * Three.js 3D geometry builder for the Geiger–Müller counter apparatus (Hình 23.2 SGK Vật lí 12, trang 105).
 *
 * Includes:
 * 1. Sample holder & sealed radioactive disc source (sample-holder)
 * 2. Geiger–Müller detector tube with mica window, Cathode shell & central Anode wire (gm-tube)
 * 3. Coaxial BNC output/input connectors (signal-connectors)
 * 4. Shielded coaxial signal cable with animated electrical pulse bead (signal-cable)
 * 5. Benchtop pulse counter with live CanvasTexture digital readout & speaker grille (counter-display)
 * 6. Gate timer module with live 5.0 s CanvasTexture timer readout (timer-unit)
 */

import * as THREE from "three";
import type { ApparatusComponent } from "../../core/types";
import type { GeigerMeasurementStatus } from "./parts";

export interface BuiltGeigerComponent {
  readonly id: string;
  readonly mesh: THREE.Group;
  readonly originalPosition: THREE.Vector3;
}

export interface GeigerLiveVisualHandles {
  readonly components: Map<string, BuiltGeigerComponent>;
  readonly benchBase: THREE.Group;
  readonly cableCurve: THREE.CatmullRomCurve3;
  readonly ionizationGlow: THREE.Mesh;
  readonly signalPulseBead: THREE.Mesh;
  readonly counterLedMesh: THREE.Mesh;
  updateReadoutScreens: (params: {
    pulses: number;
    elapsedSec: number;
    durationSec: number;
    status: GeigerMeasurementStatus;
    pulseProgress: number | null;
  }) => void;
  disposeLiveTextures: () => void;
}

function addInvisibleHitBox(
  group: THREE.Group,
  size: [number, number, number],
  center: [number, number, number] = [0, 0, 0],
) {
  const hitMesh = new THREE.Mesh(
    new THREE.BoxGeometry(size[0], size[1], size[2]),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  hitMesh.position.set(center[0], center[1], center[2]);
  hitMesh.userData.isHitVolume = true;
  group.add(hitMesh);
}

/**
 * Bench & optical rail underneath the apparatus (non-selectable support table).
 */
function buildOpticalBenchBase(): THREE.Group {
  const g = new THREE.Group();
  const tableMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.85,
    metalness: 0.15,
  });
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.45,
    metalness: 0.75,
  });

  const slab = new THREE.Mesh(new THREE.BoxGeometry(16.4, 0.36, 7.2), tableMat);
  slab.position.set(0, -1.58, 0);
  g.add(slab);

  // Optical rail holding sample holder (1) and GM tube (2) aligned on axis
  const rail = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.24, 1.05), railMat);
  rail.position.set(-4.15, -1.28, 0);
  g.add(rail);

  // Distance scale ticks along optical rail
  const tickMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
  for (let x = -7.2; x <= -1.0; x += 0.5) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.25), tickMat);
    tick.position.set(x, -1.15, 0.38);
    g.add(tick);
  }

  return g;
}

function buildSampleHolder(): THREE.Group {
  const g = new THREE.Group();
  g.position.set(-6.25, 0, 0);

  const standMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    metalness: 0.72,
    roughness: 0.32,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.78,
    roughness: 0.26,
  });
  const warnMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    metalness: 0.2,
    roughness: 0.4,
  });

  // Rail saddle base
  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.34, 1.25), standMat);
  saddle.position.set(0, -1.02, 0);
  g.add(saddle);

  // Locking thumbscrew
  const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.26, 16), brassMat);
  screw.rotation.x = Math.PI / 2;
  screw.position.set(0, -1.02, 0.72);
  g.add(screw);

  // Vertical post
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.35, 20), standMat);
  post.position.set(0, -0.25, 0);
  g.add(post);

  // C-clamp holder cradle
  const holderBlock = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.76, 0.82), brassMat);
  holderBlock.position.set(0, 0.38, 0);
  g.add(holderBlock);

  // Sealed radioactive disc source facing +X toward GM mica window
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.18, 28), warnMat);
  disc.rotation.z = Math.PI / 2;
  disc.position.set(0.31, 0.38, 0);
  g.add(disc);

  const activeCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.06, 20),
    new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.45,
      roughness: 0.3,
    }),
  );
  activeCore.rotation.z = Math.PI / 2;
  activeCore.position.set(0.39, 0.38, 0);
  g.add(activeCore);

  addInvisibleHitBox(g, [1.4, 2.3, 1.5], [0.05, -0.2, 0]);
  return g;
}

function buildGmTube(): { group: THREE.Group; ionizationGlow: THREE.Mesh } {
  const g = new THREE.Group();
  g.position.set(-3.05, 0.38, 0);

  const cathodeMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.82,
    roughness: 0.25,
  });
  const glassWindowMat = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.32,
    roughness: 0.12,
    metalness: 0.05,
  });
  const micaMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.78,
    roughness: 0.22,
    metalness: 0.18,
  });
  const anodeMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0x991b1b,
    emissiveIntensity: 0.35,
    metalness: 0.65,
    roughness: 0.2,
  });
  const mountMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.68,
    roughness: 0.35,
  });

  // Semi-cutaway outer metallic cathode cylinder (top half translucent inspection window so Anode wire is visible!)
  const lowerShell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.56, 0.56, 3.1, 32, 1, true, Math.PI * 0.2, Math.PI * 1.6),
    cathodeMat,
  );
  lowerShell.rotation.z = Math.PI / 2;
  lowerShell.material.side = THREE.DoubleSide;
  g.add(lowerShell);

  const inspectionGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.545, 0.545, 2.9, 28, 1, false),
    glassWindowMat,
  );
  inspectionGlass.rotation.z = Math.PI / 2;
  g.add(inspectionGlass);

  // Front protective bezel ring & thin amber mica window (facing -X toward sample)
  const frontBezel = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.065, 14, 32), mountMat);
  frontBezel.rotation.y = Math.PI / 2;
  frontBezel.position.set(-1.55, 0, 0);
  g.add(frontBezel);

  const micaWindow = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.04, 28), micaMat);
  micaWindow.rotation.z = Math.PI / 2;
  micaWindow.position.set(-1.53, 0, 0);
  g.add(micaWindow);

  // Rear insulating end-cap
  const rearCap = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.52, 0.24, 28), cathodeMat);
  rearCap.rotation.z = Math.PI / 2;
  rearCap.position.set(1.56, 0, 0);
  g.add(rearCap);

  // Fine central tungsten Anode (+) wire along the axis of the GM tube
  const anodeWire = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 2.95, 14), anodeMat);
  anodeWire.rotation.z = Math.PI / 2;
  anodeWire.position.set(0.02, 0, 0);
  g.add(anodeWire);

  const glassBeadTip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 14), anodeMat);
  glassBeadTip.position.set(-1.42, 0, 0);
  g.add(glassBeadTip);

  // Support post & cradle ring down to optical bench rail
  const cradleRing = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.06, 12, 32), mountMat);
  cradleRing.rotation.y = Math.PI / 2;
  cradleRing.position.set(-0.15, 0, 0);
  g.add(cradleRing);

  const supportStem = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 1.02, 18), mountMat);
  supportStem.position.set(-0.15, -0.98, 0);
  g.add(supportStem);

  const supportFoot = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 1.2), mountMat);
  supportFoot.position.set(-0.15, -1.4, 0);
  g.add(supportFoot);

  // Internal avalanche ionization flash cylinder (flashes bright cyan when a particle ionizes Argon gas)
  const ionizationGlow = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 2.65, 24),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  ionizationGlow.rotation.z = Math.PI / 2;
  g.add(ionizationGlow);

  addInvisibleHitBox(g, [3.4, 2.3, 1.4], [0, -0.45, 0]);
  return { group: g, ionizationGlow };
}

function buildSignalConnectors(): THREE.Group {
  const g = new THREE.Group();
  g.position.set(0, 0, 0);

  const nickelMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.88,
    roughness: 0.18,
  });
  const goldPinMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    metalness: 0.85,
    roughness: 0.2,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    roughness: 0.45,
    metalness: 0.15,
  });

  // 1) Connector A: Rear of GM Tube (-1.35, 0.38, 0) — BNC OUT bayonet plug + strain relief boot
  const outSocket = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.28, 22), nickelMat);
  outSocket.rotation.z = Math.PI / 2;
  outSocket.position.set(-1.24, 0.38, 0);
  g.add(outSocket);

  const outBayonetRing = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 10, 24), goldPinMat);
  outBayonetRing.rotation.y = Math.PI / 2;
  outBayonetRing.position.set(-1.12, 0.38, 0);
  g.add(outBayonetRing);

  const outBoot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.11, 0.32, 18), bootMat);
  outBoot.rotation.z = Math.PI / 2;
  outBoot.position.set(-0.92, 0.38, 0);
  g.add(outBoot);

  // 2) Connector B: Counter Input Jack (1.42, -0.35, 1.48) — BNC SIGNAL IN panel socket + plug
  const inFlange = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.08), goldPinMat);
  inFlange.position.set(1.42, -0.35, 1.42);
  g.add(inFlange);

  const inBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.34, 22), nickelMat);
  inBarrel.rotation.x = Math.PI / 2;
  inBarrel.position.set(1.42, -0.35, 1.58);
  g.add(inBarrel);

  const inBoot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.3, 18), bootMat);
  inBoot.rotation.x = Math.PI / 2;
  inBoot.position.set(1.42, -0.35, 1.84);
  g.add(inBoot);

  // Generous hit boxes on both BNC ends so clicking either connector highlights the BNC pair
  addInvisibleHitBox(g, [0.95, 0.75, 0.75], [-1.08, 0.38, 0]);
  addInvisibleHitBox(g, [0.85, 0.85, 0.9], [1.42, -0.35, 1.65]);

  return g;
}

function buildSignalCable(): {
  group: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  pulseBead: THREE.Mesh;
} {
  const g = new THREE.Group();

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.78, 0.38, 0),
    new THREE.Vector3(-0.15, 0.32, 0.55),
    new THREE.Vector3(0.35, -0.55, 1.55),
    new THREE.Vector3(0.95, -0.62, 2.08),
    new THREE.Vector3(1.42, -0.35, 1.96),
  ]);

  const cableGeo = new THREE.TubeGeometry(curve, 56, 0.085, 14, false);
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.42,
    metalness: 0.35,
  });
  const cableMesh = new THREE.Mesh(cableGeo, cableMat);
  g.add(cableMesh);

  // Subtle braided shield stripe rings along cable so students visually trace the coaxial path
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    metalness: 0.5,
    roughness: 0.3,
  });
  for (const t of [0.18, 0.38, 0.58, 0.78]) {
    const pt = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.02, 8, 18), stripeMat);
    collar.position.copy(pt);
    collar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    g.add(collar);
  }

  // Thick invisible tube along same curve for easy touch/click selection of the cable
  const hitGeo = new THREE.TubeGeometry(curve, 24, 0.28, 8, false);
  const hitMesh = new THREE.Mesh(
    hitGeo,
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  hitMesh.userData.isHitVolume = true;
  g.add(hitMesh);

  const pulseBead = new THREE.Mesh(
    new THREE.SphereGeometry(0.17, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0,
    }),
  );
  pulseBead.position.copy(curve.getPoint(0));
  g.add(pulseBead);

  return { group: g, curve, pulseBead };
}

interface DynamicCanvasScreen {
  readonly material: THREE.Material;
  readonly draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  readonly refresh: () => void;
  readonly dispose: () => void;
}

function createCanvasScreen(
  width: number,
  height: number,
  fallbackColor: number,
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): DynamicCanvasScreen {
  if (typeof document === "undefined") {
    return {
      material: new THREE.MeshBasicMaterial({ color: fallbackColor }),
      draw: drawFn,
      refresh: () => {},
      dispose: () => {},
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return {
      material: new THREE.MeshBasicMaterial({ color: fallbackColor }),
      draw: drawFn,
      refresh: () => {},
      dispose: () => {},
    };
  }

  drawFn(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({ map: texture });

  return {
    material,
    draw: drawFn,
    refresh: () => {
      drawFn(ctx, width, height);
      texture.needsUpdate = true;
    },
    dispose: () => {
      texture.dispose();
    },
  };
}

/**
 * Builds the Counter + Digital Readout Screen (3, 4, 5 in Hình 23.2) and the Gate Timer Module.
 */
export function buildGeigerApparatus(
  registry: readonly ApparatusComponent[],
): GeigerLiveVisualHandles {
  const components = new Map<string, BuiltGeigerComponent>();
  const benchBase = buildOpticalBenchBase();

  let screenState = {
    pulses: 0,
    elapsedSec: 0,
    durationSec: 5,
    status: "idle" as GeigerMeasurementStatus,
    pulseFlashing: false,
  };

  // Counter screen dynamic CanvasTexture
  const counterScreen = createCanvasScreen(512, 256, 0x051b11, (ctx, w, h) => {
    ctx.fillStyle = "#06111c";
    ctx.fillRect(0, 0, w, h);

    // Outer instrument bezel border
    ctx.strokeStyle = screenState.pulseFlashing ? "#4ade80" : "#38bdf8";
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, w - 16, h - 16);

    // Header label
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("SỐ XUNG GHI NHẬN (CỬA SỔ ĐO)", 26, 44);

    // Pulse LED indicator on screen
    ctx.beginPath();
    ctx.arc(w - 44, 36, 13, 0, Math.PI * 2);
    ctx.fillStyle = screenState.pulseFlashing ? "#4ade80" : "#1e293b";
    ctx.fill();
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Recessed 4-digit LED box
    ctx.fillStyle = "#030712";
    ctx.fillRect(26, 64, w - 52, 132);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.strokeRect(26, 64, w - 52, 132);

    // Ghost 8888 segments for realism
    ctx.fillStyle = "rgba(244, 63, 94, 0.11)";
    ctx.font = "bold 104px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("8888", w * 0.44, 132);

    // Live pulse count digits!
    const formatted = String(Math.max(0, Math.round(screenState.pulses))).padStart(4, "0");
    ctx.fillStyle = screenState.pulseFlashing ? "#86efac" : "#fb7185";
    ctx.fillText(formatted, w * 0.44, 132);

    // Unit badge on right of screen
    ctx.fillStyle = "#fde047";
    ctx.font = "bold 30px system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("xung", w - 42, 152);

    // Footer status bar
    ctx.fillStyle =
      screenState.status === "measuring"
        ? "#4ade80"
        : screenState.status === "completed"
          ? "#38bdf8"
          : "#cbd5e1";
    ctx.font = "bold 20px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    const statusLabel =
      screenState.status === "measuring"
        ? "● ĐANG ĐẾM XUNG TỪ ỐNG GM..."
        : screenState.status === "completed"
          ? `✓ ĐÃ CHỐT CỬA SỔ ${screenState.durationSec.toFixed(1)} GIÂY`
          : "○ SẴN SÀNG (ĐẶT LẠI VỀ 0000)";
    ctx.fillText(statusLabel, 26, 232);
  });

  // Timer module dynamic CanvasTexture
  const timerScreen = createCanvasScreen(384, 176, 0x091526, (ctx, w, h) => {
    ctx.fillStyle = "#081221";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 5;
    ctx.strokeRect(6, 6, w - 12, h - 12);

    ctx.fillStyle = "#fde68a";
    ctx.font = "bold 20px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("BỘ ĐỊNH THỜI CỬA SỔ ĐO", 20, 36);

    ctx.fillStyle = "#020617";
    ctx.fillRect(20, 48, w - 40, 74);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 48px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${screenState.elapsedSec.toFixed(1)}s / ${screenState.durationSec.toFixed(1)}s`,
      w / 2,
      86,
    );

    // Progress bar
    const ratio = Math.min(1, Math.max(0, screenState.elapsedSec / Math.max(0.1, screenState.durationSec)));
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(20, 136, w - 40, 18);
    ctx.fillStyle = screenState.status === "completed" ? "#22c55e" : "#f59e0b";
    ctx.fillRect(20, 136, (w - 40) * ratio, 18);
  });

  // Build Counter Unit (counter-display) matching red/slate Hình 23.2 chassis
  const counterGroup = new THREE.Group();
  counterGroup.position.set(3.45, -0.08, 0);

  const redCaseMat = new THREE.MeshStandardMaterial({
    color: 0x881b1b,
    roughness: 0.42,
    metalness: 0.25,
  });
  const frontPanelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
    metalness: 0.35,
  });
  const grilleMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.38,
    metalness: 0.45,
  });

  const mainBox = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.35, 2.75), redCaseMat);
  mainBox.position.set(0, 0, 0);
  counterGroup.add(mainBox);

  const frontFace = new THREE.Mesh(new THREE.BoxGeometry(4.32, 2.05, 0.08), frontPanelMat);
  frontFace.position.set(0, 0, 1.38);
  counterGroup.add(frontFace);

  // Digital pulse counter screen plane on front left-center
  const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.68, 1.34), counterScreen.material);
  screenMesh.position.set(-0.62, 0.14, 1.44);
  counterGroup.add(screenMesh);

  // Speaker grille (4 in Hình 23.2) on front right
  const speakerPlate = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.28, 0.06), grilleMat);
  speakerPlate.position.set(1.46, 0.16, 1.43);
  counterGroup.add(speakerPlate);

  const slotMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  for (let row = -2; row <= 2; row++) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.08, 0.08), slotMat);
    slot.position.set(1.46, 0.16 + row * 0.2, 1.44);
    counterGroup.add(slot);
  }

  // Flashing physical LED dome above speaker
  const counterLedMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x14532d,
      emissiveIntensity: 0.25,
      roughness: 0.2,
    }),
  );
  counterLedMesh.position.set(1.46, -0.68, 1.44);
  counterGroup.add(counterLedMesh);

  // Rubber feet
  for (const fx of [-1.9, 1.9]) {
    for (const fz of [-1.05, 1.05]) {
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.22, 0.18, 16),
        frontPanelMat,
      );
      foot.position.set(fx, -1.25, fz);
      counterGroup.add(foot);
    }
  }
  addInvisibleHitBox(counterGroup, [4.8, 2.55, 2.95], [0, 0, 0]);

  // Build Timer Module (timer-unit) mounted atop the counter with visible timing bridge collar
  const timerGroup = new THREE.Group();
  timerGroup.position.set(3.45, 1.68, -0.08);

  const timerCaseMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.48,
    roughness: 0.36,
  });
  const bridgeCollarMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.75,
    roughness: 0.25,
  });

  const timerHousing = new THREE.Mesh(new THREE.BoxGeometry(3.15, 1.05, 1.75), timerCaseMat);
  timerGroup.add(timerHousing);

  const timerBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.28, 18), bridgeCollarMat);
  timerBridge.position.set(-0.9, -0.56, 0.25);
  timerGroup.add(timerBridge);

  const timerBridge2 = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.28, 18), bridgeCollarMat);
  timerBridge2.position.set(0.9, -0.56, 0.25);
  timerGroup.add(timerBridge2);

  const timerScreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.75, 0.84), timerScreen.material);
  timerScreenMesh.position.set(0, 0.02, 0.89);
  timerGroup.add(timerScreenMesh);

  addInvisibleHitBox(timerGroup, [3.35, 1.25, 1.95], [0, 0, 0]);

  // Build remaining parts
  const sampleHolderGroup = buildSampleHolder();
  const gmBuilt = buildGmTube();
  const connectorsGroup = buildSignalConnectors();
  const cableBuilt = buildSignalCable();

  const rawMap: Record<string, THREE.Group> = {
    "sample-holder": sampleHolderGroup,
    "gm-tube": gmBuilt.group,
    "signal-connectors": connectorsGroup,
    "signal-cable": cableBuilt.group,
    "counter-display": counterGroup,
    "timer-unit": timerGroup,
  };

  for (const comp of registry) {
    const mesh = rawMap[comp.id] ?? new THREE.Group();
    mesh.name = comp.id;
    components.set(comp.id, {
      id: comp.id,
      mesh,
      originalPosition: mesh.position.clone(),
    });
  }

  return {
    components,
    benchBase,
    cableCurve: cableBuilt.curve,
    ionizationGlow: gmBuilt.ionizationGlow,
    signalPulseBead: cableBuilt.pulseBead,
    counterLedMesh,
    updateReadoutScreens: ({ pulses, elapsedSec, durationSec, status, pulseProgress }) => {
      const pulseFlashing = pulseProgress !== null;
      const changed =
        screenState.pulses !== pulses ||
        Math.abs(screenState.elapsedSec - elapsedSec) >= 0.04 ||
        screenState.durationSec !== durationSec ||
        screenState.status !== status ||
        screenState.pulseFlashing !== pulseFlashing;

      if (changed) {
        screenState = { pulses, elapsedSec, durationSec, status, pulseFlashing };
        counterScreen.refresh();
        timerScreen.refresh();
      }

      // Animate GM ionization glow, cable pulse bead & LED dome
      const glowMat = gmBuilt.ionizationGlow.material as THREE.MeshBasicMaterial;
      const beadMat = cableBuilt.pulseBead.material as THREE.MeshBasicMaterial;
      const ledMat = counterLedMesh.material as THREE.MeshStandardMaterial;

      if (pulseProgress !== null) {
        const fade = Math.max(0, 1 - pulseProgress);
        glowMat.opacity = 0.55 * fade;
        beadMat.opacity = 0.95;
        cableBuilt.pulseBead.position.copy(
          cableBuilt.curve.getPoint(Math.min(1, Math.max(0, pulseProgress))),
        );
        ledMat.emissive.setHex(0x4ade80);
        ledMat.emissiveIntensity = 1.4 * fade + 0.3;
      } else {
        glowMat.opacity = 0;
        beadMat.opacity = 0;
        ledMat.emissive.setHex(0x14532d);
        ledMat.emissiveIntensity = 0.25;
      }
    },
    disposeLiveTextures: () => {
      counterScreen.dispose();
      timerScreen.dispose();
    },
  };
}
