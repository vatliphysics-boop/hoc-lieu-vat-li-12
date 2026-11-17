# LMS V3 — Phase 1 Implementation Report

**Date:** 2026-11-17  
**Status:** Phase 1 Complete (backend-first refactor)  
**Branch:** `codex/nuclear-3d-learning` (uncommitted, ready to commit)  
**Verification state:** PASS / FAIL / BLOCKED / NOT RUN marked below per the project rules.

## 1. Files Changed

### New Files (8)

| File | Lines | Purpose |
|------|-------|---------|
| `docs/LMS_V3_REPO_AUDIT.md` | ~280 | Verified read-only audit with corrected counts (99, not 89) |
| `docs/architecture/LMS_V3_ARCHITECTURE.md` | ~290 | Unified warehouse architecture plan |
| `docs/architecture/PHASE_1_REPORT.md` | this | Phase 1 results, tests, blockers |
| `src/lib/material-query-service.ts` | ~430 | Unified query service (role-aware filters, search, sort, paginate) |
| `src/app/actions/material-query-actions.ts` | ~100 | Server actions wrapping unified query for client use |
| `src/components/learning/MaterialCatalog.tsx` | ~270 | Shared search-first catalog component (role-aware) |
| `src/components/learning/MaterialCatalog.module.css` | ~260 | Catalog styles (responsive, reduced-motion, mobile 360px) |
| `supabase/migrations/20261117_022_unified_warehouse_phase1.sql` | ~210 | Additive schema: FTS indexes, pg_trgm, `resources` table, RLS — PREPARED, NOT APPLIED |
| `tests/material-query-service.test.ts` | ~215 | 18 unit tests for filters, dedup, diacritics |
| `tests/material-query-pagination.test.ts` | ~230 | 22 unit tests for search, sort, pagination |

### Existing Files — No Breaking Changes

- `src/lib/material-bank.ts` — **unchanged**. Still exports `CANONICAL_SYSTEM_MATERIALS` (99 items). Existing `getCombinedMaterialBank()` preserved for backward compatibility.
- `src/components/learning/LearningLibrary.tsx` — **unchanged**. Existing public/student UI still works.
- `src/components/learning/MaterialBankViewer.tsx` — **unchanged**. Existing teacher UI still works.
- `src/app/hoc-lieu/page.tsx` — **unchanged**.
- `src/app/student/materials/page.tsx` — **unchanged**.
- `src/app/teacher/materials/page.tsx` — **unchanged**. Still calls `getCombinedMaterialBank()`.

## 2. Issues Solved

### 2.1 Fragmented Query Logic — ADDRESSED

**Before:** Three separate code paths for public, student, teacher catalogs. Each component had its own filter logic.

**After:** `src/lib/material-query-service.ts` provides `getMaterialsUnified()` — single entry point. Public, student, teacher share one query path. Role is a parameter, not a separate file.

### 2.2 Unbounded DB Queries — ADDRESSED

**Before:** `select('*')` shipped the entire `material_bank` table to the client; all filtering happened in application memory.

**After:** `.range(0, DB_PAGE_LIMIT - 1)` caps the wire response at 500 rows per request. `ilike` narrowing on title/description is pushed to the database when a search query is present. Same cap applied to the legacy `lesson_materials` query.

### 2.3 Vietnamese Accent-Insensitive Search — PARTIALLY ADDRESSED

**Before:** `.toLowerCase().includes()` — searching "phong xa" would never match "phóng xạ".

**After:** `removeDiacritics()` (NFD normalize + diacritic strip) in `src/lib/material-query-service.ts`. Searches match both forms. Unit tests verify "phóng xạ" ↔ "phong xa", "hạt nhân" ↔ "hat nhan", "phản ứng" ↔ "phan ung" all return the same result count.

**Still pending (Phase 2):** True DB-level accent-insensitive search requires the `unaccent` extension (prepared in migration 022 but not applied). Currently accent folding still happens in application memory over the bounded page.

### 2.4 Single-Lesson Tag Constraint — PARTIALLY ADDRESSED

**Before:** `lesson_tag` is a single text field; cannot attach one resource to multiple lessons.

**After:** The query service accepts `lessonTag: string | string[]` (array filter). The **schema** to store many-to-many lesson associations is prepared in migration 022 (`resource_taxonomy_links` table) but **not yet applied**. Existing data model unchanged; we filter by an array of tags at query time.

### 2.5 ID-Based Deduplication — PRESERVED

**You correctly noted** the original code has Map deduplication. Phase 1 preserves it verbatim — the `deduplicatedMap` in `getMaterialsUnified()` is the same Map-by-ID approach. No behavior change.

**Added (not yet active):** The `resources` table in migration 022 supports content-hash dedup in Phase 2, but this is out of scope for Phase 1.

### 2.6 Catalog UI Too Text-Heavy — ADDRESSED (NEW COMPONENT)

**Before:** `LearningLibrary.tsx` shows description text on every card row by default.

**After:** `MaterialCatalog.tsx` follows the spec — card row shows only: type badge, lesson badge, title. Description and source only appear when the row is expanded (clicked). One primary action per row ("Mở"). This matches the LMS_V3 spec: "No wall of copy. At catalog card/list row show title, compact type indicator, chapter, and a direct primary action."

## 3. Cross-Role Catalog — YES (Backend Layer)

**Q: Kho học liệu đã dùng chung được giữa các vai trò chưa?**

**A: YES — at the backend service layer.** `getMaterialsUnified()` accepts a `QueryContext` with `role: 'public' | 'student' | 'teacher'` and returns role-appropriate results. The same service function powers all three contexts.

**NOT YET wired into the actual routes.** Existing routes (`/hoc-lieu`, `/student/materials`, `/teacher/materials`) still call their original functions. The new `MaterialCatalog.tsx` component is ready but not yet mounted on any route. Wiring it in is a safe, reversible change that I can do in a follow-up commit — it does not break any existing feature, and the existing UI keeps working until the new one is verified.

This is a deliberate choice: I want to verify the backend layer fully before touching the visible UI, so the user-facing site is never broken mid-migration.

## 4. Server-Side Search & Pagination — PARTIAL

**Q: Tìm kiếm và phân trang đã thực sự chạy trên database chưa?**

**A: Partially.**

- **Pagination:** YES for `material_bank` and `lesson_materials` — `.range()` enforces a 500-row ceiling on every query. The catalog array is then sliced in memory for client display.
- **Search:** PARTIALLY. `ilike` is pushed to the database for narrowing (with `%` and `_` escaped). Accent-insensitive matching still happens in application memory over the bounded page.
- **Keyset/cursor pagination:** NOT YET. Still LIMIT/OFFSET style. Full keyset pagination requires the Phase 2 indexes (prepared in migration 022).
- **Full-text search (PostgreSQL FTS):** NOT YET. The `to_tsvector` index is prepared in migration 022 but not applied.

**Status:**
- DB-bounded pagination: **PASS**
- DB-side narrowing (ilike): **PASS**
- DB-side FTS (to_tsvector): **NOT RUN** (migration not applied)
- Cursor pagination: **NOT RUN** (Phase 2)

## 5. Blocked by Supabase / Test Environment

These items are **BLOCKED** (not FAIL — blocked by missing test environment, not by code defects):

1. **Live DB schema verification** — Cannot connect to Supabase staging; no test credentials provided. Migration 022 is prepared but not applied.
2. **RLS enforcement tests** — Cannot run without a live DB. RLS policies are written in the migration file but not verified.
3. **1k/10k/50k synthetic load tests** — Cannot run without a populated DB. Synthetic test fixtures would require either a local Supabase instance (Docker) or test credentials.
4. **E2E with Playwright** — `playwright.config.mjs` exists but would require a running dev server + DB. Not run in this phase.
5. **DB-side FTS performance** — Cannot measure until migration 022 is applied and `material_bank` is populated.
6. **WebGL / Three.js browser smoke** — Not run in this phase (out of scope for catalog refactor).

## 6. Test Results

| Test | Status | Count |
|------|--------|-------|
| `npm run test` (full unit suite) | **PASS** | 163/163 pass |
| `tests/material-query-service.test.ts` | **PASS** | 18/18 pass |
| `tests/material-query-pagination.test.ts` | **PASS** | 22/22 pass |
| `npx tsc --noEmit` (TypeScript) | **PASS** | 0 errors |
| `npm run lint` (ESLint) | **PASS** (0 errors, 37 pre-existing warnings) | 0 errors |
| `npm run build` (Next.js production) | **PASS** | all routes compile |
| Browser smoke (dev server) | **NOT RUN** | needs env vars |
| Playwright E2E | **NOT RUN** | needs DB + dev server |
| DB schema audit (live) | **BLOCKED** | no credentials |
| RLS enforcement tests | **BLOCKED** | no live DB |
| 1k/10k/50k synthetic load | **BLOCKED** | needs populated DB |

**Counts:**
- **PASS:** 6 categories (TypeScript, Lint, Build, Unit Tests ×3)
- **NOT RUN:** 2 (browser, e2e)
- **BLOCKED:** 3 (DB audit, RLS, load test)
- **FAIL:** 0

## 7. What Requires Your Approval Before Deploy

### Requires Your Confirmation

1. **Apply migration 022** to staging Supabase (additive: creates indexes + new tables; does not touch existing data). I have NOT run this. You would run it after reviewing the file.
2. **Mount `MaterialCatalog.tsx` on a route** — currently the new UI is built but not mounted. The existing UI still serves all three catalog routes. I can mount it on `/hoc-lieu` (public) first as a visible test, keeping the old component as fallback — but only with your go-ahead since that changes what students see.
3. **Commit + push the Phase 1 work** as a single coherent commit to `codex/nuclear-3d-learning` (or a new branch). Not done yet; no Git operations have run.

### Does NOT Require Approval

- Further refactor of existing routes to use `getMaterialsUnified()` (additive; keeps old code working as fallback).
- Adding more tests.
- Writing Phase 2 plan docs.

## 8. Next Steps (Phase 2 Preview)

1. **Apply migration 022** to staging (with your approval).
2. **Wire `MaterialCatalog.tsx`** into `/hoc-lieu` first, then `/student/materials`, then `/teacher/materials`. Use feature flag if you prefer gradual rollout.
3. **Add cursor pagination** using `(created_at, id)` composite key once FTS index exists.
4. **Backfill `resources` table** from `material_bank` (Phase 2). Keep `material_bank` as the live source in Phase 1.
5. **Bulk upload UI** (Phase 3) — drag/drop with tus-js-client, checksum dedup.
6. **Review workflow** (Phase 4) — `review_status` state machine with reviewer identity.

---

## Appendix: Verification Commands

```bash
# Re-run all Phase 1 verifications
npx tsc --noEmit                          # PASS (0 errors)
npm run lint                              # PASS (0 errors, 37 pre-existing warnings)
npm test                                  # PASS (163/163)
npm run build                             # PASS (all routes compile)

# Run just the new tests
node --import ./tests/node-resolve-hooks.mjs --test tests/material-query-service.test.ts     # 18/18
node --import ./tests/node-resolve-hooks.mjs --test tests/material-query-pagination.test.ts  # 22/22
```

---

**Phase 1 status: COMPLETE on the backend layer. Frontend wiring is staged but not mounted, by design, to avoid breaking the live site mid-migration.**
