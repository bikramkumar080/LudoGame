// ui-test.mjs — headless UI regression test. Asserts the board LAYOUT is
// sane (this is what the CSS specificity bug broke). Deterministic: it does
// not depend on rolling a 6. Exits non-zero on failure.
//
// Requires the static server on http://localhost:8000 and Chrome.
// Run: node ui-test.mjs

import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 820 } });

const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

let failures = 0;
const ok = (cond, name, detail = '') => {
  if (cond) { console.log(`ok   ${name}`); }
  else { failures++; console.log(`FAIL ${name}${detail ? `\n     ${detail}` : ''}`); }
};

await page.goto('http://localhost:8000/', { waitUntil: 'networkidle' });
await page.click('#startBtn');
await page.waitForSelector('.token');
await page.waitForTimeout(300);

const board = await page.locator('#board').boundingBox();

ok(errors.length === 0, 'no runtime errors on load', errors.join('; '));

const tokenCount = await page.locator('.token').count();
ok(tokenCount === 16, 'exactly 16 tokens render', `got ${tokenCount}`);

const layerPos = await page.locator('.token-layer').evaluate((el) => getComputedStyle(el).position);
ok(layerPos === 'absolute', 'token-layer is absolutely positioned', `got "${layerPos}"`);

const hubPos = await page.locator('.home-center').evaluate((el) => getComputedStyle(el).position);
ok(hubPos === 'absolute', 'home hub is absolutely positioned', `got "${hubPos}"`);

// Every token must sit inside the board rectangle (the bug spilled them below it).
const boxes = await page.locator('.token').evaluateAll((els) =>
  els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
const pad = 2;
const outside = boxes.filter((b) =>
  b.x < board.x - pad || b.y < board.y - pad ||
  b.x + b.w > board.x + board.width + pad || b.y + b.h > board.y + board.height + pad);
ok(outside.length === 0, 'every token sits inside the board', `${outside.length} spilled outside`);

// Center hub must be near the board centre.
const hub = await page.locator('.home-center').boundingBox();
const dist = Math.hypot(
  hub.x + hub.width / 2 - (board.x + board.width / 2),
  hub.y + hub.height / 2 - (board.y + board.height / 2));
ok(dist < board.width * 0.1, 'center hub is near the board centre', `off by ${Math.round(dist)}px`);

// Tokens must have a visible coloured disc (solid colour or image).
const disc = await page.locator('.token-red > span').first().evaluate((el) => {
  const s = getComputedStyle(el); return { color: s.backgroundColor, image: s.backgroundImage };
});
const hasColour = (disc.image && disc.image !== 'none') ||
  (disc.color && disc.color !== 'transparent' && disc.color !== 'rgba(0, 0, 0, 0)');
ok(hasColour, 'red token has a coloured disc', `color:${disc.color} image:${disc.image}`);

await browser.close();
console.log(failures ? `\n${failures} UI check(s) failed` : '\nAll UI checks passed');
process.exit(failures ? 1 : 0);
