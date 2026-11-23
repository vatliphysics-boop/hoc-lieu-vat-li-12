"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { LatexMath } from "@/components/learning/LatexMath";
import { FISSION_DURATION, FISSION_ENERGY, FISSION_MASS_SOURCE, FISSION_STAGES, fissionConservation, fissionMotion, fissionState, neutronGenerations } from "@/lib/fission-model";
import { FISSION_GUIDE, initialFissionLearningState, isFissionLearningComplete, reduceFissionLearning, restoreFissionLearning, type FissionMode } from "@/lib/fission-learning";
import styles from "./B22RealtimeLab.module.css";

const FissionScene = dynamic(() => import("./FissionScene"), { ssr: false, loading: () => <p role="status">Đang chuẩn bị cảnh phân hạch…</p> });
const STORAGE_KEY = "physics-b22-fission-learning-v1";
const modes: { id: FissionMode; label: string }[] = [
  { id: "guided", label: "Hướng dẫn" }, { id: "explore", label: "Khám phá" }, { id: "assignment", label: "Nhiệm vụ" },
];

function FissionFallback({ time, incident }: { time: number; incident: boolean }) {
  const motion = fissionMotion(time, incident);
  return <svg viewBox="0 0 640 230" role="img" aria-label={incident ? `Sơ đồ phân hạch: ${FISSION_STAGES[motion.stage].title}` : "Sơ đồ U-235 không có neutron tới"}>
    <path d="M64 100H576" stroke="#496b80" strokeDasharray="6 9" />
    {motion.stage < 3 ? <>
      <ellipse cx="320" cy="100" rx={42 * motion.stretchX} ry={42 * motion.stretchY} fill="#f47972" />
      <text x="320" y="106" textAnchor="middle" fill="#10263a" fontSize="20" fontWeight="700">{motion.stage === 0 ? "U-235" : "U-236*"}</text>
      {incident && motion.stage === 0 && <circle cx={320 + 51 * motion.incomingX} cy="100" r="9" fill="#71c8f5" />}
    </> : <>
      {motion.fragmentOffsets.map((offset, i) => <g key={i}><circle cx={320 + offset * 48} cy="100" r={i === 0 ? 29 : 37} fill="#f47972" /><text x={320 + offset * 48} y="106" textAnchor="middle" fill="#10263a" fontSize="18" fontWeight="700">{i === 0 ? "Y-95" : "I-138"}</text></g>)}
      {motion.neutronPositions.map(([x, y], i) => <circle key={i} cx={320 + 52 * x} cy={100 - 25 * y} r="7" fill="#71c8f5" />)}
    </>}
    <text x="320" y="205" textAnchor="middle" fill="#d3e7f7" fontSize="17">Sơ đồ 2D thay thế · thời gian và vị trí quy ước</text>
  </svg>;
}

/** One shared experiment state; presentation navigation never seeks the physics clock. */
export function B22RealtimeLab({ onProgress, preview = false }: { onProgress?: (done: boolean) => void; preview?: boolean } = {}) {
  const [state, dispatch] = useReducer(reduceFissionLearning, undefined, initialFissionLearningState);
  const [running, setRunning] = useState(false), [speed, setSpeed] = useState(1), [view, setView] = useState("perspective");
  const [sceneKey, setSceneKey] = useState(0), [sceneError, setSceneError] = useState(""), [sceneReady, setSceneReady] = useState(false);
  const [notice, setNotice] = useState(""), [fullscreen, setFullscreen] = useState(false);
  const root = useRef<HTMLElement>(null), timeRef = useRef(0);
  const scenario = fissionState(state.time, state.incident);
  const complete = isFissionLearningComplete(state);
  const hasIncidentMeasurement = state.measurements.some(item => item.incident);
  const hasComparison = hasIncidentMeasurement && state.measurements.some(item => !item.incident);
  const stageTitle = state.incident ? FISSION_STAGES[scenario.stage].title : "Không có neutron tới";
  const cameraReady = useCallback(() => setSceneReady(true), []);
  const cameraError = useCallback((error: string) => { setSceneError(error); setSceneReady(true); }, []);
  useEffect(() => { onProgress?.(complete); }, [complete, onProgress]);
  useEffect(() => { timeRef.current = state.time; }, [state.time]);
  useEffect(() => {
    if (!running || !state.incident || !sceneReady) return;
    let frame = 0, last = performance.now(), lastUpdate = last;
    const advance = (now: number) => {
      timeRef.current = Math.min(FISSION_DURATION, timeRef.current + Math.min((now - last) / 1000, 0.1) * speed);
      last = now;
      if (now - lastUpdate >= 40 || timeRef.current >= FISSION_DURATION) { dispatch({ type: "time", value: timeRef.current }); lastUpdate = now; }
      if (timeRef.current >= FISSION_DURATION) { setRunning(false); return; }
      frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [running, speed, state.incident, sceneReady]);
  useEffect(() => {
    const pause = () => { if (document.hidden) setRunning(false); };
    const sync = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("visibilitychange", pause); document.addEventListener("fullscreenchange", sync);
    return () => { document.removeEventListener("visibilitychange", pause); document.removeEventListener("fullscreenchange", sync); };
  }, []);
  const toggleFullscreen = async () => {
    try { if (document.fullscreenElement === root.current) await document.exitFullscreen(); else if (root.current?.requestFullscreen) await root.current.requestFullscreen(); else throw new Error(); }
    catch { setNotice("Trình duyệt không cho phép mở toàn màn hình."); }
  };
  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setNotice("Đã lưu trạng thái trên thiết bị này. Chưa gửi dữ liệu cho lớp."); }
    catch { setNotice("Thiết bị không lưu được. Trạng thái vẫn còn trong trang đang mở."); }
  };
  const restore = () => {
    try {
      const saved = restoreFissionLearning(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"));
      if (!saved) throw new Error();
      setRunning(false); timeRef.current = saved.time;
      dispatch({ type: "restore", value: saved });
      setNotice("Đã khôi phục trạng thái trên thiết bị; mô phỏng đang tạm dừng.");
    } catch { setNotice("Không tìm thấy bản lưu hợp lệ trên thiết bị."); }
  };
  return <section ref={root} className={styles.lab} aria-label="Phòng khám phá phân hạch B22">
    <header className={styles.header}><div><span className={styles.eyebrow}>B22 · PHÂN HẠCH HẠT NHÂN</span><h2>Một neutron. Một kênh phân hạch.</h2><p>Dự đoán, quan sát các mảnh và dùng bảo toàn để giải thích kết quả.</p></div><button type="button" onClick={toggleFullscreen}>{fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}</button></header>
    <nav className={styles.modes} aria-label="Chế độ học">{modes.map(mode => <button key={mode.id} type="button" aria-pressed={state.mode === mode.id} onClick={() => dispatch({ type: "mode", value: mode.id })}>{mode.label}</button>)}</nav>
    <div className={styles.layout}><div className={styles.main}>
      <div className={styles.scene}><div className={styles.sceneHead}><strong>{stageTitle}</strong><span>Đỏ: proton · Xanh: neutron</span></div>
        {sceneError ? <FissionFallback time={state.time} incident={state.incident} /> : <FissionScene key={sceneKey} time={state.time} incidentNeutron={state.incident} view={view} onError={cameraError} onReady={cameraReady} />}
        {sceneError && <p role="status">{sceneError} Sơ đồ 2D sử dụng cùng trạng thái.</p>}
        <p className={styles.sceneNote}>Kéo để xoay, cuộn hoặc chụm để thu phóng. Các nút góc nhìn dùng được bằng bàn phím. Kích thước, vị trí và thời gian là quy ước.</p>
      </div>
      <div className={styles.views} aria-label="Góc nhìn">{[["perspective", "Phối cảnh"], ["front", "Phía trước"], ["top", "Từ trên"], ["side", "Bên cạnh"]].map(([value, label]) => <button type="button" key={value} aria-pressed={view === value} disabled={!!sceneError} onClick={() => setView(value)}>{label}</button>)}<button type="button" disabled={!!sceneError} onClick={() => { setView("perspective"); setSceneReady(false); setSceneKey(value => value + 1); }}>Đặt lại camera</button></div>
      <div className={styles.controls}>
        <label>Điều kiện neutron tới<select value={state.incident ? "yes" : "no"} onChange={event => { setRunning(false); timeRef.current = 0; dispatch({ type: "incident", value: event.target.value === "yes" }); }}><option value="yes">Có neutron tới</option><option value="no">Không có neutron tới</option></select></label>
        <button type="button" className={styles.primary} disabled={!state.incident || !sceneReady} onClick={() => { if (scenario.finished) { timeRef.current = 0; dispatch({ type: "time", value: 0 }); } setRunning(value => !value); }}>{running ? "Tạm dừng" : scenario.finished ? "Chạy lại" : "Chạy mô phỏng"}</button>
        <button type="button" onClick={() => { setRunning(false); timeRef.current = 0; dispatch({ type: "reset" }); }}>Đặt lại lượt</button>
        <label>Tốc độ trình bày<select value={speed} onChange={event => setSpeed(+event.target.value)}><option value="0.5">0,5×</option><option value="1">1×</option><option value="2">2×</option></select></label>
      </div>
      <p className={styles.small}>Thời gian mô hình: {state.time.toFixed(1)} / {FISSION_DURATION} s. Chuyển chế độ hoặc xem mục hướng dẫn không thay thời gian này.</p>
      <label className={styles.timeline}>Tua thời gian minh họa<input type="range" min="0" max={FISSION_DURATION} step="0.1" value={state.time} disabled={!state.incident} onChange={event => { setRunning(false); timeRef.current = +event.target.value; dispatch({ type: "time", value: +event.target.value }); }} /></label>
      <p className={styles.note}>{state.incident ? FISSION_STAGES[scenario.stage].text : "Trong kịch bản đối chiếu này không có neutron tới; không mô phỏng các cơ chế phân hạch khác."}</p>
      <LatexMath block math={String.raw`{}^{1}_{0}\mathrm{n}+{}^{235}_{92}\mathrm{U}\rightarrow{}^{236}_{92}\mathrm{U}^{*}\rightarrow{}^{95}_{39}\mathrm{Y}+{}^{138}_{53}\mathrm{I}+3{}^{1}_{0}\mathrm{n}`} />
      <div className={styles.metrics}><div><span>Số khối A trước / sau</span><strong>{fissionConservation().inputA} / {fissionConservation().outputA}</strong></div><div><span>Điện tích Z trước / sau</span><strong>{fissionConservation().inputZ} / {fissionConservation().outputZ}</strong></div><div><span>Q của kênh minh họa</span><strong>{FISSION_ENERGY.qMeV.toFixed(1)} MeV</strong></div></div>
      <p className={styles.small}>A và Z ở trên kiểm tra phương trình kênh có neutron tới; không phải số liệu của kịch bản không có neutron. Q tính từ khối lượng nguyên tử trung hòa gần đúng, nguồn <a href={FISSION_MASS_SOURCE}>AME2020</a>; không phân chia năng lượng cho từng sản phẩm.</p>
      <label className={styles.timeline}>Hệ số duy trì dây chuyền k = {state.k.toFixed(1)}<input type="range" min="0.6" max="1.4" step="0.1" value={state.k} onChange={event => dispatch({ type: "k", value: +event.target.value })} /></label>
      <div className={styles.bars} aria-label="Số phản ứng kì vọng theo thế hệ trong mô hình k không đổi">{neutronGenerations(state.k, 4).map(row => <div key={row.generation}><span>Thế hệ {row.generation}</span><i><b style={{ width: `${Math.min(100, row.expected / 4 * 100)}%` }} /></i><strong>{row.expected.toFixed(2)}</strong></div>)}</div>
      <p className={styles.small}>Mô hình thế hệ định tính: k không phải số neutron của một phân hạch; không phải mô phỏng vận hành lò.</p>
    </div><aside className={styles.panel}>
      {state.mode === "guided" && <><span className={styles.eyebrow}>CẢNH {state.guideIndex + 1} / {FISSION_GUIDE.length}</span><h3>{FISSION_GUIDE[state.guideIndex].title}</h3><p>{FISSION_GUIDE[state.guideIndex].text}</p><div className={styles.actions}><button type="button" disabled={state.guideIndex === 0} onClick={() => dispatch({ type: "guide", value: state.guideIndex - 1 })}>← Trước</button><button type="button" disabled={state.guideIndex === FISSION_GUIDE.length - 1} onClick={() => dispatch({ type: "guide", value: state.guideIndex + 1 })}>Tiếp →</button><button type="button" onClick={() => dispatch({ type: "guide", value: 0 })}>Xem lại hướng dẫn</button></div><p className={styles.small}>Hướng dẫn đổi nội dung diễn giải, không tua thí nghiệm.</p></>}
      {state.mode === "explore" && <><span className={styles.eyebrow}>KHÁM PHÁ TỰ DO</span><h3>So sánh điều kiện</h3><p>Chọn có hoặc không có neutron tới, chạy hoặc tua diễn biến, ghi kết quả. Thay k để xem xu hướng các thế hệ.</p><p className={styles.small}>Nút đo chỉ ghi trạng thái đang quan sát; việc đổi chế độ không xóa phép đo.</p></>}
      {state.mode === "assignment" && <><span className={styles.eyebrow}>NHIỆM VỤ KHÁM PHÁ</span><h3>Dự đoán → đo → giải thích</h3><p>Chọn dự đoán, đo cả hai điều kiện và giải thích phương trình theo A, Z. Chạy hay xem thời gian không tự đánh dấu hoàn thành.</p></>}
      <div className={styles.question}><label>Em dự đoán kênh có neutron tới tạo ra bao nhiêu neutron tự do?<select value={state.prediction ?? ""} disabled={hasIncidentMeasurement} onChange={event => dispatch({ type: "prediction", value: +event.target.value })}><option value="" disabled>Chọn dự đoán</option>{[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n} neutron</option>)}</select></label><button type="button" disabled={state.prediction === null || (state.incident && state.time < FISSION_STAGES[3].time)} onClick={() => dispatch({ type: "measure" })}>Ghi kết quả điều kiện này</button>{state.prediction !== null && state.incident && state.time < FISSION_STAGES[3].time && <p className={styles.small}>Quan sát đến khi các sản phẩm tách ra trước khi ghi.</p>}
        {!!state.measurements.length && <table><caption>Bằng chứng trong phiên</caption><thead><tr><th>Điều kiện</th><th>Neutron tự do</th></tr></thead><tbody>{state.measurements.map((row, index) => <tr key={index}><td>{row.incident ? "Có neutron tới" : "Không neutron tới"}</td><td>{row.freeNeutrons}</td></tr>)}</tbody></table>}
        {hasIncidentMeasurement && <p role="status">{state.prediction === 3 ? "Dự đoán phù hợp với kênh minh họa." : "Hãy so sánh dự đoán với ba neutron tự do; đừng đếm neutron bên trong các mảnh."}</p>}
      </div>
      <div className={styles.question}><strong>Vì sao phương trình này phù hợp các định luật bảo toàn?</strong><div className={styles.actions}><button type="button" disabled={!hasComparison} onClick={() => dispatch({ type: "explain", value: "conservation" })}>Tổng A và tổng Z bằng nhau ở hai vế</button><button type="button" disabled={!hasComparison} onClick={() => dispatch({ type: "explain", value: "incorrect" })}>Chỉ cần tổng số hạt bằng nhau</button></div>{state.explanation && <p role="status">{state.explanation === "conservation" ? "Đúng: 236 nucleon và 92 proton được bảo toàn trong kênh này." : "Hãy tính riêng số khối và điện tích của cả hai vế."}</p>}<p className={styles.small}>{complete ? "✓ Đã ghi dự đoán, so sánh hai điều kiện và giải thích bảo toàn." : "Hoàn thành sau khi có dự đoán, hai kết quả và giải thích đúng."}</p></div>
      {!preview && <div className={styles.actions}><button type="button" onClick={save}>Lưu trên thiết bị</button><button type="button" onClick={restore}>Khôi phục trên thiết bị</button></div>}
      {notice && <p role="status">{notice}</p>}
    </aside></div>
  </section>;
}
