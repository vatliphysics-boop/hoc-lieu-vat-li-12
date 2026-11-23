# Kiểm toán ban đầu — 13/11/2026

## Phạm vi và an toàn

- Checkout: `/Users/vodoandangkhoi/Documents/WEB_WORKING_24-09`; nhánh `rescue/weekend-final`, HEAD `e9b6800`, remote `https://github.com/vatliphysics-boop/flipped-physics-trial.git`.
- Trước khi thực hiện: không có thay đổi tracked; có nhiều thư mục untracked dưới `deliverables/`, `docs/` và `tmp/` liên quan đến video/nghiên cứu. Không xóa hay sửa chúng. Không triển khai hoặc thay nhánh.
- Đây là kiểm toán dựa trên mã, cấu hình, tài liệu hiện diện và kiểm thử được ghi dưới đây; không khẳng định mọi tài khoản hoặc dịch vụ bên ngoài đã vận hành.

## Kiến trúc và tài sản

Next.js 16.3.5 App Router, React 19.2, TypeScript strict, CSS Modules/global CSS, Three.js 0.186; KaTeX đã có. Chưa cài React Three Fiber/Drei. `src/app` có 95 tệp; `src/components/physics`, `src/components/learning`, `src/lib` và `src/simulations-v2` chứa các hoạt động, giao diện và mô hình. `src/data` có dữ liệu SGK, câu hỏi, học liệu; `00_NCKH_BAT_DAU` và `BAO_CAO_DOI_CHIEU_NCKH.md` chứa tài liệu nghiên cứu. Không thay video, âm thanh, phụ đề hoặc quy trình render.

Supabase Auth/Postgres/RLS/Storage và server actions phục vụ tài khoản, lớp, bài và tiến độ (`student_step_progress`, `student_phase_progress`; 21 tệp migration). Một số bản nháp, ghi chú và mục yêu thích lưu localStorage; không đồng nghĩa với dữ liệu nghiên cứu tập trung. Chưa thấy cơ chế event log thí nghiệm đã được xác nhận end-to-end. Các API và luồng thực tế phụ thuộc cấu hình và migration của môi trường, chưa xác thực bằng tài khoản thật. Kho SGK lớn được cấu hình build sao chép vào `data/book-bank/.next-runtime`; build trực tiếp có thao tác thay thư mục này, vì vậy cần kiểm thử cô lập để bảo vệ tài sản hiện có.

## Đánh giá theo thành phần

| Thành phần | Quyết định | Căn cứ |
|---|---|---|
| Chương trình cố định, nội dung, video và nghiên cứu hiện có | GIỮ NGUYÊN | Là tài sản và phạm vi được bảo vệ. |
| Kernel `radioactive-decay-model.ts` | GIỮ NGUYÊN | Mẫu tuổi thọ mũ độc lập, seed và kì vọng đã được tách riêng và có test. |
| Giao diện khám phá bán rã hiện hữu | CẢI TIẾN | Có biểu đồ và điều khiển nhưng chưa có chu trình điều tra theo hành vi; cảnh hiện hành là SVG. |
| Tiến độ lớp và màn hình giáo viên | CẢI TIẾN | Có schema và trang kết quả; chưa chứng minh thu thập event thí nghiệm. |
| Kiến trúc mô phỏng chung | CẢI TIẾN | Đã có v2 và các lõi chuyên biệt; cần chuẩn hóa từng bước, không thay thế đồng loạt. |
| Sao chép repository bên ngoài | THAY THẾ bằng tham khảo kiến trúc có ghi nguồn | Tránh phụ thuộc và rủi ro license không cần thiết. |

## Mốc kiểm thử trước thay đổi

Ngày 13/11/2026, Node 24.21.0: `npm test` 102/102 đạt; `npx tsc --noEmit --incremental false` đạt; `npm run lint` không lỗi, 37 cảnh báo, phần lớn trong video untracked và ba cảnh báo v2. Build/E2E/thiết bị chưa được xác nhận ở mốc này. Các kết quả cũ trong README không thay thế kiểm thử hiện tại.
