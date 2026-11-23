"use client";
/* eslint-disable @next/next/no-img-element -- Scientific apparatus capture and explicit dimensions */

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
      "Đa số hạt α đi xuyên thẳng tới vị trí (1), nhưng có một tỉ lệ rất nhỏ (~10⁻⁴) lệch góc lớn, thậm chí bật ngược về vị trí (2) (> 90°).",
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
  {
    code: "R",
    label: "Nguồn phát hạt α (R)",
    correctRole: "emit_alpha",
  },
  {
    code: "D",
    label: "Lá vàng rất mỏng (D)",
    correctRole: "scatter_target",
  },
  {
    code: "S",
    label: "Màn huỳnh quang ZnS (S)",
    correctRole: "flash_screen",
  },
  {
    code: "M",
    label: "Kính hiển vi quan sát (M)",
    correctRole: "observer_microscope",
  },
] as const;

const B21_APPARATUS_ROLE_OPTIONS = [
  { value: "", label: "— Chọn đúng vai trò trên Hình 21.2 —" },
  { value: "emit_alpha", label: "Phát chùm hạt α mang điện dương đi qua khe chuẩn trực" },
  { value: "scatter_target", label: "Bia tán xạ bằng vàng rất mỏng (dày cỡ 4·10⁻⁷ m) đặt tại tâm" },
  { value: "flash_screen", label: "Tạo đốm sáng nhấp nháy mỗi khi có một hạt α đập vào" },
  { value: "observer_microscope", label: "Nơi người quan sát nhìn qua, xoay từ vị trí (1) sang vị trí (2)" },
] as const;

const B21_PRE_SELF_CHECK_OPTIONS = [
  {
    id: "see_tracks",
    label:
      "Mắt đặt ở kính M nhìn thấy trực tiếp các đường quỹ đạo cong của từng hạt α bay qua lá vàng D.",
    feedback:
      "Chưa chính xác. Hãy nhìn lại Hình 21.2b: hạt α kích thước vi mô nên mắt không thể nhìn thấy đường bay trong chân không G; đường quỹ đạo chỉ là mô hình giải thích, còn dấu hiệu thấy được là các đốm sáng lóe lên trên màn S.",
  },
  {
    id: "flashes_ratio",
    label:
      "Mắt chỉ nhìn thấy các đốm sáng trên màn S; khi xoay kính M từ vị trí (1) sang vị trí (2) lệch > 90°, vẫn có đốm sáng nhưng tần suất ít hơn ở (1) cỡ 10⁴ lần.",
    feedback:
      "✓ Chính xác! Trên Hình 21.2b, màn huỳnh quang S biến va chạm của từng hạt α thành đốm sáng quan sát được qua kính M, và tại vị trí (2) số đốm sáng hiếm hơn vị trí (1) khoảng 10 000 lần.",
  },
  {
    id: "equal_everywhere",
    label:
      "Khi xoay kính M từ vị trí (1) sang vị trí (2), số đốm sáng trên màn S xuất hiện dày đặc ngang bằng nhau ở mọi góc.",
    feedback:
      "Chưa chính xác. Đối chiếu lại chú thích tại vị trí (1) và (2) trên Hình 21.2b: đa số hạt đi thẳng tới (1), còn tại vị trí (2) lệch > 90° tần suất đốm sáng ít hơn tới cỡ 10⁴ lần.",
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

function deriveLocalMediaCompanions(url?: string): {
  readonly poster?: string;
  readonly captionsVtt?: string;
} {
  if (!url) return {};
  const trimmed = url.trim();
  if (
    /^\/videos\/nuclear-(?:lessons(?:-v2)?|openers)\/b2[1-5]\.(?:mp4|webm)$/i.test(
      trimmed
    )
  ) {
    return {
      poster: trimmed.replace(/\.(?:mp4|webm)$/i, ".jpg"),
      captionsVtt: trimmed.replace(/\.(?:mp4|webm)$/i, ".vi.vtt"),
    };
  }
  if (trimmed.startsWith("/videos/") && /\.(?:mp4|webm)$/i.test(trimmed)) {
    return {
      captionsVtt: trimmed.replace(/\.(?:mp4|webm)$/i, ".vi.vtt"),
    };
  }
  return {};
}

function VerifiedFlowVideoBlock({
  url,
  title,
  poster,
  captionsVttUrl,
}: {
  readonly url?: string;
  readonly title: string;
  readonly poster?: string;
  readonly captionsVttUrl?: string;
}) {
  // Quy tắc nghiêm ngặt: Video Flow chỉ hiện nút phát khi đã có tệp/URL video thật
  if (!isVerifiedVideoUrl(url)) {
    return null;
  }
  const derived = deriveLocalMediaCompanions(url);
  const resolvedPoster = poster ?? derived.poster;
  const resolvedCaptions = captionsVttUrl ?? derived.captionsVtt;

  return (
    <div style={{ marginBottom: "20px", border: "1px solid #d0d7de", background: "#0b1220", padding: "12px" }}>
      <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 700, color: "#f4f4f4" }}>
        Video minh họa trực quan (Flow): {title}
      </p>
      <video
        controls
        playsInline
        preload="metadata"
        poster={resolvedPoster}
        src={url}
        style={{ width: "100%", maxHeight: "420px", display: "block", background: "#000" }}
      >
        {resolvedCaptions && (
          <track
            kind="captions"
            srcLang="vi"
            label="Tiếng Việt"
            src={resolvedCaptions}
            default
          />
        )}
        Trình duyệt chưa hỗ trợ phát trực tiếp. <a href={url}>Mở tệp video</a>.
      </video>
    </div>
  );
}

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

  // State nháp đồng bộ với localStorage cho các mục đọc/vận dụng (khởi tạo/đọc trực tiếp từ notebook để F5 hoặc chuyển tab giữ 100%)
  const [alCheckedLocal, setAlCheckedLocal] = useState(false);
  const [structCheckedLocal, setStructCheckedLocal] = useState(false);
  const [isoCheckedLocal, setIsoCheckedLocal] = useState(false);
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
          BÀI 21 — 1. PHA 1 (TRƯỚC GIỜ HỌC): TỰ NGHIÊN CỨU HÌNH 21.1 – 21.2
          ==================================================================== */}
      {section.kind === "b21_pre_rutherford" && (
        <div>
          {/* BƯỚC 1: Câu hỏi mở đầu gắn với Hình 21.1 (Mô hình nguyên tử Thomson) */}
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
              Bước 1 · Tình huống mở đầu từ mô hình nguyên tử ban đầu (Hình 21.1 · SGK tr. 91)
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
                  viewBox="0 0 320 200"
                  width="320"
                  height="200"
                  role="img"
                  aria-label="Hình 21.1 Mô hình nguyên tử Thomson: hình cầu đường kính cỡ 10 mũ trừ 10 mét mang điện tích dương phân bố đều khắp thể tích và các electron mang điện âm nằm rải rác bên trong"
                  style={{ width: "100%", maxWidth: "320px", height: "auto", display: "inline-block" }}
                >
                  <defs>
                    <radialGradient id="b21ThomsonPosSphere" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#ffd7d9" />
                      <stop offset="100%" stopColor="#ffb3b8" />
                    </radialGradient>
                  </defs>
                  {/* Khối cầu tích điện dương phân bố đều */}
                  <circle
                    cx="155"
                    cy="96"
                    r="68"
                    fill="url(#b21ThomsonPosSphere)"
                    stroke="#da1e28"
                    strokeWidth="2"
                  />
                  {/* Dấu + phân bố đều khắp thể tích */}
                  {[
                    [155, 48],
                    [116, 68],
                    [194, 68],
                    [138, 96],
                    [174, 96],
                    [118, 124],
                    [192, 124],
                    [155, 144],
                  ].map(([cx, cy], idx) => (
                    <text
                      key={idx}
                      x={cx}
                      y={cy}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#a2191f"
                      fontSize="15"
                      fontWeight="700"
                    >
                      +
                    </text>
                  ))}
                  {/* Các electron e⁻ nằm rải rác bên trong */}
                  {[
                    [135, 66],
                    [176, 66],
                    [112, 96],
                    [155, 96],
                    [198, 96],
                    [136, 126],
                    [176, 126],
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
                  {/* Kích thước cỡ 10⁻¹⁰ m */}
                  <line x1="87" y1="178" x2="223" y2="178" stroke="#525252" strokeWidth="1.4" />
                  <line x1="87" y1="173" x2="87" y2="183" stroke="#525252" strokeWidth="1.4" />
                  <line x1="223" y1="173" x2="223" y2="183" stroke="#525252" strokeWidth="1.4" />
                  <text x="155" y="194" textAnchor="middle" fill="#161616" fontSize="12" fontWeight="700">
                    Đường kính nguyên tử ~ 10⁻¹⁰ m
                  </text>
                </svg>
                <figcaption style={{ fontSize: "12.5px", color: "#525252", marginTop: "6px" }}>
                  <strong>Hình 21.1:</strong> Mô hình nguyên tử Thomson — điện tích dương phân bố đều khắp thể tích hình cầu (<code>~10⁻¹⁰ m</code>), các electron (<code>e⁻</code>) nằm bên trong.
                </figcaption>
              </figure>

              <div>
                <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.6 }}>
                  Đầu thế kỉ XX, trước thí nghiệm của Rutherford, các nhà vật lí hình dung nguyên tử theo <strong>mô hình Thomson (Hình 21.1)</strong>: toàn bộ điện tích dương trải đều loãng trong khắp quả cầu nguyên tử cỡ <code>10⁻¹⁰ m</code>, xen kẽ các hạt electron <code>e⁻</code> rất nhẹ để nguyên tử trung hòa điện.
                </p>
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#edf5ff",
                    borderLeft: "4px solid #0f62fe",
                    fontSize: "14.5px",
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color: "#002d9c", display: "block", marginBottom: "4px" }}>
                    Câu hỏi mở đầu cần suy nghĩ:
                  </strong>
                  <em>
                    “Nếu điện tích dương trải rộng như vậy, em dự đoán đường đi của hạt alpha thay đổi ra sao?”
                  </em>
                </div>
              </div>
            </div>
          </section>

          {/* BƯỚC 2: Tư liệu quan sát Hình 21.2a (phối cảnh) – Hình 21.2b (mặt cắt chuẩn SGK) & Video bổ trợ */}
          <section
            aria-labelledby="b21-hinh-21-2-heading"
            style={{ marginBottom: "18px" }}
          >
            <h4 id="b21-hinh-21-2-heading" style={{ margin: "0 0 10px", fontSize: "16px" }}>
              Bước 2 · Quan sát thiết bị thí nghiệm tán xạ hạt alpha (Hình 21.2a &amp; Hình 21.2b · SGK tr. 91–92)
            </h4>

            <div
              style={{
                padding: "10px 14px",
                background: "#fcf4d6",
                border: "1px solid #f1c21b",
                borderLeft: "4px solid #8e6a00",
                marginBottom: "14px",
                fontSize: "14px",
                lineHeight: 1.55,
              }}
            >
              <strong>Chỉ dẫn quan sát trọng tâm:</strong>{" "}
              <em>
                “Hãy để ý vị trí đốm sáng trên màn S khi kính quan sát M chuyển từ vị trí (1) sang vị trí (2)”
              </em>
              .
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "14px",
                marginBottom: "14px",
              }}
            >
              {/* Hình 21.2a: Phối cảnh bộ thí nghiệm Rutherford V3 */}
              <figure className={styles.darkBenchStage} style={{ margin: 0 }}>
                <img
                  src="/illustrations/rutherford-v3-apparatus.png"
                  alt="Hình 21.2a phối cảnh bộ thí nghiệm tán xạ hạt alpha Rutherford V3: hộp chân không G đặt trên chân đế P, bên trong có nguồn phát hạt alpha R, lá vàng mỏng D ở tâm, màn huỳnh quang S và kính hiển vi M"
                  width={960}
                  height={480}
                  style={{
                    width: "100%",
                    height: "240px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <figcaption className={styles.darkBenchCaption}>
                  <strong>Hình 21.2a (Phối cảnh bộ thiết bị Rutherford V3):</strong> Bên trong hộp chân không <strong>G</strong> đặt trên chân đế <strong>P</strong> gồm nguồn phát hạt α <strong>R</strong>, lá vàng mỏng <strong>D</strong> (<Nuclide sym="Au" a={197} z={79} />, dày <code>4·10⁻⁷ m</code>), màn huỳnh quang <strong>S</strong> và kính hiển vi <strong>M</strong>.
                </figcaption>
              </figure>

              {/* Hình 21.2b: Sơ đồ mặt cắt chuẩn SGK */}
              <figure className={styles.darkBenchStage} style={{ margin: 0 }}>
                <svg
                  viewBox="0 0 440 240"
                  width="440"
                  height="240"
                  role="img"
                  aria-label="Hình 21.2b sơ đồ mặt cắt bộ thí nghiệm tán xạ hạt alpha SGK: nguồn R chiếu chùm hạt alpha tới lá vàng D đặt trong hộp chân không G trên chân đế P; màn phát quang S và kính hiển vi M xoay từ vị trí (1) đối diện nguồn sang vị trí (2) lệch trên 90 độ với tần suất đốm sáng ít hơn cỡ 10 mũ 4 lần"
                  style={{ width: "100%", height: "240px", display: "block", background: "#0b1220" }}
                >
                  {/* Chân đế P */}
                  <rect x="120" y="214" width="200" height="14" rx="2" fill="#475569" stroke="#94a3b8" strokeWidth="1.2" />
                  <rect x="206" y="196" width="28" height="18" fill="#64748b" />
                  <text x="104" y="225" fill="#e2e8f0" fontSize="13" fontWeight="700">
                    P
                  </text>

                  {/* Hộp chân không G */}
                  <circle
                    cx="220"
                    cy="108"
                    r="88"
                    fill="#121b2e"
                    stroke="#64748b"
                    strokeWidth="2.5"
                  />
                  <text x="142" y="42" fill="#cbd5e1" fontSize="13" fontWeight="700">
                    G (chân không)
                  </text>

                  {/* Vòng màn huỳnh quang S */}
                  <circle
                    cx="220"
                    cy="108"
                    r="72"
                    fill="none"
                    stroke="#42be65"
                    strokeWidth="3"
                    strokeDasharray="6 3"
                  />
                  <text x="242" y="50" fill="#86efac" fontSize="12.5" fontWeight="700">
                    S (màn ZnS)
                  </text>

                  {/* Nguồn hạt alpha R trong khối chì */}
                  <rect x="48" y="92" width="58" height="32" rx="3" fill="#334155" stroke="#cbd5e1" strokeWidth="1.5" />
                  <text x="64" y="113" fill="#ffffff" fontSize="13" fontWeight="700">
                    R (α)
                  </text>

                  {/* Chùm tia alpha tới lá vàng D */}
                  <line x1="106" y1="108" x2="216" y2="108" stroke="#facc15" strokeWidth="2.6" />
                  {/* Đa số đi thẳng tới vị trí (1) */}
                  <line x1="224" y1="108" x2="290" y2="108" stroke="#facc15" strokeWidth="2.8" />
                  <circle cx="292" cy="108" r="5.5" fill="#4ade80" />
                  {/* Tia lệch nhỏ */}
                  <line x1="222" y1="108" x2="286" y2="82" stroke="#facc15" strokeWidth="1.4" strokeDasharray="4 2" />
                  {/* Tia bật ngược góc > 90° về vị trí (2) */}
                  <line x1="218" y1="108" x2="164" y2="62" stroke="#fb7185" strokeWidth="1.8" strokeDasharray="4 3" />
                  <circle cx="164" cy="62" r="4.5" fill="#4ade80" />

                  {/* Lá vàng mỏng D tại tâm */}
                  <line x1="220" y1="84" x2="220" y2="132" stroke="#fbbf24" strokeWidth="4" />
                  <text x="202" y="148" fill="#fde047" fontSize="12" fontWeight="700">
                    D (4·10⁻⁷ m)
                  </text>

                  {/* Kính hiển vi M ở vị trí (1) đối diện nguồn */}
                  <rect x="296" y="98" width="44" height="20" rx="2" fill="#0f62fe" stroke="#93c5fd" strokeWidth="1.3" />
                  <text x="307" y="112" fill="#ffffff" fontSize="12" fontWeight="700">
                    M (1)
                  </text>
                  <text x="346" y="106" fill="#86efac" fontSize="11" fontWeight="700">
                    Đa số hạt α
                  </text>
                  <text x="346" y="120" fill="#cbd5e1" fontSize="10.5">
                    đốm sáng dày
                  </text>

                  {/* Kính hiển vi M xoay sang vị trí (2) lệch > 90° */}
                  <g transform="translate(152, 50) rotate(-138)">
                    <rect x="0" y="-9" width="38" height="18" rx="2" fill="#1e40af" stroke="#93c5fd" strokeWidth="1.3" strokeDasharray="3 2" />
                  </g>
                  <text x="58" y="34" fill="#fda4af" fontSize="11.5" fontWeight="700">
                    M ở vị trí (2) (&gt; 90°)
                  </text>
                  <text x="58" y="49" fill="#f8fafc" fontSize="11">
                    Ít hơn (1) cỡ 10⁴ lần
                  </text>
                </svg>
                <figcaption className={styles.darkBenchCaption}>
                  <strong>Hình 21.2b (Sơ đồ mặt cắt SGK):</strong> Nguồn <strong>R</strong> chiếu chùm hạt α vào lá vàng <strong>D</strong>. Khi kính hiển vi <strong>M</strong> chuyển từ <strong>vị trí (1)</strong> sang <strong>vị trí (2)</strong> (lệch <code>&gt; 90°</code>), trên màn <strong>S</strong> vẫn xuất hiện đốm sáng nhưng tần suất <strong>ít hơn tại (1) cỡ <code>10⁴</code> lần</strong>.
                </figcaption>
              </figure>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "12px",
                marginBottom: "14px",
              }}
            >
              <div style={{ border: "1px solid #a6c8ff", background: "#edf5ff", padding: "12px 14px" }}>
                <strong style={{ display: "block", color: "#002d9c", marginBottom: "4px" }}>
                  Lớp 1 · Dấu hiệu quan sát trực tiếp (Thực nghiệm)
                </strong>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                  Mắt đặt sau kính hiển vi <strong>M</strong> chỉ nhìn thấy <strong>các đốm sáng lóe lên trên màn huỳnh quang S</strong> mỗi khi một hạt α đập tới màn.
                </p>
              </div>
              <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
                <strong style={{ display: "block", color: "#161616", marginBottom: "4px" }}>
                  Lớp 2 · Đường quỹ đạo (Mô hình giải thích)
                </strong>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                  Ta <strong>không nhìn thấy đường bay của hạt α</strong>. Các tia vẽ trên sơ đồ là <em>mô hình quỹ đạo</em> dùng để suy luận điều gì đã xảy ra bên trong lá vàng <strong>D</strong>.
                </p>
              </div>
            </div>

            {/* Khối tư liệu video sẵn có hỗ trợ Pha 1 + thông báo phương án không phụ thuộc video */}
            {b21VideoLesson && (
              <div
                style={{
                  border: "1px solid #d0d7de",
                  background: "#f8fafc",
                  padding: "12px 14px",
                }}
              >
                <p style={{ margin: "0 0 8px", fontSize: "13.5px", lineHeight: 1.55 }}>
                  <strong>Tư liệu video bổ trợ Pha 1 (có thuyết minh &amp; phụ đề tiếng Việt):</strong>{" "}
                  Khi xem, hãy chú ý cách chùm hạt α đi từ nguồn <strong>R</strong> tới lá vàng <strong>D</strong> và sự chênh lệch số đốm sáng giữa vị trí <strong>(1)</strong> và vị trí <strong>(2)</strong>.{" "}
                  <span style={{ color: "#002d9c", fontWeight: 600 }}>
                    Nếu chưa xem video, học sinh vẫn hoàn thành trọn vẹn Pha 1 từ sơ đồ Hình 21.1–21.2 và dữ liệu thật ngay trên trang
                  </span>{" "}
                  (việc mở hay phát video không tự tính là hoàn thành bài).
                </p>
                <NuclearLessonVideo lesson={b21VideoLesson} />
              </div>
            )}
          </section>

          {/* BƯỚC 3: Lưu nguyên dự đoán ban đầu + lí do */}
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
              Bước 3 · Ghi và khóa dự đoán ban đầu kèm lí do
            </h4>
            <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#525252", lineHeight: 1.55 }}>
              Từ câu hỏi mở đầu ở Hình 21.1, hãy chọn dự đoán của riêng em và nêu rõ lí do. <strong>Dự đoán chốt lần đầu tiên sẽ được giữ nguyên (kể cả khi đoán chưa khớp kết quả thí nghiệm)</strong> để em mang vào Pha 2 đối chiếu khoa học trên lớp.
            </p>

            {lockedInitialPredictionLabel && (
              <div
                style={{
                  marginBottom: "12px",
                  padding: "10px 12px",
                  background: "#fcf4d6",
                  borderLeft: "4px solid #8e6a00",
                  fontSize: "13.5px",
                  lineHeight: 1.5,
                }}
              >
                <strong>Dự đoán ban đầu đã khóa để đối chiếu trên lớp:</strong> “{lockedInitialPredictionLabel}”
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
                Chọn phương án dự đoán của em:
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
              placeholder="Ví dụ: Nếu điện tích dương trải đều khắp nguyên tử như Hình 21.1 thì lực đẩy tĩnh điện ở mọi chỗ đều yếu nên hạt α sẽ…"
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
                  if (!predReason.trim()) {
                    setPredSavedMsg("Em hãy viết ngắn gọn lí do cho dự đoán của mình trước khi lưu.");
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
                      ? "Đã cập nhật ghi chú dự đoán (dự đoán chốt lần đầu vẫn được giữ nguyên để đối chiếu ở Pha 2)."
                      : "Đã khóa dự đoán ban đầu kèm lí do. Hãy hoàn thành tiếp Bước 4 và Bước 5 bên dưới để hoàn tất Pha 1!"
                  );
                }}
              >
                Lưu dự đoán trước giờ học
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

          {/* BƯỚC 4: Thao tác nhỏ có ý nghĩa — Nhận diện đúng vai trò 4 bộ phận cốt lõi R, D, S, M */}
          <section
            aria-labelledby="b21-pre-apparatus-heading"
            style={{
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "16px",
              marginBottom: "18px",
            }}
          >
            <h4 id="b21-pre-apparatus-heading" style={{ margin: "0 0 6px", fontSize: "16px" }}>
              Bước 4 · Thao tác nhận diện vai trò 4 bộ phận cốt lõi trên Hình 21.2 ({matchedApparatusCount}/4 đúng)
            </h4>
            <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#525252", lineHeight: 1.55 }}>
              Đối chiếu Hình 21.2a–21.2b để ghép đúng chức năng của từng bộ phận trước khi bước vào bàn thí nghiệm trên lớp:
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
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
                          ? "1px solid #198038"
                          : "1px solid #da1e28"
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
                          ? `✓ Đúng vai trò của kí hiệu ${part.code}.`
                          : `Chưa khớp: hãy tìm lại kí hiệu ${part.code} trên Hình 21.2b.`}
                      </small>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* BƯỚC 5: Câu tự kiểm tra có phản hồi giải thích vì sao */}
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
              Bước 5 · Câu tự kiểm tra trước giờ học
            </h4>
            <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
              <legend style={{ fontWeight: 700, fontSize: "14px", marginBottom: "10px", lineHeight: 1.5 }}>
                Dựa vào Hình 21.2b, điều gì được người làm thí nghiệm quan sát trực tiếp khi chuyển kính hiển vi M từ vị trí (1) sang vị trí (2)?
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
                  marginTop: "12px",
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
          </section>

          {/* BƯỚC 6: Thẻ tóm tắt “Sản phẩm mang vào lớp” & Câu hỏi muốn kiểm chứng */}
          <section
            aria-labelledby="b21-bring-to-class-heading"
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
                Sản phẩm mang vào lớp (Liên thông sang Pha 2 &amp; Pha 3)
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
                  ? "✓ Đã đủ điều kiện hoàn thành Pha 1"
                  : "Cần đủ: Dự đoán + lí do, 4/4 bộ phận Hình 21.2 và câu tự kiểm tra"}
              </span>
            </div>

            <ul style={{ margin: "0 0 12px", paddingLeft: "18px", fontSize: "14px", lineHeight: 1.6 }}>
              <li>
                <strong>1. Dự đoán ban đầu đã khóa:</strong>{" "}
                {lockedInitialPredictionLabel ? (
                  <>
                    “{lockedInitialPredictionLabel}”
                    {lockedInitialReason ? (
                      <span> (Lí do: {lockedInitialReason})</span>
                    ) : (
                      <span style={{ color: "#b42332" }}> — Chưa ghi lí do</span>
                    )}
                  </>
                ) : (
                  <span style={{ color: "#b42332" }}>Chưa lưu dự đoán ở Bước 3.</span>
                )}
              </li>
              <li>
                <strong>2. Nhận diện 4 bộ phận Hình 21.2 (R, D, S, M):</strong>{" "}
                {allApparatusMatched ? (
                  <span style={{ color: "#198038", fontWeight: 600 }}>
                    Đã ghép đúng 4/4 bộ phận (Nguồn α R, Lá vàng D, Màn huỳnh quang S, Kính hiển vi M).
                  </span>
                ) : (
                  <span>Đã ghép đúng {matchedApparatusCount}/4 bộ phận.</span>
                )}
              </li>
              <li>
                <strong>3. Câu tự kiểm tra Pha 1:</strong>{" "}
                {preSelfCheckChoice === "flashes_ratio" ? (
                  <span style={{ color: "#198038", fontWeight: 600 }}>
                    Đã phân biệt đúng đốm sáng trên màn S và tỉ lệ 10⁴ lần giữa vị trí (1) và (2).
                  </span>
                ) : (
                  <span>Chưa trả lời đúng ở Bước 5.</span>
                )}
              </li>
            </ul>

            <label
              htmlFor="b21-bring-question"
              style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
            >
              4. Câu hỏi hoặc điều em muốn kiểm chứng trên bàn thí nghiệm Rutherford V3 ở lớp:
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
              placeholder="Ví dụ: Hạt α phải đi gần tâm nguyên tử vàng tới mức nào (tham số va chạm b bao nhiêu fm) thì bị bật ngược > 90°?"
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

            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              <button
                type="button"
                className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                onClick={() => onJumpToSection("b21-rutherford-v3")}
              >
                Mở ngay Rutherford V3 (Trong giờ học) →
              </button>
              <small style={{ color: "#525252", fontSize: "12.5px" }}>
                Toàn bộ sản phẩm trên được lưu trực tiếp trên trình duyệt của em và tự động hiển thị lại ở Pha 2 &amp; Pha 3.
              </small>
            </div>
          </section>
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — 2. PHA 2 (TRONG GIỜ HỌC): THÍ NGHIỆM TÁN XẠ HẠT ALPHA (RUTHERFORD V3)
          ==================================================================== */}
      {section.kind === "b21_rutherford_v3" && (
        <div>
          <div className={styles.predictionEchoBox}>
            {lockedInitialPredictionLabel ? (
              <div>
                <div style={{ marginBottom: "6px" }}>
                  <strong>Sản phẩm Pha 1 đã lưu · Dự đoán ban đầu (khóa đối chiếu):</strong>{" "}
                  “{lockedInitialPredictionLabel}”
                  {lockedInitialReason ? (
                    <span>
                      {" "}
                      — <em>Lí do ban đầu: {lockedInitialReason}</em>
                    </span>
                  ) : null}
                </div>
                {currentPredictionLabel &&
                  notebook.preClassPredictionChoice !== lockedInitialChoiceId && (
                    <div style={{ marginBottom: "6px", fontSize: "13px", color: "#525252" }}>
                      <em>Dự đoán cập nhật gần nhất:</em> “{currentPredictionLabel}”
                    </div>
                  )}
                <div style={{ fontSize: "13.5px", color: "#161616", marginBottom: "6px" }}>
                  <strong>Bộ phận Hình 21.2 đã nhận diện:</strong> {matchedApparatusCount}/4 đúng
                  {bringToClassQuestion.trim() ? (
                    <span>
                      {" "}
                      · <strong>Câu hỏi mang vào lớp:</strong> “{bringToClassQuestion.trim()}”
                    </span>
                  ) : null}
                </div>
                <div style={{ color: "#525252", fontSize: "13.5px" }}>
                  Hãy dùng bàn thí nghiệm Rutherford V3 bên dưới, lưu{" "}
                  <strong>hai lượt đo cùng động năng E nhưng khác tham số va chạm b</strong> để kiểm chứng trực tiếp dự đoán ban đầu của em (kể cả khi dự đoán ban đầu chưa khớp thực nghiệm).
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <span>
                  <strong>Đối chiếu sản phẩm Pha 1:</strong> Em chưa khóa dự đoán ban đầu ở mục Trước giờ học. Em có thể mở lại Pha 1 để lưu dự đoán + nhận diện bộ phận R, D, S, M hoặc đo trực tiếp bên dưới.
                </span>
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnSmall}`}
                  onClick={() => onJumpToSection("b21-pre-setup")}
                >
                  Quay lại Pha 1 (Trước giờ học)
                </button>
              </div>
            )}
          </div>

          <div
            style={{
              padding: "10px 14px",
              background: "#f8fafc",
              border: "1px solid #d0d7de",
              marginBottom: "14px",
              fontSize: "13.5px",
              lineHeight: 1.55,
            }}
          >
            <strong>Tách rõ 2 lớp hiển thị trên bàn thí nghiệm:</strong>{" "}
            (1) <strong>Lớp đốm sáng xanh lá trên vòng màn huỳnh quang S</strong> là{" "}
            <em>dữ kiện thực nghiệm quan sát được qua kính hiển vi M</em>;{" "}
            (2) <strong>Lớp đường tia màu lam quanh tâm</strong> là{" "}
            <em>quỹ đạo mô hình tĩnh điện</em> giúp giải thích vì sao góc tán xạ <code>θ</code> tăng vọt khi hạt α đi sát tâm hạt nhân.
          </div>

          <FixedPhysicsActivityRenderer
            activityKey="rutherford_alpha_scattering"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />

          {/* Đối chiếu 3 câu hỏi thảo luận SGK tr. 92 */}
          <div
            style={{
              marginTop: "16px",
              border: "1px solid #d0d7de",
              background: "#ffffff",
              padding: "14px 16px",
            }}
          >
            <h4 style={{ margin: "0 0 10px", fontSize: "15.5px" }}>
              Đối chiếu 3 câu hỏi thảo luận hiện tượng tán xạ hạt α (SGK tr. 92)
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
                  1. Tại vị trí (1) đối diện nguồn R
                </strong>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                  Hầu hết hạt α xuyên thẳng qua lá vàng <strong>D</strong> tới vị trí <strong>(1)</strong> chứng tỏ nguyên tử <strong>không đặc khít</strong> mà phần lớn thể tích là <strong>khoảng trống</strong>.
                </p>
              </div>
              <div style={{ border: "1px solid #e0e0e0", background: "#f8fafc", padding: "12px" }}>
                <strong style={{ display: "block", fontSize: "13.5px", color: "#002d9c", marginBottom: "4px" }}>
                  2. Tương tác làm lệch hướng hạt α
                </strong>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                  Hạt α mang điện dương (<code>+2e</code>) bị đẩy lệch hướng bởi <strong>lực đẩy tĩnh điện (Coulomb)</strong> rất mạnh khi bay gần phần tích điện dương của nguyên tử vàng (electron quá nhẹ nên không làm lệch đáng kể hạt α).
                </p>
              </div>
              <div style={{ border: "1px solid #e0e0e0", background: "#f8fafc", padding: "12px" }}>
                <strong style={{ display: "block", fontSize: "13.5px", color: "#002d9c", marginBottom: "4px" }}>
                  3. Tỉ lệ cỡ 10⁻⁴ ở vị trí (2) (&gt; 90°)
                </strong>
                <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                  Chỉ khoảng <strong>1 trong 10⁴ hạt α</strong> bật ngược về vị trí <strong>(2)</strong> chứng tỏ toàn bộ điện tích dương và gần như toàn bộ khối lượng nguyên tử tập trung tại <strong>hạt nhân rất nhỏ ở tâm</strong> (đường kính cỡ <code>10⁻⁴</code> lần nguyên tử).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — 3. PHA 2 (TRONG GIỜ HỌC): SO SÁNH CÁC MÔ HÌNH NGUYÊN TỬ
          ==================================================================== */}
      {section.kind === "b21_atomic_models" && (
        <div>
          <AtomicModelsComparisonSim
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
            onOpenRutherfordV3={() => onJumpToSection("b21-rutherford-v3")}
          />

          {/* Chú thích đối chiếu trực tiếp Hình 21.1, Hình 21.5a và Hình 21.5b SGK */}
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
                Hình 21.1 · Mô hình nguyên tử Thomson
              </strong>
              <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                Điện tích dương phân bố đều khắp thể tích nguyên tử (<code>~10⁻¹⁰ m</code>), các electron nằm rải rác bên trong — <em>bị bác bỏ</em> bởi hiện tượng hạt α tán xạ góc lớn.
              </p>
            </div>
            <div style={{ border: "1px solid #a6c8ff", background: "#edf5ff", padding: "12px 14px" }}>
              <strong style={{ display: "block", fontSize: "14px", color: "#002d9c", marginBottom: "4px" }}>
                Hình 21.5a · Mô hình hành tinh nguyên tử (Rutherford)
              </strong>
              <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                Gồm 3 thành phần chú thích chuẩn SGK tr. 93: <strong>Hạt nhân</strong> mang điện dương rất nhỏ ở tâm, các electron chuyển động trên <strong>Quỹ đạo của electron</strong> và phần lớn thể tích giữa chúng là <strong>Khoảng trống</strong>.
              </p>
            </div>
            <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
              <strong style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
                Hình 21.5b · Mô hình hiện đại (Đám mây electron)
              </strong>
              <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                Giữ nguyên <strong>Hạt nhân</strong> rất nhỏ ở tâm, nhưng electron chuyển động rất nhanh tạo thành <strong>Đám mây electron</strong> (vùng không gian có xác suất tìm thấy electron, không theo quỹ đạo tròn cố định).
              </p>
            </div>
          </div>

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
                    <th scope="col" style={{ minWidth: "190px" }}>1. Hình 21.1 (Thomson)</th>
                    <th scope="col" style={{ minWidth: "200px" }}>2. Hình 21.5a (Hành tinh Rutherford)</th>
                    <th scope="col" style={{ minWidth: "200px" }}>3. Hình 21.5b (Đám mây electron)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Điện tích dương ở đâu?</th>
                    <td>Phân bố trong toàn bộ thể tích hình cầu nguyên tử cỡ <code>10⁻¹⁰ m</code>.</td>
                    <td>Tập trung tại <strong>Hạt nhân</strong> rất nhỏ ở tâm cỡ <code>10⁻¹⁴ – 10⁻¹⁵ m</code>.</td>
                    <td>Tập trung tại <strong>Hạt nhân</strong> rất nhỏ ở tâm.</td>
                  </tr>
                  <tr>
                    <th scope="row">Electron &amp; không gian nguyên tử?</th>
                    <td>Nằm bên trong vùng tích điện dương.</td>
                    <td>Chuyển động trên <strong>Quỹ đạo của electron</strong> quanh tâm; phần còn lại là <strong>Khoảng trống</strong>.</td>
                    <td>Biểu diễn bằng <strong>Đám mây electron</strong>; mật độ chấm đo vị trí tỉ lệ với xác suất tìm thấy electron.</td>
                  </tr>
                  <tr>
                    <th scope="row">Liên hệ với thí nghiệm lá vàng?</th>
                    <td>Không giải thích được các hạt α lệch góc lớn hoặc bật ngược.</td>
                    <td><strong>Được chứng minh trực tiếp</strong> về sự tập trung điện tích dương ở hạt nhân nhỏ.</td>
                    <td>Kế thừa hạt nhân nhỏ của Rutherford; phần đám mây xác suất dựa trên cơ học lượng tử.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — 4. PHA 2 (TRONG GIỜ HỌC): CẤU TẠO VÀ KÍCH THƯỚC HẠT NHÂN
          ==================================================================== */}
      {section.kind === "b21_structure_size" && (
        <div>
          {/* 1. Hạt nhân mẫu Silic-28 & Hằng số khối lượng SGK tr. 93 */}
          <div
            style={{
              border: "1px solid #d0d7de",
              background: "#f8fafc",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
              1. Cấu tạo hạt nhân qua nguyên tử Silic-28 (<Nuclide sym="Si" a={28} z={14} />) &amp; đơn vị khối lượng nguyên tử (SGK tr. 93)
            </h4>
            <p style={{ margin: "0 0 12px", fontSize: "14px", lineHeight: 1.55 }}>
              Hạt nhân được tạo thành bởi hai loại hạt là <strong>proton (p)</strong> mang điện tích <code>+1e</code> và <strong>neutron (n)</strong> trung hòa điện; hai loại hạt này có khối lượng xấp xỉ bằng nhau và gọi chung là <strong>nucleon</strong>. Với nguyên tử Silic-28 (<Nuclide sym="Si" a={28} z={14} />):
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "10px",
                fontVariantNumeric: "tabular-nums",
                marginBottom: "12px",
              }}
            >
              <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", padding: "10px 12px" }}>
                <span style={{ fontSize: "12px", color: "#525252", display: "block" }}>
                  Điện tích hạt nhân / Số proton (Z)
                </span>
                <strong style={{ fontSize: "18px", color: "#0f62fe" }}>14 proton (+14e)</strong>
              </div>
              <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", padding: "10px 12px" }}>
                <span style={{ fontSize: "12px", color: "#525252", display: "block" }}>
                  Số neutron (N = A − Z)
                </span>
                <strong style={{ fontSize: "18px", color: "#198038" }}>14 neutron</strong>
              </div>
              <div style={{ background: "#ffffff", border: "1px solid #e0e0e0", padding: "10px 12px" }}>
                <span style={{ fontSize: "12px", color: "#525252", display: "block" }}>
                  Tổng số nucleon (Số khối A)
                </span>
                <strong style={{ fontSize: "18px", color: "#161616" }}>A = 14 + 14 = 28</strong>
              </div>
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
              <div>
                <strong>Khối lượng proton:</strong>{" "}
                <code>m_p ≈ {SGK_B21_MASS_CONSTANTS.protonKg}</code> (≈ 1,00728 amu)
              </div>
              <div>
                <strong>Khối lượng neutron:</strong>{" "}
                <code>m_n ≈ {SGK_B21_MASS_CONSTANTS.neutronKg}</code> (≈ 1,00866 amu)
              </div>
              <div>
                <strong>Đơn vị khối lượng nguyên tử:</strong>{" "}
                <code>1 amu ≈ {SGK_B21_MASS_CONSTANTS.amuKg}</code> (1/12 khối lượng nguyên tử ¹²₆C)
              </div>
            </div>
          </div>

          {/* Cảnh báo rõ ràng khi đổi tỉ lệ phóng đại giữa nguyên tử và hạt nhân */}
          <div className={styles.scaleWarningBox}>
            <strong>Chú thích bắt buộc khi đổi tỉ lệ phóng đại (SGK tr. 93–94):</strong>{" "}
            Với Silicon (<Nuclide sym="Si" a={28} z={14} />), bán kính nguyên tử là{" "}
            <code>2,1 × 10⁻¹⁰ m</code> còn bán kính hạt nhân chỉ là{" "}
            <code>3,1 × 10⁻¹⁵ m</code> (nhỏ hơn khoảng <strong>67 700 lần</strong>). Vì vậy mọi sơ đồ vẽ cả nguyên tử lẫn các hạt proton, neutron bên trong hạt nhân đều phải{" "}
            <strong>đổi sang tỉ lệ phóng đại lớn hơn hàng chục nghìn lần cho riêng vùng hạt nhân</strong>; nếu giữ nguyên một tỉ lệ mà nguyên tử rộng <code>10 m</code> thì hạt nhân ở tâm chỉ nhỏ cỡ <code>0,15 mm</code>.
          </div>

          {/* Bảng 21.1 chính xác 100% SGK tr. 94 (đủ 8 nguyên tố) */}
          <div className={styles.tableScroll}>
            <table className={styles.cdsTable}>
              <caption>
                Bảng 21.1 — Bán kính nguyên tử và bán kính hạt nhân của một số nguyên tố (SGK Vật lí 12, tr. 94)
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nguyên tố</th>
                  <th scope="col">Kí hiệu hạt nhân</th>
                  <th scope="col" className={styles.numCell}>Số khối A</th>
                  <th scope="col" className={styles.numCell}>Bán kính nguyên tử (10⁻¹⁰ m)</th>
                  <th scope="col" className={styles.numCell}>Bán kính hạt nhân (10⁻¹⁵ m)</th>
                  <th scope="col" className={styles.numCell}>
                    Kiểm chứng R = 1,2·10⁻¹⁵·A¹/³ (10⁻¹⁵ m)
                  </th>
                </tr>
              </thead>
              <tbody>
                {SGK_TABLE_21_1.map((row) => (
                  <tr
                    key={row.symbol}
                    style={
                      row.symbol === "Si"
                        ? { background: "#fcf4d6", fontWeight: 600 }
                        : undefined
                    }
                  >
                    <th scope="row">{row.elementName}</th>
                    <td>
                      <Nuclide sym={row.symbol} a={row.massNumberA} z={row.z} />
                    </td>
                    <td className={styles.numCell}>{row.massNumberA}</td>
                    <td className={styles.numCell}>{row.atomicRadius10m10}</td>
                    <td className={styles.numCell}>{row.nuclearRadius10m15}</td>
                    <td className={styles.numCell}>{row.formulaRadius10m15}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <LatexMath
              block
              math={String.raw`R = 1{,}2 \times 10^{-15}\,A^{1/3}\;(\mathrm{m}), \qquad 1\,\mathrm{fm} = 10^{-15}\,\mathrm{m}`}
            />
          </div>

          {/* Nhiệm vụ nhỏ có lưu localStorage: đọc 1 dòng Bảng 21.1 (Silicon A=28) & giải thích tỉ lệ phóng đại */}
          {(() => {
            const structWork = notebook.structureSizeWork ?? {};
            const atomicInput = structWork.atomicRadiusInput ?? "";
            const nuclearInput = structWork.nuclearRadiusInput ?? "";
            const scaleExp = structWork.scaleExplanation ?? "";
            const isChecked = Boolean(structWork.checked) || structCheckedLocal;
            const norm = (s: string) => s.trim().replace(",", ".");
            const atomicOk = Number(norm(atomicInput)) === 2.1;
            const nuclearOk = Number(norm(nuclearInput)) === 3.1;
            const expOk = scaleExp.trim().length >= 10;
            const allStructOk = atomicOk && nuclearOk && expOk;

            return (
              <div
                style={{
                  border: "1px solid #8d8d8d",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "20px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "15.5px" }}>
                  2. Nhiệm vụ đọc Bảng 21.1 &amp; giải thích tỉ lệ phóng đại (tự động lưu vào sổ học tập)
                </h4>
                <p style={{ margin: "0 0 12px", fontSize: "13.5px", color: "#525252", lineHeight: 1.55 }}>
                  Tra dòng <strong>Silicon (A = 28)</strong> trên Bảng 21.1 (chú ý đơn vị lũy thừa ở tiêu đề cột) và giải thích vì sao sách giáo khoa phải phóng lớn hạt nhân trên hình minh họa:
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                    Bán kính nguyên tử Silicon (nhân với <code>10⁻¹⁰ m</code>):
                    <input
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
                            selectedElement: "Si",
                            atomicRadiusInput: val,
                            checked: false,
                          },
                        }));
                      }}
                      placeholder="Ví dụ: 2,1"
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: "6px",
                        minHeight: "40px",
                        padding: "6px 10px",
                        border: "1px solid #8d8d8d",
                        fontSize: "14px",
                      }}
                    />
                  </label>
                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                    Bán kính hạt nhân Silicon (nhân với <code>10⁻¹⁵ m</code>):
                    <input
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
                            selectedElement: "Si",
                            nuclearRadiusInput: val,
                            checked: false,
                          },
                        }));
                      }}
                      placeholder="Ví dụ: 3,1"
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: "6px",
                        minHeight: "40px",
                        padding: "6px 10px",
                        border: "1px solid #8d8d8d",
                        fontSize: "14px",
                      }}
                    />
                  </label>
                </div>

                <label
                  htmlFor="b21-scale-explanation"
                  style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
                >
                  Giải thích ngắn gọn vì sao trên hình minh họa nguyên tử phải phóng lớn hạt nhân:
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
                        selectedElement: "Si",
                        scaleExplanation: val,
                        checked: false,
                      },
                    }));
                  }}
                  placeholder="Ví dụ: Vì bán kính hạt nhân (cỡ 10⁻¹⁵ m) nhỏ hơn nguyên tử (cỡ 10⁻¹⁰ m) hàng chục nghìn lần nên nếu vẽ đúng tỉ lệ thực sẽ không nhìn thấy hạt nhân…"
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
                          selectedElement: "Si",
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
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 600,
                        color: allStructOk ? "#198038" : "#b42332",
                      }}
                    >
                      {allStructOk
                        ? "✓ Chính xác! Nguyên tử Silicon có bán kính 2,1·10⁻¹⁰ m, lớn gấp khoảng 68 000 lần hạt nhân (3,1·10⁻¹⁵ m) nên hình vẽ bắt buộc phải phóng lớn vùng hạt nhân."
                        : "Kiểm tra lại dòng Silicon (A = 28) trên Bảng 21.1 (2,1 × 10⁻¹⁰ m và 3,1 × 10⁻¹⁵ m) và ghi ít nhất một câu giải thích tỉ lệ phóng đại."}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

          <h4 style={{ margin: "20px 0 10px", fontSize: "16px" }}>
            3. Thực hành dựng hạt nhân mẫu và kiểm tra Z, N, A
          </h4>
          <FixedPhysicsActivityRenderer
            activityKey="nuclear_structure_builder"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {/* ====================================================================
          BÀI 21 — 5. PHA 2 (TRONG GIỜ HỌC): KÍ HIỆU HẠT NHÂN VÀ ĐỒNG VỊ
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
            {/* Hiển thị chỉ số A, Z to rõ trên điện thoại 390px + kí hiệu rút gọn ᴬX */}
            <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "14px 16px" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "15.5px" }}>
                Quy tắc đọc kí hiệu hạt nhân chuẩn và kí hiệu rút gọn (SGK tr. 94)
              </h4>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-around",
                  gap: "12px",
                  flexWrap: "wrap",
                  padding: "12px",
                  marginBottom: "10px",
                  background: "#ffffff",
                  border: "1px solid #a6c8ff",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "30px", color: "#002d9c", lineHeight: 1.2 }}>
                    <Nuclide sym="X" a="A" z="Z" />
                  </div>
                  <small style={{ color: "#525252", fontWeight: 600 }}>Kí hiệu đầy đủ</small>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "28px", color: "#161616", fontWeight: 700, lineHeight: 1.2 }}>
                    <sup style={{ fontSize: "0.68em", marginRight: "1px" }}>A</sup>X
                  </div>
                  <small style={{ color: "#525252", fontWeight: 600 }}>
                    Rút gọn (ví dụ <sup>12</sup>C, <sup>197</sup>Au)
                  </small>
                </div>
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "14px", lineHeight: 1.6 }}>
                <li>
                  <strong>X</strong>: Kí hiệu hóa học của nguyên tố (ví dụ{" "}
                  <Nuclide sym="Si" a={28} z={14} />, <Nuclide sym="Au" a={197} z={79} />).
                </li>
                <li>
                  <strong>Chỉ số trên A (số khối)</strong>: Tổng số nucleon (<code>A = Z + N</code>).
                </li>
                <li>
                  <strong>Chỉ số dưới Z (số hiệu nguyên tử)</strong>: Số proton trong hạt nhân (điện tích <code>+Ze</code>).
                </li>
                <li>
                  <strong>Số neutron</strong>: <code>N = A − Z</code>. Vì tên nguyên tố <strong>X</strong> đã xác định duy nhất <strong>Z</strong> trong bảng tuần hoàn nên SGK cũng dùng <strong>kí hiệu rút gọn <sup>A</sup>X</strong> (như <code>¹²C</code>, <code>²³⁵U</code>).
                </li>
              </ul>
            </div>

            <div style={{ border: "1px solid #a6c8ff", background: "#edf5ff", padding: "14px 16px" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "15.5px", color: "#002d9c" }}>
                Khái niệm đồng vị &amp; tính chất vật lí (SGK tr. 94–95)
              </h4>
              <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.6 }}>
                Các <strong>đồng vị</strong> là những hạt nhân có <strong>cùng số proton Z</strong> nhưng{" "}
                <strong>khác số neutron N</strong> (do đó <strong>khác số khối A</strong>).
              </p>
              <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6 }}>
                Do có cùng số proton <code>Z</code> (cùng cấu hình vỏ electron) nên các đồng vị có{" "}
                <strong>tính chất hóa học tương tự nhau</strong>, nhưng vì khối lượng hạt nhân khác nhau nên có{" "}
                <strong>tính chất vật lí khác nhau</strong> (như khối lượng riêng, nhiệt độ nóng chảy, tính phóng xạ).
              </p>
            </div>
          </div>

          <div className={styles.tableScroll}>
            <table className={styles.cdsTable}>
              <caption>
                Bảng đối chiếu ba đồng vị của nguyên tố Hydrogen (SGK Vật lí 12, tr. 95)
              </caption>
              <thead>
                <tr>
                  <th scope="col">Tên gọi theo SGK tr. 95</th>
                  <th scope="col">Kí hiệu hạt nhân</th>
                  <th scope="col" className={styles.numCell}>Số proton Z</th>
                  <th scope="col" className={styles.numCell}>Số khối A</th>
                  <th scope="col" className={styles.numCell}>Số neutron N = A − Z</th>
                  <th scope="col">Đặc điểm vật lí &amp; ứng dụng</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Hydrogen thường (Protium)</th>
                  <td style={{ fontSize: "16px" }}>
                    <Nuclide sym="H" a={1} z={1} />
                  </td>
                  <td className={styles.numCell}>1</td>
                  <td className={styles.numCell}>1</td>
                  <td className={styles.numCell}>0</td>
                  <td>Đồng vị bền, chiếm ~99,985% Hydrogen tự nhiên; hạt nhân chỉ gồm 1 proton.</td>
                </tr>
                <tr>
                  <th scope="row">Hydrogen nặng (deuterium)</th>
                  <td style={{ fontSize: "16px" }}>
                    <Nuclide sym="H" a={2} z={1} /> (hay <Nuclide sym="D" a={2} z={1} />)
                  </td>
                  <td className={styles.numCell}>1</td>
                  <td className={styles.numCell}>2</td>
                  <td className={styles.numCell}>1</td>
                  <td>Đồng vị bền (~0,015%); tạo phân tử nước nặng D₂O có khối lượng riêng lớn hơn nước thường H₂O (~1,11 g/cm³).</td>
                </tr>
                <tr>
                  <th scope="row">Hydrogen siêu nặng (tritium)</th>
                  <td style={{ fontSize: "16px" }}>
                    <Nuclide sym="H" a={3} z={1} /> (hay <Nuclide sym="T" a={3} z={1} />)
                  </td>
                  <td className={styles.numCell}>1</td>
                  <td className={styles.numCell}>3</td>
                  <td className={styles.numCell}>2</td>
                  <td>Đồng vị phóng xạ (chu kì bán rã ~12,3 năm); nhiên liệu quan trọng cho phản ứng tổng hợp hạt nhân.</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bài tập nhanh tìm N = A - Z và câu hỏi khối lượng riêng đồng vị (lưu localStorage) */}
          {(() => {
            const isoWork = notebook.symbolIsotopeWork ?? {};
            const nInput = isoWork.targetNeutronInput ?? "";
            const densityChoice = isoWork.densityChoice ?? "";
            const isoChecked = Boolean(isoWork.checked) || isoCheckedLocal;
            const nOk = Number(nInput.trim()) === 118;
            const densityOk = densityChoice === "heavier_nucleus";
            const allIsoQuickOk = nOk && densityOk;

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
                  Bài tập nhanh: Tính số neutron N = A − Z &amp; giải thích khối lượng riêng đồng vị
                </h4>
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "12px" }}>
                  1. Hạt nhân vàng trong lá vàng Rutherford có kí hiệu{" "}
                  <span style={{ fontSize: "17px" }}>
                    <Nuclide sym="Au" a={197} z={79} />
                  </span>{" "}
                  (hoặc viết rút gọn <code>¹⁹⁷Au</code> với <code>Z = 79</code>). Số neutron <code>N = A − Z</code> của hạt nhân này bằng bao nhiêu?
                  <input
                    type="number"
                    inputMode="numeric"
                    value={nInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setIsoCheckedLocal(false);
                      patchNotebook((cur) => ({
                        ...cur,
                        symbolIsotopeWork: {
                          ...cur.symbolIsotopeWork,
                          targetNeutronInput: val,
                          checked: false,
                        },
                      }));
                    }}
                    placeholder="Nhập N = 197 − 79…"
                    style={{
                      display: "block",
                      width: "100%",
                      maxWidth: "280px",
                      marginTop: "6px",
                      minHeight: "40px",
                      padding: "6px 10px",
                      border: "1px solid #8d8d8d",
                      fontSize: "14.5px",
                    }}
                  />
                </label>

                <fieldset style={{ border: "none", margin: "0 0 12px", padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
                    2. Ở cùng điều kiện nhiệt độ và áp suất, vì sao khí deuterium (²₁H₂) hoặc nước nặng (D₂O) có khối lượng riêng lớn hơn khí hydrogen thường (¹₁H₂) hoặc nước thường (H₂O)?
                  </legend>
                  {[
                    [
                      "heavier_nucleus",
                      "Vì hai đồng vị có cùng Z = 1 nên kích thước nguyên tử/phân tử xấp xỉ như nhau, nhưng hạt nhân ²₁H có thêm 1 neutron nên khối lượng nguyên tử lớn gấp khoảng 2 lần ¹₁H.",
                    ],
                    [
                      "more_protons",
                      "Vì hạt nhân ²₁H có nhiều proton hơn nên hút vỏ electron co nhỏ lại một nửa.",
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
                        name="b21-iso-density"
                        checked={densityChoice === val}
                        onChange={() => {
                          setIsoCheckedLocal(false);
                          patchNotebook((cur) => ({
                            ...cur,
                            symbolIsotopeWork: {
                              ...cur.symbolIsotopeWork,
                              densityChoice: val,
                              checked: false,
                            },
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
                        symbolIsotopeWork: {
                          ...cur.symbolIsotopeWork,
                          checked: true,
                        },
                      }));
                      if (allIsoQuickOk) {
                        onMarkSectionComplete(section.id, true);
                      }
                    }}
                  >
                    Kiểm tra bài tập nhanh
                  </button>
                  {isoChecked && (
                    <span
                      role="status"
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 600,
                        color: allIsoQuickOk ? "#198038" : "#b42332",
                      }}
                    >
                      {allIsoQuickOk
                        ? "✓ Chính xác! ¹⁹⁷₇₉Au có N = 197 − 79 = 118 neutron, và sự chênh lệch số neutron làm khối lượng riêng của các đồng vị khác nhau."
                        : "Kiểm tra lại phép trừ N = 197 − 79 và nhớ rằng các đồng vị có cùng số proton Z = 1 nhưng khác số neutron."}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}

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
          BÀI 21 — 6. PHA 3 (SAU GIỜ HỌC): KIỂM TRA, ĐÁNH GIÁ (²⁷₁₃Al & ĐỐI CHIẾU PHA 1)
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

          const parsedR = Number(alRadiusFm.trim().replace(",", "."));
          const rOk = Number.isFinite(parsedR) && Math.abs(parsedR - 3.6) <= 0.05;
          const zOk = Number(alZ.trim()) === 13;
          const nOk = Number(alN.trim()) === 14;
          const choiceOk = alChoice === "smaller";
          const reflectionOk = predictionReflection.trim().length >= 8;
          const allAfterOk = zOk && nOk && rOk && choiceOk && reflectionOk;

          return (
            <div style={{ border: "1px solid #d0d7de", padding: "18px", background: "#ffffff" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "16.5px" }}>
                Tình huống vận dụng sau giờ học: Tán xạ hạt α trên lá nhôm mỏng{" "}
                <Nuclide sym="Al" a={27} z={13} /> &amp; đối chiếu dự đoán Pha 1
              </h4>
              <p style={{ margin: "0 0 14px", fontSize: "14.5px", lineHeight: 1.6 }}>
                Một nhóm học sinh giữ nguyên nguồn phát hạt α (<code>E = 6 MeV</code>) nhưng thay lá vàng mỏng{" "}
                <Nuclide sym="Au" a={197} z={79} /> bằng lá nhôm mỏng{" "}
                <Nuclide sym="Al" a={27} z={13} /> có cùng mật độ diện tích nguyên tử.
              </p>

              {/* Hiển thị lại dự đoán ban đầu đã khóa ở Pha 1 để học sinh phản tư */}
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
                <strong>Dự đoán ban đầu của em ở Pha 1:</strong>{" "}
                {lockedInitialPredictionLabel ? (
                  <>
                    “{lockedInitialPredictionLabel}”
                    {lockedInitialReason ? <span> (Lí do: {lockedInitialReason})</span> : null}
                  </>
                ) : (
                  <span>Chưa lưu dự đoán ở Pha 1 — hãy nêu nhận xét của em sau khi học xong bài bên dưới.</span>
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
                    value={alZ}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAlCheckedLocal(false);
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: {
                          ...cur.afterClassWork,
                          alZ: val,
                          checked: false,
                        },
                      }));
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
                      const val = e.target.value;
                      setAlCheckedLocal(false);
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: {
                          ...cur.afterClassWork,
                          alN: val,
                          checked: false,
                        },
                      }));
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
                <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                  3. Bán kính gần đúng R của <Nuclide sym="Al" a={27} z={13} /> (đơn vị <code>10⁻¹⁵ m</code> hay <code>fm</code>):
                  <input
                    type="text"
                    inputMode="decimal"
                    value={alRadiusFm}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAlCheckedLocal(false);
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: {
                          ...cur.afterClassWork,
                          alRadiusFm: val,
                          checked: false,
                        },
                      }));
                    }}
                    placeholder="Tính 1,2 × 27^(1/3)…"
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
                  4. Khi xét cùng tham số va chạm b = 15 fm và động năng E = 6 MeV, góc lệch của hạt α qua hạt nhân{" "}
                  <Nuclide sym="Al" a={27} z={13} /> thay đổi thế nào so với qua hạt nhân{" "}
                  <Nuclide sym="Au" a={197} z={79} />?
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
                        setAlCheckedLocal(false);
                        patchNotebook((cur) => ({
                          ...cur,
                          afterClassWork: {
                            ...cur.afterClassWork,
                            alChoice: val,
                            checked: false,
                          },
                        }));
                      }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>

              <label
                htmlFor="b21-after-reflection"
                style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
              >
                5. Đối chiếu lại dự đoán ban đầu của em ở Pha 1: Bằng chứng nào trong bài học hôm nay đã khẳng định hoặc giúp em điều chỉnh suy nghĩ ban đầu?
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
                    afterClassWork: {
                      ...cur.afterClassWork,
                      predictionReflection: val,
                      checked: false,
                    },
                  }));
                }}
                placeholder="Ví dụ: Lúc đầu em đoán không có hạt nào bật ngược, nhưng tỉ lệ ~10⁻⁴ đốm sáng ở vị trí (2) chứng tỏ điện tích dương tập trung ở hạt nhân rất nhỏ…"
              />

              <div style={{ marginTop: "12px" }}>
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                  onClick={() => {
                    setAlCheckedLocal(true);
                    patchNotebook((cur) => ({
                      ...cur,
                      afterClassWork: {
                        ...cur.afterClassWork,
                        checked: true,
                      },
                    }));
                    if (allAfterOk) {
                      onMarkSectionComplete(section.id, true);
                    }
                  }}
                >
                  Kiểm tra &amp; lưu đáp án Pha 3
                </button>
              </div>

              {alChecked && (
                <div
                  role="status"
                  style={{
                    marginTop: "12px",
                    padding: "12px 14px",
                    background: allAfterOk ? "#defbe6" : "#fff0f1",
                    borderLeft: allAfterOk ? "4px solid #198038" : "4px solid #b42332",
                    fontSize: "14px",
                    lineHeight: 1.55,
                  }}
                >
                  {allAfterOk ? (
                    <>
                      <strong>✓ Hoàn thành chính xác Pha 3!</strong> Hạt nhân{" "}
                      <Nuclide sym="Al" a={27} z={13} /> có <code>Z = 13</code> proton,{" "}
                      <code>N = 27 − 13 = 14</code> neutron, bán kính gần đúng{" "}
                      <code>R = 1,2 × 27¹/³ = 3,6 fm</code> (<code>3,6 × 10⁻¹⁵ m</code>), góc tán xạ nhỏ hơn so với vàng và đáp án của em đã được lưu bền vững trong sổ học tập.
                    </>
                  ) : (
                    <>
                      <strong>Kiểm tra lại từng mục:</strong>{" "}
                      {!zOk && "Chỉ số dưới Z của ²⁷₁₃Al bằng 13. "}
                      {!nOk && "Số neutron N = 27 − 13 = 14. "}
                      {!rOk && "Bán kính R = 1,2 × 27¹/³ = 1,2 × 3 = 3,6 (fm hay 10⁻¹⁵ m). "}
                      {!choiceOk && "Lực đẩy tĩnh điện tỉ lệ thuận với điện tích hạt nhân bia (+13e < +79e). "}
                      {!reflectionOk && "Em hãy viết ít nhất một câu đối chiếu lại với dự đoán ở Pha 1."}
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
      {section.kind === "b22_blackett_track" &&
        (() => {
          const blackettChoice = notebook.preClassWork?.b22BlackettChoice ?? "";
          return (
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
                  {[42, 74, 152, 184].map((y) => (
                    <line key={y} x1="36" y1={y} x2="360" y2={y} stroke="#334155" strokeWidth="2" />
                  ))}
                  <line x1="36" y1="114" x2="292" y2="114" stroke="#38bdf8" strokeWidth="4" />
                  <circle cx="292" cy="114" r="6" fill="#facc15" />
                  <line x1="292" y1="114" x2="590" y2="38" stroke="#fde047" strokeWidth="2.2" />
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
                  <strong>Thí nghiệm buồng sương Blackett (SGK tr. 96):</strong> Trong hàng chục nghìn vết hạt α đi thẳng qua khí Nitrogen, xuất hiện điểm va chạm tại đó vệt α biến mất và tách thành{" "}
                  <strong>hai nhánh chữ Y</strong> (không có nhánh thứ ba), chứng tỏ hạt α đã nhập vào hạt nhân{" "}
                  <Nuclide sym="N" a={14} z={7} /> để biến đổi thành nguyên tố mới{" "}
                  <Nuclide sym="O" a={17} z={8} /> và phát ra proton <Nuclide sym="H" a={1} z={1} />.
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

              <div style={{ border: "1px solid #d0d7de", padding: "14px 16px", background: "#ffffff", marginTop: "12px" }}>
                <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>
                    Câu hỏi nhận diện vết trước giờ học: Vì sao sau điểm va chạm chỉ xuất hiện đúng 2 nhánh chữ Y (một mảnh dài, một đậm ngắn) mà không còn vết thứ ba của hạt α ban đầu?
                  </legend>
                  {[
                    [
                      "captured",
                      "Vì hạt α đã bị hạt nhân ¹⁴₇N bắt giữ để biến đổi thành hạt nhân mới ¹⁷₈O (vết đậm, ngắn) và phóng ra proton ¹₁H (vết mảnh, dài).",
                    ],
                    [
                      "elastic",
                      "Vì hạt α chỉ va chạm đàn hồi rồi đứng yên hoàn toàn tại chỗ mà không tạo phản ứng hạt nhân.",
                    ],
                  ].map(([val, label]) => (
                    <label
                      key={val}
                      style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "14px", cursor: "pointer" }}
                    >
                      <input
                        type="radio"
                        name="b22-blackett-track-check"
                        checked={blackettChoice === val}
                        onChange={() => {
                          patchNotebook((cur) => ({
                            ...cur,
                            preClassWork: {
                              ...cur.preClassWork,
                              b22BlackettChoice: val,
                            },
                          }));
                          if (val === "captured") {
                            onMarkSectionComplete(section.id, true);
                          }
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </fieldset>
                {blackettChoice && (
                  <p
                    role="status"
                    style={{
                      margin: "6px 0 0",
                      fontSize: "13.5px",
                      fontWeight: 600,
                      color: blackettChoice === "captured" ? "#198038" : "#b42332",
                    }}
                  >
                    {blackettChoice === "captured"
                      ? "✓ Chính xác! Sự biến mất của vệt α tới và sự xuất hiện 2 vết mới là bằng chứng trực quan của phản ứng biến đổi hạt nhân."
                      : "Chưa đúng. Nếu va chạm đàn hồi thông thường giữa α và ¹⁴₇N thì hạt α không biến mất để tạo ra nguyên tố Oxygen mới."}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

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

      {section.kind === "b22_after_transfer" &&
        (() => {
          const b22AfterChoice = notebook.afterClassWork?.b22AfterChoice ?? "";
          return (
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
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: { ...cur.afterClassWork, b22AfterChoice: val },
                      }));
                      if (val === "correct") onMarkSectionComplete(section.id, true);
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
          );
        })()}

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

      {section.kind === "b24_after_transfer" &&
        (() => {
          const b24AfterChoice = notebook.afterClassWork?.b24AfterChoice ?? "";
          return (
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
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: { ...cur.afterClassWork, b24AfterChoice: val },
                      }));
                      if (val === "correct") onMarkSectionComplete(section.id, true);
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
          );
        })()}

      {/* ====================================================================
          BÀI 25 — BÀI TẬP VỀ VẬT LÍ HẠT NHÂN
          ==================================================================== */}
      {section.kind === "b25_electroscope" &&
        (() => {
          const b25ElecChoice = notebook.afterClassWork?.b25ElecChoice ?? "";
          return (
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
                  <rect x="24" y="34" width="66" height="32" fill="#334155" rx="3" />
                  <text x="34" y="54" fill="#ffffff" fontSize="11" fontWeight="700">Nguồn α</text>
                  <line x1="92" y1="44" x2="188" y2="48" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 3" />
                  <line x1="92" y1="56" x2="188" y2="56" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 3" />
                  <text x="114" y="34" fill="#b91c1c" fontSize="11" fontWeight="700">Ion hóa không khí (+ / −)</text>

                  <circle cx="220" cy="52" r="18" fill="#facc15" stroke="#854d0e" strokeWidth="2" />
                  <text x="211" y="56" fill="#161616" fontSize="12" fontWeight="700">+++</text>
                  <line x1="220" y1="70" x2="220" y2="122" stroke="#525252" strokeWidth="3" />
                  <circle cx="220" cy="136" r="46" fill="none" stroke="#8d8d8d" strokeWidth="2" />
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
                            patchNotebook((cur) => ({
                              ...cur,
                              afterClassWork: { ...cur.afterClassWork, b25ElecChoice: val },
                            }));
                            if (val === "stop") onMarkSectionComplete(section.id, true);
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
          );
        })()}

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

      {section.kind === "b25_after_transfer" &&
        (() => {
          const b25AfterDays = notebook.afterClassWork?.b25AfterDays ?? "";
          return (
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
                    onChange={(e) => {
                      const val = e.target.value;
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: { ...cur.afterClassWork, b25AfterDays: val },
                      }));
                    }}
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
                    if (Number(b25AfterDays) === 24) {
                      onMarkSectionComplete(section.id, true);
                    }
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
          );
        })()}
    </div>
  );
}
