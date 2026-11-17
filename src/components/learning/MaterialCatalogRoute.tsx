/**
 * Server-rendered material catalogue.
 *
 * This wrapper is the server-side half of the catalogue page. It:
 *   1. reads filters/search/page from the URL,
 *   2. calls the unified query service directly (no client round-trip),
 *   3. hands a fully-paginated page to `MaterialCatalog`.
 *
 * All data — including role-gated visibility — is resolved here, on the server.
 * The client component receives only rows the current role may see.
 *
 * `MaterialCatalog` still performs instant client-side refinement across the
 * rows already loaded (typing does not hit the network), while pagination and
 * the initial query come from the database.
 */

import { createClient } from "@/lib/supabase/server";
import {
  getMaterialsUnified,
  type MaterialQueryFilters,
  type QueryRole,
} from "@/lib/material-query-service";
import type { MaterialItem, MaterialType } from "@/lib/material-bank";
import { MaterialCatalog } from "./MaterialCatalog";

const ALL_TYPES: MaterialType[] = [
  "simulation",
  "image",
  "animation",
  "real_video",
  "lecture_video",
  "document",
  "colab",
  "assessment",
];

export const CATALOG_PAGE_SIZE = 24;

export interface MaterialCatalogRouteProps {
  role: QueryRole;
  searchParams: {
    type?: string;
    bai?: string;
    q?: string;
    page?: string;
  };
  /** Show the per-lesson card strip (public/student only). */
  showLessonCards?: boolean;
  /** Callback base path so "next page" links target the right route. */
  basePath: string;
}

function parseType(value?: string): MaterialType | undefined {
  if (!value || value === "all") return undefined;
  return ALL_TYPES.includes(value as MaterialType) ? (value as MaterialType) : undefined;
}

function parseLesson(value?: string): string | undefined {
  if (!value || value === "all") return undefined;
  return /^B2[1-5]$/.test(value) || value === "general" ? value : undefined;
}

function parsePage(value?: string): number {
  const n = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Server component: resolves the query and renders the catalogue.
 */
export async function MaterialCatalogRoute({
  role,
  searchParams,
  showLessonCards = true,
  basePath,
}: MaterialCatalogRouteProps) {
  const type = parseType(searchParams.type);
  const lesson = parseLesson(searchParams.bai);
  const searchQuery = searchParams.q?.trim() || undefined;
  const page = parsePage(searchParams.page);
  const offset = (page - 1) * CATALOG_PAGE_SIZE;

  let items: MaterialItem[] = [];
  let total = 0;
  let hasMore = false;
  let truncated = false;
  let error: string | undefined;
  let roleResolved: QueryRole = role;

  // Canonical materials need no database; only resolve auth when the role asks
  // for it. A missing Supabase env must not break the public catalogue.
  try {
    const supabase = await createClient();

    let userId: string | undefined;
    if (role !== "public") {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        if (profile?.role) {
          // Trust the database role, not the route that asked.
          roleResolved = profile.role as QueryRole;
          userId = user.id;
        }
      }
    }

    const filters: MaterialQueryFilters = {
      materialType: type,
      lessonTag: lesson,
      searchQuery,
    };

    const result = await getMaterialsUnified(
      supabase,
      { role: roleResolved, userId },
      filters,
      { limit: CATALOG_PAGE_SIZE, offset, sortBy: "title", sortOrder: "asc" }
    );

    items = result.items;
    total = result.total;
    hasMore = result.hasMore;
    truncated = result.truncated;
  } catch (err) {
    console.error("MaterialCatalogRoute query failed:", err);
    error = "Không tải được toàn bộ kho học liệu. Đang hiển thị học liệu có sẵn trên máy chủ.";
    // Fall back to canonical-only rendering so the page is never blank.
    const { CANONICAL_SYSTEM_MATERIALS } = await import("@/lib/material-bank");
    const published = CANONICAL_SYSTEM_MATERIALS.filter((m) => m.is_published);
    const filtered = published.filter((m) => {
      if (type && m.material_type !== type) return false;
      if (lesson && m.lesson_tag !== lesson) return false;
      if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    items = filtered.slice(offset, offset + CATALOG_PAGE_SIZE);
    total = filtered.length;
    hasMore = offset + items.length < total;
  }

  // Server components cannot pass functions to client components. Build the
  // current query string once and let the client append `page` itself.
  const queryParams = new URLSearchParams();
  if (searchParams.type) queryParams.set("type", searchParams.type);
  if (searchParams.bai) queryParams.set("bai", searchParams.bai);
  if (searchParams.q) queryParams.set("q", searchParams.q);

  return (
    <MaterialCatalog
      materials={items}
      total={total}
      hasMore={hasMore}
      error={error}
      role={roleResolved}
      showLessonCards={showLessonCards}
      truncated={truncated}
      page={page}
      basePath={basePath}
      baseQuery={queryParams.toString()}
      initialType={searchParams.type ?? "all"}
      initialLesson={searchParams.bai ?? "all"}
      initialSearch={searchParams.q ?? ""}
    />
  );
}
