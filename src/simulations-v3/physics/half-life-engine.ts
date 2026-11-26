/**
 * Pure physics & stochastic ensemble engine for 3D Radioactive Half-Life synchronization
 * (Bài 23 — Hiện tượng phóng xạ, SGK Vật lí 12 KNTT, trang 107–109).
 *
 * Synchronizes:
 * 1) Individual 3D nuclei decay instants t_i = -ln(1 - u_i) / λ, where λ = ln(2) / T
 * 2) Theoretical N(t) = N₀ · 2^(-t/T) and activity H(t) = λ · N(t) (in Bq, with T in seconds)
 * 3) Ensemble remaining count N_sim(t) and milestone snapshots at 0, T, 2T, 3T, 4T
 */

export interface NucleusParticleSpec {
  readonly index: number;
  /** 3D grid coordinates in [-1, 1] normalized lattice space */
  readonly gx: number;
  readonly gy: number;
  readonly gz: number;
  /** Uniform random variate u_i in (0, 1) fixed by seed so scaling T scales t_i consistently */
  readonly u: number;
  /** Exact random decay instant (seconds) for current halfLifeSec T */
  readonly decayTimeSec: number;
}

export interface HalfLifeEnsemble {
  readonly initialCount: number;
  readonly halfLifeSec: number;
  readonly seed: number;
  /** Hằng số phóng xạ λ = ln(2) / T (s⁻¹) */
  readonly lambdaPerSec: number;
  /** Độ phóng xạ ban đầu H₀ = λ · N₀ (Bq) */
  readonly initialActivityBq: number;
  readonly particles: readonly NucleusParticleSpec[];
}

export interface HalfLifeSnapshot {
  readonly timeSec: number;
  readonly halfLifeSec: number;
  readonly elapsedHalfLives: number;
  /** Số hạt nhân mẹ chưa phân rã thực tế trong khối 3D tại thời điểm t */
  readonly remainingSimCount: number;
  readonly decayedSimCount: number;
  /** Số hạt nhân kì vọng lý thuyết N(t) = N₀ · 2^(-t/T) */
  readonly expectedCount: number;
  /** Độ phóng xạ lý thuyết H(t) = λ · N(t) = H₀ · 2^(-t/T) (đơn vị Bq) */
  readonly expectedActivityBq: number;
  /** Ước lượng λ · N_mẫu(t) (Bq) của mẫu mô phỏng */
  readonly simActivityBq: number;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createHalfLifeEnsemble(
  initialCount: number,
  halfLifeSec: number,
  seed: number,
): HalfLifeEnsemble {
  if (!Number.isFinite(initialCount) || initialCount < 8) {
    throw new RangeError("initialCount must be >= 8");
  }
  if (!Number.isFinite(halfLifeSec) || halfLifeSec <= 0) {
    throw new RangeError("halfLifeSec must be > 0");
  }

  const n = Math.round(initialCount);
  const lambdaPerSec = Math.LN2 / halfLifeSec;
  const initialActivityBq = lambdaPerSec * n;
  const rng = mulberry32((Math.floor(seed) * 2654435761 + 0x85ebca6b) >>> 0);

  const side = Math.ceil(Math.cbrt(n));
  const particles: NucleusParticleSpec[] = [];

  for (let i = 0; i < n; i++) {
    const ix = i % side;
    const iy = Math.floor(i / side) % side;
    const iz = Math.floor(i / (side * side));
    const norm = (idx: number) => (side <= 1 ? 0 : (idx / (side - 1)) * 2 - 1);

    const u = Math.min(1 - 1e-12, Math.max(1e-12, rng()));
    const decayTimeSec = -Math.log(1 - u) / lambdaPerSec;

    particles.push({
      index: i,
      gx: Number(norm(ix).toFixed(4)),
      gy: Number(norm(iy).toFixed(4)),
      gz: Number(norm(iz).toFixed(4)),
      u,
      decayTimeSec,
    });
  }

  return {
    initialCount: n,
    halfLifeSec,
    seed,
    lambdaPerSec,
    initialActivityBq,
    particles,
  };
}

export function evaluateHalfLifeAtTime(
  ensemble: HalfLifeEnsemble,
  rawTimeSec: number,
): HalfLifeSnapshot {
  const timeSec = Math.max(0, rawTimeSec);
  const elapsedHalfLives = timeSec / ensemble.halfLifeSec;
  const factor = Math.pow(2, -elapsedHalfLives);
  const expectedCount = ensemble.initialCount * factor;
  const expectedActivityBq = ensemble.initialActivityBq * factor;

  let remainingSimCount = 0;
  for (const p of ensemble.particles) {
    if (p.decayTimeSec > timeSec) {
      remainingSimCount++;
    }
  }

  return {
    timeSec,
    halfLifeSec: ensemble.halfLifeSec,
    elapsedHalfLives,
    remainingSimCount,
    decayedSimCount: ensemble.initialCount - remainingSimCount,
    expectedCount,
    expectedActivityBq,
    simActivityBq: ensemble.lambdaPerSec * remainingSimCount,
  };
}
