#!/usr/bin/env node
/**
 * Audit UI/search regressions. Does not restore private IDs or fabricate captures.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8'));
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'work-catalog.json'), 'utf8'));
const ui = fs.readFileSync(path.join(ROOT, 'split-work-ui.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'companion-ui.css'), 'utf8');

const PRIVATE = new Set(['2025:4632', '2025:6781', '2025:16532', '2025:3281', '2026:4801', '2026:3254', '2026:6254']);

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
    failed++;
  }
}

function foldQ(s) {
  return String(s || '').toLowerCase().replace(/\s+/g, '');
}

function findPublicDoc(yr, no) {
  const key = `${yr}:${no}`;
  if (PRIVATE.has(key)) return null;
  const match = g => g.yr == yr && String(g.no) === String(no) && !g.priv;
  return Object.values(data.R).flatMap(r => r.G || []).find(match) || null;
}

function homeSearchHits(key, r, q) {
  const nq = foldQ(q);
  if (!nq) return { ok: true, hits: [] };
  const hits = [];
  const add = (type, text, extra) => {
    if (foldQ(`${text} ${extra || ''}`).includes(nq)) hits.push({ type, text, extra: extra || '' });
  };
  add('담당', r.label);
  add('부서', r.dept);
  if (key === 'g07') add('담당', '학성위');
  for (const t of r.TASKS || []) add('세부 업무', t.name);
  const cat = catalog.roles[key];
  const byId = Object.fromEntries((cat?.tasks || []).map(t => [t.id, t.name]));
  for (const e of cat?.schedule || []) add('월별 일정', e.title || '', byId[e.task_id] || '');
  const seen = new Set();
  for (const t of r.TASKS || []) {
    for (const k of t.document_keys || []) {
      if (PRIVATE.has(k) || seen.has(k)) continue;
      const [yr, no] = k.split(':');
      const g = findPublicDoc(yr, no);
      if (!g) continue;
      seen.add(k);
      add('공개 문서', `${g.no} · ${g.title}`, t.name);
    }
  }
  return { ok: hits.length > 0, hits };
}

function search(q) {
  const out = [];
  for (const [key, r] of Object.entries(catalog.roles)) {
    const base = data.R[key] || {};
    const found = homeSearchHits(key, {
      label: base.label || r.label,
      dept: base.dept || r.dept,
      TASKS: r.tasks
    }, q);
    if (found.ok) out.push({ key, label: base.label || r.label, hits: found.hits });
  }
  return out;
}

console.log('Audit UI / search regressions\n');

test('UI keeps monthly collapse contract', () => {
  assert(ui.includes('ST.calFolded'));
  assert(ui.includes("if(ST.calFolded)return ''"));
  assert(ui.includes('month-task-card'));
});

test('Private 7 keys stay excluded from public lookup', () => {
  assert(ui.includes('PRIVATE_DOC_KEYS'));
  for (const k of PRIVATE) assert(ui.includes(k), k);
  assert(!ui.includes("openG(2026,'6254')"));
});

test('Home search indexes monthly events, public docs, not body', () => {
  assert(ui.includes('homeSearchHits'));
  assert(ui.includes('월별 일정'));
  assert(ui.includes('공개 문서'));
  assert(ui.includes('assignment-empty'));
  assert(!/doSearch=function\(\)\{[\s\S]{0,400}g\.body/.test(ui), 'doSearch must not read body');
});

test('일람표 finds research submission and 학성위 duty with distinct types', () => {
  const rows = search('일람표');
  const research = rows.find(r => r.key === 'research');
  const g07 = rows.find(r => r.key === 'g07');
  assert(research, 'research should match 일람표');
  assert(g07, 'g07 should match 일람표');
  assert(research.hits.some(h => h.type === '월별 일정' && h.text.includes('일람표 제출')), JSON.stringify(research.hits));
  assert(g07.hits.some(h => h.type === '세부 업무' && h.text.includes('통지표·종합일람표')), JSON.stringify(g07.hits));
  assert(!research.hits.some(h => h.text.includes('통지표·종합일람표')));
});

test('통지표 제출 is research monthly, not a 학성위 reassignment', () => {
  const rows = search('통지표 제출');
  const research = rows.find(r => r.key === 'research');
  assert(research?.hits.some(h => h.type === '월별 일정' && h.text.includes('통지표 제출')));
});

test('9642 locates 학성위 public document', () => {
  const rows = search('9642');
  assert(rows.some(r => r.key === 'g07' && r.hits.some(h => h.type === '공개 문서' && h.text.includes('9642'))), JSON.stringify(rows));
  assert(!rows.some(r => r.hits.some(h => String(h.text).includes('6254'))));
});

test('에듀테크 finds research monthly event', () => {
  const rows = search('에듀테크');
  assert(rows.some(r => r.key === 'research' && r.hits.some(h => h.type === '월별 일정' && h.text.includes('에듀테크'))), JSON.stringify(rows.map(r => r.key)));
});

test('개인정보처리방침 finds science public doc', () => {
  const rows = search('개인정보처리방침');
  assert(rows.some(r => r.key === 'science' && r.hits.some(h => h.type === '공개 문서' && foldQ(h.text).includes('개인정보처리방침'))), JSON.stringify(rows.slice(0, 3)));
});

test('6254 is not a public home-search document hit', () => {
  const rows = search('6254');
  assert(!rows.some(r => r.hits.some(h => h.type === '공개 문서')), JSON.stringify(rows));
});

test('Missing capture is labelled before click; no fake 상세 보기 CTA', () => {
  assert(ui.includes('캡처 없음'));
  assert(ui.includes('capture-missing'));
  assert(ui.includes('제목·번호 보기'));
  assert(ui.includes('캡처 보기 ›'));
  const giBlock = ui.slice(ui.indexOf('gi=function'), ui.indexOf('openG=function'));
  assert(!giBlock.includes('상세 보기 ›'));
  assert(ui.includes('캡처 이미지가 없습니다'));
  assert(ui.includes('hasCapture'));
});

test('Withheld forms stay unlinkable and labelled before click', () => {
  assert(ui.includes('파일 없음 · 다운로드 불가'));
  assert(ui.includes('form-unavailable'));
  assert(ui.includes('링크가 없습니다'));
  const vTask = ui.slice(ui.indexOf('vTask=function'), ui.indexOf('workSide=function'));
  assert(!vTask.includes('href='), 'vTask must not emit form href');
  assert(!vTask.includes('form-direct'));
});

test('Footer/content safe-area CSS is present', () => {
  assert(ui.includes('--footer-safe'));
  assert(css.includes('z-index:6'));
  assert(ui.includes('overflow-x:hidden'));
  assert(ui.includes('search-count'));
  assert(ui.includes('month-board-title'));
});

test('Masked capture map size unchanged at 491', () => {
  assert.strictEqual(Object.keys(catalog.captures || {}).length, 491);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
