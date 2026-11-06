#!/usr/bin/env node
/**
 * Monthly evidence, submission-role, and collapse-contract tests.
 * Does not restore excluded private document IDs.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8'));
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'work-catalog.json'), 'utf8'));
const ui = fs.readFileSync(path.join(ROOT, 'split-work-ui.js'), 'utf8');

const PRIVATE = ['2025:4632', '2025:6781', '2025:16532', '2025:3281', '2026:4801', '2026:3254', '2026:6254'];

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

function allG() {
  return Object.values(data.R).flatMap(r => r.G || []);
}

function scheduleOf(role) {
  return catalog.roles[role].schedule || [];
}

console.log('Monthly evidence / submission / collapse tests\n');

test('Private 7 IDs are absent from data.json G', () => {
  const keys = new Set(allG().map(g => `${g.yr}:${g.no}`));
  const leaked = PRIVATE.filter(k => keys.has(k));
  assert.strictEqual(leaked.length, 0, `Found private IDs in G: ${leaked.join(', ')}`);
});

test('Doc 6254 is not a public record', () => {
  const found = allG().filter(g => String(g.no) === '6254');
  assert.strictEqual(found.length, 0);
});

test('UI withholds click for unavailable/private evidence', () => {
  assert(ui.includes('근거 비공개'), 'nonclickable withheld label missing');
  assert(ui.includes('evidence-withheld'), 'withheld class missing');
  assert(ui.includes("PRIVATE_DOC_KEYS"), 'private key set missing');
  assert(ui.includes('2026:6254'), '6254 must stay in private set');
  assert(!/onclick="openG\(2026,'6254'\)"/.test(ui), 'hardcoded 6254 click must not exist');
});

test('Available evidence opens sanitized image, not body', () => {
  assert(ui.includes('captureSrc'), 'capture path helper missing');
  assert(ui.includes('edufine-capture'), 'image modal missing');
  assert(!ui.includes('본문 텍스트'), 'must not reintroduce body text in modal');
  assert(ui.includes('findPublicDoc'), 'public doc lookup missing');
});

test('일람표/통지표 제출 catalog events are on research only', () => {
  const want = new Set(['일람표 제출(~13)', '통지표 제출(~15)']);
  const research = scheduleOf('research').filter(e => want.has(e.title));
  const g07 = scheduleOf('g07').filter(e => want.has(e.title));
  assert.strictEqual(research.length, 2, `research schedule should have 2, got ${research.length}`);
  assert.strictEqual(g07.length, 0, `g07 still has ${g07.map(e => e.title).join(', ')}`);
  for (const e of research) {
    assert.strictEqual(e.task_id, 'research-1-1');
    assert.strictEqual(e.kind, 'monthly');
    assert(e.date.startsWith('2026-07-1'));
    assert(e.source.includes('월중계획'));
  }
});

test('일람표/통지표 제출 WP moved to research, removed from 학성위', () => {
  const pick = t => (role => (data.R[role].WP || []).filter(w => w.t === t && w.y === 2026));
  assert.strictEqual(pick('일람표 제출(~13)')('research').length, 1);
  assert.strictEqual(pick('통지표 제출(~15)')('research').length, 1);
  assert.strictEqual(pick('일람표 제출(~13)')('g07').length, 0);
  assert.strictEqual(pick('통지표 제출(~15)')('g07').length, 0);
  const moved = pick('일람표 제출(~13)')('research')[0];
  assert.strictEqual(moved.m, 7);
  assert.strictEqual(moved.d, 13);
  assert.strictEqual(moved.y, 2026);
});

test('학성위 keeps non-submission evaluation items', () => {
  const g07wp = (data.R.g07.WP || []).map(w => w.t);
  assert(g07wp.includes('2학기 학년별 평가계획완료'), 'must not move 평가계획완료');
  assert(g07wp.includes('과정중심평가 교원 연수'), 'must not move 과정중심평가 연수');
  const g07sched = scheduleOf('g07').map(e => e.title);
  assert(g07sched.includes('2학기 학년별 평가계획완료'));
});

test('Monthly all-collapse hides cards; month click restores title-only', () => {
  assert(ui.includes('ST.calFolded'), 'fold state missing');
  assert(ui.includes("if(ST.calFolded)return ''"), 'all-collapse must hide month cards');
  assert(ui.includes('month-task-card'), 'title-only details cards missing');
  assert(ui.includes('ST.calFolded=false;ST.m='), 'month select must restore cards');
  assert(ui.includes('aria-expanded'), 'accessible expand state missing');
  assert(!/collapseAll=function\(\)\{[\s\S]*showSchoolView\(\);return;/.test(ui.split('beforeMonthlyCollapse')[1] || ''), 'monthly collapse must not call school view');
});

test('G/D counts conserved', () => {
  const totalG = Object.values(data.R).reduce((s, r) => s + (r.G || []).length, 0);
  const totalD = Object.values(data.R).reduce((s, r) => s + (r.D || []).length, 0);
  assert.strictEqual(totalG, 1231);
  assert.strictEqual(totalD, 1095);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
