"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import type { DecaySample } from "@/lib/radioactive-decay-model";
import styles from "./HalfLifeScene.module.css";

type SceneHandle = {
  update: (sample: DecaySample, time: number) => void;
  reset: () => void;
  zoom: (factor: number) => void;
  orbit: (azimuth: number, elevation: number) => void;
};

/** Each instance represents one entire nucleus, not a nucleon or its physical position. */
export function HalfLifeScene({ sample, time, onRotate, onAccessibleObservation, fullscreenTarget }: { sample: DecaySample; time: number; onRotate: () => void; onAccessibleObservation: () => void; fullscreenTarget?: RefObject<HTMLElement | null> }) {
  const root = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<SceneHandle | null>(null);
  const rotateCallback = useRef(onRotate);
  const latest = useRef({ sample, time });
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  useEffect(() => { rotateCallback.current = onRotate; }, [onRotate]);
  useEffect(() => { latest.current = { sample, time }; }, [sample, time]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
    } catch {
      // WebGL capability is external browser state, discovered during setup.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("fallback");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x102b3c);
    element.appendChild(renderer.domElement);
    const world = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(8, 6, 11);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.enablePan = false;
    controls.minDistance = 6;
    controls.maxDistance = 28;
    controls.target.set(0, 0, 0);
    controls.update();
    controls.saveState();
    world.add(new THREE.HemisphereLight(0xd9f8ff, 0x324b59, 2.2));
    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(3, 8, 5);
    world.add(light);
    const geometry = new THREE.SphereGeometry(0.19, 12, 8);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.7, metalness: 0 });
    let instances: THREE.InstancedMesh | null = null;
    let count = 0;
    const transform = new THREE.Object3D();
    const liveColor = new THREE.Color("#5ae5c1");
    const decayedColor = new THREE.Color("#678291");
    const render = () => renderer.render(world, camera);
    let gesture = false;
    let beforeAzimuth = controls.getAzimuthalAngle();
    let beforePolar = controls.getPolarAngle();
    const start = () => { gesture = true; beforeAzimuth = controls.getAzimuthalAngle(); beforePolar = controls.getPolarAngle(); };
    const end = () => { gesture = false; };
    const changed = () => {
      if (gesture && (Math.abs(controls.getAzimuthalAngle() - beforeAzimuth) > 0.02 || Math.abs(controls.getPolarAngle() - beforePolar) > 0.02)) {
        gesture = false;
        rotateCallback.current();
      }
      render();
    };
    controls.addEventListener("start", start);
    controls.addEventListener("end", end);
    controls.addEventListener("change", changed);
    const resize = () => {
      const width = element.clientWidth;
      const height = element.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    const contextLost = (event: Event) => { event.preventDefault(); setStatus("fallback"); };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    scene.current = {
      update(next, currentTime) {
        if (count !== next.lifetimes.length || !instances) {
          if (instances) { world.remove(instances); instances.dispose(); }
          count = next.lifetimes.length;
          instances = new THREE.InstancedMesh(geometry, material, count);
          // Place the sample in a compact cubic grid; the spacing is a visual convention.
          const side = Math.ceil(Math.cbrt(count));
          const spacing = Math.min(0.7, 7 / Math.max(1, side - 1));
          for (let i = 0; i < count; i++) {
            transform.position.set((i % side - (side - 1) / 2) * spacing, (Math.floor(i / side) % side - (side - 1) / 2) * spacing, (Math.floor(i / (side * side)) - (side - 1) / 2) * spacing);
            transform.updateMatrix();
            instances.setMatrixAt(i, transform.matrix);
          }
          instances.instanceMatrix.needsUpdate = true;
          world.add(instances);
        }
        next.lifetimes.forEach((lifetime, i) => instances!.setColorAt(i, lifetime > currentTime ? liveColor : decayedColor));
        if (instances.instanceColor) instances.instanceColor.needsUpdate = true;
        render();
      },
      reset() { controls.reset(); },
      zoom(factor) {
        const offset = camera.position.clone().sub(controls.target);
        offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
        camera.position.copy(controls.target).add(offset);
        controls.update();
      },
      orbit(azimuth, elevation) {
        const offset = camera.position.clone().sub(controls.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.theta += azimuth;
        spherical.phi = THREE.MathUtils.clamp(spherical.phi + elevation, 0.05, Math.PI - 0.05);
        camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
        controls.update();
        rotateCallback.current();
      },
    };
    scene.current.update(latest.current.sample, latest.current.time);
    resize();
    setStatus("ready");
    return () => {
      scene.current = null;
      observer.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      controls.removeEventListener("start", start);
      controls.removeEventListener("end", end);
      controls.removeEventListener("change", changed);
      controls.dispose();
      instances?.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  useEffect(() => { scene.current?.update(sample, time); }, [sample, time]);
  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement !== null && document.fullscreenElement === (fullscreenTarget?.current ?? root.current));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, [fullscreenTarget]);

  async function toggleFullscreen() {
    try {
      const target = fullscreenTarget?.current ?? root.current;
      if (document.fullscreenElement === target) await document.exitFullscreen();
      else if (target?.requestFullscreen) await target.requestFullscreen();
      else throw new Error("unsupported");
      setFullscreenError("");
    } catch { setFullscreenError("Trình duyệt không cho phép mở toàn màn hình."); }
  }
  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    switch (event.key) {
      case "ArrowLeft": scene.current?.orbit(-0.15, 0); break;
      case "ArrowRight": scene.current?.orbit(0.15, 0); break;
      case "ArrowUp": scene.current?.orbit(0, -0.15); break;
      case "ArrowDown": scene.current?.orbit(0, 0.15); break;
      case "+": case "=": scene.current?.zoom(0.85); break;
      case "-": scene.current?.zoom(1.18); break;
      case "Home": scene.current?.reset(); break;
      default: return;
    }
    event.preventDefault();
  }
  const remaining = sample.lifetimes.filter(lifetime => lifetime > time).length;
  return <section className={styles.scene} ref={root} aria-label="Mẫu hạt nhân trong không gian ba chiều">
    <div className={styles.heading}><div><strong>Quan sát mẫu hạt nhân</strong><p>Mỗi hình cầu là một hạt nhân; vị trí và kích thước được quy ước.</p></div>
      <button type="button" onClick={toggleFullscreen}>{fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}</button></div>
    {fullscreenError && <p role="status">{fullscreenError}</p>}
    <div ref={host} className={styles.canvas} tabIndex={status === "ready" ? 0 : undefined} onKeyDown={keyboard}
      aria-label={`Mô hình 3D. ${remaining} hạt nhân chưa phân rã, ${sample.initialCount - remaining} đã phân rã. Dùng phím mũi tên để xoay, cộng trừ để thu phóng, Home để đặt lại.`} />
    {status === "loading" && <p role="status">Đang chuẩn bị mô hình…</p>}
    {status === "fallback" && <div className={styles.fallback}><strong>Không mở được WebGL</strong><p>Sơ đồ thay thế: mẫu gồm {sample.initialCount} hạt nhân; tại thời điểm này có {remaining} hạt chưa phân rã và {sample.initialCount - remaining} hạt đã phân rã. Trong mô hình 3D, mỗi hình cầu biểu diễn một hạt nhân; đổi góc nhìn chỉ đổi cách quan sát, không đổi thời điểm phân rã. Hãy tiếp tục đối chiếu số liệu và đồ thị.</p><button type="button" onClick={onAccessibleObservation}>Tôi đã đọc mô tả thay thế</button></div>}
    <div className={styles.footer}><p><span className={styles.live} /> Chưa phân rã · <span className={styles.decayed} /> Đã phân rã</p><div className={styles.buttons}>
      <button type="button" disabled={status !== "ready"} onClick={() => scene.current?.zoom(0.85)} aria-label="Phóng to mô hình">＋</button>
      <button type="button" disabled={status !== "ready"} onClick={() => scene.current?.zoom(1.18)} aria-label="Thu nhỏ mô hình">−</button>
      <button type="button" disabled={status !== "ready"} onClick={() => scene.current?.reset()}>Đặt lại góc nhìn</button>
    </div></div>
    <p className={styles.help}>Kéo hoặc vuốt để xoay; lăn chuột hoặc chụm hai ngón để thu phóng. Khi khung có tiêu điểm, dùng mũi tên, +, − và Home.</p>
  </section>;
}
