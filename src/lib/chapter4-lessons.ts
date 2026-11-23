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
      "Bộ thiết bị tán xạ hạt alpha Rutherford V3, đối chiếu 3 mô hình nguyên tử, cấu tạo hạt nhân Silic-28 và đồng vị Hydrogen.",
    sections: [
      {
        id: "b21-pre-setup",
        kind: "b21_pre_rutherford",
        phase: "before",
        title: "Nhận diện bộ thí nghiệm tán xạ hạt alpha và ghi dự đoán",
        shortTocTitle: "Nhận diện thiết bị & dự đoán",
        sgkPages: "tr. 91–92",
        minutes: 12,
        phenomenonPrompt:
          "Quan sát cấu tạo bộ thí nghiệm chân không gồm nguồn phát hạt α, khe chuẩn trực, lá vàng mỏng và màn huỳnh quang ZnS.",
        evidencePrompt:
          "Phân biệt đốm sáng quan sát trên màn với quỹ đạo mô hình, rồi lưu dự đoán ban đầu trước khi lên lớp đo.",
        teacherTip:
          "Giao trước giờ học để học sinh phân biệt dấu hiệu quan sát trực tiếp (đốm sáng trên màn ZnS) với đường quỹ đạo giải thích, đồng thời chốt dự đoán cá nhân.",
      },
      {
        id: "b21-rutherford-v3",
        kind: "b21_rutherford_v3",
        phase: "in_class",
        title: "Thí nghiệm tán xạ hạt alpha (Rutherford V3)",
        shortTocTitle: "Thí nghiệm tán xạ hạt alpha",
        sgkPages: "tr. 91–92",
        minutes: 18,
        phenomenonPrompt:
          "Bắn hạt α vào lá vàng mỏng ở cùng động năng E nhưng thay đổi tham số va chạm b để quan sát vị trí đốm sáng và góc tán xạ θ.",
        evidencePrompt:
          "Đối chiếu dự đoán trước giờ học, lưu hai lượt đo cùng E khác b và viết lời giải thích vì sao có hạt bị bật ngược.",
        activityKey: "rutherford_alpha_scattering",
        teacherTip:
          "Chiếu bàn thí nghiệm nền tối lên màn hình lớp. Nhắc học sinh giữ nguyên E giữa hai lượt lưu để cô lập vai trò của khoảng cách b tới tâm hạt nhân.",
      },
      {
        id: "b21-atomic-models",
        kind: "b21_atomic_models",
        phase: "in_class",
        title: "So sánh các mô hình nguyên tử",
        shortTocTitle: "So sánh các mô hình nguyên tử",
        sgkPages: "tr. 91–93",
        minutes: 12,
        phenomenonPrompt:
          "Đối chiếu trên cùng một nguyên tử Hydrogen trung hòa (¹₁H): vùng điện tích dương ở Thomson so với Rutherford, và mật độ chấm đo vị trí electron trên lát cắt đám mây 1s.",
        evidencePrompt:
          "Chọn mô hình khớp trực tiếp với bằng chứng hạt α lệch góc lớn trên lá vàng, viết câu giải thích và phân biệt với bước mô tả đám mây xác suất.",
        teacherTip:
          "Trên máy chiếu lớp học, bật “Đặt Thomson – Rutherford cạnh nhau” để cả lớp thấy vùng +1e thu về tâm; sau đó chuyển sang Đám mây electron lấy +1 mẫu rồi +100 mẫu.",
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
          "Dùng hạt nhân Silic-28 để nhận diện proton, neutron và đối chiếu Bảng 21.1 về tỉ lệ kích thước nguyên tử so với hạt nhân.",
        evidencePrompt:
          "Xác định Z = 14, N = 14 của Silic-28, tính tỉ số đường kính nguyên tử / hạt nhân (~10⁴–10⁵ lần) và ghi nhận sự khác biệt tỉ lệ phóng đại giữa hai hình.",
        activityKey: "nuclear_structure_builder",
        teacherTip:
          "Nhấn mạnh cảnh báo tỉ lệ phóng đại: hình vẽ nguyên tử luôn phải phóng to chấm hạt nhân lên hàng nghìn lần để mắt thường nhìn thấy được.",
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
          "Đọc số khối A, điện tích Z, tính N = A − Z và so sánh ba đồng vị của nguyên tố Hydrogen.",
        evidencePrompt:
          "Lập bảng Z, N, A của Protium (¹₁H), Deuterium (²₁H), Tritium (³₁H) và nêu lí do ba hạt nhân thuộc cùng một nguyên tố hóa học.",
        activityKey: "isotope_and_nuclear_size",
        teacherTip:
          "Kiểm tra cách học sinh viết chỉ số trên A và chỉ số dưới Z bên trái kí hiệu nguyên tố; tránh nhầm số khối A với số neutron N.",
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
          "Tính Z, N, bán kính gần đúng của hạt nhân ²⁷₁₃Al và giải thích sự thay đổi tỉ lệ hạt α tán xạ góc lớn so với lá vàng.",
        teacherTip:
          "Dùng làm phiếu đánh giá nhanh cuối bài hoặc giao về nhà để kiểm tra khả năng chuyển giao mô hình hạt nhân sang nguyên tố khác.",
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
   LƯU BẰNG CHỨNG & DỰ ĐOÁN CỦA HỌC SINH THEO TỪNG BÀI HỌC
   ========================================================================== */

export interface StudentLessonNotebook {
  /** Dự đoán ghi ở pha Trước giờ học (được gọi lại ở pha Trong giờ học) */
  readonly preClassPredictionChoice?: string;
  readonly preClassPredictionReason?: string;
  /** Ghi chú bằng chứng của từng mục theo section.id */
  readonly sectionNotes: Readonly<Record<string, string>>;
  /** Mục đã hoàn thành (mô phỏng báo onProgress(true) hoặc học sinh hoàn tất nhiệm vụ đọc/ghi) */
  readonly completedSectionIds: readonly string[];
}

export const STUDENT_NOTEBOOK_PREFIX = "physics-chapter4-notebook-v1:";

export const EMPTY_STUDENT_NOTEBOOK: StudentLessonNotebook = {
  sectionNotes: {},
  completedSectionIds: [],
};

export function loadStudentNotebook(code: NuclearPhysicsLessonCode): StudentLessonNotebook {
  if (typeof window === "undefined") return EMPTY_STUDENT_NOTEBOOK;
  try {
    const raw = window.localStorage.getItem(`${STUDENT_NOTEBOOK_PREFIX}${code}`);
    if (!raw) return EMPTY_STUDENT_NOTEBOOK;
    const parsed = JSON.parse(raw) as Partial<StudentLessonNotebook>;
    return {
      preClassPredictionChoice:
        typeof parsed.preClassPredictionChoice === "string"
          ? parsed.preClassPredictionChoice
          : undefined,
      preClassPredictionReason:
        typeof parsed.preClassPredictionReason === "string"
          ? parsed.preClassPredictionReason
          : undefined,
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
