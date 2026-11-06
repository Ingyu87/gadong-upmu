#!/usr/bin/env node
/**
 * Viewport layout: footer/mascot must not cover content; search count stays in a panel.
 * Uses local static files only (no production deploy).
 */
const fs = require('fs');
const http = require('http');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const ART = '/opt/cursor/artifacts';
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

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

async function loadPuppeteer() {
  const candidates = [
    'puppeteer-core',
    '/tmp/prod-review/node_modules/puppeteer-core'
  ];
  for (const c of candidates) {
    try {
      return require(c);
    } catch {}
  }
  return null;
}

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      let rel = urlPath === '/' ? '/index.html' : urlPath;
      const file = path.normalize(path.join(ROOT, rel));
      if (!file.startsWith(ROOT)) {
        res.writeHead(403); res.end(); return;
      }
      fs.readFile(file, (err, buf) => {
        if (err) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
        res.end(buf);
      });
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
    server.on('error', reject);
  });
}

function overlap(a, b, pad = 2) {
  if (!a || !b || a.width < 1 || a.height < 1) return false;
  return !(a.bottom - pad <= b.top || a.top + pad >= b.bottom || a.right - pad <= b.left || a.left + pad >= b.right);
}

async function main() {
  console.log('Audit layout / viewport tests\n');

  test('CSS contract: footer below content z-index and overflow-x hidden', () => {
    const ui = fs.readFileSync(path.join(ROOT, 'split-work-ui.js'), 'utf8');
    const css = fs.readFileSync(path.join(ROOT, 'companion-ui.css'), 'utf8');
    assert(ui.includes('--footer-safe'));
    assert(css.includes('z-index:6'));
    assert(ui.includes('overflow-x:hidden'));
  });

  const puppeteer = await loadPuppeteer();
  if (!puppeteer) {
    console.log('• puppeteer-core not installed; skipped live viewport screenshots');
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  }

  const { server, port } = await startServer();
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(25000);
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const url = `http://127.0.0.1:${port}/`;
  fs.mkdirSync(ART, { recursive: true });

  const viewports = [
    [1280, 900],
    [1024, 800],
    [720, 800],
    [390, 844],
    [320, 844]
  ];

  try {
    for (const [w, h] of viewports) {
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.waitForSelector('.assignment-role, .assignment-empty');
      const home = await page.evaluate(() => {
        const footer = document.querySelector('.campus-footer')?.getBoundingClientRect().toJSON();
        const roles = [...document.querySelectorAll('.assignment-role, .assignment-card h2')].map(el => el.getBoundingClientRect().toJSON());
        const last = roles.at(-1);
        const overflow = document.documentElement.scrollWidth > window.innerWidth + 8;
        return { footer, last, overflow, docW: document.documentElement.scrollWidth, inner: window.innerWidth };
      });
      test(`home ${w} no horizontal overflow`, () => {
        assert(!home.overflow, `docW=${home.docW} inner=${home.inner}`);
      });
      await page.screenshot({ path: path.join(ART, `audit-home-${w}.png`) });

      await page.evaluate(() => { const el = document.querySelector('#assignment-search'); if (el) { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); } });
      await page.type('#assignment-search', 'xyznohit999');
      const empty = await page.evaluate(() => document.querySelector('.assignment-empty')?.textContent || '');
      test(`home ${w} empty search shows 안내`, () => {
        assert(empty.includes('맞는 담당이 없습니다'), empty);
      });

      await page.evaluate(() => { assignmentQuery = ''; assignmentDept = '전체'; });
      await page.click('#assignment-search', { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type('#assignment-search', '일람표');
      const ilam = await page.evaluate(() => ({
        text: document.querySelector('.assignment-grid')?.innerText || '',
        types: [...document.querySelectorAll('.hit-type')].map(el => el.textContent.trim())
      }));
      if (w === 1280) {
        test('home 일람표 shows research and 학성위 with types', () => {
          assert(ilam.text.includes('교육연구부장'), ilam.text.slice(0, 400));
          assert(ilam.text.includes('학업성적관리위원회'), ilam.text.slice(0, 400));
          assert(ilam.types.includes('월별 일정'), JSON.stringify(ilam.types));
          assert(ilam.types.includes('세부 업무'), JSON.stringify(ilam.types));
        });
        await page.screenshot({ path: path.join(ART, 'audit-home-ilam-search.png') });
      }

      await page.click('#assignment-search', { clickCount: 3 });
      await page.keyboard.press('Backspace');
      await page.type('#assignment-search', '9642');
      const n9642 = await page.evaluate(() => document.querySelector('.assignment-grid')?.innerText || '');
      if (w === 1280) {
        test('home 9642 locates 학성위', () => {
          assert(n9642.includes('학업성적관리위원회'), n9642.slice(0, 300));
          assert(n9642.includes('공개 문서') || n9642.includes('9642'), n9642.slice(0, 300));
        });
      }
    }

    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle2' });
    await page.waitForSelector('[data-assignment-role="교무자치부"]');
    await page.click('[data-assignment-role="교무자치부"]');
    await page.waitForSelector('.task-intro');
    await page.evaluate(() => { ST.task = '학급 편성·분반'; ST.tab = 'task'; render(); });
    await page.waitForFunction(() => document.querySelector('.task-intro h2')?.textContent.includes('학급 편성'));
    const gy = await page.evaluate(() => {
      const footer = document.querySelector('.campus-footer')?.getBoundingClientRect().toJSON();
      const h2 = [...document.querySelectorAll('.work-page h2')].find(el => el.textContent.includes('진행 순서'));
      const side = document.querySelector('.side-tasks')?.getBoundingClientRect().toJSON();
      const ox = document.querySelector('.side-tasks') ? document.querySelector('.side-tasks').scrollWidth - document.querySelector('.side-tasks').clientWidth : 0;
      return {
        footer,
        progress: h2?.getBoundingClientRect().toJSON(),
        side,
        sideOverflowX: ox,
        zFooter: getComputedStyle(document.querySelector('.campus-footer')).zIndex,
        zMain: getComputedStyle(document.querySelector('.work-main')).zIndex
      };
    });
    test('교무자치 진행 순서 is not covered by footer (z-index or padding)', () => {
      const mainAbove = Number(gy.zMain) > Number(gy.zFooter);
      const noOverlap = !overlap(gy.progress, gy.footer, 1);
      assert(mainAbove || noOverlap, JSON.stringify({ z: [gy.zMain, gy.zFooter], progress: gy.progress, footer: gy.footer }));
    });
    test('교무자치 side-tasks horizontal overflow is contained', () => {
      assert(gy.sideOverflowX <= 2, `overflowX=${gy.sideOverflowX}`);
    });
    await page.screenshot({ path: path.join(ART, 'audit-gyomu-1280.png') });

    await page.evaluate(() => { ST.tab = 'search'; ST.yr = 2026; ST.q = '평가'; render(); doSearch(); });
    await page.waitForSelector('.search-count');
    const count = await page.evaluate(() => {
      const el = document.querySelector('.search-count');
      return {
        text: el?.textContent,
        insideCard: !!el?.closest('.card'),
        bg: getComputedStyle(el).backgroundColor
      };
    });
    test('자료검색 건수 sits inside a card panel', () => {
      assert(count.insideCard, JSON.stringify(count));
      assert(/건/.test(count.text || ''), count.text);
    });
    await page.screenshot({ path: path.join(ART, 'audit-search-count-panel.png') });

    await page.evaluate(() => { go('home'); });
    await page.waitForSelector('[data-assignment-role="science"]');
    await page.click('[data-assignment-role="science"]');
    await page.waitForSelector('.task-intro');
    await page.evaluate(() => { ST.task = '개인정보 관리'; ST.tab = 'task'; render(); });
    await page.setViewport({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const mob = await page.evaluate(() => {
      const footerEl = document.querySelector('.campus-footer');
      const lastEl = [...document.querySelectorAll('.work-page .card, .work-page details')].at(-1);
      const footer = footerEl?.getBoundingClientRect().toJSON();
      const last = lastEl?.getBoundingClientRect().toJSON();
      const zFooter = footerEl ? Number(getComputedStyle(footerEl).zIndex) : 0;
      const zLast = lastEl ? Number(getComputedStyle(lastEl).zIndex || getComputedStyle(lastEl.parentElement).zIndex) : 0;
      const overflow = document.documentElement.scrollWidth > window.innerWidth + 8;
      const covered = last && footer && !(last.bottom - 4 <= footer.top || last.top + 4 >= footer.bottom || last.right <= footer.left || last.left >= footer.right);
      return { overflow, covered, zFooter, zMain: Number(getComputedStyle(document.querySelector('.work-main')).zIndex) };
    });
    test('390 개인정보 관리 last card readable vs footer', () => {
      assert(!mob.overflow, 'horizontal overflow');
      assert(!mob.covered || mob.zMain > mob.zFooter, JSON.stringify(mob));
    });
  } finally {
    await browser.close();
    await new Promise(res => server.close(res));
  }

  // Re-run 390 assertion cleanly (previous had a dummy). Already asserted overflow.
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
