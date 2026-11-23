import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node runner resolves TypeScript directly.
import { createInquiryState, answerInquiryQuestion } from "../src/lib/half-life-inquiry.ts";
// @ts-expect-error Node runner resolves TypeScript directly.
import { halfLifeResearchExport } from "../src/lib/half-life-teacher-export.ts";
// @ts-expect-error Node runner resolves TypeScript directly.
import { halfLifeStorageSnapshot, validateHalfLifeSnapshot } from "../src/lib/half-life-classroom.ts";

test("teacher export retains answer sequence but excludes identifiers and unexpected measurement fields", () => {
  let inquiry = createInquiryState();
  inquiry = answerInquiryQuestion(inquiry, "individual", "yes");
  inquiry = answerInquiryQuestion(inquiry, "individual", "no");
  const data = [{ time: 10, remaining: 35, expected: 32, n: 64, halfLife: 10, seed: 23, student_id: "secret-id" }];
  const json = halfLifeResearchExport(inquiry, data, false, "json");
  const parsed = JSON.parse(json);
  assert.equal(parsed.questions[0].attempt, 1);
  assert.equal(parsed.questions[1].attempt, 2);
  assert.equal(parsed.questions[0].correct, false);
  assert.equal(parsed.questions[1].correct, true);
  assert.equal(parsed.measurements[0].remaining, 35);
  assert(!json.includes("secret-id"));
  assert(!json.includes("student_id"));
  const csv = halfLifeResearchExport(inquiry, data, false, "csv");
  assert(csv.includes("lan_tra_loi"));
  assert(!csv.includes("secret-id"));
});

test("exports saved attempts and recorded manual and automatic hints in CSV and JSON", () => {
  let inquiry = createInquiryState();
  inquiry = answerInquiryQuestion(inquiry, "individual", "yes");
  inquiry = answerInquiryQuestion(inquiry, "individual", "yes");
  inquiry = answerInquiryQuestion(inquiry, "individual", "no");
  const sessionId = "98a03c7a-73b3-47be-9def-116833068c54";
  const event = (type: string, data: Record<string, string | number | boolean>) => ({ schema: "half-life-event/1" as const, sessionId, at: "2026-11-13T00:00:00.000Z", type, data });
  const events = [event("hint_requested", { task: "observe", level: 1 }), event("hint_requested", { task: "observe", level: 2 }), event("prediction_or_answer", { task: "observe", automaticHints: 1 }), event("hint_requested", { task: "predict", level: 1 })];
  const measurement = [{ time: 10, remaining: 35, expected: 32, n: 64, halfLife: 10, seed: 23 }];
  const initial = validateHalfLifeSnapshot({ version: 1, inquiry, parameters: { initialCount: 64, halfLifeSeconds: 10, seed: 23 }, time: 10, measurements: measurement, events });
  assert.ok(initial);
  const restored = validateHalfLifeSnapshot(halfLifeStorageSnapshot(initial));
  assert.ok(restored);
  const json = halfLifeResearchExport(restored.inquiry, restored.measurements, true, "json", restored.events);
  const parsed = JSON.parse(json);
  assert.equal(parsed.schema, "half-life-teacher-export/2");
  assert.deepEqual(parsed.questions.slice(0, 3).map((row: { attempt: number; correct: boolean }) => [row.attempt, row.correct]), [[1, false], [2, false], [3, true]]);
  assert.equal(parsed.questions[0].hintRequestsLogged, 2);
  assert.equal(parsed.questions[0].automaticHintsLogged, 1);
  assert.equal(parsed.questions[0].hintLevels, inquiry.hintsUsed.observe);
  assert.deepEqual(parsed.measurements, measurement);
  assert(!json.includes(sessionId));
  assert(!json.includes("2026-11-13"));
  const csv = halfLifeResearchExport(restored.inquiry, restored.measurements, true, "csv", restored.events);
  assert(csv.includes('cap_goi_y_da_mo,lan_bam_goi_y_da_ghi,goi_y_tu_dong_da_ghi'));
  assert(csv.includes('"1","2","1"'));
  assert(!csv.includes(sessionId));
});
