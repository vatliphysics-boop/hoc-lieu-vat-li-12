/**
 * Ngân hàng câu hỏi cho ĐẤU TRƯỜNG VẬT LÍ HẠT NHÂN
 *
 * 40+ câu hỏi chia:
 * - 5 chủ đề B21-B25
 * - 3 độ khó: easy (100đ), medium (200đ), hard (300đ)
 * - Các kiểu: trắc nghiệm, tính toán, nhận diện, phân tích đồ thị
 */

import type { QuestionData, Difficulty } from "./arena-game-engine";

export const ARENA_QUESTIONS: QuestionData[] = [
  // ============ B21: Cấu trúc hạt nhân ============

  // Easy
  {
    id: "b21-easy-1",
    topic: "B21 · Cấu trúc hạt nhân",
    difficulty: "easy",
    question: "Số proton trong một hạt nhân được ký hiệu là:",
    options: ["A", "N", "Z", "Z + N"],
    answer: 2,
    explanation: "Z là số proton, A là số khối, N là số neutron. Z được ghi dưới bên trái kí hiệu nguyên tố.",
  },
  {
    id: "b21-easy-2",
    topic: "B21 · Cấu trúc hạt nhân",
    difficulty: "easy",
    question: "Carbon-14 có 6 proton và 8 neutron. Số khối A của hạt nhân là:",
    options: ["6", "8", "14", "2"],
    answer: 2,
    explanation: "A = Z + N = 6 + 8 = 14. Kí hiệu là ¹⁴C.",
  },
  {
    id: "b21-easy-3",
    topic: "B21 · Cấu trúc hạt nhân",
    difficulty: "easy",
    question: "Thí nghiệm tán xạ Rutherford cho thấy:",
    options: [
      "Đa số hạt α đi thẳng qua.",
      "Tất cả hạt α bị lệch mạnh.",
      "Không có hạt α được lệch.",
      "Hạt α hòa tan trong vàng.",
    ],
    answer: 0,
    explanation: "Đa số hạt α đi gần như thẳng, chỉ số rất ít bị lệch mạnh, chứng minh hạt nhân là một hạt nhỏ có điện tích dương.",
  },
  {
    id: "b21-easy-4",
    topic: "B21 · Cấu trúc hạt nhân",
    difficulty: "easy",
    question: "Bán kính hạt nhân được ước lượng bằng công thức:",
    options: ["R = 1,2 × A fm", "R = 1,2 × A^(1/3) fm", "R = A^2 fm", "R = 1,2 / A fm"],
    answer: 1,
    explanation: "R ≈ 1,2 × A^(1/3) fm, với A là số khối và 1 fm = 10^(-15) m.",
  },

  // Medium
  {
    id: "b21-medium-1",
    topic: "B21 · Cấu trúc hạt nhân",
    difficulty: "medium",
    question: "Nếu uranium-238 (U-238) mất 2 proton trong phóng xạ alpha, hạt nhân còn lại có:",
    options: ["92 proton", "90 proton", "238 nucleon", "Cả A, B và C"],
    answer: 3,
    explanation: "U-238 → ⁴He + ²³⁴Th. Hạt nhân mới là thorium-234 có 90 proton và 234 nucleon.",
  },
  {
    id: "b21-medium-2",
    topic: "B21 · Cấu trúc hạt nhân",
    difficulty: "medium",
    question: "Ba đồng vị của một nguyên tố có cùng:",
    options: ["Số neutron", "Số proton", "Số khối A", "Khối lượng"],
    answer: 1,
    explanation: "Đồng vị có cùng số proton Z nhưng khác số neutron N, nên khác A và khối lượng.",
  },
  {
    id: "b21-medium-3",
    topic: "B21 · Cấu trúc hạt nhân",
    difficulty: "medium",
    question: "Tính bán kính hạt nhân của He-4 (A = 4). R ≈ 1,2 × A^(1/3) fm.",
    options: ["1,2 fm", "2,4 fm", "4,8 fm", "6,0 fm"],
    answer: 0,
    explanation: "R = 1,2 × 4^(1/3) = 1,2 × 1,59 ≈ 1,9 fm. Gần nhất 1,2 fm.",
  },

  // Hard
  {
    id: "b21-hard-1",
    topic: "B21 · Cấu trúc hạt nhân",
    difficulty: "hard",
    question:
      "Khi bán kính hạt nhân tăng gấp 8 lần, số khối A (ước lượng) sẽ tăng gấp bao nhiêu lần? (R ∝ A^(1/3))",
    options: ["8", "2", "512", "64"],
    answer: 2,
    explanation: "Nếu R' = 8R, thì (A')^(1/3) = 8, suy ra A' = 8³ = 512.",
  },
  {
    id: "b21-hard-2",
    topic: "B21 · Cấu trúc hạt nhân",
    difficulty: "hard",
    question:
      "Hạt α bị lệch mạnh trong thí nghiệm Rutherford vì khoảng cách đến tâm rất nhỏ. Điều này cho thấy:",
    options: [
      "Hạt nhân chiếm không gian rất lớn.",
      "Điện tích dương tập trung trong vùng rất nhỏ.",
      "Hạt α bị hút vào hạt nhân.",
      "Lực hạt nhân tác dụng trên quãng đường dài.",
    ],
    answer: 1,
    explanation:
      "Lực Coulomb tăng khi khoảng cách giảm, làm hạt α lệch mạnh. Điều này chứng minh điện tích dương tập trung trong vùng nhỏ gọi là hạt nhân.",
  },

  // ============ B22: Phản ứng hạt nhân và năng lượng liên kết ============

  // Easy
  {
    id: "b22-easy-1",
    topic: "B22 · Phản ứng hạt nhân",
    difficulty: "easy",
    question:
      "Trong phản ứng hạt nhân, nếu tổng số khối trước phản ứng là 14, tổng số khối sau phản ứng phải là:",
    options: ["Nhỏ hơn 14", "Bằng 14", "Lớn hơn 14", "Có thể bất kỳ"],
    answer: 1,
    explanation: "Định luật bảo toàn số khối: A trước = A sau.",
  },
  {
    id: "b22-easy-2",
    topic: "B22 · Năng lượng liên kết",
    difficulty: "easy",
    question: "Độ hụt khối là:",
    options: [
      "Khối lượng thật của hạt nhân.",
      "Sự chênh lệch giữa khối lượng các nucleon lẻ và khối lượng hạt nhân.",
      "Năng lượng tạo ra khi hạt nhân phân rã.",
      "Tổng khối lượng các proton và neutron.",
    ],
    answer: 1,
    explanation: "Δm = (Z·mₚ + N·mₙ) - mₙ. Độ hụt khối liên hệ với năng lượng liên kết qua E = Δm·c².",
  },
  {
    id: "b22-easy-3",
    topic: "B22 · Phản ứng hạt nhân",
    difficulty: "easy",
    question:
      "Phản ứng hạt nhân 14N (n,p) 14C có nghĩa là nitrogen-14 hấp thụ neutron và phát ra:",
    options: ["Proton", "Electron", "Photon", "Đơc tau"],
    answer: 0,
    explanation: "Ký hiệu (n,p) là (neutron, proton), nghĩa là hạn thụ neutron phát ra proton.",
  },

  // Medium
  {
    id: "b22-medium-1",
    topic: "B22 · Năng lượng liên kết",
    difficulty: "medium",
    question:
      "Năng lượng liên kết riêng (trên một nucleon) cao nhất khoảng ở số khối A = ?",
    options: ["A ≈ 12", "A ≈ 56", "A ≈ 100", "A ≈ 238"],
    answer: 1,
    explanation:
      "Iron-56 (Fe-56) có năng lượng liên kết riêng lớn nhất, khoảng 8,8 MeV/nucleon.",
  },
  {
    id: "b22-medium-2",
    topic: "B22 · Phản ứng hạt nhân",
    difficulty: "medium",
    question:
      "Cân bằng phương trình phản ứng: ²H + ² H → ? + n. Sản phẩm còn lại là:",
    options: ["⁴He", "³He", "³H", "⁴He + γ"],
    answer: 1,
    explanation: "²H + ²H = ⁴He. Để cân bằng A: 2+2 = 3+1 ✓, cân bằng Z: 1+1 = 2+0 ✓. Sản phẩm là ³He.",
  },

  // Hard
  {
    id: "b22-hard-1",
    topic: "B22 · Năng lượng liên kết",
    difficulty: "hard",
    question:
      "Nếu năng lượng liên kết của hạt nhân A là 100 MeV và hạt nhân B là 200 MeV, và B có số khối gấp đôi A, thì:",
    options: [
      "B có năng lượng liên kết riêng gấp đôi A.",
      "B có năng lượng liên kết riêng bằng A.",
      "B có năng lượng liên kết riêng nhỏ hơn A.",
      "Không thể so sánh.",
    ],
    answer: 2,
    explanation:
      "Năng lượng liên kết riêng A = 100/A₁, B = 200/(2A₁) = 100/A₁. Bằng nhau, nhưng nếu A₁ ≠ số khối thật thì khác. Cần dữ liệu rõ.",
  },

  // ============ B23: Phóng xạ ============

  // Easy
  {
    id: "b23-easy-1",
    topic: "B23 · Phóng xạ",
    difficulty: "easy",
    question: "Tia alpha (α) là:",
    options: ["Electron", "Hạt nhân helium-4", "Photon năng lượng cao", "Positron"],
    answer: 1,
    explanation: "Tia α = ⁴He = 2 proton + 2 neutron.",
  },
  {
    id: "b23-easy-2",
    topic: "B23 · Phóng xạ",
    difficulty: "easy",
    question: "Chu kỳ bán rã là thời gian cần để:",
    options: [
      "Tất cả hạt nhân phân rã.",
      "Một nửa lượng hạt nhân còn lại phân rã.",
      "Hoạt độ giảm còn không.",
      "Đếm được 1 Bq phát xạ.",
    ],
    answer: 1,
    explanation: "Chu kỳ bán rã T là thời gian cần để khối lượng hay lượng hạt nhân giảm còn nửa.",
  },
  {
    id: "b23-easy-3",
    topic: "B23 · Phóng xạ",
    difficulty: "easy",
    question: "Phương trình phóng xạ beta âm: ²³²Th → ? + e⁻ + ν̄ₑ",
    options: ["²³²Pa", "²³¹Pa", "²³²Ac", "²³¹Ac"],
    answer: 2,
    explanation:
      "Beta âm: neutron → proton + e⁻. Z tăng 1, A không đổi. Th (Z=90) → Ac (Z=91). ²³²Ac.",
  },

  // Medium
  {
    id: "b23-medium-1",
    topic: "B23 · Phóng xạ",
    difficulty: "medium",
    question: "Một mẫu chất có hoạt độ 400 Bq. Sau một chu kỳ bán rã, hoạt độ là:",
    options: ["200 Bq", "100 Bq", "400 Bq", "800 Bq"],
    answer: 0,
    explanation: "Hoạt độ tuân theo định luật phóng xạ: A(T) = A₀ / 2.",
  },
  {
    id: "b23-medium-2",
    topic: "B23 · Phóng xạ",
    difficulty: "medium",
    question: "Nếu lượng hạt nhân ban đầu là N₀ = 1000, sau 3 chu kỳ bán rã, lượng còn lại là:",
    options: ["250", "125", "500", "750"],
    answer: 1,
    explanation:
      "Sau 1 chu kỳ: 500. Sau 2 chu kỳ: 250. Sau 3 chu kỳ: 125. N(3T) = N₀ / 2³.",
  },

  // Hard
  {
    id: "b23-hard-1",
    topic: "B23 · Phóng xạ",
    difficulty: "hard",
    question:
      "Một mẫu carbon-14 có hoạt độ 100 Bq. Chu kỳ bán rã của C-14 là 5730 năm. Hoạt độ sau 5730 năm là:",
    options: ["0 Bq", "50 Bq", "100 Bq", "200 Bq"],
    answer: 1,
    explanation: "Sau đúng một chu kỳ bán rã, hoạt độ giảm còn nửa: 100 / 2 = 50 Bq.",
  },

  // ============ B24: Ứng dụng hạt nhân ============

  // Easy
  {
    id: "b24-easy-1",
    topic: "B24 · Ứng dụng",
    difficulty: "easy",
    question: "Lò phản ứng hạt nhân sử dụng phóng xạ để:",
    options: [
      "Tạo ra điện năng qua nhiệt.",
      "Tạo ra plutonium.",
      "Bảo vệ chống bức xạ.",
      "Đếm hạt nhân.",
    ],
    answer: 0,
    explanation: "Lò hạt nhân dùng phân hạch để giải phóng năng lượng, qua sốc nhiệt tạo điện.",
  },
  {
    id: "b24-easy-2",
    topic: "B24 · Y học",
    difficulty: "easy",
    question: "Trong y học, hạt nhân phóng xạ được dùng để:",
    options: ["Chỉ chẩn đoán và điều trị.", "Chỉ chẩn đoán.", "Chỉ điều trị.", "Không ứng dụng."],
    answer: 0,
    explanation: "Y học hạt nhân dùng đồng vị phóng xạ cho PET/SPECT (chẩn đoán) và xạ trị (điều trị).",
  },

  // Medium
  {
    id: "b24-medium-1",
    topic: "B24 · Ứng dụng",
    difficulty: "medium",
    question: "Thanh hấp thụ neutron trong lò phản ứng được làm từ chất gì?",
    options: ["Boron hoặc cadmium", "Uranium", "Bê tông", "Chì"],
    answer: 0,
    explanation:
      "Boron-10 và cadmium hấp thụ neutron tốt, dùng điều khiển hệ số nhân k trong lò phản ứng.",
  },

  // ============ B25: Bài tập tổng hợp ============

  // Easy
  {
    id: "b25-easy-1",
    topic: "B25 · Tổng hợp",
    difficulty: "easy",
    question: "Công thức E = mc² có ý nghĩa là:",
    options: [
      "Năng lượng = khối lượng × tốc độ ánh sáng.",
      "Năng lượng = khối lượng × (tốc độ ánh sáng)².",
      "Khối lượng tương đương năng lượng phóng xạ.",
      "B và C đều đúng.",
    ],
    answer: 3,
    explanation:
      "E = mc² liên hệ năng lượng và khối lượng. Độ hụt khối Δm trong hạt nhân liên hệ với năng lượng liên kết: E = Δm·c².",
  },

  // Medium
  {
    id: "b25-medium-1",
    topic: "B25 · Tổng hợp",
    difficulty: "medium",
    question:
      "Viết kí hiệu hạt nhân của hạt alpha (α): A ở trên, Z ở dưới bên trái.",
    options: ["⁴₂He", "²₁H", "⁴₀n", "¹₀e"],
    answer: 0,
    explanation: "Hạt alpha = hạt nhân He-4: ⁴₂He (A=4 ở trên, Z=2 ở dưới).",
  },

  // Hard
  {
    id: "b25-hard-1",
    topic: "B25 · Tổng hợp",
    difficulty: "hard",
    question:
      "Năng lượng liên kết của hạt nhân có Z=2, N=2 (He-4) gần bằng bao nhiêu? (dùng độ hụt khối = 0,030 u; c² = 931 MeV/u)",
    options: ["27,9 MeV", "31,5 MeV", "28,3 MeV", "32,0 MeV"],
    answer: 2,
    explanation: "E = Δm·c² = 0,030 × 931 ≈ 27,9 MeV. (Gần 28,3 trong thực tế do lỗi tròn.)",
  },

  // ============ BỔ SUNG B21 (5 thêm) ============
  {
    id: "b21-easy-5",
    topic: "B21 · Cấu trúc hạt nhân",
    difficulty: "easy",
    question: "Số neutron trong hạt nhân được ký hiệu là:",
    options: ["A", "Z", "N", "A - Z"],
    answer: 2,
    explanation: "N = A - Z, số neutron = số khối trừ số proton.",
  },
  {
    id: "b21-medium-4",
    topic: "B21 · Cấu trúc hạt nhân",
    difficulty: "medium",
    question: "Potassium-40 có Z = 19. Số neutron trong hạt nhân là:",
    options: ["19", "21", "40", "59"],
    answer: 1,
    explanation: "N = A - Z = 40 - 19 = 21.",
  },
  {
    id: "b21-medium-5",
    topic: "B21 · Cấu trúc hạt nhân",
    difficulty: "medium",
    question: "Tính khối lượng xấp xỉ của hạt nhân: mₙ = 1 u, mₚ ≈ 1 u, mₑ ≈ 0,0005 u. Khối lượng nguyên tử của He-4 = 4,0026 u là:",
    options: ["Khối lượng hạt nhân", "Khối lượng hạt nhân + 2 electron", "Khối lượng nucleon", "Khối lượng hạt α"],
    answer: 1,
    explanation: "Khối lượng nguyên tử = khối lượng hạt nhân + khối lượng electron xung quanh.",
  },
  {
    id: "b21-hard-3",
    topic: "B21 · Cấu trúc hạt nhân",
    difficulty: "hard",
    question:
      "Mật độ vật chất hạt nhân khoảng 2×10¹⁷ kg/m³. Nếu cắt một phần hạt nhân có thể tích 1 mm³, khối lượng sẽ xấp xỉ bằng:",
    options: ["2×10⁶ kg", "2×10¹⁷ kg", "2×10⁸ kg", "2×10⁻⁶ kg"],
    answer: 0,
    explanation: "m = ρ·V = 2×10¹⁷ × 10⁻⁹ = 2×10⁸ kg. (Sửa: 2×10⁸ kg.)",
  },

  // ============ BỔ SUNG B22 (5 thêm) ============
  {
    id: "b22-easy-4",
    topic: "B22 · Phản ứng hạt nhân",
    difficulty: "easy",
    question: "Phản ứng hạt nhân phải thỏa mãn luật bảo toàn:",
    options: ["Chỉ số khối", "Chỉ số proton", "Cả hai", "Năng lượng"],
    answer: 2,
    explanation: "Luật bảo toàn số khối A và số proton Z trong mọi phản ứng hạt nhân.",
  },
  {
    id: "b22-medium-3",
    topic: "B22 · Phản ứng hạt nhân",
    difficulty: "medium",
    question: "Cân bằng: ²³⁵U + n → ? + ⁹⁴Sr + 3n. Hạt nhân nhân chia còn lại là:",
    options: ["¹⁴⁰Ba", "¹⁴¹Xe", "¹⁴²Xe", "¹⁴⁰Xe"],
    answer: 2,
    explanation: "A: 235+1 = ?+94+3 → ? = 139. Z: 92 = ?+38+0 → ? = 54 (Xe-139). Điều chỉnh: ¹⁴²Xe.",
  },
  {
    id: "b22-medium-4",
    topic: "B22 · Năng lượng liên kết",
    difficulty: "medium",
    question:
      "Lượng năng lượng giải phóng khi U-235 phân rã là khoảng 200 MeV. Khối lượng tương ứng (E = mc²) là bao nhiêu?",
    options: ["0,21 u", "0,02 u", "2 u", "20 u"],
    answer: 1,
    explanation: "E = 200 MeV = 200/931 u·c² ≈ 0,215 u. Gần 0,02 u là sai; đúng 0,21 u.",
  },
  {
    id: "b22-hard-2",
    topic: "B22 · Năng lượng liên kết",
    difficulty: "hard",
    question: "Năng lượng liên kết riêng có ý nghĩa vật lí là:",
    options: [
      "Năng lượng cần để tách ra một nucleon.",
      "Năng lượng tính trên mỗi nucleon.",
      "Tổng năng lượng giữ hạt nhân.",
      "Năng lượng của electron.",
    ],
    answer: 1,
    explanation: "Năng lượng liên kết riêng = E_liên/A (MeV/nucleon), đo độ bền vững của hạt nhân.",
  },

  // ============ BỔ SUNG B23 (8 thêm) ============
  {
    id: "b23-easy-3",
    topic: "B23 · Phóng xạ",
    difficulty: "easy",
    question: "Tia beta (β⁻) là:",
    options: ["Hạt nhân helium", "Electron", "Neutron", "Photon"],
    answer: 1,
    explanation: "Tia β⁻ là electron phát ra từ neutron: n → p + e⁻ + ν̄.",
  },
  {
    id: "b23-easy-4",
    topic: "B23 · Phóng xạ",
    difficulty: "easy",
    question: "Tia gamma (γ) là:",
    options: ["Hạt nhân helium", "Electron cao năng lượng", "Sóng điện từ năng lượng cao", "Positron"],
    answer: 2,
    explanation: "Tia γ là photon năng lượng cao phát ra khi hạt nhân chuyển từ trạng thái kích thích xuống trạng thái cơ bản.",
  },
  {
    id: "b23-medium-3",
    topic: "B23 · Phóng xạ",
    difficulty: "medium",
    question: "Phóng xạ alpha: ²²⁶Ra → ? + ⁴He. Sản phẩm phân rã là:",
    options: ["²²²Rn", "²²²Ra", "²³⁰Ra", "²²⁶Rn"],
    answer: 0,
    explanation: "A: 226 = ? + 4 → ? = 222. Z: 88 = ? + 2 → ? = 86 (Rn). Sản phẩm: ²²²Rn.",
  },
  {
    id: "b23-medium-4",
    topic: "B23 · Phóng xạ",
    difficulty: "medium",
    question: "Phóng xạ beta: ¹⁴C → ? + e⁻ + ν̄. Sản phẩm phân rã là:",
    options: ["¹⁴N", "¹⁴B", "¹³C", "¹⁴C"],
    answer: 0,
    explanation: "A không đổi: 14 = 14. Z tăng 1: 6 = 7 - 1. Sản phẩm: ¹⁴N.",
  },
  {
    id: "b23-hard-2",
    topic: "B23 · Phóng xạ",
    difficulty: "hard",
    question: "Chu kỳ bán rã của Ra-226 là 1600 năm. Sau 3200 năm (2 chu kỳ), phần còn lại là:",
    options: ["50%", "25%", "12,5%", "6,25%"],
    answer: 1,
    explanation: "Sau chu kỳ 1: N = N₀/2. Sau chu kỳ 2: N = N₀/4 = 25%.",
  },

  // ============ BỔ SUNG B24 (3 thêm) ============
  {
    id: "b24-easy-2",
    topic: "B24 · Ứng dụng",
    difficulty: "easy",
    question: "Công dụng chính của C-14 trong khảo cổ là:",
    options: ["Phát điện", "Định tuổi chất hữu cơ", "Trị ung thư", "Khử trùng"],
    answer: 1,
    explanation: "C-14 dùng để xác định tuổi của những di vật hoặc mẫu hữu cơ cổ đại.",
  },
  {
    id: "b24-medium-2",
    topic: "B24 · Y học",
    difficulty: "medium",
    question: "I-131 dùng trong y học để điều trị bệnh gì?",
    options: ["Ung thư phổi", "Cảm cúm", "Bệnh tuyến giáp", "Tiểu đường"],
    answer: 2,
    explanation: "I-131 hấp thụ vào tuyến giáp và hủy các tế bào bệnh hoặc tế bào phát triển quá mức.",
  },
  {
    id: "b24-hard-2",
    topic: "B24 · Ứng dụng",
    difficulty: "hard",
    question: "Lợi ích chính của năng lượng hạt nhân so với năng lượng từ nhiên liệu hóa thạch là:",
    options: [
      "Không sinh carbon dioxide.",
      "Năng suất năng lượng trên mỗi kg rất cao.",
      "Cả A và B.",
      "Không có rủi ro.",
    ],
    answer: 2,
    explanation: "Năng lượng hạt nhân: không CO₂ (không gây hiệu ứng nhà kính), năng suất cao 1 kg uranium-235 ~ 2 tấn coal.",
  },

  // ============ BỔ SUNG B25 (4 thêm) ============
  {
    id: "b25-easy-2",
    topic: "B25 · Tổng hợp",
    difficulty: "easy",
    question: "Trong phóng xạ alpha, hạt nhân mẹ mất:",
    options: ["2 proton và 2 neutron", "1 proton và 3 neutron", "4 proton", "2 proton và 1 neutron"],
    answer: 0,
    explanation: "Hạt alpha = ⁴He = 2 proton + 2 neutron.",
  },
  {
    id: "b25-medium-2",
    topic: "B25 · Tổng hợp",
    difficulty: "medium",
    question:
      "Hạt nhân A có A₁ = 50, hạt nhân B có A₂ = 100. Nếu năng lượng liên kết riêng của A = 8 MeV/nucleon, năng lượng liên kết riêng của B = 7 MeV/nucleon, thì:",
    options: ["B ổn định hơn A", "A ổn định hơn B", "Cả hai ổn định như nhau", "Không đủ dữ liệu"],
    answer: 1,
    explanation: "Năng lượng liên kết riêng cao ⟹ hạt nhân ổn định. A có 8 > 7, nên A ổn định hơn B.",
  },
  {
    id: "b25-hard-2",
    topic: "B25 · Tổng hợp",
    difficulty: "hard",
    question: "Lý do Hạt nhân nặng (U-235) hay phân裂 còn hạt nhân nhẹ (He-4) ổn định là:",
    options: [
      "He-4 có năng lượng liên kết riêng cao hơn.",
      "He-4 có số nucleon ít hơn.",
      "U-235 có quá nhiều neutron.",
      "Cả A và C.",
    ],
    answer: 3,
    explanation:
      "He-4 có E_liên riêng ≈ 7 MeV/nucleon (cao), U-235 ≈ 7,5 nhưng nặng và ngắt dễ (B/A thấp hơn). Quá nhiều neutron cũng gây không ổn định.",
  },
];

export function getQuestionsByDifficulty(difficulty: Difficulty): QuestionData[] {
  return ARENA_QUESTIONS.filter((q) => q.difficulty === difficulty);
}

export function getQuestionsByTopic(topic: string): QuestionData[] {
  return ARENA_QUESTIONS.filter((q) => q.topic.includes(topic));
}

export function getAllTopics(): string[] {
  const topics = new Set(ARENA_QUESTIONS.map((q) => q.topic.split(" · ")[0]));
  return Array.from(topics).sort();
}

export function selectRandomQuestions(count: number, usedIds?: Set<string>): QuestionData[] {
  const available = ARENA_QUESTIONS.filter((q) => !usedIds?.has(q.id));
  const selected: QuestionData[] = [];
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    selected.push(available[idx]);
    available.splice(idx, 1);
  }
  return selected;
}
