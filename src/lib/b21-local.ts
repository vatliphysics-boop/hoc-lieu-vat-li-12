import { createRutherfordRun, type RutherfordSettings } from "./rutherford-model";
import type { B21Reading } from "./b21-inquiry";

/** Separate from existing local and classroom records; never synchronized automatically. */
export const B21_LOCAL_KEY = "physics-b21-realtime-v1";
export type B21Mode = "guided" | "free" | "task";
export type B21LocalSnapshot = {
  version: 1;
  mode: B21Mode;
  scene: number;
  isotope: "C12" | "C14" | "He4";
  parameters: RutherfordSettings;
  time: number;
  speed: number;
  readings: B21Reading[];
  readingSequence: number;
  prediction: "" | "larger" | "smaller";
  predictionAt: number | null;
  explanation: "" | "repulsion" | "collision";
};
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const finite = (value: unknown, min: number, max: number): value is number => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const counter = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

/** Reject invalid or corrupted local state, including values inconsistent with the physics model. */
export function parseB21LocalSnapshot(value: unknown): B21LocalSnapshot | null {
  if (!object(value) || value.version !== 1 || !["guided", "free", "task"].includes(String(value.mode)) || !Number.isInteger(value.scene) || !finite(value.scene, 0, 2) || !["C12", "C14", "He4"].includes(String(value.isotope)) || !object(value.parameters)) return null;
  const impactFm = value.parameters.impactFm, energyMeV = value.parameters.energyMeV;
  if (!finite(impactFm, 0, 100) || !finite(energyMeV, 3, 10)) return null;
  const parameters = { impactFm, energyMeV };
  if (!finite(value.time, 0, createRutherfordRun(parameters).durationZs) || ![.5, 1, 2, 4].includes(value.speed as number) || !Array.isArray(value.readings) || value.readings.length > 12 || !counter(value.readingSequence)) return null;
  if (!["", "larger", "smaller"].includes(String(value.prediction)) || !["", "repulsion", "collision"].includes(String(value.explanation)) || !(value.predictionAt === null || counter(value.predictionAt))) return null;
  if ((value.prediction === "") !== (value.predictionAt === null) || (value.predictionAt !== null && value.predictionAt > value.readingSequence)) return null;
  const readings: B21Reading[] = [];
  let previousId = 0;
  for (const reading of value.readings) {
    if (!object(reading) || !counter(reading.id) || reading.id <= previousId || reading.id > value.readingSequence || !finite(reading.impactFm, 0, 100) || !finite(reading.energyMeV, 3, 10) || !finite(reading.scattering, 0, 180) || !finite(reading.detector, 0, 180)) return null;
    const run = createRutherfordRun({ impactFm: reading.impactFm, energyMeV: reading.energyMeV });
    if (Math.abs(reading.scattering - run.scatteringAngleDeg) > 1e-7 || Math.abs(reading.detector - run.detectorAngleDeg) > 1e-7) return null;
    readings.push({ id: reading.id, impactFm: reading.impactFm, energyMeV: reading.energyMeV, scattering: reading.scattering, detector: reading.detector });
    previousId = reading.id;
  }
  return { version: 1, mode: value.mode as B21Mode, scene: value.scene, isotope: value.isotope as B21LocalSnapshot["isotope"], parameters, time: value.time, speed: value.speed as number, readings, readingSequence: value.readingSequence, prediction: value.prediction as B21LocalSnapshot["prediction"], predictionAt: value.predictionAt, explanation: value.explanation as B21LocalSnapshot["explanation"] };
}
