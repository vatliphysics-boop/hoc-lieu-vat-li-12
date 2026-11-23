# Rà soát vật lí và phạm vi học liệu B21–B25

Khảo sát mã và tài liệu hiện có ngày 13/11/2026; đây không phải kết quả kiểm thử mới của giao diện. Nguồn nội bộ: `docs/SGK_CHAPTER_IV_COVERAGE.md`, `docs/simulation-v2/B23_SGK_CONTENT_MAP.md`, `docs/NUCLEAR_SCIENCE_SOURCES.md`, `docs/PHYSICS_PROCESS_VERIFICATION.md`, `00_NCKH_BAT_DAU/06_TRIEN_KHAI_GOP_Y/PHIEU_HOC_SINH_B23.md` và mã dưới đây. SGK gốc `Sachgiaokhoavl12vlhn/SGK VẬT LÍ 12 KNTT.pdf` là bản scan; thông tin trang và tiêu đề ở đây dựa vào tài liệu đối chiếu trong repo, chưa xác nhận trực tiếp ảnh từng trang trong lượt khảo sát này. Những kết luận cũ về kiểm thử không được xem là kiểm thử của lượt này.

| Bài | Phạm vi sách theo ma trận hiện có | Thành phần và nhận xét | Quyết định |
|---|---|---|---|
| B21 – Cấu trúc hạt nhân | Tán xạ alpha, nucleon, kí hiệu, đồng vị | `rutherford-model.ts`, `B21Activities.tsx`, `nucleus-layout.ts`. Hình nucleon là quy ước, không khẳng định vị trí xác định. | CẢI TIẾN: giữ mô hình và kiểm định giao diện/khả năng tiếp cận. |
| B22 – Phản ứng hạt nhân và năng lượng liên kết | Phản ứng, bảo toàn A/Z, độ hụt khối, phân hạch và nhiệt hạch | `fission-model.ts`, `B22Activities.tsx`, `GuidedFissionLab.tsx`. Kênh U-235 + n → Y-95 + I-138 + 3n bảo toàn A=236, Z=92; hoạt ảnh không dự đoán phân bố sản phẩm. | CẢI TIẾN, giữ nhân tính và nguồn. |
| B23 – Hiện tượng phóng xạ | Bản chất ngẫu nhiên, các tia, định luật phóng xạ, an toàn | `radioactive-decay-model.ts`, `DecayProcessLab.tsx`, `B23Activities.tsx`, `simulations-v2/physics/decay.ts`. Đã có tuổi thọ mũ có seed, không ép nửa mẫu phân rã tại T. | CẢI TIẾN: chọn thí điểm inquiry; giữ nhân vật lí đang dùng chung với video. |
| B24 – Công nghiệp hạt nhân | Nhà máy, ứng dụng và an toàn | `reactor-model.ts`, `B24Activities.tsx`; hệ số phản ứng trong mô hình là quy ước sư phạm, không là mô hình vận hành lò. | CẢI TIẾN: nêu giới hạn, không sửa video. |
| B25 – Bài tập về vật lí hạt nhân | Bài tập tổng hợp, Bảng 25.1 | `sgk-b25-decay.ts`, `B25DataProcessLab.tsx`; giữ dữ liệu tám điểm độc lập với đường lí thuyết. | GIỮ NGUYÊN dữ liệu; CẢI TIẾN tương tác và kiểm định. |

## Lựa chọn mô hình B23

Một mẫu giả định gồm N₀ hạt nhân mẹ độc lập cùng hằng số phân rã λ không đổi. Mỗi tuổi thọ lấy từ phân bố mũ `−ln(1−U)/λ` với seed; số còn lại là số tuổi thọ lớn hơn thời điểm t. Đường kì vọng `E[N(t)] = N₀ exp(−λt)`, `λ=ln(2)/T₁/₂`; tại 2T giá trị kì vọng là N₀/4. Kết quả một lượt là biến ngẫu nhiên, không bắt buộc bằng kỳ vọng; T là khoảng thời gian để kỳ vọng số hạt mẹ còn lại giảm một nửa, không là thời điểm mọi hạt phân rã. Theo mô hình độc lập, `N(t) ~ Binomial(N₀, exp(−λt))`; độ lệch tương đối thường giảm khi N₀ lớn, không bảo đảm từng cặp lượt gần đường hơn.

Nguồn phương trình: [OpenStax University Physics 3 §10.3](https://openstax.org/books/university-physics-volume-3/pages/10-3-radioactive-decay); [Lawrence Berkeley National Laboratory, Radioactivity](https://www2.lbl.gov/nsd/education/ABC/wallchart/chapters/03/0.html). Giới hạn: một loại hạt mẹ, hệ kín, không chuỗi con, không phông, không thời gian chết, không đo thật, vị trí hạt và kích thước trong đồ họa quy ước. Mẫu giả định không gắn chu kỳ tùy ý với đồng vị cụ thể. `src/simulations-v2/physics/decay.ts` có ghi chú thông số mô tả T như thời gian đúng một nửa số hạt phân rã; câu này nên thêm “theo kì vọng”.

## Ma trận thí điểm và gợi ý kiểm định

| Năng lực/nội dung từ ma trận dự án | Thao tác và minh chứng |
|---|---|
| Quan sát tính ngẫu nhiên | Quan sát, đổi góc nhìn; giải thích vì sao không dự đoán được thời điểm của từng hạt. |
| Đọc định luật và chu kì | Dự đoán tỉ lệ sau 2T trước khi xem, đo tại T và 2T; giải thích 1/2 của lượng còn lại, không phải lượng ban đầu. |
| Nghiên cứu mối liên hệ | Thay T khi giữ N₀ và t, so sánh; ghi đơn vị và điều kiện. |
| Phân tích dữ liệu | Lặp với seed khác, so sánh với đường kỳ vọng, không đồng nhất một mẫu với trung bình. |
| Vận dụng và giới hạn | Giải thích kết quả một lượt không nhất thiết đúng N₀/4; nêu mô hình giả định. |

Cần kiểm thử tái lập seed, đơn điệu và bảo toàn `còn + đã phân rã = N₀`, kỳ vọng tại 0/T/2T, xác suất thống kê qua nhiều seed, tính đồng nhất đồ thị và hình 3D dùng chung trạng thái, bước yêu cầu hành vi, nhánh trả lời 50%, gợi ý và khôi phục tiến độ. Các kiểm thử hiện có ở `tests/process-models.test.ts`; phải chạy lại trước khi kết luận cho lần thay đổi này.

Tài liệu nghiên cứu trước lớp có phiếu B23 và nhấn mạnh bản dự đoán đầu, bản chỉnh sửa, nguồn và giới hạn; bản thân việc xem trang không chứng minh tự học. Những khẳng định về yêu cầu cần đạt chi tiết cần đối chiếu bản chương trình chính thức và bản SGK gốc trước khi công bố, không nâng các phương trình thuật toán thành yêu cầu bắt buộc mới.
