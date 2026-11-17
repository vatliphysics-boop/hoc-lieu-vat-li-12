/**
 * Server Action: Unified Material Query
 *
 * Provides server-side material search/pagination to client components.
 * Checks authentication and authorization before querying.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getMaterialsUnified,
  getMaterialById,
  type MaterialQueryContext,
  type MaterialQueryFilters,
  type MaterialQueryPagination,
  type MaterialQueryResult,
  type QueryRole,
} from "@/lib/material-query-service";
import type { MaterialItem } from "@/lib/material-bank";

/**
 * Resolve role from Supabase auth + profile
 */
async function resolveRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  requestedRole: QueryRole
): Promise<{ role: QueryRole; userId?: string; error?: string }> {
  // Public role: no auth needed
  if (requestedRole === "public") {
    return { role: "public" };
  }

  // For student/teacher: verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { role: "public", error: "Not authenticated" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return { role: "public", error: "Profile not found" };
  }

  // Check if requested role matches actual role
  if (requestedRole === "teacher" && profile.role !== "teacher") {
    return { role: "student", userId: user.id, error: "Not a teacher" };
  }

  if (requestedRole === "student" && profile.role !== "student") {
    return { role: "teacher", userId: user.id, error: "Not a student" };
  }

  return { role: profile.role as QueryRole, userId: user.id };
}

/**
 * Server action: fetch materials with filters and pagination
 */
export async function queryMaterialsAction(
  requestedRole: QueryRole,
  filters?: MaterialQueryFilters,
  pagination?: MaterialQueryPagination
): Promise<MaterialQueryResult | { error: string }> {
  try {
    const supabase = await createClient();
    const authContext = await resolveRole(supabase, requestedRole);

    if (authContext.error && authContext.role === "public" && requestedRole !== "public") {
      return { error: authContext.error };
    }

    const context: MaterialQueryContext = {
      role: authContext.role,
      userId: authContext.userId,
    };

    return await getMaterialsUnified(supabase, context, filters, pagination);
  } catch (err) {
    console.error("queryMaterialsAction error:", err);
    return { error: "Không thể tải học liệu. Vui lòng thử lại." };
  }
}

/**
 * Server action: fetch single material by ID
 */
export async function getMaterialByIdAction(
  id: string,
  requestedRole: QueryRole
): Promise<MaterialItem | null | { error: string }> {
  try {
    const supabase = await createClient();
    const authContext = await resolveRole(supabase, requestedRole);

    if (authContext.error && authContext.role === "public" && requestedRole !== "public") {
      return { error: authContext.error };
    }

    const context: MaterialQueryContext = {
      role: authContext.role,
      userId: authContext.userId,
    };

    return await getMaterialById(supabase, id, context);
  } catch (err) {
    console.error("getMaterialByIdAction error:", err);
    return { error: "Không thể tải học liệu. Vui lòng thử lại." };
  }
}
