import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node test runner imports TypeScript.
import { parseB21LocalSnapshot } from "../src/lib/b21-local.ts";
// @ts-expect-error Node test runner imports TypeScript.
import { createRutherfordRun } from "../src/lib/rutherford-model.ts";

function snapshot() {
  const run = createRutherfordRun({ impactFm: 10, energyMeV: 8 });
  return { version: 1, mode: "task", scene: 2, isotope: "C14", parameters: { impactFm: 10, energyMeV: 8 }, time: run.durationZs, speed: 2,
    readings: [{ id: 1, impactFm: 10, energyMeV: 8, scattering: run.scatteringAngleDeg, detector: run.detectorAngleDeg }], readingSequence: 1, prediction: "larger", predictionAt: 0, explanation: "repulsion" };
}

test("B21 local snapshot round-trips validated parameters, evidence and clock", () => {
  const input = snapshot();
  assert.deepEqual(parseB21LocalSnapshot(JSON.parse(JSON.stringify(input))), input);
  const cleaned = parseB21LocalSnapshot({ ...input, extra: "ignored" });
  assert.ok(cleaned && !("extra" in cleaned));
});

test("B21 rejects malformed state, impossible evidence and future prediction", () => {
  const input = snapshot();
  assert.equal(parseB21LocalSnapshot({ ...input, parameters: { impactFm: -1, energyMeV: 8 } }), null);
  assert.equal(parseB21LocalSnapshot({ ...input, time: Infinity }), null);
  assert.equal(parseB21LocalSnapshot({ ...input, predictionAt: 2 }), null);
  assert.equal(parseB21LocalSnapshot({ ...input, readings: [{ ...input.readings[0], detector: 1 }] }), null);
  assert.equal(parseB21LocalSnapshot({ ...input, version: 2 }), null);
});
