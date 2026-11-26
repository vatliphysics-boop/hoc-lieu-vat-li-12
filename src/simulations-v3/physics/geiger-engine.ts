/**
 * Pure physics & stochastic Poisson counting engine for the 3D Geiger–Müller apparatus (Bài 23, SGK tr. 104–105).
 * Kept completely free of DOM / React / Three.js so it can be unit-tested directly in Node.
 */

export interface SgkGeigerIntervalRow {
  readonly index: number;
  readonly windowLabel: string;
  readonly durationSec: 5;
  readonly pulses: number;
}

/**
 * Bảng 23.1 SGK Vật lí 12 Kết nối tri thức (trang 105):
 * Sáu khoảng thời gian 5 giây liên tiếp với dãy số xung chuẩn: 1, 3, 2, 0, 3, 1 (tổng 10 xung / 30 s).
 */
export const SGK_TABLE_23_1_ROWS: readonly SgkGeigerIntervalRow[] = [
  { index: 1, windowLabel: "0 – 5", durationSec: 5, pulses: 1 },
  { index: 2, windowLabel: "5 – 10", durationSec: 5, pulses: 3 },
  { index: 3, windowLabel: "10 – 15", durationSec: 5, pulses: 2 },
  { index: 4, windowLabel: "15 – 20", durationSec: 5, pulses: 0 },
  { index: 5, windowLabel: "20 – 25", durationSec: 5, pulses: 3 },
  { index: 6, windowLabel: "25 – 30", durationSec: 5, pulses: 1 },
] as const;

export const GEIGER_GATE_DURATION_SEC = 5;
/** Tốc độ đếm trung bình ~0,36 xung/s (~1,8 xung / 5 s) tương đương cỡ độ lớn Bảng 23.1 SGK (10 xung / 30 s) */
export const GEIGER_DEFAULT_MEAN_RATE_PER_SEC = 0.36;

export interface GeigerMeasurementWindow {
  readonly trialSeed: number;
  readonly durationSec: number;
  readonly meanRatePerSec: number;
  /** Các thời điểm (tính bằng giây trong khoảng (0, durationSec]) hạt phóng xạ đi vào ống GM tạo xung */
  readonly pulseTimestampsSec: readonly number[];
  /** Tổng số xung ghi nhận trong trọn cửa sổ đo */
  readonly totalPulses: number;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sinh một cửa sổ đo xung ngẫu nhiên theo quá trình Poisson dừng (khoảng cách giữa hai xung liên tiếp
 * tuân theo phân bố mũ Δt = -ln(1 - u) / rate). Có thể sinh tự nhiên cả các lượt có 0 xung.
 */
export function generateGeigerMeasurementWindow(
  trialSeed: number,
  durationSec: number = GEIGER_GATE_DURATION_SEC,
  meanRatePerSec: number = GEIGER_DEFAULT_MEAN_RATE_PER_SEC,
): GeigerMeasurementWindow {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    throw new RangeError("durationSec must be positive");
  }
  if (!Number.isFinite(meanRatePerSec) || meanRatePerSec < 0) {
    throw new RangeError("meanRatePerSec must be non-negative");
  }

  if (meanRatePerSec === 0) {
    return {
      trialSeed,
      durationSec,
      meanRatePerSec,
      pulseTimestampsSec: [],
      totalPulses: 0,
    };
  }

  const rng = mulberry32((Math.floor(trialSeed) * 2654435761 + 0x9e3779b9) >>> 0);
  const timestamps: number[] = [];
  let elapsed = 0;

  while (timestamps.length < 500) {
    const u = Math.min(1 - 1e-12, Math.max(1e-12, rng()));
    const dt = -Math.log(1 - u) / meanRatePerSec;
    elapsed += dt;
    if (elapsed > durationSec) {
      break;
    }
    timestamps.push(Number(elapsed.toFixed(4)));
  }

  return {
    trialSeed,
    durationSec,
    meanRatePerSec,
    pulseTimestampsSec: timestamps,
    totalPulses: timestamps.length,
  };
}

/**
 * Trả về số xung bộ đếm đã ghi nhận tính tới thời điểm `elapsedSec` trong cửa sổ đo.
 */
export function countGeigerPulsesAtTime(
  window: GeigerMeasurementWindow,
  elapsedSec: number,
): number {
  if (elapsedSec <= 0) return 0;
  const clamped = Math.min(window.durationSec, elapsedSec);
  let count = 0;
  for (const ts of window.pulseTimestampsSec) {
    if (ts <= clamped + 1e-9) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

/**
 * Kiểm tra xem tại thời điểm `elapsedSec` có vừa xuất hiện xung mới (trong khoảng `flashDurationSec`)
 * để kích hoạt tia chớp ion hóa trong ống GM, xung truyền trên dây cáp và đèn báo trên bộ đếm.
 */
export function getRecentPulseProgress(
  window: GeigerMeasurementWindow,
  elapsedSec: number,
  flashDurationSec: number = 0.28,
): number | null {
  if (elapsedSec <= 0) return null;
  let latestDelta: number | null = null;
  for (const ts of window.pulseTimestampsSec) {
    if (ts <= elapsedSec) {
      const delta = elapsedSec - ts;
      if (delta >= 0 && delta <= flashDurationSec) {
        latestDelta = delta / flashDurationSec;
      }
    } else {
      break;
    }
  }
  return latestDelta;
}
