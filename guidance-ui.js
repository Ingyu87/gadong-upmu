/* Curated explanations follow the September assignment; source records stay intact. */
function guidanceHtml(t){
 const g=t.guidance;if(!g)return '';
 const compare=g.plan_comparison.filter(x=>x.matched_pdf_pages.length);
 const refs=compare.map(x=>`<li>${E(x.section)} · PDF ${x.matched_pdf_pages.join(', ')}페이지</li>`).join('');
 const forms=g.forms.map(f=>`<li><a href="${E(f.url)}" target="_blank" rel="noopener noreferrer">${E(f.title)} ↗</a></li>`).join('');
 return acc('업무 설명 · 진행 순서','',`<p>${E(g.description)}</p><ol>${g.steps.map(s=>`<li>${E(s)}</li>`).join('')}</ol>${g.note?`<p class="basis-note">${E(g.note)}</p>`:''}<p class="muted">업무분장과 아래 운영 자료를 대조하여 정리한 안내입니다.</p>`,true)
 +acc('참고 절 · 부장업무 자료','',g.manual_pages.length?`<p>${E(g.manual_source)} · ${g.manual_pages.join(', ')}쪽</p><p class="muted">학교 여건에 맞춰 활용하세요. 예산·시수·절차의 세부 기준은 해당 연도 사업 안내에서 확인하세요.</p>`:`<p>${E(g.manual_status)}</p>`,false)
 +acc('업무 서식 · 원본 열기',g.forms.length?String(g.forms.length):'',`${forms?`<ul>${forms}</ul><p class="muted">목록의 제목을 기준으로 연결한 참고 서식입니다. 원본의 연도·내용·열람 권한을 확인하여 활용하세요.</p>`:'<p>현재 서식 목록에서 이 업무에 맞는 자료를 확인하지 못했습니다.</p>'}<a href="${E(g.forms_source)}" target="_blank" rel="noopener noreferrer">초등 업무 서식 전체 목록 ↗</a>`,false)
 +acc('교육계획서 판본 대조','',refs?`<p>2026 학교교육계획서(3.4)에서 기존 발췌 문장을 확인한 위치입니다. 아래 숫자는 PDF 페이지입니다.</p><ul>${refs}</ul>${compare.length<g.plan_comparison.length?'<p class="muted">일부 절은 기존에 표시된 출처를 함께 확인하세요.</p>':''}`:'<p>기존 운영 내용에 표시된 출처를 확인하세요. 3.4판에서 일치하는 발췌 문장은 아직 확인하지 못했습니다.</p>',false);
}
const previousPrimaryHtml=primaryHtml;
primaryHtml=function(t){return guidanceHtml(t)+previousPrimaryHtml(t);};
// Personal assignment names are retained in source data for document reconciliation.
roleOptions=function(){return Object.entries(DB.R).map(([id,r])=>`<option value="${E(id)}" ${id===ST.role?'selected':''}>${E(r.label)}</option>`).join('');};
