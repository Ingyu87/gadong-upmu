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

const ATT_PERSONAL_PATTERN = /\([^)]*[가-힣]{2,4}\)[^/]*(강사카드|개인정보|동의서)/gi;

const KNOWN_NAMES = [
  '최문위', '방은희', '이지예', '송지선', '김은진', '이주영',
  '송연수', '백인규', '박경아', '정홍주', '강미령', '배현미',
  '권보영', '허윤호', '오준수', '정대준', '정서연', '마렬미'
];

function containsPersonName(str) {
  if (!str || typeof str !== 'string') return false;
  return KNOWN_NAMES.some(name => str.includes(name));
}

function sanitizeString(str) {
  if (!str || typeof str !== 'string') return str;
  let result = str;
  for (const name of KNOWN_NAMES) {
    result = result.replace(new RegExp(name, 'g'), '[이름 가림]');
  }
  return result;
}

function sanitizeAttachment(att) {
  if (!att) return att;
  if (ATT_PERSONAL_PATTERN.test(att) || containsPersonName(att)) {
    return '(첨부파일 있음 - 개인정보 포함으로 파일명 가림)';
  }
  return att;
}

function sanitizeEntry(entry) {
  const sanitized = { ...entry };
  
  delete sanitized.who;
  delete sanitized.body;
  delete sanitized.body_note;
  delete sanitized.previous_body;
  delete sanitized.owners;
  
  if (sanitized.att) {
    sanitized.att = sanitizeAttachment(sanitized.att);
  }
  
  if (sanitized.matching_evidence) {
    const ev = { ...sanitized.matching_evidence };
    delete ev.reason;
    delete ev.previous_body;
    if (ev.plan_section_titles) {
      ev.plan_section_titles = ev.plan_section_titles.map(t => sanitizeString(t));
    }
    sanitized.matching_evidence = ev;
  }
  
  if (sanitized.document_review_notes) {
    sanitized.document_review_notes = sanitized.document_review_notes.map(note => {
      const n = { ...note };
      delete n.previous_body;
      if (n.note && containsPersonName(n.note)) {
        n.note = sanitizeString(n.note);
      }
      return n;
    });
  }
  
  return sanitized;
}

function sanitizeDriveFile(file) {
  const sanitized = { ...file };
  delete sanitized.owners;
  if (sanitized.n && containsPersonName(sanitized.n)) {
    sanitized.n = sanitizeString(sanitized.n);
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
  
  if (sanitized.D) {
    sanitized.D = sanitized.D.map(sanitizeDriveFile);
  }
  
  return sanitized;
}

function sanitizeTask(task) {
  const sanitized = { ...task };
  delete sanitized.owners;
  delete sanitized.previous_body;
  
  if (sanitized.basis && sanitized.basis.sections) {
    sanitized.basis.sections = sanitized.basis.sections.map(section => {
      const s = { ...section };
      if (s.goal) s.goal = s.goal.map(g => sanitizeString(g));
      if (s.way) s.way = s.way.map(w => sanitizeString(w));
      return s;
    });
  }
  
  return sanitized;
}

function sanitizeGenEntry(entry) {
  const sanitized = { ...entry };
  delete sanitized.owner;
  if (sanitized.note) {
    sanitized.note = sanitizeString(sanitized.note);
  }
  if (sanitized.desc) {
    sanitized.desc = sanitizeString(sanitized.desc);
  }
  return sanitized;
}

function sanitizeHeadEntry(entry) {
  const sanitized = { ...entry };
  delete sanitized.owner;
  return sanitized;
}

function sanitizeData(data) {
  const sanitized = { ...data };
  
  if (sanitized.R) {
    const newR = {};
    for (const [key, role] of Object.entries(sanitized.R)) {
      const sanitizedRole = sanitizeRole(role);
      if (sanitizedRole.TASKS) {
        sanitizedRole.TASKS = sanitizedRole.TASKS.map(sanitizeTask);
      }
      newR[key] = sanitizedRole;
    }
    sanitized.R = newR;
  }
  
  if (sanitized.GEN) {
    sanitized.GEN = sanitized.GEN.map(sanitizeGenEntry);
  }
  
  if (sanitized.HEADS) {
    sanitized.HEADS = sanitized.HEADS.map(sanitizeHeadEntry);
  }
  
  if (sanitized.matching_review) {
    delete sanitized.matching_review;
  }
  
  if (sanitized.review_summary) {
    sanitized.review_summary = sanitizeString(JSON.stringify(sanitized.review_summary));
    try { sanitized.review_summary = JSON.parse(sanitized.review_summary); } catch(e) {}
  }
  
  sanitized._privacy_sanitized = {
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    removed: ['who', 'body', 'body_note', 'previous_body', 'owners', 'owner', 'priv=true entries', 'matching_review'],
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
