const {chromium}=require('C:/Users/13403/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 fs.mkdirSync(path.join(__dirname,'verification'),{recursive:true});
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const ctx=await browser.newContext({viewport:{width:1440,height:1000}});
 const p=await ctx.newPage(); const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:4173';
 await p.goto(url);await p.locator('.enter-button').waitFor();await p.waitForTimeout(1200);
 await p.screenshot({path:path.join(__dirname,'verification/cover-desktop.png')});
 await p.locator('.enter-button').click();await p.waitForTimeout(700);
 await p.screenshot({path:path.join(__dirname,'verification/home-desktop.png')});
 for(const width of [320,375,390,460]){
  await p.setViewportSize({width,height:844});await p.goto(url);await p.waitForTimeout(1000);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`cover overflow at ${width}`);
  if(width===390)await p.screenshot({path:path.join(__dirname,'verification/cover-mobile.png'),fullPage:true});
  await p.locator('.enter-button').click();await p.waitForTimeout(500);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`home overflow at ${width}`);
  if(width===390)await p.screenshot({path:path.join(__dirname,'verification/home-mobile.png'),fullPage:true});
 }
 await p.setViewportSize({width:390,height:844});
 for(const name of ['wishes','places','first','food','movie','numbers']){
  await p.locator(`.modules [data-go="${name}"]`).click();assert.ok(await p.locator('.page-heading h1').textContent());await p.locator('.page-heading [data-go="home"]').click();
 }
 await p.locator('.nav-add').click();await p.waitForTimeout(600);await p.screenshot({path:path.join(__dirname,'verification/record-picker.png')});
 await p.locator('[data-type="movie"]').click();assert.equal(await p.locator('select[name=rating]').count(),1);await p.locator('[data-action=close]').click();
 await p.locator('.modules [data-go=wishes]').click();await p.locator('[data-complete=wish-snow]').click();
 await p.locator('[data-action=close]').click();assert.ok((await p.locator('.wish-row').first().textContent()).includes('想做'));
 await p.locator('[data-complete=wish-snow]').click();await p.locator('[name=city]').fill('函馆');await p.locator('[name=country]').fill('日本');await p.locator('[name=place]').fill('函馆山');await p.locator('[name=first]').check();await p.locator('[name=note]').fill('终于看到了雪。');await p.locator('#record-form button[type=submit]').click();
 assert.equal(await p.locator('.banner-copy strong').textContent(),'5');
 await p.locator('.modules [data-go=wishes]').click();assert.ok((await p.locator('.wish-row').first().textContent()).includes('已完成'));
 await p.reload();await p.locator('.enter-button').click();assert.equal(await p.locator('.banner-copy strong').textContent(),'5');
 await p.locator('.modules [data-go=first]').click();assert.ok((await p.locator('.record-list').allTextContents()).join(' ').includes('去北海道看雪'));
 await p.locator('.page-heading [data-go=home]').click();await p.locator('.nav-add').click();await p.locator('[data-type=moment]').click();
 await p.locator('[name=title]').fill('<img src=x onerror=alert(1)>');await p.locator('#record-form button[type=submit]').click();
 assert.equal(await p.locator('.record-copy img').count(),0);
 await p.locator('.app-header [data-go=search]').click();await p.locator('#search').fill('北海道');assert.equal(await p.locator('#results .record').count(),2);
 await p.locator('#results .record').filter({hasText:'去北海道看雪'}).click();await p.locator('[data-delete]').click();await p.locator('[data-confirm-delete]').click();
 await p.locator('.page-heading [data-go=home]').click();await p.locator('.modules [data-go=wishes]').click();assert.ok((await p.locator('.wish-row').first().textContent()).includes('想做'));
 await p.emulateMedia({reducedMotion:'reduce'});await p.goto(url);assert.equal(await p.locator('.landscape').evaluate(el=>getComputedStyle(el).animationName),'none');
 assert.deepEqual(errors,[]);
 console.log('PASS: desktop/mobile layouts, six module routes, picker, conditional fields, wish cancellation/save/delete linkage, local persistence, first-time aggregation, search, HTML escaping, reduced motion, zero browser errors.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

