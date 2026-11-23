"use client";

import { useCallback, useState } from "react";
import { B25Hero } from "./B25Hero";
import { B25DataProcessLab } from "./B25DataProcessLab";
import { BindingEnergyCalculator, NuclearEquationBalancer } from "./B25Activities";
import { LatexMath } from "@/components/learning/LatexMath";
import styles from "./B25Lesson.module.css";

const TOC = [
  ["khoi-dong", "Khởi động"],
  ["muc-1", "I. Hệ thống hóa công thức"],
  ["muc-2", "II. Đọc đồ thị H(t) — Bảng 25.1"],
  ["muc-3", "III. Cân bằng phương trình hạt nhân"],
  ["muc-4", "IV. Năng lượng liên kết"],
  ["muc-5", "V. Sáu bài tập SGK"],
  ["video", "Video học liệu"],
] as const;

const FORMULAS = [
  {
    title: "Định luật phóng xạ",
    math: String.raw`N=N_0\,2^{-t/T}\qquad H=\lambda N=H_0\,2^{-t/T}`,
    note: "N là số hạt nhân còn lại, T là chu kì bán rã, H là độ phóng xạ (Bq = 1 phân rã/giây).",
  },
  {
    title: "Bảo toàn trong phương trình hạt nhân",
    math: String.raw`\textstyle\sum A_{\text{trước}}=\sum A_{\text{sau}}\quad \sum Z_{\text{trước}}=\sum Z_{\text{sau}}`,
    note: "Số khối A và điện tích Z bảo toàn. Với phân rã β hoặc phân hạch phải tính đủ các hạt phát ra.",
  },
  {
    title: "Độ hụt khối và năng lượng liên kết",
    math: String.raw`\Delta m=Z m_{\mathrm{H}}+N m_n-m_{\text{nguyên tử}}\qquad E_{\mathrm{lk}}=\Delta m\,c^2`,
    note: "Dùng 1 u·c² ≈ 931,5 MeV. Năng lượng liên kết riêng Elk/A dùng để so sánh độ bền hạt nhân.",
  },
  {
    title: "Hệ số nhân neutron",
    math: String.raw`k=\frac{\text{số neutron thế hệ sau}}{\text{số neutron thế hệ trước}}`,
    note: "k = 1 duy trì phản ứng dây chuyền ổn định; k < 1 tắt dần; k > 1 tăng theo cấp số nhân.",
  },
] as const;

export function B25Lesson() {
  const [done, setDone] = useState({ graph: false, balance: false, energy: false });
  const set = useCallback((key: keyof typeof done, value: boolean) => {
    setDone((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const steps = [
    { key: "graph" as const, label: "Đánh dấu Bảng 25.1, tự ước lượng chu kì bán rã T và đối chiếu" },
    { key: "balance" as const, label: "Tự nhập A, Z và cân bằng đúng ít nhất hai phương trình hạt nhân" },
    { key: "energy" as const, label: "Tính Elk cho ít nhất ba hạt nhân và trả lời câu hỏi" },
  ];

  return (
    <div className={styles.lesson}>
      <section id="khoi-dong"><B25Hero /></section>

      <nav className={styles.toc} aria-label="Mục lục Bài 25">
        {TOC.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>

      <article className={styles.body}>
        <section id="muc-1" className={styles.section}>
          <h2>I. Hệ thống hóa công thức</h2>
          <p className={styles.lead}>
            Bốn hệ thức dưới đây là toàn bộ công cụ cần cho sáu bài tập SGK. Mỗi thẻ ghi công thức, kí hiệu và
            một lưu ý về đơn vị hoặc điều kiện áp dụng.
          </p>
          <div className={styles.formulaGrid}>
            {FORMULAS.map((f) => (
              <div key={f.title} className={styles.formulaCard}>
                <strong>{f.title}</strong>
                <LatexMath block math={f.math} />
                <span>{f.note}</span>
              </div>
            ))}
          </div>
          <div className="physics-checklist">
            <p><strong>Tiêu chí hoàn thành bài học:</strong></p>
            <ul>
              {steps.map((s) => (
                <li key={s.key} className={done[s.key] ? "is-done" : ""}>
                  {s.label} {done[s.key] ? "✓" : ""}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="muc-2" className={styles.section}>
          <h2>II. Đọc đồ thị H(t) — Bảng 25.1</h2>
          <p className={styles.lead}>
            Tám mốc đo của SGK giữ nguyên, không thay bằng số sinh ngẫu nhiên. Hãy tự đánh dấu mốc kẹp H₀/2,
            nhập chu kì bán rã T ước lượng và lời giải thích của riêng em trước khi mở nhận xét đối chiếu.
          </p>
          <B25DataProcessLab onSubDone={(v) => set("graph", v)} />
        </section>

        <section id="muc-3" className={styles.section}>
          <h2>III. Cân bằng phương trình hạt nhân</h2>
          <p className={styles.lead}>
            Mỗi bài cho phương trình phân rã hoặc phân hạch còn khuyết một hạt nhân. Tự nhập số khối A và số
            proton Z vào hai ô trống rồi kiểm tra. Giải đúng ít nhất hai phương trình để hoàn thành mục này.
          </p>
          <NuclearEquationBalancer onSubDone={(v) => set("balance", v)} />
        </section>

        <section id="muc-4" className={styles.section}>
          <h2>IV. Năng lượng liên kết</h2>
          <p className={styles.lead}>
            Chọn hạt nhân, xem từng bước tính độ hụt khối và năng lượng liên kết, so sánh năng lượng liên kết
            riêng. Xem ít nhất ba hạt nhân và trả lời câu hỏi kiểm tra.
          </p>
          <BindingEnergyCalculator onSubDone={(v) => set("energy", v)} />
        </section>

        <section id="muc-5" className={styles.section}>
          <h2>V. Sáu bài tập SGK</h2>
          <p className={styles.lead}>
            Sáu bài tập trang 121–122. Mỗi bài có gợi ý hướng giải trong phần mở rộng — chỉ mở sau khi em đã
            tự thử tính trên giấy.
          </p>

          <div className={styles.exercise}>
            <div className={styles.exerciseHeader}>
              <span className={styles.exerciseBadge}>Bài 1</span>
              <strong>Lực nào làm lệch hạt α trong lá vàng?</strong>
            </div>
            <p>Trong thí nghiệm tán xạ alpha của Rutherford, hạt α bay gần hạt nhân vàng thì bị lệch hướng mạnh.</p>
            <details className={styles.exerciseAnswer}>
              <summary>Gợi ý và đáp án</summary>
              <p>Hạt α mang điện tích dương +2e, hạt nhân vàng mang điện tích dương +79e. Lực đẩy tĩnh điện Coulomb giữa hai điện tích cùng dấu làm hạt α lệch khỏi phương ban đầu. Lực hấp dẫn nhỏ hơn rất nhiều bậc độ lớn nên bỏ qua.</p>
            </details>
          </div>

          <div className={styles.exercise}>
            <div className={styles.exerciseHeader}>
              <span className={styles.exerciseBadge}>Bài 2</span>
              <strong>Vẽ đồ thị H(t) và ước lượng chu kì bán rã từ Bảng 25.1</strong>
            </div>
            <p>Dùng Bảng 25.1 SGK trang 121 (từ t = 0 s, H₀ = 151 Bq xuống t = 360 s, H = 9 Bq), ước lượng chu kì bán rã của mẫu.</p>
            <details className={styles.exerciseAnswer}>
              <summary>Gợi ý và đáp án</summary>
              <p>Mức một nửa ban đầu là H₀/2 = 75,5 Bq, nằm giữa hai mốc đo (30 s; 85 Bq) và (60 s; 55 Bq). Nội suy tuyến tính giữa hai mốc này cho T ≈ 39,5 s; khớp hàm mũ trên toàn bộ tám điểm đo cho T ≈ 40–45 s (cỡ khoảng 40 s).</p>
            </details>
          </div>

          <div className={styles.exercise}>
            <div className={styles.exerciseHeader}>
              <span className={styles.exerciseBadge}>Bài 3</span>
              <strong>Định tuổi mẫu gỗ cổ bằng đồng vị carbon-14</strong>
            </div>
            <p>Mẫu gỗ cổ chứa 25 g carbon có độ phóng xạ 240 phân rã/phút (4,0 Bq); T(¹⁴C) = 5730 năm. Tỉ lệ số nguyên tử ¹²C : ¹⁴C khi sinh vật còn sống là 10¹² : 1.</p>
            <details className={styles.exerciseAnswer}>
              <summary>Gợi ý và đáp án</summary>
              <p>Số nguyên tử ¹²C trong 25 g carbon là N(¹²C) ≈ (25/12)·6,022·10²³ ≈ 1,255·10²⁴ hạt ⇒ lúc còn sống mẫu có N₀(¹⁴C) ≈ 1,255·10¹² hạt. Độ phóng xạ ban đầu H₀ = (ln 2 / T)·N₀ ≈ 4,81 Bq (≈ 289 phân rã/phút). So với H = 4,0 Bq hiện tại: t = T·log₂(H₀/H) ≈ 5730 · log₂(289/240) ≈ 1,5·10³ năm.</p>
            </details>
          </div>

          <div className={styles.exercise}>
            <div className={styles.exerciseHeader}>
              <span className={styles.exerciseBadge} data-level="vận dụng">Bài 4</span>
              <strong>Nhiên liệu U-235 cho nhà máy điện hạt nhân trong 1 ngày, 1 năm và đối chiếu than đá</strong>
            </div>
            <p>Nhà máy điện hạt nhân có công suất phát điện 1400 MW, hiệu suất 36 %, mỗi phân hạch ²³⁵U tỏa năng lượng trung bình 200 MeV. Tính khối lượng ²³⁵U tiêu thụ trong 1 ngày, trong 1 năm hoạt động (365 ngày) và đối chiếu với khối lượng than đá (năng suất tỏa nhiệt khoảng 30 MJ/kg, cùng hiệu suất 36 %).</p>
            <details className={styles.exerciseAnswer}>
              <summary>Gợi ý và đáp án</summary>
              <p>
                • <strong>Trong 1 ngày (86 400 s):</strong> Điện năng sản xuất A<sub>điện</sub> = 1400·10⁶ · 86 400 ≈ 1,21·10¹⁴ J. Nhiệt lượng phân hạch cần cung cấp Q<sub>ngày</sub> = A<sub>điện</sub> / 0,36 ≈ 3,36·10¹⁴ J. Mỗi phân hạch tỏa E₁ = 200 MeV = 3,2·10⁻¹¹ J ⇒ số hạt phân hạch N<sub>ngày</sub> = 3,36·10¹⁴ / 3,2·10⁻¹¹ = 1,05·10²⁵ hạt. Khối lượng ²³⁵U cần mỗi ngày: m<sub>U, ngày</sub> = (1,05·10²⁵ / 6,022·10²³) · 0,235 kg ≈ <strong>4,10 kg/ngày</strong>.
                <br />• <strong>Trong 1 năm (365 ngày):</strong> Nhiệt lượng phân hạch Q<sub>năm</sub> = 365 · 3,36·10¹⁴ ≈ 1,226·10¹⁷ J; khối lượng ²³⁵U tiêu thụ cả năm: m<sub>U, năm</sub> = 365 · 4,10 kg ≈ <strong>1,50·10³ kg ≈ 1,5 tấn/năm</strong>.
                <br />• <strong>Đối chiếu than đá (q ≈ 30 MJ/kg = 3,0·10⁷ J/kg):</strong> Để sinh cùng nhiệt lượng trên cần m<sub>than, ngày</sub> = 3,36·10¹⁴ / 3,0·10⁷ ≈ <strong>11 200 tấn than/ngày</strong> và trong 1 năm cần m<sub>than, năm</sub> ≈ <strong>4,09 triệu tấn than đá/năm</strong> — lớn gấp khoảng 2,7 triệu lần khối lượng ²³⁵U!
              </p>
            </details>
          </div>

          <div className={styles.exercise}>
            <div className={styles.exerciseHeader}>
              <span className={styles.exerciseBadge} data-level="vận dụng">Bài 5</span>
              <strong>Thời gian chiếu xạ tăng dần theo tuổi nguồn Co-60</strong>
            </div>
            <p>Nguồn ⁶⁰Co có T = 5,3 năm. Tháng 1/2022 cần chiếu 150 phút để đạt liều quy định. Tính thời gian chiếu cần thiết vào tháng 6/2024 (sau 29 tháng) để đạt cùng liều đó.</p>
            <details className={styles.exerciseAnswer}>
              <summary>Gợi ý và đáp án</summary>
              <p>Với khoảng thời gian chiếu ngắn hơn rất nhiều so với T = 5,3 năm, liều chiếu xấp xỉ tỉ lệ với H · Δt. Do độ phóng xạ giảm còn H = H₀ · 2<sup>−29/(12·5,3)</sup>, thời gian chiếu phải tăng tỉ lệ nghịch với H: Δt<sub>mới</sub> = 150 · 2<sup>29/63,6</sup> ≈ <strong>206 phút</strong>.</p>
            </details>
          </div>

          <div className={styles.exercise}>
            <div className={styles.exerciseHeader}>
              <span className={styles.exerciseBadge} data-level="vận dụng">Bài 6</span>
              <strong>Điều chế ¹⁸F và phân liều thuốc ¹⁸F-FDG cho hai bệnh nhân PET (SGK tr. 122)</strong>
            </div>
            <p>
              a) Viết phương trình hạt nhân điều chế ¹⁸₉F khi bắn phá bia nước giàu đồng vị ¹⁸₈O bằng chùm proton ¹₁p (kèm phát tia γ).
              <br />
              b) Đồng vị ¹⁸F trong dược chất FDG có T = 110 phút. Cùng một mẻ thuốc chuẩn bị lúc ban đầu (t = 0) được chia liều cho hai bệnh nhân A và B có cùng cân nặng; người B được tiêm <strong>muộn hơn người A 60 phút</strong>. Để <strong>tại thời điểm tiêm của mỗi người</strong> cả hai đều nhận cùng hoạt độ điều trị (0,1 mCi/kg), lúc chuẩn bị ban đầu cần lấy lượng thuốc cho ai nhiều hơn và gấp bao nhiêu lần?
            </p>
            <details className={styles.exerciseAnswer}>
              <summary>Gợi ý và đáp án</summary>
              <div>
                <p>
                  <strong>a) Phương trình hạt nhân điều chế ¹⁸₉F</strong> (bảo toàn số khối A: 18 + 1 = 18 + 1 + 0 = 19; bảo toàn điện tích Z: 8 + 1 = 9 + 0 + 0 = 9):
                </p>
                <LatexMath block math={String.raw`{}^{18}_{8}\mathrm{O}+{}^{1}_{1}\mathrm{p}\rightarrow{}^{18}_{9}\mathrm{F}+{}^{1}_{0}\mathrm{n}+\gamma`} />
                <p>
                  <strong>b) So sánh liều chuẩn bị lúc ban đầu (t = 0):</strong> Giả sử người A tiêm tại thời điểm t<sub>A</sub>, còn người B tiêm muộn hơn 60 phút tại t<sub>B</sub> = t<sub>A</sub> + 60 (phút). Để tại đúng lúc tiêm mỗi người đều nhận cùng hoạt độ H<sub>tiêm</sub> (vì cùng cân nặng và cùng liều 0,1 mCi/kg), hoạt độ cần lấy từ mẻ thuốc lúc chuẩn bị ban đầu (t = 0) cho từng người phải bù phần phân rã trong thời gian chờ:
                </p>
                <LatexMath
                  block
                  math={String.raw`H_{0\mathrm{A}}=H_{\text{tiêm}}\cdot 2^{\frac{t_{\mathrm{A}}}{110}},\qquad H_{0\mathrm{B}}=H_{\text{tiêm}}\cdot 2^{\frac{t_{\mathrm{A}}+60}{110}}\implies\frac{H_{0\mathrm{B}}}{H_{0\mathrm{A}}}=2^{\frac{60}{110}}=2^{\frac{6}{11}}\approx 1{,}46`}
                />
                <p>
                  <strong>Kết luận:</strong> Phần thuốc của <strong>bệnh nhân B (tiêm muộn hơn 60 phút)</strong> bị phân rã lâu hơn trước khi tiêm, nên lúc chuẩn bị ban đầu phải lấy cho <strong>bệnh nhân B lượng hoạt độ (thể tích thuốc ¹⁸F-FDG) LỚN HƠN bệnh nhân A gấp 2<sup>60/110</sup> ≈ 1,46 lần (tức nhiều hơn khoảng 46 %)</strong>.
                </p>
              </div>
            </details>
          </div>
        </section>

        <section id="video" className={styles.section}>
          <h2>Video học liệu</h2>
          <p className={styles.lead}>Hướng dẫn đọc Bảng 25.1 và đối chiếu đường lí thuyết với số liệu SGK.</p>
          <div className={styles.videoCard}>
            <h3 className={styles.videoTitle}>Bài 25 – Bài tập về vật lí hạt nhân</h3>
            <p className={styles.videoMeta}>
              Thời lượng 1:16 · Phụ đề tiếng Việt · Thuyết minh tổng hợp tiếng Việt (VieNeu-TTS · Kim Thanh)
            </p>
            <video className={styles.video} controls preload="metadata" poster="/videos/nuclear-lessons-v2/b25.jpg">
              <source src="/videos/nuclear-lessons-v2/b25.mp4" type="video/mp4" />
              <track kind="subtitles" srcLang="vi" src="/videos/nuclear-lessons-v2/b25.vi.vtt" label="Tiếng Việt" default />
              Trình duyệt của bạn không hỗ trợ video HTML5.
            </video>
          </div>
        </section>
      </article>
    </div>
  );
}
