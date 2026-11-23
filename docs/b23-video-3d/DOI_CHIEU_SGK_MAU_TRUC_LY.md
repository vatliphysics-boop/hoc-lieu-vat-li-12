# Đối chiếu SGK — B23, mẫu giọng Trúc Ly

Ngày đối chiếu: 12/11/2026. Nguồn chính: SGK *Vật lí 12, Kết nối tri thức với cuộc sống*, Bài 23, trang in 104–113; [PDF chương IV](../../public/learning/SGK-chuong-IV.pdf), trang PDF 15–24. Bản scan được đọc trực tiếp. Đây là kiểm tra nội dung, không phải kết quả nghiên cứu hiệu quả dạy học.

## Kết quả đối chiếu mẫu 46,88 giây

| Nội dung trong mẫu | Đối chiếu sách | Đánh giá và cách ghi khi công bố |
|---|---|---|
| U-238 → Th-234 + α | SGK tr. 106 nêu dạng tổng quát phân rã α và cho câu hỏi về U-235. Ví dụ U-238 là ví dụ bổ sung; chuỗi phân rã được [IAEA, bảng 38](https://www-pub.iaea.org/MTCD/Publications/PDF/Pub1289_Web.pdf) xác nhận. | Đúng: 238 = 234 + 4; 92 = 90 + 2; α là hạt nhân helium-4 có 2 proton và 2 neutron. Không nói đây là ví dụ nguyên văn của SGK. Cụm mẹ/con chỉ tượng trưng; không khẳng định alpha tồn tại như cụm cố định trong hạt nhân trước phân rã. |
| Thời điểm một hạt phân rã không dự đoán chính xác; nhiều hạt có quy luật thống kê | Tr. 105 nêu tính ngẫu nhiên của từng hạt; tr. 107 xét lượng rất lớn hạt nhân và mô tả quy luật. | Phù hợp. Phần mẫu 64 hạt là mô phỏng để thấy ý tưởng, không đồng nghĩa 64 hạt là mẫu vĩ mô trong sách. |
| Chu kì bán rã và quy luật giảm một nửa | Tr. 107 định nghĩa T và nêu số hạt nhân còn lại giảm một nửa sau mỗi T cho mẫu rất lớn; công thức SGK là Nₜ = N₀·2^(−t/T). | Phù hợp về nội dung. “Giá trị kì vọng” trong mẫu là cách diễn giải thống kê bổ sung để giải thích dao động ở mẫu nhỏ; không phải nguyên văn định nghĩa SGK. |
| Mẫu 64 hạt, còn 38 sau 1T; đường kì vọng 32, rồi 16 sau 2T | Số này không phải dữ liệu SGK. Hệ sinh ngẫu nhiên trong `scene.js` dùng seed 23, cho 38 tại T và 20 tại 2T; kì vọng là 32 và 16. | Mô phỏng có thể kiểm tra lại; phải giữ nhãn “một lượt mô phỏng”, “kì vọng”, “mẫu giả định” và “thời gian tua không đều”. Bảng 23.1 SGK tr. 105 là dữ liệu thí nghiệm khác: 1, 3, 2, 0, 3, 1 trong các khoảng 5 giây. |
| Câu hỏi 640 hạt, sau 2T | Vận dụng quan hệ ở tr. 107; 640 không lấy từ sách. | Kì vọng 640 × (1/2)² = 160; một mẫu hữu hạn không bắt buộc đúng 160. Cần giữ nhãn bài tập giả định. |

Mẫu chỉ kiểm thử một phần bài; chưa thể dùng thay video toàn B23. Sách còn có định nghĩa phóng xạ, α/β⁻/β⁺/γ, sự lệch trong điện và từ trường, định luật và độ phóng xạ, ảnh hưởng và an toàn. Kịch bản chính cần đưa các nội dung đó vào. SGK dùng kí hiệu Nₜ, Hₜ; N(t), H(t) là cách viết tương đương, cần giới thiệu sự tương ứng nếu dùng.

## Chi tiết SGK cần ưu tiên trong video chính

- Tr. 104–105: hiện tượng và bằng chứng buồng sương/đếm tia Geiger; Bảng 23.1, Hình 23.2–23.3. Giải thích tính ngẫu nhiên từ quan sát, không biến số mô phỏng thành số đo.
- Tr. 105–106: ba dạng α, β (β⁻, β⁺), γ; sự lệch trong điện trường/từ trường; bản chất và khả năng đâm xuyên. Phương trình tổng quát β trong sách có phản neutrino/neutrino. Ưu tiên các câu hỏi U-235, Sr-90 và F-18 của sách khi chọn ví dụ.
- Tr. 107–109: radon-220 với T = 55 s; đồ thị Hình 23.5, Nₜ = N₀·2^(−t/T) = N₀e^(−λt), λ = ln2/T, Hₜ = λNₜ = H₀e^(−λt); becquerel (Bq), curie (Ci), 1 Ci = 3,7 × 10¹⁰ Bq. λ có đơn vị nghịch đảo thời gian; nếu T tính bằng giây thì λ tính bằng s⁻¹.
- Bài tập oxygen-15 tr. 108: 75% đã phân rã sau 244 s nghĩa là còn 25% = 1/4; 244 s ứng với 2T, nên T = 122 s. Bảng trong sách ghi xấp xỉ 1,2 × 10² s.
- Tr. 110–113: ảnh hưởng của tia, biển cảnh báo, ba nguyên tắc an toàn và tổng kết. Định tuổi C-14 và liều định lượng trong khung “Em có biết” là nội dung đọc thêm; không giả làm yêu cầu cốt lõi.

## Việc cần duyệt

- Nghe trực tiếp cách đọc “uranium”, “thori”, “alpha” và toàn bộ lời, kiểm tra nhấn giọng và mốc phụ đề; ASR đã có chỗ nhận không chắc, chưa thể dùng để kết luận phát âm đúng hay sai.
- [Storyboard video chính](STORYBOARD_KICH_BAN.md) đã được cập nhật theo nội dung ưu tiên của sách. Kiểm tra lại thời lượng theo âm thanh thực tế trước khi dựng và không thay video website bằng mẫu ngắn.
