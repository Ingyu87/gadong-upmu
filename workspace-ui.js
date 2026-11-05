/* Keep source records intact; navigation follows current assignment owners. */
const workspaceTabs=[['cal','월별 업무'],['task','업무분장 · 교육계획서'],['todo','이번 달 계획'],['search','자료 검색']];
function roleOptions(){return Object.entries(DB.R).map(([id,r])=>{
 const owners=[...new Set(r.TASKS.flatMap(t=>t.owners||[]))].join(' · ');
 return `<option value="${E(id)}" ${id===ST.role?'selected':''}>${E(owners)} — ${E(r.label)}</option>`;
}).join('');}
function workspaceControls(){return `<section class="work-controls" aria-label="업무 선택">
 <div class="work-select"><label for="work-person">담당 업무</label><select id="work-person" onchange="useRole(this.value);ST.view='work';render()">${roleOptions()}</select></div>
 <div class="work-years" aria-label="학년도">${[2026,2025].map(y=>`<button aria-pressed="${ST.yr===y}" onclick="ST.yr=${y};render()">${y}학년도</button>`).join('')}</div>
 <nav class="work-tabs" aria-label="업무 화면">${workspaceTabs.map(([id,label])=>`<button aria-pressed="${ST.tab===id}" onclick="ST.tab='${id}';ST.view='work';render()">${label}</button>`).join('')}</nav>
 <div class="work-months" aria-label="월 선택">${MO.map(m=>`<button aria-pressed="${ST.m===m}" onclick="ST.m=${m};render()">${m}월</button>`).join('')}</div>
 <p class="muted">${ST.yr}학년도 · ${ST.m<=2?ST.yr+1:ST.yr}년 ${ST.m}월${ST.tab==='task'?' · 업무 상세는 선택 학년도 전체 자료':ST.tab==='search'?' · 검색은 선택 학년도 전체 자료':''}${ST.yr===2025?' · 전년도 참고자료 (담당 기준: 2026.9.1.)':''}</p>
 </section>`;}
// Month selection is shared by all screens, with no hidden horizontal strip.
monthBar=()=>'';
function workspaceStats(){
 const docs=DB.G.filter(g=>g.yr===ST.yr),events=T().flatMap(t=>evidenceEvents(t.name,ST.m,ST.yr));
 const planned=T().filter(t=>primarySchedule(t,ST.m,ST.yr).length||(RL().WP||[]).some(w=>w.y===ST.yr&&w.m===ST.m&&w.task===t.name));
 return `<div class="work-stats"><span><b>${T().length}</b> 담당 업무</span><span><b>${planned.length}</b> 이달 계획 있는 업무</span><span><b>${events.length}</b> 본문에서 확인한 일정</span><span><b>${docs.length}</b> 선택 학년도 연결 문서</span></div>`;
}
vHome=function(){ST.view='work';ST.tab='cal';return vWork();};
vWork=function(){
 const body=ST.tab==='cal'?vCal():ST.tab==='task'?vTask():ST.tab==='todo'?vTodo():vSearch();
 return bar('가동초 업무 길잡이',`${RL().label} · ${ST.yr}학년도`,'업무와 자료 찾기','담당 업무와 월을 선택하세요. 업무분장표로 담당 범위를, 교육계획서로 운영 내용을 확인할 수 있습니다.')+drawer()+`<main class="wrap">${workspaceControls()}${workspaceStats()}${body}</main>`;
};
const originalWorkspaceRender=render;
render=function(){originalWorkspaceRender();if(ST.tab==='search')doSearch();};
// Search follows the selected school year; changing years re-runs the query.
doSearch=function(){
 const q=ST.q.trim().toLowerCase(),out=$('#res');if(!out)return;
 if(!q){out.innerHTML='<p class="muted">제목·문서번호·본문의 낱말을 입력하세요. 선택한 담당 업무와 학년도에서 찾습니다.</p>';return;}
 const sf=ST.sf||'prod';
 const rows=DB.G.filter(g=>g.yr===ST.yr&&(sf==='all'||(sf==='rcv')===!!g.rc)&&[g.title,String(g.no),g.body||''].some(s=>s.toLowerCase().includes(q)));
 out.innerHTML=`<p class="muted">${ST.yr}학년도 ${rows.length}건</p><div class="card">${rows.length?more(rows.map(g=>gi(g)),20):'일치하는 자료가 없습니다. 다른 학년도도 선택해 보세요.'}</div>`;
};
const originalWorkspaceSearch=vSearch;
vSearch=function(){return originalWorkspaceSearch().replace('2025·2026학년도 기안','선택 학년도 기안').replace('찾은 낱말은 노랗게 표시돼요.','제목을 누르면 문서 내용을 볼 수 있어요.');};
const workspaceStyle=document.createElement('style');workspaceStyle.textContent=`
.work-controls{position:sticky;top:0;z-index:5;background:var(--glass);backdrop-filter:blur(16px);border:1px solid #ddcbb7;border-radius:20px;padding:16px;margin-bottom:16px;box-shadow:0 5px 20px #6f431510;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 18px}
.work-select label{display:block;font-size:15px;font-weight:700;margin-bottom:5px}.work-select select{width:100%;padding:11px;border:1px solid #baa892;border-radius:10px;background:#fff;font:inherit;font-size:18px;color:var(--ink)}
.work-years,.work-tabs,.work-months{display:flex;gap:6px;flex-wrap:wrap}.work-years{align-items:end}.work-tabs,.work-months,.work-controls>p{grid-column:1/-1}.work-controls>p{margin:0;font-size:14px}
.work-controls button{border:1px solid #ddcbb7;background:white;color:var(--ink);border-radius:10px;padding:10px 14px;font:inherit;font-size:16px;cursor:pointer}.work-controls button[aria-pressed=true]{background:var(--acc);border-color:var(--acc);color:white;font-weight:700}.work-tabs button{flex:1}.work-months{display:grid;grid-template-columns:repeat(12,minmax(0,1fr))}.work-months button{padding:9px 0}
.work-controls :focus-visible{outline:3px solid #2d5fb0;outline-offset:3px}.work-stats{display:flex;flex-wrap:wrap;gap:8px 24px;padding:4px 4px 18px;font-size:15px}.work-stats b{color:var(--acc);font-size:23px}.acs>.ac>.ab{max-height:none;overflow:visible}.tchips{position:static;display:flex;flex-wrap:wrap}.grid>.cc{align-self:start}
@media(max-width:760px){.work-controls{position:static;grid-template-columns:1fr;padding:12px}.work-years{grid-column:1/-1}.work-years button{flex:1}.work-tabs{display:grid;grid-template-columns:1fr 1fr}.work-months{grid-template-columns:repeat(6,minmax(0,1fr))}.work-stats{display:grid;grid-template-columns:1fr 1fr}.work-controls button{font-size:15px}}
`;document.head.append(workspaceStyle);
