import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's TypeScript test runner.
import { halfLifeStorageSnapshot, validateHalfLifeSnapshot } from "../src/lib/half-life-classroom.ts";
// @ts-expect-error Node's TypeScript test runner.
import { answerInquiryQuestion, createInquiryState } from "../src/lib/half-life-inquiry.ts";
// @ts-expect-error Node's TypeScript test runner.
import { createDecaySample, decayState } from "../src/lib/radioactive-decay-model.ts";

function sample() {
  const parameters = { initialCount: 64, halfLifeSeconds: 10, seed: 23 };
  const state = decayState(createDecaySample(parameters), 10);
  return { version: 1, inquiry: createInquiryState(), parameters, time: 10,
    measurements: [{ time: 10, remaining: state.remaining, expected: state.expected, n: 64, halfLife: 10, seed: 23 }],
    events: [{ schema: "half-life-event/1", sessionId: "98a03c7a-73b3-47be-9def-116833068c54", at: "2026-11-13T00:00:00.000Z", type: "measurement", data: { remaining: state.remaining, automaticHints: 1 } }] };
}

test("snapshot validation retains only schema fields and checks physics measurements", () => {
  const input = sample();
  assert.ok(validateHalfLifeSnapshot(input));
  const extra = { ...input, name: "private", inquiry: { ...input.inquiry, feedback: "private" } };
  const cleaned = validateHalfLifeSnapshot(extra)!;
  assert.equal("name" in cleaned, false);
  assert.equal(cleaned.inquiry.feedback, "");
  assert.equal(validateHalfLifeSnapshot({ ...input, measurements: [{ ...input.measurements[0], remaining: 1 }] }), null);
});

test("snapshot validation rejects identifying event payloads and forged completion state", () => {
  const input = sample();
  assert.equal(validateHalfLifeSnapshot({ ...input, events: [{ ...input.events[0], data: { full_name: "private" } }] }), null);
  assert.equal(validateHalfLifeSnapshot({ ...input, inquiry: { ...input.inquiry, taskIndex: 5 } }), null);
  assert.equal(validateHalfLifeSnapshot({ ...input, parameters: { ...input.parameters, halfLifeSeconds: 0 } }), null);
});


test("wrong and correct answers store no feedback text and are reconstructed on load", () => {
  const input = sample();
  const wrong = answerInquiryQuestion(input.inquiry, "individual", "yes");
  const correct = answerInquiryQuestion(wrong, "individual", "no");
  for (const inquiry of [wrong, correct]) {
    assert.ok(inquiry.feedback.length > 0);
    const validated = validateHalfLifeSnapshot({ ...input, inquiry });
    assert.ok(validated);
    const stored = halfLifeStorageSnapshot(validated);
    assert.equal(stored.inquiry.feedback, "");
    assert.equal(validateHalfLifeSnapshot(stored)?.inquiry.feedback, inquiry.feedback);
  }
});
