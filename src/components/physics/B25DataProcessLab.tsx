"use client";

import { useId, useMemo, useRef, useState } from "react";
import {
  activityAt,
  B25_COMPARISON,
  halfActivityBracket,
  SGK_TABLE_25_1,
} from "@/lib/sgk-b25-decay";
import { LatexMath } from "@/components/learning/LatexMath";
import { usePersistedLabState, useSyncLabProgress } from "@/lib/use-persisted-lab-state";
import { ChoiceCheck } from "./shared";
import { useProcessClock } from "./useProcessClock";
import styles from "./ProcessLab.module.css";

export const B25_DATA_LAB_STORAGE_KEY = "b25-data-lab-v1";

interface B25DataLabPersistedState {
  readonly halfLife: number;
  readonly plottedTimes: readonly number[];
  readonly explanation: string;
  readonly estimateSaved: boolean;
  readonly showFit: boolean;
  readonly compare: boolean;
  readonly answered: boolean;
}

const VALID_TABLE_TIMES = new Set(SGK_TABLE_25_1.map((r) => r.t));

const INITIAL_B25_DATA_STATE: B25DataLabPersistedState = {
  halfLife: B25_COMPARISON.halfLifeB, // Khởi tạo ở 60 s để học sinh tự ước lượng, không lộ trước đáp số
  plottedTimes: [0],
  explanation: "",
  estimateSaved: false,
  showFit: false,
  compare: false,
  answered: false,
};

function parseB25DataState(
  raw: unknown,
  fallback: B25DataLabPersistedState
): B25DataLabPersistedState {
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  const halfLife =
    typeof obj.halfLife === "number" &&
    Number.isFinite(obj.halfLife) &&
    obj.halfLife >= 10 &&
    obj.halfLife <= 120
      ? Math.round(obj.halfLife * 2) / 2
      : fallback.halfLife;
  const plottedTimes = Array.isArray(obj.plottedTimes)
    ? Array.from(
        new Set(
          obj.plottedTimes.filter(
            (x): x is number => typeof x === "number" && VALID_TABLE_TIMES.has(x)
          )
        )
      )
    : fallback.plottedTimes;
  const explanation = typeof obj.explanation === "string" ? obj.explanation : "";
  return {
    halfLife,
    plottedTimes: plottedTimes.length > 0 ? plottedTimes : [0],
    explanation,
    estimateSaved: Boolean(obj.estimateSaved) && explanation.trim().length >= 12,
    showFit: Boolean(obj.showFit),
    compare: Boolean(obj.compare),
    answered: Boolean(obj.answered),
  };
}

const layouts = [
  {
    name: "compact",
    width: 320,
    height: 245,
    left: 46,
    right: 304,
    top: 28,
    bottom: 204,
    fontSize: 11.5,
    ticks: [0, 60, 120, 180, 240, 300, 360],
  },
  {
    name: "wide",
    width: 720,
    height: 320,
    left: 64,
    right: 688,
    top: 34,
    bottom: 268,
    fontSize: 14,
    ticks: [0, 60, 120, 180, 240, 300, 360],
  },
] as const;

const curve = (period: number) =>
  Array.from({ length: 121 }, (_, i) => ({
    time: i * 3,
    activity: activityAt(i * 3, period),
  }));

const equation = (
  <LatexMath block math={String.raw`H_{\text{lí thuyết}}(t)=151\cdot 2^{-\frac{t}{T}}\;\mathrm{Bq}`} />
);

export function B25DataProcessLab({ onSubDone }: { onSubDone?: (done: boolean) => void }) {
  const [persisted, setPersisted, resetPersisted] = usePersistedLabState(
    B25_DATA_LAB_STORAGE_KEY,
    INITIAL_B25_DATA_STATE,
    parseB25DataState
  );
  const [draftExplanation, setDraftExplanation] = useState<string | null>(null);
  const explanationValue = draftExplanation ?? persisted.explanation;

  const container = useRef<HTMLDivElement>(null);
  const clipId = useId();
  const clock = useProcessClock(360, 30, container);
  const bracket = halfActivityBracket();
  const t = clock.time;

  const halfLife = persisted.halfLife;
  const showFit = persisted.showFit;
  const compare = persisted.compare;

  const selected = SGK_TABLE_25_1.find((row) => Math.abs(row.t - t) < 0.05);
  const comparisonHalfLife =
    Math.abs(halfLife - B25_COMPARISON.halfLifeB) < 5
      ? B25_COMPARISON.halfLifeA
      : B25_COMPARISON.halfLifeB;

  const fitPoints = useMemo(() => curve(halfLife), [halfLife]);
  const comparisonPoints = useMemo(() => curve(comparisonHalfLife), [comparisonHalfLife]);

  const hasBracketChecked =
    persisted.plottedTimes.includes(bracket.fromSeconds) &&
    persisted.plottedTimes.includes(bracket.toSeconds);

  const complete =
    hasBracketChecked && persisted.estimateSaved && showFit && persisted.answered;

  useSyncLabProgress(complete, onSubDone);

  function markAndSeekPoint(timeSec: number) {
    clock.seek(timeSec);
    setPersisted((prev) => ({
      ...prev,
      plottedTimes: prev.plottedTimes.includes(timeSec)
        ? prev.plottedTimes
        : [...prev.plottedTimes, timeSec],
    }));
  }

  function markAllPoints() {
    setPersisted((prev) => ({
      ...prev,
      plottedTimes: SGK_TABLE_25_1.map((r) => r.t),
    }));
  }

  function changeHalfLife(next: number) {
    if (!Number.isFinite(next)) return;
    const clamped = Math.min(120, Math.max(10, Math.round(next * 2) / 2));
    setPersisted((prev) => ({
      ...prev,
      halfLife: clamped,
    }));
  }

  function handleSaveEstimate() {
    const trimmed = explanationValue.trim();
    if (trimmed.length < 12) return;
    setPersisted((prev) => ({
      ...prev,
      explanation: trimmed,
      estimateSaved: true,
      showFit: true,
    }));
    setDraftExplanation(null);
  }

  return (
    <div
      ref={container}
      className={styles.lab}
      data-process="B25"
      data-process-ready={clock.ready}
    >
      <h3>Phân tích Bảng 25.1 &amp; Tự ước lượng chu kì bán rã T</h3>
      <p className={styles.prompt}>
        <strong>Nhiệm vụ thực hành (không lộ đáp số trước):</strong>{" "}
        (1) Bấm chọn các mốc đo trong Bảng 25.1 — đặc biệt hai mốc kẹp mức nửa ban đầu{" "}
        <code>H₀/2 = {bracket.halfActivityBq.toString().replace(".", ",")} Bq</code>; (2) Tự chỉnh{" "}
        <code>T</code> ước lượng của em và viết lời giải thích cách ước lượng; (3) Bật đường lí thuyết và trả lời câu hỏi kiểm tra để mở đối chiếu chuẩn.
      </p>

      {/* Bước 1 & 2: Tự ước lượng T và giải thích */}
      <div
        style={{
          padding: "12px 14px",
          borderRadius: "12px",
          backgroundColor: "#ffffff",
          border: "1px solid #cbdee4",
          marginBottom: "14px",
        }}
      >
        <div className={styles.controls} style={{ margin: "0 0 12px" }}>
          <label>
            <span>
              T ước lượng của em: <strong>{halfLife.toString().replace(".", ",")} s</strong>
            </span>
            <input
              aria-label="T ước lượng của em"
              type="range"
              disabled={!clock.ready}
              min="10"
              max="120"
              step="0.5"
              value={halfLife}
              onChange={(e) => changeHalfLife(Number(e.target.value))}
            />
          </label>
          <label style={{ flex: "0 1 130px" }}>
            <span>Nhập số T (s)</span>
            <input
              aria-label="Nhập số chu kì bán rã T ước lượng"
              type="number"
              inputMode="decimal"
              disabled={!clock.ready}
              min="10"
              max="120"
              step="0.5"
              value={halfLife}
              onChange={(e) => changeHalfLife(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Thời điểm con trỏ: {t.toFixed(1)} s</span>
            <input
              aria-label="Thời điểm đối chiếu"
              type="range"
              disabled={!clock.ready}
              min="0"
              max="360"
              value={t}
              onChange={(e) => clock.seek(Number(e.target.value))}
            />
          </label>
        </div>

        <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "8px" }}>
          Giải thích cách em ước lượng T từ Bảng 25.1 / đồ thị (tối thiểu 12 kí tự):
          <textarea
            rows={2}
            value={explanationValue}
            onChange={(e) => setDraftExplanation(e.target.value)}
            placeholder="Gợi ý: So sánh H₀/2 = 75,5 Bq nằm giữa hai thời điểm đo nào trong Bảng 25.1 để suy ra khoảng giá trị của T..."
            style={{
              display: "block",
              width: "100%",
              marginTop: "6px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "1px solid #83a5b2",
              font: "inherit",
              fontSize: "13.5px",
            }}
          />
        </label>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            className={styles.primary}
            disabled={!clock.ready || explanationValue.trim().length < 12}
            onClick={handleSaveEstimate}
          >
            Chốt ước lượng T &amp; hiện đường lí thuyết
          </button>
          <button
            type="button"
            disabled={!clock.ready}
            onClick={() => {
              markAndSeekPoint(bracket.fromSeconds);
              setPersisted((prev) => ({
                ...prev,
                plottedTimes: Array.from(
                  new Set([...prev.plottedTimes, 0, bracket.fromSeconds, bracket.toSeconds])
                ),
              }));
            }}
          >
            Đánh dấu 2 mốc kẹp H₀/2 (30 s &amp; 60 s)
          </button>
          <button type="button" disabled={!clock.ready} onClick={markAllPoints}>
            Đánh dấu đủ 8 điểm đo
          </button>
          {persisted.estimateSaved && draftExplanation === null && (
            <span role="status" style={{ fontSize: "13px", fontWeight: 600, color: "#0f766e" }}>
              ✓ Đã lưu T = {halfLife.toString().replace(".", ",")} s và lời giải thích.
            </span>
          )}
        </div>
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.primary}
          disabled={!clock.ready}
          onClick={clock.toggle}
        >
          {clock.running ? "Tạm dừng" : t > 0 && t < 360 ? "Tiếp tục" : "Chạy con trỏ"}
        </button>
        <button type="button" disabled={!clock.ready} onClick={clock.reset}>
          Về t = 0
        </button>
        <button type="button" disabled={!clock.ready} onClick={() => clock.step(30)}>
          +30 s
        </button>
        <button
          type="button"
          disabled={!clock.ready}
          aria-pressed={showFit}
          onClick={() => setPersisted((prev) => ({ ...prev, showFit: !prev.showFit }))}
        >
          {showFit ? "Ẩn đường lí thuyết" : "Hiện đường lí thuyết"}
        </button>
        <button
          type="button"
          disabled={!clock.ready}
          aria-pressed={showFit && compare}
          onClick={() =>
            setPersisted((prev) => ({
              ...prev,
              compare: !prev.showFit || !prev.compare,
              showFit: true,
            }))
          }
        >
          Đối chiếu thêm T = {comparisonHalfLife} s
        </button>
        <label>
          Tốc độ đọc đồ thị
          <select
            aria-label="Tốc độ đọc đồ thị"
            value={clock.speed}
            disabled={!clock.ready}
            onChange={(e) => clock.setSpeed(Number(e.target.value))}
          >
            <option value="0.5">15 s dữ liệu / s</option>
            <option value="1">30 s dữ liệu / s</option>
            <option value="2">60 s dữ liệu / s</option>
          </select>
        </label>
      </div>

      <figure className={`${styles.figure} ${styles.responsiveVisual} ${styles.visualPanel}`}>
        <p className={styles.chartTitle}>Đồ thị độ phóng xạ H(t) từ Bảng 25.1 SGK</p>
        {layouts.map((layout) => {
          const x = (seconds: number) =>
            layout.left + (seconds / 360) * (layout.right - layout.left);
          const y = (activity: number) =>
            layout.bottom - (activity / 160) * (layout.bottom - layout.top);
          const id = `${clipId}-${layout.name}`;
          const isCompact = layout.name === "compact";
          return (
            <svg
              key={layout.name}
              className={isCompact ? styles.compactSvg : styles.wideSvg}
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              role="img"
              aria-label={`Đồ thị Bảng 25.1 giữ nguyên tám điểm nguồn. Con trỏ tại ${t.toFixed(1)} giây.${showFit ? ` Đường lí thuyết T bằng ${halfLife} giây.` : ""}${showFit && compare ? ` Đường đối chiếu T bằng ${comparisonHalfLife} giây.` : ""}`}
            >
              <title>Số liệu Bảng 25.1 SGK và đường hàm mũ độc lập</title>
              <defs>
                <clipPath id={id}>
                  <rect
                    x={x(0)}
                    y={layout.top - 5}
                    width={Math.max(2, x(t) - x(0))}
                    height={layout.bottom - layout.top + 7}
                  />
                </clipPath>
              </defs>

              {/* Nhãn trục tung H (Bq) và trục hoành t (s) rõ ràng ngay trong SVG */}
              <text
                x="8"
                y="17"
                fill="#effbff"
                fontSize={isCompact ? 11.5 : 13.5}
                fontWeight="650"
              >
                H (Bq)
              </text>
              <text
                x={(layout.left + layout.right) / 2}
                y={layout.height - 6}
                textAnchor="middle"
                fill="#effbff"
                fontSize={isCompact ? 11.5 : 13.5}
                fontWeight="650"
              >
                Thời gian t (s)
              </text>

              {[0, 40, 80, 120, 160].map((v) => (
                <g key={v}>
                  <path d={`M${layout.left} ${y(v)}H${layout.right}`} stroke="#294555" />
                  <text
                    x={layout.left - 7}
                    y={y(v) + 4}
                    textAnchor="end"
                    fill="#d3e4ed"
                    fontSize={layout.fontSize}
                  >
                    {v}
                  </text>
                </g>
              ))}

              {layout.ticks.map((v) => (
                <text
                  key={v}
                  x={x(v)}
                  y={layout.bottom + (isCompact ? 17 : 22)}
                  textAnchor="middle"
                  fill="#d3e4ed"
                  fontSize={layout.fontSize}
                >
                  {v}
                </text>
              ))}

              {/* Dải kẹp giữa 30 s và 60 s quanh mức H₀/2 = 75,5 Bq */}
              <rect
                x={x(bracket.fromSeconds)}
                y={layout.top}
                width={x(bracket.toSeconds) - x(bracket.fromSeconds)}
                height={layout.bottom - layout.top}
                fill="#ffcb71"
                opacity="0.1"
              />
              <path
                d={`M${layout.left} ${y(bracket.halfActivityBq)}H${layout.right}`}
                stroke="#ffcb71"
                strokeDasharray="5 4"
              />

              {showFit && (
                <g clipPath={t > 0 ? `url(#${id})` : undefined}>
                  <polyline
                    points={fitPoints.map((p) => `${x(p.time)},${y(p.activity)}`).join(" ")}
                    fill="none"
                    stroke="#5ae5c1"
                    strokeWidth="2.6"
                  />
                  {compare && (
                    <polyline
                      points={comparisonPoints
                        .map((p) => `${x(p.time)},${y(p.activity)}`)
                        .join(" ")}
                      fill="none"
                      stroke="#ceacff"
                      strokeWidth="2.4"
                      strokeDasharray="6 4"
                    />
                  )}
                </g>
              )}

              {SGK_TABLE_25_1.map((row) => {
                const isPlotted = persisted.plottedTimes.includes(row.t);
                const isActive = Math.abs(row.t - t) < 0.05;
                return (
                  <g
                    key={row.t}
                    style={{ cursor: "pointer" }}
                    onClick={() => markAndSeekPoint(row.t)}
                  >
                    <circle
                      cx={x(row.t)}
                      cy={y(row.h)}
                      r={isCompact ? (isPlotted ? 5 : 3.8) : isPlotted ? 6.5 : 5}
                      fill={isPlotted ? "#ffcb71" : "#3b596b"}
                      stroke={isActive ? "#5ae5c1" : "#e6f1f7"}
                      strokeWidth={isActive ? 2.5 : 1.2}
                    />
                  </g>
                );
              })}

              <path
                d={`M${x(t)} ${layout.top - 4}V${layout.bottom}`}
                stroke="#f1f9ff"
                opacity="0.8"
              />
            </svg>
          );
        })}

        <div className={styles.visualLegend} style={{ marginTop: "8px" }}>
          <span>
            <i
              style={{ background: "transparent", borderTop: "2px dashed #ffcb71", height: 0 }}
              aria-hidden="true"
            />
            H₀/2 = 75,5 Bq
          </span>
          <span>
            <i style={{ background: "#ffcb71" }} aria-hidden="true" />
            Điểm đã đánh dấu ({persisted.plottedTimes.length}/8)
          </span>
          {showFit && (
            <span>
              <i style={{ background: "#5ae5c1" }} aria-hidden="true" />
              Đường lí thuyết T = {halfLife.toString().replace(".", ",")} s
            </span>
          )}
          {showFit && compare && (
            <span>
              <i
                style={{ background: "transparent", borderTop: "3px dashed #ceacff", height: 0 }}
                aria-hidden="true"
              />
              Đối chiếu T = {comparisonHalfLife} s
            </span>
          )}
        </div>
        <figcaption className={styles.chartCaption}>
          Bấm trực tiếp vào chấm trên đồ thị hoặc mốc thời gian trong Bảng 25.1 để đánh dấu và đọc độ lệch. Tám số đo nguồn luôn giữ nguyên.
        </figcaption>
      </figure>

      <dl className={styles.metrics}>
        <div>
          <dt>Thời điểm t</dt>
          <dd data-time>{t.toFixed(1)} s</dd>
        </div>
        <div>
          <dt>H lí thuyết (T = {halfLife.toString().replace(".", ",")} s)</dt>
          <dd data-theory>{activityAt(t, halfLife).toFixed(2)} Bq</dd>
        </div>
        <div>
          <dt>H đo trong Bảng 25.1</dt>
          <dd>{selected ? `${selected.h} Bq` : "Không có mốc đo"}</dd>
        </div>
        <div>
          <dt>Độ lệch (Lí thuyết − Bảng)</dt>
          <dd>
            {selected
              ? `${(activityAt(t, halfLife) - selected.h).toFixed(2)} Bq`
              : "Chọn mốc trong bảng"}
          </dd>
        </div>
      </dl>

      {equation}

      <div className={styles.table}>
        <table style={{ fontSize: "13px" }}>
          <caption style={{ textAlign: "left", fontWeight: 700, marginBottom: "6px" }}>
            Bảng 25.1 · SGK Vật lí 12 KNTT, trang 121 (bấm mốc t để đánh dấu &amp; đối chiếu)
          </caption>
          <thead>
            <tr>
              <th style={{ padding: "7px 6px" }}>t (s)</th>
              <th style={{ padding: "7px 6px" }}>H bảng (Bq)</th>
              <th style={{ padding: "7px 6px" }}>H lí thuyết (Bq)</th>
              <th style={{ padding: "7px 6px" }}>Đánh dấu</th>
            </tr>
          </thead>
          <tbody>
            {SGK_TABLE_25_1.map((row) => {
              const isPlotted = persisted.plottedTimes.includes(row.t);
              const isBracketRow = row.t === bracket.fromSeconds || row.t === bracket.toSeconds;
              return (
                <tr
                  key={row.t}
                  style={isBracketRow ? { backgroundColor: "#eef7f8" } : undefined}
                >
                  <td style={{ padding: "6px" }}>
                    <button
                      type="button"
                      disabled={!clock.ready}
                      onClick={() => markAndSeekPoint(row.t)}
                      aria-label={`Đối chiếu tại ${row.t} giây`}
                      style={{ minHeight: "34px", padding: "4px 10px" }}
                    >
                      {row.t}
                    </button>
                  </td>
                  <td style={{ padding: "6px", fontWeight: isBracketRow ? 700 : 400 }}>
                    {row.h}
                  </td>
                  <td style={{ padding: "6px" }}>
                    {showFit ? activityAt(row.t, halfLife).toFixed(2) : "—"}
                  </td>
                  <td style={{ padding: "6px" }}>{isPlotted ? "✓ Đã chọn" : "○"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="physics-checklist" style={{ marginBottom: "12px" }}>
        <p>
          <strong>Tiêu chí hoàn thành xử lí dữ liệu Bảng 25.1:</strong>
        </p>
        <ul>
          <li className={hasBracketChecked ? "is-done" : ""}>
            Đánh dấu kiểm tra hai mốc kẹp mức H₀/2 = 75,5 Bq là (30 s; 85 Bq) và (60 s; 55 Bq){" "}
            {hasBracketChecked ? "✓" : ""}
          </li>
          <li className={persisted.estimateSaved ? "is-done" : ""}>
            Nhập chu kì ước lượng T của riêng em và lưu câu giải thích{" "}
            {persisted.estimateSaved ? "✓" : ""}
          </li>
          <li className={showFit && persisted.answered ? "is-done" : ""}>
            Bật đường lí thuyết và trả lời câu hỏi bản chất dữ liệu thực nghiệm{" "}
            {showFit && persisted.answered ? "✓" : ""}
          </li>
        </ul>
      </div>

      <ChoiceCheck
        key={persisted.answered ? "b25-data-solved" : "b25-data-unsolved"}
        initialSelected={persisted.answered ? 1 : null}
        initialChecked={persisted.answered}
        question="Khi vẽ đường hàm mũ lí thuyết đi qua điểm đầu H₀ = 151 Bq, tại các mốc đo như t = 30 s (85 Bq) hay t = 180 s (22 Bq) giá trị lí thuyết vẫn lệch vài Bq so với bảng. Nên xử lí thế nào?"
        options={[
          "Sửa lại các con số trong Bảng 25.1 cho trùng khít hoàn toàn với đường cong công thức.",
          "Giữ nguyên số liệu đo gốc; giải thích sự lệch nhỏ bằng tính ngẫu nhiên của phân rã phóng xạ, sai số phép đo và phông phóng xạ nền.",
          "Kết luận định luật phóng xạ hoàn toàn sai và chu kì bán rã tăng gấp đôi theo thời gian.",
        ]}
        correctIndex={1}
        explanation="Trong thực nghiệm vật lí hạt nhân, số phân rã đếm được dao động thống kê quanh kì vọng lí thuyết và chịu ảnh hưởng của phông nền đo. Luôn giữ nguyên dữ liệu gốc và đối chiếu trên toàn dải thời gian."
        onResult={(correct) =>
          setPersisted((prev) => ({ ...prev, answered: correct }))
        }
      />

      {complete ? (
        <div
          role="status"
          style={{
            marginTop: "14px",
            padding: "14px",
            borderRadius: "10px",
            backgroundColor: "#ecfdf5",
            border: "1.5px solid #6ee7b7",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#065f46" }}>
            ✓ Nhận xét đối chiếu sau khi em đã tự ước lượng (T của em:{" "}
            {halfLife.toString().replace(".", ",")} s):
          </p>
          <p style={{ margin: 0, color: "#064e3b" }}>
            • Hoạt độ ban đầu <code>H₀ = 151 Bq</code> nên mức một nửa{" "}
            <code>H₀/2 = 75,5 Bq</code> nằm giữa hai điểm đo <code>(30 s; 85 Bq)</code> và{" "}
            <code>(60 s; 55 Bq)</code>. Phép nội suy tuyến tính giữa hai mốc này cho{" "}
            <strong>
              T ≈ {bracket.linearEstimateSeconds.toFixed(1).replace(".", ",")} s
            </strong>
            ; còn khi khớp hàm mũ trên toàn bộ 8 điểm đo của Bảng 25.1 thì thu được{" "}
            <strong>T ≈ 40–45 s</strong>.
            <br />• Toàn bộ 8 cặp số liệu gốc của Bảng 25.1 được giữ nguyên độc lập với mô hình lí thuyết.
          </p>
        </div>
      ) : (
        <p className={styles.note}>
          Gợi ý thao tác: Tìm xem mức một nửa <code>H₀/2 = 75,5 Bq</code> nằm giữa hai dòng nào của Bảng 25.1, tự ước lượng <code>T</code>, lưu giải thích và trả lời câu hỏi kiểm tra để mở phần đối chiếu kết quả nội suy &amp; khớp hàm mũ.
        </p>
      )}

      <div style={{ marginTop: "10px" }}>
        <button
          type="button"
          onClick={() => {
            resetPersisted();
            setDraftExplanation(null);
            clock.reset();
          }}
        >
          Làm lại bài xử lí số liệu
        </button>
      </div>
    </div>
  );
}
