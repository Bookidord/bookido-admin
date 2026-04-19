const { chromium } = require('playwright-chromium');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const BASE = 'http://localhost:3001';

  // ── Editor screenshot ────────────────────────────────────────
  const p1 = await browser.newPage();
  await p1.setViewportSize({ width: 1280, height: 900 });
  await p1.goto(BASE + '/admin/login', { waitUntil: 'networkidle' });
  await p1.fill('input[name=email]', 'admin@bookido.online');
  await p1.fill('input[name=password]', 'Bookido2025Admin!');
  await p1.click('button[type=submit]');
  await p1.waitForURL('**/admin', { timeout: 15000 });
  await p1.waitForLoadState('networkidle');

  await p1.goto(BASE + '/admin/clientes/yorbana-nail-estudio/landing', { waitUntil: 'networkidle' });
  await p1.waitForTimeout(2000);
  const isNotFound = !!(await p1.$('meta[name="next-error"]'));
  console.log('Editor URL:', p1.url(), '404?', isNotFound);
  if (!isNotFound) {
    await p1.screenshot({ path: 'C:/Users/debai/Downloads/landing-editor.png' });
    console.log('Editor screenshot saved');
  } else {
    const txt = await p1.evaluate(() => document.body.innerText.slice(0,100));
    console.log('Error page text:', txt);
  }

  // ── Landing mobile screenshot ────────────────────────────────
  const p2 = await browser.newPage();
  await p2.setViewportSize({ width: 375, height: 812 });
  await p2.goto(BASE + '/', { waitUntil: 'networkidle' });
  console.log('Landing URL:', p2.url());
  await p2.screenshot({ path: 'C:/Users/debai/Downloads/landing-yorbana-mobile.png', fullPage: true });
  console.log('Landing mobile screenshot saved');

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
