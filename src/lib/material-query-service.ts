/**
 * Unified Material Query Service
 *
 * Single entry point for retrieving materials across:
 * - CANONICAL_SYSTEM_MATERIALS (hardcoded)
 * - material_bank (Supabase custom materials)
 * - lesson_materials (legacy lesson references)
 *
 * Handles deduplication, filtering, search, and RLS authorization.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { CANONICAL_SYSTEM_MATERIALS, type MaterialItem, type MaterialType } from "./material-bank";

export type QueryRole = "public" | "student" | "teacher";

/**
 * Maximum rows pulled from material_bank for one request.
 * Keeps responses bounded before Phase 2 lands keyset pagination.
 */
export const DB_PAGE_LIMIT = 500;

export interface MaterialQueryContext {
  role: QueryRole;
  userId?: string;
  classId?: string;
}

export interface MaterialQueryFilters {
  materialType?: MaterialType | MaterialType[];
  lessonTag?: string | string[];
  searchQuery?: string;
  phase?: "before_class" | "in_class" | "after_class";
  publishedOnly?: boolean;
  ownedByMe?: boolean;
}

export interface MaterialQueryPagination {
  limit: number;
  offset?: number;
  sortBy?: "title" | "created_at" | "updated_at" | "relevance";
  sortOrder?: "asc" | "desc";
}

export interface MaterialQueryResult {
  items: MaterialItem[];
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

/**
 * Main entry point: unified query service
 *
 * @param supabase Supabase client (for authenticated DB queries)
 * @param context Query context (role, userId, classId)
 * @param filters Optional filters to narrow results
 * @param pagination Optional pagination config
 * @returns Result set with items, total count, and pagination metadata
 */
export async function getMaterialsUnified(
  supabase: SupabaseClient,
  context: MaterialQueryContext,
  filters?: MaterialQueryFilters,
  pagination?: MaterialQueryPagination
): Promise<MaterialQueryResult> {
  const limit = pagination?.limit ?? 20;
  const offset = pagination?.offset ?? 0;
  const sortBy = pagination?.sortBy ?? "title";
  const sortOrder = pagination?.sortOrder ?? "asc";

  let allItems: MaterialItem[] = [];

  // Step 1: Always include CANONICAL_SYSTEM_MATERIALS (filtered by role)
  const canonicalFiltered = filterCanonicalMaterials(
    CANONICAL_SYSTEM_MATERIALS,
    context,
    filters
  );
  allItems.push(...canonicalFiltered);

  // Step 2: Query material_bank from Supabase (custom materials)
  if (context.userId || context.role !== "public") {
    try {
      const dbMaterials = await queryMaterialBank(supabase, context, filters);
      allItems.push(...dbMaterials);
    } catch (err) {
      // If material_bank doesn't exist (e.g., on fresh DB), gracefully fallback
      console.warn("material_bank query failed (expected on fresh DB):", err);
    }
  }

  // Step 3: Query legacy lesson_materials if teacher context
  if (context.role === "teacher" && context.userId) {
    try {
      const legacyMaterials = await queryLessonMaterials(supabase, context.userId, filters);
      allItems.push(...legacyMaterials);
    } catch {
      // Ignore legacy query failure
    }
  }

  // Step 4: Deduplicate by ID (Map keeps last occurrence for conflicts)
  const deduplicatedMap = new Map<string, MaterialItem>();
  for (const item of allItems) {
    deduplicatedMap.set(item.id, item);
  }
  allItems = Array.from(deduplicatedMap.values());

  // Step 5: Apply search filter (after deduplication for efficiency)
  if (filters?.searchQuery) {
    allItems = searchMaterials(allItems, filters.searchQuery);
  }

  // Step 6: Sort
  allItems = sortMaterials(allItems, sortBy, sortOrder);

  // Step 7: Paginate
  const total = allItems.length;
  const paginatedItems = allItems.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  return {
    items: paginatedItems,
    total,
    hasMore,
    offset,
    limit,
  };
}

/**
 * Filter canonical materials based on role and query filters
 */
export function filterCanonicalMaterials(
  materials: MaterialItem[],
  context: MaterialQueryContext,
  filters?: MaterialQueryFilters
): MaterialItem[] {
  return materials.filter((item) => {
    // Role-based access control
    if (context.role === "public") {
      // Public sees only published canonical items
      if (!item.is_published) return false;
    } else if (context.role === "student") {
      // Student sees published items only
      if (!item.is_published) return false;
    } else if (context.role === "teacher") {
      // Teacher sees all canonical items (published or not, since system items are curated)
      // No further role-based filtering needed
    }

    // Apply query filters
    if (filters?.publishedOnly && !item.is_published) return false;

    if (filters?.materialType) {
      const types = Array.isArray(filters.materialType) ? filters.materialType : [filters.materialType];
      if (!types.includes(item.material_type)) return false;
    }

    if (filters?.lessonTag) {
      const tags = Array.isArray(filters.lessonTag) ? filters.lessonTag : [filters.lessonTag];
      if (item.lesson_tag && tags.includes(item.lesson_tag)) {
        // Matches
      } else if (!item.lesson_tag && tags.includes("general")) {
        // Item has no tag; matches "general" filter
      } else {
        return false;
      }
    }

    if (filters?.phase && item.metadata?.recommendedPhase) {
      if (item.metadata.recommendedPhase !== filters.phase) return false;
    }

    return true;
  });
}

/**
 * Query material_bank table from Supabase
 */
async function queryMaterialBank(
  supabase: SupabaseClient,
  context: MaterialQueryContext,
  filters?: MaterialQueryFilters
): Promise<MaterialItem[]> {
  let query = supabase.from("material_bank").select("*");

  // RLS: only show published materials or own materials
  if (context.role === "public") {
    query = query.eq("is_published", true);
  } else if (context.role === "student") {
    query = query.eq("is_published", true);
  } else if (context.role === "teacher" && context.userId) {
    // Teacher sees own materials + published materials
    query = query.or(`is_published.eq.true,teacher_id.eq.${context.userId}`);
  }

  // Apply type filter
  if (filters?.materialType) {
    const types = Array.isArray(filters.materialType) ? filters.materialType : [filters.materialType];
    if (types.length === 1) {
      query = query.eq("material_type", types[0]);
    } else {
      query = query.in("material_type", types);
    }
  }

  // Apply lesson filter
  if (filters?.lessonTag) {
    const tags = Array.isArray(filters.lessonTag) ? filters.lessonTag : [filters.lessonTag];
    query = query.in("lesson_tag", tags);
  }

  // Server-side text search (ilike is accent-sensory but narrows the payload
  // so the whole table is never shipped to the client). `_` and `%` are
  // escaped so a user query cannot turn into a wildcard scan.
  if (filters?.searchQuery && filters.searchQuery.trim()) {
    const term = filters.searchQuery.trim().replace(/[\\%_]/g, (c) => `\\${c}`);
    query = query.or(`title.ilike."%${term}%",description.ilike."%${term}%"`);
  }

  // Hard ceiling on any single page so a large library never becomes a
  // single unbounded response. Cursor/keyset paging arrives in Phase 2.
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(0, DB_PAGE_LIMIT - 1);

  if (error) {
    console.warn("material_bank query error:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    teacher_id: row.teacher_id,
    title: row.title,
    description: row.description || "",
    material_type: row.material_type,
    category: row.category,
    lesson_tag: row.lesson_tag,
    content_url: row.content_url || "",
    storage_path: row.storage_path,
    metadata: row.metadata,
    is_published: row.is_published,
    is_system: row.is_system,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

/**
 * Query legacy lesson_materials table and map to MaterialItem
 */
async function queryLessonMaterials(
  supabase: SupabaseClient,
  teacherId: string,
  filters?: MaterialQueryFilters
): Promise<MaterialItem[]> {
  let query = supabase.from("lesson_materials").select("*").eq("teacher_id", teacherId);

  if (filters?.materialType) {
    const types = Array.isArray(filters.materialType) ? filters.materialType : [filters.materialType];
    if (types.length === 1) {
      query = query.eq("material_type", types[0]);
    } else {
      query = query.in("material_type", types);
    }
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .range(0, DB_PAGE_LIMIT - 1);

  if (error) {
    console.warn("lesson_materials query error:", error);
    return [];
  }

  return (data || []).map((row) => {
    let mappedType: MaterialType = "document";
    if (row.material_type === "video") mappedType = "lecture_video";
    else if (row.material_type === "simulation") mappedType = "simulation";
    else if (row.material_type === "colab") mappedType = "colab";

    return {
      id: `legacy-${row.id}`,
      teacher_id: teacherId,
      title: row.title,
      description: row.description || "",
      material_type: mappedType,
      category: "nuclear_physics" as const,
      lesson_tag: row.lesson_tag || undefined,
      content_url: row.content_url || "",
      is_published: row.is_published,
      is_system: false,
      created_at: row.created_at,
    };
  });
}

/**
 * Search materials by query string (client-side for now; server-side in Phase 2)
 *
 * Supports Vietnamese with and without diacritics
 */
export function searchMaterialsForTest(materials: MaterialItem[], query: string): MaterialItem[] {
  return searchMaterials(materials, query);
}

function searchMaterials(materials: MaterialItem[], query: string): MaterialItem[] {
  if (!query || !query.trim()) return materials;

  const q = query.toLowerCase().trim();

  return materials.filter((item) => {
    const searchText = `${item.title || ""} ${item.description || ""} ${item.lesson_tag || ""}`.toLowerCase();

    // Exact substring match (diacritics-aware at normalize time)
    if (searchText.includes(q)) return true;

    // Remove diacritics and try again (for "phong xa" → "phóng xạ")
    const normalized = removeDiacritics(searchText);
    const normalizedQuery = removeDiacritics(q);
    if (normalized.includes(normalizedQuery)) return true;

    return false;
  });
}

/**
 * Remove Vietnamese diacritics for fuzzy matching
 * e.g. "phóng xạ" → "phong xa"
 */
export function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Sort materials by specified field and order
 */
export function sortMaterialsForTest(
  materials: MaterialItem[],
  sortBy: string,
  sortOrder: "asc" | "desc"
): MaterialItem[] {
  return sortMaterials(materials, sortBy, sortOrder);
}

function sortMaterials(
  materials: MaterialItem[],
  sortBy: string,
  sortOrder: "asc" | "desc"
): MaterialItem[] {
  const sorted = [...materials];

  const compareFn = (a: MaterialItem, b: MaterialItem): number => {
    let aVal: string | number | undefined;
    let bVal: string | number | undefined;

    switch (sortBy) {
      case "title":
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
        break;
      case "created_at":
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
        break;
      case "updated_at":
        aVal = new Date(a.updated_at || a.created_at).getTime();
        bVal = new Date(b.updated_at || b.created_at).getTime();
        break;
      default:
        return 0;
    }

    if (aVal === bVal) return 0;
    const cmp = aVal! > bVal! ? 1 : -1;
    return sortOrder === "asc" ? cmp : -cmp;
  };

  sorted.sort(compareFn);
  return sorted;
}

/**
 * Paginate materials (for testing)
 */
export function paginateForTest(
  materials: MaterialItem[],
  offset: number,
  limit: number
): { items: MaterialItem[]; total: number; hasMore: boolean; offset: number; limit: number } {
  const total = materials.length;
  const paginatedItems = materials.slice(offset, offset + limit);
  const hasMore = offset + limit < total;
  return { items: paginatedItems, total, hasMore, offset, limit };
}

/**
 * Get a single material by ID
 * Respects RLS rules
 */
export async function getMaterialById(
  supabase: SupabaseClient,
  id: string,
  context: MaterialQueryContext
): Promise<MaterialItem | null> {
  // Check canonical first
  const canonical = CANONICAL_SYSTEM_MATERIALS.find((m) => m.id === id);
  if (canonical) {
    // Check role access
    if (context.role === "public" && !canonical.is_published) return null;
    return canonical;
  }

  // Check material_bank
  if (!id.startsWith("legacy-")) {
    try {
      let query = supabase.from("material_bank").select("*").eq("id", id);

      if (context.role !== "teacher") {
        query = query.eq("is_published", true);
      } else if (context.userId) {
        query = query.or(`is_published.eq.true,teacher_id.eq.${context.userId}`);
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        return {
          id: data.id,
          teacher_id: data.teacher_id,
          title: data.title,
          description: data.description || "",
          material_type: data.material_type,
          category: data.category,
          lesson_tag: data.lesson_tag,
          content_url: data.content_url || "",
          storage_path: data.storage_path,
          metadata: data.metadata,
          is_published: data.is_published,
          is_system: data.is_system,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      }
    } catch (err) {
      console.warn("material_bank single query error:", err);
    }
  }

  // Check legacy
  if (id.startsWith("legacy-") && context.role === "teacher" && context.userId) {
    try {
      const legacyId = id.replace("legacy-", "");
      const { data, error } = await supabase
        .from("lesson_materials")
        .select("*")
        .eq("id", legacyId)
        .eq("teacher_id", context.userId)
        .maybeSingle();

      if (!error && data) {
        let mappedType: MaterialType = "document";
        if (data.material_type === "video") mappedType = "lecture_video";
        else if (data.material_type === "simulation") mappedType = "simulation";
        else if (data.material_type === "colab") mappedType = "colab";

        return {
          id,
          teacher_id: context.userId,
          title: data.title,
          description: data.description || "",
          material_type: mappedType,
          category: "nuclear_physics",
          lesson_tag: data.lesson_tag || undefined,
          content_url: data.content_url || "",
          is_published: data.is_published,
          is_system: false,
          created_at: data.created_at,
        };
      }
    } catch (err) {
      console.warn("lesson_materials single query error:", err);
    }
  }

  return null;
}
