# Audit UI / search fix handoff

Branch: `cursor/audit-ui-search-fix-3c0b`  
Base: sanitized `main` `d1761453f964566a84e5f24ce36c072a62761487` (orphan root). Do not rebase onto pre-scrub history.

## What changed (reviewable, not production)

1. **Footer / mascot / sidenav**
   - `--footer-safe` padding on home and work shell.
   - Footer `z-index` 6; work content 12 so 본문 paints above clock/©.
   - Side list `overflow-x: hidden`, max-height ends above the footer.
   - Mobile (≤720): home mascot is relative, not a fixed overlay on the table.
   - School background kept.

2. **Contrast**
   - 자료검색 건수 is inside `.card.search-results .search-count` (green panel).
   - 월별 제목 / 빈 월 안내 use a light panel on the campus photo.

3. **Home search**
   - Indexes role/duty labels, **visible monthly event titles**, and **public document numbers/titles**.
   - Does **not** index `body` / private keys / the 7 excluded IDs / 6254.
   - Hits show type: `월별 일정` vs `세부 업무` vs `공개 문서` so 일람표 제출(연구부장) and 통지표·종합일람표(학성위) are not merged.
   - 0건: `.assignment-empty` 안내.

4. **캡처 없음**
   - List shows `캡처 없음 · 제목·번호 보기` before click. No `상세 보기 ›` for missing files.
   - Modal does not request a missing webp. 491 mapped captures unchanged.

5. **서식 16**
   - Still withheld. `파일 없음 · 다운로드 불가`, no href. Not resolved as downloadable files.

## Unchanged contracts

- Monthly: 모두 접기 hides cards, keeps month row; month click is title-only; title expands.
- 7/13 일람표 제출, 7/15 통지표 제출 stay on 연구부장 `research-1-1` only.
- Masked image map: 491.
- No main merge, no production deploy in this change.

## Tests

```bash
node tests/privacy.test.js
node tests/duty-assignment.test.js
node tests/ui-document-visibility.test.js
node tests/build-packaging.test.js
node tests/monthly-evidence.test.js
node tests/audit-ui-search.test.js
NODE_PATH=/tmp/prod-review/node_modules node tests/audit-layout.test.js
```

## Outstanding data (not a UI bug)

- 740 documents have no capture file; labelled honestly.
- 16 forms remain internal-review only; no public file to link.
