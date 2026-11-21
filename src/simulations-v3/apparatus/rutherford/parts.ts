/**
 * Rutherford apparatus component registry
 * Based on Geiger–Marsden (1909–1913) experimental setup
 *
 * References:
 * - Geiger, H., & Marsden, E. (1909). On a Diffuse Reflection of the α-Particles.
 *   Proceedings of the Royal Society A, 82(557), 495–500.
 * - Rutherford, E. (1911). The Scattering of α and β Particles by Matter and the
 *   Structure of the Atom. Philosophical Magazine, 21(125), 669–688.
 * - Giancoli, D. C. (2014). Physics for Scientists and Engineers. Pearson.
 */

import type { ApparatusComponent } from "../../core/types";
import { createComponentRegistry } from "../../core/ComponentRegistry";

/** All apparatus components in the Rutherford scattering experiment */
export const RUTHERFORD_COMPONENTS: readonly ApparatusComponent[] = [
  // Source components
  {
    id: "alpha-source",
    nameVi: "Nguồn phát hạt alpha",
    nameEn: "Alpha particle source",
    role: "Phát chùm hạt alpha (hạt nhân helium He-4) có năng lượng xác định",
    roleEn: "Emits alpha particles (helium-4 nuclei) with defined energy",
    category: "source",
  },
  {
    id: "source-housing",
    nameVi: "Hộp chứa nguồn phóng xạ",
    nameEn: "Source housing",
    role: "Chứa và che chắn nguồn phóng xạ, chỉ để hạt thoát qua khe",
    roleEn: "Contains and shields radioactive source, allows particles through aperture",
    category: "source",
  },

  // Collimation
  {
    id: "collimator",
    nameVi: "Khe chuẩn trực",
    nameEn: "Collimator slit",
    role: "Tạo chùm hạt song song, hướng tới bia",
    roleEn: "Creates parallel beam of particles directed at target",
    category: "collimator",
  },

  // Target
  {
    id: "gold-foil",
    nameVi: "Lá vàng mỏng",
    nameEn: "Gold foil",
    role: "Bia tán xạ — lá vàng rất mỏng (~400 nm), hạt alpha tương tác với hạt nhân vàng",
    roleEn: "Scattering target — very thin gold leaf (~400 nm), alpha particles interact with gold nuclei",
    category: "target",
  },
  {
    id: "foil-holder",
    nameVi: "Giá đỡ lá vàng",
    nameEn: "Foil holder",
    role: "Giữ lá vàng ở vị trí cố định tại tâm thiết bị",
    roleEn: "Holds gold foil in fixed position at apparatus center",
    category: "target",
  },

  // Detection
  {
    id: "scintillation-screen",
    nameVi: "Màn phát quang ZnS",
    nameEn: "ZnS scintillation screen",
    role: "Màn phủ zinc sulfide — phát sáng lóe khi hạt alpha chạm vào",
    roleEn: "Screen coated with zinc sulfide — emits light flashes when alpha particles strike",
    category: "detector",
  },
  {
    id: "rotating-microscope",
    nameVi: "Kính hiển vi xoay",
    nameEn: "Rotating microscope",
    role: "Kính hiển vi có thể xoay quanh màn để quan sát ánh sáng lóe ở các góc khác nhau",
    roleEn: "Microscope that rotates around screen to observe light flashes at different angles",
    category: "measurement",
  },
  {
    id: "angular-scale",
    nameVi: "Thang đo góc",
    nameEn: "Angular scale",
    role: "Đo vị trí góc của kính hiển vi (góc tán xạ)",
    roleEn: "Measures angular position of microscope (scattering angle)",
    category: "measurement",
  },

  // Structure
  {
    id: "vacuum-chamber",
    nameVi: "Buồng chân không",
    nameEn: "Vacuum chamber",
    role: "Buồng áp suất thấp — giảm tán xạ không mong muốn với không khí",
    roleEn: "Low-pressure chamber — reduces unwanted scattering with air molecules",
    category: "structure",
  },
  {
    id: "chamber-window",
    nameVi: "Cửa sổ quan sát",
    nameEn: "Observation window",
    role: "Cửa sổ trong suốt để quan sát bên trong buồng",
    roleEn: "Transparent window for observing inside chamber",
    category: "structure",
  },
  {
    id: "base-platform",
    nameVi: "Bệ đỡ",
    nameEn: "Base platform",
    role: "Bệ cố định giữ toàn bộ thiết bị ổn định",
    roleEn: "Fixed platform holding entire apparatus stable",
    category: "structure",
  },
] as const;

/** Registry instance for Rutherford apparatus */
export const rutherfordRegistry = createComponentRegistry(RUTHERFORD_COMPONENTS);

/** Get component by ID with type safety */
export function getRutherfordComponent(id: string): ApparatusComponent | undefined {
  return rutherfordRegistry.getById(id);
}

/** Get all components by category */
export function getRutherfordByCategory(
  category: ApparatusComponent["category"],
): readonly ApparatusComponent[] {
  return rutherfordRegistry.getByCategory(category);
}
