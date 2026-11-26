/**
 * Unit tests for Rutherford apparatus V3 physics engine
 * Tests pure functions, no UI dependencies
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  createRutherfordRun,
  sampleRutherford,
  rutherfordTrail,
  generateAngularHistogram,
  generateRutherfordDistribution,
  RUTHERFORD_GOLD_Z,
  RUTHERFORD_ALPHA_Z,
  RUTHERFORD_DETECTOR_RADIUS_FM,
  RUTHERFORD_LIMITS,
} from "../src/simulations-v3/physics/rutherford-engine";

test("Rutherford V3 physics engine", async (t) => {
  await t.test("createRutherfordRun: computes geometry for valid settings", () => {
    const run = createRutherfordRun({ impactFm: 10, energyMeV: 8 });
    assert.ok(Number.isFinite(run.durationZs));
    assert.ok(run.durationZs > 0);
    assert.ok(Number.isFinite(run.scatteringAngleDeg));
    assert.ok(run.scatteringAngleDeg >= 0 && run.scatteringAngleDeg <= 180);
    assert.ok(Number.isFinite(run.closestApproachFm));
    assert.ok(run.closestApproachFm > 0);
  });

  await t.test("createRutherfordRun: throws on out-of-range parameters", () => {
    assert.throws(() => createRutherfordRun({ impactFm: -5, energyMeV: 8 }), RangeError);
    assert.throws(() => createRutherfordRun({ impactFm: 10, energyMeV: 1 }), RangeError);
    assert.throws(() => createRutherfordRun({ impactFm: 200, energyMeV: 8 }), RangeError);
    assert.throws(() => createRutherfordRun({ impactFm: 10, energyMeV: 15 }), RangeError);
  });

  await t.test("sampleRutherford: samples at start, middle, and end", () => {
    const run = createRutherfordRun({ impactFm: 50, energyMeV: 6 });
    const start = sampleRutherford(run, 0);
    const mid = sampleRutherford(run, run.durationZs / 2);
    const end = sampleRutherford(run, run.durationZs);

    // Start position should be at detector radius
    assert.ok(Math.abs(start.radiusFm - RUTHERFORD_DETECTOR_RADIUS_FM) < 1);
    // Mid position should be closer to foil
    assert.ok(mid.radiusFm < start.radiusFm);
    // End position should be back at detector radius
    assert.ok(Math.abs(end.radiusFm - RUTHERFORD_DETECTOR_RADIUS_FM) < 1);

    // Velocity should always be finite
    assert.ok(Number.isFinite(start.vxFmPerZs));
    assert.ok(Number.isFinite(mid.vxFmPerZs));
    assert.ok(Number.isFinite(end.vxFmPerZs));
  });

  await t.test("sampleRutherford: out-of-range time clamps to start/end", () => {
    const run = createRutherfordRun({ impactFm: 20, energyMeV: 7 });
    const before = sampleRutherford(run, -100);
    const after = sampleRutherford(run, run.durationZs + 100);

    assert.deepStrictEqual(before, run.start);
    assert.deepStrictEqual(after, run.hit);
  });

  await t.test("rutherfordTrail: generates expected number of points", () => {
    const run = createRutherfordRun({ impactFm: 15, energyMeV: 8 });
    const trail = rutherfordTrail(run, run.durationZs, 50);
    assert.strictEqual(trail.length, 50);

    // First point should match start, last should match hit
    const first = trail[0];
    const last = trail[trail.length - 1];
    assert.ok(Math.abs(first.radiusFm - run.start.radiusFm) < 0.1);
    assert.ok(Math.abs(last.radiusFm - run.hit.radiusFm) < 0.1);
  });

  await t.test("rutherfordTrail: throws on invalid point count", () => {
    const run = createRutherfordRun({ impactFm: 10, energyMeV: 8 });
    assert.throws(() => rutherfordTrail(run, run.durationZs, 1), RangeError);
    assert.throws(() => rutherfordTrail(run, run.durationZs, 1.5), RangeError);
  });

  await t.test("scattering angle: increases as impact parameter decreases (fixed energy)", () => {
    const run1 = createRutherfordRun({ impactFm: 80, energyMeV: 8 });
    const run2 = createRutherfordRun({ impactFm: 40, energyMeV: 8 });
    const run3 = createRutherfordRun({ impactFm: 10, energyMeV: 8 });

    assert.ok(run3.scatteringAngleDeg > run2.scatteringAngleDeg);
    assert.ok(run2.scatteringAngleDeg > run1.scatteringAngleDeg);
  });

  await t.test("scattering angle: decreases as energy increases (fixed impact)", () => {
    const run1 = createRutherfordRun({ impactFm: 20, energyMeV: 3 });
    const run2 = createRutherfordRun({ impactFm: 20, energyMeV: 6 });
    const run3 = createRutherfordRun({ impactFm: 20, energyMeV: 10 });

    assert.ok(run1.scatteringAngleDeg > run2.scatteringAngleDeg);
    assert.ok(run2.scatteringAngleDeg > run3.scatteringAngleDeg);
  });

  await t.test("closest approach: shrinks with higher energy (fixed impact)", () => {
    const run1 = createRutherfordRun({ impactFm: 30, energyMeV: 4 });
    const run2 = createRutherfordRun({ impactFm: 30, energyMeV: 9 });

    assert.ok(run1.closestApproachFm > run2.closestApproachFm);
  });

  await t.test("generateAngularHistogram: returns histogram from settings", () => {
    const settings = [
      { impactFm: 10, energyMeV: 8 },
      { impactFm: 50, energyMeV: 8 },
      { impactFm: 90, energyMeV: 8 },
    ];
    const histogram = generateAngularHistogram(settings, 10);

    assert.ok(Array.isArray(histogram));
    assert.ok(histogram.length > 0);
    // Each bin has angleDeg, count, binWidthDeg
    for (const bin of histogram) {
      assert.ok(Number.isFinite(bin.angleDeg));
      assert.ok(Number.isFinite(bin.count));
      assert.ok(bin.binWidthDeg > 0);
    }
    // At least one bin should have non-zero count
    const totalCount = histogram.reduce((sum, b) => sum + b.count, 0);
    assert.strictEqual(totalCount, settings.length);
  });

  await t.test("generateRutherfordDistribution: generates correct total count", () => {
    const totalCount = 500;
    const histogram = generateRutherfordDistribution(totalCount, 10, 42);

    const actualCount = histogram.reduce((sum, bin) => sum + bin.count, 0);
    assert.strictEqual(actualCount, totalCount);
  });

  await t.test("generateRutherfordDistribution: shows 1/sin⁴(θ/2) falloff", () => {
    const histogram = generateRutherfordDistribution(2000, 10, 42);

    // Find bins at small angles and large angles
    const bin10 = histogram.find((b) => Math.abs(b.angleDeg - 10) < 5);
    const bin90 = histogram.find((b) => Math.abs(b.angleDeg - 90) < 5);
    const bin150 = histogram.find((b) => Math.abs(b.angleDeg - 150) < 5);

    // Count should decrease dramatically from small to large angles
    if (bin10 && bin90 && bin150) {
      assert.ok(bin10.count > bin90.count);
      assert.ok(bin90.count > bin150.count);
    }
  });

  await t.test("generateRutherfordDistribution: same seed gives same result", () => {
    const h1 = generateRutherfordDistribution(100, 15, 123);
    const h2 = generateRutherfordDistribution(100, 15, 123);

    assert.strictEqual(h1.length, h2.length);
    for (let i = 0; i < h1.length; i++) {
      assert.strictEqual(h1[i].count, h2[i].count);
      assert.strictEqual(h1[i].angleDeg, h2[i].angleDeg);
    }
  });

  await t.test("generateRutherfordDistribution: different seed gives different result", () => {
    const h1 = generateRutherfordDistribution(500, 10, 42);
    const h2 = generateRutherfordDistribution(500, 10, 99);

    let different = false;
    for (let i = 0; i < h1.length; i++) {
      if (h1[i].count !== h2[i].count) {
        different = true;
        break;
      }
    }
    assert.ok(different, "Different seeds should produce different distributions");
  });

  await t.test("constants: verify physical values", () => {
    assert.strictEqual(RUTHERFORD_GOLD_Z, 79);
    assert.strictEqual(RUTHERFORD_ALPHA_Z, 2);
    assert.strictEqual(RUTHERFORD_DETECTOR_RADIUS_FM, 180);
  });

  await t.test("limits: verify parameter ranges", () => {
    assert.strictEqual(RUTHERFORD_LIMITS.impactFm.min, 0);
    assert.strictEqual(RUTHERFORD_LIMITS.impactFm.max, 100);
    assert.strictEqual(RUTHERFORD_LIMITS.energyMeV.min, 3);
    assert.strictEqual(RUTHERFORD_LIMITS.energyMeV.max, 10);
  });
});

test("Rutherford V3 component registry", async (t) => {
  const { RUTHERFORD_COMPONENTS, getRutherfordComponent, getRutherfordByCategory } = await import(
    "../src/simulations-v3/apparatus/rutherford/parts"
  );

  await t.test("registry contains expected components", () => {
    assert.ok(RUTHERFORD_COMPONENTS.length >= 8);
    assert.ok(getRutherfordComponent("alpha-source"));
    assert.ok(getRutherfordComponent("collimator"));
    assert.ok(getRutherfordComponent("gold-foil"));
    assert.ok(getRutherfordComponent("scintillation-screen"));
    assert.ok(getRutherfordComponent("rotating-microscope"));
  });

  await t.test("components have localized names", () => {
    const source = getRutherfordComponent("alpha-source");
    assert.ok(source);
    assert.ok(source.nameVi.length > 0);
    assert.ok(source.nameEn.length > 0);
    assert.ok(source.role.length > 0);
  });

  await t.test("getByCategory returns correct groups", () => {
    const sources = getRutherfordByCategory("source");
    const detectors = getRutherfordByCategory("detector");
    const targets = getRutherfordByCategory("target");

    assert.ok(sources.length > 0);
    assert.ok(detectors.length > 0);
    assert.ok(targets.length > 0);
    assert.ok(sources.every((c) => c.category === "source"));
  });
});

test("Rutherford V3 camera presets", async (t) => {
  const { CAMERA_PRESETS, getCameraPreset, getCameraName } = await import(
    "../src/simulations-v3/core/CameraPresets"
  );

  await t.test("presets cover all modes", () => {
    assert.ok(CAMERA_PRESETS.length >= 10);
    const modes = CAMERA_PRESETS.map((p) => p.mode);
    assert.ok(modes.includes("orbit"));
    assert.ok(modes.includes("front"));
    assert.ok(modes.includes("top"));
    assert.ok(modes.includes("cutaway"));
    assert.ok(modes.includes("exploded"));
    assert.ok(modes.includes("instrument"));
  });

  await t.test("getCameraPreset returns preset for valid mode", () => {
    const orbit = getCameraPreset("orbit");
    assert.ok(orbit);
    assert.strictEqual(orbit.mode, "orbit");
    assert.ok(orbit.nameVi.length > 0);
    assert.ok(orbit.description.length > 0);
  });

  await t.test("getCameraName returns localized name", () => {
    const name = getCameraName("orbit");
    assert.ok(name.length > 0);
    // Should not return the mode string itself
    assert.notStrictEqual(name, "orbit");
  });
});

test("Rutherford V3: comprehensive physics scenarios", async (t) => {
  await t.test("head-on collision (b=0 limit)", () => {
    // For b→0, angle should approach 180°
    const run = createRutherfordRun({ impactFm: 0.01, energyMeV: 8 });
    assert.ok(run.scatteringAngleDeg > 175);
  });

  await t.test("grazing trajectory (large b)", () => {
    // For large b, angle should be small
    // Independent calculation: k=227.52 MeV·fm, E=8 MeV, b=95 fm
    // θ = 2·arctan(k/(2Eb)) = 2·arctan(227.52/(2×8×95)) = 17.0261°
    // Engine should match within rounding tolerance
    const run = createRutherfordRun({ impactFm: 95, energyMeV: 8 });
    assert.ok(run.scatteringAngleDeg > 17.0 && run.scatteringAngleDeg < 17.1,
      `Expected θ ≈ 17.03° for b=95 fm, E=8 MeV; got ${run.scatteringAngleDeg.toFixed(3)}°`);
  });

  await t.test("trajectory is smooth (no NaN or Infinity)", () => {
    const run = createRutherfordRun({ impactFm: 25, energyMeV: 7 });
    const trail = rutherfordTrail(run, run.durationZs, 100);

    for (const point of trail) {
      assert.ok(Number.isFinite(point.xFm));
      assert.ok(Number.isFinite(point.yFm));
      assert.ok(Number.isFinite(point.vxFmPerZs));
      assert.ok(Number.isFinite(point.vyFmPerZs));
      assert.ok(Number.isFinite(point.radiusFm));
      assert.ok(point.radiusFm > 0);
    }
  });

  await t.test("equal E*b product yields equal scattering angle but distinct finite-screen detector angle", () => {
    const runA = createRutherfordRun({ impactFm: 10, energyMeV: 8 });
    const runB = createRutherfordRun({ impactFm: 20, energyMeV: 4 });

    // Asymptotic scattering angle depends only on E * b = 80 MeV·fm
    assert.ok(
      Math.abs(runA.scatteringAngleDeg - runB.scatteringAngleDeg) < 1e-12,
      `Expected identical scattering angles; got ${runA.scatteringAngleDeg} vs ${runB.scatteringAngleDeg}`,
    );
    assert.ok(Math.abs(runA.scatteringAngleDeg - 109.7662248622392) < 1e-6);

    // Finite detector screen (R = 180 fm) is fixed while hyperbola scales 2x in runB
    assert.ok(
      runB.detectorAngleDeg > runA.detectorAngleDeg,
      `Expected larger finite-screen detector angle for (20, 4); got ${runB.detectorAngleDeg} vs ${runA.detectorAngleDeg}`,
    );
    assert.ok(Math.abs(runA.detectorAngleDeg - 113.088) < 0.01);
    assert.ok(Math.abs(runB.detectorAngleDeg - 116.755) < 0.01);
    assert.ok(Math.abs(runB.closestApproachFm - 2 * runA.closestApproachFm) < 1e-9);
  });
});

test("Rutherford V3 student inquiry evaluation & onProgress criteria", async (t) => {
  const { evaluateRutherfordInquiry } = await import(
    "../src/simulations-v3/apparatus/rutherford/inquiry"
  );

  const runSmallB = {
    b: 10,
    e: 8,
    theta: createRutherfordRun({ impactFm: 10, energyMeV: 8 }).scatteringAngleDeg,
  };
  const runLargeB = {
    b: 60,
    e: 8,
    theta: createRutherfordRun({ impactFm: 60, energyMeV: 8 }).scatteringAngleDeg,
  };
  const runOtherE = {
    b: 20,
    e: 4,
    theta: createRutherfordRun({ impactFm: 20, energyMeV: 4 }).scatteringAngleDeg,
  };

  await t.test("just opened or only 1 run saved is not complete", () => {
    const empty = evaluateRutherfordInquiry({
      prediction: "",
      run1: null,
      run2: null,
      lastCapturedSlot: null,
      conclusion: "",
    });
    assert.strictEqual(empty.isComplete, false);
    assert.strictEqual(empty.savedRunCount, 0);

    const oneRun = evaluateRutherfordInquiry({
      prediction: "decrease",
      run1: runSmallB,
      run2: null,
      lastCapturedSlot: 1,
      conclusion: "Giải thích sớm",
    });
    assert.strictEqual(oneRun.isComplete, false);
    assert.strictEqual(oneRun.savedRunCount, 1);
    assert.strictEqual(oneRun.validComparison, false);
  });

  await t.test("verdict is decrease when b increases regardless of capture order", () => {
    const smallFirst = evaluateRutherfordInquiry({
      prediction: "decrease",
      run1: runSmallB,
      run2: runLargeB,
      lastCapturedSlot: 2,
      conclusion: "Khi b tăng thì khoảng cách tới hạt nhân tăng, lực đẩy Coulomb giảm nên góc lệch giảm.",
    });
    const largeFirst = evaluateRutherfordInquiry({
      prediction: "decrease",
      run1: runLargeB,
      run2: runSmallB,
      lastCapturedSlot: 2,
      conclusion: "Khi b giảm từ 60 xuống 10 fm thì góc lệch tăng, tức khi b tăng góc lệch giảm.",
    });

    assert.strictEqual(smallFirst.verdict, "decrease");
    assert.strictEqual(largeFirst.verdict, "decrease");
    assert.strictEqual(smallFirst.matchesPrediction, true);
    assert.strictEqual(largeFirst.matchesPrediction, true);
    assert.strictEqual(smallFirst.isComplete, true);
    assert.strictEqual(largeFirst.isComplete, true);
  });

  await t.test("different E or duplicate b blocks comparison/completion and identifies exact slot to remeasure", () => {
    const diffEnergySlot2 = evaluateRutherfordInquiry({
      prediction: "decrease",
      run1: runSmallB,
      run2: runOtherE,
      lastCapturedSlot: 2,
      conclusion: "Đã viết giải thích",
    });
    assert.strictEqual(diffEnergySlot2.validComparison, false);
    assert.strictEqual(diffEnergySlot2.isComplete, false);
    assert.strictEqual(diffEnergySlot2.invalidReason, "different_energy");
    assert.strictEqual(diffEnergySlot2.remeasureSlot, 2);
    assert.ok(diffEnergySlot2.remeasureGuidance?.includes("Lượt đo 2"));

    const diffEnergySlot1 = evaluateRutherfordInquiry({
      prediction: "decrease",
      run1: runOtherE,
      run2: runLargeB,
      lastCapturedSlot: 1,
      conclusion: "Đã viết giải thích",
    });
    assert.strictEqual(diffEnergySlot1.remeasureSlot, 1);
    assert.ok(diffEnergySlot1.remeasureGuidance?.includes("Lượt đo 1"));

    const duplicateB = evaluateRutherfordInquiry({
      prediction: "decrease",
      run1: runSmallB,
      run2: { ...runSmallB },
      lastCapturedSlot: 2,
      conclusion: "Đã viết giải thích",
    });
    assert.strictEqual(duplicateB.validComparison, false);
    assert.strictEqual(duplicateB.isComplete, false);
    assert.strictEqual(duplicateB.invalidReason, "same_impact");
    assert.strictEqual(duplicateB.remeasureSlot, 2);
    assert.ok(duplicateB.remeasureGuidance?.includes("trùng tham số va chạm"));
  });

  await t.test("respects contrary initial prediction and still completes once explained", () => {
    const contraryNoText = evaluateRutherfordInquiry({
      prediction: "increase",
      run1: runLargeB,
      run2: runSmallB,
      lastCapturedSlot: 2,
      conclusion: "   ",
    });
    assert.strictEqual(contraryNoText.verdict, "decrease");
    assert.strictEqual(contraryNoText.matchesPrediction, false);
    assert.strictEqual(contraryNoText.isComplete, false);

    const contraryWithExplanation = evaluateRutherfordInquiry({
      prediction: "increase",
      run1: runLargeB,
      run2: runSmallB,
      lastCapturedSlot: 2,
      conclusion: "Ban đầu em đoán góc tăng, nhưng đo thực tế cho thấy b tăng làm lực Coulomb yếu đi nên góc lệch giảm.",
    });
    assert.strictEqual(contraryWithExplanation.matchesPrediction, false);
    assert.strictEqual(contraryWithExplanation.isComplete, true);
  });
});

test("Rutherford V3 SGK Hình 21.2 R–D–S–M, positions (1)/(2), 3D geometry & state persistence", async (t) => {
  const {
    CORE_SGK_21_2_PARTS,
    RUTHERFORD_COMPONENTS,
    describeObserverPosition,
    parseRutherfordV3State,
    resolveRutherfordRaycastPart,
    sampleEqualTimeFlashCount,
  } = await import("../src/simulations-v3/apparatus/rutherford/parts");
  const {
    buildExplanatoryModelLayer,
    buildRutherfordApparatus,
    buildScintillationLayer,
    engineFmToWorld,
    setMicroscopeAngle,
  } = await import("../src/simulations-v3/apparatus/rutherford/geometry");

  await t.test("CORE_SGK_21_2_PARTS exposes primary R, D, S, M and supporting G, P", () => {
    const primarySymbols = CORE_SGK_21_2_PARTS.filter((p) => p.isPrimaryRDSM).map((p) => p.sgkSymbol);
    assert.deepStrictEqual(primarySymbols, ["R", "D", "S", "M"]);
    const allSymbols = CORE_SGK_21_2_PARTS.map((p) => p.sgkSymbol);
    assert.deepStrictEqual(allSymbols, ["R", "D", "S", "M", "G", "P"]);
  });

  await t.test("resolveRutherfordRaycastPart prioritizes inner parts (R, D, S, M) through outer glass G", () => {
    assert.strictEqual(
      resolveRutherfordRaycastPart(["chamber-window", "vacuum-chamber", "gold-foil", "base-platform"]),
      "gold-foil",
    );
    assert.strictEqual(
      resolveRutherfordRaycastPart(["chamber-window", "vacuum-chamber"]),
      "chamber-window",
    );
    assert.strictEqual(resolveRutherfordRaycastPart([]), null);
  });

  await t.test("describeObserverPosition & sampleEqualTimeFlashCount reflect Position (1) vs Position (2) ~10⁴ ratio", () => {
    const pos1 = describeObserverPosition(0);
    const mid = describeObserverPosition(45);
    const pos2 = describeObserverPosition(140);

    assert.strictEqual(pos1.zone, "position_1");
    assert.strictEqual(mid.zone, "intermediate");
    assert.strictEqual(pos2.zone, "position_2");
    assert.ok(pos2.relativeFrequencyLabel.includes("10⁴"));

    const flash1 = sampleEqualTimeFlashCount(0, 7);
    const flash2 = sampleEqualTimeFlashCount(140, 7);
    assert.ok(flash1.count > 9000);
    assert.ok(flash2.count >= 1 && flash2.count < 20);
  });

  await t.test("parseRutherfordV3State deep-clones and restores independent run1 & run2", () => {
    const raw = JSON.stringify({
      impactFm: 60,
      energyMeV: 8,
      cameraMode: "cutaway",
      selectedPartId: "gold-foil",
      showScintillation: true,
      showBeam: true,
      observerAngleDeg: 140,
      prediction: "decrease",
      run1: { b: 10, e: 8, theta: 109.77 },
      run2: { b: 60, e: 8, theta: 26.75 },
      lastCapturedSlot: 2,
      conclusion: "Khi b tăng thì góc lệch giảm do hạt α đi xa hạt nhân vàng hơn.",
    });

    const parsed = parseRutherfordV3State(raw);
    assert.strictEqual(parsed.cameraMode, "cutaway");
    assert.strictEqual(parsed.selectedPartId, "gold-foil");
    assert.strictEqual(parsed.observerAngleDeg, 140);
    assert.deepStrictEqual(parsed.run1, { b: 10, e: 8, theta: 109.77 });
    assert.deepStrictEqual(parsed.run2, { b: 60, e: 8, theta: 26.75 });
    assert.notStrictEqual(parsed.run1, parsed.run2);
  });

  await t.test("buildRutherfordApparatus builds unique meshes and separate trajectory/angle label anchors", () => {
    const built = buildRutherfordApparatus(RUTHERFORD_COMPONENTS);
    assert.strictEqual(built.size, RUTHERFORD_COMPONENTS.length);

    const meshRefs = new Set();
    for (const item of built.values()) {
      assert.ok(!meshRefs.has(item.mesh), `Duplicate mesh detected for ${item.id}`);
      meshRefs.add(item.mesh);
    }

    const mic = built.get("rotating-microscope");
    assert.ok(mic);
    setMicroscopeAngle(mic, 140);
    assert.ok(Math.abs(mic.mesh.rotation.y - (140 * Math.PI) / 180) < 1e-6);

    const run = createRutherfordRun({ impactFm: 20, energyMeV: 8 });
    const trail3D = rutherfordTrail(run, run.durationZs, 40).map((pt) =>
      engineFmToWorld(pt.xFm, pt.yFm),
    );
    const hit3D = trail3D[trail3D.length - 1] ?? null;

    const flashOff = buildScintillationLayer(hit3D, false);
    const flashOn = buildScintillationLayer(hit3D, true);
    assert.ok(flashOn.children.length > flashOff.children.length);

    const explanatory = buildExplanatoryModelLayer(
      trail3D,
      20,
      run.scatteringAngleDeg,
      run.detectorAngleDeg,
    );
    assert.ok(explanatory.group.children.length >= 4);
    assert.ok(
      explanatory.trajectoryLabelAnchor.distanceTo(explanatory.angleLabelAnchor) > 0.5,
      "Trajectory label anchor and angle label anchor must be distinct in 3D space",
    );
  });
});

