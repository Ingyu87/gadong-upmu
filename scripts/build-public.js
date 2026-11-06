#!/usr/bin/env node
/**
 * Explicit Allowlist Build Script
 * 
 * Copies ONLY explicitly listed safe files to dist/ output directory.
 * This is fail-closed: unlisted files are excluded by default.
 */

const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const ROOT = path.join(__dirname, '..');

// EXPLICIT ALLOWLIST - only these files will be deployed
const ALLOWED_FILES = [
  'index.html',
  'app.js',
  'basis-ui.js',
  'campus-atmosphere.js',
  'companion-ui.css',
  'companion-ui.js',
  'guidance-ui.js',
  'juri-weather.js',
  'split-work-ui.js',
  'workspace-ui.js',
  'data.json',
  'work-catalog.json',
  'vercel.json',
  'favicon.png',
  'apple-touch-icon.png',
  'juri.png',
  'og.png',
];

// Allowed directories (will be copied recursively)
const ALLOWED_DIRS = [
  'assets',  // School images and juri assets
  'img',     // Empty with .gitkeep only
];

// Files that MUST NOT exist in output (sentinel check)
const FORBIDDEN_PATTERNS = [
  '.quarantine',
  'quarantine',
  'scripts/',
  'tests/',
  'data-original',
  'data-backup',
  'sanitization',
  'privacy-audit',
  'audit-',
  '.env',
  'node_modules',
  '.git/',
];

// Explicit exceptions
const ALLOWED_EXCEPTIONS = [
  '.gitkeep',
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

function listAllFiles(dir, prefix = '') {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...listAllFiles(path.join(dir, entry.name), relPath));
    } else {
      files.push(relPath);
    }
  }
  return files;
}

console.log('=== Building explicit allowlist output ===\n');

// Clean dist
if (fs.existsSync(DIST)) {
  fs.rmSync(DIST, { recursive: true });
}
ensureDir(DIST);

// Copy allowed files
console.log('Copying allowed files:');
let copiedCount = 0;
for (const file of ALLOWED_FILES) {
  const src = path.join(ROOT, file);
  if (fs.existsSync(src)) {
    copyFile(src, path.join(DIST, file));
    console.log(`  ✓ ${file}`);
    copiedCount++;
  } else {
    console.log(`  ⚠ ${file} (not found, skipping)`);
  }
}

// Copy allowed directories
console.log('\nCopying allowed directories:');
for (const dir of ALLOWED_DIRS) {
  const src = path.join(ROOT, dir);
  if (fs.existsSync(src)) {
    copyDir(src, path.join(DIST, dir));
    const files = listAllFiles(path.join(DIST, dir));
    console.log(`  ✓ ${dir}/ (${files.length} files)`);
  } else {
    console.log(`  ⚠ ${dir}/ (not found, skipping)`);
  }
}

// Verify no forbidden patterns in output
console.log('\n=== Sentinel verification ===');
const outputFiles = listAllFiles(DIST);
let forbiddenFound = false;

for (const file of outputFiles) {
  const isException = ALLOWED_EXCEPTIONS.some(ex => file.endsWith(ex));
  if (isException) continue;
  
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (file.toLowerCase().includes(pattern.toLowerCase())) {
      console.log(`  ✗ FORBIDDEN: ${file} matches pattern "${pattern}"`);
      forbiddenFound = true;
    }
  }
}

if (!forbiddenFound) {
  console.log('  ✓ No forbidden patterns in output');
}

// Output summary
console.log('\n=== Build Summary ===');
console.log(`Output directory: ${DIST}`);
console.log(`Total files: ${outputFiles.length}`);
console.log('\nOutput tree:');
outputFiles.forEach(f => console.log(`  ${f}`));

// Write manifest for verification
const manifest = {
  built: new Date().toISOString(),
  files: outputFiles,
  allowedFiles: ALLOWED_FILES,
  allowedDirs: ALLOWED_DIRS,
};
fs.writeFileSync(path.join(DIST, '.build-manifest.json'), JSON.stringify(manifest, null, 2));

console.log('\n=== Build complete ===');
process.exit(forbiddenFound ? 1 : 0);
