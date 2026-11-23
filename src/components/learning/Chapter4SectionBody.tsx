"use client";
/* eslint-disable @next/next/no-img-element -- Scientific apparatus capture and explicit dimensions */

import { useState } from "react";
import {
  isVerifiedVideoUrl,
  type Chapter4SectionSpec,
  type StudentLessonNotebook,
} from "@/lib/chapter4-lessons";
import { NUCLEAR_LAB_LESSONS } from "@/lib/nuclear-lab-lessons";
import { SGK_TABLE_25_1 } from "@/lib/sgk-b25-decay";
import { FixedPhysicsActivityRenderer } from "@/components/physics/FixedPhysicsActivityRenderer";
import {
  BindingEnergyCalculator,
  NuclearEquationBalancer,
} from "@/components/physics/B25Activities";
import { LatexMath } from "./LatexMath";
import { NuclearLessonVideo } from "./NuclearLessonVideo";
import { Nuclide } from "./Nuclide";
import { AtomicModelsComparisonSim } from "./AtomicModelsComparisonSim";
import styles from "./NuclearLabManual.module.css";

const B21_PREDICTION_CHOICES = [
  {
    id: "straight",
    label:
      "Hầu hết hạt α đi xuyên thẳng hoặc chỉ lệch góc rất nhỏ (< 1°); không có hạt nào bật ngược lại.",
  },
  {
    id: "deflect_large",
    label:
      "Đa số hạt α đi xuyên thẳng, nhưng có một tỉ lệ nhỏ bị lệch góc lớn, thậm chí bật ngược (> 90°).",
  },
  {
    id: "blocked",
    label: "Lá vàng chắn gần hết chùm hạt α, hầu như không có đốm sáng phía sau lá vàng.",
  },
] as const;

const B21_RADIUS_ROWS = [
  { sym: "H", a: 1, z: 1, name: "Hydrogen-1", rExp: "0,9", rFormula: "1,2" },
  { sym: "He", a: 4, z: 2, name: "Helium-4", rExp: "1,7", rFormula: "1,9" },
  { sym: "C", a: 12, z: 6, name: "Carbon-12", rExp: "2,5", rFormula: "2,7" },
  { sym: "Si", a: 28, z: 14, name: "Silicon-28", rExp: "3,1", rFormula: "3,6" },
  { sym: "Fe", a: 56, z: 26, name: "Iron-56", rExp: "3,7", rFormula: "4,6" },
  { sym: "Au", a: 197, z: 79, name: "Gold-197", rExp: "5,4", rFormula: "7,0" },
  { sym: "U", a: 238, z: 92, name: "Uranium-238", rExp: "5,9", rFormula: "7,4" },
] as const;

const GEIGER_5S_INTERVALS = [
  { window: "0 – 5", counts: 29 },
  { window: "5 – 10", counts: 34 },
  { window: "10 – 15", counts: 26 },
  { window: "15 – 20", counts: 31 },
  { window: "20 – 25", counts: 28 },
  { window: "25 – 30", counts: 33 },
] as const;

export interface Chapter4SectionBodyProps {
  readonly lessonCode: "B21" | "B22" | "B23" | "B24" | "B25";
  readonly section: Chapter4SectionSpec;
  readonly notebook: StudentLessonNotebook;
  readonly onSavePreClassPrediction: (choice: string, reason: string) => void;
  readonly onMarkSectionComplete: (sectionId: string, done: boolean) => void;
  readonly onJumpToSection: (sectionId: string) => void;
}

function VerifiedFlowVideoBlock({ url, title }: { readonly url?: string; readonly title: string }) {
  // Quy tắc nghiêm ngặt: Video Flow chỉ hiện nút phát khi đã có tệp/URL video thật
  if (!isVerifiedVideoUrl(url)) {
    return null;
  }
  return (
    <div style={{ marginBottom: "20px", border: "1px solid #d0d7de", background: "#0b1220", padding: "12px" }}>
      <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 700, color: "#f4f4f4" }}>
        Video minh họa trực quan (Flow): {title}
      </p>
      <video
        controls
        playsInline
        preload="metadata"
        src={url}
        style={{ width: "100%", maxHeight: "420px", display: "block", background: "#000" }}
      >
        Trình duyệt chưa hỗ trợ phát trực tiếp. <a href={url}>Mở tệp video</a>.
      </video>
    </div>
  );
}

export function Chapter4SectionBody({
  lessonCode,
  section,
  notebook,
  onSavePreClassPrediction,
  onMarkSectionComplete,
  onJumpToSection,
}: Chapter4SectionBodyProps) {
  const [predChoiceDraft, setPredChoiceDraft] = useState<string | null>(null);
  const [predReasonDraft, setPredReasonDraft] = useState<string | null>(null);
  const predChoice = predChoiceDraft ?? notebook.preClassPredictionChoice ?? "";
  const predReason = predReasonDraft ?? notebook.preClassPredictionReason ?? "";
  const [predSavedMsg, setPredSavedMsg] = useState("");

  // State cho câu hỏi kiểm tra nhanh ở các mục đọc/vận dụng
  const [alZ, setAlZ] = useState("");
  const [alN, setAlN] = useState("");
  const [alChoice, setAlChoice] = useState("");
  const [alChecked, setAlChecked] = useState(false);

  const [b22AfterChoice, setB22AfterChoice] = useState("");
  const [b24AfterChoice, setB24AfterChoice] = useState("");
  const [b25ElecChoice, setB25ElecChoice] = useState("");
  const [b25AfterDays, setB25AfterDays] = useState("");
  const [b25EqDone, setB25EqDone] = useState(false);
  const [b25BindDone, setB25BindDone] = useState(false);

  const b21VideoLesson = NUCLEAR_LAB_LESSONS.find((l) => l.code === lessonCode);

  const chosenPredictionLabel = B21_PREDICTION_CHOICES.find(
    (c) => c.id === notebook.preClassPredictionChoice
  )?.label;

  return (
    <div>
      <VerifiedFlowVideoBlock url={section.flowVideoUrl} title={section.title} />

      {/* ====================================================================
          BÀI 21 — 1. TRƯỚC GIỜ HỌC: NHẬN DIỆN THIẾT BỊ & GHI DỰ ĐOÁN
          ==================================================================== */}
      {section.kind === "b21_pre_rutherford" && (
        <div>
          <figure className={styles.darkBenchStage} style={{ margin: "0 0 20px" }}>
            <img
              src="/illustrations/rutherford-v3-apparatus.png"
              alt="Ảnh chụp bộ thí nghiệm tán xạ hạt alpha Rutherford V3 đang chạy: bên trái là hộp chì chứa nguồn phát hạt alpha và khe chuẩn trực, chính giữa là lá vàng mỏng, bao quanh là màn huỳnh quang ZnS và kính hiển vi thu đốm sáng"
              width={960}
              height={480}
              style={{ width: "100%", height: "auto", maxHeight: "380px", objectFit: "cover", display: "block" }}
            />
            <figcaption className={styles.darkBenchCaption}>
              <strong>Chú thích bộ thiết bị Rutherford V3 (nhìn ngang từ mặt bên buồng chân không):</strong>{" "}
              (1) <strong>Nguồn α trong hộp chì</strong> bên trái phát chùm hạt mang điện dương{" "}
              <code>+2e</code> → (2) <strong>Khe chuẩn trực</strong> tạo chùm tia hẹp → (3){" "}
              <strong>Lá vàng rất mỏng</strong> (<Nuclide sym="Au" a={197} z={79} />, dày cỡ{" "}
              <code>4 × 10⁻⁷ m</code>) đặt tại tâm → (4) <strong>Vòng màn huỳnh quang ZnS</strong> và{" "}
              <strong>kính hiển vi</strong> xoay quanh tâm để đếm các đốm sáng nhấp nháy.
            </figcaption>
          </figure>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div style={{ border: "1px solid #a6c8ff", background: "#edf5ff", padding: "14px" }}>
              <strong style={{ display: "block", color: "#002d9c", marginBottom: "4px" }}>
                1. Dấu hiệu quan sát trực tiếp trong thí nghiệm thật
              </strong>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.55 }}>
                Mắt người đặt sau kính hiển vi <strong>chỉ nhìn thấy các đốm sáng lóe lên trên màn ZnS</strong>{" "}
                mỗi khi có một hạt α đập vào màn. Vị trí góc của màn cho biết hạt α đã lệch đi bao nhiêu độ sau khi xuyên qua lá vàng.
              </p>
            </div>
            <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "14px" }}>
              <strong style={{ display: "block", color: "#161616", marginBottom: "4px" }}>
                2. Đường quỹ đạo là phần mô hình giải thích
              </strong>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.55 }}>
                Ta <strong>không nhìn thấy đường bay của từng hạt α</strong> bằng mắt thường. Đường cong màu lam trong mô phỏng là{" "}
                <em>mô hình quỹ đạo</em> được dựng từ định luật tương tác tĩnh điện để giải thích phân bố đốm sáng trên màn.
              </p>
            </div>
          </div>

          <div
            style={{
              border: "1px solid #8d8d8d",
              background: "#ffffff",
              padding: "16px",
              marginBottom: "18px",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
              Phiếu dự đoán trước giờ học (sẽ được mở lại khi đo trên lớp)
            </h4>
            <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#525252", lineHeight: 1.55 }}>
              Giả sử trước năm 1911, người ta cho rằng điện tích dương phân bố đều khắp thể tích nguyên tử vàng. Theo em, khi bắn chùm hạt α nhanh vào lá vàng rất mỏng thì các đốm sáng trên màn ZnS sẽ xuất hiện thế nào?
            </p>
            <fieldset style={{ border: "none", margin: "0 0 12px", padding: 0 }}>
              <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
                Chọn một dự đoán ban đầu của em:
              </legend>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {B21_PREDICTION_CHOICES.map((opt) => (
                  <label
                    key={opt.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "10px 12px",
                      border:
                        predChoice === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                      background: predChoice === opt.id ? "#edf5ff" : "#fafafa",
                      cursor: "pointer",
                      fontSize: "14px",
                      lineHeight: 1.5,
                    }}
                  >
                    <input
                      type="radio"
                      name="b21-pre-prediction"
                      value={opt.id}
                      checked={predChoice === opt.id}
                      onChange={() => {
                        setPredChoiceDraft(opt.id);
                        setPredSavedMsg("");
                      }}
                      style={{ marginTop: "3px" }}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }} htmlFor="b21-pre-reason">
              Lí do ngắn gọn cho dự đoán của em:
            </label>
            <textarea
              id="b21-pre-reason"
              className={styles.evidenceTextarea}
              rows={2}
              value={predReason}
              onChange={(e) => {
                setPredReasonDraft(e.target.value);
                setPredSavedMsg("");
              }}
              placeholder="Ví dụ: Vì lá vàng rất mỏng và nguyên tử gần như rỗng / hoặc vì hạt α mang điện dương…"
            />

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginTop: "12px" }}>
              <button
                type="button"
                className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                onClick={() => {
                  if (!predChoice) {
                    setPredSavedMsg("Em hãy chọn một phương án dự đoán trước khi lưu.");
                    return;
                  }
                  onSavePreClassPrediction(predChoice, predReason.trim());
                  onMarkSectionComplete(section.id, true);
                  setPredSavedMsg("Đã lưu dự đoán trước giờ học. Em có thể chuyển sang thí nghiệm trên lớp để kiểm chứng.");
                }}
              >
                Lưu dự đoán trước giờ học
              </button>
              <button
                type="button"
                className={styles.cdsBtn}
                onClick={() => onJumpToSection("b21-rutherford-v3")}
              >
                Mở ngay Rutherford V3 (Trong giờ học) →
              </button>
              {predSavedMsg && (
                <span role="status" style={{ fontSize: "13.5px", fontWeight: 600, color: predChoice ? "#198038" : "#b42332" }}>
                  {predSavedMsg}
                </span>
              )}
            </div>
          </div>

          {b21VideoLesson && (
            <details style={{ border: "1px solid #e0e0e0", padding: "12px 14px", background: "#fafafa" }}>
              <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "14px" }}>
                Tư liệu nghe nhìn tự chọn: Video tóm tắt Bài 21 (có phụ đề tiếng Việt)
              </summary>
              <div style={{ marginTop: "12px" }}>
                <NuclearLessonVideo lesson={b21VideoLesson} />
              </div>
            </details>
          )}
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — 2. TRONG GIỜ HỌC: THÍ NGHIỆM TÁN XẠ HẠT ALPHA (RUTHERFORD V3)
          ==================================================================== */}
      {section.kind === "b21_rutherford_v3" && (
        <div>
          <div className={styles.predictionEchoBox}>
            {chosenPredictionLabel ? (
              <>
                <strong>Dự đoán em đã ghi trước giờ học:</strong> “{chosenPredictionLabel}”
                {notebook.preClassPredictionReason ? (
                  <span> — <em>Lí do: {notebook.preClassPredictionReason}</em></span>
                ) : null}
                <div style={{ marginTop: "4px", color: "#525252" }}>
                  Hãy dùng bàn thí nghiệm Rutherford V3 bên dưới, lưu <strong>hai lượt đo cùng động năng E nhưng khác tham số va chạm b</strong> để đối chiếu với dự đoán trên.
                </div>
              </>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <span>
                  <strong>Gợi ý đối chiếu:</strong> Em chưa lưu dự đoán ở pha Trước giờ học. Em có thể dự đoán ngay trong phiếu điều tra bên dưới hoặc quay lại mục đầu để ghi trước.
                </span>
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnSmall}`}
                  onClick={() => onJumpToSection("b21-pre-setup")}
                >
                  Xem mục Trước giờ học
                </button>
              </div>
            )}
          </div>

          <p style={{ margin: "0 0 12px", fontSize: "13.5px", color: "#525252" }}>
            <strong>Nhắc lại quy ước quan sát:</strong> Đốm sáng xanh lá trên vòng màn ZnS là{" "}
            <strong>dấu hiệu quan sát thực nghiệm</strong>; đường tia màu lam quanh tâm là{" "}
            <strong>quỹ đạo mô hình</strong> giúp giải thích góc tán xạ <code>θ</code>.
          </p>

          <FixedPhysicsActivityRenderer
            activityKey="rutherford_alpha_scattering"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — 3. TRONG GIỜ HỌC: SO SÁNH CÁC MÔ HÌNH NGUYÊN TỬ
          ==================================================================== */}
      {section.kind === "b21_atomic_models" && (
        <div>
          <AtomicModelsComparisonSim
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
            onOpenRutherfordV3={() => onJumpToSection("b21-rutherford-v3")}
          />

          <details
            style={{
              marginTop: "14px",
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "12px 16px",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "14px",
                color: "#161616",
              }}
            >
              Bảng tóm tắt đối chiếu ba mô hình theo ba câu hỏi cốt lõi (SGK tr. 91–93)
            </summary>
            <div className={styles.tableScroll} style={{ marginTop: "12px", marginBottom: 0 }}>
              <table className={styles.cdsTable}>
                <thead>
                  <tr>
                    <th scope="col" style={{ minWidth: "170px" }}>Câu hỏi so sánh</th>
                    <th scope="col" style={{ minWidth: "190px" }}>1. Mô hình Thomson</th>
                    <th scope="col" style={{ minWidth: "200px" }}>2. Mô hình hành tinh Rutherford</th>
                    <th scope="col" style={{ minWidth: "200px" }}>3. Mô hình đám mây electron</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Điện tích dương ở đâu?</th>
                    <td>Phân bố trong toàn bộ thể tích hình cầu nguyên tử cỡ <code>10⁻¹⁰ m</code>.</td>
                    <td>Tập trung tại <strong>hạt nhân rất nhỏ ở tâm</strong> cỡ <code>10⁻¹⁴ – 10⁻¹⁵ m</code>.</td>
                    <td>Tập trung tại <strong>hạt nhân rất nhỏ ở tâm</strong>.</td>
                  </tr>
                  <tr>
                    <th scope="row">Electron được mô tả thế nào?</th>
                    <td>Nằm bên trong vùng tích điện dương.</td>
                    <td>Chuyển động trên quỹ đạo xác định quanh hạt nhân (theo mô hình lịch sử).</td>
                    <td>Biểu diễn bằng <strong>đám mây xác suất (orbital)</strong>; mật độ chấm đo vị trí tỉ lệ với xác suất tìm thấy electron.</td>
                  </tr>
                  <tr>
                    <th scope="row">Liên hệ với thí nghiệm lá vàng?</th>
                    <td>Không giải thích được các hạt α lệch góc lớn hoặc bật ngược.</td>
                    <td><strong>Được chứng minh trực tiếp</strong> về sự tập trung điện tích dương ở hạt nhân nhỏ.</td>
                    <td>Kế thừa hạt nhân nhỏ của Rutherford; phần đám mây xác suất dựa trên bước kiến thức lượng tử khác.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — 4. TRONG GIỜ HỌC: CẤU TẠO VÀ KÍCH THƯỚC HẠT NHÂN
          ==================================================================== */}
      {section.kind === "b21_structure_size" && (
        <div>
          {/* Hạt nhân mẫu Silic-28 */}
          <div
            style={{
              border: "1px solid #d0d7de",
              background: "#f8fafc",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
              1. Nhận diện thành phần hạt nhân qua nguyên tử Silic-28 (<Nuclide sym="Si" a={28} z={14} />)
            </h4>
            <p style={{ margin: "0 0 12px", fontSize: "14px", lineHeight: 1.55 }}>
              Hạt nhân nguyên tử được tạo thành từ các hạt <strong>nucleon</strong> gồm hai loại:{" "}
              <strong>proton (p)</strong> mang điện tích dương <code>+1e</code> và{" "}
              <strong>neutron (n)</strong> không mang điện. Với hạt nhân Silic-28 (<Nuclide sym="Si" a={28} z={14} />) trong SGK tr. 93:
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "10px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", padding: "10px 12px" }}>
                <span style={{ fontSize: "12px", color: "#525252", display: "block" }}>
                  Điện tích / Số proton (Z)
                </span>
                <strong style={{ fontSize: "18px", color: "#0f62fe" }}>Z = 14 proton</strong>
              </div>
              <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", padding: "10px 12px" }}>
                <span style={{ fontSize: "12px", color: "#525252", display: "block" }}>
                  Số khối / Tổng nucleon (A)
                </span>
                <strong style={{ fontSize: "18px", color: "#161616" }}>A = 28 nucleon</strong>
              </div>
              <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", padding: "10px 12px" }}>
                <span style={{ fontSize: "12px", color: "#525252", display: "block" }}>
                  Số neutron (N = A − Z)
                </span>
                <strong style={{ fontSize: "18px", color: "#198038" }}>N = 28 − 14 = 14 neutron</strong>
              </div>
            </div>
          </div>

          {/* Cảnh báo rõ ràng khi hai hình dùng tỉ lệ phóng đại khác nhau */}
          <div className={styles.scaleWarningBox}>
            <strong>Lưu ý quan trọng về hai tỉ lệ phóng đại khác nhau (SGK tr. 93–94):</strong>{" "}
            Trong các sơ đồ minh họa nguyên tử <Nuclide sym="Si" a={28} z={14} />,{" "}
            <strong>hình nguyên tử</strong> (đường kính cỡ <code>2,2 × 10⁻¹⁰ m</code>) và{" "}
            <strong>hình chi tiết hạt nhân</strong> (bán kính cỡ <code>3,1 × 10⁻¹⁵ m</code>) dùng{" "}
            <strong>hai tỉ lệ phóng đại chênh lệch nhau hơn 35 000 lần</strong>. Nếu vẽ đúng một tỉ lệ chung mà nguyên tử có đường kính <code>10 m</code> (bằng cả phòng học), thì hạt nhân <Nuclide sym="Si" a={28} z={14} /> ở tâm chỉ nhỏ cỡ <code>0,3 mm</code> (nhỏ hơn đầu tăm).
          </div>

          {/* Bảng 21.1 so sánh kích thước nguyên tử với hạt nhân */}
          <div className={styles.tableScroll}>
            <table className={styles.cdsTable}>
              <caption>
                Bảng 21.1 — Đối chiếu kích thước nguyên tử, hạt nhân và bán kính một số hạt nhân (1 fm = 10⁻¹⁵ m)
              </caption>
              <thead>
                <tr>
                  <th scope="col">Đối tượng / Hạt nhân</th>
                  <th scope="col">Kí hiệu</th>
                  <th scope="col" className={styles.numCell}>Số khối A</th>
                  <th scope="col" className={styles.numCell}>Bán kính thực nghiệm</th>
                  <th scope="col" className={styles.numCell}>Theo R ≈ 1,2·A¹/³ (fm)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: "#edf5ff" }}>
                  <th scope="row">Nguyên tử (vỏ electron)</th>
                  <td>Ví dụ nguyên tử Si, Au</td>
                  <td className={styles.numCell}>—</td>
                  <td className={styles.numCell}>~ 100 000 fm (10⁻¹⁰ m)</td>
                  <td className={styles.numCell}>Lớn gấp 10⁴ – 10⁵ lần hạt nhân</td>
                </tr>
                {B21_RADIUS_ROWS.map((row) => (
                  <tr
                    key={row.sym}
                    style={row.sym === "Si" ? { background: "#fcf4d6", fontWeight: 600 } : undefined}
                  >
                    <th scope="row">{row.name}</th>
                    <td>
                      <Nuclide sym={row.sym} a={row.a} z={row.z} />
                    </td>
                    <td className={styles.numCell}>{row.a}</td>
                    <td className={styles.numCell}>{row.rExp} fm</td>
                    <td className={styles.numCell}>{row.rFormula} fm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <LatexMath
              block
              math={String.raw`R \approx R_0\,A^{1/3}, \qquad R_0 \approx 1{,}2 \times 10^{-15}\,\mathrm{m} = 1{,}2\,\mathrm{fm}`}
            />
          </div>

          <h4 style={{ margin: "20px 0 10px", fontSize: "16px" }}>
            2. Thực hành dựng hạt nhân <Nuclide sym="Si" a={28} z={14} /> và kiểm tra Z, N, A
          </h4>
          <FixedPhysicsActivityRenderer
            activityKey="nuclear_structure_builder"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — 5. TRONG GIỜ HỌC: KÍ HIỆU HẠT NHÂN VÀ ĐỒNG VỊ
          ==================================================================== */}
      {section.kind === "b21_symbol_isotopes" && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "14px",
              marginBottom: "18px",
            }}
          >
            <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "14px 16px" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "15.5px" }}>
                Quy tắc đọc kí hiệu hạt nhân <Nuclide sym="X" a="A" z="Z" />
              </h4>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "14px", lineHeight: 1.6 }}>
                <li>
                  <strong>X</strong>: Kí hiệu hóa học của nguyên tố (ví dụ{" "}
                  <Nuclide sym="Si" a={28} z={14} />, <Nuclide sym="Au" a={197} z={79} />).
                </li>
                <li>
                  <strong>Chỉ số trên A (số khối)</strong>: Tổng số nucleon (<code>A = Z + N</code>).
                </li>
                <li>
                  <strong>Chỉ số dưới Z (số hiệu nguyên tử)</strong>: Số proton trong hạt nhân.
                </li>
                <li>
                  <strong>Số neutron</strong>: <code>N = A − Z</code>.
                </li>
              </ul>
            </div>

            <div style={{ border: "1px solid #a6c8ff", background: "#edf5ff", padding: "14px 16px" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "15.5px", color: "#002d9c" }}>
                Khái niệm đồng vị (SGK tr. 94–95)
              </h4>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6 }}>
                Các <strong>đồng vị</strong> của cùng một nguyên tố là những hạt nhân có{" "}
                <strong>cùng số proton Z</strong> (nên có cùng vị trí trong bảng tuần hoàn và tính chất hóa học tương tự), nhưng{" "}
                <strong>khác số neutron N</strong> nên <strong>khác số khối A</strong>.
              </p>
            </div>
          </div>

          <div className={styles.tableScroll}>
            <table className={styles.cdsTable}>
              <caption>
                So sánh ba đồng vị của nguyên tố Hydrogen (SGK tr. 95)
              </caption>
              <thead>
                <tr>
                  <th scope="col">Tên đồng vị</th>
                  <th scope="col">Kí hiệu chuẩn</th>
                  <th scope="col" className={styles.numCell}>Số proton Z</th>
                  <th scope="col" className={styles.numCell}>Số khối A</th>
                  <th scope="col" className={styles.numCell}>Số neutron N = A − Z</th>
                  <th scope="col">Đặc điểm trong tự nhiên</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Protium (Hydrogen thường)</th>
                  <td>
                    <Nuclide sym="H" a={1} z={1} />
                  </td>
                  <td className={styles.numCell}>1</td>
                  <td className={styles.numCell}>1</td>
                  <td className={styles.numCell}>0</td>
                  <td>Bền, chiếm khoảng 99,985% lượng Hydrogen tự nhiên; hạt nhân chỉ có 1 proton.</td>
                </tr>
                <tr>
                  <th scope="row">Deuterium (Hydrogen nặng)</th>
                  <td>
                    <Nuclide sym="H" a={2} z={1} /> (hay <Nuclide sym="D" a={2} z={1} />)
                  </td>
                  <td className={styles.numCell}>1</td>
                  <td className={styles.numCell}>2</td>
                  <td className={styles.numCell}>1</td>
                  <td>Bền, chiếm khoảng 0,015%; tạo nên phân tử nước nặng D₂O dùng trong lò phản ứng.</td>
                </tr>
                <tr>
                  <th scope="row">Tritium (Hydrogen siêu nặng)</th>
                  <td>
                    <Nuclide sym="H" a={3} z={1} /> (hay <Nuclide sym="T" a={3} z={1} />)
                  </td>
                  <td className={styles.numCell}>1</td>
                  <td className={styles.numCell}>3</td>
                  <td className={styles.numCell}>2</td>
                  <td>Đồng vị phóng xạ (chu kì bán rã khoảng 12,3 năm); nhiên liệu phản ứng nhiệt hạch D–T.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 style={{ margin: "20px 0 10px", fontSize: "16px" }}>
            Thực hành khảo sát đồng vị và kích thước hạt nhân
          </h4>
          <FixedPhysicsActivityRenderer
            activityKey="isotope_and_nuclear_size"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — 6. SAU GIỜ HỌC: KIỂM TRA, ĐÁNH GIÁ (LÁ NHÔM ²⁷₁₃Al)
          ==================================================================== */}
      {section.kind === "b21_after_transfer" && (
        <div style={{ border: "1px solid #d0d7de", padding: "18px", background: "#ffffff" }}>
          <h4 style={{ margin: "0 0 8px", fontSize: "16.5px" }}>
            Tình huống vận dụng mới: Tán xạ hạt α trên lá nhôm mỏng <Nuclide sym="Al" a={27} z={13} />
          </h4>
          <p style={{ margin: "0 0 14px", fontSize: "14.5px", lineHeight: 1.6 }}>
            Trong phòng thí nghiệm ảo, một nhóm học sinh giữ nguyên nguồn phát hạt α (<code>E = 6 MeV</code>) nhưng thay lá vàng mỏng <Nuclide sym="Au" a={197} z={79} /> bằng lá nhôm mỏng <Nuclide sym="Al" a={27} z={13} /> có cùng mật độ diện tích nguyên tử.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "12px",
              marginBottom: "14px",
            }}
          >
            <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
              1. Số proton Z của <Nuclide sym="Al" a={27} z={13} />:
              <input
                type="number"
                inputMode="numeric"
                value={alZ}
                onChange={(e) => {
                  setAlZ(e.target.value);
                  setAlChecked(false);
                }}
                placeholder="Nhập Z…"
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "6px",
                  minHeight: "42px",
                  padding: "8px 10px",
                  border: "1px solid #8d8d8d",
                  fontSize: "15px",
                }}
              />
            </label>
            <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
              2. Số neutron N = A − Z của <Nuclide sym="Al" a={27} z={13} />:
              <input
                type="number"
                inputMode="numeric"
                value={alN}
                onChange={(e) => {
                  setAlN(e.target.value);
                  setAlChecked(false);
                }}
                placeholder="Nhập N…"
                style={{
                  display: "block",
                  width: "100%",
                  marginTop: "6px",
                  minHeight: "42px",
                  padding: "8px 10px",
                  border: "1px solid #8d8d8d",
                  fontSize: "15px",
                }}
              />
            </label>
          </div>

          <fieldset style={{ border: "none", padding: 0, margin: "0 0 14px" }}>
            <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
              3. Khi xét cùng tham số va chạm b = 15 fm và động năng E = 6 MeV, góc lệch của hạt α qua hạt nhân <Nuclide sym="Al" a={27} z={13} /> thay đổi thế nào so với qua hạt nhân <Nuclide sym="Au" a={197} z={79} />?
            </legend>
            {[
              [
                "smaller",
                "Góc tán xạ nhỏ hơn rõ rệt vì điện tích hạt nhân nhôm (+13e) nhỏ hơn hạt nhân vàng (+79e) khoảng 6 lần nên lực đẩy tĩnh điện yếu hơn.",
              ],
              [
                "larger",
                "Góc tán xạ lớn hơn vì hạt nhân nhôm nhẹ hơn nên đẩy hạt α mạnh hơn.",
              ],
              [
                "same",
                "Góc tán xạ không đổi vì chùm hạt α vẫn có cùng động năng E = 6 MeV.",
              ],
            ].map(([val, label]) => (
              <label
                key={val}
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "flex-start",
                  marginBottom: "8px",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="b21-al-transfer"
                  checked={alChoice === val}
                  onChange={() => {
                    setAlChoice(val);
                    setAlChecked(false);
                  }}
                />
                <span>{label}</span>
              </label>
            ))}
          </fieldset>

          <button
            type="button"
            className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
            onClick={() => {
              setAlChecked(true);
              const ok = Number(alZ) === 13 && Number(alN) === 14 && alChoice === "smaller";
              onMarkSectionComplete(section.id, ok);
            }}
          >
            Kiểm tra đáp án vận dụng
          </button>

          {alChecked && (
            <div
              role="status"
              style={{
                marginTop: "12px",
                padding: "12px 14px",
                background:
                  Number(alZ) === 13 && Number(alN) === 14 && alChoice === "smaller"
                    ? "#defbe6"
                    : "#fff0f1",
                borderLeft:
                  Number(alZ) === 13 && Number(alN) === 14 && alChoice === "smaller"
                    ? "4px solid #198038"
                    : "4px solid #b42332",
                fontSize: "14px",
                lineHeight: 1.55,
              }}
            >
              {Number(alZ) === 13 && Number(alN) === 14 && alChoice === "smaller" ? (
                <>
                  <strong>✓ Hoàn thành chính xác!</strong> Hạt nhân <Nuclide sym="Al" a={27} z={13} /> có{" "}
                  <code>Z = 13</code> proton, <code>N = 27 − 13 = 14</code> neutron, bán kính gần đúng{" "}
                  <code>R ≈ 1,2 × 27¹/³ = 3,6 fm</code>, và điện tích dương nhỏ hơn vàng nên tỉ lệ đốm sáng tán xạ góc lớn giảm mạnh.
                </>
              ) : (
                <>
                  <strong>Kiểm tra lại:</strong> Đọc từ kí hiệu <Nuclide sym="Al" a={27} z={13} /> ta có chỉ số dưới{" "}
                  <code>Z = 13</code>, số neutron <code>N = 27 − 13 = 14</code>; lực đẩy Coulomb tỉ lệ thuận với điện tích hạt nhân bia <code>Z·e</code>.
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          BÀI 22 — PHẢN ỨNG HẠT NHÂN & NĂNG LƯỢNG LIÊN KẾT
          ==================================================================== */}
      {section.kind === "b22_blackett_track" && (
        <div>
          <figure className={styles.darkBenchStage} style={{ margin: "0 0 18px" }}>
            <svg
              viewBox="0 0 680 220"
              width="680"
              height="220"
              role="img"
              aria-label="Sơ đồ vết sương phân nhánh trong thí nghiệm Blackett năm 1925: hạt alpha va chạm hạt nhân Nitrogen-14 tạo thành proton mảnh dài và Oxygen-17 ngắn đậm"
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              <rect x="0" y="0" width="680" height="220" fill="#0b1220" />
              {/* Chùm tia alpha song song không va chạm */}
              {[42, 74, 152, 184].map((y) => (
                <line key={y} x1="36" y1={y} x2="360" y2={y} stroke="#334155" strokeWidth="2" />
              ))}
              {/* Tia alpha tạo phản ứng hạt nhân */}
              <line x1="36" y1="114" x2="292" y2="114" stroke="#38bdf8" strokeWidth="4" />
              <circle cx="292" cy="114" r="6" fill="#facc15" />
              {/* Nhánh proton mảnh, dài */}
              <line x1="292" y1="114" x2="590" y2="38" stroke="#fde047" strokeWidth="2.2" />
              {/* Nhánh hạt nhân giật lùi O-17 dày, ngắn */}
              <line x1="292" y1="114" x2="394" y2="158" stroke="#fb7185" strokeWidth="5.2" strokeLinecap="round" />

              <text x="44" y="104" fill="#7dd3fc" fontSize="13" fontWeight="700">
                Vệt hạt α tới (⁴₂He)
              </text>
              <text x="248" y="140" fill="#facc15" fontSize="12.5" fontWeight="700">
                Va chạm với ¹⁴₇N
              </text>
              <text x="460" y="34" fill="#fde047" fontSize="13" fontWeight="700">
                Nhánh mảnh, dài: Proton (¹₁H)
              </text>
              <text x="404" y="164" fill="#fda4af" fontSize="13" fontWeight="700">
                Nhánh đậm, ngắn: Hạt nhân ¹⁷₈O
              </text>
            </svg>
            <figcaption className={styles.darkBenchCaption}>
              <strong>Thí nghiệm buồng sương Blackett (SGK tr. 96):</strong> Trong hàng chục nghìn vết hạt α đi thẳng qua khí Nitrogen, xuất hiện điểm va chạm tại đó vệt α biến mất và tách thành <strong>hai nhánh chữ Y</strong> (không có nhánh thứ ba), chứng tỏ hạt α đã nhập vào hạt nhân <Nuclide sym="N" a={14} z={7} /> để biến đổi thành nguyên tố mới <Nuclide sym="O" a={17} z={8} /> và phát ra proton <Nuclide sym="H" a={1} z={1} />.
            </figcaption>
          </figure>

          <p style={{ fontSize: "15px", lineHeight: 1.6 }}>
            Phương trình phản ứng hạt nhân đầu tiên do con người thực hiện:{" "}
            <strong>
              <Nuclide sym="He" a={4} z={2} /> + <Nuclide sym="N" a={14} z={7} /> →{" "}
              <Nuclide sym="O" a={17} z={8} /> + <Nuclide sym="H" a={1} z={1} />
            </strong>{" "}
            (kiểm tra: tổng số khối <code>4 + 14 = 17 + 1 = 18</code>; tổng điện tích{" "}
            <code>2 + 7 = 8 + 1 = 9</code>).
          </p>
        </div>
      )}

      {section.kind === "b22_conservation" && (
        <FixedPhysicsActivityRenderer
          activityKey="nuclear_reaction_balancer"
          onProgress={(done) => onMarkSectionComplete(section.id, done)}
        />
      )}

      {section.kind === "b22_binding_energy" && (
        <div>
          <div style={{ border: "1px solid #d0d7de", background: "#ffffff", padding: "14px", marginBottom: "18px" }}>
            <h4 style={{ margin: "0 0 8px", fontSize: "15.5px" }}>
              Đồ thị năng lượng liên kết riêng Wₗₖ/A theo số khối A (SGK tr. 100)
            </h4>
            <svg
              viewBox="0 0 640 210"
              width="640"
              height="210"
              role="img"
              aria-label="Đồ thị năng lượng liên kết riêng theo số khối A đạt đỉnh khoảng 8,8 MeV/nucleon ở vùng Fe-56"
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              <line x1="56" y1="178" x2="610" y2="178" stroke="#525252" strokeWidth="1.4" />
              <line x1="56" y1="178" x2="56" y2="20" stroke="#525252" strokeWidth="1.4" />
              <rect x="140" y="24" width="145" height="154" fill="#defbe6" opacity="0.55" />
              <path
                d="M 62 162 L 68 62 L 82 88 L 96 56 L 148 40 Q 195 34 250 38 Q 380 48 590 66"
                fill="none"
                stroke="#0f62fe"
                strokeWidth="2.8"
              />
              <circle cx="182" cy="36" r="5" fill="#198038" />
              <text x="190" y="34" fill="#198038" fontSize="12" fontWeight="700">
                ⁵⁶₂₆Fe (~8,8 MeV/nucleon · Bền nhất)
              </text>
              <text x="74" y="54" fill="#0f62fe" fontSize="11.5" fontWeight="700">⁴₂He</text>
              <text x="530" y="60" fill="#161616" fontSize="11.5" fontWeight="700">²³⁵₉₂U (~7,6 MeV)</text>
              <text x="64" y="152" fill="#8e6a00" fontSize="11.5" fontWeight="700">Tổng hợp hạt nhân ↗</text>
              <text x="430" y="92" fill="#002d9c" fontSize="11.5" fontWeight="700">↖ Phân hạch hạt nhân</text>
              <text x="520" y="198" fill="#525252" fontSize="12">Số khối A →</text>
              <text x="12" y="22" fill="#525252" fontSize="12">Wₗₖ/A (MeV)</text>
            </svg>
          </div>
          <FixedPhysicsActivityRenderer
            activityKey="binding_energy_lab"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {section.kind === "b22_fission" && (
        <FixedPhysicsActivityRenderer
          activityKey="nuclear_fission"
          onProgress={(done) => onMarkSectionComplete(section.id, done)}
        />
      )}

      {section.kind === "b22_fusion" && (
        <FixedPhysicsActivityRenderer
          activityKey="nuclear_fusion"
          onProgress={(done) => onMarkSectionComplete(section.id, done)}
        />
      )}

      {section.kind === "b22_after_transfer" && (
        <div style={{ border: "1px solid #d0d7de", padding: "16px", background: "#ffffff" }}>
          <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "14.5px" }}>
            Dựa vào đồ thị năng lượng liên kết riêng <code>Wₗₖ/A</code>, phát biểu nào giải thích đúng vì sao cả phân hạch <Nuclide sym="U" a={235} z={92} /> lẫn tổng hợp <Nuclide sym="H" a={2} z={1} /> + <Nuclide sym="H" a={3} z={1} /> đều tỏa năng lượng lớn?
          </p>
          {[
            [
              "correct",
              "Vì các hạt nhân sản phẩm đều dịch chuyển về phía vùng số khối trung bình có năng lượng liên kết riêng Wₗₖ/A lớn hơn các hạt nhân ban đầu.",
            ],
            [
              "wrong1",
              "Vì tổng số nucleon A sau phản ứng giảm đi để biến thành năng lượng.",
            ],
            [
              "wrong2",
              "Vì các hạt nhân sản phẩm có khối lượng nghỉ lớn hơn tổng khối lượng các hạt ban đầu.",
            ],
          ].map(([val, label]) => (
            <label key={val} style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "14px", cursor: "pointer" }}>
              <input
                type="radio"
                name="b22-after"
                checked={b22AfterChoice === val}
                onChange={() => {
                  setB22AfterChoice(val);
                  onMarkSectionComplete(section.id, val === "correct");
                }}
              />
              <span>{label}</span>
            </label>
          ))}
          {b22AfterChoice && (
            <p role="status" style={{ margin: "8px 0 0", fontWeight: 600, color: b22AfterChoice === "correct" ? "#198038" : "#b42332" }}>
              {b22AfterChoice === "correct"
                ? "✓ Chính xác! Tổng số khối A luôn bảo toàn, nhưng năng lượng liên kết riêng tăng lên làm tổng khối lượng nghỉ giảm đi — phần chênh lệch khối lượng tỏa ra dưới dạng động năng và bức xạ."
                : "Chưa đúng. Nhớ rằng số khối A bảo toàn; phản ứng tỏa năng lượng khi hạt nhân con bền hơn (Wₗₖ/A cao hơn) và có tổng khối lượng nghỉ nhỏ hơn."}
            </p>
          )}
        </div>
      )}

      {/* ====================================================================
          BÀI 23 — HIỆN TƯỢNG PHÓNG XẠ
          ==================================================================== */}
      {section.kind === "b23_cloud_geiger" && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "16px",
              marginBottom: "18px",
            }}
          >
            <figure className={styles.darkBenchStage} style={{ margin: 0 }}>
              <svg
                viewBox="0 0 340 160"
                width="340"
                height="160"
                role="img"
                aria-label="So sánh vết tia alpha dày thẳng và vết tia beta mảnh gấp khúc trong buồng sương"
                style={{ width: "100%", height: "auto", display: "block" }}
              >
                <rect x="0" y="0" width="340" height="160" fill="#0b1220" />
                <text x="14" y="22" fill="#fda4af" fontSize="12" fontWeight="700">
                  Vết tia α: Dày, thẳng, quãng đi ngắn vài cm
                </text>
                <line x1="18" y1="42" x2="152" y2="38" stroke="#fb7185" strokeWidth="4.5" strokeLinecap="round" />
                <line x1="18" y1="60" x2="160" y2="62" stroke="#fb7185" strokeWidth="4.5" strokeLinecap="round" />

                <text x="14" y="98" fill="#7dd3fc" fontSize="12" fontWeight="700">
                  Vết tia β: Mảnh, gấp khúc do dễ lệch khi va chạm
                </text>
                <polyline
                  points="18,118 64,112 108,128 158,114 214,132 278,116 318,126"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                />
              </svg>
              <figcaption className={styles.darkBenchCaption}>
                Vết sương ion hóa của tia <strong>α</strong> (ion hóa mạnh) so với tia <strong>β</strong> (khối lượng rất nhỏ nên đường đi gấp khúc).
              </figcaption>
            </figure>

            <div className={styles.tableScroll} style={{ margin: 0 }}>
              <table className={styles.cdsTable}>
                <caption>Số đếm ống Geiger–Müller trong từng khoảng 5 giây liên tiếp</caption>
                <thead>
                  <tr>
                    <th scope="col">Khoảng thời gian (s)</th>
                    <th scope="col" className={styles.numCell}>Số xung đếm được</th>
                  </tr>
                </thead>
                <tbody>
                  {GEIGER_5S_INTERVALS.map((row) => (
                    <tr key={row.window}>
                      <td>{row.window}</td>
                      <td className={styles.numCell}>{row.counts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <FixedPhysicsActivityRenderer
            activityKey="geiger_random_decay"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {section.kind === "b23_radiation_types" && (
        <FixedPhysicsActivityRenderer
          activityKey="radiation_properties"
          onProgress={(done) => onMarkSectionComplete(section.id, done)}
        />
      )}

      {section.kind === "b23_half_life" && (
        <FixedPhysicsActivityRenderer
          activityKey="radioactive_decay_half_life"
          onProgress={(done) => onMarkSectionComplete(section.id, done)}
        />
      )}

      {section.kind === "b23_safety" && (
        <FixedPhysicsActivityRenderer
          activityKey="radiation_safety"
          onProgress={(done) => onMarkSectionComplete(section.id, done)}
        />
      )}

      {section.kind === "b23_carbon14" && (
        <FixedPhysicsActivityRenderer
          activityKey="carbon14_dating"
          onProgress={(done) => onMarkSectionComplete(section.id, done)}
        />
      )}

      {/* ====================================================================
          BÀI 24 — CÔNG NGHIỆP HẠT NHÂN
          ==================================================================== */}
      {section.kind === "b24_energy_chain" && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            {[
              [
                "Bước 1 · Năng lượng hạt nhân",
                "Phân hạch dây chuyền có kiểm soát (k = 1) của ²³⁵₉₂U giải phóng động năng các mảnh vỡ trong tâm lò.",
              ],
              [
                "Bước 2 · Nội năng (Nhiệt sơ cấp)",
                "Chất tải nhiệt vòng sơ cấp tuần hoàn khép kín nhận nhiệt áp suất cao mà không trộn lẫn ra ngoài.",
              ],
              [
                "Bước 3 · Cơ năng tua-bin",
                "Nhiệt truyền qua bình sinh hơi tạo hơi nước vòng thứ cấp làm quay tua-bin tốc độ cao.",
              ],
              [
                "Bước 4 · Điện năng máy phát",
                "Tua-bin kéo rô-to máy phát điện xoay chiều phát điện lên lưới quốc gia.",
              ],
            ].map(([step, text]) => (
              <div
                key={step}
                style={{
                  border: "1px solid #d0d7de",
                  borderTop: "3px solid #0f62fe",
                  background: "#ffffff",
                  padding: "12px",
                }}
              >
                <strong style={{ display: "block", fontSize: "13.5px", marginBottom: "4px" }}>{step}</strong>
                <p style={{ margin: 0, fontSize: "13.5px", color: "#525252", lineHeight: 1.5 }}>{text}</p>
              </div>
            ))}
          </div>
          <FixedPhysicsActivityRenderer
            activityKey="nuclear_power_energy_flow"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {section.kind === "b24_reactor_control" && (
        <FixedPhysicsActivityRenderer
          activityKey="reactor_control_concept"
          onProgress={(done) => onMarkSectionComplete(section.id, done)}
        />
      )}

      {section.kind === "b24_medicine" && (
        <FixedPhysicsActivityRenderer
          activityKey="nuclear_medicine"
          onProgress={(done) => onMarkSectionComplete(section.id, done)}
        />
      )}

      {section.kind === "b24_bio_food" && (
        <div>
          <div className={styles.tableScroll}>
            <table className={styles.cdsTable}>
              <caption>Ứng dụng bức xạ trong công nghệ sinh học, nông nghiệp và bảo quản thực phẩm (SGK tr. 117–118)</caption>
              <thead>
                <tr>
                  <th scope="col">Lĩnh vực</th>
                  <th scope="col">Cơ chế vật lí – sinh học</th>
                  <th scope="col">Lưu ý an toàn thực tế</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Chọn giống đột biến (Nông nghiệp)</th>
                  <td>Chiếu tia γ liều kiểm soát lên hạt giống tạo biến dị di truyền để chọn lọc giống lúa, ngô năng suất cao, kháng sâu bệnh.</td>
                  <td>Thực hiện trong buồng chiếu xạ chuyên dụng; cây giống trồng ra hoàn toàn không mang tính phóng xạ.</td>
                </tr>
                <tr>
                  <th scope="row">Bảo quản thực phẩm &amp; nông sản</th>
                  <td>Chùm tia γ hoặc electron năng lượng phù hợp tiêu diệt vi sinh vật gây thối hỏng, côn trùng kiểm dịch và ức chế mọc mầm khoai tây, hành tỏi.</td>
                  <td><strong>Thực phẩm được chiếu xạ không tiếp xúc với nguồn phóng xạ</strong> nên không bị nhiễm phóng xạ.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <FixedPhysicsActivityRenderer
            activityKey="radiation_applications"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {section.kind === "b24_after_transfer" && (
        <div style={{ border: "1px solid #d0d7de", padding: "16px", background: "#ffffff" }}>
          <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: "14.5px" }}>
            Để ghi hình chức năng tuyến giáp từ bên ngoài cơ thể mà hạn chế tối đa liều chiếu cho bệnh nhân, dược chất phóng xạ đưa vào cơ thể cần thỏa mãn tiêu chí nào?
          </p>
          {[
            [
              "correct",
              "Phát tia có khả năng xuyên thoát ra ngoài cơ thể tới đầu thu (như tia γ hoặc positron tạo cặp γ) và có chu kì bán rã ngắn.",
            ],
            [
              "alpha_long",
              "Phát thuần tia α quãng đi cực ngắn và có chu kì bán rã hàng trăm năm.",
            ],
          ].map(([val, label]) => (
            <label key={val} style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "14px", cursor: "pointer" }}>
              <input
                type="radio"
                name="b24-after"
                checked={b24AfterChoice === val}
                onChange={() => {
                  setB24AfterChoice(val);
                  onMarkSectionComplete(section.id, val === "correct");
                }}
              />
              <span>{label}</span>
            </label>
          ))}
          {b24AfterChoice && (
            <p role="status" style={{ margin: "8px 0 0", fontWeight: 600, color: b24AfterChoice === "correct" ? "#198038" : "#b42332" }}>
              {b24AfterChoice === "correct"
                ? "✓ Chính xác! Tia γ thoát ra ngoài cơ thể để máy SPECT/PET ghi hình, còn chu kì bán rã ngắn giúp hoạt độ giảm nhanh sau khi chẩn đoán xong."
                : "Chưa đúng. Tia α bị hấp thụ ngay trong mô nên máy thu bên ngoài không ghi hình được và còn gây tổn thương mô mạnh."}
            </p>
          )}
        </div>
      )}

      {/* ====================================================================
          BÀI 25 — BÀI TẬP VỀ VẬT LÍ HẠT NHÂN
          ==================================================================== */}
      {section.kind === "b25_electroscope" && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px",
              marginBottom: "18px",
              alignItems: "center",
            }}
          >
            <svg
              viewBox="0 0 360 200"
              width="360"
              height="200"
              role="img"
              aria-label="Sơ đồ Hình 25.1 SGK: Nguồn phóng xạ làm ion hóa không khí quanh quả cầu tĩnh điện kế khiến hai lá kim loại cụp dần lại"
              style={{ width: "100%", height: "auto", background: "#f8fafc", border: "1px solid #d0d7de" }}
            >
              {/* Nguồn phóng xạ */}
              <rect x="24" y="34" width="66" height="32" fill="#334155" rx="3" />
              <text x="34" y="54" fill="#ffffff" fontSize="11" fontWeight="700">Nguồn α</text>
              {/* Các tia ion hóa không khí */}
              <line x1="92" y1="44" x2="188" y2="48" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 3" />
              <line x1="92" y1="56" x2="188" y2="56" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 3" />
              <text x="114" y="34" fill="#b91c1c" fontSize="11" fontWeight="700">Ion hóa không khí (+ / −)</text>

              {/* Tĩnh điện kế */}
              <circle cx="220" cy="52" r="18" fill="#facc15" stroke="#854d0e" strokeWidth="2" />
              <text x="211" y="56" fill="#161616" fontSize="12" fontWeight="700">+++</text>
              <line x1="220" y1="70" x2="220" y2="122" stroke="#525252" strokeWidth="3" />
              <circle cx="220" cy="136" r="46" fill="none" stroke="#8d8d8d" strokeWidth="2" />
              {/* Hai lá kim loại xòe ban đầu (nét đứt) và cụp dần (nét liền) */}
              <line x1="220" y1="122" x2="194" y2="164" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="220" y1="122" x2="246" y2="164" stroke="#94a3b8" strokeWidth="2" strokeDasharray="3 3" />
              <line x1="220" y1="122" x2="210" y2="168" stroke="#0f62fe" strokeWidth="3" />
              <line x1="220" y1="122" x2="230" y2="168" stroke="#0f62fe" strokeWidth="3" />
              <text x="274" y="142" fill="#0f62fe" fontSize="11" fontWeight="700">Góc xòe giảm</text>
            </svg>

            <div>
              <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                Phân tích hiện tượng tĩnh điện kế (Bài 25.1 · SGK tr. 119)
              </h4>
              <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.6 }}>
                Ban đầu tĩnh điện kế tích điện dương nên hai lá kim loại mỏng đẩy nhau và xòe rộng. Khi đưa nguồn phóng xạ α lại gần quả cầu kim loại, tia α <strong>ion hóa các phân tử không khí</strong> thành các ion dương và electron/ion âm tự do.
              </p>
              <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "6px" }}>
                  Nếu chèn một tờ giấy bìa mỏng chắn giữa nguồn thuần α và quả cầu tĩnh điện kế thì sao?
                </legend>
                {[
                  [
                    "stop",
                    "Hai lá kim loại ngừng cụp nhanh vì tờ giấy đã chặn hầu hết các hạt α, không khí quanh quả cầu không còn bị ion hóa mạnh.",
                  ],
                  [
                    "faster",
                    "Hai lá kim loại cụp nhanh hơn vì tia α xuyên mạnh hơn qua giấy.",
                  ],
                ].map(([val, label]) => (
                  <label key={val} style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "13.5px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="b25-elec"
                      checked={b25ElecChoice === val}
                      onChange={() => {
                        setB25ElecChoice(val);
                        onMarkSectionComplete(section.id, val === "stop");
                      }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>
              {b25ElecChoice && (
                <p role="status" style={{ margin: "6px 0 0", fontSize: "13.5px", fontWeight: 600, color: b25ElecChoice === "stop" ? "#198038" : "#b42332" }}>
                  {b25ElecChoice === "stop"
                    ? "✓ Chính xác! Tia α có khả năng ion hóa rất mạnh nhưng bị chặn ngay bởi một tờ giấy."
                    : "Chưa đúng. Tia α bị tờ giấy hấp thụ ngay nên tốc độ phóng điện của tĩnh điện kế giảm hẳn."}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {section.kind === "b25_table_25_1" && (
        <div>
          <p style={{ margin: "0 0 10px", fontSize: "14.5px", lineHeight: 1.55 }}>
            <strong>Bảng 25.1 (SGK Vật lí 12, trang 121)</strong> ghi kết quả đo độ phóng xạ thực nghiệm{" "}
            <code>H</code> (đơn vị <code>Bq</code>) của một mẫu chất phóng xạ theo thời gian{" "}
            <code>t</code> (đơn vị <code>s</code>). Mỗi hàng là một cặp số liệu{" "}
            <code>(t, H)</code> tương ứng:
          </p>

          <div
            style={{
              padding: "10px 12px",
              background: "#f4f4f4",
              border: "1px solid #e0e0e0",
              borderBottom: "none",
              fontWeight: 700,
              fontSize: "14px",
              color: "#161616",
            }}
          >
            Bảng 25.1 — Độ phóng xạ H (Bq) theo thời gian t (s) (SGK tr. 121)
          </div>
          <div className={styles.tableScroll} style={{ marginTop: 0 }} data-testid="b25-table-scroll">
            <table className={styles.cdsTable} aria-label="Bảng 25.1 Độ phóng xạ theo thời gian SGK trang 121">
              <thead>
                <tr>
                  <th scope="col" className={styles.numCell}>Thời gian t (s)</th>
                  <th scope="col" className={styles.numCell}>Độ phóng xạ H (Bq)</th>
                  <th scope="col" className={styles.numCell}>Tỉ số H / H₀</th>
                </tr>
              </thead>
              <tbody>
                {SGK_TABLE_25_1.map(({ t, h }) => {
                  const ratio = (h / 151).toFixed(2).replace(".", ",");
                  const isBracket = t === 30 || t === 60;
                  return (
                    <tr
                      key={t}
                      style={isBracket ? { background: "#edf5ff", fontWeight: 600 } : undefined}
                    >
                      <th scope="row" className={styles.numCell}>
                        {t} s
                      </th>
                      <td className={styles.numCell}>{h} Bq</td>
                      <td className={styles.numCell}>{ratio}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            style={{
              marginBottom: "18px",
              padding: "10px 14px",
              background: "#edf5ff",
              borderLeft: "4px solid #0f62fe",
              fontSize: "13.5px",
              lineHeight: 1.55,
            }}
          >
            <strong>Cách đọc chu kì bán rã từ Bảng 25.1:</strong> Hoạt độ ban đầu là{" "}
            <code>H₀ = 151 Bq</code> nên một nửa là <code>H₀/2 = 75,5 Bq</code>. Giá trị này nằm giữa hai cặp đo{" "}
            <strong>(30 s; 85 Bq)</strong> và <strong>(60 s; 55 Bq)</strong> → chu kì bán rã thực nghiệm nằm trong khoảng{" "}
            <code>30 s – 60 s</code> (nội suy gần đúng <code>T ≈ 39,5 s</code>).
          </div>

          <h4 style={{ margin: "20px 0 10px", fontSize: "16px" }}>
            Đồ thị phân rã tương tác và xử lí số liệu Bảng 25.1
          </h4>
          <FixedPhysicsActivityRenderer
            activityKey="nuclear_physics_practice_lab"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {section.kind === "b25_equations_energy" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
              Phần A · Viết và cân bằng phương trình phân rã α, β⁻, β⁺
            </h4>
            <NuclearEquationBalancer
              onSubDone={(done) => {
                setB25EqDone(done);
                onMarkSectionComplete(section.id, done && b25BindDone);
              }}
            />
          </div>
          <div>
            <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
              Phần B · Tính độ hụt khối Δm và năng lượng liên kết riêng
            </h4>
            <BindingEnergyCalculator
              onSubDone={(done) => {
                setB25BindDone(done);
                onMarkSectionComplete(section.id, b25EqDone && done);
              }}
            />
          </div>
        </div>
      )}

      {section.kind === "b25_after_transfer" && (
        <div style={{ border: "1px solid #d0d7de", padding: "16px", background: "#ffffff" }}>
          <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
            Bài toán tổng hợp: Độ phóng xạ của dược chất <Nuclide sym="I" a={131} z={53} />
          </h4>
          <p style={{ margin: "0 0 12px", fontSize: "14.5px", lineHeight: 1.6 }}>
            Đồng vị <Nuclide sym="I" a={131} z={53} /> dùng trong y học hạt nhân có chu kì bán rã{" "}
            <code>T = 8,0 ngày</code>. Một mẫu mới điều chế có độ phóng xạ ban đầu{" "}
            <code>H₀ = 400 MBq</code>. Hỏi sau bao nhiêu ngày thì độ phóng xạ của mẫu giảm xuống còn{" "}
            <code>50 MBq</code> (tức bằng <code>H₀ / 8</code>)?
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "flex-end" }}>
            <label style={{ fontSize: "13.5px", fontWeight: 700 }}>
              Thời gian cần tìm t (ngày):
              <input
                type="number"
                inputMode="decimal"
                value={b25AfterDays}
                onChange={(e) => setB25AfterDays(e.target.value)}
                placeholder="Nhập số ngày…"
                style={{
                  display: "block",
                  marginTop: "6px",
                  minHeight: "42px",
                  padding: "8px 12px",
                  border: "1px solid #8d8d8d",
                  fontSize: "15px",
                }}
              />
            </label>
            <button
              type="button"
              className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
              onClick={() => {
                onMarkSectionComplete(section.id, Number(b25AfterDays) === 24);
              }}
            >
              Kiểm tra kết quả
            </button>
          </div>
          {b25AfterDays !== "" && (
            <p
              role="status"
              style={{
                margin: "10px 0 0",
                fontWeight: 600,
                color: Number(b25AfterDays) === 24 ? "#198038" : "#b42332",
              }}
            >
              {Number(b25AfterDays) === 24
                ? "✓ Chính xác! Vì H / H₀ = 50 / 400 = 1/8 = (1/2)³, thời gian đã trôi qua là 3 chu kì bán rã: t = 3 × 8,0 = 24 ngày."
                : "Gợi ý: Lập tỉ số H / H₀ = 50 / 400 = 1/8 = 2⁻³, từ đó suy ra t gấp mấy lần chu kì bán rã T = 8,0 ngày."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
