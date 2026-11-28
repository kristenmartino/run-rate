// Click-tests build/index.html in headless Chrome: every screen at 360, 390 and 414 px in light and dark with no
// horizontal overflow (study-kit's width helper), the lane picker, routes, the level filter, the theme switch, the in-page
// confirm dialog, persistence after a reload, and study-kit's idle-write check against a database stand-in that sorts keys.
// The stand-in lives in the test process (exposeBinding), so it survives the reload that plays the second device.
// Native dialogs are stubbed to fail loudly: the claude.ai frame refuses window.confirm.
// Run: node build.js && node test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/npm-tools/node_modules/playwright'); } })();
const { overflow, shell, WIDTHS, SCHEMES } = require('./vendor/study-kit/widths.js');

const SCRATCH = process.env.SCRATCH || require('os').tmpdir();
// claude.ai serves the artifact body inside its own document; shell() reproduces that wrapper.
const html = fs.readFileSync(path.join(__dirname, 'build', 'index.html'), 'utf8');
const body = html.replace(/^[\s\S]*?<head>/, '').replace(/<\/head>\s*<body>/, '').replace(/<\/body>\s*<\/html>\s*$/, '').replace(/<meta[^>]*>/g, '').replace(/<title>.*?<\/title>/, '');
const file = path.join(SCRATCH, 'run-rate-test.html');
fs.writeFileSync(file, shell(body));
const URL = 'file://' + file;
const BANK = JSON.parse(/const BANK = (.*?);<\/script>/s.exec(html)[1]);
const NO_NATIVE = () => { for (const k of ['alert', 'confirm', 'prompt']) window[k] = () => { throw new Error('native ' + k + ' called'); }; };

let pass = 0; const fails = [];
function ok(c, m) { if (c) pass++; else { fails.push(m); console.log('FAIL', m); } }

(async () => {
  const browser = await chromium.launch();
  const errs = [];
  const newPage = async (opts, init) => {
    const binds = (opts || {}).__bindings; if (opts) delete opts.__bindings;
    const ctx = await browser.newContext(Object.assign({ viewport: { width: 390, height: 800 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, opts));
    for (const k in (binds || {})) await ctx.exposeBinding(k, binds[k]);
    await ctx.route('**/*', r => r.request().url().startsWith('file:') ? r.continue() : r.abort());
    await ctx.addInitScript(NO_NATIVE);
    if (init) await ctx.addInitScript(init);
    const page = await ctx.newPage(); page.setDefaultTimeout(6000);
    page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('dialog', d => { errs.push('native dialog: ' + d.type()); d.dismiss(); });
    return { ctx, page };
  };
  const fit = async (page, label) => { const r = await overflow(page); ok(r.ok, 'overflow ' + label + ' ' + JSON.stringify(r)); };
  const act = (page, a, id) => page.locator('[data-act="' + a + '"]' + (id ? '[data-id="' + id + '"]' : '')).first().click();

  // ---- 1. every screen, every width, both themes (system scheme and the forced opposite theme)
  for (const w of WIDTHS) for (const scheme of SCHEMES) {
    const { ctx, page } = await newPage({ viewport: { width: w, height: 800 }, colorScheme: scheme });
    const tag = w + ' ' + scheme;
    await page.goto(URL); await page.waitForSelector('.lanebtn');
    await fit(page, tag + ' home');
    await page.goto(URL + '#lane-sales'); await page.waitForSelector('.planrow');
    await fit(page, tag + ' sales lane');
    await page.evaluate(() => window.__rr.host.confirm('Abandon this run?', 'Your choices so far are discarded.', 'Abandon', () => {}));
    await page.waitForSelector('.cfm'); await fit(page, tag + ' confirm dialog');
    await page.keyboard.press('Escape');
    await page.goto(URL + '#craft'); await page.waitForTimeout(150); await fit(page, tag + ' craft list');
    await page.goto(URL + '#sims'); await page.waitForTimeout(150); await fit(page, tag + ' sims list');
    await page.goto(URL); await page.waitForSelector('.lanebtn');
    await act(page, 'theme', scheme === 'dark' ? 'light' : 'dark');
    ok(await page.evaluate(() => document.documentElement.getAttribute('data-theme')) === (scheme === 'dark' ? 'light' : 'dark'), tag + ' theme switch sets data-theme');
    await fit(page, tag + ' home, forced other theme');
    await page.goto(URL + '#lane-sales'); await page.waitForSelector('.planrow');
    await fit(page, tag + ' sales lane, forced other theme');
    await ctx.close();
  }

  // ---- 2. lane picker, routes, level filter, confirm dialog, reload
  {
    const { ctx, page } = await newPage();
    await page.goto(URL); await page.waitForSelector('.lanebtn');
    ok(/Run Rate/.test(await page.locator('.brand').textContent()), 'brand reads Run Rate');
    const lanes = await page.locator('.lanebtn').evaluateAll(b => b.map(x => ({ id: x.dataset.id, off: x.disabled, t: x.textContent })));
    ok(lanes.map(l => l.id).join() === 'sales,revops,customer-success,marketing,chief-revenue-officer', 'lane order ' + lanes.map(l => l.id).join());
    ok(lanes.filter(l => !l.off).map(l => l.id).join() === 'sales', 'only Sales leadership is open');
    ok(lanes.filter(l => l.off).length === 4 && lanes.filter(l => l.off).every(l => /Later$/.test(l.t)), 'the other four lanes show Later');
    const names = ['Sales leadership (including Chief Sales Officer)', 'Revenue operations (RevOps)', 'Customer success (including Chief Customer Officer)', 'Marketing (including Chief Marketing Officer)', 'Chief Revenue Officer (CRO)'];
    ok(names.every((n, i) => lanes[i].t.indexOf(n) === 0), 'lane names use full titles');
    const text = await page.locator('main').textContent();
    ok(!/\b(CDO|CRO|CPO|CCO)\b/.test(text.replace(/\((CDO|CRO|CPO|CCO)\)/g, '')), 'no bare colliding acronyms on the home screen');
    await page.locator('.lanebtn[data-id="revops"]').click({ force: true }); await page.waitForTimeout(100);
    ok(await page.locator('.lanebtn').count() === 5, 'a Later lane does not open');
    await page.goto(URL + '#lane-chief-revenue-officer'); await page.waitForSelector('.lanebtn');
    ok(await page.locator('.planrow').count() === 0, 'route to a Later lane falls back to the lane picker');
    await page.goto(URL); await page.waitForSelector('.lanebtn');
    await act(page, 'lane', 'sales'); await page.waitForSelector('.planrow');
    ok(/#lane-sales$/.test(page.url()), 'opening Sales leadership sets #lane-sales');
    ok(await page.locator('.planrow').count() === BANK.planned.sales.length, 'planned topics listed (' + BANK.planned.sales.length + ')');
    ok(await page.locator('.secrow[id]').count() === 0, 'Phase 0: no built sections, so no section ids on the page');
    const p1 = await page.locator('.planrow').evaluateAll(r => r.filter(x => /Phase 1$/.test(x.querySelector('.soon').textContent)).map(x => x.querySelector('b').textContent));
    ok(p1.join('|') === 'Sales forecasting|The forecast call', 'Phase 1 topics in the sales lane: ' + p1.join('|'));
    const laneText = await page.locator('main').textContent();
    ok(!/\b(CDO|CRO|CPO|CCO)\b/.test(laneText.replace(/\((CDO|CRO|CPO|CCO)\)/g, '')), 'no bare colliding acronyms on the lane screen');
    // level filter: all three on by default; turn one off; the last one cannot be turned off; survives a reload
    const pressed = async () => page.locator('.tog[data-act="level"]').evaluateAll(b => b.map(x => x.dataset.id + ':' + x.getAttribute('aria-pressed')).join());
    ok(await pressed() === 'director:true,vp:true,c-level:true', 'level filter: all levels on by default');
    await act(page, 'level', 'director'); await act(page, 'level', 'vp');
    ok(await pressed() === 'director:false,vp:false,c-level:true', 'level filter: C-level only');
    await act(page, 'level', 'c-level');
    ok(await pressed() === 'director:false,vp:false,c-level:true', 'level filter: the last level stays on');
    ok(/Keep at least one level on/.test(await page.locator('.toast').last().textContent()), 'level filter: says why');
    await page.reload(); await page.waitForSelector('.planrow');
    ok(await pressed() === 'director:false,vp:false,c-level:true', 'level filter survives a reload');
    await act(page, 'level', 'director'); await act(page, 'level', 'vp');
    ok(await page.locator('.planrow').count() === BANK.planned.sales.length, 'lane route survives a reload');
    // in-page confirm: focus on Cancel; Cancel, Escape and an outside click cancel; OK runs the action
    const res = [];
    await page.exposeFunction('__cfmDone', v => res.push(v));
    const ask = () => page.evaluate(() => window.__rr.host.confirm('Abandon this run?', 'Your choices so far are discarded.', 'Abandon', () => window.__cfmDone('ok')));
    await ask(); await page.waitForSelector('.cfm');
    ok(await page.evaluate(() => document.activeElement && document.activeElement.dataset.cfm) === 'cancel', 'confirm: focus starts on Cancel');
    ok(await page.locator('.cfm[role="alertdialog"]').count() === 1, 'confirm: alertdialog role');
    await page.locator('[data-cfm="cancel"]').click(); ok(await page.locator('.cfm').count() === 0 && !res.length, 'confirm: Cancel closes without acting');
    await ask(); await page.keyboard.press('Escape'); ok(await page.locator('.cfm').count() === 0 && !res.length, 'confirm: Escape cancels');
    await ask(); await page.mouse.click(5, 5); ok(await page.locator('.cfm').count() === 0 && !res.length, 'confirm: outside click cancels');
    await ask(); await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
    ok(await page.evaluate(() => document.activeElement && document.activeElement.dataset.cfm) === 'cancel', 'confirm: Tab stays inside the dialog');
    await page.locator('[data-cfm="ok"]').click(); await page.waitForTimeout(50);
    ok(res.join() === 'ok' && await page.locator('.cfm').count() === 0, 'confirm: OK runs the action');
    await act(page, 'home'); await page.waitForSelector('.lanebtn');
    ok(/last visited/.test(await page.locator('.lanebtn[data-id="sales"]').textContent()), 'home marks the last lane');
    ok(/Saved on this device/.test(await page.locator('#prefs-saved').textContent()), 'save line without Claude');
    ok(BANK.craft.length === 0 && BANK.runs.length === 0 && BANK.roleplays.length === 0, 'Phase 0: no content');
    ok(BANK.kitVersion === 'v0.2.3', 'study-kit pinned to v0.2.3');
    ok(BANK.prefix.craft === 'RT' && BANK.prefix.run === 'RTN' && BANK.prefix.rp === 'RTL', 'id prefixes RT, RTN, RTL');
    await page.goto(URL + '#sims'); await page.waitForTimeout(150);
    ok(/Simulations/.test(await page.locator('.playtop .ttl').textContent()), '#sims opens the Simulations list');
    await page.goto(URL + '#craft'); await page.waitForTimeout(150);
    ok(await page.locator('.playtop .ttl').count() === 1, '#craft opens the Craft list');
    await ctx.close();
  }

  // ---- 3. idle-write check (study-kit's method): a database that returns keys sorted; no writes once idle
  {
    const STORE = {};
    const { ctx, page } = await newPage({ __bindings: { __dbGet: () => JSON.stringify(STORE), __dbPut: (src, p, d) => { STORE[p] = d; } } }, () => {
      const sortKeys = v => Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.keys(v).sort().reduce((o, k) => { o[k] = sortKeys(v[k]); return o; }, {}) : v;
      const docs = {}, ready = window.__dbGet().then(j => Object.assign(docs, JSON.parse(j))), sets = {}; window.__docs = docs; window.__sets = sets;
      const mkRef = p => { const ls = []; const snap = () => ({ exists: !!docs[p], data: () => docs[p] ? JSON.parse(JSON.stringify(docs[p])) : undefined });
        return { set: async d => { sets[p] = (sets[p] || 0) + 1; docs[p] = sortKeys(JSON.parse(JSON.stringify(d))); window.__dbPut(p, docs[p]); setTimeout(() => ls.forEach(f => f(snap())), 5); }, onSnapshot: next => { ls.push(next); ready.then(() => setTimeout(() => next(snap()), 30)); return () => {}; } }; };
      const refs = {}, db = { doc: p => refs[p] || (refs[p] = mkRef(p)) };
      window.claude = { use: async n => n === 'db' ? db : n === 'user' ? { id: async () => 'u_loop' } : null };
    });
    await page.goto(URL); await page.waitForSelector('.lanebtn');
    await page.waitForTimeout(800);
    ok(/Saved to your account/.test(await page.locator('#prefs-saved').textContent()), 'save line shows the account once db attaches');
    await act(page, 'lane', 'sales'); await page.waitForSelector('.planrow');
    await act(page, 'level', 'director');
    await page.waitForTimeout(5000);
    const n = await page.evaluate(() => Object.assign({}, window.__sets));
    await page.waitForTimeout(3000);
    const n2 = await page.evaluate(() => Object.assign({}, window.__sets));
    ok((n['data/users/u_loop/prefs'] || 0) >= 1, 'idle-write: prefs document written (' + JSON.stringify(n) + ')');
    ok(JSON.stringify(n2) === JSON.stringify(n), 'idle-write: no further writes once idle (' + JSON.stringify(n) + ' then ' + JSON.stringify(n2) + ')');
    ok(!n['data/users/u_loop/craft'] && !n['data/users/u_loop/sims'], 'idle-write: empty Craft and Simulations documents are never written');
    const d = await page.evaluate(() => window.__docs['data/users/u_loop/prefs']);
    ok(d && d.prefs && d.prefs.lane && d.prefs.lane.v === 'sales', 'idle-write: prefs hold the lane ' + JSON.stringify(d && d.prefs));
    ok(d && d.prefs && d.prefs.levels && d.prefs.levels.v.join() === 'vp,c-level', 'idle-write: prefs hold the level filter');
    // a second device: the stored copy loads, and loading it writes nothing
    await page.evaluate(() => localStorage.clear()); await page.goto(URL); await page.reload(); await page.waitForSelector('.lanebtn'); await page.waitForTimeout(3000);
    ok(/last visited/.test(await page.locator('.lanebtn[data-id="sales"]').textContent()), 'second device: last lane comes from the account');
    const n3 = await page.evaluate(() => Object.assign({}, window.__sets));
    ok(JSON.stringify(n3) === '{}', 'second device: loading writes nothing (' + JSON.stringify(n3) + ')');
    await page.goto(URL + '#lane-sales'); await page.waitForSelector('.planrow'); await page.waitForTimeout(1500);
    ok(await page.locator('.tog[data-act="level"][data-id="director"]').getAttribute('aria-pressed') === 'false', 'second device: level filter comes from the account');
    const n4 = await page.evaluate(() => Object.assign({}, window.__sets));
    ok(JSON.stringify(n4) === '{}', 'second device: opening a lane by its route writes nothing (' + JSON.stringify(n4) + ')');
    await ctx.close();
  }

  await browser.close();
  ok(!errs.length, 'page errors: ' + errs.join(' | '));
  console.log(pass + ' passed, ' + fails.length + ' failed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
