/* 桌面预览壳自查：面板比例 + 页眉几何（页眉的详细契约见 verify-header.cjs）
 * 用法：先启动 serve.cjs，再 node verify-desktop-shell.cjs
 * 输出：verification/desktop-shell-top.png、desktop-shell-scrolled.png */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/13403/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const url = process.env.REVIEW_URL || 'http://127.0.0.1:4186/?view=home';
const W = Number(process.env.SHELL_W || 1536);
const H = Number(process.env.SHELL_H || 703);
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: W, height: H } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url);
    await page.locator('.modules').waitFor();
    fs.mkdirSync('verification', { recursive: true });
    await page.screenshot({ path: 'verification/desktop-shell-top.png' });

    await page.evaluate(() => { document.querySelector('.page-content').scrollTop = 260; });
    await page.waitForTimeout(400);
    await page.screenshot({ path: 'verification/desktop-shell-scrolled.png' });

    const read = () => page.evaluate(() => {
      const q = s => document.querySelector(s);
      const panel = q('.phone').getBoundingClientRect();
      const head = q('.phone .app-header');
      const header = head.getBoundingClientRect();
      const cs = getComputedStyle(head);
      const rectOf = s => { const el = q(s); return el ? [Math.round(el.getBoundingClientRect().height), getComputedStyle(el).fontSize] : null; };
      return {
        panel: [Math.round(panel.width), Math.round(panel.height), Math.round(panel.top)],
        panelAspect: +(panel.width / panel.height).toFixed(3),
        headerBox: [Math.round(header.top), Math.round(header.height)],
        headerVisible: Math.round(Math.min(panel.bottom, header.bottom) - Math.max(panel.top, header.top)),
        headerColor: cs.backgroundColor,
        backdropImage: getComputedStyle(q('.app-backdrop')).backgroundImage.includes('cover-landscape'),
        compact: head.classList.contains('is-compact'),
        scrollTop: q('.page-content').scrollTop,
        parts: {
          brand: rectOf('.phone .app-header .brand'),
          mark: rectOf('.phone .app-header .brand>b'),
          name: rectOf('.phone .app-header .brand>span'),
          sub: rectOf('.phone .app-header .brand small'),
          tools: rectOf('.phone .app-header .header-tools'),
          btn: rectOf('.phone .app-header .header-tools .icon-button'),
        },
      };
    });
    console.log(`${W}x${H} 滚动后 `, JSON.stringify(await read()));
    await page.evaluate(() => { document.querySelector('.page-content').scrollTop = 0; });
    await page.waitForTimeout(400);
    console.log(`${W}x${H} 未滚动 `, JSON.stringify(await read()));
    if (errors.length) throw new Error(`script errors: ${errors.join(' | ')}`);
    console.log('PASS 桌面壳检查完成');
  } finally { await browser.close(); }
})();
