import { FISSION_DURATION, FISSION_STAGES, fissionState } from "./fission-model";

/** A didactic scenario, not a model of microscopic reaction dynamics. */
export type FissionMode = "guided" | "explore" | "assignment";
export type FissionMeasurement = { incident: boolean; time: number; freeNeutrons: number };
export type FissionLearningState = {
  version: 1;
  mode: FissionMode;
  guideIndex: number;
  time: number;
  incident: boolean;
  prediction: number | null;
  measurements: FissionMeasurement[];
  explanation: "conservation" | "incorrect" | null;
  k: number;
};
export type FissionLearningAction =
  | { type: "mode"; value: FissionMode }
  | { type: "guide"; value: number }
  | { type: "time"; value: number }
  | { type: "incident"; value: boolean }
  | { type: "prediction"; value: number }
  | { type: "measure" }
  | { type: "explain"; value: "conservation" | "incorrect" }
  | { type: "k"; value: number }
  | { type: "reset" }
  | { type: "restore"; value: FissionLearningState };

export const initialFissionLearningState = (): FissionLearningState => ({
  version: 1, mode: "guided", guideIndex: 0, time: 0, incident: true,
  prediction: null, measurements: [], explanation: null, k: 1,
});
export const FISSION_GUIDE = [
  { title: "Điều kiện ban đầu", text: "Nhận biết U-235 và neutron tới. Dự đoán số neutron tự do sau kênh phân hạch minh họa." },
  { title: "Hấp thụ và biến dạng", text: "Bắt đầu lượt, rồi quan sát U-236* sau khi hấp thụ neutron. Thời gian và chuyển động là quy ước để quan sát." },
  { title: "Sản phẩm và bảo toàn", text: "Đếm neutron tự do sau khi hai mảnh tách. So sánh tổng số khối A và điện tích Z ở hai vế." },
  { title: "Mở rộng: chuỗi phản ứng", text: "Thay k trong mô hình thế hệ định tính. k không phải số neutron phát ra trong một lần phân hạch." },
] as const;

export function reduceFissionLearning(state: FissionLearningState, action: FissionLearningAction): FissionLearningState {
  switch (action.type) {
    case "mode": return { ...state, mode: action.value };
    case "guide": return { ...state, guideIndex: Math.max(0, Math.min(FISSION_GUIDE.length - 1, Math.round(action.value))) };
    case "time": return { ...state, time: fissionState(action.value, state.incident).time };
    case "incident": return { ...state, incident: action.value, time: 0 };
    case "prediction": return Number.isInteger(action.value) && action.value >= 0 && action.value <= 9 ? { ...state, prediction: action.value } : state;
    case "measure": {
      if (state.incident && state.time < FISSION_STAGES[3].time) return state;
      const reading: FissionMeasurement = { incident: state.incident, time: state.time, freeNeutrons: state.incident ? 3 : 0 };
      return { ...state, measurements: [...state.measurements.slice(-9), reading] };
    }
    case "explain": return { ...state, explanation: action.value };
    case "k": return Number.isFinite(action.value) && action.value >= 0.6 && action.value <= 1.4 ? { ...state, k: action.value } : state;
    case "reset": return { ...state, time: 0 };
    case "restore": return restoreFissionLearning(action.value) ?? state;
  }
}
export function isFissionLearningComplete(state: FissionLearningState) {
  return state.prediction !== null && state.measurements.some(m => m.incident && m.freeNeutrons === 3) && state.measurements.some(m => !m.incident && m.freeNeutrons === 0) && state.explanation === "conservation";
}
export function restoreFissionLearning(value: unknown): FissionLearningState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Partial<FissionLearningState>;
  if (source.version !== 1 || !["guided", "explore", "assignment"].includes(source.mode ?? "") || !Number.isInteger(source.guideIndex) || source.guideIndex! < 0 || source.guideIndex! >= FISSION_GUIDE.length || typeof source.time !== "number" || !Number.isFinite(source.time) || source.time < 0 || source.time > FISSION_DURATION || typeof source.incident !== "boolean" || (!source.incident && source.time !== 0) || (source.prediction !== null && (!Number.isInteger(source.prediction) || source.prediction! < 0 || source.prediction! > 9)) || !Array.isArray(source.measurements) || source.measurements.length > 10 || ![null, "conservation", "incorrect"].includes(source.explanation ?? null) || typeof source.k !== "number" || !Number.isFinite(source.k) || source.k < 0.6 || source.k > 1.4) return null;
  const measurements: FissionMeasurement[] = [];
  for (const item of source.measurements) {
    if (!item || typeof item !== "object" || typeof item.incident !== "boolean" || typeof item.time !== "number" || !Number.isFinite(item.time) || item.time < 0 || item.time > FISSION_DURATION || (item.incident ? item.freeNeutrons !== 3 || item.time < FISSION_STAGES[3].time : item.freeNeutrons !== 0 || item.time !== 0)) return null;
    measurements.push({ incident: item.incident, time: item.time, freeNeutrons: item.freeNeutrons });
  }
  return { version: 1, mode: source.mode as FissionMode, guideIndex: source.guideIndex!, time: source.time, incident: source.incident, prediction: source.prediction!, measurements, explanation: source.explanation ?? null, k: source.k };
}
