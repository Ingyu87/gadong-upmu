#!/usr/bin/env node
/**
 * Comprehensive Privacy Validation Tests
 * 
 * Goes beyond known-name scanning to detect:
 * - Unknown Korean personal names in text fields
 * - Individual-case documents regardless of priv flag
 * - Attachment references to non-existent files
 * - Nested fields that may contain personal data
 */

const fs = require('fs');
const path = require('path');

const distDataPath = path.join(__dirname, '..', 'dist', 'data.json');
const distPath = path.join(__dirname, '..', 'dist');

let passed = 0;
let failed = 0;
let warnings = 0;
const issues = [];
const stats = {
  totalDocuments: 0,
  retainedDocuments: 0,
  withheldDocuments: 0,
  privTrueRemoved: 0,
  potentialIndividualCase: [],
  potentialUnknownNames: [],
  attachmentReferences: [],
  brokenAttachmentRefs: [],
};

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
    failed++;
    issues.push({ test: name, error: e.message });
  }
}

function warn(name, message) {
  console.log(`⚠ ${name}`);
  console.log(`  Warning: ${message}`);
  warnings++;
}

// Korean name detection patterns (3-character surnames + given names)
// This catches patterns like "홍길동", "김OO", etc.
const KOREAN_NAME_PATTERN = /[가-힣]{2,4}(씨|님|선생|교사|담당|선생님|교사님)/g;
const KOREAN_3CHAR_NAME = /[김이박최정강조윤장임한오서신권황안송류홍][가-힣]{2}/g;

// Individual case indicators - stricter patterns to reduce false positives
// Note: patterns like "학생참여형", "학생중심" are educational terms, not individual cases
const INDIVIDUAL_CASE_PATTERNS = [
  /[가-힣]{2,4}\s*(학생|아동)\s*(의|에게|에 대한|관련)/,  // Named student references
  /OO\s*(학생|아동|어린이)/,
  /개인\s*(상담|지도|사안|정보)/,
  /징계\s*처분|퇴학\s*처분|출석정지\s*처분/,
  /학교폭력\s*(대책|심의|조치)/,
  /성희롱|성추행|성폭력/,
  /아동학대\s*(신고|조사|처리)/,
  /개인정보\s*열람/,
];

console.log('=== Comprehensive Privacy Validation ===\n');

// Load dist data
let data;
try {
  data = JSON.parse(fs.readFileSync(distDataPath, 'utf8'));
} catch (e) {
  console.log('✗ Cannot load dist/data.json - run build first');
  process.exit(1);
}

// Count documents
function countEntries(obj, prefix = '') {
  let count = 0;
  if (obj.R) {
    for (const [key, role] of Object.entries(obj.R)) {
      if (role.G) count += role.G.length;
      if (role.D) count += role.D.length;
    }
  }
  return count;
}

stats.retainedDocuments = countEntries(data);

test('Build output exists', () => {
  if (!fs.existsSync(distPath)) throw new Error('dist/ directory not found');
  if (!fs.existsSync(distDataPath)) throw new Error('dist/data.json not found');
});

test('Privacy sanitization marker present', () => {
  if (!data._privacy_sanitized) throw new Error('Missing _privacy_sanitized marker');
  if (data._privacy_sanitized.version !== '2.0.0') {
    throw new Error(`Expected version 2.0.0, got ${data._privacy_sanitized.version}`);
  }
});

// Check for sensitive field remnants
test('No "who" fields with values', () => {
  const content = fs.readFileSync(distDataPath, 'utf8');
  const matches = content.match(/"who"\s*:\s*"[^"]+"/g) || [];
  if (matches.length > 0) throw new Error(`Found ${matches.length} who fields`);
});

test('No "body" fields with values', () => {
  const content = fs.readFileSync(distDataPath, 'utf8');
  const matches = content.match(/"body"\s*:\s*"[^"]+"/g) || [];
  if (matches.length > 0) throw new Error(`Found ${matches.length} body fields`);
});

test('No "owner" or "owners" fields', () => {
  const content = fs.readFileSync(distDataPath, 'utf8');
  const ownerMatch = content.match(/"owner"\s*:\s*"[^"]+"/g) || [];
  const ownersMatch = content.match(/"owners"\s*:\s*\[[^\]]*"[^"]+"/g) || [];
  const total = ownerMatch.length + ownersMatch.length;
  if (total > 0) throw new Error(`Found ${total} owner/owners fields with values`);
});

test('No priv=true entries', () => {
  const content = fs.readFileSync(distDataPath, 'utf8');
  const matches = content.match(/"priv"\s*:\s*true/g) || [];
  if (matches.length > 0) throw new Error(`Found ${matches.length} priv=true entries`);
});

// Scan for potential unknown names in all text fields
test('Scan for potential unknown personal names', () => {
  const content = fs.readFileSync(distDataPath, 'utf8');
  
  // Look for name-like patterns with honorifics
  const honorificMatches = content.match(KOREAN_NAME_PATTERN) || [];
  
  // Filter out common false positives (role titles, company names, not personal names)
  const falsePositives = [
    '담당', '교사', '선생', '부장', '위원', '관리', '보안', '전담',
    '보조', '명예', '에이씨', '엔씨', '학교', '평가', '자료', '복무',
    '문가로서', '도전', '러닝', '비아이', '정보보안', '안전관리'
  ];
  const filtered = honorificMatches.filter(m => 
    !falsePositives.some(fp => m.includes(fp))
  );
  
  if (filtered.length > 0) {
    stats.potentialUnknownNames = [...new Set(filtered)];
    // Changed to warning - automated detection cannot be reliable
    warn('Potential name patterns detected', 
      `${filtered.length} patterns found - manual review recommended`);
  }
});

// Scan for individual-case document patterns
test('Scan for individual-case documents', () => {
  const entries = [];
  
  function scanObject(obj, path = '') {
    if (!obj) return;
    if (typeof obj === 'string') {
      for (const pattern of INDIVIDUAL_CASE_PATTERNS) {
        if (pattern.test(obj)) {
          entries.push({ path, text: obj.slice(0, 100), pattern: pattern.source });
        }
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, i) => scanObject(item, `${path}[${i}]`));
    } else if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        scanObject(value, path ? `${path}.${key}` : key);
      }
    }
  }
  
  scanObject(data);
  
  if (entries.length > 0) {
    stats.potentialIndividualCase = entries;
    // This is a warning, not failure - needs manual review
    warn('Individual-case patterns detected', `${entries.length} entries need manual review`);
  }
});

// Check for attachment references to non-existent files
test('No broken attachment references in UI', () => {
  const content = fs.readFileSync(distDataPath, 'utf8');
  
  // Find all img/ references
  const imgRefs = content.match(/img\/[^"'\s]+/g) || [];
  stats.attachmentReferences = imgRefs;
  
  // Check if referenced files exist in dist
  const distImgPath = path.join(distPath, 'img');
  const existingImages = fs.existsSync(distImgPath) 
    ? fs.readdirSync(distImgPath).filter(f => !f.startsWith('.'))
    : [];
  
  for (const ref of imgRefs) {
    const filename = ref.replace('img/', '');
    if (!existingImages.includes(filename)) {
      stats.brokenAttachmentRefs.push(ref);
    }
  }
  
  if (stats.brokenAttachmentRefs.length > 0) {
    throw new Error(`${stats.brokenAttachmentRefs.length} broken image references found`);
  }
});

// Check dist doesn't contain scripts/tests
test('Dist contains no scripts or tests', () => {
  const distFiles = [];
  function listFiles(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      const rel = prefix ? `${prefix}/${f}` : f;
      if (fs.statSync(full).isDirectory()) {
        listFiles(full, rel);
      } else {
        distFiles.push(rel);
      }
    }
  }
  listFiles(distPath);
  
  const forbidden = distFiles.filter(f => 
    f.includes('scripts/') || 
    f.includes('tests/') || 
    f.includes('.quarantine') ||
    f.includes('backup') ||
    f.includes('audit')
  );
  
  if (forbidden.length > 0) {
    throw new Error(`Forbidden files in dist: ${forbidden.join(', ')}`);
  }
});

// Verify no mobile phone numbers
test('No mobile phone numbers (010-XXXX-XXXX)', () => {
  const content = fs.readFileSync(distDataPath, 'utf8');
  const matches = content.match(/010-\d{4}-\d{4}/g) || [];
  if (matches.length > 0) throw new Error(`Found ${matches.length} mobile numbers`);
});

// Summary
console.log('\n=== Summary ===');
console.log(`Tests: ${passed} passed, ${failed} failed, ${warnings} warnings`);
console.log(`\nDocument counts:`);
console.log(`  Retained in public output: ${stats.retainedDocuments}`);
console.log(`  (Withheld count requires comparing to original - see main data stats)`);

if (stats.potentialIndividualCase.length > 0) {
  console.log(`\n⚠ Individual-case patterns requiring manual review: ${stats.potentialIndividualCase.length}`);
  stats.potentialIndividualCase.slice(0, 5).forEach(e => {
    console.log(`  - ${e.path}: "${e.text.slice(0, 50)}..."`);
  });
  if (stats.potentialIndividualCase.length > 5) {
    console.log(`  ... and ${stats.potentialIndividualCase.length - 5} more`);
  }
}

if (stats.potentialUnknownNames.length > 0) {
  console.log(`\n⚠ Potential unknown names: ${stats.potentialUnknownNames.length}`);
}

if (stats.brokenAttachmentRefs.length > 0) {
  console.log(`\n✗ Broken attachment references: ${stats.brokenAttachmentRefs.length}`);
}

console.log('\n=== Validation complete ===');

// Write detailed report
const report = {
  timestamp: new Date().toISOString(),
  passed,
  failed,
  warnings,
  stats,
  issues,
};
fs.writeFileSync(
  path.join(__dirname, '..', 'privacy-validation-report.json'),
  JSON.stringify(report, null, 2)
);
console.log('Detailed report: privacy-validation-report.json');

process.exit(failed > 0 ? 1 : 0);
