/* 首页自查：品牌体积/位置 + 卡片两种格式（照片版 / 简洁版）+ 切换持久化 + 六宫格文案
 * 用法：先启动 serve.cjs，再 node verify-home-cards.cjs
 * 输出：verification/home-photo.png、home-classic.png、home-375-photo.png、home-375-classic.png */
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/13403/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert');
const fs = require('node:fs');
const url = process.env.REVIEW_URL || 'http://127.0.0.1:4186/?view=home';

const read = () => {
  const q = s => document.querySelector(s);
  const panel = q('.phone').getBoundingClientRect();
  const mark = q('.phone .app-header .brand>b');
  const hero = q('.life-banner');
  const heroCs = getComputedStyle(hero);
  const strong = hero.querySelector('.banner-copy strong');
  const caption = hero.querySelector('.banner-caption');
  const badge = hero.querySelector('.banner-copy em');
  return {
    panel: [Math.round(panel.width), Math.round(panel.height)],
    brand: {
      markSize: getComputedStyle(mark).fontSize,
      markOffset: [Math.round(mark.getBoundingClientRect().left - panel.left), Math.round(mark.getBoundingClientRect().top - panel.top)],
      capsule: (() => {
        const el = q('.phone .app-header .brand'), r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        const m = mark.getBoundingClientRect();
        return {
          size: [Math.round(r.width), Math.round(r.height)],
          offset: [Math.round(r.left - panel.left), Math.round(r.top - panel.top)],
          inset: [Math.round(m.left - r.left), Math.round(m.top - r.top)],
          background: cs.backgroundColor,
          radius: parseFloat(cs.borderTopLeftRadius),
        };
      })(),
    },
    hero: {
      classic: hero.classList.contains('style-classic'),
      height: Math.round(hero.getBoundingClientRect().height),
      strong: strong.textContent.trim(),
      strongColor: getComputedStyle(strong).color,
      captionShown: caption ? getComputedStyle(caption).display !== 'none' : false,
      badgeShown: badge ? getComputedStyle(badge).display !== 'none' : false,
    },
    toolbar: {
      greeting: Boolean(q('.home-toolbar .hello-line')),
      active: q('.style-switch button.is-on')?.dataset.style || null,
    },
    modules: [...document.querySelectorAll('.module')].map(m => `${m.querySelector('strong').textContent}|${m.querySelector('small').textContent.trim()}`),
    style: homeStyle,
  };
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

    const photo = await page.evaluate(read);
    await page.locator('.phone').screenshot({ path: 'verification/home-photo.png' });

    // 品牌：比 codex 原值（+1 44px）更小，且收在一个与底色同色的圆角胶囊里
    const capsule = photo.brand.capsule;
    assert.equal(photo.brand.markSize, '28px', `品牌字号应为 28px，实际 ${photo.brand.markSize}`);
    assert.equal(capsule.background, 'rgb(238, 244, 253)', `品牌胶囊底色应等于页面底色，实际 ${capsule.background}`);
    assert(capsule.radius >= 20, `品牌胶囊应为圆角，实际 ${capsule.radius}px`);
    assert(capsule.offset[0] <= 28 && capsule.offset[1] <= 28, `品牌胶囊应贴近面板左上角，实际 ${capsule.offset}`);
    assert(photo.brand.markOffset[0] <= 40 && photo.brand.markOffset[1] <= 40, `品牌文字应贴在胶囊内，实际 ${photo.brand.markOffset}`);
    assert.equal(photo.style, 'photo');
    assert.equal(photo.toolbar.active, 'photo');
    assert(!photo.hero.classic && !photo.hero.captionShown && !photo.hero.badgeShown, '照片版不应显示落款与 +1 徽标');

    // 六宫格改为 codex 的说明文案
    const expectModules = ['人生清单|3 件小小心愿', '去过的地方|3 座城市的故事', '第一次|2 次勇敢尝试', '美食|1 份味觉记忆', '电影|0 场光影之旅', '人生数字|关于我的小小宇宙'];
    assert.deepEqual(photo.modules, expectModules, `六宫格文案不符：${JSON.stringify(photo.modules)}`);

    // 切到简洁版
    await page.click('.style-switch button[data-style="classic"]');
    await page.waitForTimeout(250);
    const classic = await page.evaluate(read);
    await page.locator('.phone').screenshot({ path: 'verification/home-classic.png' });
    assert(classic.hero.classic && classic.hero.captionShown && classic.hero.badgeShown, '简洁版应显示落款与 +1 徽标');
    assert(classic.toolbar.greeting, '简洁版应显示问候行');
    assert.equal(classic.hero.strongColor, 'rgb(36, 108, 204)', `简洁版数字应为深蓝，实际 ${classic.hero.strongColor}`);
    assert(classic.hero.height >= 160, `简洁版卡片高度异常：${classic.hero.height}`);

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

    if (errors.length) throw new Error(`script errors: ${errors.join(' | ')}`);
    console.log('照片版  ', JSON.stringify(photo.hero), JSON.stringify(photo.brand));
    console.log('简洁版  ', JSON.stringify(classic.hero), JSON.stringify(classic.toolbar));
    console.log('六宫格  ', photo.modules.join(' / '));
    console.log('PASS 首页卡片样式自查通过');
  } finally { await browser.close(); }
})();
