# Backend — học liệu Vật lí hạt nhân lớp 12

Tài liệu chuẩn bị kiến trúc backend TypeScript cho dự án học liệu Vật lí 12 theo mô hình lớp học đảo ngược. Backend dự kiến phục vụ frontend React, được đóng gói bằng Docker và sử dụng cơ sở dữ liệu cloud. Phương án ban đầu là Supabase PostgreSQL, cần nhóm xem xét.

**Trạng thái:** thư mục này mới có tài liệu kiến trúc, chưa có mã nguồn backend riêng, Dockerfile hay API để chạy. Xem [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) để duyệt phạm vi, cấu trúc và các quyết định còn mở.

## Tham khảo ứng dụng hiện có

Dự án gốc là ứng dụng Next.js kết hợp React, TypeScript và Supabase. Để chạy **dự án gốc**, mở thư mục gốc của dự án đó, làm theo README của chính nó, cài dependencies, cấu hình môi trường và chạy `npm run dev`. Các yêu cầu schema, khóa và quyền truy cập phải được kiểm tra cho môi trường tương ứng. Không sao chép giá trị bí mật vào tài liệu hay Git.

Lệnh của dự án gốc không khởi chạy được backend riêng chưa được tạo trong thư mục này.
