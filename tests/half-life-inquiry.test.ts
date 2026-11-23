import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node test runner loads TypeScript.
import { INQUIRY_TASKS, createInquiryState, getInquiryPrompt, recordInquiryAction, answerInquiryQuestion, requestInquiryHint } from "../src/lib/half-life-inquiry.ts";

test("tasks and questions expose explicit pedagogical and behavioral requirements", () => {
  assert.equal(INQUIRY_TASKS.length, 5);
  assert(INQUIRY_TASKS.reduce((count: number, task: { questions: readonly unknown[] }) => count + task.questions.length, 0) >= 10);
  for (const task of INQUIRY_TASKS) {
    assert(task.objective && task.prerequisite && task.background && task.action && task.observation && task.completion);
    assert.equal(task.hints.length, 3);
    assert(task.questions.some((question: { requires?: string }) => question.requires));
  }
});

test("actions gate progress, wrong prediction produces a scaffold and preserves both attempts", () => {
  let state = createInquiryState();
  state = answerInquiryQuestion(state, "individual", "no");
  assert.equal(getInquiryPrompt(state)?.blocked, true);
  assert.deepEqual(answerInquiryQuestion(state, "rotation", "view"), state);
  state = recordInquiryAction(state, "rotate");
  state = answerInquiryQuestion(state, "rotation", "view");
  state = answerInquiryQuestion(state, "two_periods", "50");
  assert.match(state.feedback, /chu kì thứ hai/);
  assert.equal(getInquiryPrompt(state)?.question.id, "two_periods");
  state = answerInquiryQuestion(state, "two_periods", "25");
  assert.deepEqual(state.attempts.filter((a: { questionId: string }) => a.questionId === "two_periods").map((a: {answerId: string}) => a.answerId), ["50", "25"]);
  assert.equal(getInquiryPrompt(state)?.blocked, true);
  assert.deepEqual(answerInquiryQuestion(state, "reference", "remaining"), state);
  state = recordInquiryAction(state, "observe_2t");
  state = answerInquiryQuestion(state, "reference", "remaining");
  assert.equal(getInquiryPrompt(state)?.task.id, "measure");
});

test("three hints are progressive and completion needs all required evidence", () => {
  let state = createInquiryState();
  const hints: string[] = [];
  for (let i = 0; i < 4; i++) {
    const result = requestInquiryHint(state); state = result.state; hints.push(result.hint);
  }
  assert.equal(new Set(hints).size, 3);
  assert.equal(hints[2], hints[3]);
  for (const task of INQUIRY_TASKS) {
    for (const question of task.questions) {
      if (question.requires) state = recordInquiryAction(state, question.requires);
      state = answerInquiryQuestion(state, question.id, question.correct);
    }
  }
  assert.equal(getInquiryPrompt(state), null);
  assert.equal(state.attempts.length, 10);
});


test("accessible observation unlocks the view question without recording a rotation", () => {
  let state = answerInquiryQuestion(createInquiryState(), "individual", "no");
  state = recordInquiryAction(state, "measure");
  assert.equal(getInquiryPrompt(state)?.blocked, true);
  state = recordInquiryAction(state, "accessible_observation");
  assert.equal(getInquiryPrompt(state)?.blocked, false);
  assert(state.actions.includes("accessible_observation"));
  assert(!state.actions.includes("rotate"));
  state = answerInquiryQuestion(state, "rotation", "view");
  assert.equal(getInquiryPrompt(state)?.task.id, "predict");
});

test("repeated misconceptions progressively reveal the three hints and retain all attempts", () => {
  let state = createInquiryState();
  state = answerInquiryQuestion(state, "individual", "yes");
  assert.equal(state.hintsUsed.observe, undefined);
  state = answerInquiryQuestion(state, "individual", "yes");
  assert.equal(state.hintsUsed.observe, 1);
  assert.match(state.feedback, /Gợi ý 1/);
  state = answerInquiryQuestion(state, "individual", "yes");
  assert.equal(state.hintsUsed.observe, 2);
  state = answerInquiryQuestion(state, "individual", "yes");
  assert.equal(state.hintsUsed.observe, 3);
  state = answerInquiryQuestion(state, "individual", "yes");
  assert.equal(state.hintsUsed.observe, 3);
  assert.equal(state.attempts.length, 5);
  assert.equal(getInquiryPrompt(state)?.question.id, "individual");
});
