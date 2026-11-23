import { INQUIRY_TASKS, answerInquiryQuestion, createInquiryState, recordInquiryAction, type InquiryAction, type InquiryState } from "./half-life-inquiry";
import { createDecaySample, decayState, type DecayParameters } from "./radioactive-decay-model";
import type { PilotEvent, PilotEventType } from "./half-life-analytics";

export type HalfLifeMeasurement = { time: number; remaining: number; expected: number; n: number; halfLife: number; seed: number };
export type HalfLifeSnapshot = { version: 1; inquiry: InquiryState; parameters: DecayParameters; time: number; measurements: HalfLifeMeasurement[]; events: PilotEvent[] };

const actionIds: readonly InquiryAction[] = ["rotate", "accessible_observation", "observe_2t", "change_half_life", "repeat", "measure"];
const eventTypes: readonly PilotEventType[] = ["session_started", "parameter_changed", "simulation_started", "simulation_reset", "measurement", "camera_rotated", "accessible_observation", "prediction_or_answer", "hint_requested", "task_completed", "active_seconds"];
const eventNumberKeys = new Set(["initialCount", "halfLifeSeconds", "seed", "time", "remaining", "expected", "level", "seconds", "automaticHints"]);
const eventBooleanKeys = new Set(["running", "correct", "taskCompleted"]);
const eventStringKeys = new Set(["task", "question", "answer"]);
const validIdentifiers = new Set(INQUIRY_TASKS.flatMap(task => [task.id, ...task.questions.flatMap(question => [question.id, ...question.options.map(option => option.id)])]));
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
const number = (value: unknown, min: number, max: number): value is number => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const integer = (value: unknown, min: number, max: number): value is number => number(value, min, max) && Number.isInteger(value);
const validParameters = (value: unknown): value is DecayParameters => object(value) && integer(value.initialCount, 32, 256) && value.initialCount % 32 === 0 && integer(value.halfLifeSeconds, 5, 60) && value.halfLifeSeconds % 5 === 0 && integer(value.seed, 0, 999999);

/** Validate and reconstruct an allow-listed payload. It contains no free-text fields. */
export function validateHalfLifeSnapshot(value: unknown): HalfLifeSnapshot | null {
  if (!object(value) || value.version !== 1 || !validParameters(value.parameters) || !number(value.time, 0, 180) || !object(value.inquiry) || value.inquiry.version !== 1 || !Array.isArray(value.inquiry.actions) || !Array.isArray(value.inquiry.attempts) || !object(value.inquiry.hintsUsed) || !Array.isArray(value.measurements) || value.measurements.length > 30 || !Array.isArray(value.events) || value.events.length > 2000) return null;
  const parameters = { initialCount: value.parameters.initialCount, halfLifeSeconds: value.parameters.halfLifeSeconds, seed: value.parameters.seed };
  let inquiry = createInquiryState();
  for (const action of value.inquiry.actions) {
    if (!actionIds.includes(action as InquiryAction)) return null;
    inquiry = recordInquiryAction(inquiry, action as InquiryAction);
  }
  if (value.inquiry.attempts.length > 500) return null;
  for (const attempt of value.inquiry.attempts) {
    if (!object(attempt) || typeof attempt.questionId !== "string" || typeof attempt.answerId !== "string" || typeof attempt.correct !== "boolean") return null;
    const next = answerInquiryQuestion(inquiry, attempt.questionId, attempt.answerId);
    if (next === inquiry || next.attempts.at(-1)?.correct !== attempt.correct) return null;
    inquiry = next;
  }
  if (value.inquiry.taskIndex !== inquiry.taskIndex || value.inquiry.questionIndex !== inquiry.questionIndex) return null;
  const hintsUsed: Record<string, number> = {};
  for (const [key, level] of Object.entries(value.inquiry.hintsUsed)) {
    if (!INQUIRY_TASKS.some(task => task.id === key) || !integer(level, 0, 3)) return null;
    hintsUsed[key] = level;
  }
  inquiry.hintsUsed = hintsUsed;
  const measurements: HalfLifeMeasurement[] = [];
  for (const row of value.measurements) {
    if (!object(row) || !number(row.time, 0, 180) || !integer(row.n, 32, 256) || row.n % 32 !== 0 || !integer(row.halfLife, 5, 60) || row.halfLife % 5 !== 0 || !integer(row.seed, 0, 999999) || !integer(row.remaining, 0, row.n) || !number(row.expected, 0, row.n)) return null;
    const state = decayState(createDecaySample({ initialCount: row.n, halfLifeSeconds: row.halfLife, seed: row.seed }), row.time);
    if (state.remaining !== row.remaining || Math.abs(state.expected - row.expected) > 1e-6) return null;
    measurements.push({ time: row.time, remaining: row.remaining, expected: row.expected, n: row.n, halfLife: row.halfLife, seed: row.seed });
  }
  const events: PilotEvent[] = [];
  for (const event of value.events) {
    if (!object(event) || event.schema !== "half-life-event/1" || typeof event.sessionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.sessionId) || typeof event.at !== "string" || event.at.length > 32 || !Number.isFinite(Date.parse(event.at)) || !eventTypes.includes(event.type as PilotEventType) || !object(event.data)) return null;
    const data: PilotEvent["data"] = {};
    for (const [key, entry] of Object.entries(event.data)) {
      if (eventNumberKeys.has(key) && number(entry, 0, 1000000)) data[key] = entry;
      else if (eventBooleanKeys.has(key) && typeof entry === "boolean") data[key] = entry;
      else if (eventStringKeys.has(key) && typeof entry === "string" && validIdentifiers.has(entry)) data[key] = entry;
      else return null;
    }
    events.push({ schema: "half-life-event/1", sessionId: event.sessionId, at: event.at, type: event.type as PilotEventType, data });
  }
  return { version: 1, inquiry, parameters, time: value.time, measurements, events };
}

/** Feedback is reconstructed by the inquiry engine and is never persisted as free text. */
export function halfLifeStorageSnapshot(snapshot: HalfLifeSnapshot): HalfLifeSnapshot {
  return { ...snapshot, inquiry: { ...snapshot.inquiry, feedback: "" } };
}
