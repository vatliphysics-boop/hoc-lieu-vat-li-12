import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's test runner loads TypeScript directly.
import { hasB21ControlledComparison, isB21InquiryComplete } from "../src/lib/b21-inquiry.ts";

const first = { id: 1, impactFm: 90, energyMeV: 8, scattering: 18, detector: 49 };
const second = { id: 2, impactFm: 10, energyMeV: 8, scattering: 110, detector: 113 };
const third = { id: 3, impactFm: 10, energyMeV: 6, scattering: 120, detector: 130 };

test("B21 completion requires a controlled comparison after a prediction and an explanation", () => {
  assert.equal(hasB21ControlledComparison([first, second], null), false);
  assert.equal(hasB21ControlledComparison([first, second], 1), false);
  assert.equal(hasB21ControlledComparison([first, third], 0), false);
  assert.equal(hasB21ControlledComparison([first, second], 0), true);
  assert.equal(isB21InquiryComplete("smaller", "repulsion", [first, second], 0), false);
  assert.equal(isB21InquiryComplete("larger", "collision", [first, second], 0), false);
  assert.equal(isB21InquiryComplete("larger", "repulsion", [first, second], 0), true);
});
