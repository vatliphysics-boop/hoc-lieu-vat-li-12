# Kiểm kê mô phỏng B21–B25 hiện tại — Apparatus V3 Audit

**Ngày:** 20/11/2026  
**Worktree:** `feature/simulation-apparatus-v3` từ commit `e6bf6e6`  
**Mục tiêu:** Phân loại KEEP / SALVAGE / REBUILD / RETIRE-LATER cho từng mô phỏng

---

## Phân loại theo bài

### B21 — Cấu trúc hạt nhân

**Hiện trạng:**
- File: `RutherfordActivity.tsx` (243 dòng), `rutherford-model.ts` (131 dòng)
- Vật lí: Coulomb cổ điển chính xác, công thức SGK tr. 91–92, CODATA 2022
- UI: SVG 2D animation, quỹ đạo tán xạ, tham số va chạm b (0–100 fm), động năng E (3–10 MeV)
- Inquiry: Dự đoán → chạy → so sánh → giải thích (2 câu hỏi lựa chọn)
- Nguồn: MIT OCW, NIST, IUPAC

**Thiếu theo yêu cầu Apparatus-First:**
- ❌ Không có thiết bị 3D: nguồn alpha, khe chuẩn trực, lá vàng, màn ZnS, kính hiển vi
- ❌ Không có registry linh kiện với tên tiếng Việt/Anh
- ❌ Không có camera: orbit / front / back / top / cutaway / exploded / instrument POV
- ❌ Không có tương tác: nhấp vào linh kiện → hiện tên + chức năng
- ❌ Không có histogram số đếm theo góc (chỉ có 2 quỹ đạo)

**Quyết định:** **SALVAGE physics engine + REBUILD apparatus 3D**
- Giữ nguyên `rutherford-model.ts` (Coulomb math chính xác)
- Xây mới: `RutherfordApparatusV3.tsx` — apparatus 3D + camera + registry
- Xây mới: `RutherfordPhysicsEngine.ts` — tách physics khỏi UI, sinh histogram
- Tái sử dụng: inquiry questions, sources, limits

---

### B22 — Phản ứng hạt nhân và năng lượng liên kết

**Hiện trạng:**
- File: `GuidedFissionLab.tsx`, `FissionScene.tsx`, `fission-model.ts`
- Vật lí: U-235 + n → Y-95 + I-138 + 3n, bảo toàn A=236, Z=92, AME2020
- UI: Minh họa kênh phân hạch, tọa độ chuyển động quy ước
- Giới hạn: Hoạt ảnh không dự đoán phân bố sản phẩm thật

**Thiếu:**
- ❌ Không có phổ kế khối 3D (ion source, acceleration, magnetic sector, detector)
- ❌ Không có phòng phân tích năng lượng liên kết với apparatus
- ❌ Chỉ có animation, không có thiết bị đo

**Quyết định:** **SALVAGE physics + REBUILD mass spectrometer concept 3D**
- Giữ: `fission-model.ts` — cân bằng A/Z, Q
- Xây mới: `MassSpectrometerV3.tsx` — apparatus khái niệm, không phải máy thật
- Ghi rõ: đây là khái niệm giáo dục, đo khối lượng suy ra năng lượng liên kết

---

### B23 — Hiện tượng phóng xạ

**Hiện trạng:**
- File: `radioactive-decay-model.ts`, `DecayProcessLab.tsx`, `CloudChamberView.tsx`, `RadiationTypesExplorer.tsx`
- Vật lí: Tuổi thọ mũ độc lập có seed, kỳ vọng `N₀ exp(−λt)`
- UI: Có 3D scatter plot `HalfLifeScene`, inquiry questions
- Đã có: pilot `/hoc-lieu/thi-nghiem-ban-ra`, snapshot, analytics

**Thiếu:**
- ❌ Không có thiết bị Geiger–Müller 3D (ống GM, đếm, nguồn, chắn)
- ❌ Không có buồng mây Wilson 3D (thân buồng, đế lạnh, vệt hạt)
- ❌ Không có phổ kế gamma 3D (tinh thể NaI, PMT, MCA, phổ năng lượng)
- ❌ Không có phòng đo bán rã với thiết bị rõ ràng

**Quyết định:** **KEEP physics engine + BUILD radiation lab stations**
- Giữ: `radioactive-decay-model.ts`, seed/timeline logic
- Xây mới: 
  - `GeigerMullerStation.tsx` — ống GM 3D + đếm + chắn
  - `CloudChamberStation.tsx` — buồng 3D + cutaway + vệt quan sát
  - `GammaSpectrometerStation.tsx` — tinh thể + PMT + phổ (khái niệm)
  - `HalfLifeStation.tsx` — phòng đo có apparatus

---

### B24 — Công nghiệp hạt nhân

**Hiện trạng:**
- File: `reactor-model.ts`, `B24Activities.tsx`
- Vật lí: Sơ đồ 5 đoạn (lõi → sinh hơi → tua-bin → máy phát → ngưng), k quy ước
- UI: Diagram 2D, không có 3D

**Thiếu:**
- ❌ Không có mô hình lò nghiên cứu 3D
- ❌ Không có các bộ phận: fuel elements, control rods, moderator, coolant, reflector, shielding
- ❌ Không có cutaway, exploded view

**Quyết định:** **SALVAGE energy flow + BUILD research reactor 3D**
- Giữ: sơ đồ năng lượng 5 đoạn, k định tính
- Xây mới: `ResearchReactorV3.tsx` — apparatus giáo dục, không phải nhà máy
- Ghi rõ: mô hình giáo dục, không phải vận hành thực

---

### B25 — Bài tập vật lí hạt nhân

**Hiện trạng:**
- File: `B25DataProcessLab.tsx`, `sgk-b25-decay.ts`, `sgk-b25-table-25-1.json`
- Vật lí: Bảng 25.1 SGK, nội suy hoạt độ
- UI: Bảng và đồ thị

**Thiếu:**
- ❌ Không có phòng phân tích 3D
- ❌ Thiết bị chỉ là đồ thị, không có apparatus

**Quyết định:** **KEEP data + BUILD analysis console**
- Giữ: Bảng 25.1, physics calculations
- Xây mới: `NuclearAnalysisConsole.tsx` — console 3D tái sử dụng dữ liệu các bài trước
- Chỉ dùng 3D khi có ý nghĩa sư phạm

---

## Tóm tắt phân loại

| Bài | Physics Engine | UI 3D | Quyết định |
|-----|----------------|-------|------------|
| B21 | KEEP `rutherford-model.ts` | REBUILD apparatus | SALVAGE |
| B22 | KEEP `fission-model.ts` | BUILD mass spec concept | SALVAGE |
| B23 | KEEP `decay-model.ts` | BUILD 4 lab stations | KEEP + BUILD |
| B24 | KEEP energy flow | BUILD reactor 3D | SALVAGE |
| B25 | KEEP data | BUILD analysis console | KEEP + BUILD |

**Không xóa mô phỏng cũ** cho đến khi bản V3 được nghiệm thu.

---

## Kiến trúc chung apparatus V3

Tạo framework tái sử dụng:

```
src/simulations-v3/
├── core/
│   ├── ApparatusScene.ts         # Three.js scene wrapper
│   ├── CameraPresets.ts          # orbit/front/top/cutaway/exploded/instrument
│   ├── ComponentRegistry.ts      # partId → { nameVi, nameEn, role }
│   ├── PhysicsContract.ts        # interface physics ↔ 3D
│   └── types.ts
├── apparatus/
│   ├── rutherford/
│   │   ├── RutherfordApparatus3D.ts
│   │   └── parts.ts              # alpha source, collimator, foil, screen, microscope
│   ├── mass-spec/ (concept only)
│   ├── radiation-lab/
│   │   ├── GeigerMuller3D.ts
│   │   ├── CloudChamber3D.ts
│   │   ├── GammaSpec3D.ts
│   │   └── HalfLifeLab3D.ts
│   ├── reactor/ (education model)
│   └── analysis-console/
└── physics/
    ├── rutherford-engine.ts      # histogram, detector angle bins
    ├── decay-engine.ts            # reuse existing
    ├── fission-engine.ts          # reuse existing
    └── reactor-engine.ts          # k factor, qualitative
```

**Stack:**
- Vanilla Three.js 0.186.1 (đã có)
- OrbitControls (có sẵn trong Three)
- No R3F/Drei (tránh phát sinh chi phí + peer deps chưa kiểm chứng)
- Blender GLB nếu cần asset phức tạp (sau)

**Contracts:**
- Physics engine: pure functions, no React, no Three
- `state + action → state`
- Scene 3D nhận state, render, không tự sinh dữ liệu
- Dùng chung state → histogram, table, chart, 3D đồng bộ

---

## Xác minh thiết bị B21 Rutherford

Theo yêu cầu Master Prompt: **"Thí nghiệm này sử dụng thiết bị gì? Có tồn tại ngoài đời không?"**

### Thí nghiệm Geiger–Marsden (1909–1913)

**Thiết bị lịch sử:**
1. **Nguồn phát hạt alpha** — radium hoặc radon trong hộp chì
2. **Khe chuẩn trực (collimator)** — chắn chì với lỗ hẹp tạo chùm hạt song song
3. **Lá vàng mỏng** — độ dày ~400 nm (~1000 lớp nguyên tử)
4. **Màn phát quang ZnS** — zinc sulfide phủ bạc, phát sáng khi hạt alpha chạm
5. **Kính hiển vi** — xoay quanh màn để đếm ánh sáng lóe
6. **Thang đo góc** — đo vị trí kính hiển vi
7. **Buồng tối** — giảm tán xạ không khí (vacuum không bắt buộc trong setup đầu)

**Nguồn:**
- Geiger, H., & Marsden, E. (1909). *On a Diffuse Reflection of the α-Particles*. Proceedings of the Royal Society A, 82(557), 495–500.
- Rutherford, E. (1911). *The Scattering of α and β Particles by Matter and the Structure of the Atom*. Philosophical Magazine, 21(125), 669–688.
- Giancoli, D. C. (2014). *Physics for Scientists and Engineers*. Pearson. (mô tả setup)

**Thiết bị hiện đại (giáo dục):**
- Nguồn: Am-241 (trong detector khói) hoặc Po-210
- Detector: Semiconductor hoặc scintillator + PMT
- Vacuum chamber (áp suất thấp)
- Góc đo từ platform xoay tự động

**Mô phỏng V3 cần:**
- 3D model **khái niệm** thiết bị Geiger–Marsden lịch sử
- Phân biệt: thiết bị nguyên bản vs. phục dựng giáo dục
- Registry linh kiện với tên tiếng Việt/Anh
- Camera: xem từ nguồn, từ trên, cutaway, exploded view, qua kính hiển vi POV
- **GHI RÕ:** mô hình quy ước kích thước/tỉ lệ, không phải ảnh thật

---

## Bước tiếp theo

1. ✅ Audit hoàn thành
2. ⏳ Xác minh thiết bị Rutherford (đã ghi nguồn)
3. ⏳ Thiết kế kiến trúc `simulations-v3/`
4. ⏳ Xây Rutherford Apparatus V3 prototype
5. ⏳ Unit test physics engine
6. ⏳ Browser QA + screenshots
7. ⏳ Commit + báo cáo nghiệm thu

**Dừng sau Rutherford V3 để nghiệm thu.**

Co-Authored-By: Claude <noreply@anthropic.com>
