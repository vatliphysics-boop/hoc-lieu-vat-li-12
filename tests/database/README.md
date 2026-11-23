# Kiểm thử migration B23 bằng PostgreSQL WASM cô lập

Test này tạo **một database PGlite trong bộ nhớ**, dựng schema tối thiểu và `auth.uid()` giả lập, rồi áp nguyên tệp migration 021. Dữ liệu chỉ là UUID giả, không dùng service-role, tài khoản thật hoặc môi trường từ xa. Các câu lệnh RLS/RPC được thực thi với role `authenticated` và claim người dùng giả lập. Cờ ghi được kiểm tra mặc định tắt, sau đó chỉ được bật trong một giao dịch QA và luôn ROLLBACK.

Test không chạy toàn bộ migration 001–020, không xác nhận Supabase Auth, PostgREST, phiên trình duyệt, RLS trong mọi bảng đã triển khai, concurrency hoặc production. Đây là bằng chứng bổ sung cho SQL 021, không phải kiểm thử Supabase end-to-end.

Cài PGlite trong một thư mục tạm riêng (không cài vào dự án):

```sh
QA_TMP=$(mktemp -d)
npm install --no-save --prefix "$QA_TMP" @electric-sql/pglite@0.5.16
PGLITE_MODULE="$QA_TMP/node_modules/@electric-sql/pglite/dist/index.js" node tests/database/half-life-pglite.mjs
```
