/* 首页自查：无边框页眉品牌块 + 卡片两种格式（照片版 / 简洁版）
 * + 右上角双箭头切换（横向滑动、不整页刷新）+ 问候行常驻 + 六宫格文案
 * 用法：先启动 serve.cjs，再 node verify-home-cards.cjs
 * 输出：verification/home-photo.png、home-classic.png、home-swap-mid.png、home-375-{photo,classic}.png */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/13403/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert');
const fs = require('node:fs');
const url = process.env.REVIEW_URL || 'http://127.0.0.1:4186/?view=home';

const read = () => {
  const q = s => document.querySelector(s);
  const panel = q('.phone').getBoundingClientRect();
  const mark = q('.phone .app-header .brand>b');
  const brandEl = q('.phone .app-header .brand');
  const brandCs = getComputedStyle(brandEl);
  const brandBox = brandEl.getBoundingClientRect();
  const markBox = mark.getBoundingClientRect();
  const hero = q('.life-banner');
  const strong = hero.querySelector('.banner-copy strong');
  const caption = hero.querySelector('.banner-caption');
  const badge = hero.querySelector('.banner-copy em');
  const wrap = q('.banner-wrap');
  const swap = q('.banner-swap');
  const heroBox = hero.getBoundingClientRect();
  const swapBox = swap ? swap.getBoundingClientRect() : null;
  return {
    panel: [Math.round(panel.width), Math.round(panel.height)],
    brand: {
      markSize: getComputedStyle(mark).fontSize,
      markOffset: [Math.round(markBox.left - panel.left), Math.round(markBox.top - panel.top)],
      block: {
        size: [Math.round(brandBox.width), Math.round(brandBox.height)],
        offset: [Math.round(brandBox.left - panel.left), Math.round(brandBox.top - panel.top)],
        background: brandCs.backgroundColor,
        radius: brandCs.borderTopLeftRadius,
        shadow: brandCs.boxShadow,
        border: brandCs.borderTopWidth,
      },
    },
    hero: {
      classic: hero.classList.contains('style-classic'),
      height: Math.round(heroBox.height),
      strong: strong.textContent.trim(),
      strongColor: getComputedStyle(strong).color,
      captionShown: caption ? getComputedStyle(caption).display !== 'none' : false,
      badgeShown: badge ? getComputedStyle(badge).display !== 'none' : false,
    },
    swap: {
      // 卡片右上角入口：位置贴右上角、双箭头图标、44px 触控区
      exists: Boolean(swap),
      insideCard: Boolean(wrap && swap && wrap.contains(swap)),
      inset: swapBox ? [Math.round(heroBox.right - swapBox.right), Math.round(swapBox.top - heroBox.top)] : null,
      size: swapBox ? [Math.round(swapBox.width), Math.round(swapBox.height)] : null,
      arrows: swap ? ((swap.querySelector('path')?.getAttribute('d') || '').match(/M/g) || []).length : 0,
      label: swap ? swap.getAttribute('aria-label') : null,
      // 图标外面那层视觉小圆底：少了它图标会直接压在照片上，容易看不清
      chip: (() => {
        const el = swap?.querySelector('span');
        if (!el) return null;
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        return { size: [Math.round(r.width), Math.round(r.height)], background: cs.backgroundColor, radius: cs.borderTopLeftRadius };
      })(),
    },
    track: {
      exists: Boolean(q('.banner-track')),
      slides: q('.banner-track') ? q('.banner-track').querySelectorAll('.banner-slide').length : 0,
      style: wrap ? wrap.dataset.style : null,
      swapping: Boolean(q('.banner-track')?.dataset.swapping),
    },
    // 整页有没有被重绘：测试前打上的探针还在不在
    probe: {
      greeting: Boolean(q('.home-toolbar .hello-line[data-probe="1"]')),
      modules: Boolean(q('.modules[data-probe="1"]')),
      card: Boolean(q('.banner-slide[data-probe="1"]')),
    },
    toolbar: { greeting: Boolean(q('.home-toolbar .hello-line')) },
    modules: [...document.querySelectorAll('.module')].map(m => `${m.querySelector('strong').textContent}|${m.querySelector('small').textContent.trim()}`),
    style: homeStyle,
  };
};

const probe = () => {
  document.querySelector('.home-toolbar .hello-line')?.setAttribute('data-probe', '1');
  document.querySelector('.modules')?.setAttribute('data-probe', '1');
  document.querySelector('.banner-slide')?.setAttribute('data-probe', '1');
};

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const errors = [];
  try {
    fs.mkdirSync('verification', { recursive: true });
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1536, height: 703 } });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url);
    await page.locator('.modules').waitFor();
    await page.evaluate(() => { try { localStorage.removeItem('life-plus-one-review-home-style'); } catch {} });
    await page.reload();
    await page.locator('.modules').waitFor();

    // —— 品牌：无边框，直接坐在页面底色上 ——
    const photo = await page.evaluate(read);
    await page.locator('.phone').screenshot({ path: 'verification/home-photo.png' });
    assert.equal(photo.brand.markSize, '28px', `品牌字号应为 28px，实际 ${photo.brand.markSize}`);
    assert.equal(photo.brand.block.background, 'rgba(0, 0, 0, 0)', `页眉不应再画框（背景透明），实际 ${photo.brand.block.background}`);
    assert.equal(photo.brand.block.radius, '0px', `页眉不应再有圆角框，实际 ${photo.brand.block.radius}`);
    assert.equal(photo.brand.block.shadow, 'none', `页眉不应再有投影，实际 ${photo.brand.block.shadow}`);
    assert.equal(photo.brand.block.border, '0px', `页眉不应再有描边，实际 ${photo.brand.block.border}`);
    assert(photo.brand.block.offset[0] <= 24, `品牌应贴齐页面左留白，实际 ${photo.brand.block.offset[0]}`);
    assert(photo.brand.markOffset[0] <= 30 && photo.brand.markOffset[1] <= 30, `品牌文字应贴近面板左上角，实际 ${photo.brand.markOffset}`);

    // —— 问候行常驻 + 卡片右上角双箭头切换入口 ——
    assert(photo.toolbar.greeting, '问候行应常驻显示（不随卡片样式切换）');
    assert(photo.swap.exists && photo.swap.insideCard, '卡片右上角应有切换按钮');
    assert.equal(photo.swap.arrows, 2, `切换按钮应为双箭头图标，实际 ${photo.swap.arrows} 个箭头`);
    assert(photo.swap.inset[0] <= 14 && photo.swap.inset[1] <= 14, `切换按钮应贴在卡片右上角，实际距右上角 ${photo.swap.inset}`);
    assert(photo.swap.size[0] >= 43.5 && photo.swap.size[1] >= 43.5, `切换按钮触控区应 ≥44px，实际 ${photo.swap.size}`);
    assert(photo.swap.chip && photo.swap.chip.size[0] >= 28, `切换按钮图标下应有一层小圆底，实际 ${JSON.stringify(photo.swap.chip)}`);
    assert(photo.swap.chip.background !== 'rgba(0, 0, 0, 0)', `切换按钮小圆底应有底色，否则图标压在照片上看不清，实际 ${photo.swap.chip.background}`);
    assert(parseFloat(photo.swap.chip.radius) >= 14, `切换按钮小圆底应为圆形，实际 ${photo.swap.chip.radius}`);
    assert(photo.track.exists && photo.track.slides === 1, `静止时轨道里应只有 1 张卡，实际 ${photo.track.slides}`);
    assert.equal(photo.track.style, 'photo');
    assert.equal(photo.style, 'photo');
    assert(!photo.hero.classic && !photo.hero.captionShown && !photo.hero.badgeShown, '照片版不应显示落款与 +1 徽标');

    // 六宫格沿用 codex 的说明文案
    const expectModules = ['人生清单|3 件小小心愿', '去过的地方|3 座城市的故事', '第一次|2 次勇敢尝试', '美食|1 份味觉记忆', '电影|0 场光影之旅', '人生数字|关于我的小小宇宙'];
    assert.deepEqual(photo.modules, expectModules, `六宫格文案不符：${JSON.stringify(photo.modules)}`);

    // —— 切换：不整页刷新（探针存活）+ 结果正确（reduced motion 下即时切换） ——
    await page.evaluate(probe);
    await page.click('.banner-swap');
    await page.waitForTimeout(150);
    const classic = await page.evaluate(read);
    await page.locator('.phone').screenshot({ path: 'verification/home-classic.png' });
    assert(classic.hero.classic && classic.hero.captionShown && classic.hero.badgeShown, '简洁版应显示落款与 +1 徽标');
    assert.equal(classic.track.style, 'classic');
    assert.equal(classic.style, 'classic');
    assert.equal(classic.track.slides, 1, `切换结束后轨道里应只剩 1 张卡，实际 ${classic.track.slides}`);
    assert(classic.toolbar.greeting, '切换后问候行仍应常驻');
    assert(classic.probe.greeting && classic.probe.modules, '切换不应整页重绘：问候行/六宫格被替换了');
    assert.equal(classic.swap.label, '切换为照片版卡片', `切换后入口文案应更新，实际 ${classic.swap.label}`);
    assert.equal(classic.hero.strongColor, 'rgb(36, 108, 204)', `简洁版数字应为深蓝，实际 ${classic.hero.strongColor}`);
    assert.equal(classic.hero.height, photo.hero.height, `两种版本卡片高度应一致（滑轨统一高度）：${photo.hero.height} vs ${classic.hero.height}`);

    // —— 横向滑动：动画中轨道里应同时存在两张卡，且轨道发生横向位移 ——
    const animated = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1536, height: 703 } });
    const page2 = await animated.newPage();
    page2.on('pageerror', e => errors.push(e.message));
    await page2.goto(url);
    await page2.locator('.modules').waitFor();
    await page2.click('.banner-swap');
    await page2.waitForTimeout(140);
    const mid = await page2.evaluate(() => {
      const track = document.querySelector('.banner-track');
      const slides = [...track.querySelectorAll('.banner-slide')];
      return {
        slides: slides.length,
        transform: getComputedStyle(track).transform,
        kinds: slides.map(s => s.querySelector('.life-banner').classList.contains('style-classic') ? 'classic' : 'photo'),
        heights: slides.map(s => Math.round(s.querySelector('.life-banner').getBoundingClientRect().height)),
        overflow: getComputedStyle(document.querySelector('.banner-wrap')).overflow,
      };
    });
    await page2.locator('.phone').screenshot({ path: 'verification/home-swap-mid.png' });
    await page2.waitForTimeout(600);
    const afterAnim = await page2.evaluate(read);
    await animated.close();
    assert.equal(mid.slides, 2, `滑动过程中轨道里应有两张卡，实际 ${mid.slides}`);
    assert(mid.kinds.includes('photo') && mid.kinds.includes('classic'), `滑动中应同时出现新旧两张卡，实际 ${mid.kinds}`);
    assert(mid.transform !== 'none' && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(mid.transform), `轨道应产生横向位移，实际 ${mid.transform}`);
    assert.equal(mid.overflow, 'hidden', `卡片外层应裁切，否则滑动时会盖到别的模块，实际 ${mid.overflow}`);
    assert.equal(mid.heights[0], mid.heights[1], `两种版本身高应一致，否则收尾会跳一下：${mid.heights}`);
    assert.equal(afterAnim.track.slides, 1, `滑动结束后应清理掉旧卡，实际 ${afterAnim.track.slides}`);
    assert.equal(afterAnim.style, 'classic');
    assert.equal(afterAnim.hero.height, mid.heights[0], `滑动前后卡片高度应不变：${mid.heights[0]} → ${afterAnim.hero.height}`);

    // 刷新后保持选择
    await page.reload();
    await page.locator('.modules').waitFor();
    const after = await page.evaluate(read);
    assert.equal(after.style, 'classic', '刷新后应保持简洁版');
    assert(after.hero.classic, '刷新后卡片应为简洁版');

    // 375 手机视口两种格式
    await page.setViewportSize({ width: 375, height: 844 });
    for (const style of ['photo', 'classic']) {
      await page.evaluate(s => setHomeStyle(s), style);
      await page.locator('.modules').waitFor();
      await page.screenshot({ path: `verification/home-375-${style}.png`, fullPage: true });
    }
    const mobile = await page.evaluate(read);
    assert.equal(mobile.modules.length, 6);
    assert(mobile.swap.exists && mobile.swap.insideCard, '手机视口下切换按钮应仍在卡片右上角');

    if (errors.length) throw new Error(`script errors: ${errors.join(' | ')}`);
    console.log('照片版  ', JSON.stringify(photo.hero), JSON.stringify(photo.brand.block), JSON.stringify(photo.swap));
    console.log('简洁版  ', JSON.stringify(classic.hero), JSON.stringify(classic.track));
    console.log('滑动中  ', JSON.stringify(mid));
    console.log('六宫格  ', photo.modules.join(' / '));
    console.log('PASS 首页卡片自查通过（无边框页眉 + 双箭头切换 + 横向滑动）');
  } finally { await browser.close(); }
})();
