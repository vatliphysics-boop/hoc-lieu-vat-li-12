"use client";

/**
 * RutherfordFallbackDiagram — Sơ đồ quan sát dự phòng tương tác (khi trình duyệt thiếu hoặc tắt WebGL)
 *
 * Bảo đảm khi WebGL không khả dụng:
 * - Hiển thị thông báo rõ ràng ngay trong khung mô phỏng (không sập trang, không chặn điều hướng hay phiếu khảo sát)
 * - Giữ nguyên bố trí Hình 21.2 (R, D, S, M, G, P): nhấp trực tiếp từng bộ phận làm nổi đúng bộ phận & hiện tên, công dụng
 * - Đáp ứng các chế độ quan sát: Toàn cảnh, Cắt lớp, Qua kính hiển vi M, Mặt cắt (Hình 21.2b), Tách rời
 * - Chỉ rõ Vị trí (1) gần hướng tới (0°) và Vị trí (2) ở góc lớn (> 90°)
 * - Thể hiện đốm lóe trên màn huỳnh quang S (cả trên sơ đồ và qua thị kính hiển vi M)
 * - Khi bật quỹ đạo và góc lệch, gắn nhãn rõ “Mô hình giải thích”
 */

import type { CameraMode } from "../../core/CameraPresets";
import type { RutherfordSample } from "../../physics/rutherford-engine";
import type { ObserverPositionSummary } from "./parts";

export interface RutherfordFallbackDiagramProps {
  readonly cameraMode: CameraMode;
  readonly activeCorePartId: string | null;
  readonly observerAngleDeg: number;
  readonly observerSummary: ObserverPositionSummary;
  readonly show3DPins: boolean;
  readonly showScintillation: boolean;
  readonly showBeam: boolean;
  readonly hasReachedScreen: boolean;
  readonly isHitInsideMicroscopeWindow: boolean;
  readonly scatteringAngleDeg: number | null;
  readonly detectorAngleDeg: number | null;
  readonly impactFm: number;
  readonly visibleTrailSamples: readonly RutherfordSample[];
  readonly eyepieceFlashSpots: readonly (readonly [number, number, number])[];
  readonly flashBeat: number;
  readonly onSelectPart: (partId: string) => void;
  readonly onRetryWebGL: () => void;
}

export function RutherfordFallbackDiagram({
  cameraMode,
  activeCorePartId,
  observerAngleDeg,
  observerSummary,
  show3DPins,
  showScintillation,
  showBeam,
  hasReachedScreen,
  isHitInsideMicroscopeWindow,
  scatteringAngleDeg,
  detectorAngleDeg,
  impactFm,
  visibleTrailSamples,
  eyepieceFlashSpots,
  flashBeat,
  onSelectPart,
  onRetryWebGL,
}: RutherfordFallbackDiagramProps) {
  const isSelected = (partId: string) => activeCorePartId === partId;
  const hitDeg = detectorAngleDeg !== null ? Math.abs(detectorAngleDeg) : scatteringAngleDeg ?? 0;

  return (
    <div
      data-testid="rutherford-webgl-fallback"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "490px",
        padding: "54px 12px 48px",
        background: "radial-gradient(circle at 50% 44%, #0f1d35 0%, #070d19 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "10px",
        boxSizing: "border-box",
      }}
    >
      {/* Thông báo rõ trong khung mô phỏng khi thiếu WebGL */}
      <div
        role="status"
        data-testid="rutherford-webgl-fallback-notice"
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
          <strong>Sơ đồ quan sát dự phòng (Hình 21.2):</strong> Trình duyệt hiện không tạo được ngữ cảnh đồ họa WebGL 3D. Em vẫn chọn được từng bộ phận <strong>R–D–S–M</strong>, đổi góc nhìn (Toàn cảnh, Cắt lớp, Qua kính hiển vi), quan sát đốm lóe trên màn <strong>S</strong> và thực hiện trọn vẹn hai lượt khảo sát bên dưới.
        </span>
        <button
          type="button"
          data-retry-webgl-btn
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

      {/* KHUNG QUAN SÁT DỰ PHÒNG THEO CHẾ ĐỘ GÓC NHÌN */}
      {cameraMode === "instrument" ? (
        /* 1. Góc nhìn QUA KÍNH HIỂN VI M (thị trường tròn nhìn thẳng vào màn huỳnh quang S) */
        <div
          data-fallback-view="instrument"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
            gap: "14px",
            alignItems: "center",
            padding: "6px 4px",
            flex: 1,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <svg
              viewBox="-140 -140 280 280"
              role="img"
              aria-label={`Thị trường quan sát dự phòng qua kính hiển vi M tại góc ${observerAngleDeg} độ trên màn huỳnh quang S`}
              style={{ width: "100%", maxWidth: "290px", height: "auto", display: "inline-block" }}
            >
              {/* Vành thị kính đồng M (bấm để chọn M) */}
              <g
                role="button"
                tabIndex={0}
                data-fallback-part="rotating-microscope"
                data-fallback-selected={isSelected("rotating-microscope") ? "true" : "false"}
                aria-label="Chọn Kính hiển vi (M)"
                onClick={() => onSelectPart("rotating-microscope")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectPart("rotating-microscope");
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx="0"
                  cy="0"
                  r="128"
                  fill="#0b1320"
                  stroke={isSelected("rotating-microscope") ? "#22d3ee" : "#d4a017"}
                  strokeWidth={isSelected("rotating-microscope") ? "5" : "3.5"}
                />
              </g>

              {/* Màn huỳnh quang ZnS (S) nhìn qua thị kính (bấm để chọn S) */}
              <g
                role="button"
                tabIndex={0}
                data-fallback-part="scintillation-screen"
                data-fallback-selected={isSelected("scintillation-screen") ? "true" : "false"}
                aria-label="Chọn Màn huỳnh quang (S)"
                onClick={() => onSelectPart("scintillation-screen")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectPart("scintillation-screen");
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <circle
                  cx="0"
                  cy="0"
                  r="112"
                  fill="#041910"
                  stroke={isSelected("scintillation-screen") ? "#22d3ee" : "#22c55e"}
                  strokeWidth={isSelected("scintillation-screen") ? "4" : "2"}
                />
                {/* Lưới dây tóc chia độ thị kính */}
                <line x1="-108" y1="0" x2="108" y2="0" stroke="#14532d" strokeWidth="1" />
                <line x1="0" y1="-108" x2="0" y2="108" stroke="#14532d" strokeWidth="1" />
                <circle cx="0" cy="0" r="56" fill="none" stroke="#14532d" strokeWidth="0.9" strokeDasharray="4 4" />
              </g>

              {/* Đốm lóe trên màn huỳnh quang S */}
              {showScintillation && (
                <g data-testid="fallback-microscope-flashes" style={{ pointerEvents: "none" }}>
                  {observerSummary.zone === "position_1" &&
                    [0, 1, 2, 3, 4].map((k) => {
                      const idx = (flashBeat * 3 + k * 3) % eyepieceFlashSpots.length;
                      const [sx, sy, sr] = eyepieceFlashSpots[idx];
                      return (
                        <g key={k}>
                          <circle cx={sx * 2.1} cy={sy * 2.1} r={sr * 3.4} fill="#4ade80" fillOpacity="0.24" />
                          <circle cx={sx * 2.1} cy={sy * 2.1} r={sr * 1.45} fill="#bbf7d0" />
                        </g>
                      );
                    })}
                  {observerSummary.zone === "intermediate" && flashBeat % 2 === 0 && (
                    <g>
                      <circle cx="18" cy="-14" r="11" fill="#4ade80" fillOpacity="0.28" />
                      <circle cx="18" cy="-14" r="4.5" fill="#bbf7d0" />
                    </g>
                  )}
                  {observerSummary.zone === "position_2" && flashBeat % 4 === 0 && (
                    <g>
                      <circle cx="-16" cy="12" r="12" fill="#4ade80" fillOpacity="0.3" />
                      <circle cx="-16" cy="12" r="4.8" fill="#bbf7d0" />
                    </g>
                  )}

                  {/* Đốm lóe của hạt α đang khảo sát khi đập vào màn S */}
                  {hasReachedScreen && isHitInsideMicroscopeWindow && (
                    <g data-scintillation-flash-label="visible">
                      <circle cx="0" cy="0" r="28" fill="#22c55e" fillOpacity="0.3" />
                      <circle cx="0" cy="0" r="16" fill="#4ade80" fillOpacity="0.65" />
                      <circle cx="0" cy="0" r="7.5" fill="#ecfdf5" />
                      <text x="0" y="-36" textAnchor="middle" fill="#86efac" fontSize="11.5" fontWeight="700">
                        ✦ Đốm lóe trên màn S
                      </text>
                    </g>
                  )}
                </g>
              )}

              {/* Nhãn Mô hình giải thích nếu đang bật quỹ đạo & góc lệch */}
              {showBeam && scatteringAngleDeg !== null && (
                <g data-explanatory-label="angle" style={{ pointerEvents: "none" }}>
                  <rect x="-98" y="68" width="196" height="24" rx="5" fill="rgba(12, 74, 110, 0.92)" stroke="#38bdf8" strokeWidth="1" />
                  <text x="0" y="84" textAnchor="middle" fill="#e0f2fe" fontSize="10.5" fontWeight="700">
                    Mô hình giải thích: θ = {scatteringAngleDeg.toFixed(1)}°
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(4, 18, 14, 0.9)",
              border: "1.5px solid #4ade80",
              color: "#ecfdf5",
              fontSize: "13px",
              lineHeight: 1.55,
            }}
          >
            <div style={{ fontWeight: 700, color: "#86efac", fontSize: "14px", marginBottom: "4px" }}>
              🔬 Góc nhìn qua kính hiển vi M ({observerAngleDeg}°)
            </div>
            <div style={{ fontWeight: 700, color: "#fde047", marginBottom: "6px" }}>
              {observerSummary.positionTitle}
            </div>
            <div style={{ marginBottom: "6px", color: "#d1fae5" }}>
              • <strong>Màn huỳnh quang S:</strong> {observerSummary.relativeFrequencyLabel}
            </div>
            {hasReachedScreen && showScintillation && (
              <div
                data-scintillation-flash-label={isHitInsideMicroscopeWindow ? undefined : "visible"}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  background: "rgba(22, 101, 52, 0.45)",
                  border: "1px solid #4ade80",
                  color: "#bbf7d0",
                  fontSize: "12.5px",
                  marginBottom: "6px",
                }}
              >
                {isHitInsideMicroscopeWindow
                  ? "✦ Hạt α đang khảo sát vừa chạm đúng vùng màn S trong thị trường kính hiển vi M!"
                  : `✦ Hạt α đang khảo sát chạm màn S tại góc |θ_màn| ≈ ${Math.round(hitDeg)}° (bấm “Đưa kính M tới điểm hạt đang chạm” bên dưới để nhìn đốm lóe này ở chính tâm kính M).`}
              </div>
            )}
            {showBeam && scatteringAngleDeg !== null && (
              <div
                data-explanatory-label="trajectory"
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  background: "rgba(12, 74, 110, 0.55)",
                  border: "1px solid #38bdf8",
                  color: "#bae6fd",
                  fontSize: "12px",
                }}
              >
                <strong>Mô hình giải thích:</strong> Đường đi hyperbol (b = {impactFm} fm) tạo góc lệch{" "}
                <strong>θ = {scatteringAngleDeg.toFixed(1)}°</strong> (mắt người làm thí nghiệm chỉ thấy đốm lóe trên màn S, không thấy quỹ đạo).
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 2. Sơ đồ phối cảnh / cắt lớp / mặt cắt chuẩn Hình 21.2a & 21.2b (Toàn cảnh, Cắt lớp, Mặt cắt, Tách rời) */
        <div data-fallback-view={cameraMode} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {(() => {
            const cx = 325;
            const cy = 162;
            const rS = 116;
            const isTop = cameraMode === "top" || cameraMode === "measurement";
            const ryScale = isTop ? 1 : 0.68;
            const explodeLift = cameraMode === "exploded" ? -18 : 0;

            const toStagePt = (deg: number, radiusPx: number) => {
              const rad = (deg * Math.PI) / 180;
              return {
                x: Number((cx - radiusPx * Math.cos(rad)).toFixed(1)),
                y: Number((cy + radiusPx * Math.sin(rad) * ryScale).toFixed(1)),
              };
            };

            const pos1Pt = toStagePt(0, rS);
            const pos2Pt = toStagePt(140, rS);
            const micScreenPt = toStagePt(observerAngleDeg, rS);
            const micOuterPt = toStagePt(observerAngleDeg, rS + 44);
            const hitPt = toStagePt(hitDeg, rS);

            const trailSvgPoints = visibleTrailSamples
              .map((s) => {
                const px = cx - (s.xFm / 180) * rS;
                const py = cy + (s.yFm / 180) * rS * ryScale;
                return `${px.toFixed(1)},${py.toFixed(1)}`;
              })
              .join(" ");

            const clampedArcDeg = Math.max(4, Math.min(176, hitDeg));
            const arcR = 44;
            const arcEnd = toStagePt(clampedArcDeg, arcR);
            const arcStart = toStagePt(0, arcR);
            const largeArc = clampedArcDeg > 180 ? 1 : 0;

            return (
              <svg
                viewBox="0 0 680 330"
                role="img"
                aria-label="Sơ đồ thiết bị tán xạ hạt alpha Rutherford theo Hình 21.2 SGK: nguồn hạt alpha R, lá vàng D, màn huỳnh quang S, kính hiển vi M, hộp chân không G, chân đế P, vị trí (1) gần hướng tới và vị trí (2) ở góc lớn"
                style={{ width: "100%", maxWidth: "740px", height: "auto", display: "block" }}
              >
                {/* Chân đế P */}
                {!isTop && (
                  <g
                    role="button"
                    tabIndex={0}
                    data-fallback-part="base-platform"
                    data-fallback-selected={isSelected("base-platform") ? "true" : "false"}
                    aria-label="Chọn Chân đế (P)"
                    onClick={() => onSelectPart("base-platform")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectPart("base-platform");
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <rect x={cx - 94} y="250" width="280" height="72" fill="rgba(0,0,0,0.001)" />
                    <ellipse
                      cx={cx}
                      cy="304"
                      rx="92"
                      ry="16"
                      fill="#1e293b"
                      stroke={isSelected("base-platform") ? "#22d3ee" : "#94a3b8"}
                      strokeWidth={isSelected("base-platform") ? "3" : "1.5"}
                    />
                    <rect
                      x={cx - 18}
                      y="250"
                      width="36"
                      height="52"
                      rx="4"
                      fill="#785c1e"
                      stroke={isSelected("base-platform") ? "#22d3ee" : "#d4a017"}
                      strokeWidth="1.5"
                    />
                    <path d={`M ${cx + 18} 278 Q ${cx + 68} 288 ${cx + 108} 302`} fill="none" stroke="#d4a017" strokeWidth="4" />
                    <text x={cx + 116} y="305" fill="#cbd5e1" fontSize="11.5" fontWeight="700">
                      P · Chân đế
                    </text>
                  </g>
                )}

                {/* Vòng thành hộp chân không G */}
                <ellipse
                  cx={cx}
                  cy={cy + (cameraMode === "exploded" ? -28 : 0)}
                  rx={rS + 26}
                  ry={(rS + 26) * ryScale}
                  fill={cameraMode === "cutaway" ? "rgba(15, 23, 42, 0.45)" : "rgba(30, 58, 95, 0.28)"}
                  stroke={isSelected("vacuum-chamber") ? "#22d3ee" : "#64748b"}
                  strokeWidth={isSelected("vacuum-chamber") ? "3.2" : "2"}
                  strokeDasharray={cameraMode === "cutaway" ? "8 5" : undefined}
                  onClick={() => onSelectPart("vacuum-chamber")}
                  style={{ cursor: "pointer" }}
                />
                <g
                  role="button"
                  tabIndex={0}
                  data-fallback-part="vacuum-chamber"
                  data-fallback-selected={isSelected("vacuum-chamber") ? "true" : "false"}
                  aria-label="Chọn Hộp chân không (G)"
                  onClick={() => onSelectPart("vacuum-chamber")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectPart("vacuum-chamber");
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    x={cx - 98}
                    y={cy - (rS + 46) * ryScale + (cameraMode === "exploded" ? -24 : 0)}
                    width="196"
                    height="24"
                    rx="11"
                    fill="rgba(15, 23, 42, 0.88)"
                    stroke={isSelected("vacuum-chamber") ? "#22d3ee" : "#64748b"}
                    strokeWidth="1.2"
                  />
                  <text x={cx} y={cy - (rS + 30) * ryScale + (cameraMode === "exploded" ? -24 : 0)} textAnchor="middle" fill="#cbd5e1" fontSize="11" fontWeight="700">
                    G · Hộp chân không {cameraMode === "cutaway" ? "(Cắt lớp)" : ""}
                  </text>
                </g>

                {/* Vòng màn huỳnh quang ZnS (S) — bấm dọc theo vành S hoặc nhãn S đều chọn S */}
                <ellipse
                  cx={cx}
                  cy={cy + explodeLift * 0.5}
                  rx={rS}
                  ry={rS * ryScale}
                  fill="none"
                  stroke={isSelected("scintillation-screen") ? "#22d3ee" : "#4ade80"}
                  strokeWidth={isSelected("scintillation-screen") ? "9" : "6.5"}
                  strokeOpacity="0.9"
                  pointerEvents="stroke"
                  onClick={() => onSelectPart("scintillation-screen")}
                  style={{ cursor: "pointer" }}
                />

                {/* Lớp 1: Các đốm sáng huỳnh quang trên màn S + Đốm lóe của hạt α đang xét */}
                {showScintillation && (
                  <g style={{ pointerEvents: "none" }}>
                    {[-8, -4, 0, 4, 8, 28, 55, 140].map((deg, idx) => {
                      const pt = toStagePt(deg, rS);
                      return (
                        <circle
                          key={idx}
                          cx={pt.x}
                          cy={pt.y}
                          r={Math.abs(deg) <= 10 ? 3.4 : 2.8}
                          fill={deg > 90 ? "#fda4af" : "#86efac"}
                          fillOpacity="0.85"
                        />
                      );
                    })}
                    {hasReachedScreen && (
                      <g data-scintillation-flash-label="visible">
                        <circle cx={hitPt.x} cy={hitPt.y} r="15" fill="#22c55e" fillOpacity="0.32" />
                        <circle cx={hitPt.x} cy={hitPt.y} r="9" fill="#4ade80" fillOpacity="0.78" />
                        <circle cx={hitPt.x} cy={hitPt.y} r="4.8" fill="#ecfdf5" />
                        <rect
                          x={Math.min(510, Math.max(12, hitPt.x - 68))}
                          y={Math.min(300, Math.max(10, hitPt.y + 12))}
                          width="136"
                          height="21"
                          rx="5"
                          fill="rgba(5, 46, 22, 0.94)"
                          stroke="#4ade80"
                          strokeWidth="1.2"
                        />
                        <text
                          x={Math.min(510, Math.max(12, hitPt.x - 68)) + 68}
                          y={Math.min(300, Math.max(10, hitPt.y + 12)) + 14.5}
                          textAnchor="middle"
                          fill="#86efac"
                          fontSize="11"
                          fontWeight="700"
                        >
                          ✦ Đốm lóe trên màn S
                        </text>
                      </g>
                    )}
                  </g>
                )}

                {/* Lớp 2: Chế độ “Mô hình giải thích” (Đường đi hạt α & Góc lệch θ) */}
                {showBeam && (
                  <g style={{ pointerEvents: "none" }}>
                    <line
                      x1={cx + rS - 20}
                      y1={cy - (impactFm / 180) * rS * ryScale}
                      x2={pos1Pt.x + 8}
                      y2={cy - (impactFm / 180) * rS * ryScale}
                      stroke="#94a3b8"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                    />
                    {trailSvgPoints && (
                      <polyline
                        points={trailSvgPoints}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.6"
                      />
                    )}
                    <path
                      d={`M ${arcStart.x} ${arcStart.y} A ${arcR} ${arcR * ryScale} 0 ${largeArc} 0 ${arcEnd.x} ${arcEnd.y}`}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="2.2"
                    />
                    <g data-explanatory-label="trajectory">
                      <rect x={cx + 58} y={cy - 98} width="206" height="22" rx="5" fill="rgba(12, 74, 110, 0.94)" stroke="#38bdf8" strokeWidth="1.1" />
                      <text x={cx + 161} y={cy - 83} textAnchor="middle" fill="#e0f2fe" fontSize="10.8" fontWeight="700">
                        Mô hình giải thích: Đường đi hạt α
                      </text>
                    </g>
                    {scatteringAngleDeg !== null && (
                      <g data-explanatory-label="angle">
                        <rect x={cx - 268} y={cy - 98} width="182" height="22" rx="5" fill="rgba(120, 53, 15, 0.94)" stroke="#fbbf24" strokeWidth="1.1" />
                        <text x={cx - 177} y={cy - 83} textAnchor="middle" fill="#fef08a" fontSize="10.8" fontWeight="700">
                          Mô hình giải thích: θ = {scatteringAngleDeg.toFixed(1)}°
                        </text>
                      </g>
                    )}
                  </g>
                )}

                {/* Điểm chọn Màn huỳnh quang (S) trên sơ đồ */}
                <g
                  role="button"
                  tabIndex={0}
                  data-fallback-part="scintillation-screen"
                  data-fallback-selected={isSelected("scintillation-screen") ? "true" : "false"}
                  aria-label="Chọn Màn huỳnh quang (S)"
                  onClick={() => onSelectPart("scintillation-screen")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectPart("scintillation-screen");
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <rect x={cx - rS - 20} y={cy + 44 * ryScale} width="132" height="26" rx="11" fill="rgba(0,0,0,0.001)" />
                  <circle
                    cx={toStagePt(42, rS).x}
                    cy={toStagePt(42, rS).y + explodeLift * 0.5}
                    r="6"
                    fill={isSelected("scintillation-screen") ? "#22d3ee" : "#4ade80"}
                    stroke="#052e16"
                    strokeWidth="1.5"
                  />
                  {show3DPins && (
                    <g data-3d-pin="S">
                      <rect x={cx - rS - 18} y={cy + 46 * ryScale} width="128" height="22" rx="11" fill="rgba(15, 23, 42, 0.92)" stroke={isSelected("scintillation-screen") ? "#22d3ee" : "#4ade80"} strokeWidth="1.4" />
                      <text x={cx - rS + 46} y={cy + 46 * ryScale + 15} textAnchor="middle" fill="#bbf7d0" fontSize="11" fontWeight="700">
                        S · Màn huỳnh quang
                      </text>
                    </g>
                  )}
                </g>

                {/* Nguồn phát hạt α (R) ở bên phải bắn sang trái */}
                <g
                  role="button"
                  tabIndex={0}
                  data-fallback-part="alpha-source"
                  data-fallback-selected={isSelected("alpha-source") ? "true" : "false"}
                  aria-label="Chọn Nguồn phát hạt alpha (R)"
                  onClick={() => onSelectPart("alpha-source")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectPart("alpha-source");
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <rect x={cx + rS - 34} y={cy - 46} width="124" height="66" rx="8" fill="rgba(0,0,0,0.001)" />
                  <rect
                    x={cx + rS - 22}
                    y={cy - 15 + explodeLift * 0.4}
                    width="44"
                    height="30"
                    rx="4"
                    fill="#475569"
                    stroke={isSelected("alpha-source") ? "#22d3ee" : "#fbbf24"}
                    strokeWidth={isSelected("alpha-source") ? "3" : "1.8"}
                  />
                  <rect x={cx + rS - 32} y={cy - 6 + explodeLift * 0.4} width="12" height="12" rx="2" fill="#f59e0b" />
                  {show3DPins && (
                    <g data-3d-pin="R">
                      <rect x={cx + rS - 30} y={cy - 44} width="116" height="22" rx="11" fill="rgba(15, 23, 42, 0.92)" stroke={isSelected("alpha-source") ? "#22d3ee" : "#fbbf24"} strokeWidth="1.4" />
                      <text x={cx + rS + 28} y={cy - 29} textAnchor="middle" fill="#fef08a" fontSize="11" fontWeight="700">
                        R · Nguồn hạt α
                      </text>
                    </g>
                  )}
                </g>

                {/* Lá vàng rất mỏng (D) đặt tại tâm */}
                <g
                  role="button"
                  tabIndex={0}
                  data-fallback-part="gold-foil"
                  data-fallback-selected={isSelected("gold-foil") ? "true" : "false"}
                  aria-label="Chọn Lá vàng rất mỏng (D)"
                  onClick={() => onSelectPart("gold-foil")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectPart("gold-foil");
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <rect x={cx - 48} y={cy - 56 + explodeLift} width="96" height="84" rx="8" fill="rgba(0,0,0,0.001)" />
                  {isSelected("gold-foil") && (
                    <ellipse cx={cx} cy={cy + explodeLift} rx="22" ry="15" fill="none" stroke="#22d3ee" strokeWidth="2.6" />
                  )}
                  <rect
                    x={cx - 4}
                    y={cy - 24 + explodeLift}
                    width="8"
                    height="48"
                    rx="2"
                    fill="#fde047"
                    stroke={isSelected("gold-foil") ? "#22d3ee" : "#ca8a04"}
                    strokeWidth="1.8"
                  />
                  {show3DPins && (
                    <g data-3d-pin="D">
                      <rect x={cx - 46} y={cy - 54 + explodeLift} width="92" height="22" rx="11" fill="rgba(15, 23, 42, 0.92)" stroke={isSelected("gold-foil") ? "#22d3ee" : "#fde047"} strokeWidth="1.4" />
                      <text x={cx} y={cy - 39 + explodeLift} textAnchor="middle" fill="#fef9c3" fontSize="11" fontWeight="700">
                        D · Lá vàng
                      </text>
                    </g>
                  )}
                </g>

                {/* Kính hiển vi xoay (M) */}
                <g
                  role="button"
                  tabIndex={0}
                  data-fallback-part="rotating-microscope"
                  data-fallback-selected={isSelected("rotating-microscope") ? "true" : "false"}
                  aria-label="Chọn Kính hiển vi (M)"
                  onClick={() => onSelectPart("rotating-microscope")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectPart("rotating-microscope");
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    x={Math.min(micScreenPt.x, micOuterPt.x) - 18}
                    y={Math.min(micScreenPt.y, micOuterPt.y) - 32}
                    width={Math.abs(micScreenPt.x - micOuterPt.x) + 84}
                    height={Math.abs(micScreenPt.y - micOuterPt.y) + 46}
                    rx="8"
                    fill="rgba(0,0,0,0.001)"
                  />
                  <line
                    x1={micScreenPt.x}
                    y1={micScreenPt.y}
                    x2={micOuterPt.x}
                    y2={micOuterPt.y}
                    stroke={isSelected("rotating-microscope") ? "#22d3ee" : "#eab308"}
                    strokeWidth={isSelected("rotating-microscope") ? "13" : "10"}
                    strokeLinecap="round"
                  />
                  <circle
                    cx={micOuterPt.x}
                    cy={micOuterPt.y}
                    r="7"
                    fill="#0f62fe"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  {show3DPins && (
                    <g data-3d-pin="M">
                      <rect
                        x={Math.min(548, Math.max(8, micOuterPt.x - 56))}
                        y={Math.min(302, Math.max(8, micOuterPt.y - 30))}
                        width="116"
                        height="22"
                        rx="11"
                        fill="rgba(15, 23, 42, 0.92)"
                        stroke={isSelected("rotating-microscope") ? "#22d3ee" : "#38bdf8"}
                        strokeWidth="1.4"
                      />
                      <text
                        x={Math.min(548, Math.max(8, micOuterPt.x - 56)) + 58}
                        y={Math.min(302, Math.max(8, micOuterPt.y - 30)) + 15}
                        textAnchor="middle"
                        fill="#e0f2fe"
                        fontSize="11"
                        fontWeight="700"
                      >
                        M · Kính ({observerAngleDeg}°)
                      </text>
                    </g>
                  )}
                </g>

                {/* Nhãn Vị trí (1) gần hướng tới (0°) và Vị trí (2) ở góc lớn (> 90°) */}
                {show3DPins && (
                  <g style={{ pointerEvents: "none" }}>
                    <g data-3d-pos-marker="1">
                      <circle cx={pos1Pt.x} cy={pos1Pt.y} r="5.5" fill="#22c55e" stroke="#ffffff" strokeWidth="1.2" />
                      <rect x={Math.max(6, pos1Pt.x - 178)} y={pos1Pt.y - 12} width="166" height="22" rx="5" fill="rgba(20, 83, 45, 0.94)" stroke="#4ade80" strokeWidth="1" />
                      <text x={Math.max(6, pos1Pt.x - 178) + 83} y={pos1Pt.y + 3} textAnchor="middle" fill="#bbf7d0" fontSize="10.8" fontWeight="700">
                        Vị trí (1) · 0° (gần hướng tới)
                      </text>
                    </g>

                    <g data-3d-pos-marker="2">
                      <circle cx={pos2Pt.x} cy={pos2Pt.y} r="5.5" fill="#fb7185" stroke="#ffffff" strokeWidth="1.2" />
                      <rect x={Math.min(506, pos2Pt.x + 10)} y={pos2Pt.y - 10} width="164" height="22" rx="5" fill="rgba(136, 19, 55, 0.94)" stroke="#fb7185" strokeWidth="1" />
                      <text x={Math.min(506, pos2Pt.x + 10) + 82} y={pos2Pt.y + 5} textAnchor="middle" fill="#fecdd3" fontSize="10.8" fontWeight="700">
                        Vị trí (2) · &gt; 90° (góc lớn)
                      </text>
                    </g>
                  </g>
                )}

                {/* Góc xoay tham chiếu */}
                <g style={{ pointerEvents: "none" }}>
                  <text x={cx - rS + 14} y={cy - 6} fill="#86efac" fontSize="10" fontWeight="600">
                    0° (hướng tới)
                  </text>
                  <text x={cx + rS * Math.cos((40 * Math.PI) / 180) - 20} y={cy + rS * Math.sin((40 * Math.PI) / 180) * ryScale - 8} fill="#fda4af" fontSize="10" fontWeight="600">
                    140°
                  </text>
                </g>
              </svg>
            );
          })()}
        </div>
      )}
    </div>
  );
}
