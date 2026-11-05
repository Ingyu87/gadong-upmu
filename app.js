const $=s=>document.querySelector(s);
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let DB=null;
function useRole(id){const r=DB.R[id];ST.role=id;DB.G=r.G;DB.D=r.D;DB.TASKS=r.TASKS;DB.WP=(r.WP||[]).filter(x=>x.y!==2025);ST.task=r.task0;ST.q='';}
const RL=()=>DB.R[ST.role]||DB.R.research;
window.addEventListener('load',async()=>{DB=await (await fetch('data.json',{cache:'no-store'})).json();useRole('research');init();});

const MO=[3,4,5,6,7,8,9,10,11,12,1,2];
const SEA={
 spring:{n:'봄',bg:'linear-gradient(160deg,#fff0f5 0%,#fde4ee 40%,#eaf8e6 100%)',hero:'linear-gradient(120deg,#ff9cbf,#ffc4d8 45%,#a8e6a1)',acc:'#e0507f',acc2:'#3f9f60',ink:'#4a2a38',glass:'rgba(255,255,255,.78)',fx:'🌸',prop:'🌸',greet:'벚꽃 피는 새 학기예요. 교육과정과 공동체를 시작할 때예요.'},
 summer:{n:'여름',bg:'linear-gradient(160deg,#e9f8ff 0%,#d9f3f7 50%,#e8fbf6 100%)',hero:'linear-gradient(120deg,#38b6ff,#4fd1d9 55%,#7be3c5)',acc:'#0b85c8',acc2:'#0d9393',ink:'#0e3550',glass:'rgba(255,255,255,.78)',fx:'🫧',prop:'🕶️',greet:'햇살 가득한 여름이에요. 1학기를 마무리하고 2학기를 준비해요.'},
 autumn:{n:'가을',bg:'linear-gradient(160deg,#fff6ea 0%,#fde9d2 50%,#f6e3cf 100%)',hero:'linear-gradient(120deg,#e8742a,#f5a742 50%,#a8642f)',acc:'#d0581a',acc2:'#8a5a2b',ink:'#4a2c14',glass:'rgba(255,252,247,.8)',fx:'🍁',prop:'🍁',greet:'단풍 드는 가을이에요. 학교평가와 내년 교육과정을 준비할 때예요.'},
 winter:{n:'겨울',bg:'linear-gradient(160deg,#eef4fb 0%,#e3edf8 50%,#f7fbff 100%)',hero:'linear-gradient(120deg,#16295a,#2d4f8f 50%,#8fb9e6)',acc:'#2d5fb0',acc2:'#3b8cc4',ink:'#152447',glass:'rgba(255,255,255,.8)',fx:'❄️',prop:'🧣',greet:'눈 내리는 겨울이에요. 새 학년도 교육계획을 차분히 세워요.'}};
const season=m=>[3,4,5].includes(m)?'spring':[6,7,8].includes(m)?'summer':[9,10,11].includes(m)?'autumn':'winter';
const mon=d=>+d.slice(5,7);
const ST={view:'home',kind:null,role:null,tab:'cal',m:10,yr:2026,task:'교육과정 편성·운영 총괄',q:''};
const seoulM=()=>+new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Seoul',month:'numeric'}).format(new Date());
const VM=()=>(ST.view==='home'||ST.view==='list')?seoulM():ST.m;
function setTheme(m){const S=SEA[season(m)],r=document.documentElement.style;r.setProperty('--bg',S.bg);r.setProperty('--hero',S.hero);r.setProperty('--acc',S.acc);r.setProperty('--acc2',S.acc2);r.setProperty('--ink',S.ink);r.setProperty('--glass',S.glass);return S;}
// Juri
const TIPS={};let tipN=0,openTip=null;
function J(w,title,body){const id='t'+(tipN++);TIPS[id]=[title,body];const S=SEA[season(VM())];
 return `<span class="jw" data-tip="${id}" role="button" tabindex="0" aria-label="주리 설명: ${E(title)}"><img src="juri.png" width="${w}" alt=""><span class="jp">${S.prop}</span><span class="jd">?</span></span>`;}
document.addEventListener('click',e=>{const j=e.target.closest('.jw');const tip=$('#tip');
 if(j){e.stopPropagation();e.preventDefault();const id=j.dataset.tip;if(openTip===id){tip.style.display='none';openTip=null;return;}
  const [t,b]=TIPS[id];tip.innerHTML=`<b class="h">🗨️ 주리의 설명 · ${t}</b>${b}<i>주리를 한 번 더 누르거나 다른 곳을 누르면 닫혀요</i>`;tip.style.display='block';openTip=id;
  const r=j.getBoundingClientRect(),tw=tip.offsetWidth,th=tip.offsetHeight;let x=r.right+8,y=r.top;
  if(x+tw>innerWidth-8)x=r.left-tw-8; if(x<8)x=Math.max(8,Math.min(innerWidth-tw-8,r.left+r.width/2-tw/2)),y=r.bottom+8;
  if(y+th>innerHeight-8)y=Math.max(8,innerHeight-th-8);tip.style.left=x+'px';tip.style.top=y+'px';return;}
 if(!e.target.closest('#tip')&&openTip){tip.style.display='none';openTip=null;}},true);
addEventListener('scroll',()=>{if(openTip){$('#tip').style.display='none';openTip=null;}},{passive:true});

function bar(title,sub,jt,jb){const S=setTheme(VM());let fx='';for(let i=0;i<7;i++)fx+=`<span class="fx" style="left:${(i*41)%100}%;animation-delay:-${(i*1.7)%10}s;font-size:${11+(i*5)%8}px">${S.fx}</span>`;
 return `<header class="top"><div class="deco">${fx}</div><button class="hb" onclick="toggleDr(true)" aria-label="메뉴 열기">☰</button><div class="tt"><b>${title}</b><span>${sub}</span></div>${J(44,jt,jb)}</header>`;}
function hero(title,sub,juriTitle,juriBody){const S=setTheme(VM());let fx='';for(let i=0;i<16;i++)fx+=`<span class="fx" style="left:${(i*37)%100}%;animation-delay:-${(i*1.7)%10}s;font-size:${12+(i*7)%14}px">${S.fx}</span>`;
 const back=ST.view!=='home'?`<button class="k" onclick="go('${ST.view==='work'?'list':'home'}')">← 뒤로</button> `:'';
 return `<div class="hero"><div class="deco">${fx}</div><div style="position:relative">${back}<span class="k">🏫 서울가동초 · ${S.n}</span><h1>${title}</h1><div class="s">${sub}</div></div>${J(118,juriTitle,juriBody)}</div>`;}
function more(items,n=3){if(items.length<=n)return items.join('');return items.slice(0,n).join('')+`<div class="mr" hidden>${items.slice(n).join('')}</div><button class="mb" onclick="this.previousElementSibling.hidden=false;this.remove()">더 보기 ▾</button>`;}
function planHtml(X){const P=X.plan;if(!P)return '';const L=a=>a.length?`<ul class="rt">${a.map(t=>`<li>${E(t)}</li>`).join('')}</ul>`:'';
 const y=P.s.some(s=>s[0]===2026)?2026:2025,S=P.s.filter(s=>s[0]===y);
 return acc('교육계획서로 본 이 업무',P.only.length>1?'2025·2026 교육계획서':P.only[0]+' 교육계획서',`${S.map(s=>`<h4 class="fh">${E(s[1])}</h4>${s[2].length?`<div class="muted">목적</div>${L(s[2])}`:''}${s[3].length?`<div class="muted">운영 방침</div>${L(s[3])}`:''}${s[4].length?`<div class="muted">기대 효과</div>${L(s[4])}`:''}`).join('')}
 <h4 class="fh">작년과 달라진 점</h4>${P.only.length<2?`<p class="muted">${P.only[0]===2026?'2025 교육계획서에는 이 항목이 없어요 (올해 새로 들어감).':'2026 교육계획서에는 이 항목이 없어요 (작년에만 있음).'}</p>`:(P.new.length||P.old.length)?`${P.new.length?`<div class="muted"><span class="yb yb-n">올해만</span> 올해 계획서에 새로</div>${L(P.new)}`:''}${P.old.length?`<div class="muted"><span class="yb yb-o">작년만</span> 작년 계획서에만</div>${L(P.old)}`:''}`:'<p class="muted">목적·방침은 두 해가 같아요. 월별 일정 차이는 아래 비교에 있어요.</p>'}
 <div>${P.s.map(s=>`<span class="chip" style="font-size:16px;padding:1px 6px;background:#e8f0ff">${s[0]} 교육계획서 · ${E(s[1])}</span>`).join(' ')}</div>`,false)}
function refHtml(X){const R=X.ref;if(!R||!R.m.length)return '';const K={r:['<span class="yb yb-r">매년</span>','매년 하는 일'],n:['<span class="yb yb-n">올해만</span>','올해만'],o:['<span class="yb yb-o">작년만</span>','작년만'],p:['<span class="yb yb-p">교육계획서</span>','교육계획서에만 있음']};
 const src=s=>s[1]==='계획서'?`<span class="chip" style="font-size:16px;padding:1px 6px;background:#e8f0ff">${s[0]} 교육계획서 · ${E(s[2])}</span>`:s[1]==='월중'?`<span class="chip gray" style="font-size:16px;padding:1px 6px">${s[0]===2025?'작년':'올해'} 월중계획 ${s[2]}</span>`:`<button class="chip ${s[0]===2025?'s2':''}" style="border:0;cursor:pointer;font-size:16px;padding:1px 7px" onclick="event.stopPropagation();openG(${s[0]},'${s[1]}')">${s[0]===2025?'작년':'올해'} ${s[2]}</button>`;
 const mo=R.m.map(([m,L])=>`<details class="rm" name="rm" ${m===ST.m?'open':''}><summary><b>${m}월</b> <span class="muted">${[...new Set(L.map(x=>x[1]))].map(k=>K[k][0]).join(' ')} ${E(L[0][0])}${L.length>1?' 외':''}</span></summary>${L.map(x=>`<details class="ri"><summary><span title="${K[x[1]][1]}">${K[x[1]][0]}</span> ${E(x[0])}${x[3]?` <span class="chip" style="font-size:16px;padding:1px 6px">${E(x[3])}</span>`:''}</summary><ul class="rt"><li class="muted">${K[x[1]][1]} · ${E(x[2])}</li>${x[4].map(t=>`<li>${E(t)}</li>`).join('')}<li>${x[5].map(src).join(' ')}</li></ul></details>`).join('')}</details>`).join('');
 return acc('작년·올해 비교로 본 월별 할 일','2025·2026',`<div class="muted" style="margin:4px 0 8px"><span class="yb yb-r">매년</span> 매년 하는 일 <span class="yb yb-n">올해만</span> 올해만 <span class="yb yb-o">작년만</span> 작년만 <span class="yb yb-p">교육계획서</span> 교육계획서에만 <span class="yb yb-t">2026년 한시</span> 2026년에만<br>2025·2026 교육계획서 월별 일정, 작년과 올해 기안 본문(목적·대상·행사), 월중계획을 비교해 같은 일은 한 줄로 묶었어요. 달이 바뀐 일은 ‘작년 ○월 → 올해 ○월’로 표시해요. 버튼을 누르면 근거 기안 본문이 열려요.</div>${mo}`,true);}
function acc(title,count,inner,open,grp='ac'){return `<details class="ac" name="${grp}" ${open?'open':''}><summary><span style="flex:1">${title}</span><span class="cv">▾</span></summary><div class="ab">${inner}</div></details>`;}
function toggleDr(o){document.body.classList.toggle('dro',o);}
function drawer(){const roles=DB.HEADS.filter(h=>DB.R[h.id]).map(h=>`<button class="${ST.role===h.id?'on':''}" onclick="useRole('${h.id}');toggleDr(false);render()"><span>${E(h.name)}</span></button>`).join('');
 const tabs=[['cal','🗓️','월별 달력'],['task','📂','업무 상세'],['todo','✅','이번 달 할 일'],['search','🔎','검색']].map(([k,i,l])=>`<button class="${ST.tab===k?'on':''}" onclick="ST.tab='${k}';toggleDr(false);render();scrollTo(0,0)"><span>${i}</span><span>${l}</span></button>`).join('');
 const yrs=[2026,2025].map(y=>`<button class="${ST.yr===y?'on':''}" onclick="ST.yr=${y};toggleDr(false);render()">${y}학년도</button>`).join('');
 const tasks=T().map(x=>`<button class="${ST.tab==='task'&&x.name===ST.task?'on':''}" onclick="ST.task='${x.name}';ST.tab='task';toggleDr(false);render();scrollTo(0,0)"><span>${E(x.name)}</span></button>`).join('');
 return `<div id="dbk" onclick="toggleDr(false)"></div><nav id="dr" aria-label="메뉴"><div class="row" style="justify-content:space-between;margin-bottom:6px"><b>☰ 메뉴</b><button class="x" onclick="toggleDr(false)" aria-label="닫기">✕</button></div>
 <div class="seg"><button class="${ST.kind!=='gen'?'on':''}" onclick="ST.kind='head';toggleDr(false);go('list')">부장 업무</button><button onclick="ST.kind='gen';toggleDr(false);go('list')">일반 업무</button></div>
 <h4>부장 고르기</h4><div class="dl">${roles}</div><h4>화면</h4><div class="dl">${tabs}</div><h4>학년도</h4><div class="seg">${yrs}</div><h4>업무 목록</h4><div class="dl">${tasks}</div>
 <button class="k2" onclick="toggleDr(false);go('home')">🏠 처음 화면</button></nav>`;}
function go(v){ST.view=v;render();scrollTo(0,0);}
function init(){render();}
function render(){const _mb=document.querySelector('.months');const _sl=_mb?_mb.scrollLeft:null;tipN=0;for(const k in TIPS)delete TIPS[k];$('#tip').style.display='none';openTip=null;
 $('#app').innerHTML=ST.view==='home'?vHome():ST.view==='list'?vList():vWork();const mb=document.querySelector('.months');if(mb){if(_sl!=null)mb.scrollLeft=_sl;const on=mb.querySelector('button.mon.on');if(on){const l=on.offsetLeft-mb.clientWidth/2+on.offsetWidth/2;if(on.offsetLeft<mb.scrollLeft||on.offsetLeft+on.offsetWidth>mb.scrollLeft+mb.clientWidth||_sl==null)mb.scrollLeft=l;}}}

// ---------- Home
function vHome(){return hero('업무 길잡이','부장 업무인지 일반 업무인지 먼저 골라 주세요.','처음 화면','먼저 <b>부장 업무</b>와 <b>일반 업무</b> 중 하나를 고르세요. 그다음 업무 이름을 누르면 <b>월별 달력, 업무 설명, 이번 달 할 일</b>을 볼 수 있어요. 화면 색은 오늘 날짜의 계절에 맞춰 바뀌고, 업무 안에서는 고른 달의 계절로 바뀌어요.')+
`<div class="wrap"><div class="choice">
<button class="big" onclick="ST.kind='head';go('list')"><span class="bi">🧭</span><b>부장 업무</b><span class="muted">교육연구부장, 교무자치부장처럼 부서를 이끄는 업무</span><span class="chip">부서를 이끄는 부장님용</span></button>
<button class="big" onclick="ST.kind='gen';go('list')"><span class="bi">📋</span><b>일반 업무</b><span class="muted">업무분장표에서 선생님이 맡은 담당 업무</span><span class="chip">담당 업무를 맡은 선생님용</span></button>
</div><p class="muted" style="margin-top:16px">기준: 2026학년도 업무분장표(2026.9.1.) · 교사 업무만 담았어요.</p></div>`;}
// ---------- List
function vList(){const head=ST.kind==='head';
 const items=head?DB.HEADS.map(h=>{const ok=!!DB.R[h.id];return `<button class="role" ${ok?`onclick="useRole('${h.id}');ST.tab='cal';go('work')"`:'disabled'}><span style="flex:1"><b>${E(h.name)}</b><br><span class="muted">${E(h.desc||h.tasks.slice(0,4).join(', '))}</span></span>${ok?'<span class="chip">열기 →</span>':''}</button>`}).join('')
 :(()=>{const by={};DB.GEN.forEach(g=>(by[g.dept]=by[g.dept]||[]).push(g));return Object.entries(by).map(([d,gs])=>`<div class="card" style="margin-bottom:12px"><h3 style="margin-bottom:8px">${E(d)}</h3>${gs.map(g=>`<button class="role" onclick="useRole('${g.id}');ST.tab='cal';go('work')"><span style="flex:1"><b>${E(g.task)}</b><br><span class="muted">${E(g.desc||g.owner)}</span></span><span class="chip">열기 →</span></button>`).join('')}</div>`).join('')})();
 return hero(head?'부장 업무 고르기':'일반 업무 고르기',head?'부장 업무를 골라 주세요.':'업무를 골라 주세요.','업무 목록',head?'업무분장표에 나온 <b>부장 업무</b>예요. 부장 이름을 누르면 그 부장의 월별 달력, 업무 상세, 이번 달 할 일이 열려요.':'업무분장표의 <b>교사 담당 업무</b>를 부서별로 모았어요. 업무 이름을 누르면 월별 달력과 기안 목록이 열려요. 업무지원 실무사, 행정실, 영양, 보건, 상담 업무는 넣지 않았어요.')+`<div class="wrap">${items}</div>`;}
// ---------- Work (research head)
const T=()=>DB.TASKS;
const ti=n=>'';
const yrOf=d=>{const y=+d.slice(0,4),m=mon(d);return m>=3?y:y-1};
const RC=g=>g.once?`<span class="chip" style="background:#fde68a;color:#7c4a03;font-size:16px;padding:1px 6px" title="2026년에만 한 일이에요. 매년 하는 일이 아니에요.">2026년 한시 · ${E(g.once)}</span> `:'';
const TY={wp:['📅','학교 행사 일정 (월중계획)','ty-wp'],gi:['✍️','우리 학교가 만든 문서 (기안)','ty-gi'],rc:['📥','다른 기관에서 받은 공문','ty-rc']};
const tyc=k=>`<span class="tyc ${TY[k][2]}">${TY[k][0]} ${TY[k][1]}</span>`;
const LEGEND=`<div class="legend"><b>표시 보는 법</b>${tyc('wp')}<span class="lg">학교 월중계획 표에 적힌 행사와 날짜예요.</span>${tyc('gi')}<span class="lg">우리 학교 선생님이 직접 써서 결재받은 문서예요. ‘기안’이라고 불러요.</span>${tyc('rc')}<span class="lg">교육청이나 다른 기관에서 보내온 공문이에요. 참고만 하면 돼요.</span><span class="lg"><span class="chip s2">앞으로 할 일</span> 아직 날짜가 오지 않은 일이에요(‘예정’).</span></div>`;
const wpTL=(l,n=3)=>{const it=l.slice().sort((a,b)=>a.d-b.d).map(x=>`<div class="tl"><span class="dt">${x.d?`${x.m}.${x.d}<small>${E(x.w)}</small>`:'매월'}</span><span class="dot"></span><span class="tt">${E(x.t)}</span></div>`);return `<div class="tlw">${more(it,n)}</div>`;};
const rcvAcc=(l,open)=>l.length?`<details class="ac" style="margin-top:8px" ${open?'open':''}><summary><span style="flex:1">${tyc('rc')} <span class="muted">참고용</span></span><span class="cv">▾</span></summary><div class="ab"><p class="muted" style="margin:0 0 6px">교육청이나 다른 기관에서 보내온 공문이에요. 우리 학교가 직접 만든 문서는 위에 있어요.</p>${more(l.map(g=>gi(g,1)),3)}</div></details>`:'';
function gi(g,short){if(g.pend||g.nb)return `<div class="gi" style="cursor:default"><div class="t">${RC(g)}${E(short?g.title.slice(0,60):g.title)}</div><div class="muted">${g.date} · No.${g.no}${g.sched?' · <span class="chip s2">예정</span>':''}</div></div>`;if(g.priv)return `<div class="gi" style="cursor:default"><div class="t">${E(g.title)}</div><div class="muted">${g.date} · No.${g.no}</div><div class="lock">🔒 비공개 – 담당자에게 직접 문의</div></div>`;
 return `<div class="gi" onclick="openG('${g.yr}','${g.no}')"><div class="t">${E(short?g.title.slice(0,60):g.title)}</div><div class="muted">${g.date} · No.${g.no} · 본문 보기 ›</div></div>`;}
function openG(yr,no){const g=DB.G.find(x=>x.yr==yr&&x.no==no);$('#mdh').innerHTML=`<div class="row" style="gap:6px"><span class="chip">${g.yr}학년도</span><span class="chip s2">${E(g.task)}</span></div><h3 style="margin-top:6px">${E(g.title)}</h3><div class="muted">기안일 ${g.date} · No.${g.no}${g.att?' · 붙임: '+E(g.att):''}</div>`;
 let b=E(g.body||'');if(ST.q.trim())b=hl(b,ST.q.trim());if(g.basis_match==='filing_body_rechecked'){const ev=g.matching_evidence||{};b='<div class="card" style="margin-bottom:12px;white-space:normal"><b>업무 연결 근거</b><p>'+E(g.basis_source)+' · '+E(ev.reason||'')+'</p><p>교육계획서: '+E((ev.plan_section_titles||[]).join(', ')||'직접 대응하는 절 미확인')+'</p></div>'+b;}if(g.img)b+=`<div style="margin-top:14px"><button class="chip" style="cursor:pointer;border:0" onclick="this.outerHTML='<div class=&quot;muted&quot; style=&quot;margin-top:8px&quot;>${E(E(g.title)).replace(/'/g,'&amp;#39;')} · 문서번호 ${g.no}</div><img src=&quot;img/${g.img==2?'y25_':''}${g.no}.webp&quot; alt=&quot;기안 화면(이름 가림)&quot; style=&quot;width:100%;margin-top:6px;border:1px solid #ddd;border-radius:8px&quot;>'">🖼️ 기안 화면 보기 (이름 가림)</button></div>`;$('#mdb').innerHTML=b;$('#md').style.display='flex';document.body.style.overflow='hidden';}
function closeMd(){$('#md').style.display='none';document.body.style.overflow='';}
addEventListener('keydown',e=>{if(e.key==='Escape')closeMd()});
function hl(s,q){const re=new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi');return s.replace(re,m=>`<mark>${m}</mark>`);}
function ficon(n){const e=(n.split('.').pop()||'').toLowerCase();return ({hwp:['HWP','#2b7de9'],hwpx:['HWP','#2b7de9'],pdf:['PDF','#e5484d'],xlsx:['XLS','#1d8f4e'],xls:['XLS','#1d8f4e'],pptx:['PPT','#e0702b'],docx:['DOC','#2b5ce9'],jpg:['IMG','#9b59b6'],png:['IMG','#9b59b6']})[e]||[e.slice(0,3).toUpperCase()||'FILE','#8a94a6'];}
function fr(f){const [l,c]=ficon(f.n);return `<div class="fr"><span class="ft" style="background:${c}">${l}</span><div style="min-width:0"><span>${E(f.n)}</span><div class="muted">${f.yr?f.yr+'학년도':''}${f.date?' · '+E(f.date):''}${f.ty?' · '+E(f.ty):''}</div></div></div>`;}
const isPlanLike=t=>/결과|정산|보고서/.test(t);
function plans(task){ // 2026 예정 items: last year's 결과/정산 not yet done this year
 const done=DB.G.filter(g=>g.yr===2026&&(!task||g.task===task));
 return DB.G.filter(g=>g.yr===2025&&(!task||g.task===task)&&isPlanLike(g.title)&&MO.indexOf(mon(g.date))>=MO.indexOf(10)).filter(g=>!done.some(d=>isPlanLike(d.title)&&d.task===g.task&&mon(d.date)>=mon(g.date)));}
function vWork(){const S=setTheme(ST.m);
 const tabs=[['cal','🗓️ 월별 달력'],['task','📂 업무 상세'],['todo','✅ 이번 달 할 일'],['search','🔎 검색']].map(([k,l])=>`<button class="${ST.tab===k?'on':''}" onclick="ST.tab='${k}';render()">${l}</button>`).join('');
 const body=ST.tab==='cal'?vCal():ST.tab==='task'?vTask():ST.tab==='todo'?vTodo():vSearch();
 const H={cal:[`${ST.m}월, 주리가 알려주는 ${RL().short} 업무`,`${S.n} · ${ST.yr}학년도 · ${RL().label}`],task:[`업무 상세 · ${ST.task}`,'분장표 내용, 1년 흐름, 2년치 기안, 드라이브 자료'],todo:[`이번 달 할 일 · ${ST.m}월`,'학교 행사 일정과 작년 이맘때 만든 문서로 만든 체크리스트'],search:['기안 검색','제목·문서번호·본문에서 찾아요']}[ST.tab];
 return bar(H[0],H[1],`${RL().label} 화면`,`${ST.role==='research'?S.greet:''}<br>왼쪽 위 <b>☰ 메뉴</b>에서 <b>월별 달력</b>(달마다 한 일), <b>업무 상세</b>(업무별 설명과 기안), <b>이번 달 할 일</b>(작년 기준 체크리스트), <b>검색</b>을 고를 수 있어요. 달을 바꾸면 화면 색도 계절에 맞게 바뀌어요.`)+drawer()+`<div class="wrap">${RL().note?`<div class="pend" style="margin:0 0 12px">${E(RL().note)}</div>`:''}${body}</div>`;}
function monthBar(){const yrs=[2026,2025].map(y=>`<button class="${ST.yr===y?'on':''}" onclick="ST.yr=${y};render()">${y}학년도</button>`).join('');
 const ms=MO.map(m=>{const n=DB.G.filter(g=>!g.rc&&g.yr===ST.yr&&mon(g.date)===m).length;return `<button class="mon ${ST.m===m?'on':''}" onclick="ST.m=${m};render()">${m}월<small>${n?'●':'·'}</small></button>`}).join('');
 return `<div class="months">${ms}</div>`;}
const rkey=t=>t.replace(/\[[^\]]*\]|\([^)]*\)|「|」|『|』|<|>/g,'').replace(/\d{4}\s*(학년도|년도|년|회계연도)?|\d+\s*(월|학기|차|분기|학년|반|회)|[0-9.~:\-]+/g,'').replace(/\s+/g,' ').trim().slice(0,22);
function rep(rs){const seen=new Set(),out=[];[...rs].sort((a,b)=>(b.body?1:0)-(a.body?1:0)||a.date.localeCompare(b.date)).forEach(g=>{const k=rkey(g.title);if(!seen.has(k)){seen.add(k);out.push(g)}});return out.sort((a,b)=>a.date.localeCompare(b.date));}
function vCal(){const m=ST.m,main=DB.G.filter(g=>g.yr===ST.yr&&mon(g.date)===m),ref=DB.G.filter(g=>g.yr===ST.yr-1&&mon(g.date)===m);
 const wp=ST.yr===2026?DB.WP.filter(x=>x.m===m):[];const by={},bw={};main.forEach(g=>(by[g.task]=by[g.task]||[]).push(g));wp.forEach(x=>(bw[x.task]=bw[x.task]||[]).push(x));
 const tasks=T().map(t=>t.name).filter(t=>by[t]||bw[t]);
 let cards=tasks.map((t,ci)=>{const all=(by[t]||[]).sort((a,b)=>a.date.localeCompare(b.date));const rs=all.filter(g=>!g.rc),rv=all.filter(g=>g.rc),ws=bw[t]||[];const rf=rep(ref.filter(r=>r.task===t&&!r.rc)).slice(0,2);
  const fs=DB.D.filter(f=>f.task===t&&f.yr===ST.yr&&f.date&&mon(f.date+'-01')===m).slice(0,3);
  const d=(T().find(x=>x.name===t)||{}).desc;const sum=[ws.length?'행사':'',rs.length?'만든 문서':'',rv.length?'받은 공문':''].filter(Boolean).join(' · ')+' 있어요';
  return `<details class="card cc" name="cal" ${ci===0?'open':''}><summary class="row"><span style="font-size:20px">${ti(t)}</span><span style="flex:1;min-width:0"><b class="ct">${E(t)}</b><span class="cs">${sum}</span></span><span class="cv">▾</span></summary>${(()=>{const X=T().find(x=>x.name===t)||{};const fl=(X.flow||[]).filter(f=>+f[0]===m);return (X.about?`<p class="desc">${E(X.about.split('. ')[0].replace(/\.?$/,'.'))}</p>`:(d&&d.length?`<p class="desc">${E(d[0])}</p>`:''))})()}
  ${ws.length?`<div class="sec">${tyc('wp')}${wpTL(ws)}</div>`:''}
  <div class="sec">${tyc('gi')}${rs.length?more(rep(rs).map(g=>gi(g,1)),3):'<p class="muted">이 달에 우리 학교가 만든 문서는 없어요.</p>'}</div>${rcvAcc(rv)}
  ${rf.length?`<div class="sec ly"><span class="chip s2">작년 같은 달에 만든 문서</span>${rep(rf).map(g=>gi(g,1)).join('')}</div>`:''}${fs.length?`<div class="sec"><span class="chip">구글 드라이브 자료</span>${fs.map(fr).join('')}</div>`:''}<button class="mb" onclick="ST.task='${E(t)}';ST.tab='task';render();scrollTo(0,0)">이 업무 자세히 보기 ›</button></details>`}).join('');
 if(ST.yr===2026&&MO.indexOf(m)>MO.indexOf(10)){const pl=ref.filter(g=>!g.rc).slice(0,8);cards+=`<div class="card"><div class="row"><span style="font-size:20px">🗓️</span><b style="flex:1">${m}월에 할 일 (작년 이맘때 기준)</b><span class="chip s2">앞으로 할 일</span></div><p class="muted">작년 ${m}월에 만든 문서를 보고 올해 할 일을 짐작했어요.</p>${pl.length?more(pl.map(g=>`<div class="plan">${E(g.title)}<div class="muted">작년 ${g.date}</div></div>`),3):'<p class="muted">작년 이 달에는 만든 문서가 없었어요.</p>'}</div>`;}
 if(!cards)cards=`<div class="card" style="text-align:center;padding:30px">${J(90,'일이 없는 달','이 달에는 행사도, 만든 문서도 없어요. 방학이거나 일이 적은 달일 수 있어요. 위에서 <b>다른 달</b>이나 <b>다른 학년도</b>를 눌러 보세요.')}<h3 style="margin-top:8px">이 달에는 할 일이 없어요</h3></div>`;
 return monthBar()+`<div class="row" style="margin:6px 0 8px">${J(54,`${m}월 달력 보는 법`,`업무마다 이 달에 있는 일을 세 가지로 나눠 보여 줘요.<br>${tyc('wp')} 학교 월중계획 표에 적힌 행사와 날짜<br>${tyc('gi')} 우리 학교 선생님이 써서 결재받은 문서(‘기안’)<br>${tyc('rc')} 교육청·다른 기관에서 보내온 공문(참고용)<br>‘앞으로 할 일’은 아직 날짜가 오지 않은 일(‘예정’)이에요. 업무 이름을 누르면 펼쳐지고, 문서 제목을 누르면 내용이 열려요.`)}<h2>${m}월 ${RL().label} 업무</h2></div>${LEGEND}<div class="grid">${cards}</div>`;}
function vTask(){const t=ST.task,TT=T().find(x=>x.name===t)||T()[0];
 const left=T().map(x=>`<button class="${x.name===t?'on':''}" onclick="ST.task='${x.name}';render()"><span>${E(x.name)}</span></button>`).join('');
 const rs=DB.G.filter(g=>g.task===t);const c={};rs.filter(g=>!g.rc).forEach(g=>c[mon(g.date)]=(c[mon(g.date)]||0)+1);const mx=Math.max(1,...Object.values(c));
 const bars=MO.map(m=>`<div><i style="height:${4+(c[m]||0)*52/mx}px;background:${c[m]?SEA[season(m)].acc:'#0001'}"></i>${m}월</div>`).join('');
 const col=y=>{const all=rs.filter(g=>g.yr===y);const rv=all.filter(g=>g.rc).sort((a,b)=>a.date.localeCompare(b.date));const l=all.filter(g=>!g.rc).sort((a,b)=>a.date.localeCompare(b.date));const pl=y===2026?plans(t):[];
  return acc(`${y}학년도 기안`,`${pl.length?'앞으로 할 일 있음':''}`,(DB.G.some(g=>g.task===ST.task&&g.once)?'<div class="muted" style="margin:2px 0 6px"><span class="yb yb-t">2026년 한시</span> = 2026년에만 한 일(6학년 생존수영·하이다이빙 신청 등). 매년 하는 일이 아니에요.</div>':'')+(l.length?more(l.map(g=>gi(g)),5):'<p class="muted">우리 학교가 만든 기안이 없어요.</p>')+rcvAcc(rv)+pl.map(g=>`<div class="plan"><b>예정</b> · ${E(g.title.replace(/2025/g,'2026'))}<div class="muted">작년 ${g.date} 기안 기준 · 아직 할 때가 아니에요</div></div>`).join(''))};
 const fs=DB.D.filter(f=>f.task===t).sort((a,b)=>b.yr-a.yr||(b.date||'').localeCompare(a.date||''));const fy={};fs.forEach(f=>{const k=(ST.role==='science'&&f.yr<2024)?'old':f.yr;(fy[k]=fy[k]||[]).push(f)});
 const fsTop=Object.keys(fy).filter(k=>k!='old').sort().reverse()[0];const fhtml0=Object.keys(fy).sort((a,b)=>(a=='old')-(b=='old')||b-a).map(y=>`<details name="drv" ${y==fsTop&&innerWidth>760?'open':''}><summary style="cursor:pointer;font-weight:700;padding:6px 0">${y=='old'?'예전 자료(참고, 2023학년도 이전)':y==0?'날짜 없음':y+'학년도'}</summary><div>${more(fy[y].slice(0,40).map(fr),5)}</div>${fy[y].length>40?`<p class="muted">나머지는 드라이브 폴더에서 볼 수 있어요.</p>`:''}</details>`).join('');
 const fhtml=fhtml0.replace(/<details open>/g,'<details>');
 return `<div class="card"><div class="row"><h2 style="flex:1;font-size:18px">${E(t)}</h2><span class="chip s2">${RL().label}</span>${J(44,'업무 상세','각 칸을 누르면 펼쳐져요. <b>분장표</b>는 업무분장표 내용, <b>1년 흐름</b>은 몇 월에 기안이 많았는지, 아래에 <b>2025·2026학년도 기안</b>과 <b>드라이브 자료</b>가 있어요. 다른 업무는 왼쪽 위 <b>☰ 메뉴</b>에서 고르세요. 점선 상자는 아직 때가 안 된 <b>예정</b> 일이에요.')}</div>
 <div class="tchips">${T().map(x=>`<button class="${x.name===t?'on':''}" onclick="ST.task='${x.name}';render()">${E(x.name)}</button>`).join('')}</div></div>
 <div class="acs">${planHtml(TT)}${refHtml(TT)}${(TT.about||(TT.flow||[]).length)?acc('처음 맡았다면 · 이렇게 해요',TT.about?'계획서·기안 기준':'기안·월중계획 기준',`${TT.about?`<p class="about">${E(TT.about)}</p>`:''}${(TT.flow||[]).length?`<h4 class="fh">월별 흐름 (실제 기안·월중계획)</h4><div class="flow">${TT.flow.map(f=>`<div class="flr${+f[0]===new Date().getMonth()+1?' now':''}"><span class="fm">${f[0]}월</span><span>${E(f[1])}</span></div>`).join('')}</div>`:''}${(TT.forms||[]).length?`<h4 class="fh">미리 챙기면 좋은 빈 양식</h4><div>${TT.forms.map(x=>`<span class="chip">${E(x)}</span>`).join(' ')}</div>`:''}<div class="muted">설명은 2026 학교교육계획서·업무분장표, 흐름은 2026 월중계획과 우리 학교 기안 제목이에요.</div>`,!TT.ref):''}
 ${acc('분장표 · 이 업무는',TT.desc.length+'항목',`<div style="line-height:1.85">${TT.desc.map(d=>'◾'+E(d)).join('<br>')}</div><div class="muted">2026 업무분장표 · ${RL().dept}</div>`,!(TT.about||(TT.flow||[]).length))}
 ${acc('1년 흐름',rs.length+'건',`<div class="bars">${bars}</div>`)}
 ${col(2025)}${col(2026)}
 ${acc('드라이브 자료',fs.length+'개',`<div class="row" style="margin-bottom:4px">${J(36,'드라이브 자료','이 업무와 관련된 <b>학교 드라이브 파일의 이름</b>이에요. 개인정보 보호를 위해 파일은 열리지 않고 이름만 보여 줘요. 필요하면 학교 드라이브에서 찾아 주세요.')}</div>${fhtml||'<p class="muted">연결된 파일이 없어요.</p>'}`)}</div>`;}
function vTodo(){const m=ST.m;
 const blk=(m,title)=>{const r25=DB.G.filter(g=>!g.rc&&g.yr===2025&&mon(g.date)===m),r26=DB.G.filter(g=>!g.rc&&g.yr===2026&&mon(g.date)===m);const bt={};r25.forEach(g=>(bt[g.task]=bt[g.task]||[]).push(g));
  const future=MO.indexOf(m)>MO.indexOf(10);
  const out=more(Object.entries(bt).sort((a,b)=>b[1].length-a[1].length).map(([t,rs])=>{const done=r26.some(x=>x.task===t);return `<div class="chk"><div class="box ${done?'on':''}">${done?'✓':''}</div><div style="flex:1;min-width:0"><div class="row" style="gap:6px"><span>${ti(t)}</span><b style="${done?'text-decoration:line-through;opacity:.6':''}">${E(t)}</b>${done?'<span class="chip s2">올해 문서 만듦</span>':future?'<span class="chip gray">앞으로 할 일</span>':''}</div>${rs.slice(0,2).map(g=>`<div class="muted" style="margin-top:3px;cursor:pointer" onclick="${g.priv||g.pend||g.nb?'':`openG(2025,'${g.no}')`}">📎 작년 참고: ${E(g.title)} (${g.date.slice(5).replace('-','.')})</div>`).join('')}</div></div>`}),5)||'<p class="muted" style="text-align:center;padding:16px">작년 이 달에는 기안이 없었어요.</p>';
  const wq=DB.WP.filter(x=>x.m===m).sort((a,b)=>a.d-b.d);const wph=wq.length?`<div class="sec">${tyc('wp')}${more(wq.map(x=>`<div class="chk"><div class="box"></div><div style="flex:1;min-width:0"><b class="tt2">${E(x.t)}</b><div class="muted">${x.d?`${x.m}월 ${x.d}일 (${E(x.w)})`:'매월 하는 일'} · ${E(x.task)}</div></div></div>`),3)}</div>`:'';
  return `<details class="card cc" name="todo" ${m===ST.m?'open':''}><summary class="row">${J(48,'할 일 체크리스트',`맨 위는 <b>학교 행사 일정(월중계획)</b>이에요. 그 아래는 작년 ${m}월에 만든 문서(기안)를 보고 뽑은 <b>올해 ${m}월에 할 일</b>이에요. 올해 같은 업무로 기안을 올렸으면 <b>✓ 체크</b>돼요. 아직 오지 않은 달은 <b>예정</b>으로 표시돼요. 📎 작년 참고를 누르면 그 기안 본문이 열려요.`)}<h3 style="flex:1">${title}</h3><span class="cv">▾</span></summary>${wph}<div class="sec">${tyc('gi')}<p class="muted" style="margin:2px 0">작년 이 달에 만든 문서를 보고 뽑은 할 일이에요. 올해도 만들었으면 ✓ 표시돼요.</p>${out}</div></details>`;};
 const nx=MO[(MO.indexOf(m)+1)%12];
 return monthBar()+`<div class="two">${blk(m,`${SEA[season(m)].fx} ${m}월 할 일`)}${blk(nx,`다가오는 일 · ${nx}월`)}</div>`;}
function vSearch(){return `<div class="card"><div class="row" style="margin-bottom:10px">${J(46,'검색','찾고 싶은 낱말을 넣으면 <b>2025·2026학년도 기안의 제목·문서번호·본문</b>에서 찾아요. 예를 들어 <b>학교평가</b>, <b>공개수업</b>, <b>시수</b>를 넣어 보세요. 결과를 누르면 본문이 열리고, 찾은 낱말은 노랗게 표시돼요.')}<b>제목·본문 검색</b></div><input class="q" id="q" value="${E(ST.q)}" placeholder="예: 학교평가, 공개수업, 시수" oninput="ST.q=this.value;doSearch()"><div class="row" style="gap:6px;margin-top:8px">${[['all','전체'],['prod','기안한 공문'],['rcv','받은 공문']].map(([k,l])=>`<button class="chip ${(ST.sf||'prod')===k?'':'gray'}" style="border:0;cursor:pointer" onclick="ST.sf='${k}';render()">${l}</button>`).join('')}</div></div><div id="res" style="margin-top:14px"></div>`;}
function doSearch(){const q=ST.q.trim().toLowerCase(),el=$('#res');if(!el)return;if(q.length<1){el.innerHTML='';return;}
 const sf=ST.sf||'prod';const r=DB.G.filter(g=>(sf==='all'||(sf==='rcv')===!!g.rc)).filter(g=>g.title.toLowerCase().includes(q)||String(g.no)===q.replace(/^(no\.?|제|문서번호)\s*/,'').replace(/^[^0-9]*-/,'').replace(/호$/,'')||(g.body||'').toLowerCase().includes(q)).sort((a,b)=>b.date.localeCompare(a.date));
 el.innerHTML=`<p class="muted">${r.length}건 찾았어요</p><div class="card">`+r.slice(0,150).map(g=>{let snip='';if(g.body){const i=g.body.toLowerCase().indexOf(q);if(i>=0)snip=hl(E(g.body.slice(Math.max(0,i-40),i+80).replace(/\s+/g,' ')),ST.q.trim());}
  return `<div class="gi" onclick="${g.priv||g.pend||g.nb?'':`openG(${g.yr},'${g.no}')`}"><div class="row" style="gap:6px"><span class="chip ${g.yr===2025?'s2':''}">${g.yr}</span><span class="t">${RC(g)}${hl(E(g.title),ST.q.trim())}</span></div><div class="muted">${g.date} · ${E(g.task)}</div>${g.pend||g.nb?(g.sched?'<span class="chip s2">예정</span>':''):g.priv?'<div class="lock">🔒 비공개 – 담당자에게 직접 문의</div>':snip?`<div class="muted" style="margin-top:3px">…${snip}…</div>`:''}</div>`}).join('')+'</div>';}
const _r=render;render=function(){_r();if(ST.view==='work'&&ST.tab==='search')doSearch();};

// ---- 가로 스크롤 줄: 마우스 휠·화살표·끝 흐림·선택 항목 보이기 (10-26)
(function(){
const SEL='.tchips,.months,.tl';
function ov(el){return el.scrollWidth>el.clientWidth+2;}
function upd(w){const el=w.querySelector(':scope>.hsc');if(!el)return;const o=ov(el);
 w.classList.toggle('hs-l',o&&el.scrollLeft>2);w.classList.toggle('hs-r',o&&el.scrollLeft+el.clientWidth<el.scrollWidth-2);}
function wrap(el){if(el.parentElement&&el.parentElement.classList.contains('hsw'))return;
 const cs=getComputedStyle(el);if(cs.overflowX!=='auto'&&cs.overflowX!=='scroll')return;
 const w=document.createElement('div');w.className='hsw';el.parentNode.insertBefore(w,el);w.appendChild(el);el.classList.add('hsc');
 const mk=(c,t,d)=>{const b=document.createElement('button');b.type='button';b.className='hsa '+c;b.textContent=t;b.setAttribute('aria-label',d>0?'오른쪽으로':'왼쪽으로');
  b.onclick=e=>{e.stopPropagation();el.scrollBy({left:d*el.clientWidth*0.7,behavior:'smooth'})};w.appendChild(b);};
 mk('hl','‹',-1);mk('hr','›',1);
 el.addEventListener('scroll',()=>upd(w),{passive:true});
 el.addEventListener('wheel',e=>{if(!ov(el)||Math.abs(e.deltaX)>Math.abs(e.deltaY))return;
  const atL=el.scrollLeft<=0,atR=el.scrollLeft+el.clientWidth>=el.scrollWidth-1;
  if((e.deltaY<0&&atL)||(e.deltaY>0&&atR))return;
  e.preventDefault();el.scrollLeft+=e.deltaY;},{passive:false});
 const on=el.querySelector('.on');if(on){const l=on.offsetLeft-el.clientWidth/2+on.offsetWidth/2;if(on.offsetLeft<el.scrollLeft||on.offsetLeft+on.offsetWidth>el.scrollLeft+el.clientWidth)el.scrollLeft=Math.max(0,l);}
 requestAnimationFrame(()=>upd(w));}
function scan(){document.querySelectorAll(SEL).forEach(wrap);document.querySelectorAll('.hsw').forEach(upd);}
new MutationObserver(()=>requestAnimationFrame(scan)).observe(document.body,{childList:true,subtree:true});
addEventListener('resize',scan);addEventListener('load',scan);setTimeout(scan,300);
})();
