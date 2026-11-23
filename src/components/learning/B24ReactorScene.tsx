"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { REACTOR_FLOW_STAGES } from "@/lib/reactor-model";
import styles from "./B24RealtimeLab.module.css";

/** Geometry is a schematic PWR teaching diagram; it is not a plant design. */
export function B24ReactorScene({ rod, selected, onSelect }: { rod: number; selected: number; onSelect: (index: number) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const drawRef = useRef<((rod: number, selected: number) => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const keyRef = useRef<((key: string) => void) | null>(null);
  const callback = useRef(onSelect);
  const current = useRef({ rod, selected });
  const [failed, setFailed] = useState(false);
  useEffect(() => { callback.current = onSelect; }, [onSelect]);
  useEffect(() => { current.current = { rod, selected }; drawRef.current?.(rod, selected); }, [rod, selected]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" }); }
    catch { /* A readable 2D alternative remains below. */
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailed(true); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x10283a);
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(43, 1, .1, 100);
    camera.position.set(9, 7, 18);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, .6, 0); controls.enablePan = false; controls.minDistance = 8; controls.maxDistance = 32; controls.update(); controls.saveState();
    scene.add(new THREE.HemisphereLight(0xd6f7ff, 0x34495b, 2));
    const sun = new THREE.DirectionalLight(0xffffff, 2); sun.position.set(4, 10, 8); scene.add(sun);
    const mats = {
      casing: new THREE.MeshStandardMaterial({ color: 0x64899c, transparent: true, opacity: .28, side: THREE.DoubleSide, roughness: .65 }),
      steel: new THREE.MeshStandardMaterial({ color: 0x7797a3, metalness: .35, roughness: .48 }),
      fuel: new THREE.MeshStandardMaterial({ color: 0xe5a860, roughness: .6 }),
      rod: new THREE.MeshStandardMaterial({ color: 0xdee9ed, roughness: .5 }),
      primary: new THREE.MeshStandardMaterial({ color: 0xf4a466, roughness: .55 }),
      secondary: new THREE.MeshStandardMaterial({ color: 0x53c7d3, roughness: .55 }),
      active: new THREE.MeshStandardMaterial({ color: 0xf8d97b, roughness: .55 }),
    };
    const objects: THREE.Object3D[] = [];
    const groups = REACTOR_FLOW_STAGES.map((_, index) => { const group = new THREE.Group(); group.userData.stage = index; scene.add(group); objects.push(group); return group; });
    const addCylinder = (group: THREE.Group, radius: number, height: number, x: number, y: number, z: number, material: THREE.Material, rotationZ = 0) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 20), material);
      mesh.position.set(x, y, z); mesh.rotation.z = rotationZ; group.add(mesh); return mesh;
    };
    // Open-front vessel makes fuel and control rods visible; all dimensions schematic.
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 3.6, 28, 1, true, 0, Math.PI), mats.casing);
    shell.position.set(-5, 1.4, 0); groups[0].add(shell);
    addCylinder(groups[0], 1.05, .18, -5, -.4, 0, mats.steel);
    addCylinder(groups[0], 1.05, .18, -5, 3.2, 0, mats.steel);
    for (let x = -1; x <= 1; x++) for (let z = -1; z <= 1; z++) addCylinder(groups[0], .095, 2.1, -5 + x * .38, .75, z * .38, mats.fuel);
    const rods = new THREE.Group(); groups[0].add(rods);
    for (const x of [-.22, .22]) addCylinder(rods, .07, 2.4, -5 + x, 2, 0, mats.rod);
    addCylinder(groups[1], .75, 3.0, -2.2, 1.2, 0, mats.steel);
    addCylinder(groups[1], .82, .16, -2.2, 2.75, 0, mats.secondary);
    const turbine = new THREE.Mesh(new THREE.ConeGeometry(.85, 2.0, 24), mats.steel); turbine.position.set(.6, 1.5, 0); turbine.rotation.z = -Math.PI / 2; groups[2].add(turbine);
    addCylinder(groups[2], .10, 2.8, 1.35, 1.5, 0, mats.rod, Math.PI / 2);
    addCylinder(groups[3], .65, 1.65, 3, 1.5, 0, mats.steel, Math.PI / 2);
    addCylinder(groups[3], .7, .12, 3.8, 1.5, 0, mats.secondary, Math.PI / 2);
    addCylinder(groups[4], .62, 1.8, .6, -.4, 0, mats.secondary, Math.PI / 2);
    const pipe = (points: [number,number,number][], material: THREE.Material) => {
      const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
      scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 36, .085, 8, false), material));
    };
    pipe([[-4,2.2,0],[-3.5,2.2,0],[-3.2,2.2,0],[-2.95,2,0]], mats.primary);
    pipe([[-2.95,.1,0],[-3.3,-.2,0],[-3.7,-.2,0],[-4,.3,0]], mats.primary);
    pipe([[-2.2,2.75,0],[-1.3,3.2,0],[0,2.9,0],[.2,2.2,0]], mats.secondary);
    pipe([[.6,.7,0],[.6,.1,0],[.6,-.1,0]], mats.secondary);
    pipe([[-.3,-.4,0],[-1.3,-.7,0],[-2.2,-.5,0],[-2.2,-.3,0]], mats.secondary);
    const render = () => renderer.render(scene, camera);
    const controlsChanged = () => render();
    controls.addEventListener("change", controlsChanged);
    const resize = () => { if (!element.clientWidth || !element.clientHeight) return; camera.aspect = element.clientWidth / element.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(element.clientWidth, element.clientHeight, false); render(); };
    const observer = new ResizeObserver(resize); observer.observe(element);
    const ray = new THREE.Raycaster(); const point = new THREE.Vector2();
    const pick = (event: MouseEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect(); point.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
      ray.setFromCamera(point, camera);
      const hit = ray.intersectObjects(objects, true)[0]; let object: THREE.Object3D | null = hit?.object ?? null;
      while (object && object.userData.stage === undefined) object = object.parent;
      if (object && typeof object.userData.stage === "number") callback.current(object.userData.stage);
    };
    renderer.domElement.addEventListener("click", pick);
    const lost = (event: Event) => { event.preventDefault(); setFailed(true); };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    drawRef.current = (insertion, active) => {
      rods.position.y = 1.1 - 1.7 * insertion / 100;
      groups.forEach((group, index) => group.traverse(object => {
        if (object instanceof THREE.Mesh && object !== shell && object.material !== mats.rod && object.material !== mats.fuel) object.material = active === index ? mats.active : (index === 4 ? mats.secondary : mats.steel);
      }));
      render();
    };
    resetRef.current = () => { controls.reset(); render(); };
    keyRef.current = key => {
      const offset = camera.position.clone().sub(controls.target);
      const spherical = new THREE.Spherical().setFromVector3(offset);
      if (key === "ArrowLeft") spherical.theta -= .15;
      if (key === "ArrowRight") spherical.theta += .15;
      if (key === "ArrowUp") spherical.phi -= .15;
      if (key === "ArrowDown") spherical.phi += .15;
      if (key === "+" || key === "=") spherical.radius *= .85;
      if (key === "-") spherical.radius *= 1.18;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi, .08, Math.PI - .08);
      spherical.radius = THREE.MathUtils.clamp(spherical.radius, controls.minDistance, controls.maxDistance);
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical)); controls.update(); render();
    };
    drawRef.current(current.current.rod, current.current.selected); resize();
    return () => {
      drawRef.current = null; resetRef.current = null; keyRef.current = null; observer.disconnect(); controls.removeEventListener("change", controlsChanged); controls.dispose();
      renderer.domElement.removeEventListener("click", pick); renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
      Object.values(mats).forEach(material => material.dispose()); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Home") { event.preventDefault(); resetRef.current?.(); }
    else if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-"].includes(event.key)) { event.preventDefault(); keyRef.current?.(event.key); }
  };
  return <div>
    <div className={styles.scene} ref={host} tabIndex={0} onKeyDown={keyboard} aria-label="Sơ đồ 3D lò nước áp lực; kéo để xoay, cuộn để phóng to, phím mũi tên để xoay, cộng/trừ để phóng to/thu nhỏ, Home để đặt lại camera. Chọn bộ phận bằng các nút phía dưới." />
    {failed && <p role="status" className={styles.fallback}>Không thể mở WebGL. Sử dụng các nút bộ phận và bảng số liệu bên dưới: lõi lò → bộ sinh hơi → tua-bin → máy phát; nước thứ cấp qua bình ngưng rồi trở lại.</p>}
    <button type="button" onClick={() => resetRef.current?.()} disabled={failed}>Đặt lại góc nhìn</button>
  </div>;
}
