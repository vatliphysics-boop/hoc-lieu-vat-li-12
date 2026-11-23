# Ma trận chương trình Vật lí 12, học liệu và góp ý NX6

**Bản đề xuất để cô và nhóm xem xét — 14/11/2026.** Căn cứ gồm chương trình Vật lí đang lưu trong dự án, `hd.docx`, thuyết minh, phiếu `ĐT_06 - NX.pdf` và mô tả hiện trạng mã. Đối chiếu này không xác nhận mọi chức năng đã chạy hoặc mọi nhiệm vụ đã được giáo viên duyệt.

## 1. Các yêu cầu gốc cần giữ

Đã xem trực tiếp [chương trình Vật lí trong dự án](../public/learning/physics-curriculum-2018.pdf), trang 27–28 của tệp, phần Vật lí hạt nhân và phóng xạ. Các nội dung tóm tắt dưới đây cần tiếp tục được đối chiếu với văn bản áp dụng và kế hoạch của cô:

- Cấu trúc hạt nhân: rút ra sự tồn tại và đánh giá kích thước hạt nhân từ thí nghiệm tán xạ alpha; biểu diễn kí hiệu theo số nucleon/proton; mô tả mô hình đơn giản của **nguyên tử** gồm proton, neutron, electron.
- Độ hụt khối và năng lượng liên kết: viết phương trình phân rã đơn giản, thảo luận liên hệ khối lượng–năng lượng và mối liên hệ năng lượng liên kết riêng–độ bền vững; nêu phân hạch và tổng hợp, thảo luận vai trò công nghiệp hạt nhân.
- Phóng xạ: nêu tính tự phát, ngẫu nhiên; định nghĩa độ phóng xạ và hằng số, vận dụng `H = λN` và công thức suy giảm trong phạm vi được nêu; định nghĩa chu kì bán rã; mô tả sơ lược tia alpha/beta/gamma, nhận biết biển báo và nguyên tắc an toàn.

`hd.docx` nêu gợi ý trước giờ học như video, mô phỏng, infographic, phiếu, câu hỏi; trong giờ có xử lí dữ liệu, đồ thị, sơ đồ, đóng vai và trò chơi. Thuyết minh bổ sung sau giờ và mục tiêu năng lực tự học. Các phương án dưới đây là **thiết kế mới**, không phải trích nguyên văn yêu cầu của cô.

## 2. Ma trận nội dung và minh chứng đề xuất

| Bài theo dữ liệu hiện có | Trọng tâm đối chiếu | Trước giờ: việc và sản phẩm dự kiến | Trong/sau giờ: phát triển ý tưởng | Điều phải kiểm tra |
| --- | --- | --- | --- | --- |
| B21 — Cấu trúc hạt nhân | Tán xạ alpha, kí hiệu A/Z, proton/neutron | Dự đoán đường đi của hạt alpha, ghi lí do; ghép proton/neutron và mô tả sự thay đổi A, Z | So sánh quan sát nhóm, giải thích bằng chứng về hạt nhân; sau giờ vận dụng kí hiệu | Không trình bày hình hạt hoặc kích thước quy ước như ảnh thật; phân biệt nguyên tử với hạt nhân. |
| B22 — Phản ứng hạt nhân và năng lượng liên kết | Phương trình, khối lượng–năng lượng, năng lượng liên kết riêng | Thử điền phương trình và kiểm tra tổng A/Z; giải thích dự đoán | Đối chiếu ví dụ được giải, thảo luận độ hụt khối; sau giờ giải tình huống mới | Không trộn quy ước khối lượng nguyên tử và hạt nhân; kiểm tra số liệu, đơn vị và nguồn. |
| B23 — Hiện tượng phóng xạ | Tự phát/ngẫu nhiên, bán rã, H và N | Dự đoán riêng một hạt và mẫu nhiều hạt; chạy/quan sát hai lượt, ghi dữ liệu và lí do | Phân tích đồ thị, so sánh dự đoán, giải thích sai khác; sau giờ vận dụng và phản tư | Phân biệt giá trị kì vọng với một lượt; không khẳng định tự học từ lượt xem. |
| B24 — Công nghiệp hạt nhân | Chuyển hóa năng lượng, ứng dụng và an toàn | Đọc sơ đồ hoặc tình huống, nêu lợi ích, rủi ro và câu hỏi; nhận diện biển báo theo nội dung giáo viên duyệt | Thảo luận vai trò, nguyên tắc an toàn hoặc đóng vai; sau giờ nêu điều kiện/nguồn | Không đồng nhất mô phỏng định tính với vận hành lò hay chỉ dẫn an toàn bức xạ thực tế. |
| B25 — Ôn tập và phân tích số liệu hạt nhân | Vận dụng khái niệm, đọc bảng và đồ thị | Chọn cách đọc bảng/đồ thị và ghi dự đoán | Thảo luận lời giải và đơn vị; sau giờ áp dụng vào dữ liệu khác có nguồn | Không trộn số đo trong tài liệu với số tạo bởi mô hình; giữ nhãn, đơn vị và giới hạn. |

Tên và cách chia bài lấy theo `src/data/nuclear-learning.json` của dự án, không thay thế phân phối chương trình chính thức của trường. [Bảng đối chiếu SGK đã có](../docs/SGK_RESEARCH_WEB_MATRIX.md) là nguồn làm việc cần được giáo viên kiểm tra thêm, không mặc định mọi chi tiết đã được duyệt.

## 3. Ba bộ công cụ đề xuất

### A. Phiếu chuẩn bị tối giản cho học sinh

Một phiếu ngắn cho từng nhiệm vụ, có bản giấy tương đương: mục tiêu/cách làm, dự đoán và lí do, dữ liệu/quan sát, câu hỏi chưa rõ. Trong giờ giáo viên chọn các cách giải thích để thảo luận; sau giờ học sinh ghi điều thay đổi và bước tiếp theo. Tình trạng “chưa quan sát” khác với “không làm”, nhất là khi học sinh thiếu thiết bị hoặc mạng.

### B. Công cụ nghiên cứu năng lực tự học

Thiết kế ma trận **mục tiêu → hành vi quan sát → nhiệm vụ → minh chứng → tiêu chí đánh giá**. Cân nhắc phối hợp phiếu, câu hỏi kiến thức tương đương, bảng hỏi có nguồn và quyền dùng, quan sát, phỏng vấn giáo viên/học sinh; nếu điều kiện cho phép, hai người đối chiếu việc chấm một phần mẫu. Thử mức dễ hiểu, tính phù hợp và độ tin cậy với cỡ mẫu thực tế; mô tả dữ liệu thiếu.

Đây là phương án đề xuất, chưa phải thang đo đã chuẩn hóa. Cô và nhóm cần quyết định thiết kế, quyền tham gia, công cụ và cách phân tích; không gộp điểm hay đặt ngưỡng hoàn thành tùy ý. Không tuyên bố quan hệ nhân quả chỉ từ so sánh trước–sau một lớp.

### C. Phiếu kiểm định học liệu do AI hỗ trợ

Mỗi mục kiểm tra mục tiêu và nguồn được phép; khái niệm, kí hiệu và đơn vị; điều kiện/giới hạn; A/Z trong phản ứng khi phù hợp; phép tính, đồ thị, đáp án; tính ngẫu nhiên và giá trị kì vọng của bán rã; tính rõ ràng, dễ dùng và an toàn. Ghi phiên bản, người kiểm tra, ngày, kết quả đạt/cần sửa/chưa kiểm tra, lỗi và lần kiểm lại. Chỉ dùng chính thức sau khi người có trách nhiệm duyệt.

## 4. Hai điểm NX6 phải thấy được trong sản phẩm

1. **Tự học trước giờ:** có câu hỏi đòi hỏi suy nghĩ, sản phẩm và phản hồi; giáo viên có cơ sở điều chỉnh giờ học. Lượt xem hay thời gian không thể một mình chứng minh năng lực tự học.
2. **Độ chính xác do AI tạo:** mỗi nội dung cần có tiêu chí khoa học, nguồn và người kiểm định. Hai AI đồng ý với nhau không thay thế chuyên gia và đối chiếu tài liệu gốc.

## 5. Những chỗ chưa thể chốt

- Phân loại và phương án nghiên cứu: bài báo nghiên cứu thiết kế khác với phần thực nghiệm của đề tài. Các mô tả mẫu, số lớp và mốc thời gian trong hồ sơ cần được đối chiếu bản chấp thuận và cô Nhị; chưa tự chọn một con số.
- Mức hoàn thành các luồng website: mã đã có không chứng minh hệ thống lớp học, lưu/nộp hoặc phân quyền đã hoạt động trên môi trường thật.
- Công cụ và chi phí: ưu tiên điều kiện hiện có; cô đã yêu cầu dừng phát sinh chi phí. Chưa mua, tạo dịch vụ mới hay chia sẻ dữ liệu học sinh.
- Vai trò của SGK, hình minh họa và nguồn thứ ba: cần kiểm tra nguồn gốc, quyền sử dụng và cách trích dẫn trước khi công bố.
