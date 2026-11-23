"use client";
/* eslint-disable @next/next/no-img-element -- Scientific apparatus capture and explicit dimensions */

import { useState } from "react";
import {
  SGK_B21_MASS_CONSTANTS,
  SGK_TABLE_21_1,
  SGK_TABLE_23_1,
  SGK_TABLE_23_2_SAMPLES,
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

const B22_PREDICTION_CHOICES = [
  {
    id: "elastic_bounce",
    label:
      "Hạt α chỉ va chạm đàn hồi làm hạt nhân Nitrogen nảy ra, còn bản thân hạt α bay tiếp tạo nhánh thứ ba mờ quá nên không thấy.",
  },
  {
    id: "nuclear_transmutation",
    label:
      "Hạt α bị hạt nhân ¹⁴₇N bắt giữ biến đổi thành nguyên tố mới ¹⁷₈O (vết đậm ngắn) và phóng ra hạt proton ¹₁H (vết mảnh dài).",
  },
  {
    id: "stopped_air",
    label: "Hạt α tự dừng lại giữa chừng còn hai nhánh chữ Y là hai tia sáng phản xạ trên thành buồng sương.",
  },
] as const;

const B22_TRACK_PARTS = [
  { code: "alpha", label: "1. Vệt thẳng đi tới từ bên trái", correctRole: "incident_alpha" },
  { code: "vertex", label: "2. Đỉnh chữ Y (không có nhánh thứ 3 đi tiếp)", correctRole: "capture_vertex" },
  { code: "proton", label: "3. Nhánh mảnh, vươn rất dài", correctRole: "emitted_proton" },
  { code: "oxygen", label: "4. Nhánh rất đậm, quãng đi ngắn", correctRole: "recoil_oxygen" },
] as const;

const B22_TRACK_ROLE_OPTIONS = [
  { value: "", label: "— Chọn đúng ý nghĩa trên ảnh buồng sương —" },
  { value: "incident_alpha", label: "Vệt hạt α (⁴₂He) bay tới trong khí Nitrogen" },
  { value: "capture_vertex", label: "Điểm hạt α nhập vào ¹⁴₇N gây biến đổi hạt nhân" },
  { value: "emitted_proton", label: "Vệt hạt proton (¹₁H) nhẹ, bay xa và ít ion hóa hơn" },
  { value: "recoil_oxygen", label: "Vệt hạt nhân ¹⁷₈O nặng, mang điện lớn nên ion hóa dày và dừng nhanh" },
] as const;

const B22_PRE_SELF_CHECK_OPTIONS = [
  {
    id: "same_as_b21",
    label: "Giống hệt tán xạ Rutherford ở Bài 21: nguyên tố Nitrogen giữ nguyên, hạt α chỉ đổi hướng.",
    feedback:
      "Chưa chính xác. Hãy nhìn lại đỉnh chữ Y trên sơ đồ Blackett: nếu hạt α chỉ đổi hướng và ¹⁴₇N giật lùi thì không thể tạo ra vệt mảnh dài của proton ¹₁H; ở đây nguyên tố Nitrogen (Z = 7) đã biến thành Oxygen (Z = 8).",
  },
  {
    id: "two_branches_transmute",
    label:
      "Khác hẳn Bài 21: vệt α biến mất tại đỉnh chữ Y, chỉ còn đúng 2 nhánh của ¹₁H và ¹⁷₈O chứng tỏ Nitrogen đã biến đổi thành nguyên tố Oxygen.",
    feedback:
      "✓ Chính xác! Tổng số khối (4 + 14 = 17 + 1) và điện tích (2 + 7 = 8 + 1) bảo toàn, mở đầu cho kỉ nguyên phản ứng hạt nhân kích thích.",
  },
] as const;

const B23_PREDICTION_CHOICES = [
  {
    id: "faulty_meter",
    label: "Ống đếm Geiger bị kẹt hoặc nguồn phóng xạ tạm ngưng hoạt động trong khoảng 15–20 s.",
  },
  {
    id: "random_micro",
    label:
      "Sự phân rã của từng hạt nhân hoàn toàn ngẫu nhiên theo thời gian nên các khoảng 5 s ngắn có số xung thăng giáng (kể cả 0 xung).",
  },
  {
    id: "exhausted_source",
    label: "Mẫu phóng xạ đã phân rã hết sạch sau 15 s đầu rồi tự sinh ra lại ở giây thứ 20.",
  },
] as const;

const B23_PRE_SELF_CHECK_OPTIONS = [
  {
    id: "equal_every_5s",
    label: "Tổng 30 s có 10 xung nên mỗi khoảng 5 s bắt buộc phải có đều đặn gần 2 xung; số 0 ở 15–20 s là do ghi nhầm.",
    feedback:
      "Chưa chính xác. Đối chiếu lại dòng 15–20 s trên Bảng 23.1 SGK tr. 105 (ghi rõ 0 xung) trong khi ngay sau đó 20–25 s lại có 3 xung: đó là bằng chứng thực nghiệm về tính ngẫu nhiên vi mô.",
  },
  {
    id: "random_not_predictable_single",
    label:
      "Không thể biết chính xác thời điểm một hạt nhân riêng lẻ phân rã, nên trong khoảng đo ngắn 5 s số xung dao động ngẫu nhiên (từ 0 đến 3 xung ở Bảng 23.1).",
    feedback:
      "✓ Chính xác! Ở mức từng hạt nhân phân rã là ngẫu nhiên; chỉ khi xét số lượng hạt cực lớn theo thời gian dài mới xuất hiện quy luật thống kê chu kì bán rã ở Pha 2.",
  },
] as const;

const B24_PREDICTION_CHOICES = [
  {
    id: "radiation_hits_turbine",
    label: "Các tia phóng xạ và mảnh phân hạch từ tâm lò bay trực tiếp ra đập làm quay cánh tua-bin.",
  },
  {
    id: "primary_water_hits_turbine",
    label: "Nước tải nhiệt vòng sơ cấp đi xuyên qua tâm lò phản ứng rồi phun thẳng vào làm quay tua-bin.",
  },
  {
    id: "secondary_steam_spins_turbine",
    label:
      "Hơi nước áp suất cao ở vòng thứ cấp (nhận nhiệt qua thành ống bình sinh hơi, cách li phóng xạ với vòng sơ cấp) thực sự làm quay tua-bin.",
  },
] as const;

const B24_LOOP_PARTS = [
  { code: "primary", label: "1. Vòng tải nhiệt sơ cấp (màu cam/đỏ)", correctRole: "closed_reactor_heat" },
  { code: "secondary", label: "2. Vòng hơi nước – nước ngưng thứ cấp (màu lam)", correctRole: "steam_spin_turbine" },
  { code: "cooling", label: "3. Nguồn nước làm mát ngoài (sông, hồ, biển)", correctRole: "condenser_heat_sink" },
] as const;

const B24_LOOP_ROLE_OPTIONS = [
  { value: "", label: "— Chọn đúng chức năng trên Hình 24.1 —" },
  { value: "closed_reactor_heat", label: "Tuần hoàn khép kín qua tâm lò để tải nhiệt sang bình sinh hơi, ngăn rò rỉ phóng xạ" },
  { value: "steam_spin_turbine", label: "Sinh hơi nước sạch áp suất cao làm quay tua-bin kéo máy phát điện rồi ngưng tụ lại" },
  { value: "condenser_heat_sink", label: "Đi qua ống trao đổi nhiệt tại bình ngưng để giải nhiệt mà không trộn với hai vòng kia" },
] as const;

const B24_PRE_SELF_CHECK_OPTIONS = [
  {
    id: "mix_loops",
    label: "Ba dòng nước trên Hình 24.1 hòa trộn chung với nhau tại bình sinh hơi và bình ngưng để truyền nhiệt nhanh hơn.",
    feedback:
      "Chưa chính xác. Hãy quan sát lại các ống xoắn trao đổi nhiệt trong bình sinh hơi và bình ngưng trên Hình 24.1: 3 dòng lưu chất tách kín hoàn toàn để hơi quay tua-bin và nước trả ra môi trường không nhiễm phóng xạ.",
  },
  {
    id: "isolated_three_loops",
    label:
      "Tua-bin quay nhờ hơi nước vòng thứ cấp; vòng sơ cấp qua tâm lò được đóng kín hoàn toàn nên không phát tán chất phóng xạ sang tua-bin hay nguồn nước làm mát.",
    feedback:
      "✓ Chính xác! Đây là nguyên tắc an toàn nhiều lớp cốt lõi của nhà máy điện hạt nhân nước áp lực.",
  },
] as const;

const B25_PREDICTION_CHOICES = [
  {
    id: "direct_charge_cancel",
    label: "Nguồn (1) chỉ phát ra các hạt mang điện trái dấu bay thẳng tới bám vào bản góp (2) để trung hòa điện tích.",
  },
  {
    id: "air_ionization",
    label:
      "Tia phóng xạ từ nguồn (1) làm ion hóa không khí quanh bản góp (2) thành các ion dương và âm tự do, hút về bản góp làm tĩnh điện kế mất điện tích (kim (3) về 0 dù tích điện + hay −).",
  },
  {
    id: "magnetic_pull",
    label: "Vỏ chì của nguồn (1) hút từ tính làm kim tĩnh điện kế (3) quay về vạch 0.",
  },
] as const;

const B25_APPARATUS_PARTS = [
  { code: "p1", label: "Kí hiệu (1) trên Hình 25.1", correctRole: "radioactive_source" },
  { code: "p2", label: "Kí hiệu (2) trên Hình 25.1", correctRole: "collector_plate" },
  { code: "p3", label: "Kí hiệu (3) trên Hình 25.1", correctRole: "electroscope_pointer" },
] as const;

const B25_APPARATUS_ROLE_OPTIONS = [
  { value: "", label: "— Chọn đúng tên gọi & vai trò trên Hình 25.1 —" },
  { value: "radioactive_source", label: "Nguồn phóng xạ phát chùm tia chiếu vào vùng không khí trước tĩnh điện kế" },
  { value: "collector_plate", label: "Bản góp điện tích (đĩa kim loại nối dẫn điện với trục và kim tĩnh điện kế)" },
  { value: "electroscope_pointer", label: "Kim tĩnh điện kế lệch theo độ lớn điện tích và giảm dần về 0 khi phóng điện" },
] as const;

const B25_PRE_SELF_CHECK_OPTIONS = [
  {
    id: "only_one_sign",
    label:
      "Nếu đổi dấu điện tích ban đầu của bản góp (2) từ âm sang dương thì kim (3) sẽ lệch rộng thêm vì nguồn α mang điện dương +2e.",
    feedback:
      "Chưa chính xác. Đối chiếu lại hiện tượng Hình 25.1: thực tế dù tích điện dương hay âm cho bản góp (2), kim (3) đều giảm dần về 0 — bác bỏ giả thuyết hạt từ nguồn trực tiếp tích thêm điện, mà do không khí bị ion hóa tạo cả ion (+) và ion (−)/e⁻.",
  },
  {
    id: "both_signs_discharge",
    label:
      "Dù bản góp (2) tích điện dương hay âm thì kim (3) đều giảm về 0 vì không khí bị ion hóa chứa cả hai loại hạt tải điện trái dấu; nếu chắn nguồn thuần α bằng tờ giấy thì kim ngừng giảm nhanh.",
    feedback:
      "✓ Chính xác! Các ion trái dấu trong không khí bị hút về bản góp (2) để trung hòa điện tích, và tờ giấy chặn được tia α làm quá trình ion hóa dừng lại.",
  },
] as const;

export interface Chapter4SectionBodyProps {
  readonly lessonCode: "B21" | "B22" | "B23" | "B24" | "B25";
  readonly section: Chapter4SectionSpec;
  readonly notebook: StudentLessonNotebook;
  /** Bật trong Chế độ Giáo viên (tự ẩn khi bấm Xem như học sinh) để hiện lời giải mẫu B25 */
  readonly showTeacherSolutions?: boolean;
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

function Phase2ProductEchoCard({
  preSectionId,
  lockedChoiceLabel,
  lockedReason,
  actionSummary,
  bringQuestion,
  onJumpToSection,
}: {
  readonly preSectionId: string;
  readonly lockedChoiceLabel?: string;
  readonly lockedReason?: string;
  readonly actionSummary: string;
  readonly bringQuestion?: string;
  readonly onJumpToSection: (sectionId: string) => void;
}) {
  return (
    <div className={styles.predictionEchoBox}>
      {lockedChoiceLabel ? (
        <div>
          <div style={{ marginBottom: "6px" }}>
            <strong>Sản phẩm Pha 1 đã lưu · Dự đoán ban đầu (khóa đối chiếu):</strong>{" "}
            “{lockedChoiceLabel}”
            {lockedReason ? (
              <span>
                {" "}
                — <em>Lí do ban đầu: {lockedReason}</em>
              </span>
            ) : null}
          </div>
          <div style={{ fontSize: "13.5px", color: "#161616", marginBottom: "4px" }}>
            <strong>Kết quả chuẩn bị ở nhà:</strong> {actionSummary}
            {bringQuestion?.trim() ? (
              <span>
                {" "}
                · <strong>Câu hỏi mang vào lớp:</strong> “{bringQuestion.trim()}”
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <span>
            <strong>Đối chiếu sản phẩm Pha 1:</strong> Em chưa khóa dự đoán ban đầu ở mục Trước giờ học. Em có thể mở lại Pha 1 để hoàn thành chuẩn bị hoặc tiếp tục hoạt động trên lớp bên dưới.
          </span>
          <button
            type="button"
            className={`${styles.cdsBtn} ${styles.cdsBtnSmall}`}
            onClick={() => onJumpToSection(preSectionId)}
          >
            Quay lại Pha 1 (Trước giờ học)
          </button>
        </div>
      )}
    </div>
  );
}

export function Chapter4SectionBody({
  lessonCode,
  section,
  notebook,
  showTeacherSolutions = false,
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

  // State nháp đồng bộ với localStorage cho các mục đọc/vận dụng
  const [alCheckedLocal, setAlCheckedLocal] = useState(false);
  const [structCheckedLocal, setStructCheckedLocal] = useState(false);
  const [isoCheckedLocal, setIsoCheckedLocal] = useState(false);
  const [b22AfterCheckedLocal, setB22AfterCheckedLocal] = useState(false);
  const [b24FoodCheckedLocal, setB24FoodCheckedLocal] = useState(false);
  const [b25TableCheckedLocal, setB25TableCheckedLocal] = useState(false);
  const [b25AfterCheckedLocal, setB25AfterCheckedLocal] = useState(false);
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
          BÀI 22 — PHẢN ỨNG HẠT NHÂN & NĂNG LƯỢNG LIÊN KẾT (Eₗₖ, Eₗₖᵣ = Eₗₖ/A)
          ==================================================================== */}
      {section.kind === "b22_blackett_track" &&
        (() => {
          const lockedB22Label = B22_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          const trackRoles = notebook.preClassWork?.b22TrackRoles ?? {};
          const matchedTrackCount = B22_TRACK_PARTS.filter(
            (p) => trackRoles[p.code] === p.correctRole
          ).length;
          const b22SelfCheck = notebook.preClassWork?.selfCheckChoice ?? "";
          const b22SelfOpt = B22_PRE_SELF_CHECK_OPTIONS.find(
            (o) => o.id === b22SelfCheck
          );
          const checkB22PreReady = (
            nb: StudentLessonNotebook,
            rolesOv?: typeof trackRoles,
            selfOv?: string
          ) => {
            const hasP = Boolean(
              (nb.initialPredictionChoice ?? nb.preClassPredictionChoice ?? "").trim()
            );
            const hasR = Boolean(
              (nb.initialPredictionReason ?? nb.preClassPredictionReason ?? "").trim()
            );
            const rMap = rolesOv ?? nb.preClassWork?.b22TrackRoles ?? {};
            const rolesOk = B22_TRACK_PARTS.every((p) => rMap[p.code] === p.correctRole);
            const sc = selfOv ?? nb.preClassWork?.selfCheckChoice ?? "";
            return hasP && hasR && rolesOk && sc === "two_branches_transmute";
          };
          const b22Ready = checkB22PreReady(notebook);

          return (
            <div>
              {/* Bước 1: Câu hỏi mở đầu Hình 22.1–22.2 */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 1 · Câu hỏi mở đầu từ ảnh chụp buồng sương Blackett (Hình 22.1–22.2 · SGK tr. 96)
                </h4>
                <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.6 }}>
                  Năm 1925, P. M. S. Blackett chụp hàng chục nghìn bức ảnh chùm hạt α phóng qua buồng sương chứa khí Nitrogen (<Nuclide sym="N" a={14} z={7} />). Hầu hết vệt sương đều là đường thẳng song song, nhưng thỉnh thoảng xuất hiện một vệt đặc biệt tách nhánh hình chữ Y.
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
                    “Vì sao giữa hàng chục nghìn vệt hạt α đi thẳng trong buồng sương chứa Nitrogen lại có một vệt biến mất tại đỉnh rẽ nhánh chữ Y?”
                  </em>
                </div>
              </section>

              {/* Bước 2: Tư liệu quan sát + Chỉ dẫn + Đối chiếu với tán xạ Rutherford B21 + Video */}
              <section style={{ marginBottom: "18px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "16px" }}>
                  Bước 2 · Quan sát 4 chi tiết trên vết phân nhánh chữ Y và đối chiếu với Bài 21
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
                    “Hãy để ý điểm rẽ nhánh chữ Y nơi vệt α biến mất (không có nhánh thứ 3 đi tiếp), đồng thời so sánh độ mảnh – dài của hai nhánh sau va chạm”
                  </em>
                  .
                </div>

                <figure className={styles.darkBenchStage} style={{ margin: "0 0 14px" }}>
                  <svg
                    viewBox="0 0 680 230"
                    width="680"
                    height="230"
                    role="img"
                    aria-label="Sơ đồ Hình 22.1–22.2 buồng sương Blackett: (1) vệt hạt alpha tới, (2) đỉnh tương tác với N-14 không có nhánh thứ 3 đi tiếp, (3) vệt mảnh dài của proton H-1, (4) vệt đậm ngắn của hạt nhân O-17"
                    style={{ width: "100%", height: "auto", display: "block" }}
                  >
                    <rect x="0" y="0" width="680" height="230" fill="#0b1220" />
                    {[40, 72, 158, 192].map((y) => (
                      <line key={y} x1="34" y1={y} x2="368" y2={y} stroke="#334155" strokeWidth="2" />
                    ))}
                    <line x1="34" y1="116" x2="292" y2="116" stroke="#38bdf8" strokeWidth="4.2" />
                    <circle cx="292" cy="116" r="6.5" fill="#facc15" />
                    <line x1="292" y1="116" x2="604" y2="36" stroke="#fde047" strokeWidth="2.2" />
                    <line
                      x1="292"
                      y1="116"
                      x2="396"
                      y2="164"
                      stroke="#fb7185"
                      strokeWidth="5.5"
                      strokeLinecap="round"
                    />
                    <text x="42" y="104" fill="#7dd3fc" fontSize="13" fontWeight="700">
                      (1) Vệt hạt α tới (⁴₂He)
                    </text>
                    <text x="196" y="142" fill="#facc15" fontSize="12.5" fontWeight="700">
                      (2) Đỉnh va chạm ¹⁴₇N (không có nhánh thứ 3)
                    </text>
                    <text x="418" y="30" fill="#fde047" fontSize="13" fontWeight="700">
                      (3) Vệt mảnh, dài: Proton (¹₁H)
                    </text>
                    <text x="404" y="170" fill="#fda4af" fontSize="13" fontWeight="700">
                      (4) Vệt đậm, ngắn: Hạt nhân ¹⁷₈O
                    </text>
                  </svg>
                  <figcaption className={styles.darkBenchCaption}>
                    <strong>Hình 22.1 – 22.2 (Buồng sương Blackett · SGK tr. 96):</strong> Phản ứng hạt nhân kích thích đầu tiên{" "}
                    <Nuclide sym="He" a={4} z={2} /> + <Nuclide sym="N" a={14} z={7} /> →{" "}
                    <Nuclide sym="O" a={17} z={8} /> + <Nuclide sym="H" a={1} z={1} />.
                  </figcaption>
                </figure>

                {/* Đối chiếu khác biệt với tán xạ Rutherford Bài 21 */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "12px",
                    marginBottom: "14px",
                  }}
                >
                  <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
                    <strong style={{ display: "block", marginBottom: "4px" }}>
                      Ôn lại Bài 21 · Tán xạ hạt α trên lá vàng
                    </strong>
                    <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                      Hạt α chỉ bị lực đẩy tĩnh điện làm <strong>đổi hướng bay</strong>; hạt nhân vàng{" "}
                      <Nuclide sym="Au" a={197} z={79} /> <strong>giữ nguyên là nguyên tố vàng</strong>, không biến thành nguyên tố khác.
                    </p>
                  </div>
                  <div style={{ border: "1px solid #a6c8ff", background: "#edf5ff", padding: "12px 14px" }}>
                    <strong style={{ display: "block", color: "#002d9c", marginBottom: "4px" }}>
                      Điểm mới ở Bài 22 · Phản ứng hạt nhân Blackett
                    </strong>
                    <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                      Hạt α bị bắt giữ vào <Nuclide sym="N" a={14} z={7} />, vệt α biến mất hoàn toàn và <strong>biến đổi nguyên tố Nitrogen (Z = 7) thành Oxygen (Z = 8)</strong> kèm một proton.
                    </p>
                  </div>
                </div>

                {b21VideoLesson && (
                  <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "13.5px", lineHeight: 1.55 }}>
                      <strong>Tư liệu video bổ trợ Pha 1 Bài 22:</strong> Theo dõi diễn biến trước – trong – sau tương tác hạt nhân và cách kiểm tra tổng A, Z.{" "}
                      <span style={{ color: "#002d9c", fontWeight: 600 }}>
                        Nếu chưa xem video, học sinh vẫn hoàn thành trọn vẹn Pha 1 từ sơ đồ buồng sương Blackett và dữ liệu thật ngay trên trang
                      </span>{" "}
                      (mở hoặc phát video không tự tính hoàn thành).
                    </p>
                    <NuclearLessonVideo lesson={b21VideoLesson} />
                  </div>
                )}
              </section>

              {/* Bước 3: Khóa dự đoán ban đầu + lí do */}
              <section
                style={{
                  border: "1px solid #8d8d8d",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 6px", fontSize: "16px" }}>
                  Bước 3 · Ghi và khóa dự đoán ban đầu kèm lí do
                </h4>
                {lockedB22Label && (
                  <div
                    style={{
                      marginBottom: "12px",
                      padding: "10px 12px",
                      background: "#fcf4d6",
                      borderLeft: "4px solid #8e6a00",
                      fontSize: "13.5px",
                    }}
                  >
                    <strong>Dự đoán ban đầu đã khóa:</strong> “{lockedB22Label}”
                    {lockedInitialReason ? <span> — <em>Lí do: {lockedInitialReason}</em></span> : null}
                  </div>
                )}
                <fieldset style={{ border: "none", margin: "0 0 12px", padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
                    Chọn dự đoán của em về hiện tượng tại đỉnh rẽ nhánh chữ Y:
                  </legend>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {B22_PREDICTION_CHOICES.map((opt) => (
                      <label
                        key={opt.id}
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                          padding: "10px 12px",
                          border: predChoice === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                          background: predChoice === opt.id ? "#edf5ff" : "#fafafa",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        <input
                          type="radio"
                          name="b22-pre-prediction"
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
                  htmlFor="b22-pre-reason"
                  style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
                >
                  Lí do cho dự đoán của em (bắt buộc):
                </label>
                <textarea
                  id="b22-pre-reason"
                  className={styles.evidenceTextarea}
                  rows={2}
                  value={predReason}
                  onChange={(e) => {
                    setPredReasonDraft(e.target.value);
                    setPredSavedMsg("");
                  }}
                  placeholder="Nêu ngắn gọn vì sao em dự đoán như vậy dựa trên số nhánh sương sau va chạm…"
                />
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "10px" }}>
                  <button
                    type="button"
                    className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                    onClick={() => {
                      if (!predChoice || !predReason.trim()) {
                        setPredSavedMsg("Em hãy chọn dự đoán và viết ngắn gọn lí do trước khi lưu.");
                        return;
                      }
                      onSavePreClassPrediction(predChoice, predReason.trim());
                      const updated = recordPreClassPrediction(notebook, predChoice, predReason.trim());
                      if (checkB22PreReady(updated)) onMarkSectionComplete(section.id, true);
                      setPredSavedMsg("Đã lưu và khóa dự đoán ban đầu cho Bài 22.");
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

              {/* Bước 4: Thao tác nhỏ ghép đúng 4 chi tiết trên vết chữ Y */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 4 · Thao tác ghép đúng 4 chi tiết trên vết buồng sương Blackett ({matchedTrackCount}/4 đúng)
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {B22_TRACK_PARTS.map((part) => {
                    const sel = trackRoles[part.code] ?? "";
                    const ok = sel === part.correctRole;
                    return (
                      <div
                        key={part.code}
                        style={{
                          padding: "10px 12px",
                          border: sel ? (ok ? "1px solid #198038" : "1px solid #da1e28") : "1px solid #e0e0e0",
                          background: sel ? (ok ? "#defbe6" : "#fff1f1") : "#fafafa",
                        }}
                      >
                        <label
                          htmlFor={`b22-track-${part.code}`}
                          style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
                        >
                          {part.label}
                        </label>
                        <select
                          id={`b22-track-${part.code}`}
                          value={sel}
                          onChange={(e) => {
                            const val = e.target.value;
                            const nextRoles = { ...trackRoles, [part.code]: val };
                            patchNotebook((cur) => ({
                              ...cur,
                              preClassWork: {
                                ...cur.preClassWork,
                                b22TrackRoles: nextRoles,
                              },
                            }));
                            if (checkB22PreReady(notebook, nextRoles)) {
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
                          {B22_TRACK_ROLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Bước 5: Câu tự kiểm tra có phản hồi */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 5 · Câu tự kiểm tra trước giờ học
                </h4>
                <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>
                    Đối chiếu sơ đồ Blackett với thí nghiệm lá vàng Rutherford ở Bài 21, nhận định nào đúng?
                  </legend>
                  {B22_PRE_SELF_CHECK_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-start",
                        padding: "10px 12px",
                        marginBottom: "8px",
                        border: b22SelfCheck === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                        background: b22SelfCheck === opt.id ? "#edf5ff" : "#fafafa",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      <input
                        type="radio"
                        name="b22-pre-selfcheck"
                        checked={b22SelfCheck === opt.id}
                        onChange={() => {
                          patchNotebook((cur) => ({
                            ...cur,
                            preClassWork: { ...cur.preClassWork, selfCheckChoice: opt.id },
                          }));
                          if (checkB22PreReady(notebook, undefined, opt.id)) {
                            onMarkSectionComplete(section.id, true);
                          }
                        }}
                        style={{ marginTop: "3px" }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </fieldset>
                {b22SelfOpt && (
                  <div
                    role="status"
                    style={{
                      marginTop: "8px",
                      padding: "10px 14px",
                      background: b22SelfOpt.id === "two_branches_transmute" ? "#defbe6" : "#fff1f1",
                      borderLeft:
                        b22SelfOpt.id === "two_branches_transmute"
                          ? "4px solid #198038"
                          : "4px solid #b42332",
                      fontSize: "13.5px",
                      lineHeight: 1.55,
                    }}
                  >
                    {b22SelfOpt.feedback}
                  </div>
                )}
              </section>

              {/* Bước 6: Thẻ Sản phẩm mang vào lớp */}
              <section style={{ border: "2px solid #0f62fe", background: "#edf5ff", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "#002d9c" }}>
                    Sản phẩm mang vào lớp · Bài 22
                  </h4>
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      background: b22Ready ? "#defbe6" : "#fcf4d6",
                      color: b22Ready ? "#198038" : "#8e6a00",
                    }}
                  >
                    {b22Ready
                      ? "✓ Đã hoàn thành Pha 1 Bài 22"
                      : "Cần đủ: Dự đoán + lí do, 4/4 chi tiết chữ Y và câu tự kiểm tra"}
                  </span>
                </div>
                <ul style={{ margin: "0 0 12px", paddingLeft: "18px", fontSize: "14px", lineHeight: 1.6 }}>
                  <li>
                    <strong>Dự đoán ban đầu:</strong> {lockedB22Label ? `“${lockedB22Label}”` : "Chưa lưu"}
                  </li>
                  <li>
                    <strong>Nhận diện vết chữ Y Blackett:</strong> {matchedTrackCount}/4 chi tiết đúng.
                  </li>
                  <li>
                    <strong>Đối chiếu B21 – B22:</strong>{" "}
                    {b22SelfCheck === "two_branches_transmute" ? "Đã nắm vững sự biến đổi nguyên tố" : "Chưa hoàn tất"}
                  </li>
                </ul>
                <label htmlFor="b22-bring-q" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                  Câu hỏi muốn trao đổi thêm trên lớp:
                </label>
                <input
                  id="b22-bring-q"
                  type="text"
                  value={bringToClassQuestion}
                  onChange={(e) => {
                    const val = e.target.value;
                    patchNotebook((cur) => ({
                      ...cur,
                      preClassWork: { ...cur.preClassWork, bringToClassQuestion: val },
                    }));
                  }}
                  placeholder="Ví dụ: Khối lượng tổng cộng của ¹⁷₈O và ¹₁H lớn hơn hay nhỏ hơn ⁴₂He + ¹⁴₇N?"
                  style={{
                    width: "100%",
                    minHeight: "40px",
                    padding: "8px 10px",
                    border: "1px solid #8d8d8d",
                    background: "#ffffff",
                    fontSize: "14px",
                    marginBottom: "10px",
                  }}
                />
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                  onClick={() => onJumpToSection("b22-conservation")}
                >
                  Chuyển sang Pha 2: Bảo toàn A và Z →
                </button>
              </section>
            </div>
          );
        })()}

      {section.kind === "b22_conservation" &&
        (() => {
          const lockedB22Label = B22_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          const trackRoles = notebook.preClassWork?.b22TrackRoles ?? {};
          const matchedTrackCount = B22_TRACK_PARTS.filter(
            (p) => trackRoles[p.code] === p.correctRole
          ).length;

          return (
            <div>
              <Phase2ProductEchoCard
                preSectionId="b22-blackett-track"
                lockedChoiceLabel={lockedB22Label}
                lockedReason={lockedInitialReason}
                actionSummary={`Đã ghép đúng ${matchedTrackCount}/4 chi tiết vết phân nhánh Blackett (⁴₂He + ¹⁴₇N → ¹⁷₈O + ¹₁H)`}
                bringQuestion={bringToClassQuestion}
                onJumpToSection={onJumpToSection}
              />

              <div className={styles.tableScroll}>
                <table className={styles.cdsTable}>
                  <caption>
                    Phân loại hai nhóm phản ứng hạt nhân và các định luật bảo toàn (SGK tr. 97–98)
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Loại phản ứng hạt nhân</th>
                      <th scope="col">Bản chất vật lí</th>
                      <th scope="col">Ví dụ điển hình</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">1. Phản ứng hạt nhân tự phát</th>
                      <td>Quá trình tự phân rã của một hạt nhân không bền vững thành các hạt nhân khác (hiện tượng phóng xạ).</td>
                      <td>
                        <Nuclide sym="U" a={238} z={92} /> → <Nuclide sym="Th" a={234} z={90} /> +{" "}
                        <Nuclide sym="He" a={4} z={2} />
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">2. Phản ứng hạt nhân kích thích</th>
                      <td>Quá trình các hạt nhân tương tác với nhau (do va chạm/bắn phá) tạo ra các hạt nhân mới.</td>
                      <td>
                        <Nuclide sym="He" a={4} z={2} /> + <Nuclide sym="N" a={14} z={7} /> →{" "}
                        <Nuclide sym="O" a={17} z={8} /> + <Nuclide sym="H" a={1} z={1} /> (Blackett)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  background: "#f8fafc",
                  border: "1px solid #d0d7de",
                  marginBottom: "16px",
                  fontSize: "13.5px",
                  lineHeight: 1.55,
                }}
              >
                <strong>Định luật bảo toàn trong mọi phản ứng hạt nhân:</strong>{" "}
                Bảo toàn <strong>số nucleon (số khối A)</strong> và bảo toàn <strong>điện tích (Z)</strong>, bảo toàn năng lượng toàn phần và động lượng. <em>Lưu ý:</em> Không có định luật bảo toàn khối lượng nghỉ!
              </div>

              <FixedPhysicsActivityRenderer
                activityKey="nuclear_reaction_balancer"
                onProgress={(done) => onMarkSectionComplete(section.id, done)}
              />
            </div>
          );
        })()}

      {section.kind === "b22_binding_energy" && (
        <div>
          <div style={{ border: "1px solid #d0d7de", background: "#ffffff", padding: "14px", marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 8px", fontSize: "15.5px" }}>
              Hình 22.3 · Đồ thị năng lượng liên kết riêng Eₗₖᵣ = Eₗₖ / A theo số khối A (SGK tr. 100)
            </h4>
            <svg
              viewBox="0 0 640 215"
              width="640"
              height="215"
              role="img"
              aria-label="Hình 22.3 đồ thị năng lượng liên kết riêng E_lkr bằng E_lk chia A theo số khối A: vùng bền vững 50 nhỏ hơn A nhỏ hơn 95 đạt đỉnh khoảng 8,8 MeV trên nucleon quanh Fe-56 đến Y-89"
              style={{ width: "100%", height: "auto", display: "block" }}
            >
              <line x1="62" y1="180" x2="615" y2="180" stroke="#525252" strokeWidth="1.4" />
              <line x1="62" y1="180" x2="62" y2="20" stroke="#525252" strokeWidth="1.4" />
              <rect x="148" y="24" width="150" height="156" fill="#defbe6" opacity="0.55" />
              <path
                d="M 68 164 L 74 62 L 88 88 L 102 56 L 154 40 Q 205 34 268 39 Q 392 49 596 67"
                fill="none"
                stroke="#0f62fe"
                strokeWidth="2.8"
              />
              <circle cx="188" cy="36" r="5" fill="#198038" />
              <text x="196" y="34" fill="#198038" fontSize="12" fontWeight="700">
                ⁵⁶₂₆Fe – ⁸⁹₃₉Y (Eₗₖᵣ ≈ 8,8 MeV/nucleon · Bền nhất)
              </text>
              <text x="78" y="54" fill="#0f62fe" fontSize="11.5" fontWeight="700">⁴₂He</text>
              <text x="518" y="60" fill="#161616" fontSize="11.5" fontWeight="700">²³⁵₉₂U (Eₗₖᵣ ≈ 7,6 MeV)</text>
              <text x="70" y="152" fill="#8e6a00" fontSize="11.5" fontWeight="700">Tổng hợp hạt nhân ↗</text>
              <text x="424" y="94" fill="#002d9c" fontSize="11.5" fontWeight="700">↖ Phân hạch hạt nhân</text>
              <text x="522" y="200" fill="#525252" fontSize="12">Số khối A →</text>
              <text x="8" y="18" fill="#525252" fontSize="12" fontWeight="700">Eₗₖᵣ = Eₗₖ/A (MeV/nucleon)</text>
            </svg>
          </div>

          <div
            style={{
              padding: "12px 14px",
              background: "#f8fafc",
              border: "1px solid #d0d7de",
              marginBottom: "16px",
              fontSize: "13.5px",
              lineHeight: 1.6,
            }}
          >
            <strong>Liên hệ Hình 22.5 SGK (Độ hụt khối Δm &amp; Năng lượng liên kết Eₗₖ):</strong>{" "}
            Khi cân tổng khối lượng các nucleon riêng rẽ <code>M = Z·m_p + (A − Z)·m_n</code> (đĩa cân <code>P</code>) so với khối lượng hạt nhân tạo thành <code>m_X</code> (đĩa cân <code>Q</code> trên hệ <code>M, N, T, Q, P</code>), ta luôn có <code>M &gt; m_X</code>. Độ hụt khối{" "}
            <code>Δm = [Z·m_p + (A − Z)·m_n] − m_X</code> ứng với <strong>năng lượng liên kết</strong>{" "}
            <code>Eₗₖ = Δm·c²</code> (năng lượng tối thiểu cần cung cấp để tách hạt nhân thành các nucleon riêng lẻ). Độ bền vững của hạt nhân được quyết định bởi <strong>năng lượng liên kết riêng</strong>{" "}
            <code>Eₗₖᵣ = Eₗₖ / A</code>.
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
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div style={{ border: "1px solid #a6c8ff", background: "#edf5ff", padding: "12px 14px" }}>
              <strong style={{ display: "block", color: "#002d9c", marginBottom: "4px" }}>
                Phản ứng tổng hợp hạt nhân đầu tiên (Oliphant, 1934 · SGK tr. 102)
              </strong>
              <p style={{ margin: 0, fontSize: "13.5px", lineHeight: 1.55 }}>
                Dùng máy gia tốc bắn hạt nhân deuterium vào bia chứa deuterium:{" "}
                <strong>
                  <Nuclide sym="H" a={2} z={1} /> + <Nuclide sym="H" a={2} z={1} /> →{" "}
                  <Nuclide sym="He" a={3} z={2} /> + <Nuclide sym="n" a={1} z={0} />
                </strong>{" "}
                (tỏa năng lượng cỡ <code>3,3 – 4,0 MeV</code> mỗi phản ứng).
              </p>
            </div>
            <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
              <strong style={{ display: "block", marginBottom: "4px" }}>
                Ba điều kiện thực hiện phản ứng nhiệt hạch (SGK tr. 103)
              </strong>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13.5px", lineHeight: 1.55 }}>
                <li>
                  Nhiệt độ cực cao cỡ <code>10⁷ – 10⁸ K</code> để vật chất chuyển sang trạng thái <strong>plasma</strong> và thắng lực đẩy tĩnh điện Coulomb.
                </li>
                <li>Mật độ hạt nhân trong plasma phải đủ lớn.</li>
                <li>Thời gian duy trì trạng thái plasma ở nhiệt độ cao phải đủ dài (tích mật độ × thời gian giam giữ đủ lớn).</li>
              </ul>
            </div>
          </div>

          <FixedPhysicsActivityRenderer
            activityKey="nuclear_fusion"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {section.kind === "b22_after_transfer" &&
        (() => {
          const b22AfterChoice = notebook.afterClassWork?.b22AfterChoice ?? "";
          const b22NeutronCount = notebook.afterClassWork?.b22NeutronCount ?? "";
          const b22ReasonNote = notebook.afterClassWork?.b22ReasonNote ?? "";
          const b22Checked = Boolean(notebook.afterClassWork?.b22Checked) || b22AfterCheckedLocal;
          const kOk = Number(b22NeutronCount.trim()) === 2;
          const choiceOk = b22AfterChoice === "correct";
          const noteOk = b22ReasonNote.trim().length >= 8;
          const allB22AfterOk = kOk && choiceOk && noteOk;

          return (
            <div style={{ border: "1px solid #d0d7de", padding: "16px", background: "#ffffff" }}>
              <h4 style={{ margin: "0 0 10px", fontSize: "16px" }}>
                Kiểm tra, đánh giá Pha 3: Bảo toàn số nucleon A và lập luận từ đồ thị Eₗₖᵣ = Eₗₖ / A
              </h4>

              <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "14px" }}>
                1. Cho phản ứng phân hạch:{" "}
                <Nuclide sym="n" a={1} z={0} /> + <Nuclide sym="U" a={235} z={92} /> →{" "}
                <Nuclide sym="Mo" a={95} z={42} /> + <Nuclide sym="La" a={139} z={57} /> +{" "}
                <code>k</code>·<Nuclide sym="n" a={1} z={0} /> + 7·<Nuclide sym="e" a={0} z={-1} />. Giá trị số neutron thứ cấp <code>k</code> bằng bao nhiêu?
                <input
                  type="number"
                  inputMode="numeric"
                  value={b22NeutronCount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setB22AfterCheckedLocal(false);
                    patchNotebook((cur) => ({
                      ...cur,
                      afterClassWork: { ...cur.afterClassWork, b22NeutronCount: val, b22Checked: false },
                    }));
                  }}
                  placeholder="Tính từ 1 + 235 = 95 + 139 + k…"
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

              <fieldset style={{ border: "none", padding: 0, margin: "0 0 12px" }}>
                <legend style={{ margin: "0 0 8px", fontWeight: 700, fontSize: "14px" }}>
                  2. Dựa vào đồ thị năng lượng liên kết riêng <code>Eₗₖᵣ = Eₗₖ / A</code> (Hình 22.3), vì sao cả phân hạch{" "}
                  <Nuclide sym="U" a={235} z={92} /> lẫn tổng hợp <Nuclide sym="H" a={2} z={1} /> +{" "}
                  <Nuclide sym="H" a={3} z={1} /> đều tỏa năng lượng lớn?
                </legend>
                {[
                  [
                    "correct",
                    "Vì các hạt nhân tạo thành sau phản ứng đều dịch chuyển về vùng số khối trung bình có năng lượng liên kết riêng Eₗₖᵣ lớn hơn các hạt nhân ban đầu (tổng độ hụt khối tăng, tổng khối lượng nghỉ giảm).",
                  ],
                  [
                    "wrong1",
                    "Vì tổng số nucleon A sau phản ứng bị hụt đi để biến thành năng lượng.",
                  ],
                  [
                    "wrong2",
                    "Vì các hạt nhân sản phẩm có năng lượng liên kết riêng Eₗₖᵣ nhỏ hơn hạt nhân ban đầu.",
                  ],
                ].map(([val, label]) => (
                  <label key={val} style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "14px", cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="b22-after"
                      checked={b22AfterChoice === val}
                      onChange={() => {
                        setB22AfterCheckedLocal(false);
                        patchNotebook((cur) => ({
                          ...cur,
                          afterClassWork: { ...cur.afterClassWork, b22AfterChoice: val, b22Checked: false },
                        }));
                      }}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </fieldset>

              <label
                htmlFor="b22-after-reason"
                style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
              >
                3. Viết ngắn gọn nhận xét của em đối chiếu với dự đoán ở Pha 1 (vì sao phản ứng hạt nhân tạo ra nguyên tố mới và tỏa năng lượng):
              </label>
              <textarea
                id="b22-after-reason"
                className={styles.evidenceTextarea}
                rows={2}
                value={b22ReasonNote}
                onChange={(e) => {
                  const val = e.target.value;
                  setB22AfterCheckedLocal(false);
                  patchNotebook((cur) => ({
                    ...cur,
                    afterClassWork: { ...cur.afterClassWork, b22ReasonNote: val, b22Checked: false },
                  }));
                }}
                placeholder="Ví dụ: Tổng A và Z bảo toàn nhưng các nucleon sắp xếp lại thành hạt nhân có Eₗₖᵣ cao hơn nên phần khối lượng nghỉ giảm đi tỏa ra thành năng lượng…"
              />

              <div style={{ marginTop: "10px" }}>
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                  onClick={() => {
                    setB22AfterCheckedLocal(true);
                    patchNotebook((cur) => ({
                      ...cur,
                      afterClassWork: { ...cur.afterClassWork, b22Checked: true },
                    }));
                    if (allB22AfterOk) onMarkSectionComplete(section.id, true);
                  }}
                >
                  Kiểm tra &amp; lưu đáp án Bài 22
                </button>
              </div>

              {b22Checked && (
                <p
                  role="status"
                  style={{
                    margin: "10px 0 0",
                    fontWeight: 600,
                    color: allB22AfterOk ? "#198038" : "#b42332",
                  }}
                >
                  {allB22AfterOk
                    ? "✓ Chính xác! k = 236 − (95 + 139) = 2 neutron; hạt nhân sản phẩm có Eₗₖᵣ cao hơn nên bền vững hơn và tỏa năng lượng."
                    : "Kiểm tra lại: bảo toàn số khối 1 + 235 = 95 + 139 + k ⇒ k = 2, chọn đúng chiều tăng Eₗₖᵣ và ghi ít nhất một câu nhận xét."}
                </p>
              )}
            </div>
          );
        })()}

      {/* ====================================================================
          BÀI 23 — HIỆN TƯỢNG PHÓNG XẠ (BẢNG 23.1 SGK TR. 105 & BIỂN HÌNH 23.8)
          ==================================================================== */}
      {section.kind === "b23_cloud_geiger" &&
        (() => {
          const lockedB23Label = B23_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          const c5to10 = notebook.preClassWork?.b23Count5to10 ?? "";
          const c15to20 = notebook.preClassWork?.b23Count15to20 ?? "";
          const b23SelfCheck = notebook.preClassWork?.selfCheckChoice ?? "";
          const b23SelfOpt = B23_PRE_SELF_CHECK_OPTIONS.find(
            (o) => o.id === b23SelfCheck
          );
          const checkB23PreReady = (
            nb: StudentLessonNotebook,
            ov5?: string,
            ov15?: string,
            selfOv?: string
          ) => {
            const hasP = Boolean(
              (nb.initialPredictionChoice ?? nb.preClassPredictionChoice ?? "").trim()
            );
            const hasR = Boolean(
              (nb.initialPredictionReason ?? nb.preClassPredictionReason ?? "").trim()
            );
            const v5 = (ov5 ?? nb.preClassWork?.b23Count5to10 ?? "").trim();
            const v15 = (ov15 ?? nb.preClassWork?.b23Count15to20 ?? "").trim();
            const countsOk = v5 === "3" && v15 === "0";
            const sc = selfOv ?? nb.preClassWork?.selfCheckChoice ?? "";
            return (
              hasP &&
              hasR &&
              countsOk &&
              sc === "random_not_predictable_single"
            );
          };
          const b23Ready = checkB23PreReady(notebook);

          return (
            <div>
              {/* Bước 1: Câu hỏi mở đầu gắn với Bảng 23.1 */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 1 · Câu hỏi mở đầu từ phép đếm xung phóng xạ (Bảng 23.1 · SGK tr. 105)
                </h4>
                <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.6 }}>
                  Đặt một mẫu phóng xạ cố định trước cửa sổ ống đếm Geiger–Müller và ghi lại số xung đếm được trong các khoảng thời gian bằng nhau (mỗi khoảng 5 giây) liên tiếp.
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
                    “Vì sao cùng một nguồn phóng xạ đứng yên mà khoảng 5–10 s máy đếm ghi 3 xung nhưng khoảng 15–20 s lại ghi 0 xung?”
                  </em>
                </div>
              </section>

              {/* Bước 2: Ống đếm Geiger–Müller Hình 23.2 + Vết buồng sương + Bảng 23.1 chuẩn SGK */}
              <section style={{ marginBottom: "18px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "16px" }}>
                  Bước 2 · Sơ đồ ống đếm Geiger–Müller (Hình 23.2) và Bảng 23.1 số liệu thực nghiệm SGK
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
                    “So sánh số xung trong hai khoảng thời gian 5 giây bằng nhau (ví dụ 5–10 s và 15–20 s) trên Bảng 23.1”
                  </em>
                  .
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "14px",
                    marginBottom: "14px",
                  }}
                >
                  {/* Sơ đồ cấu tạo ống đếm Geiger–Müller Hình 23.2 SGK tr. 104 + Vết buồng sương */}
                  <figure className={styles.darkBenchStage} style={{ margin: 0 }}>
                    <svg
                      viewBox="0 0 420 220"
                      width="420"
                      height="220"
                      role="img"
                      aria-label="Hình 23.2 cấu tạo ống đếm Geiger-Müller và vết buồng sương: tia phóng xạ đi qua cửa sổ mica làm ion hóa chất khí giữa vỏ cathode và dây anode điện áp cao tạo ra xung điện gửi tới bộ đếm"
                      style={{ width: "100%", height: "auto", display: "block" }}
                    >
                      <rect x="0" y="0" width="420" height="220" fill="#0b1220" />
                      {/* Nguồn phóng xạ */}
                      <rect x="16" y="42" width="48" height="30" rx="3" fill="#334155" stroke="#cbd5e1" />
                      <text x="23" y="61" fill="#ffffff" fontSize="11" fontWeight="700">Nguồn</text>
                      <line x1="66" y1="57" x2="118" y2="57" stroke="#facc15" strokeWidth="2.5" strokeDasharray="4 3" />

                      {/* Ống trụ Cathode (-) */}
                      <rect x="116" y="30" width="180" height="54" rx="8" fill="#121b2e" stroke="#38bdf8" strokeWidth="2.2" />
                      {/* Cửa sổ mỏng */}
                      <line x1="116" y1="36" x2="116" y2="78" stroke="#fde047" strokeWidth="3.5" />
                      {/* Dây Anode (+) ở trục */}
                      <line x1="130" y1="57" x2="318" y2="57" stroke="#fb7185" strokeWidth="2.4" />
                      {/* Ion hóa thác lũ */}
                      <text x="152" y="49" fill="#86efac" fontSize="11" fontWeight="700">e⁻ / ion⁺ (ion hóa khí)</text>
                      <text x="128" y="22" fill="#7dd3fc" fontSize="11.5" fontWeight="700">
                        Hình 23.2 · Ống đếm Geiger–Müller (Cathode − / Anode +)
                      </text>

                      {/* Mạch tạo xung & Bộ đếm số */}
                      <rect x="320" y="36" width="84" height="42" rx="4" fill="#1e293b" stroke="#94a3b8" />
                      <text x="330" y="54" fill="#facc15" fontSize="11" fontWeight="700">1 hạt → 1 xung</text>
                      <text x="330" y="70" fill="#e2e8f0" fontSize="10.5">Bộ đếm xung</text>

                      {/* Nửa dưới: Vết buồng sương tia α vs tia β */}
                      <line x1="16" y1="108" x2="404" y2="108" stroke="#263552" strokeWidth="1" />
                      <text x="18" y="128" fill="#fda4af" fontSize="11.5" fontWeight="700">
                        Vết buồng sương tia α: Dày, thẳng (ion hóa rất mạnh)
                      </text>
                      <line x1="20" y1="142" x2="178" y2="140" stroke="#fb7185" strokeWidth="4.5" strokeLinecap="round" />
                      <text x="18" y="172" fill="#7dd3fc" fontSize="11.5" fontWeight="700">
                        Vết buồng sương tia β: Mảnh, gấp khúc (hạt nhẹ dễ lệch)
                      </text>
                      <polyline
                        points="20,190 72,184 126,198 184,184 248,200 318,186 388,196"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.8"
                      />
                    </svg>
                    <figcaption className={styles.darkBenchCaption}>
                      <strong>Nguyên lí ống Geiger–Müller (SGK tr. 104):</strong> Mỗi hạt phóng xạ đi qua cửa sổ mỏng làm ion hóa chất khí trong điện trường mạnh giữa Anode (+) và Cathode (−), tạo thành <strong>một xung điện</strong> báo về máy đếm.
                    </figcaption>
                  </figure>

                  {/* Bảng 23.1 chuẩn SGK tr. 105 */}
                  <div className={styles.tableScroll} style={{ margin: 0 }}>
                    <table className={styles.cdsTable}>
                      <caption>
                        Bảng 23.1 — Số liệu thực nghiệm SGK tr. 105 (tách biệt với lượt chạy mô phỏng)
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Khoảng thời gian (s)</th>
                          <th scope="col" className={styles.numCell}>Số xung đếm được</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SGK_TABLE_23_1.map((row) => {
                          const isHighlight =
                            row.windowSeconds === "5 – 10" || row.windowSeconds === "15 – 20";
                          return (
                            <tr
                              key={row.windowSeconds}
                              style={
                                isHighlight ? { background: "#fcf4d6", fontWeight: 700 } : undefined
                              }
                            >
                              <td>{row.windowSeconds}</td>
                              <td className={styles.numCell}>{row.counts}</td>
                            </tr>
                          );
                        })}
                        <tr style={{ background: "#f4f4f4", fontWeight: 700 }}>
                          <td>Tổng cộng trong 30 s</td>
                          <td className={styles.numCell}>10 xung</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {b21VideoLesson && (
                  <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "13.5px", lineHeight: 1.55 }}>
                      <strong>Tư liệu video bổ trợ Pha 1 Bài 23:</strong> Phân biệt số xung ngẫu nhiên ghi nhận trong từng khoảng đo ngắn với đường cong kì vọng khi mẫu rất lớn.{" "}
                      <span style={{ color: "#002d9c", fontWeight: 600 }}>
                        Nếu chưa xem video, học sinh vẫn hoàn thành trọn vẹn Pha 1 từ sơ đồ Hình 23.2 và Bảng 23.1 ngay trên trang
                      </span>{" "}
                      (mở hoặc phát video không tự tính hoàn thành).
                    </p>
                    <NuclearLessonVideo lesson={b21VideoLesson} />
                  </div>
                )}
              </section>

              {/* Bước 3: Khóa dự đoán ban đầu + lí do */}
              <section
                style={{
                  border: "1px solid #8d8d8d",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 6px", fontSize: "16px" }}>
                  Bước 3 · Ghi và khóa dự đoán ban đầu kèm lí do
                </h4>
                {lockedB23Label && (
                  <div
                    style={{
                      marginBottom: "12px",
                      padding: "10px 12px",
                      background: "#fcf4d6",
                      borderLeft: "4px solid #8e6a00",
                      fontSize: "13.5px",
                    }}
                  >
                    <strong>Dự đoán ban đầu đã khóa:</strong> “{lockedB23Label}”
                    {lockedInitialReason ? <span> — <em>Lí do: {lockedInitialReason}</em></span> : null}
                  </div>
                )}
                <fieldset style={{ border: "none", margin: "0 0 12px", padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
                    Chọn dự đoán của em để giải thích sự chênh lệch số xung trên Bảng 23.1:
                  </legend>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {B23_PREDICTION_CHOICES.map((opt) => (
                      <label
                        key={opt.id}
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                          padding: "10px 12px",
                          border: predChoice === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                          background: predChoice === opt.id ? "#edf5ff" : "#fafafa",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        <input
                          type="radio"
                          name="b23-pre-prediction"
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
                <label htmlFor="b23-pre-reason" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                  Lí do cho dự đoán của em (bắt buộc):
                </label>
                <textarea
                  id="b23-pre-reason"
                  className={styles.evidenceTextarea}
                  rows={2}
                  value={predReason}
                  onChange={(e) => {
                    setPredReasonDraft(e.target.value);
                    setPredSavedMsg("");
                  }}
                  placeholder="Giải thích vì sao sau khoảng 15–20 s có 0 xung thì khoảng 20–25 s lại xuất hiện 3 xung…"
                />
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "10px" }}>
                  <button
                    type="button"
                    className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                    onClick={() => {
                      if (!predChoice || !predReason.trim()) {
                        setPredSavedMsg("Em hãy chọn dự đoán và ghi rõ lí do trước khi lưu.");
                        return;
                      }
                      onSavePreClassPrediction(predChoice, predReason.trim());
                      const updated = recordPreClassPrediction(notebook, predChoice, predReason.trim());
                      if (checkB23PreReady(updated)) onMarkSectionComplete(section.id, true);
                      setPredSavedMsg("Đã lưu và khóa dự đoán ban đầu cho Bài 23.");
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

              {/* Bước 4: Thao tác nhỏ đọc cặp số liệu trên Bảng 23.1 */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 4 · Thao tác đọc cặp số liệu trên Bảng 23.1 SGK tr. 105
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                  }}
                >
                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                    Số xung đếm được trong khoảng <code>5 – 10 s</code> (xung):
                    <input
                      type="number"
                      inputMode="numeric"
                      value={c5to10}
                      onChange={(e) => {
                        const val = e.target.value;
                        patchNotebook((cur) => ({
                          ...cur,
                          preClassWork: { ...cur.preClassWork, b23Count5to10: val },
                        }));
                        if (checkB23PreReady(notebook, val, undefined)) {
                          onMarkSectionComplete(section.id, true);
                        }
                      }}
                      placeholder="Đọc dòng 5 – 10 s…"
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: "6px",
                        minHeight: "40px",
                        padding: "6px 10px",
                        border: "1px solid #8d8d8d",
                        fontSize: "14.5px",
                      }}
                    />
                  </label>
                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                    Số xung đếm được trong khoảng <code>15 – 20 s</code> (xung):
                    <input
                      type="number"
                      inputMode="numeric"
                      value={c15to20}
                      onChange={(e) => {
                        const val = e.target.value;
                        patchNotebook((cur) => ({
                          ...cur,
                          preClassWork: { ...cur.preClassWork, b23Count15to20: val },
                        }));
                        if (checkB23PreReady(notebook, undefined, val)) {
                          onMarkSectionComplete(section.id, true);
                        }
                      }}
                      placeholder="Đọc dòng 15 – 20 s…"
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: "6px",
                        minHeight: "40px",
                        padding: "6px 10px",
                        border: "1px solid #8d8d8d",
                        fontSize: "14.5px",
                      }}
                    />
                  </label>
                </div>
                {(c5to10 !== "" || c15to20 !== "") && (
                  <small
                    style={{
                      display: "block",
                      marginTop: "8px",
                      fontWeight: 600,
                      color: c5to10.trim() === "3" && c15to20.trim() === "0" ? "#198038" : "#b42332",
                    }}
                  >
                    {c5to10.trim() === "3" && c15to20.trim() === "0"
                      ? "✓ Đã đọc chính xác hai dòng thực nghiệm Bảng 23.1 (5–10 s: 3 xung; 15–20 s: 0 xung)."
                      : "Hãy đối chiếu lại đúng cột Số xung đếm được ở dòng 5 – 10 s và 15 – 20 s của Bảng 23.1."}
                  </small>
                )}
              </section>

              {/* Bước 5: Câu tự kiểm tra có phản hồi */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 5 · Câu tự kiểm tra trước giờ học
                </h4>
                <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>
                    Từ số liệu thực nghiệm Bảng 23.1 SGK tr. 105, ta rút ra kết luận nào về sự phân rã phóng xạ?
                  </legend>
                  {B23_PRE_SELF_CHECK_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-start",
                        padding: "10px 12px",
                        marginBottom: "8px",
                        border: b23SelfCheck === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                        background: b23SelfCheck === opt.id ? "#edf5ff" : "#fafafa",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      <input
                        type="radio"
                        name="b23-pre-selfcheck"
                        checked={b23SelfCheck === opt.id}
                        onChange={() => {
                          patchNotebook((cur) => ({
                            ...cur,
                            preClassWork: { ...cur.preClassWork, selfCheckChoice: opt.id },
                          }));
                          if (checkB23PreReady(notebook, undefined, undefined, opt.id)) {
                            onMarkSectionComplete(section.id, true);
                          }
                        }}
                        style={{ marginTop: "3px" }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </fieldset>
                {b23SelfOpt && (
                  <div
                    role="status"
                    style={{
                      marginTop: "8px",
                      padding: "10px 14px",
                      background:
                        b23SelfOpt.id === "random_not_predictable_single" ? "#defbe6" : "#fff1f1",
                      borderLeft:
                        b23SelfOpt.id === "random_not_predictable_single"
                          ? "4px solid #198038"
                          : "4px solid #b42332",
                      fontSize: "13.5px",
                      lineHeight: 1.55,
                    }}
                  >
                    {b23SelfOpt.feedback}
                  </div>
                )}
              </section>

              {/* Bước 6: Sản phẩm mang vào lớp + Mô phỏng trải nghiệm thêm */}
              <section
                style={{
                  border: "2px solid #0f62fe",
                  background: "#edf5ff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "#002d9c" }}>
                    Sản phẩm mang vào lớp · Bài 23
                  </h4>
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      background: b23Ready ? "#defbe6" : "#fcf4d6",
                      color: b23Ready ? "#198038" : "#8e6a00",
                    }}
                  >
                    {b23Ready
                      ? "✓ Đã hoàn thành Pha 1 Bài 23"
                      : "Cần đủ: Dự đoán + lí do, cặp số Bảng 23.1 và câu tự kiểm tra"}
                  </span>
                </div>
                <ul style={{ margin: "0 0 12px", paddingLeft: "18px", fontSize: "14px", lineHeight: 1.6 }}>
                  <li>
                    <strong>Dự đoán ban đầu:</strong> {lockedB23Label ? `“${lockedB23Label}”` : "Chưa lưu"}
                  </li>
                  <li>
                    <strong>Cặp số liệu Bảng 23.1:</strong>{" "}
                    {c5to10.trim() === "3" && c15to20.trim() === "0"
                      ? "5–10 s: 3 xung vs 15–20 s: 0 xung (tổng 10 xung/30 s)"
                      : "Chưa đọc đúng hai khoảng mẫu"}
                  </li>
                </ul>
                <label htmlFor="b23-bring-q" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                  Câu hỏi muốn kiểm chứng ở Pha 2:
                </label>
                <input
                  id="b23-bring-q"
                  type="text"
                  value={bringToClassQuestion}
                  onChange={(e) => {
                    const val = e.target.value;
                    patchNotebook((cur) => ({
                      ...cur,
                      preClassWork: { ...cur.preClassWork, bringToClassQuestion: val },
                    }));
                  }}
                  placeholder="Ví dụ: Nếu có hàng tỉ tỉ hạt nhân cùng phân rã ngẫu nhiên thì đồ thị theo thời gian có trơn mượt không?"
                  style={{
                    width: "100%",
                    minHeight: "40px",
                    padding: "8px 10px",
                    border: "1px solid #8d8d8d",
                    background: "#ffffff",
                    fontSize: "14px",
                    marginBottom: "10px",
                  }}
                />
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                  onClick={() => onJumpToSection("b23-radiation-types")}
                >
                  Chuyển sang Pha 2 (Trong giờ học) →
                </button>
              </section>

              <details style={{ border: "1px solid #d0d7de", background: "#ffffff", padding: "12px 14px" }}>
                <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "14px" }}>
                  Thử nghiệm bổ trợ: Mô phỏng xung ngẫu nhiên ống đếm Geiger (tách biệt với số liệu thật Bảng 23.1)
                </summary>
                <div style={{ marginTop: "12px" }}>
                  <FixedPhysicsActivityRenderer
                    activityKey="geiger_random_decay"
                    onProgress={(done) => {
                      if (done && checkB23PreReady(notebook)) {
                        onMarkSectionComplete(section.id, true);
                      }
                    }}
                  />
                </div>
              </details>
            </div>
          );
        })()}

      {section.kind === "b23_radiation_types" &&
        (() => {
          const lockedB23Label = B23_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          return (
            <div>
              <Phase2ProductEchoCard
                preSectionId="b23-cloud-geiger"
                lockedChoiceLabel={lockedB23Label}
                lockedReason={lockedInitialReason}
                actionSummary={`Đã đối chiếu Bảng 23.1 SGK (5–10 s: ${notebook.preClassWork?.b23Count5to10 || "—"} xung; 15–20 s: ${notebook.preClassWork?.b23Count15to20 || "—"} xung)`}
                bringQuestion={bringToClassQuestion}
                onJumpToSection={onJumpToSection}
              />
              <FixedPhysicsActivityRenderer
                activityKey="radiation_properties"
                onProgress={(done) => onMarkSectionComplete(section.id, done)}
              />
            </div>
          );
        })()}

      {section.kind === "b23_half_life" &&
        (() => {
          const lockedB23Label = B23_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          return (
            <div>
              <Phase2ProductEchoCard
                preSectionId="b23-cloud-geiger"
                lockedChoiceLabel={lockedB23Label}
                lockedReason={lockedInitialReason}
                actionSummary="Liên kết từ thăng giáng ngẫu nhiên ở Bảng 23.1 (Pha 1) sang quy luật hàm mũ khi số hạt N₀ rất lớn"
                bringQuestion={bringToClassQuestion}
                onJumpToSection={onJumpToSection}
              />

              {/* Bảng phân biệt rõ N(t) và H(t) */}
              <div className={styles.tableScroll}>
                <table className={styles.cdsTable}>
                  <caption>
                    Phân biệt số hạt nhân chưa phân rã N(t) và độ phóng xạ H(t) (SGK tr. 108–110)
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Đại lượng</th>
                      <th scope="col">Ý nghĩa vật lí</th>
                      <th scope="col">Công thức theo thời gian t</th>
                      <th scope="col">Đơn vị chuẩn SI</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Số hạt nhân còn lại N(t)</th>
                      <td>Tổng số hạt nhân mẹ <strong>chưa bị phân rã</strong> còn tồn tại trong mẫu ở thời điểm <code>t</code>.</td>
                      <td>
                        <code>N(t) = N₀ · 2^(−t/T) = N₀ · e^(−λt)</code>
                      </td>
                      <td>Hạt nhân (không thứ nguyên)</td>
                    </tr>
                    <tr>
                      <th scope="row">Độ phóng xạ H(t)</th>
                      <td>Đặc trưng cho tính phóng xạ mạnh hay yếu, bằng <strong>số phân rã trong 1 giây</strong>: <code>H(t) = −dN/dt = λ·N(t)</code>.</td>
                      <td>
                        <code>H(t) = H₀ · 2^(−t/T) = (ln 2 / T) · N(t)</code>
                      </td>
                      <td>
                        <strong>Becquerel (Bq)</strong>: <code>1 Bq = 1 phân rã/s</code> (lưu ý đổi <code>T</code> ra giây!)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Trích Bảng 23.2 chu kì bán rã một số đồng vị phóng xạ tiêu biểu SGK tr. 108 */}
              <div className={styles.tableScroll}>
                <table className={styles.cdsTable}>
                  <caption>
                    Trích Bảng 23.2 — Chu kì bán rã T của một số đồng vị phóng xạ tiêu biểu (SGK tr. 108)
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Đồng vị</th>
                      <th scope="col">Kí hiệu</th>
                      <th scope="col" className={styles.numCell}>Chu kì bán rã T</th>
                      <th scope="col">Tia phát ra &amp; ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SGK_TABLE_23_2_SAMPLES.map((item) => (
                      <tr key={`${item.sym}-${item.a}`}>
                        <th scope="row">{item.name}</th>
                        <td>
                          <Nuclide sym={item.sym} a={item.a} z={item.z} />
                        </td>
                        <td className={styles.numCell}>{item.halfLife}</td>
                        <td>{item.radiation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <FixedPhysicsActivityRenderer
                activityKey="radioactive_decay_half_life"
                onProgress={(done) => onMarkSectionComplete(section.id, done)}
              />
            </div>
          );
        })()}

      {section.kind === "b23_safety" && (
        <div>
          {/* Hai biển cảnh báo phóng xạ chuẩn Hình 23.8a & Hình 23.8b SGK tr. 111–112 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "14px",
              marginBottom: "18px",
            }}
          >
            <figure
              style={{
                margin: 0,
                border: "1px solid #d0d7de",
                background: "#ffffff",
                padding: "14px",
                textAlign: "center",
              }}
            >
              <svg
                viewBox="0 0 220 170"
                width="220"
                height="170"
                role="img"
                aria-label="Hình 23.8a biển cảnh báo khu vực có chất phóng xạ: hình tam giác đều nền vàng viền đen, ở giữa là biểu tượng cánh quạt 3 cánh màu đen quanh chấm tròn tâm"
                style={{ width: "100%", maxWidth: "210px", height: "auto" }}
              >
                <polygon
                  points="110,14 202,156 18,156"
                  fill="#facc15"
                  stroke="#161616"
                  strokeWidth="7"
                  strokeLinejoin="round"
                />
                {/* Biểu tượng trefoil 3 cánh phóng xạ */}
                <circle cx="110" cy="110" r="8" fill="#161616" />
                <path d="M110,110 L90,76 A38,38 0 0,1 130,76 Z" fill="#161616" />
                <path d="M110,110 L149,112 A38,38 0 0,1 127,144 Z" fill="#161616" />
                <path d="M110,110 L93,144 A38,38 0 0,1 71,112 Z" fill="#161616" />
                <circle cx="110" cy="110" r="13" fill="none" stroke="#facc15" strokeWidth="4" />
              </svg>
              <figcaption style={{ fontSize: "13px", lineHeight: 1.5, marginTop: "6px", textAlign: "left" }}>
                <strong>Hình 23.8a (Biển cảnh báo phóng xạ thông thường · SGK tr. 111):</strong> Tam giác nền vàng viền đen với biểu tượng 3 cánh — cảnh báo nơi có nguồn phóng xạ hoặc bức xạ ion hóa, không tự ý tiếp cận.
              </figcaption>
            </figure>

            <figure
              style={{
                margin: 0,
                border: "1px solid #d0d7de",
                background: "#ffffff",
                padding: "14px",
                textAlign: "center",
              }}
            >
              <svg
                viewBox="0 0 220 170"
                width="220"
                height="170"
                role="img"
                aria-label="Hình 23.8b biển cảnh báo bổ sung ISO nền đỏ cho nguồn phóng xạ nguy hiểm chết người: phía trên là cánh quạt phát tia, bên trái là đầu lâu xương chéo, bên phải là hình người chạy rời xa theo mũi tên"
                style={{ width: "100%", maxWidth: "210px", height: "auto" }}
              >
                <polygon
                  points="110,14 202,156 18,156"
                  fill="#da1e28"
                  stroke="#161616"
                  strokeWidth="7"
                  strokeLinejoin="round"
                />
                {/* Phía trên: nguồn 3 cánh + các tia bức xạ */}
                <circle cx="110" cy="68" r="11" fill="#161616" />
                <line x1="96" y1="82" x2="82" y2="96" stroke="#161616" strokeWidth="3" />
                <line x1="110" y1="84" x2="110" y2="100" stroke="#161616" strokeWidth="3" />
                <line x1="124" y1="82" x2="138" y2="96" stroke="#161616" strokeWidth="3" />
                {/* Góc trái dưới: biểu tượng nguy hiểm chết người (đầu lâu xương chéo giản lược) */}
                <circle cx="72" cy="124" r="11" fill="#ffffff" stroke="#161616" strokeWidth="2.5" />
                <circle cx="68" cy="122" r="2.2" fill="#161616" />
                <circle cx="76" cy="122" r="2.2" fill="#161616" />
                <line x1="58" y1="138" x2="86" y2="146" stroke="#161616" strokeWidth="3.5" />
                <line x1="86" y1="138" x2="58" y2="146" stroke="#161616" strokeWidth="3.5" />
                {/* Góc phải dưới: người chạy ra xa + mũi tên thoát hiểm */}
                <circle cx="138" cy="112" r="6" fill="#161616" />
                <polyline points="128,124 138,122 146,134 136,146" fill="none" stroke="#161616" strokeWidth="4" />
                <line x1="152" y1="142" x2="176" y2="142" stroke="#ffffff" strokeWidth="4" />
                <polygon points="176,136 186,142 176,148" fill="#ffffff" />
              </svg>
              <figcaption style={{ fontSize: "13px", lineHeight: 1.5, marginTop: "6px", textAlign: "left" }}>
                <strong>Hình 23.8b (Biển cảnh báo nguồn phóng xạ nguy hiểm · ISO / SGK tr. 112):</strong> Tam giác nền đỏ — cảnh báo trực quan <em>“Nguy hiểm – Chạy ra xa ngay lập tức – Không chạm vào!”</em>.
              </figcaption>
            </figure>
          </div>

          <FixedPhysicsActivityRenderer
            activityKey="radiation_safety"
            onProgress={(done) => onMarkSectionComplete(section.id, done)}
          />
        </div>
      )}

      {section.kind === "b23_carbon14" && (
        <FixedPhysicsActivityRenderer
          activityKey="carbon14_dating"
          onProgress={(done) => onMarkSectionComplete(section.id, done)}
        />
      )}

      {/* ====================================================================
          BÀI 24 — CÔNG NGHIỆP HẠT NHÂN (HÌNH 24.1, HÌNH 24.2 & HÌNH 24.5 SGK)
          ==================================================================== */}
      {section.kind === "b24_energy_chain" &&
        (() => {
          const lockedB24Label = B24_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          const loopRoles = notebook.preClassWork?.b24LoopRoles ?? {};
          const matchedLoopCount = B24_LOOP_PARTS.filter(
            (p) => loopRoles[p.code] === p.correctRole
          ).length;
          const b24SelfCheck = notebook.preClassWork?.selfCheckChoice ?? "";
          const b24SelfOpt = B24_PRE_SELF_CHECK_OPTIONS.find(
            (o) => o.id === b24SelfCheck
          );
          const checkB24PreReady = (
            nb: StudentLessonNotebook,
            rolesOv?: typeof loopRoles,
            selfOv?: string
          ) => {
            const hasP = Boolean(
              (nb.initialPredictionChoice ?? nb.preClassPredictionChoice ?? "").trim()
            );
            const hasR = Boolean(
              (nb.initialPredictionReason ?? nb.preClassPredictionReason ?? "").trim()
            );
            const rMap = rolesOv ?? nb.preClassWork?.b24LoopRoles ?? {};
            const loopsOk = B24_LOOP_PARTS.every((p) => rMap[p.code] === p.correctRole);
            const sc = selfOv ?? nb.preClassWork?.selfCheckChoice ?? "";
            return hasP && hasR && loopsOk && sc === "isolated_three_loops";
          };
          const b24Ready = checkB24PreReady(notebook);

          return (
            <div>
              {/* Bước 1: Câu hỏi mở đầu gắn với Hình 24.1 */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 1 · Câu hỏi mở đầu về nhà máy điện hạt nhân (Hình 24.1 · SGK tr. 114–115)
                </h4>
                <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.6 }}>
                  Nhà máy điện hạt nhân khai thác năng lượng tỏa ra từ phản ứng phân hạch dây chuyền có điều khiển trong lò phản ứng để sản xuất điện năng quy mô lớn.
                </p>
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#edf5ff",
                    borderLeft: "4px solid #0f62fe",
                    fontSize: "15px",
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color: "#002d9c", display: "block", marginBottom: "4px" }}>
                    Câu hỏi mở đầu cần suy nghĩ:
                  </strong>
                  <em>“Bộ phận nào thực sự làm quay tua-bin?”</em>
                </div>
              </section>

              {/* Bước 2: Mặt cắt màu Hình 24.1 chuẩn 3 dòng lưu chất tách biệt + Video bổ trợ */}
              <section style={{ marginBottom: "18px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "16px" }}>
                  Bước 2 · Sơ đồ mặt cắt Hình 24.1 SGK và chú giải màu 3 dòng lưu chất tách biệt
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
                    “Lần theo đường ống từ bình sinh hơi đến tua-bin trên Hình 24.1 và kiểm tra xem 3 dòng lưu chất có trộn lẫn vào nhau hay không”
                  </em>
                  .
                </div>

                <figure className={styles.darkBenchStage} style={{ margin: "0 0 14px" }}>
                  <svg
                    viewBox="0 0 720 290"
                    width="720"
                    height="290"
                    role="img"
                    aria-label="Hình 24.1 sơ đồ nhà máy điện hạt nhân với 3 vòng lưu chất tách biệt theo màu: (1) vòng tải nhiệt sơ cấp màu cam đỏ khép kín trong nhà lò bảo vệ, (2) vòng hơi nước và nước ngưng thứ cấp màu xanh dương làm quay tua-bin kéo máy phát điện, (3) nguồn nước làm mát ngoài từ sông biển màu ngọc lam qua bình ngưng"
                    style={{ width: "100%", height: "auto", display: "block" }}
                  >
                    <rect x="0" y="0" width="720" height="290" fill="#0b1220" />

                    {/* Vòm nhà lò bảo vệ (Containment) */}
                    <path
                      d="M 24 236 L 24 82 Q 152 14 280 82 L 280 236 Z"
                      fill="#121b2e"
                      stroke="#94a3b8"
                      strokeWidth="2.5"
                    />
                    <text x="58" y="42" fill="#e2e8f0" fontSize="12" fontWeight="700">
                      Vỏ bảo vệ lò phản ứng
                    </text>

                    {/* Tâm lò phản ứng + thanh điều khiển */}
                    <rect x="50" y="114" width="76" height="96" rx="6" fill="#1e293b" stroke="#f97316" strokeWidth="2.5" />
                    <line x1="72" y1="88" x2="72" y2="148" stroke="#cbd5e1" strokeWidth="4" />
                    <line x1="88" y1="88" x2="88" y2="156" stroke="#cbd5e1" strokeWidth="4" />
                    <line x1="104" y1="88" x2="104" y2="148" stroke="#cbd5e1" strokeWidth="4" />
                    <text x="56" y="182" fill="#fdba74" fontSize="11" fontWeight="700">
                      Tâm lò (²³⁵U)
                    </text>
                    <text x="48" y="82" fill="#cbd5e1" fontSize="10.5">
                      Thanh điều khiển
                    </text>

                    {/* Bình sinh hơi (Steam generator) */}
                    <rect x="176" y="88" width="76" height="126" rx="10" fill="#1e293b" stroke="#60a5fa" strokeWidth="2.2" />
                    <text x="182" y="108" fill="#bfdbfe" fontSize="11" fontWeight="700">
                      Bình sinh hơi
                    </text>

                    {/* VÒNG 1 (MÀU CAM/ĐỎ): Vòng tải nhiệt sơ cấp khép kín */}
                    <path
                      d="M 126 132 L 194 132 Q 232 156 194 184 L 126 184"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="6"
                      strokeLinejoin="round"
                    />
                    <circle cx="152" cy="184" r="9" fill="#ea580c" stroke="#fed7aa" strokeWidth="1.5" />

                    {/* VÒNG 2 (MÀU LAM): Hơi nước áp suất cao quay Tua-bin → Bình ngưng → Bơm hoàn lưu */}
                    <path
                      d="M 214 88 L 214 58 L 392 58 L 392 98"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="6"
                    />
                    <text x="246" y="50" fill="#7dd3fc" fontSize="11.5" fontWeight="700">
                      Hơi nước áp suất cao → quay tua-bin
                    </text>

                    {/* Tua-bin & Máy phát điện */}
                    <polygon
                      points="356,98 432,84 432,140 356,126"
                      fill="#1d4ed8"
                      stroke="#93c5fd"
                      strokeWidth="2"
                    />
                    <text x="370" y="116" fill="#ffffff" fontSize="12" fontWeight="700">
                      Tua-bin
                    </text>
                    <line x1="432" y1="112" x2="474" y2="112" stroke="#facc15" strokeWidth="5" />
                    <rect x="474" y="88" width="84" height="48" rx="4" fill="#1e293b" stroke="#facc15" strokeWidth="2" />
                    <text x="486" y="110" fill="#fde047" fontSize="11.5" fontWeight="700">
                      Máy phát
                    </text>
                    <text x="488" y="126" fill="#f8fafc" fontSize="10.5">
                      điện (~)
                    </text>
                    <line x1="558" y1="104" x2="696" y2="104" stroke="#facc15" strokeWidth="2.2" />
                    <text x="580" y="96" fill="#fde047" fontSize="11" fontWeight="700">
                      Lưới điện
                    </text>

                    {/* Bình ngưng (Condenser) */}
                    <rect x="358" y="164" width="84" height="62" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                    <text x="369" y="182" fill="#cbd5e1" fontSize="11" fontWeight="700">
                      Bình ngưng
                    </text>
                    {/* Hơi từ tua-bin xuống bình ngưng & nước ngưng bơm về bình sinh hơi */}
                    <line x1="396" y1="136" x2="396" y2="164" stroke="#38bdf8" strokeWidth="5" strokeDasharray="5 3" />
                    <path
                      d="M 358 204 L 214 204 L 214 214"
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="5"
                    />

                    {/* VÒNG 3 (MÀU LỤC LAM): Nguồn nước làm mát bên ngoài (sông, hồ, biển) */}
                    <path
                      d="M 692 214 L 418 214 Q 382 198 418 186 L 692 186"
                      fill="none"
                      stroke="#2dd4bf"
                      strokeWidth="5"
                    />
                    <text x="486" y="178" fill="#5eead4" fontSize="11" fontWeight="700">
                      Nước làm mát ngoài (sông, hồ, biển)
                    </text>

                    {/* Bảng chú giải 3 màu lưu chất ở đáy hình */}
                    <rect x="24" y="248" width="672" height="32" rx="3" fill="#121b2e" stroke="#263552" />
                    <rect x="36" y="258" width="16" height="10" fill="#f97316" />
                    <text x="58" y="267" fill="#fed7aa" fontSize="11" fontWeight="600">
                      (1) Vòng tải nhiệt sơ cấp (kín)
                    </text>
                    <rect x="252" y="258" width="16" height="10" fill="#38bdf8" />
                    <text x="274" y="267" fill="#bae6fd" fontSize="11" fontWeight="600">
                      (2) Vòng hơi nước – nước ngưng thứ cấp
                    </text>
                    <rect x="514" y="258" width="16" height="10" fill="#2dd4bf" />
                    <text x="536" y="267" fill="#99f6e4" fontSize="11" fontWeight="600">
                      (3) Nước làm mát ngoài
                    </text>
                  </svg>
                  <figcaption className={styles.darkBenchCaption}>
                    <strong>Hình 24.1 (Sơ đồ nhà máy điện hạt nhân · SGK tr. 114):</strong> Ba dòng lưu chất trao đổi nhiệt qua thành ống kín và <strong>không bao giờ trộn lẫn trực tiếp với nhau</strong>; chính <strong>hơi nước áp suất cao ở vòng thứ cấp (2)</strong> làm quay tua-bin phát điện.
                  </figcaption>
                </figure>

                {b21VideoLesson && (
                  <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "13.5px", lineHeight: 1.55 }}>
                      <strong>Tư liệu video bổ trợ Pha 1 Bài 24:</strong> Quan sát chuỗi chuyển hóa năng lượng từ phân hạch tới điện năng.{" "}
                      <span style={{ color: "#002d9c", fontWeight: 600 }}>
                        Nếu chưa xem video, học sinh vẫn hoàn thành trọn vẹn Pha 1 từ mặt cắt màu Hình 24.1 ngay trên trang
                      </span>{" "}
                      (mở hoặc phát video không tự tính hoàn thành).
                    </p>
                    <NuclearLessonVideo lesson={b21VideoLesson} />
                  </div>
                )}
              </section>

              {/* Bước 3: Khóa dự đoán ban đầu + lí do */}
              <section
                style={{
                  border: "1px solid #8d8d8d",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 6px", fontSize: "16px" }}>
                  Bước 3 · Ghi và khóa dự đoán ban đầu kèm lí do
                </h4>
                {lockedB24Label && (
                  <div
                    style={{
                      marginBottom: "12px",
                      padding: "10px 12px",
                      background: "#fcf4d6",
                      borderLeft: "4px solid #8e6a00",
                      fontSize: "13.5px",
                    }}
                  >
                    <strong>Dự đoán ban đầu đã khóa:</strong> “{lockedB24Label}”
                    {lockedInitialReason ? <span> — <em>Lí do: {lockedInitialReason}</em></span> : null}
                  </div>
                )}
                <fieldset style={{ border: "none", margin: "0 0 12px", padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
                    Trả lời câu hỏi mở đầu: Bộ phận/tác nhân nào thực sự làm quay tua-bin?
                  </legend>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {B24_PREDICTION_CHOICES.map((opt) => (
                      <label
                        key={opt.id}
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                          padding: "10px 12px",
                          border: predChoice === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                          background: predChoice === opt.id ? "#edf5ff" : "#fafafa",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        <input
                          type="radio"
                          name="b24-pre-prediction"
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
                <label htmlFor="b24-pre-reason" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                  Lí do cho dự đoán của em (bắt buộc):
                </label>
                <textarea
                  id="b24-pre-reason"
                  className={styles.evidenceTextarea}
                  rows={2}
                  value={predReason}
                  onChange={(e) => {
                    setPredReasonDraft(e.target.value);
                    setPredSavedMsg("");
                  }}
                  placeholder="Giải thích vì sao không dẫn thẳng chất tải nhiệt từ tâm lò phản ứng ra quay tua-bin…"
                />
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "10px" }}>
                  <button
                    type="button"
                    className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                    onClick={() => {
                      if (!predChoice || !predReason.trim()) {
                        setPredSavedMsg("Em hãy chọn dự đoán và ghi rõ lí do trước khi lưu.");
                        return;
                      }
                      onSavePreClassPrediction(predChoice, predReason.trim());
                      const updated = recordPreClassPrediction(notebook, predChoice, predReason.trim());
                      if (checkB24PreReady(updated)) onMarkSectionComplete(section.id, true);
                      setPredSavedMsg("Đã lưu và khóa dự đoán ban đầu cho Bài 24.");
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

              {/* Bước 4: Thao tác ghép đúng 3 vòng lưu chất trên Hình 24.1 */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 4 · Thao tác ghép đúng vai trò 3 dòng lưu chất trên Hình 24.1 ({matchedLoopCount}/3 đúng)
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {B24_LOOP_PARTS.map((part) => {
                    const sel = loopRoles[part.code] ?? "";
                    const ok = sel === part.correctRole;
                    return (
                      <div
                        key={part.code}
                        style={{
                          padding: "10px 12px",
                          border: sel ? (ok ? "1px solid #198038" : "1px solid #da1e28") : "1px solid #e0e0e0",
                          background: sel ? (ok ? "#defbe6" : "#fff1f1") : "#fafafa",
                        }}
                      >
                        <label
                          htmlFor={`b24-loop-${part.code}`}
                          style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
                        >
                          {part.label}
                        </label>
                        <select
                          id={`b24-loop-${part.code}`}
                          value={sel}
                          onChange={(e) => {
                            const val = e.target.value;
                            const nextRoles = { ...loopRoles, [part.code]: val };
                            patchNotebook((cur) => ({
                              ...cur,
                              preClassWork: { ...cur.preClassWork, b24LoopRoles: nextRoles },
                            }));
                            if (checkB24PreReady(notebook, nextRoles)) {
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
                          {B24_LOOP_ROLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Bước 5: Câu tự kiểm tra có phản hồi */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 5 · Câu tự kiểm tra trước giờ học
                </h4>
                <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>
                    Đối chiếu chú giải màu trên Hình 24.1 SGK, nhận xét nào đúng về an toàn bức xạ trong nhà máy điện hạt nhân?
                  </legend>
                  {B24_PRE_SELF_CHECK_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-start",
                        padding: "10px 12px",
                        marginBottom: "8px",
                        border: b24SelfCheck === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                        background: b24SelfCheck === opt.id ? "#edf5ff" : "#fafafa",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      <input
                        type="radio"
                        name="b24-pre-selfcheck"
                        checked={b24SelfCheck === opt.id}
                        onChange={() => {
                          patchNotebook((cur) => ({
                            ...cur,
                            preClassWork: { ...cur.preClassWork, selfCheckChoice: opt.id },
                          }));
                          if (checkB24PreReady(notebook, undefined, opt.id)) {
                            onMarkSectionComplete(section.id, true);
                          }
                        }}
                        style={{ marginTop: "3px" }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </fieldset>
                {b24SelfOpt && (
                  <div
                    role="status"
                    style={{
                      marginTop: "8px",
                      padding: "10px 14px",
                      background: b24SelfOpt.id === "isolated_three_loops" ? "#defbe6" : "#fff1f1",
                      borderLeft:
                        b24SelfOpt.id === "isolated_three_loops"
                          ? "4px solid #198038"
                          : "4px solid #b42332",
                      fontSize: "13.5px",
                      lineHeight: 1.55,
                    }}
                  >
                    {b24SelfOpt.feedback}
                  </div>
                )}
              </section>

              {/* Bước 6: Sản phẩm mang vào lớp + Mô phỏng dòng truyền năng lượng */}
              <section
                style={{
                  border: "2px solid #0f62fe",
                  background: "#edf5ff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "#002d9c" }}>
                    Sản phẩm mang vào lớp · Bài 24
                  </h4>
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      background: b24Ready ? "#defbe6" : "#fcf4d6",
                      color: b24Ready ? "#198038" : "#8e6a00",
                    }}
                  >
                    {b24Ready
                      ? "✓ Đã hoàn thành Pha 1 Bài 24"
                      : "Cần đủ: Dự đoán + lí do, 3/3 vòng lưu chất và câu tự kiểm tra"}
                  </span>
                </div>
                <ul style={{ margin: "0 0 12px", paddingLeft: "18px", fontSize: "14px", lineHeight: 1.6 }}>
                  <li>
                    <strong>Dự đoán ban đầu:</strong> {lockedB24Label ? `“${lockedB24Label}”` : "Chưa lưu"}
                  </li>
                  <li>
                    <strong>Phân biệt 3 dòng lưu chất Hình 24.1:</strong> {matchedLoopCount}/3 dòng đúng.
                  </li>
                </ul>
                <label htmlFor="b24-bring-q" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                  Câu hỏi muốn tìm hiểu thêm trên lớp:
                </label>
                <input
                  id="b24-bring-q"
                  type="text"
                  value={bringToClassQuestion}
                  onChange={(e) => {
                    const val = e.target.value;
                    patchNotebook((cur) => ({
                      ...cur,
                      preClassWork: { ...cur.preClassWork, bringToClassQuestion: val },
                    }));
                  }}
                  placeholder="Ví dụ: Làm thế nào thanh điều khiển giữ cho lò phản ứng không vượt quá nhiệt độ an toàn?"
                  style={{
                    width: "100%",
                    minHeight: "40px",
                    padding: "8px 10px",
                    border: "1px solid #8d8d8d",
                    background: "#ffffff",
                    fontSize: "14px",
                    marginBottom: "10px",
                  }}
                />
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                  onClick={() => onJumpToSection("b24-reactor-control")}
                >
                  Chuyển sang Pha 2: Điều khiển lò phản ứng →
                </button>
              </section>

              <details style={{ border: "1px solid #d0d7de", background: "#ffffff", padding: "12px 14px" }}>
                <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "14px" }}>
                  Mô phỏng bổ trợ: Khảo sát dòng truyền năng lượng qua lò phản ứng
                </summary>
                <div style={{ marginTop: "12px" }}>
                  <FixedPhysicsActivityRenderer
                    activityKey="nuclear_power_energy_flow"
                    onProgress={(done) => {
                      if (done && checkB24PreReady(notebook)) {
                        onMarkSectionComplete(section.id, true);
                      }
                    }}
                  />
                </div>
              </details>
            </div>
          );
        })()}

      {section.kind === "b24_reactor_control" &&
        (() => {
          const lockedB24Label = B24_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          const loopRoles = notebook.preClassWork?.b24LoopRoles ?? {};
          const matchedLoopCount = B24_LOOP_PARTS.filter(
            (p) => loopRoles[p.code] === p.correctRole
          ).length;

          return (
            <div>
              <Phase2ProductEchoCard
                preSectionId="b24-energy-chain"
                lockedChoiceLabel={lockedB24Label}
                lockedReason={lockedInitialReason}
                actionSummary={`Đã phân biệt ${matchedLoopCount}/3 dòng lưu chất trên Hình 24.1 (hơi nước vòng thứ cấp làm quay tua-bin)`}
                bringQuestion={bringToClassQuestion}
                onJumpToSection={onJumpToSection}
              />

              {/* Ghi chú bể chứa thanh nhiên liệu đã qua sử dụng Hình 24.2 SGK tr. 115 */}
              <div
                style={{
                  padding: "12px 14px",
                  background: "#f8fafc",
                  border: "1px solid #d0d7de",
                  borderLeft: "4px solid #0f62fe",
                  marginBottom: "16px",
                  fontSize: "13.5px",
                  lineHeight: 1.6,
                }}
              >
                <strong>Liên hệ Hình 24.2 SGK tr. 115 (Bể chứa thanh nhiên liệu hạt nhân đã qua sử dụng):</strong>{" "}
                Sau một thời gian vận hành, các thanh nhiên liệu lấy ra khỏi lò vẫn chứa các mảnh phân hạch đang phóng xạ mạnh và tiếp tục tỏa nhiệt. Vì vậy chúng phải được <strong>ngâm sâu hàng mét dưới bể nước chuyên dụng</strong> (nước vừa tải nhiệt làm mát liên tục, vừa đóng vai trò lớp che chắn bức xạ hiệu quả) trước khi đóng kiện bảo quản dài hạn.
              </div>

              <FixedPhysicsActivityRenderer
                activityKey="reactor_control_concept"
                onProgress={(done) => onMarkSectionComplete(section.id, done)}
              />
            </div>
          );
        })()}

      {section.kind === "b24_medicine" && (
        <FixedPhysicsActivityRenderer
          activityKey="nuclear_medicine"
          onProgress={(done) => onMarkSectionComplete(section.id, done)}
        />
      )}

      {section.kind === "b24_bio_food" &&
        (() => {
          const foodEssay = notebook.inClassWork?.b24FoodEvidenceEssay ?? "";
          const foodChecked = Boolean(notebook.inClassWork?.b24FoodChecked) || b24FoodCheckedLocal;
          const essayOk = foodEssay.trim().length >= 20;

          return (
            <div>
              {/* Đối chiếu trực quan Hình 24.5 SGK tr. 118 + đồng vị đánh dấu ³²P */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "14px",
                  marginBottom: "16px",
                }}
              >
                <figure
                  style={{
                    margin: 0,
                    border: "1px solid #d0d7de",
                    background: "#ffffff",
                    padding: "14px",
                  }}
                >
                  <svg
                    viewBox="0 0 380 145"
                    width="380"
                    height="145"
                    role="img"
                    aria-label="Đối chiếu Hình 24.5 SGK trang 118: bên trái là chùm quả vải không chiếu xạ bị thâm nâu và nấm mốc sau thời gian bảo quản; bên phải là chùm quả vải đã chiếu xạ giữ vỏ tươi đỏ không nấm mốc"
                    style={{ width: "100%", height: "auto", display: "block" }}
                  >
                    <rect x="0" y="0" width="182" height="145" fill="#fff1f1" stroke="#e0e0e0" />
                    <text x="14" y="22" fill="#a2191f" fontSize="12" fontWeight="700">
                      a) Không chiếu xạ (sau bảo quản)
                    </text>
                    <circle cx="62" cy="78" r="22" fill="#78350f" />
                    <circle cx="96" cy="86" r="22" fill="#713f12" />
                    <circle cx="126" cy="74" r="21" fill="#57534e" />
                    <circle cx="58" cy="72" r="6" fill="#d6d3d1" />
                    <circle cx="102" cy="92" r="5" fill="#d6d3d1" />
                    <text x="18" y="130" fill="#525252" fontSize="11">
                      Vi sinh vật, nấm mốc phát triển nhanh
                    </text>

                    <rect x="198" y="0" width="182" height="145" fill="#defbe6" stroke="#42be65" />
                    <text x="210" y="22" fill="#198038" fontSize="12" fontWeight="700">
                      b) Đã chiếu xạ (cùng thời gian)
                    </text>
                    <circle cx="258" cy="78" r="22" fill="#e11d48" />
                    <circle cx="292" cy="86" r="22" fill="#be123c" />
                    <circle cx="322" cy="74" r="21" fill="#f43f5e" />
                    <text x="210" y="130" fill="#161616" fontSize="11" fontWeight="600">
                      Vỏ tươi đỏ · Không mang tính phóng xạ
                    </text>
                  </svg>
                  <figcaption style={{ fontSize: "13px", lineHeight: 1.5, marginTop: "8px" }}>
                    <strong>Hình 24.5 (SGK tr. 118):</strong> Đối chiếu kết quả bảo quản trái cây bằng chiếu xạ bức xạ năng lượng phù hợp.
                  </figcaption>
                </figure>

                <div className={styles.tableScroll} style={{ margin: 0 }}>
                  <table className={styles.cdsTable}>
                    <caption>Ứng dụng trong nông nghiệp &amp; công nghệ sinh học (SGK tr. 117–118)</caption>
                    <thead>
                      <tr>
                        <th scope="col">Ứng dụng</th>
                        <th scope="col">Cơ chế &amp; bằng chứng an toàn</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th scope="row">Đồng vị đánh dấu (<Nuclide sym="P" a={32} z={15} />)</th>
                        <td>Pha lượng vết <Nuclide sym="P" a={32} z={15} /> vào phân lân để đo tốc độ cây hấp thụ ở từng bộ phận, tối ưu liều lượng bón phân.</td>
                      </tr>
                      <tr>
                        <th scope="row">Chọn giống đột biến</th>
                        <td>Chiếu xạ hạt giống tạo biến dị di truyền có lợi (năng suất cao, chín sớm, kháng sâu bệnh); cây trồng thương phẩm không phóng xạ.</td>
                      </tr>
                      <tr>
                        <th scope="row">Chiếu xạ thực phẩm</th>
                        <td>Chùm tia γ hoặc electron đi xuyên qua tiêu diệt vi khuẩn, nấm mốc, côn trùng kiểm dịch mà <strong>không để lại nguồn phóng xạ trong thực phẩm</strong>.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Câu hỏi tự luận ngắn yêu cầu nêu bằng chứng cụ thể từ bài (lưu localStorage) */}
              <div
                style={{
                  border: "1px solid #8d8d8d",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <label
                  htmlFor="b24-food-essay"
                  style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}
                >
                  Câu hỏi lập luận có bằng chứng: Từ Hình 24.5 và cơ chế vật lí trên, em hãy nêu bằng chứng giải thích vì sao trái cây chiếu xạ vừa giữ tươi lâu hơn, vừa an toàn (không làm người ăn bị nhiễm phóng xạ)?
                </label>
                <textarea
                  id="b24-food-essay"
                  className={styles.evidenceTextarea}
                  rows={3}
                  value={foodEssay}
                  onChange={(e) => {
                    const val = e.target.value;
                    setB24FoodCheckedLocal(false);
                    patchNotebook((cur) => ({
                      ...cur,
                      inClassWork: {
                        ...cur.inClassWork,
                        b24FoodEvidenceEssay: val,
                        b24FoodChecked: false,
                      },
                    }));
                  }}
                  placeholder="Nêu rõ 2 ý: (1) Tác dụng của chùm tia γ/electron lên vi sinh vật/nấm mốc trên Hình 24.5; (2) Thực phẩm có tiếp xúc hay giữ lại chất phóng xạ không…"
                />
                <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={`${styles.cdsBtn} ${styles.cdsBtnPrimary} ${styles.cdsBtnSmall}`}
                    onClick={() => {
                      setB24FoodCheckedLocal(true);
                      patchNotebook((cur) => ({
                        ...cur,
                        inClassWork: { ...cur.inClassWork, b24FoodChecked: true },
                      }));
                      if (essayOk) onMarkSectionComplete(section.id, true);
                    }}
                  >
                    Lưu câu trả lời lập luận
                  </button>
                  {foodChecked && (
                    <span
                      role="status"
                      style={{ fontSize: "13.5px", fontWeight: 600, color: essayOk ? "#198038" : "#b42332" }}
                    >
                      {essayOk
                        ? "✓ Đã lưu lập luận! Điểm cốt lõi: chùm tia chỉ đi xuyên qua tiêu diệt vi sinh vật/nấm mốc tương tự tia X hay ánh sáng, thực phẩm hoàn toàn không trộn lẫn nguồn phóng xạ."
                        : "Em hãy viết đầy đủ hơn (ít nhất 1–2 câu nêu rõ cả tác dụng diệt vi sinh vật và việc không tiếp xúc nguồn phóng xạ)."}
                    </span>
                  )}
                </div>
              </div>

              <FixedPhysicsActivityRenderer
                activityKey="radiation_applications"
                onProgress={(done) => onMarkSectionComplete(section.id, done)}
              />
            </div>
          );
        })()}

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
          BÀI 25 — BÀI TẬP VỀ VẬT LÍ HẠT NHÂN (HÌNH 25.1, BẢNG 25.1 & BÀI 6 TR. 122)
          ==================================================================== */}
      {section.kind === "b25_electroscope" &&
        (() => {
          const lockedB25Label = B25_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          const partRoles = notebook.preClassWork?.b25PartRoles ?? {};
          const matchedPartCount = B25_APPARATUS_PARTS.filter(
            (p) => partRoles[p.code] === p.correctRole
          ).length;
          const paperChoice = notebook.preClassWork?.b25PaperChoice ?? "";
          const b25SelfCheck = notebook.preClassWork?.selfCheckChoice ?? "";
          const b25SelfOpt = B25_PRE_SELF_CHECK_OPTIONS.find(
            (o) => o.id === b25SelfCheck
          );
          const checkB25PreReady = (
            nb: StudentLessonNotebook,
            rolesOv?: typeof partRoles,
            paperOv?: string,
            selfOv?: string
          ) => {
            const hasP = Boolean(
              (nb.initialPredictionChoice ?? nb.preClassPredictionChoice ?? "").trim()
            );
            const hasR = Boolean(
              (nb.initialPredictionReason ?? nb.preClassPredictionReason ?? "").trim()
            );
            const rMap = rolesOv ?? nb.preClassWork?.b25PartRoles ?? {};
            const partsOk = B25_APPARATUS_PARTS.every((p) => rMap[p.code] === p.correctRole);
            const pOk = (paperOv ?? nb.preClassWork?.b25PaperChoice ?? "") === "stop";
            const sc = selfOv ?? nb.preClassWork?.selfCheckChoice ?? "";
            return hasP && hasR && partsOk && pOk && sc === "both_signs_discharge";
          };
          const b25Ready = checkB25PreReady(notebook);

          return (
            <div>
              {/* Bước 1: Câu hỏi mở đầu bác bỏ giả thuyết sai */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 1 · Câu hỏi mở đầu từ hiện tượng tĩnh điện kế phóng điện (Bài 25.1 · Hình 25.1 SGK tr. 119)
                </h4>
                <p style={{ margin: "0 0 10px", fontSize: "14px", lineHeight: 1.6 }}>
                  Tích điện cho bản góp <strong>(2)</strong> của tĩnh điện kế để kim <strong>(3)</strong> lệch một góc ổn định. Khi đưa nguồn phóng xạ <strong>(1)</strong> lại gần bản góp <strong>(2)</strong> (không chạm vào bản góp), góc lệch của kim <strong>(3)</strong> giảm dần về <code>0</code> — và hiện tượng này xảy ra <strong>cả khi bản góp tích điện dương (+) lẫn khi tích điện âm (−)</strong>.
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
                    “Phải chăng nguồn (1) chỉ phát ra một loại hạt mang điện trái dấu bay tới trung hòa điện tích của tĩnh điện kế, hay do nguyên nhân vật lí nào khác?”
                  </em>
                </div>
              </section>

              {/* Bước 2: Sơ đồ tĩnh điện kế kim chỉ Hình 25.1 đúng kí hiệu (1), (2), (3) + Video */}
              <section style={{ marginBottom: "18px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "16px" }}>
                  Bước 2 · Quan sát Hình 25.1 SGK với đúng 3 bộ phận (1), (2), (3)
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
                    “Quan sát kim tĩnh điện kế (3) khi đưa nguồn (1) lại gần bản góp (2) trên Hình 25.1 và chú ý lớp không khí nằm giữa (1) và (2)”
                  </em>
                  .
                </div>

                <figure
                  style={{
                    margin: "0 0 14px",
                    border: "1px solid #d0d7de",
                    background: "#f8fafc",
                    padding: "14px",
                  }}
                >
                  <svg
                    viewBox="0 0 460 220"
                    width="460"
                    height="220"
                    role="img"
                    aria-label="Hình 25.1 SGK trang 119: (1) Nguồn phóng xạ chiếu chùm tia vào vùng không khí trước (2) Bản góp điện tích nối với trục và (3) Kim tĩnh điện kế trên thước chia độ đang giảm góc lệch về 0"
                    style={{ width: "100%", maxWidth: "480px", height: "auto", display: "block", margin: "0 auto" }}
                  >
                    {/* (1) Nguồn phóng xạ */}
                    <rect x="24" y="42" width="76" height="36" rx="4" fill="#334155" stroke="#161616" strokeWidth="1.6" />
                    <text x="36" y="64" fill="#ffffff" fontSize="12" fontWeight="700">
                      Nguồn α/β
                    </text>
                    <circle cx="62" cy="24" r="12" fill="#0f62fe" />
                    <text x="62" y="28" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
                      1
                    </text>

                    {/* Chùm tia ion hóa không khí giữa (1) và (2) */}
                    <line x1="102" y1="52" x2="216" y2="54" stroke="#da1e28" strokeWidth="2.2" strokeDasharray="5 3" />
                    <line x1="102" y1="68" x2="216" y2="66" stroke="#da1e28" strokeWidth="2.2" strokeDasharray="5 3" />
                    <text x="116" y="40" fill="#a2191f" fontSize="11.5" fontWeight="700">
                      Ion hóa không khí (+ / −)
                    </text>

                    {/* (2) Bản góp điện tích (đĩa kim loại đứng/ngang trên đỉnh trụ) */}
                    <rect x="220" y="34" width="12" height="52" rx="3" fill="#facc15" stroke="#854d0e" strokeWidth="2" />
                    <line x1="232" y1="60" x2="290" y2="60" stroke="#525252" strokeWidth="4" />
                    <circle cx="226" cy="18" r="12" fill="#0f62fe" />
                    <text x="226" y="22" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
                      2
                    </text>

                    {/* Thân tĩnh điện kế & thước chia độ */}
                    <circle cx="290" cy="138" r="56" fill="#ffffff" stroke="#525252" strokeWidth="2.5" />
                    {/* Thước chia độ cung tròn */}
                    <path d="M 290 184 A 46 46 0 0 0 334 152" fill="none" stroke="#8d8d8d" strokeWidth="2" />
                    <line x1="290" y1="60" x2="290" y2="184" stroke="#525252" strokeWidth="3.2" />
                    {/* Chân đế cách điện */}
                    <rect x="248" y="194" width="84" height="12" rx="2" fill="#334155" />

                    {/* (3) Kim tĩnh điện kế: nét đứt ban đầu → nét liền quay về 0 */}
                    <line x1="290" y1="138" x2="332" y2="162" stroke="#94a3b8" strokeWidth="2.4" strokeDasharray="4 3" />
                    <line x1="290" y1="138" x2="306" y2="178" stroke="#0f62fe" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="290" cy="138" r="4.5" fill="#161616" />
                    <path d="M 326 164 Q 318 174 310 176" fill="none" stroke="#0f62fe" strokeWidth="2" />
                    <circle cx="364" cy="138" r="12" fill="#0f62fe" />
                    <text x="364" y="142" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
                      3
                    </text>
                    <text x="354" y="168" fill="#002d9c" fontSize="11.5" fontWeight="700">
                      Kim (3) về 0
                    </text>
                  </svg>
                  <figcaption style={{ fontSize: "13px", lineHeight: 1.5, marginTop: "8px", textAlign: "center" }}>
                    <strong>Hình 25.1 (SGK tr. 119):</strong> <strong>(1)</strong> Nguồn phóng xạ · <strong>(2)</strong> Bản góp điện tích · <strong>(3)</strong> Kim tĩnh điện kế trên thước chia độ.
                  </figcaption>
                </figure>

                {b21VideoLesson && (
                  <div style={{ border: "1px solid #d0d7de", background: "#f8fafc", padding: "12px 14px" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "13.5px", lineHeight: 1.55 }}>
                      <strong>Tư liệu video bổ trợ Pha 1 Bài 25:</strong> Ôn tập phương pháp đọc hiện tượng và xử lí bảng số liệu phóng xạ.{" "}
                      <span style={{ color: "#002d9c", fontWeight: 600 }}>
                        Nếu chưa xem video, học sinh vẫn hoàn thành trọn vẹn Pha 1 từ Hình 25.1 ngay trên trang
                      </span>{" "}
                      (mở hoặc phát video không tự tính hoàn thành).
                    </p>
                    <NuclearLessonVideo lesson={b21VideoLesson} />
                  </div>
                )}
              </section>

              {/* Bước 3: Khóa dự đoán ban đầu + lí do */}
              <section
                style={{
                  border: "1px solid #8d8d8d",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 6px", fontSize: "16px" }}>
                  Bước 3 · Ghi và khóa dự đoán ban đầu kèm lí do
                </h4>
                {lockedB25Label && (
                  <div
                    style={{
                      marginBottom: "12px",
                      padding: "10px 12px",
                      background: "#fcf4d6",
                      borderLeft: "4px solid #8e6a00",
                      fontSize: "13.5px",
                    }}
                  >
                    <strong>Dự đoán ban đầu đã khóa:</strong> “{lockedB25Label}”
                    {lockedInitialReason ? <span> — <em>Lí do: {lockedInitialReason}</em></span> : null}
                  </div>
                )}
                <fieldset style={{ border: "none", margin: "0 0 12px", padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "8px" }}>
                    Chọn giải thích dự đoán của em cho hiện tượng trên Hình 25.1:
                  </legend>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {B25_PREDICTION_CHOICES.map((opt) => (
                      <label
                        key={opt.id}
                        style={{
                          display: "flex",
                          gap: "10px",
                          alignItems: "flex-start",
                          padding: "10px 12px",
                          border: predChoice === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                          background: predChoice === opt.id ? "#edf5ff" : "#fafafa",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        <input
                          type="radio"
                          name="b25-pre-prediction"
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
                <label htmlFor="b25-pre-reason" style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}>
                  Lí do cho dự đoán của em (bắt buộc):
                </label>
                <textarea
                  id="b25-pre-reason"
                  className={styles.evidenceTextarea}
                  rows={2}
                  value={predReason}
                  onChange={(e) => {
                    setPredReasonDraft(e.target.value);
                    setPredSavedMsg("");
                  }}
                  placeholder="Giải thích vì sao hiện tượng vẫn xảy ra ngay cả khi ta đổi dấu điện tích ban đầu của tĩnh điện kế…"
                />
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "10px" }}>
                  <button
                    type="button"
                    className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                    onClick={() => {
                      if (!predChoice || !predReason.trim()) {
                        setPredSavedMsg("Em hãy chọn dự đoán và ghi rõ lí do trước khi lưu.");
                        return;
                      }
                      onSavePreClassPrediction(predChoice, predReason.trim());
                      const updated = recordPreClassPrediction(notebook, predChoice, predReason.trim());
                      if (checkB25PreReady(updated)) onMarkSectionComplete(section.id, true);
                      setPredSavedMsg("Đã lưu và khóa dự đoán ban đầu cho Bài 25.");
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

              {/* Bước 4: Nhận diện (1), (2), (3) & thử đặt tờ giấy chắn nguồn thuần α */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 4 · Thao tác nhận diện (1), (2), (3) ({matchedPartCount}/3 đúng) và thử chắn bằng tờ giấy
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "12px",
                    marginBottom: "14px",
                  }}
                >
                  {B25_APPARATUS_PARTS.map((part) => {
                    const sel = partRoles[part.code] ?? "";
                    const ok = sel === part.correctRole;
                    return (
                      <div
                        key={part.code}
                        style={{
                          padding: "10px 12px",
                          border: sel ? (ok ? "1px solid #198038" : "1px solid #da1e28") : "1px solid #e0e0e0",
                          background: sel ? (ok ? "#defbe6" : "#fff1f1") : "#fafafa",
                        }}
                      >
                        <label
                          htmlFor={`b25-part-${part.code}`}
                          style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
                        >
                          {part.label}
                        </label>
                        <select
                          id={`b25-part-${part.code}`}
                          value={sel}
                          onChange={(e) => {
                            const val = e.target.value;
                            const nextRoles = { ...partRoles, [part.code]: val };
                            patchNotebook((cur) => ({
                              ...cur,
                              preClassWork: { ...cur.preClassWork, b25PartRoles: nextRoles },
                            }));
                            if (checkB25PreReady(notebook, nextRoles)) {
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
                          {B25_APPARATUS_ROLE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>

                <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "13.5px", marginBottom: "6px" }}>
                    Thử đặt một tờ giấy bìa mỏng chắn giữa nguồn thuần α (1) và bản góp (2):
                  </legend>
                  {[
                    [
                      "stop",
                      "Kim (3) ngừng giảm nhanh vì tờ giấy chặn hầu hết hạt α, lớp không khí sát bản góp (2) không còn bị ion hóa mạnh.",
                    ],
                    [
                      "faster",
                      "Kim (3) tụt về 0 nhanh hơn vì tia α xuyên mạnh hơn qua giấy.",
                    ],
                  ].map(([val, label]) => (
                    <label key={val} style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "13.5px", cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="b25-paper-shield"
                        checked={paperChoice === val}
                        onChange={() => {
                          patchNotebook((cur) => ({
                            ...cur,
                            preClassWork: { ...cur.preClassWork, b25PaperChoice: val },
                          }));
                          if (checkB25PreReady(notebook, undefined, val)) {
                            onMarkSectionComplete(section.id, true);
                          }
                        }}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </fieldset>
              </section>

              {/* Bước 5: Câu tự kiểm tra có phản hồi */}
              <section
                style={{
                  border: "1px solid #d0d7de",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 8px", fontSize: "16px" }}>
                  Bước 5 · Câu tự kiểm tra trước giờ học
                </h4>
                <fieldset style={{ border: "none", margin: 0, padding: 0 }}>
                  <legend style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>
                    Bằng chứng nào bác bỏ giả thuyết sai “chỉ có một loại hạt mang điện từ nguồn (1) bay vào trung hòa bản góp (2)”?
                  </legend>
                  {B25_PRE_SELF_CHECK_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      style={{
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-start",
                        padding: "10px 12px",
                        marginBottom: "8px",
                        border: b25SelfCheck === opt.id ? "2px solid #0f62fe" : "1px solid #e0e0e0",
                        background: b25SelfCheck === opt.id ? "#edf5ff" : "#fafafa",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      <input
                        type="radio"
                        name="b25-pre-selfcheck"
                        checked={b25SelfCheck === opt.id}
                        onChange={() => {
                          patchNotebook((cur) => ({
                            ...cur,
                            preClassWork: { ...cur.preClassWork, selfCheckChoice: opt.id },
                          }));
                          if (checkB25PreReady(notebook, undefined, undefined, opt.id)) {
                            onMarkSectionComplete(section.id, true);
                          }
                        }}
                        style={{ marginTop: "3px" }}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </fieldset>
                {b25SelfOpt && (
                  <div
                    role="status"
                    style={{
                      marginTop: "8px",
                      padding: "10px 14px",
                      background: b25SelfOpt.id === "both_signs_discharge" ? "#defbe6" : "#fff1f1",
                      borderLeft:
                        b25SelfOpt.id === "both_signs_discharge"
                          ? "4px solid #198038"
                          : "4px solid #b42332",
                      fontSize: "13.5px",
                      lineHeight: 1.55,
                    }}
                  >
                    {b25SelfOpt.feedback}
                  </div>
                )}
              </section>

              {showTeacherSolutions && (
                <div
                  data-testid="b25-teacher-solution-electroscope"
                  style={{
                    marginBottom: "18px",
                    padding: "14px 16px",
                    background: "#fffdf5",
                    border: "1px solid #d2a106",
                    borderLeft: "4px solid #8e6a00",
                    fontSize: "13.5px",
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ display: "block", color: "#5e4600", marginBottom: "4px" }}>
                    Hướng dẫn giải &amp; Đáp án chi tiết cho Giáo viên · Bài 25.1 (Hình 25.1 SGK tr. 119)
                  </strong>
                  Tia phóng xạ từ nguồn <strong>(1)</strong> không trung hòa tĩnh điện kế bằng điện tích riêng lẻ của chùm tia, mà do <strong>ion hóa các phân tử không khí</strong> tạo thành vô số ion dương và electron/ion âm tự do. Nếu bản góp <strong>(2)</strong> tích điện dương, nó hút electron/ion âm; nếu tích điện âm, nó hút ion dương → cả hai trường hợp kim <strong>(3)</strong> đều trở về <code>0</code>.
                </div>
              )}

              {/* Bước 6: Sản phẩm mang vào lớp */}
              <section style={{ border: "2px solid #0f62fe", background: "#edf5ff", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "#002d9c" }}>
                    Sản phẩm mang vào lớp · Bài 25
                  </h4>
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      background: b25Ready ? "#defbe6" : "#fcf4d6",
                      color: b25Ready ? "#198038" : "#8e6a00",
                    }}
                  >
                    {b25Ready
                      ? "✓ Đã hoàn thành Pha 1 Bài 25"
                      : "Cần đủ: Dự đoán + lí do, 3/3 kí hiệu Hình 25.1, tờ giấy chắn và câu tự kiểm tra"}
                  </span>
                </div>
                <ul style={{ margin: "0 0 12px", paddingLeft: "18px", fontSize: "14px", lineHeight: 1.6 }}>
                  <li>
                    <strong>Dự đoán ban đầu:</strong> {lockedB25Label ? `“${lockedB25Label}”` : "Chưa lưu"}
                  </li>
                  <li>
                    <strong>Nhận diện Hình 25.1:</strong> {matchedPartCount}/3 kí hiệu (1), (2), (3) đúng.
                  </li>
                </ul>
                <button
                  type="button"
                  className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                  onClick={() => onJumpToSection("b25-table-25-1")}
                >
                  Chuyển sang Pha 2: Bảng 25.1 &amp; ước lượng T →
                </button>
              </section>
            </div>
          );
        })()}

      {section.kind === "b25_table_25_1" &&
        (() => {
          const lockedB25Label = B25_PREDICTION_CHOICES.find(
            (c) => c.id === lockedInitialChoiceId
          )?.label;
          const partRoles = notebook.preClassWork?.b25PartRoles ?? {};
          const matchedPartCount = B25_APPARATUS_PARTS.filter(
            (p) => partRoles[p.code] === p.correctRole
          ).length;

          const halfInput = notebook.inClassWork?.b25HalfH0Input ?? "";
          const bracketChoice = notebook.inClassWork?.b25BracketChoice ?? "";
          const estTInput = notebook.inClassWork?.b25EstimatedTInput ?? "";
          const estNote = notebook.inClassWork?.b25EstimateMethodNote ?? "";
          const tableChecked = Boolean(notebook.inClassWork?.b25TableChecked) || b25TableCheckedLocal;

          const parsedHalf = Number(halfInput.trim().replace(",", ".").replace(/\s*bq$/i, ""));
          const halfOk = Number.isFinite(parsedHalf) && Math.abs(parsedHalf - 75.5) <= 0.2;
          const bracketOk = bracketChoice === "30_60";
          const parsedT = Number(estTInput.trim().replace(",", ".").replace(/\s*s$/i, ""));
          const tOk = Number.isFinite(parsedT) && parsedT >= 38 && parsedT <= 46;
          const noteOk = estNote.trim().length >= 10;
          const allB25TableOk = halfOk && bracketOk && tOk && noteOk;

          return (
            <div>
              <Phase2ProductEchoCard
                preSectionId="b25-electroscope"
                lockedChoiceLabel={lockedB25Label}
                lockedReason={lockedInitialReason}
                actionSummary={`Đã nhận diện ${matchedPartCount}/3 bộ phận Hình 25.1 và cơ chế ion hóa không khí`}
                bringQuestion={bringToClassQuestion}
                onJumpToSection={onJumpToSection}
              />

              <p style={{ margin: "0 0 10px", fontSize: "14.5px", lineHeight: 1.55 }}>
                <strong>Bảng 25.1 (SGK Vật lí 12, trang 121)</strong> ghi kết quả đo độ phóng xạ thực nghiệm{" "}
                <code>H</code> (đơn vị <code>Bq</code>) của một mẫu chất phóng xạ theo thời gian{" "}
                <code>t</code> (đơn vị <code>s</code>). Hãy tự đọc 8 cặp số liệu <code>(t, H)</code> dưới đây để ước lượng chu kì bán rã <code>T</code>:
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
                    </tr>
                  </thead>
                  <tbody>
                    {SGK_TABLE_25_1.map(({ t, h }) => {
                      const highlightTeacher = showTeacherSolutions && (t === 30 || t === 60);
                      return (
                        <tr
                          key={t}
                          style={highlightTeacher ? { background: "#edf5ff", fontWeight: 600 } : undefined}
                        >
                          <th scope="row" className={styles.numCell}>
                            {t} s
                          </th>
                          <td className={styles.numCell}>{h} Bq</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Phiếu học sinh tự ước lượng T trước (KHÔNG lộ sẵn đáp án khi ở chế độ Học sinh) */}
              <div
                style={{
                  border: "1px solid #8d8d8d",
                  background: "#ffffff",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <h4 style={{ margin: "0 0 10px", fontSize: "15.5px" }}>
                  Phiếu tự ước lượng chu kì bán rã T từ Bảng 25.1 (lưu vào sổ học tập)
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                    1. Giá trị một nửa hoạt độ ban đầu <code>H₀ / 2</code> (đơn vị <code>Bq</code>):
                    <input
                      type="text"
                      inputMode="decimal"
                      value={halfInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setB25TableCheckedLocal(false);
                        patchNotebook((cur) => ({
                          ...cur,
                          inClassWork: { ...cur.inClassWork, b25HalfH0Input: val, b25TableChecked: false },
                        }));
                      }}
                      placeholder="Tính từ H₀ tại t = 0 s (Bq)…"
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
                    2. Khoảng hai mốc thời gian kẹp giá trị <code>H₀ / 2</code>:
                    <select
                      value={bracketChoice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setB25TableCheckedLocal(false);
                        patchNotebook((cur) => ({
                          ...cur,
                          inClassWork: { ...cur.inClassWork, b25BracketChoice: val, b25TableChecked: false },
                        }));
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        marginTop: "6px",
                        minHeight: "40px",
                        padding: "6px 8px",
                        border: "1px solid #8d8d8d",
                        background: "#ffffff",
                        fontSize: "14px",
                      }}
                    >
                      <option value="">— Chọn khoảng kẹp trên Bảng 25.1 —</option>
                      <option value="0_30">Giữa 0 s và 30 s</option>
                      <option value="30_60">Giữa 30 s và 60 s</option>
                      <option value="60_120">Giữa 60 s và 120 s</option>
                      <option value="120_180">Giữa 120 s và 180 s</option>
                    </select>
                  </label>

                  <label style={{ display: "block", fontSize: "13.5px", fontWeight: 700 }}>
                    3. Giá trị ước lượng chu kì bán rã <code>T</code> của em (đơn vị <code>s</code>):
                    <input
                      type="text"
                      inputMode="decimal"
                      value={estTInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setB25TableCheckedLocal(false);
                        patchNotebook((cur) => ({
                          ...cur,
                          inClassWork: { ...cur.inClassWork, b25EstimatedTInput: val, b25TableChecked: false },
                        }));
                      }}
                      placeholder="Nhập số giây em ước lượng…"
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
                  htmlFor="b25-estimate-note"
                  style={{ display: "block", fontSize: "13.5px", fontWeight: 700, marginBottom: "6px" }}
                >
                  4. Giải thích ngắn gọn cách em ước lượng <code>T</code> từ bảng hoặc đồ thị (và vì sao đây là ước lượng gần đúng):
                </label>
                <textarea
                  id="b25-estimate-note"
                  className={styles.evidenceTextarea}
                  rows={2}
                  value={estNote}
                  onChange={(e) => {
                    const val = e.target.value;
                    setB25TableCheckedLocal(false);
                    patchNotebook((cur) => ({
                      ...cur,
                      inClassWork: { ...cur.inClassWork, b25EstimateMethodNote: val, b25TableChecked: false },
                    }));
                  }}
                  placeholder="Nêu cách em đối chiếu mức H₀/2 với hai mốc thời gian kẹp trên bảng hoặc đường cong…"
                />

                <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={`${styles.cdsBtn} ${styles.cdsBtnPrimary} ${styles.cdsBtnSmall}`}
                    onClick={() => {
                      setB25TableCheckedLocal(true);
                      patchNotebook((cur) => ({
                        ...cur,
                        inClassWork: { ...cur.inClassWork, b25TableChecked: true },
                      }));
                      if (allB25TableOk) onMarkSectionComplete(section.id, true);
                    }}
                  >
                    Kiểm tra ước lượng của em
                  </button>
                  {tableChecked && (
                    <span
                      role="status"
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 600,
                        color: allB25TableOk ? "#198038" : "#b42332",
                      }}
                    >
                      {allB25TableOk
                        ? "✓ Hợp lí! Mức H₀/2 = 75,5 Bq nằm trong khoảng 30 s – 60 s (gần mốc 30 s hơn mốc 60 s) và ước lượng của em khớp tốt với dữ liệu thực nghiệm."
                        : "Hãy kiểm tra lại: H₀ tại t = 0 s là 151 Bq → tính H₀/2, tìm hai mốc kẹp trên Bảng 25.1, ước lượng T trong khoảng đó và ghi rõ cách làm."}
                    </span>
                  )}
                </div>
              </div>

              {showTeacherSolutions && (
                <div
                  data-testid="b25-teacher-solution-table"
                  style={{
                    marginBottom: "18px",
                    padding: "14px 16px",
                    background: "#fffdf5",
                    border: "1px solid #d2a106",
                    borderLeft: "4px solid #8e6a00",
                    fontSize: "13.5px",
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ display: "block", color: "#5e4600", marginBottom: "4px" }}>
                    Hướng dẫn giải &amp; Đáp án chi tiết cho Giáo viên · Bảng 25.1 (SGK tr. 121)
                  </strong>
                  Hoạt độ ban đầu tại <code>t = 0 s</code> là <code>H₀ = 151 Bq</code> ⇒{" "}
                  <code>H₀ / 2 = 75,5 Bq</code>. Trên Bảng 25.1, <code>75,5 Bq</code> nằm giữa hai cặp đo{" "}
                  <strong>(30 s; 85 Bq)</strong> và <strong>(60 s; 55 Bq)</strong>. Nội suy tuyến tính đoạn đầu cho{" "}
                  <code>T ≈ 30 + (85 − 75,5)/(85 − 55) × 30 = 39,5 s</code>; nếu vẽ đường cong hàm mũ trơn qua toàn bộ 8 điểm đo (có thăng giáng thống kê ở vùng hoạt độ thấp) thì thu được <code>T ≈ 40 – 45 s</code>.
                </div>
              )}

              <h4 style={{ margin: "20px 0 10px", fontSize: "16px" }}>
                Đồ thị phân rã tương tác và xử lí số liệu Bảng 25.1
              </h4>
              <FixedPhysicsActivityRenderer
                activityKey="nuclear_physics_practice_lab"
                onProgress={(done) => onMarkSectionComplete(section.id, done)}
              />
            </div>
          );
        })()}

      {section.kind === "b25_equations_energy" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {showTeacherSolutions && (
            <div
              data-testid="b25-teacher-solution-equations"
              style={{
                padding: "14px 16px",
                background: "#fffdf5",
                border: "1px solid #d2a106",
                borderLeft: "4px solid #8e6a00",
                fontSize: "13.5px",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ display: "block", color: "#5e4600", marginBottom: "4px" }}>
                Hướng dẫn giải &amp; Lưu ý chấm bài cho Giáo viên · Phương trình &amp; Eₗₖ, Eₗₖᵣ
              </strong>
              Phần A: Kiểm tra tổng số khối <code>ΣA</code> và tổng điện tích <code>ΣZ</code> hai vế (phân rã α giảm A đi 4, Z đi 2; β⁻ giữ nguyên A, tăng Z thêm 1; β⁺ giữ nguyên A, giảm Z đi 1). Phần B: Áp dụng{" "}
              <code>Δm = Z·m_p + (A − Z)·m_n − m_X</code>,{" "}
              <code>Eₗₖ = Δm · 931,5 (MeV)</code> và <code>Eₗₖᵣ = Eₗₖ / A (MeV/nucleon)</code>.
            </div>
          )}

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
              Phần B · Tính độ hụt khối Δm, năng lượng liên kết Eₗₖ và năng lượng liên kết riêng Eₗₖᵣ = Eₗₖ / A
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
          const b25F18Ratio = notebook.afterClassWork?.b25F18RatioInput ?? "";
          const b25Checked = Boolean(notebook.afterClassWork?.b25AfterChecked) || b25AfterCheckedLocal;

          const daysOk = Number(b25AfterDays.trim().replace(",", ".")) === 24;
          const parsedRatio = Number(b25F18Ratio.trim().replace(",", "."));
          const f18Ok = Number.isFinite(parsedRatio) && Math.abs(parsedRatio - 1.46) <= 0.03;
          const allB25AfterOk = daysOk && f18Ok;

          return (
            <div style={{ border: "1px solid #d0d7de", padding: "16px", background: "#ffffff" }}>
              <h4 style={{ margin: "0 0 10px", fontSize: "16px" }}>
                Kiểm tra, đánh giá Pha 3: Hai bài toán y học hạt nhân thực tiễn (<Nuclide sym="I" a={131} z={53} /> &amp; Bài 6 tr. 122 <Nuclide sym="F" a={18} z={9} />-FDG)
              </h4>

              {/* Câu 1: I-131 */}
              <div style={{ marginBottom: "16px", paddingBottom: "14px", borderBottom: "1px solid #e0e0e0" }}>
                <p style={{ margin: "0 0 8px", fontSize: "14.5px", lineHeight: 1.6 }}>
                  <strong>Câu 1 (<Nuclide sym="I" a={131} z={53} />):</strong> Đồng vị{" "}
                  <Nuclide sym="I" a={131} z={53} /> có chu kì bán rã <code>T = 8,0 ngày</code>. Một mẫu mới điều chế có độ phóng xạ ban đầu <code>H₀ = 400 MBq</code>. Hỏi sau bao nhiêu ngày thì độ phóng xạ của mẫu giảm xuống còn <code>50 MBq</code>?
                </p>
                <label style={{ fontSize: "13.5px", fontWeight: 700, display: "block" }}>
                  Thời gian cần tìm t (ngày):
                  <input
                    type="number"
                    inputMode="decimal"
                    value={b25AfterDays}
                    onChange={(e) => {
                      const val = e.target.value;
                      setB25AfterCheckedLocal(false);
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: {
                          ...cur.afterClassWork,
                          b25AfterDays: val,
                          b25AfterChecked: false,
                        },
                      }));
                    }}
                    placeholder="Nhập số ngày…"
                    style={{
                      display: "block",
                      width: "100%",
                      maxWidth: "260px",
                      marginTop: "6px",
                      minHeight: "42px",
                      padding: "8px 12px",
                      border: "1px solid #8d8d8d",
                      fontSize: "15px",
                    }}
                  />
                </label>
              </div>

              {/* Câu 2: Bài 6 SGK tr. 122 (18F-FDG chụp PET) */}
              <div style={{ marginBottom: "16px" }}>
                <p style={{ margin: "0 0 8px", fontSize: "14.5px", lineHeight: 1.6 }}>
                  <strong>Câu 2 (Bài 6 · SGK tr. 122 · Dược chất <Nuclide sym="F" a={18} z={9} />-FDG chụp PET):</strong>{" "}
                  Đồng vị <Nuclide sym="F" a={18} z={9} /> có chu kì bán rã <code>T = 110 phút</code>. Trong khoa Y học hạt nhân, hai bệnh nhân A và B có cùng phác đồ cần nhận <strong>cùng một độ phóng xạ như nhau ngay tại thời điểm tiêm</strong>. Liều thuốc của cả hai được rút ra cùng một lúc từ một lô điều chế, nhưng bệnh nhân B được hẹn tiêm <strong>muộn hơn bệnh nhân A <code>60 phút</code></strong>. Hỏi ngay lúc pha chế chuẩn bị, liều hoạt độ (hoặc thể tích dung dịch) chuẩn bị cho bệnh nhân B phải <strong>gấp bao nhiêu lần</strong> của bệnh nhân A? <em>(Làm tròn đến 2 chữ số thập phân)</em>
                </p>
                <label style={{ fontSize: "13.5px", fontWeight: 700, display: "block" }}>
                  Tỉ số liều chuẩn bị ban đầu <code>H₀B / H₀A</code> (lần):
                  <input
                    type="text"
                    inputMode="decimal"
                    value={b25F18Ratio}
                    onChange={(e) => {
                      const val = e.target.value;
                      setB25AfterCheckedLocal(false);
                      patchNotebook((cur) => ({
                        ...cur,
                        afterClassWork: {
                          ...cur.afterClassWork,
                          b25F18RatioInput: val,
                          b25AfterChecked: false,
                        },
                      }));
                    }}
                    placeholder="Ví dụ: 1,46"
                    style={{
                      display: "block",
                      width: "100%",
                      maxWidth: "260px",
                      marginTop: "6px",
                      minHeight: "42px",
                      padding: "8px 12px",
                      border: "1px solid #8d8d8d",
                      fontSize: "15px",
                    }}
                  />
                </label>
              </div>

              <button
                type="button"
                className={`${styles.cdsBtn} ${styles.cdsBtnPrimary}`}
                onClick={() => {
                  setB25AfterCheckedLocal(true);
                  patchNotebook((cur) => ({
                    ...cur,
                    afterClassWork: { ...cur.afterClassWork, b25AfterChecked: true },
                  }));
                  if (allB25AfterOk) {
                    onMarkSectionComplete(section.id, true);
                  }
                }}
              >
                Kiểm tra kết quả Pha 3
              </button>

              {b25Checked && (
                <p
                  role="status"
                  style={{
                    margin: "12px 0 0",
                    fontWeight: 600,
                    color: allB25AfterOk ? "#198038" : "#b42332",
                    lineHeight: 1.55,
                  }}
                >
                  {allB25AfterOk
                    ? "✓ Hoàn thành xuất sắc! Câu 1: t = 3 × 8,0 = 24 ngày; Câu 2 (¹⁸F-FDG): H₀B / H₀A = 2^(60/110) ≈ 1,46 lần."
                    : `Kiểm tra lại: ${!daysOk ? "Câu 1 lập tỉ số H/H₀ = 50/400 = 1/8 = 2⁻³ để tìm t. " : ""}${!f18Ok ? "Câu 2 vì bệnh nhân B tiêm muộn hơn Δt = 60 phút nên H₀B · 2^(−(t_A + 60)/110) = H₀A · 2^(−t_A/110) ⇒ tính 2^(60/110)." : ""}`}
                </p>
              )}

              {showTeacherSolutions && (
                <div
                  data-testid="b25-teacher-solution-after"
                  style={{
                    marginTop: "14px",
                    padding: "14px 16px",
                    background: "#fffdf5",
                    border: "1px solid #d2a106",
                    borderLeft: "4px solid #8e6a00",
                    fontSize: "13.5px",
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ display: "block", color: "#5e4600", marginBottom: "4px" }}>
                    Hướng dẫn giải &amp; Đáp án chi tiết cho Giáo viên · ¹³¹I &amp; Bài 6 SGK tr. 122 (¹⁸F-FDG)
                  </strong>
                  <div>
                    • <strong>Câu 1 (¹³¹I):</strong>{" "}
                    <code>H / H₀ = 50 / 400 = 1/8 = 2^(−3) ⇒ t = 3T = 3 × 8,0 = 24 ngày</code>.
                  </div>
                  <div style={{ marginTop: "4px" }}>
                    • <strong>Câu 2 (Bài 6 tr. 122 · ¹⁸F-FDG):</strong> Gọi <code>t_A</code> là thời gian từ lúc chuẩn bị liều đến lúc tiêm cho bệnh nhân A, thì thời điểm tiêm cho bệnh nhân B là <code>t_B = t_A + 60</code> (phút). Để hoạt độ lúc tiêm bằng nhau:{" "}
                    <code>H₀B · 2^(−(t_A + 60)/110) = H₀A · 2^(−t_A/110)</code> ⇒{" "}
                    <code>H₀B / H₀A = 2^(60/110) = 2^(6/11) ≈ 1,46</code> lần.
                  </div>
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
}
