import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL    = 'http://localhost:3004';
const EMAIL  = 'giolbana@yorbana.com';
const PASS   = 'Yorbana2025!';
const OUT    = path.join(__dirname, 'panel-screenshot.png');

(async () => {
  console.log('Launching Chrome…');
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1440,900',
      '--disable-gpu',
      '--disable-dev-shm-usage',
    ],
    defaultViewport: { width: 1440, height: 900 },
  });

  const page = await browser.newPage();

  // ── 1. Login ──────────────────────────────────────────────────────────────
  console.log('Navigating to /login…');
  await page.goto(`${URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for React to hydrate — the submit button becomes non-disabled when ready
  await page.waitForFunction(() => {
    const btn = document.querySelector('button[type="submit"]');
    return btn !== null;
  }, { timeout: 10000 });

  // Extra time for React hydration
  await new Promise(r => setTimeout(r, 800));

  // Clear and fill form
  const emailInput = await page.$('input[type="email"]');
  const passInput  = await page.$('input[type="password"]');
  await emailInput.click({ clickCount: 3 });
  await emailInput.type(EMAIL, { delay: 40 });
  await passInput.click({ clickCount: 3 });
  await passInput.type(PASS, { delay: 40 });

  console.log('Submitting login…');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);

  console.log('Post-login URL:', page.url());

  // ── 2. Make sure we're on /panel ──────────────────────────────────────────
  if (!page.url().includes('/panel')) {
    console.log('Navigating directly to /panel…');
    await page.goto(`${URL}/panel`, { waitUntil: 'networkidle2', timeout: 20000 });
    console.log('Final URL:', page.url());
  }

  // Wait for the main dashboard heading
  await page.waitForSelector('h1', { timeout: 10000 });

  // Wait for Tailwind CSS to paint (body background should be dark)
  await page.waitForFunction(() => {
    const bg = window.getComputedStyle(document.body).backgroundColor;
    return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)';
  }, { timeout: 8000 }).catch(() => console.log('CSS paint wait timed out'));

  // Let fonts + transitions settle
  await new Promise(r => setTimeout(r, 1200));

  // ── 3. Screenshot ─────────────────────────────────────────────────────────
  console.log('Taking screenshot…');
  await page.screenshot({ path: OUT, fullPage: false });
  console.log('Saved:', OUT);

  await browser.close();
})();
