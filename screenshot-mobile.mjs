import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE   = 'http://localhost:3005';
const EMAIL  = 'giolbana@yorbana.com';
const PASS   = 'Yorbana2025!';

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('button[type="submit"]') !== null, { timeout: 8000 });
  await new Promise(r => setTimeout(r, 600));
  const emailInput = await page.$('input[type="email"]');
  const passInput  = await page.$('input[type="password"]');
  await emailInput.click({ clickCount: 3 });
  await emailInput.type(EMAIL, { delay: 40 });
  await passInput.click({ clickCount: 3 });
  await passInput.type(PASS, { delay: 40 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function waitForDark(page) {
  await page.waitForFunction(() => {
    const bg = window.getComputedStyle(document.body).backgroundColor;
    return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)';
  }, { timeout: 6000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    defaultViewport: { width: 375, height: 812, isMobile: true, deviceScaleFactor: 2 },
  });

  // ── Screenshot 1: /panel/configuracion ──────────────────────────────────────
  console.log('Shooting /panel/configuracion at 375px…');
  const page1 = await browser.newPage();
  await login(page1);
  if (!page1.url().includes('/panel')) {
    await page1.goto(`${BASE}/panel`, { waitUntil: 'networkidle2' });
  }
  await page1.goto(`${BASE}/panel/configuracion`, { waitUntil: 'networkidle2' });
  await page1.waitForSelector('h1', { timeout: 8000 });
  await waitForDark(page1);
  await page1.screenshot({ path: path.join(__dirname, 'screenshot-config-mobile.png'), fullPage: true });
  console.log('Saved: screenshot-config-mobile.png');
  await page1.close();

  // ── Screenshot 2: /panel/reservas/nueva ─────────────────────────────────────
  console.log('Shooting /panel/reservas/nueva at 375px…');
  const page2 = await browser.newPage();
  await page2.goto(`${BASE}/panel/reservas/nueva`, { waitUntil: 'networkidle2', timeout: 20000 });
  await page2.waitForSelector('h1', { timeout: 8000 });
  await waitForDark(page2);
  await page2.screenshot({ path: path.join(__dirname, 'screenshot-nueva-mobile.png'), fullPage: true });
  console.log('Saved: screenshot-nueva-mobile.png');
  await page2.close();

  await browser.close();
})();
