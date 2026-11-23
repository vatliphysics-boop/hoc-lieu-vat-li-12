import { INQUIRY_TASKS, type InquiryState } from "./half-life-inquiry";
import type { HalfLifeMeasurement } from "./half-life-classroom";
import type { PilotEvent } from "./half-life-analytics";

/** Counts describe only retained events, which may begin after the task began. */
export function halfLifeHintCounts(events: readonly PilotEvent[], taskId: string) {
  return events.reduce((counts, event) => {
    if (event.data.task !== taskId) return counts;
    if (event.type === "hint_requested") counts.requests++;
    if (event.type === "prediction_or_answer" && typeof event.data.automaticHints === "number" && Number.isInteger(event.data.automaticHints) && event.data.automaticHints > 0) counts.automatic += event.data.automaticHints;
    return counts;
  }, { requests: 0, automatic: 0 });
}

/** Build an allow-listed export; no account, step or session IDs or timestamps. */
export function halfLifeResearchRows(inquiry: InquiryState, events: readonly PilotEvent[] = []) {
  return INQUIRY_TASKS.flatMap((task, taskIndex) => task.questions.flatMap(question => {
    const attempts = inquiry.attempts.filter(attempt => attempt.questionId === question.id);
    const hintCounts = halfLifeHintCounts(events, task.id);
    const common = { task: task.title, status: taskIndex < inquiry.taskIndex ? "Hoàn thành" : taskIndex === inquiry.taskIndex ? "Đang thực hiện" : "Chưa mở", question: question.prompt, hintLevels: inquiry.hintsUsed[task.id] ?? 0, hintRequestsLogged: hintCounts.requests, automaticHintsLogged: hintCounts.automatic };
    return attempts.length ? attempts.map((attempt, index) => ({ ...common, attempt: index + 1, answer: question.options.find(option => option.id === attempt.answerId)?.text ?? "Không xác định", correct: attempt.correct })) : [{ ...common, attempt: 0, answer: "", correct: false }];
  }));
}

function csvCell(value: string | number | boolean) {
  const raw = String(value);
  const safe = /^[\s]*[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function halfLifeResearchExport(inquiry: InquiryState, measurements: HalfLifeMeasurement[], submitted: boolean, format: "csv" | "json", events: readonly PilotEvent[] = []) {
  const rows = halfLifeResearchRows(inquiry, events);
  if (format === "csv") return "\uFEFFnhiem_vu,trang_thai,cau_hoi,lan_tra_loi,phuong_an,dung,cap_goi_y_da_mo,lan_bam_goi_y_da_ghi,goi_y_tu_dong_da_ghi\r\n" + rows.map(row => [row.task, row.status, row.question, row.attempt || "", row.answer, row.attempt ? row.correct : "", row.hintLevels, row.hintRequestsLogged, row.automaticHintsLogged].map(csvCell).join(",")).join("\r\n") + "\r\n";
  const safeMeasurements = measurements.map(({ time, remaining, expected, n, halfLife, seed }) => ({ time, remaining, expected, n, halfLife, seed }));
  return JSON.stringify({ schema: "half-life-teacher-export/2", submitted, hintCountsNote: "Số lượt gợi ý chỉ tính các sự kiện đã được lưu; có thể thiếu nếu bật ghi sau khi bắt đầu.", questions: rows, measurements: safeMeasurements }, null, 2);
}
