/** Evidence for one controlled Rutherford comparison; values are simulation data, not observed frequencies. */
export type B21Reading = { id: number; impactFm: number; energyMeV: number; scattering: number; detector: number };

export function hasB21ControlledComparison(readings: readonly B21Reading[], predictionAt: number | null): boolean {
  if (predictionAt === null) return false;
  const afterPrediction = readings.filter(reading => reading.id > predictionAt);
  return afterPrediction.some((first, i) => afterPrediction.some((second, j) => i !== j && first.energyMeV === second.energyMeV && first.impactFm !== second.impactFm));
}

export function isB21InquiryComplete(prediction: string, explanation: string, readings: readonly B21Reading[], predictionAt: number | null): boolean {
  return prediction === "larger" && explanation === "repulsion" && hasB21ControlledComparison(readings, predictionAt);
}
