import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node test runner loads TypeScript directly.
import { initialFissionLearningState, reduceFissionLearning, isFissionLearningComplete, restoreFissionLearning } from "../src/lib/fission-learning.ts";

test("guide and mode navigation preserve experiment time and recorded evidence", () => {
  let state = initialFissionLearningState();
  state = reduceFissionLearning(state, { type: "time", value: 7 });
  state = reduceFissionLearning(state, { type: "measure" });
  const changed = reduceFissionLearning(reduceFissionLearning(state, { type: "mode", value: "explore" }), { type: "guide", value: 3 });
  assert.equal(changed.time, 7);
  assert.deepEqual(changed.measurements, state.measurements);
  assert.equal(reduceFissionLearning(changed, { type: "reset" }).measurements.length, 1);
});
test("completion needs prediction, both conditions and a conservation explanation", () => {
  let state = initialFissionLearningState();
  state = reduceFissionLearning(state, { type: "prediction", value: 2 });
  state = reduceFissionLearning(state, { type: "measure" });
  assert.equal(state.measurements.length, 0);
  state = reduceFissionLearning(state, { type: "time", value: 7 });
  state = reduceFissionLearning(state, { type: "measure" });
  state = reduceFissionLearning(state, { type: "incident", value: false });
  state = reduceFissionLearning(state, { type: "measure" });
  assert.equal(isFissionLearningComplete(state), false);
  state = reduceFissionLearning(state, { type: "explain", value: "conservation" });
  assert.equal(isFissionLearningComplete(state), true);
  assert.deepEqual(state.measurements.map(m => m.freeNeutrons), [3, 0]);
  assert.deepEqual(restoreFissionLearning(JSON.parse(JSON.stringify(state))), state);
  assert.equal(restoreFissionLearning({ ...state, measurements: [{ incident: true, time: 0, freeNeutrons: 3 }] }), null);
});
