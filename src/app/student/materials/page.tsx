import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudentShell } from "../StudentShell";
import { LearningLibrary } from "@/components/learning/LearningLibrary";
import { MaterialCatalogRoute } from "@/components/learning/MaterialCatalogRoute";
import { isUnifiedCatalogEnabled } from "@/lib/feature-flags";
export default async function StudentMaterialsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; bai?: string; q?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "student") redirect("/login");
  const { type, bai, q, page } = await searchParams;
  return (
    <StudentShell
      active="materials"
      title="Kho học liệu của em"
      description="Nhấn tên để mở thí nghiệm, video, phiếu học tập hoặc nhiệm vụ. Kết quả tự luyện tại kho chưa được nộp cho giáo viên."
    >
      {isUnifiedCatalogEnabled() ? (
        <MaterialCatalogRoute
          role="student"
          basePath="/student/materials"
          searchParams={{ type, bai, q, page }}
        />
      ) : (
        <LearningLibrary key={type ?? "all"} initialType={type} />
      )}
    </StudentShell>
  );
}
