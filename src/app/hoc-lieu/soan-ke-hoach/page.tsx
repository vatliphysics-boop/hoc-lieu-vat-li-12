import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { TeachingPlanStudio } from "@/components/learning/TeachingPlanStudio";

export default async function OpenPlanPage({
  searchParams,
}: {
  searchParams: Promise<{
    template?: string;
    material?: string;
    form?: string;
    plan?: string;
  }>;
}) {
  const params = await searchParams;
  return (
    <PortalShell
      role="teacher"
      active="materials"
      publicLibrary
      account={
        <Link className="btn small" href="/teacher/plans">
          Đăng nhập giáo viên
        </Link>
      }
    >
      <header className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <p className="page-kicker">Kho học liệu · Phần chuẩn bị của giáo viên</p>
          <h1>Soạn kế hoạch dạy học</h1>
          <p className="page-description">
            Mục tiêu – học liệu – hoạt động – sản phẩm – đánh giá trong ba pha
            trước, trong và sau giờ học. Bản tùy chỉnh từ Trang bài học xuất hiện trực tiếp tại đây.
          </p>
        </div>
        {params.template && (
          <Link
            className="btn"
            href={`/hoc-lieu/truc-quan?bai=${encodeURIComponent(params.template)}&che-do=giao-vien`}
          >
            ← Quay lại Trang bài học ({params.template})
          </Link>
        )}
      </header>
      <TeachingPlanStudio
        template={params.template}
        materialId={params.material}
        form={params.form}
        initialPlanId={params.plan}
      />
    </PortalShell>
  );
}
