# Kiến trúc frontend học liệu Vật lí hạt nhân lớp 12

## Mục tiêu và trạng thái

Frontend được đề xuất để hỗ trợ học sinh lớp 12 và giáo viên sử dụng học liệu số chủ đề Vật lí hạt nhân theo mô hình lớp học đảo ngược. Học liệu, nhiệm vụ và phản hồi hướng đến phát triển năng lực tự học; việc đánh giá tác động cần dựa trên nghiên cứu và kiểm chứng sư phạm, không tự suy ra từ dữ liệu sử dụng website.

Đây là **phương án kiến trúc cần nhóm duyệt**, chưa phải mô tả một ứng dụng frontend riêng đang chạy. Dự án gốc hiện kết hợp giao diện React, xử lý phía máy chủ của Next.js và Supabase trong một ứng dụng; chưa tách mã sang hai repository. Hướng dẫn và công cụ trong tài liệu của giáo sư là gợi ý để thiết kế hoạt động, không mặc định mọi công cụ đã được triển khai.

## Vai trò và hoạt động học tập

| Vai trò | Nhu cầu giao diện dự kiến |
| --- | --- |
| Học sinh | Xem mục tiêu, học liệu và nhiệm vụ; quan sát mô phỏng, trả lời câu hỏi, ghi nhận quá trình học, tự kiểm tra và nhận phản hồi phù hợp. |
| Giáo viên | Tổ chức học liệu và hoạt động; giao nhiệm vụ cá nhân hoặc nhóm; theo dõi sản phẩm, xem tiến độ, kiểm tra và phản hồi học sinh. |
| Nhóm nghiên cứu | Thiết kế và rà soát nội dung, công cụ đánh giá; dữ liệu nghiên cứu cần được xử lý và truy cập theo quy trình đã được phê duyệt. |

Nội dung đề tài bao gồm cấu trúc hạt nhân, độ hụt khối và năng lượng liên kết, phản ứng hạt nhân, phóng xạ, ứng dụng và an toàn bức xạ. Giao diện cần cho phép liên kết học liệu với mục tiêu và nhiệm vụ, thay vì chỉ trình bày một danh sách video.

Theo định hướng người dùng, giáo viên tạo lớp và học sinh tham gia bằng mã lớp. Kho học liệu dự kiến gồm mô phỏng, hình ảnh tĩnh và động, video, thí nghiệm và ngân hàng câu hỏi bám chương trình; giáo viên có thể sử dụng kho để xây dựng bài giảng, kế hoạch theo Công văn 5512 và bài trắc nghiệm. Giao diện cần dễ dùng, khoa học, để giáo viên và học sinh tự thao tác. Đây là mục tiêu cần thiết kế và kiểm thử, không phải khẳng định các tính năng đã hoàn thành trong frontend riêng.

### Tiến trình dự kiến

1. **Trước giờ học:** học sinh tìm hiểu học liệu, video hoặc mô phỏng theo hướng dẫn; thực hiện nhiệm vụ chuẩn bị và ghi lại điều chưa rõ. Giáo viên có thể theo dõi việc chuẩn bị khi dữ liệu và quyền truy cập đã được thiết lập.
2. **Trong giờ học:** giáo viên tổ chức hoạt động quan sát, thao tác mô phỏng, thảo luận và giải quyết nhiệm vụ cá nhân hoặc theo nhóm; lựa chọn công cụ phù hợp với kế hoạch dạy học thực tế.
3. **Sau giờ học:** học sinh tự kiểm tra, luyện tập, phản tư và điều chỉnh việc học; giáo viên nhận xét hoặc sử dụng sản phẩm học tập để đánh giá theo kế hoạch được duyệt.

Ba pha là định hướng từ thuyết minh nghiên cứu; từng chức năng, cách lưu dữ liệu và tiêu chí đánh giá còn cần nhóm sư phạm xác nhận.

## Các khối frontend đề xuất

```text
Người học / giáo viên
       │
       ▼
Trang React ──► Thành phần giao diện và mô phỏng
       │
       ▼
Chức năng theo nghiệp vụ ──► Lớp giao tiếp backend
                                    │
                                    ▼
                        Backend TypeScript dự kiến
                                    │
                                    ▼
                    Dịch vụ dữ liệu trên cloud dự kiến
```

| Khối | Trách nhiệm dự kiến |
| --- | --- |
| Trang và điều hướng | Hiển thị các khu vực học liệu, học sinh và giáo viên; tổ chức trải nghiệm theo vai trò và pha học tập. |
| Thành phần giao diện | Tái sử dụng thành phần trình bày học liệu, video, câu hỏi, trạng thái và phản hồi. |
| Chức năng học tập | Kết nối nhiệm vụ trước–trong–sau giờ học với ghi nhận và xem lại tiến độ, khi backend hỗ trợ. |
| Mô phỏng | Cho phép học sinh quan sát, điều chỉnh tham số và thảo luận trong phạm vi mô hình; thể hiện rõ giới hạn và quy ước của từng mô phỏng. |
| Lớp giao tiếp | Gọi backend và xử lý trạng thái tải, lỗi hoặc dữ liệu trống theo hợp đồng được thống nhất; không tự giả định endpoint. |

Chưa chọn phương án frontend độc lập tiếp tục dùng Next.js hay sử dụng cách triển khai React khác. Nếu chọn Next.js, cần xác định vị trí xử lý render phía máy chủ, Server Actions và API hiện có trước khi tách.

## Định hướng giao diện và thứ tự thực hiện

Người dùng cho biết định hướng website hiện tại về cơ bản đã ổn định: ưu tiên cải thiện giao diện trước, sau đó nâng cấp mô phỏng và minh họa 3D theo từng phần. Đây là thứ tự dự kiến, chưa có nghĩa các thay đổi đã hoàn thành hoặc mọi chức năng cần làm đồng thời.

Màu xanh được đề nghị lấy cảm hứng từ tệp logo hiện có `public/branding/sgu-logo.png` trong dự án gốc. Các màu lấy mẫu gần đúng `#203090` và `#40C0E0` chỉ là tham khảo tạm thời, không được khẳng định là màu nhận diện chính thức. Khi thiết kế, kiểm tra độ tương phản chữ, nền và trạng thái tương tác theo tiêu chí WCAG phù hợp; không tự suy ra sự bảo trợ hoặc xác nhận chính thức của trường từ việc tham khảo logo.

## AI, quyền riêng tư và trách nhiệm

AI được đề xuất hỗ trợ tạo học liệu, gợi ý hoặc phản hồi sơ bộ; giáo viên kiểm duyệt nội dung và chịu trách nhiệm đánh giá chính thức. Giao diện cần cho phép người dùng nhận biết nội dung có AI hỗ trợ và báo nội dung sai khi các chức năng này được triển khai. Không đưa thông tin nhận dạng hoặc dữ liệu cá nhân nhạy cảm của học sinh vào công cụ AI công cộng.

Không đặt khóa bí mật trong mã hoặc cấu hình gửi đến trình duyệt. Việc ẩn chức năng trên giao diện không thay thế kiểm tra vai trò ở phía server và chính sách dữ liệu. Với dữ liệu phục vụ nghiên cứu, cần có cơ chế mã hóa định danh, giới hạn người truy cập và quy định lưu trữ theo quy trình được duyệt; chưa mặc định hệ thống đã đáp ứng các yêu cầu này.

## Quan hệ với hệ thống hiện tại

- Dự án gốc dùng Next.js 16, React 19, TypeScript, Supabase và Three.js; `src/app/` có cả giao diện lẫn API và xử lý server, `src/components/` có giao diện học tập và vật lí, `src/simulations-v2/` có phần mô phỏng.
- Backend riêng được đề xuất dùng TypeScript và Docker; cơ sở dữ liệu cloud có thể cân nhắc Supabase vì dự án gốc đã sử dụng. Đây là phương án cần thống nhất, không khẳng định backend riêng, container hoặc kết nối cloud đã được triển khai.
- Trước khi chuyển bất kỳ mã nào, cần phân loại React component, phần render server, Server Actions, API, xác thực, RLS, tải video và tài nguyên. Giữ nguyên dự án hiện tại cho đến khi có kế hoạch tách và kiểm thử được duyệt.

## Các quyết định và kiểm thử cần thực hiện

1. Thống nhất phạm vi học liệu, quy trình giáo viên–học sinh, tiêu chí đánh giá và hợp đồng dữ liệu giữa hai phía.
2. Chọn công cụ React, cách render và phương án xác thực, đồng thời thống nhất giao thức, định dạng dữ liệu và xử lý lỗi với backend.
3. Đối chiếu kiến trúc hiện có với phương án mới; kiểm thử đăng nhập, phân quyền, ba pha học tập, mô phỏng, lỗi mạng và việc sử dụng trên màn hình nhỏ sau khi mã được triển khai.
4. Xác nhận riêng thiết kế và quy mô thực nghiệm vì thuyết minh có các mô tả khác nhau; không xem kết quả thử nghiệm là đã có.

Tài liệu được xây dựng từ thuyết minh đề tài và tài liệu hướng dẫn giáo sư do nhóm cung cấp; các phần đề xuất cần được rà soát với giáo viên hướng dẫn trước khi triển khai.
