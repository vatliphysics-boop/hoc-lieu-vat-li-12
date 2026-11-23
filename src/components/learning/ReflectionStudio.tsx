"use client";

/**
 * Phản hồi và tự điều chỉnh: tự đánh giá theo 5 thành tố năng lực tự học,
 * ghi phản tư, chọn việc cần làm tiếp, và tải bản ghi về máy.
 *
 * Đây không phải thang đo chuẩn hoá và không thay điểm của giáo viên.
 */

import { useState } from "react";

const SELF_REGULATION = [
  {
    id: "plan",
    label: "Xác định mục tiêu và lập kế hoạch",
    prompt: "Em đã đọc mục tiêu bài học và chuẩn bị trước khi đến lớp chưa?",
  },
  {
    id: "process",
    label: "Tiếp nhận và xử lí thông tin",
    prompt: "Em phân biệt được các khái niệm chính và giải thích được hiện tượng chưa?",
  },
  {
    id: "collaborate",
    label: "Hợp tác và giải quyết vấn đề",
    prompt: "Em có dùng kiến thức để bảo vệ quan điểm nhóm và tiếp nhận phản biện không?",
  },
  {
    id: "ai",
    label: "Tự kiểm tra và dùng AI có trách nhiệm",
    prompt: "Em đã tự suy nghĩ trước khi hỏi, và đối chiếu câu trả lời của AI với tài liệu chưa?",
  },
  {
    id: "adjust",
    label: "Tự đánh giá và điều chỉnh",
    prompt: "Em đã nhận ra chỗ còn nhầm lẫn và nêu được việc sẽ làm tiếp chưa?",
  },
];

const LEVELS = [
  { value: 1, label: "Chưa làm được" },
  { value: 2, label: "Làm được một phần" },
  { value: 3, label: "Làm được" },
  { value: 4, label: "Làm tốt và giải thích được" },
];

const NEXT_STEPS = [
  { id: "video", label: "Xem lại video bài giảng", href: "/truoc-gio-hoc/video-bai-giang" },
  { id: "sim", label: "Chạy lại mô phỏng 3D", href: "/truoc-gio-hoc/mo-phong" },
  { id: "quiz", label: "Làm lại phần tự kiểm tra", href: "/sau-gio-hoc/on-tap-tu-kiem-tra" },
  { id: "ai", label: "Hỏi trợ lí học tập về chỗ vướng", href: "/hoc-lieu/ai" },
  { id: "teacher", label: "Trao đổi với giáo viên", href: "/hoc-lieu/lop-hoc-dao-nguoc" },
];

export function ReflectionStudio() {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [reflection, setReflection] = useState("");
  const [nextSteps, setNextSteps] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const ratedCount = Object.keys(ratings).length;
  const average =
    ratedCount > 0
      ? (Object.values(ratings).reduce((a, b) => a + b, 0) / ratedCount).toFixed(2)
      : null;
  const canExport = ratedCount > 0 && reflection.trim().length > 0;

  function toggleStep(id: string) {
    setNextSteps((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function exportRecord() {
    const lines = [
      "BẢN GHI TỰ ĐÁNH GIÁ VÀ PHẢN TƯ",
      "",
      "1. Tự đánh giá theo 5 thành tố",
      ...SELF_REGULATION.map(
        (item) =>
          `- ${item.label}: ${LEVELS.find((l) => l.value === ratings[item.id])?.label ?? "(chưa đánh giá)"}`,
      ),
      "",
      `Mức trung bình tự đánh giá: ${average ?? "—"} / 4`,
      "",
      "2. Phản tư",
      reflection || "(chưa ghi)",
      "",
      "3. Việc sẽ làm tiếp",
      ...(nextSteps.length
        ? nextSteps.map((id) => `- ${NEXT_STEPS.find((s) => s.id === id)?.label ?? id}`)
        : ["(chưa chọn)"]),
      "",
      "Lưu ý: đây là bản tự đánh giá, không phải điểm chính thức.",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tu-danh-gia-phan-tu.txt";
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
  }

  return (
    <div className="reflection-studio">
      <section aria-labelledby="reflection-rate-title">
        <h2 id="reflection-rate-title">1. Tự đánh giá quá trình học</h2>
        <p className="reflection-note">
          Chọn mức phù hợp với em. Không có mức nào là {'"điểm"'}; đây là cách em tự nhìn lại việc
          học để biết nên làm gì tiếp.
        </p>
        <ul className="reflection-criteria">
          {SELF_REGULATION.map((item) => (
            <li key={item.id}>
              <fieldset>
                <legend>{item.label}</legend>
                <p className="reflection-prompt">{item.prompt}</p>
                <div className="reflection-levels">
                  {LEVELS.map((level) => (
                    <label key={level.value} className="reflection-level">
                      <input
                        type="radio"
                        name={item.id}
                        checked={ratings[item.id] === level.value}
                        onChange={() => setRatings((prev) => ({ ...prev, [item.id]: level.value }))}
                      />
                      <span>{level.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </li>
          ))}
        </ul>
        <p className="reflection-average" role="status">
          Đã tự đánh giá {ratedCount}/{SELF_REGULATION.length} thành tố
          {average && ` · Trung bình ${average}/4`}
        </p>
      </section>

      <section aria-labelledby="reflection-write-title">
        <h2 id="reflection-write-title">2. Phản tư</h2>
        <label className="reflection-textarea">
          Điều em đã hiểu rõ hơn hôm nay, và điều còn vướng
          <textarea
            rows={6}
            maxLength={5000}
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Ví dụ: em đã phân biệt được số hạt còn lại N với số hạt đã phân rã ΔN, nhưng vẫn nhầm khi đề hỏi độ phóng xạ H…"
          />
        </label>
        <p className="reflection-count">{reflection.trim().length} ký tự</p>
      </section>

      <section aria-labelledby="reflection-next-title">
        <h2 id="reflection-next-title">3. Việc em sẽ làm tiếp</h2>
        <ul className="reflection-steps">
          {NEXT_STEPS.map((step) => (
            <li key={step.id}>
              <label>
                <input
                  type="checkbox"
                  checked={nextSteps.includes(step.id)}
                  onChange={() => toggleStep(step.id)}
                />
                <span>{step.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <div className="reflection-actions">
        <button type="button" className="btn primary" disabled={!canExport} onClick={exportRecord}>
          Tải bản tự đánh giá về máy
        </button>
        <span className="reflection-save-note" role="status">
          {saved
            ? "Đã tải bản ghi. Nộp cho giáo viên theo hướng dẫn của lớp."
            : "Bản ghi chỉ giữ trong phiên mở này — tải về để nộp."}
        </span>
      </div>

      <section className="reflection-support" aria-labelledby="reflection-support-title">
        <h2 id="reflection-support-title">Cần nhận xét hoặc nộp lại bài?</h2>
        <p>
          Nhận xét của giáo viên và cơ hội sửa bài được giao qua lớp học, không hiển thị trên
          trang công khai này. Sau khi đăng nhập vào lớp, em xem được bài đã nộp, nhận xét và
          trạng thái nộp lại.
        </p>
        <p className="reflection-note">
          Phần {'"nhận xét và sửa bài"'} trong tài khoản học sinh đang được xây dựng; hiện chỉ có
          bài làm và tiến độ đã có. Nếu cần nộp lại gấp, hãy trao đổi trực tiếp với giáo viên.
        </p>
      </section>
    </div>
  );
}
