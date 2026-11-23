import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const SHOTS = "docs/e2e-screenshots/chang1-13-pages";
fs.mkdirSync(SHOTS, { recursive: true });

const PAGES = [
  { route: "/hoc-lieu", name: "kho-hoc-lieu" },
  { route: "/truoc-gio-hoc/video-hoat-hinh", name: "1.1-video-hoat-hinh" },
  { route: "/truoc-gio-hoc/mo-phong", name: "1.2-mo-phong" },
  { route: "/truoc-gio-hoc/infographic-lich-su", name: "1.3-infographic-lich-su" },
  { route: "/truoc-gio-hoc/phieu-hoc-tap", name: "1.4-phieu-hoc-tap" },
  { route: "/truoc-gio-hoc/video-bai-giang", name: "1.5-video-bai-giang" },
  { route: "/trong-gio-hoc/xu-ly-du-lieu", name: "2.1-xu-ly-du-lieu" },
  { route: "/trong-gio-hoc/so-do-tu-duy", name: "2.2-so-do-tu-duy" },
  { route: "/trong-gio-hoc/tinh-huong-dong-vai", name: "2.3-tinh-huong-dong-vai" },
  { route: "/trong-gio-hoc/tro-choi-on-tap", name: "2.4-tro-choi-on-tap" },
  { route: "/sau-gio-hoc/on-tap-tu-kiem-tra", name: "3.1-on-tap-tu-kiem-tra" },
  { route: "/sau-gio-hoc/phan-hoi-tu-dieu-chinh", name: "3.2-phan-hoi-tu-dieu-chinh" },
  { route: "/sau-gio-hoc/van-dung-mo-rong", name: "3.3-van-dung-mo-rong" },
];

const results = [];
const browser = await chromium.launch({ channel: "chrome" });

async function collectErrors(viewport, label) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

  for (const p of PAGES) {
    errors.length = 0;
    const res = await page.goto(BASE + p.route, { waitUntil: "networkidle", timeout: 60000 });
    const status = res?.status();
    const h1 = (await page.locator("h1").first().textContent().catch(() => null))?.trim() ?? null;
    const bodyLen = (await page.locator("body").innerText()).length;
    await page.screenshot({ path: `${SHOTS}/${p.name}-${label}.png`, fullPage: label === "desktop" });
    results.push({ viewport: label, route: p.route, status, h1, bodyLen, errors: [...errors] });
  }
  await ctx.close();
}

await collectErrors({ width: 1440, height: 900 }, "desktop");
await collectErrors({ width: 390, height: 844 }, "mobile");

// ---- Menu structure: 1 hub + 5 + 4 + 3, no /demo-lesson or ?type= in learning menu
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(BASE + "/", { waitUntil: "networkidle" });
const header = page.locator("header").first();
const summary = header.locator("summary", { hasText: "3 giai đoạn" }).first();
await summary.click();
const menuData = await page.evaluate(() => {
  const out = [];
  document.querySelectorAll("details").forEach((d) => {
    const s = d.querySelector("summary");
    if (!s) return;
    out.push({
      group: s.textContent.trim(),
      links: [...d.querySelectorAll("a")].map((a) => a.getAttribute("href")),
    });
  });
  return out;
});

// ---- Scientist history
await page.goto(BASE + "/truoc-gio-hoc/infographic-lich-su", { waitUntil: "networkidle" });
const histNew = await page.locator("text=/Einstein|Curie|Rutherford|Becquerel|Chadwick|Hahn/i").count();
const histTabs = await page.locator("button").count();
await page.goto(BASE + "/demo-lesson", { waitUntil: "networkidle" });
const histDemo = await page.locator("text=/Einstein|Curie|Rutherford|Becquerel|Chadwick|Hahn/i").count();
await page.goto(BASE + "/gioi-thieu", { waitUntil: "networkidle" });
const histIntro = await page.locator("text=/Einstein|Curie|Rutherford|Becquerel|Chadwick|Hahn/i").count();
// 1.3 interactive: click a lesson in NuclearHistory
await page.goto(BASE + "/truoc-gio-hoc/infographic-lich-su", { waitUntil: "networkidle" });
const beforeClick = await page.locator("body").innerText();
const galleryBtn = page.locator("button").filter({ hasText: /B2[1-5]/ }).first();
let galleryWorks = "n/a";
if (await galleryBtn.count()) {
  await galleryBtn.click();
  await page.waitForTimeout(400);
  galleryWorks = (await page.locator("body").innerText()) !== beforeClick ? "content-changed" : "no-change";
}
await ctx.close();

// ---- Keyboard: mobile menu opens with Enter on toggle, Escape closes
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await mctx.newPage();
await mp.goto(BASE + "/", { waitUntil: "networkidle" });
const toggle = mp.locator("header button").first();
await toggle.focus();
await mp.keyboard.press("Enter");
await mp.waitForTimeout(400);
const openedAfterEnter = await mp.locator("header details[open]").count();
await mp.screenshot({ path: `${SHOTS}/mobile-menu-open.png` });
await mp.keyboard.press("Escape");
await mp.waitForTimeout(300);
const openAfterEsc = await mp.locator("header details[open]").count();
await mctx.close();

await browser.close();

fs.writeFileSync("docs/e2e-screenshots/chang1-13-pages/report.json", JSON.stringify({ results, menuData, history: { histNew, histIntro, histDemo, galleryWorks }, keyboard: { openedAfterEnter, openAfterEsc } }, null, 2));
console.log(JSON.stringify({ results, menuData, history: { histNew, histIntro, histDemo, galleryWorks }, keyboard: { openedAfterEnter, openAfterEsc } }, null, 2));
