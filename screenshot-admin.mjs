import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE   = 'http://localhost:3004';
const EMAIL  = 'admin@bookido.online';
const PASS   = 'Bookido2025Admin!';
const W      = 1280;
const H      = 900;

const PAGES = [
  { path: '/admin/login',         file: 'admin-1-login.png',         waitFor: 'h1' },
  { path: '/admin',               file: 'admin-2-dashboard.png',     waitFor: 'h1' },
  { path: '/admin/clientes',      file: 'admin-3-clientes.png',      waitFor: 'h1' },
  { path: '/admin/planes',        file: 'admin-4-planes.png',        waitFor: 'h1' },
  { path: '/admin/configuracion', file: 'admin-5-configuracion.png', waitFor: 'h1' },
];

async function waitForDark(page) {
  await page.waitForFunction(
    () => {
      const bg = window.getComputedStyle(document.body).backgroundColor;
      return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)';
    },
    { timeout: 6000 },
  ).catch(() => {});
}

(async () => {
  console.log('Launching Chrome at', W, 'x', H, '…');
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--window-size=${W},${H}`,
      '--disable-gpu',
      '--disable-dev-shm-usage',
    ],
    defaultViewport: { width: W, height: H },
  });

  const page = await browser.newPage();

  // ── 1. Screenshot: login page (unauthenticated) ───────────────────────────
  console.log('\n[1/5] /admin/login …');
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await waitForDark(page);
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(__dirname, PAGES[0].file), fullPage: false });
  console.log('  Saved:', PAGES[0].file);

  // ── 2. Login ──────────────────────────────────────────────────────────────
  console.log('\nLogging in as', EMAIL, '…');
  await page.waitForSelector('input[type="email"]', { timeout: 8000 });
  await page.type('input[type="email"]', EMAIL, { delay: 40 });
  await page.type('input[type="password"]', PASS, { delay: 40 });

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log('  Landed on:', page.url());

  // ── 3. Screenshot: admin dashboard ───────────────────────────────────────
  console.log('\n[2/5] /admin …');
  if (!page.url().includes('/admin') || page.url().includes('/login')) {
    await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle2', timeout: 20000 });
  }
  await page.waitForSelector('h1', { timeout: 8000 });
  await waitForDark(page);
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(__dirname, PAGES[1].file), fullPage: false });
  console.log('  Saved:', PAGES[1].file);

  // ── 4-6. Remaining pages ──────────────────────────────────────────────────
  for (let i = 2; i < PAGES.length; i++) {
    const pg = PAGES[i];
    console.log(`\n[${i + 1}/5] ${pg.path} …`);
    await page.goto(`${BASE}${pg.path}`, { waitUntil: 'networkidle2', timeout: 20000 });
    await page.waitForSelector(pg.waitFor, { timeout: 8000 }).catch(() => {});
    await waitForDark(page);
    await new Promise(r => setTimeout(r, 700));
    await page.screenshot({ path: path.join(__dirname, pg.file), fullPage: false });
    console.log('  Saved:', pg.file);
  }

  await browser.close();
  console.log('\nDone — 5 screenshots saved.');
})();
