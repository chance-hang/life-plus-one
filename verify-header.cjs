/* 页眉自查：两个圆角胶囊（同底色）+ 滚动向两侧角落收拢 + 内容不透出 / 不穿出
 * 用法：先启动 serve.cjs，再 node verify-header.cjs
 * 输出：verification/header-{375,1440}-{top,scrolled}.png、verification/header-metrics.json
 * 说明：像素级复核见同目录 verify-header-pixels.py（可选，读取上面的截图与 JSON）。 */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/13403/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const url = process.env.REVIEW_URL || 'http://127.0.0.1:4186/?view=home';
const CANVAS = 'rgb(238, 244, 253)';
const VIEWPORTS = [
  { w: 375, h: 844, tag: '375' },
  { w: 460, h: 844, tag: '460' },
  { w: 1536, h: 703, tag: '1440' },
];

const readState = () => {
  const q = s => document.querySelector(s);
  const host = q('.phone > .page-content');
  const head = q('.phone .app-header');
  const banner = q('.review-banner');
  const hostScrolls = host.scrollHeight > host.clientHeight + 1;
  // 面板内滚动 → sticky top 写 0，页眉停在面板滚动区顶边；
  // 窗口滚动 → sticky top 写固定横幅的高度，页眉停在横幅下沿。
  const bannerHeight = banner ? Math.round(banner.getBoundingClientRect().height) : 0;
  const stickyValue = hostScrolls ? 0 : bannerHeight;
  // 面板内滚动时，页眉最多只能贴到父级内容盒上边（sticky 的硬约束）
  const contentTop = Math.round(host.getBoundingClientRect().top + parseFloat(getComputedStyle(host).paddingTop));
  const stickyExpected = hostScrolls ? contentTop : bannerHeight;
  const cs = getComputedStyle(head);
  const pseudo = getComputedStyle(head, '::before');
  const box = el => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; };
  const brand = q('.phone .app-header .brand');
  const tools = q('.phone .app-header .header-tools');
  const bBox = brand.getBoundingClientRect();
  const tBox = tools.getBoundingClientRect();
  const hBox = head.getBoundingClientRect();
  const pBox = q('.phone').getBoundingClientRect();
  const fromPanelLeft = Math.round(bBox.left - pBox.left);
  const toPanelRight = Math.round(pBox.right - tBox.right);
  const midY = Math.round(hBox.top + hBox.height / 2);
  const gapX = Math.round((bBox.right + tBox.left) / 2);
  const at = (x, y) => document.elementFromPoint(x, y)?.closest('.app-header') !== null;
  return {
    scrollY: Math.round(window.scrollY || document.documentElement.scrollTop || 0),
    pcScrollTop: Math.round(host.scrollTop),
    hostScrolls,
    stickyValue,
    stickyExpected,
    overflowing: document.documentElement.scrollWidth > innerWidth,
    header: {
      box: box(head),
      viewportTop: Math.round(hBox.top),
      height: Math.round(hBox.height),
      position: cs.position,
      zIndex: cs.zIndex,
      stickyTop: cs.top,
      background: cs.backgroundColor,
      veil: pseudo.backgroundImage,
      compact: head.classList.contains('is-compact'),
    },
    edges: { fromPanelLeft, toPanelRight },
    brand: {
      box: box(brand),
      background: getComputedStyle(brand).backgroundColor,
      radius: getComputedStyle(brand).borderTopLeftRadius,
      padding: getComputedStyle(brand).padding,
      smallHeight: Math.round(q('.phone .app-header .brand small').getBoundingClientRect().height),
      markSize: getComputedStyle(q('.phone .app-header .brand>b')).fontSize,
    },
    tools: { box: box(tools), background: getComputedStyle(tools).backgroundColor, radius: getComputedStyle(tools).borderTopLeftRadius },
    gap: {
      above: at(Math.round(innerWidth / 2), Math.round(hBox.top) + 2),
      middle: at(gapX, midY),
      brand: at(Math.round(bBox.left + bBox.width / 2), midY),
      tools: at(Math.round(tBox.left + tBox.width / 2), midY),
    },
    smallControls: [...document.querySelectorAll('.phone .app-header button')]
      .map(el => { const r = el.getBoundingClientRect(); return r.width && r.height && (r.width < 43.5 || r.height < 43.5) ? `${el.className}:${Math.round(r.width)}x${Math.round(r.height)}` : null; })
      .filter(Boolean),
  };
};

const scrollTo = (page, y) => page.evaluate(y => {
  const host = document.querySelector('.phone > .page-content');
  if (host && host.scrollHeight > host.clientHeight + 1) host.scrollTop = y;
  else window.scrollTo(0, y);
}, y);

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const metrics = {};
  try {
    fs.mkdirSync('verification', { recursive: true });
    for (const { w, h, tag } of VIEWPORTS) {
      const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: w, height: h } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(url);
      await page.locator('.modules').waitFor();
      await page.waitForTimeout(200);

      const rest = await page.evaluate(readState);
      await page.screenshot({ path: `verification/header-${tag}-top.png` });
      await scrollTo(page, 320);
      await page.waitForTimeout(420);
      const stuck = await page.evaluate(readState);
      await page.screenshot({ path: `verification/header-${tag}-scrolled.png` });
      // 对照组：把遮罩关掉再拍一张。像素复核靠这两张的差异证明遮罩真的在挡内容。
      const noMask = await page.addStyleTag({ content: '.phone .app-header::before{background:none !important}' });
      await page.waitForTimeout(150);
      await page.screenshot({ path: `verification/header-${tag}-nomask.png` });
      await page.evaluate(el => el.remove(), noMask);
      metrics[tag] = { rest, stuck };
      // 先落盘再断言，断言失败时仍能拿到现场数据。
      fs.writeFileSync('verification/header-metrics.json', JSON.stringify(metrics, null, 1));
      if (process.env.HEADER_DUMP) console.log(tag, JSON.stringify({ rest, stuck }, null, 1));

      const where = `${w}x${h}`;
      // —— 静止态：两个圆角胶囊、同底色、整体比原来矮 ——
      assert.equal(rest.header.background, 'rgba(0, 0, 0, 0)', `${where} 页眉容器不该有底色（不得是白色矩形）`);
      assert(!rest.overflowing, `${where} 页面出现横向溢出`);
      for (const key of ['brand', 'tools']) {
        assert.equal(rest[key].background, CANVAS, `${where} ${key} 胶囊底色应等于页面底色，实际 ${rest[key].background}`);
        assert(parseFloat(rest[key].radius) >= 20, `${where} ${key} 胶囊应为圆角，实际 ${rest[key].radius}`);
      }
      assert(Math.abs(rest.brand.box[3] - rest.tools.box[3]) <= 2, `${where} 两个胶囊高度应一致：${rest.brand.box[3]} vs ${rest.tools.box[3]}`);
      assert(rest.header.height <= 64, `${where} 页眉整体高度应比原 78px 更矮，实际 ${rest.header.height}`);
      assert.deepEqual(rest.smallControls, [], `${where} 页眉内有触控区不足的按钮：${rest.smallControls.join(', ')}`);
      assert(rest.edges.fromPanelLeft >= 12 && rest.edges.fromPanelLeft <= 26, `${where} 左胶囊应贴近左边缘，实际 ${rest.edges.fromPanelLeft}`);
      assert(rest.edges.toPanelRight >= 12 && rest.edges.toPanelRight <= 26, `${where} 右胶囊应贴近右边缘，实际 ${rest.edges.toPanelRight}`);
      assert(rest.gap.brand && rest.gap.tools, `${where} 胶囊应位于页眉最上层`);

      // —— 滚动后：贴顶收拢、向两侧角落滑动、同色遮罩兜住内容 ——
      assert.equal(stuck.header.position, 'sticky', `${where} 页眉应保持 sticky`);
      assert.equal(stuck.header.stickyTop, `${stuck.stickyValue}px`, `${where} sticky top 应为 ${stuck.stickyValue}px，否则内容会从页眉顶端穿过`);
      assert(Math.abs(stuck.header.viewportTop - stuck.stickyExpected) <= 1.5, `${where} 滚动后页眉顶端应停在该停的位置（${stuck.stickyExpected}），实际 ${stuck.header.viewportTop}`);
      assert(stuck.header.compact, `${where} 滚动后应进入紧凑态`);
      assert(stuck.brand.box[2] < rest.brand.box[2], `${where} 左胶囊滚动后应变小：${rest.brand.box[2]} → ${stuck.brand.box[2]}`);
      assert(stuck.tools.box[2] < rest.tools.box[2], `${where} 右胶囊滚动后应变小：${rest.tools.box[2]} → ${stuck.tools.box[2]}`);
      assert(stuck.edges.fromPanelLeft < rest.edges.fromPanelLeft, `${where} 左胶囊应向左侧角落滑动：${rest.edges.fromPanelLeft} → ${stuck.edges.fromPanelLeft}`);
      assert(stuck.edges.toPanelRight < rest.edges.toPanelRight, `${where} 右胶囊应向右侧角落滑动：${rest.edges.toPanelRight} → ${stuck.edges.toPanelRight}`);
      assert(stuck.brand.box[1] <= rest.brand.box[1], `${where} 左胶囊应略向上滑动`);
      assert(/linear-gradient/.test(stuck.header.veil), `${where} 页眉缺少同色柔化遮罩`);
      assert(stuck.header.veil.includes('rgba(238, 244, 253') || stuck.header.veil.includes('238, 244, 253'), `${where} 遮罩颜色应与页面底色一致，实际 ${stuck.header.veil}`);
      assert(stuck.gap.brand && stuck.gap.tools, `${where} 胶囊应位于页眉最上层`);
      assert(Number(stuck.header.zIndex) > 0, `${where} 页眉应建立高于内容的层叠上下文，实际 z-index ${stuck.header.zIndex}`);
      assert(stuck.header.height <= 64, `${where} 紧凑态页眉仍偏高：${stuck.header.height}`);
      assert(errors.length === 0, `${where} 脚本报错：${errors.join(' | ')}`);
      await context.close();
    }
    for (const { tag } of VIEWPORTS) {
      const { rest, stuck } = metrics[tag];
      console.log(`${tag}  静止 页眉 ${rest.header.box.join(',')} 左胶囊 ${rest.brand.box.join(',')} 右胶囊 ${rest.tools.box.join(',')}`);
      console.log(`${tag}  滚动 页眉顶 ${stuck.header.viewportTop} 左胶囊 ${stuck.brand.box.join(',')} 右胶囊 ${stuck.tools.box.join(',')}`);
    }
    console.log('PASS 页眉自查通过（原地/滚动、375/460/1440 三档）');
  } finally { await browser.close(); }
})();
