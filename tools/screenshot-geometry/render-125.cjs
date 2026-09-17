/* 以 deviceScaleFactor=1.25 渲染两种卡片（与用户截图同比例），并记录卡片在各面板图中的位置 */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/13403/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const ctx = await b.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.25 });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:4173/?view=home');
  await p.locator('.modules').waitFor();
  const info = {};
  for (const [style, arg] of [['photo', null], ['classic', 'classic']]) {
    if (arg) await p.evaluate(s => setHomeStyle(s), arg);
    await p.waitForTimeout(150);
    const box = await p.evaluate(() => {
      const panel = document.querySelector('.phone').getBoundingClientRect();
      const r = document.querySelector('.life-banner').getBoundingClientRect();
      return { panel: { x: panel.left, y: panel.top, w: panel.width, h: panel.height },
               card: { x: r.left - panel.left, y: r.top - panel.top, w: r.width, h: r.height } };
    });
    await p.locator('.phone').screenshot({ path: `.workbuddy/panel-${style}.png` });
    info[style] = box;
  }
  fs.writeFileSync('.workbuddy/panel-info.json', JSON.stringify(info, null, 2));
  console.log(JSON.stringify(info));
  await b.close();
})();
