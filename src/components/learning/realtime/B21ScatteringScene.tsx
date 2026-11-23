"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { rutherfordTrail, sampleRutherford, type RutherfordRun } from "@/lib/rutherford-model";
import styles from "./B21RealtimeLab.module.css";

type Focus = "overview" | "source" | "detector";
type SceneAPI = { focus: (focus: Focus) => void; update: (run: RutherfordRun, time: number) => void; reset: () => void; orbit: (dx: number, dy: number) => void; zoom: (factor: number) => void };
const SCALE = 50;

/** Renderer only: all positions are sampled from the same Coulomb run as the table. */
export function B21ScatteringScene({ run, time, focus }: { run: RutherfordRun; time: number; focus: Focus | null }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<SceneAPI | null>(null);
  const latest = useRef({ run, time });
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  useEffect(() => { latest.current = { run, time }; api.current?.update(run, time); }, [run, time]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" }); }
    catch {
      // Browser capability is only known after mounting.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("fallback"); return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x102a38);
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
    camera.position.set(3, 5.5, 13);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false; controls.enablePan = false; controls.minDistance = 7; controls.maxDistance = 23;
    controls.update(); controls.saveState();
    scene.add(new THREE.HemisphereLight(0xd5f8ff, 0x314353, 2));
    const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(4, 8, 8); scene.add(light);
    const source = new THREE.Mesh(new THREE.CylinderGeometry(.33, .33, 1.1, 20), new THREE.MeshStandardMaterial({ color: 0x4b7085, roughness: .65 }));
    source.rotation.z = Math.PI / 2; source.position.x = -4.5; scene.add(source);
    const foil = new THREE.Mesh(new THREE.BoxGeometry(.05, 6.6, 1.4), new THREE.MeshStandardMaterial({ color: 0xd9a745, transparent: true, opacity: .28, side: THREE.DoubleSide })); scene.add(foil);
    const nucleus = new THREE.Mesh(new THREE.SphereGeometry(.23, 20, 12), new THREE.MeshStandardMaterial({ color: 0xf1bb51 })); scene.add(nucleus);
    const alpha = new THREE.Mesh(new THREE.SphereGeometry(.16, 16, 10), new THREE.MeshStandardMaterial({ color: 0x58e2cb })); scene.add(alpha);
    const detector = new THREE.Mesh(new THREE.RingGeometry(3.58, 3.63, 96), new THREE.MeshBasicMaterial({ color: 0x88a7b2, side: THREE.DoubleSide, transparent: true, opacity: .65 })); detector.position.z = -.05; scene.add(detector);
    const trailGeometry = new THREE.BufferGeometry();
    const trail = new THREE.Line(trailGeometry, new THREE.LineBasicMaterial({ color: 0x58e2cb })); scene.add(trail);
    const render = () => renderer.render(scene, camera);
    const resize = () => { if (!element.clientWidth || !element.clientHeight) return; renderer.setSize(element.clientWidth, element.clientHeight, false); camera.aspect = element.clientWidth / element.clientHeight; camera.updateProjectionMatrix(); render(); };
    const observer = new ResizeObserver(resize); observer.observe(element);
    controls.addEventListener("change", render);
    const lost = (event: Event) => { event.preventDefault(); setStatus("fallback"); };
    renderer.domElement.addEventListener("webglcontextlost", lost);
    api.current = {
      focus(value) {
        if (value === "source") { controls.target.set(-2.8, 0, 0); camera.position.set(-2.8, 3.2, 10); }
        else if (value === "detector") { controls.target.set(0, 0, 0); camera.position.set(0, 2, 13); }
        else { controls.target.set(0, 0, 0); camera.position.set(3, 5.5, 13); }
        controls.update();
      },
      update(next, elapsed) {
        const particle = sampleRutherford(next, elapsed);
        alpha.position.set(particle.xFm / SCALE, particle.yFm / SCALE, .06);
        trailGeometry.setFromPoints(rutherfordTrail(next, elapsed, 70).map(p => new THREE.Vector3(p.xFm / SCALE, p.yFm / SCALE, .06)));
        render();
      },
      reset() { controls.reset(); },
      orbit(dx, dy) { const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)); spherical.theta += dx; spherical.phi = THREE.MathUtils.clamp(spherical.phi + dy, .05, Math.PI - .05); camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical)); controls.update(); },
      zoom(factor) { const offset = camera.position.clone().sub(controls.target); offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance)); camera.position.copy(controls.target).add(offset); controls.update(); },
    };
    api.current.update(latest.current.run, latest.current.time); resize();
    setStatus("ready");
    return () => {
      api.current = null; observer.disconnect(); controls.removeEventListener("change", render); controls.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse(object => { if (object instanceof THREE.Mesh || object instanceof THREE.Line) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(material => material.dispose()); } });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  useEffect(() => { if (focus) api.current?.focus(focus); }, [focus]);
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.metaKey || event.ctrlKey) return;
    switch (event.key) {
      case "ArrowLeft": api.current?.orbit(-.15, 0); break;
      case "ArrowRight": api.current?.orbit(.15, 0); break;
      case "ArrowUp": api.current?.orbit(0, -.15); break;
      case "ArrowDown": api.current?.orbit(0, .15); break;
      case "+": case "=": api.current?.zoom(.85); break;
      case "-": api.current?.zoom(1.15); break;
      case "Home": api.current?.reset(); break;
      default: return;
    }
    event.preventDefault();
  }
  const point = sampleRutherford(run, time);
  const trail = rutherfordTrail(run, time, 70);
  return <div className={styles.sceneBox}>
    <div ref={host} className={styles.canvas} tabIndex={status === "ready" ? 0 : undefined} onKeyDown={keyboard} aria-label={`Cảnh tán xạ. Hạt alpha cách tâm ${point.radiusFm.toFixed(1)} femtômét. Mũi tên xoay, cộng trừ thu phóng, Home đặt lại góc nhìn.`} />
    {status !== "ready" && <svg className={styles.fallback} viewBox="-225 -225 450 450" role="img" aria-label={`Sơ đồ tán xạ thay thế, hạt cách tâm ${point.radiusFm.toFixed(1)} fm`}>
      <circle r="180" fill="none" stroke="#8ba8b8" strokeDasharray="5 5" /><path d="M 0 -170 V 170" stroke="#d5a842" strokeWidth="5" opacity=".5" /><circle r="8" fill="#f1bb51" />
      <polyline fill="none" stroke="#58e2cb" strokeWidth="3" points={trail.map(p => `${p.xFm},${-p.yFm}`).join(" ")} /><circle cx={point.xFm} cy={-point.yFm} r="6" fill="#58e2cb" />
    </svg>}
    <div className={styles.sceneLegend}><span>● Nguồn α bên trái</span><span>● Hạt nhân vàng</span><span>○ Màn ghi nhận</span><button type="button" disabled={status !== "ready"} onClick={() => api.current?.reset()}>Đặt lại góc nhìn</button></div>
    <p className={styles.small}>{status === "fallback" ? "Không có WebGL: sơ đồ 2D và bảng đo vẫn dùng cùng mô hình." : "Kéo/vuốt để xoay, cuộn để thu phóng; dùng mũi tên và +/− khi khung được chọn."}</p>
  </div>;
}
