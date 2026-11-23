# Hướng đi cho học liệu Vật lí hạt nhân 12

**Bản làm việc để Khôi, cô Nhị và nhóm trao đổi — 13/11/2026.**

## 1. Sản phẩm nên là gì?

Một **cuốn sách học liệu tương tác gắn với lớp học**: học sinh mở từng bài Vật lí hạt nhân, tự khám phá bằng câu hỏi và mô phỏng, để lại điều mình nghĩ; giáo viên nhìn được học sinh đang hiểu gì để tổ chức giờ học và hỗ trợ các em.

Cuốn sách không chỉ để lật trang. Mỗi trang phải giúp trả lời: **em cần hiểu gì, em sẽ làm gì, em đã nghĩ gì, và cô sẽ dùng kết quả ấy ra sao?** Giao diện đẹp và mô phỏng 3D phục vụ quá trình này.

## 2. Một bài học có thể diễn ra như thế nào?

Lấy **B23 — hiện tượng phóng xạ** làm ví dụ đề xuất:

1. **Trước giờ:** học sinh xem học liệu ngắn, dự đoán số hạt còn lại sau một khoảng thời gian và giải thích lí do. Các em chạy mô hình bán rã vài lần, ghi kết quả và so sánh với dự đoán.
2. **Giáo viên chuẩn bị giờ dạy:** xem các cách lí giải hoặc câu hỏi chưa rõ, chọn một vài điểm cần thảo luận. Cô không chỉ thấy rằng học sinh đã mở trang.
3. **Trong giờ:** học sinh thảo luận vì sao mỗi lần chạy có thể khác nhau, đọc bảng và đồ thị, phân biệt một hạt phân rã ngẫu nhiên với quy luật thống kê của nhiều hạt. Giáo viên chốt kiến thức đúng.
4. **Sau giờ:** học sinh sửa hoặc bổ sung lời giải thích, vận dụng vào câu hỏi mới và ghi điều mình còn thắc mắc.

Đây là một **kịch bản thiết kế**, chưa khẳng định các bước đang kết nối đầy đủ trên website, chưa khẳng định đã chứng minh tác động đến năng lực tự học.

## 3. Vì sao hướng này bám sát đề tài?

| Căn cứ | Điều phải giữ trong sản phẩm |
| --- | --- |
| Thuyết minh đề tài | Học liệu số có AI hỗ trợ, lớp học đảo ngược và năng lực tự học trong chủ đề Vật lí hạt nhân 12; giáo viên và học sinh là người dùng chính. |
| `hd.docx` của cô | Trước giờ có học liệu, mô phỏng, phiếu và câu hỏi; trong giờ có xử lí dữ liệu, đồ thị, thảo luận, tình huống và hoạt động nhóm. Giai đoạn sau giờ được đối chiếu thêm với thuyết minh. |
| Phiếu nhận xét `ĐT_06 - NX.pdf` | Thiết kế cách nhận biết việc tự học trước giờ có ý nghĩa, không chỉ đếm truy cập; có tiêu chí kiểm định tính chính xác kiến thức Vật lí do AI tạo. |
| Trao đổi với cô Nhị | Bài báo cần phân biệt với tiến trình thực nghiệm của đề tài; nội dung cần cô góp ý. Cô đồng ý bổ sung chức năng web nhưng yêu cầu dừng phát sinh chi phí. |
| Trao đổi với Lê và yêu cầu của Khôi | Có tài liệu và quy định làm việc; tách định hướng frontend/backend, `.agent` lưu tiến độ cục bộ; ưu tiên giao diện trước, sau đó cải thiện mô phỏng. Màu xanh tham chiếu logo SGU. |

Các ví dụ và cách sắp xếp trong tài liệu là đề xuất của nhóm, không phải lời khẳng định cô hay phản biện đã duyệt từng màn hình.

### Những sản phẩm cần đối chiếu với thuyết minh

Bản thuyết minh dự kiến một bộ học liệu phù hợp chương trình, quy trình thiết kế học liệu có AI hỗ trợ, hướng dẫn sử dụng AI, ba kế hoạch dạy học theo ba giai đoạn, công cụ đánh giá năng lực tự học và bài báo. Đây là **danh mục dự kiến trong hồ sơ**, chưa phải xác nhận sản phẩm đã hoàn thành; cần kiểm tra bản được duyệt và phân công hiện hành.

Trong `hd.docx`, cô gợi ý trước giờ dùng video theo bài, mô phỏng hạt nhân/bán rã/phân hạch, infographic, phiếu và trắc nghiệm; trong giờ có xử lí bảng số liệu, vẽ đồ thị, sơ đồ ứng dụng, đóng vai và trò chơi. Cần lựa chọn theo mục tiêu từng bài, không biến danh sách công cụ gợi ý thành yêu cầu đã hoàn tất.

## 4. Hiện đã có gì và chưa biết gì?

**Có thể thấy trong mã dự án gốc:** ứng dụng Next.js/React dùng Supabase; có kho học liệu, các phần học sinh/giáo viên, mô phỏng và tài liệu. Mã có `HalfLifePilot`, một trang thí nghiệm bán rã, lựa chọn lưu cục bộ, các hàm dự kiến lưu/nộp theo lớp và migration liên quan.

**Chưa đủ bằng chứng để khẳng định:** migration đã áp dụng vào môi trường thật, tài khoản học sinh/giáo viên đã chạy thông suốt, dữ liệu được nộp và hiển thị đúng, hoặc bài học đã được thẩm định và thực nghiệm. Cần kiểm tra với môi trường và người dùng phù hợp.

Hai repository `frontend` và `backend` mới tạo trên GitHub đang trống; cấu trúc tách riêng và Docker/cloud database là hướng đề xuất, chưa có nghĩa mã gốc đã được tách. **Không làm lại từ đầu trước khi kiểm kê phần đang có.**

## 5. Ba chặng tiếp theo

### Chặng 1 — Làm rõ và sắp xếp

- Cô và nhóm xem lại mục tiêu, quy định chung, góp ý NX6, bản thuyết minh và kế hoạch thực hiện. Đối chiếu các điểm chưa thống nhất về mẫu và mốc thời gian với hồ sơ đã duyệt.
- Kiểm kê các phần giao diện, học liệu, lớp học, ghi/nộp bài và mô phỏng đã có: phần nào chạy được, kiểm bằng tài khoản/môi trường nào, phần nào còn thiếu.
- Phác thảo giao diện sách học liệu theo màu xanh tham chiếu logo SGU, tập trung đường đi học sinh và giáo viên. Chưa cần làm đồng thời toàn bộ website và mô phỏng 3D.

**Kết quả cần có:** bảng hiện trạng có bằng chứng và bản sơ đồ giao diện để cô/nhóm nhận xét.

### Chặng 2 — Làm một hành trình hoàn chỉnh

- Chọn một bài mẫu, đề xuất B23, và lập bảng: mục tiêu → học liệu → dự đoán/thao tác → sản phẩm → phản hồi → hoạt động trên lớp → vận dụng sau giờ.
- Rà lại mô hình bán rã, đơn vị, ngẫu nhiên thống kê và nguồn; giáo viên kiểm tra nội dung AI. Làm rõ sản phẩm nào chỉ lưu trên máy, sản phẩm nào nộp được cho giáo viên.
- Kiểm thử đường đi học sinh/giáo viên, lỗi mạng và thiết bị; chỉ sau đó tính phương án thử với người thật theo kế hoạch đã được cô duyệt.

**Kết quả cần có:** một hành trình có thể trình diễn và kiểm tra từ đầu đến cuối, kèm điều còn thiếu; không coi lượt mở trang là chứng minh tự học.

### Chặng 3 — Mở rộng có kiểm soát

- Sau khi bài mẫu được đánh giá, áp dụng cách tổ chức cho B21, B22, B24, B25; cải tiến mô phỏng/ảnh/video theo từng mục tiêu học tập.
- Cùng Lê chốt ranh giới frontend React, backend TypeScript/Docker và cloud database; chỉ tách, chuyển mã hoặc triển khai khi đã thống nhất và kiểm tra tác động.
- Chuẩn bị minh chứng, phản hồi giáo viên và các công cụ nghiên cứu phù hợp. Phần bài báo và thực nghiệm phải phản ánh đúng trạng thái, không bịa số liệu hoặc hiệu quả.

**Kết quả cần có:** học liệu nhất quán theo bài, quy trình quản lí và đánh giá rõ, cùng danh sách bằng chứng thực tế để nhóm tiếp tục nghiên cứu.

## 6. Bốn điều cần trao đổi với cô và nhóm

1. B23 có phù hợp để làm hành trình mẫu đầu tiên không? Nhiệm vụ và bằng chứng nào đủ để xem xét việc học trước giờ theo góp ý NX6?
2. Ai duyệt kiến thức Vật lí, học liệu do AI tạo và mô phỏng? Dùng nguồn và tiêu chí đối chiếu nào?
3. Phần nào của ứng dụng cũ cần giữ nguyên, sửa trước hoặc tạm để sau? Khi nào nhóm thật sự cần tách hai repository?
4. Kế hoạch bài báo, thiết kế thực nghiệm, dữ liệu học sinh và tiến độ hành chính cần cập nhật thế nào theo hồ sơ được duyệt?

Trong nhóm NCKH có thông báo ngày 11/11 về nộp lại thuyết minh trước **11:00 ngày 16/11/2026** và yêu cầu giấy tờ; cần đối chiếu thông báo mới nhất, loại đề tài, hồ sơ và tình trạng nộp với cô. Đây là thông tin đã đọc từ nhóm, không phải xác nhận hồ sơ của bạn đã nộp hay chưa.

## 7. Đọc tiếp khi cần

- [Quy định chung bắt buộc](QUY_DINH_CHUNG.md): nguyên tắc làm việc, dữ liệu, AI và kiểm định nội dung.
- [Nghiên cứu chi tiết và hướng đi](NGHIEN_CUU_VA_HUONG_DI_TIEP.md): so sánh các hình thức lớp học, website, mô phỏng và nguồn tham khảo.
- [Khảo sát chuyên sâu mô phỏng và website](KHAO_SAT_CHUYEN_SAU.md): so sánh học liệu quốc tế, phản biện mô hình bán rã, nguồn nghiên cứu và các giới hạn cần kiểm chứng.
- [Ma trận chương trình và nhận xét NX6](MA_TRAN_CHUONG_TRINH_VA_NX6.md): liên kết B21–B25 với hoạt động trước, trong và sau giờ, cùng bằng chứng cần thu thập.
- [Phiếu B23 và cách xem minh chứng mẫu](PHIEU_MAU_B23_VA_MINH_CHUNG.md): ví dụ cụ thể để hình dung hành trình học và đem trao đổi với cô.
- [Kiến trúc frontend](frontend/docs/ARCHITECTURE.md) và [kiến trúc backend](backend/docs/ARCHITECTURE.md): phương án kỹ thuật cần nhóm duyệt.

Nhóm có thể điều chỉnh hướng này sau khi xem tài liệu và đối chiếu thực tế. Chưa nhắn thay bạn, chưa đẩy tài liệu hay `.agent` lên GitHub, và chưa phát sinh chi phí trong lượt làm việc này.
