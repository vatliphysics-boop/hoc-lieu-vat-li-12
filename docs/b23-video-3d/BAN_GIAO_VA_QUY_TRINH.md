# B23 — Bàn giao sản xuất video 3D

Trạng thái: chuẩn bị bài và dựng mẫu để duyệt; chưa sản xuất video chính. Hồ sơ này phục vụ bàn giao học liệu cho 4 Argon, không trình bày số liệu hay kết quả nghiên cứu.

## Phạm vi đã đối chiếu

- SGK Vật lí 12, Kết nối tri thức với cuộc sống, Bài 23, trang in 104–113: [bản chương IV](../../public/learning/SGK-chuong-IV.pdf), trang PDF 15–24. Bản quét đã được đọc trực tiếp, không dựa riêng vào ma trận cũ.
- Tr. 104–106: hiện tượng tự phát, ngẫu nhiên; α, β⁻, β⁺, γ; phương trình tổng quát, trong đó có phản neutrino/neutrino. Tr. 107–109: chu kì bán rã, định luật, hằng số phóng xạ, độ phóng xạ và đơn vị. Tr. 110–113: ảnh hưởng, biển cảnh báo, an toàn và tổng kết.
- Khung “Em có biết” về carbon-14 và định lượng liều là phần đọc thêm, không đánh đồng với yêu cầu cốt lõi. Không dùng các kết quả mô phỏng làm số liệu thực nghiệm.
- [Ma trận cũ](../simulation-v2/B23_SGK_CONTENT_MAP.md) và `src/lib/b23-content.ts` có thông tin vị trí cần kiểm tra lại: mục III bắt đầu tr. 110; mục IV bắt đầu tr. 111, kéo dài đến tr. 113; carbon-14 nằm ở khung đọc thêm tr. 109–110. Không tự sửa các học liệu đang vận hành trong đợt làm video.
- Video cũ có lời, thời lượng khoảng 93,73 giây tại `public/videos/nuclear-lessons/b23.mp4` và bản sao trong `nuclear-lessons-v2`; mã dựng tại `scripts/nuclear-videos/`, mô hình tại `src/lib/radioactive-decay-model.ts`. Giọng cũ dùng VieNeu-TTS theo `scripts/nuclear-videos/voice/README.md`, không phải ElevenLabs.

## Quy ước khoa học và kiểm tra

Hình cầu, màu, khoảng cách, tốc độ và kích thước đều là quy ước; hạt nhân không theo tỉ lệ. Cảnh mô tả hạt nhân không vẽ nucleon chuyển động trên quỹ đạo cổ điển xác định. Mẫu nhỏ là một lần mô phỏng có seed, không là số đo; đồ thị hàm mũ là số trung bình kì vọng cho tập hợp lớn. Chu kì bán rã không dự đoán thời điểm phân rã từng hạt nhân; một lượt mẫu hữu hạn không buộc còn đúng một nửa. Với N₀ hạt mẹ độc lập, kì vọng là N₀·2^(−t/T). Khi dựng từng phương trình, kiểm tổng A và Z hai vế, và đánh dấu gamma là photon khi hạt nhân chuyển từ trạng thái kích thích xuống mức năng lượng thấp hơn.

## Thao tác ElevenLabs cho bản chính

Hiện phiên làm việc không có kết nối ElevenLabs được cấp quyền. Không có âm thanh ElevenLabs nào đã được tạo. Giọng hệ thống trong bản mẫu (nếu có) chỉ kiểm tra nhịp, không phải giọng được chấp thuận cho video chính.

1. Mở [Text to Speech của ElevenLabs](https://elevenlabs.io/app/speech-synthesis/text-to-speech), chọn giọng có tiếng Việt và giọng vùng phù hợp; chọn mô hình hỗ trợ tiếng Việt, ví dụ Flash v2.5 theo [tài liệu ngôn ngữ](https://elevenlabs.io/docs/overview/capabilities/text-to-speech). Kiểm tra mức sử dụng tài khoản trước khi xuất.
2. Dán riêng đoạn thử 2–3 câu từ cảnh ngẫu nhiên/bán rã trong `STORYBOARD_KICH_BAN.md`; bắt đầu tốc độ bình thường. Nghe kiểm tra thanh điệu, ngắt câu, “phân rã”, “chu kì”, số và cách đọc kí hiệu. Lưu đoạn thử, tên giọng, model, thiết lập và phiên bản kịch bản. Chọn giọng sau khi nghe, trước khi sinh toàn bài.
3. Chỉ gửi bản **lời đọc**, không gửi mã cảnh, công thức định dạng hay chỉ dẫn hình. Tạo theo từng cảnh để sửa phát âm mà không phải làm lại toàn bài. Giữ tên cảnh làm tên tệp và giữ từng tệp gốc. Sửa chính tả phiên âm hoặc dùng [Pronunciations Editor](https://elevenlabs.io/docs/help-center/product/studio/studio/how-do-i-use-the-pronunciations-editor-in-studio) nếu model hỗ trợ, rồi nghe lại. Tài liệu ElevenLabs lưu ý tiếng trên website được nhận diện từ văn bản và giọng ảnh hưởng đến giọng vùng: [language and accent](https://elevenlabs.io/docs/help-center/product/core-capabilities/text-to-speech/how-do-i-select-the-language-and-accent).
4. Đo thời lượng từng tệp thực tế, dựng cue theo câu nói, giữ khoảng quan sát và suy nghĩ; không tăng tốc audio để ép thời lượng. Đồng bộ lại VTT/SRT theo âm thanh được duyệt, kiểm tra các con số, phủ định và thuật ngữ bằng nghe trực tiếp; không dùng mốc dự kiến làm mốc cuối.

## Tích hợp sau khi duyệt video hoàn chỉnh

1. Giữ video mẫu ngoài đường dẫn học liệu chính. Kiểm tra MP4 H.264/AAC, tỉ lệ 16:9, phụ đề, thời lượng và phát trên trình duyệt/màn hình hẹp trước khi thay bản công bố.
2. `/hoc-lieu/phong-hat-nhan-v2?bai=B23#video` đang đọc trực tiếp `public/videos/nuclear-lessons-v2/b23.mp4`, poster `b23.jpg`, track `b23.vi.vtt` trong `src/components/physics/B23Lesson.tsx`. Trang `/hoc-lieu/phong-hat-nhan?bai=B23` dùng `src/components/learning/NuclearLessonVideo.tsx` và `nuclearVideoUrl` trong `src/lib/nuclear-lab-lessons.ts`, trỏ `public/videos/nuclear-lessons/`.
3. Hai thư mục là hai bản sao độc lập. Khi bản hoàn chỉnh đã duyệt, thống nhất đường dẫn hoặc cập nhật cả MP4, poster, VTT và `src/data/nuclear-video-metadata.json`; đối chiếu SHA-256 hai bản nếu giữ hai bản sao. Cập nhật mô tả “phụ đề có sẵn trong hình” nếu video chỉ có track rời. Kiểm tra tải, seek, bật/tắt phụ đề và thời lượng tại cả hai trang. Không dùng đoạn mẫu làm video toàn bài.

## Nhật ký và nguồn

- 12/11/2026: kiểm tra SGK bản quét, mã nội dung và hai đường dẫn video; lập storyboard, kịch bản, hướng dẫn và dựng mẫu riêng. Mẫu dài 51,33 giây, 1280 × 720, H.264/AAC; đã kiểm tra khung hình tại 3, 20, 30 và 45 giây, và tín hiệu âm thanh so với nguồn. Chưa nghe trực tiếp để xác nhận phát âm; chưa đánh giá tác động học tập hay thu thập số liệu nghiên cứu. Nguồn dựng và thông số mô hình tại [thư mục mẫu](../../deliverables/b23-video/mau-ngau-nhien/README.md).
- 12/11/2026: theo góp ý của Khôi, dựng [mẫu sinh động lần 2](../../deliverables/b23-video/mau-sinh-dong/README.md), tham khảo hướng minh họa từng bước của video Manabie. Khôi đã nghe đoạn thử 16 giây và chọn tạm giọng Kim Thanh cho mẫu. Bản đầy đủ dài 56,15 giây, dùng VieNeu-TTS cục bộ, chưa phải ElevenLabs; toàn bộ lời đọc cần được nghe duyệt. Kiểm tra khung hình và tín hiệu chỉ là kiểm tra sản phẩm, không phải kết quả nghiên cứu.
- 12/11/2026: đối chiếu lại mẫu Trúc Ly và storyboard với sách tr. 104–113. Lưu [biên bản đối chiếu](DOI_CHIEU_SGK_MAU_TRUC_LY.md); cập nhật storyboard để thêm thí nghiệm, các ví dụ và đại lượng trong SGK. Thời lượng mới 7:20 chỉ là lịch dự kiến, cần kiểm bằng lời thu thực tế. Chưa dựng lại mẫu hay thay video website trong lượt đối chiếu này.
- SGK Vật lí 12 KNTT, Bài 23, tr. 104–113, bản PDF nội bộ nêu trên. Mô hình và video cũ là nguồn tham khảo triển khai, không thay thế việc đọc sách.
- Tài liệu ElevenLabs được liên kết trực tiếp tại các bước sử dụng; truy cập 12/11/2026. Khi đổi giọng hoặc mô hình cần kiểm tra lại tính năng hiện hành.
