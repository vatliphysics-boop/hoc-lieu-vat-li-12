import type { ApparatusComponent } from "../../core/types";
import type { BlackettRunMode } from "../../physics/blackett-engine";

export type BlackettPartId =
  | "chamber-body"
  | "observation-window"
  | "alpha-entry-port"
  | "observation-zone"
  | "vapor-tracks";

export type BlackettCameraMode = "overview" | "window" | "port";

export interface BlackettCameraPresetSpec {
  readonly mode: BlackettCameraMode;
  readonly label: string;
  readonly badge: string;
  readonly description: string;
}

export const BLACKETT_CAMERA_PRESETS: readonly BlackettCameraPresetSpec[] = [
  {
    mode: "overview",
    label: "Toàn cảnh 3D",
    badge: "Góc toàn cảnh thiết bị",
    description:
      "Quan sát tổng thể cấu tạo buồng sương giãn nở Wilson–Blackett: vỏ buồng trụ, cửa sổ kính phía trên, cổng hạt α tới bên trái và vùng quan sát chiếu sáng ngang.",
  },
  {
    mode: "window",
    label: "Góc cửa sổ quan sát",
    badge: "Nhìn thẳng qua cửa sổ kính (đối chiếu Hình 22.2)",
    description:
      "Đặt mắt/máy ảnh nhìn thẳng qua cửa sổ kính phía trên xuống nền nhung đen để đối chiếu trực tiếp vết đi thẳng (Lượt 1) và vết chữ Y (1)–(2)–(3)–(4) của Blackett (Hình 22.2 SGK tr. 96).",
  },
  {
    mode: "port",
    label: "Cận vị trí hạt tới",
    badge: "Cận cổng nguồn α & vùng va chạm",
    description:
      "Quan sát gần khe chuẩn trực đưa hạt α vào vùng khí Nitrogen siêu bão hòa và điểm kết thúc của vệt hạt α tại đỉnh va chạm (2).",
  },
] as const;

export interface BlackettPartGuide {
  readonly partId: BlackettPartId;
  readonly stepNumber: number;
  readonly shortName: string;
  readonly buttonLabel: string;
  readonly detailFunction: string;
}

export const BLACKETT_PART_GUIDES: readonly BlackettPartGuide[] = [
  {
    partId: "chamber-body",
    stepNumber: 1,
    shortName: "Vỏ buồng sương & đáy nhung đen",
    buttonLabel: "1 · Vỏ buồng",
    detailFunction:
      "Thân buồng hình trụ kín gắn pít-tông giãn nở ở đáy, chứa khí Nitrogen (¹⁴₇N) bão hòa hơi nước/rượu. Đáy phủ nhung đen để các giọt sương ngưng tụ phản xạ ánh sáng trắng nổi rõ khi chụp ảnh.",
  },
  {
    partId: "observation-window",
    stepNumber: 2,
    shortName: "Cửa sổ kính quan sát",
    buttonLabel: "2 · Cửa sổ quan sát",
    detailFunction:
      "Đĩa kính quang học trong suốt có vành đồng giữ kín ở mặt trên buồng sương. Blackett đặt máy ảnh phía trên cửa sổ này để chụp hơn 23 000 bức ảnh vết hạt α (Hình 22.2 SGK tr. 96).",
  },
  {
    partId: "alpha-entry-port",
    stepNumber: 3,
    shortName: "Vị trí hạt tới (Nguồn α & khe chuẩn trực)",
    buttonLabel: "3 · Vị trí hạt tới",
    detailFunction:
      "Ống giữ nguồn phóng xạ phát hạt α (⁴₂He²⁺) gắn khe chuẩn trực ở thành bên trái buồng, định hướng chùm hạt α bay ngang vào vùng khí Nitrogen đúng thời điểm khí giãn nở.",
  },
  {
    partId: "observation-zone",
    stepNumber: 4,
    shortName: "Vùng quan sát khí ¹⁴₇N siêu bão hòa",
    buttonLabel: "4 · Vùng quan sát",
    detailFunction:
      "Khoang khí Nitrogen siêu bão hòa được đèn khe bên hông chiếu sáng ngang. Khi hạt tích điện bay qua làm ion hóa phân tử khí, hơi ngưng tụ quanh các ion tạo thành vệt giọt sương.",
  },
  {
    partId: "vapor-tracks",
    stepNumber: 5,
    shortName: "Hệ vết sương ngưng tụ (vệt thẳng / chữ Y)",
    buttonLabel: "5 · Vết sương",
    detailFunction:
      "Dấu vết thực nghiệm của các hạt mang điện trong vùng quan sát: đa số là vệt thẳng xuyên qua (Lượt 1), rất hiếm khi xuất hiện vết rẽ nhánh chữ Y (1)–(2)–(3)–(4) chứng minh phản ứng hạt nhân (Lượt 2).",
  },
] as const;

export const BLACKETT_COMPONENTS: readonly ApparatusComponent[] = [
  {
    id: "chamber-body",
    nameVi: "Vỏ buồng sương & pít-tông đáy nhung đen",
    nameEn: "Chamber Body & Velvet Piston Floor",
    category: "structure",
    role: "Vỏ trụ kim loại kín và đáy pít-tông phủ nhung đen tạo độ tương phản cao cho vết sương ngưng tụ.",
  },
  {
    id: "observation-window",
    nameVi: "Cửa sổ kính quan sát phía trên",
    nameEn: "Top Optical Observation Window",
    category: "measurement",
    role: "Cửa sổ kính phẳng trong suốt phía trên buồng để mắt hoặc máy ảnh quan sát trực tiếp vùng sương.",
  },
  {
    id: "alpha-entry-port",
    nameVi: "Vị trí hạt tới (Nguồn α & khe chuẩn trực)",
    nameEn: "Collimated Alpha Entry Port",
    category: "source",
    role: "Cổng giữ nguồn phát hạt α và khe chuẩn trực đưa chùm hạt α bay vào vùng quan sát khí Nitrogen.",
  },
  {
    id: "observation-zone",
    nameVi: "Vùng quan sát khí Nitrogen siêu bão hòa",
    nameEn: "Supersaturated Nitrogen Observation Zone",
    category: "target",
    role: "Khoang khí ¹⁴₇N siêu bão hòa được chiếu sáng ngang nơi các ion tạo thành vệt giọt sương.",
  },
  {
    id: "vapor-tracks",
    nameVi: "Hệ vết sương ngưng tụ trong buồng",
    nameEn: "Condensation Vapor Tracks",
    category: "detector",
    role: "Các vệt giọt sương ngưng tụ quan sát được trong Lượt vệt thẳng hoặc Lượt vết chữ Y.",
  },
] as const;

const VALID_PART_IDS = new Set<string>(BLACKETT_COMPONENTS.map((c) => c.id));

/**
 * Raycast priority when clicking through the transparent top glass window:
 * specific inner items (alpha-entry-port, vapor-tracks, observation-zone) win when directly hit,
 * while clicking the glass bezel/disc selects observation-window and outer wall selects chamber-body.
 */
const PRIORITY_ORDER: readonly BlackettPartId[] = [
  "alpha-entry-port",
  "vapor-tracks",
  "observation-zone",
  "observation-window",
  "chamber-body",
];

export function resolveBlackettRaycastPart(
  hitPartIdsInDepthOrder: readonly string[],
): BlackettPartId | null {
  if (hitPartIdsInDepthOrder.length === 0) return null;
  // If first hit is explicitly the brass window bezel or alpha port or outer wall, respect direct hit
  for (const candidate of PRIORITY_ORDER) {
    if (hitPartIdsInDepthOrder.includes(candidate)) {
      // Allow clicking observation-window glass rim when no inner track/port is underneath
      return candidate;
    }
  }
  const first = hitPartIdsInDepthOrder[0];
  return VALID_PART_IDS.has(first) ? (first as BlackettPartId) : null;
}

export const BLACKETT_V3_STORAGE_KEY = "b22-blackett-v3-state-v1";

export interface BlackettV3PersistedState {
  readonly cameraMode: BlackettCameraMode;
  readonly selectedPartId: BlackettPartId | null;
  readonly activeRun: BlackettRunMode;
  readonly completedRuns: readonly BlackettRunMode[];
  /** Cho phép mở khóa giải thích khi chạy độc lập ở trang /hoc-lieu/phong-hat-nhan-v2?bai=B22 */
  readonly standalonePredictionChoice: string;
  readonly standalonePredictionReason: string;
  readonly standalonePredictionLocked: boolean;
  /** Kiểm tra tổng A và Z ở hai vế sau khi mở giải thích */
  readonly azVerified: boolean;
}

export const INITIAL_BLACKETT_V3_STATE: BlackettV3PersistedState = {
  cameraMode: "overview",
  selectedPartId: null,
  activeRun: "y_fork",
  completedRuns: [],
  standalonePredictionChoice: "",
  standalonePredictionReason: "",
  standalonePredictionLocked: false,
  azVerified: false,
};

export function parseBlackettV3State(
  raw: unknown,
  fallback: BlackettV3PersistedState = INITIAL_BLACKETT_V3_STATE,
): BlackettV3PersistedState {
  if (!raw) return fallback;
  try {
    const obj: Partial<BlackettV3PersistedState> =
      typeof raw === "string" ? (JSON.parse(raw) as Partial<BlackettV3PersistedState>) : (raw as Partial<BlackettV3PersistedState>);
    if (!obj || typeof obj !== "object") return fallback;

    const cameraMode: BlackettCameraMode =
      obj.cameraMode === "overview" || obj.cameraMode === "window" || obj.cameraMode === "port"
        ? obj.cameraMode
        : fallback.cameraMode;
    const selectedPartId: BlackettPartId | null =
      typeof obj.selectedPartId === "string" && VALID_PART_IDS.has(obj.selectedPartId)
        ? (obj.selectedPartId as BlackettPartId)
        : null;
    const activeRun: BlackettRunMode =
      obj.activeRun === "straight" || obj.activeRun === "y_fork"
        ? obj.activeRun
        : fallback.activeRun;
    const completedRuns = Array.isArray(obj.completedRuns)
      ? Array.from(
          new Set(
            obj.completedRuns.filter(
              (r): r is BlackettRunMode => r === "straight" || r === "y_fork",
            ),
          ),
        )
      : fallback.completedRuns;

    return {
      cameraMode,
      selectedPartId,
      activeRun,
      completedRuns,
      standalonePredictionChoice:
        typeof obj.standalonePredictionChoice === "string"
          ? obj.standalonePredictionChoice.slice(0, 80)
          : "",
      standalonePredictionReason:
        typeof obj.standalonePredictionReason === "string"
          ? obj.standalonePredictionReason.slice(0, 600)
          : "",
      standalonePredictionLocked: Boolean(obj.standalonePredictionLocked),
      azVerified: Boolean(obj.azVerified),
    };
  } catch {
    return fallback;
  }
}
