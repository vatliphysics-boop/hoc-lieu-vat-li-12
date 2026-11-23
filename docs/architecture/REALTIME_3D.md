# Bài học 3D thời gian thực — ranh giới kiến trúc

Ngày triển khai: 13/11/2026. Quyết định dựa trên [kiểm kê](../audit/REALTIME_3D_INVENTORY.md), [nguồn tham khảo](../research/REALTIME_3D_SOURCES.md) và các lõi đang có. Không nhập mã, tài nguyên hoặc starter từ repository tham khảo. Bài học mới được đưa vào luồng hiện hữu theo từng bài sau khi kiểm thử, giữ nguyên video và tiến độ đã lưu; video được giao vẫn là học liệu có điều kiện hoàn thành riêng.

## Hợp đồng

- **Vật lí** là hàm/giá trị thuần có nguồn và miền hợp lệ; B23 dùng `radioactive-decay-model.ts`, tuổi thọ mũ có seed. Không gắn tốc độ vẽ hoặc camera với kết quả.
- **Phiên thí nghiệm** gồm tham số, mẫu và đồng hồ mô hình, số đo; hình 3D, biểu đồ, bảng và dữ liệu xuất đọc cùng mẫu và cùng thời điểm. Đổi seed/điều kiện bắt đầu lượt khác theo hành vi đã công bố.
- **Diễn giải** gồm các cảnh, mục tiêu và hướng dẫn (`half-life-guidance.ts`). Chuyển cảnh, đổi góc hoặc chuyển chế độ chỉ thay hiển thị, không seek/reset đồng hồ mô phỏng hay thay mẫu. Chế độ tự do không bắt buộc trả lời trước khi đo; chế độ nhiệm vụ vẫn dùng điều kiện `half-life-inquiry.ts`.
- **Trực quan** biểu diễn từng hạt nhân của quần thể, không phải cấu trúc nucleon. Chế độ một hạt lấy đúng tuổi thọ của hạt được chọn trong cùng mẫu; bảng và đồ thị vẫn mô tả quần thể, không dự đoán hạt thật. Vị trí/kích thước quy ước; fallback không WebGL vẫn hiển thị dữ liệu.
- **Lưu và lớp học:** giữ phiên bản local đã có, consent và tiến độ tách biệt; không bật Supabase/migration 021 hay sửa dữ liệu lớp. Xem trước không ghi. Mã sự kiện không là bằng chứng đánh giá giáo dục nếu chưa có quy trình nghiên cứu phù hợp.

Ba chế độ là cách trình bày/tổ chức cùng trạng thái, không phải ba mô hình vật lí độc lập. Không sử dụng Theatre.js/physics engine để quyết định số liệu. Three.js hiện có giúp tránh thêm dependency chưa kiểm chứng; không khẳng định Three Fiber/Drei không tương thích, chỉ chưa cần cài.

## Giới hạn

Các cảnh diễn giải B23 hiện là văn bản và chuyển bước bằng tay; chưa có kịch bản camera tự động hoặc narration. Mô hình thống kê không mô tả con, detector/phông, tia hay năng lượng. Các bài khác và điểm vào cũ cần kiểm định riêng; xem nhật kí triển khai để biết phần nào đã tích hợp, không suy ra hoàn thành từ bản thiết kế này.
