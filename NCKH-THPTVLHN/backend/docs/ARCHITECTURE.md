# Kiến trúc backend — học liệu Vật lí hạt nhân lớp 12

## Mục đích và trạng thái

Đây là phương án để nhóm duyệt cho backend TypeScript phục vụ học liệu số Vật lí hạt nhân lớp 12 theo mô hình lớp học đảo ngược. Hệ thống dự kiến hỗ trợ giáo viên tổ chức lớp và học liệu; học sinh học theo các giai đoạn trước, trong và sau giờ học. Nội dung phản ánh thuyết minh và hướng dẫn hiện có; chức năng, tiêu chí đánh giá và phạm vi triển khai cần được nhóm và giáo viên hướng dẫn xác nhận.

Ứng dụng hiện có kết hợp giao diện và phần server trong Next.js, sử dụng Supabase. Thư mục backend riêng này **chưa có mã nguồn, API, cơ sở dữ liệu mới hoặc Docker image**; các mục dưới đây là thiết kế đề xuất, không phải tính năng đã triển khai. Phương án tách không tự thay đổi dự án gốc.

## Công nghệ đề xuất

| Thành phần | Phương án | Trạng thái |
| --- | --- | --- |
| Backend | Node.js và TypeScript; framework HTTP sẽ chọn sau khi nhóm duyệt | Chưa khởi tạo |
| Đóng gói | Docker; image cho backend, cấu hình cấp qua môi trường chạy | Chưa tạo Dockerfile hoặc triển khai |
| Cơ sở dữ liệu cloud | Supabase PostgreSQL, kế thừa hướng tiếp cận hiện có | Đề xuất; chưa tạo hay thay đổi dịch vụ cloud |
| Xác thực và tệp | Đánh giá dùng Supabase Auth và Storage hiện có | Cần kiểm tra môi trường và hợp đồng bảo mật |
| Frontend | React ở repository riêng, trao đổi với backend qua hợp đồng thống nhất | Chưa tích hợp |

Chọn Supabase làm phương án ban đầu vì ứng dụng gốc đã dùng PostgreSQL, Auth, Storage và chính sách RLS. Đây không phải khẳng định dữ liệu đã được chuyển hay schema đã áp dụng trong môi trường đích.

## Sơ đồ và trách nhiệm

```text
Trình duyệt / frontend React
        │ Yêu cầu và phản hồi theo hợp đồng API
        ▼
Backend TypeScript trong Docker
  ├─ Tiếp nhận và kiểm tra dữ liệu
  ├─ Xác thực, phân quyền theo người dùng và lớp
  ├─ Xử lý nghiệp vụ học liệu, lớp học, tiến độ
  └─ Truy cập dữ liệu qua lớp tích hợp
        │
        ├─ PostgreSQL trên Supabase (đề xuất)
        └─ Auth / Storage (phương án cần xác nhận)
```

Ranh giới backend, định dạng yêu cầu/phản hồi, lỗi, phiên đăng nhập, quyền và cách tải video cần được thống nhất với frontend. Không suy ra endpoint hoặc tính năng thực tế từ sơ đồ này.

## Các miền nghiệp vụ dự kiến

| Miền | Vai trò đề xuất |
| --- | --- |
| Tài khoản và quyền | Nhận diện người dùng; phân biệt quyền học sinh, giáo viên và phạm vi lớp. |
| Lớp học và thành viên | Quản lý lớp, tư cách tham gia và phạm vi truy cập. |
| Bài học và học liệu | Tổ chức video, mô phỏng, tương tác, phiếu và nội dung theo chương trình, các pha học. |
| Nhiệm vụ và tiến độ | Ghi nhận trạng thái, nhật kí và bằng chứng học tập phù hợp với bước được giao. |
| Kiểm tra và kết quả | Hỗ trợ đánh giá; tách dữ liệu nghiên cứu thật với dữ liệu thử nghiệm. |
| Nội dung có AI hỗ trợ | Đề xuất luồng giáo viên kiểm duyệt trước khi sử dụng; không đưa định danh học sinh vào AI công khai. |
| Tệp và video | Lưu tham chiếu và kiểm tra quyền truy cập tài nguyên; lựa chọn luồng tải phù hợp. |

Đây là nhóm chức năng để thiết kế, chưa tương đương danh sách API đã tồn tại trong backend mới. Cấu trúc dữ liệu và chỉ báo nghiên cứu phải được đối chiếu hồ sơ và kiểm tra trước khi thu thập thật; không suy diễn kết quả hay cỡ mẫu thực nghiệm chưa thống nhất.

## Cấu trúc mã dự kiến

```text
backend/
├── docs/ARCHITECTURE.md
├── src/
│   ├── app/                  Khởi tạo, định tuyến và xử lý lỗi
│   ├── modules/              Chức năng theo từng miền nghiệp vụ
│   ├── shared/               Kiểu, tiện ích và quy tắc dùng chung
│   └── config/               Đọc và kiểm tra cấu hình môi trường
├── tests/                    Kiểm thử nghiệp vụ và API
├── Dockerfile                Đề xuất, chưa tạo
├── .dockerignore             Đề xuất, chưa tạo
├── .env.example              Tên biến và giá trị mẫu không nhạy cảm, chưa tạo
├── package.json              Đề xuất, chưa tạo
└── tsconfig.json             Đề xuất, chưa tạo
```

Tổ chức này nhằm phân tách lớp giao tiếp, quy tắc nghiệp vụ và truy cập dữ liệu; tên thư mục có thể điều chỉnh sau khi chọn framework. Hợp đồng API, phiên bản Node.js và lệnh chạy sẽ được bổ sung khi có mã nguồn.

## Dữ liệu, bảo mật và vận hành

- Kiểm tra dữ liệu đầu vào; xác thực và phân quyền tại server, không dựa vào việc ẩn giao diện. Cần thiết kế bảo toàn phạm vi truy cập và RLS của Supabase nếu dùng lại.
- Bảo vệ thông tin học sinh, đặc biệt người chưa thành niên; hạn chế dữ liệu nhạy cảm trong log, dùng mã giả danh cho nghiên cứu phù hợp, quản lý quyền truy cập và không gửi định danh đến AI công khai.
- Không đưa mật khẩu, khóa dịch vụ hoặc `.env.local` vào mã, tài liệu, Docker image hay Git. Cấu hình được cung cấp qua môi trường chạy và quản lý bí mật phù hợp.
- Docker đóng gói ứng dụng backend; cloud database là dịch vụ riêng. Kết nối, sao lưu, phục hồi và chi phí cần được kiểm tra trước khi triển khai; không mặc định đã có kết nối.
- Dự kiến kiểm thử nghiệp vụ, quyền theo vai trò/lớp, lỗi tích hợp, kết nối cloud và build image. Không tuyên bố đã kiểm thử khi chưa thực hiện.

## Hiện trạng để đối chiếu

Dự án gốc có route xử lý trong `src/app/api/`, Server Actions và Server Components trong `src/app/`, nghiệp vụ trong `src/lib/`, tích hợp Supabase trong `src/lib/supabase/`, và migration trong `supabase/migrations/`. Video hiện có luồng tải trực tiếp lên Storage; trạng thái schema và khả năng hoạt động phải kiểm tra riêng theo môi trường. Các phần này chưa được chuyển sang repository backend.

## Cần nhóm duyệt

1. Phạm vi chức năng, dữ liệu cần thu thập và tiêu chí đánh giá theo thuyết minh/hướng dẫn.
2. Framework TypeScript, hợp đồng API và cách chia trách nhiệm với frontend.
3. Môi trường Supabase dự kiến, mô hình quyền, Storage và phương án bảo toàn RLS.
4. Chiến lược tách từng chức năng, kiểm thử, đóng gói Docker và triển khai; chỉ thực hiện sau khi thống nhất.
