"use client";

/**
 * RutherfordInquiryTask — nhiệm vụ điều tra cho học sinh lớp 12
 *
 * Quy trình 4 bước: dự đoán → lưu hai lượt đo → so sánh → giải thích.
 * Component này KHÔNG tự tính vật lí: nó nhận (b, E, θ) từ simulator để
 * số liệu hiển thị luôn trùng với quỹ đạo và bảng số liệu đang xem.
 */

import { useState } from "react";

export interface InquiryRun {
  readonly b: number;
  readonly e: number;
  readonly theta: number;
}

export interface RutherfordInquiryTaskProps {
  /** Trạng thái hiện tại của simulator (đọc từ cùng nguồn với cảnh 3D). */
  readonly current: InquiryRun | null;
}

const cardStyle: React.CSSProperties = {
  padding: "16px",
  background: "#ffffff",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const optionStyle = (active: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px",
  background: active ? "#dbeafe" : "#f9fafb",
  border: "1px solid",
  borderColor: active ? "#2563eb" : "#d1d5db",
  borderRadius: "6px",
  cursor: "pointer",
  minHeight: "44px",
  fontSize: "14px",
});

function RunCard({
  title,
  hint,
  run,
  onCapture,
  onClear,
}: {
  title: string;
  hint: string;
  run: InquiryRun | null;
  onCapture: () => void;
  onClear: () => void;
}) {
  return (
    <div
      style={{
        padding: "12px",
        background: run ? "#ecfdf5" : "#f9fafb",
        borderRadius: "6px",
        border: "1px solid",
        borderColor: run ? "#10b981" : "#d1d5db",
      }}
    >
      <div style={{ fontSize: "13px", fontWeight: 600, marginBottom: "2px" }}>{title}</div>
      <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "8px" }}>{hint}</div>
      {run ? (
        <div style={{ fontSize: "12px", lineHeight: 1.8 }}>
          b = {run.b} fm
          <br />
          E = {run.e} MeV
          <br />
          <strong>θ = {run.theta.toFixed(2)}°</strong>
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={onCapture}
              style={{ fontSize: "11px", padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: "4px", background: "#fff", cursor: "pointer", minHeight: "32px" }}
            >
              Ghi đè
            </button>
            <button
              type="button"
              onClick={onClear}
              style={{ fontSize: "11px", padding: "6px 10px", border: "1px solid #d1d5db", borderRadius: "4px", background: "#fff", cursor: "pointer", minHeight: "32px" }}
            >
              Xóa
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={onCapture}
          style={{ fontSize: "12px", padding: "8px 12px", border: "1px solid #2563eb", borderRadius: "4px", background: "#2563eb", color: "#fff", cursor: "pointer", minHeight: "36px" }}
        >
          Lưu lượt này
        </button>
      )}
    </div>
  );
}

export function RutherfordInquiryTask({ current }: RutherfordInquiryTaskProps) {
  const [prediction, setPrediction] = useState<string>("");
  const [run1, setRun1] = useState<InquiryRun | null>(null);
  const [run2, setRun2] = useState<InquiryRun | null>(null);
  const [conclusion, setConclusion] = useState("");

  const bothRuns = run1 !== null && run2 !== null;
  const sameEnergy = bothRuns && Math.abs(run1.e - run2.e) < 1e-9;

  const verdict = (() => {
    if (!bothRuns) return null;
    if (Math.abs(run2.theta - run1.theta) < 0.01) return "unchanged" as const;
    return run2.theta < run1.theta ? "decrease" as const : "increase" as const;
  })();

  const matchesPrediction = verdict !== null && prediction !== "" && verdict === prediction;

  return (
    <div
      style={{
        padding: "20px",
        background: "var(--bg-surface-elevated, #f8fafc)",
        borderRadius: "12px",
        marginTop: "20px",
        border: "1px solid #e5e7eb",
      }}
    >
      <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "6px" }}>
        Nhiệm vụ điều tra: tham số va chạm b
      </h3>
      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "16px" }}>
        Thực hiện đủ 4 bước dưới đây. Số liệu lấy trực tiếp từ mô phỏng đang xem.
      </p>

      {/* Bước 1 — Dự đoán */}
      <div style={{ ...cardStyle, marginBottom: "16px" }}>
        <div style={{ fontWeight: 500, marginBottom: "8px" }}>1. Dự đoán</div>
        <p style={{ fontSize: "14px", marginBottom: "12px", lineHeight: 1.7 }}>
          Giữ nguyên năng lượng hạt alpha. Khi hạt tới đi <strong>xa tâm hạt nhân hơn</strong> (b tăng),
          góc lệch sẽ thay đổi thế nào?
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {[
            { value: "increase", label: "Góc lệch tăng" },
            { value: "decrease", label: "Góc lệch giảm" },
            { value: "unchanged", label: "Không đổi" },
          ].map((opt) => (
            <label key={opt.value} style={optionStyle(prediction === opt.value)}>
              <input
                type="radio"
                name="rutherford-prediction"
                value={opt.value}
                checked={prediction === opt.value}
                onChange={() => setPrediction(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Bước 2 — Hai lượt đo */}
      <div style={{ ...cardStyle, marginBottom: "16px" }}>
        <div style={{ fontWeight: 500, marginBottom: "8px" }}>2. Lấy hai lượt đo cùng E, khác b</div>
        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "12px", lineHeight: 1.6 }}>
          Kéo slider <strong>b</strong> và <strong>E</strong> bên trên, đọc góc tán xạ, rồi lưu vào từng lượt.
          Nên chọn b nhỏ (khoảng 10 fm) và b lớn (khoảng 60 fm) với cùng một giá trị E.
        </p>
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <RunCard
            title="Lượt 1 — b nhỏ"
            hint="Hạt đi sát hạt nhân"
            run={run1}
            onCapture={() => current && setRun1(current)}
            onClear={() => setRun1(null)}
          />
          <RunCard
            title="Lượt 2 — b lớn"
            hint="Hạt đi xa hạt nhân"
            run={run2}
            onCapture={() => current && setRun2(current)}
            onClear={() => setRun2(null)}
          />
        </div>
        {current ? (
          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px" }}>
            Đang xem: b = {current.b} fm, E = {current.e} MeV → θ = {current.theta.toFixed(2)}°
          </p>
        ) : (
          <p style={{ fontSize: "12px", color: "#b91c1c", marginTop: "12px" }}>
            Tham số hiện tại không hợp lệ nên chưa lấy được số đo.
          </p>
        )}
        {bothRuns && !sameEnergy && (
          <p style={{ fontSize: "12px", color: "#b45309", marginTop: "8px" }}>
            Hai lượt đang có năng lượng khác nhau ({run1.e} MeV và {run2.e} MeV). Để so sánh đúng ý
            “giữ nguyên năng lượng”, hãy lấy lại một lượt cùng E.
          </p>
        )}
      </div>

      {/* Bước 3 — So sánh */}
      {bothRuns && (
        <div
          style={{
            marginBottom: "16px",
            padding: "16px",
            background: "#fef3c7",
            borderRadius: "8px",
            border: "1px solid #fbbf24",
          }}
        >
          <div style={{ fontWeight: 500, marginBottom: "8px" }}>3. So sánh</div>
          <div style={{ fontSize: "14px", lineHeight: 1.9 }}>
            b: <strong>{run1.b} fm</strong> → <strong>{run2.b} fm</strong>
            <br />
            θ: <strong>{run1.theta.toFixed(2)}°</strong> → <strong>{run2.theta.toFixed(2)}°</strong>
            <br />
            {verdict === "decrease" && <span style={{ color: "#047857" }}>→ Góc lệch giảm khi b tăng.</span>}
            {verdict === "increase" && <span style={{ color: "#b91c1c" }}>→ Góc lệch tăng khi b tăng.</span>}
            {verdict === "unchanged" && <span>→ Góc lệch gần như không đổi.</span>}
          </div>
          {prediction !== "" && (
            <p style={{ fontSize: "13px", marginTop: "10px", color: matchesPrediction ? "#047857" : "#b45309" }}>
              {matchesPrediction
                ? "Dự đoán của em khớp với số liệu hai lượt đo."
                : "Dự đoán của em chưa khớp với số liệu — hãy giải thích vì sao bên dưới."}
            </p>
          )}
        </div>
      )}

      {/* Bước 4 — Giải thích */}
      {bothRuns && (
        <div style={cardStyle}>
          <div style={{ fontWeight: 500, marginBottom: "8px" }}>4. Giải thích</div>
          <p style={{ fontSize: "14px", marginBottom: "10px", lineHeight: 1.7 }}>
            Hai góc đo được có phù hợp với dự đoán của em không? Dùng số liệu của hai lượt và
            lực đẩy điện giữa hạt alpha với hạt nhân vàng để giải thích.
          </p>
          <textarea
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            placeholder="Khi b tăng, hạt alpha đi xa hạt nhân hơn nên lực đẩy Coulomb yếu hơn, do đó góc lệch giảm..."
            aria-label="Kết luận của học sinh"
            style={{
              width: "100%",
              minHeight: "100px",
              padding: "12px",
              fontSize: "14px",
              fontFamily: "inherit",
              lineHeight: 1.6,
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              resize: "vertical",
            }}
          />
          <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
            Gợi ý kiểm tra lại: lực Coulomb ~ 1/r²; khi b lớn hơn thì khoảng cách gần nhất lớn hơn.
          </p>
        </div>
      )}
    </div>
  );
}

export default RutherfordInquiryTask;
