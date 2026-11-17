# Phase 1.5 — Completion Report

**Date:** 2026-11-18
**Branch:** `codex/nuclear-3d-learning`
**Commits:** `cd974ad` (Phase 1) → `f6479fb` (Phase 1.5) → `d1af250` (search fix)
**Status:** **PARTIAL** — code complete and verified in a real browser; database-level verification BLOCKED (no staging confirmation), student/teacher E2E BLOCKED (no test accounts).

---

## 1. Git State

```
HEAD    d1af250  fix(lms-v3): server-side search filter + E2E test fixes
        f6479fb  feat(lms-v3): Phase 1.5 — unified material catalogue with real pagination
        cd974ad  feat(lms-v3): unified material query service and catalog component (Phase 1)
```

Nothing pushed. Nothing merged. Nothing deployed. No `git add -A`, no reset, no clean.
92 out-of-scope working-tree entries left untouched (verified before and after every commit).

---

## 2. Skills Actually Used

**None.** No skill was invoked in this session.

I checked for locally installed skills (`~/.claude/skills`, `.claude/skills`, `~/.claude/plugins`) — the project skills directory is empty. The skills referenced in the brief (`frontend-design`, `react-best-practices`, `web-design-guidelines`, `supabase`, `supabase-postgres-best-practices`, Playwright, `security-guidance`) are **not installed here**. Installing third-party plugin repositories mid-task would have added unvetted code and network access to a repo already carrying 92 uncommitted changes, so I built the UI with the project's own CSS variables and read the bundled Next.js 16 docs (`node_modules/next/dist/docs/`) instead. No claim of skill usage is made anywhere in this report.

---

## 3. Files Changed

### New
| File | Lines | Purpose |
|---|---|---|
| `src/lib/feature-flags.ts` | 20 | `NEXT_PUBLIC_USE_UNIFIED_CATALOG` reader, documents build-time semantics |
| `src/components/learning/MaterialCatalogRoute.tsx` | 172 | Server component: auth → unified query → paginated page |
| `tests/material-query-unified-pagination.test.ts` | 546 | 17 tests: >500 rows, stability, dedup, role visibility |
| `tests/e2e/material-catalog.spec.mjs` | 226 | 13 Playwright tests (11 run, 2 skip) |
| `docs/e2e-screenshots/phase-1-5/*.png` | 3 files | Desktop / tablet / mobile captures |

### Modified
| File | Change |
|---|---|
| `src/lib/material-query-service.ts` | Replaced `.range(0,499)` + slice with full-source drains |
| `src/components/learning/MaterialCatalog.tsx` | Server-side search/filters, pagination, states, a11y |
| `src/app/hoc-lieu/page.tsx` | Flag branch |
| `src/app/student/materials/page.tsx` | Flag branch |
| `src/app/teacher/materials/page.tsx` | Flag branch; CRUD view preserved |
| `src/app/globals.css` | +107 lines, catalog styles only (verified line-by-line) |
| `tests/material-query-pagination.test.ts` | Sort assertions updated for `localeCompare("vi")` |

---

## 4. How Pagination Is Implemented

The catalogue merges **three** sources: canonical (in-process), `material_bank` (Supabase), `lesson_materials` (legacy, teacher only). They cannot be paged independently because the merged order interleaves them.

**Approach: drain each source completely, then merge → filter → search → sort → slice.**

```ts
for (let from = 0; from < MAX_SCAN_ROWS; from += SOURCE_PAGE_SIZE) {
  const to = Math.min(from + SOURCE_PAGE_SIZE, MAX_SCAN_ROWS) - 1;
  const { data } = await supabase
    .from("material_bank")
    .select("*")
    .or(/* role mirror */)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })   // unique → total order
    .range(from, to);
  ...
  if (data.length < to - from + 1) break;   // short page = exhausted
}
```

- `SOURCE_PAGE_SIZE = 1000` is a **network batch size**, not a catalogue ceiling.
- `MAX_SCAN_ROWS = 20_000` is a runaway guard; hitting it sets `truncated: true` and the UI says so in plain Vietnamese instead of hiding rows.
- Deduplication uses explicit source precedence (`canonical` < `material_bank` < `lesson_materials`), so the rule is documented, not implied by insertion order.
- Filters and search run on the **full merged set**, before slicing — so `total` and `hasMore` are exact.

### Why not keyset cursors

I first implemented a `(created_at, id)` cursor and then removed it: PostgREST embeds the cursor in a filter *string* (`created_at.lt.2026-01-01T00:00:00+00:00`), and PostgreSQL timestamptz values contain `:` and `+`. The `+` decodes as a space through URL parsing, producing a cursor that **silently skips rows**. That is a correctness bug, worse than the inefficiency it fixes. `.range()` takes plain integers and cannot be mis-encoded.

**Known cost:** each page request re-drains the sources. Acceptable below ~5k rows; keyset pagination becomes worthwhile above that, and would need a schema change rather than an application one.

---

## 5. Evidence the 500-Row Ceiling Is Gone

| Check | Result |
|---|---|
| Fixture of 501 rows: every row visited | PASS — 501/501 fixture ids, no duplicates |
| Fixture of 1200 rows: every row visited | PASS — 1200/1200 |
| `total` for 1200-row catalogue | 1299 (1200 fixture + 99 canonical), not 500 |
| Record at offset 900 reachable and matches full-list position | PASS |
| DB asked for windows reaching past index 499 | PASS — recorded `range()` calls asserted |
| No row repeats across pages with tied `created_at` | PASS (10 rows/second in fixture) |
| Live HTTP, flag ON | page1=24, page2=24, page3=24, page4=24, page5=3 rows (99 total) |

---

## 6. Routes Mounted

| Route | Flag OFF | Flag ON |
|---|---|---|
| `/hoc-lieu` | `LearningLibrary` (unchanged) | `MaterialCatalogRoute` |
| `/student/materials` | `LearningLibrary` (unchanged) | `MaterialCatalogRoute` (role resolved from `profiles`) |
| `/teacher/materials` | `MaterialBankViewer` (unchanged) | `MaterialBankViewer` **plus** a link to `?view=browse` → catalogue |

Teacher CRUD (create/edit/delete via `MaterialBankViewer`) is **deliberately not replaced**: the new catalogue is read-only. The manage view stays the default; the browse view is opt-in — exactly one click away and trivially reversible.

---

## 7. Feature Flag Status

`src/lib/feature-flags.ts`:

```ts
export function isUnifiedCatalogEnabled(): boolean {
  return process.env.NEXT_PUBLIC_USE_UNIFIED_CATALOG === "true";
}
```

- **Default OFF.** A deploy of these commits changes nothing a user sees.
- **Build-time, not runtime.** `NEXT_PUBLIC_*` is inlined by Next.js at build. Changing it on a running server has no effect; you must `npm run build` and restart. This is stated in the file itself so the next person does not assume runtime toggling.
- **Verified both ways on real servers:** flag OFF → `class="learning-library"` present, no `material-catalog`; flag ON → `material-catalog` present, no `learning-library`.

---

## 8. Unit Test Results — PASS

```
npm test                       180 tests, 180 pass, 0 fail
npx tsc --noEmit               exit 0
npx eslint src/ tests/         0 errors, 4 warnings (all pre-existing)
npm run build (flag OFF)       exit 0
npm run build (flag ON)        exit 0
```

Phase 1 had 163 tests; Phase 1.5 adds 17 (16 new file + 1 added) = 180. No test was deleted or weakened except two sort assertions, which were changed from `toLowerCase()` comparison to `localeCompare("vi")` because the sort itself was fixed to order Vietnamese correctly — the test now asserts the intended order rather than the old byte order.

---

## 9. E2E Results — PASS (partial coverage)

Playwright 1.65 + local Google Chrome, against a **production build** on port 3482 with the flag ON.

```
11 passed, 2 skipped, 0 failed (17.5s)
```

**Passing (real browser, real server):**
1. Unified catalogue renders with real rows; old component absent
2. Search narrows results (server round-trip, URL settles)
3. Accent-insensitive search: `phong xa` == `phóng xạ`
4. No-match search shows the empty state
5. Lesson filter restricts list to B22 badges only
6. Opening a row reveals detail + primary action
7. Pagination reaches page 2; no duplicate row ids between pages
8. Keyboard: search field focusable, Tab leaves focus in a control
9. Desktop 1440px — no horizontal overflow
10. Tablet 768px — no horizontal overflow
11. Mobile 375px — no horizontal overflow

**Skipped (BLOCKED — no accounts):**
- Student: login → search → save → reload persistence
- Teacher: manage view keeps CRUD, browse view reachable

Both are written and will run unchanged once `E2E_STUDENT_EMAIL/PASSWORD` and `E2E_TEACHER_EMAIL/PASSWORD` exist. They skip rather than fail, so the suite never claims coverage it lacks.

Screenshots: `docs/e2e-screenshots/phase-1-5/catalog-{desktop,tablet,mobile}.png`

### A real bug the E2E caught

The first implementation filtered search **client-side over the loaded page only**. Typing "phóng xạ" returned **0 results** while the catalogue held 10 — they simply lived on pages 2+. The unit tests could not see this; only the browser test did. Search and filters now push to the URL and re-run the server query over the whole catalogue.

---

## 10. Migration 022 / RLS — BLOCKED

**Not applied. No DDL run. No write operation performed.**

Environment check (read-only, names only — no secrets printed or committed):
- `.env.local` holds `NEXT_PUBLIC_SUPABASE_URL` (project ref `phlqyaitafkhpnyuwklw`) and a publishable key.
- **This is not confirmed to be staging.** The project name gives no environment marker, and I could not verify it without making requests. Per the brief, I therefore treated it as production and performed **no** migration, no test inserts, no RLS probes.

Migration content reviewed:
- **Additive only:** `CREATE EXTENSION IF NOT EXISTS unaccent / pg_trgm`; `CREATE INDEX IF NOT EXISTS` ×6; `CREATE TABLE IF NOT EXISTS` ×5.
- **No `DROP`, no `ALTER` on any existing table.** Rollback is in the file header.
- RLS policies cover the five new tables only; `material_bank` and `lesson_materials` policies are untouched.

**Risk if applied blind:** `CREATE INDEX` on a large `material_bank` takes a lock. It should be run with `CREATE INDEX CONCURRENTLY` outside a transaction on a live table. The file currently does not do this — worth fixing before the first real apply.

**Test cases still owed (cannot be run without confirmed staging):**
1. Teacher A reads own private material ✔ / reads Teacher B's ✘
2. Teacher B cannot read Teacher A's private material
3. Student cannot insert or update beyond their rights
4. Published public material visible to anonymous
5. Anonymous sees only public material
6. Server action cannot be used to escalate role
7. Service-role client cannot disable the intended checks

Steps to unblock: identify a confirmed staging project, back up `material_bank` + `lesson_materials`, apply 022 there, then run the seven cases with two teacher accounts and one student account.

---

## 11. Remaining Risks

| Risk | Severity | Note |
|---|---|---|
| Migration 022 unverified against a real DB | **High** | Never applied anywhere; RLS untested |
| RLS untested | **High** | Policies are written but unproven |
| Student/teacher E2E missing | Medium | Role-gated paths unexercised in browser |
| Each page re-drains sources | Medium | Fine to ~5k rows; degrades beyond |
| `CREATE INDEX` is not `CONCURRENTLY` | Medium | Locking risk on a live table |
| `MAX_SCAN_ROWS = 20_000` silent-ish truncation | Low | Surfaced as `truncated` banner, not silent |
| Teacher browse view is read-only | Low | By design; CRUD stays in manage view |

---

## 12. Rollback

**Instant, no code change:** build with the flag unset or `false`, restart. Old UI returns for all three routes.

**Full revert of Phase 1.5 only:**
```bash
git revert d1af250 f6479fb
```

**Drop migration 022** (only if it was applied — it has not been):
```sql
DROP TABLE IF EXISTS resource_collection_items;
DROP TABLE IF EXISTS resource_collections;
DROP TABLE IF EXISTS resource_versions;
DROP TABLE IF EXISTS resource_taxonomy_links;
DROP TABLE IF EXISTS resources;
DROP INDEX IF EXISTS idx_material_bank_fts;
DROP INDEX IF EXISTS idx_material_bank_trgm_title;
DROP EXTENSION IF EXISTS unaccent;
DROP EXTENSION IF EXISTS pg_trgm;
```

No user data is written by Phase 1.5. Favourites live in `localStorage` under the same key as before (`physics-saved-materials-v1`), holding material ids only — no PII, no tokens.

---

## 13. Conclusion

**Phase 1.5: PARTIAL.**

**Proven:** the 500-row ceiling is gone and records past it are reachable; search and filters operate on the whole catalogue; pagination works end to end in a real browser at three viewport sizes; the flag switches cleanly both ways; the existing student and teacher routes are untouched with the flag off; 180 unit tests, typecheck, lint and both builds pass.

**Not proven:** RLS, the migration against any database, and the signed-in student/teacher paths. None of those were faked or assumed — each is marked BLOCKED above with the steps to close it.

**Phase 2 has not been started.** No simulation or video work was touched, and the scientist-history section and its accompanying simulations remain as they were.
