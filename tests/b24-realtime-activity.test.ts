import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Native Node TypeScript test runner.
import { measureReactor, hasReactorComparison } from "../src/lib/b24-realtime-activity.ts";

test("reactor activity compares two rod settings at equal generation", () => {
  const shallow = measureReactor(0, 4), deep = measureReactor(100, 4);
  assert.equal(shallow.generation, 4);
  assert.equal(deep.generation, 4);
  assert.ok(shallow.expected > 1);
  assert.ok(deep.expected < 1);
  assert.ok(hasReactorComparison([shallow, deep]));
  assert.equal(hasReactorComparison([measureReactor(0, 3), deep]), false);
  assert.equal(hasReactorComparison([measureReactor(50, 4), deep]), false);
});

// @ts-expect-error Native Node TypeScript test runner.
import { validateB24LocalSnapshot } from "../src/lib/b24-realtime-activity.ts";

test("B24 saved state round-trips and rejects tampered or out-of-range measurements", () => {
  const snapshot = { version: 1, rod: 80, time: 4, selected: 2, prediction: "down", explanation: "absorption", rows: [measureReactor(0, 4), measureReactor(100, 4)] };
  assert.deepEqual(validateB24LocalSnapshot(JSON.parse(JSON.stringify(snapshot))), snapshot);
  assert.equal(validateB24LocalSnapshot({ ...snapshot, rod: 101 }), null);
  assert.equal(validateB24LocalSnapshot({ ...snapshot, rows: [{ ...snapshot.rows[0], expected: 999 }] }), null);
  assert.equal(validateB24LocalSnapshot({ ...snapshot, prediction: "personal text" }), null);
});
