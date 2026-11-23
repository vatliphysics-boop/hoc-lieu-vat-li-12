import Link from "next/link";
import { PublicShell } from "@/app/PublicShell";
import { B21RealtimeLab } from "@/components/learning/realtime/B21RealtimeLab";
import { B22RealtimeLab } from "@/components/physics/B22RealtimeLab";
import { HalfLifePilot } from "@/components/learning/HalfLifePilot";
import { B24RealtimeLab } from "@/components/learning/B24RealtimeLab";
import { B25RealtimeLab } from "@/components/physics/B25RealtimeLab";

export default async function PreviewLab({ searchParams }: { searchParams: Promise<{ bai?: string }> }) {
  const { bai } = await searchParams;
  const content = bai === "B21" ? <B21RealtimeLab preview /> : bai === "B22" ? <B22RealtimeLab preview /> : bai === "B23" ? <HalfLifePilot preview /> : bai === "B24" ? <B24RealtimeLab preview /> : bai === "B25" ? <B25RealtimeLab preview /> : null;
  return <PublicShell floatingTutor={false}><main style={{ maxWidth: 1440, margin: "auto", padding: "24px clamp(16px, 4vw, 48px) 80px" }}>
    <p><Link href="/hoc-lieu">← Về kho học liệu</Link></p><p role="status">Bản xem trước: thao tác chỉ tồn tại trong trang, không lưu tiến độ hay tạo bài nộp.</p>
    {content ?? <p>Chọn bài B21–B25 để xem trước.</p>}
  </main></PublicShell>;
}
