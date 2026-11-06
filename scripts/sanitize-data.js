#!/usr/bin/env node
/**
 * Privacy Sanitization Script for gadong-upmu
 * 
 * Removes personal information from data.json:
 * - Removes all entries with priv: true (private documents)
 * - Removes 'who' field (drafter names - personal information)
 * - Removes 'body' field (contains signatures with personal names)
 * - Removes 'body_note' field (may contain personal references)
 * - Sanitizes 'att' field (attachment names may contain personal names)
 * - Preserves structural data for app functionality
 * 
 * School office phones (02-448-*) are institutional and NOT removed per policy.
 */

const fs = require('fs');
const path = require('path');

const PERSONAL_NAME_PATTERN = /[가-힣]{2,4}(?=\)|강사|선생|교사|교감|교장|부장)/g;
const ATT_PERSONAL_PATTERN = /\([^)]*[가-힣]{2,4}\)[^/]*(강사카드|개인정보|동의서)/gi;

function sanitizeAttachment(att) {
  if (!att) return att;
  if (ATT_PERSONAL_PATTERN.test(att)) {
    return '(첨부파일 있음 - 개인정보 포함으로 파일명 가림)';
  }
  return att;
}

function sanitizeEntry(entry) {
  const sanitized = { ...entry };
  
  delete sanitized.who;
  delete sanitized.body;
  delete sanitized.body_note;
  
  if (sanitized.att) {
    sanitized.att = sanitizeAttachment(sanitized.att);
  }
  
  if (sanitized.matching_evidence) {
    const ev = { ...sanitized.matching_evidence };
    delete ev.reason;
    sanitized.matching_evidence = ev;
  }
  
  return sanitized;
}

function sanitizeRole(role) {
  const sanitized = { ...role };
  
  if (sanitized.G) {
    sanitized.G = sanitized.G
      .filter(entry => !entry.priv)
      .map(sanitizeEntry);
  }
  
  return sanitized;
}

function sanitizeData(data) {
  const sanitized = { ...data };
  
  if (sanitized.R) {
    const newR = {};
    for (const [key, role] of Object.entries(sanitized.R)) {
      newR[key] = sanitizeRole(role);
    }
    sanitized.R = newR;
  }
  
  sanitized._privacy_sanitized = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    removed: ['who', 'body', 'body_note', 'priv=true entries'],
    note: 'Personal information removed for public deployment'
  };
  
  return sanitized;
}

function main() {
  const inputPath = path.join(__dirname, '..', 'data.json');
  const outputPath = path.join(__dirname, '..', 'data-sanitized.json');
  const statsPath = path.join(__dirname, '..', 'sanitization-stats.json');
  
  console.log('Reading data.json...');
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(rawData);
  
  let totalEntries = 0;
  let privEntries = 0;
  let whoFields = 0;
  let bodyFields = 0;
  
  if (data.R) {
    for (const role of Object.values(data.R)) {
      if (role.G) {
        totalEntries += role.G.length;
        privEntries += role.G.filter(e => e.priv).length;
        whoFields += role.G.filter(e => e.who).length;
        bodyFields += role.G.filter(e => e.body).length;
      }
    }
  }
  
  console.log(`Found ${totalEntries} total entries`);
  console.log(`  - ${privEntries} private (priv=true) entries to remove`);
  console.log(`  - ${whoFields} 'who' fields to remove`);
  console.log(`  - ${bodyFields} 'body' fields to remove`);
  
  console.log('Sanitizing data...');
  const sanitized = sanitizeData(data);
  
  let remainingEntries = 0;
  if (sanitized.R) {
    for (const role of Object.values(sanitized.R)) {
      if (role.G) {
        remainingEntries += role.G.length;
      }
    }
  }
  
  const stats = {
    timestamp: new Date().toISOString(),
    original: {
      totalEntries,
      privEntries,
      whoFields,
      bodyFields
    },
    sanitized: {
      remainingEntries,
      removedPriv: privEntries,
      removedWho: whoFields,
      removedBody: bodyFields
    }
  };
  
  console.log(`Writing sanitized data (${remainingEntries} entries remaining)...`);
  fs.writeFileSync(outputPath, JSON.stringify(sanitized, null, 2));
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  
  console.log('Sanitization complete.');
  console.log(`Output: ${outputPath}`);
  console.log(`Stats: ${statsPath}`);
  
  return stats;
}

if (require.main === module) {
  main();
}

module.exports = { sanitizeData, sanitizeEntry, sanitizeRole };
