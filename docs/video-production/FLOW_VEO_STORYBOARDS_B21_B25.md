# Hồ sơ Kịch bản & Prompt Sản xuất 5 Video Hoạt hình Mở đầu Chương IV (B21–B25)

- **Dự án:** Học liệu số Vật lí 12 — Chủ đề Vật lí hạt nhân (Mô hình Lớp học đảo ngược)
- **Định dạng đích:** `1920×1080` (`16:9`), `30 fps`, thời lượng `36–38 giây / video` (nằm trong khung `30–45 giây`)
- **Phong cách giọng đọc:** Tiếng Việt miền Nam tự nhiên, ấm áp, chuẩn thuật ngữ SGK Vật lí 12 (xem tệp nguồn [`scripts/nuclear-videos/openers-narration.vi.json`](../../scripts/nuclear-videos/openers-narration.vi.json))
- **Tệp phụ đề đã xuất bản:** `public/videos/nuclear-openers/b21.vi.vtt` đến `b25.vi.vtt`
- **Trạng thái trung thực hiện tại:** `Có kịch bản, prompt từng cảnh, ảnh tham chiếu & phụ đề .vi.vtt — chờ kết nối API/Flow để render clip`

---

## Quy tắc kiểm định khoa học & hậu kì bắt buộc (theo `QUY_DINH_CHUNG.md`)

1. **Không để mô hình AI sinh chữ trên khung hình:** Mọi prompt tiếng Anh cho Google Flow / Veo / Gemini Omni đều khóa điều kiện `no text, no letters, no numbers, no formulas, no watermarks`. Toàn bộ nhãn bộ phận, số liệu, công thức và phụ đề chỉ ghép bằng lớp hậu kì kiểm soát được.
2. **Tách biệt hiện tượng quan sát và mô hình vi mô:**
   - Trong không gian thiết bị thí nghiệm (buồng chân không Rutherford, buồng sương Blackett, ngăn kéo Becquerel, lò phản ứng PWR), **tuyệt đối không dựng đường hạt phát sáng bay lơ lửng như tia laser** để tránh gây ngộ nhận hạt nhân hay tia phóng xạ phát sáng nhìn thấy bằng mắt thường.
   - Khi chuyển sang hình vẽ quỹ đạo hạt, cấu tạo nucleon, thế hệ neutron hoặc đường cong lí thuyết, **bắt buộc đóng nhãn hậu kì `Mô hình giải thích`** ở góc trên khung hình.
3. **Điểm dừng mở sang Pha 1:** Cảnh 4 của cả 5 phim đều dừng lại ở câu hỏi mâu thuẫn nhận thức / dự đoán định hướng, không giải hộ đáp án, nối trực tiếp vào hoạt động **Khởi động (Pha 1 — Trước giờ học)** của từng bài trên hệ thống.
4. **Kiểm soát kinh phí:** Không tự ý gọi API trả phí khi chưa có lệnh duyệt chi phí của chủ dự án và giảng viên hướng dẫn; toàn bộ tài nguyên tiền kì đã chuẩn hóa sẵn sàng.

---

## BÀI 21 · CẤU TRÚC HẠT NHÂN (36 giây · 16:9)

- **Trạng thái hiện tại:** `Có kịch bản, prompt từng cảnh, ảnh tham chiếu & phụ đề .vi.vtt — chờ kết nối API/Flow để render clip`
- **Tổng thời lượng:** `36 giây` (4 cảnh)
- **Phụ đề đối chiếu:** [`public/videos/nuclear-openers/b21.vi.vtt`](../../public/videos/nuclear-openers/b21.vi.vtt)
- **Ảnh tham chiếu thực tế từ kho học liệu:**
  - Thiết bị 3D Rutherford V3: [`public/illustrations/rutherford-v3-apparatus.png`](../../public/illustrations/rutherford-v3-apparatus.png) và [`public/videos/nuclear-openers/refs/b21-rutherford-v3-3d.png`](../../public/videos/nuclear-openers/refs/b21-rutherford-v3-3d.png)
  - Giao diện đối chiếu mô hình nguyên tử & đám mây electron B21: [`public/videos/nuclear-openers/refs/b21-atomic-thomson-rutherford.png`](../../public/videos/nuclear-openers/refs/b21-atomic-thomson-rutherford.png) và [`public/videos/nuclear-openers/refs/b21-atomic-electron-cloud.png`](../../public/videos/nuclear-openers/refs/b21-atomic-electron-cloud.png)
  - Khung tổng quan bài B21: [`public/videos/nuclear-lessons-v2/b21.jpg`](../../public/videos/nuclear-lessons-v2/b21.jpg)
- **Điểm nối sang Pha 1:** Dẫn trực tiếp vào câu hỏi dự đoán mở đầu của `B21Hero` và nhiệm vụ dự đoán góc lệch theo tham số va chạm $b$ tại `/hoc-lieu/truc-quan?bai=B21#khoi-dong`.

### Chi tiết 4 cảnh Bài 21

#### Cảnh 1 (`00:00 – 00:09` · `9 giây`)
- **Hình mở:** Cận màn quan sát tối (bề mặt màn huỳnh quang kẽm sunfua ZnS nhìn qua thị kính trong buồng thí nghiệm tối hoàn toàn, chưa có hiện tượng).
- **Hình kết:** Một đốm sáng xanh lục rất nhỏ xuất hiện ngắn ngủi trên màn quan sát tối rồi dịu dần, để lại ấn tượng thị giác rõ rệt.
- **Hành động:** Máy quay giữ tĩnh cận cảnh màn quan sát tối; tại giây thứ 2,5 xuất hiện đúng một đốm sáng lóe nhỏ sắc nét trên bề mặt màn rồi tắt tự nhiên, không có bất kì vệt sáng bay tới nào.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Một đốm sáng rất nhỏ trên màn đã giúp các nhà khoa học đặt lại câu hỏi: bên trong nguyên tử có gì?”
- **Nhãn hậu kì:** Không gắn nhãn `Mô hình giải thích` (đây là tái dựng hiện tượng quan sát trên màn ZnS); chỉ bật phụ đề `.vi.vtt`.
- **Ảnh tham chiếu:** [`public/illustrations/rutherford-v3-apparatus.png`](../../public/illustrations/rutherford-v3-apparatus.png) (vùng màn ZnS và thị kính).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 cinematic macro view inside a pitch-dark early 20th-century physics laboratory looking through a circular brass microscope field onto a dark zinc sulfide observation screen. Subtle grain, realistic glass optics vignette. After two seconds, a single tiny pinpoint emerald-green scintillation flash briefly appears on the dark screen and gently fades out. Strictly no glowing particle beams, no laser lines, no text, no letters, no numbers, no labels, no watermarks.
  ```

#### Cảnh 2 (`00:09 – 00:18` · `9 giây`)
- **Hình mở:** Toàn cảnh bộ thiết bị thí nghiệm tán xạ Geiger–Marsden – Rutherford đặt trên bàn đá phòng thí nghiệm, khớp đúng bố trí Rutherford V3 (buồng trụ chân không, bệ đồng, vòng chia độ và kính hiển vi xoay).
- **Hình kết:** Mặt cắt dọc (cutaway) lần lượt lộ rõ đường thẳng hàng từ hộp chì chứa nguồn alpha, qua tấm chắn khe chuẩn trực hẹp, tới lá vàng mỏng ở tâm buồng và vòng màn huỳnh quang ZnS bao quanh kèm kính hiển vi.
- **Hành động:** Toàn cảnh bộ thiết bị chuyển mượt sang hình cắt lớp lần từ nguồn qua khe hẹp, lá vàng tới màn quan sát, khớp bố trí Rutherford V3; tuyệt đối không dựng đường hạt phát sáng bay trong buồng.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Từ hộp nguồn qua khe hẹp, chùm hạt alpha hướng thẳng vô lá vàng cực mỏng ở giữa buồng chân không. Kính hiển vi xoay quanh vòng màn huỳnh quang để đếm từng chớp sáng ở mỗi góc lệch.”
- **Nhãn hậu kì:** Chồng nhãn chỉ dẫn sạch ở hậu kì (`Nguồn α`, `Khe chuẩn trực`, `Lá vàng`, `Màn ZnS`, `Kính hiển vi xoay`); chưa bật nhãn quỹ đạo vi mô.
- **Ảnh tham chiếu:** [`public/illustrations/rutherford-v3-apparatus.png`](../../public/illustrations/rutherford-v3-apparatus.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 scientific 3D architectural cutaway animation matching a historical Geiger-Marsden Rutherford scattering apparatus on a slate laboratory bench. Smoothly slice open the cylindrical brass-and-glass vacuum chamber to reveal in sequence from left to right: a lead source block, a narrow lead collimator plate, an ultra-thin vertical gold foil mounted in a central brass ring, a curved zinc sulfide detector ring, and a rotating brass microscope on a circular base. Physically accurate materials, clean studio lighting, no glowing beams flying in the chamber, no text, no letters, no numbers, no UI overlays, no watermarks.
  ```

#### Cảnh 3 (`00:18 – 00:28` · `10 giây`)
- **Hình mở:** Góc nhìn đo đạc trên vòng màn quan sát: nhiều lần ghi nhận đốm chớp xuất hiện dày gần hướng chùm tới, sau đó kính hiển vi xoay sang góc lệch lớn (> 90°) và ghi nhận một đốm chớp đơn lẻ rất hiếm.
- **Hình kết:** Chuyển cảnh sang sơ đồ phẳng 2D nền sáng của mô hình tán xạ Coulomb: nhiều đường đi xa tâm lệch rất ít, riêng đường đi sát tâm điện tích dương nhỏ bị uốn cong bật ngược góc lớn.
- **Hành động:** Nửa đầu cảnh chỉ thể hiện các đốm sáng ghi nhận trên màn (nhiều lần gần hướng chùm tới và một trường hợp hiếm ở góc lớn, không dựng đường hạt phát sáng bay trong buồng); ngay khoảnh khắc chuyển sang sơ đồ quỹ đạo ở `00:23.5`, bật cố định nhãn hậu kì **`Mô hình giải thích`**.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Hầu hết các lần ghi nhận đều nằm gần hướng chùm tới, nhưng lại xuất hiện một trường hợp rất hiếm ở góc lớn. Chuyển sang mô hình giải thích, phải có một tâm điện tích dương rất nhỏ mới đẩy hạt lệch mạnh như vậy.”
- **Nhãn hậu kì:** **`Mô hình giải thích`** (bắt buộc hiển thị rõ ở góc trên trái từ `00:23.5` đến `00:28.0` khi trình chiếu quỹ đạo).
- **Ảnh tham chiếu:** [`docs/previews/physics-process/b21-rutherford-1366.png`](../previews/physics-process/b21-rutherford-1366.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 two-part educational physics shot. Part 1 (first 5 seconds): overhead cutaway of the curved zinc sulfide detector ring in dim lab light showing frequent tiny green pinpoint flashes clustered near the forward direction, then the brass microscope pivots to a large backward angle where a single rare pinpoint flash appears on the ring—strictly no flying glowing trails inside the chamber. Part 2 (next 5 seconds): clean match-cut transition to a minimalist flat 2D educational diagram on a soft ivory-blue background showing parallel geometric trajectory lines passing a tiny central red sphere; distant lines bend slightly while one line passing very close curves sharply backward along a smooth hyperbola. No text, no letters, no numbers, no symbols, no watermarks.
  ```

#### Cảnh 4 (`00:28 – 00:36` · `8 giây`)
- **Hình mở:** Khung sơ đồ đối chiếu hai hình dung cấu trúc nguyên tử đặt cạnh nhau: bên trái là hình cầu lớn mờ đồng nhất, bên phải là không gian rỗng với một tâm đặc rất nhỏ ở chính giữa.
- **Hình kết:** Máy quay dừng tĩnh cân đối, giữ nhịp lắng 1,5 giây cuối để hiển thị câu hỏi dẫn sang hoạt động dự đoán Pha 1.
- **Hành động:** Chuyển mượt từ quỹ đạo lệch góc lớn sang khung so sánh hai mô hình và dừng ở câu hỏi mở đầu Pha 1, không tiết lộ lời giải.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Nếu điện tích dương trải đều trong nguyên tử, em có dự đoán được trường hợp lệch mạnh này không?”
- **Nhãn hậu kì:** Giữ nhãn **`Mô hình giải thích`** ở góc trên và hiển thị thẻ câu hỏi nối sang Pha 1 ở cuối cảnh.
- **Ảnh tham chiếu:** [`docs/previews/physics-process/b21-rutherford-1366.png`](../previews/physics-process/b21-rutherford-1366.png), [`public/illustrations/B21-diagram.png`](../../public/illustrations/B21-diagram.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 clean minimalist 2D scientific illustration on a calm light slate background comparing two conceptual spheres side by side: on the left, a large translucent soft-blue sphere with evenly diffused shading; on the right, a matching faint circular boundary that is mostly empty space with a tiny dense crimson core at the exact center and a single sharp hyperbolic deflection curve nearby. Gentle slow push-in coming to a clean still hold for reflection. No text, no letters, no numbers, no formulas, no watermarks.
  ```

---

## BÀI 22 · PHẢN ỨNG HẠT NHÂN VÀ NĂNG LƯỢNG LIÊN KẾT (38 giây · 16:9)

- **Chủ đề phim mở đầu:** *Vết rẽ nhánh trong buồng sương cho biết điều gì vừa xảy ra?*
- **Trạng thái hiện tại:** `Có kịch bản, prompt từng cảnh, ảnh tham chiếu & phụ đề .vi.vtt — chờ kết nối API/Flow để render clip`
- **Tổng thời lượng:** `38 giây` (4 cảnh)
- **Phụ đề đối chiếu:** [`public/videos/nuclear-openers/b22.vi.vtt`](../../public/videos/nuclear-openers/b22.vi.vtt)
- **Ảnh tham chiếu thực tế từ kho học liệu:**
  - Sơ đồ vết phân nhánh buồng sương B22: [`public/illustrations/B22-diagram.png`](../../public/illustrations/B22-diagram.png)
  - Mô phỏng độ hụt khối & đồ thị E_lkr / phân hạch B22: [`public/videos/nuclear-openers/refs/b22-binding-energy-sim.png`](../../public/videos/nuclear-openers/refs/b22-binding-energy-sim.png) và [`docs/previews/physics-process/b22-fission-1366.png`](../previews/physics-process/b22-fission-1366.png)
  - Khung tổng quan bài B22: [`public/videos/nuclear-lessons-v2/b22.jpg`](../../public/videos/nuclear-lessons-v2/b22.jpg)
- **Điểm nối sang Pha 1:** Dẫn trực tiếp vào nhiệm vụ nhận diện vết tới, điểm tương tác, hai vết đi ra và dự đoán hai hạt sau phân nhánh tại mục Pha 1 `b22-blackett-track` (`/hoc-lieu/truc-quan?bai=B22`).

### Chi tiết 4 cảnh Bài 22

#### Cảnh 1 (`00:00 – 00:09` · `9 giây`)
- **Hình mở:** Cận mặt kính tròn của buồng sương Wilson – Blackett trong phòng tối, chùm đèn bên hông chiếu ngang làm nổi bật lớp hơi quá bão hòa trên nền đen sâu.
- **Hình kết:** Giữa các vệt sương trắng song song xuất hiện một vệt rẽ nhánh hình chữ Y sắc nét (một nhánh mảnh kéo dài và một nhánh ngắn đậm hơn).
- **Hành động:** Hơi sương ngưng tụ tự nhiên thành các đường giọt mịn; máy quay lấy nét vào đúng giao điểm rẽ nhánh chữ Y (chỉ thể hiện giọt sương ngưng tụ thật, không vẽ quả cầu hạt nhân phát sáng trong buồng sương).
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Giữa hàng chục ngàn tấm ảnh chụp buồng sương chứa khí nitơ, một vệt sương tách nhánh hình chữ Y đã làm giới vật lí chú ý.”
- **Nhãn hậu kì:** Phụ đề `.vi.vtt` + chú thích nhỏ góc dưới `Tái dựng hiện tượng vệt buồng sương Blackett (1925)`.
- **Ảnh tham chiếu:** [`public/illustrations/B22-diagram.png`](../../public/illustrations/B22-diagram.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 macro top-down view through the circular glass window of a classic Wilson-Blackett cloud chamber illuminated from the side against a deep black background. Delicate white condensation mist trails form rapidly; almost all trails are straight parallel lines, except one prominent trail near the center that forks into an asymmetric Y-shape with one long thin mist branch and one short thick mist branch. Realistic vapor droplets, no glowing sci-fi orbs, no text, no letters, no numbers, no watermarks.
  ```

#### Cảnh 2 (`00:09 – 00:19` · `10 giây`)
- **Hình mở:** Toàn cảnh bộ buồng sương bằng đồng và kính cùng máy chụp ảnh lập thể gắn phía trên trong phòng thí nghiệm cổ điển.
- **Hình kết:** Cận cảnh tấm phim âm bản trên bàn soi phim làm nổi rõ tại đỉnh chữ Y vệt hạt alpha chấm dứt hẳn (không có nhánh thứ ba đi tiếp) và tách ra đúng hai nhánh bất đối xứng.
- **Hành động:** Máy quay hạ nhẹ từ cụm máy ảnh lập thể xuống mặt buồng sương rồi chuyển sang tấm ảnh trên bàn soi phim để học sinh quan sát rõ cấu trúc vết tới – điểm tương tác – hai vết đi ra mà chưa giải hộ tên hai hạt sản phẩm.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Vệt sương không phải hạt phát sáng, mà là chuỗi giọt lỏng ngưng tụ dọc đường ion hóa. Tại điểm va chạm, vệt hạt alpha bỗng biến mất rồi tách ra một nhánh mảnh rất dài và một nhánh ngắn đậm.”
- **Nhãn hậu kì:** Nhãn hậu kì chỉ vào 3 thành phần (`Vệt hạt α tới`, `Điểm tương tác — không còn nhánh thứ 3`, `Nhánh mảnh dài (?)` và `Nhánh ngắn đậm (?)`).
- **Ảnh tham chiếu:** [`public/illustrations/B22-diagram.png`](../../public/illustrations/B22-diagram.png), [`public/videos/nuclear-lessons-v2/b22.jpg`](../../public/videos/nuclear-lessons-v2/b22.jpg).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 realistic historical physics laboratory scene showing a brass-and-glass cloud chamber with a twin-lens stereoscopic camera mounted above it, then dissolving smoothly to a monochrome photographic glass plate resting on a warm backlit inspection table displaying the crisp asymmetric Y-shaped condensation track with zero forward continuation past the vertex. Authentic optical textures, no text, no letters, no numbers, no handwritten notes, no watermarks.
  ```

#### Cảnh 3 (`00:19 – 00:29` · `10 giây`)
- **Hình mở:** Sơ đồ 3D giáo dục sạch trên nền tối: bên trái là cụm hạt alpha (2 đỏ, 2 xanh) tiến vào cụm hạt nhân nitơ-14 (7 đỏ, 7 xanh) kèm nhãn hậu kì **`Mô hình giải thích`**.
- **Hình kết:** So sánh nhanh với sơ đồ tán xạ lá vàng Bài 21 ở góc phụ: ở Bài 21 hạt chỉ đổi hướng bay, còn ở đây hạt alpha nhập hẳn vào hạt nhân bia để biến đổi thành nguyên tố mới (tổng 18 nucleon, điện tích +9e bảo toàn).
- **Hành động:** Ngay đầu cảnh bật nhãn hậu kì **`Mô hình giải thích`**; minh họa sự khác biệt bản chất giữa tán xạ tĩnh điện (Bài 21) và phản ứng hạt nhân biến đổi nguyên tố (Bài 22).
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Trong mô hình giải thích, tổng số nucleon bằng 18 và tổng điện tích bằng 9 vẫn được bảo toàn trước và sau va chạm. Khác với tán xạ trên lá vàng chỉ đổi hướng bay, ở đây chính hạt nhân bia đã biến đổi thành nguyên tố mới.”
- **Nhãn hậu kì:** **`Mô hình giải thích`** + `Tổng A = 4 + 14 = 18 · Tổng Z = 2 + 7 = 9`.
- **Ảnh tham chiếu:** [`public/illustrations/B22-diagram.png`](../../public/illustrations/B22-diagram.png), [`docs/previews/physics-process/b22-fission-1366.png`](../previews/physics-process/b22-fission-1366.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 clean pedagogical 3D diagram on a dark navy slate background. A small cluster of 2 red and 2 blue matte spheres approaches and merges into a 7-red, 7-blue nuclear cluster at the center, then splits along an asymmetric Y-fork into a single fast red sphere moving up-right and a larger 17-sphere cluster recoiling down-right. Clean matte shading, non-photorealistic textbook convention, no glowing explosions, no text, no letters, no numbers, no formulas, no watermarks.
  ```

#### Cảnh 4 (`00:29 – 00:38` · `9 giây`)
- **Hình mở:** Sơ đồ chữ Y trên nền tối khớp với hình mở đầu Pha 1 của Bài 22, làm sáng nhẹ hai nhánh đi ra sau điểm tương tác.
- **Hình kết:** Dừng hình ổn định để hiển thị dấu hỏi hậu kì ở hai nhánh đi ra, dẫn thẳng sang hoạt động nhận diện vết và dự đoán phương trình ở Pha 1.
- **Hành động:** Hai nhánh đi ra sáng viền nhẹ lần lượt rồi giữ tĩnh 2 giây cuối cho học sinh suy nghĩ.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Vết rẽ nhánh chữ Y trong buồng sương cho biết điều gì vừa xảy ra, và hai nhánh đi ra là hai hạt nào?”
- **Nhãn hậu kì:** Giữ nhãn **`Mô hình giải thích`** + `⁴₂He + ¹⁴₇N → [Nhánh ngắn đậm: ?] + [Nhánh mảnh dài: ?]`.
- **Ảnh tham chiếu:** [`public/illustrations/B22-diagram.png`](../../public/illustrations/B22-diagram.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 minimalist 2D scientific diagram on a calm dark navy background showing one horizontal cyan incoming line terminating at a central vertex and splitting into a long thin amber upper-right line and a short thick coral lower-right line, gently highlighting both outgoing branches before holding still for student prediction. No text, no letters, no numbers, no watermarks.
  ```

---

## BÀI 23 · HIỆN TƯỢNG PHÓNG XẠ (38 giây · 16:9)

- **Chủ đề phim mở đầu:** *Vì sao cùng một đầu dò, cùng 5 giây, số xung lại có thể khác nhau?*
- **Trạng thái hiện tại:** `Có kịch bản, prompt từng cảnh, ảnh tham chiếu & phụ đề .vi.vtt — chờ kết nối API/Flow để render clip`
- **Tổng thời lượng:** `38 giây` (4 cảnh)
- **Phụ đề đối chiếu:** [`public/videos/nuclear-openers/b23.vi.vtt`](../../public/videos/nuclear-openers/b23.vi.vtt)
- **Ảnh tham chiếu thực tế từ kho học liệu:**
  - Mô phỏng quá trình phân rã 3 biểu diễn B23: [`public/videos/nuclear-openers/refs/b23-decay-halflife-sim.png`](../../public/videos/nuclear-openers/refs/b23-decay-halflife-sim.png) và [`docs/previews/physics-process/b23-process-1366.png`](../previews/physics-process/b23-process-1366.png)
  - Sơ đồ B23: [`public/illustrations/B23-diagram.png`](../../public/illustrations/B23-diagram.png)
  - Khung tổng quan bài B23: [`public/videos/nuclear-lessons-v2/b23.jpg`](../../public/videos/nuclear-lessons-v2/b23.jpg)
- **Điểm nối sang Pha 1:** Dẫn trực tiếp vào bảng số liệu **Bảng 23.1 SGK (`1, 3, 2, 0, 3, 1` xung mỗi 5 giây)** và hoạt động bấm đếm xung 5 giây của học sinh tại mục Pha 1 `b23-cloud-geiger` (`/hoc-lieu/truc-quan?bai=B23`).

### Chi tiết 4 cảnh Bài 23

#### Cảnh 1 (`00:00 – 00:09` · `9 giây`)
- **Hình mở:** Bàn thí nghiệm tối: một mẫu khoáng vật chứa uranium đặt yên trong khay chì hướng vào cửa sổ buồng sương lạnh, hoàn toàn không bị đốt nóng hay tác động ngoài.
- **Hình kết:** Bên trong lớp hơi quá bão hòa của buồng sương xuất hiện rải rác ở những thời điểm bất kì vài vệt sương ngắn dày và vài vệt mảnh gấp khúc.
- **Hành động:** Không dựng hào quang phát sáng giả quanh mẫu; chỉ có các vệt sương ngưng tụ xuất hiện bất chợt theo thời gian ngẫu nhiên.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Một mẫu phóng xạ nằm yên trên bàn không hề bị đốt nóng, vậy mà các vệt ion hóa trong buồng sương vẫn tự phát xuất hiện.”
- **Nhãn hậu kì:** Phụ đề `.vi.vtt` + `Hiện tượng tự phát · Vết sương ion hóa (Hình 23.1 SGK)`.
- **Ảnh tham chiếu:** [`public/illustrations/B23-diagram.png`](../../public/illustrations/B23-diagram.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 close-up physics laboratory shot on a dark slate bench. A small untouched mineral sample in a matte gray lead cup sits beside a glass-topped cloud chamber. At irregular unpredictable moments inside the dark chamber mist, a few short thick straight vapor tracks and thin zig-zagging vapor tracks condense and slowly fade. Zero artificial radioactive glow, no flying laser beams, no text, no letters, no numbers, no watermarks.
  ```

#### Cảnh 2 (`00:09 – 00:19` · `10 giây`)
- **Hình mở:** Bộ thí nghiệm ống đếm Geiger–Müller (khớp Hình 23.2 SGK tr. 105): nguồn phóng xạ kẹp cố định trước đầu thu ống đếm nối sang bộ chuyển đổi tín hiệu, loa xung và màn hình (để trống phần chữ số để ghép hậu kì chuẩn xác).
- **Hình kết:** Đèn báo xung chớp không đều; lớp hậu kì hiện chính xác **6 khoảng 5 giây liên tiếp của Bảng 23.1 SGK**: `0–5 s: 1`, `5–10 s: 3`, `10–15 s: 2`, `15–20 s: 0`, `20–25 s: 3`, `25–30 s: 1`.
- **Hành động:** Giữ cố định đầu dò và khoảng cách; đèn chỉ thị nháy đúng nhịp ngẫu nhiên của 6 cửa sổ 5 giây, không dựng tia sáng bay trong không khí.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Để đếm chính xác, ta giữ cố định đầu dò Geiger cạnh mẫu và ghi số xung trong từng khoảng 5 giây bằng nhau. Theo Bảng 23.1 SGK, sáu khoảng 5 giây liên tiếp lần lượt ghi nhận 1, 3, 2, 0, 3 rồi 1 xung.”
- **Nhãn hậu kì:** Bảng hậu kì gắn nhãn rõ **`Dữ liệu SGK — Bảng 23.1 (tr. 105): 1 · 3 · 2 · 0 · 3 · 1 xung / 5 s`**.
- **Ảnh tham chiếu:** [`docs/previews/sgk-alignment/truc-quan-b23-1366.png`](../previews/sgk-alignment/truc-quan-b23-1366.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 clean modern school physics bench shot showing a clamped gray source holder facing a cylindrical metallic Geiger-Muller probe at a fixed distance, connected by coaxial cable to a dark-bezel counter unit whose small emerald LED indicator blinks at irregular stochastic intervals, with clean dark negative space on the left for post-production table overlay. Empty air between source and probe, no visible rays, no text, no letters, no numbers on the screen, no watermarks.
  ```

#### Cảnh 3 (`00:19 – 00:29` · `10 giây`)
- **Hình mở:** Sơ đồ 2D sạch khớp [`docs/previews/physics-process/b23-process-1366.png`](../previews/physics-process/b23-process-1366.png): mảng các chấm tròn hạt nhân mẹ đổi màu ngẫu nhiên ở từng chấm đơn lẻ, nhưng đường cong quần thể bên cạnh lại hạ đều theo hàm mũ.
- **Hình kết:** Làm nổi bật cửa sổ `15–20 s` không có chấm nào đổi màu (`0 xung`), ngay sau đó cửa sổ `20–25 s` lại có 3 chấm phân rã.
- **Hành động:** Bật cố định nhãn hậu kì **`Mô hình giải thích`** ngay từ `00:19.0`; liên kết tính ngẫu nhiên của từng hạt nhân đơn lẻ với xu thế giảm có quy luật của cả mẫu lớn.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Trên mô hình giải thích, ta không biết hạt nhân nào phân rã ở giây kế tiếp, nhưng cả mẫu lớn lại giảm theo quy luật. Ngay cả khoảng từ 15 đến 20 giây có 0 xung cũng hoàn toàn tự nhiên chứ không phải đầu dò bị hỏng.”
- **Nhãn hậu kì:** **`Mô hình giải thích`** + chú thích `Khoảng 15–20 s: 0 xung (ngẫu nhiên tự nhiên)`.
- **Ảnh tham chiếu:** [`docs/previews/physics-process/b23-process-1366.png`](../previews/physics-process/b23-process-1366.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 clean flat 2D educational infographic animation on a dark slate-navy canvas divided into two panels: on the left, a grid of glowing cyan dots where individual dots randomly switch to dim gray at unpredictable times including a brief 5-second pause with zero switches; on the right, a smooth downward exponential curve tracking the overall population trend. Crisp vector geometry, no text, no letters, no numbers, no watermarks.
  ```

#### Cảnh 4 (`00:29 – 00:38` · `9 giây`)
- **Hình mở & Hình kết:** Quay lại khung đầu dò Geiger–Müller sẵn sàng cho khoảng 5 giây tiếp theo với ô hậu kì `Khoảng 5 giây tiếp theo của em: ? xung`, dừng tĩnh dẫn thẳng sang Pha 1.
- **Hành động:** Khung hình giữ tĩnh cân đối trong 2 giây cuối cho câu hỏi dự đoán.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Vì sao cùng một đầu dò, cùng khoảng 5 giây mà số xung lại khác nhau như vậy? Em hãy dự đoán ở Pha 1 nhé.”
- **Nhãn hậu kì:** Thẻ câu hỏi dẫn thẳng sang hoạt động đếm 5 giây và đối chiếu Bảng 23.1 ở Pha 1.
- **Ảnh tham chiếu:** [`docs/previews/physics-process/b23-process-1366.png`](../previews/physics-process/b23-process-1366.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 steady medium close-up of the cylindrical Geiger-Muller radiation probe and dark counter box on a calm dark physics bench, soft studio rim light, holding steady in a clean contemplative frame for student prediction. Strictly no visible rays, no text, no letters, no numbers, no watermarks.
  ```

---

## BÀI 24 · CÔNG NGHIỆP HẠT NHÂN (38 giây · 16:9)

- **Chủ đề phim mở đầu:** *Năng lượng đi qua những bộ phận nào trước khi thành điện năng?*
- **Trạng thái hiện tại:** `Có kịch bản, prompt từng cảnh, ảnh tham chiếu & phụ đề .vi.vtt — chờ kết nối API/Flow để render clip`
- **Tổng thời lượng:** `38 giây` (4 cảnh)
- **Phụ đề đối chiếu:** [`public/videos/nuclear-openers/b24.vi.vtt`](../../public/videos/nuclear-openers/b24.vi.vtt)
- **Ảnh tham chiếu thực tế từ kho học liệu:**
  - Sơ đồ lò phản ứng nước áp lực B24: [`public/videos/nuclear-openers/refs/b24-reactor-control-sim.png`](../../public/videos/nuclear-openers/refs/b24-reactor-control-sim.png) và [`docs/previews/physics-process/b24-reactor-1366.png`](../previews/physics-process/b24-reactor-1366.png)
  - Sơ đồ truyền năng lượng B24: [`public/illustrations/B24-diagram.png`](../../public/illustrations/B24-diagram.png)
  - Khung tổng quan bài B24: [`public/videos/nuclear-lessons-v2/b24.jpg`](../../public/videos/nuclear-lessons-v2/b24.jpg)
- **Điểm nối sang Pha 1:** Dẫn trực tiếp vào câu hỏi mở đầu *“Bộ phận nào thực sự làm quay tua-bin?”* và thao tác lần theo đường truyền năng lượng qua 3 chu trình của Hình 24.1 SGK tại mục Pha 1 `b24-energy-chain` (`/hoc-lieu/truc-quan?bai=B24`).

### Chi tiết 4 cảnh Bài 24

#### Cảnh 1 (`00:00 – 00:09` · `9 giây`)
- **Hình mở:** Toàn cảnh bên ngoài tổ hợp nhà máy điện hạt nhân hiện đại ven biển vào buổi chiều tà với đường dây truyền tải điện sáng đèn nối về đô thị.
- **Hình kết:** Máy quay tiến lại gần khối nhà vòm bê tông bảo vệ lò phản ứng nằm cạnh gian máy tua-bin – máy phát điện.
- **Hành động:** Chuyển động máy quay êm ái từ lưới điện bên ngoài về phía tổ hợp nhà vòm và gian máy phát để đặt vấn đề về hành trình biến đổi năng lượng.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Nguồn điện ổn định cho cả khu đô thị có thể bắt đầu từ phản ứng phân hạch được kiểm soát bên trong vòm lò.”
- **Nhãn hậu kì:** Phụ đề `.vi.vtt` + `Nhà máy điện hạt nhân kiểu lò nước áp lực (Hình 24.1 SGK)`.
- **Ảnh tham chiếu:** [`public/illustrations/B24-diagram.png`](../../public/illustrations/B24-diagram.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 realistic architectural wide shot of a modern coastal pressurized-water nuclear power facility at clear twilight featuring a cylindrical reinforced-concrete containment dome adjacent to a turbine generator hall and high-voltage power lines leading toward warm city lights. Clean engineering realism, no glowing green waste, no text, no letters, no numbers, no watermarks.
  ```

#### Cảnh 2 (`00:09 – 00:19` · `10 giây`)
- **Hình mở:** Mặt cắt dọc sơ đồ kỹ thuật của hệ thống nhà máy điện hạt nhân theo Hình 24.1 SGK (khớp [`docs/previews/physics-process/b24-reactor-1366.png`](../previews/physics-process/b24-reactor-1366.png)).
- **Hình kết:** Làm nổi rõ **chu trình thứ nhất** (màu cam ấm) tuần hoàn khép kín từ lò phản ứng qua dàn ống trao đổi nhiệt trong bộ phận sinh hơi rồi bơm về lò; bên ngoài ống ở **chu trình thứ hai**, nước sạch hóa thành hơi áp suất cao dẫn sang gian máy.
- **Hành động:** Bật nhãn **`Mô hình giải thích`**; máy quay lần theo đường truyền nhiệt qua vách ống bộ phận sinh hơi mà hai dòng lưu chất không hề trộn lẫn.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Nhiệt từ vùng tâm lò theo dòng tải nhiệt chu trình thứ nhất đi qua ống kín bên trong bộ phận sinh hơi rồi quay lại lò. Ở chu trình thứ hai tách biệt bên ngoài ống, nước sạch nhận nhiệt hóa thành hơi áp suất cao rồi đi tiếp sang gian máy.”
- **Nhãn hậu kì:** **`Mô hình giải thích`** + nhãn `Chu trình 1 (tải nhiệt kín)`, `Bộ phận sinh hơi`, `Chu trình 2 (hơi áp suất cao)`.
- **Ảnh tham chiếu:** [`docs/previews/physics-process/b24-reactor-1366.png`](../previews/physics-process/b24-reactor-1366.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 clean 3D cutaway engineering diagram of a pressurized water reactor power cycle on a dark slate background. Inside the containment dome, a sealed warm-amber primary coolant loop circulates from the reactor core through U-tubes inside a vertical steam generator and pumps back to the reactor without mixing. Outside the U-tubes, separate blue secondary water boils into bright white high-pressure steam flowing toward the turbine hall. No text, no letters, no numbers, no watermarks.
  ```

#### Cảnh 3 (`00:19 – 00:29` · `10 giây`)
- **Hình mở:** Luồng hơi nước ở gian máy đi qua cánh tua-bin nối đồng trục với máy phát điện, sau đó đi xuống bộ ngưng tụ hơi ở phía dưới.
- **Hình kết:** Đường nước làm mát thứ ba từ sông/biển đi qua bộ ngưng tụ hơi giúp hơi ngưng tụ thành nước lỏng rồi bơm quay về bộ phận sinh hơi, khép kín toàn bộ ba vòng lưu chất của Hình 24.1 SGK.
- **Hành động:** Trình bày trọn vẹn cả 3 vòng tuần hoàn/làm mát trên cùng mặt cắt kỹ thuật.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Trên mô hình giải thích, hơi sau khi sinh công được nước làm mát từ sông hoặc biển ngưng tụ thành nước để khép kín vòng tuần hoàn. Nhờ tách kín các chu trình, phần tua-bin và máy phát điện bên ngoài được giữ an toàn trước chất phóng xạ.”
- **Nhãn hậu kì:** **`Mô hình giải thích`** + nhãn `Bộ ngưng tụ hơi`, `Nước làm mát (sông, hồ, biển)`.
- **Ảnh tham chiếu:** [`public/illustrations/B24-diagram.png`](../../public/illustrations/B24-diagram.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 continuation of the clean 3D power-plant cutaway showing the white steam spinning a silver multi-stage turbine coupled by a shaft to an electrical generator, then exhausting downward into a condenser cooled by a separate teal-green cooling-water pipe loop from the coast, condensing back into blue liquid water pumped to the steam generator. Clean educational engineering style, no text, no letters, no numbers, no watermarks.
  ```

#### Cảnh 4 (`00:29 – 00:38` · `9 giây`)
- **Hình mở & Hình kết:** Toàn cảnh sơ đồ mặt cắt 3 vòng lưu chất dừng tĩnh rõ nét, làm sáng vùng nối từ bộ phận sinh hơi sang cánh tua-bin để đặt câu hỏi mở đầu Pha 1.
- **Hành động:** Dòng chảy chậm lại và giữ khung hình ổn định trong 2 giây cuối.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Năng lượng đã đi qua những bộ phận nào trước khi thành điện năng, và bộ phận nào thực sự làm quay tua-bin?”
- **Nhãn hậu kì:** Giữ nhãn **`Mô hình giải thích`** + câu hỏi chuyển thẳng sang Pha 1 (`b24-energy-chain`).
- **Ảnh tham chiếu:** [`docs/previews/physics-process/b24-reactor-1366.png`](../previews/physics-process/b24-reactor-1366.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 wide clean 3D schematic overview of the complete three-loop pressurized water nuclear power station cutaway on a dark slate background, gently highlighting the pathway from reactor vessel to steam generator, turbine, and generator before holding steady in a calm frame for student inquiry. No text, no letters, no numbers, no watermarks.
  ```

---

## BÀI 25 · BÀI TẬP VỀ VẬT LÍ HẠT NHÂN (37 giây · 16:9)

- **Chủ đề phim mở đầu:** *Từ tám cặp số liệu đo, làm sao ước lượng chu kì bán rã?*
- **Trạng thái hiện tại:** `Có kịch bản, prompt từng cảnh, ảnh tham chiếu & phụ đề .vi.vtt — chờ kết nối API/Flow để render clip`
- **Tổng thời lượng:** `37 giây` (4 cảnh)
- **Phụ đề đối chiếu:** [`public/videos/nuclear-openers/b25.vi.vtt`](../../public/videos/nuclear-openers/b25.vi.vtt)
- **Ảnh tham chiếu thực tế từ kho học liệu:**
  - Phòng xử lí đồ thị Bảng 25.1 SGK: [`public/videos/nuclear-openers/refs/b25-decay-table-sim.png`](../../public/videos/nuclear-openers/refs/b25-decay-table-sim.png) và [`docs/previews/physics-process/b25-process-1366.png`](../previews/physics-process/b25-process-1366.png)
  - Sơ đồ Bài 25: [`public/illustrations/B25-diagram.png`](../../public/illustrations/B25-diagram.png)
  - Khung tổng quan bài B25: [`public/videos/nuclear-lessons-v2/b25.jpg`](../../public/videos/nuclear-lessons-v2/b25.jpg)
- **Điểm nối sang Pha 1:** Kết nối trực tiếp hiện tượng tĩnh điện kế phóng điện (Hình 25.1 SGK tr. 119) và nhiệm vụ ước lượng chu kì bán rã từ **8 cặp số liệu Bảng 25.1 SGK tr. 121** tại `/hoc-lieu/truc-quan?bai=B25`.

### Chi tiết 4 cảnh Bài 25

#### Cảnh 1 (`00:00 – 00:09` · `9 giây`)
- **Hình mở:** Bàn thí nghiệm vật lí tối sạch: chiếc **tĩnh điện kế kim xoay** (khớp Hình 25.1 SGK tr. 119) đang tích điện với kim chỉ lệch một góc lớn; một giá kẹp đưa mẫu phóng xạ lại gần đầu thu điện mà không chạm vào.
- **Hình kết:** Kim tĩnh điện kế giảm góc lệch nhanh về vạch không rồi đứng yên tại đó (không lệch ngược trở lại), không có bất kì tia sáng giả nào trong không khí.
- **Hành động:** Tái dựng trung thực hiện tượng định tính mở đầu Bài 25 trước khi chuyển sang bảng số liệu định lượng.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Khi đưa mẫu phóng xạ lại gần tĩnh điện kế đang tích điện, kim điện kế giảm lệch rất nhanh về không dù chưa hề chạm vào.”
- **Nhãn hậu kì:** Phụ đề `.vi.vtt` + nhãn `(1) Mẫu phóng xạ · (2) Đầu thu điện · (3) Kim điện kế giảm về 0 (Hình 25.1 SGK)`.
- **Ảnh tham chiếu:** [`public/illustrations/B25-diagram.png`](../../public/illustrations/B25-diagram.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 studio physics demonstration on a dark laboratory bench showing a classic dial pointer electroscope with a top brass collector plate and a circular housing whose internal metal pointer starts deflected at 45 degrees. A mechanical clamp brings a small matte-gray cylindrical sample holder near the top plate without touching it; the air gap stays completely clear with zero sparks or glowing rays while the pointer smoothly rotates down to zero and stops. No text, no letters, no numbers, no watermarks.
  ```

#### Cảnh 2 (`00:09 – 00:18.5` · `9,5 giây`)
- **Hình mở:** Chuyển sang mặt phẳng tọa độ 2D sạch khớp [`docs/previews/physics-process/b25-process-1366.png`](../previews/physics-process/b25-process-1366.png), bên cạnh là bảng hậu kì hiện đúng **8 cặp `(t, H)` của Bảng 25.1 SGK tr. 121**: `(0; 151), (30; 85), (60; 55), (120; 31), (180; 22), (240; 15), (300; 11), (360; 9)`.
- **Hình kết:** Tám chấm tròn dữ liệu thực nghiệm hiện tuần tự từ trái sang phải trên đồ thị, giữ nguyên vị trí đo thực nghiệm mà chưa nối đường cong.
- **Hành động:** Chấm tuần tự đủ 8 điểm đo theo thời gian; làm rõ sự tản mạn thống kê tự nhiên của dữ liệu thực nghiệm.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Sang phép đo định lượng ở Bảng 25.1 SGK, ta có đúng tám cặp thời gian và độ phóng xạ giảm từ 151 Bq xuống 9 Bq. Tám chấm đo thực nghiệm hạ dần theo thời gian nhưng vẫn có độ tản mạn tự nhiên quanh xu hướng giảm.”
- **Nhãn hậu kì:** Nhãn trục chuẩn ở hậu kì (`Độ phóng xạ H (Bq)`, `Thời gian t (s)`) + bảng `Bảng 25.1 SGK (8 cặp số đo gốc)`.
- **Ảnh tham chiếu:** [`docs/previews/physics-process/b25-process-1366.png`](../previews/physics-process/b25-process-1366.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 clean minimalist 2D data chart animation on a dark slate-navy grid with crisp white perpendicular axes. Eight distinct warm-amber circular data points appear sequentially from upper-left down toward lower-right following a realistic experimental decay scatter without any connecting curve yet. Crisp flat scientific design, no text, no letters, no numbers, no watermarks.
  ```

#### Cảnh 3 (`00:18.5 – 00:28.5` · `10 giây`)
- **Hình mở:** Trên cùng hệ trục giữ nguyên 8 chấm đo gốc, bật nhãn hậu kì **`Mô hình giải thích`** và vẽ đường gióng ngang nét đứt tại đúng nửa độ cao ban đầu (`H₀/2 = 75,5 Bq`).
- **Hình kết:** Đường gióng ngang đi qua khoảng nằm giữa chấm thứ hai (`30 s; 85 Bq`) và chấm thứ ba (`60 s; 55 Bq`), kèm đường cong hàm mũ lí thuyết nét mảnh đối chiếu.
- **Hành động:** Giữ cố định 8 điểm đo thực nghiệm, chỉ chồng thêm đường gióng mức nửa và đường cong mô hình ở tầng giải thích.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Trên mô hình giải thích, ta giữ nguyên tám số đo gốc và gióng mức một nửa hoạt độ ban đầu là 75,5 Bq ngang qua đồ thị. Đường gióng cắt ngay khoảng kẹp giữa hai mốc đo thực nghiệm liền kề trên trục thời gian.”
- **Nhãn hậu kì:** **`Mô hình giải thích`** + `Mức nửa ban đầu: H₀ / 2 = 75,5 Bq` kẹp giữa `(30 s; 85 Bq)` và `(60 s; 55 Bq)`.
- **Ảnh tham chiếu:** [`docs/previews/physics-process/b25-process-1366.png`](../previews/physics-process/b25-process-1366.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 clean 2D scientific graph animation continuing on the dark slate-navy grid with the exact same eight stationary amber data dots. A bright cyan smooth exponential reference curve draws gently beside the scatter while a horizontal gold dashed line at exact half-height glides across to intersect cleanly between the second and third data dots. No text, no letters, no numbers, no formulas, no watermarks.
  ```

#### Cảnh 4 (`00:28.5 – 00:37` · `8,5 giây`)
- **Hình mở & Hình kết:** Cận vùng giao cắt giữa đường gióng `75,5 Bq` với hai vạch gióng thẳng đứng hạ xuống khoảng giữa chấm thứ hai và chấm thứ ba trên trục thời gian, dừng tĩnh để đặt câu hỏi dẫn vào Pha 1.
- **Hành động:** Hai vạch gióng hạ xuống trục hoành rồi dừng tĩnh 2 giây cuối cho học sinh tự ước lượng chu kì bán rã.
- **Lời thoại tiếng Việt miền Nam tự nhiên:**
  > “Từ tám cặp số liệu đo trong Bảng 25.1, làm sao em ước lượng được chu kì bán rã của mẫu? Mình bắt đầu ở Pha 1 nghen.”
- **Nhãn hậu kì:** Giữ nhãn **`Mô hình giải thích`** + thẻ câu hỏi dẫn thẳng sang Pha 1 Bài 25.
- **Ảnh tham chiếu:** [`docs/previews/physics-process/b25-process-1366.png`](../previews/physics-process/b25-process-1366.png).
- **Prompt tiếng Anh (Flow / Veo / Gemini Omni — không vẽ chữ AI):**
  ```text
  16:9 close-up minimalist 2D chart view on dark slate-navy focusing on the half-height gold dashed line passing between the second and third amber data points, as two subtle vertical guide lines drop down to bracket the interval on the horizontal axis and hold in a clean still frame. Crisp vector aesthetic, no text, no letters, no numbers, no watermarks.
  ```

---

## Bảng tổng hợp kiểm tra bàn giao tiền kì 5 video mở đầu

| Mã bài | Thời lượng | Số cảnh | Phụ đề `.vi.vtt` | Lời đọc miền Nam (`.json`) | Trạng thái hiện tại |
| --- | --- | --- | --- | --- | --- |
| **B21** | 36 giây | 4 cảnh | `public/videos/nuclear-openers/b21.vi.vtt` | `openers-narration.vi.json` (`lessons.B21`) | Có kịch bản, prompt từng cảnh, ảnh tham chiếu & phụ đề `.vi.vtt` — chờ kết nối API/Flow để render clip |
| **B22** | 38 giây | 4 cảnh | `public/videos/nuclear-openers/b22.vi.vtt` | `openers-narration.vi.json` (`lessons.B22`) | Có kịch bản, prompt từng cảnh, ảnh tham chiếu & phụ đề `.vi.vtt` — chờ kết nối API/Flow để render clip |
| **B23** | 38 giây | 4 cảnh | `public/videos/nuclear-openers/b23.vi.vtt` | `openers-narration.vi.json` (`lessons.B23`) | Có kịch bản, prompt từng cảnh, ảnh tham chiếu & phụ đề `.vi.vtt` — chờ kết nối API/Flow để render clip |
| **B24** | 38 giây | 4 cảnh | `public/videos/nuclear-openers/b24.vi.vtt` | `openers-narration.vi.json` (`lessons.B24`) | Có kịch bản, prompt từng cảnh, ảnh tham chiếu & phụ đề `.vi.vtt` — chờ kết nối API/Flow để render clip |
| **B25** | 36 giây | 4 cảnh | `public/videos/nuclear-openers/b25.vi.vtt` | `openers-narration.vi.json` (`lessons.B25`) | Có kịch bản, prompt từng cảnh, ảnh tham chiếu & phụ đề `.vi.vtt` — chờ kết nối API/Flow để render clip |
