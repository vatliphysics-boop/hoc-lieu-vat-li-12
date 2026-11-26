"use client";

/**
 * RutherfordInquiryTask — Phiếu khảo sát hai lượt đo tán xạ hạt α (Rutherford V3)
 *
 * Quy trình chuẩn:
 *   1. Dự đoán sự thay đổi góc lệch θ khi đổi tham số va chạm b (giữ nguyên E)
 *   2. Chọn thông số → chạy & quan sát đốm lóe trên màn S → lưu Lượt 1 & Lượt 2 độc lập
 *      (kiểm tra nghiêm ngặt điều kiện cùng động năng E, khác tham số va chạm b)
 *   3. Đối chiếu hai góc lệch ngay cạnh Dự đoán Pha 1 đã khóa
 *   4. Viết lời giải thích vật lí dựa trên kết quả quan sát (lưu bền vững localStorage)
 */

import { useEffect, useMemo, useSyncExternalStore } from "react";
import {
  evaluateRutherfordInquiry,
  PREDICTION_LABELS,
  type InquiryRun,
  type InvalidComparisonReason,
  type RunSlot,
  type RutherfordPrediction,
} from "@/simulations-v3/apparatus/rutherford/inquiry";
import {
  INITIAL_RUTHERFORD_V3_STATE,
  parseRutherfordV3State,
  RUTHERFORD_V3_STORAGE_KEY,
  type RutherfordV3PersistedState,
} from "@/simulations-v3/apparatus/rutherford/parts";

export type { InquiryRun, RutherfordPrediction };

const EMPTY_RAW = () => "";
const RUTHERFORD_STORAGE_EVENT = "b21-rutherford-v3-changed";

export function subscribeRutherfordV3Storage(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(RUTHERFORD_STORAGE_EVENT, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(RUTHERFORD_STORAGE_EVENT, listener);
  };
}

export function getRutherfordV3RawSnapshot(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(RUTHERFORD_V3_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeRutherfordV3State(
  updater:
    | RutherfordV3PersistedState
    | ((prev: RutherfordV3PersistedState) => RutherfordV3PersistedState),
): void {
  if (typeof window === "undefined") return;
  const current = parseRutherfordV3State(getRutherfordV3RawSnapshot());
  const next = typeof updater === "function" ? updater(current) : updater;
  try {
    window.localStorage.setItem(RUTHERFORD_V3_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(RUTHERFORD_STORAGE_EVENT));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export interface LockedPhase1PredictionInfo {
  readonly choiceLabel: string;
  readonly reason: string;
  readonly bringQuestion?: string;
}

export interface RutherfordInquiryTaskProps {
  /** Trạng thái hiện tại của mô phỏng (đọc từ cùng nguồn với cảnh 3D). */
  readonly current: InquiryRun | null;
  /** Trạng thái hạt α của cấu hình hiện tại đã chạy tới màn S hay chưa. */
  readonly hasObservedCurrentRun?: boolean;
  /** Dự đoán ban đầu đã khóa ở Pha 1 (đưa vào ngay chỗ so sánh hai lượt Rutherford). */
  readonly lockedPhase1Prediction?: LockedPhase1PredictionInfo | null;
  /** Mở lại Pha 1 nếu học sinh chưa khóa dự đoán ban đầu. */
  readonly onOpenPhase1?: () => void;
  /** Nút hỗ trợ khớp nhanh động năng E theo lượt chuẩn khi hai lượt lỡ khác E. */
  readonly onSyncEnergyToAnchor?: (anchorEnergyMeV: number) => void;
  /** Báo trạng thái hoàn thành đủ nhiệm vụ điều tra lên mô phỏng / bài học. */
  readonly onCompleteChange?: (complete: boolean) => void;
}

const cardStyle: React.CSSProperties = {
  padding: "16px",
  background: "#ffffff",
  borderRadius: "8px",
  border: "1px solid #d1d5db",
};

const optionStyle = (active: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px",
  background: active ? "#dbeafe" : "#f9fafb",
  border: "1.5px solid",
  borderColor: active ? "#2563eb" : "#d1d5db",
  borderRadius: "6px",
  cursor: "pointer",
  minHeight: "44px",
  fontSize: "14px",
  fontWeight: active ? 600 : 400,
});

function formatSgkZone(thetaDeg: number): string {
  if (thetaDeg <= 15) return "Gần vị trí (1) · lệch rất nhỏ";
  if (thetaDeg > 90) return "Vùng vị trí (2) · bật ngược > 90°";
  return "Góc lệch trung gian (15°–90°)";
}

function invalidSlotTag(reason: InvalidComparisonReason | null): string {
  if (reason === "different_energy") return "Cần đo lại: Khác động năng E";
  if (reason === "same_impact") return "Cần đo lại: Trùng tham số b";
  if (reason === "both") return "Cần đo lại: Khác E & trùng b";
  return "Cần đo lại";
}

function RunCard({
  slot,
  title,
  hint,
  run,
  needsRemeasure,
  invalidReason,
  onCapture,
  onClear,
}: {
  slot: RunSlot;
  title: string;
  hint: string;
  run: InquiryRun | null;
  needsRemeasure: boolean;
  invalidReason: InvalidComparisonReason | null;
  onCapture: () => void;
  onClear: () => void;
}) {
  const bg = needsRemeasure ? "#fffbeb" : run ? "#ecfdf5" : "#f8fafc";
  const border = needsRemeasure ? "#f59e0b" : run ? "#10b981" : "#cbd5e1";

  return (
    <div
      data-run-slot={slot}
      data-needs-remeasure={needsRemeasure ? "true" : "false"}
      style={{
        padding: "14px",
        background: bg,
        borderRadius: "8px",
        border: "1.5px solid",
        borderColor: border,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "6px",
          marginBottom: "4px",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{title}</div>
        {needsRemeasure ? (
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
              background: "#fef3c7",
              color: "#b45309",
              border: "1px solid #f59e0b",
            }}
          >
            ⚠ {invalidSlotTag(invalidReason)}
          </span>
        ) : run ? (
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
              background: "#d1fae5",
              color: "#065f46",
            }}
          >
            ✓ Đã lưu độc lập
          </span>
        ) : null}
      </div>

      <div style={{ fontSize: "12px", color: "#475569", marginBottom: "10px" }}>{hint}</div>

      {run ? (
        <div style={{ fontSize: "13px", lineHeight: 1.75, fontVariantNumeric: "tabular-nums" }}>
          <div
            style={{
              display: "grid",
              gap: "4px",
              padding: "8px 10px",
              background: "#ffffff",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                color:
                  needsRemeasure && (invalidReason === "different_energy" || invalidReason === "both")
                    ? "#b45309"
                    : "#1e293b",
                fontWeight:
                  needsRemeasure && (invalidReason === "different_energy" || invalidReason === "both")
                    ? 700
                    : 500,
              }}
            >
              Động năng hạt α: <strong>E = {run.e.toFixed(1)} MeV</strong>
            </div>
            <div
              style={{
                color:
                  needsRemeasure && (invalidReason === "same_impact" || invalidReason === "both")
                    ? "#b45309"
                    : "#1e293b",
                fontWeight:
                  needsRemeasure && (invalidReason === "same_impact" || invalidReason === "both")
                    ? 700
                    : 500,
              }}
            >
              Tham số va chạm: <strong>b = {run.b} fm</strong>
            </div>
            <div style={{ color: "#0f172a" }}>
              Góc lệch (tán xạ): <strong style={{ fontSize: "15px", color: "#0369a1" }}>θ = {run.theta.toFixed(2)}°</strong>
            </div>
            <div style={{ fontSize: "11.5px", color: "#64748b" }}>
              Vùng trên màn S: {formatSgkZone(run.theta)}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
            <button
              type="button"
              data-capture-slot={slot}
              onClick={onCapture}
              style={{
                fontSize: "12px",
                padding: "7px 12px",
                border: needsRemeasure ? "1px solid #d97706" : "1px solid #94a3b8",
                borderRadius: "6px",
                background: needsRemeasure ? "#f59e0b" : "#ffffff",
                color: needsRemeasure ? "#ffffff" : "#0f172a",
                fontWeight: 600,
                cursor: "pointer",
                minHeight: "36px",
              }}
            >
              {needsRemeasure ? `Đo lại & Ghi đè Lượt ${slot}` : "Ghi đè bằng thông số đang xem"}
            </button>
            <button
              type="button"
              data-clear-slot={slot}
              onClick={onClear}
              style={{
                fontSize: "12px",
                padding: "7px 12px",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                background: "#ffffff",
                color: "#334155",
                cursor: "pointer",
                minHeight: "36px",
              }}
            >
              Xóa lượt {slot}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          data-capture-slot={slot}
          onClick={onCapture}
          style={{
            fontSize: "13px",
            fontWeight: 600,
            padding: "9px 14px",
            border: "1px solid #2563eb",
            borderRadius: "6px",
            background: "#2563eb",
            color: "#ffffff",
            cursor: "pointer",
            minHeight: "40px",
          }}
        >
          Lưu Lượt {slot}
        </button>
      )}
    </div>
  );
}

export function RutherfordInquiryTask({
  current,
  hasObservedCurrentRun = false,
  lockedPhase1Prediction,
  onOpenPhase1,
  onSyncEnergyToAnchor,
  onCompleteChange,
}: RutherfordInquiryTaskProps) {
  const storedRaw = useSyncExternalStore(
    subscribeRutherfordV3Storage,
    getRutherfordV3RawSnapshot,
    EMPTY_RAW,
  );
  const persisted = useMemo(
    () => (storedRaw ? parseRutherfordV3State(storedRaw) : INITIAL_RUTHERFORD_V3_STATE),
    [storedRaw],
  );

  const { prediction, run1, run2, lastCapturedSlot, conclusion } = persisted;

  const evaluation = useMemo(
    () =>
      evaluateRutherfordInquiry({
        prediction,
        run1,
        run2,
        lastCapturedSlot,
        conclusion,
      }),
    [prediction, run1, run2, lastCapturedSlot, conclusion],
  );

  useEffect(() => {
    onCompleteChange?.(evaluation.isComplete);
  }, [evaluation.isComplete, onCompleteChange]);

  function captureSlot(slot: RunSlot) {
    if (!current) return;
    // Bản sao độc lập hoàn toàn để hai lượt lưu không bao giờ tham chiếu chéo
    const snapshot: InquiryRun = {
      b: Number(current.b),
      e: Number(current.e),
      theta: Number(current.theta),
    };
    writeRutherfordV3State((prev) => ({
      ...prev,
      run1: slot === 1 ? snapshot : prev.run1 ? { ...prev.run1 } : null,
      run2: slot === 2 ? snapshot : prev.run2 ? { ...prev.run2 } : null,
      lastCapturedSlot: slot,
    }));
  }

  function clearSlot(slot: RunSlot) {
    writeRutherfordV3State((prev) => {
      if (slot === 1) {
        return {
          ...prev,
          run1: null,
          lastCapturedSlot: prev.run2 ? 2 : null,
        };
      }
      return {
        ...prev,
        run2: null,
        lastCapturedSlot: prev.run1 ? 1 : null,
      };
    });
  }

  const anchorRunForEnergySync =
    evaluation.invalidReason === "different_energy" || evaluation.invalidReason === "both"
      ? evaluation.remeasureSlot === 1
        ? run2
        : run1
      : null;

  return (
    <div
      data-testid="rutherford-inquiry-task"
      style={{
        padding: "16px",
        background: "var(--bg-surface-elevated, #f8fafc)",
        borderRadius: "12px",
        marginTop: "8px",
        border: "1px solid #cbd5e1",
        minWidth: 0,
        maxWidth: "100%",
      }}
    >
      <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "6px", color: "#0f172a" }}>
        Phiếu khảo sát hai lượt Rutherford: Vai trò của tham số va chạm b
      </h3>
      <p style={{ fontSize: "13.5px", color: "#475569", marginBottom: "16px", lineHeight: 1.55 }}>
        Quy trình thực hành: <strong>Chọn thông số E, b → bấm “Chạy bắn hạt α” → quan sát đốm lóe trên màn S → lưu Lượt 1 → giữ nguyên E, đổi b → chạy và lưu Lượt 2 → đối chiếu dự đoán &amp; giải thích</strong>.
      </p>

      {/* Bước 1 — Dự đoán về tham số va chạm b */}
      <div style={{ ...cardStyle, marginBottom: "16px", minWidth: 0 }}>
        <div style={{ fontWeight: 700, marginBottom: "6px", color: "#0f172a" }}>
          1. Dự đoán sự phụ thuộc của góc lệch θ vào tham số va chạm b
        </div>
        <p style={{ fontSize: "14px", marginBottom: "12px", lineHeight: 1.65 }}>
          Giữ nguyên động năng <strong>E</strong> của hạt α. Khi hạt α đi <strong>xa tâm hạt nhân vàng hơn</strong> (tham số va chạm <strong>b tăng</strong>), góc lệch <strong>θ</strong> sẽ thay đổi thế nào?
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {(
            [
              { value: "increase", label: PREDICTION_LABELS.increase },
              { value: "decrease", label: PREDICTION_LABELS.decrease },
              { value: "unchanged", label: PREDICTION_LABELS.unchanged },
            ] as const
          ).map((opt) => (
            <label key={opt.value} style={optionStyle(prediction === opt.value)}>
              <input
                type="radio"
                name="rutherford-prediction"
                value={opt.value}
                checked={prediction === opt.value}
                onChange={() =>
                  writeRutherfordV3State((prev) => ({
                    ...prev,
                    prediction: opt.value,
                  }))
                }
              />
              {opt.label}
            </label>
          ))}
        </div>
        {evaluation.hasPrediction && evaluation.bothRuns && (
          <p style={{ fontSize: "12.5px", color: "#475569", marginTop: "10px", marginBottom: 0 }}>
            Dự đoán đang chọn: <strong>{PREDICTION_LABELS[prediction as RutherfordPrediction]}</strong> (giữ nguyên dự đoán ban đầu để đối chiếu với số liệu thực nghiệm).
          </p>
        )}
      </div>

      {/* Bước 2 — Lưu 2 lượt khảo sát độc lập (cùng E, khác b) */}
      <div style={{ ...cardStyle, marginBottom: "16px", minWidth: 0 }}>
        <div style={{ fontWeight: 700, marginBottom: "6px", color: "#0f172a" }}>
          2. Lưu hai lượt khảo sát độc lập (cùng động năng E, khác tham số va chạm b)
        </div>
        <p style={{ fontSize: "13px", color: "#475569", marginBottom: "12px", lineHeight: 1.6 }}>
          Chỉnh thanh trượt <strong>E (MeV)</strong> và <strong>b (fm)</strong> phía trên, bấm{" "}
          <strong>“Chạy bắn hạt α”</strong> để quan sát đốm lóe trên màn S rồi lưu vào <strong>Lượt 1</strong>.
          Sau đó <strong>giữ nguyên E</strong>, đổi <strong>b</strong> sang giá trị khác (ví dụ <code>b = 10 fm</code> và <code>b = 60 fm</code>), chạy và lưu vào <strong>Lượt 2</strong>.
        </p>

        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}>
          <RunCard
            slot={1}
            title="Lượt khảo sát 1"
            hint="Chọn E và b → Chạy quan sát → Lưu Lượt 1"
            run={run1}
            needsRemeasure={evaluation.remeasureSlot === 1}
            invalidReason={evaluation.invalidReason}
            onCapture={() => captureSlot(1)}
            onClear={() => clearSlot(1)}
          />
          <RunCard
            slot={2}
            title="Lượt khảo sát 2"
            hint="Giữ nguyên E của Lượt 1, đổi b khác đi → Chạy & Lưu Lượt 2"
            run={run2}
            needsRemeasure={evaluation.remeasureSlot === 2}
            invalidReason={evaluation.invalidReason}
            onCapture={() => captureSlot(2)}
            onClear={() => clearSlot(2)}
          />
        </div>

        {current ? (
          <div
            style={{
              marginTop: "12px",
              padding: "8px 12px",
              borderRadius: "6px",
              background: hasObservedCurrentRun ? "#f0fdf4" : "#f1f5f9",
              border: hasObservedCurrentRun ? "1px solid #86efac" : "1px solid #cbd5e1",
              fontSize: "12.5px",
              color: "#1e293b",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            <span>
              <strong>Thông số đang đặt trên bàn đo:</strong> E = <strong>{current.e.toFixed(1)} MeV</strong> ·{" "}
              b = <strong>{current.b} fm</strong> → Góc lệch θ = <strong>{current.theta.toFixed(2)}°</strong>
            </span>
            <span style={{ fontWeight: 600, color: hasObservedCurrentRun ? "#15803d" : "#475569" }}>
              {hasObservedCurrentRun
                ? "✓ Hạt α đã chạm màn S (đã hiện đốm lóe)"
                : "Gợi ý: Bấm “Chạy bắn hạt α” để xem đốm lóe trên màn S"}
            </span>
          </div>
        ) : (
          <p style={{ fontSize: "12px", color: "#b91c1c", marginTop: "12px", marginBottom: 0 }}>
            Tham số hiện tại không hợp lệ nên chưa lấy được số đo.
          </p>
        )}

        {evaluation.remeasureGuidance && (
          <div
            role="alert"
            data-rutherford-invalid-runs={evaluation.invalidReason ?? ""}
            style={{
              marginTop: "12px",
              padding: "12px 14px",
              background: "#fffbeb",
              border: "1.5px solid #f59e0b",
              borderLeft: "5px solid #d97706",
              borderRadius: "6px",
              color: "#92400e",
              fontSize: "13.5px",
              lineHeight: 1.6,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: "4px" }}>
              ⚠ Dữ liệu cần đo lại — Lượt khảo sát {evaluation.remeasureSlot} ({invalidSlotTag(evaluation.invalidReason)}):
            </div>
            <div>{evaluation.remeasureGuidance}</div>
            {anchorRunForEnergySync && onSyncEnergyToAnchor && (
              <button
                type="button"
                data-sync-energy-btn
                onClick={() => onSyncEnergyToAnchor(anchorRunForEnergySync.e)}
                style={{
                  marginTop: "8px",
                  padding: "6px 12px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "1px solid #d97706",
                  background: "#ffffff",
                  color: "#92400e",
                  cursor: "pointer",
                  minHeight: "34px",
                }}
              >
                Khớp nhanh động năng về E = {anchorRunForEnergySync.e.toFixed(1)} MeV để đo lại Lượt {evaluation.remeasureSlot}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Khối đối chiếu Dự đoán Pha 1 đã khóa + So sánh hai lượt đo Rutherford */}
      <div
        data-testid="rutherford-comparison-section"
        style={{
          marginBottom: "16px",
          padding: "16px",
          background: evaluation.validComparison ? "#fef9c3" : "#f8fafc",
          borderRadius: "8px",
          border: evaluation.validComparison ? "1.5px solid #eab308" : "1px solid #cbd5e1",
          minWidth: 0,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "10px", color: "#0f172a" }}>
          3. Đối chiếu hai lượt khảo sát Rutherford &amp; Dự đoán đã khóa ở Pha 1
        </div>

        {/* Đưa dự đoán Pha 1 đã khóa vào ngay chỗ so sánh hai lượt Rutherford */}
        {(lockedPhase1Prediction !== undefined || onOpenPhase1) && (
          <div
            data-testid="phase1-locked-prediction-in-comparison"
            style={{
              marginBottom: "12px",
              padding: "12px 14px",
              background: "#eff6ff",
              border: "1px solid #93c5fd",
              borderLeft: "4px solid #1d4ed8",
              borderRadius: "6px",
              fontSize: "13.5px",
              lineHeight: 1.55,
              color: "#1e293b",
            }}
          >
            {lockedPhase1Prediction ? (
              <div>
                <div style={{ fontWeight: 700, color: "#1e3a8a", marginBottom: "4px" }}>
                  🔒 Dự đoán ban đầu đã khóa từ Pha 1 (Trước giờ học):
                </div>
                <div>“{lockedPhase1Prediction.choiceLabel}”</div>
                {lockedPhase1Prediction.reason ? (
                  <div style={{ marginTop: "4px", color: "#334155" }}>
                    <strong>Lí do ban đầu của em:</strong> <em>{lockedPhase1Prediction.reason}</em>
                  </div>
                ) : null}
                {lockedPhase1Prediction.bringQuestion?.trim() ? (
                  <div style={{ marginTop: "4px", color: "#334155" }}>
                    <strong>Câu hỏi em mang vào lớp:</strong> “{lockedPhase1Prediction.bringQuestion.trim()}”
                  </div>
                ) : null}
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <span>
                  <strong>Dự đoán Pha 1:</strong> Em chưa khóa dự đoán ban đầu ở Pha 1 (Trước giờ học).
                </span>
                {onOpenPhase1 && (
                  <button
                    type="button"
                    onClick={onOpenPhase1}
                    style={{
                      padding: "6px 12px",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      borderRadius: "5px",
                      border: "1px solid #1d4ed8",
                      background: "#ffffff",
                      color: "#1d4ed8",
                      cursor: "pointer",
                      minHeight: "34px",
                    }}
                  >
                    Mở Pha 1 để khóa dự đoán ban đầu
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {evaluation.validComparison && run1 && run2 && evaluation.smallerBRun && evaluation.largerBRun ? (
          <div style={{ fontSize: "14px", lineHeight: 1.75 }}>
            <div style={{ overflowX: "auto", marginBottom: "10px" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "#ffffff",
                  fontSize: "13px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                <thead>
                  <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
                    <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Lượt lưu</th>
                    <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Động năng E (MeV)</th>
                    <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Tham số va chạm b (fm)</th>
                    <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Góc lệch θ (°)</th>
                    <th style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>Vùng trên màn S</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", fontWeight: 700 }}>Lượt 1</td>
                    <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>{run1.e.toFixed(1)} MeV</td>
                    <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>{run1.b} fm</td>
                    <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", fontWeight: 700, color: "#0369a1" }}>
                      {run1.theta.toFixed(2)}°
                    </td>
                    <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>{formatSgkZone(run1.theta)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", fontWeight: 700 }}>Lượt 2</td>
                    <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>{run2.e.toFixed(1)} MeV</td>
                    <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>{run2.b} fm</td>
                    <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1", fontWeight: 700, color: "#0369a1" }}>
                      {run2.theta.toFixed(2)}°
                    </td>
                    <td style={{ padding: "8px 10px", border: "1px solid #cbd5e1" }}>{formatSgkZone(run2.theta)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              Đối chiếu ở cùng động năng <strong>E = {evaluation.smallerBRun.e.toFixed(1)} MeV</strong>: khi tham số va chạm{" "}
              <strong>b tăng</strong> từ <strong>{evaluation.smallerBRun.b} fm</strong> lên{" "}
              <strong>{evaluation.largerBRun.b} fm</strong>, góc lệch <strong>θ</strong> đổi từ{" "}
              <strong>{evaluation.smallerBRun.theta.toFixed(2)}°</strong> xuống{" "}
              <strong>{evaluation.largerBRun.theta.toFixed(2)}°</strong> (độ chênh{" "}
              <strong>
                {Math.abs(evaluation.smallerBRun.theta - evaluation.largerBRun.theta).toFixed(2)}°
              </strong>
              ).
            </div>

            <div style={{ marginTop: "4px", fontWeight: 700 }}>
              {evaluation.verdict === "decrease" && (
                <span style={{ color: "#047857" }}>
                  → Kết luận thực nghiệm: Khi b tăng thì góc lệch θ giảm (ngược lại: khi hạt α bay rất sát tâm hạt nhân vàng — b rất nhỏ — lực đẩy Coulomb mạnh làm hạt lệch góc lớn, thậm chí &gt; 90° về vị trí (2)).
                </span>
              )}
              {evaluation.verdict === "increase" && (
                <span style={{ color: "#b91c1c" }}>→ Góc lệch tăng khi b tăng.</span>
              )}
              {evaluation.verdict === "unchanged" && (
                <span>→ Góc lệch gần như không đổi khi b thay đổi.</span>
              )}
            </div>

            {evaluation.hasPrediction ? (
              <p
                style={{
                  fontSize: "13px",
                  marginTop: "8px",
                  marginBottom: 0,
                  color: evaluation.matchesPrediction ? "#047857" : "#92400e",
                  fontWeight: 600,
                }}
              >
                {evaluation.matchesPrediction
                  ? `✓ Dự đoán ở Bước 1 của em ("${PREDICTION_LABELS[prediction as RutherfordPrediction]}") khớp với số liệu hai lượt khảo sát.`
                  : `Đối chiếu Bước 1: Kết quả đo khác với dự đoán "${PREDICTION_LABELS[prediction as RutherfordPrediction]}" — em giữ nguyên dự đoán ban đầu và giải thích nguyên nhân vật lí ở Bước 4.`}
              </p>
            ) : (
              <p style={{ fontSize: "13px", marginTop: "8px", marginBottom: 0, color: "#b45309", fontWeight: 600 }}>
                Em chưa chọn dự đoán ở Bước 1 — hãy chọn dự đoán ở Bước 1 trước khi hoàn tất phiếu.
              </p>
            )}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: "13.5px", color: "#475569" }}>
            {evaluation.bothRuns
              ? `Hai lượt hiện tại chưa đủ điều kiện đối chiếu — hãy đo lại Lượt ${evaluation.remeasureSlot} theo hướng dẫn màu vàng ở Bước 2.`
              : "Sau khi lưu đủ Lượt 1 và Lượt 2 (cùng động năng E, khác tham số va chạm b), bảng đối chiếu hai góc lệch θ sẽ hiển thị ngay tại đây."}
          </p>
        )}
      </div>

      {/* Bước 4 — Giải thích dựa trên kết quả quan sát */}
      {evaluation.validComparison && (
        <div style={{ ...cardStyle, marginBottom: "16px" }}>
          <div style={{ fontWeight: 700, marginBottom: "8px", color: "#0f172a" }}>
            4. Viết lời giải thích dựa trên kết quả quan sát
          </div>
          <p style={{ fontSize: "14px", marginBottom: "10px", lineHeight: 1.65 }}>
            Từ kết quả quan sát đốm lóe trên màn S (vị trí <strong>(1)</strong> so với vị trí <strong>(2)</strong>), hai lượt đo{" "}
            <strong>(E, b, θ)</strong> ở trên và dự đoán Pha 1 đã khóa, em hãy giải thích vì sao đa số hạt α đi thẳng nhưng vẫn có một tỉ lệ rất nhỏ (~10⁻⁴) bị lệch góc lớn (&gt; 90°):
          </p>
          <textarea
            value={conclusion}
            onChange={(e) => {
              const nextConclusion = e.target.value;
              writeRutherfordV3State((prev) => ({
                ...prev,
                conclusion: nextConclusion,
              }));
            }}
            placeholder="Ví dụ: Đa số hạt α có b lớn đi qua khoảng trống của nguyên tử nên tới vị trí (1) với góc lệch rất nhỏ; chỉ những hạt hiếm hoi đi rất sát hạt nhân vàng mang điện dương tập trung ở vùng cực nhỏ (b nhỏ) mới chịu lực đẩy Coulomb mạnh và bật về vị trí (2)..."
            aria-label="Lời giải thích của học sinh dựa trên kết quả quan sát"
            style={{
              width: "100%",
              minHeight: "104px",
              padding: "12px",
              fontSize: "14px",
              fontFamily: "inherit",
              lineHeight: 1.6,
              border: "1px solid #94a3b8",
              borderRadius: "6px",
              resize: "vertical",
            }}
          />
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "8px", marginBottom: 0 }}>
            Lời giải thích và hai lượt đo của em được tự động lưu vào trình duyệt và giữ nguyên sau khi tải lại trang.
          </p>
        </div>
      )}

      {/* Trạng thái hoàn thành nhiệm vụ */}
      <div
        role="status"
        data-rutherford-task-status={evaluation.isComplete ? "complete" : "incomplete"}
        style={{
          padding: "12px 16px",
          borderRadius: "8px",
          background: evaluation.isComplete ? "#ecfdf5" : "#ffffff",
          border: "1.5px solid",
          borderColor: evaluation.isComplete ? "#10b981" : "#cbd5e1",
          fontSize: "13px",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: evaluation.isComplete ? "#047857" : "#334155",
            marginBottom: "6px",
          }}
        >
          {evaluation.isComplete
            ? "✓ Đã hoàn thành khảo sát hai lượt tán xạ Rutherford"
            : "Tiến độ hoàn thành phiếu khảo sát Rutherford:"}
        </div>
        <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: 1.7, color: "#475569" }}>
          <li>{evaluation.hasPrediction ? "✓" : "○"} Chọn dự đoán ở Bước 1</li>
          <li>
            {evaluation.validComparison
              ? "✓ Đã lưu 2 lượt khảo sát độc lập hợp lệ (cùng E, khác b)"
              : evaluation.savedRunCount === 0
                ? "○ Lưu 2 lượt khảo sát cùng E nhưng khác b (hiện 0/2 lượt)"
                : evaluation.savedRunCount === 1
                  ? "○ Lưu thêm 1 lượt khảo sát nữa ở cùng E nhưng khác b (hiện 1/2 lượt)"
                  : `○ Đo lại Lượt khảo sát ${evaluation.remeasureSlot} để hai lượt có cùng E và khác b`}
          </li>
          <li>{evaluation.hasExplanation ? "✓" : "○"} Viết lời giải thích dựa trên kết quả quan sát ở Bước 4</li>
        </ul>
      </div>
    </div>
  );
}

export default RutherfordInquiryTask;
