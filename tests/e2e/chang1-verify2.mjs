import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const ROUTES = [
  "/hoc-lieu", "/truoc-gio-hoc/video-hoat-hinh", "/truoc-gio-hoc/mo-phong", "/truoc-gio-hoc/infographic-lich-su",
  "/truoc-gio-hoc/phieu-hoc-tap", "/truoc-gio-hoc/video-bai-giang", "/trong-gio-hoc/xu-ly-du-lieu",
  "/trong-gio-hoc/so-do-tu-duy", "/trong-gio-hoc/tinh-huong-dong-vai", "/trong-gio-hoc/tro-choi-on-tap",
  "/sau-gio-hoc/on-tap-tu-kiem-tra", "/sau-gio-hoc/phan-hoi-tu-dieu-chinh", "/sau-gio-hoc/van-dung-mo-rong",
  "/demo-lesson", "/gioi-thieu",
];
const browser = await chromium.launch({ channel: "chrome" });
const out = { consoleErrors: {}, overflow: {}, keyboard: {}, links: {}, interactions: {} };

// 1. Console errors with NO screenshots (screenshots inject caret-color into inputs)
for (const vp of [{ width: 1440, height: 900, l: "desktop" }, { width: 390, height: 844, l: "mobile" }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await ctx.newPage();
  let errs = [];
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
  for (const r of ROUTES) {
    errs = [];
    await page.goto(BASE + r, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    out.consoleErrors[`${vp.l} ${r}`] = [...errs];
    out.overflow[`${vp.l} ${r}`] = sw;
  }
  await ctx.close();
}

// 2. Mobile menu + keyboard
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const toggle = page.locator("button[aria-controls='public-navigation']");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  out.keyboard.openedByEnter = await toggle.getAttribute("aria-expanded");
  const nav = page.locator("#public-navigation");
  out.keyboard.navData = await nav.getAttribute("data-open");
  // open phases submenu via keyboard
  const summary = nav.locator("summary", { hasText: "3 giai đoạn" });
  await summary.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  out.keyboard.phasesOpen = await page.evaluate(() => document.querySelector("#public-navigation details")?.open);
  out.keyboard.visibleLinksInPhases = await page.locator("#public-navigation details").first().locator("a:visible").count();
  await page.screenshot({ path: "docs/e2e-screenshots/chang1-13-pages/mobile-menu-open.png" });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  out.keyboard.afterEscPhases = await page.evaluate(() => document.querySelector("#public-navigation details")?.open);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  out.keyboard.afterEscExpanded = await toggle.getAttribute("aria-expanded");
  // Tab traversal on desktop
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const seen = [];
  for (let i = 0; i < 12; i++) { await page.keyboard.press("Tab"); seen.push(await page.evaluate(() => (document.activeElement?.textContent || document.activeElement?.tagName || "").trim().slice(0, 40))); }
  out.keyboard.tabOrder = seen;
  // Dead-link check across all menu links
  await page.locator("summary", { hasText: "3 giai đoạn" }).click();
  const hrefs = await page.locator("#public-navigation a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  const learning = hrefs.filter((h) => /^\/(truoc|trong|sau)-gio-hoc\//.test(h));
  out.links.learningCount = learning.length;
  out.links.bad = hrefs.filter((h) => h && (h.includes("?type=") || h.includes("giai-doan=")));
  out.links.demoLessonInLearning = learning.filter((h) => h.includes("demo-lesson"));
  const dead = [];
  for (const h of hrefs.filter((h) => h?.startsWith("/"))) {
    const res = await page.request.get(BASE + h);
    if (res.status() >= 400) dead.push(`${h} ${res.status()}`);
  }
  out.links.dead = dead;
  await ctx.close();
}

// 3. Interactions per page
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // 2.1 data lab: change T and check table row count / header changes
  await page.goto(BASE + "/trong-gio-hoc/xu-ly-du-lieu", { waitUntil: "networkidle" });
  const row1 = await page.locator(".data-lab-table tbody tr").first().innerText();
  await page.locator(".data-lab-controls input").nth(1).fill("40");
  await page.waitForTimeout(200);
  const rowsAfter = await page.locator(".data-lab-table tbody tr").count();
  const checkText = await page.locator(".data-lab-check").innerText();
  out.interactions.dataLab = { rowsAfter, checkMentionsN0over16: /4,00|4\.00/.test(checkText), sample: checkText.slice(0, 120) };

  // 2.2 mindmap: add idea & branch
  await page.goto(BASE + "/trong-gio-hoc/so-do-tu-duy", { waitUntil: "networkidle" });
  const before = await page.locator(".mindmap-counter").innerText().catch(() => "");
  const inputs = page.locator(".mindmap-workspace input[type=text], .mindmap-workspace input:not([type])");
  const nInputs = await inputs.count();
  if (nInputs) {
    await inputs.first().fill("Ý kiểm thử");
    await page.keyboard.press("Enter");
  }
  const after = await page.locator(".mindmap-counter").innerText().catch(() => "");
  out.interactions.mindmap = { before, after, nInputs, containsIdea: (await page.locator("body").innerText()).includes("Ý kiểm thử") };

  // 3.1 self-check: answer a choice question, then grade
  await page.goto(BASE + "/sau-gio-hoc/on-tap-tu-kiem-tra", { waitUntil: "networkidle" });
  await page.locator(".self-check-option input").first().check();
  await page.locator("button", { hasText: /Chấm điểm/ }).click();
  await page.waitForTimeout(300);
  out.interactions.selfCheck = (await page.locator(".self-check-result").innerText().catch(() => "no result")).slice(0, 200);

  // 2.4 team game: pick an option and submit
  await page.goto(BASE + "/trong-gio-hoc/tro-choi-on-tap", { waitUntil: "networkidle" });
  const start = page.locator("button", { hasText: /Bắt đầu|Chơi/ }).first();
  if (await start.count()) await start.click();
  await page.waitForTimeout(200);
  const radio = page.locator(".team-game-question input[type=radio]").first();
  let played = "no-radio";
  if (await radio.count()) {
    await radio.check();
    await page.locator("button", { hasText: /Chốt|Xác nhận|Trả lời/ }).first().click();
    await page.waitForTimeout(200);
    played = (await page.locator(".team-game-scoreboard").innerText()).replace(/\n/g, " | ");
  }
  out.interactions.teamGame = played;

  // 1.5 lecture video library switch
  await page.goto(BASE + "/truoc-gio-hoc/video-bai-giang", { waitUntil: "networkidle" });
  const items = page.locator(".lecture-video-item");
  const n = await items.count();
  await items.nth(Math.min(2, n - 1)).click();
  await page.waitForTimeout(300);
  // click video cover button to render <video> element
  const coverBtn = page.locator("button", { hasText: /Mở video/ }).first();
  if (await coverBtn.count()) {
    await coverBtn.click();
    await page.waitForTimeout(300);
  }
  out.interactions.lectureVideo = { items: n, heading: await page.locator(".lecture-video-player h2").innerText(), hasVideoEl: await page.locator("video").count() };

  // 3.3 application explorer tabs
  await page.goto(BASE + "/sau-gio-hoc/van-dung-mo-rong", { waitUntil: "networkidle" });
  await page.locator("[role=tab]").nth(3).click();
  out.interactions.application = await page.locator(".application-case h2").innerText();

  // 3.2 reflection renders
  await page.goto(BASE + "/sau-gio-hoc/phan-hoi-tu-dieu-chinh", { waitUntil: "networkidle" });
  out.interactions.reflectionRadios = await page.locator(".reflection-studio input[type=radio]").count();

  // 2.3 roleplay
  await page.goto(BASE + "/trong-gio-hoc/tinh-huong-dong-vai", { waitUntil: "networkidle" });
  out.interactions.roleplayTextareas = await page.locator(".roleplay-studio textarea").count();

  // 1.3 history: scientists present + lesson switch changes content
  await page.goto(BASE + "/truoc-gio-hoc/infographic-lich-su", { waitUntil: "networkidle" });
  const t0 = await page.locator("body").innerText();
  const lessonBtns = page.locator("button", { hasText: /B2[1-5]/ });
  const lb = await lessonBtns.count();
  if (lb > 1) await lessonBtns.nth(lb - 1).click();
  await page.waitForTimeout(300);
  const t1 = await page.locator("body").innerText();
  out.interactions.history = { lessonButtons: lb, changed: t0 !== t1, scientists: (t1.match(/Becquerel|Curie|Rutherford|Chadwick|Hahn|Einstein|Fermi/g) || []).length };
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(out, null, 1));
