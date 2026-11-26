/**
 * Demo route for Rutherford Apparatus V3
 * Testing apparatus-first 3D simulation before integration
 */

import { Suspense, lazy } from "react";

// Lazy load the 3D component (it's client-side with Three.js)
const RutherfordApparatusV3 = lazy(() =>
  import("@/simulations-v3/apparatus/rutherford/RutherfordApparatusV3")
);

export const metadata = {
  title: "Rutherford Apparatus V3 — Demo | Vật lí hạt nhân",
  description: "Thí nghiệm Geiger–Marsden với thiết bị 3D, nhiều góc nhìn và registry linh kiện.",
};

export default function RutherfordV3DemoPage() {
  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
      <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>
        Rutherford Apparatus V3 — Demo
      </h1>
      <p style={{ fontSize: "15px", color: "var(--text-secondary, #64748b)", marginBottom: "32px" }}>
        Thí nghiệm tán xạ hạt alpha Geiger–Marsden / Rutherford (SGK Vật lí 12 Kết nối tri thức, Hình 21.2, tr. 91–92).
      </p>

      <Suspense
        fallback={
          <div
            style={{
              padding: "120px 24px",
              textAlign: "center",
              background: "var(--bg-surface-elevated, #f8fafc)",
              borderRadius: "12px",
              color: "var(--text-muted, #64748b)",
            }}
          >
            Đang tải mô phỏng 3D...
          </div>
        }
      >
        <RutherfordApparatusV3 />
      </Suspense>

      <div style={{ marginTop: "48px", padding: "24px", background: "var(--bg-surface-elevated, #f8fafc)", borderRadius: "12px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>
          Tính năng Thiết bị 3D &amp; Bàn khảo sát Rutherford V3
        </h2>
        <ul style={{ lineHeight: 2, fontSize: "15px", paddingLeft: "24px" }}>
          <li><strong>Đối chiếu Hình 21.2 (SGK tr. 91):</strong> Làm rõ 4 bộ phận cốt lõi R (Nguồn hạt α), D (Lá vàng mỏng), S (Màn huỳnh quang), M (Kính hiển vi) cùng hộp chân không G và chân đế P — xoay 360°, thu phóng và nhấp đọc công dụng trực tiếp</li>
          <li><strong>Đa góc nhìn trực quan:</strong> Toàn cảnh, Cắt lớp (Hình 21.2a), Qua kính hiển vi M, Mặt cắt (Hình 21.2b), Tách rời linh kiện — chỉ rõ vị trí (1) tại 0° và vị trí (2) tại góc lệch &gt; 90°</li>
          <li><strong>Đốm lóe trên màn S &amp; Mô hình giải thích:</strong> Phát đốm sáng huỳnh quang xanh lục trên màn S khi hạt α tới màn; gắn nhãn riêng cho Đường đi hạt α và Góc lệch θ trong chế độ “Mô hình giải thích”</li>
          <li><strong>Khảo sát 2 lượt độc lập bền vững:</strong> Lưu độc lập Lượt 1 &amp; Lượt 2 (hiển thị rõ E (MeV), b (fm), θ (°)), khôi phục sau khi tải lại trang và tự cảnh báo khi hai lượt khác E hoặc trùng b</li>
          <li><strong>Physics engine độc lập:</strong> Quỹ đạo tán xạ Coulomb cổ điển chính xác theo CODATA 2022 và phân bố góc 1/sin⁴(θ/2)</li>
        </ul>

        <h3 style={{ fontSize: "16px", fontWeight: 600, marginTop: "24px", marginBottom: "12px" }}>
          Nguồn khoa học
        </h3>
        <ul style={{ fontSize: "13px", lineHeight: 1.8, paddingLeft: "24px", color: "var(--text-secondary, #64748b)" }}>
          <li>Geiger, H., & Marsden, E. (1909). On a Diffuse Reflection of the α-Particles. Proceedings of the Royal Society A, 82(557), 495–500.</li>
          <li>Rutherford, E. (1911). The Scattering of α and β Particles by Matter and the Structure of the Atom. Philosophical Magazine, 21(125), 669–688.</li>
          <li>CODATA 2022 — NIST recommended values</li>
        </ul>

        <h3 style={{ fontSize: "16px", fontWeight: 600, marginTop: "24px", marginBottom: "12px" }}>
          Giới hạn mô hình
        </h3>
        <p style={{ fontSize: "13px", lineHeight: 1.8, color: "var(--text-secondary, #64748b)" }}>
          Mô hình Coulomb cổ điển, hạt nhân vàng cố định. Bỏ qua electron, độ giật lùi, tương tác hạt nhân mạnh.
          Kích thước và tỉ lệ trong 3D là quy ước sư phạm để dễ quan sát, không phải ảnh thật.
          Histogram là mô hình lí thuyết, không phải dữ liệu đo.
        </p>
      </div>
    </div>
  );
}
