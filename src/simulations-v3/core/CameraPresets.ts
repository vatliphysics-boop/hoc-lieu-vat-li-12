/**
 * Camera preset configurations for apparatus viewing
 * Defines standard viewpoints for multi-angle observation
 */

import type { CameraMode } from "./types";

// Re-export for downstream consumers
export type { CameraMode };

/** Camera configuration for a preset */
export interface CameraPreset {
  readonly mode: CameraMode;
  readonly nameVi: string;
  readonly nameEn: string;
  readonly description: string;
}

/** All available camera presets */
export const CAMERA_PRESETS: readonly CameraPreset[] = [
  {
    mode: "orbit",
    nameVi: "Toàn cảnh",
    nameEn: "Overview / Orbit",
    description: "Góc toàn cảnh thiết bị Hình 21.2, xoay 360° và thu phóng tự do",
  },
  {
    mode: "cutaway",
    nameVi: "Cắt lớp",
    nameEn: "Cutaway",
    description: "Mở nắp và thành hộp chân không G để nhìn rõ R, D, S, M bên trong (như Hình 21.2a)",
  },
  {
    mode: "instrument",
    nameVi: "Qua kính hiển vi",
    nameEn: "Microscope POV",
    description: "Đặt mắt nhìn dọc theo kính hiển vi M vào vùng màn huỳnh quang S đang chọn",
  },
  {
    mode: "top",
    nameVi: "Mặt cắt (Hình 21.2b)",
    nameEn: "Top / Cross-section view",
    description: "Nhìn thẳng từ trên xuống đối chiếu sơ đồ mặt cắt Hình 21.2b và vị trí (1), (2)",
  },
  {
    mode: "exploded",
    nameVi: "Tách rời",
    nameEn: "Exploded view",
    description: "Tách rời từng bộ phận R, D, S, M, G, P để quan sát cấu tạo",
  },
  {
    mode: "measurement",
    nameVi: "Góc đo",
    nameEn: "Measurement view",
    description: "Góc nhìn nghiêng tối ưu để đọc vòng chia độ và góc lệch θ",
  },
  {
    mode: "front",
    nameVi: "Phía nguồn R",
    nameEn: "Source view",
    description: "Nhìn từ phía nguồn phát hạt α (R) hướng thẳng tới lá vàng D",
  },
  {
    mode: "back",
    nameVi: "Phía vị trí (1)",
    nameEn: "Forward screen view",
    description: "Nhìn từ phía vị trí (1) (0°) đối diện nguồn R",
  },
  {
    mode: "left",
    nameVi: "Mặt trước",
    nameEn: "Front elevation",
    description: "Nhìn ngang mặt trước hộp chân không G và chân đế P",
  },
  {
    mode: "right",
    nameVi: "Mặt sau",
    nameEn: "Rear elevation",
    description: "Nhìn ngang từ mặt sau thiết bị",
  },
] as const;

/** Get preset by mode */
export function getCameraPreset(mode: CameraMode): CameraPreset | undefined {
  return CAMERA_PRESETS.find((p) => p.mode === mode);
}

/** Get preset name in Vietnamese */
export function getCameraName(mode: CameraMode): string {
  return getCameraPreset(mode)?.nameVi ?? mode;
}
