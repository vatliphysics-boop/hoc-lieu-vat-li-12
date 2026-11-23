# Kiểm toán UI/UX hiện trạng

Khảo sát tĩnh ngày 13/11/2026; chưa xem đây là bằng chứng chạy thực tế, kiểm thử thiết bị hay đánh giá người học. Thiết kế hiện tại đã có `src/app/design-tokens.css`, `design-system.css`, `docs/UI_DESIGN_SYSTEM.md`, CSS modules và KaTeX. Bảo toàn tài sản, ưu tiên cải tiến có chứng cứ.

| Khu vực | Phát hiện | Đề xuất |
|---|---|---|
| Điều hướng | Có cả phòng hạt nhân cũ, phòng v2 và phòng trực quan; người học cần hiểu điểm khác nhau. | **CẢI TIẾN** tên và đường vào hoạt động; giữ các URL đã công bố. |
| Trang chủ và kho | Hero giới thiệu mô hình hạt nhân và liên kết nhiều tuyến; kho phân biệt tự luyện với nộp qua lớp. | **CẢI TIẾN** thứ tự hành động và mối liên hệ ba pha; không xóa tài liệu. |
| Cấu trúc hạt nhân | `NucleusExplorer` hỗ trợ chọn nucleon, góc nhìn, cắt lớp, fullscreen native với phương án mở rộng, cảm ứng/bàn phím, reduced motion, fallback khi WebGL lỗi. | **GIỮ NGUYÊN/CẢI TIẾN**; cần kiểm tra thực tế mobile, cảm ứng, bàn phím và công nghệ hỗ trợ. |
| B23 | `DecayProcessLab` có seed, số hạt, T, so sánh, bảng số, biểu đồ, bước/tạm dừng/tốc độ/CSV; vùng hạt hiện là SVG 2D và câu hỏi/tiêu chí có tính cố định. | **CẢI TIẾN** bằng quần thể 3D có dự phòng, các câu hỏi phụ và tiến độ dựa trên bằng chứng; phân biệt kì vọng và một mẫu. |
| Vai trò và tiến độ | Có `StudentShell`, `TeacherShell`, xem bài nộp theo học sinh/pha; chưa thấy dashboard tổng hợp các thao tác thí nghiệm. | **CẢI TIẾN** liên kết kết quả với nhiệm vụ, tính minh bạch của chế độ xem trước và phạm vi dữ liệu. |
| Navigation và trợ lí | `PublicShell` có skip link; phòng v2 và phòng cũ truyền `floatingTutor={false}`. | **GIỮ NGUYÊN** tránh khung trợ lí nổi che mô phỏng; kiểm tra fullscreen và chiều cao trên thiết bị. |
| Tính thích ứng | Mã có một số grid nội tuyến, CSS responsive và hai bố cục SVG; không thể suy luận tất cả màn hình đã đạt từ mã. | **CẢI TIẾN**, kiểm tra thực tế 320–desktop, phóng to chữ, chạm và tràn ngang. |

Không đề xuất **THAY THẾ** toàn bộ các trang chỉ dựa vào tuổi mã. Phần cần thay ở cấp chức năng là cách dẫn dắt cố định khi được thay thế bằng chu trình thích ứng đã kiểm thử, đồng thời giữ đường học hiện hữu cho đến khi tích hợp an toàn.
