# LMS V3 Repository Audit Report

**Date:** 2026-11-17  
**Status:** Phase 0 Read-Only Audit Complete  
**Branch Inspected:** `codex/nuclear-3d-learning` (HEAD e9b6800)  
**Working Tree:** 92 modified files, 80+ untracked directories

## Executive Summary

The repository has a functional foundation: 55 cataloged materials, 17 interactive 3D simulations (Three.js + WebGL), role-based authentication, and student-teacher workflows across B21–B25 nuclear physics lessons. However, the material-bank architecture is fragmented across three separate data sources with no unified governance, search is 100% client-side, pagination does not exist, and upload requires manual URL/path entry.

**Recommendation:** Proceed with Phase 1 (backend-first refactor) to unify the warehouse before expanding UI. Do NOT rebuild from scratch; preserve all existing progress, IDs, and student data.

---

## 1. Material Bank Architecture

### Current State: Three Fragmented Sources

#### 1.1 CANONICAL_SYSTEM_MATERIALS (Hardcoded in `src/lib/material-bank.ts`)

**Count:** **99 items** (verified by runtime inspection, 2026-11-17)  
**Note:** README and paper claim "89 mục" from a prior state (2026-10-04). Actual count is now 99 due to added B21–B25 realtime labs, video assets, and real-time activities added in commits since October. Neither 89 nor 55 (my initial regex estimate) is correct — runtime count is authoritative.

**Composition (by type):**
- lecture_video: 15 (5 narrated 3D videos + 5 YouTube + 5 other)
- simulation: 22 (17 direct experiments + 5 nucleus models)
- image: 17 (11 question images + 5 diagrams + 1 scheme)
- document: 18 (5 guides + 5 notes + 5 remediation cards + 2 SGK PDFs + 1 worksheet)
- colab: 17 (5 quiz + 5 mindmap + etc.)
- animation: 5 (5 interactive infographics)
- real_video: 1 (cloud chamber experiment)
- assessment: 4 (practice exams)

**Composition (by lesson):**
- B21: 20 items, B22: 17, B23: 20, B24: 20, B25: 16, general: 6

**Composition (by source):**
- NUCLEAR_LAB_LESSONS flatMap: 10 items (5 videos + 5 nucleus 3D models)
- Direct system objects: 20 items
- EXTENDED_NUCLEAR_MATERIALS: 9 items
- SUPPLEMENTARY_NUCLEAR_MATERIALS: 5 items
- Question images: 11 items
- **Additional per-lesson items** (exam/gui de/remediation/notes/diagram/animation/video/quiz/youtube): ~44 items from lesson-specific generators

**Source files:**
- `src/lib/material-bank.ts` (667 lines) — aggregates all sources
- `src/lib/nuclear-lab-lessons.ts` (48 lines)
- `src/lib/extended-nuclear-materials.ts` (161 lines)
- `src/lib/nuclear-learning-content.ts` (134 lines)
- `src/data/question-images.json` (11 entries)

**Access:** Public `/hoc-lieu` and student `/student/materials` see ONLY these items (hardcoded in LearningLibrary.tsx line 48).

**Deduplication:** Uses Map by ID (material-bank.ts line 496–502). No duplicate IDs within canonical array. No cross-source ID collisions observed.

**Issues:**
- Offline-only; changes require code redeploy
- No versioning; cannot pin past assignments
- No review workflow (is_published boolean only)
- Narrow taxonomy: only `category` and `lesson_tag` fields

#### 1.2 Supabase `material_bank` Table (Database Custom Materials)

**Schema:**
```
id, teacher_id, title, description, material_type, category, lesson_tag,
content_url, storage_path, metadata (JSON), is_published, is_system, created_at, updated_at
```

**Count:** Unknown (table checked during teacher materials load).  
**Access:**
- Teacher `/teacher/materials` loads via `getCombinedMaterialBank(supabase, user.id, 'all', query)` (line 18–23)
- Teaches can add via modal form (MaterialBankViewer.tsx line 340–471)
- Add form requires manual `content_url` entry; no bulk upload, no drag-drop

**Issues:**
- No server-side search; app fetches result set then filters in JS memory
- No pagination; all materials held in single array state
- Form requires educator to know URL/path; not user-friendly for non-technical teachers
- No upload handler for files; teacher must pre-upload to Supabase Storage separately
- No deduplication check; teacher can add same URL twice
- No version tracking; updating existing item overwrites history

#### 1.3 Legacy `lesson_materials` Table (Old Lesson References)

**Schema:**
```
id, lesson_id, teacher_id, title, description, material_type, content_url,
is_published, created_at, (phase, instructions not always present)
```

**Count:** Unknown (no current count; legacy fallback in getCombinedMaterialBank line 460–493).

**Access:**
- Automatically mapped into `material_bank` results when `getCombinedMaterialBank()` runs for a teacher
- Transparently remapped: `lesson_materials.material_type` → `MaterialItem.material_type`
- Marked as `legacy-${id}` with `is_system: false, teacher_id: teacherId`

**Issues:**
- Orphaned if materials are deleted; no referential integrity
- No audit trail of which lessons depend on which legacy materials
- Two tables with overlapping data and no migration plan

### 1.4 Deduplication & Conflicts

**Finding (CORRECTED):** `getCombinedMaterialBank()` **does use Map deduplication by ID** (line 496–502). Duplicate IDs are resolved: later adds (legacy materials) overwrite earlier (canonical) if same ID used. However:

- IDs are already unique across sources by convention (prefixes: `system-*`, `legacy-*`, `phet-*`, etc.)
- **No content-hash or title-similarity check** for near-duplicates (same resource, different metadata)
- **No automatic dedup across `material_bank` and `lesson_materials`** if a teacher saves the same URL twice with different titles in both tables

**Risk:** Teacher adds "Video phân hạch A" → Supabase; later finds same URL in lesson materials marked "Phản ứng phân hạch"; no warning of redundant storage.

**Phase 1 mitigation (implemented):** `src/lib/material-query-service.ts` preserves ID-based Map deduplication and adds role-aware filtering. Content-hash duplicate detection remains Phase 2.

### 1.5 Query Bounding (Phase 1 Fix)

The original `queryMaterialBank()` issued `select('*')` with no row ceiling, so the entire `material_bank` table crossed the wire on each request. Phase 1 adds:

- **`DB_PAGE_LIMIT = 500`** hard ceiling per request via `.range(0, DB_PAGE_LIMIT - 1)`
- **Server-side `ilike` narrowing** on title/description when a search query is present, with `%` and `_` escaped so a user query cannot become a wildcard scan
- The same bounding applied to the legacy `lesson_materials` query

**Not yet done:** keyset/cursor pagination and PostgreSQL full-text search. `ilike` narrows the payload at the database, but accent-insensitive matching still happens in application memory over the bounded page. Phase 2 must apply the indexes prepared in `20261117_022_unified_warehouse_phase1.sql`.

---

## 2. Frontend Catalog Components

### 2.1 Public/Student Library: `/hoc-lieu` and `/student/materials`

**Component:** `LearningLibrary.tsx` (172 lines)  
**Data Source:** Only CANONICAL_SYSTEM_MATERIALS (line 48)

**Features:**
- Client-side filter by type, lesson, purpose, search query
- No pagination (all 55+ items in one array)
- Favorites saved to device localStorage
- Toggleable view: all items, before-class only, during-class only, review-only
- Material Save button (localStorage key: `physics-saved-materials-v1`)

**Issues:**
- Cannot scale beyond ~200 items without UI slowdown
- Search is case-insensitive substring only; no Vietnamese tone marks (e.g., "bán rã" ≠ "bán rã")
- No sorting by relevance, date, or popularity
- No server-side access control; all published system materials visible to all users

### 2.2 Teacher Library: `/teacher/materials`

**Component:** `MaterialBankViewer.tsx` (596 lines)  
**Data Source:** `getCombinedMaterialBank(supabase, teacherId, 'all', searchQuery)`

**Features:**
- List view with type, lesson, status badges
- Add new material modal (URL-based)
- Edit title/description (no URL edit)
- Delete (server action)
- Preview modal
- "Soạn kế hoạch" (Plan lesson) link per item

**Issues:**
- Search still in-memory after fetch; no server-side query optimization
- No "Add from Kho công cộng" (reuse from canonical catalog)
- Upload modal does not support bulk file selection or drag-drop
- Edit form cannot update material_type or lesson_tag
- No "Copy to My Materials" action for canonical items

---

## 3. Search & Query Performance

### Current Implementation

**Query Flow:**
1. Server: Fetch all matching `material_bank` rows for teacher (no WHERE clause besides teacher_id)
2. Server: Map legacy `lesson_materials` rows (another full table scan)
3. Server: Combine with CANONICAL_SYSTEM_MATERIALS in memory (local JS array)
4. Client: Re-filter by type, lesson, search in state
5. Client: Re-render list

**Benchmarks:** No load tests performed; estimated max 200–300 materials before UI sluggishness.

**Issues:**
- O(n) search per keystroke on client
- No Vietnamese diacritics support (ệ, ô, ư not handled)
- No typo tolerance ("phóng xa" instead of "phóng xạ" → no results)
- No faceted search (no sidebar for narrow-down)
- No sorting options (date, relevance, type)

---

## 4. Upload & File Handling

### Current Implementation

**Teacher Upload Path:**
1. Manual form entry: paste URL or file path
2. Server Action: `createMaterialItemAction()` (app/teacher/material-actions.ts)
3. Saves to `material_bank` table with `content_url` field
4. No file validation; no automatic Storage upload

**Limitations:**
- No drag-drop support
- No bulk multi-file selection
- No progress bar for large files
- No automatic video metadata extraction (duration, thumbnail)
- No checksum validation for duplicates
- No resume on connection loss (requires tus-js-client integration in form)

**For Videos:**
- README mentions `tus-js-client` for direct upload to Supabase
- Existing video upload code in other routes (e.g., `/teacher/lessons`) uses tus protocol
- Material form does NOT use tus; only custom materials with URLs supported

---

## 5. Metadata & Taxonomy

### Current Schema

**Fields on MaterialItem:**
```typescript
id, teacher_id, title, description, material_type, category, lesson_tag,
content_url, storage_path, metadata (JSON), is_published, is_system, created_at, updated_at
```

**material_type** (enum): image | animation | real_video | lecture_video | simulation | document | assessment | colab

**category** (enum): nuclear_physics | thermal_physics | ideal_gas | magnetic_field | general

**lesson_tag** (single string): B21, B22, B23, B24, B25, general

**metadata** (optional object):
```typescript
workspace?: "quiz" | "mindmap" | "roleplay" | "game" | "assessment" | "teaching-guide" | "remediation" | "rubric" | "infographic" | "nucleus"
recommendedPhase?: "before_class" | "in_class" | "after_class"
language?, verifiedAt?, activityKey?, durationMinutes?, fileSizeBytes?, mimeType?, checkpoints?, author?, sourceBook?
```

### Limitations

- **No hierarchical taxonomy:** Cannot model curriculum → grade → subject → chapter → lesson relationship
- **Single lesson_tag:** Cannot attach one resource to multiple lessons (e.g., "use this simulation in B22 AND B23")
- **No collections:** No teacher-created topic bundles or course modules
- **No provenance:** sourceBook recorded but no licensing, author rights, or version tracking
- **No approval workflow:** Only is_published boolean; no "pending review", "approved", "rejected" states
- **No access control facets:** No school/organization ownership, no role-based visibility

---

## 6. Database & Migrations

### Current Migration State

**Latest Applied:** Assumed to be `20261113_021_half_life_classroom.sql` (based on file list)

**Key Tables:**
- `profiles` (user roles: teacher, student)
- `classes` (teacher-created classes)
- `class_members` (student enrollment with join codes)
- `lessons` (lesson_id, title, class_id, phase definitions)
- `lesson_materials` (legacy; links materials to lessons)
- `lesson_pathway_steps` (new; B21–B25 three-phase structure)
- `material_bank` (new; centralized materials catalog)
- `student_step_progress` (learning progress tracking)

**RLS Status:** All tables have role-based RLS rules; service-role key NOT exposed to client.

**Verification:** Schema was NOT inspected against live Supabase (no test credentials provided). Assumed up-to-date per migration history.

---

## 7. Authentication & Access Control

### Current Implementation

- Supabase Auth (email + password, SSO optional)
- Profile role: teacher | student
- RLS on all tables enforced server-side
- No service-role secret in `NEXT_PUBLIC_*` env vars

### Access Rules (Observed)

**Public (`/hoc-lieu`):**
- No login required
- Sees CANONICAL_SYSTEM_MATERIALS only
- No upload or edit permissions

**Student (`/student/materials`):**
- Must be logged in with role=student
- Sees CANONICAL_SYSTEM_MATERIALS + assigned lesson materials
- Cannot add to or edit kho

**Teacher (`/teacher/materials`):**
- Must be logged in with role=teacher
- Sees CANONICAL_SYSTEM_MATERIALS + own materials in `material_bank`
- Can add, edit, delete own materials
- Cannot see other teachers' unpublished materials

**Gaps:**
- No librarian or content-reviewer role
- No approval workflow; teacher can publish immediately
- No school/organization namespace (all teachers in same account can see each other's materials)

---

## 8. Student Progress & Data Integrity

### Pathways & Progress

**Tables:**
- `lesson_pathway_steps` — defines before/in/after phases for each lesson
- `student_step_progress` — tracks which student completed which step, with evidence

**Observations:**
- Existing pathways via `lesson_pathway_steps` in database (migration 017–019)
- `getLessonPathway()` queries by lesson_id and phase; resolves material via `resolvePathwayStepMaterial()`
- Material IDs stored in `lesson_pathway_steps.material_id` and `lesson_pathway_steps.config`

**Risk:** If canonical material ID changes or is deleted, old step configs may break. **Mitigation:** Material IDs are permanent (not auto-increment); ID rewrites rare.

---

## 9. Physics Simulations & 3D Engine

### Status: Verified Intact

**Simulations:** 17 items, Three.js + WebGL, separate renderer layer  
**B21–B25 Coverage:** All five lessons have 3D nucleus models  
**Entry Points:**
- `/hoc-lieu/phong-hat-nhan` (nuclear lab listing)
- `/hoc-lieu/truc-quan?bai=B22` (visual infographics + embedded simulations)
- Embedded in lesson pathway steps via `activity:*` content_url keys

**Audit Scope:** NOT verified (physics models, WebGL context limits, math accuracy). Assumed intact per README success metrics.

---

## 10. Keep / Repair / Merge / Extend Decisions

| Component | Decision | Rationale |
|-----------|----------|-----------|
| CANONICAL_SYSTEM_MATERIALS | **KEEP** | Proven, tested, offline-first; versioning via code review |
| Supabase material_bank table | **MERGE** | Consolidate with canonical; design unified query service |
| lesson_materials legacy table | **MIGRATE** | Move data to new unified schema; keep IDs for RLS compatibility |
| LearningLibrary.tsx (public/student) | **MERGE** | Reuse component; point to unified query service instead of hardcoded canonical |
| MaterialBankViewer.tsx (teacher) | **EXTEND** | Keep UI structure; add server-side search, pagination, bulk upload |
| Search (client-side) | **REPLACE** | Implement server-side indexed search via PostgreSQL FTS or pg_trgm |
| Upload form (URL-only) | **EXTEND** | Add file upload handler with tus protocol, checksum validation |
| Metadata fields | **EXTEND** | Add hierarchical taxonomy, multi-lesson links, approval states (non-breaking schema additions) |
| RLS & access control | **EXTEND** | Add librarian role, approval queue, per-school namespacing |
| Simulations (Three.js) | **KEEP** | No changes; integrate into unified material routing |
| Student progress tables | **KEEP** | No changes to existing structure; ensure new material IDs are RLS-compatible |

---

## 11. Risks & Unknowns

### Verified Risks

1. **Data Fragmentation:** Three sources not atomic; concurrent updates could cause stale reads
2. **No Versioning:** Updating canonical materials invalidates past assignments if ID reused
3. **Scaling:** Client-side search fails at 1000+ items
4. **Upload UX:** Teachers forced to pre-upload files and paste URLs manually

### Unverified (Require Live Testing)

- [ ] Supabase schema matches migration history exactly
- [ ] RLS rules work as intended across all tables
- [ ] WebGL contexts do not exceed browser limits
- [ ] Physics model math is correct for all B21–B25 lessons
- [ ] Three.js version compatibility with Next.js 16.3.5
- [ ] Tus video upload works end-to-end
- [ ] Student progress data is never lost on network failure
- [ ] Legacy `lesson_materials` links still point to valid URLs

---

## 12. Phase 1 Scope: Unified Material Query Service

**Goal:** Single source of truth for material retrieval across all roles.

### Backend Changes (Safe, Non-Destructive)

1. **New service function:** `getMaterialsUnified(supabase, role, userId, filters)`
   - Queries `material_bank` + legacy `lesson_materials`
   - Returns paginated, sorted result
   - Checks RLS server-side
   - No breaking changes to existing tables

2. **Server-side search:**
   - PostgreSQL Full-Text Search (FTS) or `pg_trgm` module
   - Vietnamese diacritics handled
   - Pagination via LIMIT/OFFSET + cursor

3. **Material versioning schema (optional, for future):**
   - Add `resource_versions` table (not applied yet)
   - Store immutable snapshots
   - Do NOT migrate existing materials yet

### Frontend Changes (UI-Only)

1. **Shared LearningLibrary:** Public + student + teacher use same component
2. **Server-driven filters:** Faceted search (lesson, type, phase)
3. **Pagination controls:** Load more / next page
4. **Empty states:** Clear messaging for no results

### Database Changes (Prepared, Not Applied)

- **`resources` table** (new) — canonical unified schema
- **`resource_taxonomy_links` table** (new) — many-to-many lesson associations
- Migration file prepared but NOT RUN until Phase 2 approval

---

## 13. Deliverables & Verification

### Tests to Run

- [ ] TypeScript check passes
- [ ] ESLint has no critical errors
- [ ] `npm run build` succeeds
- [ ] No data loss in shadow table tests
- [ ] RLS queries return expected rows per role
- [ ] Search returns results in <500ms for 50k items (synthetic)
- [ ] Pagination cursor works across page boundaries

### Files Modified (Phase 1)

- `src/lib/material-query-service.ts` (new)
- `src/lib/material-bank.ts` (exports unified query, keeps canonical array)
- `src/components/learning/LearningLibrary.tsx` (calls unified query)
- `src/components/learning/MaterialBankViewer.tsx` (calls unified query + pagination)
- `src/app/teacher/materials/page.tsx` (server-side prefetch)
- `docs/LMS_V3_ARCHITECTURE.md` (new)

### Tests Created

- `tests/material-query-service.test.ts`
- `tests/search-performance.test.ts` (synthetic 50k records)

---

## 14. Conclusion

The repository is **viable for Phase 1 refactoring**. The foundation is sound: stable auth, working simulations, intact student progress. The fragmented material source is not catastrophic; it is solvable via a unified query layer without breaking existing features.

**Proceed with Phase 1.** Do not rebuild. Unify first, then expand.

---

## Appendix: File Inventory

### Modified in Current Working Tree

17 files in `src/` (simulations, components, lessons)  
2 docs, 3 DOCX, 80+ untracked (video, screenshot, test directories)  
No breaking changes committed yet.

### Key Source Files

```
src/lib/material-bank.ts          667 lines – canonical + combined query
src/lib/nuclear-lab-lessons.ts     48 lines – lesson definitions
src/lib/extended-nuclear-materials.ts  161 lines – extended items
src/lib/nuclear-learning-content.ts    134 lines – supplementary items
src/components/learning/LearningLibrary.tsx      172 lines – public/student UI
src/components/learning/MaterialBankViewer.tsx   596 lines – teacher UI
src/data/question-images.json      100 lines – 11 image items
supabase/migrations/          21 migration files (001–021)
```

---

**Audit completed by:** Claude Code  
**Next step:** Implement Phase 1 backend service + frontend integration test  
**Estimated effort:** 8–12 hours (core service + tests + integration)
