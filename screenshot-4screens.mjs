import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE   = 'http://localhost:3005';
const EMAIL  = 'giolbana@yorbana.com';
const PASS   = 'Yorbana2025!';
const DL     = 'C:/Users/debai/Downloads';

const MOBILE = { width: 375, height: 812, isMobile: true, deviceScaleFactor: 2 };

async function waitForPaint(page) {
  await page.waitForFunction(() => {
    const bg = window.getComputedStyle(document.body).backgroundColor;
    return bg !== 'rgba(0, 0, 0, 0)' && bg !== 'rgb(255, 255, 255)';
  }, { timeout: 6000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForFunction(
    () => document.querySelector('button[type="submit"]') !== null,
    { timeout: 8000 }
  );
  await new Promise(r => setTimeout(r, 700));
  const emailEl = await page.$('input[type="email"]');
  const passEl  = await page.$('input[type="password"]');
  await emailEl.click({ clickCount: 3 });
  await emailEl.type(EMAIL, { delay: 40 });
  await passEl.click({ clickCount: 3 });
  await passEl.type(PASS,  { delay: 40 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);
  if (!page.url().includes('/panel')) {
    await page.goto(`${BASE}/panel`, { waitUntil: 'networkidle2' });
  }
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    defaultViewport: MOBILE,
  });

  const shots = [
    { name: 'mobile-1-dashboard',      url: `${BASE}/panel`,                   auth: true,  fullPage: true },
    { name: 'mobile-2-nueva-cita',     url: `${BASE}/panel/reservas/nueva`,    auth: true,  fullPage: true },
    { name: 'mobile-3-configuracion',  url: `${BASE}/panel/configuracion`,     auth: true,  fullPage: true },
    { name: 'mobile-4-reserva-publica',url: `${BASE}/reserva`,                 auth: false, fullPage: true },
  ];

  let loggedIn = false;

  for (const shot of shots) {
    console.log(`📸  ${shot.name} …`);
    const page = await browser.newPage();

    if (shot.auth && !loggedIn) {
      await login(page);
      loggedIn = true;
    } else if (shot.auth) {
      await page.goto(shot.url, { waitUntil: 'networkidle2', timeout: 20000 });
    } else {
      await page.goto(shot.url, { waitUntil: 'networkidle2', timeout: 20000 });
    }

    // For authenticated pages after first login, navigate directly
    if (shot.auth && loggedIn && page.url() !== shot.url) {
      await page.goto(shot.url, { waitUntil: 'networkidle2', timeout: 20000 });
    }

    await page.waitForSelector('h1', { timeout: 8000 }).catch(() => {});
    await waitForPaint(page);

    const file = path.join(__dirname, `${shot.name}.png`);
    await page.screenshot({ path: file, fullPage: shot.fullPage });
    console.log(`   saved: ${file}`);
    await page.close();
  }

  await browser.close();
  console.log('✅  All done.');
})();
