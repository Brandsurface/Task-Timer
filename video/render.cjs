// Renders the composition frame by frame (every frame is a pure function of time).
// Usage: node render.cjs <compDir> <outDir> <fps> <fromSec> <toSec>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const [compDir, out, fps, t0, t1] = [process.argv[2], process.argv[3], +process.argv[4], +process.argv[5], +process.argv[6]];

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGEERR', e.message));
  await page.goto('file://' + path.resolve(compDir, 'index.html'));
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  const dur = await page.evaluate(() => TL.dur);
  const end = Math.min(t1, dur);
  for (let f = Math.round(t0 * fps); f < Math.round(end * fps); f++) {
    await page.evaluate(t => window.renderFrame(t), f / fps);
    await page.screenshot({ path: path.join(out, String(f).padStart(6, '0') + '.jpg'), type: 'jpeg', quality: 95 });
  }
  await browser.close();
})();
