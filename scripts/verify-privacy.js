#!/usr/bin/env node
/**
 * Privacy Verification Script for gadong-upmu
 * 
 * Verifies that sanitized data does not contain personal information.
 * Run this BEFORE any deployment or git push.
 * 
 * Exit codes:
 *   0 - All checks passed
 *   1 - Privacy violations found
 */

const fs = require('fs');
const path = require('path');

const PHONE_PERSONAL_PATTERN = /010-\d{4}-\d{4}|016-\d{3,4}-\d{4}/g;
const PERSONAL_EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@(?!gadong\.es\.kr)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const violations = [];

function checkString(str, context) {
  if (!str || typeof str !== 'string') return;
  
  const phoneMatches = str.match(PHONE_PERSONAL_PATTERN);
  if (phoneMatches) {
    violations.push({
      type: 'PERSONAL_PHONE',
      context,
      matches: phoneMatches.slice(0, 3)
    });
  }
  
  const emailMatches = str.match(PERSONAL_EMAIL_PATTERN);
  if (emailMatches) {
    violations.push({
      type: 'PERSONAL_EMAIL',
      context,
      matches: emailMatches.slice(0, 3)
    });
  }
}

function checkEntry(entry, roleKey, index) {
  const context = `R.${roleKey}.G[${index}] (no: ${entry.no})`;
  
  if (entry.who) {
    violations.push({
      type: 'WHO_FIELD_PRESENT',
      context,
      value: entry.who
    });
  }
  
  if (entry.body) {
    violations.push({
      type: 'BODY_FIELD_PRESENT',
      context,
      sample: entry.body.slice(0, 100)
    });
  }
  
  if (entry.priv === true) {
    violations.push({
      type: 'PRIV_ENTRY_PRESENT',
      context,
      title: entry.title
    });
  }
  
  checkString(entry.title, `${context}.title`);
  checkString(entry.att, `${context}.att`);
}

function checkData(data) {
  console.log('Checking sanitized data for privacy violations...\n');
  
  if (!data._privacy_sanitized) {
    violations.push({
      type: 'NOT_SANITIZED',
      message: 'Data does not have _privacy_sanitized marker'
    });
  }
  
  if (data.R) {
    for (const [roleKey, role] of Object.entries(data.R)) {
      if (role.G) {
        role.G.forEach((entry, index) => {
          checkEntry(entry, roleKey, index);
        });
      }
    }
  }
  
  return violations.length === 0;
}

function checkImages() {
  const imgDir = path.join(__dirname, '..', 'img');
  
  if (fs.existsSync(imgDir)) {
    const files = fs.readdirSync(imgDir);
    const imageFiles = files.filter(f => /\.(webp|png|jpg|jpeg|gif)$/i.test(f));
    
    if (imageFiles.length > 0) {
      violations.push({
        type: 'UNVERIFIED_IMAGES_PRESENT',
        count: imageFiles.length,
        message: 'Unverified images must be removed or quarantined before deployment',
        samples: imageFiles.slice(0, 5)
      });
    }
  }
  
  return violations.length === 0;
}

function checkPublicAssets() {
  const assetsToCheck = ['data.json'];
  
  for (const asset of assetsToCheck) {
    const assetPath = path.join(__dirname, '..', asset);
    if (fs.existsSync(assetPath)) {
      try {
        const content = fs.readFileSync(assetPath, 'utf8');
        const data = JSON.parse(content);
        
        if (!data._privacy_sanitized) {
          violations.push({
            type: 'UNSANITIZED_PUBLIC_DATA',
            file: asset,
            message: 'Public data.json is not sanitized'
          });
        }
        
        let hasWho = false;
        let hasBody = false;
        let hasPriv = false;
        
        if (data.R) {
          for (const role of Object.values(data.R)) {
            if (role.G) {
              for (const entry of role.G) {
                if (entry.who) hasWho = true;
                if (entry.body) hasBody = true;
                if (entry.priv === true) hasPriv = true;
              }
            }
          }
        }
        
        if (hasWho) {
          violations.push({
            type: 'PUBLIC_DATA_HAS_WHO',
            file: asset,
            message: 'Public data.json contains "who" fields with personal names'
          });
        }
        
        if (hasBody) {
          violations.push({
            type: 'PUBLIC_DATA_HAS_BODY',
            file: asset,
            message: 'Public data.json contains "body" fields with document content'
          });
        }
        
        if (hasPriv) {
          violations.push({
            type: 'PUBLIC_DATA_HAS_PRIV',
            file: asset,
            message: 'Public data.json contains priv=true entries'
          });
        }
        
      } catch (e) {
        console.error(`Error checking ${asset}:`, e.message);
      }
    }
  }
}

function main() {
  console.log('='.repeat(60));
  console.log('Privacy Verification Check');
  console.log('='.repeat(60));
  console.log('');
  
  checkImages();
  checkPublicAssets();
  
  const sanitizedPath = path.join(__dirname, '..', 'data-sanitized.json');
  if (fs.existsSync(sanitizedPath)) {
    const data = JSON.parse(fs.readFileSync(sanitizedPath, 'utf8'));
    checkData(data);
  }
  
  console.log('');
  console.log('='.repeat(60));
  
  if (violations.length === 0) {
    console.log('✓ ALL CHECKS PASSED - Safe for deployment');
    console.log('='.repeat(60));
    process.exit(0);
  } else {
    console.log(`✗ FOUND ${violations.length} PRIVACY VIOLATION(S)`);
    console.log('='.repeat(60));
    console.log('');
    
    const grouped = {};
    for (const v of violations) {
      grouped[v.type] = grouped[v.type] || [];
      grouped[v.type].push(v);
    }
    
    for (const [type, items] of Object.entries(grouped)) {
      console.log(`[${type}] (${items.length} occurrences)`);
      items.slice(0, 3).forEach(item => {
        console.log(`  - ${JSON.stringify(item, null, 2).split('\n').join('\n    ')}`);
      });
      if (items.length > 3) {
        console.log(`  ... and ${items.length - 3} more`);
      }
      console.log('');
    }
    
    console.log('DEPLOYMENT BLOCKED - Fix violations before proceeding');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkData, checkImages, violations };
