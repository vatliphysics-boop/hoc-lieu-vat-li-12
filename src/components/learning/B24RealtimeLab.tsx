"use client";

import { useEffect, useRef, useState } from "react";
import { LatexMath } from "@/components/learning/LatexMath";
import { useProcessClock } from "@/components/physics/useProcessClock";
import { REACTOR_FLOW_STAGES, REACTOR_LAST_GENERATION, REACTOR_SOURCE, reactorState } from "@/lib/reactor-model";
import { hasReactorComparison, measureReactor, validateB24LocalSnapshot, type B24LocalSnapshot, type ReactorMeasurement } from "@/lib/b24-realtime-activity";
import { B24ReactorScene } from "./B24ReactorScene";
import styles from "./B24RealtimeLab.module.css";

const LOCAL_KEY = "nuclear-b24-realtime-local-v1";
type Mode = "guided" | "explore" | "assignment";
const labels: Record<Mode, string> = { guided: "Học có hướng dẫn", explore: "Khám phá tự do", assignment: "Nhiệm vụ" };

/** The educational chain index and the illustrated energy path are independent models. */
export function B24RealtimeLab({ onProgress, preview = false }: { onProgress?: (done: boolean) => void; preview?: boolean } = {}) {
  const [mode, setMode] = useState<Mode>("guided");
  const [selected, setSelected] = useState(0);
  const [rod, setRod] = useState(50);
  const [prediction, setPrediction] = useState<B24LocalSnapshot["prediction"]>("");
  const [explanation, setExplanation] = useState<B24LocalSnapshot["explanation"]>("");
  const [rows, setRows] = useState<ReactorMeasurement[]>([]);
  const [fullscreenError, setFullscreenError] = useState("");
  const [localNotice, setLocalNotice] = useState("");
  const localOwned = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const clock = useProcessClock(REACTOR_LAST_GENERATION, 1, root);
  const result = reactorState(clock.time, rod);
  const compared = hasReactorComparison(rows);
  const complete = compared && prediction.length > 0 && explanation === "absorption";
  useEffect(() => { onProgress?.(complete); }, [complete, onProgress]);
  const chooseMode = (next: Mode) => { setMode(next); };
  const changeRod = (next: number) => { setRod(next); clock.reset(); };
  const measure = () => { setRows(old => [...old, measureReactor(rod, clock.time)].slice(-20)); };
  const saveLocal = () => {
    try {
      if (localStorage.getItem(LOCAL_KEY) && !localOwned.current) { setLocalNotice("Đã có bản lưu B24. Hãy khôi phục trước khi lưu tiếp để tránh ghi đè."); return; }
      const snapshot: B24LocalSnapshot = { version: 1, rod, time: clock.time, selected, prediction, explanation, rows };
      localStorage.setItem(LOCAL_KEY, JSON.stringify(snapshot)); localOwned.current = true;
      setLocalNotice("Đã lưu trên thiết bị này. Bản này không tự gửi giáo viên.");
    } catch { setLocalNotice("Chưa lưu được trên thiết bị. Tiến độ vẫn còn trên trang này."); }
  };
  const restoreLocal = () => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      const saved = raw ? validateB24LocalSnapshot(JSON.parse(raw)) : null;
      if (!saved) { setLocalNotice("Không có bản lưu B24 hợp lệ trên thiết bị này."); return; }
      setRod(saved.rod); clock.seek(saved.time); setSelected(saved.selected); setPrediction(saved.prediction); setExplanation(saved.explanation); setRows(saved.rows);
      localOwned.current = true; setLocalNotice("Đã khôi phục bản lưu trên thiết bị; mô phỏng đang tạm dừng.");
    } catch { setLocalNotice("Không đọc được bản lưu trên thiết bị; nội dung hiện tại được giữ nguyên."); }
  };
  async function toggleFullscreen() {
    try { if (document.fullscreenElement === root.current) await document.exitFullscreen(); else await root.current?.requestFullscreen(); setFullscreenError(""); }
    catch { setFullscreenError("Trình duyệt không hỗ trợ toàn màn hình ở đây."); }
  }
  return <div className={styles.lab} ref={root} role="region" aria-label="Phòng học lò phản ứng B24">
    <header className={styles.header}><div><p className={styles.eyebrow}>B24 · CÔNG NGHIỆP HẠT NHÂN</p><h2>Từ lõi lò đến dòng điện</h2><p>Quan sát các bộ phận, so sánh hai vị trí thanh điều khiển và giải thích chuỗi truyền năng lượng.</p></div><button type="button" onClick={toggleFullscreen}>Toàn màn hình / thoát</button></header>
    {fullscreenError && <p role="status">{fullscreenError}</p>}
    <nav className={styles.modes} aria-label="Chế độ học B24">{(Object.keys(labels) as Mode[]).map(value => <button key={value} type="button" aria-pressed={mode === value} onClick={() => chooseMode(value)}>{labels[value]}</button>)}</nav>
    <div className={styles.layout}><section className={styles.panel} aria-label="Sơ đồ nhà máy điện hạt nhân">
      <h3>Nhà máy điện hạt nhân · sơ đồ lò nước áp lực</h3>
      <p>Chọn một bộ phận trên cảnh hoặc dùng các nút có nhãn. Màu cam: vòng sơ cấp; xanh: vòng thứ cấp. Vị trí và kích thước chỉ là quy ước.</p>
      <B24ReactorScene rod={rod} selected={selected} onSelect={setSelected} />
      <div className={styles.parts} aria-label="Chọn bộ phận">{REACTOR_FLOW_STAGES.map((item, index) => <button type="button" key={item.id} aria-pressed={selected === index} onClick={() => setSelected(index)}>{item.label}</button>)}</div>
      <div className={styles.callout} aria-live="polite"><strong>{REACTOR_FLOW_STAGES[selected].label}</strong><p>{REACTOR_FLOW_STAGES[selected].detail}</p></div>
      <p className={styles.small}>Sơ đồ cho thấy chiều truyền năng lượng; hai dòng nước ở bộ sinh hơi không trộn lẫn. Không mô phỏng nhiệt độ, công suất hay chuyển động neutron trong lò thực.</p>
    </section><aside className={styles.panel} aria-label="Bảng hoạt động B24">
      {mode === "guided" && <><p className={styles.eyebrow}>HƯỚNG DẪN · {selected + 1}/{REACTOR_FLOW_STAGES.length}</p><h3>{REACTOR_FLOW_STAGES[selected].label}</h3><p>{REACTOR_FLOW_STAGES[selected].detail}</p><p>Nhấn bộ phận trên cảnh hoặc đi tiếp để theo dõi đường năng lượng. Chuyển chế độ không xóa kết quả đo.</p><div className={styles.actions}><button type="button" disabled={selected === 0} onClick={() => setSelected(s => Math.max(0, s - 1))}>Trước</button><button type="button" disabled={selected === REACTOR_FLOW_STAGES.length - 1} onClick={() => setSelected(s => Math.min(REACTOR_FLOW_STAGES.length - 1, s + 1))}>Sau</button><button type="button" onClick={() => setSelected(0)}>Xem lại hướng dẫn</button></div></>}
      {mode === "assignment" && <><p className={styles.eyebrow}>DỰ ĐOÁN → THỬ → GIẢI THÍCH</p><h3>Thanh điều khiển thay đổi điều gì?</h3><p>Trước khi so sánh: cắm thanh sâu hơn thì chỉ số phản ứng dây chuyền được kì vọng thay đổi thế nào?</p><div className={styles.actions}>{[["up", "Tăng"], ["down", "Giảm"], ["same", "Không đổi"]].map(([value, label]) => <button type="button" key={value} aria-pressed={prediction === value} onClick={() => setPrediction(value as B24LocalSnapshot["prediction"])}>{label}</button>)}</div>{prediction && <p role="status">{prediction === "down" ? "Hãy kiểm tra bằng hai phép đo trước khi kết luận." : "Hãy so sánh hai trường hợp và xét vai trò hấp thụ neutron."}</p>}<p>Đo ở cùng thế hệ 4 cho hai vị trí: ≤20% và ≥80%.</p><p>{compared ? "✓ Đã có hai phép đo so sánh." : "Chưa đủ hai phép đo ở cùng thế hệ."}</p>{compared && <><p>Vì sao cắm thanh sâu hơn làm chỉ số trong mô hình giảm?</p><div className={styles.actions}><button type="button" onClick={() => setExplanation("absorption")}>Thanh hấp thụ thêm neutron</button><button type="button" onClick={() => setExplanation("cooling")}>Thanh làm nguội tua-bin</button></div>{explanation && <p role="status">{explanation === "absorption" ? "Đúng: ít neutron hơn tiếp tục gây phân hạch trong mô hình này." : "Hãy phân biệt vai trò hấp thụ neutron với truyền nhiệt ở vòng nước."}</p>}</>}{complete && <p role="status">✓ Đã có dự đoán, hai phép đo và giải thích phù hợp.</p>}</>}
      {mode === "explore" && <><p className={styles.eyebrow}>KHÁM PHÁ TỰ DO</p><h3>Thử và so sánh</h3><p>Thay độ cắm thanh, chạy đến các thế hệ và ghi số chỉ tương đối. Các điều khiển luôn dùng chung mô hình với bảng đo.</p></>}
      <div className={styles.controls}><label>Thanh điều khiển cắm sâu: <strong>{rod}%</strong><input type="range" min="0" max="100" step="5" value={rod} onChange={event => changeRod(+event.target.value)} /></label><p className={styles.small}>Thay vị trí đặt lại thế hệ về 0; các phép đo đã ghi vẫn giữ để so sánh.</p><div className={styles.actions}><button type="button" onClick={clock.toggle}>{clock.running ? "Tạm dừng" : clock.time >= REACTOR_LAST_GENERATION ? "Chạy lại" : clock.time > 0 ? "Tiếp tục" : "Chạy"}</button><button type="button" onClick={() => clock.step(1)} disabled={clock.time >= REACTOR_LAST_GENERATION}>Tiến một thế hệ</button><button type="button" onClick={clock.reset}>Đặt lại thế hệ</button><button type="button" onClick={measure}>Ghi phép đo</button></div><label>Tốc độ<select value={clock.speed} onChange={event => clock.setSpeed(+event.target.value)}><option value="0.5">0,5×</option><option value="1">1×</option><option value="2">2×</option></select></label></div>
      <dl className={styles.metrics}><div><dt>Thế hệ</dt><dd>{result.generation}</dd></div><div><dt>Hệ số quy ước k</dt><dd>{result.k.toFixed(2)}</dd></div><div><dt>Chỉ số kì vọng</dt><dd>{result.expected.toFixed(2)}</dd></div></dl>
      <p className={styles.small}>Chỉ số ban đầu bằng 1; k và vị trí thanh là giả định sư phạm không thứ nguyên, không phải số đo hay công suất lò thật.</p><LatexMath block math={String.raw`I_g=k^g`} />
      {!!rows.length && <div className={styles.table}><table><caption>Phép đo trong phiên</caption><thead><tr><th>Thanh (%)</th><th>Thế hệ</th><th>k</th><th>Chỉ số</th></tr></thead><tbody>{rows.map((row, i) => <tr key={i}><td>{row.rod}</td><td>{row.generation}</td><td>{row.multiplier.toFixed(2)}</td><td>{row.expected.toFixed(2)}</td></tr>)}</tbody></table></div>}
      {!preview && <div className={styles.controls}><h3>Lưu trên thiết bị</h3><p className={styles.small}>Chỉ lưu khi em chọn; thông số, dự đoán và phép đo nằm trên trình duyệt này, không tự đồng bộ hoặc ghi nhật kí nghiên cứu.</p><div className={styles.actions}><button type="button" onClick={saveLocal}>Lưu trên thiết bị</button><button type="button" onClick={restoreLocal}>Khôi phục bản lưu B24</button></div>{localNotice && <p role="status">{localNotice}</p>}</div>}
      <details><summary>Nguồn và giới hạn</summary><p>Thanh cắm sâu làm tăng khả năng hấp thụ neutron. Mô hình sử dụng quy luật k giả định tuyến tính để so sánh xu hướng; không dùng điều khiển nhà máy hay dự đoán lò thực. Hệ thống đường truyền là sơ đồ riêng, không suy công suất từ chỉ số.</p><a href={REACTOR_SOURCE}>U.S. NRC · Pressurized Water Reactors</a></details>
    </aside></div>
  </div>;
}
