# Bàn giao thí điểm B23 — 13/11/2026

## Cách chạy và sử dụng

Cài dependencies theo README, cấu hình Supabase theo môi trường hiện có nếu cần các trang tài khoản, chạy `npm run dev`, mở `/hoc-lieu/thi-nghiem-ban-ra`. Bài trước lớp B23 cũng có liên kết tới phòng này. Chọn N₀, T và seed; trả lời câu hỏi, xoay bằng chuột/cảm ứng hoặc phím mũi tên; đo tại T và 2T; so sánh hai T ở cùng N₀, t; chạy seed khác và đo tại cùng mốc. Các nút đo mốc đưa thời gian đến mốc và dừng. Đường liền bậc là một lượt Monte Carlo, đường đứt là kì vọng; màu và số liệu cùng dùng một mẫu. Tham khảo `PHYSICS_REVIEW.md` về công thức, nguồn và giới hạn.

Có 5 nhiệm vụ tuần tự, 10 câu, gợi ý ba cấp, phản hồi cho dự đoán 50% sau 2T; đo, so sánh và lượt lặp là điều kiện cho các câu tương ứng. Câu giải thích dùng lựa chọn, chưa chấm tự luận. Cấu hình TypeScript ở `src/lib/half-life-inquiry.ts`; giáo viên chưa có trình sửa cấu hình không cần code. WebGL không có thì có mô tả thay thế, không ghi giả là đã xoay. Mô hình điểm đại diện hạt nhân nguyên vẹn, không biểu diễn cấu trúc proton/neutron hoặc vị trí thực.

## Dữ liệu và an toàn

Chỉ khi chọn đồng ý, bản ghi mã phiên ngẫu nhiên và sự kiện được lưu trong localStorage tại thiết bị; JSON/CSV xuất thủ công. Không gửi máy chủ, không điền tên, không khẳng định ẩn danh tuyệt đối. Mã phiên và thời gian có thể liên kết lại với người học nếu kết hợp dữ liệu khác. Bản lưu cũ cần khôi phục hoặc xóa trước khi ghi phiên mới; từ chối ghi không xóa bản lưu. Khôi phục hiện chỉ khôi phục câu hỏi và log, không khôi phục tham số, biểu đồ hay bảng đo. Trước thu thập thật cần sự đồng ý và quy trình của nhà trường/cha mẹ theo bối cảnh nghiên cứu, chính sách lưu giữ, phân quyền và thử nghiệm thực tế. Không ghi khóa LRS, không tự gửi xAPI.

Chưa có kết nối sự kiện thí điểm tới tài khoản, lớp hoặc dashboard giáo viên, thống kê nhiều học sinh, pre/post-test gắn phiên, đo thời lượng học thực tế, nộp/duyệt kết quả hay công bố học liệu. Các trang và hệ thống tiến độ hiện hữu vẫn riêng biệt; không diễn giải nhật ký cục bộ là dữ liệu nghiên cứu đã được thu thập. Chưa có chức năng xem trước giáo viên riêng cho pilot. Cần thiết kế migration/RLS, đồng thuận và kiểm thử tài khoản trước khi kết nối. Không dùng tệp này để tuyên bố nghiên cứu có hiệu quả giáo dục.

## Kiểm tra thực tế

- Mốc ban đầu: 102 kiểm thử đạt, typecheck đạt, lint 0 lỗi / 37 cảnh báo.
- Sau triển khai: `npm test` 107/107 đạt; `npx tsc --noEmit --incremental false` đạt; `npm run lint` 0 lỗi / 37 cảnh báo có sẵn. Test gồm seed và thống kê, bảo toàn tổng số, nhánh dự đoán sai, điều kiện, gợi ý và xuất CSV.
- Browser localhost: trang trả HTTP 200; kiểm tra xoay phím mũi tên mở câu bị khóa, chọn 50% nhận câu hỏi phụ, đo T/2T cùng seed 23 cho 35/20 hạt và kì vọng 32/16, khớp trạng thái cảnh, bảng và đồ thị. Trình duyệt thử từ chối Fullscreen API; thông báo lỗi hiển thị, chưa xác nhận mở toàn màn hình thành công. Quan sát bố cục hẹp và bổ sung cuộn ngang bảng; chưa xác nhận lại mọi kích thước. Chưa chạy E2E tự động, kiểm thử cảm ứng/trackpad trên thiết bị thật, hiệu năng hay fallback WebGL trong trình duyệt.
- Production build được chạy ở bản sao cô lập vì cấu hình build thay thế thư mục runtime ngân hàng sách; xem kết quả build bên dưới.

## Phạm vi còn lại

Chưa thiết kế lại toàn bộ trang chủ, bài học, tiến độ, dashboard và tất cả B21–B25; chưa có mô hình nucleon chọn proton/neutron trong pilot quần thể, số lần chạy lặp tự động hàng loạt, đo hiệu năng hoặc tích hợp tiến độ chính thức. Giao diện fullscreen chỉ bao gồm khung cảnh/camera; điều khiển thời gian và biểu đồ nằm ngoài khung. Kiến trúc v2 hiện hữu và kernel vẫn giữ nguyên. Xem `REFACTOR_ROADMAP.md` và `ARCHITECTURE_AND_CURRICULUM.md` cho phần mở rộng.
- `npm run build` tại bản sao cô lập: hoàn tất thành công, biên dịch, typecheck và tạo 46 trang; route pilot được tạo tĩnh. Bản sao và dữ liệu runtime của bản sao không thay thế bản gốc.
