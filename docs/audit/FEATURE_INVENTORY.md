# Kiểm kê chức năng hiện có

Khảo sát mã nguồn ngày 13/11/2026; đây là kiểm kê tĩnh, không khẳng định mọi luồng đã chạy thành công. Các nhãn thể hiện đề xuất cho từng thành phần, không phải yêu cầu xóa mã.

| Thành phần | Bằng chứng | Hiện trạng và đánh giá |
|---|---|---|
| Trang chủ | `src/app/page.tsx`, `src/app/nuclear-lab.module.css` | Giới thiệu năm bài, tiến trình ba pha, mô hình C-12. **CẢI TIẾN**: ưu tiên một đường vào thí nghiệm và phân biệt nội dung tự luyện/nộp lớp. |
| Kho học liệu | `src/app/hoc-lieu/page.tsx`, `src/components/learning/LearningLibrary.tsx` | Lọc học liệu và lưu mục trên thiết bị. **GIỮ NGUYÊN** nội dung, **CẢI TIẾN** điều hướng. |
| Phòng hạt nhân hiện hữu | `src/app/hoc-lieu/phong-hat-nhan/page.tsx`, `NuclearProcessEntry.tsx` | Chọn B21–B25, mô phỏng quá trình, mô hình hạt nhân, video và nguồn; không xóa bản đang dùng. **CẢI TIẾN**. |
| Phòng tương tác v2 | `src/app/hoc-lieu/phong-hat-nhan-v2/page.tsx`, `B21Lesson.tsx`–`B25Lesson.tsx` | Bài theo nội dung SGK; B23 gắn `DecayProcessLab`. **CẢI TIẾN**; chưa hợp nhất hai điểm vào. |
| Cấu trúc hạt nhân 3D | `src/components/learning/NucleusExplorer.tsx`, `nucleus-scene.ts`, `src/lib/nucleus-layout.ts` | Chọn nucleon, cắt lớp, camera, fullscreen, bàn phím, reduced motion và sơ đồ dự phòng. **GIỮ NGUYÊN/CẢI TIẾN** theo kiểm thử thiết bị. |
| Bộ mô phỏng hoạt động | `FixedPhysicsActivityRenderer.tsx`, `Simulation3D.tsx`, `B21Activities.tsx`–`B25Activities.tsx` | Renderer ánh xạ khóa hoạt động sang bảng tương tác; canvas Three.js và các mô hình riêng. **CẢI TIẾN**: tách tiến độ và điều khiển khỏi trực quan; đánh giá từng bài trước khi thay. |
| Phân rã B23 | `DecayProcessLab.tsx`, `DecayProcessVisual.tsx`, `src/lib/radioactive-decay-model.ts`, `src/simulations-v2/physics/decay.ts` | Lấy mẫu tuổi thọ theo seed, biểu đồ SVG mẫu/kì vọng, so sánh, CSV, bước và tốc độ; `DecayProcessVisual` là 2D, không phải quần thể 3D. Có một câu kiểm tra và tiêu chí hoàn thành cơ bản. **CẢI TIẾN** vật lí và trực quan sẵn có, bổ sung chu trình điều kiện. |
| Ba pha học sinh | `src/app/student/lessons/[lessonId]/{before-class,in-class,after-class}/page.tsx`, `HalfLifeDiscovery.tsx` | Trang ba pha, học liệu, tiến trình, đánh giá/nhật kí. Nội dung khám phá B23 trước lớp hiện có ba yêu cầu tĩnh, không phải hệ câu hỏi thích ứng. **CẢI TIẾN**. |
| Giáo viên và xem kết quả | `src/app/teacher/lessons/[lessonId]/ket-qua/page.tsx`, `TeacherWorkroom.tsx`, `PathwayStepManager.tsx` | Xem theo học sinh/giai đoạn, bằng chứng và bài đánh giá; soạn bước, xuất bản học liệu. **CẢI TIẾN**: tổng hợp sự kiện mô phỏng, xuất ẩn danh, kiểm thử quyền và xem trước với dữ liệu thí điểm. |
| Tài khoản, lớp và API | `src/app/auth`, `src/app/student`, `src/app/teacher`, `src/app/api`, `src/lib/supabase` | Supabase Auth, server actions và route handlers cho học liệu/ngân hàng câu hỏi/AI; migrations ở `supabase/migrations`. **GIỮ NGUYÊN**; không thay lược đồ trực tiếp trên dữ liệu hiện có. |
| Lưu tiến độ | `src/lib/student-pathway.ts`, `src/app/student/actions.ts`, `supabase/migrations` | Supabase lưu `student_step_progress`, `student_phase_progress`, bài đánh giá, phản tư và tiến độ học liệu; kết quả/tiến độ gắn tài khoản nên không mặc định là dữ liệu nghiên cứu ẩn danh. Nhiều bản nháp và mục yêu thích dùng localStorage riêng, theo trình duyệt. Không thấy IndexedDB qua tìm kiếm mã `src`. **CẢI TIẾN**; chưa thấy event log phân rã có schema, consent, tổng hợp và xuất cho nghiên cứu. |
| Công thức và nguồn | `LatexMath.tsx`, `src/lib/nuclear-science.ts`, `docs/NUCLEAR_SCIENCE_SOURCES.md` | KaTeX đã có; tiếp tục kiểm chứng từng nội dung với nguồn. **GIỮ NGUYÊN/CẢI TIẾN**. |
| Video, âm thanh và hồ sơ nghiên cứu | `public/videos`, `docs`, `sao_luu_nckh`, các thư mục untracked | Tài sản hiện hữu và nhiều đầu việc song song. **GIỮ NGUYÊN**; không chỉnh sửa trong phạm vi này. |

## Phạm vi tuyến

- Công khai: `/`, `/gioi-thieu`, `/hoc-lieu`, `/hoc-lieu/{chuong-trinh,lop-hoc-dao-nguoc,truc-quan,phong-hat-nhan,phong-hat-nhan-v2,soan-ke-hoach,ai,ai-giao-vien}`, `/demo-lesson`, đăng nhập/đăng ký.
- Học sinh: `/student`, lớp, bài tập, chương trình, học liệu, nhật kí, AI và ba pha theo bài.
- Giáo viên: `/teacher`, lớp, học sinh, chương trình, kế hoạch, học liệu, AI, ba pha và kết quả từng bài.
- API: AI, ngân hàng sách/câu hỏi, tải Word; xem `src/app/api` để biết tuyến đầy đủ.

## Tài liệu liên quan

`docs/SGK_CHAPTER_IV_COVERAGE.md`, `docs/SGK_RESEARCH_WEB_MATRIX.md`, `docs/SGK_ACTIVITY_MATRIX.md`, `docs/TEACHER_NEEDS_AND_DESIGN.md`, `docs/DATA_MODEL.md`, `docs/codex-team/curriculum-applicable-extract.txt` và `docs/UI_DESIGN_SYSTEM.md` cung cấp bối cảnh. `SGK_ACTIVITY_MATRIX.md` tự ghi trạng thái cũ chưa đối chiếu B22–B25; không coi tài liệu đó là xác nhận đầy đủ. Có tài liệu nghiên cứu và SGK trong workspace; không ghi đè các tệp này.
