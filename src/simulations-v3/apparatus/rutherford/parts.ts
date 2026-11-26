/**
 * Rutherford apparatus component registry & persisted state helpers
 * Aligned with SGK Vật lí 12 Kết nối tri thức với cuộc sống — Bài 21, Hình 21.2 (tr. 91–92):
 *   R — Nguồn phát hạt alpha (α, hạt nhân He)
 *   D — Lá vàng rất mỏng (~4·10⁻⁷ m)
 *   S — Kính / màn phủ chất huỳnh quang (ZnS)
 *   M — Kính hiển vi quan sát các đốm sáng từ vị trí (1) đến vị trí (2)
 *   G — Hộp chân không
 *   P — Chân đế đỡ hộp chân không
 */

import type { ApparatusComponent, CameraMode } from "../../core/types";
import { createComponentRegistry } from "../../core/ComponentRegistry";
import { RUTHERFORD_LIMITS } from "../../physics/rutherford-engine";
import type { InquiryRun, RunSlot, RutherfordPrediction } from "./inquiry";

/** All apparatus components in the Rutherford scattering experiment */
export const RUTHERFORD_COMPONENTS: readonly ApparatusComponent[] = [
  // Source components (R)
  {
    id: "alpha-source",
    nameVi: "Nguồn phát hạt α (R)",
    nameEn: "Alpha particle source (R)",
    role: "Kí hiệu R (Hình 21.2 SGK tr. 91): Phát chùm hạt alpha mang điện tích dương (+2e, chính là hạt nhân nguyên tử He) bắn thẳng vào lá vàng D.",
    roleEn: "Emits positively charged alpha particles (helium-4 nuclei) directed at gold foil D",
    category: "source",
  },
  {
    id: "source-housing",
    nameVi: "Hộp chì che chắn nguồn (R)",
    nameEn: "Lead source housing (R)",
    role: "Khối chì bao quanh nguồn R (Hình 21.2 SGK): Hấp thụ hạt α bay lệch hướng, chỉ cho chùm hạt α hẹp phóng thẳng tới lá vàng D.",
    roleEn: "Contains and shields radioactive source R, allowing a narrow beam toward foil D",
    category: "source",
  },

  // Collimation
  {
    id: "collimator",
    nameVi: "Khe chuẩn trực chùm hạt α",
    nameEn: "Collimator slit",
    role: "Khe hẹp định hướng chùm hạt α mảnh, song song trước khi tới lá vàng D ở tâm hộp chân không G.",
    roleEn: "Creates a narrow parallel alpha beam directed at target foil D",
    category: "collimator",
  },

  // Target (D)
  {
    id: "gold-foil",
    nameVi: "Lá vàng rất mỏng (D)",
    nameEn: "Thin gold foil (D)",
    role: "Kí hiệu D (Hình 21.2 SGK tr. 91): Lá vàng rất mỏng (độ dày chỉ khoảng 4·10⁻⁷ m) đặt tại tâm hộp chân không G để khảo sát hạt α đi xuyên qua và tán xạ.",
    roleEn: "Scattering target — ultra-thin gold leaf (~4×10⁻⁷ m) at center of chamber G",
    category: "target",
  },
  {
    id: "foil-holder",
    nameVi: "Giá đỡ lá vàng (D)",
    nameEn: "Gold foil holder",
    role: "Khung và trụ đỡ giữ lá vàng mỏng D cố định thẳng đứng tại chính tâm vòng màn S.",
    roleEn: "Holds gold foil D fixed vertically at the center of the apparatus",
    category: "target",
  },

  // Detection (S & M)
  {
    id: "scintillation-screen",
    nameVi: "Màn huỳnh quang (S)",
    nameEn: "Fluorescent ZnS screen (S)",
    role: "Kí hiệu S (Hình 21.2 SGK tr. 91): Màn/kính có phủ chất huỳnh quang (ZnS) — mỗi khi một hạt α đập vào sẽ phát ra một đốm sáng lóe nhỏ để kính hiển vi M ghi nhận.",
    roleEn: "Screen coated with fluorescent zinc sulfide — emits a tiny light flash upon each alpha impact",
    category: "detector",
  },
  {
    id: "rotating-microscope",
    nameVi: "Kính hiển vi (M)",
    nameEn: "Rotating microscope (M)",
    role: "Kí hiệu M (Hình 21.2 SGK tr. 91): Kính hiển vi xoay quanh lá vàng D từ vị trí (1) (đối diện nguồn R, 0°) đến vị trí (2) (lệch > 90°) để quan sát và đếm các đốm sáng trên màn S.",
    roleEn: "Microscope rotating from position (1) to position (2) to observe flashes on screen S",
    category: "measurement",
  },
  {
    id: "angular-scale",
    nameVi: "Vòng chia độ góc lệch",
    nameEn: "Angular protractor scale",
    role: "Thước chia độ từ 0° đến 180° quanh trục lá vàng D giúp xác định góc quan sát của kính hiển vi M (vị trí (1) tại 0° và vị trí (2) tại góc > 90°).",
    roleEn: "Protractor ring measuring angular position of microscope M from 0° to 180°",
    category: "measurement",
  },

  // Structure (G & P)
  {
    id: "vacuum-chamber",
    nameVi: "Hộp chân không (G)",
    nameEn: "Vacuum chamber (G)",
    role: "Kí hiệu G (Hình 21.2 SGK tr. 91): Hộp kín đã rút chân không bao bọc nguồn R, lá vàng D và màn S để hạt α không va chạm với phân tử không khí.",
    roleEn: "Evacuated cylindrical chamber preventing alpha particles from colliding with air",
    category: "structure",
  },
  {
    id: "chamber-window",
    nameVi: "Thành quan sát hộp chân không (G)",
    nameEn: "Chamber transparent wall (G)",
    role: "Thành trong suốt (mở cắt lớp ở Hình 21.2a) giúp học sinh nhìn rõ cấu tạo R–D–S–M bên trong hộp chân không G.",
    roleEn: "Transparent / cutaway wall revealing R, D, S, M inside chamber G",
    category: "structure",
  },
  {
    id: "base-platform",
    nameVi: "Chân đế hộp chân không (P)",
    nameEn: "Pedestal stand & vacuum port (P)",
    role: "Kí hiệu P (Hình 21.2a SGK tr. 91): Chân đế vững chắc kèm ống dẫn hút chân không đỡ toàn bộ hộp G và trục xoay của kính hiển vi M.",
    roleEn: "Pedestal stand and vacuum port supporting chamber G and rotating microscope M",
    category: "structure",
  },
] as const;

/** Registry instance for Rutherford apparatus */
export const rutherfordRegistry = createComponentRegistry(RUTHERFORD_COMPONENTS);

/** Get component by ID with type safety */
export function getRutherfordComponent(id: string): ApparatusComponent | undefined {
  return rutherfordRegistry.getById(id);
}

/** Get all components by category */
export function getRutherfordByCategory(
  category: ApparatusComponent["category"],
): readonly ApparatusComponent[] {
  return rutherfordRegistry.getByCategory(category);
}

/**
 * 4 bộ phận cốt lõi R–D–S–M (kèm G, P bổ trợ) đối chiếu trực tiếp Hình 21.2 SGK Vật lí 12 KNTT (tr. 91)
 */
export interface CoreSgk212PartSpec {
  readonly partId: string;
  readonly sgkSymbol: "R" | "D" | "S" | "M" | "G" | "P";
  readonly isPrimaryRDSM: boolean;
  readonly buttonLabel: string;
  readonly shortName: string;
  readonly questionCue: string;
  readonly detailRole: string;
}

export const CORE_SGK_21_2_PARTS: readonly CoreSgk212PartSpec[] = [
  {
    partId: "alpha-source",
    sgkSymbol: "R",
    isPrimaryRDSM: true,
    buttonLabel: "R · Nguồn hạt α",
    shortName: "Nguồn hạt α",
    questionCue: "Phát chùm hạt α (+2e)",
    detailRole:
      "Nguồn R phát chùm hạt alpha mang điện tích dương (hạt nhân nguyên tử He) bắn thẳng tới lá vàng D.",
  },
  {
    partId: "gold-foil",
    sgkSymbol: "D",
    isPrimaryRDSM: true,
    buttonLabel: "D · Lá vàng mỏng",
    shortName: "Lá vàng",
    questionCue: "Bia tán xạ ~4·10⁻⁷ m",
    detailRole:
      "Lá vàng D rất mỏng (độ dày cỡ 4·10⁻⁷ m) đặt tại tâm hộp chân không G để chùm hạt α đi qua.",
  },
  {
    partId: "scintillation-screen",
    sgkSymbol: "S",
    isPrimaryRDSM: true,
    buttonLabel: "S · Màn huỳnh quang",
    shortName: "Màn huỳnh quang",
    questionCue: "Phát đốm lóe khi hạt α chạm",
    detailRole:
      "Kính/màn S phủ chất huỳnh quang (ZnS): mỗi khi một hạt α đập vào sẽ xuất hiện một đốm sáng lóe nhỏ rồi tắt.",
  },
  {
    partId: "rotating-microscope",
    sgkSymbol: "M",
    isPrimaryRDSM: true,
    buttonLabel: "M · Kính hiển vi",
    shortName: "Kính hiển vi",
    questionCue: "Xoay từ (1) đến (2) quan sát",
    detailRole:
      "Kính hiển vi M xoay quanh lá vàng D từ vị trí (1) (đối diện R, 0°) đến vị trí (2) (lệch > 90°) để quan sát đốm sáng trên màn S.",
  },
  {
    partId: "vacuum-chamber",
    sgkSymbol: "G",
    isPrimaryRDSM: false,
    buttonLabel: "G · Hộp chân không",
    shortName: "Hộp chân không",
    questionCue: "Ngăn va chạm với không khí",
    detailRole:
      "Hộp chân không G bao kín R, D, S để hạt α không bị cản trở hay lệch hướng do phân tử không khí.",
  },
  {
    partId: "base-platform",
    sgkSymbol: "P",
    isPrimaryRDSM: false,
    buttonLabel: "P · Chân đế",
    shortName: "Chân đế",
    questionCue: "Đỡ hộp G & ống hút chân không",
    detailRole:
      "Chân đế P (Hình 21.2a) giữ cố định hộp chân không G và trục xoay của kính hiển vi M.",
  },
] as const;

/** Các bộ phận vỏ ngoài ẩn khi bật góc Cắt lớp (cutaway) để lộ trọn R–D–S–M trên bệ P */
export const CUTAWAY_HIDDEN_PARTS: readonly string[] = [
  "vacuum-chamber",
  "chamber-window",
] as const;

/**
 * Ưu tiên chọn linh kiện chức năng bên trong (R, D, S, M) xuyên qua thành kính trong suốt của hộp G.
 */
const OUTER_SHELL_PART_IDS = new Set([
  "chamber-window",
  "vacuum-chamber",
  "base-platform",
]);

const PRIMARY_RDSM_PART_IDS = new Set([
  "alpha-source",
  "gold-foil",
  "scintillation-screen",
  "rotating-microscope",
]);

export function resolveRutherfordRaycastPart(
  hitPartIdsInDepthOrder: readonly string[],
): string | null {
  if (hitPartIdsInDepthOrder.length === 0) return null;
  const primaryHit = hitPartIdsInDepthOrder.find((id) => PRIMARY_RDSM_PART_IDS.has(id));
  if (primaryHit) return primaryHit;
  const innerHit = hitPartIdsInDepthOrder.find((id) => !OUTER_SHELL_PART_IDS.has(id));
  return innerHit ?? hitPartIdsInDepthOrder[0] ?? null;
}

/**
 * Mô tả hiện tượng quan sát qua kính hiển vi M theo góc đặt kính (0°..160°)
 * Đối chiếu đúng Hình 21.2b SGK Vật lí 12 tr. 91:
 *   - Vị trí (1): 0° (gần hướng tới của chùm hạt α, đối diện nguồn R) — tần suất đốm sáng lớn nhất
 *   - Góc trung gian: tần suất giảm rất nhanh khi tăng góc lệch
 *   - Vị trí (2): ở góc lớn (> 90°, lệch ngược về phía nguồn R) — vẫn có đốm sáng nhưng tần suất nhỏ hơn vị trí (1) cỡ 10⁴ lần
 */
export interface ObserverPositionSummary {
  readonly angleDeg: number;
  readonly zone: "position_1" | "intermediate" | "position_2";
  readonly shortBadge: string;
  readonly positionTitle: string;
  readonly relativeFrequencyLabel: string;
  readonly sampleFlashCount: number;
  readonly physicalMeaning: string;
}

export function describeObserverPosition(rawAngleDeg: number): ObserverPositionSummary {
  const angleDeg = Math.max(0, Math.min(160, Math.round(rawAngleDeg)));
  if (angleDeg <= 15) {
    return {
      angleDeg,
      zone: "position_1",
      shortBadge: "Vị trí (1) · gần hướng tới",
      positionTitle: `Vị trí (1) · Gần hướng tới chùm hạt α (${angleDeg}°, đối diện nguồn R)`,
      relativeFrequencyLabel: "Tần suất đốm lóe trên màn S lớn nhất (chuẩn so sánh = 1; ~10 000 đốm / 10 s)",
      sampleFlashCount: 28,
      physicalMeaning:
        "Hầu hết hạt α đi thẳng xuyên qua lá vàng D tới vị trí (1) chứng tỏ phần lớn không gian nguyên tử vàng là khoảng trống.",
    };
  }
  if (angleDeg <= 90) {
    const sampleFlashCount = angleDeg <= 45 ? 6 : 2;
    return {
      angleDeg,
      zone: "intermediate",
      shortBadge: `Giữa (1) và (2) · ${angleDeg}°`,
      positionTitle: `Góc lệch trung gian (${angleDeg}° · di chuyển từ (1) sang (2))`,
      relativeFrequencyLabel:
        angleDeg <= 45
          ? "Tần suất đốm lóe trên màn S giảm rất nhanh so với vị trí (1)"
          : "Đốm lóe trên màn S rất thưa khi tiến gần 90°",
      sampleFlashCount,
      physicalMeaning:
        "Một số hạt α đi gần tâm mang điện dương chịu lực đẩy tĩnh điện Coulomb nên bị lệch hướng chuyển động.",
    };
  }
  return {
    angleDeg,
    zone: "position_2",
    shortBadge: "Vị trí (2) · ở góc lớn",
    positionTitle: `Vị trí (2) · Ở góc lớn > 90° về phía nguồn R (${angleDeg}°)`,
    relativeFrequencyLabel: "Ít hơn vị trí (1) cỡ 10⁴ lần (tỉ lệ ~10⁻⁴, chỉ ~1 trong 10 000 hạt α)",
    sampleFlashCount: 1,
    physicalMeaning:
      "Theo SGK Vật lí 12 tr. 91–92, tại vị trí (2) ở góc lệch lớn vẫn xuất hiện đốm sáng trên màn S nhưng tần suất ít hơn vị trí (1) cỡ 10⁴ lần — chứng tỏ điện tích dương và gần như toàn bộ khối lượng nguyên tử tập trung ở hạt nhân rất nhỏ.",
  };
}

/**
 * Lấy mẫu tất định (có seed lặp lại được) số đốm sáng đếm được trong cùng khoảng thời gian Δt = 10 s
 */
export interface EqualTimeFlashSample {
  readonly durationSec: 10;
  readonly angleDeg: number;
  readonly zone: "position_1" | "intermediate" | "position_2";
  readonly count: number;
  readonly expectedCount: number;
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

export function sampleEqualTimeFlashCount(
  rawAngleDeg: number,
  seed: number,
): EqualTimeFlashSample {
  const angleDeg = Math.max(0, Math.min(160, Math.round(rawAngleDeg)));
  const rng = mulberry32((seed * 2654435761 + angleDeg * 97) >>> 0);

  if (angleDeg <= 15) {
    const expectedCount = 10000;
    let uSum = 0;
    for (let i = 0; i < 12; i++) uSum += rng();
    const z = uSum - 6;
    const count = Math.max(9600, Math.round(expectedCount + z * 100));
    return { durationSec: 10, angleDeg, zone: "position_1", count, expectedCount };
  }

  if (angleDeg <= 90) {
    const expectedCount = angleDeg <= 45 ? 220 : 12;
    const L = Math.exp(-expectedCount);
    let k = 0;
    let p = 1;
    if (expectedCount <= 30) {
      do {
        k++;
        p *= Math.max(1e-9, rng());
      } while (p > L);
      const count = Math.max(1, k - 1);
      return { durationSec: 10, angleDeg, zone: "intermediate", count, expectedCount };
    }
    let uSum = 0;
    for (let i = 0; i < 12; i++) uSum += rng();
    const count = Math.max(1, Math.round(expectedCount + (uSum - 6) * Math.sqrt(expectedCount)));
    return { durationSec: 10, angleDeg, zone: "intermediate", count, expectedCount };
  }

  const expectedCount = 1;
  const L = Math.exp(-expectedCount);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.max(1e-9, rng());
  } while (p > L);
  const count = Math.max(1, k - 1);
  return { durationSec: 10, angleDeg, zone: "position_2", count, expectedCount };
}

/** Khóa lưu trữ bền vững trạng thái Rutherford V3 & hai lượt khảo sát độc lập */
export const RUTHERFORD_V3_STORAGE_KEY = "b21-rutherford-v3-state-v1";

export interface RutherfordV3PersistedState {
  readonly impactFm: number;
  readonly energyMeV: number;
  readonly cameraMode: CameraMode;
  readonly selectedPartId: string | null;
  readonly showScintillation: boolean;
  /** Bật/tắt chế độ “Mô hình giải thích” (đường đi hạt α + cung & nhãn góc lệch θ) */
  readonly showBeam: boolean;
  readonly observerAngleDeg: number;
  readonly countPos1?: number | null;
  readonly countPos2?: number | null;
  readonly countTrialSeed?: number;
  readonly prediction: RutherfordPrediction | "";
  readonly run1: InquiryRun | null;
  readonly run2: InquiryRun | null;
  readonly lastCapturedSlot: RunSlot | null;
  readonly conclusion: string;
  readonly explanationSubmitted?: boolean;
}

export const INITIAL_RUTHERFORD_V3_STATE: RutherfordV3PersistedState = {
  impactFm: 15,
  energyMeV: 8,
  cameraMode: "orbit",
  selectedPartId: null,
  showScintillation: true,
  showBeam: true,
  observerAngleDeg: 0,
  countPos1: null,
  countPos2: null,
  countTrialSeed: 1,
  prediction: "",
  run1: null,
  run2: null,
  lastCapturedSlot: null,
  conclusion: "",
  explanationSubmitted: false,
};

/**
 * Kiểm tra an toàn khả năng tạo ngữ cảnh WebGL trước khi khởi tạo THREE.WebGLRenderer
 * để tránh ném ngoại lệ làm sập trang trên trình duyệt tắt hoặc thiếu WebGL.
 */
export function probeWebGLSupport(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("experimental-webgl");
    if (!gl) return false;
    const loseExt = (gl as WebGLRenderingContext).getExtension?.("WEBGL_lose_context");
    loseExt?.loseContext();
    return true;
  } catch {
    return false;
  }
}

const VALID_CAMERA_MODES: readonly CameraMode[] = [
  "orbit",
  "front",
  "back",
  "left",
  "right",
  "top",
  "cutaway",
  "exploded",
  "instrument",
  "measurement",
];

function cloneValidInquiryRun(v: unknown): InquiryRun | null {
  if (!v || typeof v !== "object") return null;
  const r = v as Record<string, unknown>;
  if (
    typeof r.b === "number" &&
    Number.isFinite(r.b) &&
    typeof r.e === "number" &&
    Number.isFinite(r.e) &&
    typeof r.theta === "number" &&
    Number.isFinite(r.theta)
  ) {
    // Tạo bản sao độc lập tuyệt đối cho từng lượt khảo sát
    return {
      b: Number(r.b),
      e: Number(r.e),
      theta: Number(r.theta),
    };
  }
  return null;
}

export function parseRutherfordV3State(raw: string): RutherfordV3PersistedState {
  if (!raw) return INITIAL_RUTHERFORD_V3_STATE;
  try {
    const p = JSON.parse(raw) as Partial<RutherfordV3PersistedState>;
    const impactFm =
      typeof p.impactFm === "number" && Number.isFinite(p.impactFm)
        ? Math.max(RUTHERFORD_LIMITS.impactFm.min, Math.min(RUTHERFORD_LIMITS.impactFm.max, p.impactFm))
        : INITIAL_RUTHERFORD_V3_STATE.impactFm;
    const energyMeV =
      typeof p.energyMeV === "number" && Number.isFinite(p.energyMeV)
        ? Math.max(RUTHERFORD_LIMITS.energyMeV.min, Math.min(RUTHERFORD_LIMITS.energyMeV.max, p.energyMeV))
        : INITIAL_RUTHERFORD_V3_STATE.energyMeV;
    const cameraMode =
      typeof p.cameraMode === "string" && VALID_CAMERA_MODES.includes(p.cameraMode as CameraMode)
        ? (p.cameraMode as CameraMode)
        : INITIAL_RUTHERFORD_V3_STATE.cameraMode;
    const selectedPartId =
      typeof p.selectedPartId === "string" && RUTHERFORD_COMPONENTS.some((c) => c.id === p.selectedPartId)
        ? p.selectedPartId
        : null;
    const showScintillation =
      typeof p.showScintillation === "boolean"
        ? p.showScintillation
        : INITIAL_RUTHERFORD_V3_STATE.showScintillation;
    const showBeam =
      typeof p.showBeam === "boolean" ? p.showBeam : INITIAL_RUTHERFORD_V3_STATE.showBeam;
    const observerAngleDeg =
      typeof p.observerAngleDeg === "number" && Number.isFinite(p.observerAngleDeg)
        ? Math.max(0, Math.min(160, Math.round(p.observerAngleDeg)))
        : INITIAL_RUTHERFORD_V3_STATE.observerAngleDeg;
    const countPos1 =
      typeof p.countPos1 === "number" && Number.isFinite(p.countPos1) && p.countPos1 >= 0
        ? Math.round(p.countPos1)
        : null;
    const countPos2 =
      typeof p.countPos2 === "number" && Number.isFinite(p.countPos2) && p.countPos2 >= 0
        ? Math.round(p.countPos2)
        : null;
    const countTrialSeed =
      typeof p.countTrialSeed === "number" && Number.isFinite(p.countTrialSeed) && p.countTrialSeed >= 1
        ? Math.floor(p.countTrialSeed)
        : 1;
    const prediction: RutherfordPrediction | "" =
      p.prediction === "increase" || p.prediction === "decrease" || p.prediction === "unchanged"
        ? p.prediction
        : "";
    const run1 = cloneValidInquiryRun(p.run1);
    const run2 = cloneValidInquiryRun(p.run2);
    const lastCapturedSlot: RunSlot | null =
      p.lastCapturedSlot === 1 || p.lastCapturedSlot === 2 ? p.lastCapturedSlot : null;
    const conclusion =
      typeof p.conclusion === "string" ? p.conclusion.slice(0, 2000) : "";
    const explanationSubmitted =
      typeof p.explanationSubmitted === "boolean"
        ? p.explanationSubmitted && conclusion.trim().length > 0
        : conclusion.trim().length > 0;

    return {
      impactFm,
      energyMeV,
      cameraMode,
      selectedPartId,
      showScintillation,
      showBeam,
      observerAngleDeg,
      countPos1,
      countPos2,
      countTrialSeed,
      prediction,
      run1,
      run2,
      lastCapturedSlot,
      conclusion,
      explanationSubmitted,
    };
  } catch {
    return INITIAL_RUTHERFORD_V3_STATE;
  }
}
