// live-check.mjs — verify the deployed GitHub Pages site works in production.
import { chromium } from 'playwright';

const URL = process.argv[2] || 'https://bikramkumar080.github.io/LudoGame/';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 820 } });

const errors = [], failed = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });

const resp = await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
console.log('page status :', resp?.status());

await page.click('#startBtn');
await page.waitForSelector('.token', { timeout: 10000 });
const tokens = await page.locator('.token').count();

// Wait briefly for a glowing piece (a 6) to prove the loop runs live.
let glowing = false;
for (let i = 0; i < 40; i++) {
  if (await page.locator('.token.movable').count() > 0) { glowing = true; break; }
  await page.waitForTimeout(250);
}

await page.screenshot({ path: 'shot-live.png' });

console.log('tokens      :', tokens);
console.log('glow seen   :', glowing);
console.log('failed reqs :', failed.length ? failed.join(', ') : 'none');
console.log('page errors :', errors.length ? errors.join(', ') : 'none');
await browser.close();
