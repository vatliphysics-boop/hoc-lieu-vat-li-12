/**
 * Pure 3D vector physics engine for Cloud Chamber & Electric/Magnetic Field Deflection of α, β⁻, β⁺, γ
 * (Bài 23 — Hiện tượng phóng xạ, SGK Vật lí 12 KNTT, trang 105–107, Hình 23.3a, 23.3b & 23.4).
 *
 * Coordinate convention:
 *   +X : incident collimated beam direction (left -> right)
 *   +Y : vertical upward
 *   +Z : out of the screen toward the observer (so B_z < 0 is ⊗ into screen, B_z > 0 is ⊙ out of screen)
 *
 * Exact vector force laws verified at every step:
 *   F_E = q * E
 *   F_B = q * (v × B)
 */

export type RadiationSpecies = "alpha" | "beta_minus" | "beta_plus" | "gamma";
export type FieldRegionMode = "none" | "electric" | "magnetic";
export type FieldPolarity = "normal" | "reversed";
export type AbsorberMaterial = "none" | "paper" | "aluminum" | "lead";

export interface RadiationSpeciesMeta {
  readonly id: RadiationSpecies;
  readonly symbol: string;
  readonly nameVi: string;
  /** Điện tích theo đơn vị e (+2, -1, +1, 0) */
  readonly chargeElementary: -1 | 0 | 1 | 2;
  /** Hệ số độ cong mô hình định tính chuẩn hóa theo tỉ số |q|/(m·v) trực quan (α << |β|) */
  readonly curvatureScale: number;
  readonly colorHex: string;
  readonly cloudTrackDescVi: string;
  readonly natureVi: string;
  readonly ionizationVi: string;
  readonly penetrationVi: string;
}

export const RADIATION_SPECIES_LIST: readonly RadiationSpeciesMeta[] = [
  {
    id: "alpha",
    symbol: "α",
    nameVi: "Tia alpha (α · ⁴₂He²⁺)",
    chargeElementary: 2,
    curvatureScale: 0.24,
    colorHex: "#fb923c",
    cloudTrackDescVi: "Vết ngưng tụ dày, thẳng, đậm đặc và ngắn (vài cm trong không khí) do ion hóa rất mạnh.",
    natureVi: "Dòng hạt nhân ⁴₂He mang điện +2e, tốc độ cỡ 2·10⁷ m/s.",
    ionizationVi: "Rất mạnh",
    penetrationVi: "Yếu — bị chặn hoàn toàn bởi tờ giấy ~1 mm.",
  },
  {
    id: "beta_minus",
    symbol: "β⁻",
    nameVi: "Tia beta trừ (β⁻ · electron e⁻)",
    chargeElementary: -1,
    curvatureScale: 1.0,
    colorHex: "#38bdf8",
    cloudTrackDescVi: "Vết ngưng tụ mảnh hơn, thưa hơn, quãng đi dài và hơi gấp khúc do khối lượng electron rất nhỏ.",
    natureVi: "Dòng electron (⁰₋₁e) mang điện −e, tốc độ có thể xấp xỉ c.",
    ionizationVi: "Trung bình (yếu hơn tia α)",
    penetrationVi: "Trung bình — xuyên qua giấy, bị chặn bởi tấm nhôm dày vài mm.",
  },
  {
    id: "beta_plus",
    symbol: "β⁺",
    nameVi: "Tia beta cộng (β⁺ · positron e⁺)",
    chargeElementary: 1,
    curvatureScale: 1.0,
    colorHex: "#c084fc",
    cloudTrackDescVi: "Vết ngưng tụ mảnh, dài tương tự β⁻ nhưng trong điện/từ trường lệch về phía ngược lại đối xứng với β⁻.",
    natureVi: "Dòng positron (⁰₊₁e) mang điện +e, cùng khối lượng m_e với electron.",
    ionizationVi: "Trung bình",
    penetrationVi: "Trung bình — bị chặn bởi tấm nhôm dày vài mm.",
  },
  {
    id: "gamma",
    symbol: "γ",
    nameVi: "Tia gamma (γ · photon)",
    chargeElementary: 0,
    curvatureScale: 0,
    colorHex: "#4ade80",
    cloudTrackDescVi: "Không để lại vệt ngưng tụ trực tiếp; chỉ thỉnh thoảng thấy vệt mảnh rời rạc của electron thứ cấp bị photon bật ra.",
    natureVi: "Bức xạ điện từ bước sóng cực ngắn (< 10⁻¹¹ m), hạt photon không mang điện (q = 0), tốc độ c.",
    ionizationVi: "Yếu nhất trong ba loại tia",
    penetrationVi: "Rất mạnh — xuyên qua giấy và nhôm, cần khối chì dày hoặc bê tông dày để làm suy giảm mạnh.",
  },
] as const;

export function getRadiationSpeciesMeta(species: RadiationSpecies): RadiationSpeciesMeta {
  const found = RADIATION_SPECIES_LIST.find((s) => s.id === species);
  if (!found) {
    throw new RangeError(`Unknown radiation species: ${species}`);
  }
  return found;
}

export interface Vector3Tuple {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface RadiationTrajectoryResult {
  readonly species: RadiationSpecies;
  readonly fieldMode: FieldRegionMode;
  readonly polarity: FieldPolarity;
  /** Hướng lệch theo trục Y: +1 (lên trên +Y), -1 (xuống dưới -Y), 0 (đi thẳng) */
  readonly deflectionSignY: -1 | 0 | 1;
  /** Các điểm (x, y, z) lý tưởng trong chế độ Mô hình giải thích */
  readonly explanatoryPoints: readonly Vector3Tuple[];
  /** Các giọt sương ngưng tụ (x, y, z, radius) quan sát được trong buồng sương */
  readonly condensationDroplets: readonly {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly radius: number;
  }[];
  /** Nhãn giải thích chiều lực & chiều lệch vật lí */
  readonly summaryVi: string;
}

/**
 * Tính vectơ điện trường E và cảm ứng từ B theo chế độ và cực tính:
 * - Điện trường:
 *     normal   -> Bản trên (+), bản dưới (−) => E = (0, -1, 0) hướng xuống (-Y)
 *     reversed -> Bản trên (−), bản dưới (+) => E = (0, +1, 0) hướng lên (+Y)
 * - Từ trường:
 *     normal   -> Cực N trước (+Z), cực S sau (−Z) => B = (0, 0, -1) hướng vào trong màn hình (⊗)
 *     reversed -> Cực N sau (−Z), cực S trước (+Z) => B = (0, 0, +1) hướng ra ngoài màn hình (⊙)
 */
export function getFieldVectors(
  fieldMode: FieldRegionMode,
  polarity: FieldPolarity,
): { readonly E: Vector3Tuple; readonly B: Vector3Tuple } {
  if (fieldMode === "electric") {
    const ey = polarity === "normal" ? -1 : 1;
    return {
      E: { x: 0, y: ey, z: 0 },
      B: { x: 0, y: 0, z: 0 },
    };
  }
  if (fieldMode === "magnetic") {
    const bz = polarity === "normal" ? -1 : 1;
    return {
      E: { x: 0, y: 0, z: 0 },
      B: { x: 0, y: 0, z: bz },
    };
  }
  return {
    E: { x: 0, y: 0, z: 0 },
    B: { x: 0, y: 0, z: 0 },
  };
}

/**
 * Tính dấu lực tác dụng ban đầu theo trục Y từ đúng công thức vectơ F = q*(E + v × B)
 * với v ban đầu = (+1, 0, 0).
 */
export function computeInitialForceSignY(
  species: RadiationSpecies,
  fieldMode: FieldRegionMode,
  polarity: FieldPolarity,
): -1 | 0 | 1 {
  const meta = getRadiationSpeciesMeta(species);
  if (meta.chargeElementary === 0 || fieldMode === "none") {
    return 0;
  }
  const { E, B } = getFieldVectors(fieldMode, polarity);
  // v = (1, 0, 0) => (v × B)_y = -(v_x * B_z - v_z * B_x) = -B_z
  const vCrossBy = -B.z;
  const rawFy = meta.chargeElementary * (E.y + vCrossBy);
  if (Math.abs(rawFy) < 1e-9) return 0;
  return rawFy > 0 ? 1 : -1;
}

/**
 * Kiểm tra tỉ lệ truyền qua tấm chắn (Hình 23.4 SGK tr. 106):
 * 1 = đi qua hoàn toàn, 0 = bị chặn hoàn toàn, 0.25 = suy giảm mạnh qua chì.
 */
export function getTransmissionFactor(
  species: RadiationSpecies,
  absorber: AbsorberMaterial,
): number {
  if (absorber === "none") return 1;
  if (species === "alpha") return 0; // Tờ giấy, nhôm, chì đều chặn hoàn toàn tia α
  if (species === "beta_minus" || species === "beta_plus") {
    return absorber === "paper" ? 1 : 0; // Xuyên qua giấy, bị chặn bởi nhôm & chì
  }
  // Tia γ
  if (absorber === "lead") return 0.22; // Suy giảm mạnh qua khối chì dày
  return 1;
}

/**
 * Sinh đồng thời:
 * 1) Đường quỹ đạo lý tưởng trong chế độ “Mô hình giải thích” (explanatoryPoints)
 * 2) Các giọt sương ngưng tụ thực nghiệm trong “Vết ngưng tụ buồng sương” (condensationDroplets)
 */
export function computeRadiationFieldTrajectory(
  species: RadiationSpecies,
  fieldMode: FieldRegionMode,
  polarity: FieldPolarity,
  absorber: AbsorberMaterial = "none",
): RadiationTrajectoryResult {
  const meta = getRadiationSpeciesMeta(species);
  const signY = computeInitialForceSignY(species, fieldMode, polarity);

  const xStart = -4.6;
  const xFieldEntry = -3.1;
  const xFieldExit = 3.1;
  const xAbsorber = 3.65;
  const xEndFree = 5.1;

  // Tia α có quãng đi ngắn hơn trong khí buồng sương nếu không bị tấm chắn chặn sớm hơn
  const trans = getTransmissionFactor(species, absorber);
  const maxX =
    absorber !== "none" && trans === 0
      ? xAbsorber
      : species === "alpha" && fieldMode === "none"
        ? 1.9
        : xEndFree;

  // Vertical spread slightly separated at source aperture when viewing all 4 rays together if desired
  const maxDeflectionY = signY * meta.curvatureScale * 2.05;

  const explanatoryPoints: Vector3Tuple[] = [];
  const stepCount = 44;

  for (let i = 0; i <= stepCount; i++) {
    const x = xStart + ((maxX - xStart) * i) / stepCount;
    let y = 0;
    if (signY !== 0 && x > xFieldEntry) {
      const u = Math.min(1, (x - xFieldEntry) / (xFieldExit - xFieldEntry));
      // Parabolic / circular arc inside field, tangent straight line after exiting field
      const yInside = maxDeflectionY * u * u;
      if (x <= xFieldExit) {
        y = yInside;
      } else {
        const slopeExit = (2 * maxDeflectionY) / (xFieldExit - xFieldEntry);
        y = maxDeflectionY + slopeExit * (x - xFieldExit) * 0.45;
      }
    }
    explanatoryPoints.push({
      x: Number(x.toFixed(3)),
      y: Number(Math.max(-2.35, Math.min(2.35, y)).toFixed(3)),
      z: 0,
    });
  }

  // Build observable condensation droplets along the path (distinct from smooth explanatory trajectory!)
  const condensationDroplets: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly radius: number;
  }[] = [];

  if (species === "gamma") {
    // Gamma photon leaves NO direct ionization droplet trail — only 2 sparse secondary Compton electron wisps!
    const wispOrigins = [-1.4, 1.35];
    for (let wIdx = 0; wIdx < wispOrigins.length; wIdx++) {
      const wx = wispOrigins[wIdx];
      if (wx >= maxX) continue;
      const dir = wIdx === 0 ? 1 : -1;
      for (let k = 0; k < 7; k++) {
        condensationDroplets.push({
          x: Number((wx + k * 0.14).toFixed(3)),
          y: Number((dir * (0.08 + k * 0.09 + Math.sin(k) * 0.03)).toFixed(3)),
          z: Number(((k % 2 === 0 ? 1 : -1) * 0.05).toFixed(3)),
          radius: 0.042,
        });
      }
    }
  } else {
    const dropletCount = species === "alpha" ? 54 : 36;
    const baseRadius = species === "alpha" ? 0.095 : 0.046;
    const jitterAmp = species === "alpha" ? 0.025 : 0.075;

    for (let d = 0; d < dropletCount; d++) {
      const frac = d / (dropletCount - 1);
      const ptIdx = Math.min(
        explanatoryPoints.length - 1,
        Math.floor(frac * (explanatoryPoints.length - 1)),
      );
      const basePt = explanatoryPoints[ptIdx];
      // Deterministic micro-scatter of vapor droplets
      const scatterY = Math.sin(d * 2.3 + meta.chargeElementary) * jitterAmp;
      const scatterZ = Math.cos(d * 3.1 + meta.curvatureScale * 5) * jitterAmp;
      condensationDroplets.push({
        x: basePt.x,
        y: Number(Math.max(-2.28, Math.min(2.28, basePt.y + scatterY)).toFixed(3)),
        z: Number(scatterZ.toFixed(3)),
        radius: baseRadius * (0.85 + (d % 3) * 0.12),
      });
    }
  }

  let summaryVi: string;
  if (species === "gamma") {
    summaryVi =
      "Tia γ (q = 0): Truyền thẳng, không bị lệch trong cả điện trường lẫn từ trường; không tạo vệt sương trực tiếp.";
  } else if (fieldMode === "none") {
    summaryVi = `${meta.symbol}: Đang tắt trường ngoài nên hạt bay theo phương ban đầu, để lại vết sương ngưng tụ đặc trưng.`;
  } else {
    const dirLabel = signY > 0 ? "lên trên (+Y)" : "xuống dưới (−Y)";
    const strengthLabel = species === "alpha" ? "lệch nhẹ" : "lệch mạnh";
    if (fieldMode === "electric") {
      const targetPlate =
        meta.chargeElementary > 0 ? "về phía bản âm (−)" : "về phía bản dương (+)";
      summaryVi = `${meta.symbol} (${meta.chargeElementary > 0 ? `+${meta.chargeElementary}e` : "−e"}): Lực điện F = qE kéo hạt ${strengthLabel} ${dirLabel} (${targetPlate}).`;
    } else {
      const bSymbol = polarity === "normal" ? "B ⊗ vào trong" : "B ⊙ ra ngoài";
      summaryVi = `${meta.symbol} (${meta.chargeElementary > 0 ? `+${meta.chargeElementary}e` : "−e"}): Lực Lorentz F = q(v × B) (${bSymbol}) làm hạt ${strengthLabel} ${dirLabel}.`;
    }
  }

  return {
    species,
    fieldMode,
    polarity,
    deflectionSignY: signY,
    explanatoryPoints,
    condensationDroplets,
    summaryVi,
  };
}
