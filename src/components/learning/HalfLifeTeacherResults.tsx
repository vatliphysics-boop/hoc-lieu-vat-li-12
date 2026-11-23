"use client";

import { INQUIRY_TASKS, type InquiryState } from "@/lib/half-life-inquiry";
import type { HalfLifeMeasurement } from "@/lib/half-life-classroom";
import type { PilotEvent } from "@/lib/half-life-analytics";
import { halfLifeHintCounts, halfLifeResearchExport } from "@/lib/half-life-teacher-export";

type Results = { inquiry: InquiryState; measurements: HalfLifeMeasurement[]; submitted: boolean; events: PilotEvent[] };

export function HalfLifeTeacherResults({ inquiry, measurements, submitted, events }: Results) {
  function download(format: "csv" | "json") {
    const content = halfLifeResearchExport(inquiry, measurements, submitted, format, events);
    const url = URL.createObjectURL(new Blob([content], { type: format === "json" ? "application/json;charset=utf-8" : "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `bang-chung-ban-ra.${format}`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div data-testid="teacher-half-life-results">
    <p><strong>Trạng thái:</strong> {submitted ? "Đã nộp" : "Bản lưu chưa nộp"}. Hoàn thành {Math.min(inquiry.taskIndex, INQUIRY_TASKS.length)}/{INQUIRY_TASKS.length} nhiệm vụ.</p>
    <p>Cấp gợi ý là mức cao nhất đã mở. Số lần bấm và gợi ý tự động chỉ tính những sự kiện đã lưu, có thể thiếu khi bắt đầu ghi muộn. Dữ liệu do học sinh tự báo qua ứng dụng; cần đối chiếu trước khi dùng làm bằng chứng nghiên cứu.</p>
    {INQUIRY_TASKS.map((task, index) => <details key={task.id}>
      <summary>{task.title} · {index < inquiry.taskIndex ? "Hoàn thành" : index === inquiry.taskIndex ? "Đang thực hiện" : "Chưa mở"} · {inquiry.hintsUsed[task.id] ?? 0}/3 cấp gợi ý</summary>
      <p>Trong nhật ký đã lưu: {halfLifeHintCounts(events, task.id).requests} lần yêu cầu, {halfLifeHintCounts(events, task.id).automatic} gợi ý tự động.</p>
      <ol>{task.questions.map(question => {
        const attempts = inquiry.attempts.filter(attempt => attempt.questionId === question.id);
        return <li key={question.id}><p>{question.prompt}</p>{attempts.length ? <ol>{attempts.map((attempt, attemptIndex) => <li key={attemptIndex}>{question.options.find(option => option.id === attempt.answerId)?.text ?? "Phương án không còn trong cấu hình"} · {attempt.correct ? "Đúng" : "Chưa đúng"}</li>)}</ol> : <p>Chưa trả lời.</p>}</li>;
      })}</ol>
    </details>)}
    <p>Đã lưu {measurements.length} phép đo trong bảng gần nhất.</p>
    <div className="book-actions"><button className="btn" type="button" onClick={() => download("csv")}>Xuất CSV câu trả lời</button><button className="btn" type="button" onClick={() => download("json")}>Xuất JSON câu trả lời và phép đo</button></div>
    <p>Hai tệp không chứa tên, mã tài khoản, mã phiên hay thời điểm tuyệt đối. Tuy vậy, dữ liệu học tập vẫn có thể được nhận diện khi kết hợp với nguồn khác; hãy bảo vệ tệp.</p>
  </div>;
}
