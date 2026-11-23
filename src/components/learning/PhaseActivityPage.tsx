/**
 * Khung chung cho 12 trang hoạt động học tập theo ba giai đoạn.
 *
 * Đây chỉ là khung trình bày (header, trạng thái, điều hướng giai đoạn).
 * Mỗi trang tự cung cấp module nghiệp vụ riêng ở `children` — không trang
 * nào dùng lại module của trang khác.
 */

import type { ReactNode } from "react";
import Link from "next/link";
import { PublicShell } from "@/app/PublicShell";

export type PhaseKey = "before" | "during" | "after";

const PHASE_LABEL: Record<PhaseKey, string> = {
  before: "Giai đoạn 1 · Trước giờ học",
  during: "Giai đoạn 2 · Trong giờ học",
  after: "Giai đoạn 3 · Sau giờ học",
};

export const PHASE_SIBLINGS: Record<PhaseKey, { label: string; href: string }[]> = {
  before: [
    { label: "Video hoạt hình", href: "/truoc-gio-hoc/video-hoat-hinh" },
    { label: "Mô phỏng tương tác", href: "/truoc-gio-hoc/mo-phong" },
    { label: "Infographic & lịch sử", href: "/truoc-gio-hoc/infographic-lich-su" },
    { label: "Phiếu học tập", href: "/truoc-gio-hoc/phieu-hoc-tap" },
    { label: "Video bài giảng", href: "/truoc-gio-hoc/video-bai-giang" },
  ],
  during: [
    { label: "Xử lý dữ liệu", href: "/trong-gio-hoc/xu-ly-du-lieu" },
    { label: "Sơ đồ tư duy", href: "/trong-gio-hoc/so-do-tu-duy" },
    { label: "Tình huống đóng vai", href: "/trong-gio-hoc/tinh-huong-dong-vai" },
    { label: "Trò chơi ôn tập", href: "/trong-gio-hoc/tro-choi-on-tap" },
  ],
  after: [
    { label: "Ôn tập & tự kiểm tra", href: "/sau-gio-hoc/on-tap-tu-kiem-tra" },
    { label: "Phản hồi & tự điều chỉnh", href: "/sau-gio-hoc/phan-hoi-tu-dieu-chinh" },
    { label: "Vận dụng & mở rộng", href: "/sau-gio-hoc/van-dung-mo-rong" },
  ],
};

export interface PhaseActivityPageProps {
  phase: PhaseKey;
  /** Số thứ tự trong giai đoạn, ví dụ "1.1". */
  activityNo: string;
  title: string;
  goal: string;
  /** Sản phẩm học sinh cần tạo ra cho hoạt động này. */
  product?: string;
  children: ReactNode;
  planned?: boolean;
  /** Ghi chú về giới hạn dữ liệu/mô hình, hiển thị dưới cùng. */
  limits?: ReactNode;
}

export function PhaseActivityPage({
  phase,
  activityNo,
  title,
  goal,
  product,
  children,
  planned = false,
  limits,
}: PhaseActivityPageProps) {
  return (
    <PublicShell floatingTutor={false}>
      <div className="phase-page">
        <nav className="breadcrumbs" aria-label="Đường dẫn trang">
          <Link href="/">Trang chủ</Link>
          <span aria-hidden="true">/</span>
          <Link href="/hoc-lieu">Kho học liệu</Link>
          <span aria-hidden="true">/</span>
          <strong aria-current="page">{title}</strong>
        </nav>

        <header className="phase-page-head">
          <p className="page-kicker">
            {PHASE_LABEL[phase]} · Hoạt động {activityNo}
          </p>
          <h1>{title}</h1>
          <p className="phase-page-goal">{goal}</p>
          {product && (
            <p className="phase-page-product">
              <strong>Sản phẩm cần có:</strong> {product}
            </p>
          )}
        </header>

        {planned && (
          <div className="phase-planned" role="status">
            <strong>Đang xây dựng.</strong> Phần chức năng của trang này chưa hoàn
            chỉnh. Những gì hiển thị bên dưới là nội dung đã có thật; phần chưa
            làm được ghi rõ ngay tại chỗ, không giả lập.
          </div>
        )}

        <div className="phase-page-body">{children}</div>

        {limits && <div className="phase-page-limits">{limits}</div>}

        <nav className="phase-page-nav" aria-label={`Các hoạt động khác trong ${PHASE_LABEL[phase]}`}>
          <p>{PHASE_LABEL[phase]}</p>
          <ul>
            {PHASE_SIBLINGS[phase].map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </PublicShell>
  );
}
