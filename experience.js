/* Shared acceptance experience: records, media, wish relations and presentation registries.
 * life.js retains the established shell, seed data, icons and navigation.
 * Storage is fixed to the acceptance namespace, independent of URL parameters. */
const RecordTypes = Object.fromEntries(Object.entries(kinds).filter(([id])=>id!=='wish').map(([id,[title,hint]])=>[id,{id,title,hint,rated:['food','movie'].includes(id)}]));
const Media = {
 valid: source => typeof source==='string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(source),
 of: record => (Array.isArray(record.media)?record.media:record.photo?[{type:'image',src:record.photo}]:[]).filter(m=>m && m.type==='image' && Media.valid(m.src))
};
const Stats = [
 ['国家',()=>distinct('country'),'places','世界的一部分'],['城市',()=>distinct('city'),'places','走过的街巷'],
 ['地点',()=>distinct('place'),'places','留下回忆的地方'],['第一次',countFirst,'first','勇敢迈出的一步'],
 ['美食',()=>state.records.filter(r=>r.type==='food').length,'food','记得那一口满足'],
 ['电影',()=>state.records.filter(r=>r.type==='movie').length,'movie','属于我的观影记忆'],
 ['愿望完成',()=>state.wishes.filter(w=>w.state==='已完成').length,'wishes','向往变成故事'],
 ['照片',()=>state.records.reduce((n,r)=>n+Media.of(r).length,0),'timeline','亲手留下的画面'],
 ['同行的人',()=>distinct('companion'),'timeline','按填写名称去重'],
 ['今年记录',()=>state.records.filter(r=>String(r.date).startsWith(today().slice(0,4))).length,'timeline','这一年的小小积累']
];
let editor=null, yearFilter='', sortOrder='newest', cityFilter='', detailReturn='home';
const safeDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value)) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value ? value : '';
const formSnapshot = form => JSON.stringify([...new FormData(form)].filter(([,v])=>typeof v==='string'));
const editorDirty = () => !!editor && !!$('#'+editor.formId) && (editor.initial!==formSnapshot($('#'+editor.formId)) || editor.mediaInitial!==JSON.stringify(editor.media) || editor.scene!==editor.sceneInitial);
function requestClose(){
 if(editor?.saving){toast('正在保存，请稍候');return;}
 if(!editorDirty()){editor=null;closeModal();return;}
 if($('#discard-confirm'))return;
 const box=document.createElement('div');box.className='confirm-inline';box.id='discard-confirm';box.setAttribute('role','alert');
 box.innerHTML='<p>还有没保存的内容，要离开吗？</p><button class="pill" data-ex="keep">继续记录</button><button class="text-button danger" data-ex="discard">放弃修改</button>';
 $('.sheet').prepend(box);box.querySelector('button').focus();box.scrollIntoView({block:'nearest'});
}
const inputField = (name,label,value='',extra='') => `<label class="field">${label}<input name="${name}" value="${esc(value)}" ${extra}/></label>`;
function beginEditor(formId,media=[],scene=null){
 editor={formId,media:[...media],mediaInitial:JSON.stringify(media),scene,sceneInitial:scene,initial:formSnapshot($('#'+formId)),loading:false,saving:false,mediaRequest:0};
 $('#'+formId).addEventListener('input',()=>$('#discard-confirm')?.remove());
}
openForm = function(type,wishId='',recordId=''){
 if(type==='wish'&&!wishId)return wishForm();
 const existing=state.records.find(r=>r.id===recordId), wish=state.wishes.find(w=>w.id===wishId);
 const r=existing || {type,title:wish?.title || '',date:today(),first:type==='first',scene:wish?.scene ?? null};
 const selectedType=RecordTypes[r.type]?r.type:'moment';
 openModal(`<h2 class="form-title">${existing?'再看看，那一天':wish?'愿望完成，人生 +1':'收藏一个人生瞬间'}</h2>
 <p class="form-subtitle">${wish?'保存后会保留这段经历与原愿望的关系。':'写下发生过的事，也留一点位置给当时的心情。'}</p>
 <form id="experience-record" data-id="${esc(recordId)}" data-wish="${esc(existing?.wishId || wishId)}">
 ${inputField('title','给这段经历起个名字 *',r.title,'required maxlength="120" placeholder="例如：第一次一个人去看海"')}
 <label class="field">记录分类<select name="type">${Object.values(RecordTypes).map(t=>`<option value="${t.id}" ${selectedType===t.id?'selected':''}>${t.title}</option>`).join('')}</select></label>
 <div class="form-columns">${inputField('date','发生日期 *',safeDate(r.date),'type="date" required max="'+today()+'"')}${inputField('companion','和谁一起',r.companion,'maxlength="120" placeholder="自己 / 朋友 / 家人"')}</div>
 <div class="form-columns">${inputField('city','城市',r.city,'maxlength="120" list="known-cities" placeholder="选择或输入城市"')}${inputField('country','国家 / 地区',r.country,'maxlength="80"')}</div>
 <datalist id="known-cities">${[...new Set(state.records.map(item=>item.city).filter(Boolean))].map(city=>`<option value="${esc(city)}"></option>`).join('')}</datalist>
 ${inputField('place','具体地点',r.place,'maxlength="200" placeholder="街角的店、山顶，或一个熟悉的地方"')}
 <fieldset class="photo-picker"><legend>照片 · 最多 3 张</legend><div class="sample-photos">${[0,1,2,3].map(n=>`<button type="button" class="scene scene-${n} sample-photo" data-ex="scene" data-value="${n}" aria-label="选择示例照片 ${n+1}"></button>`).join('')}</div>
 <label class="photo-upload">从本机选择照片<input id="experience-photo" type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label="选择本机照片"/></label>
 <div class="editor-gallery" id="editor-gallery"></div><small id="media-status" role="status">每张最多 2MB；照片仅保存在此浏览器。</small><button type="button" class="text-button" data-ex="clear-media">移除全部配图</button></fieldset>
 <label class="field" id="rating-field" ${RecordTypes[selectedType].rated?'':'hidden'}>我的评分<select name="rating"><option value="">暂不评分</option>${[5,4,3,2,1].map(n=>`<option value="${n}" ${Number(r.rating)===n?'selected':''}>${n} 分</option>`).join('')}</select></label>
 <label class="toggle-row"><span>这是我的第一次<small>也收进「1000 个第一次」</small></span><input type="checkbox" name="first" ${r.first?'checked':''}/></label>
 <label class="field">那天的感受<textarea name="note" maxlength="2000" aria-describedby="experience-count" placeholder="不必很精彩，也值得被记住。">${esc(r.note)}</textarea><small class="field-counter" id="experience-count">${String(r.note||'').length} / 2000</small></label>
 <details><summary>更多信息</summary>${inputField('tags','标签，用逗号分隔',Array.isArray(r.tags)?r.tags.join(', '):'','maxlength="240"')}</details>
 <p id="experience-error" class="form-error" role="alert"></p><button class="primary full" type="submit">${existing?'保存修改':'保存这一刻'}</button><p class="tiny-note">待验收数据 · 仅保存在本机</p></form>`,existing?'编辑人生记录':'新增人生记录');
 beginEditor('experience-record',Media.of(r),Number.isInteger(r.scene)?r.scene:null);renderEditorMedia();
};
wishForm = function(id=''){
 const wish=state.wishes.find(w=>w.id===id) || {};
 openModal(`<h2 class="form-title">${id?'给心愿添几笔':'把想做的事，先写下来。'}</h2><p class="form-subtitle">慢慢来，有向往就很好。</p><form id="experience-wish" data-id="${esc(id)}">
 ${inputField('title','我的愿望 *',wish.title,'required maxlength="120"')}
 <label class="field">分类<select name="category">${['想去','想吃','想看','想学','想体验','其他'].map(c=>`<option ${wish.category===c?'selected':''}>${c}</option>`).join('')}</select></label>
 ${inputField('targetDate','想在什么时候完成',wish.targetDate,'type="date"')}
 <p id="experience-error" class="form-error" role="alert"></p><button type="submit" class="primary full">${id?'保存心愿':'收好这个心愿'}</button></form>`,id?'编辑心愿':'新增心愿');beginEditor('experience-wish');
};
function renderEditorMedia(){
 if(!editor || !$('#editor-gallery'))return;
 $('#editor-gallery').innerHTML=editor.media.map((m,i)=>`<figure><img src="${m.src}" alt="所选照片 ${i+1}"/><button type="button" data-ex="remove-media" data-index="${i}">移除第 ${i+1} 张</button></figure>`).join('');
 document.querySelectorAll('[data-ex="scene"]').forEach(b=>{const selected=Number(b.dataset.value)===editor.scene;b.setAttribute('aria-pressed',String(selected));b.classList.toggle('picked',selected);});
}
async function readPhoto(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>2*1024*1024)throw Error('请选择每张 2MB 以内的 JPG、PNG 或 WebP 图片。');
 const src=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('照片读取失败，请重新选择。'));reader.readAsDataURL(file);});
 const image=new Image();image.src=src;try{await image.decode();}catch{throw Error('这张图片无法打开，请换一张图片。');}
 return {type:'image',src,alt:file.name};
}
document.addEventListener('change',async event=>{
 if(event.target.name==='type' && $('#experience-record'))$('#rating-field').hidden=!RecordTypes[event.target.value]?.rated;
 if(event.target.id!=='experience-photo')return;
 const current=editor, files=[...event.target.files];event.target.value='';if(!current||!files.length)return;
 if(current.media.length+files.length>3){$('#media-status').textContent='最多保留 3 张照片，请先移除一张。';return;}
 const request=++current.mediaRequest;current.loading=true;$('#media-status').textContent='正在读取照片…';
 try{const photos=await Promise.all(files.map(readPhoto));if(editor!==current||request!==current.mediaRequest)return;current.media.push(...photos);current.scene=null;renderEditorMedia();$('#media-status').textContent=`已收好 ${current.media.length} 张照片`;}
 catch(error){if(editor===current&&request===current.mediaRequest)$('#media-status').textContent=error.message;}
 finally{if(request===current.mediaRequest)current.loading=false;}
});
document.addEventListener('input',event=>{if(event.target.name==='note' && $('#experience-count'))$('#experience-count').textContent=event.target.value.length+' / 2000';});
document.addEventListener('submit',async event=>{
 const form=event.target;if(!['experience-record','experience-wish'].includes(form.id))return;
 event.preventDefault();event.stopImmediatePropagation();const current=editor;if(!current||current.saving)return;
 const error=$('#experience-error');if(current.loading){error.textContent='照片还在读取，请稍候。';return;}
 const f=new FormData(form), title=String(f.get('title')||'').trim();if(!title){error.textContent='给这段故事起个名字吧。';return;}
 current.saving=true;form.setAttribute('aria-busy','true');const button=form.querySelector('[type="submit"]'), text=button.textContent;button.disabled=true;button.textContent='正在保存…';
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 if(editor!==current || !form.isConnected)return;
 try{
  const now=new Date().toISOString();let next;
  if(form.id==='experience-record'){
   const date=safeDate(f.get('date')), type=f.get('type'), city=String(f.get('city')||'').trim();
   if(!date || date>today() || !RecordTypes[type] || (type==='place'&&!city)){error.textContent='请填写有效日期；足迹记录也需要填写城市。';return;}
   const previous=state.records.find(r=>r.id===form.dataset.id);
   const record={...previous,id:previous?.id || uid(),type,title,date,city,country:f.get('country').trim(),place:f.get('place').trim(),companion:f.get('companion').trim(),note:f.get('note').trim(),first:f.has('first')||type==='first',rating:RecordTypes[type].rated?Number(f.get('rating'))||null:null,tags:String(f.get('tags')||'').split(/[,，]/).map(t=>t.trim()).filter(Boolean),media:current.media,photo:current.media[0]?.src || null,scene:current.scene,wishId:previous?.wishId || form.dataset.wish || null,createdAt:previous?.createdAt || now,updatedAt:now};
   next={...state,records:previous?state.records.map(r=>r.id===record.id?record:r):[...state.records,record],wishes:state.wishes.map(w=>w.id===record.wishId?{...w,state:'已完成',completedAt:date,recordId:record.id,updatedAt:now}:w)};
   if(!persist(next)){error.textContent='未能保存，输入仍在。请检查存储空间后重试。';return;}
   editor=null;detailId=record.id;detailReturn=previous?detailReturn:'home';go('detail');toast(previous?'修改已保存':'已收藏这个瞬间，人生 +1！');
  }else{
   const previous=state.wishes.find(w=>w.id===form.dataset.id),wish={...previous,id:previous?.id || uid(),title,category:f.get('category'),targetDate:f.get('targetDate')||'',state:previous?.state || '想做',tags:previous?.tags || [],private:previous?.private ?? true,updatedAt:now};
   next={...state,wishes:previous?state.wishes.map(w=>w.id===wish.id?wish:w):[...state.wishes,wish]};
   if(!persist(next)){error.textContent='未能保存，输入仍在，请稍后重试。';return;}editor=null;go('wishes');toast('心愿已经收好');
  }
 }finally{current.saving=false;if(form.isConnected){button.disabled=false;button.textContent=text;form.removeAttribute('aria-busy');}}
},true);

function confirmAction(title,description,action,id){editor=null;openModal(`<h2 class="form-title">${title}</h2><p class="form-subtitle">${description}</p><button class="primary full" data-ex="${action}" data-id="${esc(id)}">确认删除</button><button class="text-button full" data-action="close">保留</button>`,'确认删除');}
document.addEventListener('click',event=>{
 const button=event.target.closest('button'),d=button?.dataset || {};
 const handled=()=>{event.preventDefault();event.stopImmediatePropagation();};
 if(d.action==='close'||event.target.id==='overlay'){handled();requestClose();return;}
 if(d.detail)detailReturn=page==='detail'?detailReturn:page;
 if(d.complete){handled();const wish=state.wishes.find(w=>w.id===d.complete);const type=({'想吃':'food','想看':'movie','想去':'place'})[wish?.category]||'moment';openForm(type,d.complete);return;}
 if(d.city){handled();cityFilter=d.city;query='';filter='all';yearFilter='';go('search');return;}
 if(d.go==='timeline'){cityFilter='';}
 if(page==='detail'&&d.go==='home'){handled();go(detailReturn==='detail'?'home':detailReturn);return;}
 if(d.delete){handled();confirmAction('删除这个人生瞬间？','时间轴和数字会一起更新。关联愿望将恢复为想做。','delete-record',d.delete);return;}
 if(d.ex){handled();
  if(d.ex==='edit-record'){const r=state.records.find(r=>r.id===d.id);if(r)openForm(r.type,r.wishId,r.id);}
  if(d.ex==='edit-wish')wishForm(d.id);
  if(d.ex==='delete-wish')confirmAction('删除这个心愿？','已经完成的人生记录会保留，并保留原心愿的名称。','confirm-wish',d.id);
  if(d.ex==='confirm-wish'){
   const w=state.wishes.find(w=>w.id===d.id);if(!w)return;
   if(persist({...state,wishes:state.wishes.filter(w=>w.id!==d.id),records:state.records.map(r=>r.wishId===d.id?{...r,wishSnapshot:{id:w.id,title:w.title},updatedAt:new Date().toISOString()}:r)})){go('wishes');toast('心愿已删除，人生记录仍然保留');}
  }
  if(d.ex==='delete-record'){
   const r=state.records.find(r=>r.id===d.id);if(!r)return;const remaining=state.records.filter(r=>r.id!==d.id);
   const related=remaining.find(item=>item.wishId===r.wishId);
   if(persist({...state,records:remaining,wishes:state.wishes.map(w=>w.id===r.wishId?{...w,state:related?'已完成':'想做',completedAt:related?.date || null,recordId:related?.id || null}:w)})){go('timeline');toast('记录已删除');}
  }
  if(d.ex==='scene'&&editor){editor.mediaRequest++;editor.loading=false;editor.scene=Number(d.value);editor.media=[];renderEditorMedia();$('#media-status').textContent='已选择示例配图';}
  if(d.ex==='remove-media'&&editor){editor.mediaRequest++;editor.loading=false;editor.media.splice(Number(d.index),1);renderEditorMedia();}
  if(d.ex==='clear-media'&&editor){editor.mediaRequest++;editor.loading=false;editor.media=[];editor.scene=null;renderEditorMedia();$('#media-status').textContent='照片已移除';}
  if(d.ex==='discard'){editor=null;closeModal();}
  if(d.ex==='keep'){$('#discard-confirm')?.remove();$('#'+editor?.formId)?.querySelector('input')?.focus();}
  if(d.ex==='preview'){const r=state.records.find(r=>r.id===d.id),m=r&&Media.of(r)[Number(d.index)];if(m)openModal(`<img class="lightbox" src="${m.src}" alt="${esc(r.title)}"/>`,'照片预览');}
  if(d.ex==='clear-city'){cityFilter='';render();}
  if(d.ex==='raw-backup'){try{const raw=localStorage.getItem(STORAGE_KEY);const link=document.createElement('a');const url=URL.createObjectURL(new Blob([raw||''],{type:'text/plain'}));link.href=url;link.download='life-plus-one-review-recovery.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{toast('浏览器暂不允许读取存储，请检查设置。');}}
 }
},true);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('#overlay')){event.preventDefault();event.stopImmediatePropagation();requestClose();}},true);
window.addEventListener('beforeunload',event=>{if(editorDirty()){event.preventDefault();event.returnValue='';}});

// Presentation hooks share the same record and media model across every category.
recordList = function(items){
 if(!items.length){const message=({places:'下一站，会在哪里？',first:'第一次，总要从某一天开始。',food:'下一顿好吃的，值得记住。',movie:'下一场电影，留一句自己的感受。',search:'还没找到这段回忆',favorites:'把想再看一眼的瞬间，收藏起来。'})[page] || '这一页，等一个新的故事';return `<div class="empty">${icon('moment')}<h3>${message}</h3><p>${page==='search'?'试试别的关键词，或调整筛选。':'小小的经历，也值得被记住。'}</p><button class="text-button" data-action="types">记录一个瞬间 ${icon('plus')}</button></div>`;}
 return `<div class="record-list">${items.map(r=>`<button class="record" data-kind="${esc(r.type)}" data-detail="${esc(r.id)}">${picture(r)}<div class="record-copy"><h3>${esc(r.title)}</h3><p>${shortDate(r.date)}${r.city?' · '+esc(r.city):''}</p>${r.rating?`<p aria-label="${Number(r.rating)}分">${'★'.repeat(Math.min(5,Math.max(0,Number(r.rating)||0)))}</p>`:''}${r.note?`<small>${esc(r.note)}</small>`:''}</div>${icon('arrow','row-arrow')}</button>`).join('')}</div>`;
};
details = function(){
 const r=state.records.find(r=>r.id===detailId);if(!r)return heading('这条记录已不存在');
 const wish=state.wishes.find(w=>w.id===r.wishId) || r.wishSnapshot, media=Media.of(r);
 return `${heading('一个人生瞬间')}${media.length?`<div class="detail-gallery">${media.map((m,i)=>`<button data-ex="preview" data-id="${esc(r.id)}" data-index="${i}" aria-label="预览第 ${i+1} 张照片"><img src="${m.src}" alt="${esc(r.title)} · 照片 ${i+1}" loading="lazy"/></button>`).join('')}</div>`:picture(r,'detail-photo')}<div class="detail-body"><span class="tag">${esc(labels[r.type]||'生活瞬间')}${r.first?' · 第一次':''}</span><h2>${esc(r.title)}</h2><p class="detail-meta">${shortDate(r.date)} · ${esc([r.city,r.place].filter(Boolean).join(' · ')||'地点未填写')}</p>${r.companion?`<p class="detail-meta">和 ${esc(r.companion)} 一起</p>`:''}${r.rating?`<p class="rating-display" aria-label="评分">${Math.min(5,Math.max(0,Number(r.rating)||0))} / 5</p>`:''}<p class="detail-note">${esc(r.note||'那天的感受，留待下次慢慢补上。')}</p>${wish?`<p class="detail-meta">来自心愿：${esc(wish.title)}</p>`:''}${(Array.isArray(r.tags)?r.tags:[]).map(tag=>`<span class="tag">${esc(tag)}</span>`).join(' ')}<div class="detail-actions"><button class="pill" data-ex="edit-record" data-id="${esc(r.id)}">编辑记录</button><button class="pill" data-favorite="${esc(r.id)}">${icon('heart')} ${r.favorite?'已收藏':'收藏'}</button><button class="text-button danger" data-delete="${esc(r.id)}">删除记录</button></div></div>`;
};
wishesPage = function(){
 const items=state.wishes.filter(w=>wishFilter==='全部'||w.category===wishFilter),done=state.wishes.filter(w=>w.state==='已完成').length;
 return `${heading('人生清单','把想做的事，先写下来。')}<div class="wish-banner"><span>慢慢来，向往的生活正在发生。</span><strong>${done}<small> / ${state.wishes.length} 个愿望已实现</small></strong><progress max="${state.wishes.length||1}" value="${done}"></progress></div><div class="chips">${['全部','想去','想吃','想看','想学','想体验','其他'].map(c=>`<button class="chip ${wishFilter===c?'selected':''}" data-wish-filter="${c}">${c}</button>`).join('')}</div><div class="wish-list">${items.map(w=>{const related=state.records.find(r=>r.wishId===w.id);return `<article class="wish-row">${picture(w)}<div><h3>${esc(w.title)}</h3><small>${esc(w.category)} · ${esc(w.state)}${w.completedAt?' · '+shortDate(w.completedAt):''}</small></div><div class="wish-tools"><button class="text-button" data-ex="edit-wish" data-id="${esc(w.id)}">编辑</button><button class="text-button danger" data-ex="delete-wish" data-id="${esc(w.id)}">删除</button>${related?`<button class="pill" data-detail="${esc(related.id)}">查看记录</button>`:`<button class="pill" data-complete="${esc(w.id)}">完成并记录</button>`}</div></article>`;}).join('')||'<div class="empty"><h3>把想做的事，先写下来。</h3><p>不着急完成，有向往就很好。</p></div>'}</div><button class="primary full" data-action="wish">${icon('plus')} 添加心愿</button>`;
};
numbersPage = function(){return `${heading('人生数字博物馆','数字不是目标，是认真生活的痕迹。')}<button class="number-hero" data-go="timeline"><span>我的人生，持续 +1 中</span><strong>${state.records.length}<small>个瞬间</small></strong><p>有些事很小，记下来就很重要。</p></button><div class="stats number-grid">${Stats.map(([label,calculate,route,hint])=>`<button data-go="${route}"><b>${calculate()}</b><span>${label}</span><small>${hint}</small></button>`).join('')}</div><button class="revisit" data-action="birthday">${icon('sun')}<span>${state.birthday?'更新出生日期':'看看我已经生活了多少天'}</span></button>`;};
const basePlaces=placesPage;
placesPage=function(){return basePlaces()+sectionHead('最近去过')+recordList(sorted().filter(r=>r.city||r.place).slice(0,5));};
const baseTimeline=timelinePage;
timelinePage=function(search=false){const content=baseTimeline(search),years=[...new Set(state.records.map(r=>String(r.date||'').slice(0,4)).filter(Boolean))].sort().reverse();return content.replace('<div id="results">',`${cityFilter?`<button class="chip selected" data-ex="clear-city">${esc(cityFilter)} · 清除城市筛选</button>`:''}<div class="filter-row"><label>年份<select id="year-filter"><option value="">所有年份</option>${years.map(y=>`<option ${yearFilter===y?'selected':''}>${esc(y)}</option>`).join('')}</select></label><label>排序<select id="sort-order"><option value="newest" ${sortOrder==='newest'?'selected':''}>从近到远</option><option value="oldest" ${sortOrder==='oldest'?'selected':''}>从远到近</option></select></label></div><div id="results">`);};
results=function(){let items=sorted().filter(r=>(filter==='all'||(filter==='first'?r.first:r.type===filter))&&(!yearFilter||String(r.date).startsWith(yearFilter))&&(!cityFilter||r.city===cityFilter)&&[r.title,r.note,r.city,r.place,r.companion,...(Array.isArray(r.tags)?r.tags:[])].join(' ').toLowerCase().includes(query.toLowerCase()));if(sortOrder==='oldest')items.reverse();return groupedRecords(items);};
document.addEventListener('change',event=>{if(event.target.id==='year-filter'){yearFilter=event.target.value;$('#results').innerHTML=results();}if(event.target.id==='sort-order'){sortOrder=event.target.value;$('#results').innerHTML=results();}});
const baseRender=render;
render=function(){baseRender();if(storageIssue){const panel=document.createElement('section');panel.className='review-error';panel.setAttribute('role','alert');panel.innerHTML='<strong>验收数据暂时无法读取</strong><p>原始内容未改动，当前展示示例。保存已暂停，请先备份再检查浏览器存储。</p><button class="text-button" data-ex="raw-backup">导出原始数据</button>';($('.page-content')||app).prepend(panel);}document.querySelectorAll('.photo img').forEach(img=>img.loading='lazy');};
render();
