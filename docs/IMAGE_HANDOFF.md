# Masked Image Integration Handoff

## Status: Applied to Branch
- **Branch**: `cursor/privacy-remediation-3c0b`
- **PR**: https://github.com/Ingyu87/gadong-upmu/pull/1
- **Vercel**: PAUSED (production not deployed)

## Image Assets

### Counts
- **Total masked images**: 491 verified WebP files
- **Documents with images**: 491 of 1,231 documents
- **Documents without images**: 740 (no capture available)
- **Excluded priv:true docs**: 0 (already removed from data.json)

### Verification
- All 491 image SHA256 hashes verified against manifest
- No forbidden patterns in dist output
- No raw/source/quarantine files deployed
- Build allowlist includes `img/` directory

### File Naming Convention
- 2026 documents: `{no}.webp` (e.g., `2814.webp`)
- 2025 documents: `y25_{no}.webp` (e.g., `y25_3724.webp`)

## UI Changes

### Document Modal (`app.js` openG function)
- Now displays masked image when available
- Falls back to "이미지가 없습니다" message when no capture exists
- Image styled with border and rounded corners

### Image Access
- Images served from `/img/{filename}.webp`
- HTTP 200 verified for test images
- Console shows no errors

## Test Results
```
Privacy Tests:           11/11 passed
Duty Assignment Tests:   15/15 passed
Sibling Separation:      11/11 passed
Total:                   37/37 passed
```

## Files Changed
- `img/` - 491 masked WebP images added
- `app.js` - Updated openG() for image display
- `tests/privacy.test.js` - Updated to allow verified images

## Remaining Work for Next AI
1. Repository visibility change requires admin access (HTTP 403)
2. Form links remain withheld pending provenance review
3. Some documents have no image captures (740 of 1,231)

## Do Not Change
- Project settings/visibility
- Vercel deployment status (paused)
- Merge/production deploy
- Git history (no force-push)
- Duty mappings without verification

## Build Command
```bash
node scripts/build-public.js
```

Output: `dist/` directory with allowlisted files only.

---
Updated: 2026-11-06
