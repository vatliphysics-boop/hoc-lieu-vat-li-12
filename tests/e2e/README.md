# Kiểm thử trình duyệt B23

Cần Node.js và dependencies của dự án. Cấu hình không tự khởi động server để tránh ghi đè thư mục build hoặc dữ liệu của môi trường đang chạy. Khởi động ứng dụng trong một bản sao cô lập ở cổng 3223, rồi chạy trong checkout này:

```sh
npm run test:e2e
```

Mặc định kiểm thử dùng `http://localhost:3223` và Chromium do Playwright quản lý. Có thể trỏ đến Chrome/Chromium đã cài và một server khác:

```sh
E2E_BASE_URL=http://localhost:3223 \
E2E_CHROMIUM_PATH='/đường/dẫn/đến/Chrome' \
npm run test:e2e
```

Nếu dùng Chromium do Playwright quản lý, cài browser theo hướng dẫn Playwright trước. `E2E_OUTPUT_DIR` tùy chọn thay đổi thư mục kết quả; không trỏ tới dữ liệu hiện có. Test dùng browser context riêng, không truy cập dữ liệu học sinh hoặc Supabase production. Kiểm thử Chromium: nhánh 50%, điều kiện thao tác, 5 nhiệm vụ, lưu/khôi phục cục bộ, fallback WebGL giả lập, fullscreen và viewport 1440×900/390×844. Một ca mô phỏng cuộn chuột và cử chỉ touch qua CDP; đó không phải chứng nhận trackpad hoặc màn hình cảm ứng vật lý. Các luồng đăng nhập, RLS và giao/nộp qua Supabase không được bao phủ bởi bộ test này.

### Kiểm thử mất xác nhận bằng fixture cô lập

`tests/e2e/half-life-retry.spec.mjs` mặc định bị bỏ qua. Chỉ bật `E2E_QA_FIXTURE=1` khi server là **bản sao QA riêng** có route `/qa-half-life` dựng `HalfLifePilot` với `stepId` giả và `half-life-actions.ts` được thay bằng mock ghi nhớ payload. Test chuyển POST tới mock rồi làm rơi response đầu tiên, đổi thông số và gửi lại; mock chỉ xác nhận nếu payload lần hai giống payload ban đầu. Đây là kiểm thử giao diện/khôi phục lỗi bằng mock, không kiểm thử Supabase, RLS hay cam kết lưu dữ liệu thật. Không bật fixture tại production hoặc server chứa dữ liệu thực.
