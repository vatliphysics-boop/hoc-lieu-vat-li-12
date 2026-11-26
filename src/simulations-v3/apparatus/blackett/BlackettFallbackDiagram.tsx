"use client";

import type { BlackettRunMode } from "../../physics/blackett-engine";
import { getBlackettStageAtProgress } from "../../physics/blackett-engine";
import type { BlackettCameraMode, BlackettPartId } from "./parts";

export interface BlackettFallbackDiagramProps {
  readonly cameraMode: BlackettCameraMode;
  readonly selectedPartId: BlackettPartId | null;
  readonly onSelectPart: (partId: BlackettPartId) => void;
  readonly activeRun: BlackettRunMode;
  readonly progress: number;
  readonly identitiesUnlocked: boolean;
}

export function BlackettFallbackDiagram({
  cameraMode,
  selectedPartId,
  onSelectPart,
  activeRun,
  progress,
  identitiesUnlocked,
}: BlackettFallbackDiagramProps) {
  const stageInfo = getBlackettStageAtProgress(activeRun, progress);
  const clamped = Math.max(0, Math.min(1, progress));

  // Progress fractions for Y-fork sequential segments (1) -> (2) -> (3) -> (4)
  const u1 = Math.max(0, Math.min(1, (clamped - 0.02) / 0.34));
  const showVertex = clamped >= 0.38;
  const u3 = Math.max(0, Math.min(1, (clamped - 0.48) / 0.28));
  const u4 = Math.max(0, Math.min(1, (clamped - 0.76) / 0.22));
  const uStraight = Math.max(0, Math.min(1, clamped / 0.92));

  const strokeFor = (partId: BlackettPartId, normalColor: string) =>
    selectedPartId === partId ? "#22d3ee" : normalColor;

  if (cameraMode === "window") {
    // Top-down view looking directly through the circular glass observation window
    const cx = 340;
    const cy = 190;
    const rChamber = 156;
    const vx = 315;
    const vy = 194;
    const incX1 = 192;
    const incX2 = incX1 + (vx - incX1) * u1;
    const thinEndX = vx + (468 - vx) * u3;
    const thinEndY = vy + (96 - vy) * u3;
    const thickEndX = vx + (378 - vx) * u4;
    const thickEndY = vy + (248 - vy) * u4;

    return (
      <svg
        viewBox="0 0 680 380"
        role="img"
        aria-label="Sơ đồ dự phòng góc nhìn qua cửa sổ quan sát buồng sương Blackett"
        style={{ width: "100%", height: "auto", display: "block", background: "#060b16" }}
      >
        <defs>
          <clipPath id="blackett-window-clip">
            <circle cx={cx} cy={cy} r={rChamber - 6} />
          </clipPath>
        </defs>

        {/* Chamber outer flange */}
        <g
          data-fallback-part="chamber-body"
          onClick={() => onSelectPart("chamber-body")}
          style={{ cursor: "pointer" }}
        >
          <circle
            cx={cx}
            cy={cy}
            r={rChamber + 16}
            fill="#1e293b"
            stroke={strokeFor("chamber-body", "#475569")}
            strokeWidth={selectedPartId === "chamber-body" ? 3.5 : 2}
          />
          <circle cx={cx} cy={cy} r={rChamber} fill="#050811" />
        </g>

        {/* Side lamp beam & active observation zone */}
        <g
          data-fallback-part="observation-zone"
          onClick={() => onSelectPart("observation-zone")}
          style={{ cursor: "pointer" }}
        >
          <rect
            x={cx - 60}
            y={10}
            width={120}
            height={16}
            rx={4}
            fill="#334155"
            stroke={strokeFor("observation-zone", "#eab308")}
            strokeWidth={1.6}
          />
          <circle
            cx={cx}
            cy={cy}
            r={rChamber - 12}
            fill="rgba(14, 165, 233, 0.05)"
            stroke={strokeFor("observation-zone", "rgba(56, 189, 248, 0.35)")}
            strokeDasharray="5 4"
            strokeWidth={selectedPartId === "observation-zone" ? 3 : 1.5}
          />
        </g>

        {/* Left alpha entry port */}
        <g
          data-fallback-part="alpha-entry-port"
          onClick={() => onSelectPart("alpha-entry-port")}
          style={{ cursor: "pointer" }}
        >
          <rect
            x={106}
            y={cy - 18}
            width={76}
            height={36}
            rx={6}
            fill="#b45309"
            stroke={strokeFor("alpha-entry-port", "#f59e0b")}
            strokeWidth={selectedPartId === "alpha-entry-port" ? 3 : 1.8}
          />
          <text x={144} y={cy + 4} textAnchor="middle" fill="#fffbeb" fontSize="10.5" fontWeight="700">
            Nguồn α
          </text>
        </g>

        {/* Vapor tracks inside clipped velvet chamber */}
        <g
          clipPath="url(#blackett-window-clip)"
          data-fallback-part="vapor-tracks"
          onClick={() => onSelectPart("vapor-tracks")}
          style={{ cursor: "pointer" }}
        >
          {activeRun === "straight" ? (
            <>
              {[118, 152, 190, 228, 262].map((yLane, idx) => (
                <line
                  key={yLane}
                  x1={192}
                  y1={yLane}
                  x2={192 + 296 * uStraight}
                  y2={yLane}
                  stroke={idx === 2 ? "#7dd3fc" : "#64748b"}
                  strokeWidth={idx === 2 ? 4 : 2.2}
                  strokeDasharray="2 3"
                  strokeLinecap="round"
                />
              ))}
            </>
          ) : (
            <>
              {/* Background straight α tracks */}
              {[108, 144, 244, 276].map((yLane) => (
                <line
                  key={yLane}
                  x1={192}
                  y1={yLane}
                  x2={192 + 260 * Math.min(1, clamped / 0.35)}
                  y2={yLane}
                  stroke="#334155"
                  strokeWidth={1.8}
                />
              ))}

              {/* (1) Incident α track — strictly ends at vertex (vx, vy)! */}
              {u1 > 0 && (
                <line
                  x1={incX1}
                  y1={vy}
                  x2={incX2}
                  y2={vy}
                  stroke="#38bdf8"
                  strokeWidth={4.5}
                  strokeLinecap="round"
                />
              )}

              {/* (2) Vertex */}
              {showVertex && (
                <circle cx={vx} cy={vy} r={6.5} fill="#facc15" stroke="#fef9c3" strokeWidth={1.5} />
              )}

              {/* (3) Thin long branch */}
              {u3 > 0 && (
                <line
                  x1={vx}
                  y1={vy}
                  x2={thinEndX}
                  y2={thinEndY}
                  stroke="#fde047"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                />
              )}

              {/* (4) Thick short recoil branch */}
              {u4 > 0 && (
                <line
                  x1={vx}
                  y1={vy}
                  x2={thickEndX}
                  y2={thickEndY}
                  stroke="#fb7185"
                  strokeWidth={6.2}
                  strokeLinecap="round"
                />
              )}
            </>
          )}
        </g>

        {/* Brass window bezel on top + clickable rim label pill */}
        <circle
          cx={cx}
          cy={cy}
          r={rChamber}
          fill="none"
          pointerEvents="stroke"
          onClick={() => onSelectPart("observation-window")}
          stroke={strokeFor("observation-window", "#f59e0b")}
          strokeWidth={selectedPartId === "observation-window" ? 6 : 4.5}
          style={{ cursor: "pointer" }}
        />
        <g
          data-fallback-part="observation-window"
          onClick={() => onSelectPart("observation-window")}
          style={{ cursor: "pointer" }}
        >
          <rect
            x={cx + rChamber - 42}
            y={cy - 14}
            width={116}
            height={26}
            rx={13}
            fill="#0f172a"
            stroke={strokeFor("observation-window", "#f59e0b")}
            strokeWidth={1.8}
          />
          <text
            x={cx + rChamber + 16}
            y={cy + 3}
            textAnchor="middle"
            fill="#fcd34d"
            fontSize="10.5"
            fontWeight="700"
          >
            2 · Cửa sổ kính
          </text>
        </g>

        {/* Sequential track labels in Y-fork mode */}
        {activeRun === "y_fork" && stageInfo.visibleLabels.show1 && (
          <text x={200} y={vy - 12} fill="#7dd3fc" fontSize="12" fontWeight="700">
            (1) Vệt hạt α tới
          </text>
        )}
        {activeRun === "y_fork" && stageInfo.visibleLabels.show2 && (
          <text x={vx - 54} y={vy + 22} fill="#facc15" fontSize="11.5" fontWeight="700">
            (2) Đỉnh va chạm
          </text>
        )}
        {activeRun === "y_fork" && stageInfo.visibleLabels.show3 && (
          <text x={368} y={88} fill="#fde047" fontSize="12" fontWeight="700">
            {identitiesUnlocked ? "(3) Nhánh mảnh dài · Proton ¹₁H" : "(3) Nhánh mảnh, dài"}
          </text>
        )}
        {activeRun === "y_fork" && stageInfo.visibleLabels.show4 && (
          <text x={384} y={260} fill="#fda4af" fontSize="12" fontWeight="700">
            {identitiesUnlocked ? "(4) Nhánh đậm ngắn · ¹⁷₈O" : "(4) Nhánh đậm, ngắn"}
          </text>
        )}

        <text x={20} y={362} fill="#94a3b8" fontSize="11.5">
          Góc nhìn thẳng qua cửa sổ kính phía trên xuống nền nhung đen (đối chiếu Hình 22.2 SGK tr. 96)
        </text>
      </svg>
    );
  }

  // Overview / Port angled perspective SVG fallback
  const vx = 318;
  const vy = 198;
  const incX1 = 195;
  const incX2 = incX1 + (vx - incX1) * u1;
  const thinEndX = vx + (472 - vx) * u3;
  const thinEndY = vy + (142 - vy) * u3;
  const thickEndX = vx + (382 - vx) * u4;
  const thickEndY = vy + (234 - vy) * u4;

  return (
    <svg
      viewBox="0 0 680 360"
      role="img"
      aria-label="Sơ đồ dự phòng toàn cảnh buồng sương Blackett 3D"
      style={{ width: "100%", height: "auto", display: "block", background: "#060b16" }}
    >
      {/* Chamber cylinder body + velvet floor */}
      <g
        data-fallback-part="chamber-body"
        onClick={() => onSelectPart("chamber-body")}
        style={{ cursor: "pointer" }}
      >
        <ellipse cx={350} cy={258} rx={206} ry={66} fill="#1e293b" stroke={strokeFor("chamber-body", "#475569")} strokeWidth={2} />
        <rect x={144} y={142} width={412} height={116} fill="#1e293b" />
        <ellipse cx={350} cy={222} rx={192} ry={58} fill="#050811" stroke="#334155" strokeWidth={1.5} />
      </g>

      {/* Side illumination & active Nitrogen observation zone */}
      <g
        data-fallback-part="observation-zone"
        onClick={() => onSelectPart("observation-zone")}
        style={{ cursor: "pointer" }}
      >
        <ellipse
          cx={350}
          cy={198}
          rx={178}
          ry={52}
          fill="rgba(56, 189, 248, 0.06)"
          stroke={strokeFor("observation-zone", "rgba(56, 189, 248, 0.45)")}
          strokeDasharray="5 4"
          strokeWidth={selectedPartId === "observation-zone" ? 3 : 1.5}
        />
      </g>

      {/* Left alpha source & collimator port */}
      <g
        data-fallback-part="alpha-entry-port"
        onClick={() => onSelectPart("alpha-entry-port")}
        style={{ cursor: "pointer" }}
      >
        <rect
          x={62}
          y={180}
          width={98}
          height={34}
          rx={6}
          fill="#b45309"
          stroke={strokeFor("alpha-entry-port", "#f59e0b")}
          strokeWidth={selectedPartId === "alpha-entry-port" ? 3 : 1.8}
        />
        <text x={111} y={201} textAnchor="middle" fill="#fffbeb" fontSize="11" fontWeight="700">
          Cổng hạt α tới
        </text>
      </g>

      {/* Vapor tracks */}
      <g
        data-fallback-part="vapor-tracks"
        onClick={() => onSelectPart("vapor-tracks")}
        style={{ cursor: "pointer" }}
      >
        {activeRun === "straight" ? (
          <>
            {[172, 185, 198, 211, 224].map((yLane, idx) => (
              <line
                key={yLane}
                x1={195}
                y1={yLane}
                x2={195 + 290 * uStraight}
                y2={yLane}
                stroke={idx === 2 ? "#7dd3fc" : "#64748b"}
                strokeWidth={idx === 2 ? 3.8 : 2}
                strokeDasharray="2 3"
              />
            ))}
          </>
        ) : (
          <>
            {u1 > 0 && (
              <line x1={incX1} y1={vy} x2={incX2} y2={vy} stroke="#38bdf8" strokeWidth={4.2} strokeLinecap="round" />
            )}
            {showVertex && <circle cx={vx} cy={vy} r={6} fill="#facc15" />}
            {u3 > 0 && (
              <line x1={vx} y1={vy} x2={thinEndX} y2={thinEndY} stroke="#fde047" strokeWidth={2.2} strokeLinecap="round" />
            )}
            {u4 > 0 && (
              <line x1={vx} y1={vy} x2={thickEndX} y2={thickEndY} stroke="#fb7185" strokeWidth={5.8} strokeLinecap="round" />
            )}
          </>
        )}
      </g>

      {/* Top circular glass observation window */}
      <g
        data-fallback-part="observation-window"
        onClick={() => onSelectPart("observation-window")}
        style={{ cursor: "pointer" }}
      >
        <ellipse
          cx={350}
          cy={142}
          rx={204}
          ry={62}
          fill="rgba(186, 230, 253, 0.11)"
          stroke={strokeFor("observation-window", "#f59e0b")}
          strokeWidth={selectedPartId === "observation-window" ? 5 : 3.5}
        />
        <text x={350} y={70} textAnchor="middle" fill="#fcd34d" fontSize="12" fontWeight="700">
          Cửa sổ kính quan sát phía trên (bấm để chọn bộ phận)
        </text>
      </g>

      {activeRun === "y_fork" && stageInfo.visibleLabels.show1 && (
        <text x={200} y={190} fill="#7dd3fc" fontSize="11.5" fontWeight="700">
          (1) Vệt α tới
        </text>
      )}
      {activeRun === "y_fork" && stageInfo.visibleLabels.show2 && (
        <text x={vx - 30} y={vy + 20} fill="#facc15" fontSize="11.5" fontWeight="700">
          (2) Đỉnh
        </text>
      )}
      {activeRun === "y_fork" && stageInfo.visibleLabels.show3 && (
        <text x={410} y={136} fill="#fde047" fontSize="11.5" fontWeight="700">
          {identitiesUnlocked ? "(3) Proton ¹₁H" : "(3) Nhánh mảnh dài"}
        </text>
      )}
      {activeRun === "y_fork" && stageInfo.visibleLabels.show4 && (
        <text x={390} y={242} fill="#fda4af" fontSize="11.5" fontWeight="700">
          {identitiesUnlocked ? "(4) Hạt nhân ¹⁷₈O" : "(4) Nhánh đậm ngắn"}
        </text>
      )}

      <text x={20} y={342} fill="#94a3b8" fontSize="11.5">
        Chế độ sơ đồ dự phòng đồng bộ 100% lượt chạy và bộ phận với buồng sương Blackett 3D
      </text>
    </svg>
  );
}
