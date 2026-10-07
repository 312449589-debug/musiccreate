 'use strict';
const $ = s => document.querySelector(s), api = window.XianbanApi;
const e = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY = 'xianban-api-v1:' + api.base + ':' + (window.XIANBAN_CONFIG?.storageScope || 'default');
let local;
try { local = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { local = {}; }
const db = {profile: local.profile || null, goal: local.goal || null, works: []};
let pending = local.pending || null, draft = local.draft || null;
let page = 'home', current = null, selected = null, busy = false, saving = false, logging = false;
let prompt = local.form?.prompt ?? '想写一段关于城市夜晚和回家路上的温暖木吉他民谣。';
let tags = local.form?.tags || ['温暖','民谣','扫弦'], duration = local.form?.duration || 45;
let purpose = local.form?.purpose || '生成练习曲', minutes = 15, confirmed = false;
let guideAnswers = [], guideStep = 0, onboardingData = {};
let listLoading = false, listError = '', nextCursor = null, loaded = false;
let generationStatus = pending?.id ? '正在恢复任务…' : pending ? '上次提交未确认，请重试同一请求。' : '';
let generationError = '', generationProgress = null, pollRun = 0, lastStatus = '', retryAt = 0;
let practiceError = '', practiceReceipt = null, practiceAttempt = null, practiceSignature = '';
let practiceLastSaved = '', practiceLastTime = 0;
const audio = new Audio();
audio.preload = 'metadata';
let player = {playing: false, speed: 1, volume: .6, loop: false}, mediaId = null, mediaRefreshTried = false;
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify({profile: db.profile, goal: db.goal, pending, draft, form: {prompt,tags,duration,purpose}})); }
  catch { toast('浏览器无法保存任务状态；关闭页面前请记下任务编号。'); }
}
function uuid() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16)); b[6]=(b[6]&15)|64; b[8]=(b[8]&63)|128;
  const h=[...b].map(n=>n.toString(16).padStart(2,'0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
function toast(t) { $('#notice').innerHTML = `<div class="toast-mvp">${e(t)}</div>`; clearTimeout(toast.timer); toast.timer=setTimeout(()=>$('#notice').innerHTML='',5000); }
function message(error) { return error.message + (error.requestId ? `（请求编号：${error.requestId}）` : ''); }
function mediaUrl(value) {
  const u=new URL(value, location.href);
  if (!['https:','http:'].includes(u.protocol)) throw new api.ApiError('INVALID_RESPONSE');
  return u.href;
}
function normalize(resource, generationId) {
  if (!resource || typeof resource.title !== 'string' || resource.instrument !== 'guitar' || ![15,30,45,60].includes(resource.duration_seconds) || !resource.audio?.url) throw new api.ApiError('INVALID_RESPONSE');
  mediaUrl(resource.audio.url);
  if (!generationId && typeof resource.id !== 'string') throw new api.ApiError('INVALID_RESPONSE');
  return {...resource, id: resource.id ?? generationId, generation_id: resource.generation_id ?? generationId,
    saved: !generationId, duration: resource.duration_seconds, instrument: '木吉他', color:'night',
    source: generationId ? '未保存 Demo' : '我的作品'};
}
function activeWork() { return db.works.find(w=>w.id===selected) || (current?.saved ? current : null); }
function formLocked() { return busy || saving || !!pending; }
function navigate(p) { page=p; render(); window.scrollTo(0,0); if (p==='works' && !loaded && !listLoading) loadWorks(); }
const iconPaths={music:'<path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',home:'<path d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-6h6v6"/>',disc:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>',users:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2-7 6-7s6 3 6 7M16 5c3 1 3 5 0 6m1 3c3 .5 4 3 4 6"/>',chart:'<path d="M4 20V10m6 10V4m6 16v-7m5 7H2"/>',spark:'<path d="m12 2 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z"/>',play:'<path d="m8 5 11 7-11 7V5Z"/>',pause:'<path d="M8 5v14M16 5v14"/>',heart:'<path d="M21 7c-3-5-7-2-9 0-2-2-6-5-9 0-3 5 9 13 9 13S24 12 21 7Z"/>',bookmark:'<path d="M6 3h12v18l-6-4-6 4V3Z"/>',share:'<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5m-8 7 8 5"/>',prev:'<path d="M6 5v14M19 6l-9 6 9 6V6Z"/>',next:'<path d="M18 5v14M5 6l9 6-9 6V6Z"/>',check:'<path d="m4 12 5 5L20 6"/>',plus:'<path d="M12 5v14M5 12h14"/>',mic:'<rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0m-7 7v3"/>',volume:'<path d="M5 10v4h4l5 4V6L9 10H5ZM17 9c2 2 2 4 0 6"/>',trash:'<path d="M5 7h14M9 7V4h6v3m2 0-1 14H8L7 7"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>'};
const icon=(n,s=20)=>`<svg class="icon" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[n]||iconPaths.music}</svg>`;
const btn=(text,action,variant='primary',extra='')=>`<button class="btn btn-${variant}" data-action="${action}" ${extra}>${text}</button>`;
const cover=(color='green',small=false)=>`<div class="cover cover-${color} ${small?'cover-small':''}"><span class="cover-sun"></span><span class="cover-line one"></span><span class="cover-line two"></span>${icon('music',small?17:25)}</div>`;
const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const date=d=>new Date(d).toLocaleDateString('zh-CN',{month:'numeric',day:'numeric'});
function topbar(title,sub){return `<header class="topbar"><div><h1>${e(title)}</h1><p>${e(sub)}</p></div><button class="avatar" data-action="profile" aria-label="个人设置">${e((db.profile?.name||'小林').slice(0,1))}</button></header>`}
function renderOnboard(step){
 $('#app').innerHTML=`<main class="onboard"><section class="welcome-panel"><div class="brand light"><span class="brand-mark">${icon('music')}</span><b>弦伴</b></div><div class="welcome-copy"><span class="eyebrow light">音乐创作与练习伙伴</span><h1>从一个想法，<br>开始你的第一首歌。</h1><p>一个心情、一段旋律，<br>陪你把它写出来，也真正弹出来。</p></div><div class="welcome-note">${icon('spark')}<span>先做一个小作品<br><b>再慢慢完善属于你的音乐</b></span></div></section><section class="setup-panel"><form id="onboard-form" class="setup-wrap" data-step="${step}"><div class="progress-head"><span>个性化设置</span><b>${step} / 2</b></div><div class="progress"><i style="width:${step*50}%"></i></div><div class="form-title"><span class="eyebrow">${step===1?'先认识一下':'让推荐更合拍'}</span><h2>${step===1?'你的基本信息':'你弹什么、爱听什么？'}</h2><p>${step===1?'年龄和性别可跳过。资料仅保存在当前浏览器。':'告诉我们你的乐器、学习阶段和音乐喜好。'}</p></div>${step===1?`<label class="field-label" for="name">怎么称呼你</label><input class="text-input" id="name" name="name" maxlength="20" value="小林" required><label class="field-label" for="age">年龄 <em>选填</em></label><input class="text-input" id="age" name="age" type="number" min="1" max="120" placeholder="你的年龄"><label class="field-label" for="gender">性别 <em>选填</em></label><select class="text-input" id="gender" name="gender"><option>不愿透露</option><option>男</option><option>女</option></select>`:`<label class="field-label" for="instrument">我的乐器</label><select class="text-input" id="instrument" name="instrument">${['木吉他'].map(x=>`<option>${x}</option>`).join('')}</select><label class="field-label" for="level">学习阶段</label><select class="text-input" id="level" name="level">${['刚入门','掌握基础','独立演奏','进阶学习'].map(x=>`<option ${x==='掌握基础'?'selected':''}>${x}</option>`).join('')}</select><label class="field-label" for="taste">喜欢的音乐</label><input class="text-input" id="taste" name="taste" value="温暖、中文民谣" maxlength="120"><p class="global-tip">首版支持吉他 Demo；资料仅用于本机界面偏好。</p>`}<div class="form-actions"><button type="submit" class="btn btn-primary">${step===1?'下一步':'开始探索'} ${icon('arrow',17)}</button></div></form></section></main>`;
}
function modal(html){$('#modal-root').innerHTML=`<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true"><button class="modal-close" data-action="close" aria-label="关闭">✕</button>${html}</section></div>`;modal.previous=document.activeElement;setTimeout(()=>$('#modal-root input, #modal-root textarea, #modal-root button:not(.modal-close)')?.focus(),0)}
function closeModal(){$('#modal-root').innerHTML='';modal.previous?.focus()}
function guide(){const questions=[['你想表达什么心情或故事？',['下班很晚的城市夜晚','轻松温暖的一天','想念一个老朋友']],['你想要什么音乐风格？',['温暖的中文民谣','轻快流行','安静指弹']],['这次更想做什么？',['自由创作一小段','练习简单扫弦','练习和弦切换']]];const [q,opts]=questions[guideStep];modal(`<span class="eyebrow">灵感引导 · ${guideStep+1}/3</span><h2>${q}</h2><p>选择一个方向，随后仍可以修改。</p><div class="guide-options">${opts.map(x=>`<button data-guide-choice="${x}" class="${guideAnswers[guideStep]===x?'active':''}">${x}</button>`).join('')}</div><div class="modal-actions">${guideStep?btn('上一步','guide-back','secondary'):'<span></span>'}${btn(guideStep===2?'整理成创作想法':'下一题','guide-next','primary')}</div>`)}
function openProfile(){const p=db.profile;modal(`<span class="eyebrow">个人设置</span><h2>让音乐更适合你</h2><form id="profile-form"><label class="field-label" for="profile-name">称呼</label><input id="profile-name" name="name" value="${e(p.name)}" maxlength="20" required><label class="field-label" for="profile-instrument">乐器</label><select id="profile-instrument" name="instrument">${['木吉他'].map(x=>`<option ${x===p.instrument?'selected':''}>${x}</option>`).join('')}</select><label class="field-label" for="profile-level">学习阶段</label><select id="profile-level" name="level">${['刚入门','掌握基础','独立演奏','进阶学习'].map(x=>`<option ${x===p.level?'selected':''}>${x}</option>`).join('')}</select><label class="field-label" for="profile-taste">音乐喜好</label><input id="profile-taste" name="taste" maxlength="120" value="${e(p.taste)}"><div class="form-actions"><button type="submit" class="btn btn-primary">保存设置</button></div></form><p class="prototype-note">个人偏好保存在当前浏览器；作品以服务端为准。</p>`)}
function render() {
  if (!db.profile) { renderOnboard(1); return; }
  const nav=[['home','home','首页'],['works','disc','我的作品'],['community','users','社区'],['growth','chart','成长报告']];
  const goal=db.works.find(w=>w.id===db.goal);
  const active=p=>page===p||(p==='works'&&['detail','practice'].includes(page));
  $('#app').innerHTML=`<div class="app-shell"><aside class="sidebar"><div class="brand"><span class="brand-mark">${icon('music')}</span><b>弦伴</b><small>陪你写，也陪你弹</small></div><nav>${nav.map(([p,i,t])=>`<button data-nav="${p}" class="${active(p)?'active':''}">${icon(i)}<span>${t}</span></button>`).join('')}</nav><div class="side-goal"><span class="eyebrow">近期练习目标</span><b>${goal?e(goal.title):'从一小段音乐开始'}</b><p>先创作，再慢慢弹出来</p>${btn(goal?'继续练习':'创作第一首',goal?'practice-goal':'new','secondary')}</div><button class="profile" data-action="profile"><span>${e(db.profile.name.slice(0,1))}</span><div><b>${e(db.profile.name)}</b><small>木吉他 · ${e(db.profile.level)}</small></div></button></aside><div class="main-shell"><main class="content ${page==='home'?'home-page':''}">${({home,works,detail,practice,community:unavailable,growth:unavailable}[page]||home)()}</main></div><nav class="bottom-nav">${nav.map(([p,i,t])=>`<button data-nav="${p}" class="${active(p)?'active':''}">${icon(i)}<span>${t}</span></button>`).join('')}</nav></div>`;
  updatePlayerUI();
}
function home() {
  const lock=formLocked();
  return `${topbar(`你好，${db.profile.name}`,'今天，也从一小段音乐开始吧。')}<section class="creation-panel"><div class="creation-head"><div><span class="eyebrow">${icon('spark',14)} 音乐共创</span><h2>今天想创作或练习什么？</h2></div><span class="profile-pill">木吉他 · ${e(db.profile.level)}</span></div><textarea id="prompt" aria-label="创作提示词" maxlength="1200" ${lock?'disabled':''}>${e(prompt)}</textarea><div class="quick-row"><div class="chips scroll">${['温暖','轻快','民谣','流行','指弹','扫弦'].map(t=>`<button class="chip ${tags.includes(t)?'active':''}" data-tag="${t}" ${lock?'disabled':''}>${tags.includes(t)?'✓ ':''}${t}</button>`).join('')}</div></div><div class="creation-foot"><div class="creation-options"><div><small>时长</small><span class="inline-options">${[15,30,45,60].map(d=>`<button data-duration="${d}" class="${duration===d?'active':''}" ${lock?'disabled':''}>${d} 秒</button>`).join('')}</span></div><div><small>用途</small><span class="inline-options">${['寻找创作灵感','生成练习曲'].map(x=>`<button data-purpose="${x}" class="${purpose===x?'active':''}" ${lock?'disabled':''}>${x}</button>`).join('')}</span></div></div><div class="create-actions">${btn('没有想法？引导我开始','guide','secondary',lock?'disabled':'')}${btn(busy?'等待生成结果…':pending?'重试 / 继续查询':'生成我的 Demo','generate','primary',busy||saving?'disabled':'')}</div></div><p class="prototype-note">首版支持吉他短 Demo；生成结果不承诺提供歌词、和弦或谱面。</p>${generationStatus?`<p role="status">${e(generationStatus)}${Number.isInteger(generationProgress)?` · ${generationProgress}%`:''}</p>`:''}${generationError?`<p class="api-error" role="alert">${e(generationError)}</p>`:''}${pending?.id?`<p class="prototype-note">任务编号：${e(pending.id)}</p>`:''}</section>${current?`<section class="result-banner">${cover('night',true)}<div><span class="eyebrow">${current.saved?'已保存作品':'Demo 已生成 · 尚未保存'}</span><h3>${e(current.title)}</h3><p>${e(current.style)} · ${current.duration} 秒</p></div><div class="result-actions">${btn('试听','play')}${btn(saving?'保存中…':current.saved?'已保存':'保存 Demo','save','secondary',saving||current.saved?'disabled':'')}</div></section>`:''}<section class="listen-section"><div class="section-title"><div><span class="eyebrow">听点什么</span><h2>试听与我的作品</h2></div>${btn('查看全部','show-works','secondary')}</div><div class="music-layout">${playerHtml()}<section class="recommend-list"><div class="list-head"><h3>已保存的作品</h3><span>来自服务器</span></div>${db.works.slice(0,3).map(w=>`<button class="song-row" data-action="listen-work" data-id="${e(w.id)}">${cover('night',true)}<span class="song-copy"><b>${e(w.title)}</b><small>${e(w.style)} · 木吉他</small></span><span class="song-time">${fmt(w.duration)}</span>${icon('play')}</button>`).join('')}${!db.works.length?`<p class="global-tip">${listLoading?'正在加载作品…':listError?e(listError):'保存第一首 Demo 后，它会出现在这里。'}</p>`:''}${listError?btn('重新加载','reload-works','secondary'):''}</section></div></section>`;
}
function playerHtml() {
  const w=current;
  return `<section class="player-card"><div class="player-main">${cover('night')}<div class="track-info"><span class="source">${e(w?.source||'音乐试听')}</span><h2>${e(w?.title||'从一个想法开始')}</h2><p>${e(w?.style||'生成 Demo 后，在这里试听')}</p></div></div><div class="timeline"><span id="elapsed">00:00</span><input type="range" id="seek" class="player-range" min="0" max="${w?.duration||60}" step=".1" value="${audio.currentTime||0}" aria-label="播放进度" ${w?'':'disabled'}><span>${fmt(w?.duration||0)}</span></div><div class="controls"><span class="volume">${icon('volume',17)}<input id="volume" type="range" min="0" max="1" step=".05" value="${player.volume}" aria-label="音量"></span><div><button class="play" data-action="play" aria-label="播放或暂停" ${w?'':'disabled'}>${icon(player.playing?'pause':'play',24)}</button></div>${btn(w?.saved?'已保存':'保存 Demo','save','secondary',!w||w.saved||saving?'disabled':'')}</div></section>`;
}
function works() {
  return `${topbar('我的作品','作品从服务器读取，刷新后仍可再次试听。')}<div class="page-actions">${btn('刷新列表','reload-works','secondary',listLoading?'disabled':'')}${btn('创作新作品','new')}</div>${listError?`<p class="api-error" role="alert">${e(listError)}</p>`:''}${db.works.length?`<div class="work-grid">${db.works.map(w=>`<article class="work-card">${cover('night')}<div class="work-body"><span class="status demo">Demo</span><h2>${e(w.title)}</h2><p>木吉他 · ${fmt(w.duration)} · ${e(w.style)}</p><small>保存于 ${date(w.created_at)}</small><div class="work-actions">${btn('查看作品','open-work','primary',`data-id="${e(w.id)}"`)}${btn('试听','listen-work','secondary',`data-id="${e(w.id)}"`)}</div></div></article>`).join('')}</div>`:`<div class="empty-panel"><h2>${listLoading?'正在加载作品…':listError?'作品暂时无法加载':'你的第一首歌，从这里开始'}</h2></div>`}${nextCursor?btn(listLoading?'加载中…':'加载更多','more-works','secondary',listLoading?'disabled':''):''}`;
}
function detail() {
  const w=activeWork();
  if (!w) return empty('作品暂时不可用，请返回作品列表重试。');
  return `${topbar(w.title,'已保存的 Demo')}<div class="detail-layout"><aside class="detail-player">${cover('night')}<h2>${e(w.title)}</h2><p>木吉他 · ${fmt(w.duration)}</p>${btn('试听作品','listen-work','primary',`data-id="${e(w.id)}"`)}${btn('设为近期练习目标','set-goal','secondary',`data-id="${e(w.id)}"`)}</aside><section class="editor"><span class="eyebrow">创作想法</span><h2>${e(w.style)}</h2><p class="intro-lines">${e(w.prompt)}</p><p class="prototype-note">当前接口未提供和弦、谱面、歌词或版本编辑。请先跟随 Demo 寻找节奏与创作灵感。</p><small>作品编号：${e(w.id)}</small></section></div>`;
}
function practice() {
  const w=activeWork();
  if (!w) return empty('请先保存并选择一首作品。');
  return `${topbar(`练习《${w.title}》`,'跟随自己的 Demo，练习一小段。')}<div class="practice-layout"><section class="practice-main"><div class="practice-head">${cover('night',true)}<div><span class="eyebrow">近期练习目标</span><h2>木吉他 · ${fmt(w.duration)}</h2></div></div><div class="chord-sheet"><div class="sheet-top"><h3>练习试听</h3><div><select id="speed" class="range-select" aria-label="练习速度">${[.5,.75,1].map(x=>`<option value="${x}" ${player.speed===x?'selected':''}>${x}×</option>`).join('')}</select><button data-action="loop" aria-pressed="${player.loop}">${player.loop?'✓ ':''}循环</button></div></div><p class="intro-lines">${e(w.prompt)}</p><div class="practice-controls">${btn('试听 / 暂停','listen-work','primary',`data-id="${e(w.id)}"`)}</div><p class="prototype-note">此 Demo 尚未提供谱面或和弦，请按自己的能力选取片段练习。</p></div></section><aside class="practice-side"><h3>记录今天的练习</h3><p>只记录你真实完成的部分。</p><form id="practice-form"><label class="field-label" for="minutes">本次练习时长（分钟）</label><input class="text-input" id="minutes" name="minutes" type="number" min="1" max="1440" step="1" value="${minutes}" required ${logging?'disabled':''}><label class="field-label"><input id="completion" name="completion" type="checkbox" ${confirmed?'checked':''} ${logging?'disabled':''}> 我已亲自弹会目标段落</label><p class="honest-note">这是你的主动确认，不表示系统验证。</p><button type="submit" class="btn btn-primary" ${logging?'disabled':''}>${logging?'正在保存…':'保存本次练习'}</button></form>${practiceError?`<p class="api-error" role="alert">${e(practiceError)}</p>`:''}${practiceReceipt?.work_id===w.id?`<p role="status">已保存 ${practiceReceipt.duration_seconds/60} 分钟练习${practiceReceipt.completion_confirmed?' · 已确认弹会目标段落':''}</p>`:''}</aside></div>`;
}
function unavailable() { return `${topbar(page==='community'?'弦伴社区':'成长报告','后续版本再见。')}<div class="empty-panel"><h2>此功能尚未接入</h2><p>首版先支持生成、试听、保存作品和记录练习。</p>${btn('回到创作','new')}</div>`; }
function empty(text) { return `<div class="empty-panel"><h2>${e(text)}</h2>${btn('查看作品','show-works','secondary')}</div>`; }
async function loadWorks(append=false) {
  if (listLoading) return;
  listLoading=true; listError=''; render();
  try {
    const {data}=await api.listWorks(append?nextCursor:null);
    if (!Array.isArray(data?.items) || !(data.next_cursor===null || typeof data.next_cursor==='string')) throw new api.ApiError('INVALID_RESPONSE');
    const items=data.items.map(w=>normalize(w));
    const merged=append?[...db.works,...items]:items;
    db.works=[...new Map(merged.map(w=>[w.id,w])).values()]; nextCursor=data.next_cursor; loaded=true;
  } catch(error) { listError=message(error); }
  finally { listLoading=false; render(); }
}
async function readWork(id) {
  const {data}=await api.getWork(id), w=normalize(data);
  if(w.id!==id)throw new api.ApiError('INVALID_RESPONSE');
  const i=db.works.findIndex(x=>x.id===id);
  if(i>=0) db.works[i]=w; else db.works.unshift(w);
  if (current?.saved && current.id===id) current=w;
  return w;
}
const tagCodes={'温暖':'warm','轻快':'upbeat','民谣':'folk','流行':'pop','指弹':'fingerstyle','扫弦':'strumming'};
async function newDemo() {
  if(busy||saving) return;
  if(Date.now()<retryAt) {toast(`请等待 ${Math.ceil((retryAt-Date.now())/1000)} 秒再重试。`);return;}
  if(!pending) {
    prompt=($('#prompt')?.value??prompt).trim();
    if([...prompt].length<1||[...prompt].length>1200) {toast('请填写 1–1200 个字符的创作想法。');return;}
    pending={key:uuid(),id:null,body:{prompt,instrument:'guitar',duration_seconds:duration,purpose:purpose==='生成练习曲'?'practice':'inspiration',style_tags:tags.map(t=>tagCodes[t]||t).slice(0,10)},started:Date.now()};
    stopAudio(true); current=null; draft=null; persist();
  }
  busy=true; generationError=''; generationProgress=null; generationStatus=pending.id?'正在查询任务…':'正在提交创作想法…'; render();
  if(pending.id) { pollGeneration(); return; }
  try {
    const response=await api.createGeneration(pending.body,pending.key);
    if(typeof response.data?.id!=='string') throw new api.ApiError('INVALID_RESPONSE');
    pending.id=response.data.id; persist();
    if(acceptGeneration(response.data)) { pollGeneration(response.waitMs); }
  } catch(error) {
    busy=false; retryAt=Date.now()+(error.waitMs||0); generationError=message(error);
    generationStatus='提交未完成；重试会复用同一请求标识。';
    // Definite rejected requests can be edited; uncertain submissions retain key/body.
    if([400,413].includes(error.status)) { pending=null; generationStatus='请修改输入后重试。'; }
    persist(); render();
  }
}
function acceptGeneration(g) {
  if(!g || typeof g.id!=='string' || (pending?.id && g.id!==pending.id) || !['queued','processing','succeeded','failed'].includes(g.status)) throw new api.ApiError('INVALID_RESPONSE');
  generationProgress=Number.isInteger(g.progress)&&g.progress>=0&&g.progress<=100?g.progress:null;
  if(g.status==='succeeded') {
    current=normalize(g.result,g.id); current.prompt=pending?.body.prompt||draft?.prompt||prompt;
    draft={generationId:g.id,prompt:current.prompt}; pending=null; busy=false; generationStatus='Demo 已生成，可以试听并保存。'; generationError=''; persist(); render(); return false;
  }
  if(g.status==='failed') {
    generationError=api.messages[g.error?.code]||'生成失败，请修改想法或重新生成。';
    pending=null; busy=false; generationStatus='生成失败，已保留创作想法。'; persist();render();return false;
  }
  generationStatus=g.status==='queued'?'排队中':'正在生成'; render(); return true;
}
async function pollGeneration(initialWait=null) {
  const run=++pollRun;
  let failures=0, waitMs=initialWait??0;
  while(pending?.id && run===pollRun) {
    if(waitMs) await new Promise(resolve=>setTimeout(resolve,waitMs));
    if(run!==pollRun||!pending?.id) return;
    try {
      const response=await api.getGeneration(pending.id);
      failures=0; generationError='';
      if(!acceptGeneration(response.data))return;
      const age=Date.now()-pending.started;
      waitMs=response.waitMs??Math.min(10000,2000+Math.max(0,Math.floor((age-30000)/15000))*2000);
    } catch(error) {
      if([400,401,403,404,409].includes(error.status)||error.code==='INVALID_RESPONSE') {
        busy=false; generationError=message(error); generationStatus='查询已暂停，保留任务编号。'; render();return;
      }
      failures++;
      waitMs=error.waitMs??Math.min(10000,2000*2**Math.min(failures,3));
      generationError=message(error); generationStatus='暂时无法查询，正在等待重试…';render();
    }
  }
}
async function saveCurrent() {
  if(saving||!current) return;
  if(current.saved) {toast('作品已经保存。');return;}
  saving=true; const generationId=current.generation_id; const title=[...current.title.trim()].slice(0,120).join(''); render();
  try {
    const {data}=await api.saveWork({generation_id:generationId,...(title?{title}:{})});
    const w=normalize(data);
    db.works=[w,...db.works.filter(x=>x.id!==w.id)];current=w;draft=null;persist();toast('作品已保存到服务器。');
  }catch(error){toast(message(error));}
  finally{saving=false;render();}
}
function stopAudio(reset=false) { audio.pause(); if(reset){audio.removeAttribute('src');audio.load();mediaId=null;} player.playing=false;updatePlayerUI(); }
async function refreshAudioResource(w) {
  if(w.saved)return readWork(w.id);
  const {data}=await api.getGeneration(w.generation_id);
  if(data.status!=='succeeded')throw new api.ApiError('GENERATION_NOT_READY');
  return {...normalize(data.result,data.id),prompt:w.prompt};
}
async function playAudio(w=current,toggle=true,force=false) {
  if(!w)return;
  try {
    const key=(w.saved?'work:':'generation:')+w.id;
    if(!force&&mediaId===key&&!audio.paused&&toggle){audio.pause();return;}
    if(w.audio.expires_at && Date.parse(w.audio.expires_at)<=Date.now()+5000) w=await refreshAudioResource(w);
    const url=mediaUrl(w.audio.url);
    if(force||mediaId!==key||audio.src!==url) {audio.pause();audio.src=url;mediaId=key;mediaRefreshTried=force;}
    current=w;audio.volume=player.volume;audio.playbackRate=player.speed;audio.loop=player.loop;
    await audio.play();player.playing=true;render();
  }catch(error){toast(error instanceof api.ApiError?message(error):'音频暂时无法播放，请点击试听重试。');}
}
function updatePlayerUI() {
  player.playing=!audio.paused&&!audio.ended;
  if($('#elapsed'))$('#elapsed').textContent=fmt(audio.currentTime||0);
  if($('#seek'))$('#seek').value=audio.currentTime||0;
  document.querySelectorAll('.controls [data-action="play"]').forEach(b=>b.innerHTML=icon(player.playing?'pause':'play',24));
}
audio.addEventListener('timeupdate',updatePlayerUI);audio.addEventListener('play',updatePlayerUI);audio.addEventListener('pause',updatePlayerUI);audio.addEventListener('ended',updatePlayerUI);
audio.addEventListener('error',async()=>{
  if(!current||!mediaId)return;
  if(mediaRefreshTried){toast('音频仍无法访问，请检查媒体地址、跨域或网络配置。');return;}
  mediaRefreshTried=true;
  try{const w=await refreshAudioResource(current);await playAudio(w,false,true);}
  catch(error){toast(message(error));}
});
async function submitPractice() {
  const w=activeWork(); if(!w||logging)return;
  const n=Number($('#minutes')?.value??minutes);
  confirmed=$('#completion')?.checked??confirmed;
  if(!Number.isInteger(n)||n<1||n>1440){toast('请输入 1–1440 的整数分钟。');return;}
  minutes=n;
  const signature=JSON.stringify([w.id,n,confirmed]);
  if(signature===practiceLastSaved&&Date.now()-practiceLastTime<10000){toast('刚刚已保存，请勿重复提交。');return;}
  if(signature!==practiceSignature||!practiceAttempt){practiceSignature=signature;practiceAttempt={duration_seconds:n*60,completed_at:new Date().toISOString(),completion_confirmed:confirmed};}
  logging=true;practiceError='';render();
  try {
    const {data}=await api.practice(w.id,practiceAttempt);
    if(typeof data?.id!=='string'||data.work_id!==w.id||data.duration_seconds!==n*60||data.completion_confirmed!==confirmed)throw new api.ApiError('INVALID_RESPONSE');
    practiceReceipt=data;practiceAttempt=null;practiceLastSaved=signature;practiceLastTime=Date.now();toast('练习记录已保存到服务器。');
  }catch(error){practiceError=message(error)+([0,500,502,503,504].includes(error.status)?' 保存结果可能尚未确认；重试前请核对后台记录。':'');}
  finally{logging=false;render();}
}
async function initialize() {
  if(!db.profile)return;
  loadWorks();
  if(pending?.id){busy=true;render();pollGeneration();}
  else if(draft?.generationId){
    try{const {data}=await api.getGeneration(draft.generationId);if(data.status==='succeeded'){current=normalize(data.result,data.id);current.prompt=draft.prompt;render();}}
    catch(error){generationError=message(error);render();}
  }
}
document.addEventListener('submit',evt=>{
  evt.preventDefault();const f=evt.target,v=Object.fromEntries(new FormData(f));
  if(f.id==='onboard-form'){
    if(f.dataset.step==='1'){onboardingData=v;renderOnboard(2);}
    else{db.profile={...onboardingData,...v,instrument:'木吉他',name:onboardingData.name.trim()||'音乐朋友'};persist();render();initialize();}
  }else if(f.id==='profile-form'){db.profile={...db.profile,...v,instrument:'木吉他',name:v.name.trim()||'音乐朋友'};persist();closeModal();render();toast('本机偏好已保存。');}
  else if(f.id==='practice-form')submitPractice();
});
document.addEventListener('input',evt=>{
  const el=evt.target;
  if(el.id==='prompt'){prompt=el.value;persist();}
  if(el.id==='minutes')minutes=Number(el.value);
  if(el.id==='completion')confirmed=el.checked;
  if(el.id==='volume'){player.volume=Number(el.value);audio.volume=player.volume;}
});
document.addEventListener('change',evt=>{
  if(evt.target.id==='seek'){audio.currentTime=Number(evt.target.value);updatePlayerUI();}
  if(evt.target.id==='speed'){player.speed=Number(evt.target.value);audio.playbackRate=player.speed;}
});
document.addEventListener('click',async evt=>{
  const b=evt.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.nav){navigate(b.dataset.nav);return;}
  if(b.dataset.tag&&!formLocked()){tags=tags.includes(b.dataset.tag)?tags.filter(t=>t!==b.dataset.tag):[...tags,b.dataset.tag];persist();render();return;}
  if(b.dataset.duration&&!formLocked()){duration=Number(b.dataset.duration);persist();render();return;}
  if(b.dataset.purpose&&!formLocked()){purpose=b.dataset.purpose;persist();render();return;}
  if(b.dataset.guideChoice){guideAnswers[guideStep]=b.dataset.guideChoice;guide();return;}
  const action=b.dataset.action,id=b.dataset.id;
  try{
    switch(action){
      case 'close':closeModal();break;
      case 'profile':openProfile();break;
      case 'new':navigate('home');$('#prompt')?.focus();break;
      case 'guide':guideAnswers=[];guideStep=0;guide();break;
      case 'guide-back':guideStep--;guide();break;
      case 'guide-next':
        if(!guideAnswers[guideStep]){toast('请先选择一个方向。');break;}
        if(guideStep<2){guideStep++;guide();}else{prompt=guideAnswers.join('，')+'。木吉他为主，'+duration+'秒。';purpose=guideAnswers[2].includes('练习')?'生成练习曲':'寻找创作灵感';persist();closeModal();render();}break;
      case 'generate':await newDemo();break;
      case 'save':await saveCurrent();break;
      case 'play':await playAudio();break;
      case 'show-works':navigate('works');break;
      case 'reload-works':await loadWorks();break;
      case 'more-works':await loadWorks(true);break;
      case 'open-work':await readWork(id);selected=id;navigate('detail');break;
      case 'listen-work':await playAudio(await readWork(id));break;
      case 'set-goal':await readWork(id);db.goal=id;selected=id;persist();practiceReceipt=null;practiceError='';navigate('practice');break;
      case 'practice-goal':await readWork(db.goal);selected=db.goal;practiceReceipt=null;practiceError='';navigate('practice');break;
      case 'loop':player.loop=!player.loop;audio.loop=player.loop;render();break;
    }
  }catch(error){toast(message(error));}
});
document.addEventListener('keydown',evt=>{
  if(!$('#modal-root').firstElementChild)return;
  if(evt.key==='Escape'){closeModal();return;}
  if(evt.key==='Tab'){
    const list=[...$('#modal-root').querySelectorAll('button:not([disabled]),input,select,textarea,a[href]')],first=list[0],last=list.at(-1);
    if(evt.shiftKey&&document.activeElement===first){evt.preventDefault();last?.focus();}
    else if(!evt.shiftKey&&document.activeElement===last){evt.preventDefault();first?.focus();}
  }
});
window.addEventListener('xianban:unauthorized',()=>toast('当前身份未认证，请配置登录适配层后重试。'));
window.addEventListener('beforeunload',()=>{pollRun++;persist();});
render();initialize();
