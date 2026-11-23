# Khảo sát chuyên sâu mô phỏng và website học Vật lí hạt nhân

**Bản nghiên cứu làm việc — 14/11/2026.** Phạm vi ưu tiên: B21–B25, lớp học đảo ngược, tính tự học, mô phỏng và website phù hợp học sinh THPT. Không thể khẳng định đã đọc hết mọi nghiên cứu trên thế giới; các nguồn được chọn để giúp quyết định cho dự án và phải tiếp tục được cập nhật, kiểm tra trước khi áp dụng.

**Cách đọc bằng chứng:** tài liệu của nhà cung cấp cho biết tính năng họ mô tả; bài nghiên cứu cho biết kết quả trong bối cảnh cụ thể; việc trực tiếp mở mô phỏng là kiểm tra thao tác trong một môi trường, không thay cho kiểm định chuyên môn hay thử nhiều thiết bị. Các đề xuất trong báo cáo chưa được cô hoặc nhóm phê duyệt trừ khi ghi rõ.

## 1. Phát hiện quan trọng nhất

Một website học tốt không chỉ là một mô phỏng đẹp. Cần tạo thành chuỗi: **đặt vấn đề → dự đoán có lí do → quan sát/thao tác → ghi chứng cứ → giải thích → trao đổi với giáo viên và bạn học → điều chỉnh**. Mô phỏng giúp tạo hiện tượng và dữ liệu để học sinh suy nghĩ; bản thân việc mở mô phỏng hay xem video không chứng minh sự tự học.

Điều này bám sát hai yêu cầu trong phiếu `ĐT_06 - NX.pdf`: có biện pháp sư phạm kiểm soát việc tự học trước giờ và có tiêu chí kiểm định tri thức Vật lí hạt nhân do AI tạo. `hd.docx` là căn cứ hoạt động trước/trong giờ; thuyết minh đề tài và hướng dẫn cô cần tiếp tục được đối chiếu.

## 2. Những mô phỏng nên nghiên cứu

| Nguồn | Giá trị | Có thể rút ra cho dự án | Giới hạn trước khi dùng |
| --- | --- | --- | --- |
| [PhET Build a Nucleus](https://phet.colorado.edu/en/simulations/build-a-nucleus) | Ghép proton/neutron và nghiên cứu kí hiệu, đồng vị, vị trí trên bảng hạt nhân | B21: kết nối thao tác với A, Z và câu hỏi dự đoán | Không coi mọi hình minh họa là ảnh thật hạt nhân; kiểm tra giấy phép và thiết bị. |
| [PhET Beta Decay](https://phet.colorado.edu/en/simulations/beta-decay) | Phân biệt một hạt, mẫu nhiều hạt và tốc độ phân rã | B23: cho học sinh so sánh sự kiện ngẫu nhiên với quy luật của quần thể | Khả năng chạy/nhúng, ngôn ngữ và quyền sử dụng phải kiểm riêng. |
| [PhET Alpha Decay](https://phet.colorado.edu/en/simulations/alpha-decay) | Khám phá phân rã alpha và bán rã | B23: so sánh biến đổi trước–sau và kiểm tra A/Z | Một mô hình không thay cho chứng cứ thực nghiệm; giáo viên duyệt cách diễn giải. |
| [PhET Nuclear Fission](https://phet.colorado.edu/vi/simulations/nuclear-fission) | Quan sát phân hạch và dây chuyền | B22/B24: dự đoán, quan sát một kênh phản ứng và giải thích giới hạn | Bản Java có cách chạy CheerpJ trên trình duyệt theo trang nguồn; chưa thử mọi thiết bị và cách nhúng. |
| [Walter Fendt — định luật phân rã](https://www.walter-fendt.de/html5/phen/lawdecay_en.htm) | Hạt, điểm đo và đường lí thuyết | Thiết kế bảng/đồ thị đi cùng kết quả từng lượt | Giấy phép và điều kiện sử dụng của phiên bản cụ thể cần xác minh trước khi sao chép, sửa hoặc nhúng. |
| [Open Source Physics — Two-State Nuclear Decay](https://www.compadre.org/osp/EJSS/4364/201.htm) | Mô hình xác suất rời rạc và so sánh đường liên tục | Tham khảo tách thuật toán xác suất với hình thức hiển thị | Kiểm tra giấy phép tài nguyên và mã ở đúng phiên bản trước khi tái sử dụng. |
| [OSP@Singapore — chương hạt nhân](https://iwant2study.moe.edu.sg/textbooks/physics/nuclear-physics/) | Lộ trình từ cấu trúc, bán rã, tia bức xạ đến bằng chứng | Tổ chức từng chặng với câu hỏi kiểm tra khái niệm | Nguồn trên tên miền giáo dục Singapore không đồng nghĩa mọi mô hình đều do bộ thẩm định; xem quyền từng tài nguyên. |
| [OSP@Singapore — bức xạ](https://iwant2study.moe.edu.sg/lookangejss/physicstjcsls/3radiation/) | Thử chọn tia/vật cản và dự đoán | Tạo tình huống so sánh định tính | Không biến hình minh họa thành chỉ dẫn an toàn che chắn thật: độ suy giảm phụ thuộc năng lượng, vật liệu và độ dày. |
| [PanPhy — Fission and Fusion](https://panphy.app/simulations/fission_fusion.html) | Cách kết hợp 3D, thao tác và phần nêu giới hạn mô hình | Nhãn quy ước, điều khiển từng bước và cách tránh trình bày sai thực tế | Nguồn giữ bản quyền; chỉ tham khảo ý tưởng, không sao chép mã/hình. |
| [IAEA LiveChart](https://nucleus.iaea.org/Pages/livechart-of-nuclides-av.aspx) | Tra cứu dữ liệu đồng vị | Nguồn đối chiếu dữ liệu, không cần đưa toàn bộ vào giao diện học sinh | Đây là cơ sở dữ liệu chuyên môn, không phải mô phỏng phổ thông. |
| [RSC — mô hình bán rã bằng vật liệu đơn giản](https://edu.rsc.org/download?ac=542174) | Hoạt động không phụ thuộc mạng, kết hợp phiếu và dữ liệu | Phương án thay thế khi thiết bị yếu hoặc làm nhóm | Điều chỉnh số lượng vật liệu và cách dạy theo kế hoạch được cô duyệt. |
| [University of Western Australia — hướng dẫn Nuclear Decay](https://www.uwa.edu.au/study/-/media/faculties/science/docs/teacher-guide---nuclear-decay.pdf) | Tài liệu giáo viên mô tả chọn đồng vị, quan sát hạt mẹ/con và vẽ đồ thị | Cấu trúc hướng dẫn và phiếu quan sát cho giáo viên | Tài liệu cũ; chưa xác nhận mô phỏng còn chạy và quyền sao chép tại Việt Nam. |
| [University of Illinois — phòng thí nghiệm ảo](https://verl.npre.illinois.edu/VirtualReality.html) | Tham khảo bố cục nguồn, vật chắn, đầu dò và số đo trong phòng thí nghiệm 3D | Ý tưởng tổ chức một thí nghiệm có thao tác | Hướng đến đào tạo kĩ thuật; có công nghệ cũ và chưa xác nhận chạy được hoặc giấy phép. |
| [FARLabs — Nuclear](https://www.farlabs.edu.au/nuclear/) | Giới thiệu thí nghiệm **từ xa với nguồn đo thật**, khác mô phỏng máy tính | Cách trình bày đầu dò, phép đo và dữ liệu thực | Cần kiểm tra điều kiện giáo viên, đặt lịch, khu vực sử dụng và trạng thái hoạt động; không giả định học sinh Việt Nam truy cập được. |

### Ghi nhận trực tiếp PhET Beta Decay

Ngày 14/11, đã mở trang mô phỏng trên trình duyệt tích hợp và vào màn **Multiple Atoms**. Mô phỏng hiển thị đồng vị H-3, C-14, I-131 hoặc tùy chọn khác; cho đặt số hạt, tạm dừng, làm chậm và quan sát mốc bán rã. Một lượt với 10 hạt cho kết quả 4 hạt H-3 còn lại khi trạng thái hiển thị khoảng 19,96 năm; đây chỉ là **một lượt chạy minh họa**, không phải phép kiểm định phân phối xác suất. Chưa thử trên điện thoại, tiếng Việt, chế độ ngoại tuyến hay nhúng vào web dự án.

### Cảnh báo khi tham khảo JavaLab

[JavaLab — Nuclear Chain Reaction](https://javalab.org/en/nuclear_chain_reaction_en/) hữu ích để xem cách trình bày một dây chuyền và chính trang có cảnh báo hình hạt nhân được phóng đại. Tuy nhiên, phần giải thích trên trang đưa ra các khẳng định tuyệt đối rằng phân hạch không xảy ra trong tự nhiên và phản ứng dây chuyền chỉ có thể xảy ra với U-235. Không dùng nguyên văn các khẳng định đó làm kiến thức chuẩn. [IAEA mô tả dấu vết phân hạch tự nhiên tại Oklo](https://inis.iaea.org/records/m80aa-twm59); phần kiến thức và nguồn liên quan cần được giáo viên thẩm định. Trang cũng có các nội dung vượt phạm vi phổ thông, nên cân nhắc chọn hoặc diễn giải lại theo mục tiêu học tập. Kiểm tra [chính sách bản quyền của JavaLab](https://javalab.org/en/copyright-policy/) trước khi dùng; có điều kiện khác nhau cho nhúng và sao chép mã.

## 3. Những điều phải đúng khi làm mô phỏng

### Bán rã

Với mô hình một loại hạt nhân độc lập có hằng số phân rã `λ`, số hạt chưa phân rã **kì vọng** tại thời điểm `t` là `E[N(t)] = N₀ exp(-λt) = N₀·2^(-t/T½)`. Trong một khoảng `Δt`, xác suất phân rã của một hạt chưa phân rã là `1-exp(-λΔt)`. Đây là mô hình lí tưởng; phải nêu điều kiện và đơn vị. [Nguồn phương pháp xác suất của EPA](https://19january2017snapshot.epa.gov/sites/production/files/2015-05/documents/402-b-04-001c-19-final.pdf).

- Một hạt nhân không biến thành “nửa hạt” sau một chu kì; không biết chính xác từng hạt sẽ phân rã lúc nào chỉ từ chu kì bán rã.
- Một mẫu nhỏ không bắt buộc còn đúng một nửa sau mỗi chu kì. Có thể chạy nhiều lượt với cùng điều kiện, so sánh phân bố kết quả với đường kì vọng; phân biệt giá trị của từng lượt với trung bình lí thuyết.
- Với các hạt độc lập giống nhau, tại một chu kì, mô hình nhị thức cho kì vọng `N₀/2` và phương sai `N₀/4`. Đây là phép suy luận theo giả định mô hình, không phải quy luật bắt buộc cho mọi mô phỏng hoặc mẫu thực.
- So sánh số hạt hiển thị, bảng, biểu đồ và thời gian cùng một trạng thái; kiểm tra chạy lại, đặt lại và điều kiện biên. Ghi rõ thời gian, hình dạng và kích thước hiển thị có thể quy ước.

### Phân rã, phản ứng và bức xạ

- Với mỗi phương trình hạt nhân, kiểm tra tổng số khối và điện tích, kí hiệu hạt cùng điều kiện phản ứng; không coi một kênh phân hạch trong SGK là kênh duy nhất có thể tồn tại.
- Phân biệt số neutron sinh ra trong một phân hạch với hệ số nhân neutron hiệu dụng của hệ; biểu diễn lò phản ứng cho phổ thông là mô hình giản lược, không dùng như thiết kế vận hành hay dự báo an toàn.
- Khi minh họa alpha/beta/gamma, nêu điều kiện vật liệu và mức năng lượng; không nói một tấm chắn luôn chặn tuyệt đối mọi photon. [NIST XCOM](https://www.nist.gov/pml/xcom-photon-cross-sections-database) là nguồn dữ liệu photon tham khảo, không thay cho đánh giá an toàn thực tế.
- Nội dung do AI tạo phải được giáo viên/người có chuyên môn đối chiếu nguồn được phép; ghi phần AI hỗ trợ, phiên bản, người duyệt, ngày và lỗi cần sửa.

## 4. Chọn kiểu website theo việc học, không theo hiệu ứng

| Kiểu | Tham khảo | Bài học thiết kế |
| --- | --- | --- |
| Sách tích hợp nhiều loại học liệu | [CK-12 FlexBooks 2.0](https://help.ck12.org/hc/en-us/articles/360007620653-How-do-FlexBooks-2-0-work), [H5P Interactive Book](https://h5p.org/august-2020-release-note) | Mục lục rõ, nội dung–mô phỏng–câu hỏi trong một mạch; hiệu ứng lật trang là tùy chọn. |
| Lộ trình/playlist do giáo viên điều chỉnh | [LabXchange](https://about.labxchange.org/get-started) | Ghép nhiều tài nguyên và giao theo mục tiêu; kiểm tra việc học sinh cần tài khoản và điều kiện dữ liệu. |
| Tương tác với dữ liệu | [CODAP/Concord](https://learn.concord.org/dynamic-data-science?userType=teacher) | Liên kết bảng–đồ thị để học sinh thấy dữ liệu thay đổi; kiểm tra quyền và khả năng kết nối trước khi dùng. |
| Lớp học và bài nộp | [Google Classroom](https://support.google.com/edu/classroom/answer/16643267) | Hiển thị trạng thái rõ: đã giao, đã nộp, đã chấm, đã trả; với dự án cần phân biệt thêm lưu trên máy và đã gửi server. |
| Video có tương tác | [H5P Interactive Video](https://h5p.org/node/617) | Dừng để dự đoán/giải thích và phản hồi; không mặc định câu hỏi trắc nghiệm là đủ bằng chứng tự học. |

**Điều kiện H5P quan trọng:** theo tài liệu [Content Resume của H5P.com](https://help.h5p.com/hc/en-us/articles/7506467194653-Content-Resume), việc lưu để học tiếp cần gói/thiết lập phù hợp, khởi chạy qua LMS bằng LTI và loại nội dung được hỗ trợ; nhúng iframe trực tiếp không tự có cơ chế này. Đây là mô tả của H5P.com, không suy rộng cho mọi cách cài H5P.

**Ý tưởng sách 3D:** giữ văn bản thật, mục lục, đường dẫn đến bài, nút trước/sau, phương án dùng bàn phím và giảm chuyển động. Nếu hiệu ứng không chạy, phần nội dung và nhiệm vụ vẫn phải dùng được. Chưa có căn cứ kết luận 3D tốt hơn 2D cho học sinh của dự án; chọn 3D khi góc nhìn và thao tác theo chiều sâu giúp hiểu nội dung.

## 5. Tiếp cận, quyền riêng tư và chi phí

- Theo [WCAG 2.2](https://www.w3.org/TR/WCAG22/), xét phương án thay thao tác kéo, kích thước vùng chạm và dùng bàn phím; các tiêu chí có điều kiện/ngoại lệ và cần kiểm tra toàn giao diện. Với đồ thị, cung cấp bảng hoặc mô tả tương đương theo [hướng dẫn W3C](https://www.w3.org/WAI/tutorials/images/complex/).
- Màu lấy mẫu tạm từ logo SGU: trắng trên `#203090` khoảng **11,13:1**; trắng trên `#40C0E0` khoảng **2,14:1**; đen trên `#40C0E0` khoảng **9,83:1**. Đây là tính toán cho từng cặp màu, không khẳng định mã màu chính thức hay toàn website đạt chuẩn. Kiểm tra lại màu thực, kích thước chữ và trạng thái khi thiết kế.
- WebGL có thể mất ngữ cảnh; thông báo lỗi và phương án bảng/2D nên được thiết kế thay vì chỉ hiển thị khung trống. Xem [MDN về mất WebGL context](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event).
- Mã học sinh không tự biến dữ liệu thành ẩn danh nếu còn bảng đối chiếu; chỉ thu dữ liệu cần thiết, giới hạn quyền và xác nhận quy trình với cô/nhóm. Tránh gửi định danh học sinh hoặc tài liệu hạn chế vào AI công cộng.
- Lập bảng cho từng loại dữ liệu: mục đích, người xem, bên thứ ba, nơi lưu, thời hạn, cách xử lí yêu cầu xóa và người chịu trách nhiệm. [Hướng dẫn UNICEF về dữ liệu trường học](https://www.unicef.org/eca/reports/data-protection-schools) hữu ích để rà soát nhưng tập trung vào bối cảnh châu Âu; không dùng thay cho xác định quy định Việt Nam và quy trình nhà trường.
- Không mặc định nội dung công khai có quyền sao chép, dùng thương mại, nhúng hoặc cho AI xử lí. [PhET](https://phet.colorado.edu/en/licensing/) và [OpenStax](https://openstax.org/books/college-physics-2e/pages/preface) có điều kiện riêng theo tài nguyên; kiểm tra bản hiện hành trước khi dùng.
- Cô Nhị đã yêu cầu dừng phát sinh chi phí. Không đăng ký, mua, nâng gói hoặc khởi tạo dịch vụ tính phí trong quá trình khảo sát. Dùng hạ tầng hiện có vẫn tiêu tốn thời gian chuẩn bị và bảo trì; không khẳng định “không tốn gì”.

## 6. Bằng chứng sư phạm và giới hạn

| Nghiên cứu | Điều có thể học | Điều không được suy ra |
| --- | --- | --- |
| [Van Alten và cộng sự, 2020](https://dspace.library.uu.nl/bitstream/handle/1874/408016/1_s2.0_S0747563220300728_main.pdf?isAllowed=y&sequence=1): 154 học sinh, 6 lớp Lịch sử | Trong phân tích chính gồm 105 học sinh xem ít nhất 5/7 video, tỉ lệ video hoàn thành trung bình ở nhóm có nhắc cao hơn; không thấy khác biệt có ý nghĩa về kết quả bài kiểm tra. Tác giả cảnh báo thiên lệch chọn mẫu. Phân tích toàn bộ học sinh có dữ liệu trong phụ lục không thấy khác biệt có ý nghĩa ở tổ hợp hai chỉ báo hoạt động trực tuyến giữa hai điều kiện. | Không suy ra mọi học sinh đều xem nhiều hơn hoặc lời nhắc đã phát triển năng lực tự học. Kết quả không trực tiếp chứng minh hiệu quả của website Vật lí 12. |
| [Sayer và cộng sự, 2016](https://journals.aps.org/prper/pdf/10.1103/PhysRevPhysEducRes.12.020133): lớp cơ học lượng tử đại học | Giáo viên dùng phản hồi trước giờ để điều chỉnh hoạt động và thảo luận | Không áp kết quả một học phần đại học trực tiếp cho học sinh THPT trong đề tài. |
| [Hull, Jansky và Hopf, 2026](https://journals.aps.org/prper/abstract/10.1103/5yyz-hpx8) | Cách lập luận về bán rã có thể thay đổi theo ngữ cảnh; nên hỏi cả một hạt và nhiều hạt | Không phân loại cố định năng lực học sinh từ một câu trả lời. |
| [Nghiên cứu hoạt hình 3D tại Morocco, 2026](https://www.ijiet.org/vol16/IJIET-V16N2-2522.pdf) | Có thể tham khảo cách nhóm tác giả triển khai và so sánh hoạt động | Can thiệp gộp nhiều yếu tố; không chứng minh riêng 3D tốt hơn 2D hoặc hiệu quả cho dự án này. |
| [Chen, Abdul Rabu và Jamiat, 2025](https://files.eric.ed.gov/fulltext/EJ1463991.pdf): 120 học sinh lớp 9, ba lớp tại một trường ở Trung Quốc | So sánh ba cách tổ chức phòng thí nghiệm trong lớp đảo ngược về mạch điện; gợi ý thiết kế nhiệm vụ tìm tòi có hướng dẫn | Chỉ một lớp trong mỗi điều kiện nên ảnh hưởng của lớp và can thiệp có thể lẫn nhau; không đo trực tiếp tự học trong Vật lí hạt nhân 12. |
| [Eliphas và Shumba, 2019](https://pubs.sciepub.com/education/7/12/2/): hai lớp 11 ở Zambia | Nghiên cứu học vật lí nguyên tử và phóng xạ có kết hợp mô phỏng, video và thảo luận, trong thiết kế đổi điều kiện theo giai đoạn | Can thiệp gồm nhiều thành phần và chỉ có hai lớp; không tách được tác động riêng của mô phỏng hoặc khẳng định hiệu quả cho dự án. |
| [Husnaini và Chen, 2019](https://doi.org/10.1103/PhysRevPhysEducRes.15.010119): 68 học sinh ở Indonesia | Với bài con lắc có phiếu tìm tòi, hai môi trường thực và ảo cho kết quả khác nhau theo từng mục tiêu; nên đánh giá riêng hiểu biết và kĩ năng | Nội dung không phải hạt nhân, bối cảnh khác; không kết luận mô phỏng thay được mọi hoạt động thực nghiệm. |

Một rubric thử nghiệm có thể ghi nhận **lập kế hoạch, theo dõi bằng chứng, điều chỉnh/phản tư và tìm hỗ trợ**; kiến thức Vật lí cần có câu hỏi kiểm tra riêng và trình bày bên cạnh, không mặc định gộp vào điểm tự học. Không quan sát được khác với điểm 0. Cả hai công cụ đều chỉ là dự thảo: cần cô xác nhận tiêu chí, ví dụ minh họa, cách chấm, độ phù hợp và phương án nghiên cứu trước khi dùng để kết luận về năng lực.

Phản hồi cho học sinh có thể chỉ rõ em đã làm gì, cần đối chiếu bằng chứng nào và nên thử bước nào tiếp theo, thay vì chỉ báo đúng/sai; đây là gợi ý thiết kế theo [CAST UDL](https://udlguidelines.cast.org/engagement/effort-persistence/feedback/), chưa chứng minh giao diện hiện tại đạt hiệu quả.

## 7. Đề xuất một bài B23 mẫu

1. **Trước giờ:** với một hạt nhân chưa phân rã, hỏi sau một chu kì trong mô hình nó có thể đã phân rã hay chưa, và xác suất mỗi khả năng là bao nhiêu; không yêu cầu dự báo chính xác kết quả cá thể. Với một mẫu gồm cùng đồng vị, các hạt độc lập và không bổ sung thêm, hỏi số hạt còn lại kì vọng rồi yêu cầu học sinh dự đoán và giải thích.
2. Học sinh chạy nhiều lượt mô phỏng với cùng điều kiện; ghi ít nhất hai kết quả, so sánh với dự đoán và đường kì vọng. Nếu không có mạng, dùng mô hình đồng xu hoặc phiếu giấy, ghi rõ đây là phép mô phỏng đơn giản với giả định xác suất.
3. Giáo viên xem các kiểu lập luận và khó khăn, không chỉ số lượt mở; trong giờ nhóm học sinh thảo luận, phân tích bảng/đồ thị rồi cô chuẩn hóa kiến thức.
4. Sau giờ học sinh giải thích lại, áp dụng vào một ngữ cảnh mới và nêu điều mình điều chỉnh. Không ép khóa dự đoán hoặc đặt ngưỡng điểm khi chưa được nhóm thông qua.
5. Trước thử nghiệm thật, kiểm tra quyền truy cập, lời giải, mô hình, lưu/nộp, khả năng sử dụng và cách cô nhìn thấy minh chứng; ghi trung thực phần chưa có hoặc chưa hoạt động.

Điểm 4 là **nguyên tắc đề xuất cho quyết định tiếp theo**, không phải khẳng định hiện trạng: đọc mã cho thấy `HalfLifePilot` hiện có ràng buộc dự đoán trong một số chế độ hướng dẫn/giao bài. Cần kiểm thử luồng thực tế và cùng cô quyết định cách áp dụng; chưa thay đổi mã trong khảo sát này.

### Đối chiếu thêm với Gemini

Đã hỏi Gemini bằng câu hỏi tổng quát về mô hình bán rã, không gửi hồ sơ hoặc tin nhắn riêng. Gemini gợi ý đối chiếu số hạt còn lại ở nhiều lượt với phân bố nhị thức, so sánh đồ thị số hạt với đồ thị tỉ lệ, và giải thích vì sao đường kì vọng có thể đi qua giá trị không nguyên. Những ý này phù hợp với phép suy luận ở mục 3 dưới các giả định đã nêu; ý kiến AI chỉ là gợi ý phản biện, không phải kết quả thực nghiệm hay nguồn kiểm chứng độc lập.

Một kế hoạch kiểm định kỹ thuật có thể đề xuất cho người phát triển: chọn vài thời điểm cố định, chạy nhiều lần có lưu điều kiện, kiểm tra trung bình và phương sai của số hạt với sai số thống kê được xác định trước; kiểm tra reset và ranh giới bộ sinh số. Không coi số lượt chạy tùy ý do AI gợi ý là tiêu chuẩn bắt buộc, không đưa kiểm định phân phối vào nhiệm vụ học sinh lớp 12 nếu cô chưa duyệt. Chưa thực hiện các phép kiểm định này cho dự án.

## 8. Đối chiếu công việc đã có

Dự án gốc đã có mã và tài liệu mô phỏng; xem [khảo sát mã nguồn mô phỏng](../docs/research/GITHUB_SIMULATION_REVIEW.md) và [nguồn học liệu trực quan](../docs/VISUAL_LEARNING_SOURCES.md). Có `HalfLifePilot.tsx`, trang thí nghiệm bán rã, mã lưu cục bộ, hành động server và migration liên quan. Chỉ kiểm tra mã **không chứng minh** migration đã áp dụng, dữ liệu thật đã được nộp hay giáo viên đã xem được. Kiểm kê trước khi nghĩ tới viết lại.

### Hai phát hiện cần xem xét từ mã nguồn hiện có

1. [Lời dẫn mô phỏng](../src/simulations-v2/physics/decay.ts) có chỗ nói sai khác thống kê “càng nhỏ” khi tăng số hạt mà không nói là sai khác **tương đối**; ở mẫu độc lập cùng xác suất, độ lệch chuẩn của số hạt tuyệt đối tăng theo căn bậc hai số hạt ban đầu, trong khi độ lệch chuẩn của tỉ lệ giảm theo căn bậc hai. Một chỗ khác nói kết quả một lượt “bám sát” đường lí thuyết, có thể gây hiểu nhầm với mẫu nhỏ. Cần kiểm tra đường đi đến giao diện và người có chuyên môn duyệt cách diễn đạt trước khi chỉnh sửa. Đây là nhận xét đọc mã, chưa xác nhận trang nào đang hiển thị câu đó.
2. Trong luồng bài học, mã hiện chia **gửi kết quả thí nghiệm** và **nộp phần trả lời của bước học** thành hai thao tác; trạng thái lưu cục bộ cũng khác với gửi lớp. Cần kiểm thử hai luồng bằng tài khoản thật và làm rõ cho người dùng biết cái nào đã đến giáo viên. Chưa thể dùng log hiện có làm bằng chứng chắc chắn học sinh đã dự đoán trước mọi quan sát: khả năng ghi phụ thuộc đồng ý và trạng thái cần kiểm tra khi khôi phục.

## 9. Tính mới của nghiên cứu: cần đối chiếu trước khi khẳng định

Một [bài báo năm 2020 của Tạp chí Khoa học Trường ĐH Sư phạm TP.HCM](https://journal.hcmue.edu.vn/index.php/hcmuejos/article/view/2825) trong danh mục tài liệu tham khảo có nêu luận án của **Trương Thị Phương Chi (2017), Đại học Vinh**, về xây dựng và sử dụng e-learning trong dạy học kiến thức hạt nhân nguyên tử Vật lí 12 theo mô hình lớp học đảo ngược. Bài báo năm 2020 bản thân nghiên cứu lĩnh vực khác; thông tin về luận án là **trích dẫn thứ cấp** trong danh mục của bài đó.

Vì vậy không nên viết rằng kết hợp học liệu số, Vật lí hạt nhân 12 và lớp học đảo ngược là chưa từng có. Cần tìm bản luận án chính thức, đọc câu hỏi nghiên cứu, bối cảnh, can thiệp, cách đánh giá và giới hạn; sau đó cùng cô đối chiếu vai trò AI, thiết kế học liệu, bằng chứng tự học và hoàn cảnh dự án. Các khác biệt này hiện mới là **khả năng cần nghiên cứu**, chưa đủ căn cứ tuyên bố tính mới.

## 10. Việc cần cô và nhóm duyệt

1. Chọn phạm vi bài mẫu và đối chiếu từng mục tiêu với `hd.docx`, thuyết minh và chương trình được dùng.
2. Duyệt câu hỏi trước giờ, bằng chứng tự học, phản hồi, kịch bản trong/sau giờ và cách hỗ trợ học sinh thiếu thiết bị.
3. Chỉ định người kiểm định tri thức hạt nhân, nguồn, cách ghi lỗi, phiên bản nội dung và các điều kiện trước khi công bố.
4. Thống nhất phương án nghiên cứu và công cụ đo: hồ sơ có điểm chưa khớp về mẫu/thời gian; cần kiểm bản được duyệt, không tự chọn số.
5. Chọn ranh giới frontend/backend, phương án dữ liệu và lộ trình kỹ thuật sau khi kiểm kê; không tách hệ thống hay phát sinh chi phí chỉ vì có đề xuất.

Tài liệu này không chứa nội dung riêng tư của các cuộc trò chuyện; kết luận từ nguồn công khai không thay thế ý kiến giảng viên hoặc kết quả thực nghiệm của nhóm.
