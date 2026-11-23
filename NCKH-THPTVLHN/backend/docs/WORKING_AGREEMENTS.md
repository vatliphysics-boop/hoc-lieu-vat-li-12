# Quy định làm việc chung cho dự án học liệu Vật lí hạt nhân 12

**Quy định chung bắt buộc của dự án — bản để nhóm xem và góp ý, 13/11/2026.** Áp dụng khi chuẩn bị học liệu, phát triển giao diện và backend, làm báo cáo nghiên cứu và dùng AI hỗ trợ. Chỉ chủ dự án có thể yêu cầu điều chỉnh quy định dự án; các phần cần duyệt của giảng viên hoặc cơ quan quản lý phải được đối chiếu với quyết định thực tế. Quy định này không vượt các hướng dẫn và nghĩa vụ có thứ bậc cao hơn.

## Nguyên tắc bắt buộc không tự ý bỏ qua

1. Đọc quy định và kiểm tra hiện trạng, sau đó làm đúng phạm vi được giao; bảo toàn công việc đang có và ghi trung thực những gì đã, chưa làm.
2. Bám mục tiêu sư phạm và chuyên môn Vật lí; học liệu, mô phỏng và nội dung AI phải có nguồn, kiểm tra và người có trách nhiệm duyệt trước khi dùng chính thức.
3. Thiết kế minh chứng học trước giờ theo nhận xét NX6; không coi lượt truy cập là chứng minh học thực chất hoặc khẳng định kết quả nghiên cứu khi chưa có dữ liệu.
4. Không tiết lộ dữ liệu cá nhân, tài liệu hạn chế, mật khẩu và khóa; không đưa `.agent/` lên Git. Không tự phát sinh chi phí theo yêu cầu dừng chi phí của cô Nhị.
5. Làm việc theo kiến trúc, quy định màu sắc và hướng dẫn của nhóm; ghi lại quyết định và bàn giao để người khác tiếp tục. Nếu có mâu thuẫn hoặc thông tin còn thiếu, ghi rõ và xác nhận thay vì tự bịa.

## 1. Mục tiêu, nguồn và cách xử lý khác biệt

1. Dự án xây dựng và sử dụng học liệu số có AI hỗ trợ trong lớp học đảo ngược, hướng đến phát triển năng lực tự học ở chủ đề Vật lí hạt nhân lớp 12. Phục vụ hai nhóm chính: giáo viên và học sinh.
2. Cơ sở đối chiếu gồm thuyết minh `ĐÃ SỬA - NCKH.docx`; hướng dẫn `hd.docx` của giảng viên; phiếu phản biện `ĐT_06 - NX.pdf` trong thư mục nhận xét của nhóm NCKH; và các trao đổi liên quan giữa Khôi, cô Nhị, Lê. Không đưa tin nhắn riêng không cần thiết vào tài liệu hoặc Git.
3. `hd.docx` nêu hoạt động trước và trong giờ; giai đoạn sau giờ nằm trong thuyết minh và định hướng dự án. Công cụ được nêu trong hướng dẫn là gợi ý sư phạm, không tự coi mọi công cụ là bắt buộc hoặc đã tích hợp.
4. Trước khi thực hiện, phân biệt rõ **đã có và kiểm chứng**, **đang làm**, **đề xuất** và **chờ xác nhận**. Nếu các nguồn khác nhau về phạm vi, cỡ mẫu, thời gian, dữ liệu hoặc quyền sử dụng, ghi rõ điểm khác và người cần xác nhận; không tự chọn số liệu thuận tiện.
5. Trong trao đổi, cô Nhị phân biệt bài báo theo hướng phân tích, thiết kế, kiến tạo và thẩm định sản phẩm với phần thực nghiệm sư phạm của đề tài. Không nói đề tài không cần thực nghiệm, cũng không tự tuyên bố thực nghiệm hay kết quả đã hoàn thành.

## 2. Quy trình nhận việc và bàn giao

1. Đọc yêu cầu mới nhất, `README.md`, kiến trúc liên quan, quy định này và `.agent/` trước khi sửa. Xem mã và dữ liệu sẵn có, kiểm tra thay đổi chưa lưu hoặc chưa commit, xác định phần nào đã hoàn thành và phần nào còn dở.
2. Xác định mục tiêu, người dùng, phạm vi, tệp dự kiến tác động và cách kiểm tra. Làm theo từng phần nhỏ; giữ công việc của người khác và không thay đổi phần ngoài phạm vi nếu không cần.
3. Thứ tự ưu tiên đã trao đổi là hoàn thiện giao diện trước, sau đó nâng cấp mô phỏng và minh họa. Đây là thứ tự tại thời điểm trao đổi, có thể thay đổi theo chỉ đạo mới của chủ dự án.
4. Sau mỗi phần có ý nghĩa, kiểm tra kết quả, cập nhật tài liệu liên quan và `.agent/`: việc đã làm, bằng chứng kiểm tra, quyết định, việc chưa làm và bước kế tiếp. Ghi rõ chỗ chưa thể kiểm chứng; không đánh dấu hoàn thành chỉ vì đã viết mã.
5. Khi bàn giao, nêu thay đổi, kết quả kiểm tra và giới hạn. Vấn đề cần giảng viên hoặc nhóm quyết định phải ghi rõ thay vì tự kết luận.

## 3. Học liệu và tiến trình ba giai đoạn

- Mỗi học liệu hoặc nhiệm vụ cần xác định: bài/chủ đề, mục tiêu hoặc yêu cầu cần đạt, giai đoạn trước/trong/sau giờ, hướng dẫn thao tác, sản phẩm học tập, cách phản hồi hoặc đánh giá, nguồn/quyền sử dụng và trạng thái người duyệt.
- **Trước giờ:** học sinh chuẩn bị qua học liệu, video hoặc mô phỏng, thực hiện nhiệm vụ và ghi câu hỏi hay kết quả. **Trong giờ:** giáo viên tổ chức trao đổi, xử lý dữ liệu, thảo luận hoặc thực hành theo kế hoạch. **Sau giờ:** củng cố, vận dụng và phản tư theo thuyết minh và kế hoạch dạy học được duyệt.
- Giáo viên có thể tạo lớp, tổ chức bài học và chọn học liệu; học sinh tham gia lớp bằng mã theo định hướng đã trao đổi. Kiểm tra các chức năng thực tế trước khi khẳng định chúng đã hoạt động trong phiên bản mới.
- Học liệu cần khoa học, phù hợp chương trình và dễ dùng; ưu tiên học sinh và giáo viên có thể thao tác mà không cần biết lập trình. Không đưa video nguồn, ảnh sách hay tài liệu của bên khác vào bản công khai nếu chưa xác định quyền và điều kiện sử dụng.

## 4. Đáp ứng nhận xét NX6: tự học thực chất trước giờ

Phiếu `ĐT_06 - NX.pdf` yêu cầu có biện pháp sư phạm để kiểm soát và bảo đảm học sinh thực sự tự học trước giờ, thay vì chỉ truy cập hình thức. Quy định triển khai:

1. Với mỗi nhiệm vụ trước giờ, thiết kế chuỗi **mục tiêu → học liệu → câu hỏi hoặc thao tác → sản phẩm → phản hồi → hoạt động trên lớp**. Nhiệm vụ phải yêu cầu học sinh thể hiện suy nghĩ, ví dụ dự đoán, giải thích quan sát, ghi kết quả thao tác hoặc nêu điều chưa hiểu; không chỉ yêu cầu mở trang hay xem video.
2. Thiết kế tiêu chí cho giáo viên xem được bằng chứng phù hợp với nhiệm vụ và biết học sinh cần hỗ trợ ở đâu. Phản hồi nên chỉ ra chỗ cần xem lại, gợi ý tự sửa và cho phép làm lại khi phù hợp. Liên hệ kết quả chuẩn bị với hoạt động trong giờ và cơ hội điều chỉnh sau phản hồi; không tự đặt ngưỡng hoàn thành cố định khi chưa được duyệt.
3. Lượt mở trang, thời gian xem, việc hoàn thành thao tác hoặc điểm trắc nghiệm **không đủ một mình** để kết luận học sinh đã tự học thực chất hay năng lực tự học đã phát triển. Phối hợp nhiều loại bằng chứng theo phương án đánh giá được duyệt; tôn trọng sự khác biệt về thiết bị và kết nối.
4. Khi thiết kế tính năng lưu kết quả, ghi rõ dữ liệu nào thật sự được lưu, ai được xem, bằng cách nào học sinh nộp và điều kiện sử dụng. Không hứa tự đồng bộ hoặc giáo viên nhìn thấy kết quả khi chưa kiểm thử được luồng đó.

## 5. Đáp ứng nhận xét NX6: kiểm định kiến thức AI tạo

Phiếu NX6 yêu cầu bổ sung tiêu chí kiểm định độ chính xác tri thức Vật lí hạt nhân của nội dung do AI tạo. Trước khi dùng trong học liệu chính thức:

1. Người biên soạn ghi nguồn, phiên bản nội dung và phần có AI hỗ trợ; đối chiếu với sách giáo khoa và nguồn khoa học đáng tin cậy, phù hợp phạm vi được phép sử dụng.
2. Giáo viên hoặc người có chuyên môn kiểm tra ít nhất: khái niệm; kí hiệu và đơn vị; quan hệ và phép tính; điều kiện, giới hạn và ngữ cảnh; câu hỏi, đáp án và giải thích. Với phương trình hạt nhân phải kiểm tra bảo toàn số khối và điện tích khi phù hợp.
3. Đối với mô phỏng, nêu rõ hiện tượng, giả định, ý nghĩa tham số, đại lượng quy ước và giới hạn mô hình. Kiểm tra một số trường hợp điển hình có thể tính hoặc đối chiếu độc lập; không gán độ chính xác định lượng nếu chưa chứng minh.
4. Kết quả kiểm tra ghi **đạt / cần sửa / chưa kiểm tra**, người duyệt, ngày, nguồn đối chiếu và vấn đề còn mở. Chỉ phát hành nội dung đã được người có trách nhiệm duyệt. AI hỗ trợ soạn và phản hồi sơ bộ, không thay thế quyết định chuyên môn hoặc điểm chính thức của giáo viên.

## 6. Giao diện và nhận diện

- Giao diện ưu tiên rõ ràng, thông thoáng, dễ tìm và dễ thao tác cho học sinh, giáo viên; hỗ trợ màn hình nhỏ, bàn phím và trạng thái tải, lỗi, dữ liệu trống.
- Màu chủ đạo theo logo SGU hiện có ở `public/branding/sgu-logo.png` của dự án gốc. `#203090` và `#40C0E0` là màu lấy mẫu gần đúng để tham khảo, **chưa xác nhận là mã nhận diện chính thức**. Kiểm tra độ tương phản và không dùng màu là dấu hiệu duy nhất để truyền đạt thông tin.
- Ý tưởng sách tương tác và mô phỏng 3D là định hướng phát triển; chọn triển khai theo mục tiêu học tập, kiểm tra khả năng sử dụng và nguồn tài liệu, không tự coi đã hoàn thành hoặc làm thay nội dung được giáo viên duyệt.

## 7. Kiến trúc và phối hợp kỹ thuật

- Frontend định hướng React; backend riêng định hướng TypeScript, Docker và cơ sở dữ liệu cloud. Supabase PostgreSQL là đề xuất phù hợp với hệ thống gốc, cần nhóm duyệt. Không tự tạo dịch vụ, chuyển dữ liệu hay coi các repository mới đã chạy được.
- Hai bên thống nhất hợp đồng dữ liệu, xác thực, quyền truy cập và xử lý lỗi trước khi thay đổi phần dùng chung. Phần server phải kiểm tra quyền, không coi việc ẩn nút trên giao diện là bảo vệ dữ liệu. Khi liên quan Supabase phải đối chiếu Auth, RLS, Storage và migration thực tế.
- `README.md` nói dự án làm gì, trạng thái và cách chạy **đã kiểm chứng**. `docs/ARCHITECTURE.md` dành cho nhóm và người xem xét. `.agent/` là ghi chú cục bộ cho AI và người tiếp tục công việc; cần chỉ rõ đường dẫn khi giao việc, vì không thể mặc định mọi công cụ AI tự đọc thư mục này.
- Không đẩy `.agent/` lên Git. Tài liệu chia sẻ và hành động GitHub thực hiện theo yêu cầu hiện hành của chủ dự án; luôn kiểm tra chính xác tệp và nội dung trước khi chia sẻ.

## 8. Dữ liệu, kinh phí và nghiên cứu

- Không đưa khóa, mật khẩu, tài liệu hạn chế tiết lộ hoặc thông tin định danh học sinh lên Git hay dịch vụ AI công khai. Chỉ sử dụng dữ liệu tối thiểu; phân quyền, quy định thời hạn lưu và kiểm soát việc xuất dữ liệu theo kế hoạch được duyệt.
- Giả danh là thay thông tin nhận dạng bằng mã; mã hóa là biện pháp bảo vệ dữ liệu. Hai việc khác nhau và cần quản lý khóa, bảng đối chiếu và quyền truy cập theo phương án nghiên cứu thực tế.
- Cô Nhị đã yêu cầu dừng phát sinh chi phí; không tự mua, nâng gói, khởi tạo dịch vụ trả phí hoặc tạo cam kết chi tiêu. Giải pháp mới cần làm rõ chi phí, giới hạn và người quyết định trước khi sử dụng.
- Không tự tạo dữ liệu khảo sát, phản biện, lớp thực nghiệm, kết quả hay số liệu thống kê. Bản thuyết minh có thông tin mẫu và mốc thời gian cần đối chiếu; ghi nhận sự khác biệt và xác nhận với nhóm trước khi sử dụng chính thức.
- Khi viết bài hoặc báo cáo, tuân theo biểu mẫu và yêu cầu trích dẫn giảng viên cung cấp, kiểm tra nguồn và ghi rõ tình trạng công bố; không xem phản biện do AI mô phỏng là nhận xét của giáo viên hay chuyên gia thật.

## 9. Danh sách kiểm tra trước bàn giao

- [ ] Mục tiêu, phạm vi, trạng thái và người dùng được nêu rõ; không ghi chức năng dự kiến thành chức năng đã có.
- [ ] Các hoạt động học có mục tiêu, nhiệm vụ, sản phẩm và tiêu chí phản hồi; nhiệm vụ trước giờ có bằng chứng học tập thực chất.
- [ ] Nội dung AI và mô phỏng đã được đối chiếu chuyên môn, ghi nguồn và trạng thái duyệt hoặc đánh dấu chưa duyệt.
- [ ] Giao diện nhất quán, dễ dùng; màu xanh theo tham chiếu đã được kiểm tra độ tương phản.
- [ ] Quyền, dữ liệu và tài liệu nhạy cảm được kiểm tra; `.agent/` không nằm trong nội dung chia sẻ.
- [ ] Tài liệu, kết quả kiểm thử và việc còn lại khớp với thực tế; các điểm chưa thống nhất được ghi lại.

## Nguồn đã đối chiếu và giới hạn

- `hd.docx` và `ĐÃ SỬA - NCKH.docx` trong dự án gốc.
- `ĐT_06 - NX.pdf`, trang 2, do người phản biện góp ý; nằm trong thư mục phản biện được chia sẻ trong nhóm Zalo NCKH_SV_SPKHTN. Hai yêu cầu chính là tự học thực chất trước giờ và kiểm định kiến thức do AI tạo.
- Phần trao đổi có thể đọc được với cô Nhị và Lê, cùng yêu cầu trực tiếp của chủ dự án. Chưa khẳng định đã đọc mọi tin nhắn hoặc mọi tài liệu đính kèm trong các cuộc trò chuyện.
- Quy định là bản tổng hợp để nhóm duyệt; các ví dụ triển khai và cách kiểm tra được đề xuất từ các nguồn trên, không phải trích nguyên văn chỉ đạo của giảng viên hoặc phản biện.
