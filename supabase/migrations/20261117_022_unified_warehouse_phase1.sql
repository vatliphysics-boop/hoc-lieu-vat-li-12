-- =============================================================================
-- LMS V3 Phase 1: Unified Material Warehouse Extensions
-- File: 20261117_022_unified_warehouse_phase1.sql
-- Status: PREPARED, NOT APPLIED TO PRODUCTION
--
-- Purpose:
--   Add full-text search indexes, pg_trgm extension, and optional unified
--   resource tables. These are ADDITIVE ONLY — no existing tables are
--   modified, dropped or reset.
--
-- Safety Checklist (verify before applying):
--   [ ] Schema audit of live Supabase matches migrations 001–021
--   [ ] Backup of material_bank, lesson_materials, lesson_pathway_steps
--   [ ] Test migration in staging environment first
--   [ ] RLS policies verified against expected behavior
--   [ ] Rollback plan prepared (drop indexes, drop tables in reverse order)
--
-- HOW TO APPLY — READ THIS FIRST:
--   Section 2–4 use CREATE INDEX CONCURRENTLY on the live material_bank table
--   so that reads and writes are not blocked while the indexes build.
--   CONCURRENTLY CANNOT run inside a transaction block. Applying this file
--   through a tool that wraps migrations in BEGIN/COMMIT will fail with
--   "CREATE INDEX CONCURRENTLY cannot run inside a transaction block".
--   Apply it either:
--     psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f 20261117_022_unified_warehouse_phase1.sql
--   or, in the Supabase SQL Editor, by running sections 1–4 as their own
--   statement per click (Supabase runs each submitted statement outside an
--   explicit transaction when it is submitted alone).
--   If a CONCURRENTLY build is interrupted it leaves an INVALID index behind;
--   drop it (DROP INDEX CONCURRENTLY <name>) and re-run that statement.
--   The new tables in sections 5–9 are empty, so their indexes stay plain
--   CREATE INDEX — CONCURRENTLY there would only add build time and failure modes.
--
-- Rollback (reverse this migration):
--   DROP INDEX IF EXISTS idx_material_bank_fts;
--   DROP INDEX IF EXISTS idx_material_bank_trgm_title;
--   DROP INDEX IF EXISTS idx_material_bank_lesson_tag;
--   DROP INDEX IF EXISTS idx_material_bank_type;
--   DROP INDEX IF EXISTS idx_material_bank_teacher;
--   DROP EXTENSION IF EXISTS unaccent;
--   DROP EXTENSION IF EXISTS pg_trgm;
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extensions (safe to run on existing DB; idempotent with IF NOT EXISTS)
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------------------------------------------------------------------------
-- 2. Full-text search index on material_bank
--    Covers Vietnamese text with unaccent normalization
-- ---------------------------------------------------------------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_material_bank_fts
  ON material_bank
  USING gin(
    to_tsvector(
      'simple',
      unaccent(coalesce(title, '')) || ' ' || unaccent(coalesce(description, ''))
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Trigram index for partial match and typo tolerance
--    Allows queries like: WHERE title % 'phong xa' (matches "phóng xạ")
-- ---------------------------------------------------------------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_material_bank_trgm_title
  ON material_bank
  USING gin(title gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 4. Performance indexes for common filter patterns
-- ---------------------------------------------------------------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_material_bank_lesson_tag
  ON material_bank(lesson_tag)
  WHERE lesson_tag IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_material_bank_type
  ON material_bank(material_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_material_bank_teacher
  ON material_bank(teacher_id)
  WHERE teacher_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_material_bank_published
  ON material_bank(is_published)
  WHERE is_published = true;

-- ---------------------------------------------------------------------------
-- 5. Optional: unified resources table (future-ready, not yet used in Phase 1)
--    This table is created but empty; content migrated in Phase 2.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  visibility TEXT DEFAULT 'private' NOT NULL,
  content_url TEXT NOT NULL,
  storage_path TEXT,
  source_attribution TEXT,
  license TEXT,
  language TEXT DEFAULT 'vi',
  review_status TEXT DEFAULT 'draft' NOT NULL,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT resources_visibility_valid CHECK (visibility IN ('public', 'organization', 'private')),
  CONSTRAINT resources_status_valid CHECK (review_status IN ('draft', 'submitted', 'approved', 'published', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_resources_owner ON resources(owner_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(review_status);
CREATE INDEX IF NOT EXISTS idx_resources_fts ON resources
  USING gin(to_tsvector('simple', unaccent(coalesce(title, '')) || ' ' || unaccent(coalesce(description, ''))));

-- ---------------------------------------------------------------------------
-- 6. Many-to-many taxonomy links (future use)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS resource_taxonomy_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  education_level TEXT,
  grade TEXT,
  subject TEXT,
  curriculum TEXT,
  chapter TEXT,
  lesson TEXT,
  concept TEXT,
  recommended_phase TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT taxonomy_phase_valid CHECK (
    recommended_phase IS NULL OR
    recommended_phase IN ('before_class', 'in_class', 'after_class')
  )
);

CREATE INDEX IF NOT EXISTS idx_taxonomy_resource ON resource_taxonomy_links(resource_id);
CREATE INDEX IF NOT EXISTS idx_taxonomy_lesson ON resource_taxonomy_links(lesson);

-- ---------------------------------------------------------------------------
-- 7. Version history table (future use)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS resource_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  change_summary TEXT,

  UNIQUE(resource_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_versions_resource ON resource_versions(resource_id, version_number DESC);

-- ---------------------------------------------------------------------------
-- 8. Collections (future use)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS resource_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  visibility TEXT DEFAULT 'private' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  CONSTRAINT collections_visibility_valid CHECK (visibility IN ('public', 'organization', 'private'))
);

CREATE TABLE IF NOT EXISTS resource_collection_items (
  collection_id UUID NOT NULL REFERENCES resource_collections(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL,
  item_order INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  PRIMARY KEY (collection_id, resource_id)
);

-- ---------------------------------------------------------------------------
-- 9. RLS policies for new tables (follows same pattern as material_bank)
-- ---------------------------------------------------------------------------

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_taxonomy_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_collection_items ENABLE ROW LEVEL SECURITY;

-- resources: public sees published, teachers see own + published
CREATE POLICY IF NOT EXISTS resources_read_public
  ON resources FOR SELECT
  USING (
    (visibility = 'public' AND review_status = 'published')
    OR owner_id = auth.uid()
  );

CREATE POLICY IF NOT EXISTS resources_insert_teacher
  ON resources FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
  );

CREATE POLICY IF NOT EXISTS resources_update_owner
  ON resources FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY IF NOT EXISTS resources_delete_owner
  ON resources FOR DELETE
  USING (owner_id = auth.uid());

-- taxonomy_links: readable if parent resource is readable
CREATE POLICY IF NOT EXISTS taxonomy_links_read
  ON resource_taxonomy_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resources r WHERE r.id = resource_id
      AND (r.visibility = 'public' OR r.owner_id = auth.uid())
    )
  );

-- collections: owner-only
CREATE POLICY IF NOT EXISTS collections_read_owner
  ON resource_collections FOR SELECT
  USING (owner_id = auth.uid() OR visibility = 'public');

CREATE POLICY IF NOT EXISTS collections_write_owner
  ON resource_collections FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY IF NOT EXISTS collection_items_read
  ON resource_collection_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resource_collections c WHERE c.id = collection_id
      AND (c.owner_id = auth.uid() OR c.visibility = 'public')
    )
  );

CREATE POLICY IF NOT EXISTS collection_items_write
  ON resource_collection_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM resource_collections c WHERE c.id = collection_id AND c.owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM resource_collections c WHERE c.id = collection_id AND c.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 10. Comments for documentation
-- ---------------------------------------------------------------------------

COMMENT ON TABLE resources IS 'Unified resource registry for Phase 2+ warehouse. Currently empty; material_bank is source of truth in Phase 1.';
COMMENT ON TABLE resource_taxonomy_links IS 'Many-to-many lesson/topic associations. Used in Phase 2.';
COMMENT ON TABLE resource_versions IS 'Immutable version snapshots for pinning assignments. Used in Phase 2.';
COMMENT ON TABLE resource_collections IS 'Teacher-created material collections. Used in Phase 2.';
