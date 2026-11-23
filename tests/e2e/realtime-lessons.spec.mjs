import { test, expect } from "@playwright/test";

const labUrl = code => `/hoc-lieu/phong-hat-nhan-v2?bai=${code}#phong-3d`;

test("B21 uses Rutherford model for controlled comparison", async ({ page }, info) => {
  await page.goto(labUrl("B21"));
  const lab = page.locator('[data-realtime-lesson="B21"]');
  await expect(lab.getByRole("heading", { name: "Quan sát hạt nhân, khám phá tán xạ" })).toBeVisible({ timeout: 20000 });
  await lab.getByRole("button", { name: "Nhiệm vụ", exact: true }).click();
  await lab.getByRole("button", { name: "Tăng", exact: true }).click();
  await lab.getByRole("button", { name: "Chạy thí nghiệm" }).click();
  const measure = lab.getByRole("button", { name: "Ghi kết quả", exact: true });
  await expect(measure).toBeEnabled({ timeout: 30000 });
  await measure.click();
  const impact = lab.getByRole("slider", { name: /Tham số va chạm b:/ });
  await impact.fill("10");
  await lab.getByRole("button", { name: "Chạy thí nghiệm" }).click();
  await expect(measure).toBeEnabled({ timeout: 30000 });
  await measure.click();
  await lab.getByRole("button", { name: "Lực đẩy Coulomb mạnh hơn khi khoảng cách nhỏ" }).click();
  await expect(lab.getByText("Đã hoàn thành dự đoán, phép so sánh và giải thích.")).toBeVisible();
  await expect(lab.getByRole("table", { name: "Kết quả các lượt đã ghi" }).locator("tbody tr")).toHaveCount(2);
  await lab.screenshot({ path: info.outputPath("b21.png") });
});

test("B22 preserves a single fission state when guidance changes", async ({ page }, info) => {
  await page.goto(labUrl("B22"));
  const lab = page.getByRole("region", { name: "Phòng khám phá phân hạch B22" });
  await expect(lab.getByRole("heading", { name: "Một neutron. Một kênh phân hạch." })).toBeVisible({ timeout: 20000 });
  await lab.getByLabel("Em dự đoán kênh có neutron tới tạo ra bao nhiêu neutron tự do?").selectOption("3");
  await lab.getByLabel("Tua thời gian minh họa").fill("7.5");
  await lab.getByRole("button", { name: "Ghi kết quả điều kiện này" }).click();
  await lab.getByLabel("Điều kiện neutron tới").selectOption("no");
  await lab.getByRole("button", { name: "Ghi kết quả điều kiện này" }).click();
  await lab.getByRole("button", { name: "Tổng A và tổng Z bằng nhau ở hai vế" }).click();
  await expect(lab.getByText(/Đã ghi dự đoán, so sánh hai điều kiện và giải thích bảo toàn/)).toBeVisible();
  await lab.getByRole("button", { name: "Tiếp →" }).click();
  await expect(lab.getByRole("table", { name: "Bằng chứng trong phiên" }).locator("tbody tr")).toHaveCount(2);
  await lab.screenshot({ path: info.outputPath("b22.png") });
});

test("B24 compares rod positions at one model generation", async ({ page }, info) => {
  await page.goto(labUrl("B24"));
  const lab = page.getByRole("region", { name: "Phòng học lò phản ứng B24" });
  await expect(lab.getByRole("heading", { name: "Từ lõi lò đến dòng điện" })).toBeVisible({ timeout: 20000 });
  await lab.getByRole("button", { name: "Nhiệm vụ", exact: true }).click();
  await lab.getByRole("button", { name: "Giảm", exact: true }).click();
  const rod = lab.getByRole("slider", { name: /Thanh điều khiển cắm sâu/ });
  const step = lab.getByRole("button", { name: "Tiến một thế hệ" });
  await rod.fill("20");
  for (let i = 0; i < 4; i++) await step.click();
  await lab.getByRole("button", { name: "Ghi phép đo" }).click();
  await rod.fill("80");
  for (let i = 0; i < 4; i++) await step.click();
  await lab.getByRole("button", { name: "Ghi phép đo" }).click();
  await lab.getByRole("button", { name: "Thanh hấp thụ thêm neutron" }).click();
  await expect(lab.getByText("Đã có dự đoán, hai phép đo và giải thích phù hợp.", { exact: false })).toBeVisible();
  await lab.screenshot({ path: info.outputPath("b24.png") });
});

test("B25 compares hypotheses without altering the source table", async ({ page }, info) => {
  await page.goto(labUrl("B25"));
  const lab = page.getByRole("region", { name: "Phòng phân tích dữ liệu B25" });
  await expect(lab.getByRole("heading", { name: "Đọc dữ liệu. Kiểm tra mô hình." })).toBeVisible({ timeout: 20000 });
  await lab.getByRole("button", { name: "T = 40 s" }).click();
  await lab.getByRole("button", { name: "Chọn mốc 30 giây" }).click();
  const record = lab.getByRole("button", { name: "Ghi mốc và giả thuyết hiện tại" });
  await record.click();
  await lab.getByRole("slider", { name: /Chu kì giả thuyết T:/ }).fill("60");
  await record.click();
  await lab.getByRole("button", { name: "Chọn mốc 60 giây" }).click();
  await record.click();
  await lab.getByRole("button", { name: "Xem xét dao động, sai số và giới hạn mô hình" }).click();
  await expect(lab.getByText(/Đã dự đoán, so sánh hai giả thuyết, xem hai mốc và giải thích/)).toBeVisible();
  await expect(lab.getByRole("table", { name: /Bảng 25.1/ })).toContainText("85");
  await lab.screenshot({ path: info.outputPath("b25.png") });
});
