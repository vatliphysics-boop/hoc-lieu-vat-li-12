# Báo cáo nghiệm thu — Rutherford Apparatus V3 Prototype

**Ngày:** 20/11/2026  
**Branch:** `feature/simulation-apparatus-v3`  
**Worktree:** `/Users/vodoandangkhoi/Documents/WEB_WORKING_24-09-sim-v3`  
**Baseline commit:** `e6bf6e6` (CHẶNG 2 — Hoàn thiện 12 trang hoạt động)

---

## Tóm tắt

Đã hoàn thành **prototype Rutherford Apparatus V3** — mô phỏng apparatus-first đầu tiên cho thí nghiệm Geiger–Marsden (1909–1913). Hệ thống tuân theo yêu cầu Master Prompt: thiết bị khoa học 3D, nhiều góc nhìn, registry linh kiện có tên tiếng Việt/Anh, physics engine độc lập, measurement data và inquiry questions.

---

## File đã tạo mới

### Kiến trúc core (4 files)

1. **`src/simulations-v3/core/types.ts`** (63 dòng)
   - Contracts chung: `CameraMode`, `ApparatusComponent`, `ComponentRegistry`, `PhysicsEngine`, `HistogramBin`, `ScientificSource`
   - Pure TypeScript, không phụ thuộc React/Three.js

2. **`src/simulations-v3/core/ComponentRegistry.ts`** (20 dòng)
   - Factory tạo registry từ danh sách component
   - `getById()`, `getByCategory()` cho lookup nhanh

3. **`src/simulations-v3/core/CameraPresets.ts`** (74 dòng)
   - 10 camera presets: orbit, front, back, left, right, top, cutaway, exploded, instrument, measurement
   - Localized names (Vietnamese + English)

### Physics engine (1 file)

4. **`src/simulations-v3/physics/rutherford-engine.ts`** (287 dòng)
   - **Pure functions** — no React, no Three.js, no DOM
   - Coulomb scattering chính xác, CODATA 2022 constants
   - `createRutherfordRun()`: computes trajectory from impact parameter + energy
   - `sampleRutherford()`: samples trajectory at given time (zeptoseconds)
   - `rutherfordTrail()`: generates visualization points
   - **`generateRutherfordDistribution()`**: histogram theo công thức 1/sin⁴(θ/2) — phân bố góc tán xạ Geiger–Marsden
   - Tái sử dụng math từ `rutherford-model.ts` cũ (giữ physics đã kiểm chứng)

### Apparatus 3D (3 files)

5. **`src/simulations-v3/apparatus/rutherford/parts.ts`** (110 dòng)
   - Registry 10 components: alpha source, source housing, collimator, gold foil, foil holder, ZnS screen, rotating microscope, angular scale, vacuum chamber, base platform
   - Mỗi component có:
     - `nameVi`: tên tiếng Việt
     - `nameEn`: tên tiếng Anh
     - `role`: chức năng (Vietnamese)
     - `roleEn`: function (English, optional)
     - `category`: source / collimator / target / detector / structure / measurement
   - Nguồn: Geiger & Marsden (1909), Rutherford (1911)

6. **`src/simulations-v3/apparatus/rutherford/geometry.ts`** (310 dòng)
   - Three.js geometry builders cho từng component
   - Materials: brass, steel, lead, gold, glass, ZnS, dark metal, concrete
   - Scale: 1 Three.js unit = 10 fm (detector radius 180 fm = 7.5 units)
   - Coordinate system: origin at gold foil, +X = beam direction, +Y = up, +Z = lateral
   - Each builder returns `BuiltComponent` with mesh, metadata, originalPosition, originalRotation
   - **Builders:**
     - `buildAlphaSource()`: lead housing, internal brass capsule, aperture
     - `buildCollimator()`: lead plate with narrow slit
     - `buildGoldFoil()`: thin gold disc + brass holder ring
     - `buildScintillationScreen()`: ZnS annulus at detector radius
     - `buildRotatingMicroscope()`: barrel, eyepiece, objective lens, mounting arm
     - `buildAngularScale()`: protractor arc with tick marks every 30°
     - `buildVacuumChamber()`: transparent cylinder + brass flanges
     - `buildBasePlatform()`: concrete slab + support legs

7. **`src/simulations-v3/apparatus/rutherford/RutherfordApparatusV3.tsx`** (618 dòng)
   - **React component** kết nối physics engine + Three.js scene
   - **10 camera presets** with smooth transitions
   - **Exploded view**: offsets per component to show assembly
   - **Click-to-identify**: raycaster picks component → shows nameVi, nameEn, role
   - **Real-time physics**: animation loop updates trail from `sampleRutherford()`
   - **Controls**: impact parameter b (0–100 fm), energy E (3–10 MeV), run/pause/reset
   - **Measurements**: scattering angle, detector angle, closest approach, elapsed time
   - **Histogram**: displays pre-generated 1/sin⁴(θ/2) distribution (1000 events)
   - **Lighting**: ambient + 3 directional lights (key, fill, rim)
   - **Grid and ground** for spatial reference
   - Cleanup: disposes renderer, geometries, materials on unmount

### Tests (1 file)

8. **`tests/rutherford-v3.test.ts`** (252 dòng)
   - **20 test cases** using Node's native test runner
   - Physics engine:
     - Valid/invalid parameter ranges
     - Sample at start/middle/end
     - Out-of-range time clamps correctly
     - Trail generation
     - Scattering angle increases as impact decreases (fixed energy)
     - Scattering angle decreases as energy increases (fixed impact)
     - Closest approach shrinks with higher energy
     - Head-on collision (b→0 gives θ→180°)
     - Grazing trajectory (large b gives small θ)
     - Trajectory smoothness (no NaN/Infinity)
   - Histogram:
     - Correct total count
     - 1/sin⁴(θ/2) falloff (small angles have more events)
     - Same seed gives same result
     - Different seed gives different result
   - Registry:
     - Expected components present
     - Localized names exist
     - Category filtering works
   - Camera presets:
     - All 10 modes present
     - Preset lookup works
     - Localized names returned

### Demo route (1 file)

9. **`src/app/demo-rutherford-v3/page.tsx`** (80 dòng)
   - Demo page at `/demo-rutherford-v3`
   - Lazy-loads the 3D component
   - Metadata, suspense fallback
   - Describes apparatus-first features
   - Lists scientific sources
   - States model limitations

### Documentation (1 file)

10. **`docs/apparatus-v3/AUDIT_B21_B25.md`** (247 dòng)
    - Audit results: classification KEEP/SALVAGE/REBUILD for B21–B25
    - Equipment verification: Geiger–Marsden (1909–1913) apparatus
    - Architecture design: `simulations-v3/` structure
    - Decision log: vanilla Three.js (not R3F), no cost, no peer deps

---

## Thiết bị đã xác minh

**Geiger–Marsden experimental setup (1909–1913):**
- Alpha particle source (radium/radon in lead housing)
- Collimator slit (narrow aperture)
- Gold foil target (~400 nm thickness)
- ZnS scintillation screen
- Rotating microscope
- Angular scale
- Vacuum/dark chamber (optional in original)

**Nguồn khoa học:**
- Geiger, H., & Marsden, E. (1909). *On a Diffuse Reflection of the α-Particles*. Proceedings of the Royal Society A, 82(557), 495–500.
- Rutherford, E. (1911). *The Scattering of α and β Particles by Matter and the Structure of the Atom*. Philosophical Magazine, 21(125), 669–688.
- CODATA 2022 (NIST)

---

## Tính năng apparatus-first đã triển khai

✅ **Thiết bị 3D với cấu tạo:**
- 10 components với geometry chi tiết
- Materials phù hợp (brass, lead, gold, glass, ZnS)
- Scale quy ước rõ ràng (1 unit = 10 fm)

✅ **Registry linh kiện:**
- Tên tiếng Việt + tiếng Anh cho mỗi bộ phận
- Role description (chức năng trong thí nghiệm)
- Category filtering

✅ **10 camera presets:**
- Orbit (free rotation)
- Front / Back / Left / Right / Top
- Cutaway (cross-section, sẵn sàng ẩn một phần vỏ)
- Exploded (các bộ phận tách ra)
- Instrument POV (góc nhìn qua kính hiển vi)
- Measurement (góc đọc số liệu)

✅ **Click-to-identify:**
- Raycasting picks component on click
- Shows nameVi, nameEn, role in overlay

✅ **Physics engine độc lập:**
- Pure functions, no React/Three.js in physics layer
- Coulomb scattering chính xác (CODATA 2022)
- Trajectory sampling without numerical time-stepping (analytic inversion)

✅ **Measurement data:**
- Scattering angle θ (degrees)
- Detector angle (position on screen)
- Closest approach distance (fm)
- Elapsed model time (zs)

✅ **Angular histogram:**
- Distribution theo 1/sin⁴(θ/2) — Rutherford cross-section
- Seeded RNG for reproducibility
- Visualizes the Geiger–Marsden result: most particles at small angles

✅ **Interactive controls:**
- Impact parameter b: 0–100 fm (slider)
- Energy E: 3–10 MeV (slider)
- Run / Pause / Reset
- Show/hide beam trail

✅ **Inquiry-ready:**
- Students can predict angle before running
- Compare different parameters
- Observe that small b → large θ, high E → small θ
- Histogram shows why "very few particles scatter at large angles" is evidence for small, dense nucleus

✅ **Scientific sources cited:**
- In code comments (CODATA, Geiger, Rutherford)
- In demo page UI

✅ **Model limitations stated:**
- Classical Coulomb model
- Fixed gold nucleus (no recoil)
- Electron ignored
- No nuclear interactions
- Scale and proportions are educational convention, not real photos

---

## Kiểm thử đã thực hiện

### Unit tests (20 cases)
- **Physics correctness**: angles, distances, trajectory smoothness
- **Edge cases**: head-on collision, grazing, out-of-range parameters
- **Determinism**: same seed → same result
- **Registry**: component lookup, category filtering
- **Camera presets**: all modes present, localized names

**Chưa chạy được** do Bash classifier timeout — nhưng cấu trúc test đã viết, sẵn sàng cho:
```bash
npm test
```

### TypeScript compilation
**Chưa chạy được** do Bash timeout — nhưng dự kiến pass với:
```bash
npx tsc --noEmit
```

### Build verification
**Chưa chạy được** — dự kiến:
```bash
npm run build
```

### Browser QA (Playwright)
**Chưa thực hiện** — chưa có time do context gần đầy.

Kế hoạch Playwright:
1. Navigate to `/demo-rutherford-v3`
2. Wait for canvas load
3. Click each camera preset button
4. Click on apparatus components
5. Verify component info overlay appears
6. Adjust sliders (impact parameter, energy)
7. Click Run → verify trail animates
8. Take screenshots of each camera mode
9. Verify histogram renders

---

## Chức năng chưa hoàn thành

❌ **Cutaway rendering:**
- Camera preset "Cắt lớp" đã có
- Geometry builders đã có
- **Chưa implement:** ClippingPlane logic để ẩn nửa vacuum chamber khi ở chế độ cutaway
- Cần thêm: `renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)]` khi `cameraMode === "cutaway"`

❌ **Exploded view animation:**
- Offsets đã định nghĩa
- Position updates đã có
- **Chưa smooth:** không có tween/transition giữa collapsed ↔ exploded
- Có thể cải thiện: dùng lerp trong animation loop

❌ **Instrument POV rendering:**
- Camera preset "instrument" đã có vị trí
- **Chưa customize:** không có custom FOV hoặc post-processing để mô phỏng kính hiển vi thực
- Hiện tại chỉ là camera thường ở vị trí kính hiển vi

❌ **Multiple particle trails:**
- Hiện chỉ 1 trajectory animation
- **Chưa có:** chạy nhiều hạt đồng thời với impact parameters khác nhau để sinh histogram động
- Có thể mở rộng: array of `{settings, elapsedZs}`, render nhiều trails cùng lúc

❌ **Histogram từ simulation thực:**
- Hiện dùng pre-generated histogram (`generateRutherfordDistribution()`)
- **Chưa có:** thu thập sự kiện từ các lượt chạy thực tế và cập nhật histogram động
- Cần: `addEvent(angleDeg)` → update bins

❌ **Audio cues:**
- Không có âm thanh khi hạt chạm màn ZnS
- Có thể thêm: Web Audio API, tần suất click tăng khi nhiều hạt

❌ **Accessibility (ARIA):**
- Canvas không có ARIA labels đầy đủ
- Component overlay có text nhưng chưa có live region
- Cần: `aria-live="polite"` cho measurement updates

❌ **Responsive mobile:**
- OrbitControls hỗ trợ touch
- **Chưa test:** layout trên màn hình nhỏ (<768px)
- Camera preset buttons có thể wrap nhưng chưa optimize cho mobile

❌ **Performance optimization:**
- Chưa có LOD (Level of Detail) cho geometry
- Chưa có frustum culling optimization
- Chưa profile FPS trên low-end devices

---

## Verification status

| Item | Status | Notes |
|------|--------|-------|
| TypeScript compilation | ⏸ BLOCKED | Bash timeout, chưa chạy `tsc --noEmit` |
| Unit tests (20 cases) | ⏸ BLOCKED | Bash timeout, chưa chạy `npm test` |
| ESLint | ⏸ BLOCKED | Chưa chạy `npm run lint` |
| Build (Next.js) | ⏸ BLOCKED | Chưa chạy `npm run build` |
| Browser load | ⏸ NOT RUN | Chưa `npm run dev` + open `/demo-rutherford-v3` |
| Playwright E2E | ⏸ NOT RUN | Chưa viết spec file |
| Screenshots | ⏸ NOT RUN | Cần browser QA trước |

**Tất cả verification bị block bởi Bash classifier timeout.**

Khi Bash sẵn sàng lại, chạy tuần tự:
```bash
cd /Users/vodoandangkhoi/Documents/WEB_WORKING_24-09-sim-v3
npm test                  # 20 unit tests
npx tsc --noEmit          # TypeScript check
npm run lint              # ESLint
npm run build             # Production build
npm run dev               # Start server
```

Sau đó Playwright QA + screenshots.

---

## Công việc cũ (Arena/Worksheet) vẫn an toàn

**Xác nhận:** Thư mục gốc `/Users/vodoandangkhoi/Documents/WEB_WORKING_24-09` vẫn có **116 file untracked**, bao gồm:
- `src/lib/arena-game-engine.ts` (21 tests passing trước đó)
- `src/components/learning/ArenaGameShow.tsx`
- `tests/arena-game-engine.test.ts`
- Worksheet Studio files (chưa bắt đầu)

**Không bị mất** — worktree hoàn toàn tách biệt.

---

## Bước tiếp theo

**Nếu Bash khả dụng lại:**
1. Chạy `npm test` để verify 20 unit tests
2. Chạy `npx tsc --noEmit` để verify TypeScript
3. Chạy `npm run build` để verify production build
4. Chạy `npm run dev` + open `/demo-rutherford-v3` để test browser
5. Viết Playwright spec: `tests/e2e/rutherford-v3.spec.mjs`
6. Chạy Playwright + chụp 10 screenshots (các camera modes)
7. **Nếu tất cả pass:** commit với message:
   ```
   feat(apparatus-v3): Rutherford scattering 3D prototype
   
   APPARATUS-FIRST SIMULATION — Geiger–Marsden experiment reconstruction.
   
   Features:
   - 10 apparatus components with Vietnamese/English names
   - 10 camera presets (orbit, front, top, cutaway, exploded, instrument POV)
   - Click-to-identify component registry
   - Pure physics engine (CODATA 2022)
   - Angular histogram (1/sin⁴ distribution)
   - 20 unit tests covering physics correctness
   - Demo route at /demo-rutherford-v3
   
   References: Geiger & Marsden (1909), Rutherford (1911), CODATA 2022.
   
   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

8. **Sau commit:** báo cáo chi tiết + screenshots → **DỪNG để nghiệm thu**

**Nếu Bash vẫn block:**
- Dừng ở đây
- Báo cáo: "Prototype đã xây xong, chờ Bash khả dụng để verify"
- Không commit mã chưa test

---

## Kết luận

Prototype Rutherford Apparatus V3 đã hoàn thành về mặt code:
- ✅ Kiến trúc đúng yêu cầu (apparatus-first, physics tách UI)
- ✅ 10 components có registry đầy đủ
- ✅ 10 camera presets
- ✅ Physics engine chính xác (CODATA 2022)
- ✅ 20 unit tests (chưa chạy được)
- ✅ Demo route

**Chờ verification pass để commit.**

Co-Authored-By: Claude <noreply@anthropic.com>
