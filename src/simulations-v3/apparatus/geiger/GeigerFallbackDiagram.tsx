"use client";

/**
 * GeigerFallbackDiagram — Sơ đồ quan sát dự phòng tương tác cho bộ đếm Geiger–Müller (Hình 23.2 SGK)
 * khi trình duyệt thiếu hoặc tắt WebGL.
 *
 * Dùng chung 100% trạng thái mô phỏng với cảnh 3D: màn hình số xung & bộ định thời 5,0 giây nhảy trực tiếp,
 * chạm chọn đủ 6 bộ phận (giá giữ mẫu, ống đếm GM, đầu nối BNC, dây tín hiệu, bộ đếm, bộ định thời),
 * và chuyển đổi giữa 3 góc nhìn: Toàn cảnh, Cận đầu dò, Đọc màn hình.
 */

import type { GeigerCameraMode, GeigerMeasurementStatus } from "./parts";

export interface GeigerFallbackDiagramProps {
  readonly cameraMode: GeigerCameraMode;
  readonly selectedPartId: string | null;
  readonly displayedPulses: number;
  readonly elapsedSec: number;
  readonly durationSec: number;
  readonly status: GeigerMeasurementStatus;
  readonly isPulseFlashing: boolean;
  readonly showPins: boolean;
  readonly onSelectPart: (partId: string) => void;
  readonly onRetryWebGL: () => void;
}

export function GeigerFallbackDiagram({
  cameraMode,
  selectedPartId,
  displayedPulses,
  elapsedSec,
  durationSec,
  status,
  isPulseFlashing,
  showPins,
  onSelectPart,
  onRetryWebGL,
}: GeigerFallbackDiagramProps) {
  const isSelected = (id: string) => selectedPartId === id;
  const formattedDigits = String(Math.max(0, Math.round(displayedPulses))).padStart(4, "0");
  const ratio = Math.min(1, Math.max(0, elapsedSec / Math.max(0.1, durationSec)));

  return (
    <div
      data-testid="geiger-webgl-fallback"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "460px",
        padding: "52px 12px 46px",
        background: "radial-gradient(circle at 50% 45%, #111e36 0%, #070d19 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "10px",
        boxSizing: "border-box",
      }}
    >
      {/* Thông báo dự phòng trong khung mô phỏng */}
      <div
        role="status"
        data-testid="geiger-webgl-fallback-notice"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          padding: "8px 12px",
          borderRadius: "8px",
          background: "rgba(30, 41, 59, 0.94)",
          border: "1px solid #f59e0b",
          color: "#fef3c7",
          fontSize: "12.5px",
          lineHeight: 1.45,
          zIndex: 2,
        }}
      >
        <span>
          <strong>Sơ đồ bộ đếm Geiger–Müller dự phòng (Hình 23.2):</strong> Trình duyệt hiện không khả dụng WebGL 3D. Em vẫn chạm chọn được từng bộ phận, lần theo đường tín hiệu và bấm <strong>Đặt lại → Đo 5 giây → Lưu lượt → Đo lại</strong> với màn hình nhảy số xung trực tiếp bên dưới.
        </span>
        <button
          type="button"
          data-retry-geiger-webgl-btn
          onClick={onRetryWebGL}
          style={{
            padding: "5px 10px",
            minHeight: "32px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "6px",
            border: "1px solid #fbbf24",
            background: "rgba(120, 53, 15, 0.7)",
            color: "#fef3c7",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          Thử bật lại 3D
        </button>
      </div>

      {cameraMode === "display" ? (
        /* GÓC ĐỌC MÀN HÌNH CẬN CẢNH */
        <div data-fallback-view="display" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg
            viewBox="0 0 640 300"
            role="img"
            aria-label={`Góc đọc màn hình bộ đếm Geiger–Müller: số xung hiện tại ${displayedPulses} xung, thời gian ${elapsedSec.toFixed(1)} trên ${durationSec.toFixed(1)} giây`}
            style={{ width: "100%", maxWidth: "680px", height: "auto", display: "block" }}
          >
            {/* Bộ định thời phía trên */}
            <g
              role="button"
              tabIndex={0}
              data-fallback-part="timer-unit"
              data-fallback-selected={isSelected("timer-unit") ? "true" : "false"}
              aria-label="Chọn Bộ định thời cửa sổ đo (5,0 giây)"
              onClick={() => onSelectPart("timer-unit")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPart("timer-unit");
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <rect
                x="150"
                y="12"
                width="340"
                height="82"
                rx="8"
                fill="#0f172a"
                stroke={isSelected("timer-unit") ? "#22d3ee" : "#f59e0b"}
                strokeWidth={isSelected("timer-unit") ? "3.5" : "2"}
              />
              <text x="168" y="34" fill="#fde68a" fontSize="12" fontWeight="700">
                6 · BỘ ĐỊNH THỜI CỬA SỔ ĐO
              </text>
              <text x="320" y="64" textAnchor="middle" fill="#38bdf8" fontSize="26" fontFamily="monospace" fontWeight="700">
                {elapsedSec.toFixed(1)} s / {durationSec.toFixed(1)} s
              </text>
              <rect x="168" y="74" width="304" height="10" rx="4" fill="#1e293b" />
              <rect x="168" y="74" width={304 * ratio} height="10" rx="4" fill={status === "completed" ? "#22c55e" : "#f59e0b"} />
            </g>

            {/* Thân bộ đếm & màn hình chính */}
            <g
              role="button"
              tabIndex={0}
              data-fallback-part="counter-display"
              data-fallback-selected={isSelected("counter-display") ? "true" : "false"}
              aria-label="Chọn Bộ đếm xung có màn hình"
              onClick={() => onSelectPart("counter-display")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPart("counter-display");
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <rect
                x="96"
                y="102"
                width="468"
                height="182"
                rx="10"
                fill="#7f1d1d"
                stroke={isSelected("counter-display") ? "#22d3ee" : "#fca5a5"}
                strokeWidth={isSelected("counter-display") ? "3.5" : "2"}
              />
              <rect x="114" y="118" width="292" height="148" rx="6" fill="#040b14" stroke="#38bdf8" strokeWidth="2" />
              <text x="130" y="142" fill="#94a3b8" fontSize="12" fontWeight="700">
                5 · MÀN HÌNH SỐ XUNG GHI NHẬN
              </text>
              <text
                data-testid="geiger-device-screen-value"
                x="246"
                y="214"
                textAnchor="middle"
                fill={isPulseFlashing ? "#86efac" : "#fb7185"}
                fontSize="64"
                fontFamily="monospace"
                fontWeight="700"
              >
                {formattedDigits}
              </text>
              <text x="388" y="220" textAnchor="end" fill="#fde047" fontSize="16" fontWeight="700">
                xung
              </text>
              <text x="130" y="252" fill={status === "measuring" ? "#4ade80" : "#bae6fd"} fontSize="12" fontWeight="700">
                {status === "measuring"
                  ? "● ĐANG ĐO CỬA SỔ 5,0 GIÂY..."
                  : status === "completed"
                    ? `✓ ĐÃ ĐO XONG (${displayedPulses} xung / ${durationSec} s)`
                    : "○ SẴN SÀNG (0000 xung)"}
              </text>

              {/* Loa báo xung (4) */}
              <rect x="424" y="122" width="120" height="106" rx="6" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
              {[142, 158, 174, 190, 206].map((ly) => (
                <line key={ly} x1="440" y1={ly} x2="528" y2={ly} stroke="#1e293b" strokeWidth="3" />
              ))}
              <circle cx="484" cy="252" r="10" fill={isPulseFlashing ? "#4ade80" : "#14532d"} stroke="#cbd5e1" strokeWidth="1.5" />
            </g>

            {/* Đầu nối BNC SIGNAL IN */}
            <g
              role="button"
              tabIndex={0}
              data-fallback-part="signal-connectors"
              data-fallback-selected={isSelected("signal-connectors") ? "true" : "false"}
              aria-label="Chọn Các đầu nối đồng trục BNC"
              onClick={() => onSelectPart("signal-connectors")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPart("signal-connectors");
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <rect x="24" y="208" width="76" height="44" rx="6" fill="#1e293b" stroke={isSelected("signal-connectors") ? "#22d3ee" : "#fbbf24"} strokeWidth="2" />
              <circle cx="96" cy="230" r="12" fill="#e2e8f0" stroke="#fbbf24" strokeWidth="2" />
              <text x="60" y="234" textAnchor="middle" fill="#fef08a" fontSize="10.5" fontWeight="700">
                BNC IN
              </text>
            </g>
          </svg>
        </div>
      ) : cameraMode === "probe" ? (
        /* GÓC CẬN ĐẦU DÒ & ĐẦU NỐI RA */
        <div data-fallback-view="probe" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg
            viewBox="0 0 660 290"
            role="img"
            aria-label="Góc cận đầu dò Geiger–Müller: giá giữ mẫu, cửa sổ mica, vỏ Cathode, dây trục Anode và đầu nối BNC ra"
            style={{ width: "100%", maxWidth: "700px", height: "auto", display: "block" }}
          >
            {/* Giá đỡ quang học */}
            <rect x="24" y="246" width="540" height="20" rx="4" fill="#334155" />

            {/* 1. Giá giữ mẫu */}
            <g
              role="button"
              tabIndex={0}
              data-fallback-part="sample-holder"
              data-fallback-selected={isSelected("sample-holder") ? "true" : "false"}
              aria-label="Chọn Giá giữ mẫu & Nguồn phóng xạ"
              onClick={() => onSelectPart("sample-holder")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPart("sample-holder");
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <rect x="44" y="68" width="110" height="178" rx="6" fill="rgba(0,0,0,0.001)" />
              <rect x="78" y="138" width="22" height="108" fill="#64748b" />
              <rect
                x="62"
                y="92"
                width="58"
                height="56"
                rx="6"
                fill="#b45309"
                stroke={isSelected("sample-holder") ? "#22d3ee" : "#fde047"}
                strokeWidth={isSelected("sample-holder") ? "3.5" : "2"}
              />
              <circle cx="116" cy="120" r="10" fill="#ef4444" stroke="#fef08a" strokeWidth="1.5" />
              <text x="92" y="82" textAnchor="middle" fill="#fef08a" fontSize="11.5" fontWeight="700">
                1 · Giá giữ mẫu ☢
              </text>
            </g>

            {/* Tia phóng xạ bay qua cửa sổ mica */}
            <line x1="128" y1="120" x2="196" y2="120" stroke="#facc15" strokeWidth="2.5" strokeDasharray="5 4" style={{ pointerEvents: "none" }} />

            {/* 2. Ống đếm Geiger–Müller mặt cắt cận */}
            <g
              role="button"
              tabIndex={0}
              data-fallback-part="gm-tube"
              data-fallback-selected={isSelected("gm-tube") ? "true" : "false"}
              aria-label="Chọn Ống đếm Geiger–Müller"
              onClick={() => onSelectPart("gm-tube")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPart("gm-tube");
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <rect
                x="196"
                y="68"
                width="274"
                height="104"
                rx="14"
                fill={isPulseFlashing ? "#0c4a6e" : "#1e293b"}
                stroke={isSelected("gm-tube") ? "#22d3ee" : "#38bdf8"}
                strokeWidth={isSelected("gm-tube") ? "3.5" : "2.4"}
              />
              {/* Cửa sổ mica */}
              <line x1="198" y1="76" x2="198" y2="164" stroke="#f59e0b" strokeWidth="6" />
              {/* Dây Anode (+) */}
              <line x1="212" y1="120" x2="466" y2="120" stroke="#ef4444" strokeWidth="3.2" />
              <circle cx="212" cy="120" r="4.5" fill="#ef4444" />
              <rect x="318" y="172" width="24" height="74" fill="#64748b" />
              <text x="333" y="56" textAnchor="middle" fill="#bae6fd" fontSize="12" fontWeight="700">
                2 · Ống đếm Geiger–Müller (Vỏ Cathode − / Dây trục Anode +)
              </text>
              <text x="228" y="188" fill="#fbbf24" fontSize="10.5" fontWeight="700">
                Cửa sổ mica mỏng
              </text>
              <text x="348" y="110" textAnchor="middle" fill="#fca5a5" fontSize="10.5" fontWeight="700">
                Dây Anode (+) · Khí trơ Ar
              </text>
            </g>

            {/* 3. Đầu nối BNC ở đuôi ống đếm */}
            <g
              role="button"
              tabIndex={0}
              data-fallback-part="signal-connectors"
              data-fallback-selected={isSelected("signal-connectors") ? "true" : "false"}
              aria-label="Chọn Các đầu nối đồng trục BNC"
              onClick={() => onSelectPart("signal-connectors")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPart("signal-connectors");
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <rect
                x="470"
                y="102"
                width="62"
                height="36"
                rx="5"
                fill="#e2e8f0"
                stroke={isSelected("signal-connectors") ? "#22d3ee" : "#fbbf24"}
                strokeWidth="2.5"
              />
              <text x="501" y="92" textAnchor="middle" fill="#fef08a" fontSize="11.5" fontWeight="700">
                3 · Đầu nối BNC (OUT)
              </text>
            </g>

            {/* 4. Dây cáp tín hiệu dẫn sang bộ đếm */}
            <g
              role="button"
              tabIndex={0}
              data-fallback-part="signal-cable"
              data-fallback-selected={isSelected("signal-cable") ? "true" : "false"}
              aria-label="Chọn Dây cáp tín hiệu đồng trục"
              onClick={() => onSelectPart("signal-cable")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPart("signal-cable");
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <rect x="530" y="106" width="118" height="90" fill="rgba(0,0,0,0.001)" />
              <path
                d="M 532 120 C 584 120, 592 178, 642 184"
                fill="none"
                stroke={isSelected("signal-cable") ? "#22d3ee" : "#94a3b8"}
                strokeWidth="9"
                strokeLinecap="round"
              />
              <text x="590" y="152" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="700">
                4 · Dây tín hiệu →
              </text>
            </g>

            {/* Mini live screen badge in corner */}
            <g style={{ pointerEvents: "none" }}>
              <rect x="462" y="216" width="180" height="54" rx="7" fill="#040b14" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="474" y="235" fill="#94a3b8" fontSize="10" fontWeight="700">
                MÀN HÌNH ĐANG ĐỌC:
              </text>
              <text data-testid="geiger-device-screen-value" x="552" y="260" textAnchor="middle" fill="#fb7185" fontSize="22" fontFamily="monospace" fontWeight="700">
                {formattedDigits} xung
              </text>
            </g>
          </svg>
        </div>
      ) : (
        /* GÓC TOÀN CẢNH BỘ THÍ NGHIỆM HÌNH 23.2 */
        <div data-fallback-view="overview" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg
            viewBox="0 0 700 310"
            role="img"
            aria-label="Sơ đồ toàn cảnh bộ đếm Geiger–Müller theo Hình 23.2 SGK: giá giữ mẫu, ống đếm, đầu nối BNC, dây tín hiệu, bộ đếm có màn hình và bộ định thời"
            style={{ width: "100%", maxWidth: "740px", height: "auto", display: "block" }}
          >
            {/* Mặt bàn & Thanh ray quang học */}
            <rect x="14" y="266" width="672" height="18" rx="4" fill="#1e293b" style={{ pointerEvents: "none" }} />
            <rect x="30" y="250" width="290" height="16" rx="3" fill="#475569" style={{ pointerEvents: "none" }} />

            {/* 1. Giá giữ mẫu & Nguồn phóng xạ */}
            <g
              role="button"
              tabIndex={0}
              data-fallback-part="sample-holder"
              data-fallback-selected={isSelected("sample-holder") ? "true" : "false"}
              aria-label="Chọn Giá giữ mẫu & Nguồn phóng xạ"
              onClick={() => onSelectPart("sample-holder")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPart("sample-holder");
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <rect x="34" y="96" width="88" height="156" rx="6" fill="rgba(0,0,0,0.001)" />
              <rect x="64" y="168" width="16" height="82" fill="#64748b" />
              <rect
                x="48"
                y="128"
                width="46"
                height="44"
                rx="5"
                fill="#b45309"
                stroke={isSelected("sample-holder") ? "#22d3ee" : "#fde047"}
                strokeWidth={isSelected("sample-holder") ? "3.2" : "1.8"}
              />
              <circle cx="94" cy="150" r="8" fill="#ef4444" stroke="#fef08a" strokeWidth="1.4" />
              {showPins && (
                <g>
                  <rect x="22" y="94" width="108" height="22" rx="11" fill="rgba(15,23,42,0.92)" stroke={isSelected("sample-holder") ? "#22d3ee" : "#fbbf24"} strokeWidth="1.3" />
                  <text x="76" y="109" textAnchor="middle" fill="#fef08a" fontSize="10.8" fontWeight="700">
                    1 · Giá giữ mẫu
                  </text>
                </g>
              )}
            </g>

            {/* Tia bay sang ống GM */}
            <line x1="104" y1="150" x2="142" y2="150" stroke="#facc15" strokeWidth="2.2" strokeDasharray="4 3" style={{ pointerEvents: "none" }} />

            {/* 2. Ống đếm Geiger–Müller */}
            <g
              role="button"
              tabIndex={0}
              data-fallback-part="gm-tube"
              data-fallback-selected={isSelected("gm-tube") ? "true" : "false"}
              aria-label="Chọn Ống đếm Geiger–Müller"
              onClick={() => onSelectPart("gm-tube")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPart("gm-tube");
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <rect x="138" y="92" width="136" height="158" rx="6" fill="rgba(0,0,0,0.001)" />
              <rect x="196" y="176" width="18" height="74" fill="#64748b" />
              <rect
                x="144"
                y="124"
                width="124"
                height="52"
                rx="9"
                fill={isPulseFlashing ? "#0c4a6e" : "#1e293b"}
                stroke={isSelected("gm-tube") ? "#22d3ee" : "#38bdf8"}
                strokeWidth={isSelected("gm-tube") ? "3.2" : "2.2"}
              />
              <line x1="146" y1="129" x2="146" y2="171" stroke="#f59e0b" strokeWidth="4.5" />
              <line x1="156" y1="150" x2="262" y2="150" stroke="#ef4444" strokeWidth="2.2" />
              {showPins && (
                <g>
                  <rect x="148" y="92" width="116" height="22" rx="11" fill="rgba(15,23,42,0.92)" stroke={isSelected("gm-tube") ? "#22d3ee" : "#38bdf8"} strokeWidth="1.3" />
                  <text x="206" y="107" textAnchor="middle" fill="#bae6fd" fontSize="10.8" fontWeight="700">
                    2 · Ống đếm GM
                  </text>
                </g>
              )}
            </g>

            {/* 4. Dây cáp tín hiệu đồng trục */}
            <g
              role="button"
              tabIndex={0}
              data-fallback-part="signal-cable"
              data-fallback-selected={isSelected("signal-cable") ? "true" : "false"}
              aria-label="Chọn Dây cáp tín hiệu đồng trục"
              onClick={() => onSelectPart("signal-cable")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPart("signal-cable");
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <rect x="292" y="148" width="102" height="106" rx="8" fill="rgba(0,0,0,0.001)" />
              <path
                d="M 294 150 C 330 150, 332 226, 392 226"
                fill="none"
                stroke={isSelected("signal-cable") ? "#22d3ee" : "#94a3b8"}
                strokeWidth="8"
                strokeLinecap="round"
              />
              {isPulseFlashing && (
                <circle cx="344" cy="196" r="7" fill="#4ade80" />
              )}
              {showPins && (
                <g>
                  <rect x="290" y="232" width="108" height="22" rx="11" fill="rgba(15,23,42,0.92)" stroke={isSelected("signal-cable") ? "#22d3ee" : "#94a3b8"} strokeWidth="1.3" />
                  <text x="344" y="247" textAnchor="middle" fill="#e2e8f0" fontSize="10.5" fontWeight="700">
                    4 · Dây tín hiệu
                  </text>
                </g>
              )}
            </g>

            {/* 3. Các đầu nối đồng trục BNC (OUT & IN) */}
            <g
              role="button"
              tabIndex={0}
              data-fallback-part="signal-connectors"
              data-fallback-selected={isSelected("signal-connectors") ? "true" : "false"}
              aria-label="Chọn Các đầu nối đồng trục BNC"
              onClick={() => onSelectPart("signal-connectors")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPart("signal-connectors");
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <rect x="266" y="114" width="114" height="52" rx="6" fill="rgba(0,0,0,0.001)" />
              <rect
                x="268"
                y="139"
                width="28"
                height="22"
                rx="4"
                fill="#e2e8f0"
                stroke={isSelected("signal-connectors") ? "#22d3ee" : "#fbbf24"}
                strokeWidth="2"
              />
              <rect
                x="388"
                y="214"
                width="28"
                height="22"
                rx="4"
                fill="#e2e8f0"
                stroke={isSelected("signal-connectors") ? "#22d3ee" : "#fbbf24"}
                strokeWidth="2"
              />
              {showPins && (
                <g>
                  <rect x="272" y="114" width="108" height="22" rx="11" fill="rgba(15,23,42,0.92)" stroke={isSelected("signal-connectors") ? "#22d3ee" : "#fbbf24"} strokeWidth="1.3" />
                  <text x="326" y="129" textAnchor="middle" fill="#fef08a" fontSize="10.5" fontWeight="700">
                    3 · Đầu nối BNC
                  </text>
                </g>
              )}
            </g>

            {/* 6. Bộ định thời cửa sổ đo (5,0 s) */}
            <g
              role="button"
              tabIndex={0}
              data-fallback-part="timer-unit"
              data-fallback-selected={isSelected("timer-unit") ? "true" : "false"}
              aria-label="Chọn Bộ định thời cửa sổ đo (5,0 giây)"
              onClick={() => onSelectPart("timer-unit")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPart("timer-unit");
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <rect
                x="438"
                y="46"
                width="212"
                height="62"
                rx="7"
                fill="#0f172a"
                stroke={isSelected("timer-unit") ? "#22d3ee" : "#f59e0b"}
                strokeWidth={isSelected("timer-unit") ? "3.2" : "2"}
              />
              <rect x="478" y="108" width="12" height="10" fill="#d97706" />
              <rect x="598" y="108" width="12" height="10" fill="#d97706" />
              <text x="450" y="64" fill="#fde68a" fontSize="10.2" fontWeight="700">
                6 · BỘ ĐỊNH THỜI ({durationSec.toFixed(1)} s)
              </text>
              <text x="544" y="88" textAnchor="middle" fill="#38bdf8" fontSize="19" fontFamily="monospace" fontWeight="700">
                {elapsedSec.toFixed(1)}s / {durationSec.toFixed(1)}s
              </text>
              <rect x="450" y="96" width="188" height="6" rx="3" fill="#1e293b" />
              <rect x="450" y="96" width={188 * ratio} height="6" rx="3" fill={status === "completed" ? "#22c55e" : "#f59e0b"} />
            </g>

            {/* 5. Bộ đếm xung có màn hình & loa */}
            <g
              role="button"
              tabIndex={0}
              data-fallback-part="counter-display"
              data-fallback-selected={isSelected("counter-display") ? "true" : "false"}
              aria-label="Chọn Bộ đếm xung có màn hình"
              onClick={() => onSelectPart("counter-display")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectPart("counter-display");
                }
              }}
              style={{ cursor: "pointer" }}
            >
              <rect
                x="414"
                y="118"
                width="258"
                height="148"
                rx="9"
                fill="#7f1d1d"
                stroke={isSelected("counter-display") ? "#22d3ee" : "#fca5a5"}
                strokeWidth={isSelected("counter-display") ? "3.2" : "2"}
              />
              <rect x="428" y="134" width="158" height="92" rx="5" fill="#040b14" stroke="#38bdf8" strokeWidth="1.6" />
              <text x="438" y="151" fill="#94a3b8" fontSize="9.8" fontWeight="700">
                5 · SỐ XUNG GHI NHẬN
              </text>
              <text
                data-testid="geiger-device-screen-value"
                x="504"
                y="196"
                textAnchor="middle"
                fill={isPulseFlashing ? "#86efac" : "#fb7185"}
                fontSize="36"
                fontFamily="monospace"
                fontWeight="700"
              >
                {formattedDigits}
              </text>
              <text x="578" y="216" textAnchor="end" fill="#fde047" fontSize="11" fontWeight="700">
                xung
              </text>

              {/* Loa (4) */}
              <rect x="596" y="134" width="62" height="72" rx="4" fill="#e2e8f0" stroke="#475569" strokeWidth="1.2" />
              {[148, 160, 172, 184, 196].map((ly) => (
                <line key={ly} x1="606" y1={ly} x2="648" y2={ly} stroke="#1e293b" strokeWidth="2.2" />
              ))}
              <circle cx="627" cy="224" r="8" fill={isPulseFlashing ? "#4ade80" : "#14532d"} stroke="#cbd5e1" strokeWidth="1.4" />
              <text x="430" y="250" fill="#fecaca" fontSize="10.5" fontWeight="700">
                SIGNAL IN (BNC) → Khuếch đại &amp; Đếm xung
              </text>
            </g>
          </svg>
        </div>
      )}
    </div>
  );
}
