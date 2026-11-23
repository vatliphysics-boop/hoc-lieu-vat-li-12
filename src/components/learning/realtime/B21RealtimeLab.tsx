"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { NucleusExplorer } from "@/components/learning/NucleusExplorer";
import { LatexMath } from "@/components/learning/LatexMath";
import { createRutherfordRun, sampleRutherford, type RutherfordSettings } from "@/lib/rutherford-model";
import { hasB21ControlledComparison, isB21InquiryComplete, type B21Reading } from "@/lib/b21-inquiry";
import { B21_LOCAL_KEY, parseB21LocalSnapshot, type B21LocalSnapshot, type B21Mode } from "@/lib/b21-local";
import { B21ScatteringScene } from "./B21ScatteringScene";
import styles from "./B21RealtimeLab.module.css";

const STEPS = [
  { title: "Cấu tạo hạt nhân", text: "Chọn proton hoặc neutron trong mô hình. Giữ Z = 6 và chuyển giữa carbon-12, carbon-14; quan sát số neutron và số khối." },
  { title: "Dự đoán tán xạ", text: "Nguồn bên trái phát một hạt α tới gần hạt nhân vàng. Với cùng động năng, hãy dự đoán góc lệch thay đổi ra sao khi tham số va chạm b giảm." },
  { title: "Đo và giải thích", text: "Chạy tới màn, ghi kết quả. Đổi b, giữ nguyên E rồi đo lại. So sánh hai góc và giải thích bằng tương tác Coulomb." },
] as const;
const speedModel = 5; // zeptoseconds of model time per second at 1×.

export function B21RealtimeLab({ onProgress, preview = false }: { onProgress?: (complete: boolean) => void; preview?: boolean }) {
  const [mode, setMode] = useState<B21Mode>("guided");
  const [scene, setScene] = useState(0);
  const [isotope, setIsotope] = useState<B21LocalSnapshot["isotope"]>("C12");
  const [params, setParams] = useState<RutherfordSettings>({ impactFm: 90, energyMeV: 8 });
  const [clock, setClock] = useState({ time: 0, running: false });
  const [speed, setSpeed] = useState(1);
  const [readings, setReadings] = useState<B21Reading[]>([]);
  const [prediction, setPrediction] = useState<B21LocalSnapshot["prediction"]>("");
  const [predictionAt, setPredictionAt] = useState<number | null>(null);
  const readingSequence = useRef(0);
  const [explanation, setExplanation] = useState<B21LocalSnapshot["explanation"]>("");
  const [localNotice, setLocalNotice] = useState("");
  const [fullscreenError, setFullscreenError] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const run = useMemo(() => createRutherfordRun(params), [params]);
  const point = sampleRutherford(run, clock.time);
  const atDetector = clock.time >= run.durationZs;
  const comparison = hasB21ControlledComparison(readings, predictionAt);
  const complete = isB21InquiryComplete(prediction, explanation, readings, predictionAt);
  useEffect(() => { onProgress?.(complete); }, [complete, onProgress]);
  useEffect(() => {
    const sync = () => setFullscreen(document.fullscreenElement === root.current);
    const pause = () => { if (document.hidden) setClock(state => ({ ...state, running: false })); };
    document.addEventListener("fullscreenchange", sync); document.addEventListener("visibilitychange", pause);
    return () => { document.removeEventListener("fullscreenchange", sync); document.removeEventListener("visibilitychange", pause); };
  }, []);
  useEffect(() => {
    if (!clock.running) return;
    let frame = 0, previous = performance.now();
    const tick = (now: number) => {
      const delta = Math.min((now - previous) / 1000, .1); previous = now;
      setClock(value => { if (!value.running) return value; const time = Math.min(run.durationZs, value.time + delta * speedModel * speed); return { time, running: time < run.durationZs }; });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [clock.running, run.durationZs, speed]);
  function change(patch: Partial<RutherfordSettings>) { setParams(value => ({ ...value, ...patch })); setClock({ time: 0, running: false }); }
  function measure() {
    if (!atDetector) return;
    const id = ++readingSequence.current;
    setReadings(value => [...value, { id, ...params, scattering: run.scatteringAngleDeg, detector: run.detectorAngleDeg }].slice(-12));
  }
  function choosePrediction(value: B21LocalSnapshot["prediction"]) { if (predictionAt === null) setPredictionAt(readingSequence.current); setPrediction(value); }
  function saveLocal() {
    if (preview) return;
    const saved: B21LocalSnapshot = { version: 1, mode, scene, isotope, parameters: params, time: clock.time, speed, readings, readingSequence: readingSequence.current, prediction, predictionAt, explanation };
    try { localStorage.setItem(B21_LOCAL_KEY, JSON.stringify(saved)); setLocalNotice("Đã lưu trên thiết bị tại thời điểm nhấn nút. Nếu tiếp tục thay đổi, hãy lưu lại."); }
    catch { setLocalNotice("Không lưu được trên thiết bị. Thí nghiệm hiện tại vẫn giữ trên trang."); }
  }
  function restoreLocal() {
    if (preview) return;
    try {
      const saved = parseB21LocalSnapshot(JSON.parse(localStorage.getItem(B21_LOCAL_KEY) ?? "null"));
      if (!saved) { setLocalNotice("Không tìm thấy bản lưu B21 hợp lệ; thí nghiệm hiện tại không thay đổi."); return; }
      setMode(saved.mode); setScene(saved.scene); setIsotope(saved.isotope); setParams(saved.parameters); setClock({ time: saved.time, running: false });
      setSpeed(saved.speed); setReadings(saved.readings); readingSequence.current = saved.readingSequence;
      setPrediction(saved.prediction); setPredictionAt(saved.predictionAt); setExplanation(saved.explanation);
      setLocalNotice("Đã khôi phục bản lưu trên thiết bị; thí nghiệm đang tạm dừng.");
    } catch { setLocalNotice("Không đọc được bản lưu B21; thí nghiệm hiện tại không thay đổi."); }
  }
  async function toggleFullscreen() {
    try { if (document.fullscreenElement === root.current) await document.exitFullscreen(); else if (root.current?.requestFullscreen) await root.current.requestFullscreen(); else throw new Error(); setFullscreenError(""); }
    catch { setFullscreenError("Trình duyệt không cho phép toàn màn hình."); }
  }
  const modes: { id: B21Mode; label: string }[] = [{ id: "guided", label: "Có hướng dẫn" }, { id: "free", label: "Tự khám phá" }, { id: "task", label: "Nhiệm vụ" }];
  return <div className={styles.lab} ref={root} data-realtime-lesson="B21">
    <header className={styles.header}><div><p className={styles.eyebrow}>Bài 21 · Cấu trúc hạt nhân</p><h2>Quan sát hạt nhân, khám phá tán xạ</h2><p>Mô hình và phép đo dùng chung một lượt thí nghiệm. Cảnh diễn giải không làm thay đổi dữ liệu.</p></div><button type="button" onClick={toggleFullscreen}>{fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}</button></header>
    {fullscreenError && <p role="status">{fullscreenError}</p>}
    <nav className={styles.modes} aria-label="Chế độ học Bài 21">{modes.map(item => <button key={item.id} type="button" aria-pressed={mode === item.id} onClick={() => setMode(item.id)}>{item.label}</button>)}</nav>
    <div className={styles.layout}><div className={styles.primary}>
      <section className={styles.panel} aria-label="Hạt nhân và đồng vị"><div className={styles.panelHeading}><div><p className={styles.eyebrow}>01 · Mô hình cấu tạo</p><h3>Thành phần hạt nhân</h3></div><label>Đồng vị<select value={isotope} onChange={e => setIsotope(e.target.value as B21LocalSnapshot["isotope"])}><option value="C12">Carbon-12</option><option value="C14">Carbon-14</option><option value="He4">Heli-4</option></select></label></div>
        <NucleusExplorer isotopeId={isotope} compact />
        <p><LatexMath math={String.raw`A=Z+N`} /> · Vị trí và kích thước nucleon là quy ước trực quan.</p>
      </section>
      <section className={styles.panel} aria-label="Thí nghiệm tán xạ Rutherford"><p className={styles.eyebrow}>02 · Thí nghiệm định lượng</p><h3>Hạt alpha và bia vàng</h3>
        <B21ScatteringScene run={run} time={clock.time} focus={mode === "guided" ? scene === 1 ? "source" : scene === 2 ? "detector" : "overview" : null} />
        <div className={styles.inputs}><label>Tham số va chạm b: {params.impactFm} fm<input type="range" min="0" max="100" step="5" value={params.impactFm} onChange={e => change({ impactFm: +e.target.value })} /></label><label>Động năng E: {params.energyMeV} MeV<input type="range" min="3" max="10" step=".5" value={params.energyMeV} onChange={e => change({ energyMeV: +e.target.value })} /></label></div>
        <p className={styles.small}>Đổi b hoặc E bắt đầu lại quỹ đạo hiện tại; các kết quả đã đo được giữ trong bảng.</p>
        <div className={styles.actions}><button className={styles.mainButton} type="button" onClick={() => setClock(value => ({ time: atDetector ? 0 : value.time, running: !value.running }))}>{clock.running ? "Tạm dừng" : atDetector ? "Chạy lại" : clock.time > 0 ? "Tiếp tục" : "Chạy thí nghiệm"}</button><button type="button" onClick={() => setClock({ time: 0, running: false })}>Đặt lại lượt</button><label>Tốc độ<select value={speed} onChange={e => setSpeed(+e.target.value)}><option value=".5">0,5×</option><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label><button type="button" disabled={!atDetector} onClick={measure}>Ghi kết quả</button></div>
        <dl className={styles.metrics}><div><dt>Thời gian mô hình</dt><dd>{clock.time.toFixed(1)} zs</dd></div><div><dt>Khoảng cách tới tâm</dt><dd>{point.radiusFm.toFixed(1)} fm</dd></div><div><dt>Góc tán xạ ở xa</dt><dd>{atDetector ? `${run.scatteringAngleDeg.toFixed(1)}°` : "Chờ tới màn"}</dd></div><div><dt>Góc vị trí trên màn</dt><dd>{atDetector ? `${run.detectorAngleDeg.toFixed(1)}°` : "Chờ tới màn"}</dd></div></dl>
        {readings.length > 0 && <div className={styles.table}><table><caption>Kết quả các lượt đã ghi</caption><thead><tr><th>b (fm)</th><th>E (MeV)</th><th>Góc tán xạ</th><th>Góc trên màn</th></tr></thead><tbody>{readings.map(reading => <tr key={reading.id}><td>{reading.impactFm}</td><td>{reading.energyMeV}</td><td>{reading.scattering.toFixed(1)}°</td><td>{reading.detector.toFixed(1)}°</td></tr>)}</tbody></table></div>}
        <details><summary>Mô hình, nguồn và giới hạn</summary><LatexMath block math={String.raw`\tan\left(\frac{\theta}{2}\right)=\frac{k_e Z_\alpha Z_{\mathrm{Au}}e^2}{2Eb}\quad (b>0)`} /><p>Quỹ đạo mô hình Coulomb cổ điển cho một hạt α và một hạt nhân vàng cố định; bỏ qua electron, độ giật lùi và lực hạt nhân. Màn tại 180 fm là biên tính toán, kích thước nguồn, bia và hạt phóng đại. Không suy ra tần suất lệch trong lá vàng từ một vài quỹ đạo. Góc trên màn hữu hạn khác góc tán xạ ở xa.</p><a href="https://ocw.mit.edu/courses/22-02-introduction-to-applied-nuclear-physics-spring-2012/f06e26889dd2332f1664a2df42e00ed4_MIT22_02S12_lec_ch8.pdf">Nguồn: MIT OpenCourseWare · Rutherford scattering</a></details>
      </section>
    </div><aside className={styles.panel} aria-label="Hướng dẫn và nhiệm vụ Bài 21">
      {mode === "guided" && <><p className={styles.eyebrow}>Cảnh {scene + 1} / {STEPS.length}</p><h3>{STEPS[scene].title}</h3><p>{STEPS[scene].text}</p><div className={styles.actions}><button type="button" disabled={scene === 0} onClick={() => setScene(scene - 1)}>Cảnh trước</button><button type="button" disabled={scene === STEPS.length - 1} onClick={() => setScene(scene + 1)}>Cảnh sau</button><button type="button" onClick={() => setScene(0)}>Xem lại hướng dẫn</button></div><p className={styles.small}>Chuyển cảnh đổi phần hướng dẫn và góc nhìn thí nghiệm; thời gian và số đo không thay đổi.</p></>}
      {mode === "free" && <><p className={styles.eyebrow}>Khám phá tự do</p><h3>Thử các điều kiện</h3><p>Thay b hoặc E, chạy một lượt và ghi kết quả. So sánh khi giữ nguyên một điều kiện; chuyển lại hướng dẫn sẽ giữ bảng đo.</p></>}
      {mode === "task" && <><p className={styles.eyebrow}>Nhiệm vụ tìm hiểu</p><h3>Dự đoán → đo → giải thích</h3><p>Giữ E không đổi. Nếu b giảm thì góc tán xạ ở xa tăng hay giảm?</p><div className={styles.options}><button type="button" aria-pressed={prediction === "larger"} onClick={() => choosePrediction("larger")}>Tăng</button><button type="button" aria-pressed={prediction === "smaller"} onClick={() => choosePrediction("smaller")}>Giảm</button></div>{prediction === "smaller" && <p role="status">Hãy so sánh lực đẩy khi hạt tới gần tâm hơn, rồi thử đo hai b.</p>}<p>{comparison ? "✓ Đã ghi hai lượt có cùng E và khác b." : "Sau khi dự đoán, ghi hai lượt khác b tại cùng động năng E."}</p><p>Vì sao góc lệch lớn khi hạt đi gần tâm hơn?</p><div className={styles.options}><button type="button" aria-pressed={explanation === "repulsion"} onClick={() => setExplanation("repulsion")}>Lực đẩy Coulomb mạnh hơn khi khoảng cách nhỏ</button><button type="button" aria-pressed={explanation === "collision"} onClick={() => setExplanation("collision")}>Vì hạt đập vào tấm chắn cứng</button></div>{explanation === "collision" && <p role="status">Trong mô hình, hạt chịu lực điện; hãy quan sát quỹ đạo quanh tâm bia.</p>}<p role="status">{complete ? "Đã hoàn thành dự đoán, phép so sánh và giải thích." : "Hoàn thành khi có dự đoán phù hợp, hai phép đo so sánh và giải thích."}</p></>}
      {!preview && <section className={styles.local} aria-label="Lưu tiến độ Bài 21"><h3>Lưu trên thiết bị</h3><p className={styles.small}>Chỉ lưu khi em chọn; thông số, dự đoán và bảng đo ở trình duyệt này, không tự gửi cho giáo viên hoặc thu thập làm dữ liệu nghiên cứu.</p><div className={styles.actions}><button type="button" onClick={saveLocal}>Lưu trên thiết bị</button><button type="button" onClick={restoreLocal}>Khôi phục bản lưu B21</button></div>{localNotice && <p role="status">{localNotice}</p>}</section>}
    </aside></div>
  </div>;
}
