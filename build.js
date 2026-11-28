// Builds build/index.html from index.src.html, the lane data, the decks and the forecast-call sim, after validating them.
// Engines come from study-kit, pinned in vendor/study-kit/VERSION. Never edit the vendored files by hand.
// `node build.js --record` adds every current link id to published-ids.json (run after a publish).
'use strict';
const fs = require('fs');
const path = require('path');
const here = __dirname;
const { loadCraft } = require('./vendor/study-kit/tools/craft-parse.js');
const { validateSims } = require('./vendor/study-kit/tools/sims-validate.js');
const L = require('./lanes.js');
const NUM = require('./math/numbers.js');
const SRC = require('./content/sources.js');
const OUT = require('./content/outside.js');

// Id prefixes (Phase 0, Nov 27): Craft packets RT-n, runs RTN-n, role-plays RTL-n. RR- is taken by Dry Run's
// requirements role-plays (RR-01..06); none of the eight app repos uses RT-, RTN- or RTL- as an id (Measured, Nov 25).
const PREFIX = { craft: 'RT', run: 'RTN', rp: 'RTL' };
// Some prefixes the other study apps use for packets, runs, role-plays and mock items (their published-ids.json and
// source, Measured Nov 25; Dry Run uses many more for its own rooms). A Run Rate id may not start with one of these
// followed by a dash and a digit.
const TAKEN = ['TP', 'TPN', 'TPL', 'MK', 'BR', 'BRN', 'BRL', 'BP', 'CF', 'RL', 'RN', 'FX', 'RR', 'RP', 'PK'];
for (const p of Object.values(PREFIX)) if (TAKEN.indexOf(p) !== -1) { console.error('prefix ' + p + ' is used by another app'); process.exit(1); }

const errors = [];
const laneIds = [], sectionIds = [], seen = new Set();
const claim = (id, w) => { if (seen.has(id)) errors.push(w + ': duplicate id ' + id); seen.add(id); };
// Naming rule: colliding acronyms appear only in brackets after the full title, never alone.
const bareAcronym = t => /\b(CDO|CRO|CPO|CCO)\b/.test(String(t).replace(/\((CDO|CRO|CPO|CCO)\)/g, ''));
// Link ids use the dash form only (#lane-sales, #stage-rt-1-1).
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ORDER = 'sales,revops,customer-success,marketing,chief-revenue-officer';
for (const ln of L.lanes) {
  if (!ID.test(ln.id)) errors.push('lane ' + ln.id + ': bad id');
  claim(ln.id, 'lane'); laneIds.push(ln.id);
  if (!ln.name || !ln.blurb || !ln.short || !ln.color) errors.push('lane ' + ln.id + ': name, short, blurb and color required');
  for (const t of [ln.name, ln.short, ln.blurb]) if (bareAcronym(t)) errors.push('lane ' + ln.id + ': bare colliding acronym in "' + t + '"');
}
if (laneIds.join() !== ORDER) errors.push('lanes are ' + ORDER + ' in that order (got ' + laneIds.join() + ')');
if (L.lanes.filter(l => l.active).map(l => l.id).join() !== 'sales,chief-revenue-officer') errors.push('Phase 1: Sales leadership and Chief Revenue Officer lanes are open (decision 6)');
const levelIds = (L.levels || []).map(l => l.id);
if (levelIds.join() !== 'director,vp,c-level') errors.push('levels are director, vp, c-level');
const badLevels = v => !Array.isArray(v) || !v.length || v.some(x => levelIds.indexOf(x) === -1);
for (const lane in L.sections) {
  if (laneIds.indexOf(lane) === -1) errors.push('sections for unknown lane ' + lane);
  for (const s of L.sections[lane]) {
    const id = lane + '-' + s.id;
    if (!ID.test(id)) errors.push('section ' + id + ': bad id');
    claim(id, 'section'); sectionIds.push(id);
    if (!s.title || !s.kind || !(s.phase >= 1)) errors.push('section ' + id + ': title, kind and phase required');
    if (s.kind === 'Deck' && !fs.existsSync(path.join(here, 'content', s.deck + '.js'))) errors.push('section ' + id + ': deck ' + s.deck + ' has no content file');
    if (s.kind === 'Simulation' && !/^#[a-z0-9-]+$/.test(s.route || '')) errors.push('section ' + id + ': a simulation needs a route');
    if (bareAcronym(s.title)) errors.push('section ' + id + ': bare colliding acronym');
  }
}
for (const lane in L.planned) {
  if (laneIds.indexOf(lane) === -1) errors.push('planned topics for unknown lane ' + lane);
  for (const p of L.planned[lane]) {
    if (!p.title || !p.kind || !(p.phase >= 2)) errors.push('planned ' + lane + ': title, kind and a phase from 2 on required (Phase 1 is built)');
    if (bareAcronym(p.title)) errors.push('planned ' + lane + ': bare colliding acronym in "' + p.title + '"');
  }
}
for (const ln of L.lanes.filter(l => l.active)) if (!(L.sections[ln.id] || []).length) errors.push('open lane ' + ln.id + ': sections required');

// ---- Decks (Phase 1 outline approved Nov 28: fc1 6 lessons / 15 questions / 12 cards; rc1 5 / 12 / 10)
const FL = NUM.flat(NUM.compute()), used = new Map();
const fill = (s, w) => { try { String(s).replace(/\{\{([a-z0-9.]+)(?:\|([^}]+))?\}\}/gi, (m, k, f) => { used.set(k + '|' + (f || '0'), [k, f || '0']); if (!f && typeof FL[k] === 'number' && !Number.isInteger(FL[k])) errors.push(w + ': {{' + k + '}} is ' + FL[k] + ' but has no format, so it prints rounded to a whole number'); return ''; }); return NUM.fill(s, FL); } catch (e) { errors.push(w + ': ' + e.message); return s; } };
const BLOOM = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const OUTLINE = { fc1: { counts: [3, 3, 3, 2, 2, 2], cards: 12 }, rc1: { counts: [3, 3, 2, 2, 2], cards: 10 } };
const words = s => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const outLink = k => { if (!OUT[k]) { errors.push('unknown outside link ' + k); return null; } return OUT[k]; };
const deckIds = [].concat(...Object.values(L.sections).map(a => a.filter(s => s.kind === 'Deck').map(s => s.deck)));
const DECKS = deckIds.map(id => {
  const src = require('./content/' + id + '.js'), d = src.deck, o = OUTLINE[d.id], w = 'deck ' + d.id;
  const sec = [].concat(...Object.keys(L.sections).map(lane => L.sections[lane].filter(s => s.deck === d.id).map(s => Object.assign({ lane }, s))))[0] || {};
  if (!o) errors.push(w + ': no approved outline');
  if (sec.lane !== d.lane) errors.push(w + ': its lane is ' + d.lane + ' but its section is in ' + sec.lane);
  if (!ID.test(d.id) || d.prefix !== d.id) errors.push(w + ': bad id or prefix');
  claim('deck-' + d.id, w);
  const lv = (x, xw) => { if (badLevels(x.levels)) errors.push(xw + ': levels must be a non-empty list of ' + levelIds.join(', ')); return x.levels; };
  const lessons = src.lessons.map((l, i) => {
    const lw = 'lesson ' + l.id; claim(l.id, lw);
    if (l.id !== d.prefix + '-' + (i + 1) || !l.title || !Array.isArray(l.body) || !l.body.length) errors.push(lw + ': id ' + d.prefix + '-n in order, title and body required');
    if (l.status !== 'Draft') errors.push(lw + ': status must be Draft until Kristen reviews');
    for (const p of l.body) if (!/\([^()]*\b(Read|Relayed|Inferred|Computed)\b[^()]*\)\s*$/.test(p)) errors.push(lw + ': every paragraph needs a tier tag: ' + p.slice(0, 60));
    if (!l.sources.length) errors.push(lw + ': at least one source');
    for (const k of l.sources) if (!SRC[k]) errors.push(lw + ': unknown source ' + k);
    return { id: l.id, title: l.title, status: l.status, levels: lv(l, lw), body: l.body.map(p => fill(p, lw)), sources: l.sources.map(k => SRC[k]).filter(Boolean), links: (l.links || []).map(outLink).filter(Boolean) };
  });
  if (o && lessons.length !== o.counts.length) errors.push(w + ': ' + o.counts.length + ' lessons in the approved outline, got ' + lessons.length);
  const lessonOf = id => src.lessons.find(l => l.id === id);
  const pos = [0, 0, 0, 0];
  const questions = src.questions.map((q, i) => {
    const qw = 'question ' + q.id; claim(q.id, qw);
    if (q.id !== d.qPrefix + '-' + String(i + 1).padStart(2, '0')) errors.push(qw + ': ids must run ' + d.qPrefix + '-01.. in order');
    const les = lessonOf(q.lesson); if (!les) errors.push(qw + ': unknown lesson ' + q.lesson);
    if (BLOOM.indexOf(q.level) === -1) errors.push(qw + ': level must be one of ' + BLOOM.join(', '));
    if (!Array.isArray(q.options) || q.options.length !== 4 || !(q.answer >= 0 && q.answer < 4) || !q.why || words(q.stem) < 6) errors.push(qw + ': stem, four options, an answer and a why');
    for (let j = 0; j < 4; j++) if (j !== q.answer && !(q.whyNot && q.whyNot[j])) errors.push(qw + ': option ' + j + ' needs a whyNot');
    if (q.whyNot && q.whyNot[q.answer]) errors.push(qw + ': the answer has a whyNot');
    pos[q.answer]++;
    const levels = q.levels || (les && les.levels);
    const out = { id: q.id, levels: lv({ levels }, qw), lesson: q.lesson, level: q.level, status: q.status === undefined ? 'Draft' : q.status, stem: fill(q.stem, qw), options: q.options.map(x => fill(x, qw)), answer: q.answer, why: fill(q.why, qw), whyNot: {} };
    for (const j in q.whyNot) out.whyNot[j] = fill(q.whyNot[j], qw);
    if (new Set(out.options).size !== 4) errors.push(qw + ': two options print the same text: ' + out.options.join(' | '));
    return out;
  });
  if (o) o.counts.forEach((n, i) => { const got = questions.filter(q => q.lesson === d.prefix + '-' + (i + 1)).length; if (got !== n) errors.push(w + ': lesson ' + d.prefix + '-' + (i + 1) + ' needs ' + n + ' questions (outline), has ' + got); });
  // Answer keys (kickoff rule): the key is at most 1.3 × the longest distractor, strictly longest in at most 30% of a
  // deck, and each letter is keyed 20–30% of the time.
  let longest = 0;
  for (const q of questions) { const Ls = q.options.map(x => x.length), k = Ls[q.answer], other = Math.max(...Ls.filter((x, j) => j !== q.answer));
    if (k > 1.3 * other) errors.push('question ' + q.id + ': keyed option is ' + (k / other).toFixed(2) + ' times the longest distractor (limit 1.3)');
    if (Ls.every((x, j) => j === q.answer || x < k)) longest++; }
  if (longest > Math.floor(0.3 * questions.length)) errors.push(w + ': keyed option is the longest in ' + longest + ' of ' + questions.length + ' questions (limit ' + Math.floor(0.3 * questions.length) + ')');
  { const n = questions.length, lo = Math.floor(0.2 * n), hi = Math.ceil(0.3 * n);
    if (pos.some(k => k < lo || k > hi)) errors.push(w + ': keyed answers should spread over A–D, each ' + lo + '–' + hi + ' (got ' + pos.join('/') + ')'); }
  const cards = src.cards.map((c, i) => {
    const cw = 'card ' + c.id; claim(c.id, cw);
    if (c.id !== d.cPrefix + '-' + String(i + 1).padStart(2, '0') || !c.front || !c.back) errors.push(cw + ': id ' + d.cPrefix + '-nn in order, front and back');
    return { id: c.id, levels: lv({ levels: c.levels || ['director', 'vp', 'c-level'].filter(x => src.lessons.some(l => l.levels.indexOf(x) !== -1)) }, cw), front: fill(c.front, cw), back: fill(c.back, cw), status: c.status === undefined ? 'Draft' : c.status };
  });
  if (o && cards.length !== o.cards) errors.push(w + ': ' + o.cards + ' cards in the approved outline, got ' + cards.length);
  const ln = L.lanes.find(x => x.id === d.lane);
  return { id: d.id, title: d.title, lane: d.lane, laneShort: ln ? ln.short : d.lane, lessons, questions, cards, keyPositions: pos.join('/'), keyLongest: longest };
});
for (const dk of DECKS) for (const t of [].concat(...dk.lessons.map(l => l.body.concat([l.title])), ...dk.questions.map(q => [q.stem, q.why].concat(q.options, Object.values(q.whyNot))), ...dk.cards.map(c => [c.front, c.back]))) {
  if (/\{\{|NaN|undefined|Infinity/.test(t)) errors.push('unfilled or bad number in: ' + t.slice(0, 80));
  if (bareAcronym(t)) errors.push('bare colliding acronym in: ' + t.slice(0, 80));
}

// ---- Numbers and the forecast call: JS against Python (math/check.js)
const mc = require('./math/check.js').check(Array.from(used.values()));
if (mc.errs.length) errors.push('math cross-check failed:\n  ' + mc.errs.slice(0, 20).join('\n  '));

// ---- The forecast call (RTN-1): engine math/forecast.js, checked against math/forecast.py above. Every claim the
// debrief makes is asserted here from the engine.
const F = require('./math/forecast.js'), DATA = require('./data/forecast.json'), FC = require('./content/forecast.js');
claim(FC.id, 'game');
const forecast = (() => {
  const R = mc.forecast.refs, usd = d => '$' + Math.round(d).toLocaleString('en-US'), sc = x => x.toFixed(1);
  const deal = id => DATA.deals.find(d => d.id === id);
  if (!(R.reps.score > R.commitAll.score && R.reps.score > 0)) errors.push('forecast lesson 1: the reps should beat commit everything and commit nothing');
  if (!(R.perRep.score > R.reps.score)) errors.push('forecast lesson 2: the per-rep adjustment should beat the reps');
  const drop = F.stats(DATA, F.play(DATA, F.repsExcept(DATA, 'D9', 3, 'D')));
  const iron = deal('D9'), bram = deal('D2');
  if (!(iron.outcome === 'slip' && F.rowAt(iron, 3)[0] === 'B' && F.rowAt(iron, 3)[2] === 1 && F.rowAt(iron, 4)[0] === 'D' && DATA.calls[3] === 8)) errors.push('forecast lesson 3: Ironbark should be in Lena\'s Best case at the week 8 call, first pushed then, and dropped by her at the next');
  if (!(drop.score > R.reps.score)) errors.push('forecast lesson 3: dropping Ironbark at week 8 should raise the reps\' score');
  if (!(bram.outcome === 'slip' && [0, 1, 2, 3].every(t => F.rowAt(bram, t)[0] === 'C' && F.rowAt(bram, t)[4] === 0) && F.rowAt(bram, 4)[0] !== 'C')) errors.push('forecast lesson 3: Bramble should sit in Mara\'s Commit for exactly four calls with no confirmed critical event, and slip');
  let noCe = 0, noCeWon = 0;
  for (const d of DATA.deals) d.rows.forEach(r => { if (!r[4]) { noCe += d.amount; if (d.outcome === 'won') noCeWon += d.amount; } });
  const noCePct = noCeWon / noCe;
  if (!(noCePct < 0.2)) errors.push('forecast lesson 4: few dollars without a confirmed critical event should close (got ' + noCePct + ')');
  if (!(R.hindsight.score < 100 && ['commitAll', 'commitNone', 'reps', 'perRep', 'signals'].every(k => R[k].score < R.hindsight.score))) errors.push('forecast lesson 5: hindsight is below 100 and above every other plan');
  if (mc.forecast.randomFull < 300) errors.push('forecast: too few random plans checked');
  const repName = id => DATA.reps.find(r => r.id === id).name.split(' ')[0];
  const ruleText = DATA.reps.map(rep => {
    const usedCats = new Set([].concat(...DATA.deals.filter(d => d.rep === rep.id).map(d => d.rows.map(r => r[0]))));
    const rule = R.rules[rep.id].rule, changes = F.CATS.filter((c, i) => usedCats.has(c) && rule[i] !== c).map(c => F.NAMES[c] + ' → ' + F.NAMES[rule[F.CATS.indexOf(c)]]);
    return repName(rep.id) + ': ' + (changes.length ? changes.join(', ') : 'no change');
  }).join('; ');
  const V = { company: DATA.company, weeks: DATA.endWeek, nCalls: DATA.calls.length, callWeeks: DATA.calls.slice(0, -1).join(', ') + ' and ' + DATA.calls[DATA.calls.length - 1], nDeals: DATA.deals.length, plan: usd(DATA.plan),
    pC: (F.P100.C / 100).toFixed(2), pB: (F.P100.B / 100).toFixed(2), pP: (F.P100.P / 100).toFixed(2),
    repsScore: sc(R.reps.score), allScore: sc(R.commitAll.score), perRepScore: sc(R.perRep.score), ruleText, ironAmt: usd(iron.amount), brambleAmt: usd(bram.amount), dropScore: sc(drop.score),
    signalScore: sc(R.signals.score), noCePct: (100 * noCePct).toFixed(0) + '%', hindScore: sc(R.hindsight.score), repsCeo1: usd(R.reps.ceo[0]), repsCeoLast: usd(R.reps.ceo[R.reps.ceo.length - 1]), actual: usd(R.reps.actual) };
  // Lesson numbers must read the same when rounded: the printed scores must keep their order.
  if (!(+V.perRepScore > +V.repsScore && +V.dropScore > +V.repsScore && +V.repsScore > +V.allScore)) errors.push('forecast: rounded scores lose their order');
  const f = (t, w) => t.replace(/\{([A-Za-z0-9]+)\}/g, (m, k) => { if (!(k in V)) { errors.push('forecast ' + w + ': unknown {' + k + '}'); return m; } return String(V[k]); });
  FC.lesson.forEach((p, i) => { if (!/\((Read|Relayed|Inferred|Computed)/.test(p)) errors.push('forecast lesson ' + (i + 1) + ': needs a tier tag'); });
  const lessonIds = new Set([].concat(...DECKS.map(d => d.lessons.map(l => l.id))));
  for (const [id] of FC.links) if (!lessonIds.has(id)) errors.push('forecast: unknown lesson ' + id);
  if (badLevels(FC.levels)) errors.push('forecast: bad levels');
  for (const k of FC.sources) if (!SRC[k]) errors.push('forecast: unknown source ' + k);
  const out = { id: FC.id, title: FC.title, status: FC.status, levels: FC.levels, blurb: f(FC.blurb, 'blurb'), briefing: FC.briefing.map((p, i) => f(p, 'briefing ' + i)), lesson: FC.lesson.map((p, i) => f(p, 'lesson ' + i)),
    links: FC.links, outside: FC.outside.map(outLink).filter(Boolean), sources: FC.sources.map(k => SRC[k]),
    data: DATA, p100: F.P100,
    ref: ['hindsight', 'perRep', 'reps', 'commitNone', 'commitAll'].map(k => ({ k, score: R[k].score, ceo: R[k].ceo })), rules: R.rules };
  for (const t of [out.blurb].concat(out.briefing, out.lesson)) { if (/\{[A-Za-z0-9]+\}|NaN|undefined/.test(t)) errors.push('forecast: unfilled text: ' + t.slice(0, 60)); if (bareAcronym(t)) errors.push('forecast: bare colliding acronym in: ' + t.slice(0, 60)); }
  for (const d of DATA.deals) for (const r of d.rows) if (bareAcronym(r[6])) errors.push('forecast data ' + d.id + ': bare colliding acronym');
  return out;
})();

// Engines: no Craft packets, kit runs or role-plays yet (Phase 4).
const craft = loadCraft([], { dir: path.join(here, 'build', 'craft'), idPrefix: PREFIX.craft, takenIds: new Set() });
errors.push(...craft.errors);
const sims = validateSims({ runs: [], roleplays: [], runPrefix: PREFIX.run, rpPrefix: PREFIX.rp, takenIds: new Set(craft.ids.concat([FC.id])) });
errors.push(...sims.errors);
for (const id of [].concat(craft.ids, sims.ids, [FC.id])) if (TAKEN.some(p => new RegExp('^' + p + '-\\d').test(id))) errors.push(id + ': starts with a prefix another app uses');

// Published link ids: the build refuses to drop any.
const PUB = path.join(here, 'published-ids.json');
const pub = JSON.parse(fs.readFileSync(PUB, 'utf8'));
const now = { lanes: laneIds, sections: sectionIds, craft: craft.ids, sims: sims.ids,
  lessons: [].concat(...DECKS.map(d => d.lessons.map(l => l.id))), questions: [].concat(...DECKS.map(d => d.questions.map(q => q.id))),
  cards: [].concat(...DECKS.map(d => d.cards.map(c => c.id))), decks: DECKS.map(d => d.id), games: [FC.id] };
for (const k of Object.keys(pub)) if (k !== 'note' && !(k in now)) errors.push('published-ids.json has an unknown kind ' + k);
for (const k of Object.keys(now)) for (const id of (pub[k] || [])) if (now[k].indexOf(id) === -1) errors.push('published ' + k + ' id ' + id + ' is missing; links depend on it');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
if (process.argv.includes('--record')) {
  const rec = { note: pub.note };
  for (const k of Object.keys(now)) rec[k] = Array.from(new Set((pub[k] || []).concat(now[k])));
  fs.writeFileSync(PUB, JSON.stringify(rec, null, 1) + '\n');
  console.log('recorded', Object.keys(now).map(k => rec[k].length + ' ' + k).join(', '));
}

const read = f => fs.readFileSync(path.join(here, f), 'utf8');
const kitVersion = read('vendor/study-kit/VERSION').split('\n')[0].trim();
const bank = { levels: L.levels, lanes: L.lanes, sections: L.sections, planned: L.planned, exam: L.exam, craft: craft.packets, runs: sims.runs, roleplays: sims.roleplays, kitVersion, prefix: PREFIX, decks: DECKS, forecast };
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
const json = JSON.stringify(bank).replace(/<\//g, '<\\/').split(LS).join('\\u2028').split(PS).join('\\u2029');
const tpl = read('index.src.html');
for (const t of ['__BANK__', '__STUDY_KIT__', '__SHELL_CSS__', '__KIT_CSS__', '__FC_ENGINE__']) if (tpl.split(t).length !== 2) { console.error('template must contain one ' + t); process.exit(1); }
const kit = read('vendor/study-kit/study-kit.js').replace(/<\//g, '<\\/');
const out = tpl.replace('__SHELL_CSS__', () => read('vendor/study-kit/shell.css')).replace('__KIT_CSS__', () => read('vendor/study-kit/study-kit.css'))
  .replace('__STUDY_KIT__', () => kit).replace('__FC_ENGINE__', () => read('math/forecast.js').replace(/<\//g, '<\\/')).replace('__BANK__', () => json);
fs.mkdirSync(path.join(here, 'build'), { recursive: true });
fs.writeFileSync(path.join(here, 'build', 'index.html'), out);
console.log('study-kit', kitVersion, '· lanes', laneIds.length, '(open: ' + L.lanes.filter(l => l.active).map(l => l.id).join(', ') + ') · sections', sectionIds.length,
  '· decks', DECKS.map(d => d.id + ' ' + d.lessons.length + '/' + d.questions.length + '/' + d.cards.length + ' keys ' + d.keyPositions + ' longest ' + d.keyLongest).join(', '),
  '· forecast scores', forecast.ref.map(r => r.k + ' ' + r.score.toFixed(1)).join(' '), '· values checked', mc.n, '· bytes', Buffer.byteLength(out));
