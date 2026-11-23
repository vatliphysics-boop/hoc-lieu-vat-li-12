/** Presentation-only guidance. Advancing it never changes the decay sample or its clock. */
export const HALF_LIFE_GUIDANCE = [
  { id: "sample", title: "Một hạt và cả mẫu", objective: "Phân biệt hạt nhân riêng lẻ với quần thể.", text: "Chọn chế độ một hạt để theo dõi một hạt mẹ trong chính mẫu này. Chuyển lại cả mẫu để xem tất cả; việc đổi cách nhìn không thay thời điểm phân rã." },
  { id: "prediction", title: "Đưa ra dự đoán", objective: "Nêu dự đoán trước khi xem đồ thị.", text: "Sau một chu kì bán rã, giá trị kì vọng còn một nửa. Hãy dự đoán phần còn lại sau hai chu kì trong nhiệm vụ bên cạnh." },
  { id: "measure", title: "Đo và đối chiếu", objective: "So sánh một lượt với giá trị kì vọng.", text: "Chạy mẫu hoặc đo tại T và 2T. Đường bậc là số hạt của lượt này; đường nét đứt là giá trị kì vọng. Các nút đo tới mốc dừng đồng hồ thí nghiệm." },
  { id: "repeat", title: "Lặp và giải thích", objective: "Nhận biết dao động ngẫu nhiên của mẫu hữu hạn.", text: "Giữ N₀, T và mốc đo; đổi seed rồi chạy một lượt khác. Giải thích vì sao hai kết quả có thể khác nhau dù đường kì vọng không đổi." },
] as const;
export type HalfLifeMode = "guided" | "explore" | "assigned";
