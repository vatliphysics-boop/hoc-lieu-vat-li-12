import Link from "next/link";
import { TeacherShell } from "../TeacherShell";
import { getTeacherContext } from "../data";
import { getCombinedMaterialBank } from "@/lib/material-bank";
import { MaterialBankViewer } from "@/components/learning/MaterialBankViewer";
import { MaterialCatalogRoute } from "@/components/learning/MaterialCatalogRoute";
import { isUnifiedCatalogEnabled } from "@/lib/feature-flags";

import type { MaterialType } from "@/lib/material-bank";

export default async function TeacherMaterialsPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string; q?: string; bai?: string; page?: string; view?: string }>;
}) {
  const { supabase, user } = await getTeacherContext();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const currentType = (resolvedSearchParams.type || "all") as MaterialType | "all";
  const currentQuery = resolvedSearchParams.q || "";
  const currentView = resolvedSearchParams.view || "manage";

  const unified = isUnifiedCatalogEnabled();

  // Browsing view: the unified, paginated catalogue (read-only).
  // Manage view: the existing MaterialBankViewer with create/edit/delete intact.
  if (unified && currentView === "browse") {
    return (
      <TeacherShell
        active="materials"
        title="Kho học liệu"
        description="Tìm và duyệt toàn bộ học liệu theo bài, loại và từ khóa."
      >
        <section className="section">
          <MaterialCatalogRoute
            role="teacher"
            basePath="/teacher/materials"
            searchParams={{
              type: resolvedSearchParams.type,
              bai: resolvedSearchParams.bai,
              q: resolvedSearchParams.q,
              page: resolvedSearchParams.page,
            }}
          />
        </section>
      </TeacherShell>
    );
  }

  // The current view needs the teacher's own materials for editing. Only load
  // them when the manage view will actually render — the browse view above
  // reads through the unified query instead.
  const materials = await getCombinedMaterialBank(
    supabase,
    user.id,
    "all",
    currentQuery
  );

  return (
    <TeacherShell
      active="materials"
      title="Kho học liệu"
      description="Quản lí, xem trước và phối hợp học liệu, đề kiểm tra thành kế hoạch dạy học riêng."
    >
      <section className="section">
        {unified && (
          <nav className="teacher-material-views" aria-label="Chế độ xem kho học liệu">
            <Link className="btn small" href="/teacher/materials?view=browse">
              Duyệt kho bằng bộ lọc mới →
            </Link>
          </nav>
        )}
        <MaterialBankViewer
          key={`${currentType}-${currentQuery}`}
          initialMaterials={materials}
          initialType={currentType}
          teacherId={user.id}
        />
      </section>
    </TeacherShell>
  );
}
