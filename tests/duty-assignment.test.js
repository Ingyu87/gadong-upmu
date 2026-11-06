#!/usr/bin/env node
/**
 * Duty Assignment Regression Tests
 * 
 * Ensures audit-confirmed duty assignments remain correct.
 * Based on 2026.9.1 roster verification.
 * 
 * NO PERSONAL NAMES in tests - only document numbers and role keys.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const dataPath = path.join(__dirname, '..', 'data.json');

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

console.log('Duty Assignment Regression Tests\n');
console.log('Based on 2026.9.1 roster and document body verification\n');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Helper to find document by number
function findDoc(docNo) {
  for (const [roleKey, role] of Object.entries(data.R || {})) {
    for (const g of role.G || []) {
      if (String(g.no) === String(docNo)) {
        return { roleKey, role, doc: g };
      }
    }
  }
  return null;
}

// Helper to check if any doc matching pattern is in expected role
function checkAssignment(pattern, expectedRole, description) {
  test(`${description} → ${expectedRole}`, () => {
    const matches = [];
    for (const [roleKey, role] of Object.entries(data.R || {})) {
      for (const g of role.G || []) {
        if (pattern.test(g.title || '')) {
          matches.push({ roleKey, no: g.no, title: g.title });
        }
      }
    }
    
    if (matches.length === 0) {
      throw new Error(`No documents matching pattern found`);
    }
    
    const wrongRole = matches.filter(m => m.roleKey !== expectedRole);
    if (wrongRole.length > 0) {
      throw new Error(`Found ${wrongRole.length} docs in wrong role: ${wrongRole.map(w => `No.${w.no} in ${w.roleKey}`).join(', ')}`);
    }
  });
}

// === Confirmed Duty Assignments (Audit 2026.9.1) ===

// 1. 선행학습 예방 → research (연구 수업·장학)
// Evidence: docs 4064, 4801
test('선행학습 예방 (No.4064) → research', () => {
  const found = findDoc('4064');
  assert(found, 'Document 4064 not found');
  assert.strictEqual(found.roleKey, 'research', 
    `Expected research, got ${found.roleKey}`);
});

// 2. 동료장학 → research
// Evidence: docs 5778, 5772
test('동료장학 (No.5778) → research', () => {
  const found = findDoc('5778');
  assert(found, 'Document 5778 not found');
  assert.strictEqual(found.roleKey, 'research',
    `Expected research, got ${found.roleKey}`);
});

test('동료장학 가통 (No.5772) → research', () => {
  const found = findDoc('5772');
  assert(found, 'Document 5772 not found');
  assert.strictEqual(found.roleKey, 'research',
    `Expected research, got ${found.roleKey}`);
});

// 3. 공개수업 → research
// Evidence: doc 2483
test('공개수업 (No.2483) → research', () => {
  const found = findDoc('2483');
  assert(found, 'Document 2483 not found');
  assert.strictEqual(found.roleKey, 'research',
    `Expected research, got ${found.roleKey}`);
});

// 4. PAPS 체력평가 → g17 (체육교육), NOT 학업성적관리위원회
// Evidence: doc 2814
test('PAPS 체력평가 (No.2814) → g17 (체육교육)', () => {
  const found = findDoc('2814');
  assert(found, 'Document 2814 not found');
  assert.strictEqual(found.roleKey, 'g17',
    `Expected g17 (체육교육), got ${found.roleKey}`);
  assert.notStrictEqual(found.roleKey, 'g07',
    'PAPS should NOT be in g07 (학업성적관리위원회)');
});

// 5. 학생선수관리위원회 → g19 (야구부), NOT 학성위
// Evidence: doc 4059
test('학생선수관리위원회 (No.4059) → g19 (야구부)', () => {
  const found = findDoc('4059');
  assert(found, 'Document 4059 not found');
  assert.strictEqual(found.roleKey, 'g19',
    `Expected g19 (야구부), got ${found.roleKey}`);
  assert.notStrictEqual(found.roleKey, 'g07',
    '학생선수관리위원회 should NOT be in g07 (학성위)');
});

// 6. 정보보안담당관 → science (개인정보·정보윤리교육)
// Evidence: doc 2480
test('정보보안담당관 (No.2480) → science', () => {
  const found = findDoc('2480');
  assert(found, 'Document 2480 not found');
  assert.strictEqual(found.roleKey, 'science',
    `Expected science, got ${found.roleKey}`);
});

// 7. 개인정보 파기 → science
// Evidence: doc 2481
test('개인정보 파기 (No.2481) → science', () => {
  const found = findDoc('2481');
  assert(found, 'Document 2481 not found');
  assert.strictEqual(found.roleKey, 'science',
    `Expected science, got ${found.roleKey}`);
});

// 8. 디벗 운영계획 → science (AI·SW·정보교육 사업)
// Evidence: doc 3862
test('디벗 운영계획 (No.3862) → science', () => {
  const found = findDoc('3862');
  assert(found, 'Document 3862 not found');
  assert.strictEqual(found.roleKey, 'science',
    `Expected science, got ${found.roleKey}`);
});

// 9. 디벗 가통 → science
// Evidence: doc 3863
test('디벗 가통 (No.3863) → science', () => {
  const found = findDoc('3863');
  assert(found, 'Document 3863 not found');
  assert.strictEqual(found.roleKey, 'science',
    `Expected science, got ${found.roleKey}`);
});

// === Pattern-based checks (all matching docs must be in correct role) ===

// 10. All PAPS/체력평가 docs → g17
checkAssignment(/PAPS|학생건강체력평가/, 'g17', 'All PAPS/체력평가 documents');

// 11. All 학생선수관리위원회 docs → g19
checkAssignment(/학생선수관리위원회/, 'g19', 'All 학생선수관리위원회 documents');

// 12. All 녹색학부모회 docs → g15
checkAssignment(/녹색학부모회/, 'g15', 'All 녹색학부모회 documents');

// 13. All 학교평가운영위원회 docs → research
checkAssignment(/학교평가운영위원회/, 'research', 'All 학교평가운영위원회 documents');

// 14. All 선행학습 docs → research
checkAssignment(/선행학습/, 'research', 'All 선행학습 documents');

// Summary
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
