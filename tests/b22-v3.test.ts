import test from "node:test";
import assert from "node:assert/strict";
import {
  BLACKETT_INCIDENT_START,
  BLACKETT_THICK_SHORT_END,
  BLACKETT_THIN_LONG_END,
  BLACKETT_VERTEX,
  buildBlackettTrackDataset,
  getBlackettStageAtProgress,
  verifyBlackettConservation,
} from "../src/simulations-v3/physics/blackett-engine";
import {
  BLACKETT_CAMERA_PRESETS,
  BLACKETT_COMPONENTS,
  parseBlackettV3State,
  resolveBlackettRaycastPart,
} from "../src/simulations-v3/apparatus/blackett/parts";
import { buildBlackettApparatus } from "../src/simulations-v3/apparatus/blackett/geometry";
import { getChapter4Lesson } from "../src/lib/chapter4-lessons";

test("B22 Blackett 3D Cloud Chamber physics, sequential Y-fork, 3D geometry & lesson metadata", async (t) => {
  await t.test("Y-fork track dataset ends incident α at vertex (2) and reveals (1)->(2)->(3)->(4) strictly in order", () => {
    const straight = buildBlackettTrackDataset("straight");
    assert.ok(straight.droplets.length >= 150);

    const yFork = buildBlackettTrackDataset("y_fork");
    const seg1 = yFork.droplets.filter((d) => d.segmentId === "1_incident_alpha");
    const seg2 = yFork.droplets.filter((d) => d.segmentId === "2_vertex");
    const seg3 = yFork.droplets.filter((d) => d.segmentId === "3_thin_long");
    const seg4 = yFork.droplets.filter((d) => d.segmentId === "4_thick_short");

    assert.ok(seg1.length > 20 && seg2.length === 1 && seg3.length > 20 && seg4.length > 15);
    // Incident α must NEVER continue past vertex X
    assert.ok(
      seg1.every((d) => d.x >= BLACKETT_INCIDENT_START.x && d.x <= BLACKETT_VERTEX.x + 1e-6),
      "Incident α track must terminate strictly at collision vertex (2)",
    );

    const maxReveal1 = Math.max(...seg1.map((d) => d.revealAt));
    const reveal2 = seg2[0].revealAt;
    const minReveal3 = Math.min(...seg3.map((d) => d.revealAt));
    const maxReveal3 = Math.max(...seg3.map((d) => d.revealAt));
    const minReveal4 = Math.min(...seg4.map((d) => d.revealAt));

    assert.ok(maxReveal1 < reveal2, "(1) finishes before (2) vertex flash");
    assert.ok(reveal2 < minReveal3, "(2) appears before (3) thin long branch");
    assert.ok(maxReveal3 <= minReveal4, "(3) finishes before (4) thick short branch");

    // Branch (3) is longer & thinner than recoil branch (4)
    const len3 = Math.hypot(
      BLACKETT_THIN_LONG_END.x - BLACKETT_VERTEX.x,
      BLACKETT_THIN_LONG_END.z - BLACKETT_VERTEX.z,
    );
    const len4 = Math.hypot(
      BLACKETT_THICK_SHORT_END.x - BLACKETT_VERTEX.x,
      BLACKETT_THICK_SHORT_END.z - BLACKETT_VERTEX.z,
    );
    assert.ok(len3 > len4 * 2, "Proton branch (3) must be substantially longer than O-17 branch (4)");
    assert.ok(seg4[0].radius > seg3[0].radius * 2, "O-17 branch (4) must be thicker than proton branch (3)");
  });

  await t.test("getBlackettStageAtProgress & verifyBlackettConservation preserve exact stages and A/Z sums", () => {
    assert.strictEqual(getBlackettStageAtProgress("y_fork", 0.15).stage, "stage_1_incident");
    assert.strictEqual(getBlackettStageAtProgress("y_fork", 0.42).stage, "stage_2_vertex");
    assert.strictEqual(getBlackettStageAtProgress("y_fork", 0.62).stage, "stage_3_thin_long");
    assert.strictEqual(getBlackettStageAtProgress("y_fork", 0.88).stage, "stage_4_thick_short");
    assert.strictEqual(getBlackettStageAtProgress("y_fork", 1.0).stage, "y_fork_done");

    const cons = verifyBlackettConservation();
    assert.strictEqual(cons.reactants.sumA, 18);
    assert.strictEqual(cons.products.sumA, 18);
    assert.strictEqual(cons.reactants.sumZ, 9);
    assert.strictEqual(cons.products.sumZ, 9);
  });

  await t.test("Blackett 3D apparatus registry, camera presets, raycast priority, and state persistence", () => {
    assert.deepStrictEqual(
      BLACKETT_CAMERA_PRESETS.map((p) => p.mode),
      ["overview", "window", "port"],
    );
    assert.strictEqual(
      resolveBlackettRaycastPart(["observation-window", "vapor-tracks", "chamber-body"]),
      "vapor-tracks",
    );
    assert.strictEqual(
      resolveBlackettRaycastPart(["observation-window", "chamber-body"]),
      "observation-window",
    );

    const parsed = parseBlackettV3State(
      JSON.stringify({
        cameraMode: "window",
        selectedPartId: "observation-window",
        activeRun: "straight",
        completedRuns: ["straight", "y_fork"],
        standalonePredictionLocked: true,
      }),
    );
    assert.strictEqual(parsed.cameraMode, "window");
    assert.strictEqual(parsed.selectedPartId, "observation-window");
    assert.deepStrictEqual(parsed.completedRuns, ["straight", "y_fork"]);

    const handles = buildBlackettApparatus(BLACKETT_COMPONENTS);
    assert.strictEqual(handles.components.size, BLACKETT_COMPONENTS.length);
    handles.updateTracks("straight", 0.5);
    handles.updateTracks("y_fork", 1);
    handles.setHighlightPart("observation-window");
    handles.disposeExtra();
  });

  await t.test("B22 chapter4-lessons spec covers SGK tr. 96–103, 6 sections across 3 phases, and 45 min in_class", () => {
    const b22 = getChapter4Lesson("B22");
    assert.ok(b22);
    assert.strictEqual(b22.sgkPages, "SGK tr. 96–103");
    assert.deepStrictEqual(
      b22.sections.map((s) => s.id),
      [
        "b22-blackett-track",
        "b22-conservation",
        "b22-binding-energy",
        "b22-fission",
        "b22-fusion",
        "b22-after-transfer",
      ],
    );
    const inClassMin = b22.sections
      .filter((s) => s.phase === "in_class")
      .reduce((sum, s) => sum + s.minutes, 0);
    assert.strictEqual(inClassMin, 45);
  });
});
