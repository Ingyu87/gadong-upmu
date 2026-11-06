#!/usr/bin/env node
/**
 * Build Packaging Tests for Vercel Deployment
 * 
 * Verifies:
 * 1. Build script exists in source (required for buildCommand)
 * 2. Build script NOT in dist/ (not publicly served)
 * 3. Sensitive files NOT in dist/
 * 4. dist/ contains only allowlisted assets
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const BUILD_SCRIPT = path.join(ROOT, 'scripts', 'build-public.js');

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

console.log('Build Packaging Tests for Vercel Deployment\n');

// === Source Requirements (for build) ===

test('Build script exists in source', () => {
  assert(fs.existsSync(BUILD_SCRIPT), 'scripts/build-public.js must exist for buildCommand');
});

test('vercel.json references correct build script', () => {
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  assert.strictEqual(vercelConfig.buildCommand, 'node scripts/build-public.js');
  assert.strictEqual(vercelConfig.outputDirectory, 'dist');
});

// === Run build if dist doesn't exist ===

if (!fs.existsSync(DIST)) {
  console.log('\nRunning build to create dist/...');
  require('child_process').execSync('node scripts/build-public.js', { 
    cwd: ROOT, 
    stdio: 'inherit' 
  });
  console.log('');
}

// === Dist Output Security ===

test('Build script NOT in dist/ (not publicly served)', () => {
  const distScripts = path.join(DIST, 'scripts');
  assert(!fs.existsSync(distScripts), 'scripts/ should not be in dist/');
  assert(!fs.existsSync(path.join(DIST, 'build-public.js')), 'build script should not be in dist/');
});

test('Tests NOT in dist/', () => {
  const distTests = path.join(DIST, 'tests');
  assert(!fs.existsSync(distTests), 'tests/ should not be in dist/');
});

test('No .quarantine in dist/', () => {
  const quarantine = path.join(DIST, '.quarantine');
  assert(!fs.existsSync(quarantine), '.quarantine should not be in dist/');
});

test('No data-original/backup in dist/', () => {
  const files = fs.readdirSync(DIST);
  const forbidden = files.filter(f => 
    f.includes('original') || 
    f.includes('backup') || 
    f.includes('sanitization')
  );
  assert.strictEqual(forbidden.length, 0, `Found forbidden files: ${forbidden.join(', ')}`);
});

test('No .env files in dist/', () => {
  const files = fs.readdirSync(DIST);
  const envFiles = files.filter(f => f.startsWith('.env'));
  assert.strictEqual(envFiles.length, 0, `Found .env files: ${envFiles.join(', ')}`);
});

// === Dist Output Contains Required Assets ===

test('dist/ has index.html', () => {
  assert(fs.existsSync(path.join(DIST, 'index.html')), 'index.html required');
});

test('dist/ has app.js', () => {
  assert(fs.existsSync(path.join(DIST, 'app.js')), 'app.js required');
});

test('dist/ has data.json', () => {
  assert(fs.existsSync(path.join(DIST, 'data.json')), 'data.json required');
});

test('dist/ has img/ with masked images', () => {
  const imgDir = path.join(DIST, 'img');
  assert(fs.existsSync(imgDir), 'img/ directory required');
  const images = fs.readdirSync(imgDir).filter(f => f.endsWith('.webp'));
  assert(images.length === 491, `Expected 491 masked images, got ${images.length}`);
});

// === .vercelignore Security ===

test('.vercelignore excludes .quarantine/', () => {
  const vercelignore = fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8');
  assert(vercelignore.includes('.quarantine/'), '.vercelignore must exclude .quarantine/');
  assert(vercelignore.includes('quarantine/'), '.vercelignore must exclude quarantine/');
});

test('.vercelignore excludes tests/', () => {
  const vercelignore = fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8');
  assert(vercelignore.includes('tests/'), '.vercelignore must exclude tests/');
});

test('.vercelignore does NOT exclude scripts/ (needed for build)', () => {
  const vercelignore = fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8');
  // Check that scripts/ is not in the ignore list (it was previously causing build failure)
  const lines = vercelignore.split('\n').filter(l => !l.startsWith('#') && l.trim());
  const scriptsExcluded = lines.some(l => l.trim() === 'scripts/' || l.trim() === 'scripts');
  assert(!scriptsExcluded, 'scripts/ must NOT be excluded (required for buildCommand)');
});

// === Summary ===
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
