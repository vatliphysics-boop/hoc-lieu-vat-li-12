"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createDecaySample, decayState, type DecayParameters } from "@/lib/radioactive-decay-model";
import { createInquiryState, getInquiryPrompt, recordInquiryAction, answerInquiryQuestion, requestInquiryHint, type InquiryAction, type InquiryState } from "@/lib/half-life-inquiry";
import { eventsCSV, pilotEvent, type PilotEvent, type PilotEventType } from "@/lib/half-life-analytics";
import { useProcessClock } from "@/components/physics/useProcessClock";
import { DecayProcessVisual } from "@/components/physics/DecayProcessVisual";
import { LatexMath } from "@/components/learning/LatexMath";
import { saveHalfLifeClassroomAction, loadHalfLifeClassroomAction } from "@/app/student/half-life-actions";
import { validateHalfLifeSnapshot, type HalfLifeSnapshot } from "@/lib/half-life-classroom";
import { HALF_LIFE_GUIDANCE, type HalfLifeMode } from "@/lib/half-life-guidance";
import { HalfLifeScene } from "./HalfLifeScene";
import styles from "./HalfLifePilot.module.css";

const KEY = "physics-half-life-pilot-v1";
type Measurement = { time: number; remaining: number; expected: number; n: number; halfLife: number; seed: number };
type Saved = { version: 1; sessionId: string; inquiry: InquiryState; events: PilotEvent[]; snapshot?: HalfLifeSnapshot };

export function HalfLifePilot({ stepId, onProgress, preview = false }: { stepId?: string; onProgress?: (done: boolean) => void; preview?: boolean } = {}) {
  const [mode, setMode] = useState<HalfLifeMode>(stepId ? "assigned" : "guided");
  const [guideIndex, setGuideIndex] = useState(0);
  const [single, setSingle] = useState(false);
  const [nucleusIndex, setNucleusIndex] = useState(0);
  const [exploredBeforePrediction, setExploredBeforePrediction] = useState(false);
  const [parameters, setParameters] = useState<DecayParameters>({ initialCount: 64, halfLifeSeconds: 10, seed: 23 });
  const [inquiry, setInquiry] = useState(createInquiryState);
  const [hint, setHint] = useState("");
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState("");
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [classConsent, setClassConsent] = useState(false);
  const [classNotice, setClassNotice] = useState("");
  const [classPending, startClassTransition] = useTransition();
  const container = useRef<HTMLDivElement>(null);
  const clock = useProcessClock(180, 5, container);
  const session = useRef("");
  const events = useRef<PilotEvent[]>([]);
  // Keep the exact submission for a retry if the acknowledgement is lost.
  const uncertainSubmission = useRef<HalfLifeSnapshot | null>(null);
  const startedRuns = useRef<Set<string>>(new Set());
  const runKey = (n: number, t: number, seed: number) => `${n}:${t}:${seed}`;
  const sample = useMemo(() => createDecaySample(parameters), [parameters]);
  const current = decayState(sample, clock.time);
  const selectedIndex = Math.min(nucleusIndex, sample.initialCount - 1);
  const sceneSample = useMemo(() => single ? { ...sample, initialCount: 1, lifetimes: [sample.lifetimes[selectedIndex]] } : sample, [sample, single, selectedIndex]);
  const prompt = getInquiryPrompt(inquiry);
  const predicted = inquiry.attempts.some(attempt => attempt.questionId === "two_periods");
  const canExperiment = mode === "explore" || predicted;
  const completed = !prompt;
  useEffect(() => { onProgress?.(completed); }, [onProgress, completed]);
  const snapshot = (overrides: Partial<HalfLifeSnapshot> = {}): HalfLifeSnapshot => ({ version: 1, inquiry, parameters, time: clock.time, measurements, events: events.current, ...overrides });
  const restoreSnapshot = (saved: HalfLifeSnapshot) => {
    setInquiry(saved.inquiry); setParameters(saved.parameters); clock.seek(saved.time); setMeasurements(saved.measurements);
    events.current = saved.events; setEventCount(saved.events.length);
    if (saved.events.length) session.current = saved.events[0].sessionId;
    startedRuns.current = new Set(saved.events.flatMap(event => event.type === "simulation_started" && event.data.running === true && typeof event.data.seed === "number" && typeof event.data.initialCount === "number" && typeof event.data.halfLifeSeconds === "number" ? [runKey(event.data.initialCount, event.data.halfLifeSeconds, event.data.seed)] : []));
  };

  const log = (type: PilotEventType, data: PilotEvent["data"] = {}, nextInquiry = inquiry, overrides: Partial<HalfLifeSnapshot> = {}) => {
    if ((!consent && !classConsent) || !session.current) return;
    const next = [...events.current, pilotEvent(session.current, type, data)];
    events.current = next; setEventCount(next.length);
    if (consent) try { localStorage.setItem(KEY, JSON.stringify({ version: 1, sessionId: session.current, inquiry: nextInquiry, events: next, snapshot: snapshot({ ...overrides, inquiry: nextInquiry, events: next }) } satisfies Saved)); }
    catch { setNotice("Thiết bị không lưu được nhật ký; hãy xuất dữ liệu trước khi rời trang."); }
  };
  const action = (value: InquiryAction) => {
    const next = recordInquiryAction(inquiry, value);
    setInquiry(next);
    if (value === "rotate") log("camera_rotated", {}, next);
    if (value === "accessible_observation") log("accessible_observation", {}, next);
  };
  const change = (patch: Partial<DecayParameters>) => {
    const next = { ...parameters, ...patch };
    setParameters(next); clock.reset();
    log("parameter_changed", { initialCount: next.initialCount, halfLifeSeconds: next.halfLifeSeconds, seed: next.seed }, inquiry, { parameters: next, time: 0 });
  };
  const measure = (time: number) => {
    if (!predicted) setExploredBeforePrediction(true);
    clock.seek(time);
    const state = decayState(sample, time);
    const row: Measurement = { time, remaining: state.remaining, expected: state.expected, n: parameters.initialCount, halfLife: parameters.halfLifeSeconds, seed: parameters.seed };
    const next = [...measurements, row].slice(-30); setMeasurements(next);
    let nextInquiry = recordInquiryAction(inquiry, "measure");
    const sameSample = next.filter(m => m.n === row.n && m.halfLife === row.halfLife && m.seed === row.seed);
    if (sameSample.some(m => Math.abs(m.time - row.halfLife) < .01) && sameSample.some(m => Math.abs(m.time - 2 * row.halfLife) < .01)) nextInquiry = recordInquiryAction(nextInquiry, "observe_2t");
    if (row.time > 0 && next.some(m => m.n === row.n && m.time === row.time && m.halfLife !== row.halfLife)) nextInquiry = recordInquiryAction(nextInquiry, "change_half_life");
    if (row.time > 0 && next.some(m => m.n === row.n && m.time === row.time && m.halfLife === row.halfLife && m.seed !== row.seed && startedRuns.current.has(runKey(m.n, m.halfLife, m.seed)) && startedRuns.current.has(runKey(row.n, row.halfLife, row.seed)))) nextInquiry = recordInquiryAction(nextInquiry, "repeat");
    setInquiry(nextInquiry);
    log("measurement", { time, remaining: row.remaining, expected: row.expected, initialCount: row.n, halfLifeSeconds: row.halfLife, seed: row.seed }, nextInquiry, { time, measurements: next });
  };
  const answer = (id: string) => {
    if (!prompt) return;
    const next = answerInquiryQuestion(inquiry, prompt.question.id, id);
    if (next === inquiry) return;
    setInquiry(next); setHint("");
    log("prediction_or_answer", { task: prompt.task.id, question: prompt.question.id, answer: id, correct: next.attempts.at(-1)?.correct ?? false, taskCompleted: next.taskIndex > inquiry.taskIndex, automaticHints: (next.hintsUsed[prompt.task.id] ?? 0) - (inquiry.hintsUsed[prompt.task.id] ?? 0) }, next);
  };
  const toggleConsent = (checked: boolean) => {
    if (!checked) { setConsent(false); setNotice("Đã dừng ghi mới. Dữ liệu đã lưu vẫn ở thiết bị cho đến khi bạn xóa."); return; }
    try {
      const existing = localStorage.getItem(KEY);
      if (existing) {
        const parsed: unknown = JSON.parse(existing);
        if (!parsed || typeof parsed !== "object" || !("sessionId" in parsed) || parsed.sessionId !== session.current) {
          setNotice("Đã có bản lưu trên thiết bị. Hãy khôi phục hoặc xóa bản lưu trước khi bắt đầu ghi phiên mới."); return;
        }
      }
    } catch { setNotice("Không thể kiểm tra bản lưu trên thiết bị; chưa bắt đầu ghi."); return; }
    if (!session.current) session.current = crypto.randomUUID();
    setConsent(true);
    const event = pilotEvent(session.current, "session_started");
    events.current = [...events.current, event]; setEventCount(events.current.length);
    try { localStorage.setItem(KEY, JSON.stringify({ version: 1, sessionId: session.current, inquiry, events: events.current, snapshot: snapshot({ events: events.current }) } satisfies Saved)); setNotice("Đang ghi ẩn danh trên thiết bị này; không tự gửi giáo viên."); }
    catch { setNotice("Không thể lưu vào trình duyệt; có thể xuất dữ liệu của phiên đang mở."); }
  };
  const restore = () => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (!value || typeof value !== "object") throw new Error();
      const saved = value as Saved;
      if (saved.version !== 1 || typeof saved.sessionId !== "string" || !Array.isArray(saved.events) || !saved.inquiry || saved.inquiry.version !== 1 || !Array.isArray(saved.inquiry.actions) || !Array.isArray(saved.inquiry.attempts)) throw new Error();
      session.current = saved.sessionId; events.current = saved.events; setEventCount(saved.events.length);
      const checkedSnapshot = saved.snapshot ? validateHalfLifeSnapshot(saved.snapshot) : null;
      if (checkedSnapshot) { restoreSnapshot(checkedSnapshot); setNotice("Đã khôi phục câu hỏi, tham số, thời gian và bảng đo. Bật đồng ý nếu muốn tiếp tục ghi."); }
      else { setInquiry(saved.inquiry); setNotice("Đã khôi phục bản lưu cũ gồm câu hỏi và nhật ký; bản lưu cũ không có thông số và bảng đo."); }
    } catch { setNotice("Không tìm thấy bản lưu hợp lệ trên thiết bị này."); }
  };
  const loadClassroom = () => {
    if (!stepId || !classConsent) return;
    if (inquiry.attempts.length || measurements.length || events.current.length) { setClassNotice("Đang có tiến độ trong phiên. Hãy lưu trước hoặc mở lại trang rồi khôi phục để tránh ghi đè dữ liệu đang làm."); return; }
    setClassNotice("");
    startClassTransition(async () => {
      try {
        const result = await loadHalfLifeClassroomAction({ stepId, consent: true });
        if (!result.ok) { setClassNotice(result.error); return; }
        if (result.snapshot) { restoreSnapshot(result.snapshot); setClassNotice(result.submitted ? "Đã khôi phục bản đã gửi cho giáo viên." : "Đã khôi phục tiến độ lớp học."); }
        else { if (!session.current) session.current = crypto.randomUUID(); setClassNotice("Chưa có bản lưu trên lớp. Hãy làm nhiệm vụ rồi chọn Lưu tiến độ."); }
      } catch { setClassNotice("Không kết nối được để khôi phục. Tiến độ trên trang vẫn được giữ; hãy thử lại."); }
    });
  };
  const saveClassroom = (submit: boolean) => {
    if (!stepId || !classConsent) return;
    if (!session.current) session.current = crypto.randomUUID();
    if (!submit && uncertainSubmission.current) { setClassNotice("Chưa xác nhận được lần gửi trước. Hãy thử gửi lại trước khi lưu bản khác."); return; }
    const sentSnapshot = submit ? (uncertainSubmission.current ?? snapshot()) : snapshot();
    if (submit) uncertainSubmission.current = sentSnapshot;
    setClassNotice("");
    startClassTransition(async () => {
      try {
        const result = await saveHalfLifeClassroomAction({ stepId, consent: true, snapshot: sentSnapshot, submit });
        if (result.ok) {
          if (submit) uncertainSubmission.current = null;
          setClassNotice(result.submitted ? "Đã xác nhận kết quả thí nghiệm gửi cho giáo viên. Tiếp tục nộp phần trả lời ở bước học bên dưới." : "Đã lưu tiến độ tại thời điểm nhấn nút; hãy lưu lại nếu tiếp tục thay đổi.");
        } else { if (submit && !result.uncertain) uncertainSubmission.current = null; setClassNotice(result.error); }
      } catch {
        setClassNotice(submit ? "Chưa nhận được xác nhận gửi. Hãy thử gửi lại; bản gửi trước được giữ nguyên để kiểm tra trùng." : "Chưa nhận được xác nhận lưu; tiến độ trên trang vẫn được giữ. Hãy thử lại.");
      }
    });
  };
  const download = (format: "json" | "csv") => {
    const text = format === "json" ? JSON.stringify({ schema: "half-life-export/1", sessionId: session.current, events: events.current, inquiry }, null, 2) : eventsCSV(events.current);
    const url = URL.createObjectURL(new Blob([text], { type: format === "json" ? "application/json" : "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `thi-nghiem-ban-ra.${format}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <div className={styles.pilot} ref={container}>
    <header className={styles.hero}><div><div className={styles.eyebrow}>Phòng thí nghiệm · Bài 23</div><h1>Mỗi hạt ngẫu nhiên.<br />Cả mẫu có quy luật.</h1><p>Dự đoán, quan sát và đo một mẫu hạt nhân phóng xạ giả định. So sánh kết quả của chính em với giá trị kì vọng.</p></div><span className={styles.badge}>01 / THÍ NGHIỆM BÁN RÃ</span></header>
    <nav className={styles.modes} aria-label="Chế độ học">
      {([['guided','Bài học có hướng dẫn'],['explore','Khám phá tự do'],['assigned','Nhiệm vụ']] as const).map(([value,label]) => <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>{label}</button>)}
    </nav>
    {mode === "guided" && <section className={styles.guide} aria-label="Hướng dẫn B23"><div><p className={styles.eyebrow}>Cảnh {guideIndex + 1} / {HALF_LIFE_GUIDANCE.length} · Diễn giải</p><h2>{HALF_LIFE_GUIDANCE[guideIndex].title}</h2><p><strong>Mục tiêu:</strong> {HALF_LIFE_GUIDANCE[guideIndex].objective}</p><p>{HALF_LIFE_GUIDANCE[guideIndex].text}</p><p className={styles.small}>Chuyển cảnh hướng dẫn không thay thời gian mô phỏng hay bảng đo.</p></div><div className={styles.controls}><button type="button" disabled={guideIndex === 0} onClick={() => setGuideIndex(i => i - 1)}>Cảnh trước</button><button type="button" disabled={guideIndex === HALF_LIFE_GUIDANCE.length - 1} onClick={() => setGuideIndex(i => i + 1)}>Cảnh tiếp theo</button><button type="button" onClick={() => setGuideIndex(0)}>Xem lại hướng dẫn</button></div></section>}
    {exploredBeforePrediction && !predicted && <p className={styles.note} role="status">Em đã khám phá trước câu dự đoán 2T. Nếu dùng dữ liệu này để nghiên cứu, không coi câu trả lời tiếp theo là dự đoán trước quan sát.</p>}
    <div className={styles.layout}><section className={styles.panel} aria-label="Mô phỏng và số liệu">
      <h2>Mẫu hạt nhân</h2><p className={styles.small}>Kéo để xoay, cuộn hoặc chụm để thu phóng. Các điểm biểu diễn hạt nhân mẹ, không mô tả cấu trúc bên trong.</p>
      <div className={styles.controls} aria-label="Cách xem mẫu"><button type="button" aria-pressed={!single} onClick={() => setSingle(false)}>Cả mẫu</button><button type="button" aria-pressed={single} onClick={() => setSingle(true)}>Một hạt nhân</button>{single && <label>Hạt trong mẫu<input type="number" min="1" max={parameters.initialCount} value={selectedIndex + 1} onChange={e => { const n = e.target.valueAsNumber; if (Number.isInteger(n) && n >= 1 && n <= parameters.initialCount) setNucleusIndex(n - 1); }} /></label>}</div>
      {single && <p className={styles.small}>Đang xem hạt {selectedIndex + 1} thuộc mẫu hiện tại. Bảng và đồ thị vẫn biểu diễn cả mẫu; chuyển cách xem không tạo lượt mới.</p>}
      <HalfLifeScene fullscreenTarget={container} sample={sceneSample} time={clock.time} onRotate={() => action("rotate")} onAccessibleObservation={() => action("accessible_observation")} />
      <div className={styles.controls}>
        <label>Số hạt ban đầu: {parameters.initialCount}<input type="range" min="32" max="256" step="32" value={parameters.initialCount} onChange={e => change({ initialCount: +e.target.value })} /></label>
        <label>Chu kì T: {parameters.halfLifeSeconds} s<input type="range" min="5" max="60" step="5" value={parameters.halfLifeSeconds} onChange={e => change({ halfLifeSeconds: +e.target.value })} /></label>
        <label>Seed<input type="number" min="0" max="999999" value={parameters.seed} onChange={e => { const n = e.target.valueAsNumber; if (Number.isInteger(n) && n >= 0 && n <= 999999) change({ seed: n }); }} /></label>
      </div>
      <div className={styles.controls}><button className={styles.primary} type="button" disabled={!canExperiment} onClick={() => { if (!clock.running) { startedRuns.current.add(runKey(parameters.initialCount, parameters.halfLifeSeconds, parameters.seed)); if (!predicted) setExploredBeforePrediction(true); } log("simulation_started", { initialCount: parameters.initialCount, halfLifeSeconds: parameters.halfLifeSeconds, seed: parameters.seed, time: clock.time, running: !clock.running }); clock.toggle(); }}>{clock.running ? "Tạm dừng" : clock.time > 0 ? "Tiếp tục" : "Chạy mô phỏng"}</button><button type="button" onClick={() => { clock.reset(); log("simulation_reset", {}, inquiry, { time: 0 }); }}>Đặt lại mô phỏng</button><button type="button" onClick={() => change({ seed: (parameters.seed + 1) % 1000000 })}>Lượt mới · seed + 1</button><label>Tốc độ<select value={clock.speed} onChange={e => clock.setSpeed(+e.target.value)}><option value="0.5">0,5×</option><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label></div>
      <dl className={styles.metrics}><div><dt>Thời gian</dt><dd>{clock.time.toFixed(1)} s</dd></div><div><dt>Còn lại · lượt này</dt><dd>{current.remaining} hạt</dd></div><div><dt>Giá trị kì vọng</dt><dd>{current.expected.toFixed(1)} hạt</dd></div></dl>
      <div className={styles.controls}><button type="button" disabled={!canExperiment} onClick={() => measure(parameters.halfLifeSeconds)}>Đo tại T</button><button type="button" disabled={!canExperiment} onClick={() => measure(2 * parameters.halfLifeSeconds)}>Đo tại 2T</button><button type="button" disabled={!canExperiment} onClick={() => measure(clock.time)}>Đo tại thời điểm hiện tại</button></div>
      {!canExperiment && <p className={styles.small}>Hãy đưa ra dự đoán về 2T trước khi chạy hoặc đo.</p>}
      <p className={styles.small}>Nút đo tại T hoặc 2T đưa đồng hồ đến đúng mốc và dừng; kết quả được tính từ cùng lượt có seed hiện tại.</p>
      {measurements.length > 0 && <div style={{ overflowX: "auto" }}><table><caption>Các lần đo trong phiên</caption><thead><tr><th>t (s)</th><th>N₀</th><th>T (s)</th><th>Seed</th><th>Còn lại</th><th>Kì vọng</th></tr></thead><tbody>{measurements.slice(-8).map((m, i) => <tr key={i}><td>{m.time.toFixed(1)}</td><td>{m.n}</td><td>{m.halfLife}</td><td>{m.seed}</td><td>{m.remaining}</td><td>{m.expected.toFixed(1)}</td></tr>)}</tbody></table></div>}
      {canExperiment ? <div className={styles.chart}><DecayProcessVisual sample={sample} time={clock.time} duration={180} /></div> : <p className={styles.note}>Đồ thị sẽ mở sau khi em ghi dự đoán, để em tự hình thành ý tưởng trước khi xem kết quả.</p>}
      <details><summary>Phương trình và giới hạn mô hình</summary><LatexMath block math={String.raw`\lambda=\frac{\ln 2}{T_{1/2}},\quad E[N(t)]=N_0e^{-\lambda t}`} /><p>Mỗi hạt có tuổi thọ ngẫu nhiên độc lập theo phân bố mũ. Mẫu chỉ gồm một loại hạt nhân; không mô phỏng hạt con, phông nền, hiệu suất đầu dò hay kích thước thật. Số mô phỏng không phải số đo thực tế.</p><p><a href="https://openstax.org/books/university-physics-volume-3/pages/10-3-radioactive-decay">Nguồn: OpenStax, Radioactive Decay</a></p></details>
    </section><aside className={styles.panel} aria-label="Nhiệm vụ khám phá"><div className={styles.eyebrow}>Quan sát → dự đoán → đo → giải thích</div><h2>Nhiệm vụ khám phá</h2>
      {mode === "explore" ? <div className={styles.note}><strong>Khám phá tự do</strong><p>Thay N₀, T hoặc seed, đo và so sánh. Chuyển sang Nhiệm vụ bất cứ lúc nào; kết quả thí nghiệm trong phiên vẫn được giữ.</p></div> : prompt ? <><p className={styles.small}>Nhiệm vụ {inquiry.taskIndex + 1} / 5 · Câu {inquiry.questionIndex + 1} / {prompt.task.questions.length}</p><h3>{prompt.task.title}</h3><p>{prompt.task.objective}</p><div className={styles.question}><strong>{prompt.question.prompt}</strong>{prompt.blocked && <p className={styles.status}>{prompt.question.actionPrompt}</p>}<div className={styles.options}>{prompt.question.options.map(option => <button key={option.id} type="button" disabled={prompt.blocked} onClick={() => answer(option.id)}>{option.text}</button>)}</div>{inquiry.feedback && <p role="status">{inquiry.feedback}</p>}<button type="button" onClick={() => { const result = requestInquiryHint(inquiry); setInquiry(result.state); setHint(result.hint); log("hint_requested", { task: prompt.task.id, level: result.state.hintsUsed[prompt.task.id] }, result.state); }}>Gợi ý ({inquiry.hintsUsed[prompt.task.id] ?? 0}/3)</button>{hint && <p role="status">{hint}</p>}</div><details><summary>Thông tin nhiệm vụ</summary><p><strong>Kiến thức nền:</strong> {prompt.task.background}</p><p><strong>Thao tác:</strong> {prompt.task.action}</p><p><strong>Quan sát:</strong> {prompt.task.observation}</p><p><strong>Tiêu chí:</strong> {prompt.task.completion}</p></details></> : <div className={styles.note}><strong>Đã hoàn thành năm nhiệm vụ.</strong><p>Hãy mang bảng đo và lời giải thích đến lớp để so sánh với các nhóm khác.</p></div>}
      {stepId && !preview && <div className={styles.consent}><h3>Lưu tiến độ lớp học</h3><p className={styles.small}>Nếu đồng ý, trạng thái thí nghiệm, lựa chọn, phép đo và gợi ý sẽ được lưu cùng tài khoản và bước học để giáo viên lớp xem. Không ghi thông tin cá nhân vào câu trả lời. Việc sử dụng cho nghiên cứu cần quy trình đồng ý riêng của nhà trường.</p><label><input type="checkbox" checked={classConsent} onChange={e => { if (e.target.checked && !session.current) session.current = crypto.randomUUID(); setClassConsent(e.target.checked); }} /> Tôi đồng ý lưu dữ liệu thí nghiệm vào lớp học.</label><div className={styles.controls}><button type="button" disabled={!classConsent || classPending} onClick={loadClassroom}>Khôi phục từ lớp</button><button type="button" disabled={!classConsent || classPending} onClick={() => saveClassroom(false)}>Lưu tiến độ</button><button type="button" disabled={!classConsent || classPending || !!prompt} onClick={() => saveClassroom(true)}>Gửi kết quả cho giáo viên</button></div>{classNotice && <p role="status">{classNotice}</p>}</div>}
      {!preview && <div className={styles.consent}><h3>Nhật ký học tập trên thiết bị</h3><p className={styles.small}>Tùy chọn: lưu mã phiên ngẫu nhiên, thời điểm, tham số, phép đo, đáp án lựa chọn và gợi ý trên trình duyệt này. Không nhập tên hay thông tin cá nhân; không tự gửi dữ liệu. Giáo viên cần quy trình đồng ý phù hợp trước khi thu thập tệp.</p><label><input type="checkbox" checked={consent} onChange={e => toggleConsent(e.target.checked)} /> Tôi đồng ý lưu nhật ký thí điểm trên thiết bị này.</label><div className={styles.controls}><button type="button" onClick={restore}>Khôi phục bản lưu</button><button type="button" onClick={() => download("json")} disabled={!eventCount}>Xuất JSON</button><button type="button" onClick={() => download("csv")} disabled={!eventCount}>Xuất CSV</button><button type="button" onClick={() => { localStorage.removeItem(KEY); setConsent(false); if (!classConsent) { session.current = ""; events.current = []; setEventCount(0); } setNotice("Đã xóa bản lưu trên thiết bị này. Dữ liệu đang làm trong phiên lớp học được giữ lại."); }}>Xóa nhật ký</button></div>{notice && <p role="status" className={styles.small}>{notice}</p>}</div>}
    </aside></div>
  </div>;
}
