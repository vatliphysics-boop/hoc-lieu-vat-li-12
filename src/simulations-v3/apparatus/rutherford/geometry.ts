/**
 * Rutherford apparatus 3D builder — Three.js geometry
 * Creates each component as a Three.js mesh group with stable partId
 *
 * Coordinate system: origin at gold foil center.
 *   +X: direction of initial alpha beam (source → foil)
 *   +Y: up
 *   +Z: lateral
 *
 * Scale: 1 Three.js unit = 10 fm, so entire apparatus ~36 units diameter.
 */

import * as THREE from "three";
import type { ApparatusComponent } from "../../core/types";

/** A built component with its Three.js object and metadata */
export interface BuiltComponent {
  readonly id: string;
  readonly mesh: THREE.Object3D;
  readonly component: ApparatusComponent;
  readonly originalPosition: THREE.Vector3;
  readonly originalRotation: THREE.Euler;
}

/** Materials for apparatus (reused to save memory) */
export function createMaterials() {
  return {
    brass: new THREE.MeshStandardMaterial({
      color: 0xb8860b,
      metalness: 0.8,
      roughness: 0.35,
    }),
    steel: new THREE.MeshStandardMaterial({
      color: 0x8899aa,
      metalness: 0.9,
      roughness: 0.25,
    }),
    lead: new THREE.MeshStandardMaterial({
      color: 0x4a4a52,
      metalness: 0.4,
      roughness: 0.7,
    }),
    gold: new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 1.0,
      roughness: 0.2,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xaaddff,
      metalness: 0,
      roughness: 0.05,
      transmission: 0.9,
      thickness: 0.5,
      transparent: true,
      opacity: 0.3,
    }),
    zincSulfide: new THREE.MeshStandardMaterial({
      color: 0xd4f1f9,
      emissive: 0x1a3a4a,
      emissiveIntensity: 0.3,
      metalness: 0.1,
      roughness: 0.6,
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      color: 0x2a2a30,
      metalness: 0.7,
      roughness: 0.5,
    }),
    concrete: new THREE.MeshStandardMaterial({
      color: 0x6a6a70,
      metalness: 0,
      roughness: 0.95,
    }),
    black: new THREE.MeshStandardMaterial({
      color: 0x111111,
      metalness: 0.3,
      roughness: 0.8,
    }),
  };
}

export type Materials = ReturnType<typeof createMaterials>;

/**
 * Build the alpha source: cylindrical lead housing with internal source and
 * narrow exit aperture. Tube points toward +X.
 */
export function buildAlphaSource(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // Outer lead housing — hollow cylinder
  const housingOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 1.2, 3.0, 32, 1, true),
    mat.lead,
  );
  housingOuter.rotation.z = -Math.PI / 2; // cylinder Y-axis → X-axis
  group.add(housingOuter);

  // End cap (back)
  const backCap = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32), mat.lead);
  backCap.position.set(-1.5, 0, 0);
  backCap.rotation.y = -Math.PI / 2;
  group.add(backCap);

  // Front cap with aperture (annulus)
  const frontCap = new THREE.Mesh(
    new THREE.RingGeometry(0.15, 1.2, 32),
    mat.lead,
  );
  frontCap.position.set(1.5, 0, 0);
  frontCap.rotation.y = -Math.PI / 2;
  group.add(frontCap);

  // Internal active source (small brass capsule, visible through cutaway)
  const activeSource = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.25, 0.6, 16),
    mat.brass,
  );
  activeSource.rotation.z = -Math.PI / 2;
  activeSource.position.set(-0.3, 0, 0);
  group.add(activeSource);

  group.position.set(-18, 0, 0);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the collimator: a lead plate with narrow slit, collimating the beam.
 */
export function buildCollimator(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // Lead plate (square, thin in X)
  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 4, 4),
    mat.lead,
  );
  group.add(plate);

  // Aperture indicator (thin slit — visualize with two vertical plates)
  const slitWidth = 0.2;
  const slitLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 4, (4 - slitWidth) / 2),
    mat.darkMetal,
  );
  slitLeft.position.set(0, 0, -(4 + slitWidth) / 4);
  group.add(slitLeft);

  const slitRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 4, (4 - slitWidth) / 2),
    mat.darkMetal,
  );
  slitRight.position.set(0, 0, (4 + slitWidth) / 4);
  group.add(slitRight);

  group.position.set(-10, 0, 0);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the gold foil: thin disc with holder ring.
 */
export function buildGoldFoil(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // Gold foil (very thin disc, in YZ plane, normal along X)
  const foil = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 2.0, 0.04, 64),
    mat.gold,
  );
  foil.rotation.z = -Math.PI / 2;
  group.add(foil);

  // Holder ring
  const holder = new THREE.Mesh(
    new THREE.TorusGeometry(2.05, 0.1, 8, 64),
    mat.brass,
  );
  holder.rotation.y = Math.PI / 2;
  group.add(holder);

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
 * Build the scintillation screen: cylindrical ZnS screen on the detector ring.
 * The screen is an annulus at fixed radius, with its axis along X.
 */
export function buildScintillationScreen(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // ZnS annulus (large ring) facing foil center along X
  const screen = new THREE.Mesh(
    new THREE.TorusGeometry(7.5, 0.15, 16, 64),
    mat.zincSulfide,
  );
  screen.rotation.y = Math.PI / 2;
  group.add(screen);

  // Thin backing (brass) behind
  const backing = new THREE.Mesh(
    new THREE.TorusGeometry(7.5, 0.08, 8, 64),
    mat.brass,
  );
  backing.rotation.y = Math.PI / 2;
  backing.position.x = 0.1;
  group.add(backing);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the rotating microscope: mounted on a rotating arm from foil center
 * to the screen edge. For simplicity, position it at 45° toward the screen.
 */
export function buildRotatingMicroscope(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // Microscope barrel (cylinder pointing inward toward screen)
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 2.5, 16),
    mat.darkMetal,
  );
  barrel.rotation.z = -Math.PI / 2;
  group.add(barrel);

  // Eyepiece (top)
  const eyepiece = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.4, 0.5, 16),
    mat.steel,
  );
  eyepiece.rotation.z = -Math.PI / 2;
  eyepiece.position.set(-1.5, 0, 0);
  group.add(eyepiece);

  // Objective lens (front, toward screen)
  const objective = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.25, 0.3, 16),
    mat.glass,
  );
  objective.rotation.z = -Math.PI / 2;
  objective.position.set(1.5, 0, 0);
  group.add(objective);

  // Mounting arm (thin rod from foil center to microscope position)
  const arm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 7.5, 8),
    mat.steel,
  );
  arm.rotation.z = Math.PI / 2;
  arm.position.set(-3.75, 0, 0);
  group.add(arm);

  // Position microscope at 45° (toward detector ring)
  const angle = Math.PI / 4; // 45°
  const radius = 7.5;
  group.position.set(
    radius * Math.cos(angle),
    radius * Math.sin(angle),
    0,
  );
  group.rotation.z = angle - Math.PI / 2;

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the angular scale: protractor arc around the foil.
 */
export function buildAngularScale(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // Arc (partial torus, 200° sweep starting at -10° from beam axis)
  const arcRadius = 8.2;
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(arcRadius, 0.05, 6, 128, (200 * Math.PI) / 180),
    mat.steel,
  );
  arc.rotation.z = (-10 * Math.PI) / 180;
  group.add(arc);

  // Tick marks every 30°
  for (let deg = 0; deg <= 180; deg += 30) {
    const rad = (deg * Math.PI) / 180;
    const tick = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.08, 0.08),
      mat.steel,
    );
    tick.position.set(
      arcRadius * Math.cos(rad),
      arcRadius * Math.sin(rad),
      0,
    );
    tick.rotation.z = rad;
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
 * Build the vacuum chamber: transparent cylinder enclosing everything,
 * with brass flanges at each end.
 */
export function buildVacuumChamber(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  // Main transparent cylinder (axis along X)
  const chamber = new THREE.Mesh(
    new THREE.CylinderGeometry(9, 9, 32, 64, 1, true),
    mat.glass,
  );
  chamber.rotation.z = -Math.PI / 2;
  group.add(chamber);

  // End flanges
  const flangeLeft = new THREE.Mesh(
    new THREE.CylinderGeometry(9.3, 9.3, 0.5, 64),
    mat.brass,
  );
  flangeLeft.rotation.z = -Math.PI / 2;
  flangeLeft.position.set(-16, 0, 0);
  group.add(flangeLeft);

  const flangeRight = new THREE.Mesh(
    new THREE.CylinderGeometry(9.3, 9.3, 0.5, 64),
    mat.brass,
  );
  flangeRight.rotation.z = -Math.PI / 2;
  flangeRight.position.set(16, 0, 0);
  group.add(flangeRight);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build the base platform: concrete slab supporting everything.
 */
export function buildBasePlatform(
  component: ApparatusComponent,
  mat: Materials,
): BuiltComponent {
  const group = new THREE.Group();

  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(40, 0.8, 24),
    mat.concrete,
  );
  group.add(slab);

  // Support legs
  const legPositions = [
    [-16, 0, -9],
    [-16, 0, 9],
    [16, 0, -9],
    [16, 0, 9],
  ];
  for (const [x, , z] of legPositions) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 4, 1.5),
      mat.darkMetal,
    );
    leg.position.set(x, -2.4, z);
    group.add(leg);
  }

  group.position.set(0, -5, 0);

  return {
    id: component.id,
    mesh: group,
    component,
    originalPosition: group.position.clone(),
    originalRotation: group.rotation.clone(),
  };
}

/**
 * Build all components of the Rutherford apparatus.
 * Returns a map from partId to BuiltComponent.
 */
export function buildRutherfordApparatus(
  components: readonly ApparatusComponent[],
): Map<string, BuiltComponent> {
  const mat = createMaterials();
  const result = new Map<string, BuiltComponent>();

  const builders: Record<string, (c: ApparatusComponent, m: Materials) => BuiltComponent> = {
    "alpha-source": buildAlphaSource,
    "source-housing": buildAlphaSource,  // source-housing renders as part of alpha-source
    collimator: buildCollimator,
    "gold-foil": buildGoldFoil,
    "foil-holder": buildGoldFoil,  // foil-holder renders as part of gold-foil (brass ring)
    "scintillation-screen": buildScintillationScreen,
    "rotating-microscope": buildRotatingMicroscope,
    "angular-scale": buildAngularScale,
    "vacuum-chamber": buildVacuumChamber,
    "chamber-window": buildVacuumChamber,  // chamber-window is part of vacuum-chamber (transparent glass)
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
