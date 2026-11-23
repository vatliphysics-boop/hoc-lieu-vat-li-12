# Khảo sát nguồn mở cho mô phỏng và hoạt động khám phá

Ngày khảo sát: 13/11/2026. Mã băm là commit đầu nhánh mặc định được GitHub API trả về khi khảo sát, không phải khẳng định phiên bản phát hành ổn định. Đã xem README, danh sách gốc và tài liệu kiến trúc/giấy phép khi công khai. Đây là khảo sát thiết kế, không phải kiểm toán từng dòng mã, kiểm thử tương thích hay ý kiến pháp lý. Dự án hiện tại dùng Next 16.3.5, React 19.2, Three ^0.186.1; chưa cài React Three Fiber, Drei, XState hoặc xAPI. Không có mã nào từ các kho bên dưới được sao chép trong khảo sát này.

## Khuyến nghị có thể áp dụng ngay

- **Particle Lab:** kế thừa ý tưởng chia physics thuần, state, renderer, UI; các điều kiện hoàn thành dựa trên telemetry; seed và kịch bản có thể tái lập. Không lấy hệ phương trình khí hay hấp dẫn để đại diện phân rã hạt nhân. Tính tương thích thư viện là có triển vọng, không có nghĩa có thể đưa nguyên Vite app vào Next.
- **PhET:** tham khảo thiết kế cho phép dự đoán, thay tham số, so sánh dữ liệu và giải thích; điều kiện sư phạm cần tự xây dựng trên nội dung SGK dự án. Các nhánh mặc định được khảo sát không còn đầy đủ mã công khai, vì vậy không thể thẩm định thuật toán hay quyền tái sử dụng mã từ bản đầu nhánh.
- **Three.js:** giữ thư viện đã cài; chỉ thêm Fiber/Drei nếu lợi ích đo được lớn hơn chi phí tích hợp. Không giả định WebGPU hoạt động trên mọi máy.
- **xAPI:** chỉ là chuẩn/một thư viện truyền statement, không tự tạo đồng ý, ẩn danh, phân quyền hoặc đảm bảo chất lượng nghiên cứu. Không đưa khóa LRS vào client; cần chính sách lưu trữ và cơ chế đồng ý được cơ quan nghiên cứu phê duyệt trước khi thu thập thật.

## Mười hai kho

### 1. [Particle Lab](https://github.com/PouyanJay/particlesimulator/tree/5a88a4e6c410) — `5a88a4e6c410`, MIT

README mô tả React 19, Three 0.184, R3F 9, Zustand/XState và Vite; thư mục `src`, `docs`, tests. [Tài liệu kiến trúc](https://github.com/PouyanJay/particlesimulator/blob/5a88a4e6c410/docs/architecture.md) chia sim-core thuần TypeScript, state, render và UI; mô hình theo hợp đồng plugin, bước thời gian cố định, seed, biểu đồ và thử thách dựa telemetry. Render dùng instancing, WebGPU và fallback WebGL2 theo README; worker là lựa chọn. Không phải mô phỏng phân rã; mọi khẳng định hiệu năng/test ở đây là mô tả của tác giả, chưa tự chạy. MIT cho phép tái sử dụng theo điều kiện giữ thông báo bản quyền và giấy phép nếu thực sự sao chép. Nên mượn thiết kế, tránh nhập toàn bộ hệ thống build/state chưa cần.

### 2. [Promethean](https://github.com/AnonymousSingh-007/Promethean/tree/925c3b50de1e) — `925c3b50de1e`, MIT

Vite, Three/WebGL; `src/core`, `physics`, `vfx`, `ui`; mô phỏng chuỗi phân hạch với bàn phím hoặc camera, `InstancedMesh`. README phân biệt các tiết diện có nguồn với giả thiết tiết diện tán xạ ~12 barn và điều khiển lò giản lược. Đây là minh họa có giả thiết, không thể coi như mô hình lò được thẩm định hoặc mô hình bán rã. Mô hình Bohr, bloom và webcam không đáp ứng tự thân yêu cầu biểu diễn hạt nhân chính xác và tiếp cận. Ý tưởng cần xét: tách physics/render, reset đầy đủ, điều khiển không phụ thuộc webcam. MIT yêu cầu giữ bản quyền và giấy phép khi sao chép.

### 3. [three.js](https://github.com/mrdoob/three.js/tree/acf77e4c7ea4) — `acf77e4c7ea4`, MIT

`src`, `examples`, `docs`, `manual`, `test`; thư viện đồ họa scene/camera/geometry/material/renderer, không phải physics engine. Dự án đã dùng Three; `InstancedMesh`, raycasting và OrbitControls có thể hỗ trợ mô hình nhiều hạt, chọn và camera. Đối chiếu API theo đúng phiên bản cài đặt 0.186, không coi commit dev này là phiên bản cài đặt. MIT nếu sao chép mã/ví dụ.

### 4. [React Three Fiber](https://github.com/pmndrs/react-three-fiber/tree/d74622ea8ed7) — `d74622ea8ed7`, MIT

`packages`, `docs`, `example`; React renderer cho Three chứ không chứa mô hình vật lý. README ghi Fiber 9 đi với React 19; đây là tương thích theo major, vẫn cần kiểm tra peer dependency Three, SSR/client boundary và build thực tế trước khi thêm. Có thể giữ Three trực tiếp để không tăng dependency. MIT áp dụng khi dùng mã.

### 5. [Drei](https://github.com/pmndrs/drei/tree/bf6f4addf474) — `bf6f4addf474`, MIT

`src`, `docs`, `test/e2e`: các helper cho Fiber như camera và controls, không phải engine vật lý. Chỉ có ý nghĩa nếu đã chọn Fiber; kiểm tra peer dependencies và hiệu năng trên phiên bản khóa thực tế. MIT áp dụng khi dùng mã.

### 6. [PhET shred](https://github.com/phetsims/shred/tree/4f3f2f783adf) — `4f3f2f783adf`, giấy phép tại commit này chưa xác minh

Ở commit đầu nhánh hiện tại API chỉ thấy `README.md`; mô tả đây là thư viện dùng chung cho mô phỏng nguyên tử và hạt nhân. Không thể kiểm tra mã, cấu trúc renderer hay physics tại commit này. Các chỉ mục cũ có thể hiện GPL-3.0, nhưng không suy ra giấy phép hiện tại hoặc tài sản ở phiên bản khác; cần kiểm tra đúng commit/từng tài sản nếu định lấy mã. Phương án an toàn ở đây là chỉ tham khảo ý tưởng.

### 7. [PhET alpha-decay](https://github.com/phetsims/alpha-decay/tree/4156ccfa823d) — `4156ccfa823d`, giấy phép tại commit này chưa xác minh

Nhánh hiện tại có README và `doc`; README nói kho không còn được duy trì và monorepo chưa công khai. Chủ đề trực tiếp liên quan phân rã alpha, nhưng không có đủ mã hiện hành để kiểm tra công thức, trình quản lý state hay tương thích Next. Tham khảo hoạt động quan sát phân rã ngẫu nhiên, không sao chép hoặc tuyên bố mô hình của mình tương đương PhET.

### 8. [PhET build-a-nucleus](https://github.com/phetsims/build-a-nucleus/tree/ca6a5cf9c603) — `ca6a5cf9c603`, giấy phép tại commit này chưa xác minh

README và `doc`; README thông báo kho cũ không được duy trì và monorepo chưa công khai. Hữu ích về ý tưởng chủ động xây hạt nhân và phân biệt proton/neutron; không đủ mã hiện hành để đánh giá scene, physics hay dùng lại trực tiếp. Cần kiểm tra đúng giấy phép, tài sản và phụ thuộc tại phiên bản cụ thể trước bất kỳ sao chép nào.

### 9. [OpenStax simulations](https://github.com/openstax/simulations/tree/c76ae20c304a) — `c76ae20c304a`, AGPL-3.0

Nhiều thư mục mô phỏng, gồm `nuclear-physics`, `nuclear-fission`, `beta-decay`; `common`, Grunt và package gốc. README dùng Grunt để build các simulation nhúng sách, không phải dự án Next/React hiện đại. Có thể nghiên cứu bố cục hoạt động, không nhập code khi chưa đánh giá nghĩa vụ AGPL và quyền đối với từng tài sản/phụ thuộc. Đây không đồng nghĩa mọi nội dung OpenStax có cùng giấy phép với kho này.

### 10. [XState](https://github.com/statelyai/xstate/tree/9eb940c19f0e) — `9eb940c19f0e`, MIT

Monorepo `packages`, `docs`, `examples`, `templates`: state machines/statecharts và actors; không có physics hay scene. Có thể biểu diễn các trạng thái dự đoán → thí nghiệm → giải thích và guard, nhưng hiện chưa cài và không bắt buộc cho một state machine TypeScript nhỏ. Nếu thêm, kiểm tra phiên bản phát hành, React integration và test guard.

### 11. [xapijs/xapi](https://github.com/xapijs/xapi/tree/5e28e9bda892) — `5e28e9bda892`, MIT

`src`, `example`, `test`, TypeScript/Rollup: thư viện giao tiếp xAPI; không có physics/3D và không phải LRS. Có thể cân nhắc adapter phía server sau khi chốt schema, consent, thời hạn lưu, access control và mapping định danh; không chứng minh tuân thủ quyền riêng tư chỉ bằng việc dùng thư viện. Kiểm thử giao thức, bảo mật và phiên bản thực tế trước khi tích hợp.

### 12. [Geant4](https://github.com/Geant4/geant4/tree/f3d5293d3847) — `f3d5293d3847`, Geant4 Software License

C++/CMake, `source`, `examples`, `ReleaseNotes`; toolkit Monte Carlo mô phỏng hạt đi qua vật chất, có các physics model và dữ liệu riêng. Không tương thích trực tiếp như React/Three component; dữ liệu, cài đặt, chi phí tính toán và kiểm định vượt xa thí điểm trình duyệt. Đây là toolkit nghiên cứu, không biến hoạt hình giáo dục thành mô phỏng nghiên cứu Geant4. Xem [giấy phép riêng](https://github.com/Geant4/geant4/blob/f3d5293d3847/LICENSE) và điều kiện dữ liệu trước khi phân phối.

## Nguồn vật lý và chương trình

[OpenStax Physics §22.3](https://openstax.org/books/physics/pages/22-3-half-life-and-radiometric-dating) cho quy luật mũ và giải thích ngẫu nhiên từng hạt. Với các hạt độc lập, cùng hằng số phân rã, xác suất một hạt còn sau thời gian t là p = exp(-λt); số còn lại là biến ngẫu nhiên nhị thức với kỳ vọng N₀p, không phải luôn bằng kỳ vọng. Có thể sinh tuổi thọ bằng -ln(U)/λ với U đồng đều trong (0,1), dùng bộ sinh giả ngẫu nhiên có seed để tái lập. Đây là mô hình thống kê lý tưởng; không mô phỏng năng lượng, loại bức xạ, sản phẩm con hay liều.

Bản đối chiếu dự án [SGK_RESEARCH_WEB_MATRIX.md](../SGK_RESEARCH_WEB_MATRIX.md) dẫn B23 **Hiện tượng phóng xạ**, SGK Kết nối tri thức tr. 104–113, công thức tr. 108–109; tài liệu chương trình gốc lưu tại [physics-curriculum-2018.pdf](../../public/learning/physics-curriculum-2018.pdf). Cần đối chiếu trực tiếp chương trình/SGK khi chốt yêu cầu cần đạt; nguồn OpenStax bổ trợ vật lý không tự mở rộng yêu cầu chương trình Việt Nam.
