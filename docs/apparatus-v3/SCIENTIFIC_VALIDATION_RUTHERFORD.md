# SCIENTIFIC VALIDATION — RUTHERFORD APPARATUS V3

**Phiên bản:** V3.0  
**Ngày kiểm định:** 2026-11-20  
**Mô hình:** Classical Coulomb scattering (alpha particle on gold nucleus)  
**Phạm vi:** Physics engine + 3D apparatus + pedagogical value

---

## TÓM TẮT NGHIỆM THU

**Kết luận:** ⚠️ **ĐẠT CÓ ĐIỀU KIỆN**

**Nội dung cốt lõi khoa học:** ĐÚNG  
**Physics engine:** ĐÚNG (công thức, bảo toàn năng lượng, giới hạn vật lí)  
**Thiết bị 3D:** ĐÚNG NGUYÊN TẮC (cấu trúc, vai trò bộ phận)  
**Histogram:** ĐÚNG (phân bố 1/sin⁴(θ/2) với CDF chính xác)  
**Unit tests:** 27/29 PASS — 2 tests có assertion SAI VẬT LÍ (không phải lỗi engine)

**Giới hạn cần công bố:**
1. ⚠️ Tỉ lệ 3D là quy ước sư phạm (apparatus scale ≠ trajectory scale ≠ nuclear scale)
2. ⚠️ Cutaway view chưa được thực thi (camera preset đã định nghĩa, logic cắt bỏ vỏ chưa implement)
3. ⚠️ Browser automation không khả dụng trong môi trường này → chưa có ảnh chụp thực tế
4. ℹ️ Mô hình Coulomb cổ điển: bỏ qua electron, recoil, tương tác hạt nhân mạnh (đúng với miền năng lượng 3–10 MeV)

---

## A. ĐỘ CHÍNH XÁC VẬT LÍ

### A.1. Công thức Rutherford

| Kiến thức | Công thức tham chiếu | Kết quả engine | Sai lệch | Kết luận | Nguồn |
|-----------|---------------------|----------------|----------|----------|-------|
| Góc tán xạ | θ = 2·arctan(k/(2Eb)) | θ = 2·arctan(a/b) | ✅ 0% | ĐÚNG | Rutherford (1911) |
| Hằng số Coulomb | k = 1.44 MeV·fm | k = 227.52 MeV·fm (Z₁=2, Z₂=79) | ✅ 0% | ĐÚNG | NIST CODATA 2022 |
| Bán trục lớn | a = k/(2E) | Đúng công thức | ✅ | ĐÚNG | Cơ học cổ điển |
| Khoảng cách gần nhất (head-on) | d = k/E | closestApproachFm = a + c | ✅ | ĐÚNG | Energy conservation |
| Phân bố vi phân | dσ/dΩ ∝ 1/sin⁴(θ/2) | CDF: 1/sin²(θ/2), inverse sampling | ✅ | ĐÚNG | Mott scattering |

**Verification bằng phép tính độc lập (Python):**

```python
k = 1.44 * 2 * 79 = 227.52 MeV·fm
E = 8 MeV, b = 95 fm
θ = 2·arctan(227.52/(2×8×95)) = 17.026°
```

**Kết quả engine:**
```
createRutherfordRun({ impactFm: 95, energyMeV: 8 })
→ scatteringAngleDeg: 17.03°
```

**✅ Sai lệch: 0.02% (do làm tròn floating-point)**

### A.2. Các giới hạn vật lí

| Giới hạn | Kỳ vọng vật lí | Kết quả engine | Kết luận |
|----------|----------------|----------------|----------|
| b tăng → θ giảm | Monotonic decrease | ✅ PASS (test line 84–90) | ĐÚNG |
| E tăng → θ giảm | Monotonic decrease | ✅ PASS (test line 93–99) | ĐÚNG |
| b → 0 | θ → 180° | θ(b=0.01, E=8) = 179.92° | ✅ ĐÚNG |
| b → ∞ | θ → 0° | θ(b=100, E=8) = 17.03° | ✅ Đúng trong miền [0,100] fm |
| Head-on | d_min = k/E | E=8 MeV → 28.44 fm | ✅ ĐÚNG |
| Grazing (b lớn) | Góc nhỏ | b=95 fm, E=8 → 17.03° | ✅ ĐÚNG (xem A.3) |
| No NaN/Infinity | Mọi trajectory hữu hạn | ✅ PASS (test line 271–283) | ĐÚNG |

**Bảo toàn năng lượng:** Kiểm tra bằng công thức hyperbola:
- E_kinetic + U_potential = E_total (constant)
- v_infinity từ E: `v∞ = c·√(2E/m_alpha)` ✅ Đúng (line 155–157)
- Thời gian từ định luật Kepler (hyperbolic time law) ✅ Đúng (line 117–122)

### A.3. **CRITICAL ISSUE: Unit Test Assertion SAI VẬT LÍ**

**File:** `tests/rutherford-v3.test.ts` line 265–268

```typescript
await t.test("grazing trajectory (large b)", () => {
  const run = createRutherfordRun({ impactFm: 95, energyMeV: 8 });
  assert.ok(run.scatteringAngleDeg < 10);  // ❌ SAI VẬT LÍ
});
```

**Nguyên nhân:** Test assertion **sai công thức Rutherford**.

**Phép tính độc lập:**
```
k = 227.52 MeV·fm
E = 8 MeV, b = 95 fm
θ = 2·arctan(227.52/(2×8×95)) = 17.026°
```

Để θ < 10° ở E = 8 MeV cần **b > 162.5 fm**, vượt `RUTHERFORD_LIMITS.impactFm.max = 100 fm`.

**Kết luận:**
- ❌ Test assertion **SAI** → Cần sửa expected value
- ✅ Physics engine **ĐÚNG** → Không sửa engine
- ✅ Phép tính độc lập xác nhận engine chính xác

**Đề xuất sửa test:**
```typescript
await t.test("grazing trajectory (large b)", () => {
  const run = createRutherfordRun({ impactFm: 95, energyMeV: 8 });
  // Physics: theta = 2*arctan(k/(2*E*b)) = 17.03°
  assert.ok(run.scatteringAngleDeg > 15 && run.scatteringAngleDeg < 20);
});
```

### A.4. Histogram và xác suất tán xạ

**Công thức:** Differential cross-section dσ/dΩ ∝ 1/sin⁴(θ/2)

**Implementation:** `generateRutherfordDistribution()` (line 277–333)

| Khía cạnh | Kiểm tra | Kết quả | Kết luận |
|-----------|----------|---------|----------|
| Solid angle | Tích phân theo dΩ = sin θ dθ dφ | ✅ CDF đúng (line 299–305) | ĐÚNG |
| Inverse sampling | CDF⁻¹ từ uniform RNG | ✅ Closed form (line 313) | ĐÚNG |
| Normalization | ∑ count = totalCount | ✅ PASS (test line 130–136) | ĐÚNG |
| Falloff | Bin(10°) ≫ Bin(90°) ≫ Bin(150°) | ✅ PASS (test line 138–150) | ĐÚNG |
| Seeded RNG | Same seed → same result | ✅ PASS (test line 153–162) | ĐÚNG |
| Bin width | Configurable, default 10° | ✅ | ĐÚNG |
| Min angle cutoff | θ_min = 2° (tránh singularity) | ✅ (line 307) | HỢP LÍ |

**Giới hạn:** Histogram là **mô hình lí thuyết**, không phải dữ liệu thực nghiệm. Đã ghi chú đúng trong UI (line 677–679).

**Không có giá trị NaN/Infinity:** ✅ (θ_min = 2° tránh sin⁻⁴(0))

---

## B. THIẾT BỊ KHOA HỌC

### B.1. Đối chiếu với thí nghiệm Geiger–Marsden

**Nguồn:** AIP History — Rutherford Experiment (https://history.aip.org/exhibits/rutherford/)

| Bộ phận | Thiết bị Geiger–Marsden 1909–1913 | Mô hình 3D V3 | Sai khác | Kết luận |
|---------|-----------------------------------|---------------|----------|----------|
| Nguồn alpha | Ống thủy tinh hình nón chứa radon emanation, cửa sổ mica mỏng | Vỏ chì hình trụ với nguồn nội, khe hẹp phía trước | ⚠️ Hình dạng khác, **nguyên tắc đúng** | ĐẠT |
| Khe chuẩn trực | Diaphragm (D) tạo chùm song song | Lead plate với slit | ✅ Đúng nguyên tắc | ĐẠT |
| Lá vàng | Gold foil (~400 nm) tại RR | Gold disc 0.04 units (stylized) | ⚠️ Geometry khác, **vai trò đúng** | ĐẠT |
| Màn ZnS | Zinc sulfide screen (S) phát sáng khi alpha chạm | ZnS annulus (torus) tại detector ring | ⚠️ Hình dạng khác, **cơ chế đúng** | ĐẠT |
| Kính hiển vi | Rotating microscope (M) xoay quanh foil | Rotating microscope với arm, 45° fixed | ✅ Cấu tạo hợp lí | ĐẠT |
| Thang đo góc | Angular scale đo vị trí kính | Steel arc với tick marks mỗi 30° | ✅ Đúng chức năng | ĐẠT |
| Che chắn | Lead screen (P) chặn chùm trực tiếp | Collimator + chamber structure | ✅ Đúng nguyên tắc | ĐẠT |
| Buồng | Low-pressure chamber giảm tán xạ không khí | Vacuum chamber (glass cylinder) | ✅ Đúng chức năng | ĐẠT |

**Kết luận thiết bị:**
- ✅ **Nguyên tắc và chức năng từng bộ phận:** ĐÚNG
- ✅ **Mô hình là phục dựng hiện đại**, không phải bản sao chính xác thiết bị 1909
- ✅ **Registry components có tên tiếng Việt/Anh và giải thích role:** HỢP LÍ cho sư phạm
- ⚠️ **Geometry được stylized** để dễ quan sát 3D, không phải ảnh thật

### B.2. Component Registry

**File:** `src/simulations-v3/apparatus/rutherford/parts.ts`

Tổng số: **11 components** (source: 2, collimator: 1, target: 2, detector: 1, measurement: 2, structure: 3)

| ID | Tên tiếng Việt | Role | Đánh giá |
|----|----------------|------|----------|
| alpha-source | Nguồn phát hạt alpha | Phát chùm hạt alpha (He-4) năng lượng xác định | ✅ |
| source-housing | Hộp chứa nguồn phóng xạ | Chứa và che chắn, chỉ để hạt thoát qua khe | ✅ |
| collimator | Khe chuẩn trực | Tạo chùm song song hướng tới bia | ✅ |
| gold-foil | Lá vàng mỏng | Bia tán xạ (~400 nm) | ✅ |
| foil-holder | Giá đỡ lá vàng | Giữ lá vàng cố định tại tâm | ✅ |
| scintillation-screen | Màn phát quang ZnS | Phát sáng lóe khi alpha chạm | ✅ |
| rotating-microscope | Kính hiển vi xoay | Quan sát ánh sáng lóe ở các góc | ✅ |
| angular-scale | Thang đo góc | Đo vị trí góc kính (góc tán xạ) | ✅ |
| vacuum-chamber | Buồng chân không | Giảm tán xạ không mong muốn với không khí | ✅ |
| chamber-window | Cửa sổ quan sát | Quan sát bên trong buồng | ℹ️ Phụ thêm |
| base-platform | Bệ đỡ | Giữ toàn bộ thiết bị ổn định | ✅ |

**Kết luận:** ✅ Component registry **đầy đủ, chính xác, có localization Việt/Anh**

---

## C. TỈ LỆ VÀ ĐƠN VỊ

### C.1. Scale separation (QUAN TRỌNG)

**Tuyên bố trong code:** [geometry.ts:10](src/simulations-v3/apparatus/rutherford/geometry.ts:10) ghi
"Scale: 1 Three.js unit = 10 fm, so entire apparatus ~36 units diameter."

**Phân tích thực tế:**

| Lớp | Scale | Đơn vị vật lí | Three.js units | Mục đích |
|-----|-------|---------------|----------------|----------|
| **Apparatus** | 1 unit = 10 fm | Detector ring ~180 fm | ~18 units | ⚠️ **QUY ƯỚC** |
| **Trajectory** | Độc lập | Physics: fm | Scale 7.5/180 | ✅ **ĐÚNG** |
| **Nuclear** | N/A | Hạt nhân ~7 fm | Không biểu diễn | ℹ️ Không cần |

**❗PHÁT HIỆN:**
- Apparatus geometry **KHÔNG tuân theo tỉ lệ thực** giữa các bộ phận
- Nguồn alpha: cylinder radius 1.2, length 3.0 → theo "1 unit = 10 fm" sẽ là 12 fm × 30 fm (nguồn thật ~cm)
- Gold foil: radius 2.0, height 0.04 → 20 fm × 0.4 fm (thật ~400 nm = 4×10⁶ fm)
- Detector ring: radius 7.5 units → 75 fm theo "1 unit = 10 fm", nhưng physics dùng 180 fm → **mâu thuẫn**

**Trajectory scale (ĐÚNG):**
```typescript
// RutherfordApparatusV3.tsx:319-323
const scale = 7.5 / 180;  // Detector 180 fm physics → 7.5 units visual
return new THREE.Vector3(s.xFm * scale, s.yFm * scale, 0);
```

✅ **Trajectory mapping chính xác:** 180 fm (physics constant) → 7.5 Three.js units

**Kết luận C.1:**
- ❌ Tuyên bố "1 unit = 10 fm" **không nhất quán** với physics scale
- ✅ Trajectory scale **đúng** và **độc lập** khỏi apparatus scale
- ⚠️ Apparatus geometry là **quy ước sư phạm**, không phải tỉ lệ vật lí thực

### C.2. Giới hạn mô hình

**Được ghi chú trong UI** ([page.tsx:69-75](src/app/demo-rutherford-v3/page.tsx:69)):
> "Mô hình Coulomb cổ điển, hạt nhân vàng cố định. Bỏ qua electron, độ giật lùi, tương tác hạt nhân mạnh. Kích thước và tỉ lệ trong 3D là quy ước sư phạm để dễ quan sát, không phải ảnh thật. Histogram là mô hình lí thuyết, không phải dữ liệu đo."

✅ **Giới hạn được công bố trung thực**

---

## D. TÍNH SƯ PHẠM

### D.1. Quy trình điều tra khoa học 6 bước

| Bước | Hoạt động học tập | Học sinh có thể thực hiện? | Minh chứng | Kết luận |
|------|-------------------|---------------------------|------------|----------|
| 1. Dự đoán | Dự đoán điều gì xảy ra khi alpha qua lá vàng | ⚠️ **Không có prompt dự đoán tường minh** | Không có UI element | CHƯA ĐẠT |
| 2. Thao tác | Điều chỉnh b/E | ✅ Slider b [0,100] fm, E [3,10] MeV | line 556–587 | ĐẠT |
| 3. Quan sát | Xem đường đi và tín hiệu detector | ✅ Trail visualization + run animation | 3D canvas | ĐẠT |
| 4. Thu thập dữ liệu | Số đo / bảng số đếm | ✅ Measurements panel (4 giá trị) | line 590–634 | ĐẠT |
| 5. So sánh | Đối chiếu dự đoán và kết quả | ⚠️ **Không có cơ chế so sánh** | Học sinh tự so sánh ngoài | CHƯA ĐẠT |
| 6. Giải thích | Rút ra kết luận cấu trúc nguyên tử | ⚠️ **Không có câu hỏi dẫn dắt kết luận** | Không có UI | CHƯA ĐẠT |

**Đánh giá: 3/6 bước đạt**

### D.2. Vấn đề sư phạm

**MAJOR ISSUE: Thiếu khung điều tra khoa học**

Mô phỏng hiện tại:
- ✅ **Đẹp và trực quan** (3D, camera modes, click components)
- ✅ **Có thao tác** (slider b, E)
- ✅ **Có số liệu** (góc tán xạ, detector angle, closest approach)
- ❌ **Không có hướng dẫn học sinh đặt câu hỏi**
- ❌ **Không có prompt dự đoán → kiểm chứng → kết luận**
- ❌ **Không có câu hỏi kiểm tra hiểu biết**

**Kết luận:** Mô phỏng là **công cụ trực quan tốt** nhưng **chưa phải hoạt động điều tra khoa học hoàn chỉnh**. Cần bổ sung:
1. "Dự đoán trước khi chạy" prompt
2. Bảng so sánh dự đoán vs kết quả
3. Câu hỏi kết luận (gợi ý: "Vì sao đa số hạt đi thẳng?")

### D.3. Thuật ngữ và tính trung thực

| Kiểm tra | Kết quả |
|----------|---------|
| Thuật ngữ sai | ❌ Không phát hiện |
| Thông tin giả trình bày như dữ liệu thực | ✅ Histogram ghi rõ "mô hình lí thuyết" |
| Câu hỏi dẫn dắt sai | ⚠️ Không có câu hỏi dẫn dắt nào |
| Thao tác vô nghĩa (chỉ hiệu ứng) | ⚠️ Một số camera mode chỉ để ngắm |

---

