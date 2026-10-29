// Cypress spec'lerini Playwright üzerinde koşturan küçük uyumluluk katmanı.
// NEDEN: Bu ödevin hazırlandığı ortamda Cypress ikili dosyası indirilemedi (npm erişimi kapalı).
// Aynı .cy.js dosyaları burada birebir çalıştırıldı; asıl koşu `npx cypress run` ile yapılır.
// Kullanım: node tools/cy-shim.js cypress/e2e/yollar.cy.js [--video çıktı/klasörü]
const path = require('path');
const fs = require('fs');
const { chromium } = require(process.env.PW_PATH || '/opt/node22/lib/node_modules/playwright');

const ROOT = path.join(__dirname, '..');
const BASE = 'file://' + path.join(ROOT, 'dist', 'index.html');
const args = process.argv.slice(2);
const videoDir = args.includes('--video') ? args[args.indexOf('--video') + 1] : null;
const specs = args.filter((a) => a.endsWith('.cy.js'));

const tests = [];
let suite = '';
global.describe = (name, fn) => { const prev = suite; suite = name; fn(); suite = prev; };
global.it = (name, fn) => tests.push({ name: (suite ? suite + ' › ' : '') + name, fn });

let queue = [];
const ctx = { page: null, subject: null };
const enqueue = (label, fn) => queue.push({ label, fn });

async function retry(check, label, timeout = 4000) {
  const end = Date.now() + timeout; let last;
  while (Date.now() < end) {
    try { await check(); return; } catch (e) { last = e; await new Promise((r) => setTimeout(r, 100)); }
  }
  throw new Error(label + ' → ' + (last && last.message));
}

async function assert(loc, chainer, val) {
  const neg = chainer.startsWith('not.');
  const c = chainer.replace(/^not\./, '');
  if (c === 'exist') {
    const n = await loc.count();
    if (neg ? n !== 0 : n === 0) throw new Error(`beklenen ${chainer}, bulunan ${n}`);
  } else if (c === 'be.visible') {
    const v = await loc.first().isVisible();
    if (neg ? v : !v) throw new Error(`beklenen ${chainer}`);
  } else if (c === 'contain') {
    const t = (await loc.first().innerText()).replace(/\s+/g, ' ');
    const has = t.includes(val);
    if (neg ? has : !has) throw new Error(`beklenen ${chainer} "${val}", metin: "${t.slice(0, 140)}"`);
  } else if (c === 'have.length') {
    const n = await loc.count();
    if (n !== val) throw new Error(`beklenen uzunluk ${val}, bulunan ${n}`);
  } else throw new Error('desteklenmeyen assertion: ' + chainer);
}

function chain() {
  const ch = {
    should(c, v) { enqueue(`should ${c} ${v ?? ''}`, async () => { const l = ctx.subject; await retry(() => assert(l, c, v), `${c} ${v ?? ''}`); }); return ch; },
    click() { enqueue('click', async () => { await ctx.subject.first().scrollIntoViewIfNeeded(); await ctx.subject.first().click(); }); return ch; },
    type(t, o = {}) { enqueue(`type "${t}"`, async () => { await ctx.subject.first().click(); await ctx.subject.first().pressSequentially(t, { delay: o.delay || 0 }); }); return ch; },
    scrollIntoView() { enqueue('scrollIntoView', async () => { await ctx.subject.first().scrollIntoViewIfNeeded(); }); return ch; },
    last() { enqueue('last', async () => { ctx.subject = ctx.subject.last(); }); return ch; }
  };
  ch.and = ch.should;
  return ch;
}

global.cy = {
  visit: (u) => enqueue('visit ' + u, async () => { await ctx.page.goto(BASE); }),
  get: (sel) => { enqueue('get ' + sel, async () => { ctx.subject = ctx.page.locator(sel); }); return chain(); },
  wait: (ms) => enqueue('wait ' + ms, async () => { await ctx.page.waitForTimeout(ms); }),
  clock: () => enqueue('clock', async () => { await ctx.page.clock.install(); }),
  tick: (ms) => enqueue('tick ' + ms, async () => { await ctx.page.clock.runFor(ms); })
};
global.Cypress = { Commands: { add: (name, fn) => { global.cy[name] = (...a) => fn(...a); } } };

require(path.join(ROOT, 'cypress/support/e2e.js'));
specs.forEach((s) => require(path.resolve(s)));

(async () => {
  const browser = await chromium.launch();
  let pass = 0, fail = 0; const report = [];
  for (const t of tests) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 2,
      ...(videoDir ? { recordVideo: { dir: videoDir, size: { width: 390, height: 844 } } } : {})
    });
    ctx.page = await context.newPage();
    const errors = []; ctx.page.on('pageerror', (e) => errors.push(e.message));
    queue = []; t.fn();
    const t0 = Date.now();
    try {
      for (const step of queue) await step.fn();
      if (errors.length) throw new Error('sayfa hatası: ' + errors.join('; '));
      pass++; report.push(`  ✓ ${t.name} (${Date.now() - t0} ms)`);
    } catch (e) {
      fail++; report.push(`  ✗ ${t.name}\n      ${e.message}`);
    }
    await context.close();
  }
  await browser.close();
  console.log(specs.join(', '));
  console.log(report.join('\n'));
  console.log(`\n  ${pass} geçti, ${fail} kaldı, toplam ${tests.length}`);
  process.exit(fail ? 1 : 0);
})();
