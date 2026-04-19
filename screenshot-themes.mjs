/**
 * screenshot-themes.mjs
 * Captures two tenant landings side-by-side to demonstrate per-tenant theming.
 * Targets bookido-v2 (Express) at localhost:4000.
 */
import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE   = 'http://bookido.online';   // served via nginx → port 4000
const W = 1280, H = 900;

const TENANTS = [
  { slug: 'yorbana-nail',  file: 'theme-1-yorbana-rose.png',   label: 'Yorbana (#be185d rose)' },
  { slug: 'prueba-deploy', file: 'theme-2-barberia-indigo.png', label: 'Barbería (#4f46e5 indigo)' },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--window-size=${W},${H}`, '--disable-gpu'],
    defaultViewport: { width: W, height: H },
  });

  const page = await browser.newPage();

  for (const t of TENANTS) {
    const url = `${BASE}/${t.slug}`;
    console.log(`\nCapturing ${t.label}  →  ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    // Wait for hero section to paint
    await page.waitForSelector('section', { timeout: 8000 }).catch(() => {});
    await new Promise(r => setTimeout(r, 800));
    await page.screenshot({ path: path.join(__dirname, t.file), fullPage: false });
    console.log(`  Saved: ${t.file}`);
  }

  await browser.close();
  console.log('\nDone — 2 theme screenshots saved.');
})();
