import { REACTOR_LAST_GENERATION, reactorState } from "./reactor-model";

export type ReactorMeasurement = { rod: number; generation: number; multiplier: number; expected: number };
/** The units are relative teaching indices, not reactor power or measured data. */
export function measureReactor(rod: number, position: number): ReactorMeasurement {
  const state = reactorState(position, rod);
  return { rod: state.rodPercent, generation: state.generation, multiplier: state.k, expected: state.expected };
}
/** Compare only the same generation and sufficiently distinct control-rod positions. */
export function hasReactorComparison(rows: readonly ReactorMeasurement[]): boolean {
  return rows.some(a => a.rod <= 20 && a.generation === REACTOR_LAST_GENERATION && rows.some(b => b.rod >= 80 && b.generation === a.generation));
}

export type B24LocalSnapshot = {
  version: 1;
  rod: number;
  time: number;
  selected: number;
  prediction: "" | "up" | "down" | "same";
  explanation: "" | "absorption" | "cooling";
  rows: ReactorMeasurement[];
};

/** Reject malformed or inconsistent saved values before they reach the UI. */
export function validateB24LocalSnapshot(value: unknown): B24LocalSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const finite = (v: unknown, min: number, max: number): v is number => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  if (item.version !== 1 || !finite(item.rod, 0, 100) || item.rod % 5 !== 0 || !finite(item.time, 0, REACTOR_LAST_GENERATION) || !finite(item.selected, 0, 4) || !Number.isInteger(item.selected) || !["", "up", "down", "same"].includes(String(item.prediction)) || !["", "absorption", "cooling"].includes(String(item.explanation)) || !Array.isArray(item.rows) || item.rows.length > 20) return null;
  const rows: ReactorMeasurement[] = [];
  for (const value of item.rows) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const row = value as Record<string, unknown>;
    if (!finite(row.rod, 0, 100) || row.rod % 5 !== 0 || !finite(row.generation, 0, REACTOR_LAST_GENERATION) || !Number.isInteger(row.generation) || !finite(row.multiplier, 0, 2) || !finite(row.expected, 0, 10)) return null;
    const expected = measureReactor(row.rod, row.generation);
    if (Math.abs(expected.multiplier - row.multiplier) > 1e-9 || Math.abs(expected.expected - row.expected) > 1e-9) return null;
    rows.push(expected);
  }
  return { version: 1, rod: item.rod, time: item.time, selected: item.selected, prediction: item.prediction as B24LocalSnapshot["prediction"], explanation: item.explanation as B24LocalSnapshot["explanation"], rows };
}
