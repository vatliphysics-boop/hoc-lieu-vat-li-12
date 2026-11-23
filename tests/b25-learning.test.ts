import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node loads TypeScript directly.
import { initialB25LearningState, reduceB25Learning, b25Reading, isB25Complete, restoreB25Learning } from "../src/lib/b25-learning.ts";
// @ts-expect-error Node loads TypeScript directly.
import { SGK_TABLE_25_1 } from "../src/lib/sgk-b25-decay.ts";

test("B25 compares hypotheses to the same unchanged SGK data", () => {
  const baseline = JSON.stringify(SGK_TABLE_25_1);
  const a = b25Reading({ time: 30, hypothesis: 40 });
  const b = b25Reading({ time: 30, hypothesis: 60 });
  assert.equal(a?.measured, 85);
  assert.equal(b?.measured, 85);
  assert.ok(Math.abs(a!.residual) < Math.abs(b!.residual));
  assert.equal(b25Reading({ time: 29, hypothesis: 40 }), null);
  assert.equal(JSON.stringify(SGK_TABLE_25_1), baseline);
});
test("guide navigation preserves data; completion needs comparison and two points", () => {
  let s = initialB25LearningState();
  s = reduceB25Learning(s, { type: "prediction", value: 40 });
  s = reduceB25Learning(s, { type: "time", value: 30 });
  s = reduceB25Learning(s, { type: "record" });
  s = reduceB25Learning(s, { type: "halfLife", value: 60 });
  s = reduceB25Learning(s, { type: "record" });
  s = reduceB25Learning(s, { type: "explanation", value: "limits" });
  assert.equal(isB25Complete(s), false);
  s = reduceB25Learning(s, { type: "time", value: 60 });
  s = reduceB25Learning(s, { type: "record" });
  const next = reduceB25Learning(reduceB25Learning(s, { type: "mode", value: "explore" }), { type: "guide", value: 3 });
  assert.equal(next.time, 60);
  assert.deepEqual(next.readings, s.readings);
  assert.equal(isB25Complete(next), true);
  assert.deepEqual(restoreB25Learning(JSON.parse(JSON.stringify(next))), next);
  assert.equal(restoreB25Learning({ ...next, readings: [{ time: 29, hypothesis: 40 }] }), null);
});

test("free exploration before a prediction is preserved but cannot satisfy later task evidence", () => {
  let s = initialB25LearningState();
  s = reduceB25Learning(s, { type: "mode", value: "explore" });
  s = reduceB25Learning(s, { type: "time", value: 30 });
  s = reduceB25Learning(s, { type: "record" });
  s = reduceB25Learning(s, { type: "halfLife", value: 60 });
  s = reduceB25Learning(s, { type: "record" });
  s = reduceB25Learning(s, { type: "time", value: 60 });
  s = reduceB25Learning(s, { type: "record" });
  s = reduceB25Learning(s, { type: "prediction", value: 40 });
  s = reduceB25Learning(s, { type: "explanation", value: "limits" });
  assert.equal(s.readings.length, 3);
  assert.equal(isB25Complete(s), false);
});
