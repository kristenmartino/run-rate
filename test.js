// Click-tests build/index.html in headless Chrome: every screen at 360, 390 and 414 px in light and dark with no
// horizontal overflow (study-kit's width helper), the lane picker, routes, the level filter, the decks (every keyed answer
// marked Right, links and sources), the forecast-call sim (full runs checked against the engine, reload mid-run, the
// lock rule, abandon), the in-page confirm dialog, persistence after a reload, and study-kit's idle-write check against a
// database stand-in that sorts keys. Native dialogs are stubbed to fail loudly: the claude.ai frame refuses window.confirm.
// Run: node build.js && node test.js
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/npm-tools/node_modules/playwright'); } })();
const { overflow, shell, WIDTHS, SCHEMES } = require('./vendor/study-kit/widths.js');
const FE = require('./math/forecast.js');
const OUT = require('./content/outside.js');

const SCRATCH = process.env.SCRATCH || require('os').tmpdir();
const html = fs.readFileSync(path.join(__dirname, 'build', 'index.html'), 'utf8');
const body = html.replace(/^[\s\S]*?<head>/, '').replace(/<\/head>\s*<body>/, '').replace(/<\/body>\s*<\/html>\s*$/, '').replace(/<meta[^>]*>/g, '').replace(/<title>.*?<\/title>/, '');
const file = path.join(SCRATCH, 'run-rate-test.html');
fs.writeFileSync(file, shell(body));
const URL = 'file://' + file;
const BANK = JSON.parse(/const BANK = (.*?);<\/script>/s.exec(html)[1]);
const FD = BANK.forecast.data, REF = k => BANK.forecast.ref.find(x => x.k === k);
const NO_NATIVE = () => { for (const k of ['alert', 'confirm', 'prompt']) window[k] = () => { throw new Error('native ' + k + ' called'); }; };
const BARE = t => /\b(CDO|CRO|CPO|CCO)\b/.test(String(t).replace(/\((CDO|CRO|CPO|CCO)\)/g, ''));

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
    const page = await ctx.newPage(); page.setDefaultTimeout(8000);
    page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    page.on('dialog', d => { errs.push('native dialog: ' + d.type()); d.dismiss(); });
    return { ctx, page };
  };
  const fit = async (page, label) => { const r = await overflow(page); ok(r.ok, 'overflow ' + label + ' ' + JSON.stringify(r)); };
  const act = (page, a, id) => page.locator('[data-act="' + a + '"]' + (id ? '[data-id="' + id + '"]' : '')).first().click();
  const go = async (page, hash, sel) => { await page.goto(URL + hash); await page.waitForSelector(sel || '.playtop, .mast'); };
  // Plays a whole run: fn(deal, row, t) gives the category; returns the debrief score text.
  const playRun = async (page, fn, opts) => {
    await go(page, '#lane-sales', '.secrow'); await go(page, '#run-rtn-1', '[data-act="fc-start"], .deal');
    if (await page.locator('[data-act="fc-start"]').count()) await act(page, 'fc-start');
    for (let t = 0; t < FD.calls.length; t++) {
      await page.waitForSelector('.deal');
      if (opts && opts.reps) await act(page, 'fc-reps');
      else for (const d of FE.open(FD, t)) await page.locator('[data-act="fc-pick"][data-id="' + d.id + '"][data-c="' + fn(d, FE.rowAt(d, t), t) + '"]').click();
      if (opts && opts.reloadAt === t) { await page.reload(); await page.waitForSelector('.deal'); ok(/Call 1 of|Call \d of/.test(await page.locator('.playtop .meta').textContent()) && (await page.locator('.playtop .meta').textContent()).indexOf('Call ' + (t + 1)) === 0, 'reload mid-run keeps the call (' + (t + 1) + ')');
        if (opts.reps) await act(page, 'fc-reps'); else for (const d of FE.open(FD, t)) await page.locator('[data-act="fc-pick"][data-id="' + d.id + '"][data-c="' + fn(d, FE.rowAt(d, t), t) + '"]').click(); }
      await act(page, 'fc-lock');
    }
    await page.waitForSelector('#fc-score');
    return (await page.locator('#fc-score .v').first().textContent()).trim();
  };

  // ---- 1. every screen, every width, both themes (system scheme, then the forced opposite theme on a subset)
  const lessonIds = [].concat(...BANK.decks.map(d => d.lessons.map(l => l.id)));
  for (const w of WIDTHS) for (const scheme of SCHEMES) {
    const { ctx, page } = await newPage({ viewport: { width: w, height: 800 }, colorScheme: scheme });
    const tag = w + ' ' + scheme;
    await go(page, '', '.lanebtn'); await fit(page, tag + ' home');
    for (const lane of ['sales', 'chief-revenue-officer']) { await go(page, '#lane-' + lane, '.secrow'); await fit(page, tag + ' lane ' + lane); }
    for (const d of BANK.decks) {
      await go(page, '#deck-' + d.id, '.itemrow'); await fit(page, tag + ' deck ' + d.id);
      await go(page, '#cards-' + d.id, '.flash'); await act(page, 'card-flip'); await fit(page, tag + ' cards ' + d.id);
      await go(page, '#practice-' + d.id, '.opt'); await page.locator('.opt').first().click(); await fit(page, tag + ' practice ' + d.id);
    }
    for (const id of lessonIds) { await go(page, '#lesson-' + id, '.prose'); const q = await page.locator('.opt').count(); if (q) await page.locator('.opt').first().click(); await fit(page, tag + ' lesson ' + id); }
    await go(page, '#run-rtn-1', '[data-act="fc-start"]'); await fit(page, tag + ' sim briefing');
    await act(page, 'fc-start'); await page.waitForSelector('.deal'); await act(page, 'fc-reps'); await fit(page, tag + ' sim call');
    await page.evaluate(() => window.__rr.host.confirm('Abandon this run?', 'Your calls so far are discarded.', 'Abandon', () => {})); await page.waitForSelector('.cfm'); await fit(page, tag + ' confirm dialog'); await page.keyboard.press('Escape');
    for (let t = 0; t < FD.calls.length; t++) { await page.waitForSelector('.deal'); await act(page, 'fc-reps'); await act(page, 'fc-lock'); }
    await page.waitForSelector('#fc-score'); await fit(page, tag + ' sim debrief');
    await go(page, '#craft'); await page.waitForTimeout(100); await fit(page, tag + ' craft list');
    await go(page, '#sims'); await page.waitForTimeout(100); await fit(page, tag + ' sims list');
    await go(page, '', '.lanebtn'); await act(page, 'theme', scheme === 'dark' ? 'light' : 'dark');
    ok(await page.evaluate(() => document.documentElement.getAttribute('data-theme')) === (scheme === 'dark' ? 'light' : 'dark'), tag + ' theme switch sets data-theme');
    for (const h of ['', '#lane-sales', '#deck-fc1', '#lesson-fc1-1', '#lesson-rc1-5', '#run-rtn-1']) { await go(page, h); await fit(page, tag + ' forced other theme ' + (h || 'home')); }
    await ctx.close();
  }

  // ---- 2. lanes, routes, level filter, decks, keyed answers, links
  {
    const { ctx, page } = await newPage();
    await go(page, '', '.lanebtn');
    const lanes = await page.locator('.lanebtn').evaluateAll(b => b.map(x => ({ id: x.dataset.id, off: x.disabled, t: x.textContent })));
    ok(lanes.map(l => l.id).join() === 'sales,revops,customer-success,marketing,chief-revenue-officer', 'lane order');
    ok(lanes.filter(l => !l.off).map(l => l.id).join() === 'sales,chief-revenue-officer', 'Sales leadership and Chief Revenue Officer are open');
    ok(lanes.filter(l => l.off).length === 3 && lanes.filter(l => l.off).every(l => /Later$/.test(l.t)), 'the other three lanes show Later');
    await go(page, '#lane-revops', '.lanebtn'); ok(await page.locator('.secrow').count() === 0, 'route to a Later lane falls back to the lane picker');
    await go(page, '#lane-sales', '.secrow');
    ok((await page.locator('.secrow[id]').evaluateAll(r => r.map(x => x.id))).join() === 'sales-forecasting,sales-forecast-call', 'sales sections and ids');
    ok(await page.locator('.planrow').count() === BANK.planned.sales.length && !(await page.locator('.planrow .soon').allTextContents()).some(t => /Phase 1/.test(t)), 'planned topics are Phase 2 and later');
    await go(page, '#lane-chief-revenue-officer', '.secrow');
    ok((await page.locator('.secrow[id]').evaluateAll(r => r.map(x => x.id))).join() === 'chief-revenue-officer-cadence,chief-revenue-officer-forecast-call', 'Chief Revenue Officer sections and ids');
    ok(await page.locator('a.itemrow[href="#run-rtn-1"]').count() === 1, 'the forecast call is listed in the Chief Revenue Officer lane');
    // deck shapes
    for (const [id, n] of [['fc1', [6, 15, 12]], ['rc1', [5, 12, 10]]]) { const d = BANK.decks.find(x => x.id === id); ok(d.lessons.length === n[0] && d.questions.length === n[1] && d.cards.length === n[2], 'deck ' + id + ' has the approved shape ' + n.join('/')); }
    // level filter: C-level only hides Director-only items and the sim (Director, VP)
    await go(page, '#deck-fc1', '.itemrow');
    await act(page, 'level', 'director'); await act(page, 'level', 'vp');
    const shown = await page.locator('a.itemrow').evaluateAll(a => a.map(x => x.getAttribute('href')));
    const want = BANK.decks[0].lessons.filter(l => l.levels.indexOf('c-level') !== -1).map(l => '#lesson-' + l.id);
    ok(JSON.stringify(shown) === JSON.stringify(want), 'C-level only shows only C-level lessons: ' + shown.join(' '));
    ok(/more hidden by the level filter/.test(await page.locator('main').textContent()), 'hidden lessons are counted');
    await go(page, '#lane-sales', '.secrow');
    ok(await page.locator('a.itemrow[href="#run-rtn-1"]').count() === 0, 'C-level only hides the forecast call (Director, VP)');
    await act(page, 'level', 'director'); await act(page, 'level', 'vp');
    ok(await page.locator('a.itemrow[href="#run-rtn-1"]').count() === 1, 'all levels show the forecast call again');
    // every keyed answer is marked Right, every lesson lists its sources and its outside links point at checked addresses
    let right = 0, total = 0;
    for (const d of BANK.decks) for (const l of d.lessons) {
      await go(page, '#lesson-' + l.id, '.prose');
      const txt = await page.locator('main').textContent();
      ok(!BARE(txt), 'no bare colliding acronym on lesson ' + l.id);
      ok(await page.locator('.src li').count() >= l.sources.length + l.links.length, 'lesson ' + l.id + ' lists its sources and links');
      const hrefs = await page.locator('.prose a[target="_blank"]').evaluateAll(a => a.map(x => x.href));
      for (const [label, url] of l.links) ok(hrefs.indexOf(url) !== -1 && Object.values(OUT).some(o => o[1] === url), 'lesson ' + l.id + ' links ' + label);
      for (const q of d.questions.filter(q => q.lesson === l.id)) {
        total++;
        await page.locator('[data-act="pick"][data-id="' + q.id + '"][data-j="' + q.answer + '"]').click();
        if (/Right/.test(await page.locator('#q-' + q.id.toLowerCase() + ' .verdict').textContent())) right++;
      }
    }
    ok(total === 27 && right === 27, 'every keyed answer is marked Right (' + right + ' of ' + total + ')');
    // a wrong pick shows its whyNot
    await go(page, '#lesson-fc1-1', '.opt'); await page.reload(); await page.waitForSelector('.opt');
    const q1 = BANK.decks[0].questions[0], wrong = (q1.answer + 1) % 4;
    await page.locator('[data-act="pick"][data-id="' + q1.id + '"][data-j="' + wrong + '"]').click();
    ok((await page.locator('#q-fc1-01').textContent()).indexOf(q1.whyNot[wrong]) !== -1, 'a wrong pick shows its why-not');
    // home screen text
    await go(page, '', '.lanebtn'); ok(!BARE(await page.locator('main').textContent()), 'no bare colliding acronym on the home screen');
    await ctx.close();
  }

  // ---- 3. the forecast call: full runs equal the engine, the lock rule, reload mid-run, abandon
  {
    const { ctx, page } = await newPage();
    const repsScore = await playRun(page, null, { reps: true, reloadAt: 2 });
    ok(repsScore === REF('reps').score.toFixed(1), 'reps\' calls through the page score ' + repsScore + ' (engine ' + REF('reps').score.toFixed(1) + ')');
    const ceo = await page.locator('#fc-ceo tbody tr').evaluateAll(r => r.map(x => x.children[1].textContent));
    ok(JSON.stringify(ceo) === JSON.stringify(REF('reps').ceo.map(v => '$' + v.toLocaleString('en-US'))), 'debrief CEO numbers equal the engine');
    ok(await page.locator('#fc-compare tbody tr').count() === 6, 'debrief compares you with the five reference plans');
    ok(await page.locator('#fc-deals tbody tr').count() === FD.deals.length, 'debrief lists every deal');
    const debriefTxt = await page.locator('main').textContent();
    ok(!BARE(debriefTxt), 'no bare colliding acronym in the debrief');
    ok(BANK.forecast.lesson.every(p => debriefTxt.indexOf(p) !== -1), 'debrief shows every lesson paragraph');
    const hind = await playRun(page, d => d.outcome === 'won' ? 'C' : 'D');
    ok(hind === REF('hindsight').score.toFixed(1), 'hindsight plan through the page scores ' + hind);
    ok((await page.locator('#fc-score .v').nth(3).textContent()).trim() === hind, 'best so far is the higher run');
    const all = await playRun(page, () => 'C');
    ok(all === REF('commitAll').score.toFixed(1), 'commit everything through the page scores ' + all);
    // lock refuses an incomplete call; abandon goes through the in-page dialog
    await go(page, '#lane-sales', '.secrow'); await go(page, '#run-rtn-1', '[data-act="fc-start"]'); await act(page, 'fc-start'); await page.waitForSelector('.deal');
    await page.locator('[data-act="fc-pick"][data-id="D1"][data-c="C"]').click();
    await act(page, 'fc-lock');
    ok(/Call 1 of/.test(await page.locator('.playtop .meta').textContent()) && /Put every open deal/.test(await page.locator('.toast').last().textContent()), 'an incomplete call cannot be locked');
    ok(/still to call/.test(await page.locator('#fc-left').textContent()), 'the count of deals still to call shows');
    await act(page, 'fc-quit'); await page.waitForSelector('.cfm'); await page.locator('[data-cfm="ok"]').click();
    await page.waitForSelector('[data-act="fc-start"]');
    ok(await page.locator('[data-act="fc-debrief"]').count() === 1, 'abandon returns to the briefing and keeps the last debrief');
    // won and lost deals leave the board between calls, and the page says so
    await act(page, 'fc-start'); await page.waitForSelector('.deal');
    for (let t = 0; t < 2; t++) { await act(page, 'fc-reps'); await act(page, 'fc-lock'); await page.waitForSelector('.deal'); }
    ok(await page.locator('.deal').count() === FE.open(FD, 2).length && /Fernhill Labs won/.test(await page.locator('#fc-moved').textContent()) && /Kestrel Media lost/.test(await page.locator('#fc-moved').textContent()), 'week 6: deals that closed after week 4 left the board and are named');
    await ctx.close();
  }

  // ---- 4. idle-write check (study-kit's method): a database that returns keys sorted; no writes once idle
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
    await go(page, '', '.lanebtn'); await page.waitForTimeout(800);
    ok(/Saved to your account/.test(await page.locator('#prefs-saved').textContent()), 'save line shows the account once db attaches');
    await act(page, 'lane', 'sales'); await page.waitForSelector('.secrow');
    await act(page, 'level', 'director');
    await go(page, '#lesson-fc1-1', '.opt'); await page.locator('[data-act="pick"][data-id="FC1-01"][data-j="1"]').click();
    await go(page, '#cards-fc1', '.flash'); await act(page, 'card-flip'); await act(page, 'card-mark', 'got');
    await go(page, '#run-rtn-1', '[data-act="fc-start"]'); await act(page, 'fc-start'); await page.waitForSelector('.deal'); await act(page, 'fc-reps'); await act(page, 'fc-lock'); await page.waitForSelector('.deal');
    await page.waitForTimeout(5000);
    const n = await page.evaluate(() => Object.assign({}, window.__sets));
    await page.waitForTimeout(3000);
    const n2 = await page.evaluate(() => Object.assign({}, window.__sets));
    for (const doc of ['prefs', 'decks', 'fc']) ok((n['data/users/u_loop/' + doc] || 0) >= 1, 'idle-write: ' + doc + ' document written (' + JSON.stringify(n) + ')');
    ok(JSON.stringify(n2) === JSON.stringify(n), 'idle-write: no further writes once idle (' + JSON.stringify(n) + ' then ' + JSON.stringify(n2) + ')');
    ok(!n['data/users/u_loop/craft'] && !n['data/users/u_loop/sims'], 'idle-write: empty Craft and Simulations documents are never written');
    const docs = await page.evaluate(() => window.__docs);
    ok(docs['data/users/u_loop/decks'].decks['FC1-01'].last === 1 && docs['data/users/u_loop/decks'].decks['FC1C-01'].mark === 'got', 'idle-write: deck progress saved');
    ok(docs['data/users/u_loop/fc'].fc.game.calls.length === 1, 'idle-write: the run in progress is saved after call 1');
    // a second device: the stored copy loads, and loading it writes nothing
    await page.evaluate(() => localStorage.clear()); await page.goto(URL + '#run-rtn-1'); await page.reload(); await page.waitForSelector('.deal'); await page.waitForTimeout(3000);
    ok(/Call 2 of/.test(await page.locator('.playtop .meta').textContent()), 'second device: the run in progress comes from the account');
    const n3 = await page.evaluate(() => Object.assign({}, window.__sets));
    ok(JSON.stringify(n3) === '{}', 'second device: loading writes nothing (' + JSON.stringify(n3) + ')');
    await go(page, '#deck-fc1', '.itemrow'); await page.waitForTimeout(1500);
    ok(await page.locator('.tog[data-act="level"][data-id="director"]').getAttribute('aria-pressed') === 'false', 'second device: level filter comes from the account');
    ok(JSON.stringify(await page.evaluate(() => Object.assign({}, window.__sets))) === '{}', 'second device: browsing writes nothing');
    await ctx.close();
  }

  await browser.close();
  ok(!errs.length, 'page errors: ' + errs.join(' | '));
  console.log(pass + ' passed, ' + fails.length + ' failed');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
