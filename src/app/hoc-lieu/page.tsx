import Link from "next/link";
import { PortalShell } from "@/components/PortalShell";
import { Chapter4Hub } from "@/components/learning/Chapter4Hub";
import { LearningLibrary } from "@/components/learning/LearningLibrary";
import { MaterialCatalogRoute } from "@/components/learning/MaterialCatalogRoute";
import { isUnifiedCatalogEnabled } from "@/lib/feature-flags";
import styles from "@/components/learning/NuclearLabManual.module.css";

export default async function OpenLearningPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    bai?: string;
    resource?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const { type, bai, resource, q, page } = await searchParams;
  return (
    <PortalShell
      role="student"
      active="materials"
      publicLibrary
      account={
        <Link href="/login" className="btn small">
          Đăng nhập lớp học
        </Link>
      }
    >
      <Chapter4Hub />

      <section
        id="tra-cuu-hoc-lieu-le"
        className={styles.warehouseSection}
        aria-labelledby="warehouse-heading"
      >
        <div className={styles.warehouseHeader}>
          <div>
            <h2 id="warehouse-heading" className={styles.warehouseTitle}>
              Tra cứu kho tài liệu lẻ theo loại và bài học
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#525252" }}>
              Tìm nhanh phiếu học tập PDF, mô phỏng riêng lẻ, video bài giảng và đề tự luyện của Chương IV.
            </p>
          </div>
          <Link href="/hoc-lieu/lop-hoc-dao-nguoc" className="btn small">
            Hướng dẫn 3 pha dạy học
          </Link>
        </div>
        {isUnifiedCatalogEnabled() ? (
          <MaterialCatalogRoute
            role="public"
            basePath="/hoc-lieu"
            showLessonCards={false}
            searchParams={{ type, bai, q, page }}
          />
        ) : (
          <LearningLibrary
            key={`${type}-${bai}-${resource}`}
            initialType={type}
            initialLesson={bai}
            initialResource={resource}
            showLessonCards={false}
          />
        )}
      </section>
    </PortalShell>
  );
}
