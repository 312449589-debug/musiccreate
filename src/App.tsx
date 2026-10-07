import { useEffect, useState, type ReactNode } from "react";

type Page = "home" | "works" | "community" | "growth" | "detail" | "practice";
type IconName =
  | "home" | "disc" | "users" | "chart" | "settings" | "spark" | "play"
  | "pause" | "prev" | "next" | "heart" | "bookmark" | "share" | "chevron"
  | "clock" | "music" | "edit" | "plus" | "more" | "check" | "arrow" | "mic"
  | "volume" | "x" | "trash" | "calendar" | "repeat";

const paths: Record<IconName, ReactNode> = {
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
  disc: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 3v6"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2-7 6-7s6 3 6 7"/><path d="M16 5c3 1 3 5 0 6m1 3c3 .5 4 3 4 6"/></>,
  chart: <><path d="M4 20V10m6 10V4m6 16v-7m5 7H2"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.7-.7-1.7.9-2-2.2-2-1.9 1-1.8-.8L10.5 2h-3l-.7 2.2-1.7.7-2-.9L1 6.1l1 2-.8 1.8-2.2.6v3l2.2.7.7 1.7-.9 2L3.1 20l2-.9 1.8.8.6 2.1h3l.7-2.2 1.7-.7 2 .9 2.1-2.1-1-2 .8-1.8z" transform="translate(2) scale(.83)"/></>,
  spark: <path d="m12 2 1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6L12 2Zm7 13 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>,
  play: <path d="m8 5 11 7-11 7V5Z"/>, pause: <><path d="M8 5v14M16 5v14"/></>,
  prev: <><path d="M6 5v14M19 6l-9 6 9 6V6Z"/></>, next: <><path d="M18 5v14M5 6l9 6-9 6V6Z"/></>,
  heart: <path d="M20.8 5.7c-2.5-2.6-6.4-1.4-8.8 1.3-2.4-2.7-6.3-3.9-8.8-1.3C.5 8.5 2 14 12 20c10-6 11.5-11.5 8.8-14.3Z"/>,
  bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z"/>, share: <><circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5m-8 7 8 5"/></>,
  chevron: <path d="m9 5 7 7-7 7"/>, clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></>,
  music: <><path d="M9 18V5l10-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></>,
  edit: <><path d="m14 5 5 5L9 20H4v-5L14 5Z"/><path d="m12 7 5 5"/></>, plus: <path d="M12 5v14M5 12h14"/>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  check: <path d="m4 12 5 5L20 6"/>, arrow: <path d="m5 12 14 0m-6-6 6 6-6 6"/>,
  mic: <><rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5 11a7 7 0 0 0 14 0m-7 7v3"/></>,
  volume: <><path d="M5 10v4h4l5 4V6L9 10H5Z"/><path d="M17 9c2 2 2 4 0 6"/></>, x: <path d="m5 5 14 14M19 5 5 19"/>,
  trash: <><path d="M5 7h14M9 7V4h6v3m2 0-1 14H8L7 7"/></>, calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,
  repeat: <><path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></>,
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]}</svg>;
}

function Button({ children, variant = "primary", icon, onClick, disabled, className = "" }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "dark"; icon?: IconName; onClick?: () => void; disabled?: boolean; className?: string }) {
  return <button className={`btn btn-${variant} ${className}`} onClick={onClick} disabled={disabled}>{icon && <Icon name={icon} size={18}/>}<span>{children}</span></button>;
}

const songs = [
  { title: "风吹过旧阳台", meta: "温暖民谣 · 木吉他", time: "02:48", reason: "因为你喜欢木吉他和温暖民谣", color: "peach", source: "社区作品" },
  { title: "沿江慢行", meta: "轻流行 · 原声吉他", time: "03:12", reason: "适合练习基础扫弦节奏", color: "blue", source: "推荐歌曲" },
  { title: "星期日早晨", meta: "民谣 · 尤克里里", time: "02:26", reason: "和弦简单，适合你的阶段", color: "yellow", source: "社区作品" },
];

function Cover({ color = "green", small = false }: { color?: string; small?: boolean }) {
  return <div className={`cover cover-${color} ${small ? "cover-small" : ""}`}><span className="cover-sun"/><span className="cover-line one"/><span className="cover-line two"/><Icon name="music" size={small ? 17 : 25}/></div>;
}

function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [instrument, setInstrument] = useState("木吉他");
  const [level, setLevel] = useState("掌握基础");
  const [styles, setStyles] = useState(["温暖", "中文民谣"]);
  const toggleStyle = (s: string) => setStyles(v => v.includes(s) ? v.filter(x => x !== s) : [...v, s]);
  return <main className="onboard">
    <section className="welcome-panel">
      <div className="brand light"><span className="brand-mark"><Icon name="music"/></span><b>弦伴</b></div>
      <div className="welcome-copy">
        <span className="eyebrow light">AI 音乐创作与练习伙伴</span>
        <h1>从一个想法，<br/>开始你的第一首歌。</h1>
        <p>创作不必准备充分。一个心情、一段旋律，<br/>我们陪你把它写出来，也真正弹出来。</p>
      </div>
      <div className="welcome-note"><Icon name="spark"/><span>小林的第一首原创作品<br/><b>《晚一点回家》</b></span><i>00:45</i></div>
    </section>
    <section className="setup-panel">
      <div className="mobile-brand brand"><span className="brand-mark"><Icon name="music"/></span><b>弦伴</b></div>
      <div className="setup-wrap">
        <div className="progress-head"><span>个性化设置</span><b>{step} / 2</b></div>
        <div className="progress"><i style={{ width: `${step * 50}%` }}/></div>
        {step === 1 ? <>
          <div className="form-title"><span className="eyebrow">先认识一下</span><h2>你的基本信息</h2><p>年龄和性别仅用于完善资料，可随时跳过。</p></div>
          <label className="field-label">年龄 <em>选填</em></label>
          <input className="text-input" defaultValue="28" inputMode="numeric"/>
          <label className="field-label">性别 <em>选填</em></label>
          <div className="segmented"><button>男</button><button>女</button><button className="active">不愿透露</button></div>
          <div className="form-actions"><Button onClick={() => setStep(2)}>下一步 <Icon name="arrow" size={17}/></Button><button className="text-btn" onClick={() => setStep(2)}>跳过</button></div>
        </> : <>
          <div className="form-title"><span className="eyebrow">让推荐更合拍</span><h2>你弹什么、爱听什么？</h2><p>我们会据此推荐适合你的作品与创作建议。</p></div>
          <label className="field-label">我的乐器</label>
          <div className="choice-grid">{["木吉他","钢琴","尤克里里","贝斯","其他"].map(x => <button key={x} onClick={() => setInstrument(x)} className={instrument === x ? "choice active" : "choice"}>{x === "木吉他" && <Icon name="music" size={17}/>} {x}</button>)}</div>
          <label className="field-label">学习阶段</label>
          <div className="choice-grid levels">{["刚入门","掌握基础","独立演奏","进阶学习"].map(x => <button key={x} onClick={() => setLevel(x)} className={level === x ? "choice active" : "choice"}>{x}</button>)}</div>
          <label className="field-label">喜欢的音乐 <em>可多选</em></label>
          <div className="chips">{["温暖","轻快","中文民谣","流行","治愈","城市感"].map(x => <button key={x} onClick={() => toggleStyle(x)} className={styles.includes(x) ? "chip active" : "chip"}>{x}</button>)}</div>
          <input className="text-input" placeholder="也可以输入喜欢的歌曲或歌手"/>
          <div className="form-actions row"><Button variant="secondary" onClick={() => setStep(1)}>返回</Button><Button onClick={onDone}>开始探索 <Icon name="arrow" size={17}/></Button></div>
        </>}
      </div>
    </section>
  </main>;
}

function Sidebar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const nav: [Page, IconName, string][] = [["home","home","首页"],["works","disc","我的作品"],["community","users","社区"],["growth","chart","成长报告"]];
  return <aside className="sidebar">
    <div className="brand"><span className="brand-mark"><Icon name="music"/></span><b>弦伴</b><small>陪你写，也陪你弹</small></div>
    <nav>{nav.map(([p,i,t]) => <button key={p} onClick={() => setPage(p)} className={page === p || (p === "works" && ["detail","practice"].includes(page)) ? "active" : ""}><Icon name={i}/><span>{t}</span>{p === "works" && <i>3</i>}</button>)}</nav>
    <div className="side-goal">
      <span className="eyebrow">近期练习目标</span><b>《晚一点回家》</b><p>目标周日弹会</p><div className="tiny-progress"><i/></div><button onClick={() => setPage("practice")}>继续练习 <Icon name="chevron" size={15}/></button>
    </div>
    <button className="profile"><span>林</span><div><b>小林</b><small>木吉他 · 基础阶段</small></div><Icon name="more"/></button>
  </aside>;
}

function BottomNav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  return <nav className="bottom-nav">{([["home","home","首页"],["works","disc","作品"],["community","users","社区"],["growth","chart","成长"]] as [Page,IconName,string][]).map(([p,i,t]) => <button key={p} onClick={() => setPage(p)} className={page === p || (p === "works" && ["detail","practice"].includes(page)) ? "active" : ""}><Icon name={i}/><span>{t}</span></button>)}</nav>;
}

function Topbar({ title = "下午好，小林", subtitle = "今天，也从一小段音乐开始吧。" }: { title?: string; subtitle?: string }) {
  return <header className="topbar"><div><h1>{title}</h1><p>{subtitle}</p></div><button className="avatar">林</button></header>;
}

function GuideModal({ onClose, onApply }: { onClose: () => void; onApply: () => void }) {
  const [q, setQ] = useState(0);
  const questions = [
    ["你想表达什么心情或故事？",["下班很晚的城市夜晚","轻松温暖的一天","想念一个老朋友"]],
    ["你想要什么音乐风格？",["温暖的中文民谣","轻快流行","安静指弹"]],
    ["这次更想做什么？",["自由创作一小段","练习简单扫弦","练习和弦切换"]],
  ];
  return <div className="modal-backdrop" onMouseDown={onClose}><section className="modal" onMouseDown={e => e.stopPropagation()}>
    <button className="modal-x" onClick={onClose}><Icon name="x"/></button><span className="spark-circle"><Icon name="spark"/></span><span className="eyebrow">灵感引导 · {q+1}/3</span>
    <h2>{questions[q][0]}</h2><p>选一个最接近的，也可以稍后在输入框里修改。</p>
    <div className="guide-options">{questions[q][1].map((x,i) => <button className={i === 0 ? "active" : ""} key={x}><span>{x}</span><i><Icon name="check" size={15}/></i></button>)}</div>
    <div className="modal-actions">{q > 0 ? <Button variant="ghost" onClick={() => setQ(q-1)}>上一步</Button> : <span/>}<Button onClick={() => q < 2 ? setQ(q+1) : onApply()}>{q < 2 ? "下一题" : "整理成创作想法"}</Button></div>
  </section></div>;
}

function CreationPanel({ onGenerated }: { onGenerated: () => void }) {
  const [tags, setTags] = useState(["温暖","民谣","扫弦"]);
  const [duration, setDuration] = useState("45 秒");
  const [purpose, setPurpose] = useState("生成练习曲");
  const [guide, setGuide] = useState(false);
  const [prompt, setPrompt] = useState("最近下班很晚，想写一段关于城市夜晚和回家路上的音乐。木吉他为主，45 秒，简单扫弦，适合我练习。");
  const [generating, setGenerating] = useState(false);
  const generate = () => { setGenerating(true); setTimeout(() => {setGenerating(false); onGenerated();}, 1400); };
  return <section className="creation-panel">
    <div className="creation-head"><div><span className="eyebrow"><Icon name="spark" size={14}/> AI 共创</span><h2>今天想创作或练习什么？</h2></div><div className="profile-pill"><Icon name="music" size={15}/>木吉他 · 基础阶段 <Icon name="edit" size={13}/></div></div>
    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} aria-label="创作提示词"/>
    <div className="quick-row"><div className="chips scroll">{["温暖","轻快","民谣","流行","指弹","扫弦"].map(x => <button key={x} className={tags.includes(x) ? "chip active" : "chip"} onClick={() => setTags(v => v.includes(x) ? v.filter(y => y !== x) : [...v,x])}>{tags.includes(x) && <Icon name="check" size={13}/>} {x}</button>)}</div><button className="add-tag"><Icon name="plus" size={16}/>标签</button></div>
    <div className="creation-foot"><div className="creation-options"><div><small>时长</small><span className="inline-options">{["15 秒","30 秒","45 秒","60 秒"].map(x => <button key={x} onClick={() => setDuration(x)} className={duration === x ? "active" : ""}>{x}</button>)}</span></div><div><small>用途</small><span className="inline-options">{["寻找创作灵感","生成练习曲"].map(x => <button key={x} onClick={() => setPurpose(x)} className={purpose === x ? "active" : ""}>{x}</button>)}</span></div></div>
      <div className="create-actions"><button className="guide-link" onClick={() => setGuide(true)}><Icon name="spark" size={16}/> 没有想法？引导我开始</button><Button onClick={generate} disabled={generating} icon={generating ? undefined : "music"}>{generating ? <><span className="loader"/>正在谱写你的 Demo...</> : "生成我的 Demo"}</Button></div>
    </div>
    {guide && <GuideModal onClose={() => setGuide(false)} onApply={() => {setPrompt("城市夜晚下班回家的温暖故事，中文民谣风格，用简单扫弦练习。"); setTags(["温暖","民谣","扫弦"]); setGuide(false)}}/>}
  </section>;
}

function Player({ playing, setPlaying, generated = false }: { playing: boolean; setPlaying: (v: boolean) => void; generated?: boolean }) {
  return <section className="player-card">
    <div className="player-main">
      <Cover color={generated ? "night" : "green"}/>
      <div className="track-info"><span className={`source ${generated ? "mine" : ""}`}>{generated ? "我的 AI Demo" : "社区作品"}</span><h2>{generated ? "晚一点回家" : "风吹过旧阳台"}</h2><p>{generated ? "小林 · 木吉他弹唱" : "山野来信 · 温暖民谣"}</p></div>
      <div className="player-actions"><button><Icon name="heart"/></button><button><Icon name="bookmark"/></button><button><Icon name="share"/></button></div>
    </div>
    <div className="timeline"><span>00:{playing ? "18" : "00"}</span><div><i style={{width: playing ? "40%" : "7%"}}/><b style={{left: playing ? "40%" : "7%"}}/></div><span>{generated ? "00:45" : "02:48"}</span></div>
    <div className="controls"><span className="volume"><Icon name="volume"/><i/></span><div><button><Icon name="prev"/></button><button className="play" onClick={() => setPlaying(!playing)}><Icon name={playing ? "pause" : "play"} size={24}/></button><button><Icon name="next"/></button></div><button><Icon name="more"/></button></div>
  </section>;
}

function Home({ setPage }: { setPage: (p: Page) => void }) {
  const [generated, setGenerated] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("为你推荐");
  useEffect(() => { if (generated) setPlaying(true); }, [generated]);
  return <main className="content home-page"><Topbar/><CreationPanel onGenerated={() => setGenerated(true)}/>
    {generated && <section className="result-banner"><Cover color="night" small/><div><span className="eyebrow"><Icon name="check" size={14}/> Demo 已生成</span><h3>《晚一点回家》</h3><p>温暖民谣 · 木吉他 · 45 秒 · 基础难度</p></div><div className="result-actions"><Button variant="secondary" icon="play" onClick={() => setPlaying(true)}>试听</Button><Button variant={saved ? "secondary" : "primary"} icon={saved ? "check" : "bookmark"} onClick={() => setSaved(true)}>{saved ? "已保存" : "保存 Demo"}</Button><Button variant="dark" onClick={() => setPage("detail")}>继续完善</Button></div></section>}
    {saved && <div className="toast"><Icon name="check"/><span><b>已保存</b>可在「我的作品」继续完善</span><button onClick={() => setPage("works")}>查看</button></div>}
    <section className="listen-section">
      <div className="section-title"><div><span className="eyebrow">听点什么</span><h2>{generated ? "试听与发现" : "为你找到的音乐"}</h2></div><div className="tabs">{["为你推荐","适合你练习","发现灵感"].map(x => <button key={x} className={tab === x ? "active" : ""} onClick={() => setTab(x)}>{x}</button>)}</div></div>
      <div className="music-layout"><Player playing={playing} setPlaying={setPlaying} generated={generated}/>
        <section className="recommend-list"><div className="list-head"><h3>{tab}</h3><button>查看全部 <Icon name="chevron" size={15}/></button></div>
          {songs.map((s,i) => <button className="song-row" key={s.title} onClick={() => setPlaying(true)}><span className="song-index">{String(i+1).padStart(2,"0")}</span><Cover color={s.color} small/><span className="song-copy"><b>{s.title}</b><small><em className={i === 0 ? "community" : ""}>{s.source}</em> {s.meta}</small><small className="reason">{s.reason}</small></span><span className="song-time">{s.time}</span><span className="round-play"><Icon name="play" size={16}/></span></button>)}
        </section>
      </div>
    </section>
  </main>;
}

function Works({ setPage }: { setPage: (p: Page) => void }) {
  const [tab,setTab] = useState("全部");
  return <main className="content"><Topbar title="我的作品" subtitle="每一小段，都是你在音乐里的脚印。"/>
    <div className="page-actions"><div className="tabs">{["全部","Demo","完善中","已完成"].map(x=><button className={tab===x?"active":""} onClick={()=>setTab(x)}>{x}</button>)}</div><Button icon="plus" onClick={()=>setPage("home")}>创作新作品</Button></div>
    <div className="work-grid">
      <article className="work-card featured"><Cover color="night"/><div className="work-body"><span className="status progress">完善中</span><h2>晚一点回家</h2><p>木吉他 · 00:45 · 3 个版本</p><small>更新于今天 16:20</small><div className="work-actions"><Button onClick={()=>setPage("detail")}>继续完善</Button><button><Icon name="play"/></button><button><Icon name="share"/></button></div></div></article>
      <article className="work-card"><Cover color="yellow"/><div className="work-body"><span className="status demo">Demo</span><h2>星期日的风</h2><p>木吉他 · 00:30 · 1 个版本</p><small>更新于 3 天前</small><div className="work-actions"><Button variant="secondary">试听</Button><button><Icon name="more"/></button></div></div></article>
      <article className="work-card"><Cover color="peach"/><div className="work-body"><span className="status done">已完成</span><h2>慢慢走回去</h2><p>木吉他 · 01:12 · 5 个版本</p><small>更新于 5 月 18 日</small><div className="work-actions"><Button variant="secondary">试听</Button><button><Icon name="share"/></button></div></div></article>
    </div>
  </main>;
}

function Detail({ setPage }: { setPage: (p: Page) => void }) {
  const [open, setOpen] = useState("歌词");
  const [version,setVersion] = useState(3);
  return <main className="content detail-page">
    <div className="detail-top"><button className="back" onClick={()=>setPage("works")}>‹</button><div><span className="status progress">完善中</span><h1>晚一点回家</h1><p>最后编辑于刚刚 · 已自动保存</p></div><Button variant="secondary" icon="share">分享</Button></div>
    <div className="detail-layout"><aside className="detail-player"><Cover color="night"/><h2>晚一点回家</h2><p>木吉他弹唱 · 00:45</p><div className="big-play"><button><Icon name="prev"/></button><button><Icon name="play" size={25}/></button><button><Icon name="next"/></button></div><div className="line-progress"><i/></div><div className="meta-pills"><span>G 大调</span><span>86 BPM</span><span>基础</span></div><Button className="full" icon="calendar" onClick={()=>setPage("practice")}>设为近期练习目标</Button></aside>
      <section className="editor"><span className="eyebrow">继续完善你的作品</span><h2>不用一次完成，挑一项开始就好</h2><div className="suggestions">{["让副歌更明亮","降低难度","增加一段歌词","保留旋律，调整节奏"].map(x=><button onClick={()=>setOpen("歌词")}><Icon name="spark" size={14}/>{x}</button>)}</div>
        {["故事和情绪","歌词","风格与乐器","调性、速度","难度和练习技巧","想保留或修改的部分"].map(x=><div className={`accordion ${open===x?"open":""}`} key={x}><button onClick={()=>setOpen(open===x?"":x)}><span>{x}</span><small>{x==="歌词"?"已填写 2 句":"可跳过"}</small><Icon name="chevron"/></button>{open===x&&<div className="accordion-body">{x==="歌词"?<textarea defaultValue={"路灯把影子拉得很长\n晚风替我推开回家的窗"}/>:<p>告诉弦伴你希望保留什么，或想让这一版发生怎样的变化。</p>}<Button variant="secondary" onClick={()=>setVersion(v=>v+1)}>应用修改，生成新版本</Button></div>}</div>)}
      </section>
      <aside className="versions"><div className="list-head"><h3>历史版本</h3><span>{version} 个</span></div>{Array.from({length:version}).reverse().map((_,idx)=>{const n=version-idx;return <button className={idx===0?"version active":"version"} key={n}><span>V{n}</span><div><b>{n===3?"调整歌词与节奏":n===2?"降低演奏难度":"首次 Demo"}</b><small>{n===3?"刚刚":n===2?"今天 16:08":"今天 15:42"}</small></div>{idx===0&&<Icon name="check" size={15}/>}</button>})}<p className="version-tip">每次修改都会保存为新版本，你可以随时试听、比较或恢复。</p></aside>
    </div>
  </main>;
}

function Practice({ setPage }: { setPage: (p: Page) => void }) {
  const [done,setDone] = useState(false);
  const [recording,setRecording] = useState(false);
  return <main className="content practice-page"><Topbar title="练习《晚一点回家》" subtitle="今天练一小段，也算向作品靠近了一步。"/>
    <div className="practice-layout"><section className="practice-main"><div className="practice-head"><Cover color="night" small/><div><span className="eyebrow">本周练习目标</span><h2>目标周日弹会 · 每天 15 分钟</h2></div><span>第 4 天</span></div>
      <div className="chord-sheet"><div className="sheet-top"><h3>主歌 · 简单扫弦</h3><div><button>0.75×</button><button><Icon name="repeat" size={17}/>循环</button></div></div>
        <div className="lyrics"><p><b>G</b>路灯把影子　拉得很长</p><p><b>Em7</b>晚风替我推开　回家的窗</p><p><b>Cadd9</b>街角还有一盏　灯没关</p><p><b>Dsus4</b>像在说别急　慢慢走完</p></div>
        <div className="wave"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="practice-controls"><span>00:18</span><button><Icon name="prev"/></button><button className="play"><Icon name="play"/></button><button><Icon name="next"/></button><span>00:45</span></div>
      </div><div className="tip-box"><Icon name="spark"/><div><b>这一遍，先让右手放松</b><p>用「下 下上 上下上」的节奏慢速循环，不用急着唱。</p></div></div>
    </section>
    <aside className="practice-side"><h3>记录今天的练习</h3><p>只记录你真实完成的部分。</p><label className="field-label">本次练习时长</label><div className="time-counter"><button>−</button><b>15 <small>分钟</small></b><button>＋</button></div>
      <button className={`record-btn ${recording?"recording":""}`} onClick={()=>setRecording(!recording)}><span><Icon name="mic"/></span><div><b>{recording?"正在录音…":"录下我的演奏"}</b><small>{recording?"点击结束并保存":"可选，不进行自动评分"}</small></div></button>
      {!done?<><Button className="full" icon="check" onClick={()=>setDone(true)}>今天练过了</Button><Button className="full" variant="secondary" onClick={()=>setDone(true)}>我已弹会这个版本</Button></>:<div className="completed-box"><span><Icon name="check"/></span><h3>今天的练习已记录</h3><p>连续练习 4 天 · 本周共 62 分钟</p><Button onClick={()=>setPage("community")}>完成演奏并分享</Button></div>}
      <small className="honest-note">弦伴不会把 AI 试听或生成次数计作你的演奏成果。</small>
    </aside></div>
  </main>;
}

function Community() {
  const [share,setShare] = useState(false);
  const [success,setSuccess] = useState(false);
  return <main className="content"><Topbar title="弦伴社区" subtitle="听见彼此正在成形的作品。"/>
    <div className="community-hero"><div><span className="eyebrow">本周共创主题</span><h2>写一段「回家的路」</h2><p>不论 15 秒还是一首完整作品，都值得被听见。</p></div><Button icon="share" onClick={()=>setShare(true)}>分享我的作品</Button></div>
    <div className="feed-grid">{songs.map((s,i)=><article className="feed-card"><Cover color={s.color}/><div className="feed-body"><div className="feed-user"><span>{["禾","屿","声"][i]}</span><b>{["禾木","岛屿边","一颗声响"][i]}</b><small>· {i+1} 小时前</small></div><h2>{i===0?"晚风经过的时候":s.title}</h2><p>{s.reason}。这是我给最近生活写的一小段。</p><div className="feed-tags"><span>AI 辅助创作</span><span>#{i===1?"原声吉他":"温暖民谣"}</span></div><div className="feed-actions"><button><Icon name="play"/>试听</button><button><Icon name="heart"/> {23+i*18}</button><button><Icon name="bookmark"/></button></div></div></article>)}</div>
    {share&&<div className="modal-backdrop"><section className="modal share-modal"><button className="modal-x" onClick={()=>setShare(false)}><Icon name="x"/></button>{success?<div className="share-success"><span><Icon name="check" size={28}/></span><h2>发布成功</h2><p>《晚一点回家》已发布到弦伴社区。</p><Button onClick={()=>setShare(false)}>查看我的发布</Button></div>:<><span className="eyebrow">分享作品</span><h2>让这段音乐被听见</h2><div className="share-preview"><Cover color="night" small/><div><b>晚一点回家</b><small>V3 · 我的演奏录音</small></div><button><Icon name="edit"/></button></div><label className="field-label">一句作品介绍</label><textarea className="share-text" defaultValue="写给每个很晚才走上回家路的人。第一次录下自己的原创弹唱。"/><div className="share-type"><button className="active">弦伴社区</button><button>微信</button><button>朋友圈</button><button>小红书</button></div><small className="share-note">外部平台将生成链接或可下载内容，不会自动发布。</small><Button className="full" onClick={()=>setSuccess(true)}>确认发布到社区</Button></>}</section></div>}
  </main>;
}

const practice = [12,18,undefined,15,17,undefined,15];
function Growth({ setPage }: { setPage: (p: Page)=>void }) {
  const [range,setRange]=useState("近 7 天");
  return <main className="content"><Topbar title="成长报告" subtitle="只记录真实练习，也认真庆祝每一次完成。"/>
    <div className="page-actions"><div className="tabs">{["近 7 天","近 30 天","全部时间"].map(x=><button className={range===x?"active":""} onClick={()=>setRange(x)}>{x}</button>)}</div><span className="demo-data">原型演示数据 · 5 月 20–26 日</span></div>
    <div className="summary-grid"><div><span>本周练习</span><b>4 <small>天</small></b><p>共 62 分钟</p></div><div><span>完成作品</span><b>1 <small>首</small></b><p>从 Demo 到亲自演奏</p></div><div><span>已掌握技巧</span><b>2 <small>项</small></b><p>由你主动标记</p></div><div className="summary-message"><Icon name="spark"/><p>本周你练习了 <b>4 天</b>，完成了第一段 <b>45 秒弹唱</b>。</p></div></div>
    <div className="charts"><section className="chart-card"><div className="chart-title"><div><h2>每日练习时长趋势</h2><p>仅统计手动记录的练习 · 单位：分钟</p></div><b>62 <small>分钟</small></b></div><div className="bar-chart"><div className="y-axis"><span>20</span><span>10</span><span>0</span></div>{practice.map((v,i)=><div className="bar-col"><span className={!v?"missing":""} style={{height:v?`${v*6}px`:"2px"}}>{v&&<i>{v}</i>}</span><small>{["20","21","22","23","24","25","26"][i]}</small></div>)}</div><div className="legend"><span><i/>已记录</span><span><i className="dash"/>未记录（不计为 0）</span></div></section>
      <section className="chart-card"><div className="chart-title"><div><h2>累计完成作品趋势</h2><p>以标记「已完成」日期累计 · 单位：首</p></div><b>2 <small>首</small></b></div><div className="line-chart"><svg viewBox="0 0 600 180" preserveAspectRatio="none"><path className="gridline" d="M0 30H600M0 90H600M0 150H600"/><path className="area" d="M0 150 L180 150 L260 90 L470 90 L540 30 L600 30 L600 180 L0 180Z"/><path className="trend" d="M0 150 L180 150 L260 90 L470 90 L540 30 L600 30"/><circle cx="260" cy="90" r="5"/><circle cx="540" cy="30" r="5"/></svg><div><span>5/20</span><span>5/23</span><span>5/26</span></div></div><p className="chart-insight">你从 Demo 到完成的平均周期是 6 天，比上一首更专注。</p></section></div>
    <div className="growth-cta"><Cover color="night" small/><div><span>继续当前作品</span><h3>《晚一点回家》还有一次练习就达成目标</h3></div><Button onClick={()=>setPage("practice")}>继续练习</Button><Button variant="secondary" onClick={()=>setPage("home")}>开始下一首</Button></div>
  </main>;
}

export default function App() {
  const [onboarded,setOnboarded] = useState(false);
  const [page,setPage] = useState<Page>("home");
  if (!onboarded) return <Onboarding onDone={()=>setOnboarded(true)}/>;
  return <div className="app-shell"><Sidebar page={page} setPage={setPage}/><div className="main-shell">
    {page==="home"&&<Home setPage={setPage}/>}
    {page==="works"&&<Works setPage={setPage}/>}
    {page==="detail"&&<Detail setPage={setPage}/>}
    {page==="practice"&&<Practice setPage={setPage}/>}
    {page==="community"&&<Community/>}
    {page==="growth"&&<Growth setPage={setPage}/>}
  </div><BottomNav page={page} setPage={setPage}/></div>;
}
