"use client";

import { useState } from "react";
import {
  SGK_B21_MASS_CONSTANTS,
  SGK_TABLE_21_1,
  isVerifiedVideoUrl,
  loadStudentNotebook,
  recordPreClassPrediction,
  saveStudentNotebook,
  type B21ApparatusPartCode,
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
      "Đa số hạt α đi xuyên thẳng tới vị trí (1), nhưng có một tỉ lệ rất nhỏ (~10⁻⁴) bị lệch góc lớn, thậm chí bật ngược về vị trí (2) (> 90°).",
  },
  {
    id: "blocked",
    label: "Lá vàng D chắn gần hết chùm hạt α, hầu như không có đốm sáng ở vị trí (1) đối diện nguồn.",
  },
] as const;

const B21_APPARATUS_PARTS: readonly {
  readonly code: B21ApparatusPartCode;
  readonly label: string;
  readonly correctRole: string;
}[] = [
  { code: "R", label: "Nguồn phát hạt α (R)", correctRole: "emit_alpha" },
  { code: "D", label: "Lá vàng rất mỏng (D)", correctRole: "scatter_target" },
  { code: "S", label: "Màn huỳnh quang ZnS (S)", correctRole: "flash_screen" },
  { code: "M", label: "Kính hiển vi quan sát (M)", correctRole: "observer_microscope" },
] as const;

const B21_APPARATUS_ROLE_OPTIONS = [
  { value: "", label: "— Chọn đúng công dụng theo Hình 21.2 —" },
  { value: "emit_alpha", label: "Phát chùm hạt α mang điện dương (+2e) bắn vào lá vàng D" },
  { value: "scatter_target", label: "Bia tán xạ bằng vàng rất mỏng (độ dày cỡ 4·10⁻⁷ m) đặt tại tâm" },
  { value: "flash_screen", label: "Màn phủ chất huỳnh quang phát đốm sáng lóe khi hạt α đập vào" },
  { value: "observer_microscope", label: "Kính hiển vi di chuyển từ vị trí (1) đến vị trí (2) để quan sát đốm sáng" },
] as const;

const B21_PRE_SELF_CHECK_OPTIONS = [
  {
    id: "see_tracks",
    label:
      "Mắt đặt ở kính hiển vi M nhìn thấy trực tiếp đường quỹ đạo cong của từng hạt α bay qua lá vàng D.",
    feedback:
      "Chưa chính xác. Hạt α có kích thước vi mô nên mắt không thể nhìn thấy đường bay trong chân không G; đường quỹ đạo thuộc chế độ “Mô hình giải thích”, còn cái thấy trực tiếp qua kính M là các đốm sáng trên màn S.",
  },
  {
    id: "flashes_ratio",
    label:
      "Mắt chỉ nhìn thấy các đốm sáng lóe trên màn S; khi chuyển kính M từ vị trí (1) sang vị trí (2) (> 90°), vẫn có đốm sáng nhưng tần suất ít hơn ở (1) cỡ 10⁴ lần.",
    feedback:
      "✓ Chính xác! Màn huỳnh quang S phát đốm sáng mỗi khi hạt α chạm vào, và tại vị trí (2) tần suất đốm sáng nhỏ hơn tại vị trí (1) cỡ 10⁴ lần (SGK tr. 91).",
  },
  {
    id: "equal_everywhere",
    label:
      "Khi chuyển kính M từ vị trí (1) sang vị trí (2), tần suất đốm sáng trên màn S xuất hiện ngang bằng nhau ở mọi góc.",
    feedback:
      "Chưa chính xác. Theo SGK tr. 91, khi di chuyển kính M từ (1) đến (2), tần suất đốm sáng giảm rất nhanh; tại (2) ít hơn tại (1) cỡ 10⁴ lần.",
  },
] as const;

const GEIGER_5S_INTERVALS = [
  { window: "0 – 5", counts: 29 },
  { window: "5 – 10", counts: 34 },
  { window: "10 – 15", counts: 26 },
  { window: "15 – 20", counts: 31 },
  { window: "20 – 25", counts: 28 },
  { window: "25 – 30", counts: 33 },
] as const;

function isB21PreClassAllComplete(
  nb: StudentLessonNotebook,
  rolesOverride?: Readonly<Partial<Record<B21ApparatusPartCode, string>>>,
  selfCheckOverride?: string
): boolean {
  const hasPrediction = Boolean(
    (nb.initialPredictionChoice ?? nb.preClassPredictionChoice ?? "").trim()
  );
  const hasReason = Boolean(
    (nb.initialPredictionReason ?? nb.preClassPredictionReason ?? "").trim()
  );
  const roles = rolesOverride ?? nb.preClassWork?.apparatusRoles ?? {};
  const allRolesCorrect = B21_APPARATUS_PARTS.every(
    (part) => roles[part.code] === part.correctRole
  );
  const selfCheck = selfCheckOverride ?? nb.preClassWork?.selfCheckChoice ?? "";
  return hasPrediction && hasReason && allRolesCorrect && selfCheck === "flashes_ratio";
}

export interface Chapter4SectionBodyProps {
  readonly lessonCode: "B21" | "B22" | "B23" | "B24" | "B25";
  readonly section: Chapter4SectionSpec;
  readonly notebook: StudentLessonNotebook;
  readonly onSavePreClassPrediction: (choice: string, reason: string) => void;
  readonly onPatchNotebook?: (
    updater: (current: StudentLessonNotebook) => StudentLessonNotebook
  ) => void;
  readonly onMarkSectionComplete: (
    sectionId: string,
    done: boolean,
    options?: { readonly allowUnmark?: boolean }
  ) => void;
  readonly onJumpToSection: (sectionId: string) => void;
}

function VerifiedFlowVideoBlock({ url, title }: { readonly url?: string; readonly title: string }) {
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
  onPatchNotebook,
  onMarkSectionComplete,
  onJumpToSection,
}: Chapter4SectionBodyProps) {
  const patchNotebook = (
    updater: (current: StudentLessonNotebook) => StudentLessonNotebook
  ) => {
    if (onPatchNotebook) {
      onPatchNotebook(updater);
      return;
    }
    const current = loadStudentNotebook(lessonCode);
    saveStudentNotebook(lessonCode, updater(current));
  };

  const [predChoiceDraft, setPredChoiceDraft] = useState<string | null>(null);
  const [predReasonDraft, setPredReasonDraft] = useState<string | null>(null);
  const predChoice = predChoiceDraft ?? notebook.preClassPredictionChoice ?? "";
  const predReason = predReasonDraft ?? notebook.preClassPredictionReason ?? "";
  const [predSavedMsg, setPredSavedMsg] = useState("");

  // State cục bộ kết hợp với dữ liệu đã lưu trong localStorage
  const [structCheckedLocal, setStructCheckedLocal] = useState(false);
  const [isoCheckedLocal, setIsoCheckedLocal] = useState(false);
  const [alCheckedLocal, setAlCheckedLocal] = useState(false);

  // State cho các bài B22–B25 (giữ nguyên ngoài phạm vi lượt này)
  const [b22AfterChoice, setB22AfterChoice] = useState("");
  const [b24AfterChoice, setB24AfterChoice] = useState("");
  const [b25ElecChoice, setB25ElecChoice] = useState("");
  const [b25AfterDays, setB25AfterDays] = useState("");
  const [b25EqDone, setB25EqDone] = useState(false);
  const [b25BindDone, setB25BindDone] = useState(false);

  const b21VideoLesson = NUCLEAR_LAB_LESSONS.find((l) => l.code === lessonCode);

  const lockedInitialChoiceId =
    notebook.initialPredictionChoice ?? notebook.preClassPredictionChoice;
  const lockedInitialReason =
    notebook.initialPredictionReason ?? notebook.preClassPredictionReason ?? "";
  const lockedInitialPredictionLabel = B21_PREDICTION_CHOICES.find(
    (c) => c.id === lockedInitialChoiceId
  )?.label;
  const currentPredictionLabel = B21_PREDICTION_CHOICES.find(
    (c) => c.id === notebook.preClassPredictionChoice
  )?.label;

  const apparatusRoles = notebook.preClassWork?.apparatusRoles ?? {};
  const matchedApparatusCount = B21_APPARATUS_PARTS.filter(
    (p) => apparatusRoles[p.code] === p.correctRole
  ).length;
  const allApparatusMatched = matchedApparatusCount === B21_APPARATUS_PARTS.length;
  const preSelfCheckChoice = notebook.preClassWork?.selfCheckChoice ?? "";
  const selectedSelfCheckOption = B21_PRE_SELF_CHECK_OPTIONS.find(
    (opt) => opt.id === preSelfCheckChoice
  );
  const bringToClassQuestion = notebook.preClassWork?.bringToClassQuestion ?? "";
  const preClassReady = isB21PreClassAllComplete(notebook);

  return (
    <div>
      <VerifiedFlowVideoBlock url={section.flowVideoUrl} title={section.title} />

      {/* ====================================================================
          BÀI 21 — PHA 1 (TRƯỚC GIỜ HỌC): HÌNH 21.1, R–D–S–M HÌNH 21.2 & KHÓA DỰ ĐOÁN
          ==================================================================== */}
      {section.kind === "b21_pre_rutherford" && (
        <div>
          {/* Bước 1: Mô hình Thomson ở Hình 21.1 (SGK tr. 91) */}
          <section
            aria-labelledby="b21-hinh-21-1-heading"
            style={{
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "16px",
              marginBottom: "18px",
            }}
          >
            <h4 id="b21-hinh-21-1-heading" style={{ margin: "0 0 10px", fontSize: "16px" }}>
              Bước 1 · Mô hình nguyên tử đầu tiên (Thomson) ở Hình 21.1 (SGK tr. 91)
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "16px",
                alignItems: "center",
              }}
            >
              <figure
                style={{
                  margin: 0,
                  border: "1px solid #e0e0e0",
                  background: "#f8fafc",
                  padding: "12px",
                  textAlign: "center",
                }}
              >
                <svg
                  viewBox="0 0 320 206"
                  width="320"
                  height="206"
                  role="img"
                  aria-label="Sơ đồ mô hình nguyên tử Thomson đối chiếu Hình 21.1 bánh ngọt có mận khô SGK trang 91: khối cầu tích điện dương chiếm gần trọn không gian nguyên tử cỡ 10 mũ trừ 10 mét, các electron tích điện âm nằm rải rác bên trong"
                  style={{ width: "100%", maxWidth: "320px", height: "auto", display: "inline-block" }}
                >
                  <defs>
                    <radialGradient id="b21ThomsonPosSphere" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fde68a" />
                      <stop offset="65%" stopColor="#fcd34d" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </radialGradient>
                  </defs>
                  <circle cx="155" cy="94" r="68" fill="url(#b21ThomsonPosSphere)" stroke="#b45309" strokeWidth="2" />
                  {[
                    [155, 46],
                    [116, 66],
                    [194, 66],
                    [138, 94],
                    [174, 94],
                    [118, 122],
                    [192, 122],
                    [155, 142],
                  ].map(([cx, cy], idx) => (
                    <text
                      key={idx}
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#92400e"
                      fontSize="15"
                      fontWeight="700"
                    >
                      +
                    </text>
                  ))}
                  {[
                    [135, 64],
                    [176, 64],
                    [112, 94],
                    [155, 94],
                    [198, 94],
                    [136, 124],
                    [176, 124],
                  ].map(([ex, ey], idx) => (
                    <g key={idx}>
                      <circle cx={ex} cy={ey} r="9" fill="#0f62fe" />
                      <text
                        x={ex}
                        y={ey}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="700"
                      >
                        e⁻
                      </text>
                    </g>
                  ))}
                  <line x1="87" y1="176" x2="223" y2="176" stroke="#525252" strokeWidth="1.4" />
                  <line x1="87" y1="171" x2="87" y2="181" stroke="#525252" strokeWidth="1.4" />
                  <line x1="223" y1="171" x2="223" y2="181" stroke="#525252" strokeWidth="1.4" />
                  <text x="155" y="194" textAnchor="middle" fill="#161616" fontSize="11.5" fontWeight="700">
                    Cỡ nguyên tử ~ 10⁻¹⁰ m · Điện tích (+) trải đều
                  </text>
                </svg>
                <figcaption style={{ fontSize: "12.5px", color: "#525252", marginTop: "6px", lineHeight: 1.5 }}>
                  <strong>Mô hình nguyên tử Thomson (đối chiếu Hình 21.1 SGK tr. 91):</strong> Giống chiếc bánh ngọt có mận khô — phần bánh biểu diễn phần mang điện tích dương nặng gần bằng nguyên tử và chiếm gần như toàn bộ không gian nguyên tử, còn các mẩu mận khô biểu diễn các electron (<code>e⁻</code>) mang điện âm rất nhẹ bên trong.
                </figcaption>
              </figure>

              <div>
                <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.6 }}>
                  Kích thước nguyên tử rất nhỏ (cỡ <code>10⁻¹⁰ m</code>), kính hiển vi quang học không thể quan sát trực tiếp cấu tạo bên trong. Năm 1911, <strong>Ernest Rutherford</strong> dùng chùm hạt alpha (<code>α</code>, hạt nhân nguyên tử <code>He</code> mang điện dương) bắn vào lá vàng rất mỏng để kiểm tra xem điện tích dương có thật sự phân bố đều như mô hình Thomson (Hình 21.1) hay không.
                </p>
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#edf5ff",
                    borderLeft: "4px solid #0f62fe",
                    fontSize: "14px",
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color: "#002d9c", display: "block", marginBottom: "4px" }}>
                    Vấn đề đặt ra trước khi làm thí nghiệm:
                  </strong>
                  <em>
                    “Nếu điện tích dương trải đều và loãng khắp nguyên tử vàng như Hình 21.1, khi bắn chùm hạt α nhanh mang điện dương vào lá vàng rất mỏng thì các hạt α sẽ đi như thế nào?”
                  </em>
                </div>
              </div>
            </div>
          </section>

          {/* Bước 2: Nhận diện 4 bộ phận R–D–S–M trên Hình 21.2a & 21.2b (SGK tr. 91) */}
          <section
            aria-labelledby="b21-hinh-21-2-heading"
            style={{
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "16px",
              marginBottom: "18px",
            }}
          >
            <h4 id="b21-hinh-21-2-heading" style={{ margin: "0 0 6px", fontSize: "16px" }}>
              Bước 2 · Nhận diện 4 bộ phận R – D – S – M trên Hình 21.2 (SGK tr. 91) ({matchedApparatusCount}/4 đúng)
            </h4>
            <p style={{ margin: "0 0 12px", fontSize: "13.5px", color: "#525252", lineHeight: 1.55 }}>
              Đối chiếu hai sơ đồ bố trí thí nghiệm dưới đây (Hình 21.2a phối cảnh và Hình 21.2b mặt cắt) rồi chọn đúng công dụng của 4 bộ phận <strong>R, D, S, M</strong>:
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(275px, 1fr))",
                gap: "14px",
                marginBottom: "14px",
              }}
            >
              <figure className={styles.darkBenchStage} style={{ margin: 0 }}>
                <svg
                  viewBox="0 0 420 236"
                  width="420"
                  height="236"
                  role="img"
                  aria-label="Sơ đồ phối cảnh Hình 21.2a SGK trang 91: hộp chân không G trên chân đế P, nguồn hạt alpha R, lá vàng mỏng D, màn huỳnh quang S và kính hiển vi M"
                  style={{ width: "100%", height: "auto", display: "block", background: "#0b1220" }}
                >
                  <ellipse cx="222" cy="214" rx="64" ry="12" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
                  <rect x="210" y="178" width="24" height="34" fill="#475569" stroke="#94a3b8" strokeWidth="1.2" />
                  <line x1="234" y1="200" x2="274" y2="200" stroke="#cbd5e1" strokeWidth="1.2" />
                  <text x="280" y="204" fill="#f8fafc" fontSize="13" fontWeight="700">
                    P (chân đế)
                  </text>
                  <ellipse cx="222" cy="62" rx="108" ry="26" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.8" />
                  <path d="M 114 62 L 114 154 A 108 26 0 0 0 330 154 L 330 62" fill="#111b2e" stroke="#94a3b8" strokeWidth="1.8" />
                  <rect x="150" y="76" width="154" height="74" rx="6" fill="#080e1a" stroke="#475569" strokeWidth="1.4" />
                  <text x="162" y="167" fill="#cbd5e1" fontSize="13" fontWeight="700">
                    G (hộp chân không)
                  </text>
                  <rect x="266" y="100" width="32" height="24" rx="3" fill="#64748b" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="282" y="94" textAnchor="middle" fill="#fde047" fontSize="13" fontWeight="700">
                    R
                  </text>
                  <line x1="266" y1="112" x2="224" y2="112" stroke="#facc15" strokeWidth="2" strokeDasharray="4 3" />
                  <rect x="219" y="90" width="5" height="44" fill="#fbbf24" />
                  <line x1="221" y1="134" x2="221" y2="148" stroke="#94a3b8" strokeWidth="2" />
                  <text x="222" y="85" textAnchor="middle" fill="#fde047" fontSize="13" fontWeight="700">
                    D
                  </text>
                  <ellipse cx="164" cy="112" rx="8" ry="20" fill="#14532d" stroke="#4ade80" strokeWidth="2" />
                  <text x="182" y="117" fill="#86efac" fontSize="13" fontWeight="700">
                    S
                  </text>
                  <rect x="64" y="101" width="92" height="22" rx="4" fill="#eab308" stroke="#fef08a" strokeWidth="1.4" />
                  <ellipse cx="64" cy="112" rx="6" ry="11" fill="#1e293b" stroke="#fef08a" strokeWidth="1.4" />
                  <text x="108" y="93" textAnchor="middle" fill="#fef08a" fontSize="13.5" fontWeight="700">
                    M (kính hiển vi)
                  </text>
                </svg>
                <figcaption className={styles.darkBenchCaption}>
                  <strong>a) Hình vẽ phối cảnh (Hình 21.2a SGK):</strong> Nguồn <strong>R</strong>, lá vàng mỏng <strong>D</strong> (<code>~4·10⁻⁷ m</code>) trong hộp chân không <strong>G</strong> trên chân đế <strong>P</strong>; màn huỳnh quang <strong>S</strong> và kính hiển vi <strong>M</strong>.
                </figcaption>
              </figure>

              <figure className={styles.darkBenchStage} style={{ margin: 0 }}>
                <svg
                  viewBox="0 0 420 236"
                  width="420"
                  height="236"
                  role="img"
                  aria-label="Sơ đồ mặt cắt Hình 21.2b SGK trang 91: nguồn R bắn chùm hạt alpha qua lá vàng D, màn S bao quanh, kính hiển vi M di chuyển từ vị trí (1) đến vị trí (2)"
                  style={{ width: "100%", height: "auto", display: "block", background: "#0b1220" }}
                >
                  <circle cx="205" cy="114" r="86" fill="#111b2e" stroke="#94a3b8" strokeWidth="2.4" />
                  <text x="205" y="19" textAnchor="middle" fill="#e2e8f0" fontSize="12.5" fontWeight="700">
                    Chân không (G)
                  </text>
                  <circle cx="205" cy="114" r="72" fill="none" stroke="#4ade80" strokeWidth="2.8" strokeDasharray="6 3" />
                  <line x1="96" y1="152" x2="140" y2="152" stroke="#86efac" strokeWidth="1.2" />
                  <text x="80" y="156" fill="#86efac" fontSize="13" fontWeight="700">
                    S
                  </text>
                  <path d="M 260 100 L 278 100 L 278 128 L 260 128 L 260 120 L 270 120 L 270 108 L 260 108 Z" fill="#38bdf8" stroke="#bae6fd" strokeWidth="1.2" />
                  <text x="258" y="90" fill="#bae6fd" fontSize="13" fontWeight="700">
                    R
                  </text>
                  <text x="302" y="110" fill="#e2e8f0" fontSize="11.5" fontWeight="600">
                    Nguồn phát
                  </text>
                  <text x="302" y="125" fill="#e2e8f0" fontSize="11.5" fontWeight="600">
                    hạt alpha
                  </text>
                  <line x1="268" y1="111" x2="208" y2="111" stroke="#f87171" strokeWidth="1.8" />
                  <line x1="268" y1="117" x2="208" y2="117" stroke="#f87171" strokeWidth="1.8" />
                  <line x1="205" y1="88" x2="205" y2="140" stroke="#facc15" strokeWidth="4" />
                  <text x="192" y="82" fill="#fde047" fontSize="13" fontWeight="700">
                    D
                  </text>
                  <circle cx="133" cy="114" r="5" fill="none" stroke="#fef08a" strokeWidth="2" />
                  <text x="78" y="118" fill="#fef08a" fontSize="12.5" fontWeight="700">
                    (1) đối diện R
                  </text>
                  <circle cx="256" cy="166" r="5" fill="none" stroke="#fda4af" strokeWidth="2" />
                  <text x="272" y="174" fill="#fda4af" fontSize="12.5" fontWeight="700">
                    (2) lệch &gt; 90°
                  </text>
                  <g transform="translate(174, 181) rotate(114)">
                    <rect x="0" y="-8" width="38" height="16" rx="2" fill="#eab308" stroke="#fef08a" strokeWidth="1.2" />
                  </g>
                  <text x="150" y="222" fill="#fef08a" fontSize="13" fontWeight="700">
                    M (xoay từ (1) đến (2))
                  </text>
                </svg>
                <figcaption className={styles.darkBenchCaption}>
                  <strong>b) Hình vẽ mặt cắt (Hình 21.2b SGK):</strong> Kính hiển vi <strong>M</strong> di chuyển từ <strong>vị trí (1)</strong> (0°, đối diện R) sang <strong>vị trí (2)</strong> (&gt; 90°).
                </figcaption>
              </figure>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))",
                gap: "12px",
              }}
            >
              {B21_APPARATUS_PARTS.map((part) => {
                const selectedRole = apparatusRoles[part.code] ?? "";
                const isCorrect = selectedRole === part.correctRole;
                return (
                  <div
                    key={part.code}
                    style={{
                      padding: "10px 12px",
                      border: selectedRole
                        ? isCorrect
                          ? "1.5px solid #198038"
                          : "1.5px solid #da1e28"
                        : "1px solid #e0e0e0",
                      background: selectedRole
                        ? isCorrect
                          ? "#defbe6"
                          : "#fff1f1"
                        : "#fafafa",
                    }}
                  >
                    <label
                      htmlFor={`b21-part-${part.code}`}
                      style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
                    >
                      {part.label}
                    </label>
                    <select
                      id={`b21-part-${part.code}`}
                      value={selectedRole}
                      onChange={(e) => {
                        const val = e.target.value;
                        const nextRoles = {
                          ...apparatusRoles,
                          [part.code]: val,
                        };
                        patchNotebook((cur) => ({
                          ...cur,
                          preClassWork: {
                            ...cur.preClassWork,
                            apparatusRoles: {
                              ...cur.preClassWork?.apparatusRoles,
                              [part.code]: val,
                            },
                          },
                        }));
                        if (isB21PreClassAllComplete(notebook, nextRoles)) {
                          onMarkSectionComplete(section.id, true);
                        }
                      }}
                      style={{
                        width: "100%",
                        minHeight: "40px",
                        padding: "6px 8px",
                        border: "1px solid #8d8d8d",
                        background: "#ffffff",
                        fontSize: "13.5px",
                        color: "#161616",
                      }}
                    >
                      {B21_APPARATUS_ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {selectedRole && (
                      <small
                        style={{
                          display: "block",
                          marginTop: "6px",
                          fontWeight: 600,
                          color: isCorrect ? "#198038" : "#b42332",
                        }}
                      >
                        {isCorrect
                          ? `✓ Đúng công dụng của bộ phận ${part.code}.`
                          : `Chưa khớp — đối chiếu lại kí hiệu ${part.code} trên Hình 21.2.`}
                      </small>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Bước 3: Ghi dự đoán kèm lí do và khóa bản đầu */}
          <section
            aria-labelledby="b21-pre-prediction-heading"
            style={{
              border: "1px solid #8d8d8d",
              background: "#ffffff",
              padding: "16px",
              marginBottom: "18px",
            }}
          >
            <h4 id="b21-pre-prediction-heading" style={{ margin: "0 0 6px", fontSize: "16px" }}>
              Bước 3 · Ghi dự đoán kèm lí do và khóa bản đầu tiên
            </h4>
            <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#525252", lineHeight: 1.55 }}>
              Chọn dự đoán của riêng em và ghi rõ lí do. <strong>Bản dự đoán chốt lần đầu tiên sẽ được khóa giữ nguyên</strong> để đưa thẳng vào chỗ so sánh hai lượt khảo sát Rutherford ở Pha 2 và đối chiếu lại ở Pha 3.
            </p>

            {lockedInitialPredictionLabel && (
              <div
                data-testid="b21-locked-initial-prediction"
                style={{
                  marginBottom: "12px",
                  padding: "10px 12px",
                  background: "#fcf4d6",
                  borderLeft: "4px solid #8e6a00",
                  fontSize: "13.5px",
                  lineHeight: 1.55,
                }}
              >
                <strong>🔒 Bản dự đoán đầu tiên đã khóa:</strong> “{lockedInitialPredictionLabel}”
                {lockedInitialReason ? (
                  <span>
                    {" "}
                    — <em>Lí do ban đầu: {lockedInitialReason}</em>
                  </span>
                ) : null}
              </div>
            )}

            <fieldset style={{ border: "none", margin: "0 0 12px", padding: 0 }}>
              <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
                Chọn dự đoán của em:
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

            <label
              style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
              htmlFor="b21-pre-reason"
            >
              Lí do cho dự đoán của em (bắt buộc):
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
              placeholder="Ví dụ: Theo mô hình Thomson điện tích dương trải đều khắp nguyên tử nên lực đẩy yếu, hoặc vì nguyên tử có phần tích điện dương rất nhỏ…"
            />

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginTop: "12px" }}>
              <button
                type="button"
                data-lock-prediction-btn
                className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                onClick={() => {
                  if (!predChoice) {
                    setPredSavedMsg("Em hãy chọn một phương án dự đoán trước khi khóa lưu.");
                    return;
                  }
                  if (!predReason.trim()) {
                    setPredSavedMsg("Em hãy viết lí do cho dự đoán của mình trước khi khóa lưu.");
                    return;
                  }
                  onSavePreClassPrediction(predChoice, predReason.trim());
                  const updatedNb = recordPreClassPrediction(
                    notebook,
                    predChoice,
                    predReason.trim()
                  );
                  if (isB21PreClassAllComplete(updatedNb)) {
                    onMarkSectionComplete(section.id, true);
                  }
                  setPredSavedMsg(
                    lockedInitialChoiceId
                      ? "Đã cập nhật ghi chú (bản dự đoán đầu tiên vẫn được giữ khóa nguyên vẹn để đối chiếu ở Pha 2)."
                      : "✓ Đã khóa bản dự đoán đầu tiên kèm lí do! Hãy hoàn thành tiếp câu tự kiểm tra ở Bước 4."
                  );
                }}
              >
                {lockedInitialChoiceId ? "Cập nhật ghi chú dự đoán" : "Lưu & khóa dự đoán ban đầu"}
              </button>
              {predSavedMsg && (
                <span
                  role="status"
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    color: predChoice && predReason.trim() ? "#198038" : "#b42332",
                  }}
                >
                  {predSavedMsg}
                </span>
              )}
            </div>
          </section>

          {/* Bước 4: Câu tự kiểm tra + Video mở đầu B21 (có phụ đề tiếng Việt) */}
          <section
            aria-labelledby="b21-pre-selfcheck-heading"
            style={{
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "16px",
              marginBottom: "18px",
            }}
          >
            <h4 id="b21-pre-selfcheck-heading" style={{ margin: "0 0 8px", fontSize: "16px" }}>
              Bước 4 · Đọc kết quả thí nghiệm (SGK tr. 91) &amp; Câu tự kiểm tra Pha 1
            </h4>
            <p style={{ margin: "0 0 12px", fontSize: "14px", lineHeight: 1.6 }}>
              <strong>Kết quả thí nghiệm (SGK tr. 91):</strong> Khi di chuyển kính hiển vi <strong>M</strong> từ{" "}
              <strong>vị trí (1)</strong> đến <strong>vị trí (2)</strong> (Hình 21.2b), tần suất đốm sáng xuất hiện trên màn <strong>S</strong> giảm đi rất nhanh. Tại <strong>vị trí (2)</strong> vẫn thấy xuất hiện các đốm sáng nhưng{" "}
              <strong>tần suất ít hơn so với tại vị trí (1) cỡ <code>10⁴</code> lần</strong>.
            </p>

            <fieldset style={{ border: "none", margin: "0 0 12px", padding: 0 }}>
              <legend style={{ fontWeight: 700, fontSize: "14px", marginBottom: "10px", lineHeight: 1.5 }}>
                Câu tự kiểm tra: Khi quan sát qua kính hiển vi M ở vị trí (1) và vị trí (2), người làm thí nghiệm nhìn thấy trực tiếp điều gì?
              </legend>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {B21_PRE_SELF_CHECK_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "flex-start",
                      padding: "10px 12px",
                      border:
                        preSelfCheckChoice === opt.id
                          ? "2px solid #0f62fe"
                          : "1px solid #e0e0e0",
                      background: preSelfCheckChoice === opt.id ? "#edf5ff" : "#fafafa",
                      cursor: "pointer",
                      fontSize: "14px",
                      lineHeight: 1.5,
                    }}
                  >
                    <input
                      type="radio"
                      name="b21-pre-self-check"
                      value={opt.id}
                      checked={preSelfCheckChoice === opt.id}
                      onChange={() => {
                        patchNotebook((cur) => ({
                          ...cur,
                          preClassWork: {
                            ...cur.preClassWork,
                            selfCheckChoice: opt.id,
                          },
                        }));
                        if (isB21PreClassAllComplete(notebook, undefined, opt.id)) {
                          onMarkSectionComplete(section.id, true);
                        }
                      }}
                      style={{ marginTop: "3px" }}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {selectedSelfCheckOption && (
              <div
                role="status"
                style={{
                  marginBottom: "14px",
                  padding: "10px 14px",
                  background:
                    selectedSelfCheckOption.id === "flashes_ratio" ? "#defbe6" : "#fff1f1",
                  borderLeft:
                    selectedSelfCheckOption.id === "flashes_ratio"
                      ? "4px solid #198038"
                      : "4px solid #b42332",
                  fontSize: "13.5px",
                  lineHeight: 1.55,
                }}
              >
                {selectedSelfCheckOption.feedback}
              </div>
            )}

            {b21VideoLesson && (
              <div
                style={{
                  border: "1px solid #d0d7de",
                  background: "#f8fafc",
                  padding: "12px 14px",
                }}
              >
                <p style={{ margin: "0 0 8px", fontSize: "13.5px", lineHeight: 1.55 }}>
                  <strong>Video mở đầu &amp; tóm tắt Bài 21 (có thuyết minh &amp; phụ đề tiếng Việt):</strong>{" "}
                  <span style={{ color: "#525252" }}>
                    Tư liệu bổ trợ trực quan (việc bấm phát video không tự đánh dấu hoàn thành Pha 1).
                  </span>
                </p>
                <NuclearLessonVideo lesson={b21VideoLesson} />
              </div>
            )}
          </section>

          {/* Tóm tắt điều kiện ghi nhận hoàn thành Pha 1 & Chuyển sang Pha 2 */}
          <section
            aria-labelledby="b21-bring-to-class-heading"
            data-preclass-status={preClassReady ? "complete" : "incomplete"}
            style={{
              border: "2px solid #0f62fe",
              background: "#edf5ff",
              padding: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              <h4 id="b21-bring-to-class-heading" style={{ margin: 0, fontSize: "16px", color: "#002d9c" }}>
                Điều kiện ghi nhận hoàn thành Pha 1 &amp; Sản phẩm mang sang Pha 2
              </h4>
              <span
                style={{
                  fontSize: "12.5px",
                  fontWeight: 700,
                  padding: "3px 10px",
                  background: preClassReady ? "#defbe6" : "#fcf4d6",
                  color: preClassReady ? "#198038" : "#8e6a00",
                  border: preClassReady ? "1px solid #42be65" : "1px solid #f1c21b",
                }}
              >
                {preClassReady
                  ? "✓ Đã hoàn thành Pha 1"
                  : "Cần đủ 3 điều kiện bên dưới để ghi nhận hoàn thành"}
              </span>
            </div>

            <ul style={{ margin: "0 0 12px", paddingLeft: "18px", fontSize: "14px", lineHeight: 1.65 }}>
              <li>
                {allApparatusMatched ? "✓" : "○"} <strong>Nhận diện 4 bộ phận R–D–S–M (Hình 21.2):</strong>{" "}
                Đã đúng {matchedApparatusCount}/4 bộ phận.
              </li>
              <li>
                {lockedInitialPredictionLabel && lockedInitialReason.trim() ? "✓" : "○"}{" "}
                <strong>Khóa dự đoán ban đầu kèm lí do:</strong>{" "}
                {lockedInitialPredictionLabel ? `“${lockedInitialPredictionLabel}”` : "Chưa khóa dự đoán."}
              </li>
              <li>
                {preSelfCheckChoice === "flashes_ratio" ? "✓" : "○"}{" "}
                <strong>Trả lời đúng câu tự kiểm tra Pha 1:</strong>{" "}
                {preSelfCheckChoice === "flashes_ratio" ? "Đã hoàn thành chính xác." : "Chưa trả lời đúng."}
              </li>
            </ul>

            <label
              htmlFor="b21-bring-question"
              style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
            >
              Câu hỏi em muốn kiểm chứng trên mô phỏng Rutherford 3D ở Pha 2 (tùy chọn):
            </label>
            <input
              id="b21-bring-question"
              type="text"
              value={bringToClassQuestion}
              onChange={(e) => {
                const val = e.target.value;
                patchNotebook((cur) => ({
                  ...cur,
                  preClassWork: {
                    ...cur.preClassWork,
                    bringToClassQuestion: val,
                  },
                }));
              }}
              placeholder="Ví dụ: Hạt α phải đi gần tâm hạt nhân vàng cỡ bao nhiêu fm thì góc lệch vượt trên 90°?"
              style={{
                width: "100%",
                minHeight: "42px",
                padding: "8px 12px",
                border: "1px solid #8d8d8d",
                background: "#ffffff",
                fontSize: "14px",
                marginBottom: "12px",
              }}
            />

            <button
              type="button"
              className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
              onClick={() => onJumpToSection("b21-rutherford-v3")}
            >
              Chuyển sang Pha 2: Thí nghiệm Rutherford 3D →
            </button>
          </section>
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — PHA 2 (MỤC 2): THÍ NGHIỆM TÁN XẠ HẠT ALPHA (RUTHERFORD 3D)
          ==================================================================== */}
      {section.kind === "b21_rutherford_v3" && (
        <div>
          <div className={styles.predictionEchoBox}>
            {lockedInitialPredictionLabel ? (
              <div>
                <strong>🔒 Dự đoán Pha 1 đã khóa:</strong> “{lockedInitialPredictionLabel}”
                {lockedInitialReason ? (
                  <span>
                    {" "}
                    — <em>Lí do ban đầu: {lockedInitialReason}</em>
                  </span>
                ) : null}
                {currentPredictionLabel &&
                  notebook.preClassPredictionChoice !== lockedInitialChoiceId && (
                    <div style={{ marginTop: "4px", fontSize: "13px", color: "#525252" }}>
                      <em>Ghi chú cập nhật:</em> “{currentPredictionLabel}”
                    </div>
                  )}
                <div style={{ marginTop: "4px", fontSize: "13px", color: "#525252" }}>
                  Dự đoán đã khóa của em cũng được đặt <strong>ngay tại bảng so sánh hai lượt đo Rutherford</strong> ở cuối bàn thí nghiệm để đối chiếu trực tiếp.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <span>
                  <strong>Chưa có dự đoán khóa từ Pha 1:</strong> Em nên khóa dự đoán ban đầu ở Pha 1 trước, hoặc mở lại Pha 1 bất cứ lúc nào.
                </span>
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnSmall}`}
                  onClick={() => onJumpToSection("b21-pre-setup")}
                >
                  Mở Pha 1 (Trước giờ học)
                </button>
              </div>
            )}
          </div>

          <FixedPhysicsActivityRenderer
            activityKey="rutherford_alpha_scattering"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
            lockedPhase1Prediction={
              lockedInitialPredictionLabel
                ? {
                    choiceLabel: lockedInitialPredictionLabel,
                    reason: lockedInitialReason,
                    bringQuestion: bringToClassQuestion,
                  }
                : null
            }
            onOpenPhase1={() => onJumpToSection("b21-pre-setup")}
          />

          {/* 3 câu hỏi thảo luận hiện tượng tán xạ hạt α — SGK tr. 92 */}
          <div
            style={{
              marginTop: "16px",
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "14px 16px",
            }}
          >
            <h4 style={{ margin: "0 0 10px", fontSize: "15.5px" }}>
              Tổng kết 3 câu hỏi thảo luận từ thí nghiệm tán xạ hạt α (SGK tr. 92)
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: "12px",
              }}
            >
              <div style={{ border: "1px solid #e0e0e0", background: "#f8fafc", padding: "12px" }}>
                <strong style={{ display: "block", fontSize: "13.5px", color: "#002d9c", marginBottom: "4px" }}>
                  1a) Tần suất lớn nhất ở vị trí (1)
                </strong>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                  Hầu hết hạt α xuyên thẳng qua lá vàng <strong>D</strong> tới vị trí <strong>(1)</strong> chứng tỏ nguyên tử <strong>không đặc khít</strong> mà phần lớn không gian là <strong>khoảng trống</strong>.
                </p>
              </div>
              <div style={{ border: "1px solid #e0e0e0", background: "#f8fafc", padding: "12px" }}>
                <strong style={{ display: "block", fontSize: "13.5px", color: "#002d9c", marginBottom: "4px" }}>
                  1b) Vì sao một số hạt α đổi hướng?
                </strong>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                  Hạt α mang điện dương bị lệch hướng do <strong>lực đẩy tĩnh điện (Coulomb)</strong> khi bay đến gần phần tích điện dương của nguyên tử vàng (Hình 21.4).
                </p>
              </div>
              <div style={{ border: "1px solid #e0e0e0", background: "#f8fafc", padding: "12px" }}>
                <strong style={{ display: "block", fontSize: "13.5px", color: "#002d9c", marginBottom: "4px" }}>
                  1c) Tỉ lệ cỡ 10⁻⁴ bật về vị trí (2)
                </strong>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                  Chỉ ~10⁻⁴ số hạt α bật ngược về vị trí <strong>(2)</strong> chứng tỏ điện tích dương và gần như toàn bộ khối lượng nguyên tử tập trung tại <strong>hạt nhân kích thước rất nhỏ</strong> ở tâm (cỡ <code>10⁻⁴</code> lần nguyên tử).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — PHA 2 (MỤC 3): SO SÁNH BA MÔ HÌNH NGUYÊN TỬ (THOMSON – RUTHERFORD – ĐÁM MÂY)
          ==================================================================== */}
      {section.kind === "b21_atomic_models" && (
        <div>
          <AtomicModelsComparisonSim
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
            onOpenRutherfordV3={() => onJumpToSection("b21-rutherford-v3")}
          />

          <div
            style={{
              marginTop: "14px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
            }}
          >
            <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
              <strong style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
                Hình 21.1 · Mô hình Thomson
              </strong>
              <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                Điện tích dương phân bố khắp không gian nguyên tử (<code>~10⁻¹⁰ m</code>), electron nằm rải rác bên trong — không giải thích được các hạt α bật ngược góc lớn.
              </p>
            </div>
            <div style={{ border: "1px solid #a6c8ff", background: "#edf5ff", padding: "12px 14px" }}>
              <strong style={{ display: "block", fontSize: "14px", color: "#002d9c", marginBottom: "4px" }}>
                Hình 21.5a · Mô hình hành tinh nguyên tử Rutherford
              </strong>
              <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                Gồm <strong>Hạt nhân</strong> rất nhỏ mang điện dương ở tâm, các electron chuyển động trên <strong>Quỹ đạo của electron</strong>, còn phần lớn không gian là <strong>Khoảng trống</strong>.
              </p>
            </div>
            <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
              <strong style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
                Hình 21.5b · Mô hình đám mây electron
              </strong>
              <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                Kế thừa <strong>Hạt nhân</strong> nhỏ ở tâm; electron có thể xuất hiện ở mọi vị trí quanh hạt nhân với xác suất nào đó và mật độ xác suất được biểu diễn bằng <strong>Đám mây electron</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — PHA 2 (MỤC 4): CẤU TẠO HẠT NHÂN (²⁸₁₄Si) & ĐỦ 8 DÒNG BẢNG 21.1 ĐÚNG ĐƠN VỊ
          ==================================================================== */}
      {section.kind === "b21_structure_size" && (
        <div>
          {/* 1. Hạt nhân Silicon-28 (Hình 21.6) & đơn vị amu (SGK tr. 93) */}
          <div
            style={{
              border: "1px solid #d0d7de",
              background: "#f8fafc",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
              1. Cấu tạo hạt nhân <Nuclide sym="Si" a={28} z={14} /> (Hình 21.6) &amp; đơn vị khối lượng nguyên tử amu (SGK tr. 93)
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "14px",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <div>
                <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.55 }}>
                  Hạt nhân tích điện dương <code>+Z·e</code> (<code>Z</code> là số hiệu nguyên tử), được tạo thành bởi hai loại hạt <strong>nucleon</strong>: <strong>proton (p)</strong> mang điện <code>+e ≈ 1,6·10⁻¹⁹ C</code> và <strong>neutron (n)</strong> trung hòa về điện. Tổng số nucleon là <strong>số khối A</strong>.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "8px",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", padding: "8px 10px" }}>
                    <span style={{ fontSize: "12px", color: "#525252", display: "block" }}>Số proton (Z)</span>
                    <strong style={{ fontSize: "16px", color: "#b42332" }}>14 proton (+14e)</strong>
                  </div>
                  <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", padding: "8px 10px" }}>
                    <span style={{ fontSize: "12px", color: "#525252", display: "block" }}>Số neutron (N = A − Z)</span>
                    <strong style={{ fontSize: "16px", color: "#0043ce" }}>14 neutron</strong>
                  </div>
                  <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", padding: "8px 10px" }}>
                    <span style={{ fontSize: "12px", color: "#525252", display: "block" }}>Tổng nucleon (A)</span>
                    <strong style={{ fontSize: "16px", color: "#161616" }}>A = 28 nucleon</strong>
                  </div>
                </div>
              </div>

              <figure
                style={{
                  margin: 0,
                  background: "#ffffff",
                  border: "1px solid #d0d7de",
                  padding: "10px 12px",
                  textAlign: "center",
                }}
              >
                <svg
                  viewBox="0 0 260 155"
                  role="img"
                  aria-label="Hình 21.6 SGK trang 93: Hạt nhân Silicon-28 có cấu tạo gồm 14 proton và 14 neutron"
                  style={{ width: "100%", maxWidth: "250px", height: "auto" }}
                >
                  <defs>
                    <radialGradient id="b21ProtonGrad" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stopColor="#ff8389" />
                      <stop offset="100%" stopColor="#da1e28" />
                    </radialGradient>
                    <radialGradient id="b21NeutronGrad" cx="35%" cy="35%" r="65%">
                      <stop offset="0%" stopColor="#78a9ff" />
                      <stop offset="100%" stopColor="#0043ce" />
                    </radialGradient>
                  </defs>
                  {[
                    [112, 46, "n"], [132, 44, "p"], [150, 50, "n"],
                    [96, 58, "p"], [118, 60, "p"], [138, 59, "n"], [158, 64, "p"],
                    [88, 76, "n"], [106, 75, "n"], [126, 74, "p"], [146, 75, "p"], [166, 80, "n"],
                    [92, 94, "p"], [112, 92, "p"], [132, 91, "n"], [152, 92, "n"], [164, 98, "p"],
                    [100, 110, "n"], [120, 108, "n"], [140, 108, "p"], [154, 112, "n"],
                    [114, 122, "p"], [132, 122, "p"], [146, 121, "n"],
                    [110, 68, "p"], [140, 68, "n"], [118, 84, "n"], [138, 84, "p"],
                  ].map(([cx, cy, t], idx) => (
                    <circle
                      key={idx}
                      cx={Number(cx)}
                      cy={Number(cy)}
                      r="11.5"
                      fill={t === "p" ? "url(#b21ProtonGrad)" : "url(#b21NeutronGrad)"}
                      stroke="#ffffff"
                      strokeWidth="0.7"
                    />
                  ))}
                  <text x="16" y="34" fontSize="12" fontWeight="700" fill="#b42332">Proton (14)</text>
                  <line x1="80" y1="32" x2="96" y2="52" stroke="#161616" strokeWidth="1.3" />
                  <text x="176" y="34" fontSize="12" fontWeight="700" fill="#0043ce">Neutron (14)</text>
                  <line x1="205" y1="38" x2="160" y2="50" stroke="#161616" strokeWidth="1.3" />
                </svg>
                <figcaption style={{ fontSize: "12px", color: "#525252", marginTop: "4px" }}>
                  <strong>Hình 21.6 (SGK tr. 93).</strong> Hạt nhân <Nuclide sym="Si" a={28} z={14} /> có cấu tạo gồm 14 proton và 14 neutron
                </figcaption>
              </figure>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "8px",
                padding: "10px 12px",
                background: "#ffffff",
                border: "1px solid #d0d7de",
                fontSize: "13.5px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <div><strong>Proton:</strong> <code>m_p ≈ {SGK_B21_MASS_CONSTANTS.protonKg} ≈ 1,00727 amu</code></div>
              <div><strong>Neutron:</strong> <code>m_n ≈ {SGK_B21_MASS_CONSTANTS.neutronKg} ≈ 1,00867 amu</code></div>
              <div><strong>1 amu:</strong> <code>≈ {SGK_B21_MASS_CONSTANTS.amuKg}</code> (= 1/12 khối lượng nguyên tử ¹²₆C)</div>
            </div>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <LatexMath
              block
              math={String.raw`R = 1{,}2 \cdot 10^{-15} \cdot A^{1/3}\;(\mathrm{m}) \quad (21.1), \qquad 1\,\mathrm{fm} = 10^{-15}\,\mathrm{m}`}
            />
          </div>

          {/* 2. Đọc đủ 8 dòng Bảng 21.1 đúng đơn vị (10⁻¹⁰ m và 10⁻¹⁵ m) — SGK tr. 94 */}
          {(() => {
            const structWork = notebook.structureSizeWork ?? {};
            const selectedSym = structWork.selectedElement ?? "Si";
            const inspected = structWork.inspectedElements ?? ["Si"];
            const activeRow =
              SGK_TABLE_21_1.find((r) => r.symbol === selectedSym) ?? SGK_TABLE_21_1[3];

            const atomicInput = structWork.atomicRadiusInput ?? "";
            const atomicUnit = structWork.atomicUnitChoice ?? "10^-10 m";
            const nuclearInput = structWork.nuclearRadiusInput ?? "";
            const nuclearUnit = structWork.nuclearUnitChoice ?? "10^-15 m";
            const scaleExp = structWork.scaleExplanation ?? "";
            const isChecked = Boolean(structWork.checked) || structCheckedLocal;

            const norm = (s: string) => s.trim().replace(",", ".");
            const atomicValOk = Number(norm(atomicInput)) === 2.1 && atomicUnit === "10^-10 m";
            const nuclearValOk = Number(norm(nuclearInput)) === 3.1 && nuclearUnit === "10^-15 m";
            const expOk = scaleExp.trim().length >= 8;
            const allStructOk = atomicValOk && nuclearValOk && expOk;

            const parseVi = (s: string) => Number(s.replace(",", "."));
            const ratioApprox = Math.round(
              (parseVi(activeRow.atomicRadius10m10) * 1e-10) /
                (parseVi(activeRow.nuclearRadius10m15) * 1e-15)
            );

            return (
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <strong style={{ fontSize: "15px" }}>
                    2. Đọc đủ 8 dòng Bảng 21.1 — Kích thước của một số hạt nhân (SGK tr. 94)
                  </strong>
                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: inspected.length === 8 ? "#198038" : "#0043ce" }}>
                    Đã bấm đọc chi tiết: {inspected.length}/8 dòng Bảng 21.1
                  </span>
                </div>

                <div className={styles.tableScroll} style={{ marginBottom: "10px" }}>
                  <table className={styles.cdsTable} data-testid="sgk-table-21-1">
                    <caption>
                      Bảng 21.1. Kích thước của một số hạt nhân (SGK Vật lí 12, tr. 94) — Bấm vào từng dòng để đọc giá trị kèm đúng đơn vị lũy thừa
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Tên nguyên tố</th>
                        <th scope="col" className={styles.numCell}>Số khối</th>
                        <th scope="col" className={styles.numCell}>Bán kính nguyên tử (10⁻¹⁰ m)</th>
                        <th scope="col" className={styles.numCell}>Bán kính hạt nhân (10⁻¹⁵ m)</th>
                        <th scope="col">Trạng thái đọc</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SGK_TABLE_21_1.map((row) => {
                        const isSelectedRow = row.symbol === activeRow.symbol;
                        const hasRead = inspected.includes(row.symbol);
                        return (
                          <tr
                            key={row.symbol}
                            data-table21-row={row.symbol}
                            onClick={() => {
                              patchNotebook((cur) => {
                                const prevList = cur.structureSizeWork?.inspectedElements ?? ["Si"];
                                const nextList = prevList.includes(row.symbol)
                                  ? prevList
                                  : [...prevList, row.symbol];
                                return {
                                  ...cur,
                                  structureSizeWork: {
                                    ...cur.structureSizeWork,
                                    selectedElement: row.symbol,
                                    inspectedElements: nextList,
                                  },
                                };
                              });
                            }}
                            style={{
                              cursor: "pointer",
                              background: isSelectedRow
                                ? "#edf5ff"
                                : row.symbol === "Si"
                                  ? "#fcf4d6"
                                  : undefined,
                              fontWeight: isSelectedRow ? 700 : 400,
                            }}
                          >
                            <th scope="row">
                              {row.elementName} (<Nuclide sym={row.symbol} a={row.massNumberA} z={row.z} />)
                            </th>
                            <td className={styles.numCell}>{row.massNumberA}</td>
                            <td className={styles.numCell}>{row.atomicRadius10m10}</td>
                            <td className={styles.numCell}>{row.nuclearRadius10m15}</td>
                            <td style={{ fontSize: "12px", color: hasRead ? "#198038" : "#525252" }}>
                              {hasRead ? "✓ Đã đọc đơn vị" : "Bấm để đọc"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Hộp đọc đúng đơn vị lũy thừa cho dòng đang chọn trong 8 dòng Bảng 21.1 */}
                <div
                  data-testid="table-21-1-unit-reader"
                  style={{
                    padding: "12px 14px",
                    background: "#edf5ff",
                    border: "1px solid #a6c8ff",
                    marginBottom: "14px",
                    fontSize: "13.5px",
                    lineHeight: 1.6,
                  }}
                >
                  <strong>
                    Đọc đúng đơn vị dòng đang chọn — {activeRow.elementName} (A = {activeRow.massNumberA}):
                  </strong>
                  <div>
                    • Bán kính nguyên tử: <strong>{activeRow.atomicRadius10m10} × 10⁻¹⁰ m</strong> · Bán kính hạt nhân thực nghiệm:{" "}
                    <strong>{activeRow.nuclearRadius10m15} × 10⁻¹⁵ m</strong> (= {activeRow.nuclearRadius10m15} fm) · Theo công thức (21.1):{" "}
                    <strong>{activeRow.formulaRadius10m15} × 10⁻¹⁵ m</strong>.
                  </div>
                  <div style={{ color: "#002d9c" }}>
                    → Bán kính nguyên tử {activeRow.elementName} lớn gấp khoảng{" "}
                    <strong>{ratioApprox.toLocaleString("vi-VN")} lần</strong> bán kính hạt nhân của nó (vì vậy trên hình vẽ luôn phải phóng đại riêng vùng hạt nhân hàng chục nghìn lần).
                  </div>
                </div>

                {/* Phiếu kiểm tra đọc Bảng 21.1 đúng đơn vị */}
                <div
                  style={{
                    border: "1px solid #8d8d8d",
                    background: "#ffffff",
                    padding: "16px",
                  }}
                >
                  <h4 style={{ margin: "0 0 8px", fontSize: "15.5px" }}>
                    Kiểm tra đọc Bảng 21.1 đúng số và đúng đơn vị (dòng Silicon, A = 28)
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                      gap: "12px",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <label htmlFor="b21-si-atomic-r" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                        1. Bán kính nguyên tử Silicon:
                      </label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input
                          id="b21-si-atomic-r"
                          type="text"
                          inputMode="decimal"
                          value={atomicInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStructCheckedLocal(false);
                            patchNotebook((cur) => ({
                              ...cur,
                              structureSizeWork: {
                                ...cur.structureSizeWork,
                                atomicRadiusInput: val,
                                atomicUnitChoice: atomicUnit,
                                checked: false,
                              },
                            }));
                          }}
                          placeholder="Ví dụ: 2,1"
                          style={{ flex: 1, minHeight: "40px", padding: "6px 10px", border: "1px solid #8d8d8d", fontSize: "14px" }}
                        />
                        <select
                          aria-label="Đơn vị bán kính nguyên tử Silicon"
                          value={atomicUnit}
                          onChange={(e) => {
                            const u = e.target.value;
                            setStructCheckedLocal(false);
                            patchNotebook((cur) => ({
                              ...cur,
                              structureSizeWork: {
                                ...cur.structureSizeWork,
                                atomicUnitChoice: u,
                                checked: false,
                              },
                            }));
                          }}
                          style={{ minHeight: "40px", padding: "6px 8px", border: "1px solid #8d8d8d", background: "#fff", fontSize: "13.5px" }}
                        >
                          <option value="10^-10 m">× 10⁻¹⁰ m</option>
                          <option value="10^-15 m">× 10⁻¹⁵ m</option>
                          <option value="m">m</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="b21-si-nuclear-r" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                        2. Bán kính hạt nhân Silicon:
                      </label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input
                          id="b21-si-nuclear-r"
                          type="text"
                          inputMode="decimal"
                          value={nuclearInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStructCheckedLocal(false);
                            patchNotebook((cur) => ({
                              ...cur,
                              structureSizeWork: {
                                ...cur.structureSizeWork,
                                nuclearRadiusInput: val,
                                nuclearUnitChoice: nuclearUnit,
                                checked: false,
                              },
                            }));
                          }}
                          placeholder="Ví dụ: 3,1"
                          style={{ flex: 1, minHeight: "40px", padding: "6px 10px", border: "1px solid #8d8d8d", fontSize: "14px" }}
                        />
                        <select
                          aria-label="Đơn vị bán kính hạt nhân Silicon"
                          value={nuclearUnit}
                          onChange={(e) => {
                            const u = e.target.value;
                            setStructCheckedLocal(false);
                            patchNotebook((cur) => ({
                              ...cur,
                              structureSizeWork: {
                                ...cur.structureSizeWork,
                                nuclearUnitChoice: u,
                                checked: false,
                              },
                            }));
                          }}
                          style={{ minHeight: "40px", padding: "6px 8px", border: "1px solid #8d8d8d", background: "#fff", fontSize: "13.5px" }}
                        >
                          <option value="10^-15 m">× 10⁻¹⁵ m (fm)</option>
                          <option value="10^-10 m">× 10⁻¹⁰ m</option>
                          <option value="m">m</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <label htmlFor="b21-scale-explanation" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                    3. Vì sao hình vẽ nguyên tử trong sách không thể vẽ hạt nhân theo đúng tỉ lệ thực?
                  </label>
                  <textarea
                    id="b21-scale-explanation"
                    className={styles.evidenceTextarea}
                    rows={2}
                    value={scaleExp}
                    onChange={(e) => {
                      const val = e.target.value;
                      setStructCheckedLocal(false);
                      patchNotebook((cur) => ({
                        ...cur,
                        structureSizeWork: {
                          ...cur.structureSizeWork,
                          scaleExplanation: val,
                          checked: false,
                        },
                      }));
                    }}
                    placeholder="Ví dụ: Vì bán kính hạt nhân (10⁻¹⁵ m) nhỏ hơn bán kính nguyên tử (10⁻¹⁰ m) hàng chục nghìn lần nên nếu vẽ đúng tỉ lệ sẽ không nhìn thấy hạt nhân…"
                  />

                  <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className={`${styles.cdsBtn} ${styles.cdsBtnPrimary} ${styles.cdsBtnSmall}`}
                      onClick={() => {
                        setStructCheckedLocal(true);
                        patchNotebook((cur) => ({
                          ...cur,
                          structureSizeWork: {
                            ...cur.structureSizeWork,
                            atomicUnitChoice: atomicUnit,
                            nuclearUnitChoice: nuclearUnit,
                            checked: true,
                          },
                        }));
                        if (allStructOk) {
                          onMarkSectionComplete(section.id, true);
                        }
                      }}
                    >
                      Kiểm tra &amp; lưu bài đọc Bảng 21.1
                    </button>
                    {isChecked && (
                      <span
                        role="status"
                        style={{ fontSize: "13.5px", fontWeight: 600, color: allStructOk ? "#198038" : "#b42332" }}
                      >
                        {allStructOk
                          ? "✓ Chính xác! Nguyên tử Silicon có bán kính 2,1 × 10⁻¹⁰ m và hạt nhân có bán kính 3,1 × 10⁻¹⁵ m (chênh ~68 000 lần)."
                          : "Kiểm tra lại giá trị (2,1 × 10⁻¹⁰ m; 3,1 × 10⁻¹⁵ m) và ghi câu giải thích tỉ lệ phóng đại."}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          <h4 style={{ margin: "20px 0 10px", fontSize: "16px" }}>
            3. Thực hành dựng hạt nhân <Nuclide sym="Si" a={28} z={14} /> với 14 proton và 14 neutron
          </h4>
          <FixedPhysicsActivityRenderer
            activityKey="nuclear_structure_builder"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — PHA 2 (MỤC 5): KÍ HIỆU HẠT NHÂN & KHẢO SÁT ¹H, ²H, ³H BẰNG N = A − Z
          ==================================================================== */}
      {section.kind === "b21_symbol_isotopes" && (
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "14px",
              marginBottom: "16px",
            }}
          >
            <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "14px 16px" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "15.5px" }}>
                Kí hiệu hạt nhân <Nuclide sym="X" a="A" z="Z" /> và dạng viết gọn <sup>A</sup>X (SGK tr. 94–95)
              </h4>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "14px", lineHeight: 1.6 }}>
                <li><strong>X</strong>: Kí hiệu hóa học nguyên tố (ví dụ <Nuclide sym="C" a={12} z={6} />, gọn là <code>¹²C</code>).</li>
                <li><strong>A (số khối)</strong>: Tổng số nucleon trong hạt nhân.</li>
                <li><strong>Z (số hiệu nguyên tử)</strong>: Số proton trong hạt nhân.</li>
                <li><strong>Số lượng hạt neutron</strong>: <code>N = A − Z</code>.</li>
              </ul>
            </div>

            <div style={{ border: "1px solid #a6c8ff", background: "#edf5ff", padding: "14px 16px" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "15.5px", color: "#002d9c" }}>
                Đồng vị bền &amp; đồng vị phóng xạ (SGK tr. 95)
              </h4>
              <p style={{ margin: "0 0 6px", fontSize: "14px", lineHeight: 1.6 }}>
                Các hạt nhân <strong>đồng vị</strong> có <strong>cùng số Z, khác số A</strong> (cùng số proton, khác số neutron).
              </p>
              <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                Ví dụ: Hydrogen có <Nuclide sym="H" a={1} z={1} />, <Nuclide sym="H" a={2} z={1} /> (<Nuclide sym="D" a={2} z={1} />), <Nuclide sym="H" a={3} z={1} /> (<Nuclide sym="T" a={3} z={1} />); Carbon có <Nuclide sym="C" a={12} z={6} />, <Nuclide sym="C" a={13} z={6} /> (đồng vị bền &gt; 99%) và <Nuclide sym="C" a={14} z={6} /> (phóng xạ).
              </p>
            </div>
          </div>

          <div className={styles.tableScroll}>
            <table className={styles.cdsTable}>
              <caption>
                Ba đồng vị của nguyên tố Hydrogen theo công thức N = A − Z (SGK tr. 95)
              </caption>
              <thead>
                <tr>
                  <th scope="col">Tên đồng vị</th>
                  <th scope="col">Kí hiệu</th>
                  <th scope="col" className={styles.numCell}>Số proton Z</th>
                  <th scope="col" className={styles.numCell}>Số khối A</th>
                  <th scope="col" className={styles.numCell}>Số neutron N = A − Z</th>
                  <th scope="col">Đặc điểm</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Hydrogen thường</th>
                  <td><Nuclide sym="H" a={1} z={1} /> (¹H)</td>
                  <td className={styles.numCell}>1</td>
                  <td className={styles.numCell}>1</td>
                  <td className={styles.numCell}>1 − 1 = 0</td>
                  <td>Đồng vị bền; hạt nhân chỉ có 1 proton, không có neutron.</td>
                </tr>
                <tr>
                  <th scope="row">Hydrogen nặng (deuterium)</th>
                  <td><Nuclide sym="H" a={2} z={1} /> (<Nuclide sym="D" a={2} z={1} />, ²H)</td>
                  <td className={styles.numCell}>1</td>
                  <td className={styles.numCell}>2</td>
                  <td className={styles.numCell}>2 − 1 = 1</td>
                  <td>Đồng vị bền; hạt nhân gồm 1 proton và 1 neutron.</td>
                </tr>
                <tr>
                  <th scope="row">Hydrogen siêu nặng (tritium)</th>
                  <td><Nuclide sym="H" a={3} z={1} /> (<Nuclide sym="T" a={3} z={1} />, ³H)</td>
                  <td className={styles.numCell}>1</td>
                  <td className={styles.numCell}>3</td>
                  <td className={styles.numCell}>3 − 1 = 2</td>
                  <td>Đồng vị phóng xạ (không bền); hạt nhân gồm 1 proton và 2 neutron.</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bài tập tự tính N = A − Z cho ba đồng vị ¹H, ²H, ³H & khối lượng riêng */}
          {(() => {
            const isoWork = notebook.symbolIsotopeWork ?? {};
            const h1N = isoWork.h1NeutronInput ?? "";
            const h2N = isoWork.h2NeutronInput ?? "";
            const h3N = isoWork.h3NeutronInput ?? "";
            const densityChoice = isoWork.densityChoice ?? "";
            const isoChecked = Boolean(isoWork.checked) || isoCheckedLocal;

            const h1Ok = h1N.trim() !== "" && Number(h1N.trim()) === 0;
            const h2Ok = h2N.trim() !== "" && Number(h2N.trim()) === 1;
            const h3Ok = h3N.trim() !== "" && Number(h3N.trim()) === 2;
            const densityOk = densityChoice === "heavier_nucleus";
            const allIsoOk = h1Ok && h2Ok && h3Ok && densityOk;

            return (
              <div
                style={{
                  border: "1px solid #8d8d8d",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 10px", fontSize: "15.5px" }}>
                  Phiếu khảo sát nhanh ba đồng vị ¹H, ²H, ³H bằng N = A − Z (lưu vào sổ học tập)
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                    Số neutron N của ¹H (<Nuclide sym="H" a={1} z={1} />):
                    <input
                      type="number"
                      inputMode="numeric"
                      data-h1-n-input
                      value={h1N}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIsoCheckedLocal(false);
                        patchNotebook((cur) => ({
                          ...cur,
                          symbolIsotopeWork: { ...cur.symbolIsotopeWork, h1NeutronInput: val, checked: false },
                        }));
                      }}
                      placeholder="N = 1 − 1 = ?"
                      style={{ display: "block", width: "100%", marginTop: "6px", minHeight: "40px", padding: "6px 10px", border: "1px solid #8d8d8d", fontSize: "14.5px" }}
                    />
                  </label>
                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                    Số neutron N của ²H (<Nuclide sym="H" a={2} z={1} />):
                    <input
                      type="number"
                      inputMode="numeric"
                      data-h2-n-input
                      value={h2N}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIsoCheckedLocal(false);
                        patchNotebook((cur) => ({
                          ...cur,
                          symbolIsotopeWork: { ...cur.symbolIsotopeWork, h2NeutronInput: val, checked: false },
                        }));
                      }}
                      placeholder="N = 2 − 1 = ?"
                      style={{ display: "block", width: "100%", marginTop: "6px", minHeight: "40px", padding: "6px 10px", border: "1px solid #8d8d8d", fontSize: "14.5px" }}
                    />
                  </label>
                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                    Số neutron N của ³H (<Nuclide sym="H" a={3} z={1} />):
                    <input
                      type="number"
                      inputMode="numeric"
                      data-h3-n-input
                      value={h3N}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIsoCheckedLocal(false);
                        patchNotebook((cur) => ({
                          ...cur,
                          symbolIsotopeWork: { ...cur.symbolIsotopeWork, h3NeutronInput: val, checked: false },
                        }));
                      }}
                      placeholder="N = 3 − 1 = ?"
                      style={{ display: "block", width: "100%", marginTop: "6px", minHeight: "40px", padding: "6px 10px", border: "1px solid #8d8d8d", fontSize: "14.5px" }}
                    />
                  </label>
                </div>

                <fieldset style={{ border: "none", margin: "0 0 12px", padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
                    Câu hỏi ? (SGK tr. 95): Giải thích tại sao các chất cấu tạo từ cùng một loại nguyên tố nhưng khối lượng riêng vẫn có thể khác nhau?
                  </legend>
                  {[
                    [
                      "heavier_nucleus",
                      "Vì các đồng vị có cùng số proton Z nhưng khác số neutron N = A − Z làm khối lượng nguyên tử khác nhau (ngoài ra ở chất rắn còn có thể do cấu trúc mạng tinh thể khác nhau).",
                    ],
                    [
                      "more_protons",
                      "Vì các đồng vị của cùng nguyên tố có số proton Z khác nhau gấp nhiều lần.",
                    ],
                  ].map(([val, label]) => (
                    <label
                      key={val}
                      style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px", fontSize: "14px", cursor: "pointer" }}
                    >
                      <input
                        type="radio"
                        name="b21-iso-density"
                        checked={densityChoice === val}
                        onChange={() => {
                          setIsoCheckedLocal(false);
                          patchNotebook((cur) => ({
                            ...cur,
                            symbolIsotopeWork: { ...cur.symbolIsotopeWork, densityChoice: val, checked: false },
                          }));
                        }}
                        style={{ marginTop: "3px" }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </fieldset>

                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={`${styles.cdsBtn} ${styles.cdsBtnPrimary} ${styles.cdsBtnSmall}`}
                    onClick={() => {
                      setIsoCheckedLocal(true);
                      patchNotebook((cur) => ({
                        ...cur,
                        symbolIsotopeWork: { ...cur.symbolIsotopeWork, checked: true },
                      }));
                      if (allIsoOk) {
                        onMarkSectionComplete(section.id, true);
                      }
                    }}
                  >
                    Kiểm tra &amp; lưu khảo sát ¹H, ²H, ³H
                  </button>
                  {isoChecked && (
                    <span
                      role="status"
                      style={{ fontSize: "13.5px", fontWeight: 600, color: allIsoOk ? "#198038" : "#b42332" }}
                    >
                      {allIsoOk
                        ? "✓ Chính xác! Ba đồng vị ¹H, ²H, ³H đều có Z = 1 nhưng số neutron lần lượt là N = 0, 1, 2."
                        : "Kiểm tra lại N = A − Z của ¹H (0), ²H (1), ³H (2) và câu giải thích đồng vị."}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          <h4 style={{ margin: "20px 0 10px", fontSize: "16px" }}>
            Bàn thực hành trực quan ba đồng vị Hydrogen và quy luật kích thước hạt nhân
          </h4>
          <FixedPhysicsActivityRenderer
            activityKey="isotope_and_nuclear_size"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — PHA 3 (SAU GIỜ HỌC): NHIỆM VỤ VẬN DỤNG VỚI LÁ NHÔM ²⁷₁₃Al
          ==================================================================== */}
      {section.kind === "b21_after_transfer" &&
        (() => {
          const afterWork = notebook.afterClassWork ?? {};
          const alZ = afterWork.alZ ?? "";
          const alN = afterWork.alN ?? "";
          const alRadiusFm = afterWork.alRadiusFm ?? "";
          const alChoice = afterWork.alChoice ?? "";
          const predictionReflection = afterWork.predictionReflection ?? "";
          const alChecked = Boolean(afterWork.checked) || alCheckedLocal;
          const submittedAt = afterWork.submittedAt ?? "";

          const parsedR = Number(alRadiusFm.trim().replace(",", "."));
          const rOk = alRadiusFm.trim() !== "" && Number.isFinite(parsedR) && Math.abs(parsedR - 3.6) <= 0.05;
          const zOk = alZ.trim() !== "" && Number(alZ.trim()) === 13;
          const nOk = alN.trim() !== "" && Number(alN.trim()) === 14;
          const choiceOk = alChoice === "smaller";
          const reflectionOk = predictionReflection.trim().length >= 8;
          const allAfterOk = zOk && nOk && rOk && choiceOk && reflectionOk;

          return (
            <div
              data-testid="b21-pha3-al27-task"
              style={{ border: "1px solid #d0d7de", padding: "18px", background: "#ffffff" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                <h4 style={{ margin: 0, fontSize: "16.5px" }}>
                  Nhiệm vụ vận dụng Pha 3: Tán xạ hạt α trên lá nhôm mỏng <Nuclide sym="Al" a={27} z={13} />
                </h4>
                {submittedAt && (
                  <span
                    data-pha3-saved-badge
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      background: allAfterOk ? "#defbe6" : "#fcf4d6",
                      color: allAfterOk ? "#198038" : "#8e6a00",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    Đã lưu kết quả nộp bài ({submittedAt})
                  </span>
                )}
              </div>

              <p style={{ margin: "0 0 14px", fontSize: "14.5px", lineHeight: 1.6 }}>
                Trong phòng thí nghiệm ảo, một nhóm học sinh giữ nguyên nguồn phát hạt α (<code>E = 6 MeV</code>) nhưng thay lá vàng mỏng <Nuclide sym="Au" a={197} z={79} /> bằng lá nhôm mỏng <Nuclide sym="Al" a={27} z={13} /> có cùng mật độ diện tích nguyên tử.
              </p>

              <div
                style={{
                  marginBottom: "14px",
                  padding: "10px 14px",
                  background: "#edf5ff",
                  borderLeft: "4px solid #0f62fe",
                  fontSize: "13.5px",
                  lineHeight: 1.55,
                }}
              >
                <strong>🔒 Dự đoán ban đầu của em ở Pha 1:</strong>{" "}
                {lockedInitialPredictionLabel ? (
                  <>
                    “{lockedInitialPredictionLabel}”
                    {lockedInitialReason ? <span> (Lí do: {lockedInitialReason})</span> : null}
                  </>
                ) : (
                  <span>Chưa lưu dự đoán ở Pha 1 — em vẫn có thể làm bài và nêu nhận xét tổng kết bên dưới.</span>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                  1. Số proton Z của <Nuclide sym="Al" a={27} z={13} />:
                  <input
                    type="number"
                    inputMode="numeric"
                    data-al-z-input
                    value={alZ}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAlCheckedLocal(false);
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: { ...cur.afterClassWork, alZ: val, checked: false },
                      }));
                    }}
                    placeholder="Nhập Z…"
                    style={{ display: "block", width: "100%", marginTop: "6px", minHeight: "42px", padding: "8px 10px", border: "1px solid #8d8d8d", fontSize: "15px" }}
                  />
                </label>

                <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                  2. Số neutron N = A − Z của <Nuclide sym="Al" a={27} z={13} />:
                  <input
                    type="number"
                    inputMode="numeric"
                    data-al-n-input
                    value={alN}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAlCheckedLocal(false);
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: { ...cur.afterClassWork, alN: val, checked: false },
                      }));
                    }}
                    placeholder="Nhập N…"
                    style={{ display: "block", width: "100%", marginTop: "6px", minHeight: "42px", padding: "8px 10px", border: "1px solid #8d8d8d", fontSize: "15px" }}
                  />
                </label>

                <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                  3. Bán kính gần đúng R của <Nuclide sym="Al" a={27} z={13} /> (đơn vị <code>fm = 10⁻¹⁵ m</code>):
                  <input
                    type="text"
                    inputMode="decimal"
                    data-al-r-input
                    value={alRadiusFm}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAlCheckedLocal(false);
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: { ...cur.afterClassWork, alRadiusFm: val, checked: false },
                      }));
                    }}
                    placeholder="Tính 1,2 × 27^(1/3)…"
                    style={{ display: "block", width: "100%", marginTop: "6px", minHeight: "42px", padding: "8px 10px", border: "1px solid #8d8d8d", fontSize: "15px" }}
                  />
                </label>
              </div>

              <fieldset style={{ border: "none", padding: 0, margin: "0 0 14px" }}>
                <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
                  4. Ở cùng tham số va chạm b = 15 fm và động năng E = 6 MeV, góc lệch của hạt α qua hạt nhân <Nuclide sym="Al" a={27} z={13} /> thay đổi thế nào so với qua hạt nhân <Nuclide sym="Au" a={197} z={79} />?
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
                    style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginBottom: "8px", fontSize: "14px", cursor: "pointer" }}
                  >
                    <input
                      type="radio"
                      name="b21-al-transfer"
                      value={val}
                      checked={alChoice === val}
                      onChange={() => {
                        setAlCheckedLocal(false);
                        patchNotebook((cur) => ({
                          ...cur,
                          afterClassWork: { ...cur.afterClassWork, alChoice: val, checked: false },
                        }));
                      }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>

              <label htmlFor="b21-after-reflection" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                5. Nhận xét rút ra khi đối chiếu với dự đoán ban đầu của em ở Pha 1:
              </label>
              <textarea
                id="b21-after-reflection"
                className={styles.evidenceTextarea}
                rows={2}
                value={predictionReflection}
                onChange={(e) => {
                  const val = e.target.value;
                  setAlCheckedLocal(false);
                  patchNotebook((cur) => ({
                    ...cur,
                    afterClassWork: { ...cur.afterClassWork, predictionReflection: val, checked: false },
                  }));
                }}
                placeholder="Ví dụ: Kết quả hai lượt đo và tỉ lệ ~10⁻⁴ ở vị trí (2) giúp em hiểu vì sao điện tích dương phải tập trung tại hạt nhân rất nhỏ ở tâm…"
              />

              <div style={{ marginTop: "12px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  data-submit-pha3-btn
                  className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                  onClick={() => {
                    const nowStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
                    setAlCheckedLocal(true);
                    patchNotebook((cur) => ({
                      ...cur,
                      afterClassWork: {
                        ...cur.afterClassWork,
                        checked: true,
                        submittedAt: nowStr,
                      },
                    }));
                    if (allAfterOk) {
                      onMarkSectionComplete(section.id, true);
                    }
                  }}
                >
                  Nộp câu trả lời &amp; xem phản hồi
                </button>
              </div>

              {alChecked && (
                <div
                  role="status"
                  data-pha3-feedback={allAfterOk ? "correct" : "needs-review"}
                  style={{
                    marginTop: "12px",
                    padding: "12px 14px",
                    background: allAfterOk ? "#defbe6" : "#fff0f1",
                    borderLeft: allAfterOk ? "4px solid #198038" : "4px solid #b42332",
                    fontSize: "14px",
                    lineHeight: 1.6,
                  }}
                >
                  {allAfterOk ? (
                    <>
                      <strong>✓ Đã nộp và hoàn thành chính xác nhiệm vụ vận dụng ²⁷₁₃Al!</strong>
                      <ul style={{ margin: "6px 0 0", paddingLeft: "18px" }}>
                        <li>Thành phần hạt nhân <Nuclide sym="Al" a={27} z={13} />: <code>Z = 13</code> proton, <code>N = 27 − 13 = 14</code> neutron.</li>
                        <li>Bán kính gần đúng: <code>R = 1,2 × 27¹/³ = 3,6 fm</code> (<code>3,6 × 10⁻¹⁵ m</code>).</li>
                        <li>Góc tán xạ qua nhôm nhỏ hơn rõ rệt so với vàng vì điện tích hạt nhân <code>+13e &lt; +79e</code>.</li>
                        <li>Bài làm và phản hồi này đã được lưu bền vững trên trình duyệt để em mở lại bất cứ lúc nào.</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <strong>Phản hồi chi tiết từng mục cần chỉnh sửa:</strong>
                      <ul style={{ margin: "6px 0 0", paddingLeft: "18px" }}>
                        {!zOk && <li>Chỉ số dưới của ²⁷₁₃Al cho biết số proton <code>Z = 13</code>.</li>}
                        {!nOk && <li>Số neutron tính bằng <code>N = A − Z = 27 − 13 = 14</code>.</li>}
                        {!rOk && <li>Bán kính gần đúng <code>R = 1,2 × 27¹/³ = 1,2 × 3 = 3,6 fm</code> (nhập <code>3,6</code>).</li>}
                        {!choiceOk && <li>Hạt nhân nhôm có điện tích <code>+13e</code> nhỏ hơn vàng (<code>+79e</code>) nên lực đẩy tĩnh điện yếu hơn, góc lệch nhỏ hơn.</li>}
                        {!reflectionOk && <li>Em hãy ghi ít nhất một câu nhận xét đối chiếu lại với dự đoán Pha 1 ở mục 5.</li>}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })()}

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
