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
      "Vì sao vết sương trong buồng Blackett tách làm hai nhánh chữ Y và phần khối lượng hụt đi của hạt nhân chuyển thành gì?",
    hubHighlight:
      "Buồng sương Blackett 3D (Hình 22.1–22.2), bảo toàn A và Z, mô hình cân độ hụt khối Δm & đồ thị Eₗₖ/A, phân hạch k < 1 · k = 1 · k > 1 và nhiệt hạch D+T / D+D.",
    lessonGoals: {
      knowledge:
        "Phân biệt được sơ đồ thí nghiệm Rutherford (Hình 22.1) với ảnh vết buồng sương Blackett (Hình 22.2); phát biểu định luật bảo toàn số nucleon A và điện tích Z; viết công thức độ hụt khối Δm, năng lượng liên kết Eₗₖ = Δm·c², năng lượng liên kết riêng Eₗₖᵣ = Eₗₖ/A và nêu bản chất phản ứng phân hạch, tổng hợp hạt nhân (SGK Vật lí 12 KNTT, tr. 96–103).",
      competence:
        "Xoay, thu phóng, chọn bộ phận và chuyển sang góc cửa sổ quan sát trên buồng sương Blackett 3D; chạy hai lượt vệt thẳng và vết chữ Y (1)→(2)→(3)→(4), khóa dự đoán trước khi mở giải thích proton ¹₁H và oxygen-17 ¹⁷₈O; cân bằng phương trình A/Z, đọc đồ thị Eₗₖ/A, khảo sát k < 1, k = 1, k > 1 và đối chiếu hai kênh nhiệt hạch D+T, D+D.",
      quality:
        "Rèn tác phong tôn trọng bằng chứng thực nghiệm lịch sử (Rutherford 1919, Blackett 1925, Oliphant 1934), cẩn trọng khi đối chiếu đơn vị và nguồn dữ liệu hạt nhân.",
    },
    sections: [
      {
        id: "b22-blackett-track",
        kind: "b22_blackett_track",
        phase: "before",
        title: "Buồng sương Blackett 3D: Đối chiếu Hình 22.1 – 22.2 và vết phân nhánh chữ Y",
        shortTocTitle: "Buồng sương Blackett 3D",
        sgkPages: "tr. 96–97",
        minutes: 12,
        phenomenonPrompt:
          "Khảo sát buồng sương Blackett 3D ở góc toàn cảnh và góc cửa sổ quan sát; chạy lại lượt vệt thẳng và lượt vết chữ Y (1)→(2)→(3)→(4), đối chiếu Hình 22.1 (Rutherford) với Hình 22.2 (Blackett 1925).",
        evidencePrompt:
          "Nhập lí do và khóa dự đoán ban đầu trước khi mở giải thích nhánh (3) proton ¹₁H, nhánh (4) oxygen-17 ¹⁷₈O; kiểm tra tổng A, Z hai vế, ghép 4 chi tiết và làm câu tự kiểm tra.",
        teacherTip:
          "Giao trước giờ học (12 phút): cho học sinh tự quan sát vệt α kết thúc tại đỉnh (2) trên buồng sương 3D và khóa dự đoán trước khi mở lời giải thích của Blackett.",
        teacherGuide: {
          learningObjective:
            "Nhận diện được cấu tạo buồng sương Blackett 3D (vỏ buồng, cửa sổ quan sát, cổng hạt tới, vùng quan sát); phân biệt Hình 22.1 và Hình 22.2 SGK tr. 96; giải thích vết chữ Y theo phương trình ⁴₂He + ¹⁴₇N → ¹⁷₈O + ¹₁H.",
          projectorStrategy:
            "Chiếu buồng sương Blackett 3D ở góc cửa sổ quan sát, chạy Lượt 1 (vệt thẳng) rồi Lượt 2 (vết chữ Y hiện tuần tự 1→2→3→4) và đối chiếu các dự đoán đã khóa của học sinh.",
          openQuestions: [
            "Vì sao sau đỉnh va chạm (2) chỉ có hai nhánh (3) và (4) tạo hình chữ Y mà không còn nhánh thứ ba của hạt α bay tiếp?",
            "Dựa vào độ mảnh – dài của nhánh (3) và độ đậm – ngắn của nhánh (4), nhánh nào là proton ¹₁H, nhánh nào là hạt nhân ¹⁷₈O?",
          ],
          commonMisconceptions:
            "Học sinh dễ nghĩ phản ứng hạt nhân bảo toàn nguyên tố như phản ứng hóa học hoặc nhầm nhánh đậm ngắn (4) là hạt α đi tiếp. Cách gỡ: Đặt phần giải thích ngay sau bước khóa dự đoán và kiểm tra Z: 2 + 7 = 8 (Oxygen) + 1 (Hydrogen).",
          noVideoFallback:
            "Hoàn thành trọn vẹn Pha 1 bằng mô hình buồng sương Blackett 3D (kèm sơ đồ dự phòng khi thiếu WebGL) và đối chiếu Hình 22.1–22.2 ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh đã khóa dự đoán kèm lí do, ghép đúng 4/4 chi tiết vết chữ Y và trả lời đúng câu tự kiểm tra Pha 1.",
        },
      },
      {
        id: "b22-conservation",
        kind: "b22_conservation",
        phase: "in_class",
        title: "Bảo toàn số khối A và điện tích Z trong phản ứng hạt nhân",
        shortTocTitle: "Bảo toàn số khối & điện tích",
        sgkPages: "tr. 97–98",
        minutes: 10,
        phenomenonPrompt:
          "Lấy lại dự đoán đã khóa ở Pha 1; phân biệt phản ứng hạt nhân tự phát với phản ứng hạt nhân kích thích và kiểm tra bảo toàn số nucleon A, điện tích Z.",
        evidencePrompt:
          "Đối chiếu dự đoán Pha 1 với phương trình Blackett và cân bằng đúng các phương trình phản ứng hạt nhân.",
        activityKey: "nuclear_reaction_balancer",
        teacherTip:
          "Lưu ý học sinh neutron (¹₀n) có Z = 0, A = 1; electron (⁰₋₁e) có Z = −1, A = 0; khối lượng nghỉ KHÔNG bảo toàn.",
        teacherGuide: {
          learningObjective:
            "Phân loại được phản ứng hạt nhân tự phát và kích thích; vận dụng định luật bảo toàn số khối A và bảo toàn điện tích Z để xác định hạt chưa biết.",
          projectorStrategy:
            "Mở khung Đối chiếu dự đoán Pha 1 ở đầu mục để nối liền từ vết chữ Y Blackett sang quy tắc tổng quát ∑A và ∑Z trên bộ cân bằng phương trình.",
          openQuestions: [
            "Trong phản ứng hạt nhân, số proton riêng lẻ và số neutron riêng lẻ có nhất thiết bảo toàn không, hay chỉ tổng số nucleon A bảo toàn?",
            "Điểm khác nhau cốt lõi giữa phân rã tự phát của ²³⁸₉₂U và phản ứng bắn phá ¹⁴₇N bằng hạt α là gì?",
          ],
          commonMisconceptions:
            "Học sinh hay áp dụng nhầm bảo toàn khối lượng nghỉ hoặc quên Z = −1 của hạt β⁻ (⁰₋₁e).",
          noVideoFallback:
            "Dùng bảng phân loại 2 nhóm phản ứng hạt nhân và bộ cân bằng phương trình tương tác trực tiếp trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh cân bằng chính xác các phương trình và phân loại đúng phản ứng hạt nhân.",
        },
      },
      {
        id: "b22-binding-energy",
        kind: "b22_binding_energy",
        phase: "in_class",
        title: "Độ hụt khối Δm, năng lượng liên kết Eₗₖ và đồ thị Eₗₖᵣ = Eₗₖ/A",
        shortTocTitle: "Độ hụt khối & đồ thị Eₗₖ/A",
        sgkPages: "tr. 98–100",
        minutes: 15,
        phenomenonPrompt:
          "Khảo sát mô hình cân hai đĩa (ghi rõ số đọc dùng khối lượng nguyên tử trung hòa) và đọc đồ thị năng lượng liên kết riêng Eₗₖᵣ = Eₗₖ/A theo số khối A (Hình 22.3 & Hình 22.5 SGK).",
        evidencePrompt:
          "Tính Δm, Eₗₖ, Eₗₖᵣ = Eₗₖ/A, so sánh 2 hạt nhân bất kì và xác định vùng bền vững nhất quanh ⁵⁶₂₆Fe (~8,8 MeV/nucleon).",
        activityKey: "binding_energy_lab",
        teacherTip:
          "Chỉ rõ trên mô hình cân: m_nt(¹H) và m_nt(X) đều dùng khối lượng nguyên tử trung hòa nên khối lượng Z electron ở hai đĩa tự triệt tiêu khi tính Δm.",
        teacherGuide: {
          learningObjective:
            "Tính được độ hụt khối Δm, năng lượng liên kết Eₗₖ = Δm·c² và dùng năng lượng liên kết riêng Eₗₖᵣ = Eₗₖ/A để so sánh độ bền vững hạt nhân.",
          projectorStrategy:
            "Chiếu mô hình cân hai đĩa kèm chú thích khối lượng nguyên tử trung hòa cạnh đồ thị Eₗₖ/A để giải thích nguồn gốc năng lượng tỏa ra.",
          openQuestions: [
            "Vì sao khi thay khối lượng nguyên tử trung hòa m_nt(¹H) và m_nt(X) vào hai vế của mô hình cân, khối lượng của Z electron lại tự giản ước?",
            "Hạt nhân ²³⁵₉₂U có Eₗₖ lớn hơn nhiều so với ⁵⁶₂₆Fe, vì sao ⁵⁶₂₆Fe lại bền vững hơn?",
          ],
          commonMisconceptions:
            "Học sinh hay đánh giá độ bền dựa vào Eₗₖ thay vì Eₗₖ/A hoặc cộng/trừ thừa khối lượng Z electron khi đề đã cho khối lượng nguyên tử trung hòa.",
          noVideoFallback:
            "Sử dụng trực tiếp đồ thị Eₗₖ/A, mô hình cân hai đĩa và phòng thí nghiệm năng lượng liên kết ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh khảo sát đủ ⁵⁶Fe, ²³⁵U, so sánh 2 hạt nhân khác nhau và trả lời đúng câu hỏi kiểm tra.",
        },
      },
      {
        id: "b22-fission",
        kind: "b22_fission",
        phase: "in_class",
        title: "Phản ứng phân hạch hạt nhân ²³⁵₉₂U (k < 1, k = 1, k > 1)",
        shortTocTitle: "Phân hạch hạt nhân",
        sgkPages: "tr. 100–102",
        minutes: 12,
        phenomenonPrompt:
          "Theo dõi một neutron chậm bị ²³⁵₉₂U hấp thụ tạo trạng thái kích thích ²³⁶₉₂U* rồi vỡ thành hai mảnh trung bình kèm các neutron thứ cấp và khảo sát dây chuyền với k < 1, k = 1, k > 1.",
        evidencePrompt:
          "Đếm đúng số neutron tự do sau phân hạch và so sánh sự phát triển phản ứng dây chuyền ở cả ba chế độ k < 1, k = 1 và k > 1.",
        activityKey: "nuclear_fission",
        teacherTip:
          "Phân biệt số neutron sinh ra trong 1 phân hạch đơn lẻ (2–3 hạt) với hệ số nhân hiệu dụng k của cả khối nhiên liệu.",
        teacherGuide: {
          learningObjective:
            "Mô tả được cơ chế phân hạch hạt nhân nặng qua trạng thái kích thích ²³⁶₉₂U* và phân tích ba chế độ phản ứng dây chuyền k < 1, k = 1, k > 1.",
          projectorStrategy:
            "Chạy mô phỏng phân hạch đến bước tách mảnh, sau đó chuyển lần lượt k = 0,6, k = 1 và k = 1,4 trên sơ đồ phân nhánh thế hệ.",
          openQuestions: [
            "Vì sao một số neutron sinh ra sau phân hạch không tiếp tục gây phân hạch mới?",
            "Trong lò phản ứng điện hạt nhân, người ta phải giữ hệ số nhân neutron ở chế độ nào?",
          ],
          commonMisconceptions:
            "Học sinh hay quên cộng 1 neutron tới ở vế trái (1 + 235 = 236) hoặc đồng nhất số neutron phát ra mỗi phân hạch với hệ số nhân k.",
          noVideoFallback:
            "Sử dụng trực tiếp phòng thí nghiệm phân hạch (có sơ đồ 2D dự phòng khi thiếu WebGL) và sơ đồ phân nhánh k trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi quan sát đủ diễn biến phân hạch, đếm đúng 3 neutron tự do, thử đủ k < 1, k = 1, k > 1 và trả lời đúng câu hỏi.",
        },
      },
      {
        id: "b22-fusion",
        kind: "b22_fusion",
        phase: "in_class",
        title: "Phản ứng tổng hợp hạt nhân (nhiệt hạch): So sánh kênh D+T và D+D",
        shortTocTitle: "Tổng hợp hạt nhân (D+T & D+D)",
        sgkPages: "tr. 102–103",
        minutes: 8,
        phenomenonPrompt:
          "Khảo sát điều kiện nhiệt độ siêu cao 10⁷ – 10⁸ K để thắng rào thế đẩy tĩnh điện Coulomb và so sánh hai kênh phản ứng nhiệt hạch D+T (17,6 MeV) với D+D (~4,0 MeV theo SGK tr. 102 / 3,27 MeV theo CODATA).",
        evidencePrompt:
          "Thực hành phóng hạt ở nhiệt độ thấp và ở 10⁷ – 10⁸ K trên cả hai kênh D+T, D+D; đối chiếu phương trình và số liệu năng lượng với nguồn từng kênh.",
        activityKey: "nuclear_fusion",
        teacherTip:
          "Đối chiếu rõ con số làm tròn ~4 MeV trong SGK tr. 102 (kênh D+D của Oliphant) với giá trị 3,27 MeV từ bảng khối lượng nguyên tử và kênh mở rộng D+T (17,6 MeV).",
        teacherGuide: {
          learningObjective:
            "Giải thích được điều kiện xảy ra phản ứng nhiệt hạch (nhiệt độ 10⁷ – 10⁸ K, mật độ và thời gian giam giữ) và so sánh được phương trình, năng lượng tỏa ra của hai kênh D+D và D+T.",
          projectorStrategy:
            "Thử kịch bản nhiệt độ thấp (tán xạ Coulomb) rồi nâng lên 10⁷ – 10⁸ K cho cả hai kênh D+D và D+T, chỉ rõ bảng nguồn dữ liệu năng lượng ngay bên dưới.",
          openQuestions: [
            "Vì sao phân hạch ²³⁵₉₂U xảy ra được với neutron chậm ở nhiệt độ thường, còn tổng hợp hai hạt nhân nhẹ lại cần nhiệt độ 10⁷ – 10⁸ K?",
            "So sánh số nucleon tham gia và năng lượng tỏa ra Q giữa hai kênh D+D và D+T?",
          ],
          commonMisconceptions:
            "Học sinh hay nhầm lẫn sản phẩm và năng lượng tỏa ra giữa hai kênh D+D (³₂He + n, ~4 MeV SGK / 3,27 MeV) và D+T (⁴₂He + n, 17,6 MeV).",
          noVideoFallback:
            "Sử dụng mô phỏng va chạm nhiệt hạch và bảng đối chiếu nguồn hai kênh D+D, D+T trực tiếp trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh thử cả hai chế độ nhiệt độ trên đủ hai kênh D+T, D+D và trả lời đúng câu hỏi kiểm tra.",
        },
      },
      {
        id: "b22-after-transfer",
        kind: "b22_after_transfer",
        phase: "after",
        title: "Kiểm tra, đánh giá: Vận dụng bảo toàn A, Z và đọc đồ thị Eₗₖ/A",
        shortTocTitle: "Kiểm tra, đánh giá",
        sgkPages: "tr. 103 · Vận dụng",
        minutes: 12,
        phenomenonPrompt:
          "Vận dụng định luật bảo toàn số khối A, điện tích Z và đồ thị năng lượng liên kết riêng Eₗₖᵣ = Eₗₖ/A để giải bài tập vận dụng và đối chiếu lại dự đoán gốc ở Pha 1.",
        evidencePrompt:
          "Nộp bài làm gồm số neutron thứ cấp k, lập luận từ đồ thị Eₗₖ/A và nhận xét đối chiếu dự đoán gốc; nhận phản hồi chi tiết và khôi phục sau khi tải lại trang.",
        teacherTip:
          "Kiểm tra khả năng tự rà soát khi nộp thiếu thông tin và đối chiếu tiến bộ nhận thức từ Pha 1 sang Pha 3.",
        teacherGuide: {
          learningObjective:
            "Vận dụng kết hợp bảo toàn A, Z và đồ thị Eₗₖ/A để giải bài toán phản ứng hạt nhân và giải thích cơ chế tỏa năng lượng.",
          projectorStrategy:
            "Chiếu phản hồi mẫu cho trường hợp nộp thiếu và trường hợp hoàn chỉnh để rèn kĩ năng trình bày lập luận vật lí.",
          openQuestions: [
            "Vì sao tổng số nucleon A bảo toàn nhưng tổng khối lượng nghỉ của các hạt sản phẩm trong phản ứng tỏa năng lượng lại nhỏ hơn trước phản ứng?",
          ],
          commonMisconceptions:
            "Học sinh viết nhầm “số khối A hụt đi biến thành năng lượng” thay vì độ hụt khối lượng nghỉ Δm.",
          noVideoFallback:
            "Thực hiện trực tiếp phiếu vận dụng có phản hồi tức thời và lưu bền vững trên trình duyệt.",
          completionCriteriaNote:
            "Hoàn thành khi nộp đúng k = 2, chọn đúng giải thích theo đồ thị Eₗₖ/A và ghi nhận xét đối chiếu dự đoán Pha 1.",
        },
      },
    ],
  },
  {
    code: "B23",
    number: 23,
    title: "Hiện tượng phóng xạ",
    sgkPages: "SGK tr. 104–110",
    guidingQuestion:
      "Không biết lúc nào một hạt nhân riêng lẻ phân rã, làm sao ta vẫn dự đoán chính xác độ phóng xạ của cả mẫu theo thời gian?",
    hubHighlight:
      "Bộ đếm Geiger–Müller 3D (Hình 23.2 & Bảng 23.1), buồng sương & vùng trường 3D lệch tia α–β⁻–β⁺–γ, bán rã 3D đồng bộ N(t)/H(t), biển cảnh báo Hình 23.8 và định tuổi ¹⁴₆C.",
    lessonGoals: {
      knowledge:
        "Nêu được bản chất tự phát và ngẫu nhiên của hiện tượng phóng xạ qua thí nghiệm đếm xung Geiger–Müller (Hình 23.2, Bảng 23.1) và vết buồng sương; phân biệt bản chất, khả năng ion hóa, độ đâm xuyên và chiều lệch trong điện trường, từ trường của tia α, β⁻, β⁺, γ; viết được công thức định luật phóng xạ N(t), độ phóng xạ H(t) (đơn vị Bq), nhận diện biển cảnh báo phóng xạ và 3 nguyên tắc an toàn bức xạ (SGK Vật lí 12 KNTT, tr. 104–110).",
      competence:
        "Khóa dự đoán trước giờ học; thao tác trên bộ đếm Geiger–Müller 3D (đặt lại → đo 5 giây → đọc số xung → lưu các lượt độc lập và đối chiếu Bảng 23.1); bật/đảo cực điện trường và từ trường 3D để kiểm chứng chiều lệch α, β⁻, β⁺ và đường truyền thẳng của γ; khảo sát bán rã đồng bộ hạt 3D – bảng – đồ thị N(t)/H(t) và giải bài toán định tuổi ¹⁴₆C.",
      quality:
        "Hình thành ý thức tuân thủ nghiêm ngặt biển cảnh báo và ba nguyên tắc an toàn bức xạ (Thời gian – Khoảng cách – Che chắn) trong học tập, y tế và đời sống.",
    },
    sections: [
      {
        id: "b23-cloud-geiger",
        kind: "b23_cloud_geiger",
        phase: "before",
        title: "Bộ đếm Geiger–Müller 3D (Hình 23.2), Bảng 23.1 và tính ngẫu nhiên của phóng xạ",
        shortTocTitle: "Bộ đếm Geiger 3D & Bảng 23.1",
        sgkPages: "tr. 104–105",
        minutes: 12,
        phenomenonPrompt:
          "Lần theo đường đi tín hiệu trên bộ đếm Geiger–Müller 3D (Hình 23.2), thực hiện các lượt đo cửa sổ 5 giây liên tiếp và đối chiếu với dãy 1, 3, 2, 0, 3, 1 của Bảng 23.1 SGK.",
        evidencePrompt:
          "Khóa dự đoán ban đầu kèm lí do, thực hiện và lưu tối thiểu 2 lượt đo 5 giây trên bộ đếm Geiger–Müller 3D (kể cả lượt 0 xung nếu có) để rút ra tính ngẫu nhiên.",
        activityKey: "geiger_random_decay",
        teacherTip:
          "Giao trước giờ học (12 phút). Nhấn mạnh số đọc trên bộ đếm là số xung ghi nhận trong cửa sổ đo 5 giây (khác với hoạt độ H tính bằng Bq ở phần bán rã) và giải thích vì sao khoảng 15–20 s trên Bảng 23.1 có 0 xung.",
        teacherGuide: {
          learningObjective:
            "Trình bày được cấu tạo và đường truyền tín hiệu của bộ đếm Geiger–Müller (Hình 23.2: giá giữ mẫu, ống đếm, đầu nối BNC, dây tín hiệu, bộ đếm có màn hình, bộ định thời); rút ra tính ngẫu nhiên của phân rã phóng xạ từ các lượt đo 5 giây và Bảng 23.1 SGK tr. 105.",
          projectorStrategy:
            "Chiếu góc Toàn cảnh → Cận đầu dò → Đọc màn hình trên bộ đếm Geiger 3D, bấm đo hai khoảng 5 giây ngay trên lớp và đặt cạnh Bảng 23.1 SGK (1, 3, 2, 0, 3, 1).",
          openQuestions: [
            "Trên Bảng 23.1 SGK, hai khoảng 5–10 s (3 xung) và 15–20 s (0 xung) đều dài đúng 5 giây và giữ nguyên mẫu phóng xạ — vì sao số xung lại khác nhau?",
            "Vì sao số xung đọc trên màn hình ống đếm Geiger–Müller trong 5 giây không được gọi trực tiếp là độ phóng xạ H (Bq) của toàn bộ mẫu?",
          ],
          commonMisconceptions:
            "Học sinh dễ nghĩ nguồn phóng xạ phát tia đều đặn như nhịp đồng hồ (nên thấy 0 xung tưởng máy hỏng) hoặc đồng nhất số xung đếm được ở một góc nhỏ với hoạt độ H (Bq) của cả nguồn. Cách gỡ: Tách riêng nhãn Bảng 23.1 SGK với Kết quả mô phỏng và đóng khung phân biệt số xung cửa sổ đo với H (Bq).",
          noVideoFallback:
            "Hoàn thành trọn vẹn bằng bộ đếm Geiger–Müller (tự động chuyển sang sơ đồ dự phòng tương tác khi trình duyệt thiếu WebGL) và Bảng 23.1 SGK ngay trên trang.",
          completionCriteriaNote:
            "Ghi nhận hoàn thành khi học sinh đã khóa dự đoán ban đầu kèm lí do và đo, lưu tối thiểu 2 lượt 5 giây trên bộ đếm Geiger–Müller.",
        },
      },
      {
        id: "b23-radiation-types",
        kind: "b23_radiation_types",
        phase: "in_class",
        title: "Buồng sương và vùng trường 3D khảo sát tia α, β⁻, β⁺, γ",
        shortTocTitle: "Buồng sương & tia α, β⁻, β⁺, γ",
        sgkPages: "tr. 105–107",
        minutes: 15,
        phenomenonPrompt:
          "Phân biệt vết sương ngưng tụ quan sát được với đường đi trong mô hình giải thích; bật điện trường E, từ trường B, đảo cực trên vùng trường 3D và kiểm tra độ đâm xuyên của α, β⁻, β⁺, γ.",
        evidencePrompt:
          "Đối chiếu chiều lệch của các hạt mang điện (α, β⁻, β⁺), đường đi thẳng của tia γ và vật liệu chắn tối thiểu của từng loại tia.",
        activityKey: "radiation_properties",
        teacherTip:
          "Lưu ý học sinh phân biệt rõ vệt giọt sương ngưng tụ thực nghiệm trong buồng sương với đường quỹ đạo + vectơ lực trong chế độ Mô hình giải thích; hạt α lệch ít hơn hẳn β⁺ dù mang điện +2e vì m_α ≈ 7 300 m_e.",
        teacherGuide: {
          learningObjective:
            "Phân biệt được vết ngưng tụ thực nghiệm trong buồng sương với đường đi trong mô hình giải thích; xác định đúng chiều lệch của α, β⁻, β⁺ và đường truyền thẳng của γ khi bật/đảo cực điện trường E và từ trường B; so sánh khả năng ion hóa và đâm xuyên (Hình 23.3–23.4 SGK).",
          projectorStrategy:
            "Bật lần lượt Điện trường E (đảo cực +/-) và Từ trường B (đảo cực N/S) trên vùng trường 3D, yêu cầu học sinh dùng lực điện F = qE và quy tắc bàn tay trái kiểm chứng chiều cong của α, β⁻, β⁺ và tia γ đi thẳng.",
          openQuestions: [
            "Trong buồng sương, mắt ta nhìn thấy hạt α, β hay nhìn thấy vệt giọt hơi rượu/nước ngưng tụ quanh các ion dọc đường bay?",
            "Khi đảo cực hai bản tụ điện (hoặc đảo cực hai từ cực N–S), chiều lệch của α, β⁻, β⁺ và đường đi của tia γ thay đổi như thế nào?",
          ],
          commonMisconceptions:
            "Học sinh hay vẽ tia α cong nhiều hơn tia β vì thấy |q_α| = 2e > |q_β| = e, hoặc nhầm vệt sương là bản thân hạt nhân phóng xạ. Cách gỡ: Đặt cạnh nhau chế độ Vết ngưng tụ và Mô hình giải thích trên vùng trường 3D.",
          noVideoFallback:
            "Sử dụng trực tiếp buồng sương và vùng điện – từ trường 3D (kèm sơ đồ dự phòng khi thiếu WebGL) ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh thử nghiệm điện trường & từ trường (có đảo cực), khảo sát các tia α, β⁻, β⁺, γ và trả lời đúng câu hỏi kiểm tra.",
        },
      },
      {
        id: "b23-half-life",
        kind: "b23_half_life",
        phase: "in_class",
        title: "Định luật phóng xạ, chu kì bán rã T và độ phóng xạ H(t) đồng bộ 3D",
        shortTocTitle: "Bán rã 3D & độ phóng xạ H(t)",
        sgkPages: "tr. 107–109",
        minutes: 18,
        phenomenonPrompt:
          "Quan sát đồng bộ mô hình tập hợp hạt nhân 3D phân rã ngẫu nhiên, bảng số liệu tại các mốc t/T và đồ thị N(t), H(t) (đơn vị Bq) theo cùng thời gian t và chu kì bán rã T.",
        evidencePrompt:
          "Thử Bắt đầu, Tạm dừng, Đặt lại; làm rõ tính ngẫu nhiên của từng hạt riêng lẻ đối lập với xu hướng giảm hàm mũ của cả quần thể lớn và tính H(t) = λN(t) (Bq).",
        activityKey: "radioactive_decay_half_life",
        teacherTip:
          "Cho học sinh chọn theo dõi 1 hạt nhân bất kì trong khối 3D rồi chạy lại để thấy không biết trước lúc nào hạt đó phân rã, nhưng đường N(t) và H(t) (Bq) của cả mẫu luôn bám quy luật 2^(−t/T).",
        teacherGuide: {
          learningObjective:
            "Hiểu và vận dụng được công thức N(t) = N₀·2^(−t/T) = N₀·e^(−λt) và độ phóng xạ H(t) = λN(t) = H₀·2^(−t/T) (đơn vị Bq); kết nối từ tính ngẫu nhiên của từng hạt nhân tới quy luật thống kê của quần thể.",
          projectorStrategy:
            "Bấm Bắt đầu → Tạm dừng ở mốc t = T và t = 2T để học sinh đối chiếu cùng lúc số hạt còn lại trên khối 3D, dòng tương ứng trên bảng và điểm dóng trên đồ thị N(t)/H(t).",
          openQuestions: [
            "Nếu theo dõi riêng hạt nhân #1 trong mẫu, ta có biết chính xác giây nào nó sẽ phân rã không? Vì sao cả mẫu lớn lại giảm đúng một nửa sau mỗi chu kì T?",
            "Khi tính độ phóng xạ H = (ln 2 / T)·N theo đơn vị Becquerel (Bq), chu kì bán rã T phải đổi sang đơn vị nào?",
          ],
          commonMisconceptions:
            "Học sinh thường tưởng sau 2 chu kì bán rã (2T) mẫu mất hết 100% hạt nhân mẹ, hoặc quên đổi T từ năm/ngày/phút sang giây khi tính H (Bq).",
          noVideoFallback:
            "Sử dụng mô hình hạt 3D đồng bộ bảng và đồ thị N(t)/H(t) (có chế độ dự phòng khi thiếu WebGL) kèm Bảng 23.2 SGK ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh vận hành mô phỏng bán rã đồng bộ, thay đổi tham số khảo sát và trả lời đúng câu hỏi kiểm tra.",
        },
      },
      {
        id: "b23-safety",
        kind: "b23_safety",
        phase: "in_class",
        title: "Ảnh hưởng của tia phóng xạ, biển cảnh báo và ba nguyên tắc an toàn",
        shortTocTitle: "Biển cảnh báo & an toàn bức xạ",
        sgkPages: "tr. 109–110",
        minutes: 12,
        phenomenonPrompt:
          "Nhận diện biển cảnh báo phóng xạ chuẩn SGK (cánh quạt ba cánh nền vàng & biển bổ sung ISO nền đỏ) và thử nghiệm 3 nguyên tắc Thời gian – Khoảng cách – Che chắn.",
        evidencePrompt:
          "Phân biệt chiếu xạ ngoài với nhiễm xạ trong và vận dụng 3 nguyên tắc giảm liều chiếu xạ cho tình huống thực tế.",
        activityKey: "radiation_safety",
        teacherTip:
          "Làm rõ hai biển cảnh báo phóng xạ trong SGK và phân biệt vì sao nguồn α ở ngoài da dễ chắn nhưng hít/nuốt vào cơ thể lại rất nguy hiểm.",
        teacherGuide: {
          learningObjective:
            "Nhận biết đúng các biển cảnh báo khu vực/nguồn phóng xạ nguy hiểm trong SGK và áp dụng ba nguyên tắc cơ bản phòng chống phóng xạ: giảm thời gian tiếp xúc, tăng khoảng cách và che chắn thích hợp.",
          projectorStrategy:
            "Chiếu song song hai biển cảnh báo phóng xạ (nền vàng cánh quạt & nền đỏ bổ sung ISO) rồi cho học sinh điều chỉnh khoảng cách, thời gian, vật liệu chắn để kiểm chứng quy luật giảm liều.",
          openQuestions: [
            "Khi gặp vật lạ có gắn biển cảnh báo phóng xạ, học sinh cần xử trí như thế nào?",
            "Vì sao tăng khoảng cách từ 1 m lên 3 m tới nguồn điểm lại làm cường độ bức xạ giảm tới 9 lần?",
          ],
          commonMisconceptions:
            "Học sinh tưởng quần áo thường chắn được tia γ hoặc không phân biệt nguy cơ chiếu xạ ngoài với nhiễm xạ trong.",
          noVideoFallback:
            "Dùng hình biển cảnh báo chuẩn SGK và bàn mô phỏng an toàn bức xạ ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh thực hành phối hợp 3 nguyên tắc đưa liều về ngưỡng an toàn, hoàn tất tình huống và lưu kết quả kiểm tra.",
        },
      },
      {
        id: "b23-carbon14",
        kind: "b23_carbon14",
        phase: "after",
        title: "Kiểm tra, đánh giá: Định tuổi cổ vật bằng đồng vị ¹⁴₆C và vận dụng an toàn",
        shortTocTitle: "Kiểm tra, đánh giá (¹⁴₆C)",
        sgkPages: "tr. 109–110 · Vận dụng",
        minutes: 15,
        phenomenonPrompt:
          "Đo độ phóng xạ ¹⁴₆C (Bq) của mẫu gỗ khảo cổ so với mẫu gỗ đang sống cùng khối lượng (chu kì bán rã T ≈ 5 730 năm).",
        evidencePrompt:
          "Tính tuổi mẫu khảo cổ từ tỉ số H/H₀, trả lời bài tập vận dụng định luật phóng xạ – an toàn bức xạ và lưu kết quả để mở lại.",
        activityKey: "carbon14_dating",
        teacherTip:
          "Nhiệm vụ vận dụng sau giờ học (15 phút): nhấn mạnh phải so sánh độ phóng xạ H và H₀ trên cùng khối lượng carbon và kiểm tra đúng đơn vị năm / Bq.",
        teacherGuide: {
          learningObjective:
            "Vận dụng công thức H(t) = H₀·2^(−t/T) = H₀·e^(−λt) để tính tuổi cổ vật hữu cơ bằng đồng vị ¹⁴₆C (T ≈ 5 730 năm) và giải bài toán thực tế về độ phóng xạ (Bq).",
          projectorStrategy:
            "Cho học sinh tự hoàn thành sau giờ học, nhận phản hồi giải thích chi tiết từng bước tính và đối chiếu lại với dự đoán đã khóa ở Pha 1.",
          openQuestions: [
            "Vì sao chỉ khi sinh vật chết đi thì tỉ lệ ¹⁴₆C trong mẫu mới bắt đầu giảm theo quy luật hàm mũ?",
            "Vì sao phải đo H₀ trên mẫu gỗ tươi cùng loại và cùng khối lượng với mẫu gỗ cổ?",
          ],
          commonMisconceptions:
            "Học sinh quên quy đổi cùng khối lượng mẫu hoặc nhầm lẫn giữa phần trăm còn lại (N_t/N₀) với phần trăm đã phân rã (ΔN/N₀).",
          noVideoFallback:
            "Sử dụng trực tiếp phòng thực hành định tuổi ¹⁴₆C và phiếu vận dụng tự chấm lưu kết quả ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh khảo sát tỉ số H/H₀, nộp bài vận dụng nhận phản hồi đúng và lưu kết quả bền vững.",
        },
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
export type B22TrackPartCode = "1" | "2" | "3" | "4";

export interface PreClassWorkData {
  readonly apparatusRoles?: Readonly<Partial<Record<B21ApparatusPartCode, string>>>;
  readonly selfCheckChoice?: string;
  readonly bringToClassQuestion?: string;
  readonly b22TrackRoles?: Readonly<Partial<Record<B22TrackPartCode, string>>>;
  readonly b22AzChecked?: boolean;
  readonly b23Count5to10?: string;
  readonly b23Count15to20?: string;
  readonly b23GeigerTwoRunsDone?: boolean;
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
  readonly b22NeutronCount?: string;
  readonly b22AfterChoice?: string;
  readonly b22ReasonNote?: string;
  readonly b22Checked?: boolean;
  readonly b22SubmittedAt?: string;
  readonly b23C14AgeYears?: string;
  readonly b23C14AssumptionChoice?: string;
  readonly b23SafetyActionChoice?: string;
  readonly b23ReflectionNote?: string;
  readonly b23AfterChecked?: boolean;
  readonly b23SubmittedAt?: string;
  readonly b23C14LabDone?: boolean;
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
