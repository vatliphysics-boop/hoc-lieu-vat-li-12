import type { CanonicalActivityKey, NuclearPhysicsLessonCode } from "./curriculum";
import { validateTeachingPlan, type PlanActivity, type PlanPhase, type TeachingPlan } from "./teaching-plan";

export type LessonStudyPhase = "before" | "in_class" | "after";

export interface StudyPhaseMeta {
  readonly id: LessonStudyPhase;
  readonly shortLabel: string;
  readonly fullLabel: string;
  readonly planPhase: PlanPhase;
}

export const CHAPTER4_PHASES: readonly StudyPhaseMeta[] = [
  {
    id: "before",
    shortLabel: "Trước giờ học",
    fullLabel: "Trước giờ học: Tự nghiên cứu",
    planPhase: "before_class",
  },
  {
    id: "in_class",
    shortLabel: "Trong giờ học",
    fullLabel: "Trong giờ học: Khám phá và thảo luận",
    planPhase: "in_class",
  },
  {
    id: "after",
    shortLabel: "Sau giờ học",
    fullLabel: "Sau giờ học: Vận dụng và đánh giá",
    planPhase: "after_class",
  },
] as const;

export function getPhaseMeta(phase: LessonStudyPhase): StudyPhaseMeta {
  return CHAPTER4_PHASES.find((item) => item.id === phase) ?? CHAPTER4_PHASES[0];
}

export type Chapter4SectionKind =
  | "b21_pre_rutherford"
  | "b21_rutherford_v3"
  | "b21_atomic_models"
  | "b21_structure_size"
  | "b21_symbol_isotopes"
  | "b21_after_transfer"
  | "b22_blackett_track"
  | "b22_conservation"
  | "b22_binding_energy"
  | "b22_fission"
  | "b22_fusion"
  | "b22_after_transfer"
  | "b23_cloud_geiger"
  | "b23_radiation_types"
  | "b23_half_life"
  | "b23_safety"
  | "b23_carbon14"
  | "b24_energy_chain"
  | "b24_reactor_control"
  | "b24_medicine"
  | "b24_bio_food"
  | "b24_after_transfer"
  | "b25_electroscope"
  | "b25_table_25_1"
  | "b25_equations_energy"
  | "b25_after_transfer";

export interface SectionTeacherGuide {
  readonly learningObjective: string;
  readonly projectorStrategy: string;
  readonly openQuestions: readonly string[];
  readonly commonMisconceptions: string;
  readonly noVideoFallback: string;
  readonly completionCriteriaNote: string;
}

export interface LessonGoalsSpec {
  readonly knowledge: string;
  readonly competence: string;
  readonly quality: string;
}

export interface SgkTable21Row {
  readonly elementName: string;
  readonly symbol: string;
  readonly z: number;
  readonly massNumberA: number;
  /** Bán kính nguyên tử theo đơn vị 10⁻¹⁰ m (SGK tr. 94) */
  readonly atomicRadius10m10: string;
  /** Bán kính hạt nhân thực nghiệm theo đơn vị 10⁻¹⁵ m (SGK tr. 94) */
  readonly nuclearRadius10m15: string;
  /** Bán kính tính theo công thức R = 1,2·10⁻¹⁵·A¹/³ (đơn vị 10⁻¹⁵ m) */
  readonly formulaRadius10m15: string;
}

export const SGK_B21_MASS_CONSTANTS = {
  protonKg: "1,67262 × 10⁻²⁷ kg",
  neutronKg: "1,67493 × 10⁻²⁷ kg",
  amuKg: "1,66054 × 10⁻²⁷ kg",
} as const;

/** Đủ 8 dòng Bảng 21.1 — Kích thước của một số hạt nhân (SGK Vật lí 12 Kết nối tri thức, tr. 94) */
export const SGK_TABLE_21_1: readonly SgkTable21Row[] = [
  { elementName: "Hydrogen", symbol: "H", z: 1, massNumberA: 1, atomicRadius10m10: "1,2", nuclearRadius10m15: "0,9", formulaRadius10m15: "1,2" },
  { elementName: "Helium", symbol: "He", z: 2, massNumberA: 4, atomicRadius10m10: "1,4", nuclearRadius10m15: "1,7", formulaRadius10m15: "1,9" },
  { elementName: "Oxigen", symbol: "O", z: 8, massNumberA: 16, atomicRadius10m10: "1,5", nuclearRadius10m15: "2,7", formulaRadius10m15: "3,0" },
  { elementName: "Silicon", symbol: "Si", z: 14, massNumberA: 28, atomicRadius10m10: "2,1", nuclearRadius10m15: "3,1", formulaRadius10m15: "3,6" },
  { elementName: "Sắt", symbol: "Fe", z: 26, massNumberA: 56, atomicRadius10m10: "1,9", nuclearRadius10m15: "3,7", formulaRadius10m15: "4,6" },
  { elementName: "Cadimium", symbol: "Cd", z: 48, massNumberA: 114, atomicRadius10m10: "1,6", nuclearRadius10m15: "4,6", formulaRadius10m15: "5,8" },
  { elementName: "Vàng", symbol: "Au", z: 79, massNumberA: 197, atomicRadius10m10: "1,7", nuclearRadius10m15: "5,4", formulaRadius10m15: "7,0" },
  { elementName: "Uranium", symbol: "U", z: 92, massNumberA: 238, atomicRadius10m10: "1,9", nuclearRadius10m15: "5,9", formulaRadius10m15: "7,4" },
] as const;

export interface Chapter4SectionSpec {
  readonly id: string;
  readonly kind: Chapter4SectionKind;
  readonly phase: LessonStudyPhase;
  readonly title: string;
  readonly shortTocTitle: string;
  readonly sgkPages: string;
  readonly minutes: number;
  /** Hiện tượng học sinh cần khám phá */
  readonly phenomenonPrompt: string;
  /** Bằng chứng học sinh cần ghi lại */
  readonly evidencePrompt: string;
  /** Mã hoạt động mô phỏng chuẩn (giữ nguyên hợp đồng FixedPhysicsActivityRenderer) */
  readonly activityKey?: CanonicalActivityKey;
  /** Gợi ý tổ chức dành riêng cho giáo viên */
  readonly teacherTip: string;
  /** Hướng dẫn sư phạm chi tiết cho Chế độ Giáo viên (tùy chọn) */
  readonly teacherGuide?: SectionTeacherGuide;
  /** Liên kết Video Flow tùy chọn — chỉ hiển thị nút phát khi có URL thật */
  readonly flowVideoUrl?: string;
}

export interface Chapter4LessonSpec {
  readonly code: NuclearPhysicsLessonCode;
  readonly number: number;
  readonly title: string;
  readonly sgkPages: string;
  /** Câu hỏi dẫn ở Kho học liệu và đầu Trang bài học */
  readonly guidingQuestion: string;
  readonly hubHighlight: string;
  readonly lessonGoals?: LessonGoalsSpec;
  readonly sections: readonly Chapter4SectionSpec[];
}

export const CHAPTER4_LESSONS: readonly Chapter4LessonSpec[] = [
  {
    code: "B21",
    number: 21,
    title: "Cấu trúc hạt nhân",
    sgkPages: "SGK tr. 91–95",
    guidingQuestion:
      "Từ những đốm sáng trên màn, làm sao biết nguyên tử có một hạt nhân rất nhỏ?",
    hubHighlight:
      "Bộ thiết bị tán xạ hạt alpha Rutherford V3, đối chiếu 3 mô hình nguyên tử, cấu tạo hạt nhân Silic-28, đủ 8 dòng Bảng 21.1 và đồng vị Hydrogen.",
    lessonGoals: {
      knowledge:
        "Trình bày được thí nghiệm tán xạ hạt alpha của Rutherford (Hình 21.2: R, D, S, M), rút ra mô hình hành tinh nguyên tử; nêu được cấu tạo hạt nhân từ proton và neutron (nucleon), đơn vị amu, công thức R = 1,2·10⁻¹⁵·A¹/³ (m), Bảng 21.1, kí hiệu hạt nhân ᴬᶻX và đồng vị (SGK Vật lí 12, tr. 91–95).",
      competence:
        "Nhận diện được 4 bộ phận R–D–S–M và vị trí (1), (2); khóa dự đoán ban đầu trước giờ học; thực hiện hai lượt đo cùng E khác b trên Rutherford 3D để đối chiếu dự đoán; dựng ²⁸₁₄Si, đọc đủ 8 dòng Bảng 21.1 đúng đơn vị, khảo sát ¹H, ²H, ³H bằng N = A − Z và giải bài toán vận dụng ²⁷₁₃Al.",
      quality:
        "Trung thực giữ nguyên dự đoán ban đầu để đối chiếu khoa học; cẩn trọng với đơn vị vi mô (10⁻¹⁰ m và 10⁻¹⁵ m).",
    },
    sections: [
      {
        id: "b21-pre-setup",
        kind: "b21_pre_rutherford",
        phase: "before",
        title: "Nhận diện bộ thí nghiệm tán xạ hạt alpha và ghi dự đoán",
        shortTocTitle: "Nhận diện thiết bị & dự đoán",
        sgkPages: "tr. 91–92",
        minutes: 15,
        phenomenonPrompt:
          "Tìm hiểu mô hình nguyên tử Thomson ở Hình 21.1 và nhận diện 4 bộ phận R–D–S–M cùng vị trí (1), (2) trên bộ thí nghiệm tán xạ hạt α ở Hình 21.2.",
        evidencePrompt:
          "Ghép đúng vai trò 4 bộ phận R–D–S–M, ghi dự đoán kèm lí do để khóa bản đầu và hoàn thành câu tự kiểm tra Pha 1.",
        teacherTip:
          "Giao trước giờ học (15 phút). Đầu tiết mở nhanh dự đoán đã khóa của học sinh để tạo tình huống mâu thuẫn nhận thức cho Pha 2.",
        teacherGuide: {
          learningObjective:
            "Từ mô hình Thomson (Hình 21.1), nêu được dự đoán kèm lí do về đường đi của hạt α, nhận diện đúng 4 bộ phận R–D–S–M trên Hình 21.2 và phân biệt đốm sáng trên màn S với quỹ đạo giải thích.",
          projectorStrategy:
            "Chiếu sơ đồ Hình 21.1 cạnh Hình 21.2a–21.2b; gọi học sinh đối chiếu bản dự đoán đầu tiên đã khóa.",
          openQuestions: [
            "Nếu điện tích dương trải đều khắp nguyên tử như Hình 21.1 thì hạt α có thể bị bật ngược về vị trí (2) không?",
            "Mắt người quan sát qua kính hiển vi M nhìn thấy gì trực tiếp trên màn S?",
          ],
          commonMisconceptions:
            "Học sinh dễ tưởng mắt nhìn thấy đường bay của hạt α hoặc sửa lại dự đoán ban đầu sau khi xem kết quả. Hệ thống khóa giữ nguyên bản dự đoán chốt lần đầu để đối chiếu ở Pha 2 và Pha 3.",
          noVideoFallback:
            "Hoàn thành trọn vẹn 100% Pha 1 từ sơ đồ Hình 21.1, Hình 21.2a–21.2b và câu hỏi tương tác ngay trên trang mà không phụ thuộc video.",
          completionCriteriaNote:
            "Chỉ ghi nhận hoàn thành khi đủ cả 3 tiêu chí: (1) khóa dự đoán + lí do, (2) ghép đúng 4/4 bộ phận R–D–S–M, (3) trả lời đúng câu tự kiểm tra.",
        },
      },
      {
        id: "b21-rutherford-v3",
        kind: "b21_rutherford_v3",
        phase: "in_class",
        title: "Thí nghiệm tán xạ hạt alpha (Rutherford V3)",
        shortTocTitle: "Thí nghiệm tán xạ hạt alpha",
        sgkPages: "tr. 91–92",
        minutes: 15,
        phenomenonPrompt:
          "Khảo sát thiết bị Rutherford 3D (R–D–S–M, góc toàn cảnh, cắt lớp, qua kính hiển vi tại vị trí (1) và (2)), chạy bắn hạt α tới màn S và lưu hai lượt đo cùng E khác b.",
        evidencePrompt:
          "Lưu độc lập Lượt 1 và Lượt 2 (cùng động năng E, khác tham số va chạm b), đối chiếu ngay với dự đoán đã khóa ở Pha 1 và viết lời giải thích dựa trên kết quả quan sát.",
        activityKey: "rutherford_alpha_scattering",
        teacherTip:
          "Chiếu thiết bị 3D lên màn hình lớp: cho học sinh xoay 360°, chuyển góc Cắt lớp và Qua kính hiển vi M ở vị trí (1) và (2), sau đó bật chế độ Mô hình giải thích để thấy nhãn đường đi và góc lệch θ.",
        teacherGuide: {
          learningObjective:
            "Thực hiện trọn vẹn hai lượt khảo sát cùng E khác b trên thiết bị Rutherford 3D, đối chiếu dự đoán Pha 1 và giải thích 3 câu hỏi thảo luận SGK tr. 92.",
          projectorStrategy:
            "Tắt lớp Mô hình giải thích trước để học sinh chỉ quan sát đốm lóe trên màn S ở vị trí (1) và (2), sau đó bật lớp Mô hình giải thích để phân tích đường đi và góc lệch θ.",
          openQuestions: [
            "Vì sao tần suất đốm lóe ở vị trí (1) lớn nhất còn ở vị trí (2) nhỏ hơn cỡ 10⁴ lần?",
            "Khi giữ nguyên E và giảm b (hạt α đi sát tâm hơn), góc lệch θ thay đổi như thế nào?",
          ],
          commonMisconceptions:
            "Học sinh dễ đổi cả E và b cùng lúc hoặc nhầm 1 tia đơn lẻ với tần suất cả chùm hạt. Giao diện tự cảnh báo lượt cần đo lại khi khác E hoặc trùng b.",
          noVideoFallback:
            "Sử dụng trực tiếp thiết bị Rutherford 3D và phiếu khảo sát hai lượt ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi chọn dự đoán, lưu đủ 2 lượt hợp lệ (cùng E, khác b) và viết lời giải thích.",
        },
      },
      {
        id: "b21-atomic-models",
        kind: "b21_atomic_models",
        phase: "in_class",
        title: "So sánh các mô hình nguyên tử",
        shortTocTitle: "So sánh các mô hình nguyên tử",
        sgkPages: "tr. 91–93",
        minutes: 10,
        phenomenonPrompt:
          "Đối chiếu trên cùng một nguyên tử Hydrogen trung hòa (¹₁H): mô hình Thomson (Hình 21.1), mô hình hành tinh nguyên tử Rutherford (Hình 21.5a) và mô hình đám mây electron (Hình 21.5b).",
        evidencePrompt:
          "Chọn mô hình được chứng minh trực tiếp từ kết quả tán xạ lá vàng, viết câu giải thích và phân biệt với mô hình đám mây electron.",
        teacherTip:
          "Bật “Đặt Thomson – Rutherford cạnh nhau” để thấy điện tích dương thu gọn về hạt nhân nhỏ ở tâm, sau đó chuyển sang Đám mây electron lấy +1 mẫu rồi +100 mẫu.",
        teacherGuide: {
          learningObjective:
            "So sánh được phân bố điện tích dương và mô tả electron giữa Thomson, hành tinh nguyên tử Rutherford và đám mây electron.",
          projectorStrategy:
            "Đặt Thomson – Rutherford song song trước, rồi lấy mẫu vị trí electron ở mô hình đám mây 1s.",
          openQuestions: [
            "Điểm chung cốt lõi về hạt nhân giữa Hình 21.5a và Hình 21.5b là gì?",
            "Mỗi chấm trên đám mây electron biểu diễn điều gì?",
          ],
          commonMisconceptions:
            "Tránh hiểu lầm 1 electron bị nhòe ra thành đám mây vật chất liên tục; đám mây biểu diễn mật độ xác suất có mặt của electron.",
          noVideoFallback:
            "Thao tác trực tiếp trên bàn so sánh 3 mô hình nguyên tử và bảng đối chiếu SGK tr. 91–93.",
          completionCriteriaNote:
            "Hoàn thành khi thao tác trên khung mô phỏng, chọn đúng mô hình Rutherford và lưu câu giải thích.",
        },
      },
      {
        id: "b21-structure-size",
        kind: "b21_structure_size",
        phase: "in_class",
        title: "Cấu tạo và kích thước hạt nhân",
        shortTocTitle: "Cấu tạo và kích thước hạt nhân",
        sgkPages: "tr. 93–94",
        minutes: 15,
        phenomenonPrompt:
          "Dựng hạt nhân Silicon-28 (²⁸₁₄Si) với 14 proton và 14 neutron (Hình 21.6), đọc đủ 8 dòng Bảng 21.1 đúng đơn vị (10⁻¹⁰ m và 10⁻¹⁵ m) và kiểm chứng công thức R = 1,2·10⁻¹⁵·A¹/³ (m).",
        evidencePrompt:
          "Dựng ²⁸₁₄Si (14 proton, 14 neutron), đọc chính xác số liệu Bảng 21.1 kèm đơn vị và giải thích sự khác biệt tỉ lệ phóng đại.",
        activityKey: "nuclear_structure_builder",
        teacherTip:
          "Cho học sinh bấm từng dòng trong đủ 8 dòng Bảng 21.1 để đọc đúng đơn vị lũy thừa ở tiêu đề cột (10⁻¹⁰ m cho nguyên tử và 10⁻¹⁵ m cho hạt nhân).",
        teacherGuide: {
          learningObjective:
            "Nêu được cấu tạo hạt nhân từ proton và neutron, đơn vị amu, đọc đủ 8 dòng Bảng 21.1 đúng đơn vị và vận dụng công thức (21.1).",
          projectorStrategy:
            "Chiếu Bảng 21.1 tương tác 8 dòng và bộ dựng hạt nhân ²⁸₁₄Si ngay bên dưới.",
          openQuestions: [
            "Bán kính nguyên tử Silicon lớn gấp bao nhiêu lần bán kính hạt nhân Silicon theo Bảng 21.1?",
            "Vì sao công thức (21.1) cho kết quả phù hợp hơn với A > 12?",
          ],
          commonMisconceptions:
            "Học sinh hay quên nhân 10⁻¹⁰ m hoặc 10⁻¹⁵ m khi đọc số trong Bảng 21.1. Giao diện buộc kiểm tra đúng đơn vị của cả hai cột.",
          noVideoFallback:
            "Dùng trực tiếp Bảng 21.1 tương tác 8 dòng, sơ đồ Hình 21.6–21.7 và bộ dựng ²⁸₁₄Si.",
          completionCriteriaNote:
            "Hoàn thành khi hoàn tất bài đọc Bảng 21.1 hoặc hoàn thành bộ dựng hạt nhân ²⁸₁₄Si.",
        },
      },
      {
        id: "b21-symbol-isotopes",
        kind: "b21_symbol_isotopes",
        phase: "in_class",
        title: "Kí hiệu hạt nhân và đồng vị",
        shortTocTitle: "Kí hiệu hạt nhân và đồng vị",
        sgkPages: "tr. 94–95",
        minutes: 12,
        phenomenonPrompt:
          "Đọc kí hiệu hạt nhân ᴬᶻX (và dạng gọn ᴬX), khảo sát ba đồng vị ¹H, ²H, ³H của Hydrogen bằng công thức N = A − Z.",
        evidencePrompt:
          "Tính đúng số neutron N = A − Z cho cả ba đồng vị ¹₁H, ²₁H, ³₁H và giải thích vì sao ba hạt nhân thuộc cùng một nguyên tố nhưng khác khối lượng riêng.",
        activityKey: "isotope_and_nuclear_size",
        teacherTip:
          "Yêu cầu học sinh tự tính N = A − Z cho ¹H, ²H, ³H và bấm khảo sát đủ 3 đồng vị Hydrogen trên bàn thực hành.",
        teacherGuide: {
          learningObjective:
            "Viết và đọc đúng kí hiệu ᴬᶻX, tính N = A − Z và phân biệt các đồng vị bền / phóng xạ qua ví dụ ¹H, ²H, ³H và ¹²C, ¹³C, ¹⁴C.",
          projectorStrategy:
            "Cho học sinh điền nhanh N = A − Z của ¹H, ²H, ³H rồi bấm khảo sát trực quan trên bàn đồng vị.",
          openQuestions: [
            "Ba đồng vị ¹₁H, ²₁H, ³₁H giống nhau ở hạt nào và khác nhau ở hạt nào?",
            "Tại sao các chất cấu tạo từ cùng một nguyên tố nhưng khối lượng riêng vẫn có thể khác nhau?",
          ],
          commonMisconceptions:
            "Học sinh dễ nhầm chỉ số trên A là số neutron thay vì tổng số nucleon (phải tính N = A − Z).",
          noVideoFallback:
            "Thực hành trực tiếp trên phiếu N = A − Z của ¹H, ²H, ³H và bàn khảo sát đồng vị.",
          completionCriteriaNote:
            "Hoàn thành khi tính đúng N = A − Z cho ba đồng vị ¹H, ²H, ³H hoặc hoàn tất bàn khảo sát đồng vị.",
        },
      },
      {
        id: "b21-after-transfer",
        kind: "b21_after_transfer",
        phase: "after",
        title: "Kiểm tra, đánh giá: Thay lá vàng bằng lá nhôm mỏng ²⁷₁₃Al",
        shortTocTitle: "Kiểm tra, đánh giá (²⁷₁₃Al)",
        sgkPages: "tr. 95 · Vận dụng",
        minutes: 15,
        phenomenonPrompt:
          "Vận dụng sang tình huống mới: giữ nguyên nguồn phát α nhưng thay lá vàng ¹⁹⁷₇₉Au bằng lá nhôm mỏng ²⁷₁₃Al.",
        evidencePrompt:
          "Tính Z, N, bán kính gần đúng R của hạt nhân ²⁷₁₃Al, so sánh góc tán xạ với lá vàng, đối chiếu dự đoán Pha 1, nộp bài và xem phản hồi đã lưu.",
        teacherTip:
          "Giao ở Pha 3 (Sau giờ học). Học sinh nộp câu trả lời, nhận phản hồi chi tiết từng ý và mở lại được kết quả đã lưu sau khi tải lại trang.",
        teacherGuide: {
          learningObjective:
            "Chuyển giao kiến thức cấu trúc hạt nhân và tán xạ hạt α sang hạt nhân ²⁷₁₃Al và tự phản tư đối chiếu dự đoán ban đầu.",
          projectorStrategy:
            "Dùng làm phiếu đánh giá cuối bài; kiểm tra việc học sinh mở lại kết quả đã lưu để thảo luận lỗi sai phổ biến.",
          openQuestions: [
            "Vì sao thay lá vàng (Z = 79) bằng lá nhôm (Z = 13) thì góc lệch của hạt α ở cùng (E, b) lại giảm mạnh?",
            "Bán kính gần đúng của hạt nhân ²⁷₁₃Al bằng bao nhiêu femtômét?",
          ],
          commonMisconceptions:
            "Học sinh hay nghĩ hạt nhân nhôm nhẹ hơn nên đẩy hạt α lệch mạnh hơn; cần nhắc lực đẩy Coulomb tỉ lệ thuận với điện tích hạt nhân +Ze.",
          noVideoFallback:
            "Phiếu vận dụng tương tác có lưu trữ bền vững localStorage và phản hồi từng câu.",
          completionCriteriaNote:
            "Hoàn thành khi nộp đúng Z = 13, N = 14, R ≈ 3,6 fm, chọn đúng chiều thay đổi góc lệch và ghi nhận xét phản tư.",
        },
      },
    ],
  },
  {
    code: "B22",
    number: 22,
    title: "Phản ứng hạt nhân và năng lượng liên kết",
    sgkPages: "SGK tr. 96–103",
    guidingQuestion:
      "Vì sao vết sương trong buồng Blackett tách làm hai nhánh và phần khối lượng hụt đi của hạt nhân chuyển thành gì?",
    hubHighlight:
      "Vết phân nhánh buồng sương Blackett, bảo toàn A và Z, độ hụt khối Δm, đồ thị năng lượng liên kết riêng, phân hạch và nhiệt hạch.",
    sections: [
      {
        id: "b22-blackett-track",
        kind: "b22_blackett_track",
        phase: "before",
        title: "Vết phân nhánh trong thí nghiệm buồng sương Blackett",
        shortTocTitle: "Vết phân nhánh Blackett",
        sgkPages: "tr. 96–97",
        minutes: 10,
        phenomenonPrompt:
          "Quan sát bức ảnh lịch sử trong buồng sương chứa khí Nitrogen: một vệt hạt α biến mất tại điểm va chạm và tách thành hai nhánh mới.",
        evidencePrompt:
          "Dự đoán hai hạt tạo ra sau điểm phân nhánh từ phương trình ⁴₂He + ¹⁴₇N → ¹⁷₈O + ¹₁H.",
        teacherTip:
          "Khơi gợi sự khác biệt giữa phản ứng hóa học (bảo toàn nguyên tố) và phản ứng hạt nhân (nguyên tố Nitrogen biến đổi thành Oxygen).",
      },
      {
        id: "b22-conservation",
        kind: "b22_conservation",
        phase: "in_class",
        title: "Bảo toàn số khối A và điện tích Z trong phản ứng hạt nhân",
        shortTocTitle: "Bảo toàn số khối & điện tích",
        sgkPages: "tr. 97–98",
        minutes: 12,
        phenomenonPrompt:
          "Kiểm tra tổng số nucleon A và tổng điện tích Z trước – sau các phản ứng hạt nhân kích thích và tự phát.",
        evidencePrompt:
          "Cân bằng đúng ít nhất hai phương trình phản ứng hạt nhân và ghi rõ hạt còn thiếu.",
        activityKey: "nuclear_reaction_balancer",
        teacherTip:
          "Lưu ý học sinh neutron (¹₀n) có Z = 0 nhưng A = 1, còn electron (⁰₋₁e) có Z = −1 và A = 0.",
      },
      {
        id: "b22-binding-energy",
        kind: "b22_binding_energy",
        phase: "in_class",
        title: "Độ hụt khối Δm và đồ thị năng lượng liên kết riêng",
        shortTocTitle: "Độ hụt khối & đồ thị Wlk/A",
        sgkPages: "tr. 99–101",
        minutes: 18,
        phenomenonPrompt:
          "So sánh tổng khối lượng các nucleon rời rạc với khối lượng hạt nhân thực tế và khảo sát đường cong Wₗₖ/A theo số khối A.",
        evidencePrompt:
          "Tính Δm, Wₗₖ, Wₗₖ/A và chỉ ra vùng số khối bền vững nhất (quanh ⁵⁶₂₆Fe ≈ 8,8 MeV/nucleon).",
        activityKey: "binding_energy_lab",
        teacherTip:
          "Dùng đồ thị Wₗₖ/A làm trục xương sống để giải thích vì sao hạt nhân rất nặng dễ phân hạch còn hạt nhân rất nhẹ có thể tổng hợp.",
      },
      {
        id: "b22-fission",
        kind: "b22_fission",
        phase: "in_class",
        title: "Phản ứng phân hạch hạt nhân ²³⁵₉₂U",
        shortTocTitle: "Phân hạch hạt nhân",
        sgkPages: "tr. 101–102",
        minutes: 12,
        phenomenonPrompt:
          "Theo dõi một neutron chậm kích thích hạt nhân ²³⁵₉₂U vỡ thành hai mảnh trung bình kèm các neutron thứ cấp.",
        evidencePrompt:
          "Ghi lại điều kiện để các neutron thứ cấp duy trì phản ứng dây chuyền.",
        activityKey: "nuclear_fission",
        teacherTip:
          "Đối chiếu số neutron sinh ra sau mỗi phân hạch (2–3 hạt) với vai trò kiểm soát mật độ neutron.",
      },
      {
        id: "b22-fusion",
        kind: "b22_fusion",
        phase: "in_class",
        title: "Phản ứng tổng hợp hạt nhân (nhiệt hạch)",
        shortTocTitle: "Tổng hợp hạt nhân",
        sgkPages: "tr. 102–103",
        minutes: 10,
        phenomenonPrompt:
          "Khảo sát điều kiện nhiệt độ hàng chục triệu độ để hai hạt nhân nhẹ ²₁H và ³₁H vượt lực đẩy tĩnh điện kết hợp thành ⁴₂He.",
        evidencePrompt:
          "So sánh năng lượng tỏa ra tính trên một đơn vị khối lượng nhiên liệu giữa nhiệt hạch và phân hạch.",
        activityKey: "nuclear_fusion",
        teacherTip:
          "Liên hệ trực tiếp với nguồn năng lượng của Mặt Trời và các ngôi sao.",
      },
      {
        id: "b22-after-transfer",
        kind: "b22_after_transfer",
        phase: "after",
        title: "Kiểm tra, đánh giá: Đọc đồ thị Wₗₖ/A để dự đoán chiều tỏa năng lượng",
        shortTocTitle: "Kiểm tra, đánh giá",
        sgkPages: "tr. 103 · Vận dụng",
        minutes: 12,
        phenomenonPrompt:
          "Vận dụng đồ thị năng lượng liên kết riêng để xét hai quá trình hạt nhân mới.",
        evidencePrompt:
          "Giải thích vì sao cả sự phân hạch của hạt nhân rất nặng lẫn sự tổng hợp của hạt nhân rất nhẹ đều tiến về vùng đỉnh bền vững và tỏa năng lượng.",
        teacherTip:
          "Đánh giá năng lực lập luận từ đồ thị thay vì chỉ thay số vào công thức.",
      },
    ],
  },
  {
    code: "B23",
    number: 23,
    title: "Hiện tượng phóng xạ",
    sgkPages: "SGK tr. 104–113",
    guidingQuestion:
      "Không biết lúc nào một hạt nhân riêng lẻ phân rã, làm sao ta vẫn dự đoán chính xác độ phóng xạ của cả mẫu theo thời gian?",
    hubHighlight:
      "Vết tia trong buồng sương, số đếm Geiger mỗi 5 giây, độ đâm xuyên α–β–γ, đồ thị bán rã H(t) và nguyên tắc an toàn bức xạ.",
    sections: [
      {
        id: "b23-cloud-geiger",
        kind: "b23_cloud_geiger",
        phase: "before",
        title: "Vết buồng sương và số đếm Geiger theo từng khoảng 5 giây",
        shortTocTitle: "Buồng sương & số đếm Geiger",
        sgkPages: "tr. 104–105",
        minutes: 12,
        phenomenonPrompt:
          "Quan sát hình dạng vết sương của các tia phóng xạ và chuỗi số đếm ống Geiger–Müller trong các khoảng 5 giây liên tiếp.",
        evidencePrompt:
          "Nhận xét vì sao số đếm trong từng khoảng 5 giây dao động ngẫu nhiên không hệt nhau dù nguồn không đổi điều kiện ngoài.",
        activityKey: "geiger_random_decay",
        teacherTip:
          "Giúp học sinh nhận ra bản chất ngẫu nhiên ở mức vi mô trước khi học quy luật thống kê hàm mũ ở mức vĩ mô.",
      },
      {
        id: "b23-radiation-types",
        kind: "b23_radiation_types",
        phase: "in_class",
        title: "Đường đi trong điện từ trường và độ đâm xuyên của tia α, β, γ",
        shortTocTitle: "Bản chất & đâm xuyên α, β, γ",
        sgkPages: "tr. 105–107",
        minutes: 15,
        phenomenonPrompt:
          "Thử đặt tờ giấy, tấm nhôm vài mm và khối chì dày chắn trước các chùm tia α, β⁻, β⁺, γ đồng thời quan sát độ lệch trong điện trường.",
        evidencePrompt:
          "Lập bảng so sánh bản chất hạt, điện tích, khả năng ion hóa và vật liệu chắn tối thiểu của ba loại tia.",
        activityKey: "radiation_properties",
        teacherTip:
          "Lưu ý độ cong quỹ đạo của hạt α nhỏ hơn nhiều so với tia β trong cùng từ trường vì khối lượng hạt α lớn gấp ~7300 lần electron.",
      },
      {
        id: "b23-half-life",
        kind: "b23_half_life",
        phase: "in_class",
        title: "Đồ thị bán rã N(t), chu kì bán rã T và độ phóng xạ H(t)",
        shortTocTitle: "Đồ thị bán rã & độ phóng xạ",
        sgkPages: "tr. 108–111",
        minutes: 18,
        phenomenonPrompt:
          "Khảo sát đường cong giảm theo quy luật hàm mũ qua từng chu kì bán rã T, 2T, 3T và mối liên hệ H(t) = λN(t).",
        evidencePrompt:
          "Xác định chu kì bán rã T trên đồ thị và giải thích vì sao sau 2T số hạt nhân mẹ còn N₀/4 chứ không về 0.",
        activityKey: "radioactive_decay_half_life",
        teacherTip:
          "Kết nối trực tiếp đơn vị độ phóng xạ Becquerel (1 Bq = 1 phân rã/giây) với số đếm thực nghiệm.",
      },
      {
        id: "b23-safety",
        kind: "b23_safety",
        phase: "in_class",
        title: "Ba nguyên tắc an toàn bức xạ và biển cảnh báo",
        shortTocTitle: "Nguyên tắc an toàn bức xạ",
        sgkPages: "tr. 111–113",
        minutes: 10,
        phenomenonPrompt:
          "Thử nghiệm tác động của việc giảm thời gian tiếp xúc, tăng khoảng cách và chọn vách che chắn phù hợp đối với liều chiếu xạ.",
        evidencePrompt:
          "Ghi rõ 3 nguyên tắc vàng (Thời gian – Khoảng cách – Che chắn) cho một tình huống làm việc với nguồn γ.",
        activityKey: "radiation_safety",
        teacherTip:
          "Phân biệt rõ chiếu xạ ngoài (nguồn ở xa cơ thể) và nhiễm xạ trong (hít/nuốt bụi phóng xạ, nơi tia α rất nguy hiểm).",
      },
      {
        id: "b23-carbon14",
        kind: "b23_carbon14",
        phase: "after",
        title: "Kiểm tra, đánh giá: Định tuổi mẫu gỗ cổ bằng đồng vị ¹⁴₆C",
        shortTocTitle: "Kiểm tra, đánh giá (¹⁴₆C)",
        sgkPages: "tr. 113 · Vận dụng",
        minutes: 15,
        phenomenonPrompt:
          "Đo độ phóng xạ ¹⁴₆C của mẫu gỗ khảo cổ so với mẫu gỗ đang sống cùng khối lượng (T ≈ 5730 năm).",
        evidencePrompt:
          "Tính tuổi gần đúng của mẫu cổ vật từ tỉ số H/H₀ và nêu giả thiết của phương pháp.",
        activityKey: "carbon14_dating",
        teacherTip:
          "Học sinh vận dụng trọn vẹn công thức H(t) = H₀·2^(−t/T) vào bài toán khảo cổ thực tế.",
      },
    ],
  },
  {
    code: "B24",
    number: 24,
    title: "Công nghiệp hạt nhân",
    sgkPages: "SGK tr. 114–118",
    guidingQuestion:
      "Năng lượng phân hạch trong lò phản ứng đi qua những vòng truyền nào để phát điện và đồng vị phóng xạ phục vụ y học, nông nghiệp ra sao?",
    hubHighlight:
      "Chuỗi truyền năng lượng qua nhà máy điện hạt nhân, thanh điều khiển lò phản ứng, y học hạt nhân, công nghệ sinh học và bảo quản thực phẩm.",
    sections: [
      {
        id: "b24-energy-chain",
        kind: "b24_energy_chain",
        phase: "before",
        title: "Lần theo đường truyền năng lượng qua nhà máy điện hạt nhân",
        shortTocTitle: "Đường truyền năng lượng",
        sgkPages: "tr. 114–115",
        minutes: 12,
        phenomenonPrompt:
          "Theo dõi dòng chuyển hóa năng lượng từ tâm lò phản ứng qua vòng tải nhiệt sơ cấp, bình sinh hơi thứ cấp, tua-bin đến máy phát điện.",
        evidencePrompt:
          "Viết sơ đồ 4 bước chuyển hóa năng lượng và giải thích vì sao vòng nước sơ cấp qua tâm lò phải tách kín với vòng hơi chạy tua-bin.",
        activityKey: "nuclear_power_energy_flow",
        teacherTip:
          "Câu hỏi tách biệt hai vòng tuần hoàn giúp học sinh hiểu ngay thiết kế an toàn bức xạ cơ bản của nhà máy điện hạt nhân PWR.",
      },
      {
        id: "b24-reactor-control",
        kind: "b24_reactor_control",
        phase: "in_class",
        title: "Điều khiển phản ứng dây chuyền bằng thanh hấp thụ neutron",
        shortTocTitle: "Điều khiển lò phản ứng",
        sgkPages: "tr. 115–116",
        minutes: 15,
        phenomenonPrompt:
          "Điều chỉnh độ ngập của thanh điều khiển (Boron/Cadmium) và quan sát hệ số nhân neutron k ở các chế độ k < 1, k = 1, k > 1.",
        evidencePrompt:
          "Giải thích cơ chế giữ k = 1 để lò vận hành ổn định và vai trò của chất làm chậm neutron.",
        activityKey: "reactor_control_concept",
        teacherTip:
          "Cho học sinh thử tình huống công suất tăng để tự rút ra thao tác hạ thanh điều khiển hấp thụ neutron.",
      },
      {
        id: "b24-medicine",
        kind: "b24_medicine",
        phase: "in_class",
        title: "Ứng dụng trong y học hạt nhân: Chẩn đoán hình ảnh và xạ trị",
        shortTocTitle: "Y học hạt nhân",
        sgkPages: "tr. 116–117",
        minutes: 14,
        phenomenonPrompt:
          "Khảo sát cách chọn đồng vị đánh dấu (như ¹³¹₅₃I, ⁹⁹ᵐ₄₃Tc, ¹⁸₉F) có chu kì bán rã ngắn để ghi hình chức năng hoặc tiêu diệt tế bào khối u.",
        evidencePrompt:
          "Giải thích vì sao dược chất phóng xạ chẩn đoán cần có chu kì bán rã ngắn và phát tia thoát ra ngoài cơ thể để máy thu nhận được.",
        activityKey: "nuclear_medicine",
        teacherTip:
          "Kết nối trực tiếp kiến thức chu kì bán rã ở Bài 23 với tiêu chí đào thải nhanh khỏi cơ thể bệnh nhân.",
      },
      {
        id: "b24-bio-food",
        kind: "b24_bio_food",
        phase: "in_class",
        title: "Ứng dụng trong công nghệ sinh học, nông nghiệp và bảo quản thực phẩm",
        shortTocTitle: "Sinh học & bảo quản thực phẩm",
        sgkPages: "tr. 117–118",
        minutes: 12,
        phenomenonPrompt:
          "Tìm hiểu chiếu xạ tạo giống cây trồng đột biến có lợi, kiểm dịch nông sản và ức chế vi sinh vật/nảy mầm trong bảo quản thực phẩm.",
        evidencePrompt:
          "Phân biệt chiếu xạ thực phẩm bằng chùm tia γ/electron (không làm thực phẩm nhiễm phóng xạ) với sự nhiễm bẩn chất phóng xạ.",
        activityKey: "radiation_applications",
        teacherTip:
          "Giải tỏa hiểu lầm phổ biến của học sinh: chiếu tia γ qua trái cây giống như chiếu ánh sáng hay tia X, không để lại hạt nhân phóng xạ trong thực phẩm.",
      },
      {
        id: "b24-after-transfer",
        kind: "b24_after_transfer",
        phase: "after",
        title: "Kiểm tra, đánh giá: Lựa chọn giải pháp bức xạ an toàn trong thực tiễn",
        shortTocTitle: "Kiểm tra, đánh giá",
        sgkPages: "tr. 118 · Vận dụng",
        minutes: 12,
        phenomenonPrompt:
          "Đánh giá ba hồ sơ ứng dụng thực tế (kiểm tra khuyết tật mối hàn công nghiệp, chẩn đoán tuyến giáp, bảo quản nông sản xuất khẩu).",
        evidencePrompt:
          "Chọn loại bức xạ phù hợp cho từng hồ sơ và nêu lí do vật lí dựa trên khả năng đâm xuyên và chu kì bán rã.",
        teacherTip:
          "Tổng hợp kiến thức liên bài B23–B24 để đánh giá năng lực vận dụng.",
      },
    ],
  },
  {
    code: "B25",
    number: 25,
    title: "Bài tập về vật lí hạt nhân",
    sgkPages: "SGK tr. 119–122",
    guidingQuestion:
      "Từ hiện tượng tĩnh điện kế phóng điện và Bảng 25.1 đo độ phóng xạ theo thời gian, ta xác định chu kì bán rã và giải bài toán hạt nhân thế nào?",
    hubHighlight:
      "Hiện tượng tĩnh điện kế (Hình 25.1), phương trình phản ứng và Bảng 25.1 đối chiếu cặp số liệu (t, H) kèm đồ thị phân rã.",
    sections: [
      {
        id: "b25-electroscope",
        kind: "b25_electroscope",
        phase: "before",
        title: "Hiện tượng tĩnh điện kế phóng điện khi đưa nguồn phóng xạ lại gần",
        shortTocTitle: "Hiện tượng tĩnh điện kế",
        sgkPages: "tr. 119 · Hình 25.1",
        minutes: 10,
        phenomenonPrompt:
          "Quan sát tĩnh điện kế đã tích điện làm hai lá kim loại xòe ra; khi đưa nguồn phóng xạ lại gần quả cầu kim loại, góc xòe của hai lá giảm dần.",
        evidencePrompt:
          "Giải thích vai trò ion hóa không khí của tia phóng xạ làm tĩnh điện kế mất điện tích và dự đoán hiện tượng khi chắn bằng một tờ giấy.",
        teacherTip:
          "Mở đầu tiết bài tập bằng hiện tượng định tính (Bài 25.1 SGK tr. 119) trước khi sang bài toán bảng số liệu.",
      },
      {
        id: "b25-table-25-1",
        kind: "b25_table_25_1",
        phase: "in_class",
        title: "Phân tích Bảng 25.1 và đồ thị độ phóng xạ H(t) theo thời gian",
        shortTocTitle: "Bảng 25.1 & đồ thị H(t)",
        sgkPages: "tr. 121 · Bảng 25.1",
        minutes: 20,
        phenomenonPrompt:
          "Đọc các cặp thời gian t (s) và độ phóng xạ H (Bq) trong Bảng 25.1 (từ t = 0 s, H₀ = 151 Bq đến t = 360 s, H = 9 Bq) và dựng đường cong phân rã.",
        evidencePrompt:
          "Tìm mức H₀/2 = 75,5 Bq nằm giữa hai mốc thời gian nào của Bảng 25.1, ước lượng chu kì bán rã T và đối chiếu với đường cong lí thuyết.",
        activityKey: "nuclear_physics_practice_lab",
        teacherTip:
          "Cho học sinh đọc trực tiếp từng cặp (t, H) trên bảng số liệu trước khi nhìn đồ thị; nhấn mạnh sai số thống kê thực nghiệm.",
      },
      {
        id: "b25-equations-energy",
        kind: "b25_equations_energy",
        phase: "in_class",
        title: "Luyện tập phương trình phản ứng hạt nhân và năng lượng liên kết",
        shortTocTitle: "Phương trình & năng lượng liên kết",
        sgkPages: "tr. 119–120",
        minutes: 15,
        phenomenonPrompt:
          "Vận dụng định luật bảo toàn số khối A, điện tích Z và công thức độ hụt khối Δm để giải hệ bài tập định lượng.",
        evidencePrompt:
          "Hoàn thành cân bằng các phương trình phân rã α, β⁻, β⁺ và tính năng lượng liên kết riêng cho tối thiểu ba hạt nhân.",
        teacherTip:
          "Rèn kĩ năng kiểm tra đơn vị (amu, MeV/c², MeV, Bq, s) ở từng bước biến đổi.",
      },
      {
        id: "b25-after-transfer",
        kind: "b25_after_transfer",
        phase: "after",
        title: "Kiểm tra, đánh giá: Bài toán tổng hợp hoạt độ nguồn y học và định tuổi",
        shortTocTitle: "Kiểm tra, đánh giá",
        sgkPages: "tr. 121–122",
        minutes: 15,
        phenomenonPrompt:
          "Giải quyết bài toán thực tiễn: tính thời gian để độ phóng xạ giảm xuống mức an toàn và xác định khối lượng hạt nhân con tạo thành.",
        evidencePrompt:
          "Trình bày lời giải gồm công thức gốc, đổi đơn vị thống nhất và kiểm tra tính hợp lí của đáp số.",
        teacherTip:
          "Tổng kết toàn Chương IV trước kiểm tra định kì.",
      },
    ],
  },
] as const;

export function getChapter4Lesson(code?: string): Chapter4LessonSpec {
  const normalized = (code ?? "B21").trim().toUpperCase();
  return (
    CHAPTER4_LESSONS.find((lesson) => lesson.code === normalized) ??
    CHAPTER4_LESSONS[0]
  );
}

/* ==========================================================================
   CHẾ ĐỘ GIÁO VIÊN: BẢN RIÊNG CỦA LỚP & ĐỒNG BỘ SANG KẾ HOẠCH DẠY HỌC
   ========================================================================== */

export interface TeacherSectionOverride {
  readonly id: string;
  readonly title: string;
  readonly phase: LessonStudyPhase;
  readonly phenomenonPrompt: string;
  readonly evidencePrompt: string;
  readonly teacherTip: string;
  readonly flowVideoUrl?: string;
  readonly hidden?: boolean;
}

export interface TeacherLessonDraft {
  readonly version: 1;
  readonly lessonCode: NuclearPhysicsLessonCode;
  readonly customTitle: string;
  readonly classNameNote: string;
  readonly guidingQuestion: string;
  readonly sections: readonly TeacherSectionOverride[];
  readonly updatedAt: string;
}

export const TEACHER_CUSTOM_DRAFT_PREFIX = "physics-chapter4-teacher-draft-v1:";
export const TEACHING_PLAN_LOCAL_KEY = "physics-teaching-plans-v1:local";

export function createDraftFromSample(lesson: Chapter4LessonSpec): TeacherLessonDraft {
  return {
    version: 1,
    lessonCode: lesson.code,
    customTitle: `${lesson.title} (Bản soạn của lớp)`,
    classNameNote: "Lớp 12 Vật lí — tổ chức theo 3 pha (trước, trong và sau giờ học)",
    guidingQuestion: lesson.guidingQuestion,
    sections: lesson.sections.map((sec) => ({
      id: sec.id,
      title: sec.title,
      phase: sec.phase,
      phenomenonPrompt: sec.phenomenonPrompt,
      evidencePrompt: sec.evidencePrompt,
      teacherTip: sec.teacherTip,
      flowVideoUrl: sec.flowVideoUrl ?? "",
      hidden: false,
    })),
    updatedAt: new Date().toISOString(),
  };
}

export function resolveLessonWithDraft(
  sample: Chapter4LessonSpec,
  draft: TeacherLessonDraft | null,
  useCustomDraft: boolean
): {
  readonly title: string;
  readonly guidingQuestion: string;
  readonly classNameNote?: string;
  readonly isCustom: boolean;
  readonly sections: readonly Chapter4SectionSpec[];
} {
  if (!useCustomDraft || !draft || draft.lessonCode !== sample.code) {
    return {
      title: sample.title,
      guidingQuestion: sample.guidingQuestion,
      isCustom: false,
      sections: sample.sections,
    };
  }

  const overrideMap = new Map(draft.sections.map((item) => [item.id, item]));
  const mergedSections: Chapter4SectionSpec[] = [];

  for (const base of sample.sections) {
    const ov = overrideMap.get(base.id);
    if (ov?.hidden) continue;
    mergedSections.push({
      ...base,
      title: ov?.title.trim() ? ov.title.trim() : base.title,
      phase: ov?.phase ?? base.phase,
      phenomenonPrompt: ov?.phenomenonPrompt.trim()
        ? ov.phenomenonPrompt.trim()
        : base.phenomenonPrompt,
      evidencePrompt: ov?.evidencePrompt.trim()
        ? ov.evidencePrompt.trim()
        : base.evidencePrompt,
      teacherTip: ov?.teacherTip.trim() ? ov.teacherTip.trim() : base.teacherTip,
      flowVideoUrl: ov?.flowVideoUrl?.trim() || undefined,
    });
  }

  return {
    title: draft.customTitle.trim() || sample.title,
    guidingQuestion: draft.guidingQuestion.trim() || sample.guidingQuestion,
    classNameNote: draft.classNameNote.trim() || undefined,
    isCustom: true,
    sections: mergedSections.length > 0 ? mergedSections : sample.sections,
  };
}

export function isVerifiedVideoUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/videos/")) return trimmed.endsWith(".mp4") || trimmed.endsWith(".webm");
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function customPlanIdForLesson(code: NuclearPhysicsLessonCode): string {
  return `custom-lesson-plan-${code.toLowerCase()}`;
}

/**
 * Chuyển bản nháp bài dạy trên Trang bài học thành đối tượng TeachingPlan hợp lệ
 * (đạt validateTeachingPlan) để xuất hiện trực tiếp trong /hoc-lieu/soan-ke-hoach.
 */
export function convertLessonDraftToTeachingPlan(
  sample: Chapter4LessonSpec,
  draft: TeacherLessonDraft
): TeachingPlan {
  const overrideMap = new Map(draft.sections.map((s) => [s.id, s]));
  const activities: PlanActivity[] = [];

  for (const base of sample.sections) {
    const ov = overrideMap.get(base.id);
    if (ov?.hidden) continue;
    const phaseMeta = getPhaseMeta(ov?.phase ?? base.phase);
    const title = (ov?.title.trim() || base.title).slice(0, 190);
    const phenomenon = (ov?.phenomenonPrompt.trim() || base.phenomenonPrompt).slice(0, 1800);
    const evidence = (ov?.evidencePrompt.trim() || base.evidencePrompt).slice(0, 1800);
    const tip = (ov?.teacherTip.trim() || base.teacherTip).slice(0, 1800);
    const flowUrl = ov?.flowVideoUrl?.trim();

    const resources: PlanActivity["resources"] = [];
    if (base.activityKey) {
      const resourceUrl = /^[a-z_]+$/.test(base.activityKey)
        ? `activity:${base.activityKey}`
        : `/hoc-lieu/truc-quan?bai=${sample.code}&muc=${base.id}`;
      resources.push({
        id: `sim-${base.id}`,
        title: `Mô phỏng: ${base.shortTocTitle}`.slice(0, 190),
        url: resourceUrl,
        type: "simulation",
      });
    } else {
      resources.push({
        id: `doc-${base.id}`,
        title: `Học liệu ${sample.code}: ${base.shortTocTitle}`.slice(0, 190),
        url: `/learning/${sample.code}-worksheet.pdf`,
        type: "document",
      });
    }

    if (flowUrl && isVerifiedVideoUrl(flowUrl)) {
      resources.push({
        id: `flow-${base.id}`,
        title: `Video Flow: ${base.shortTocTitle}`.slice(0, 190),
        url: flowUrl,
        type: "animation",
      });
    }

    activities.push({
      id: `${sample.code.toLowerCase()}-${base.id}`,
      phase: phaseMeta.planPhase,
      title,
      minutes: base.minutes,
      objective: phenomenon,
      instructions: `Khám phá: ${phenomenon}`,
      teacherActions: tip,
      studentActions: `Thực hiện hoạt động và ghi lại bằng chứng: ${evidence}`,
      product: evidence,
      evaluation: "Đối chiếu bằng chứng học sinh ghi nhận với tiêu chí vật lí của mục học.",
      support: `SGK Vật lí 12 (${base.sgkPages})`,
      resources,
      activityType:
        phaseMeta.id === "before"
          ? "opening"
          : phaseMeta.id === "after"
            ? "application"
            : "knowledge",
    });
  }

  return {
    version: 1,
    id: customPlanIdForLesson(sample.code),
    title: (draft.customTitle.trim() || `${sample.code} · ${sample.title} (Bản của tôi)`).slice(
      0,
      190
    ),
    lessonCode: sample.code,
    classContext: (
      draft.classNameNote.trim() ||
      `Bài ${sample.number}: ${sample.title} (${sample.sgkPages})`
    ).slice(0, 950),
    goals: `Câu hỏi trung tâm: ${draft.guidingQuestion.trim() || sample.guidingQuestion}`.slice(
      0,
      5000
    ),
    preparation:
      "Đồng bộ trực tiếp từ chế độ Soạn bản riêng trên Trang bài học (/hoc-lieu/truc-quan). Giáo viên kiểm tra thiết bị trình chiếu và phiếu ghi bằng chứng.",
    reflection:
      "Rà soát các câu hỏi dự đoán trước giờ học của học sinh để điều chỉnh thời lượng thảo luận trên lớp.",
    activities,
    updatedAt: draft.updatedAt,
    flippedForm: "standard",
  };
}

export function loadTeacherLessonDraft(code: NuclearPhysicsLessonCode): TeacherLessonDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${TEACHER_CUSTOM_DRAFT_PREFIX}${code}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TeacherLessonDraft;
    if (parsed?.version !== 1 || parsed.lessonCode !== code || !Array.isArray(parsed.sections)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveTeacherLessonDraftAndSyncPlan(
  sample: Chapter4LessonSpec,
  draft: TeacherLessonDraft
): { readonly syncedPlan?: TeachingPlan; readonly error?: string } {
  const nextDraft: TeacherLessonDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  const candidatePlan = convertLessonDraftToTeachingPlan(sample, nextDraft);
  const checked = validateTeachingPlan(candidatePlan);
  if (!checked.plan) {
    return { error: checked.error ?? "Kế hoạch đồng bộ không hợp lệ." };
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        `${TEACHER_CUSTOM_DRAFT_PREFIX}${sample.code}`,
        JSON.stringify(nextDraft)
      );

      const existingRaw = window.localStorage.getItem(TEACHING_PLAN_LOCAL_KEY);
      const existingList: TeachingPlan[] = [];
      if (existingRaw) {
        const parsed: unknown = JSON.parse(existingRaw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const v = validateTeachingPlan(item);
            if (v.plan && v.plan.id !== checked.plan.id) {
              existingList.push(v.plan);
            }
          }
        }
      }
      const merged = [checked.plan, ...existingList].slice(0, 30);
      window.localStorage.setItem(TEACHING_PLAN_LOCAL_KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event("physics-plans-changed"));
      window.dispatchEvent(new Event("chapter4-storage-changed"));
    } catch {
      return { error: "Trình duyệt chưa lưu được vào bộ nhớ cục bộ." };
    }
  }

  return { syncedPlan: checked.plan };
}

/* ==========================================================================
   LƯU BẰNG CHỨNG & DỰ ĐOÁN CỦA HỌC SINH THEO TỪNG BÀI HỌC (LIÊN THÔNG PHA 1→2→3)
   ========================================================================== */

export type B21ApparatusPartCode = "R" | "D" | "S" | "M";

export interface PreClassWorkData {
  readonly apparatusRoles?: Readonly<Partial<Record<B21ApparatusPartCode, string>>>;
  readonly selfCheckChoice?: string;
  readonly bringToClassQuestion?: string;
  readonly [key: string]: unknown;
}

export interface StructureSizeWorkData {
  readonly selectedElement?: string;
  readonly inspectedElements?: readonly string[];
  readonly atomicRadiusInput?: string;
  readonly atomicUnitChoice?: string;
  readonly nuclearRadiusInput?: string;
  readonly nuclearUnitChoice?: string;
  readonly scaleExplanation?: string;
  readonly checked?: boolean;
}

export interface SymbolIsotopeWorkData {
  readonly h1NeutronInput?: string;
  readonly h2NeutronInput?: string;
  readonly h3NeutronInput?: string;
  readonly targetNeutronInput?: string;
  readonly densityChoice?: string;
  readonly checked?: boolean;
}

export interface AfterClassWorkData {
  readonly alZ?: string;
  readonly alN?: string;
  readonly alRadiusFm?: string;
  readonly alChoice?: string;
  readonly predictionReflection?: string;
  readonly checked?: boolean;
  readonly submittedAt?: string;
}

export interface StudentLessonNotebook {
  /** Dự đoán hiện hành ghi ở pha Trước giờ học */
  readonly preClassPredictionChoice?: string;
  readonly preClassPredictionReason?: string;
  /** Dự đoán chốt lần đầu tiên — khóa giữ nguyên kể cả khi đoán sai để đối chiếu ở Pha 2 & Pha 3 */
  readonly initialPredictionChoice?: string;
  readonly initialPredictionReason?: string;
  /** Kết quả nhận diện R-D-S-M, câu tự kiểm tra và câu hỏi mang vào lớp ở Pha 1 */
  readonly preClassWork?: PreClassWorkData;
  /** Kết quả đọc đủ 8 dòng Bảng 21.1 đúng đơn vị & giải thích tỉ lệ phóng đại */
  readonly structureSizeWork?: StructureSizeWorkData;
  /** Kết quả khảo sát ba đồng vị ¹H, ²H, ³H bằng N = A − Z */
  readonly symbolIsotopeWork?: SymbolIsotopeWorkData;
  /** Kết quả nhiệm vụ vận dụng Pha 3 với lá nhôm ²⁷₁₃Al */
  readonly afterClassWork?: AfterClassWorkData;
  /** Ghi chú bằng chứng của từng mục theo section.id */
  readonly sectionNotes: Readonly<Record<string, string>>;
  /** Mục đã hoàn thành thực chất */
  readonly completedSectionIds: readonly string[];
}

export const STUDENT_NOTEBOOK_PREFIX = "physics-chapter4-notebook-v1:";

export const EMPTY_STUDENT_NOTEBOOK: StudentLessonNotebook = {
  sectionNotes: {},
  completedSectionIds: [],
};

/**
 * Ghi nhận dự đoán Pha 1 và KHÓA vĩnh viễn lần chốt đầu tiên vào
 * `initialPredictionChoice` / `initialPredictionReason` kể cả khi học sinh cập nhật ghi chú sau đó.
 */
export function recordPreClassPrediction(
  current: StudentLessonNotebook,
  choice: string,
  reason: string
): StudentLessonNotebook {
  const trimmedChoice = choice.trim();
  const trimmedReason = reason.trim();
  const hasLockedInitial = Boolean(current.initialPredictionChoice?.trim());

  return {
    ...current,
    preClassPredictionChoice: trimmedChoice,
    preClassPredictionReason: trimmedReason,
    initialPredictionChoice: hasLockedInitial
      ? current.initialPredictionChoice
      : trimmedChoice || undefined,
    initialPredictionReason: hasLockedInitial
      ? current.initialPredictionReason
      : trimmedReason || undefined,
  };
}

function asCleanObject<T extends object>(val: unknown): T | undefined {
  if (!val || typeof val !== "object" || Array.isArray(val)) return undefined;
  return val as T;
}

export function loadStudentNotebook(code: NuclearPhysicsLessonCode): StudentLessonNotebook {
  if (typeof window === "undefined") return EMPTY_STUDENT_NOTEBOOK;
  try {
    const raw = window.localStorage.getItem(`${STUDENT_NOTEBOOK_PREFIX}${code}`);
    if (!raw) return EMPTY_STUDENT_NOTEBOOK;
    const parsed = JSON.parse(raw) as Partial<StudentLessonNotebook>;
    const preChoice =
      typeof parsed.preClassPredictionChoice === "string"
        ? parsed.preClassPredictionChoice
        : undefined;
    const preReason =
      typeof parsed.preClassPredictionReason === "string"
        ? parsed.preClassPredictionReason
        : undefined;
    const initChoice =
      typeof parsed.initialPredictionChoice === "string" && parsed.initialPredictionChoice
        ? parsed.initialPredictionChoice
        : preChoice;
    const initReason =
      typeof parsed.initialPredictionReason === "string"
        ? parsed.initialPredictionReason
        : preReason;

    return {
      preClassPredictionChoice: preChoice,
      preClassPredictionReason: preReason,
      initialPredictionChoice: initChoice,
      initialPredictionReason: initReason,
      preClassWork: asCleanObject<PreClassWorkData>(parsed.preClassWork),
      structureSizeWork: asCleanObject<StructureSizeWorkData>(parsed.structureSizeWork),
      symbolIsotopeWork: asCleanObject<SymbolIsotopeWorkData>(parsed.symbolIsotopeWork),
      afterClassWork: asCleanObject<AfterClassWorkData>(parsed.afterClassWork),
      sectionNotes:
        parsed.sectionNotes && typeof parsed.sectionNotes === "object"
          ? (parsed.sectionNotes as Record<string, string>)
          : {},
      completedSectionIds: Array.isArray(parsed.completedSectionIds)
        ? parsed.completedSectionIds.filter((x): x is string => typeof x === "string")
        : [],
    };
  } catch {
    return EMPTY_STUDENT_NOTEBOOK;
  }
}

export function saveStudentNotebook(
  code: NuclearPhysicsLessonCode,
  notebook: StudentLessonNotebook
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${STUDENT_NOTEBOOK_PREFIX}${code}`,
      JSON.stringify(notebook)
    );
    window.dispatchEvent(new Event("chapter4-storage-changed"));
  } catch {
    // Ignore storage quota errors cleanly
  }
}
