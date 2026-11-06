/* Primary responsibilities first. Supporting documents never establish completion. */
const taskLabel=t=>t.display_name||t.name;
const basisList=xs=>xs.length?`<ul>${xs.map(x=>`<li>${E(x)}</li>`).join('')}</ul>`:'';
const basisTask=name=>T().find(t=>t.name===name);
const basisOpen=name=>{ST.task=name;ST.tab='task';render();scrollTo(0,0);};
// Document filtering using work-catalog document_keys (authoritative source)
const docKey=g=>`${g.yr}:${g.no}`;
const taskHasDoc=(t,g)=>t.document_keys&&t.document_keys.includes(docKey(g));
const docsForTask=t=>DB.G.filter(g=>taskHasDoc(t,g));
const filesForTask=t=>DB.D.filter(f=>f.task===t.name||(t.parent&&f.task===t.parent));

function primaryHtml(t){
  const b=t.basis;
  if(!b)return '<p class="muted">업무 기준을 확인하고 있습니다.</p>';
  const assignment=`<p class="muted">${E(b.assignment)} · ${b.page}쪽 · ${E(b.heading)}</p>${basisList(t.desc)}${b.note?`<p class="basis-note">${E(b.note)}</p>`:''}`;
  const plans=b.sections.length?b.sections.map((s,i)=>`<details class="basis-section" ${i===0?'open':''}><summary>${E(s.title)}</summary>${s.goal.length?`<h4>목적</h4>${basisList(s.goal)}`:''}${s.way.length?`<h4>운영 방침</h4>${basisList(s.way)}`:''}<p class="muted">${E(s.source||b.plan)}${s.page?' · '+E(s.page)+'쪽':''} · ${E(s.title)}</p></details>`).join(''):'<p class="muted">업무분장표에는 담당 업무가 있습니다. 교육계획서에서 직접 대응하는 절은 아직 확인하지 못했습니다.</p>';
  return acc('담당 업무 · 업무분장표','',assignment,true)+acc('운영 내용 · 교육계획서','',`${b.scope_note?`<p class="basis-note">${E(b.scope_note)}</p>`:''}${plans}`,false);
}
function primarySchedule(t,m,year=2026){
  return (t.plan_schedule||[]).filter(x=>x.y===year&&(m==null||x.m===m));
}
function planDatesHtml(items){return items.length?`<div class="basis-note"><b>교육계획서에 적힌 일정</b>${basisList(items.map(x=>x.t))}<p class="muted">연간 계획에 적힌 예정입니다. 월중계획과 실제 시행 문서에서 변경 여부를 확인하세요.</p></div>`:'';}
function scheduleHtml(items){return items.length?`<div class="basis-note"><b>월중계획</b>${basisList(items.map(x=>`${x.d?`${x.m}.${x.d} `:''}${x.t}`))}<p class="muted">월중계획에 기재된 예정입니다. 실제 실시 결과는 결과보고에서 확인하세요.</p></div>`:'';}
function evidenceEvents(task,month,year){
  const calendarYear=year+(month!=null&&month<=2?1:0);
  const from=month==null?`${year}-03-01`:`${calendarYear}-${String(month).padStart(2,'0')}-01`;
  const until=month==null?`${year+1}-03-01`:new Date(Date.UTC(calendarYear,month,1)).toISOString().slice(0,10);
  return DB.G.filter(g=>g.task===task).flatMap(g=>(g.verified_events||[]).map(e=>({...e,source:g}))).filter(e=>e.date<until&&(e.end_date||e.date)>=from);
}
function evidenceEventsHtml(items){return items.length?`<div class="basis-note"><b>본문에서 확인한 업무 시기</b><p class="muted">등록일과 구분한 일정입니다. 계획·안내와 결과 보고를 구분해 확인하세요.</p>${items.map(e=>`<p><b>${E(e.date)}${e.end_date&&e.end_date!==e.date?' ~ '+E(e.end_date):''}</b> · ${E(e.title)}<br><span class="muted">${E(e.status)}</span> <button class="chip" onclick="openG(${e.source.yr},'${E(e.source.no)}')">근거 ${e.source.yr}-${E(e.source.no)}</button></p>`).join('')}</div>`:'';}

function vTask(){
  const t=basisTask(ST.task)||T()[0];ST.task=t.name;
  // Documents: use document_keys from work-catalog (authoritative source)
  const docs=docsForTask(t);
  // Files: parent-level (no individual file keys yet)
  const files=filesForTask(t);
  const tabs=`<div class="tchips">${T().map(x=>`<button class="${x.name===t.name?'on':''}" data-basis-task="${E(x.name)}">${E(taskLabel(x))}</button>`).join('')}</div>`;
  const docGroups=[ST.yr].map(y=>{
    const rows=docs.filter(g=>g.yr===y);
    return acc(`${y}학년도 참고 기안·공문`,'',`<p class="muted">문서의 주제와 담당 업무를 대조해 모은 참고자료입니다. 실시 여부는 각 문서의 계획·결과 내용을 확인하세요.</p>${rows.length?more(rows.map(g=>gi(g)),5):'<p class="muted">연결된 문서가 없습니다.</p>'}`,false);
  }).join('');
  // Unassigned parent-level docs: docs with parent task name but not in ANY sibling's document_keys
  const parentTask=t.parent||t.name;
  const allSiblingKeys=new Set(T().filter(x=>x.parent===parentTask).flatMap(x=>x.document_keys||[]));
  const unassigned=DB.G.filter(g=>g.task===parentTask&&!allSiblingKeys.has(docKey(g)));
  const unassignedHtml=unassigned.length&&parentTask!==t.name?acc('세부 업무 미확인 자료','',`<p class="muted">이 담당의 상위 업무('${E(parentTask)}')에 속하지만 세부 업무가 확인되지 않은 문서입니다. 개별 문서의 내용을 직접 확인하세요.</p>${more(unassigned.filter(g=>g.yr===ST.yr).map(g=>gi(g)),5)}`,false):'';
  return `<div class="card"><h2>${E(taskLabel(t))}</h2><p class="muted">${E(RL().dept)} · 업무분장표와 교육계획서를 먼저 확인하세요.</p>${tabs}</div><div class="acs">${primaryHtml(t)}${acc('일정 · 계획과 시행 확인','',planDatesHtml(primarySchedule(t,null,ST.yr))+scheduleHtml((RL().WP||[]).filter(x=>x.y===ST.yr&&x.task===t.name))+evidenceEventsHtml(evidenceEvents(t.name,null,ST.yr))||'<p class="muted">현재 연결된 일정이 없습니다.</p>',false)}${docGroups}${unassignedHtml}${acc('참고파일 이름','',`<p class="muted">학교 원자료의 파일명입니다. 공개 화면에서는 원본을 열지 않습니다.</p>${files.length?more(files.map(fr),8):'<p class="muted">연결된 파일이 없습니다.</p>'}`,false)}</div>`;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-basis-task]');if(b)basisOpen(b.dataset.basisTask);});

function vCal(){
  const m=ST.m,y=ST.yr;
  const cards=T().map(t=>{
    const wp=(RL().WP||[]).filter(w=>w.y===y&&w.m===m&&w.task===t.name),ps=primarySchedule(t,m,y);
    // Use document_keys from work-catalog
    const docs=docsForTask(t).filter(g=>g.yr===y&&mon(g.date)===m);
    const events=evidenceEvents(t.name,m,y);
    if(!wp.length&&!ps.length&&!docs.length&&!events.length)return '';
    return `<details class="card cc"><summary><b>${E(taskLabel(t))}</b></summary>${planDatesHtml(ps)}${scheduleHtml(wp)}${evidenceEventsHtml(events)}${docs.length?`<h4>이 달에 등록된 참고 문서</h4><p class="muted">아래 날짜는 문서 등록일입니다. 행사일과 다를 수 있습니다.</p>${more(docs.map(g=>gi(g)),4)}`:''}<button class="mb" data-basis-task="${E(t.name)}">업무 기준과 운영 내용 보기</button></details>`;
  }).filter(Boolean);
  return monthBar()+`<div class="card"><h2>${y}학년도 ${m}월</h2><p class="muted">교육계획서의 예정, 월중계획, 문서 등록 이력을 구분합니다.</p></div><div class="grid">${cards.join('')||'<div class="card">현재 연결된 일정·문서가 없습니다. 업무 상세에서 담당 범위를 확인하세요.</div>'}</div>`;
}
function vTodo(){
  const m=ST.m,y=ST.yr;
  const blocks=T().map(t=>{
    const wp=(RL().WP||[]).filter(w=>w.y===y&&w.m===m&&w.task===t.name),ps=primarySchedule(t,m,y);
    const events=evidenceEvents(t.name,m,y);
    if(!wp.length&&!ps.length&&!events.length)return '';
    return `<details class="card cc"><summary><b>${E(taskLabel(t))}</b></summary>${planDatesHtml(ps)}${scheduleHtml(wp)}${evidenceEventsHtml(events)}<button class="mb" data-basis-task="${E(t.name)}">담당 업무 확인</button></details>`;
  }).filter(Boolean);
  return monthBar()+`<div class="card"><h2>${m}월 계획 확인</h2><p>교육계획서와 월중계획에 적힌 예정입니다. 실제 실시 결과는 결과보고에서 확인하세요.</p></div><div class="grid">${blocks.join('')||'<div class="card">확인된 계획 일정이 없습니다. 업무 상세에서 담당 범위와 교육계획서를 확인하세요.</div>'}</div>`;
}
function vWork(){
  const body=ST.tab==='cal'?vCal():ST.tab==='task'?vTask():ST.tab==='todo'?vTodo():vSearch();
  return bar(RL().label,'업무분장표 → 교육계획서 → 참고 기안·파일','업무 확인 순서','<b>업무 상세</b>에서 담당 범위와 운영 내용을 먼저 확인하세요. <b>월별 달력</b>은 계획과 문서 이력을 구분해 보여 줍니다.')+drawer()+`<div class="wrap">${yearPicker()}${body}</div>`;
}
function openG(yr,no){
  const g=DB.G.find(x=>x.yr==yr&&String(x.no)===String(no));
  if(!g){alert('현재 업무에서 해당 문서를 찾을 수 없습니다.');return;}
  $('#mdh').innerHTML=`<span class="chip">${g.yr}학년도 참고 문서</span><h3>${E(g.title)}</h3><p class="muted">등록일 ${E(g.date)} · 문서번호 ${E(g.no)}${g.att?' · 붙임: '+E(g.att):''}</p>`;
  const body=$('#mdb');body.textContent=g.body||'추출된 본문이 없습니다. 제목과 문서번호를 기준으로 원문을 확인하세요.';
  if(g.matching_evidence){const evidence=document.createElement('div');evidence.className='basis-note';evidence.textContent='업무 연결 근거: '+g.matching_evidence.reason;body.prepend(evidence);}
  if(g.body_note){const n=document.createElement('p');n.className='basis-note';n.textContent=g.body_note;body.append(n);}
  if(g.img){const button=document.createElement('button');button.className='chip';button.textContent='기안 화면 보기 (이름 가림)';button.onclick=()=>{const img=document.createElement('img');img.src=`img/${g.img==2?'y25_':''}${encodeURIComponent(g.no)}.webp`;img.alt='이름을 가린 기안 화면';img.style.cssText='width:100%;height:auto;margin-top:12px';button.replaceWith(img);};body.append(document.createElement('br'),button);}
  $('#md').style.display='flex';document.body.style.overflow='hidden';
}

// Retain the existing design and navigation; enter through the primary task details.
const originalList=vList;
vList=function(){return originalList().replaceAll("ST.tab='cal'","ST.tab='task'").replaceAll('생존수영</b>','체육강사관리·생존수영</b>');};
const originalDrawer=drawer;
drawer=function(){return originalDrawer().replaceAll('이번 달 할 일','이번 달 계획');};
const originalHome=vHome;
vHome=function(){return originalHome().replace('기준: 2026학년도 업무분장표(2026.9.1.) · 교사 업무만 담았어요.','기준: 2026.9.1. 업무분장표 · 학교교육계획서는 업무별로 확인한 판본과 쪽수를 표시합니다. 기안과 파일은 참고자료입니다.').replaceAll('이번 달 할 일','이번 달 계획');};
ST.m=seoulM();

const basisStyle=document.createElement('style');
basisStyle.textContent='.basis-note{background:#f2f6fb;border-left:3px solid #597da8;padding:12px 16px;border-radius:6px;margin:12px 0;word-break:keep-all}.basis-section{border-bottom:1px solid #e1e5ea;padding:12px 0}.basis-section summary{cursor:pointer;font-weight:700}.basis-section h4{margin:14px 0 6px}.basis-section ul{padding-left:1.3em}.basis-section li{margin:6px 0;word-break:keep-all;overflow-wrap:anywhere}.acs>.ac>.ab{max-height:65vh;overflow-y:auto}.tchips{position:sticky;top:0;z-index:2;background:var(--glass,#fff);padding:8px 0}#mdb{white-space:pre-wrap;overflow-wrap:anywhere}';
document.head.append(basisStyle);

function yearPicker(){return `<section class="year-picker" aria-label="학년도 선택"><div class="year-buttons">${[2026,2025].map(y=>`<button type="button" aria-pressed="${ST.yr===y}" onclick="ST.yr=${y};render()">${y}학년도${ST.yr===y?' · 선택됨':''}</button>`).join('')}</div><p>${ST.tab==='search'?'검색은 두 학년도 자료를 함께 찾습니다. 결과에 표시된 학년도를 확인하세요.':`${ST.yr}학년도 일정·참고 문서를 보고 있습니다. 담당 업무 기준은 최신 업무분장표입니다.`}</p></section>`;}
const yearStyle=document.createElement('style');yearStyle.textContent='.year-picker{margin:0 0 16px;padding:12px;background:#fff;border:1px solid #cbd5e1;border-radius:14px}.year-buttons{display:flex;gap:8px}.year-buttons button{flex:1;min-height:48px;padding:10px 12px;border:2px solid #94a3b8;border-radius:10px;background:#fff;color:#334155;font-size:18px;font-weight:700;cursor:pointer}.year-buttons button[aria-pressed="true"]{background:#244c82;border-color:#244c82;color:#fff}.year-buttons button:focus-visible{outline:3px solid #e89018;outline-offset:3px}.year-picker p{margin:8px 0 0;font-size:14px;color:#475569}';document.head.append(yearStyle);
