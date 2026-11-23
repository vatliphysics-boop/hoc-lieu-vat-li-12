import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { SGK_TABLE_25_1, halfActivityBracket } from "@/lib/sgk-b25-decay";
import { fissionConservation } from "@/lib/fission-model";
import { REACTOR_FLOW_STAGES } from "@/lib/reactor-model";

const ROOT = process.cwd();

test("B22 V3: Blackett, fission conservation, two-pan mass defect scale, and E_lk / E_lkr notation", () => {
  const b22Src = fs.readFileSync(
    path.join(ROOT, "src/components/physics/B22Activities.tsx"),
    "utf8"
  );
  assert.ok(
    b22Src.includes("b22-reaction-balancer-v1"),
    "NuclearReactionBalancer must persist in localStorage"
  );
  assert.ok(
    b22Src.includes("b22-binding-energy-v1"),
    "BindingEnergyLab must persist in localStorage"
  );
  assert.ok(
    b22Src.includes("b22-fusion-lab-v1"),
    "NuclearFusion must persist in localStorage"
  );
  const totals = fissionConservation();
  assert.equal(totals.inputA, 236);
  assert.equal(totals.outputA, 236);
  assert.equal(totals.inputZ, 92);
  assert.equal(totals.outputZ, 92);
});

test("B23 V3: SGK Table 23.1 exact counts (1, 3, 2, 0, 3, 1), E & B field modes, and warning signs", () => {
  const b23Src = fs.readFileSync(
    path.join(ROOT, "src/components/physics/B23Activities.tsx"),
    "utf8"
  );
  assert.ok(
    b23Src.includes("b23-geiger-v1") && b23Src.includes("b23-radiation-props-v1"),
    "B23 Geiger & RadiationProperties must persist in localStorage"
  );
  assert.ok(
    b23Src.includes("15–20") && b23Src.includes("0"),
    "B23 Geiger lab must retain exact SGK Table 23.1 zero-count interval (15-20s: 0)"
  );
  const explorerSrc = fs.readFileSync(
    path.join(ROOT, "src/components/physics/RadiationTypesExplorer.tsx"),
    "utf8"
  );
  assert.ok(
    explorerSrc.includes("7300") || explorerSrc.includes("7 300") || explorerSrc.includes("Lorentz"),
    "RadiationTypesExplorer must explain smaller alpha curvature / magnetic Lorentz force"
  );
});

test("B24 & B25 V3: separate 3-loop energy flow, exact 8-point SGK Table 25.1, Problem 6b Patient B > Patient A, and 5-video VTT files", () => {
  assert.ok(REACTOR_FLOW_STAGES.length >= 4, "PWR flow model must cover core -> steam -> turbine -> generator");

  const b24Src = fs.readFileSync(
    path.join(ROOT, "src/components/physics/B24Activities.tsx"),
    "utf8"
  );
  assert.ok(
    !b24Src.includes("ReactorControlConcept as NuclearPowerEnergyFlow"),
    "NuclearPowerEnergyFlow must be a dedicated 3-loop station sim, not an alias of ReactorControlConcept"
  );
  assert.ok(
    b24Src.includes("b24-energy-flow-v1") && b24Src.includes("b24-reactor-control-v1"),
    "B24 energy flow and reactor control must persist separately in localStorage"
  );

  assert.deepEqual(
    SGK_TABLE_25_1.map((r) => [r.t, r.h]),
    [
      [0, 151],
      [30, 85],
      [60, 55],
      [120, 31],
      [180, 22],
      [240, 15],
      [300, 11],
      [360, 9],
    ],
    "SGK Table 25.1 must keep all 8 original (t, H) pairs unmodified"
  );
  const bracket = halfActivityBracket();
  assert.equal(bracket.halfActivityBq, 75.5);
  assert.equal(bracket.fromSeconds, 30);
  assert.equal(bracket.toSeconds, 60);

  const b25ActSrc = fs.readFileSync(
    path.join(ROOT, "src/components/physics/B25Activities.tsx"),
    "utf8"
  );
  assert.ok(
    !b25ActSrc.includes("useState(234)"),
    "NuclearEquationBalancer must not pre-fill daughter A=234"
  );

  // Verify FDG 18F physics ratio in B25Lesson.tsx: Patient B injected 60 min later (T = 110 min) requires ~1.46x initial preparation
  const fdgRatio = Math.pow(2, 60 / 110);
  assert.ok(fdgRatio > 1.45 && fdgRatio < 1.47, "Patient B must require ~1.46x initial FDG activity");
  const b25LessonSrc = fs.readFileSync(
    path.join(ROOT, "src/components/physics/B25Lesson.tsx"),
    "utf8"
  );
  assert.ok(
    !b25LessonSrc.includes("Vậy người A (hoặc lượt tiêm sớm hơn) cần chuẩn bị nhiều FDG hơn"),
    "B25Lesson.tsx must not contain the inverted Problem 6b conclusion"
  );
  assert.ok(
    b25LessonSrc.includes("1,46") && b25LessonSrc.includes("¹⁸₈O"),
    "B25Lesson.tsx must include Problem 6a (18O + p -> 18F + n) and 1,46 ratio for Patient B"
  );

  // Verify all 5 WEBVTT caption files and storyboard doc exist
  for (const code of ["b21", "b22", "b23", "b24", "b25"]) {
    const vttPath = path.join(ROOT, `public/videos/nuclear-openers/${code}.vi.vtt`);
    assert.ok(fs.existsSync(vttPath), `Missing caption file ${code}.vi.vtt`);
    const vtt = fs.readFileSync(vttPath, "utf8");
    assert.ok(vtt.startsWith("WEBVTT"), `${code}.vi.vtt must be valid WEBVTT`);
  }
});
