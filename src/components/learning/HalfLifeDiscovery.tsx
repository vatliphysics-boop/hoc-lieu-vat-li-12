import { HalfLifePilot } from "@/components/learning/HalfLifePilot";

/** Public practice; assigned B23 steps are handled separately by the pathway viewer. */
export function HalfLifeDiscovery() {
  return <section className="student-paper half-life-discovery" style={{ marginBottom: 48 }} aria-label="Khám phá bán rã trước giờ học">
    <p className="student-kicker">B23 · Chuẩn bị trước giờ học</p>
    <HalfLifePilot />
  </section>;
}
