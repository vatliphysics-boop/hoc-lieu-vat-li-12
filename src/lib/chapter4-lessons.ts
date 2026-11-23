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
  /** Hướng dẫn sư phạm chi tiết cho Chế độ Giáo viên & đồng bộ Kế hoạch bài dạy */
  readonly teacherGuide: SectionTeacherGuide;
  /** Liên kết Video Flow tùy chọn — chỉ hiển thị nút phát khi có URL thật */
  readonly flowVideoUrl?: string;
}

type RawChapter4SectionSpec = Omit<Chapter4SectionSpec, "teacherGuide"> & {
  readonly teacherGuide?: SectionTeacherGuide;
};

type RawChapter4LessonSpec = Omit<Chapter4LessonSpec, "sections"> & {
  readonly sections: readonly RawChapter4SectionSpec[];
};

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

function buildDefaultTeacherGuide(section: RawChapter4SectionSpec): SectionTeacherGuide {
  if (section.teacherGuide) return section.teacherGuide;
  return {
    learningObjective: section.phenomenonPrompt,
    projectorStrategy: `${section.teacherTip} Trình chiếu sơ đồ hoặc bảng số liệu lên màn hình lớp và yêu cầu học sinh đối chiếu với SGK (${section.sgkPages}).`,
    openQuestions: [
      `Dấu hiệu thực nghiệm trực tiếp trong mục “${section.shortTocTitle}” là gì?`,
      `Từ bằng chứng vừa ghi nhận, ta rút ra quy luật vật lí nào theo SGK (${section.sgkPages})?`,
    ],
    commonMisconceptions:
      "Học sinh dễ nhầm giữa dấu hiệu quan sát thực nghiệm với mô hình giải thích hoặc quên kiểm tra đơn vị trước khi tính toán; cần yêu cầu chỉ rõ dữ kiện gốc trên hình/bảng.",
    noVideoFallback: `Hoàn thành trọn vẹn mục học bằng sơ đồ trực quan, bảng dữ liệu SGK (${section.sgkPages}) và mô phỏng tương tác ngay trên trang mà không phụ thuộc video.`,
    completionCriteriaNote: `Ghi nhận hoàn thành khi học sinh thực hiện trọn vẹn thao tác/câu hỏi kiểm tra và lưu bằng chứng: ${section.evidencePrompt}`,
  };
}

export function getSectionTeacherGuide(section: Chapter4SectionSpec): SectionTeacherGuide {
  return section.teacherGuide;
}

const RAW_CHAPTER4_LESSONS: readonly RawChapter4LessonSpec[] = [
  {
    code: "B21",
    number: 21,
    title: "Cấu trúc hạt nhân",
    sgkPages: "SGK tr. 91–95",
    guidingQuestion:
      "Từ những đốm sáng trên màn, làm sao biết nguyên tử có một hạt nhân rất nhỏ?",
    hubHighlight:
      "Bộ thiết bị tán xạ hạt alpha Rutherford V3, đối chiếu 3 mô hình nguyên tử, cấu tạo hạt nhân Silic-28 và đồng vị Hydrogen.",
    lessonGoals: {
      knowledge:
        "Trình bày được thí nghiệm tán xạ hạt alpha của Rutherford, rút ra mô hình nguyên tử có hạt nhân rất nhỏ mang điện dương ở tâm; nêu được cấu tạo hạt nhân từ proton và neutron (nucleon), đơn vị khối lượng nguyên tử amu, công thức gần đúng bán kính hạt nhân R = 1,2·10⁻¹⁵·A¹/³ (m), kí hiệu hạt nhân ᴬᶻX và khái niệm đồng vị (SGK Vật lí 12, tr. 91–95).",
      competence:
        "Phân biệt được dấu hiệu quan sát thực nghiệm (đốm sáng trên màn huỳnh quang S) với đường quỹ đạo mô hình; tự chuẩn bị dự đoán có lí giải trước giờ học; đọc và xử lí được số liệu Bảng 21.1, giải thích sự khác biệt tỉ lệ phóng đại và vận dụng tính Z, N, R cho hạt nhân mới (²⁷₁₃Al).",
      quality:
        "Trung thực khi lưu giữ nguyên dự đoán ban đầu (kể cả khi dự đoán chưa khớp thực nghiệm) để đối chiếu khoa học trên lớp; cẩn trọng với đơn vị đo lường vi mô (10⁻¹⁰ m và 10⁻¹⁵ m).",
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
          "Đối chiếu mô hình nguyên tử ban đầu của Thomson (Hình 21.1) với cấu tạo bộ thí nghiệm tán xạ hạt α (Hình 21.2a–21.2b: nguồn R, lá vàng D, màn huỳnh quang S, kính hiển vi M ở vị trí (1) và (2)).",
        evidencePrompt:
          "Chốt và khóa lưu dự đoán ban đầu kèm lí do, ghép đúng vai trò 4 bộ phận R–D–S–M, trả lời câu tự kiểm tra và ghi câu hỏi mang vào lớp.",
        teacherTip:
          "Giao trước giờ học (15 phút ở nhà). Đầu tiết mở nhanh thống kê dự đoán ban đầu của học sinh làm mâu thuẫn nhận thức mở màn cho Pha 2.",
        teacherGuide: {
          learningObjective:
            "Từ mô hình Thomson (Hình 21.1), nêu được dự đoán có lí do về đường đi của hạt α, nhận diện đúng chức năng 4 bộ phận cốt lõi (R, D, S, M) trên Hình 21.2 và phân biệt được đốm sáng trên màn S với đường quỹ đạo mô hình.",
          projectorStrategy:
            "Không giảng lại toàn bộ mô tả thiết bị; dành 2 phút đầu giờ chiếu Hình 21.1 cạnh Hình 21.2b và gọi 2 học sinh có dự đoán trái ngược đọc to “Sản phẩm mang vào lớp”.",
          openQuestions: [
            "Nếu điện tích dương trải đều khắp nguyên tử như Hình 21.1 thì lực đẩy lên hạt α có đủ mạnh để làm hạt bật ngược lại vị trí (2) không?",
            "Khi kính hiển vi M quay từ vị trí (1) sang vị trí (2) trên Hình 21.2b, mắt người quan sát thật sự nhìn thấy gì trên màn S?",
          ],
          commonMisconceptions:
            "Học sinh thường tưởng mắt đặt ở kính hiển vi M nhìn thấy cả vệt đường bay của hạt α, hoặc tự sửa lại dự đoán ban đầu sau khi đọc trước sách giáo khoa. Cách gỡ: Hệ thống khóa giữ nguyên dự đoán chốt lần đầu (initialPredictionChoice) và nhấn mạnh chỉ đốm sáng lóe lên trên màn S mới là dữ kiện quan sát trực tiếp.",
          noVideoFallback:
            "Học sinh hoàn thành trọn vẹn 100% nhiệm vụ Pha 1 bằng sơ đồ Hình 21.1, ảnh thiết bị Rutherford V3, mặt cắt Hình 21.2b (có số liệu tần suất vị trí (2) ít hơn (1) cỡ 10⁴ lần) và thao tác nối vai trò ngay trên trang.",
          completionCriteriaNote:
            "Chỉ đánh dấu hoàn thành thực chất khi học sinh đã: (1) lưu dự đoán + lí do, (2) ghép đúng vai trò cả 4 bộ phận R–D–S–M, và (3) trả lời đúng câu tự kiểm tra Pha 1. Tuyệt đối không tính hoàn thành khi chỉ mở trang hoặc bấm phát video.",
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
          "Bắn hạt α vào lá vàng mỏng ở cùng động năng E nhưng thay đổi tham số va chạm b để quan sát vị trí đốm sáng và góc tán xạ θ, đối chiếu 3 câu hỏi thảo luận SGK tr. 92.",
        evidencePrompt:
          "Đối chiếu với dự đoán ban đầu đã khóa ở Pha 1, lưu hai lượt đo cùng E khác b và giải thích 3 hiện tượng: đa số tới vị trí (1), lực đẩy tĩnh điện làm lệch hướng, và tỉ lệ ~10⁻⁴ bật về vị trí (2).",
        activityKey: "rutherford_alpha_scattering",
        teacherTip:
          "Chiếu bàn thí nghiệm nền tối lên màn hình lớp (15 phút). Nhắc học sinh giữ nguyên E giữa hai lượt lưu để cô lập vai trò của khoảng cách b tới tâm hạt nhân.",
        teacherGuide: {
          learningObjective:
            "Thực hiện phép đo trên mô phỏng Rutherford V3 để kiểm chứng dự đoán Pha 1 và trả lời trọn vẹn 3 câu hỏi thảo luận SGK tr. 92 về cấu trúc rỗng của nguyên tử và hạt nhân tích điện dương rất nhỏ.",
          projectorStrategy:
            "Chiếu hộp “Sản phẩm Pha 1 đã lưu” ở đầu mục, sau đó bật bàn thí nghiệm Rutherford V3 chế độ tách rõ 2 lớp hiển thị: chỉ bật lớp đốm sáng màn S trước, rồi mới bật lớp quỹ đạo mô hình để giải thích góc lệch θ khi b giảm.",
          openQuestions: [
            "Vì sao ở vị trí (1) đối diện nguồn R lại thu được hầu hết các đốm sáng dù lá vàng D dày tới khoảng 1000 lớp nguyên tử?",
            "Điều gì phải tồn tại ở tâm nguyên tử để khoảng 1 trong 10⁴ hạt α bị đẩy bật ngược về vị trí (2) với góc lệch trên 90°?",
          ],
          commonMisconceptions:
            "Học sinh dễ nghĩ hạt α bật ngược do “va chạm cơ học như hai viên bi cứng” hoặc nghĩ electron làm lệch hạt α. Cách gỡ: Nhấn mạnh electron nhẹ hơn hạt α khoảng 7300 lần nên không thể làm bật ngược hạt α; nguyên nhân là lực đẩy tĩnh điện Coulomb cực mạnh từ điện tích dương +Ze tập trung trong vùng rất nhỏ.",
          noVideoFallback:
            "Sử dụng trực tiếp bàn thí nghiệm tương tác Rutherford V3 và bảng đối chiếu 3 câu hỏi thảo luận SGK tr. 92 ngay trên trang để cả lớp khảo sát theo từng giá trị tham số va chạm b.",
          completionCriteriaNote:
            "Hoàn thành khi mô phỏng Rutherford V3 báo đủ 2 lượt đo hợp lệ (cùng E, khác b) và hoàn tất phiếu lập luận.",
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
          "Đối chiếu trên cùng một nguyên tử Hydrogen trung hòa (¹₁H): Hình 21.1 (Thomson), Hình 21.5a (hành tinh nguyên tử Rutherford: Khoảng trống, Hạt nhân, Quỹ đạo của electron) và Hình 21.5b (Đám mây electron).",
        evidencePrompt:
          "Chọn mô hình khớp trực tiếp với bằng chứng hạt α lệch góc lớn trên lá vàng, viết câu giải thích và phân biệt Hình 21.5a với Hình 21.5b.",
        teacherTip:
          "Trên máy chiếu lớp học (10 phút), bật “Đặt Thomson – Rutherford cạnh nhau” để cả lớp thấy vùng +1e thu về tâm; sau đó chuyển sang Đám mây electron lấy +1 mẫu rồi +100 mẫu.",
        teacherGuide: {
          learningObjective:
            "So sánh được sự phân bố điện tích dương và cách mô tả electron giữa Hình 21.1 (Thomson), Hình 21.5a (mô hình hành tinh nguyên tử Rutherford) và Hình 21.5b (mô hình đám mây electron).",
          projectorStrategy:
            "Chiếu song song Thomson – Rutherford để chốt kết luận từ thí nghiệm lá vàng, rồi chuyển nhanh sang Hình 21.5b lấy mẫu vị trí electron để học sinh thấy đám mây không phải electron bị “nhòe ra” mà là mật độ xác suất tìm thấy electron.",
          openQuestions: [
            "Điểm chung quan trọng nhất về hạt nhân giữa Hình 21.5a và Hình 21.5b là gì?",
            "Thí nghiệm lá vàng của Rutherford chứng minh trực tiếp hạt nhân nhỏ ở tâm hay chứng minh hình dạng đám mây electron?",
          ],
          commonMisconceptions:
            "Học sinh hay hiểu lầm “đám mây electron” nghĩa là 1 electron vỡ vụn trải đều khắp không gian. Cách gỡ: Dùng nút lấy mẫu từng chấm vị trí trên mô phỏng để chỉ rõ mỗi lần đo electron vẫn là một hạt tại một vị trí, còn đám mây biểu diễn vùng xác suất.",
          noVideoFallback:
            "Dùng trực tiếp mô phỏng so sánh 3 mô hình nguyên tử kèm thẻ đối chiếu Hình 21.1, Hình 21.5a và Hình 21.5b ngay bên dưới.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh khảo sát mô phỏng so sánh và gửi lập luận đối chiếu đúng mô hình với bằng chứng tán xạ.",
        },
      },
      {
        id: "b21-structure-size",
        kind: "b21_structure_size",
        phase: "in_class",
        title: "Cấu tạo và kích thước hạt nhân",
        shortTocTitle: "Cấu tạo và kích thước hạt nhân",
        sgkPages: "tr. 93–94",
        minutes: 10,
        phenomenonPrompt:
          "Dùng hạt nhân Silic-28 (²⁸₁₄Si), các hằng số khối lượng m_p, m_n, amu (SGK tr. 93) và Bảng 21.1 đầy đủ 8 nguyên tố (SGK tr. 94) để khảo sát thành phần nucleon và tỉ lệ kích thước nguyên tử / hạt nhân.",
        evidencePrompt:
          "Đọc dòng dữ liệu Silicon (A = 28) trên Bảng 21.1, giải thích vì sao hình minh họa phải phóng lớn hạt nhân và dựng đúng hạt nhân mẫu.",
        activityKey: "nuclear_structure_builder",
        teacherTip:
          "Dành 10 phút: cho học sinh đọc trực tiếp đơn vị 10⁻¹⁰ m và 10⁻¹⁵ m ở đầu cột Bảng 21.1 trước khi làm phép chia tỉ số bán kính.",
        teacherGuide: {
          learningObjective:
            "Nêu được thành phần nucleon (proton, neutron), khối lượng theo kg và amu; đọc chính xác Bảng 21.1 (8 nguyên tố SGK tr. 94), vận dụng công thức R = 1,2·10⁻¹⁵·A¹/³ (m) và giải thích vì sao sơ đồ nguyên tử không thể vẽ hạt nhân theo đúng tỉ lệ thực.",
          projectorStrategy:
            "Chiếu Bảng 21.1 và khoanh đỏ hai mũ lũy thừa 10⁻¹⁰ m (nguyên tử) so với 10⁻¹⁵ m (hạt nhân). Gọi học sinh đọc dòng Silicon (A = 28: 2,1·10⁻¹⁰ m và 3,1·10⁻¹⁵ m) và tính nhanh tỉ số cỡ 6,8·10⁴ lần.",
          openQuestions: [
            "Trên Bảng 21.1, khi số khối A tăng từ 1 (Hydrogen) lên 238 (Uranium) thì bán kính hạt nhân tăng theo quy luật nào, có tăng gấp 238 lần không?",
            "Nếu vẽ nguyên tử Silicon rộng bằng mặt bàn học (1 m) theo đúng tỉ lệ thực thì chấm hạt nhân ở tâm rộng bao nhiêu mi-li-mét?",
          ],
          commonMisconceptions:
            "Học sinh rất hay đọc lướt con số 2,1 và 3,1 ở dòng Silicon mà quên nhân 10⁻¹⁰ m và 10⁻¹⁵ m nên tưởng hạt nhân lớn hơn nguyên tử, hoặc tưởng bán kính R tỉ lệ bậc nhất với A thay vì A¹/³. Cách gỡ: Bắt buộc điền kèm bậc độ lớn trong phiếu đọc Bảng 21.1.",
          noVideoFallback:
            "Dùng trực tiếp Bảng 21.1 chuẩn SGK tr. 94, hộp hằng số khối lượng tr. 93, bài tập đọc bảng có lưu localStorage và mô phỏng dựng hạt nhân trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh trả lời đúng nhiệm vụ đọc Bảng 21.1 & giải thích tỉ lệ phóng đại hoặc hoàn thành mô phỏng dựng hạt nhân.",
        },
      },
      {
        id: "b21-symbol-isotopes",
        kind: "b21_symbol_isotopes",
        phase: "in_class",
        title: "Kí hiệu hạt nhân và đồng vị",
        shortTocTitle: "Kí hiệu hạt nhân và đồng vị",
        sgkPages: "tr. 94–95",
        minutes: 10,
        phenomenonPrompt:
          "Đọc kí hiệu chuẩn ᴬᶻX và kí hiệu rút gọn ᴬX, tính N = A − Z, so sánh ba đồng vị Hydrogen (¹₁H, ²₁H, ³₁H) và giải thích sự khác nhau về khối lượng riêng.",
        evidencePrompt:
          "Hoàn thành bài tập nhanh tính N = A − Z, đối chiếu bảng ba đồng vị Hydrogen đúng thuật ngữ SGK tr. 95 và trả lời câu hỏi khối lượng riêng đồng vị.",
        activityKey: "isotope_and_nuclear_size",
        teacherTip:
          "Dành 10 phút cuối tiết trên lớp: kiểm tra cách viết chỉ số A (trên, trái) và Z (dưới, trái), giải thích rõ vì sao viết rút gọn ¹²C vẫn đủ thông tin.",
        teacherGuide: {
          learningObjective:
            "Viết và đọc đúng kí hiệu hạt nhân ᴬᶻX (cùng dạng rút gọn ᴬX), tính được số neutron N = A − Z, phân biệt ba đồng vị của Hydrogen (Hydrogen thường ¹₁H, Hydrogen nặng/deuterium ²₁H, Hydrogen siêu nặng/tritium ³₁H) và giải thích sự khác nhau về tính chất vật lí như khối lượng riêng.",
          projectorStrategy:
            "Chiếu kí hiệu ᴬᶻX cỡ lớn để chốt vị trí chỉ số, sau đó chiếu 3 hạt nhân ¹₁H – ²₁H – ³₁H cạnh nhau cho học sinh đếm nhanh proton và neutron rồi thảo luận câu hỏi khối lượng riêng nước nặng D₂O so với H₂O.",
          openQuestions: [
            "Vì sao khi viết rút gọn là ¹²C hay ²³⁵U mà không ghi chỉ số dưới Z, ta vẫn biết chắc chắn số proton trong hạt nhân?",
            "Hai đồng vị ²₁H và ¹₁H có cùng kích thước vỏ nguyên tử xấp xỉ nhau nhưng hạt nhân ²₁H nặng gấp đôi; vậy khối lượng riêng của chúng ở cùng điều kiện khác nhau thế nào?",
          ],
          commonMisconceptions:
            "Học sinh thường nhầm chỉ số trên A là số neutron N, hoặc nghĩ các đồng vị của cùng nguyên tố thì mọi tính chất vật lí và hóa học đều giống hệt nhau. Cách gỡ: Chỉ rõ cùng Z nên tính chất hóa học tương tự, nhưng khác A nên khối lượng hạt nhân, khối lượng riêng và tính bền phóng xạ khác nhau.",
          noVideoFallback:
            "Dùng bảng so sánh 3 đồng vị Hydrogen chuẩn SGK tr. 95, thẻ bài tập nhanh N = A − Z, câu hỏi khối lượng riêng và mô phỏng khảo sát đồng vị ngay trên trang.",
          completionCriteriaNote:
            "Hoàn thành khi học sinh giải đúng bài tập nhanh N = A − Z + câu hỏi khối lượng riêng đồng vị hoặc hoàn thành hoạt động khảo sát đồng vị.",
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
          "Vận dụng sang tình huống mới sau giờ học: giữ nguyên nguồn phát α nhưng thay lá vàng ¹⁹⁷₇₉Au bằng lá nhôm mỏng ²⁷₁₃Al và nhìn lại dự đoán ban đầu ở Pha 1.",
        evidencePrompt:
          "Tính Z = 13, N = 14, bán kính gần đúng R = 3,6 fm (3,6 × 10⁻¹⁵ m) của ²⁷₁₃Al, giải thích sự thay đổi góc lệch tán xạ và viết câu đối chiếu lại dự đoán Pha 1.",
        teacherTip:
          "Giao sau giờ học (15 phút) để kiểm tra trọn vẹn chuỗi năng lực B21: đọc kí hiệu → tính R theo A¹/³ → suy luận tán xạ Coulomb → phản tư nhận thức Pha 1.",
        teacherGuide: {
          learningObjective:
            "Chuyển giao được mô hình hạt nhân và công thức bán kính R = 1,2·10⁻¹⁵·A¹/³ sang hạt nhân ²⁷₁₃Al (tính đúng Z = 13, N = 14, R = 3,6 fm), dự đoán định tính sự giảm góc tán xạ so với ¹⁹⁷₇₉Au và tự đánh giá sự thay đổi nhận thức so với dự đoán Pha 1.",
          projectorStrategy:
            "Dùng làm nhiệm vụ củng cố sau giờ học hoặc phiếu kiểm tra 5–10 phút đầu tiết kế tiếp; chiếu lại dự đoán khóa ở Pha 1 cạnh câu phản tư Pha 3 để ghi nhận tiến bộ nhận thức của học sinh.",
          openQuestions: [
            "Vì sao hạt nhân ²⁷₁₃Al có số khối A = 27 rất thuận lợi để tính nhẩm căn bậc ba trong công thức R = 1,2·A¹/³ (fm)?",
            "So với suy nghĩ ban đầu của em ở Pha 1 trước khi lên lớp, bằng chứng thực nghiệm nào làm em thuyết phục nhất về sự tồn tại của hạt nhân nhỏ ở tâm?",
          ],
          commonMisconceptions:
            "Học sinh dễ quên lấy căn bậc ba của 27 (lấy 1,2 × 27 thay vì 1,2 × 3 = 3,6 fm) hoặc nghĩ hạt nhân nhẹ hơn thì đẩy hạt α mạnh hơn. Cách gỡ: Phản hồi tức thì nhắc 27¹/³ = 3 và lực đẩy tĩnh điện tỉ lệ thuận với điện tích hạt nhân bia +Ze.",
          noVideoFallback:
            "Phiếu bài tập vận dụng tương tác có chấm phản hồi tức thì và lưu trọn vẹn đáp án vào sổ học tập cục bộ (localStorage), hoạt động độc lập không cần video.",
          completionCriteriaNote:
            "Chỉ ghi nhận hoàn thành khi học sinh nhập đúng Z = 13, N = 14, R = 3,6 fm, chọn đúng giải thích lực đẩy tĩnh điện và ghi nhận xét đối chiếu dự đoán Pha 1.",
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
];

export const CHAPTER4_LESSONS: readonly Chapter4LessonSpec[] = RAW_CHAPTER4_LESSONS.map(
  (lesson) => ({
    ...lesson,
    sections: lesson.sections.map((sec) => ({
      ...sec,
      teacherGuide: buildDefaultTeacherGuide(sec),
    })),
  })
);

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

    const guide = base.teacherGuide;
    const objectiveText = (
      ov?.phenomenonPrompt.trim() ? phenomenon : guide.learningObjective || phenomenon
    ).slice(0, 3800);
    const openQs = guide.openQuestions.join(" | ");
    const teacherActionsText = [
      `Phương án chiếu dạy: ${guide.projectorStrategy}`,
      `Gợi ý tổ chức: ${tip}`,
      `Câu hỏi gợi mở: ${openQs}`,
      `Hiểu nhầm thường gặp & cách gỡ: ${guide.commonMisconceptions}`,
    ]
      .join("\n")
      .slice(0, 3800);
    const supportText = [
      `SGK Vật lí 12 (${base.sgkPages}).`,
      `Dự phòng khi chưa có video: ${guide.noVideoFallback}`,
    ]
      .join(" ")
      .slice(0, 3800);

    activities.push({
      id: `${sample.code.toLowerCase()}-${base.id}`,
      phase: phaseMeta.planPhase,
      title,
      minutes: base.minutes,
      objective: objectiveText,
      instructions: `Khám phá: ${phenomenon}`.slice(0, 3800),
      teacherActions: teacherActionsText,
      studentActions: `Thực hiện hoạt động và ghi lại bằng chứng: ${evidence}`.slice(0, 3800),
      product: evidence,
      evaluation: guide.completionCriteriaNote.slice(0, 3800),
      support: supportText,
      resources,
      activityType:
        phaseMeta.id === "before"
          ? "opening"
          : phaseMeta.id === "after"
            ? "application"
            : "knowledge",
      assignment: `Giao nhiệm vụ (${base.minutes} phút · ${phaseMeta.shortLabel}): ${phenomenon}`.slice(
        0,
        3800
      ),
      implementation: `Học sinh thao tác trên học liệu/mô phỏng và lưu sản phẩm: ${evidence}`.slice(
        0,
        3800
      ),
      discussion: `Thảo luận theo câu hỏi gợi mở: ${openQs}. Gỡ hiểu nhầm: ${guide.commonMisconceptions}`.slice(
        0,
        3800
      ),
      conclusion: `Chốt kiến thức mục “${base.shortTocTitle}” (${base.sgkPages}) theo mục tiêu: ${guide.learningObjective}`.slice(
        0,
        3800
      ),
    });
  }

  const goalsParts = [
    `Câu hỏi trung tâm: ${draft.guidingQuestion.trim() || sample.guidingQuestion}`,
    sample.lessonGoals?.knowledge ? `Kiến thức: ${sample.lessonGoals.knowledge}` : "",
    sample.lessonGoals?.competence ? `Năng lực: ${sample.lessonGoals.competence}` : "",
    sample.lessonGoals?.quality ? `Phẩm chất: ${sample.lessonGoals.quality}` : "",
  ].filter(Boolean);

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
    goals: goalsParts.join("\n").slice(0, 5000),
    preparation:
      "Đồng bộ trực tiếp từ chế độ Giáo viên trên Trang bài học (/hoc-lieu/truc-quan). Mọi mục đều có phương án dự phòng bằng sơ đồ SGK, bảng dữ liệu thật và mô phỏng trực tiếp khi phòng học chưa phát video.",
    reflection:
      "Đối chiếu dự đoán ban đầu đã khóa ở Pha 1 của học sinh với bằng chứng thu được ở Pha 2 và câu phản tư ở Pha 3 để điều chỉnh nhịp thảo luận trên lớp.",
    activities,
    updatedAt: draft.updatedAt,
    flippedForm: "standard",
    ...(sample.lessonGoals
      ? {
          knowledgeGoals: sample.lessonGoals.knowledge.slice(0, 5000),
          competenceGoals: sample.lessonGoals.competence.slice(0, 5000),
          qualityGoals: sample.lessonGoals.quality.slice(0, 5000),
        }
      : {}),
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
  readonly b22BlackettChoice?: string;
  readonly [key: string]: unknown;
}

export interface StructureSizeWorkData {
  readonly selectedElement?: string;
  readonly atomicRadiusInput?: string;
  readonly nuclearRadiusInput?: string;
  readonly scaleExplanation?: string;
  readonly checked?: boolean;
}

export interface SymbolIsotopeWorkData {
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
  readonly b22AfterChoice?: string;
  readonly b24AfterChoice?: string;
  readonly b25ElecChoice?: string;
  readonly b25AfterDays?: string;
}

export interface StudentLessonNotebook {
  /** Dự đoán hiện hành ghi ở pha Trước giờ học */
  readonly preClassPredictionChoice?: string;
  readonly preClassPredictionReason?: string;
  /** Dự đoán chốt lần đầu tiên — khóa giữ nguyên kể cả khi đoán sai để đối chiếu ở Pha 2 & Pha 3 */
  readonly initialPredictionChoice?: string;
  readonly initialPredictionReason?: string;
  /** Kết quả thao tác nhận diện bộ phận Hình 21.2, câu tự kiểm tra và câu hỏi mang vào lớp ở Pha 1 */
  readonly preClassWork?: PreClassWorkData;
  /** Kết quả bài tập đọc Bảng 21.1 & giải thích tỉ lệ phóng đại ở mục Cấu tạo – kích thước */
  readonly structureSizeWork?: StructureSizeWorkData;
  /** Kết quả bài tập nhanh N = A − Z & khối lượng riêng đồng vị ở mục Kí hiệu – đồng vị */
  readonly symbolIsotopeWork?: SymbolIsotopeWorkData;
  /** Kết quả bài tập vận dụng Pha 3 (²⁷₁₃Al & phản tư dự đoán Pha 1) */
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
 * `initialPredictionChoice` / `initialPredictionReason` kể cả khi học sinh sửa lại sau đó.
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
