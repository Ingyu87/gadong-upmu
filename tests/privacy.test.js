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

test('img/ directory has no unverified images', () => {
  if (fs.existsSync(imgPath)) {
    const files = fs.readdirSync(imgPath);
    const imageFiles = files.filter(f => /\.(webp|png|jpg|jpeg|gif)$/i.test(f));
    assert.strictEqual(imageFiles.length, 0, 
      `Found ${imageFiles.length} unverified images: ${imageFiles.slice(0, 5).join(', ')}`);
  }
});

test('data.json has no personal mobile phone numbers', () => {
  const content = fs.readFileSync(dataPath, 'utf8');
  const mobileMatches = content.match(/010-\d{4}-\d{4}/g) || [];
  assert.strictEqual(mobileMatches.length, 0, `Found ${mobileMatches.length} mobile phone numbers`);
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
