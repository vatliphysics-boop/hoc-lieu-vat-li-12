"use client";

/**
 * Module xử lý dữ liệu thí nghiệm — bảng số liệu + đồ thị + kiểm tra quy luật.
 *
 * Dữ liệu là số hạt còn lại theo mô hình hàm mũ của một mẫu đơn nuclide
 * (`decaySeries`), KHÔNG phải số đo thực nghiệm. Nhãn dữ liệu ghi rõ điều này
 * để học sinh không nhầm với số liệu thí nghiệm thật.
 */

import { useMemo, useState } from "react";
import {
  createDecaySample,
  decaySeries,
  DECAY_COMPARISON,
} from "@/lib/radioactive-decay-model";

const CHART = { width: 640, height: 260, padX: 52, padY: 22 };

export function DataProcessingLab() {
  const [initial, setInitial] = useState(64);
  const [halfLife, setHalfLife] = useState(20);
  const [seed, setSeed] = useState(23);

  const sample = useMemo(
    () => createDecaySample({ initialCount: initial, halfLifeSeconds: halfLife, seed }),
    [initial, halfLife, seed],
  );
  const until = halfLife * 4;
  const series = useMemo(() => decaySeries(sample, until, Math.max(1, halfLife / 10)), [sample, until, halfLife]);

  const maxY = initial;
  const x = (t: number) => CHART.padX + (t / until) * (CHART.width - CHART.padX - 8);
  const y = (v: number) => CHART.height - CHART.padY - (v / maxY) * (CHART.height - CHART.padY * 2);

  const expectedAtT = series.at(-1)!;
  const ratio = expectedAtT.expected / initial;

  return (
    <div className="data-lab">
      <div className="data-lab-controls">
        <label>
          Số hạt ban đầu N₀
          <input
            type="number"
            min={8}
            max={400}
            step={8}
            value={initial}
            onChange={(e) => setInitial(Math.min(400, Math.max(8, Number(e.target.value) || 8)))}
          />
        </label>
        <label>
          Chu kỳ bán rã T (giây)
          <input
            type="number"
            min={4}
            max={120}
            step={4}
            value={halfLife}
            onChange={(e) => setHalfLife(Math.min(120, Math.max(4, Number(e.target.value) || 4)))}
          />
        </label>
        <label>
          Seed (tái lập mẫu)
          <input
            type="number"
            min={1}
            max={9999}
            value={seed}
            onChange={(e) => setSeed(Math.min(9999, Math.max(1, Number(e.target.value) || 1)))}
          />
        </label>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setInitial(DECAY_COMPARISON.a.initialCount);
            setHalfLife(DECAY_COMPARISON.a.halfLifeSeconds);
            setSeed(DECAY_COMPARISON.a.seed);
          }}
        >
          Mẫu mặc định
        </button>
      </div>

      <figure className="data-lab-chart">
        <svg
          viewBox={`0 0 ${CHART.width} ${CHART.height}`}
          role="img"
          aria-label={`Đồ thị số hạt còn lại theo thời gian, N₀ = ${initial}, T = ${halfLife} giây`}
        >
          <line x1={CHART.padX} y1={y(0)} x2={CHART.width - 8} y2={y(0)} className="axis" />
          <line x1={CHART.padX} y1={y(0)} x2={CHART.padX} y2={CHART.padY - 6} className="axis" />
          {[0, 0.25, 0.5, 0.75, 1].map((f) => (
            <g key={f}>
              <line x1={CHART.padX} y1={y(maxY * f)} x2={CHART.width - 8} y2={y(maxY * f)} className="grid" />
              <text x={CHART.padX - 8} y={y(maxY * f) + 4} textAnchor="end" className="tick">
                {Math.round(maxY * f)}
              </text>
            </g>
          ))}
          {/* Đường kì vọng (hàm mũ) */}
          <polyline
            className="expected-line"
            points={series.map((p) => `${x(p.timeSeconds)},${y(p.expected)}`).join(" ")}
          />
          {/* Điểm số hạt còn lại của mẫu ngẫu nhiên */}
          {series.map((p) => (
            <circle key={p.timeSeconds} cx={x(p.timeSeconds)} cy={y(p.remaining)} r={2.6} className="sample-dot" />
          ))}
          {[1, 2, 3, 4].map((k) => (
            <g key={k}>
              <line x1={x(k * halfLife)} y1={y(0)} x2={x(k * halfLife)} y2={CHART.padY - 4} className="halflife-line" />
              <text x={x(k * halfLife)} y={CHART.height - 6} textAnchor="middle" className="tick">
                {k}T
              </text>
            </g>
          ))}
        </svg>
        <figcaption>
          <span className="legend-item"><span className="legend-swatch expected" /> Đường kì vọng N₀·2^(−t/T)</span>
          <span className="legend-item"><span className="legend-swatch sample" /> Số hạt còn lại của mẫu ngẫu nhiên</span>
        </figcaption>
      </figure>

      <div className="data-lab-table-wrap">
        <table className="data-lab-table">
          <caption>Bảng số liệu ({series.length} mốc thời gian, bước {Math.round(until / (series.length - 1))} s)</caption>
          <thead>
            <tr>
              <th scope="col">t (s)</th>
              <th scope="col">t / T</th>
              <th scope="col">Số hạt còn lại</th>
              <th scope="col">Kì vọng</th>
              <th scope="col">Sai khác</th>
            </tr>
          </thead>
          <tbody>
            {series.map((p) => (
              <tr key={p.timeSeconds}>
                <td>{p.timeSeconds}</td>
                <td>{(p.timeSeconds / halfLife).toFixed(2)}</td>
                <td>{p.remaining}</td>
                <td>{p.expected.toFixed(1)}</td>
                <td>{p.remaining - p.expected > 0 ? "+" : ""}{(p.remaining - p.expected).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="data-lab-check" aria-labelledby="data-lab-check-title">
        <h3 id="data-lab-check-title">Kiểm tra quy luật</h3>
        <p>
          Sau đúng <strong>4 chu kỳ bán rã</strong>, số hạt còn lại theo kì vọng là{" "}
          <strong>{expectedAtT.expected.toFixed(1)}</strong> hạt, tức{" "}
          <strong>{(ratio * 100).toFixed(1)}%</strong> số hạt ban đầu.
        </p>
        <p>
          Giá trị đúng theo công thức: N = N₀ · 2<sup>−4</sup> = {initial} × 0,0625 ={" "}
          <strong>{(initial / 16).toFixed(2)}</strong>.
        </p>
        <p className="data-lab-note">
          Sai khác giữa số hạt còn lại và kì vọng là do tính ngẫu nhiên của từng lượt mô
          phỏng, không phải sai số đo. Hãy thử đổi seed để thấy mẫu khác nhau nhưng xu
          hướng vẫn giảm một nửa sau mỗi T.
        </p>
      </section>
    </div>
  );
}
