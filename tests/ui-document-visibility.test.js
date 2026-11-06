#!/usr/bin/env node
/**
 * UI Document Visibility Tests
 * 
 * Verifies that documents are visible under new split tasks via parent mapping.
 * Tests the fix where taskMatches(itemTask, t) returns true if:
 *   itemTask === t.name OR itemTask === t.parent
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const dataPath = path.join(__dirname, '..', 'data.json');
const catalogPath = path.join(__dirname, '..', 'work-catalog.json');

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

console.log('UI Document Visibility Tests\n');
console.log('Verifies documents appear under new split tasks via parent mapping\n');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Simulate the taskMatches function from basis-ui.js
function taskMatches(itemTask, t) {
  return itemTask === t.name || (t.parent && itemTask === t.parent);
}

// Helper to count visible docs for a task
function countVisibleDocs(roleKey, taskName) {
  const role = data.R[roleKey];
  const catRole = catalog.roles[roleKey];
  if (!role || !catRole) return 0;
  
  const task = catRole.tasks.find(t => t.name === taskName);
  if (!task) return 0;
  
  return role.G.filter(g => taskMatches(g.task, task)).length;
}

// === Audit-Confirmed Visibility Tests ===

// 선행학습/동료장학/공개수업 → research 수업 및 장학 → visible under split tasks
test('공개수업 shows documents (parent: 수업 및 장학)', () => {
  const count = countVisibleDocs('research', '공개수업');
  assert(count > 0, `Expected >0 docs, got ${count}`);
});

test('임상장학 shows documents (parent: 수업 및 장학)', () => {
  const count = countVisibleDocs('research', '임상장학');
  assert(count > 0, `Expected >0 docs, got ${count}`);
});

// PAPS → g17 체육교육 → visible under PAPS 측정
test('PAPS 측정 shows documents (parent: 체육교육)', () => {
  const count = countVisibleDocs('g17', 'PAPS 측정');
  assert(count > 0, `Expected >0 docs, got ${count}`);
});

// 학생선수관리위원회 → g19 야구부
test('학생선수관리위원회 shows documents (parent: 야구부 업무지원)', () => {
  const count = countVisibleDocs('g19', '학생선수관리위원회');
  assert(count > 0, `Expected >0 docs, got ${count}`);
});

// 녹색학부모회 → g15
test('녹색학부모회 shows documents', () => {
  const count = countVisibleDocs('g15', '녹색학부모회');
  assert(count > 0, `Expected >0 docs, got ${count}`);
});

// 학교평가 (name === parent, should always work)
test('학교평가 shows documents', () => {
  const count = countVisibleDocs('research', '학교평가');
  assert(count > 0, `Expected >0 docs, got ${count}`);
});

// === Negative tests: wrong role should have 0 docs ===

test('PAPS NOT in g07 (학성위)', () => {
  // g07 is 학업성적관리위원회 - PAPS should not appear there
  const g07Role = data.R['g07'];
  const g17Task = catalog.roles['g17']?.tasks.find(t => t.name === 'PAPS 측정');
  if (g07Role && g17Task) {
    const wrongCount = g07Role.G.filter(g => taskMatches(g.task, g17Task)).length;
    assert.strictEqual(wrongCount, 0, `PAPS should not appear in g07, found ${wrongCount}`);
  }
});

test('학생선수관리위원회 NOT in g07 (학성위)', () => {
  const g07Role = data.R['g07'];
  const g19Task = catalog.roles['g19']?.tasks.find(t => t.name === '학생선수관리위원회');
  if (g07Role && g19Task) {
    const wrongCount = g07Role.G.filter(g => taskMatches(g.task, g19Task)).length;
    assert.strictEqual(wrongCount, 0, `학생선수관리위원회 should not appear in g07, found ${wrongCount}`);
  }
});

// === Summary ===
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
