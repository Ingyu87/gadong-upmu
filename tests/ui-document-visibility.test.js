#!/usr/bin/env node
/**
 * Document Assignment and Sibling Separation Tests
 * 
 * Verifies:
 * 1. Audit-confirmed docs are in correct roles
 * 2. Sibling tasks show ONLY their document_keys, not all parent docs
 * 3. Unassigned parent docs exist but are not duplicated to siblings
 * 4. Document counts are conserved
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

console.log('Document Assignment and Sibling Separation Tests\n');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Helpers
const docKey = g => `${g.yr}:${g.no}`;
const findDoc = docNo => {
  for (const [roleKey, role] of Object.entries(data.R || {})) {
    for (const g of role.G || []) {
      if (String(g.no) === String(docNo)) return { roleKey, g };
    }
  }
  return null;
};

// === Audit-Confirmed document_keys Tests ===

test('Doc 2814 (PAPS) in PAPS 측정 document_keys', () => {
  const task = catalog.roles.g17.tasks.find(t => t.name === 'PAPS 측정');
  assert(task.document_keys.includes('2026:2814'), 'Doc 2814 should be in PAPS 측정');
});

test('Doc 4059 in 학생선수관리위원회 document_keys', () => {
  const task = catalog.roles.g19.tasks.find(t => t.name === '학생선수관리위원회');
  assert(task.document_keys.includes('2026:4059'), 'Doc 4059 should be in 학생선수관리위원회');
});

test('Doc 2483 in 공개수업 document_keys', () => {
  const task = catalog.roles.research.tasks.find(t => t.name === '공개수업');
  assert(task.document_keys.includes('2026:2483'), 'Doc 2483 should be in 공개수업');
});

test('Doc 2480 in 개인정보 관리 document_keys', () => {
  const task = catalog.roles.science.tasks.find(t => t.name === '개인정보 관리');
  assert(task.document_keys.includes('2026:2480'), 'Doc 2480 should be in 개인정보 관리');
});

// === Sibling Negative Tests ===
// Each sibling should ONLY have its own document_keys

test('PAPS 측정 has ONLY PAPS docs (1), not all 체육교육 (14)', () => {
  const task = catalog.roles.g17.tasks.find(t => t.name === 'PAPS 측정');
  const keys = task.document_keys || [];
  // PAPS should have small number of docs, not all 14 체육교육 docs
  assert(keys.length <= 3, `PAPS 측정 should have few docs, got ${keys.length}`);
  console.log(`    PAPS 측정 document_keys: ${keys.length}`);
});

test('학생선수관리위원회 has ONLY committee docs, not all 야구부', () => {
  const task = catalog.roles.g19.tasks.find(t => t.name === '학생선수관리위원회');
  const keys = task.document_keys || [];
  const g19Total = data.R.g19.G.length;
  assert(keys.length < g19Total, `학생선수관리위원회 should not have all ${g19Total} 야구부 docs`);
  console.log(`    학생선수관리위원회: ${keys.length} keys, 야구부 total: ${g19Total}`);
});

test('공개수업 NOT includes 선행학습 doc 4064', () => {
  const task = catalog.roles.research.tasks.find(t => t.name === '공개수업');
  const keys = task.document_keys || [];
  assert(!keys.includes('2026:4064'), '공개수업 should not include 선행학습 doc');
});

test('개인 학생선수·e스쿨 NOT includes 관리위원회 doc 4059', () => {
  const task = catalog.roles.g19.tasks.find(t => t.name === '야구부 출결·학습지원');
  const keys = task.document_keys || [];
  assert(!keys.includes('2026:4059'), '출결지원 should not include 관리위원회 doc');
});

// === Cross-Role Tests ===

test('PAPS doc NOT in g07 data.json role', () => {
  const found = findDoc('2814');
  assert(found, 'Doc 2814 should exist');
  assert.notStrictEqual(found.roleKey, 'g07', 'PAPS should not be in g07');
});

// === Document Count Conservation ===

test('Total G documents conserved', () => {
  const totalG = Object.values(data.R).reduce((sum, r) => sum + (r.G?.length || 0), 0);
  assert.strictEqual(totalG, 1231, `Expected 1231 G docs, got ${totalG}`);
});

test('Total D entries conserved', () => {
  const totalD = Object.values(data.R).reduce((sum, r) => sum + (r.D?.length || 0), 0);
  assert.strictEqual(totalD, 1095, `Expected 1095 D entries, got ${totalD}`);
});

// === Linked vs Unassigned Count ===
console.log('\n--- Linked vs Unassigned ---');
let totalLinked = 0;
for (const [roleKey, roleData] of Object.entries(catalog.roles || {})) {
  for (const t of roleData.tasks || []) {
    totalLinked += (t.document_keys || []).length;
  }
}
const totalDocs = Object.values(data.R).reduce((sum, r) => sum + (r.G?.length || 0), 0);
console.log(`Linked via document_keys: ${totalLinked}`);
console.log(`Unassigned (parent-level): ${totalDocs * 2 - totalLinked} (across 2 years)`);

// === Summary ===
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
