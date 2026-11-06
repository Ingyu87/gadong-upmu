/**
 * Privacy Regression Tests for gadong-upmu
 * 
 * Ensures personal information is not exposed in public assets.
 * Run with: node tests/privacy.test.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const dataPath = path.join(__dirname, '..', 'data.json');
const imgPath = path.join(__dirname, '..', 'img');

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

console.log('Privacy Regression Tests\n');

test('data.json exists', () => {
  assert(fs.existsSync(dataPath), 'data.json not found');
});

test('data.json has privacy sanitization marker', () => {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  assert(data._privacy_sanitized, 'Missing _privacy_sanitized marker');
  assert(data._privacy_sanitized.version, 'Missing sanitization version');
});

test('data.json has no entries with "who" field values', () => {
  const content = fs.readFileSync(dataPath, 'utf8');
  const whoMatches = content.match(/"who"\s*:\s*"[^"]/g) || [];
  assert.strictEqual(whoMatches.length, 0, `Found ${whoMatches.length} "who" fields with values`);
});

test('data.json has no entries with "body" field values', () => {
  const content = fs.readFileSync(dataPath, 'utf8');
  const bodyMatches = content.match(/"body"\s*:\s*"[^"]/g) || [];
  assert.strictEqual(bodyMatches.length, 0, `Found ${bodyMatches.length} "body" fields with values`);
});

test('data.json has no priv=true entries', () => {
  const content = fs.readFileSync(dataPath, 'utf8');
  const privMatches = content.match(/"priv"\s*:\s*true/g) || [];
  assert.strictEqual(privMatches.length, 0, `Found ${privMatches.length} priv=true entries`);
});

test('img/ directory has only verified masked images', () => {
  if (fs.existsSync(imgPath)) {
    const files = fs.readdirSync(imgPath);
    const imageFiles = files.filter(f => /\.(webp|png|jpg|jpeg|gif)$/i.test(f));
    // 491 masked images from verified manifest are allowed
    const VERIFIED_COUNT = 491;
    assert(imageFiles.length <= VERIFIED_COUNT, 
      `Found ${imageFiles.length} images, expected max ${VERIFIED_COUNT}`);
    // All images should be .webp format (masked format)
    const nonWebp = imageFiles.filter(f => !f.endsWith('.webp'));
    assert.strictEqual(nonWebp.length, 0, 
      `Found non-webp images: ${nonWebp.slice(0, 5).join(', ')}`);
  }
});

test('data.json has no personal mobile phone numbers', () => {
  const content = fs.readFileSync(dataPath, 'utf8');
  const mobileMatches = content.match(/010-\d{4}-\d{4}/g) || [];
  assert.strictEqual(mobileMatches.length, 0, `Found ${mobileMatches.length} mobile phone numbers`);
});

test('data.json has no known personal names', () => {
  const content = fs.readFileSync(dataPath, 'utf8');
  const KNOWN_NAMES = [
    '최문위', '방은희', '이지예', '송지선', '김은진', '이주영',
    '송연수', '백인규', '박경아', '정홍주', '강미령', '배현미',
    '권보영', '허윤호', '오준수', '정대준', '정서연', '마렬미',
    '김채영', '양영숙'
  ];
  const foundNames = KNOWN_NAMES.filter(name => content.includes(name));
  assert.strictEqual(foundNames.length, 0, `Found personal names: ${foundNames.join(', ')}`);
});

test('data.json has no owners/owner fields with values', () => {
  const content = fs.readFileSync(dataPath, 'utf8');
  const ownerMatches = content.match(/"owner[s]?"\s*:\s*"[^"]/g) || [];
  const ownerArrayMatches = content.match(/"owners"\s*:\s*\[\s*"[^"]/g) || [];
  const total = ownerMatches.length + ownerArrayMatches.length;
  assert.strictEqual(total, 0, `Found ${total} owner/owners fields with values`);
});

test('data.json preserves structural data', () => {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  assert(data.R, 'Missing R (roles) object');
  assert(data.HEADS, 'Missing HEADS array');
  assert(Object.keys(data.R).length > 0, 'No roles defined');
});

test('data.json entries have required fields', () => {
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  let hasEntries = false;
  
  for (const role of Object.values(data.R)) {
    if (role.G && role.G.length > 0) {
      hasEntries = true;
      const entry = role.G[0];
      assert(entry.no, 'Entry missing "no" field');
      assert(entry.date, 'Entry missing "date" field');
      assert(entry.title, 'Entry missing "title" field');
    }
  }
  
  assert(hasEntries, 'No entries found in any role');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
