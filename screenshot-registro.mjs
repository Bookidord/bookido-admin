import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE   = 'http://localhost:3005';
const DL     = 'C:/Users/debai/Downloads';
const MOBILE = { width: 375, height: 812, isMobile: true, deviceScaleFactor: 2 };

async function waitForPaint(page) {
  await page.waitForFunction(() => {
    const bg = window.getComputedStyle(document.body).backgroundColor;
    return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)';
  }, { timeout: 6000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 800));
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    defaultViewport: MOBILE,
  });

  const page = await browser.newPage();
  console.log('📸  Shooting /registro at 375px…');

  await page.goto(`${BASE}/registro`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForSelector('h1', { timeout: 8000 }).catch(() => {});
  await waitForPaint(page);

  const file = path.join(__dirname, 'registro-mobile.png');
  await page.screenshot({ path: file, fullPage: true });
  console.log(`   saved: ${file}`);

  const dl = path.join(DL, 'registro-mobile.png');
  await page.screenshot({ path: dl, fullPage: true });
  console.log(`   saved: ${dl}`);

  await browser.close();
  console.log('✅  Done.');
})();
