"use client";

/**
 * Bộ ôn tập tương tác — dùng dữ liệu đề có sẵn và API chấm điểm tự động.
 *
 * Điểm số chỉ tính trên câu hỏi tự động chấm được (trắc nghiệm, đúng/sai, số).
 * Câu tự luận được hiển thị để học sinh ghi lại suy nghĩ, không tự chấm.
 */

import { useMemo, useState } from "react";
import papers from "@/data/nuclear-exams.json";
import { gradeExam, type ExamQuestion, type ExamResponses, type NuclearExam } from "@/lib/exam-scoring";

const EXAMS = papers as NuclearExam[];
const CHOICE_LABELS = ["A", "B", "C", "D", "E", "F"];

export function SelfCheckQuiz() {
  const [examId, setExamId] = useState(EXAMS[0].id);
  const [responses, setResponses] = useState<ExamResponses>({});
  const [submitted, setSubmitted] = useState(false);

  const exam = useMemo(
    () => EXAMS.find((item) => item.id === examId) ?? EXAMS[0],
    [examId],
  );
  const result = useMemo(
    () => (submitted ? gradeExam(exam, responses) : null),
    [exam, responses, submitted],
  );

  const answered = exam.questions.filter((q) => {
    const value = responses[q.id];
    return Array.isArray(value) ? value.some(Boolean) : Boolean(value && value.trim());
  }).length;

  function reset(id = examId) {
    setExamId(id);
    setResponses({});
    setSubmitted(false);
  }

  function setAnswer(id: string, value: string | string[]) {
    setResponses((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <div className="self-check">
      <div className="self-check-toolbar">
        <label>
          Bộ ôn tập
          <select value={examId} onChange={(e) => reset(e.target.value)}>
            {EXAMS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title} — {item.questions.length} câu, {item.durationMinutes} phút
              </option>
            ))}
          </select>
        </label>
        <p role="status">Đã làm {answered}/{exam.questions.length} câu</p>
      </div>
      <div className="self-check-instructions">
        <h2>{exam.title}</h2>
        <p>{exam.instructions}</p>
        <p>
          <strong>Phạm vi:</strong> {exam.scope.join(", ")}
        </p>
      </div>

      <ol className="self-check-questions">
        {exam.questions.map((q, index) => (
          <li key={q.id} className="self-check-question">
            <div className="self-check-prompt">
              <span className="self-check-number">Câu {index + 1}</span>
              <span>{q.prompt}</span>
              <span className="self-check-meta">
                {q.topic} · {q.level} · {q.points} điểm
              </span>
            </div>
            <QuestionInput
              question={q}
              value={responses[q.id]}
              disabled={submitted}
              onChange={(value) => setAnswer(q.id, value)}
            />
            {submitted && q.explanation && (
              <p className="self-check-explain">
                <strong>Giải thích:</strong> {q.explanation}
              </p>
            )}
            {submitted && q.kind === "written" && (
              <p className="self-check-explain">
                Câu tự luận do giáo viên chấm; phần em viết đã được giữ lại để đối chiếu.
              </p>
            )}
          </li>
        ))}
      </ol>

      {result && (
        <div className="self-check-result" role="status">
          <h3>Kết quả phần tự chấm</h3>
          <p>
            <strong>
              {result.score.toFixed(2)} / {result.automaticMax} điểm
            </strong>{" "}
            ({Math.round((result.score / result.automaticMax) * 100)}%)
          </p>
          {result.writtenMax > 0 && (
            <p>
              Còn {result.writtenMax} điểm tự luận cần giáo viên chấm — điểm trên chưa
              phải điểm cuối cùng của bài.
            </p>
          )}
          <p>
            Xem lại các câu có giải thích ở trên để biết chỗ cần ôn. Đây là điểm tự luyện
            trong phiên, không phải điểm chính thức.
          </p>
        </div>
      )}

      <div className="self-check-actions">
        <button type="button" className="btn primary" disabled={answered === 0 || submitted} onClick={() => setSubmitted(true)}>
          Chấm điểm tự động
        </button>
        <button type="button" className="btn" onClick={() => reset()}>
          Làm lại
        </button>
      </div>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  disabled,
  onChange,
}: {
  question: ExamQuestion;
  value: string | string[] | undefined;
  disabled: boolean;
  onChange: (value: string | string[]) => void;
}) {
  if (question.kind === "choice" && question.options) {
    return (
      <fieldset className="self-check-options" disabled={disabled}>
        <legend className="sr-only">Chọn một đáp án</legend>
        {question.options.map((option, i) => (
          <label key={`${question.id}-${i}`} className="self-check-option">
            <input
              type="radio"
              name={question.id}
              value={String(i)}
              checked={value === String(i)}
              onChange={() => onChange(String(i))}
            />
            <span>
              {CHOICE_LABELS[i]}. {option}
            </span>
          </label>
        ))}
      </fieldset>
    );
  }

  if (question.kind === "true_false" && question.statements) {
    return (
      <fieldset className="self-check-statements" disabled={disabled}>
        <legend className="sr-only">Chọn đúng hoặc sai cho từng nhận định</legend>
        {question.statements.map((statement, i) => {
          const current = Array.isArray(value) ? value : [];
          return (
            <div key={`${question.id}-s${i}`} className="self-check-statement">
              <p>{statement.text}</p>
              <div className="self-check-options">
                {[true, false].map((choice) => (
                  <label key={String(choice)} className="self-check-option">
                    <input
                      type="radio"
                      name={`${question.id}-s${i}`}
                      checked={current[i] === String(choice)}
                      onChange={() => {
                        const next = Array.from({ length: question.statements!.length }, (_, k) => current[k] ?? "");
                        next[i] = String(choice);
                        onChange(next);
                      }}
                    />
                    <span>{choice ? "Đúng" : "Sai"}</span>
                  </label>
                ))}
              </div>
              {disabled && <p className="self-check-explain">{statement.explanation}</p>}
            </div>
          );
        })}
      </fieldset>
    );
  }

  if (question.kind === "numeric") {
    return (
      <label className="self-check-numeric">
        Trả lời
        <input
          type="text"
          inputMode="decimal"
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.unit ? `Số, đơn vị ${question.unit}` : "Nhập số"}
        />
        {question.unit && <span>{question.unit}</span>}
      </label>
    );
  }

  return (
    <label className="self-check-written">
      Câu trả lời tự luận
      <textarea
        rows={4}
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Viết lập luận, cách làm và kết quả…"
      />
    </label>
  );
}
