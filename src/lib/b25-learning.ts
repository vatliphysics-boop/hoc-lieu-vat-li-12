import { SGK_TABLE_25_1, activityAt } from "./sgk-b25-decay";

export type B25Mode = "guided" | "explore" | "assignment";
export type B25Measurement = { time: number; hypothesis: number; afterPrediction: boolean };
export type B25LearningState = { version: 1; mode: B25Mode; guideIndex: number; time: number; halfLife: number; prediction: 40 | 60 | null; readings: B25Measurement[]; explanation: "limits" | "incorrect" | null };
export type B25Action =
  | { type: "mode"; value: B25Mode }
  | { type: "guide"; value: number }
  | { type: "time"; value: number }
  | { type: "halfLife"; value: number }
  | { type: "prediction"; value: 40 | 60 }
  | { type: "record" }
  | { type: "explanation"; value: "limits" | "incorrect" }
  | { type: "reset" }
  | { type: "restore"; value: B25LearningState };
export const B25_GUIDE = [
  { title: "Đọc số liệu gốc", text: "Đọc hai đại lượng và đơn vị trong Bảng 25.1. Mỗi điểm là một giá trị của bảng, không phải kết quả mô phỏng mới." },
  { title: "Dự đoán và chọn giả thuyết", text: "Dự đoán T = 40 s hay 60 s gần số liệu hơn ở t = 30 s. Chọn giả thuyết và đối chiếu tại cùng một mốc." },
  { title: "Ghi và so sánh", text: "Ghi cùng một mốc với hai T khác nhau, rồi ghi một mốc đo khác. So sánh sai lệch và đừng sửa số liệu gốc." },
  { title: "Giải thích giới hạn", text: "Mức nửa ban đầu là 75,5 Bq; nó nằm giữa hai điểm 30 s và 60 s. Nội suy thẳng chỉ là một cách ước lượng thô." },
] as const;
export const initialB25LearningState = (): B25LearningState => ({ version: 1, mode: "guided", guideIndex: 0, time: 0, halfLife: 40, prediction: null, readings: [], explanation: null });
export function b25Reading(measurement: Pick<B25Measurement, "time" | "hypothesis">) {
  const actual = SGK_TABLE_25_1.find(row => row.t === measurement.time);
  if (!actual || !Number.isFinite(measurement.hypothesis) || measurement.hypothesis < 10 || measurement.hypothesis > 120) return null;
  const expected = activityAt(actual.t, measurement.hypothesis);
  return { time: actual.t, measured: actual.h, hypothesis: measurement.hypothesis, expected, residual: expected - actual.h };
}
export function reduceB25Learning(state: B25LearningState, action: B25Action): B25LearningState {
  switch (action.type) {
    case "mode": return { ...state, mode: action.value };
    case "guide": return Number.isFinite(action.value) ? { ...state, guideIndex: Math.max(0, Math.min(B25_GUIDE.length - 1, Math.round(action.value))) } : state;
    case "time": return Number.isFinite(action.value) ? { ...state, time: Math.max(0, Math.min(360, action.value)) } : state;
    case "halfLife": return Number.isInteger(action.value) && action.value >= 10 && action.value <= 120 ? { ...state, halfLife: action.value } : state;
    case "prediction": return { ...state, prediction: action.value };
    case "record": {
      const row = SGK_TABLE_25_1.find(value => Math.abs(value.t - state.time) < 0.05);
      if (!row) return state;
      return { ...state, readings: [...state.readings.slice(-19), { time: row.t, hypothesis: state.halfLife, afterPrediction: state.prediction !== null }] };
    }
    case "explanation": return { ...state, explanation: action.value };
    case "reset": return { ...state, time: 0 };
    case "restore": return restoreB25Learning(action.value) ?? state;
  }
}
export function hasB25Comparison(state: B25LearningState) {
  return state.readings.some((a, i) => a.afterPrediction && a.time > 0 && state.readings.some((b, j) => i !== j && b.afterPrediction && a.time === b.time && a.hypothesis !== b.hypothesis));
}
export function isB25Complete(state: B25LearningState) {
  return state.prediction !== null && hasB25Comparison(state) && new Set(state.readings.filter(item => item.afterPrediction).map(item => item.time)).size >= 2 && state.explanation === "limits";
}
export function restoreB25Learning(value: unknown): B25LearningState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Partial<B25LearningState>;
  if (source.version !== 1 || !["guided", "explore", "assignment"].includes(source.mode ?? "") || !Number.isInteger(source.guideIndex) || source.guideIndex! < 0 || source.guideIndex! >= B25_GUIDE.length || typeof source.time !== "number" || !Number.isFinite(source.time) || source.time < 0 || source.time > 360 || !Number.isInteger(source.halfLife) || source.halfLife! < 10 || source.halfLife! > 120 || ![null, 40, 60].includes(source.prediction ?? null) || ![null, "limits", "incorrect"].includes(source.explanation ?? null) || !Array.isArray(source.readings) || source.readings.length > 20) return null;
  const readings: B25Measurement[] = [];
  for (const row of source.readings) {
    if (!row || typeof row !== "object" || typeof row.afterPrediction !== "boolean" || !Number.isInteger(row.hypothesis) || !b25Reading(row)) return null;
    readings.push({ time: row.time, hypothesis: row.hypothesis, afterPrediction: row.afterPrediction });
  }
  return { version: 1, mode: source.mode as B25Mode, guideIndex: source.guideIndex!, time: source.time, halfLife: source.halfLife!, prediction: source.prediction ?? null, readings, explanation: source.explanation ?? null };
}
