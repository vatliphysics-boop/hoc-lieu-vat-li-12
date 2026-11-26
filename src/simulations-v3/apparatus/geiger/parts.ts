/**
 * Component registry, camera modes, connector signal-path metadata, and localStorage state
 * for the 3D Geiger–Müller counter apparatus (Hình 23.2 SGK Vật lí 12 KNTT, trang 105).
 */

import type { ApparatusComponent } from "../../core/types";
import { GEIGER_GATE_DURATION_SEC } from "../../physics/geiger-engine";

export type GeigerCameraMode = "overview" | "probe" | "display";

export interface GeigerCameraPreset {
  readonly mode: GeigerCameraMode;
  readonly nameVi: string;
  readonly description: string;
}

export const GEIGER_CAMERA_PRESETS: readonly GeigerCameraPreset[] = [
  {
    mode: "overview",
    nameVi: "Toàn cảnh",
    description: "Góc nhìn toàn bộ bàn thí nghiệm Hình 23.2: giá giữ mẫu, ống đếm, đầu nối, dây tín hiệu, bộ đếm & bộ định thời",
  },
  {
    mode: "probe",
    nameVi: "Cận đầu dò",
    description: "Góc cận giá giữ mẫu, cửa sổ mica, dây Anode trong ống đếm Geiger–Müller và đầu nối BNC ra",
  },
  {
    mode: "display",
    nameVi: "Đọc màn hình",
    description: "Góc nhìn trực diện màn hình đọc số xung, bộ định thời 5 giây, loa báo xung và đầu nối tín hiệu vào",
  },
] as const;

export const GEIGER_COMPONENTS: readonly ApparatusComponent[] = [
  {
    id: "sample-holder",
    nameVi: "Giá giữ mẫu & Nguồn phóng xạ (1)",
    nameEn: "Sample Holder & Sealed Source",
    category: "source",
    role: "Giữ cố định viên nguồn phóng xạ kín trên giá đỡ đối diện cửa sổ ống đếm để khoảng cách và góc khối không đổi giữa các lần đo 5 giây.",
  },
  {
    id: "gm-tube",
    nameVi: "Ống đếm Geiger–Müller (2)",
    nameEn: "Geiger–Müller Detector Tube",
    category: "detector",
    role: "Đầu thu chứa khí trơ áp suất thấp giữa vỏ trụ Cathode (−) và dây trục Anode (+). Mỗi hạt phóng xạ đi qua cửa sổ mica làm ion hóa chất khí, tạo ra một xung điện ngắn.",
  },
  {
    id: "signal-connectors",
    nameVi: "Các đầu nối đồng trục BNC (Ra / Vào)",
    nameEn: "Coaxial BNC Signal Connectors",
    category: "structure",
    role: "Gồm đầu nối BNC ở đuôi ống đếm (OUT) và ổ cắm BNC trên thân máy (SIGNAL IN), ghép kín đường truyền xung điện và cấp điện áp phân cực cao áp cho ống đếm.",
  },
  {
    id: "signal-cable",
    nameVi: "Dây cáp tín hiệu đồng trục",
    nameEn: "Shielded Coaxial Signal Cable",
    category: "structure",
    role: "Dẫn nguyên vẹn từng xung điện từ đầu nối đuôi ống đếm Geiger–Müller sang ngõ vào của bộ chuyển đổi – hiển thị số đếm, chống nhiễu điện từ bên ngoài.",
  },
  {
    id: "counter-display",
    nameVi: "Bộ đếm xung có màn hình & loa (3, 4, 5)",
    nameEn: "Digital Pulse Counter & Audio Unit",
    category: "measurement",
    role: "Khuếch đại xung điện từ ống đếm, phát tiếng “tách” qua loa (4) và tăng số đọc trên màn hình điện tử (5) thêm 1 đơn vị mỗi khi ghi nhận 1 xung trong cửa sổ đo.",
  },
  {
    id: "timer-unit",
    nameVi: "Bộ định thời cửa sổ đo (5,0 giây)",
    nameEn: "Gate Timer Module (5.0 s)",
    category: "control",
    role: "Mở và đóng cổng đếm chính xác trong từng khoảng thời gian định trước (5,0 giây theo Bảng 23.1 SGK) để học sinh đối chiếu số xung giữa các lượt đo bằng nhau.",
  },
] as const;

export interface GeigerQuickPartMeta {
  readonly partId: string;
  readonly shortBadge: string;
  readonly stepOrder: number;
  readonly signalCue: string;
}

/** Thứ tự lần theo đường đi tín hiệu từ mẫu → đầu dò → đầu nối → dây cáp → bộ đếm & bộ định thời */
export const GEIGER_SIGNAL_PATH_PARTS: readonly GeigerQuickPartMeta[] = [
  {
    partId: "sample-holder",
    shortBadge: "1 · Giá giữ mẫu",
    stepOrder: 1,
    signalCue: "Phát tia phóng xạ ngẫu nhiên",
  },
  {
    partId: "gm-tube",
    shortBadge: "2 · Ống đếm GM",
    stepOrder: 2,
    signalCue: "Ion hóa khí → tạo xung điện",
  },
  {
    partId: "signal-connectors",
    shortBadge: "3 · Đầu nối BNC",
    stepOrder: 3,
    signalCue: "Khớp nối OUT → SIGNAL IN",
  },
  {
    partId: "signal-cable",
    shortBadge: "4 · Dây tín hiệu",
    stepOrder: 4,
    signalCue: "Truyền xung về bộ đếm",
  },
  {
    partId: "counter-display",
    shortBadge: "5 · Bộ đếm & màn hình",
    stepOrder: 5,
    signalCue: "Màn hình nhảy +1 mỗi xung",
  },
  {
    partId: "timer-unit",
    shortBadge: "6 · Bộ định thời",
    stepOrder: 6,
    signalCue: "Khóa đúng cửa sổ 5,0 giây",
  },
] as const;

export function getGeigerComponent(id: string): ApparatusComponent | undefined {
  return GEIGER_COMPONENTS.find((c) => c.id === id);
}

const RAYCAST_PRIORITY: readonly string[] = [
  "signal-connectors",
  "sample-holder",
  "gm-tube",
  "signal-cable",
  "timer-unit",
  "counter-display",
];

export function resolveGeigerRaycastPart(hitIds: readonly string[]): string | null {
  if (hitIds.length === 0) return null;
  for (const preferred of RAYCAST_PRIORITY) {
    if (hitIds.includes(preferred)) {
      return preferred;
    }
  }
  return hitIds[0] ?? null;
}

export interface GeigerSavedRun {
  readonly id: number;
  readonly runNumber: number;
  /** Thời lượng của lượt đo (giây) — lưu độc lập cho từng lượt */
  readonly durationSec: number;
  /** Số xung ghi nhận trong cửa sổ đo — bảo toàn chính xác kể cả khi bằng 0 */
  readonly pulses: number;
  readonly trialSeed: number;
}

export type GeigerMeasurementStatus = "idle" | "measuring" | "completed";

export const GEIGER_V3_STORAGE_KEY = "b23-geiger-v3-state-v1";

export interface GeigerV3PersistedState {
  readonly cameraMode: GeigerCameraMode;
  readonly selectedPartId: string | null;
  readonly trialSeed: number;
  readonly status: GeigerMeasurementStatus;
  readonly durationSec: number;
  /** Số xung hiện trên màn hình sau khi hoàn tất lượt đang xem */
  readonly completedPulses: number | null;
  /** Đánh dấu lượt vừa đo xong đã được lưu vào bảng hay chưa */
  readonly currentWindowSaved: boolean;
  readonly savedRuns: readonly GeigerSavedRun[];
}

export const INITIAL_GEIGER_V3_STATE: GeigerV3PersistedState = {
  cameraMode: "overview",
  selectedPartId: null,
  trialSeed: 103,
  status: "idle",
  durationSec: GEIGER_GATE_DURATION_SEC,
  completedPulses: null,
  currentWindowSaved: false,
  savedRuns: [],
};

function parseSavedRun(raw: unknown, fallbackIndex: number): GeigerSavedRun | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (
    typeof r.durationSec !== "number" ||
    !Number.isFinite(r.durationSec) ||
    r.durationSec <= 0 ||
    typeof r.pulses !== "number" ||
    !Number.isFinite(r.pulses) ||
    r.pulses < 0
  ) {
    return null;
  }
  return {
    id: typeof r.id === "number" && Number.isFinite(r.id) ? Math.floor(r.id) : fallbackIndex + 1,
    runNumber:
      typeof r.runNumber === "number" && Number.isFinite(r.runNumber) && r.runNumber >= 1
        ? Math.floor(r.runNumber)
        : fallbackIndex + 1,
    durationSec: Number(r.durationSec),
    pulses: Math.max(0, Math.round(r.pulses)),
    trialSeed:
      typeof r.trialSeed === "number" && Number.isFinite(r.trialSeed)
        ? Math.floor(r.trialSeed)
        : 101 + fallbackIndex,
  };
}

export function parseGeigerV3State(raw: string): GeigerV3PersistedState {
  if (!raw) return INITIAL_GEIGER_V3_STATE;
  try {
    const p = JSON.parse(raw) as Partial<GeigerV3PersistedState>;
    const cameraMode: GeigerCameraMode =
      p.cameraMode === "overview" || p.cameraMode === "probe" || p.cameraMode === "display"
        ? p.cameraMode
        : INITIAL_GEIGER_V3_STATE.cameraMode;
    const selectedPartId =
      typeof p.selectedPartId === "string" && GEIGER_COMPONENTS.some((c) => c.id === p.selectedPartId)
        ? p.selectedPartId
        : null;
    const trialSeed =
      typeof p.trialSeed === "number" && Number.isFinite(p.trialSeed) && p.trialSeed >= 1
        ? Math.floor(p.trialSeed)
        : INITIAL_GEIGER_V3_STATE.trialSeed;
    // If reloaded mid-measurement, return cleanly to idle (or completed if completedPulses was recorded)
    const completedPulses =
      typeof p.completedPulses === "number" && Number.isFinite(p.completedPulses) && p.completedPulses >= 0
        ? Math.round(p.completedPulses)
        : null;
    const status: GeigerMeasurementStatus =
      p.status === "completed" && completedPulses !== null ? "completed" : "idle";
    const durationSec =
      typeof p.durationSec === "number" && Number.isFinite(p.durationSec) && p.durationSec > 0
        ? Number(p.durationSec)
        : GEIGER_GATE_DURATION_SEC;
    const savedRuns: GeigerSavedRun[] = Array.isArray(p.savedRuns)
      ? p.savedRuns
          .map((item, idx) => parseSavedRun(item, idx))
          .filter((item): item is GeigerSavedRun => item !== null)
      : [];
    const currentWindowSaved = Boolean(p.currentWindowSaved) && status === "completed";

    return {
      cameraMode,
      selectedPartId,
      trialSeed,
      status,
      durationSec,
      completedPulses,
      currentWindowSaved,
      savedRuns,
    };
  } catch {
    return INITIAL_GEIGER_V3_STATE;
  }
}
