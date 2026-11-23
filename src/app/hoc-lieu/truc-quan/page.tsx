import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { VisualLearningStudio } from "@/components/learning/VisualLearningStudio";

export default async function VisualLearningPage({
  searchParams,
}: {
  searchParams: Promise<{
    bai?: string;
    "che-do"?: string;
    pha?: string;
    muc?: string;
  }>;
}) {
  const params = await searchParams;
  const bai = params.bai ?? "B21";
  const initialTeacherMode = params["che-do"] === "giao-vien";

  return (
    <PortalShell
      floatingTutor={false}
      aiLessonCode={bai}
      role={initialTeacherMode ? "teacher" : "student"}
      active="materials"
      publicLibrary
      account={
        <Link className="btn small" href="/login">
          Đăng nhập lớp học
        </Link>
      }
    >
      <VisualLearningStudio
        key={`${bai}-${initialTeacherMode ? "gv" : "hs"}`}
        code={bai}
        initialTeacherMode={initialTeacherMode}
        initialPhase={params.pha}
        initialSection={params.muc}
      />
    </PortalShell>
  );
}
