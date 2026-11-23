# Giai đoạn 2 — tiến độ B23 và lớp học

## Phạm vi thực hiện

Tiếp tục từ B23 thí điểm; không viết lại nhân vật lí, không sửa video, ElevenLabs, SGK hay dữ liệu nghiên cứu. Nhánh làm việc vẫn là `rescue/weekend-final`; không push, merge hoặc áp dụng migration lên hệ thống từ xa.

Trước thay đổi, B23 mở như hoạt động độc lập; toàn màn hình chỉ chứa cảnh, bản lưu cục bộ không khôi phục bảng đo/thông số, và bước mô phỏng giáo viên giao dùng mô phỏng trước đó. Sau thay đổi: bước hoạt động `radioactive_decay_half_life` dùng B23 pilot, có xem trước thử ở công cụ giao bước; toàn màn hình yêu cầu cả phòng, câu hỏi và điều khiển; phải trả lời thử dự đoán 2T trước khi chạy/đo và xem đồ thị; có gợi ý tự động khi sai nhiều lần. Bản lưu mới khôi phục thêm tham số, thời gian và bảng đo; bản lưu cũ vẫn được đọc theo phạm vi thông tin nó có. So sánh chu kì và lượt lặp phải tại thời điểm dương, và lượt lặp dựa trên bộ N₀/T/seed thay vì chỉ seed.

Đã xây giao diện đồng ý riêng, lưu/khôi phục/nộp theo bước học và bảng giáo viên xem câu trả lời, các cấp gợi ý, phép đo, xuất CSV/JSON; đây là **phần tích hợp chưa kích hoạt**. Migration `20261113_021_half_life_classroom.sql` chưa áp dụng và cờ database mặc định `enabled=false`, nên các nút lưu/khôi phục lớp chưa hoạt động với cấu hình mặc định. Không bật cờ hoặc áp dụng migration vào production từ lượt làm việc này. Lưu tại trình duyệt vẫn độc lập với chức năng lớp. Bằng chứng JSON có thể suy lại danh tính khi ghép với dữ liệu khác, không tuyên bố vô danh tuyệt đối.

Server Action kiểm tra snapshot và đối chiếu số đo với seed; RPC kiểm tra quyền, lớp, bài xuất bản và điều kiện pha, giới hạn định dạng payload. Các giới hạn này không chứng minh thao tác do người học thực hiện. Cần thực thi migration và kiểm thử RLS/RPC thực tế với nhiều giáo viên/học sinh/lớp, kiểm tra consent, thu hồi, retention, concurrency và xuất dữ liệu trước khi bật. Môi trường lượt này không có PostgreSQL/Supabase CLI/container; không tuyên bố đã kiểm thử RLS hoặc luồng đồng bộ thật. Đề xuất chính sách và biểu mẫu đồng ý nghiên cứu phải do đơn vị nghiên cứu quyết định; checkbox hiện tại chỉ mô tả việc lưu vào lớp học, không thay cho đồng ý nghiên cứu.

## Tệp chính

- `src/components/learning/HalfLifePilot.tsx`, `HalfLifeScene.tsx`, CSS liên quan, `src/lib/half-life-inquiry.ts`: trạng thái, điều khiển, gợi ý, fullscreen và khôi phục.
- `StudentPathwayStepViewer.tsx`, `LearningResourcePreview.tsx`, `PathwayStepManager.tsx`: gắn bước B23 và xem trước.
- `src/lib/half-life-classroom.ts`, `src/app/student/half-life-actions.ts`, `supabase/migrations/20261113_021_half_life_classroom.sql`: hợp đồng, kiểm tra, nền tảng lưu và RLS chưa kích hoạt.
- `src/app/teacher/lessons/[lessonId]/ket-qua/page.tsx`, `HalfLifeTeacherResults.tsx`, `half-life-teacher-export.ts`: trình bày và xuất kết quả khi có dữ liệu hợp lệ.
- `tests/half-life-classroom.test.ts`, `tests/half-life-inquiry.test.ts`, `tests/half-life-teacher-export.test.ts`, `tests/e2e/`, `playwright.config.mjs`, `package.json`, `package-lock.json`, `.gitignore`: kiểm thử và cấu hình.
- `src/simulations-v2/physics/decay.ts`: làm rõ chu kì bán rã là kì vọng của mẫu.

## Chưa hoàn thành

Chưa cho giáo viên sửa nội dung từng câu inquiry hoặc đóng băng phiên bản câu hỏi theo bài giao; giáo viên hiện sửa được hướng dẫn bước học hiện hữu. Chưa có phản hồi/đánh giá của giáo viên được lưu riêng cho pilot, dashboard tổng hợp nhiều học sinh, hay tích hợp pre/post-test vào nhật ký. Chưa thiết kế lại đồng bộ toàn website; B21, B22, B24 và B25 chưa được nâng cấp theo chu trình inquiry trong lượt này. Cần hoàn thành và xác thực B23 cùng luồng lớp học trước khi mở rộng lần lượt các bài còn lại. Chưa có kiểm thử thiết bị cảm ứng, trackpad hoặc GPU thật, cũng chưa đo hiệu năng.

## Cách chạy

`npm install`, cấu hình môi trường theo `README.md`, chạy `npm run dev` và mở `/hoc-lieu/thi-nghiem-ban-ra`. E2E chạy theo `tests/e2e/README.md` với một server phát từ bản sao cô lập và Chrome/Chromium phù hợp. Các hình `docs/e2e-screenshots/b23-desktop.png` và `b23-mobile.png` được chụp từ Chrome headless với viewport giả lập, không phải ảnh thiết bị vật lí.

## Bằng chứng kiểm thử

Mốc đầu: 107 unit test, typecheck và build đạt; lint 0 lỗi/37 cảnh báo cũ. Sau thay đổi: kiểm thử unit, typecheck, lint, E2E và build được ghi trong báo cáo kết quả của lượt thực hiện; test browser sử dụng Chrome headless, trong đó WebGL lỗi, touch và wheel là tình huống giả lập. Không có thử nghiệm người dùng hay phép đo thực địa.

Kết quả cuối: `npm test` **112/112**, `npx tsc --noEmit --incremental false` đạt, `npm run lint` 0 lỗi/37 cảnh báo đã có, `npm run build` đạt trong bản sao cô lập. `npm run test:e2e` với Chrome 157 headless và server cô lập: **6/6**, bao gồm năm nhiệm vụ, nhánh 50%, ẩn đồ thị trước dự đoán, khôi phục dữ liệu, WebGL fallback mô phỏng, fullscreen, kiểm tra hai viewport và sự kiện touch/wheel giả lập. Không có kiểm thử RLS hoặc tài khoản thật, không có kiểm thử phần cứng cảm ứng/trackpad.

`npm audit` tại thời điểm kiểm tra báo 10 vấn đề (7 moderate, 2 high, 1 critical); mục critical được báo trên dependency trực tiếp `next`, hai mục high trên `source-map-js` và `zod` gián tiếp. Chưa phân tích mức độ khai thác theo deployment hoặc nâng cấp tự động; cần đánh giá bản vá, kiểm thử tương thích và build trong nhánh an toàn trước triển khai.
