import test from "node:test";
import assert from "node:assert/strict";
import {
  countGeigerPulsesAtTime,
  GEIGER_GATE_DURATION_SEC,
  generateGeigerMeasurementWindow,
  SGK_TABLE_23_1_ROWS,
} from "../src/simulations-v3/physics/geiger-engine";
import {
  GEIGER_CAMERA_PRESETS,
  GEIGER_COMPONENTS,
  parseGeigerV3State,
  resolveGeigerRaycastPart,
} from "../src/simulations-v3/apparatus/geiger/parts";
import { buildGeigerApparatus } from "../src/simulations-v3/apparatus/geiger/geometry";
import {
  computeInitialForceSignY,
  computeRadiationFieldTrajectory,
  getTransmissionFactor,
} from "../src/simulations-v3/physics/radiation-field-engine";
import {
  createHalfLifeEnsemble,
  evaluateHalfLifeAtTime,
} from "../src/simulations-v3/physics/half-life-engine";
import {
  EMPTY_STUDENT_NOTEBOOK,
  getChapter4Lesson,
  recordPreClassPrediction,
} from "../src/lib/chapter4-lessons";

test("B23 Geiger–Müller V3 physics, SGK Table 23.1, 3D geometry & persistence", async (t) => {
  await t.test("SGK_TABLE_23_1_ROWS preserves exact 6x5s sequence 1, 3, 2, 0, 3, 1", () => {
    assert.strictEqual(SGK_TABLE_23_1_ROWS.length, 6);
    assert.deepStrictEqual(
      SGK_TABLE_23_1_ROWS.map((r) => r.pulses),
      [1, 3, 2, 0, 3, 1],
    );
    assert.ok(SGK_TABLE_23_1_ROWS.every((r) => r.durationSec === 5));
  });

  await t.test("generateGeigerMeasurementWindow is deterministic per seed, stochastic across seeds, and includes 0-pulse windows", () => {
    const w1 = generateGeigerMeasurementWindow(101, GEIGER_GATE_DURATION_SEC);
    const w1Repeat = generateGeigerMeasurementWindow(101, GEIGER_GATE_DURATION_SEC);
    assert.deepStrictEqual(w1, w1Repeat);

    // Seed 103 & Seed 104 give contrasting positive and 0-pulse windows cleanly
    const w103 = generateGeigerMeasurementWindow(103, 5);
    const w104 = generateGeigerMeasurementWindow(104, 5);
    assert.ok(w103.totalPulses > 0);
    assert.strictEqual(w104.totalPulses, 0);

    const observedCounts = new Set<number>();
    let sawZeroPulseRun = false;
    for (let seed = 1; seed <= 60; seed++) {
      const win = generateGeigerMeasurementWindow(seed, 5);
      assert.ok(win.totalPulses >= 0);
      assert.strictEqual(win.pulseTimestampsSec.length, win.totalPulses);
      assert.strictEqual(countGeigerPulsesAtTime(win, 0), 0);
      assert.strictEqual(countGeigerPulsesAtTime(win, 5), win.totalPulses);
      observedCounts.add(win.totalPulses);
      if (win.totalPulses === 0) sawZeroPulseRun = true;
    }
    assert.ok(observedCounts.size >= 3, "Multiple distinct pulse counts must occur across seeds");
    assert.ok(sawZeroPulseRun, "Poisson generator must naturally produce 0-pulse 5s runs");
  });

  await t.test("parseGeigerV3State preserves saved runs including 0-pulse runs and independent durations", () => {
    const raw = JSON.stringify({
      cameraMode: "display",
      selectedPartId: "signal-connectors",
      trialSeed: 105,
      status: "completed",
      durationSec: 5,
      completedPulses: 0,
      currentWindowSaved: true,
      savedRuns: [
        { id: 1, runNumber: 1, durationSec: 5, pulses: 3, trialSeed: 103 },
        { id: 2, runNumber: 2, durationSec: 5, pulses: 0, trialSeed: 104 },
      ],
    });
    const parsed = parseGeigerV3State(raw);
    assert.strictEqual(parsed.cameraMode, "display");
    assert.strictEqual(parsed.selectedPartId, "signal-connectors");
    assert.strictEqual(parsed.completedPulses, 0);
    assert.strictEqual(parsed.savedRuns.length, 2);
    assert.deepStrictEqual(parsed.savedRuns[0], {
      id: 1,
      runNumber: 1,
      durationSec: 5,
      pulses: 3,
      trialSeed: 103,
    });
    assert.deepStrictEqual(parsed.savedRuns[1], {
      id: 2,
      runNumber: 2,
      durationSec: 5,
      pulses: 0,
      trialSeed: 104,
    });
  });

  await t.test("Geiger 3D registry, camera presets, raycast priority, and unique 3D meshes", () => {
    assert.deepStrictEqual(
      GEIGER_CAMERA_PRESETS.map((p) => p.mode),
      ["overview", "probe", "display"],
    );
    assert.strictEqual(
      resolveGeigerRaycastPart(["counter-display", "signal-connectors"]),
      "signal-connectors",
    );

    const handles = buildGeigerApparatus(GEIGER_COMPONENTS);
    assert.strictEqual(handles.components.size, GEIGER_COMPONENTS.length);
    const meshSet = new Set();
    for (const [id, built] of handles.components) {
      assert.ok(!meshSet.has(built.mesh), `Duplicate mesh for ${id}`);
      meshSet.add(built.mesh);
    }
    handles.updateReadoutScreens({
      pulses: 3,
      elapsedSec: 5,
      durationSec: 5,
      status: "completed",
      pulseProgress: null,
    });
    handles.disposeLiveTextures();
  });
});

test("B23 Cloud Chamber & 3D Electric/Magnetic Field Deflection physics", async (t) => {
  await t.test("Electric field E and polarity reversal deflect α, β⁺ opposite to β⁻, while γ goes straight", () => {
    // Normal electric: top plate (+), bottom plate (-) => E points -Y
    assert.strictEqual(computeInitialForceSignY("alpha", "electric", "normal"), -1);
    assert.strictEqual(computeInitialForceSignY("beta_plus", "electric", "normal"), -1);
    assert.strictEqual(computeInitialForceSignY("beta_minus", "electric", "normal"), 1);
    assert.strictEqual(computeInitialForceSignY("gamma", "electric", "normal"), 0);

    // Reversed electric: top plate (-), bottom plate (+) => E points +Y
    assert.strictEqual(computeInitialForceSignY("alpha", "electric", "reversed"), 1);
    assert.strictEqual(computeInitialForceSignY("beta_plus", "electric", "reversed"), 1);
    assert.strictEqual(computeInitialForceSignY("beta_minus", "electric", "reversed"), -1);
    assert.strictEqual(computeInitialForceSignY("gamma", "electric", "reversed"), 0);
  });

  await t.test("Magnetic field B and polarity reversal obey Lorentz force q(v × B) and curvature |Δy_α| < |Δy_β|", () => {
    // Normal magnetic: B = (0, 0, -1) into screen (⊗), v = (+1, 0, 0) => v × B = (0, +1, 0)
    assert.strictEqual(computeInitialForceSignY("alpha", "magnetic", "normal"), 1);
    assert.strictEqual(computeInitialForceSignY("beta_plus", "magnetic", "normal"), 1);
    assert.strictEqual(computeInitialForceSignY("beta_minus", "magnetic", "normal"), -1);
    assert.strictEqual(computeInitialForceSignY("gamma", "magnetic", "normal"), 0);

    // Reversed magnetic: B = (0, 0, +1) out of screen (⊙) => v × B = (0, -1, 0)
    assert.strictEqual(computeInitialForceSignY("alpha", "magnetic", "reversed"), -1);
    assert.strictEqual(computeInitialForceSignY("beta_plus", "magnetic", "reversed"), -1);
    assert.strictEqual(computeInitialForceSignY("beta_minus", "magnetic", "reversed"), 1);
    assert.strictEqual(computeInitialForceSignY("gamma", "magnetic", "reversed"), 0);

    const alphaTraj = computeRadiationFieldTrajectory("alpha", "magnetic", "normal");
    const betaPlusTraj = computeRadiationFieldTrajectory("beta_plus", "magnetic", "normal");
    const betaMinusTraj = computeRadiationFieldTrajectory("beta_minus", "magnetic", "normal");
    const gammaTraj = computeRadiationFieldTrajectory("gamma", "magnetic", "normal");

    const endAlphaY = alphaTraj.explanatoryPoints.at(-1)!.y;
    const endBetaPlusY = betaPlusTraj.explanatoryPoints.at(-1)!.y;
    const endBetaMinusY = betaMinusTraj.explanatoryPoints.at(-1)!.y;

    assert.ok(endAlphaY > 0 && endAlphaY < endBetaPlusY, "α deflects upward less than β⁺ due to larger mass");
    assert.strictEqual(endBetaPlusY, -endBetaMinusY, "β⁺ and β⁻ deflect symmetrically in opposite directions");
    assert.ok(gammaTraj.explanatoryPoints.every((pt) => pt.y === 0), "γ trajectory remains strictly straight (y = 0)");
    assert.ok(alphaTraj.condensationDroplets.length > gammaTraj.condensationDroplets.length);
  });

  await t.test("Absorber transmission matches SGK Hình 23.4 (paper stops α, Al stops β, Pb attenuates γ)", () => {
    assert.strictEqual(getTransmissionFactor("alpha", "paper"), 0);
    assert.strictEqual(getTransmissionFactor("beta_minus", "paper"), 1);
    assert.strictEqual(getTransmissionFactor("beta_minus", "aluminum"), 0);
    assert.strictEqual(getTransmissionFactor("beta_plus", "aluminum"), 0);
    assert.strictEqual(getTransmissionFactor("gamma", "aluminum"), 1);
    assert.ok(getTransmissionFactor("gamma", "lead") > 0 && getTransmissionFactor("gamma", "lead") < 0.5);
  });
});

test("B23 Half-Life 3D Ensemble & N(t)/H(t) Synchronization + Lesson Metadata", async (t) => {
  await t.test("createHalfLifeEnsemble & evaluateHalfLifeAtTime synchronize T, N(t), and H(t) (Bq)", () => {
    const T = 10;
    const N0 = 125;
    const ens1 = createHalfLifeEnsemble(N0, T, 201);
    const ens2 = createHalfLifeEnsemble(N0, T, 202);

    assert.ok(Math.abs(ens1.lambdaPerSec - Math.LN2 / T) < 1e-12);
    assert.ok(Math.abs(ens1.initialActivityBq - (Math.LN2 / T) * N0) < 1e-10);
    assert.notDeepStrictEqual(
      ens1.particles.slice(0, 5).map((p) => p.decayTimeSec),
      ens2.particles.slice(0, 5).map((p) => p.decayTimeSec),
      "Individual nucleus decay instants vary stochastically across seeds",
    );

    const s0 = evaluateHalfLifeAtTime(ens1, 0);
    assert.strictEqual(s0.remainingSimCount, N0);
    assert.strictEqual(s0.expectedCount, N0);

    const s1T = evaluateHalfLifeAtTime(ens1, T);
    assert.ok(Math.abs(s1T.expectedCount - N0 / 2) < 1e-9);
    assert.ok(Math.abs(s1T.expectedActivityBq - ens1.initialActivityBq / 2) < 1e-9);
    assert.strictEqual(s1T.remainingSimCount + s1T.decayedSimCount, N0);

    const s2T = evaluateHalfLifeAtTime(ens1, 2 * T);
    assert.ok(Math.abs(s2T.expectedCount - N0 / 4) < 1e-9);
    assert.ok(Math.abs(s2T.expectedActivityBq - ens1.initialActivityBq / 4) < 1e-9);
  });

  await t.test("B23 chapter4-lessons spec covers SGK tr. 104–110, 5 sections across 3 phases, and locked prediction immutability", () => {
    const b23 = getChapter4Lesson("B23");
    assert.ok(b23);
    assert.strictEqual(b23.sgkPages, "SGK tr. 104–110");
    assert.deepStrictEqual(
      b23.sections.map((s) => s.id),
      [
        "b23-cloud-geiger",
        "b23-radiation-types",
        "b23-half-life",
        "b23-safety",
        "b23-carbon14",
      ],
    );
    const inClassMin = b23.sections
      .filter((s) => s.phase === "in_class")
      .reduce((sum, s) => sum + s.minutes, 0);
    assert.strictEqual(inClassMin, 45);

    const locked1 = recordPreClassPrediction(
      EMPTY_STUDENT_NOTEBOOK,
      "periodic_equal",
      "Em nghĩ nguồn cố định thì số xung phải đều nhau.",
    );
    const updated2 = recordPreClassPrediction(
      locked1,
      "random_spontaneous",
      "Sau khi đo em thấy số xung dao động ngẫu nhiên.",
    );
    assert.strictEqual(updated2.initialPredictionChoice, "periodic_equal");
    assert.strictEqual(updated2.preClassPredictionChoice, "random_spontaneous");
  });
});
