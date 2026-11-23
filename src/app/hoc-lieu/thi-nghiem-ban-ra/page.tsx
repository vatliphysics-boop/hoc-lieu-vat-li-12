import Link from "next/link";
import { HalfLifePilot } from "@/components/learning/HalfLifePilot";

export const metadata = { title: "Thí nghiệm bán rã | Vật lí hạt nhân", description: "Dự đoán, đo đạc và giải thích quy luật bán rã." };

export default function HalfLifeExperimentPage() {
  return <main style={{ maxWidth: 1440, margin: "0 auto", padding: "24px clamp(16px, 4vw, 48px) 80px" }}>
    <Link href="/hoc-lieu">← Về kho học liệu</Link>
    <HalfLifePilot />
  </main>;
}
