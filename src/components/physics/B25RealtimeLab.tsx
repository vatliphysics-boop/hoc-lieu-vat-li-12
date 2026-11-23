"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { LatexMath } from "@/components/learning/LatexMath";
import { activityAt, halfActivityBracket, SGK_TABLE_25_1 } from "@/lib/sgk-b25-decay";
import { B25_GUIDE, b25Reading, hasB25Comparison, initialB25LearningState, isB25Complete, reduceB25Learning, restoreB25Learning, type B25Mode } from "@/lib/b25-learning";
import styles from "./B22RealtimeLab.module.css";
import chartStyles from "./B25RealtimeLab.module.css";

const STORAGE_KEY = "physics-b25-data-learning-v1";
const modes: { id: B25Mode; label: string }[] = [
  { id: "guided", label: "Hướng dẫn" }, { id: "explore", label: "Khám phá" }, { id: "assignment", label: "Nhiệm vụ" },
];

/** Source points never change; a theory curve and recorded readings derive from the same parameters. */
export function B25RealtimeLab({ onProgress, preview = false }: { onProgress?: (done: boolean) => void; preview?: boolean } = {}) {
  const [state, dispatch] = useReducer(reduceB25Learning, undefined, initialB25LearningState);
  const [running, setRunning] = useState(false), [speed, setSpeed] = useState(1), [fullscreen, setFullscreen] = useState(false), [notice, setNotice] = useState("");
  const root = useRef<HTMLElement>(null), timeRef = useRef(0);
  const complete = isB25Complete(state);
  const sample = SGK_TABLE_25_1.find(row => Math.abs(row.t - state.time) < .05);
  const bracket = halfActivityBracket();
  const showModel = state.mode === "explore" || state.prediction !== null;
  const data = useMemo(() => Array.from({ length: 121 }, (_, i) => ({ t: i * 3, h: activityAt(i * 3, state.halfLife) })), [state.halfLife]);
  const x = (t: number) => 55 + t / 360 * 540, y = (h: number) => 230 - h / 160 * 195;
  useEffect(() => { onProgress?.(complete); }, [complete, onProgress]);
  useEffect(() => { timeRef.current = state.time; }, [state.time]);
  useEffect(() => {
    if (!running) return;
    let frame = 0, previous = performance.now(), lastDraw = previous;
    const tick = (now: number) => {
      timeRef.current = Math.min(360, timeRef.current + Math.min((now - previous) / 1000, .1) * 30 * speed); previous = now;
      if (now - lastDraw >= 40 || timeRef.current >= 360) { dispatch({ type: "time", value: timeRef.current }); lastDraw = now; }
      if (timeRef.current >= 360) { setRunning(false); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, speed]);
  useEffect(() => {
    const pause = () => { if (document.hidden) setRunning(false); };
    const sync = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("visibilitychange", pause); document.addEventListener("fullscreenchange", sync);
    return () => { document.removeEventListener("visibilitychange", pause); document.removeEventListener("fullscreenchange", sync); };
  }, []);
  const seek = (time: number) => { setRunning(false); timeRef.current = time; dispatch({ type: "time", value: time }); };
  const toggleFullscreen = async () => {
    try { if (document.fullscreenElement === root.current) await document.exitFullscreen(); else if (root.current?.requestFullscreen) await root.current.requestFullscreen(); else throw new Error(); }
    catch { setNotice("Trình duyệt không cho phép mở toàn màn hình."); }
  };
  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setNotice("Đã lưu trạng thái trên thiết bị này. Chưa gửi dữ liệu cho lớp."); }
    catch { setNotice("Thiết bị không lưu được. Trạng thái vẫn còn trong trang đang mở."); }
  };
  const restore = () => {
    try { const saved = restoreB25Learning(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")); if (!saved) throw new Error(); setRunning(false); timeRef.current = saved.time; dispatch({ type: "restore", value: saved }); setNotice("Đã khôi phục trạng thái trên thiết bị; con trỏ đang tạm dừng."); }
    catch { setNotice("Không tìm thấy bản lưu hợp lệ trên thiết bị."); }
  };
  return <section ref={root} className={styles.lab} aria-label="Phòng phân tích dữ liệu B25">
    <header className={styles.header}><div><span className={styles.eyebrow}>B25 · PHÂN TÍCH DỮ LIỆU</span><h2>Đọc dữ liệu. Kiểm tra mô hình.</h2><p>Thử giả thuyết về chu kì bán rã và so sánh với các giá trị trong Bảng 25.1.</p></div><button type="button" onClick={toggleFullscreen}>{fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}</button></header>
    <nav className={styles.modes} aria-label="Chế độ học">{modes.map(mode => <button type="button" key={mode.id} aria-pressed={state.mode === mode.id} onClick={() => dispatch({ type: "mode", value: mode.id })}>{mode.label}</button>)}</nav>
    <div className={styles.layout}><div className={styles.main}>
      <div className={styles.scene}><div className={styles.sceneHead}><strong>Hoạt độ H (Bq) theo thời gian t (s)</strong><span>Chấm: số liệu SGK · Đường: kì vọng</span></div>
        <div className={chartStyles.chart}><svg viewBox="0 0 640 280" role="img" aria-label={`Bảng 25.1 có ${SGK_TABLE_25_1.length} điểm. Con trỏ tại ${state.time.toFixed(1)} giây.${showModel ? ` Giả thuyết chu kì ${state.halfLife} giây.` : " Đường mô hình đang ẩn."}`}>
          <title>Giá trị SGK và đường hoạt độ kì vọng</title>
          {[0, 40, 80, 120, 160].map(v => <g key={v}><path d={`M55 ${y(v)}H595`} stroke="#294b5c" /><text x="46" y={y(v) + 5} textAnchor="end" fill="#c9dce5" fontSize="16">{v}</text></g>)}
          {[0, 60, 120, 180, 240, 300, 360].map(v => <text key={v} x={x(v)} y="252" textAnchor="middle" fill="#c9dce5" fontSize="15">{v}</text>)}
          <path d={`M55 ${y(bracket.halfActivityBq)}H595`} stroke="#ffd18a" strokeDasharray="5 5" />
          {showModel && <polyline points={data.map(point => `${x(point.t)},${y(point.h)}`).join(" ")} fill="none" stroke="#5be1c1" strokeWidth="3" />}
          {SGK_TABLE_25_1.map(row => <circle key={row.t} cx={x(row.t)} cy={y(row.h)} r={sample?.t === row.t ? 7 : 5} fill="#ffca79" stroke="#fff4da" strokeWidth="1" />)}
          <path d={`M${x(state.time)} 25V230`} stroke="#eafaff" strokeWidth="1.5" />
          <text x="325" y="275" fill="#c9dce5" textAnchor="middle" fontSize="15">Thời gian t (s)</text>
        </svg></div>
        <p className={styles.sceneNote}>Vàng: Bảng 25.1 · Xanh: đường kì vọng · Đường ngang: nửa mức ban đầu. Biểu diễn 2D ưu tiên đọc số liệu.</p>
      </div>
      <div className={styles.controls}><label>Chu kì giả thuyết T: {state.halfLife} s<input type="range" min="10" max="120" step="1" value={state.halfLife} onChange={event => dispatch({ type: "halfLife", value: +event.target.value })} /></label><button type="button" className={styles.primary} onClick={() => { if (state.time >= 360) { timeRef.current = 0; dispatch({ type: "time", value: 0 }); } setRunning(value => !value); }}>{running ? "Tạm dừng" : state.time >= 360 ? "Đọc lại" : "Chạy con trỏ"}</button><button type="button" onClick={() => { setRunning(false); timeRef.current = 0; dispatch({ type: "reset" }); }}>Đặt lại con trỏ</button><label>Tốc độ đọc<select value={speed} onChange={event => setSpeed(+event.target.value)}><option value="0.5">0,5×</option><option value="1">1×</option><option value="2">2×</option></select></label></div>
      <label className={styles.timeline}>Thời điểm t = {state.time.toFixed(1)} s<input type="range" min="0" max="360" step="1" value={state.time} onChange={event => seek(+event.target.value)} /></label>
      <div className={styles.metrics}><div><span>Số liệu bảng tại mốc</span><strong>{sample ? `${sample.h} Bq` : "Chưa có mốc"}</strong></div><div><span>Giá trị kì vọng</span><strong>{showModel ? `${activityAt(state.time, state.halfLife).toFixed(1)} Bq` : "Chưa mở"}</strong></div><div><span>Kì vọng − số liệu bảng</span><strong>{showModel && sample ? `${(activityAt(sample.t, state.halfLife) - sample.h).toFixed(1)} Bq` : "Chọn mốc"}</strong></div></div>
      <LatexMath block math={String.raw`H_{\text{kì vọng}}(t)=151\,2^{-t/T}\;\mathrm{Bq}`} />
      <div className={chartStyles.table}><table><caption>Bảng 25.1 · SGK mẫu KNTT, trang in 121</caption><thead><tr><th>t (s)</th><th>H trong bảng (Bq)</th><th>H kì vọng (Bq)</th></tr></thead><tbody>{SGK_TABLE_25_1.map(row => <tr key={row.t}><td><button type="button" onClick={() => seek(row.t)} aria-label={`Chọn mốc ${row.t} giây`}>{row.t}</button></td><td>{row.h}</td><td>{showModel ? activityAt(row.t, state.halfLife).toFixed(1) : "—"}</td></tr>)}</tbody></table></div>
      <p className={styles.small}>Nguồn gốc: Bảng 25.1 trong SGK mẫu của dự án. Từ {bracket.halfActivityBq} Bq nằm giữa 85 Bq tại {bracket.fromSeconds} s và 55 Bq tại {bracket.toSeconds} s, nội suy thẳng cho khoảng {bracket.linearEstimateSeconds.toFixed(1)} s. Đây là ước lượng thô; đường kì vọng là mô hình độc lập, không thay dữ liệu gốc.</p>
    </div><aside className={styles.panel}>
      {state.mode === "guided" && <><span className={styles.eyebrow}>CẢNH {state.guideIndex + 1} / {B25_GUIDE.length}</span><h3>{B25_GUIDE[state.guideIndex].title}</h3><p>{B25_GUIDE[state.guideIndex].text}</p><div className={styles.actions}><button type="button" disabled={state.guideIndex === 0} onClick={() => dispatch({ type: "guide", value: state.guideIndex - 1 })}>← Trước</button><button type="button" disabled={state.guideIndex === B25_GUIDE.length - 1} onClick={() => dispatch({ type: "guide", value: state.guideIndex + 1 })}>Tiếp →</button><button type="button" onClick={() => dispatch({ type: "guide", value: 0 })}>Xem lại hướng dẫn</button></div><p className={styles.small}>Đổi nội dung hướng dẫn không di chuyển con trỏ hoặc xóa kết quả.</p></>}
      {state.mode === "explore" && <><span className={styles.eyebrow}>KHÁM PHÁ TỰ DO</span><h3>Thử nhiều giả thuyết</h3><p>Điều chỉnh T và con trỏ, chọn các mốc trong bảng rồi ghi giá trị để so sánh. Các thao tác không bị khóa bởi câu hỏi.</p></>}
      {state.mode === "assignment" && <><span className={styles.eyebrow}>NHIỆM VỤ</span><h3>Dự đoán → đối chiếu → giải thích</h3><p>Dự đoán trước khi ghi bằng chứng, so sánh ít nhất hai giả thuyết tại cùng mốc dương và ghi thêm một mốc khác.</p></>}
      <div className={styles.question}><strong>Tại 30 s, T nào có đường kì vọng gần 85 Bq hơn?</strong><div className={styles.actions}>{([40, 60] as const).map(value => <button type="button" key={value} aria-pressed={state.prediction === value} disabled={state.prediction !== null} onClick={() => dispatch({ type: "prediction", value })}>T = {value} s</button>)}</div><p className={styles.small}>{state.prediction === null ? "Chọn một dự đoán; ở chế độ khám phá em vẫn có thể xem mô hình tự do." : `Đã ghi dự đoán T = ${state.prediction} s.`}</p>
        <button type="button" disabled={!sample || (state.mode !== "explore" && state.prediction === null)} onClick={() => dispatch({ type: "record" })}>Ghi mốc và giả thuyết hiện tại</button>{!sample && <p className={styles.small}>Chọn một mốc thực sự có trong bảng trước khi ghi.</p>}
        {sample && state.mode !== "explore" && state.prediction === null && <p className={styles.small}>Hãy ghi dự đoán trước khi thu thập bằng chứng nhiệm vụ.</p>}
        {!!state.readings.length && <div className={chartStyles.table}><table><caption>Các lần đối chiếu trong phiên</caption><thead><tr><th>t (s)</th><th>T (s)</th><th>Bảng</th><th>Kì vọng</th><th>Chênh lệch</th></tr></thead><tbody>{state.readings.map((row, index) => { const reading = b25Reading(row)!; return <tr key={index}><td>{reading.time}</td><td>{reading.hypothesis}</td><td>{reading.measured}</td><td>{reading.expected.toFixed(1)}</td><td>{reading.residual.toFixed(1)}</td></tr>; })}</tbody></table></div>}
        {hasB25Comparison(state) && <p role="status">Đã có hai giả thuyết tại cùng một mốc dương sau dự đoán. Tiếp tục ghi một mốc khác rồi giải thích.</p>}
        {state.readings.some(row => row.afterPrediction && row.time === 30 && row.hypothesis === 40) && state.readings.some(row => row.afterPrediction && row.time === 30 && row.hypothesis === 60) && <p role="status">{state.prediction === 40 ? "Dự đoán 40 s gần 85 Bq hơn ở mốc này." : "So sánh độ lớn hai chênh lệch: tại mốc này, đường T = 40 s gần 85 Bq hơn."} Một mốc không đủ đánh giá mọi giả thuyết.</p>}
      </div>
      <div className={styles.question}><strong>Nếu giá trị bảng khác đường kì vọng, nên kết luận gì?</strong><div className={styles.actions}><button type="button" disabled={!hasB25Comparison(state)} onClick={() => dispatch({ type: "explanation", value: "limits" })}>Xem xét dao động, sai số và giới hạn mô hình</button><button type="button" disabled={!hasB25Comparison(state)} onClick={() => dispatch({ type: "explanation", value: "incorrect" })}>Sửa số liệu bảng cho khớp đường cong</button></div>{state.explanation && <p role="status">{state.explanation === "limits" ? "Phù hợp: một điểm sai khác chưa đủ xác định nguyên nhân; giữ nguyên số liệu nguồn." : "Hãy giữ bảng nguyên vẹn và đối chiếu thêm nhiều mốc."}</p>}<p className={styles.small}>{complete ? "✓ Đã dự đoán, so sánh hai giả thuyết, xem hai mốc và giải thích." : "Cần dự đoán, đối chiếu hai T tại cùng mốc dương, ghi hai mốc và giải thích."}</p></div>
      {!preview && <div className={styles.actions}><button type="button" onClick={save}>Lưu trên thiết bị</button><button type="button" onClick={restore}>Khôi phục trên thiết bị</button></div>}{notice && <p role="status">{notice}</p>}
    </aside></div>
  </section>;
}
