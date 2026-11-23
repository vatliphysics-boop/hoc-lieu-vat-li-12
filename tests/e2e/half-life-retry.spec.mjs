import { test, expect } from "@playwright/test";

// This spec requires a QA-only route and mocked action installed in an isolated
// snapshot as documented in README.md. Never run it against a real Supabase.
test.skip(process.env.E2E_QA_FIXTURE !== "1", "Requires the isolated QA-only route and mocked server action.");
const button = (page, name) => page.getByRole("button", { name, exact: true });

test("lost submission acknowledgement keeps the same attempt for retry", async ({ page }) => {
  let intercepted = false;
  await page.route("**/qa-half-life", async route => {
    if (route.request().method() === "POST" && !intercepted) {
      intercepted = true;
      // Let the isolated mock process the request, then drop the response to
      // model an acknowledgement lost after a successful write.
      const response = await route.fetch();
      expect(response.ok()).toBeTruthy();
      await route.abort("failed");
    } else await route.continue();
  });
  await page.goto("/qa-half-life");
  await page.getByRole("checkbox", { name: "Tôi đồng ý lưu dữ liệu thí nghiệm vào lớp học." }).check();
  await button(page, "Không, chỉ có thể mô tả xác suất").click();
  await page.getByLabel(/^Mô hình 3D\./).focus();
  await page.keyboard.press("ArrowRight");
  await button(page, "Góc nhìn mẫu").click();
  await button(page, "50%").click();
  await button(page, "25%").click();
  await button(page, "Chạy mô phỏng").click();
  await button(page, "Đo tại T").click();
  await button(page, "Đo tại 2T").click();
  await button(page, "Lượng còn lại ở đầu chu kì thứ hai").click();
  await button(page, "Giá trị kỳ vọng của số hạt còn lại").click();
  await button(page, "Dao động ngẫu nhiên của mẫu hữu hạn").click();
  await button(page, "N₀ và thời điểm quan sát").click();
  const halfLife = page.getByRole("slider", { name: /Chu kì T:/ });
  await halfLife.focus();
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight");
  await button(page, "Chạy mô phỏng").click();
  await button(page, "Đo tại T").click();
  await button(page, "Lớn hơn").click();
  await button(page, "Quan sát sự biến thiên giữa các mẫu").click();
  await button(page, "Lượt mới · seed + 1").click();
  await button(page, "Chạy mô phỏng").click();
  await button(page, "Đo tại T").click();
  await button(page, "19 là kết quả có thể; 16 là giá trị kỳ vọng").click();
  await expect(page.getByText("Đã hoàn thành năm nhiệm vụ.")).toBeVisible();
  await button(page, "Gửi kết quả cho giáo viên").click();
  await expect(page.getByRole("status").filter({ hasText: "Chưa nhận được xác nhận gửi" })).toBeVisible();
  await expect(page.getByText("Đã xác nhận kết quả thí nghiệm gửi cho giáo viên", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Đã hoàn thành năm nhiệm vụ.")).toBeVisible();
  // A later change must not alter the uncertain original submission.
  await button(page, "Lượt mới · seed + 1").click();
  await button(page, "Gửi kết quả cho giáo viên").click();
  await expect(page.getByRole("status").filter({ hasText: "Đã xác nhận kết quả thí nghiệm gửi cho giáo viên" })).toBeVisible();
  expect(intercepted).toBe(true);
});
