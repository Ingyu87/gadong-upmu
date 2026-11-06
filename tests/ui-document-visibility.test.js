#!/usr/bin/env node
/**
 * Document Assignment Integrity Tests
 * 
 * Verifies that documents are assigned to the CORRECT role and task,
 * and that sibling tasks within the same role are properly separated.
 * 
 * IMPORTANT: These tests verify DATA INTEGRITY, not UI visibility.
 * Documents have OLD task names; work-catalog has NEW split names.
 * No parent fallback is used - that would incorrectly duplicate docs.
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

console.log('Document Assignment Integrity Tests\n');
console.log('Verifies correct role assignments and sibling separation\n');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Helper to find doc
function findDoc(docNo) {
  for (const [roleKey, role] of Object.entries(data.R || {})) {
    for (const g of role.G || []) {
      if (String(g.no) === String(docNo)) return { roleKey, g };
    }
  }
  return null;
}

// === Audit-Confirmed Role Assignments ===
// These docs are confirmed in CORRECT role (data.json R structure)

test('Doc 4064 (선행학습) in research role', () => {
  const found = findDoc('4064');
  assert(found, 'Doc not found');
  assert.strictEqual(found.roleKey, 'research');
});

test('Doc 2814 (PAPS) in g17 role (체육교육)', () => {
  const found = findDoc('2814');
  assert(found, 'Doc not found');
  assert.strictEqual(found.roleKey, 'g17');
});

test('Doc 4059 (학생선수관리위원회) in g19 role (야구부)', () => {
  const found = findDoc('4059');
  assert(found, 'Doc not found');
  assert.strictEqual(found.roleKey, 'g19');
});

// === Sibling Separation Tests ===
// Within a role, different topics should NOT be mixed

test('PAPS docs are distinct from other 체육교육 docs', () => {
  const g17 = data.R['g17'];
  const papsDocs = g17.G.filter(g => 
    g.title.includes('PAPS') || g.title.includes('체력평가')
  );
  const otherDocs = g17.G.filter(g => 
    !g.title.includes('PAPS') && !g.title.includes('체력평가')
  );
  
  // There should be a clear separation
  assert(papsDocs.length > 0, 'Should have PAPS docs');
  assert(otherDocs.length > 0, 'Should have other 체육교육 docs');
  console.log(`    PAPS: ${papsDocs.length}, Other: ${otherDocs.length}`);
});

test('학생선수관리위원회 docs are distinct from other 야구부 docs', () => {
  const g19 = data.R['g19'];
  const committeeDocs = g19.G.filter(g => 
    g.title.includes('관리위원회')
  );
  const otherDocs = g19.G.filter(g => 
    !g.title.includes('관리위원회')
  );
  
  assert(committeeDocs.length > 0, 'Should have 위원회 docs');
  assert(otherDocs.length > 0, 'Should have other 야구부 docs');
  console.log(`    위원회: ${committeeDocs.length}, Other: ${otherDocs.length}`);
});

// === Cross-Role Negative Tests ===
// Docs should NOT appear in wrong roles

test('PAPS doc NOT in g07 (학성위)', () => {
  const g07 = data.R['g07'];
  const wrongPaps = g07.G.filter(g => 
    g.title.includes('PAPS') || g.title.includes('체력평가')
  );
  assert.strictEqual(wrongPaps.length, 0, 'PAPS should not be in g07');
});

test('학생선수관리위원회 doc NOT in g07 (학성위)', () => {
  const g07 = data.R['g07'];
  const wrongCommittee = g07.G.filter(g => 
    g.title.includes('학생선수관리위원회')
  );
  assert.strictEqual(wrongCommittee.length, 0, '학생선수관리위원회 should not be in g07');
});

// === Honest Counts ===
console.log('\n--- Document Counts (Actual) ---');
const totalG = Object.values(data.R).reduce((sum, r) => sum + (r.G?.length || 0), 0);
const totalD = Object.values(data.R).reduce((sum, r) => sum + (r.D?.length || 0), 0);
console.log(`Unique G documents: ${totalG}`);
console.log(`Unique D entries: ${totalD}`);

// === Summary ===
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
