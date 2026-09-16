const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'C:/Users/13403/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const url=process.env.REVIEW_URL || 'http://127.0.0.1:4186/?view=home';
const key='life-plus-one-review-experience-v1';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 try{
 const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('life-plus-one-v2','PROD-SENTINEL');});
 await page.goto(url);await page.locator('.modules').waitFor();
 let checks=0;
 for(const width of [360,375,390,414,430,768,1440]){
  await page.setViewportSize({width,height:844});
  for(const route of ['home','places','first','food','movie','wishes','numbers','timeline','mine','favorites','search']){
   await page.evaluate(route=>go(route),route);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${route} overflows ${width}`);
   const tooSmall=await page.locator('button').evaluateAll(els=>els.filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&(r.width<43.5||r.height<43.5);}).map(el=>el.textContent));
   assert.deepEqual(tooSmall,[],`${route} small controls ${width}`);checks++;
  }
 }
 await page.setViewportSize({width:375,height:844});await page.evaluate(()=>go('home'));
 await page.locator('[data-detail]').first().click();await page.locator('[data-ex="edit-record"]').click();
 await page.locator('[name="title"]').fill('长标题'.repeat(25));await page.locator('[name="city"]').fill('很长的城市名称'.repeat(10));
 await page.keyboard.press('Escape');await page.locator('#discard-confirm').waitFor();await page.locator('[data-ex="keep"]').click();
 await page.evaluate(()=>{window.savedSet=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('quota');};});
 await page.locator('#experience-record [type="submit"]').click();await page.locator('#experience-error').filter({hasText:'未能保存'}).waitFor();
 assert.equal(await page.locator('[name="title"]').inputValue(),'长标题'.repeat(25));
 await page.evaluate(()=>{Storage.prototype.setItem=window.savedSet;});await page.locator('#experience-record [type="submit"]').click();await page.locator('#overlay').waitFor({state:'detached'});
 assert.equal(await page.evaluate(()=>state.records.length),4);assert.equal(await page.evaluate(()=>localStorage.getItem('life-plus-one-v2')),'PROD-SENTINEL');
 await page.reload();await page.locator('.modules').waitFor();assert.equal(await page.evaluate(()=>state.records[0].title),'长标题'.repeat(25));
 await page.evaluate(()=>go('wishes'));await page.locator('[data-action="wish"]').click();await page.locator('[name="title"]').fill('测试心愿');await page.locator('#experience-wish [type="submit"]').click();
 const wish=page.locator('.wish-row').filter({hasText:'测试心愿'});await wish.locator('[data-ex="edit-wish"]').click();await page.locator('[name="title"]').fill('编辑后的心愿');await page.locator('#experience-wish [type="submit"]').click();
 await page.locator('.wish-row').filter({hasText:'编辑后的心愿'}).locator('[data-complete]').click();await page.locator('[name="city"]').fill('杭州');await page.locator('#experience-record [type="submit"]').click();await page.locator('.detail-body').waitFor();
 assert(await page.evaluate(()=>state.wishes.find(w=>w.title==='编辑后的心愿').completedAt));
 await page.locator('[data-delete]').click();await page.locator('[data-ex="delete-record"]').click();
 assert.equal(await page.evaluate(()=>state.wishes.find(w=>w.title==='编辑后的心愿').state),'想做');
 await page.evaluate(()=>go('wishes'));await page.locator('.wish-row').filter({hasText:'编辑后的心愿'}).locator('[data-ex="delete-wish"]').click();await page.locator('[data-ex="confirm-wish"]').click();
 assert(!await page.evaluate(()=>state.wishes.some(w=>w.title==='编辑后的心愿')));
 // Test real decoded image uploads, removal, multi-image persistence and preview.
 await page.locator('.nav-add').click();await page.locator('[data-type="moment"]').click();await page.locator('[name="title"]').fill('三张照片');
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lXcAAAAASUVORK5CYII=','base64');
 await page.locator('#experience-photo').setInputFiles([{name:'a.png',mimeType:'image/png',buffer:png},{name:'b.png',mimeType:'image/png',buffer:png},{name:'c.png',mimeType:'image/png',buffer:png}]);
 await page.locator('#media-status').filter({hasText:'已收好 3 张'}).waitFor();await page.locator('#experience-record [type="submit"]').click();await page.locator('.detail-gallery').waitFor();assert.equal(await page.locator('.detail-gallery button').count(),3);
 await page.locator('.detail-gallery button').first().click();await page.locator('.lightbox').waitFor();await page.keyboard.press('Escape');
 await page.locator('[data-ex="edit-record"]').click();await page.locator('[data-ex="remove-media"]').first().click();await page.locator('#experience-record [type="submit"]').click();await page.locator('#overlay').waitFor({state:'detached'});assert.equal(await page.locator('.detail-gallery button').count(),2);
 fs.mkdirSync('verification/experience',{recursive:true});await page.screenshot({path:'verification/experience/detail-375.png',fullPage:true});
 await page.locator('[data-ex="edit-record"]').click();await page.locator('[data-ex="remove-media"]').first().click();await page.locator('#experience-record [type="submit"]').click();await page.locator('#overlay').waitFor({state:'detached'});assert.equal(await page.locator('.detail-gallery button').count(),1);
 await page.locator('[data-ex="edit-record"]').click();await page.locator('[data-ex="clear-media"]').click();await page.locator('#experience-record [type="submit"]').click();await page.locator('#overlay').waitFor({state:'detached'});assert.equal(await page.locator('.detail-gallery button').count(),0);
 await page.evaluate(()=>go('home'));await page.screenshot({path:'verification/experience/home-375.png',fullPage:true});
 await page.evaluate(()=>openForm('moment'));await page.screenshot({path:'verification/experience/editor-375.png'});await page.keyboard.press('Escape');
 // Empty states, legacy fields and invalid storage must never overwrite saved data.
 await page.evaluate(key=>{localStorage.setItem(key,JSON.stringify({records:[],wishes:[],birthday:''}));},key);await page.reload();
 for(const route of ['home','places','first','food','movie','wishes','timeline','favorites']){await page.evaluate(route=>go(route),route);assert((await page.locator('.page-content').innerText()).length>20);}
 await page.evaluate(key=>localStorage.setItem(key,JSON.stringify({records:[{id:'old',type:'moment',title:'旧记录',date:'2020-01-01',custom:{keep:true}}],wishes:[]})),key);await page.reload();await page.locator('[data-detail]').first().click();await page.locator('[data-ex="edit-record"]').click();await page.locator('#experience-record [type="submit"]').click();await page.locator('#overlay').waitFor({state:'detached'});assert(await page.evaluate(()=>state.records[0].custom.keep));
 // Editor and detail layout at every required width, including keyboard-height viewport.
 for(const width of [360,375,390,414,430]){
  await page.setViewportSize({width,height:600});await page.evaluate(()=>openForm('place'));
  await page.locator('[name="title"]').fill('很长的记录标题'.repeat(15));await page.locator('[name="place"]').fill('长地点'.repeat(30));
  assert(await page.locator('.sheet').evaluate(el=>el.scrollWidth<=el.clientWidth),`editor overflow ${width}`);
  await page.locator('#experience-record [type="submit"]').scrollIntoViewIfNeeded();
  const rect=await page.locator('#experience-record [type="submit"]').boundingBox();assert(rect.y>=32 && rect.y+rect.height<=600,`save unreachable ${width}`);
  await page.keyboard.press('Escape');await page.locator('[data-ex="discard"]').click();
 }
 await page.setViewportSize({width:375,height:844});await page.evaluate(()=>openForm('moment'));
 await page.locator('#experience-photo').setInputFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('invalid')});await page.locator('#media-status').filter({hasText:'无法打开'}).waitFor();
 await page.locator('[name="title"]').fill('图片失败后仍能保存文字');await page.locator('#experience-record [type="submit"]').click();await page.locator('#overlay').waitFor({state:'detached'});
 assert.equal(await page.locator('.detail-body h2').textContent(),'图片失败后仍能保存文字');
 await page.evaluate(key=>localStorage.setItem(key,'{corrupt'),key);await page.reload();assert.equal(await page.evaluate(()=>persist({...state,birthday:'2000-01-01'})),false);assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),'{corrupt');
 // Capture clean fixture screens after feedback settles; no personal browser profile is used.
 await page.evaluate(key=>localStorage.removeItem(key),key);await page.reload();await page.evaluate(()=>document.querySelector('.toast')?.remove());
 await page.screenshot({path:'verification/experience/home-375.png',fullPage:true});
 for(const route of ['places','first','wishes','numbers','food','movie','timeline','mine']){await page.evaluate(route=>go(route),route);await page.screenshot({path:`verification/experience/${route}-375.png`,fullPage:true});}
 await page.evaluate(()=>openForm('moment'));await page.screenshot({path:'verification/experience/editor-375.png'});await page.keyboard.press('Escape');
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>go('home'));await page.screenshot({path:'verification/experience/home-1440.png'});
 assert.deepEqual(errors,[]);console.log(`PASS ${checks} route/viewport checks + 5 short-viewport editor checks; CRUD; dirty guard; failure retry; media decode/error; wish links; legacy preservation; corrupt-storage write protection; Prod isolation; zero script errors.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
