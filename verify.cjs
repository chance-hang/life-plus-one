/* 端到端自查（codex 原版 verify.cjs 的重排版）
 *
 * 为什么重写：原脚本写在「记录表单 id = record-form」的年代，还假设「保存后直接回首页」。
 * 现在表单由 experience.js 渲染（#experience-record），且保存后会停在这条记录的详情页 —— 这两处
 * 变化让原脚本永远卡在第 31 行。行为差异是产品演进的结果，脚本应该跟着走，而不是把产品改回去。
 *
 * 跑法：node verify.cjs                     # 默认打 4186（本项目本地服务）
 *       REVIEW_URL=http://127.0.0.1:4173 node verify.cjs
 *
 * 与其它自查脚本的分工：
 *   verify-home-cards.cjs  首页 hero 两版的几何 / 字体 / 边缘距离
 *   verify-header.cjs      页眉收缩行为      verify-experience.cjs  表单字段与联动
 *   verify-desktop-shell.cjs 桌面外壳
 *   verify.cjs（本文件）   端到端流程：路由 → 记录 → 心愿 → 持久化 → 搜索 → 转义 → 降级
 */
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/13403/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const shot=dir=>name=>path.join(dir,name);

(async()=>{
 const dir=path.join(__dirname,'verification'); fs.mkdirSync(dir,{recursive:true});
 const png=shot(dir);
 const url=(process.env.REVIEW_URL||'http://127.0.0.1:4186').replace(/\/+$/,'');
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
 const p=await ctx.newPage();
 const errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 p.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 // 详情页/表单之间有自绘蒙层的进出动画，给它一点落地时间再断言，省得误判
 const settle=(ms=500)=>p.waitForTimeout(ms);

 // ---- 1. 封面 → 首页（桌面） ----
 await p.goto(url);
 await p.locator('.enter-button').waitFor();
 await settle(1200);
 await p.screenshot({path:png('cover-desktop.png')});
 await p.locator('.enter-button').click();
 await settle(700);
 await p.screenshot({path:png('home-desktop.png')});

 // ---- 2. 四个窄视口不横向溢出 ----
 for(const width of [320,375,390,460]){
  await p.setViewportSize({width,height:844});
  await p.goto(url);await settle(1000);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`封面在 ${width}px 下横向溢出`);
  if(width===390)await p.screenshot({path:png('cover-mobile.png'),fullPage:true});
  await p.locator('.enter-button').click();await settle(500);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`首页在 ${width}px 下横向溢出`);
  if(width===390)await p.screenshot({path:png('home-mobile.png'),fullPage:true});
 }

 // ---- 3. 首页六个入口都能进、都能回 ----
 await p.setViewportSize({width:390,height:844});
 await p.goto(url+'?view=home');await settle(500);
 for(const name of ['wishes','places','first','food','movie','numbers']){
  await p.locator(`.modules [data-go="${name}"]`).click();
  await p.locator('.page-title').waitFor();
  assert.ok(await p.locator('.page-title').textContent(),`入口 ${name} 没有页面标题`);
  await p.locator('.page-heading [data-go=home]').click();
  await p.locator('.modules').waitFor();
 }

 // ---- 4. 类型选择器 + 条件字段：只有「美食 / 电影」才问评分 ----
 await p.locator('.nav-add').click();
 await p.locator('.type-grid').waitFor();
 await settle(600);
 await p.screenshot({path:png('record-picker.png')});
 await p.locator('[data-type="movie"]').click();
 assert.equal(await p.locator('#experience-record select[name=rating]').count(),1,'电影属于要评分的类型，评分字段应显示');
 await p.locator('[data-action=close]').click();
 await settle();
 await p.locator('.nav-add').click();
 await p.locator('[data-type="first"]').click();
 assert.equal(await p.locator('#experience-record select[name=rating]:visible').count(),0,'第一次不评分，评分字段应隐藏');
 await p.locator('[data-action=close]').click();
 await settle();

 // ---- 5. 心愿 → 完成并记录 ----
 // 原脚本用的是 #record-form，现代表单由 experience.js 渲染为 #experience-record。
 await p.locator('.modules [data-go=wishes]').click();
 await p.locator('[data-complete=wish-snow]').click();
 await p.locator('#experience-record').waitFor();
 await p.locator('[name=city]').fill('函馆');
 await p.locator('[name=country]').fill('日本');
 await p.locator('[name=place]').fill('函馆山');
 await p.locator('[name=first]').check();
 await p.locator('[name=note]').fill('终于看到了雪。');
 await p.locator('#experience-record button[type=submit]').click();
 // 保存后停在这条记录的详情页（不是直接回首页），所以先看详情，再回首页数 banner
 await p.locator('.detail-body').waitFor();
 assert.ok((await p.locator('.detail-body h2').textContent()).includes('去北海道看雪'),'保存后应直接落在这条记录的详情页');
 await p.locator('.page-heading [data-go=home]').click();
 await p.locator('.banner-copy strong').waitFor();
 assert.equal(await p.locator('.banner-copy strong').textContent(),'5','心愿完成后记录数应为 5');
 await p.locator('.modules [data-go=wishes]').click();
 assert.ok((await p.locator('.wish-row').first().textContent()).includes('已完成'),'关联的愿望应标记为已完成');

 // ---- 6. 刷新后仍在（localStorage 持久化） ----
 // 注意：不能直接 reload —— URL 上还带着 ?view=home，会直接落回首页面看不到封面。
 // 走一遍「从封面进入」的完整路径，这才是用户真实的重开流程。
 await p.goto(url);
 await p.locator('.enter-button').waitFor();
 await p.locator('.enter-button').click();
 await p.locator('.banner-copy strong').waitFor();
 assert.equal(await p.locator('.banner-copy strong').textContent(),'5','刷新后记录数应保持 5');
 await p.locator('.modules [data-go=first]').click();
 assert.ok((await p.locator('.record-list').allTextContents()).join(' ').includes('去北海道看雪'),'这条勾了「第一次」，应出现在第一次合集里');

 // ---- 7. HTML 转义：标题里的尖括号只能当纯文本 ----
 await p.locator('.page-heading [data-go=home]').click();
 await p.locator('.modules').waitFor();
 await p.locator('.nav-add').click();
 await p.locator('[data-type=moment]').click();
 await p.locator('[name=title]').fill('<img src=x onerror=alert(1)>');
 await p.locator('#experience-record button[type=submit]').click();
 await p.locator('.detail-body').waitFor();
 await p.locator('.page-heading [data-go=home]').click();
 await p.locator('.record-copy').first().waitFor();
 assert.equal(await p.locator('.record-copy img').count(),0,'标题必须转义，不能真的生成 img 节点');
 assert.ok((await p.locator('.record-copy h3').first().textContent()).includes('<img src=x'),'标题里的尖括号应原样显示为文本');
 assert.deepEqual(errors,[],'整个流程不应出现 JS 报错');

 // ---- 8. 搜索：按地点/标题都能命中 ----
 await p.locator('.app-header [data-go=search]').click();
 await p.locator('#search').waitFor();
 await p.locator('#search').fill('北海道');
 assert.equal(await p.locator('#results .record').count(),2,'搜索「北海道」应命中 2 条');

 // ---- 9. 删记录，关联愿望要退回「想做」 ----
 await p.locator('#results .record').filter({hasText:'去北海道看雪'}).click();
 await p.locator('[data-delete]').click();
 // 确认框由 experience.js 的 confirmAction 渲染，按钮钩子是 data-ex="delete-record"。
 // （life.js 里那条 data-confirm-delete 的旧分支已经被 stopImmediatePropagation 挡住，走不到了。）
 await p.locator('.overlay [data-ex="delete-record"]').waitFor();
 await p.locator('.overlay [data-ex="delete-record"]').click();
 await settle();
 await p.locator('.page-heading [data-go=home]').click();
 await p.locator('.modules [data-go=wishes]').click();
 assert.ok((await p.locator('.wish-row').first().textContent()).includes('想做'),'记录删除后，关联愿望应退回想做');

 // ---- 10. 降低动效偏好：封面背景动画必须停 ----
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.goto(url);
 await p.locator('.landscape').waitFor();
 assert.equal(await p.locator('.landscape').evaluate(el=>getComputedStyle(el).animationName),'none','开启减少动效后封面动画应停止');

 assert.deepEqual(errors,[],`控制台/运行时报错应为空，实际：${JSON.stringify(errors)}`);
 console.log('PASS: 封面与首页布局（4 个窄视口无横向溢出）、六个首页入口、类型选择器与评分条件字段、心愿完成→记录→愿望状态联动、localStorage 持久化、第一次合集聚合、搜索命中、HTML 转义、删除回退、减少动效降级、零运行时报错。');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
