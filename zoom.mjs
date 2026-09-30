// zoom.mjs — clipped screenshot of the top-right (green) base for inspection.
import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 820 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
await page.click('#startBtn');
await page.waitForSelector('.token');
await page.waitForTimeout(300);
const b = await page.locator('#board').boundingBox();
// Top-right quadrant (green base) ~ right 40%, top 40%.
await page.screenshot({
  path: 'shot-zoom.png',
  clip: { x: b.x + b.width * 0.58, y: b.y + b.height * 0.02, width: b.width * 0.4, height: b.height * 0.4 },
});
await browser.close();
console.log('zoom saved');
