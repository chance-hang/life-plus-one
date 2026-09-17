/* 出图：把两张卡片各自截一张，并记下卡片相对面板的坐标，供 PIL 画标尺 */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/13403/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const ctx = await b.newContext({ reducedMotion: 'reduce', viewport: { width: 1536, height: 703 } });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:4173/?view=home');
  await p.locator('.modules').waitFor();
  const boxes = (st) => p.evaluate(s => {
    if (s) setHomeStyle(s);
    const panel = document.querySelector('.phone').getBoundingClientRect();
    const rel = el => { const r = el.getBoundingClientRect(); return { x: r.left - panel.left, y: r.top - panel.top, w: r.width, h: r.height }; };
    const hero = document.querySelector('.life-banner');
    const cap = hero.querySelector('.banner-caption');
    return { hero: rel(hero), caption: cap ? rel(cap) : null, copy: rel(hero.querySelector('.banner-copy')) };
  }, st);
  const out = {};
  for (const [style, arg] of [['photo', null], ['classic', 'classic']]) {
    const g = await boxes(arg);
    await p.waitForTimeout(120);
    await p.locator('.phone').screenshot({ path: `verification/annot-${style}.png` });
    out[style] = g;
  }
  fs.writeFileSync('.workbuddy/annot.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
  await b.close();
})();
