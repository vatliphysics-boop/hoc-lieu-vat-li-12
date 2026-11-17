# LMS V3 Architecture — Unified Material Warehouse

**Date:** 2026-11-17  
**Status:** Phase 1 Design Specification  
**Target:** Repository `vatliphysics-boop/flipped-physics-trial`

## 1. Architectural Principles

### 1.1 One Catalog, Many Contexts

- Store each resource **once** with a permanent, globally unique ID
- Link the same resource to multiple lessons, phases, classes, and collections
- No duplicate file storage; reuse by reference

### 1.2 Backward Compatibility

- Preserve all existing IDs (CANONICAL_SYSTEM_MATERIALS, `material_bank`, `lesson_materials`)
- Existing pathways, progress, and RLS rules continue to work
- Migration is additive; no destructive schema changes

### 1.3 Server-Side Authority

- Query, filter, paginate on PostgreSQL; ship only visible results to client
- Client does not hold entire catalog in memory
- RLS enforced at query time, not by hiding buttons

---

## 2. Unified Query Service

### 2.1 Single Entry Point

**Function:** `getMaterialsUnified(supabase, context, filters, pagination)`

**Context:**
```typescript
type QueryContext = {
  role: 'public' | 'student' | 'teacher' | 'librarian';
  userId?: string;
  classId?: string;
}
```

**Filters:**
```typescript
type MaterialFilters = {
  materialType?: MaterialType | MaterialType[];
  lessonTag?: string | string[];
  searchQuery?: string;
  phase?: 'before_class' | 'in_class' | 'after_class';
  publishedOnly?: boolean;
  ownedByMe?: boolean;
}
```

**Pagination:**
```typescript
type Pagination = {
  limit: number;       // default 20, max 100
  offset?: number;
  cursor?: string;     // for cursor-based pagination (future)
  sortBy?: 'relevance' | 'title' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}
```

**Returns:**
```typescript
type MaterialQueryResult = {
  items: MaterialItem[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}
```

### 2.2 Query Resolution Order

1. **Canonical System Materials** (always included, filtered by role)
   - Public: all published canonical items
   - Student: canonical + assigned lesson materials
   - Teacher: canonical + own materials + team materials
   - Librarian: all materials (future)

2. **Database Materials** (`material_bank` table)
   - RLS-filtered server-side
   - Joined with teacher profile for attribution

3. **Legacy Materials** (`lesson_materials` table)
   - Mapped transparently into MaterialItem shape
   - Marked with `legacy-` prefix on ID

4. **Deduplication**
   - By ID (existing Map logic preserved)
   - Content-hash dedup added (optional, Phase 2)

5. **Filtering**
   - PostgreSQL WHERE clauses for type, lesson, owner
   - Full-text search via `to_tsvector` + `to_tsquery` (Vietnamese support)
   - Phase filter via metadata JSONB query

6. **Sorting & Pagination**
   - Server-side ORDER BY
   - LIMIT/OFFSET for simple pagination
   - Cursor-based for large result sets (future)

---

## 3. Database Schema Extensions

### 3.1 Existing Tables (Preserved)

**`material_bank`** — current teacher-created materials  
**`lesson_materials`** — legacy lesson links  
**`lesson_pathway_steps`** — three-phase pathways

### 3.2 New Tables (Additive, Phase 2)

#### `resources` — Unified Material Registry

```sql
CREATE TABLE resources (
  id TEXT PRIMARY KEY,                     -- globally unique, immutable
  resource_type TEXT NOT NULL,             -- material_type enum
  title TEXT NOT NULL,
  description TEXT,
  
  -- Ownership & Visibility
  owner_id UUID REFERENCES profiles(id),   -- NULL for system resources
  organization_id UUID,                    -- future: school namespace
  visibility TEXT DEFAULT 'private',       -- 'public', 'organization', 'private'
  
  -- Content Location
  content_url TEXT NOT NULL,
  storage_path TEXT,                       -- Supabase Storage reference
  
  -- Provenance
  source_attribution TEXT,
  license TEXT,
  language TEXT DEFAULT 'vi',
  
  -- Review & Publishing
  review_status TEXT DEFAULT 'draft',      -- 'draft', 'submitted', 'approved', 'published', 'archived'
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CHECK (review_status IN ('draft', 'submitted', 'approved', 'published', 'archived')),
  CHECK (visibility IN ('public', 'organization', 'private'))
);

CREATE INDEX idx_resources_owner ON resources(owner_id);
CREATE INDEX idx_resources_type ON resources(resource_type);
CREATE INDEX idx_resources_status ON resources(review_status);
CREATE INDEX idx_resources_fts ON resources USING gin(to_tsvector('simple', title || ' ' || description));
```

#### `resource_taxonomy_links` — Many-to-Many Lesson Associations

```sql
CREATE TABLE resource_taxonomy_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  
  -- Hierarchical Taxonomy (flexible; not all required)
  education_level TEXT,          -- 'THPT'
  grade TEXT,                    -- '12'
  subject TEXT,                  -- 'Vật lí'
  curriculum TEXT,               -- 'KNTT'
  chapter TEXT,                  -- 'Chương 4'
  lesson TEXT,                   -- 'B21', 'B22', etc.
  concept TEXT,                  -- 'Cấu trúc hạt nhân', 'Phóng xạ'
  
  -- Learning Context
  recommended_phase TEXT,        -- 'before_class', 'in_class', 'after_class'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(resource_id, lesson, concept)
);

CREATE INDEX idx_taxonomy_resource ON resource_taxonomy_links(resource_id);
CREATE INDEX idx_taxonomy_lesson ON resource_taxonomy_links(lesson);
CREATE INDEX idx_taxonomy_concept ON resource_taxonomy_links(concept);
```

#### `resource_versions` — Immutable Version History

```sql
CREATE TABLE resource_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- Snapshot of content at this version
  title TEXT NOT NULL,
  description TEXT,
  content_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Version Metadata
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  change_summary TEXT,
  
  UNIQUE(resource_id, version_number)
);

CREATE INDEX idx_versions_resource ON resource_versions(resource_id, version_number DESC);
```

#### `resource_collections` — Teacher-Created Bundles

```sql
CREATE TABLE resource_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  visibility TEXT DEFAULT 'private',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE resource_collection_items (
  collection_id UUID REFERENCES resource_collections(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL,  -- can reference resources.id or legacy material_bank.id
  item_order INTEGER NOT NULL,
  PRIMARY KEY (collection_id, resource_id)
);
```

### 3.3 Migration Strategy

**Phase 1:** No schema changes; use existing tables + canonical array  
**Phase 2:** Add new tables; backfill `resources` with material_bank + canonical items  
**Phase 3:** Migrate lesson_pathway_steps to use resource_id references  
**Phase 4:** Deprecate direct lesson_materials usage (keep table for audit)

**Rollback Plan:**  
- New tables are independent; can be dropped without affecting existing data
- RLS on new tables copies existing material_bank rules
- Canonical array remains authoritative until explicit cutover

---

## 4. Search Implementation

### 4.1 Vietnamese Full-Text Search

**Option A: PostgreSQL `to_tsvector` with unaccent**

```sql
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Index
CREATE INDEX idx_materials_fts ON material_bank 
USING gin(to_tsvector('simple', unaccent(title || ' ' || description)));

-- Query
SELECT * FROM material_bank
WHERE to_tsvector('simple', unaccent(title || ' ' || description)) 
      @@ to_tsquery('simple', unaccent('phóng xạ'))
ORDER BY ts_rank(...) DESC
LIMIT 20 OFFSET 0;
```

**Option B: `pg_trgm` for trigram similarity**

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index
CREATE INDEX idx_materials_trgm ON material_bank 
USING gin(title gin_trgm_ops, description gin_trgm_ops);

-- Query with typo tolerance
SELECT *, similarity(title, 'phóng xa') AS sim
FROM material_bank
WHERE title % 'phóng xa' OR description % 'phóng xa'
ORDER BY sim DESC
LIMIT 20;
```

**Decision:** Start with Option A (unaccent + FTS); add trigram in Phase 2 for typo tolerance.

### 4.2 Faceted Filters

- **Material Type:** `WHERE material_type = ANY($1::text[])`
- **Lesson Tag:** `WHERE lesson_tag = ANY($2::text[])`
- **Phase:** `WHERE metadata->>'recommendedPhase' = $3`
- **Published:** `WHERE is_published = true`
- **Owner:** `WHERE teacher_id = $4 OR is_system = true`

### 4.3 Pagination

**Current (Phase 1):** LIMIT/OFFSET  
**Future (Phase 2):** Cursor-based via `created_at` + `id` composite key

---

## 5. Frontend Architecture

### 5.1 Shared Components

**`<MaterialCatalog />`** — universal material browser  
- Used by public, student, teacher with different query contexts
- Props: `role`, `userId`, `initialFilters`
- State: filters, pagination, selected item
- Fetches: calls `getMaterialsUnified()` server action

**`<MaterialCard />`** — display one material in list/grid  
- Compact: icon, title, type badge, lesson badge
- Actions: View, Add to Lesson, Save, Share (role-dependent)

**`<MaterialPreview />`** — full-screen or drawer preview  
- Renders content based on material_type
- Simulation: embed FixedPhysicsActivityRenderer
- Video: HTML5 player with checkpoints
- PDF: iframe or download link
- Document: mammoth.js converter

### 5.2 Route Consolidation

**Current:**
- `/hoc-lieu` — public catalog
- `/student/materials` — student catalog
- `/teacher/materials` — teacher catalog

**Phase 1:** Keep all three routes; unify backend only  
**Phase 2:** Redirect to `/materials?role=public|student|teacher` with shared component

---

## 6. Upload & Bulk Import

### 6.1 Teacher Upload Flow (Phase 2)

1. **Drag-Drop Zone**
   - Accept: PDF, DOCX, PNG, JPG, MP4, WEBM
   - Max: 50 files per batch, 500MB total

2. **File Processing**
   - Upload to Supabase Storage via tus-js-client
   - Generate checksum (SHA-256)
   - Extract metadata: MIME, size, duration (videos), dimensions (images)

3. **Duplicate Detection**
   - Query `resources` by checksum
   - If match: offer "Reuse existing" or "Upload as new version"

4. **Metadata Form**
   - Title, description (pre-filled via AI suggestion)
   - Material type (auto-detected)
   - Lesson tags (multi-select)
   - Phase recommendation

5. **Review & Publish**
   - Save as draft
   - Submit for review (if governance enabled)
   - Publish immediately (if teacher has permission)

### 6.2 AI Metadata Extraction (Optional)

- Extract title from PDF filename or first heading
- Suggest lesson tag via keyword matching ("hạt nhân" → B21–B25)
- Teacher must confirm before save

---

## 7. Permissions & RLS

### 7.1 Role Definitions

- **Public:** Unauthenticated users; read-only canonical materials
- **Student:** Authenticated; assigned lessons + canonical materials
- **Teacher:** Authenticated; own materials + canonical + published team materials
- **Librarian:** Future; review queue, approve/reject submissions
- **Admin:** Future; manage taxonomies, users, organizations

### 7.2 RLS Policies (Existing, Extended)

**`material_bank` SELECT:**
```sql
-- Public/Student: only published system materials
(is_system = true AND is_published = true)
OR
-- Teacher: own materials + system materials
(teacher_id = auth.uid() OR is_system = true)
```

**`material_bank` INSERT/UPDATE:**
```sql
teacher_id = auth.uid() AND 
EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
```

**`resources` SELECT (Phase 2):**
```sql
-- Public materials
(visibility = 'public' AND review_status = 'published')
OR
-- Own materials
(owner_id = auth.uid())
OR
-- Organization materials (future)
(visibility = 'organization' AND organization_id = current_user_organization())
```

---

## 8. Performance Targets

### 8.1 Query Performance

- **P50 Search Latency:** <300ms (20-item result set)
- **P95 Search Latency:** <800ms
- **Full-scan limit:** 10,000 materials indexed
- **Pagination overhead:** <50ms per page turn

### 8.2 Scalability Milestones

- **100 materials:** Current (canonical + teacher uploads)
- **1,000 materials:** Phase 1 target
- **10,000 materials:** Phase 2 indexed search required
- **50,000 materials:** Phase 3 Elasticsearch or Typesense

### 8.3 Client Performance

- **First Contentful Paint:** <1.5s
- **Time to Interactive:** <3s
- **Catalog page bundle:** <200KB compressed
- **Virtual scrolling:** Enabled for 100+ items

---

## 9. Testing Strategy

### 9.1 Unit Tests

- `material-query-service.test.ts` — query logic, filters, pagination
- `material-deduplication.test.ts` — ID collisions, content hashing
- `search-vietnamese.test.ts` — diacritics, tone marks

### 9.2 Integration Tests

- `catalog-access-control.test.ts` — RLS enforcement per role
- `upload-flow.test.ts` — file upload, metadata extraction, duplicate detection
- `pagination-stress.test.ts` — 10k synthetic materials, measure latency

### 9.3 Synthetic Load Test

**Dataset:** 10,000 materials, 80% documents, 15% videos, 5% simulations  
**Queries:** 100 concurrent search requests  
**Target:** P95 <2s, no OOM errors

---

## 10. Phase 1 Deliverables

### Code Files

- [x] `docs/LMS_V3_REPO_AUDIT.md`
- [x] `docs/architecture/LMS_V3_ARCHITECTURE.md`
- [ ] `src/lib/material-query-service.ts`
- [ ] `src/lib/search-utils.ts`
- [ ] `src/components/materials/MaterialCatalog.tsx`
- [ ] `src/app/actions/material-query-actions.ts`
- [ ] `tests/material-query-service.test.ts`

### Schema Files (Prepared, Not Applied)

- [ ] `supabase/migrations/20261117_022_resources_unified_schema.sql`
- [ ] `supabase/migrations/20261117_023_resource_taxonomy_links.sql`
- [ ] `supabase/migrations/20261117_024_resource_versions.sql`
- [ ] `supabase/migrations/20261117_025_resource_collections.sql`

### Verification Checklist

- [ ] TypeScript compiles with no errors
- [ ] ESLint passes
- [ ] `npm run build` succeeds
- [ ] Unit tests pass (Node.js --test)
- [ ] Integration test with 1k materials passes
- [ ] Public catalog still shows 55 canonical items
- [ ] Teacher can add new material via service
- [ ] Student cannot see unpublished teacher materials
- [ ] Search returns relevant results for "phóng xạ", "bán rã"
- [ ] Pagination works forward and backward
- [ ] No data loss in shadow table comparison

---

## 11. Future Phases (Post-Phase 1)

**Phase 2:** Apply schema migrations, backfill resources table, enable versioning  
**Phase 3:** Bulk upload UI, AI metadata extraction, duplicate detection  
**Phase 4:** Review workflow, librarian role, approval queue  
**Phase 5:** Collections UI, student-saved favorites (DB-backed)  
**Phase 6:** Multi-school organizations, advanced RLS, SSO integration

---

**Architecture approved for Phase 1 implementation.**  
**Next: Write `material-query-service.ts` and integrate with existing routes.**
