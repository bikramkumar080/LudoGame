// ui-shot.mjs — capture screenshots of real gameplay for visual inspection.
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 820 } });
await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });

await page.screenshot({ path: 'shot-1-setup.png' });
await page.click('#startBtn');

// Always capture the board a moment in, so we can see the layout.
await page.waitForTimeout(1200);
await page.screenshot({ path: 'shot-2-board.png' });

// Poll up to 30s for a glowing token (a 6). Report if it never came.
let glowing = false;
for (let i = 0; i < 120; i++) {
  if (await page.locator('.token.movable').count() > 0) { glowing = true; break; }
  await page.waitForTimeout(250);
}
console.log('glowing token appeared:', glowing);

if (glowing) {
  await page.screenshot({ path: 'shot-3-glowing.png' });
  await page.locator('.token.movable').first().click();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'shot-4-moved.png' });
}
await browser.close();
