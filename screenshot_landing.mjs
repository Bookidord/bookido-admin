import { chromium } from "playwright-chromium";

const BASE = "http://localhost:3001";
const OUT = "C:/Users/debai/Downloads";

async function run() {
  const browser = await chromium.launch({ headless: true });

  // ── 1. Admin login ─────────────────────────────────────────────────────────
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  console.log("Logging in to admin panel...");
  await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT}/debug-login.png` });
  console.log("Login page loaded:", page.url());

  // Fill login form
  await page.fill('input[type="email"], input[name="email"]', "admin@bookido.online");
  await page.fill('input[type="password"], input[name="password"]', "Bookido2025Admin!");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 8000 }).catch(() => {});
  console.log("After login:", page.url());
  await page.screenshot({ path: `${OUT}/debug-after-login.png` });

  // ── 2. Landing editor screenshot (1280px) ─────────────────────────────────
  const editorUrl = `${BASE}/admin/clientes/yorbana-nail-estudio/landing`;
  console.log("Navigating to editor:", editorUrl);
  await page.goto(editorUrl, { waitUntil: "networkidle", timeout: 15000 });
  console.log("Editor page URL:", page.url());
  await page.screenshot({ path: `${OUT}/landing-editor.png`, fullPage: false });
  console.log("landing-editor.png saved");

  // ── 3. Landing mobile screenshot (375px) ─────────────────────────────────
  const mobileCtx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const mobilePage = await mobileCtx.newPage();
  await mobilePage.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 12000 });
  console.log("Mobile landing URL:", mobilePage.url());
  await mobilePage.screenshot({ path: `${OUT}/landing-yorbana-mobile.png`, fullPage: true });
  console.log("landing-yorbana-mobile.png saved");

  await browser.close();
  console.log("Done.");
}

run().catch(err => { console.error(err); process.exit(1); });
