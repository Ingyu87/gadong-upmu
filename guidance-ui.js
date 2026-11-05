/* Curated explanations follow the September assignment; source records stay intact. */
function guidanceHtml(t){
 const g=t.guidance;if(!g)return '';
 const compare=g.plan_comparison.filter(x=>x.matched_pdf_pages.length);
 const refs=compare.map(x=>`<li>${E(x.section)} · PDF ${x.matched_pdf_pages.join(', ')}페이지</li>`).join('');
 const formList=items=>`<ul class="form-links">${items.map(f=>`<li><a href="${E(f.url)}" target="_blank" rel="noopener noreferrer">${E(f.display_title||f.title)} <span>↗</span></a>${f.use_when||f.content_note?`<div class="form-use">${E(f.use_when||f.content_note)}</div>`:''}${f.usage_note?`<div class="form-warning">${E(f.usage_note)}</div>`:''}</li>`).join('')}</ul>`;
 const forms=g.forms||[],references=g.reference_forms||[];
 return acc('업무 설명 · 진행 순서','',`<p>${E(g.description)}</p><ol>${g.steps.map(s=>`<li>${E(s)}</li>`).join('')}</ol>${g.note?`<p class="basis-note">${E(g.note)}</p>`:''}`,true)
 +(g.manual_pages.length?acc('부장업무 자료','',`<p>${E(g.manual_source)} · ${g.manual_pages.join(', ')}쪽</p>`,false):'')
 +((forms.length||references.length)?acc('업무 서식 · 원본 열기','',`${forms.length?formList(forms):''}${references.length?`<details class="reference-forms"><summary>상황에 따라 참고할 자료 ${references.length}개 ▾</summary>${formList(references)}</details>`:''}<p class="form-use">학교명·일정·대상은 실제 운영에 맞춰 사용하세요.</p><a href="${E(g.forms_source)}" target="_blank" rel="noopener noreferrer">초등 업무 서식 전체 목록 ↗</a>`,false):'')
 +(refs?acc('교육계획서 출처','',`<p>2026 학교교육계획서(3.4)</p><ul>${refs}</ul>`,false):'');
}
const previousPrimaryHtml=primaryHtml;
primaryHtml=function(t){return guidanceHtml(t)+previousPrimaryHtml(t);};
// Personal assignment names are retained in source data for document reconciliation.
roleOptions=function(){return Object.entries(DB.R).map(([id,r])=>`<option value="${E(id)}" ${id===ST.role?'selected':''}>${E(r.label)}</option>`).join('');};
