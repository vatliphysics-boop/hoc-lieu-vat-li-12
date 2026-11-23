import test from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error Node's TypeScript import.
import { pilotEvent, eventsCSV } from "../src/lib/half-life-analytics.ts";

test("pilot events retain schema and export escaped CSV without adding identities", () => {
  const event = pilotEvent("anonymous-session", "measurement", { remaining: 15, label: 'mẫu "A"' }, "2026-01-01T00:00:00.000Z");
  assert.equal(event.schema, "half-life-event/1");
  assert.deepEqual(Object.keys(event), ["schema", "sessionId", "at", "type", "data"]);
  const csv = eventsCSV([event]);
  assert.ok(csv.includes('""remaining"":15'));
  assert.ok(csv.includes("anonymous-session"));
});
