// ui-check.mjs — drives the real page in Chrome to find UI bugs.
import { chromium } from 'playwright';

const pageErrors = [];
const failed = [];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 900, height: 800 } });

page.on('pageerror', (e) => pageErrors.push(String(e)));
page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });

await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
await page.click('#startBtn');

// Sample the visible state over ~6 seconds.
const timeline = [];
for (let i = 0; i < 20; i++) {
  const die = await page.getAttribute('#die', 'data-value');
  const rolling = await page.locator('#die.rolling').count();
  const movable = await page.locator('.token.movable').count();
  const msg = (await page.textContent('#message'))?.slice(0, 40);
  timeline.push(`t=${(i * 0.3).toFixed(1)}s die=${die || '·'} rolling=${rolling} movable=${movable} | ${msg}`);
  await page.waitForTimeout(300);
}

console.log('=== FAILED REQUESTS ===');
console.log(failed.length ? [...new Set(failed)].join('\n') : '(none)');
console.log('\n=== PAGE ERRORS ===');
console.log(pageErrors.length ? pageErrors.join('\n') : '(none)');
console.log('\n=== TIMELINE ===');
console.log(timeline.join('\n'));

await browser.close();
