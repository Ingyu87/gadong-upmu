# Monthly UI / evidence / submission handoff — 2026-11-06

Sanitized continuation notes. No personal names, bodies, or private manifests.

## Branch / PR
- Workstream branch: `cursor/monthly-evidence-fix-3c0b`
- Base: `main` @ `26e503747adb2ad1abb5df22b8863de43a10a23c` (PR1 + PR2 merged)
- New follow-up PR (not PR1): created after push
- Do **not** merge/deploy in the implementing run; parent coordinates
- Do **not** change repo visibility, history, Vercel pause/unpause, or project settings

## User changes in this run (t228u)

1. **근거 문서 버튼**
   - Available public documents open the masked-image modal (`img/{no}.webp` / `img/y25_{no}.webp` or catalog `captures`).
   - Private/removed IDs never become clickable. Label: `근거 비공개`.
   - Excluded IDs (not restored): `2025:4632`, `2025:6781`, `2025:16532`, `2025:3281`, `2026:4801`, `2026:3254`, `2026:6254`.
   - Modal does not show `who` / `body` / owners.

2. **일람표·통지표 제출 → 연구부장**
   - Moved only these 2026.7 monthly-plan submission rows:
     - 2026-07-13 `일람표 제출(~13)`
     - 2026-07-15 `통지표 제출(~15)`
   - Destination: 교육연구부장 / `학교교육과정 편성·운영` (`research-1-1`).
   - Removed from 학성위 (`g07`) catalog schedule and WP so they appear once.
   - **Not moved:** 평가계획완료, 과정중심평가 연수, 통지표 심의, 담임 작성, other 학성위 evaluation items.

3. **월별 모두 접기**
   - On 월별 업무, `모두 접기` hides the lower card area. Month selector + 업무흐름/월별/학년도 tabs remain.
   - Clicking a month shows **title-only** task cards (`<details>`). Click title to expand events/evidence/actions.
   - Month click after collapse restores title-only cards. Year switch keeps fold state if already folded.
   - Monthly collapse does **not** open the old full-screen 운동장 보기.

## Privacy / build guards (unchanged)
- 491 masked WebP in `img/` (hashes previously verified).
- `scripts/build-public.js` allowlist → `dist/` only. `scripts/` uploaded for build, not served.
- Tests: `privacy.test.js`, `build-packaging.test.js`, `duty-assignment.test.js`, `ui-document-visibility.test.js`, `monthly-evidence.test.js`.

## Remaining out of scope
- Form Google Drive links still withheld.
- Ambiguous duties not in this request (학년별 평가계획 전체, 통지표 심의, 에듀테크 구독/동의) unchanged.
- 740 documents still have no capture.
- Production deploy / pause state: parent only.
