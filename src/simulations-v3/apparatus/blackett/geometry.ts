import * as THREE from "three";
import type { ApparatusComponent } from "../../core/types";
import {
  buildBlackettTrackDataset,
  type BlackettRunMode,
  type BlackettTrackDataset,
} from "../../physics/blackett-engine";

export interface BuiltBlackettPart {
  readonly component: ApparatusComponent;
  readonly mesh: THREE.Group;
  readonly labelAnchorLocal: THREE.Vector3;
}

export interface BlackettSceneHandles {
  readonly root: THREE.Group;
  readonly components: Map<string, BuiltBlackettPart>;
  readonly updateTracks: (runMode: BlackettRunMode, progress: number) => void;
  readonly setHighlightPart: (partId: string | null) => void;
  readonly disposeExtra: () => void;
}

function tagSubtreePartId(group: THREE.Object3D, partId: string): void {
  group.userData.partId = partId;
  group.traverse((child) => {
    child.userData.partId = partId;
  });
}

export function buildBlackettApparatus(
  specs: readonly ApparatusComponent[],
): BlackettSceneHandles {
  const root = new THREE.Group();
  const components = new Map<string, BuiltBlackettPart>();

  // Optical bench / dark laboratory table surface (non-interactive backdrop)
  const benchMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.85,
    metalness: 0.15,
  });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.22, 6.8), benchMat);
  bench.position.set(0, -0.58, 0);
  root.add(bench);

  // =========================================================================
  // 1. CHAMBER BODY — Vỏ buồng sương trụ, pít-tông giãn nở & đáy nhung đen
  // =========================================================================
  const chamberGroup = new THREE.Group();

  const baseFlangeMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.45,
    metalness: 0.65,
  });
  const basePedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(2.58, 2.72, 0.42, 48),
    baseFlangeMat,
  );
  basePedestal.position.set(0, -0.24, 0);
  chamberGroup.add(basePedestal);

  // Cylindrical outer wall (open-ended so top window looks directly inside)
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.38,
    metalness: 0.72,
    side: THREE.DoubleSide,
  });
  const outerWall = new THREE.Mesh(
    new THREE.CylinderGeometry(2.34, 2.34, 1.08, 56, 1, true),
    wallMat,
  );
  outerWall.position.set(0, 0.48, 0);
  chamberGroup.add(outerWall);

  const innerWallMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.92,
    metalness: 0.08,
    side: THREE.BackSide,
  });
  const innerWall = new THREE.Mesh(
    new THREE.CylinderGeometry(2.22, 2.22, 1.04, 56, 1, true),
    innerWallMat,
  );
  innerWall.position.set(0, 0.48, 0);
  chamberGroup.add(innerWall);

  // Matte black velvet piston floor (creates contrast for white vapor droplets!)
  const velvetFloorMat = new THREE.MeshStandardMaterial({
    color: 0x050811,
    roughness: 0.98,
    metalness: 0.02,
  });
  const velvetFloor = new THREE.Mesh(
    new THREE.CylinderGeometry(2.22, 2.22, 0.08, 56),
    velvetFloorMat,
  );
  velvetFloor.position.set(0, 0.16, 0);
  chamberGroup.add(velvetFloor);

  // Gas valve & adiabatic expansion piston lever on right side (+X)
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.32,
    metalness: 0.82,
  });
  const valveStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.55, 18),
    brassMat,
  );
  valveStem.rotation.z = Math.PI / 2;
  valveStem.position.set(2.58, 0.12, 0.55);
  chamberGroup.add(valveStem);

  const valveWheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.035, 12, 24),
    new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4, metalness: 0.4 }),
  );
  valveWheel.rotation.y = Math.PI / 2;
  valveWheel.position.set(2.86, 0.12, 0.55);
  chamberGroup.add(valveWheel);

  tagSubtreePartId(chamberGroup, "chamber-body");
  root.add(chamberGroup);

  // =========================================================================
  // 2. OBSERVATION WINDOW — Cửa sổ kính quan sát phía trên + vành đồng giữ kín
  // =========================================================================
  const windowGroup = new THREE.Group();

  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.28,
    metalness: 0.85,
  });
  const bezelTorus = new THREE.Mesh(
    new THREE.TorusGeometry(2.28, 0.095, 18, 64),
    bezelMat,
  );
  bezelTorus.rotation.x = Math.PI / 2;
  bezelTorus.position.set(0, 1.03, 0);
  windowGroup.add(bezelTorus);

  // 8 clamping bolts around the brass bezel
  const boltGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.09, 6);
  const boltMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.3,
    metalness: 0.85,
  });
  for (let i = 0; i < 8; i++) {
    const ang = (i * Math.PI) / 4 + Math.PI / 8;
    const bolt = new THREE.Mesh(boltGeo, boltMat);
    bolt.position.set(Math.cos(ang) * 2.28, 1.09, Math.sin(ang) * 2.28);
    windowGroup.add(bolt);
  }

  // Transparent optical glass disc (subtle sky reflection, clear view inside)
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.16,
    roughness: 0.06,
    metalness: 0.05,
    depthWrite: false,
  });
  const glassDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, 0.035, 56),
    glassMat,
  );
  glassDisc.position.set(0, 1.03, 0);
  windowGroup.add(glassDisc);

  tagSubtreePartId(windowGroup, "observation-window");
  root.add(windowGroup);

  // =========================================================================
  // 3. ALPHA ENTRY PORT — Vị trí hạt tới (Nguồn α & khe chuẩn trực bên trái)
  // =========================================================================
  const portGroup = new THREE.Group();

  const sourceBarrelMat = new THREE.MeshStandardMaterial({
    color: 0xb45309,
    roughness: 0.34,
    metalness: 0.78,
  });
  const sourceBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.28, 0.88, 24),
    sourceBarrelMat,
  );
  sourceBarrel.rotation.z = Math.PI / 2;
  sourceBarrel.position.set(-2.68, 0.48, 0.06);
  portGroup.add(sourceBarrel);

  const sourceCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.16, 24),
    new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.35,
      metalness: 0.45,
      emissive: 0x450a0a,
    }),
  );
  sourceCap.rotation.z = Math.PI / 2;
  sourceCap.position.set(-3.16, 0.48, 0.06);
  portGroup.add(sourceCap);

  // Inner collimator nozzle protruding slightly inside left wall
  const collimatorNozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.15, 0.34, 20),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.25,
      metalness: 0.65,
      emissive: 0x0c4a6e,
    }),
  );
  collimatorNozzle.rotation.z = Math.PI / 2;
  collimatorNozzle.position.set(-2.08, 0.48, 0.06);
  portGroup.add(collimatorNozzle);

  // Support post from bench to alpha port
  const portStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.11, 0.96, 16),
    baseFlangeMat,
  );
  portStand.position.set(-2.78, -0.02, 0.06);
  portGroup.add(portStand);

  tagSubtreePartId(portGroup, "alpha-entry-port");
  root.add(portGroup);

  // =========================================================================
  // 4. OBSERVATION ZONE — Vùng quan sát khí ¹⁴₇N siêu bão hòa & đèn chiếu ngang
  // =========================================================================
  const zoneGroup = new THREE.Group();

  // Side illumination lamp housing on back wall (-Z)
  const lampBox = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 0.42, 0.52),
    new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.65,
    }),
  );
  lampBox.position.set(0, 0.52, -2.56);
  zoneGroup.add(lampBox);

  const lampLens = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.22, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xca8a04,
      emissiveIntensity: 0.75,
      roughness: 0.2,
    }),
  );
  lampLens.position.set(0, 0.52, -2.28);
  zoneGroup.add(lampLens);

  // Subtle boundary ring & illuminated mist plane inside the active observation volume
  const zoneRing = new THREE.Mesh(
    new THREE.RingGeometry(1.94, 2.02, 64),
    new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
    }),
  );
  zoneRing.rotation.x = -Math.PI / 2;
  zoneRing.position.set(0, 0.23, 0);
  zoneGroup.add(zoneRing);

  const mistDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.98, 1.98, 0.02, 48),
    new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.05,
      depthWrite: false,
    }),
  );
  mistDisc.position.set(0, 0.46, 0);
  zoneGroup.add(mistDisc);

  tagSubtreePartId(zoneGroup, "observation-zone");
  root.add(zoneGroup);

  // =========================================================================
  // 5. VAPOR TRACKS — Hệ vết sương ngưng tụ (Lượt vệt thẳng & Lượt chữ Y)
  // =========================================================================
  const tracksGroup = new THREE.Group();

  // Invisible raycast helper slab near central track plane so clicking tracks in 3D hits easily
  const trackHitProxy = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 0.22, 1.7),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  trackHitProxy.position.set(-0.05, 0.48, -0.15);
  tracksGroup.add(trackHitProxy);

  const dynamicDropletContainer = new THREE.Group();
  tracksGroup.add(dynamicDropletContainer);

  tagSubtreePartId(tracksGroup, "vapor-tracks");
  root.add(tracksGroup);

  // Pre-build datasets & shared droplet geometries/materials for 60fps updates
  const datasets: Record<BlackettRunMode, BlackettTrackDataset> = {
    straight: buildBlackettTrackDataset("straight"),
    y_fork: buildBlackettTrackDataset("y_fork"),
  };

  const unitSphereGeo = new THREE.SphereGeometry(1, 12, 10);
  const bgAlphaMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    emissive: 0x334155,
    emissiveIntensity: 0.35,
    roughness: 0.35,
    transparent: true,
    opacity: 0.42,
  });
  const mainStraightMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.65,
    roughness: 0.22,
  });
  const incidentAlphaMat = new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    emissive: 0x0284c7,
    emissiveIntensity: 0.72,
    roughness: 0.2,
  });
  const vertexFlashMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfacc15,
    emissiveIntensity: 1.1,
    roughness: 0.15,
  });
  const thinLongProtonMat = new THREE.MeshStandardMaterial({
    color: 0xfef9c3,
    emissive: 0xeab308,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });
  const thickShortOxygenMat = new THREE.MeshStandardMaterial({
    color: 0xfda4af,
    emissive: 0xf43f5e,
    emissiveIntensity: 0.85,
    roughness: 0.22,
  });

  // Sleek highlight ring around selected part
  const highlightHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.55, 0.013, 14, 64),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee }),
  );
  highlightHalo.rotation.x = Math.PI / 2;
  highlightHalo.visible = false;
  root.add(highlightHalo);

  let builtMode: BlackettRunMode | null = null;
  let dropletMeshes: { mesh: THREE.Mesh; revealAt: number }[] = [];

  function rebuildModeMeshes(mode: BlackettRunMode): void {
    while (dynamicDropletContainer.children.length > 0) {
      dynamicDropletContainer.remove(dynamicDropletContainer.children[0]);
    }
    dropletMeshes = [];
    const ds = datasets[mode];
    for (const d of ds.droplets) {
      let mat: THREE.Material;
      if (mode === "straight") {
        mat = d.opacity > 0.85 ? mainStraightMat : bgAlphaMat;
      } else if (d.segmentId === "1_incident_alpha") {
        mat = incidentAlphaMat;
      } else if (d.segmentId === "2_vertex") {
        mat = vertexFlashMat;
      } else if (d.segmentId === "3_thin_long") {
        mat = thinLongProtonMat;
      } else if (d.segmentId === "4_thick_short") {
        mat = thickShortOxygenMat;
      } else {
        mat = bgAlphaMat;
      }

      const m = new THREE.Mesh(unitSphereGeo, mat);
      m.position.set(d.x, d.y, d.z);
      m.scale.setScalar(d.radius);
      m.userData.partId = "vapor-tracks";
      dynamicDropletContainer.add(m);
      dropletMeshes.push({ mesh: m, revealAt: d.revealAt });
    }
    builtMode = mode;
  }

  function updateTracks(runMode: BlackettRunMode, progress: number): void {
    if (builtMode !== runMode) {
      rebuildModeMeshes(runMode);
    }
    const clamped = Math.max(0, Math.min(1, progress));
    for (const item of dropletMeshes) {
      item.mesh.visible = clamped >= item.revealAt;
    }
  }

  // Initialize default Y-fork full view
  updateTracks("y_fork", 1);

  const anchorMap: Record<string, { group: THREE.Group; anchor: THREE.Vector3 }> = {
    "chamber-body": { group: chamberGroup, anchor: new THREE.Vector3(2.2, 0.25, 1.35) },
    "observation-window": { group: windowGroup, anchor: new THREE.Vector3(1.65, 1.18, -1.55) },
    "alpha-entry-port": { group: portGroup, anchor: new THREE.Vector3(-2.65, 0.82, 0.06) },
    "observation-zone": { group: zoneGroup, anchor: new THREE.Vector3(-0.95, 0.88, -2.25) },
    "vapor-tracks": { group: tracksGroup, anchor: new THREE.Vector3(0.95, 0.58, -0.25) },
  };

  for (const spec of specs) {
    const entry = anchorMap[spec.id];
    if (entry) {
      components.set(spec.id, {
        component: spec,
        mesh: entry.group,
        labelAnchorLocal: entry.anchor,
      });
    }
  }

  function setHighlightPart(partId: string | null): void {
    if (!partId || !anchorMap[partId]) {
      highlightHalo.visible = false;
      return;
    }
    highlightHalo.visible = true;
    if (partId === "chamber-body") {
      highlightHalo.position.set(0, 0.05, 0);
      highlightHalo.scale.setScalar(4.45);
    } else if (partId === "observation-window") {
      highlightHalo.position.set(0, 1.08, 0);
      highlightHalo.scale.setScalar(4.15);
    } else if (partId === "alpha-entry-port") {
      highlightHalo.position.set(-2.55, 0.48, 0.06);
      highlightHalo.scale.setScalar(1.1);
    } else if (partId === "observation-zone") {
      highlightHalo.position.set(0, 0.26, 0);
      highlightHalo.scale.setScalar(3.6);
    } else {
      highlightHalo.position.set(-0.18, 0.5, 0.06);
      highlightHalo.scale.setScalar(1.35);
    }
  }

  function disposeExtra(): void {
    unitSphereGeo.dispose();
    bgAlphaMat.dispose();
    mainStraightMat.dispose();
    incidentAlphaMat.dispose();
    vertexFlashMat.dispose();
    thinLongProtonMat.dispose();
    thickShortOxygenMat.dispose();
    bench.geometry.dispose();
    benchMat.dispose();
    highlightHalo.geometry.dispose();
    (highlightHalo.material as THREE.Material).dispose();
  }

  return {
    root,
    components,
    updateTracks,
    setHighlightPart,
    disposeExtra,
  };
}
