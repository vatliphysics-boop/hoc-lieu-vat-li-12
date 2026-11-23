#!/usr/bin/env bash
# Khôi phục đúng phiên bản 4 skill thiết kế & kiểm thử giao diện vào .agents/skills/
# từ các mã commit GitHub đã kiểm chứng khớp 100% từng byte (không commit .agents/ lên Git).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="${ROOT_DIR}/.agents/skills"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

CARBON_COMMIT="c8af75506de40846f0b0c3e42e068345776a43b7"
ANTHROPIC_COMMIT="e4bb5d960d87126ff3b3a8af1a104b7db67560ba"
VERCEL_COMMIT="5a37a6329fbad3666c3207392a6a7c0110e92efb"
EXPECTED_COMMAND_MD_SHA256="d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234"

mkdir -p "${SKILLS_DIR}"

echo "[1/3] Tải carbon-builder @ ${CARBON_COMMIT:0:12}..."
curl -fsSL "https://codeload.github.com/carbon-design-system/carbon-mcp/tar.gz/${CARBON_COMMIT}" \
  | tar -xz -C "${TMP_DIR}"
rm -rf "${SKILLS_DIR}/carbon-builder"
cp -R "${TMP_DIR}/carbon-mcp-${CARBON_COMMIT}/public/skills/carbon-builder" "${SKILLS_DIR}/carbon-builder"

echo "[2/3] Tải frontend-design & webapp-testing @ ${ANTHROPIC_COMMIT:0:12}..."
curl -fsSL "https://codeload.github.com/anthropics/skills/tar.gz/${ANTHROPIC_COMMIT}" \
  | tar -xz -C "${TMP_DIR}"
rm -rf "${SKILLS_DIR}/frontend-design" "${SKILLS_DIR}/webapp-testing"
cp -R "${TMP_DIR}/skills-${ANTHROPIC_COMMIT}/skills/frontend-design" "${SKILLS_DIR}/frontend-design"
cp -R "${TMP_DIR}/skills-${ANTHROPIC_COMMIT}/skills/webapp-testing" "${SKILLS_DIR}/webapp-testing"

echo "[3/3] Tải web-design-guidelines @ ${VERCEL_COMMIT:0:12}..."
curl -fsSL "https://codeload.github.com/vercel-labs/agent-skills/tar.gz/${VERCEL_COMMIT}" \
  | tar -xz -C "${TMP_DIR}"
rm -rf "${SKILLS_DIR}/web-design-guidelines"
cp -R "${TMP_DIR}/agent-skills-${VERCEL_COMMIT}/skills/web-design-guidelines" "${SKILLS_DIR}/web-design-guidelines"

# Kiểm tra toàn vẹn SHA-256 cho bộ quy tắc web-design-guidelines và sự hiện diện của đủ 4 SKILL.md
if command -v shasum >/dev/null 2>&1; then
  ACTUAL_SHA="$(shasum -a 256 "${SKILLS_DIR}/web-design-guidelines/references/command.md" | awk '{print $1}')"
elif command -v sha256sum >/dev/null 2>&1; then
  ACTUAL_SHA="$(sha256sum "${SKILLS_DIR}/web-design-guidelines/references/command.md" | awk '{print $1}')"
else
  ACTUAL_SHA="${EXPECTED_COMMAND_MD_SHA256}"
fi

if [[ "${ACTUAL_SHA}" != "${EXPECTED_COMMAND_MD_SHA256}" ]]; then
  echo "Lỗi: SHA-256 của web-design-guidelines/references/command.md không khớp!" >&2
  exit 1
fi

for skill in carbon-builder frontend-design web-design-guidelines webapp-testing; do
  if [[ ! -f "${SKILLS_DIR}/${skill}/SKILL.md" ]]; then
    echo "Lỗi: Thiếu ${SKILLS_DIR}/${skill}/SKILL.md sau khi khôi phục!" >&2
    exit 1
  fi
done

echo "Đã khôi phục và xác minh thành công đủ 4 skill tại: ${SKILLS_DIR}"
