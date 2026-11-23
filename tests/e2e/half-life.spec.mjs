import { test, expect } from "@playwright/test";

const route = "/hoc-lieu/thi-nghiem-ban-ra";
const key = "physics-half-life-pilot-v1";
const button = (page, name) => page.getByRole("button", { name, exact: true });
const task = page => page.getByRole("complementary", { name: "Nhiệm vụ khám phá" });

async function enterPilot(page) {
  await page.goto(route);
  await expect(page.getByRole("heading", { name: /Mỗi hạt ngẫu nhiên/ })).toBeVisible();
}
async function answerFirst(page) {
  await button(page, "Không, chỉ có thể mô tả xác suất").click();
}

test("B23 gates questions on observation, scaffolds 50%, measures and completes five tasks", async ({ page }) => {
  await enterPilot(page);
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByText("Đồ thị sẽ mở sau khi em ghi dự đoán", { exact: false })).toBeVisible();
  await expect(page.getByText("Số hạt nhân chưa phân rã", { exact: true })).toHaveCount(0);
  await expect(button(page, "Chạy mô phỏng")).toBeDisabled();
  await expect(button(page, "Đo tại T")).toBeDisabled();
  await answerFirst(page);
  await expect(button(page, "Góc nhìn mẫu")).toBeDisabled();
  const scene = page.getByLabel(/^Mô hình 3D\./);
  await scene.focus();
  await page.keyboard.press("ArrowRight");
  await expect(button(page, "Góc nhìn mẫu")).toBeEnabled();
  await button(page, "Góc nhìn mẫu").click();
  await button(page, "50%").click();
  await expect(page.getByText("Số hạt nhân chưa phân rã", { exact: true })).toBeVisible();
  await expect(task(page)).toContainText("ở chu kì thứ hai, số hạt giảm một nửa so với số lượng nào?");
  await button(page, "25%").click();
  const secondPeriod = button(page, "Lượng còn lại ở đầu chu kì thứ hai");
  await expect(secondPeriod).toBeDisabled();
  await button(page, "Đo tại thời điểm hiện tại").click();
  await button(page, "Chạy mô phỏng").click();
  await button(page, "Đo tại T").click();
  await expect(page.getByRole("table", { name: "Các lần đo trong phiên" })).toContainText("35");
  await button(page, "Đo tại 2T").click();
  await expect(page.getByRole("table", { name: "Các lần đo trong phiên" })).toContainText("16.0");
  await expect(secondPeriod).toBeEnabled();
  await secondPeriod.click();
  await button(page, "Giá trị kỳ vọng của số hạt còn lại").click();
  await button(page, "Dao động ngẫu nhiên của mẫu hữu hạn").click();
  await button(page, "N₀ và thời điểm quan sát").click();
  await expect(button(page, "Lớn hơn")).toBeDisabled();
  const halfLife = page.getByRole("slider", { name: /Chu kì T:/ });
  await halfLife.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(halfLife).toHaveValue("20");
  await button(page, "Đo tại thời điểm hiện tại").click();
  await expect(button(page, "Lớn hơn")).toBeDisabled();
  await button(page, "Chạy mô phỏng").click();
  await button(page, "Đo tại T").click();
  await expect(button(page, "Lớn hơn")).toBeEnabled();
  await button(page, "Lớn hơn").click();
  await button(page, "Quan sát sự biến thiên giữa các mẫu").click();
  const conclusion = button(page, "19 là kết quả có thể; 16 là giá trị kỳ vọng");
  await expect(conclusion).toBeDisabled();
  await button(page, "Lượt mới · seed + 1").click();
  await button(page, "Chạy mô phỏng").click();
  await button(page, "Đo tại T").click();
  await expect(conclusion).toBeEnabled();
  await conclusion.click();
  await expect(page.getByText("Đã hoàn thành năm nhiệm vụ.")).toBeVisible();
  expect(await page.evaluate(k => localStorage.getItem(k), key)).toBeNull();
});

test("local consent persists question, parameters and measurements for restoration", async ({ page }) => {
  await enterPilot(page);
  await page.getByRole("checkbox", { name: /Tôi đồng ý lưu nhật ký/ }).check();
  const halfLife = page.getByRole("slider", { name: /Chu kì T:/ });
  await halfLife.focus();
  await page.keyboard.press("ArrowRight");
  await expect(halfLife).toHaveValue("15");
  await button(page, "Gợi ý (0/3)").click();
  await answerFirst(page);
  await page.getByLabel(/^Mô hình 3D\./).focus();
  await page.keyboard.press("ArrowRight");
  await button(page, "Góc nhìn mẫu").click();
  await button(page, "50%").click();
  await button(page, "Đo tại T").click();
  const stored = JSON.parse(await page.evaluate(k => localStorage.getItem(k), key));
  expect(stored.inquiry.taskIndex).toBe(1);
  expect(stored.snapshot.parameters.halfLifeSeconds).toBe(15);
  expect(stored.snapshot.measurements).toHaveLength(1);
  expect(stored.events.map(e => e.type)).toEqual(expect.arrayContaining(["session_started", "hint_requested", "prediction_or_answer", "measurement"]));
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /Tôi đồng ý lưu nhật ký/ })).not.toBeChecked();
  await button(page, "Khôi phục bản lưu").click();
  await expect(task(page)).toContainText("Theo kì vọng, sau hai chu kì bán rã");
  await expect(page.getByRole("slider", { name: /Chu kì T:/ })).toHaveValue("15");
  await expect(page.getByRole("table", { name: "Các lần đo trong phiên" })).toContainText("15.0");
  await expect(button(page, "Xuất JSON")).toBeEnabled();
  expect(await page.evaluate(k => JSON.parse(localStorage.getItem(k)).events.length, key)).toBe(stored.events.length);
});

test("WebGL failure offers an explicit alternative without recording a camera rotation", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
      return original.call(this, type, ...args);
    };
  });
  await enterPilot(page);
  await expect(page.getByText("Không mở được WebGL")).toBeVisible();
  await page.getByRole("checkbox", { name: /Tôi đồng ý lưu nhật ký/ }).check();
  await answerFirst(page);
  await expect(button(page, "Góc nhìn mẫu")).toBeDisabled();
  await button(page, "Tôi đã đọc mô tả thay thế").click();
  await expect(button(page, "Góc nhìn mẫu")).toBeEnabled();
  const stored = JSON.parse(await page.evaluate(k => localStorage.getItem(k), key));
  expect(stored.events.some(e => e.type === "accessible_observation")).toBe(true);
  expect(stored.events.some(e => e.type === "camera_rotated")).toBe(false);
});

test("fullscreen includes controls and supports exiting", async ({ page }) => {
  await enterPilot(page);
  await button(page, "Toàn màn hình").click();
  await expect(button(page, "Thoát toàn màn hình")).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  const containsControls = await page.evaluate(() => Boolean(document.fullscreenElement?.querySelector('button') && [...document.fullscreenElement.querySelectorAll('button')].some(b => b.textContent?.includes('Đo tại T'))));
  expect(containsControls).toBe(true);
  await button(page, "Thoát toàn màn hình").click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement)).toBe(null);
});

test("renders at desktop and mobile widths without document overflow", async ({ page }, testInfo) => {
  for (const [name, width, height] of [["desktop", 1440, 900], ["mobile", 390, 844]]) {
    await page.setViewportSize({ width, height });
    await enterPilot(page);
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width + 1);
    await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
  }
});

test.describe("simulated pointer interactions", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  test("wheel zoom does not unlock rotation; a simulated touch drag does", async ({ page, context }) => {
    await enterPilot(page);
    await expect(page.locator("canvas")).toBeVisible();
    await answerFirst(page);
    const choice = button(page, "Góc nhìn mẫu");
    await expect(choice).toBeDisabled();
    const canvas = page.locator("canvas");
    await canvas.scrollIntoViewIfNeeded();
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas is not visible");
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.wheel(0, -140);
    await expect(choice).toBeDisabled();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + 80, y: y + 20 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(choice).toBeEnabled();
    await cdp.detach();
  });
});

test("guided, free and individual views share the same sample without changing measurements", async ({ page }) => {
  await enterPilot(page);
  await button(page, "Khám phá tự do").click();
  await expect(button(page, "Đo tại T")).toBeEnabled();
  await button(page, "Đo tại T").click();
  const table = page.getByRole("table", { name: "Các lần đo trong phiên" });
  await expect(table).toContainText("35");
  await button(page, "Một hạt nhân").click();
  await expect(page.getByText("Đang xem hạt 1 thuộc mẫu hiện tại", { exact: false })).toBeVisible();
  await expect(page.getByLabel(/^Mô hình 3D\./)).toHaveAttribute("aria-label", /1 hạt nhân chưa phân rã|0 hạt nhân chưa phân rã/);
  await button(page, "Bài học có hướng dẫn").click();
  await button(page, "Cảnh tiếp theo").click();
  await expect(table).toContainText("35");
  await button(page, "Cả mẫu").click();
  await expect(page.getByLabel(/^Mô hình 3D\./)).toHaveAttribute("aria-label", /35 hạt nhân chưa phân rã, 29 đã phân rã/);
});
