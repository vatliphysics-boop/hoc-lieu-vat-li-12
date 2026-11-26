/**
 * Pure 3D droplet-track & nuclear conservation engine for Blackett's 1925 Cloud Chamber
 * (Bài 22 — Phản ứng hạt nhân và năng lượng liên kết, SGK Vật lí 12 KNTT, trang 96–97, Hình 22.1 & 22.2).
 *
 * Historical & scientific reference:
 *   P. M. S. Blackett (1925), "The Ejection of Protons from Nitrogen Nuclei, Photographed by the Wilson Method",
 *   Proceedings of the Royal Society of London A, 107(742), 349–360.
 *   Reaction: ⁴₂He + ¹⁴₇N → ¹⁷₈O + ¹₁H
 *
 * Model note:
 *   Spatial dimensions of the chamber/droplets and time progression (0 → 1) are scaled by a pedagogical
 *   visual convention so students can clearly observe the sequential formation (1) → (2) → (3) → (4).
 */

export type BlackettRunMode = "straight" | "y_fork";

export type BlackettYSegmentId =
  | "background_alpha"
  | "1_incident_alpha"
  | "2_vertex"
  | "3_thin_long"
  | "4_thick_short";

export interface BlackettDroplet3D {
  readonly segmentId: BlackettYSegmentId;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly radius: number;
  /** Normalized progress threshold in [0, 1] when this condensation droplet becomes visible */
  readonly revealAt: number;
  readonly opacity: number;
}

export interface BlackettTrackDataset {
  readonly runMode: BlackettRunMode;
  readonly vertexPosition: { readonly x: number; readonly y: number; readonly z: number };
  /** Key anchor points in chamber coordinates for 3D-to-2D label projection & SVG fallback */
  readonly anchors: {
    readonly incidentMid: { readonly x: number; readonly y: number; readonly z: number };
    readonly vertex: { readonly x: number; readonly y: number; readonly z: number };
    readonly thinBranchTip: { readonly x: number; readonly y: number; readonly z: number };
    readonly thickBranchTip: { readonly x: number; readonly y: number; readonly z: number };
  };
  readonly droplets: readonly BlackettDroplet3D[];
}

export type BlackettChronologicalStage =
  | "straight_running"
  | "straight_done"
  | "stage_1_incident"
  | "stage_2_vertex"
  | "stage_3_thin_long"
  | "stage_4_thick_short"
  | "y_fork_done";

export interface BlackettStageInfo {
  readonly stage: BlackettChronologicalStage;
  readonly stepBadge: string;
  readonly descriptionVi: string;
  readonly visibleLabels: {
    readonly show1: boolean;
    readonly show2: boolean;
    readonly show3: boolean;
    readonly show4: boolean;
  };
}

export const BLACKETT_CHAMBER_Y = 0.48;
export const BLACKETT_VERTEX = { x: -0.18, y: BLACKETT_CHAMBER_Y, z: 0.06 } as const;
export const BLACKETT_INCIDENT_START = { x: -1.92, y: BLACKETT_CHAMBER_Y, z: 0.06 } as const;
export const BLACKETT_THIN_LONG_END = { x: 1.84, y: BLACKETT_CHAMBER_Y, z: -1.14 } as const;
export const BLACKETT_THICK_SHORT_END = { x: 0.56, y: BLACKETT_CHAMBER_Y, z: 0.68 } as const;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Generates deterministic 3D condensation droplets for either:
 * - "straight": Collimated α particles traversing straight across the Nitrogen observation zone.
 * - "y_fork": Blackett Y-fork event where incident α (1) strictly ends at vertex (2),
 *             followed sequentially by thin long branch (3) and thick short recoil branch (4).
 */
export function buildBlackettTrackDataset(runMode: BlackettRunMode): BlackettTrackDataset {
  const droplets: BlackettDroplet3D[] = [];
  const y0 = BLACKETT_CHAMBER_Y;

  if (runMode === "straight") {
    const zLanes = [-1.18, -0.58, 0.02, 0.62, 1.18];
    for (let laneIdx = 0; laneIdx < zLanes.length; laneIdx++) {
      const zBase = zLanes[laneIdx];
      const count = 46;
      const laneOffset = laneIdx * 0.03;
      for (let i = 0; i < count; i++) {
        const u = i / (count - 1);
        const x = lerp(-1.92, 1.88, u);
        const microZ = Math.sin(i * 1.9 + laneIdx * 2.1) * 0.016;
        const microY = Math.cos(i * 2.3 + laneIdx) * 0.012;
        droplets.push({
          segmentId: "background_alpha",
          x: Number(x.toFixed(4)),
          y: Number((y0 + microY).toFixed(4)),
          z: Number((zBase + microZ).toFixed(4)),
          radius: laneIdx === 2 ? 0.04 : 0.033,
          revealAt: Math.min(0.98, Number((laneOffset + u * 0.86).toFixed(4))),
          opacity: laneIdx === 2 ? 0.96 : 0.72,
        });
      }
    }
  } else {
    // 1) Non-colliding background α tracks in adjacent lanes (faint reference tracks as in Hình 22.2)
    const bgLanes = [-1.28, -0.72, 0.84, 1.32];
    for (let laneIdx = 0; laneIdx < bgLanes.length; laneIdx++) {
      const zBase = bgLanes[laneIdx];
      const count = 34;
      for (let i = 0; i < count; i++) {
        const u = i / (count - 1);
        const x = lerp(-1.92, 1.58, u);
        droplets.push({
          segmentId: "background_alpha",
          x: Number(x.toFixed(4)),
          y: Number((y0 - 0.02 + Math.sin(i + laneIdx) * 0.008).toFixed(4)),
          z: Number((zBase + Math.cos(i * 1.7 + laneIdx) * 0.012).toFixed(4)),
          radius: 0.024,
          revealAt: Number((u * 0.34).toFixed(4)),
          opacity: 0.32,
        });
      }
    }

    // 2) Segment (1): Incident α particle from left entry port (-1.92) strictly terminating at vertex (-0.18)!
    const incCount = 38;
    for (let i = 0; i < incCount; i++) {
      const u = i / (incCount - 1);
      const x = lerp(BLACKETT_INCIDENT_START.x, BLACKETT_VERTEX.x, u);
      const microZ = Math.sin(i * 2.2) * 0.012;
      const microY = Math.cos(i * 1.8) * 0.01;
      droplets.push({
        segmentId: "1_incident_alpha",
        x: Number(x.toFixed(4)),
        y: Number((y0 + microY).toFixed(4)),
        z: Number((BLACKETT_INCIDENT_START.z + microZ).toFixed(4)),
        radius: 0.042,
        revealAt: Number((0.02 + u * 0.34).toFixed(4)),
        opacity: 0.96,
      });
    }

    // 3) Segment (2): Collision vertex cluster at (-0.18, y0, 0.06)
    droplets.push({
      segmentId: "2_vertex",
      x: BLACKETT_VERTEX.x,
      y: BLACKETT_VERTEX.y,
      z: BLACKETT_VERTEX.z,
      radius: 0.078,
      revealAt: 0.38,
      opacity: 1,
    });

    // 4) Segment (3): Thin, long branch (fast, light proton ¹₁H) — revealed in [0.48, 0.76]
    const thinCount = 36;
    for (let i = 1; i <= thinCount; i++) {
      const u = i / thinCount;
      const x = lerp(BLACKETT_VERTEX.x, BLACKETT_THIN_LONG_END.x, u);
      const z = lerp(BLACKETT_VERTEX.z, BLACKETT_THIN_LONG_END.z, u);
      const micro = Math.sin(i * 2.7) * 0.009;
      droplets.push({
        segmentId: "3_thin_long",
        x: Number(x.toFixed(4)),
        y: Number((y0 + micro).toFixed(4)),
        z: Number((z + micro * 0.7).toFixed(4)),
        radius: 0.022,
        revealAt: Number((0.48 + u * 0.28).toFixed(4)),
        opacity: 0.94,
      });
    }

    // 5) Segment (4): Thick, short recoil branch (heavy ¹⁷₈O nucleus) — revealed in [0.76, 0.98]
    const thickCount = 28;
    for (let i = 1; i <= thickCount; i++) {
      const u = i / thickCount;
      const x = lerp(BLACKETT_VERTEX.x, BLACKETT_THICK_SHORT_END.x, u);
      const z = lerp(BLACKETT_VERTEX.z, BLACKETT_THICK_SHORT_END.z, u);
      const micro = Math.cos(i * 3.1) * 0.015;
      // Heavy O-17 ionizes intensely near vertex and tapers slightly as it stops rapidly in gas
      const radius = 0.056 * (1 - u * 0.22);
      droplets.push({
        segmentId: "4_thick_short",
        x: Number((x + micro * 0.4).toFixed(4)),
        y: Number((y0 + micro * 0.5).toFixed(4)),
        z: Number((z - micro * 0.4).toFixed(4)),
        radius: Number(radius.toFixed(4)),
        revealAt: Number((0.76 + u * 0.22).toFixed(4)),
        opacity: 0.98,
      });
    }
  }

  return {
    runMode,
    vertexPosition: BLACKETT_VERTEX,
    anchors: {
      incidentMid: {
        x: Number(((BLACKETT_INCIDENT_START.x + BLACKETT_VERTEX.x) / 2).toFixed(3)),
        y: y0,
        z: BLACKETT_INCIDENT_START.z,
      },
      vertex: BLACKETT_VERTEX,
      thinBranchTip: {
        x: lerp(BLACKETT_VERTEX.x, BLACKETT_THIN_LONG_END.x, 0.78),
        y: y0,
        z: lerp(BLACKETT_VERTEX.z, BLACKETT_THIN_LONG_END.z, 0.78),
      },
      thickBranchTip: {
        x: BLACKETT_THICK_SHORT_END.x,
        y: y0,
        z: BLACKETT_THICK_SHORT_END.z,
      },
    },
    droplets,
  };
}

export function getBlackettStageAtProgress(
  runMode: BlackettRunMode,
  rawProgress: number,
): BlackettStageInfo {
  const p = Math.max(0, Math.min(1, rawProgress));
  if (runMode === "straight") {
    if (p < 0.98) {
      return {
        stage: "straight_running",
        stepBadge: "Lượt 1 · Chùm hạt α đang đi thẳng qua khí Nitrogen",
        descriptionVi:
          "Hầu hết hạt α chỉ ion hóa phân tử khí dọc đường bay, tạo các vệt sương thẳng song song xuyên qua vùng quan sát mà không gây phản ứng hạt nhân.",
        visibleLabels: { show1: false, show2: false, show3: false, show4: false },
      };
    }
    return {
      stage: "straight_done",
      stepBadge: "Lượt 1 hoàn tất · Vệt thẳng xuyên suốt vùng quan sát",
      descriptionVi:
        "Các vệt hạt α đi thẳng qua vùng quan sát (không rẽ nhánh chữ Y). Hãy chuyển sang Lượt 2 (Vết chữ Y) để đối chiếu trường hợp xảy ra va chạm hạt nhân hiếm gặp!",
      visibleLabels: { show1: false, show2: false, show3: false, show4: false },
    };
  }

  if (p < 0.37) {
    return {
      stage: "stage_1_incident",
      stepBadge: "Thứ tự (1/4) · Hiện vệt hạt α tới (1)",
      descriptionVi:
        "(1) Hạt α từ khe chuẩn trực bên trái đi thẳng vào buồng khí Nitrogen siêu bão hòa.",
      visibleLabels: { show1: true, show2: false, show3: false, show4: false },
    };
  }
  if (p < 0.48) {
    return {
      stage: "stage_2_vertex",
      stepBadge: "Thứ tự (2/4) · Chạm đỉnh va chạm (2) — Vệt α kết thúc",
      descriptionVi:
        "(2) Hạt α va chạm trực diện với một hạt nhân Nitrogen trong khí; vệt hạt α tới kết thúc ngay tại đỉnh (2), không còn vệt α đi thẳng tiếp!",
      visibleLabels: { show1: true, show2: true, show3: false, show4: false },
    };
  }
  if (p < 0.76) {
    return {
      stage: "stage_3_thin_long",
      stepBadge: "Thứ tự (3/4) · Xuất hiện nhánh mảnh, dài (3)",
      descriptionVi:
        "(3) Từ đỉnh (2) phóng ra một nhánh vệt sương mảnh, mật độ giọt thưa hơn và vươn rất dài về phía trước.",
      visibleLabels: { show1: true, show2: true, show3: true, show4: false },
    };
  }
  if (p < 0.99) {
    return {
      stage: "stage_4_thick_short",
      stepBadge: "Thứ tự (4/4) · Xuất hiện nhánh đậm, ngắn (4)",
      descriptionVi:
        "(4) Từ đỉnh (2) xuất hiện nhánh thứ hai rất đậm, dày đặc giọt sương và dừng lại sau quãng ngắn — hoàn chỉnh vết chữ Y hai nhánh.",
      visibleLabels: { show1: true, show2: true, show3: true, show4: true },
    };
  }

  return {
    stage: "y_fork_done",
    stepBadge: "Lượt 2 hoàn tất · Đủ 4 chi tiết (1) → (2) → (3) → (4)",
    descriptionVi:
      "Vết chữ Y hiện trọn vẹn: (1) vệt hạt α tới kết thúc tại đỉnh (2), tách thành nhánh mảnh dài (3) và nhánh đậm ngắn (4), không có nhánh thứ ba.",
    visibleLabels: { show1: true, show2: true, show3: true, show4: true },
  };
}

export interface BlackettConservationCheck {
  readonly reactants: {
    readonly alpha: { readonly symbol: "⁴₂He"; readonly a: 4; readonly z: 2 };
    readonly nitrogen: { readonly symbol: "¹⁴₇N"; readonly a: 14; readonly z: 7 };
    readonly sumA: 18;
    readonly sumZ: 9;
  };
  readonly products: {
    readonly oxygen17: { readonly symbol: "¹⁷₈O"; readonly a: 17; readonly z: 8 };
    readonly proton: { readonly symbol: "¹₁H"; readonly a: 1; readonly z: 1 };
    readonly sumA: 18;
    readonly sumZ: 9;
  };
  readonly conservedA: true;
  readonly conservedZ: true;
}

export function verifyBlackettConservation(): BlackettConservationCheck {
  const sumLeftA = 4 + 14;
  const sumRightA = 17 + 1;
  const sumLeftZ = 2 + 7;
  const sumRightZ = 8 + 1;
  if (sumLeftA !== 18 || sumRightA !== 18 || sumLeftZ !== 9 || sumRightZ !== 9) {
    throw new Error("Blackett nuclear reaction conservation invariant violated");
  }
  return {
    reactants: {
      alpha: { symbol: "⁴₂He", a: 4, z: 2 },
      nitrogen: { symbol: "¹⁴₇N", a: 14, z: 7 },
      sumA: 18,
      sumZ: 9,
    },
    products: {
      oxygen17: { symbol: "¹⁷₈O", a: 17, z: 8 },
      proton: { symbol: "¹₁H", a: 1, z: 1 },
      sumA: 18,
      sumZ: 9,
    },
    conservedA: true,
    conservedZ: true,
  };
}
