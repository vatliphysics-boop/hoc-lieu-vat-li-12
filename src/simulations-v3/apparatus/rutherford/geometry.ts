/**
 * Rutherford apparatus 3D builder — Three.js geometry aligned with SGK Hình 21.2 (tr. 91)
 *
 * Coordinate system (Horizontal scattering plane matching Hình 21.2a & 21.2b):
 *   Origin (0, 0, 0): Center of thin gold foil D
 *   Scattering plane: Horizontal XZ plane (y = 0), vertical axis = +Y
 *   Mapping from 2D Coulomb engine (xFm, yFm) with FM_TO_UNITS = 7.5 / 180:
 *     worldX =  xFm * FM_TO_UNITS
 *     worldY =  0
 *     worldZ = -yFm * FM_TO_UNITS
 *
 *   Viewed from front-overview camera at (-Z looking toward +Z):
 *     - Right side (-X): Alpha source R & lead housing shooting horizontally toward center D
 *     - Center (0,0,0): Thin vertical gold foil D on holder post
 *     - Left side (+X, 0°): Position (1) directly opposite source R
 *     - Front-right arc (> 90°): Position (2) back-scattered toward source R side
 *     - Surrounding ring (r = 7.5): Fluorescent ZnS screen S
 *     - Outer brass tube (M): Rotating microscope sweeping from Position (1) to Position (2)
 *     - Vertical drum (G) on pedestal (P): Evacuated chamber & base stand (Hình 21.2a)
 */

import * as THREE from "three";
import type { ApparatusComponent } from "../../core/types";

export const DETECTOR_RADIUS_UNITS = 7.5;
export const MICROSCOPE_RADIUS_UNITS = 7.5;
export const FM_TO_UNITS = DETECTOR_RADIUS_UNITS / 180;

/** Convert 2D physics engine coordinates (fm) to 3D world space (Three.js units) */
export function engineFmToWorld(xFm: number, yFm: number): THREE.Vector3 {
  return new THREE.Vector3(xFm * FM_TO_UNITS, 0, -yFm * FM_TO_UNITS);
}

/** Convert polar scattering angle (deg, 0° = +X Position (1), 90° = -Z front, 180° = -X source R) to 3D point */
export function polarAngleToWorld(angleDeg: number, radiusUnits: number, y = 0): THREE.Vector3 {
  const rad = (angleDeg * Math.PI) / 180;
  return new THREE.Vector3(
    radiusUnits * Math.cos(rad),
    y,
    -radiusUnits * Math.sin(rad),
  );
}

/** A built component with its Three.js object and metadata */
export interface BuiltComponent {
  readonly id: string;
  readonly mesh: THREE.Object3D;
  readonly component: ApparatusComponent;
  readonly originalPosition: THREE.Vector3;
  readonly originalRotation: THREE.Euler;
}

/** Materials for apparatus */
export function createMaterials() {
  return {
    brass: new THREE.MeshStandardMaterial({
      color: 0xd4a017,
      metalness: 0.78,
      roughness: 0.28,
    }),
    agedBrass: new THREE.MeshStandardMaterial({
      color: 0x9a7b2c,
      metalness: 0.7,
      roughness: 0.42,
    }),
    steel: new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25,
    }),
    lead: new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.35,
      roughness: 0.68,
      side: THREE.DoubleSide,
    }),
    gold: new THREE.MeshStandardMaterial({
      color: 0xffdf38,
      emissive: 0x6b4e00,
      emissiveIntensity: 0.35,
      metalness: 0.92,
      roughness: 0.16,
      side: THREE.DoubleSide,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      metalness: 0,
      roughness: 0.08,
      transmission: 0.82,
      thickness: 0.25,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
    zincSulfide: new THREE.MeshStandardMaterial({
      color: 0x86efac,
      emissive: 0x15803d,
      emissiveIntensity: 0.42,
      metalness: 0.08,
      roughness: 0.48,
      transparent: true,
      opacity: 0.82,
      side: THREE.DoubleSide,
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.65,
      roughness: 0.48,
    }),
    chamberFloor: new THREE.MeshStandardMaterial({
      color: 0x162033,
      metalness: 0.45,
      roughness: 0.72,
    }),
    sourceCore: new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.75,
      metalness: 0.4,
      roughness: 0.25,
    }),
  };
}

export type Materials = ReturnType<typeof createMaterials>;

/**
 * Build the alpha source (R): glowing radioactive capsule + brass emission nozzle
 * positioned inside the chamber wall shooting along +X toward gold foil D (0,0,0).
 */
export function buildAlphaSource(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // Active glowing alpha emitter core (R)
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 1.3, 24),
    mat.sourceCore,
  );
  core.rotation.z = -Math.PI / 2;
  core.position.set(-0.2, 0, 0);
  group.add(core);

  // Brass exit nozzle aiming straight toward foil D
  const nozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.46, 1.15, 24),
    mat.brass,
  );
  nozzle.rotation.z = -Math.PI / 2;
  nozzle.position.set(0.95, 0, 0);
  group.add(nozzle);

  // Aperture glow ring
  const tipRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.06, 10, 24),
    mat.sourceCore,
  );
  tipRing.rotation.y = Math.PI / 2;
  tipRing.position.set(1.52, 0, 0);
  group.add(tipRing);

  group.position.set(-6.6, 0, 0);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the lead source housing surrounding source R (like the block around R in Hình 21.2).
 */
export function buildSourceHousing(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // U-channel / bored lead shield block matching Hình 21.2b
  const outerBlock = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 1.7, 1.9),
    mat.lead,
  );
  outerBlock.position.set(-0.25, 0, 0);
  group.add(outerBlock);

  // Mounting pedestal to chamber floor
  const mountPost = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 1.5, 1.2),
    mat.darkMetal,
  );
  mountPost.position.set(-0.25, -1.55, 0);
  group.add(mountPost);

  group.position.set(-6.6, 0, 0);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the collimator slit between source R and gold foil D.
 */
export function buildCollimator(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  const jawFront = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 1.9, 1.05),
    mat.lead,
  );
  jawFront.position.set(0, 0, -0.72);
  group.add(jawFront);

  const jawBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 1.9, 1.05),
    mat.lead,
  );
  jawBack.position.set(0, 0, 0.72);
  group.add(jawBack);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 1.35, 1.8),
    mat.darkMetal,
  );
  base.position.set(0, -1.62, 0);
  group.add(base);

  group.position.set(-3.8, 0, 0);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the thin gold foil (D) standing vertically at origin (0, 0, 0).
 */
export function buildGoldFoil(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // Ultra-thin gleaming vertical gold sheet facing the incoming beam along X
  const leaf = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 2.35, 1.85),
    mat.gold,
  );
  group.add(leaf);

  group.position.set(0, 0, 0);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the brass frame & vertical stand holding gold foil D at center (Hình 21.2a).
 */
export function buildFoilHolder(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // Frame posts around the gold foil
  const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 2.05), mat.brass);
  topBar.position.set(0, 1.22, 0);
  group.add(topBar);

  const bottomBar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 2.05), mat.brass);
  bottomBar.position.set(0, -1.22, 0);
  group.add(bottomBar);

  const leftBar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.56, 0.12), mat.brass);
  leftBar.position.set(0, 0, -0.98);
  group.add(leftBar);

  const rightBar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.56, 0.12), mat.brass);
  rightBar.position.set(0, 0, 0.98);
  group.add(rightBar);

  // Pedestal stem down to chamber floor
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.22, 1.15, 16),
    mat.brass,
  );
  stem.position.set(0, -1.8, 0);
  group.add(stem);

  const foot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.72, 0.22, 24),
    mat.agedBrass,
  );
  foot.position.set(0, -2.32, 0);
  group.add(foot);

  group.position.set(0, 0, 0);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the fluorescent ZnS screen (S): circular vertical band at r = 7.5 in the XZ plane
 * with an entry opening around -X (source R) just like Hình 21.2b.
 */
export function buildScintillationScreen(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // In Three.js CylinderGeometry, theta = -PI/2 is at (-r, y, 0) where source R sits.
  const gapHalfRad = 0.24;
  const thetaStart = -Math.PI / 2 + gapHalfRad;
  const thetaLength = Math.PI * 2 - gapHalfRad * 2;

  const screenBand = new THREE.Mesh(
    new THREE.CylinderGeometry(
      DETECTOR_RADIUS_UNITS,
      DETECTOR_RADIUS_UNITS,
      1.35,
      80,
      1,
      true,
      thetaStart,
      thetaLength,
    ),
    mat.zincSulfide,
  );
  group.add(screenBand);

  // Brass top & bottom retaining rims
  const rimGeo = new THREE.TorusGeometry(
    DETECTOR_RADIUS_UNITS + 0.04,
    0.065,
    10,
    80,
    thetaLength,
  );
  const rimTop = new THREE.Mesh(rimGeo, mat.brass);
  rimTop.rotation.x = Math.PI / 2;
  // Align torus arc gap with -X
  rimTop.rotation.z = Math.PI + gapHalfRad;
  rimTop.position.y = 0.68;
  group.add(rimTop);

  const rimBottom = new THREE.Mesh(rimGeo, mat.brass);
  rimBottom.rotation.x = Math.PI / 2;
  rimBottom.rotation.z = Math.PI + gapHalfRad;
  rimBottom.position.y = -0.68;
  group.add(rimBottom);

  // Position (1) & Position (2) physical reference markers on screen rim
  const pos1Marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 14, 14),
    new THREE.MeshBasicMaterial({ color: 0x4ade80 }),
  );
  pos1Marker.position.copy(polarAngleToWorld(0, DETECTOR_RADIUS_UNITS, 0.85));
  group.add(pos1Marker);

  const pos2Marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 14, 14),
    new THREE.MeshBasicMaterial({ color: 0xfb7185 }),
  );
  pos2Marker.position.copy(polarAngleToWorld(140, DETECTOR_RADIUS_UNITS, 0.85));
  group.add(pos2Marker);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Position and orient the rotating microscope (M) at horizontal scattering angle (0°..160°).
 * In local coordinates, +X points radially outward from foil D through screen S:
 *   rotation.y = +rad maps local (1,0,0) -> (cos(rad), 0, -sin(rad)).
 */
export function setMicroscopeAngle(
  built: BuiltComponent,
  angleDeg: number,
  explodedOffset?: readonly [number, number, number],
): void {
  const rad = (angleDeg * Math.PI) / 180;
  const ox = explodedOffset?.[0] ?? 0;
  const oy = explodedOffset?.[1] ?? 0;
  const oz = explodedOffset?.[2] ?? 0;

  built.mesh.position.set(
    MICROSCOPE_RADIUS_UNITS * Math.cos(rad) + ox,
    oy,
    -MICROSCOPE_RADIUS_UNITS * Math.sin(rad) + oz,
  );
  built.mesh.rotation.set(0, rad, 0);
}

/**
 * Build the rotating microscope (M): iconic brass tube + objective lens + radial pivot arm
 * matching Hình 21.2a & 21.2b.
 */
export function buildRotatingMicroscope(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // Bright ZnS focal window patch right in front of the objective lens (Hình 21.2a S)
  const focalPatch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.58, 0.06, 24),
    new THREE.MeshBasicMaterial({
      color: 0x4ade80,
      transparent: true,
      opacity: 0.45,
    }),
  );
  focalPatch.rotation.z = -Math.PI / 2;
  focalPatch.position.set(-0.08, 0, 0);
  group.add(focalPatch);

  // Dark steel objective nosepiece facing screen S
  const objective = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.42, 0.65, 24),
    mat.darkMetal,
  );
  objective.rotation.z = -Math.PI / 2;
  objective.position.set(0.42, 0, 0);
  group.add(objective);

  // Main brass microscope body tube protruding outside chamber G (like Hình 21.2a)
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.48, 2.85, 28),
    mat.brass,
  );
  barrel.rotation.z = -Math.PI / 2;
  barrel.position.set(2.15, 0, 0);
  group.add(barrel);

  // Focus collar ring
  const collar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 0.28, 28),
    mat.agedBrass,
  );
  collar.rotation.z = -Math.PI / 2;
  collar.position.set(1.55, 0, 0);
  group.add(collar);

  // Eyepiece cup at outer end (local x = 3.85, world r ≈ 11.35)
  const eyepiece = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.44, 0.55, 24),
    mat.darkMetal,
  );
  eyepiece.rotation.z = -Math.PI / 2;
  eyepiece.position.set(3.82, 0, 0);
  group.add(eyepiece);

  // Rotating radial arm along chamber floor connecting center pivot to microscope bracket
  const radialArm = new THREE.Mesh(
    new THREE.BoxGeometry(7.2, 0.16, 0.36),
    mat.steel,
  );
  radialArm.position.set(-3.4, -2.18, 0);
  group.add(radialArm);

  const verticalBracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 2.25, 0.42),
    mat.steel,
  );
  verticalBracket.position.set(0.9, -1.1, 0);
  group.add(verticalBracket);

  const built: BuiltComponent = {
    id: component.id,
    mesh: group,
    component,
    originalPosition: new THREE.Vector3(MICROSCOPE_RADIUS_UNITS, 0, 0),
    originalRotation: new THREE.Euler(0, 0, 0),
  };

  setMicroscopeAngle(built, 0);
  return built;
}

/**
 * Build the horizontal angular scale ring (0°..180°) on the chamber floor around D.
 */
export function buildAngularScale(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  const arcRadius = 8.05;
  const scaleRing = new THREE.Mesh(
    new THREE.RingGeometry(arcRadius - 0.16, arcRadius + 0.16, 96),
    mat.steel,
  );
  scaleRing.rotation.x = -Math.PI / 2;
  scaleRing.position.y = -2.36;
  group.add(scaleRing);

  for (let deg = 0; deg <= 180; deg += 15) {
    const isMajor = deg % 30 === 0;
    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(isMajor ? 0.52 : 0.28, 0.08, isMajor ? 0.11 : 0.06),
      isMajor ? mat.brass : mat.steel,
    );
    const rad = (deg * Math.PI) / 180;
    tick.position.set(arcRadius * Math.cos(rad), -2.32, -arcRadius * Math.sin(rad));
    tick.rotation.y = rad;
    group.add(tick);
  }

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the vacuum chamber metallic top cap & rims (G) — hidden in Cutaway mode
 * to reveal the open drum interior just like Hình 21.2a!
 */
export function buildVacuumChamber(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // Top brass flange ring
  const topRim = new THREE.Mesh(
    new THREE.TorusGeometry(9.05, 0.18, 16, 80),
    mat.agedBrass,
  );
  topRim.rotation.x = Math.PI / 2;
  topRim.position.y = 2.45;
  group.add(topRim);

  // Semi-translucent top lid ring so interior remains visible even in Overview
  const topGlass = new THREE.Mesh(
    new THREE.CircleGeometry(9.0, 72),
    mat.glass,
  );
  topGlass.rotation.x = -Math.PI / 2;
  topGlass.position.y = 2.46;
  topGlass.renderOrder = 3;
  group.add(topGlass);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the transparent cylindrical side wall of vacuum chamber (G).
 */
export function buildChamberWindow(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  const sideWall = new THREE.Mesh(
    new THREE.CylinderGeometry(9.0, 9.0, 4.9, 80, 1, true),
    mat.glass,
  );
  sideWall.renderOrder = 2;
  group.add(sideWall);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the chamber floor & classic pedestal stand with vacuum pump port (P in Hình 21.2a).
 */
export function buildBasePlatform(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // Solid chamber bottom plate (always visible even in Cutaway so R, D, S, M sit on a real floor!)
  const chamberBottom = new THREE.Mesh(
    new THREE.CylinderGeometry(9.15, 9.15, 0.36, 80),
    mat.chamberFloor,
  );
  chamberBottom.position.y = -2.58;
  group.add(chamberBottom);

  const bottomBrassRim = new THREE.Mesh(
    new THREE.TorusGeometry(9.12, 0.16, 14, 80),
    mat.agedBrass,
  );
  bottomBrassRim.rotation.x = Math.PI / 2;
  bottomBrassRim.position.y = -2.42;
  group.add(bottomBrassRim);

  // Central pedestal column (P in Hình 21.2a)
  const column = new THREE.Mesh(
    new THREE.CylinderGeometry(1.35, 1.85, 2.8, 32),
    mat.agedBrass,
  );
  column.position.y = -4.1;
  group.add(column);

  // Flared cast-iron / brass base foot
  const footBase = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 4.8, 0.55, 48),
    mat.darkMetal,
  );
  footBase.position.y = -5.65;
  group.add(footBase);

  // Vacuum pump exhaust hose extending from pedestal P (exact detail in Hình 21.2a!)
  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.2, -4.3, 0),
    new THREE.Vector3(3.8, -4.8, -1.2),
    new THREE.Vector3(6.8, -5.5, -2.2),
  ]);
  const vacuumHose = new THREE.Mesh(
    new THREE.TubeGeometry(hoseCurve, 24, 0.28, 12, false),
    mat.agedBrass,
  );
  group.add(vacuumHose);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Deterministic background sample angles (deg) illustrating experimental flash density on screen S:
 * Dense cluster near 0° Position (1), sparse at medium angles, 1 rare spot at > 90° Position (2).
 */
const SAMPLE_SCINTILLATION_SPOTS: readonly { readonly deg: number; readonly y: number }[] = [
  { deg: -5.5, y: -0.18 },
  { deg: -3.8, y: 0.16 },
  { deg: -2.2, y: -0.08 },
  { deg: -1.1, y: 0.22 },
  { deg: -0.4, y: -0.14 },
  { deg: 0, y: 0.05 },
  { deg: 0.9, y: -0.2 },
  { deg: 1.8, y: 0.14 },
  { deg: 3.1, y: -0.09 },
  { deg: 4.6, y: 0.13 },
  { deg: 7.0, y: -0.16 },
  { deg: 11.5, y: 0.18 },
  { deg: -10.5, y: -0.11 },
  { deg: 24, y: -0.15 },
  { deg: 44, y: 0.09 },
  { deg: 74, y: -0.12 },
  { deg: 140, y: 0.06 }, // Rare backscatter flash at Position (2) (> 90°)
];

/**
 * Build Layer 1: Experimental ZnS scintillation flashes on screen S.
 * When the simulated alpha particle reaches screen S (`showActiveHitFlash === true`),
 * renders a vivid glowing green flash + halo right on screen S!
 */
export function buildScintillationLayer(
  hitPoint3D: THREE.Vector3 | null,
  showActiveHitFlash: boolean,
): THREE.Group {
  const group = new THREE.Group();
  const sampleRadius = DETECTOR_RADIUS_UNITS - 0.08;

  const sampleGeo = new THREE.SphereGeometry(0.095, 10, 10);
  const sampleMat = new THREE.MeshBasicMaterial({
    color: 0x4ade80,
    transparent: true,
    opacity: 0.62,
  });

  for (const spot of SAMPLE_SCINTILLATION_SPOTS) {
    const pos = polarAngleToWorld(spot.deg, sampleRadius, spot.y);
    const dot = new THREE.Mesh(sampleGeo, sampleMat);
    dot.position.copy(pos);
    group.add(dot);
  }

  if (hitPoint3D && showActiveHitFlash) {
    // Bright scintillation flash core on screen S
    const coreFlash = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xbbf7d0 }),
    );
    coreFlash.position.copy(hitPoint3D);
    group.add(coreFlash);

    // Inner bright green halo oriented tangent to screen S
    const hitAngleRad = Math.atan2(-hitPoint3D.z, hitPoint3D.x);
    const glowHalo = new THREE.Mesh(
      new THREE.RingGeometry(0.34, 0.78, 28),
      new THREE.MeshBasicMaterial({
        color: 0x22c55e,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      }),
    );
    glowHalo.position.copy(hitPoint3D);
    glowHalo.rotation.y = hitAngleRad + Math.PI / 2;
    group.add(glowHalo);

    // Outer soft flash burst ring
    const outerBurst = new THREE.Mesh(
      new THREE.RingGeometry(0.82, 1.18, 28),
      new THREE.MeshBasicMaterial({
        color: 0x4ade80,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
      }),
    );
    outerBurst.position.copy(hitPoint3D);
    outerBurst.rotation.y = hitAngleRad + Math.PI / 2;
    group.add(outerBurst);
  }

  return group;
}

/**
 * Build Layer 2 ("Mô hình giải thích"):
 * - Magnified gold nucleus core indicator at (0,0,0)
 * - Dashed undeflected forward reference line (0° direction)
 * - Hyperbolic Coulomb trajectory curve + moving alpha particle sphere
 * - 3D scattering angle arc θ between forward axis (0°) and scattered ray
 * Returns both the Three.js Group and 3D anchor points for dedicated trajectory & angle labels!
 */
export interface ExplanatoryModelBuildResult {
  readonly group: THREE.Group;
  readonly trajectoryLabelAnchor: THREE.Vector3;
  readonly angleLabelAnchor: THREE.Vector3;
}

export function buildExplanatoryModelLayer(
  trailPoints3D: readonly THREE.Vector3[],
  impactFm: number,
  scatteringAngleDeg: number,
  detectorAngleDeg: number,
): ExplanatoryModelBuildResult {
  const group = new THREE.Group();

  // 1. Magnified gold nucleus marker at origin (0,0,0)
  const nucleusDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xfef08a }),
  );
  group.add(nucleusDot);

  // 2. Undeflected forward reference line (dashed, showing 0° original direction)
  const zOffset = -impactFm * FM_TO_UNITS;
  const refLineGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-5.2, 0.02, zOffset),
    new THREE.Vector3(DETECTOR_RADIUS_UNITS - 0.2, 0.02, zOffset),
  ]);
  const refLine = new THREE.Line(
    refLineGeo,
    new THREE.LineDashedMaterial({
      color: 0x94a3b8,
      dashSize: 0.35,
      gapSize: 0.25,
      transparent: true,
      opacity: 0.65,
    }),
  );
  refLine.computeLineDistances();
  group.add(refLine);

  // 3. Trajectory curve + moving alpha particle sphere
  if (trailPoints3D.length >= 2) {
    const curveGeo = new THREE.BufferGeometry().setFromPoints([...trailPoints3D]);
    const curveMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2,
      transparent: true,
      opacity: 0.96,
    });
    group.add(new THREE.Line(curveGeo, curveMat));

    const tip = trailPoints3D[trailPoints3D.length - 1];
    if (tip) {
      const alphaSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.21, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
      );
      alphaSphere.position.copy(tip);
      group.add(alphaSphere);
    }
  }

  // 4. 3D Scattering angle arc (between 0° forward ray and outgoing detector/scattered direction)
  const arcR = 2.55;
  const clampedAngle = Math.max(2, Math.min(178, Math.abs(detectorAngleDeg || scatteringAngleDeg)));
  const arcSteps = 28;
  const arcPts: THREE.Vector3[] = [];
  for (let i = 0; i <= arcSteps; i++) {
    const deg = (clampedAngle * i) / arcSteps;
    arcPts.push(polarAngleToWorld(deg, arcR, 0.05));
  }
  const arcLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(arcPts),
    new THREE.LineBasicMaterial({ color: 0xfbbf24 }),
  );
  group.add(arcLine);

  // Forward 0° ray stub from center so the angle θ is visually unmistakable
  const zeroStub = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.05, 0),
      new THREE.Vector3(arcR + 0.7, 0.05, 0),
    ]),
    new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.6 }),
  );
  group.add(zeroStub);

  const midTrackIdx = Math.min(
    trailPoints3D.length - 1,
    Math.max(0, Math.floor(trailPoints3D.length * 0.78)),
  );
  const trajectoryLabelAnchor = (
    trailPoints3D[midTrackIdx] ?? polarAngleToWorld(clampedAngle, 5.2, 0.2)
  )
    .clone()
    .add(new THREE.Vector3(0, -0.32, 0));

  const angleLabelAnchor = polarAngleToWorld(clampedAngle * 0.36, arcR + 0.85, 0.55);

  return {
    group,
    trajectoryLabelAnchor,
    angleLabelAnchor,
  };
}

/**
 * Build all 11 components of the Rutherford apparatus without duplicating any mesh.
 */
export function buildRutherfordApparatus(
  components: readonly ApparatusComponent[],
): Map<string, BuiltComponent> {
  const mat = createMaterials();
  const result = new Map<string, BuiltComponent>();

  const builders: Record<string, (c: ApparatusComponent, m: Materials) => BuiltComponent> = {
    "alpha-source": buildAlphaSource,
    "source-housing": buildSourceHousing,
    collimator: buildCollimator,
    "gold-foil": buildGoldFoil,
    "foil-holder": buildFoilHolder,
    "scintillation-screen": buildScintillationScreen,
    "rotating-microscope": buildRotatingMicroscope,
    "angular-scale": buildAngularScale,
    "vacuum-chamber": buildVacuumChamber,
    "chamber-window": buildChamberWindow,
    "base-platform": buildBasePlatform,
  };

  for (const component of components) {
    const builder = builders[component.id];
    if (builder) {
      result.set(component.id, builder(component, mat));
    } else {
      console.warn(`[Rutherford] No 3D builder for component ${component.id}`);
    }
  }

  return result;
}
