// Builds build/index.html from index.src.html and the lane data, after validating them.
// Engines come from study-kit, pinned in vendor/study-kit/VERSION. Never edit the vendored files by hand.
// `node build.js --record` adds every current link id to published-ids.json (run after a publish).
'use strict';
const fs = require('fs');
const path = require('path');
const here = __dirname;
const { loadCraft } = require('./vendor/study-kit/tools/craft-parse.js');
const { validateSims } = require('./vendor/study-kit/tools/sims-validate.js');
const L = require('./lanes.js');

// Id prefixes (proposed Phase 0, Nov 27): Craft packets RT-n, runs RTN-n, role-plays RTL-n. RR- is taken by Dry Run's
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
// Link ids use the dash form only (#lane-sales, #stage-rt-1-1).
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ORDER = 'sales,revops,customer-success,marketing,chief-revenue-officer';
for (const ln of L.lanes) {
  if (!ID.test(ln.id)) errors.push('lane ' + ln.id + ': bad id');
  claim(ln.id, 'lane'); laneIds.push(ln.id);
  if (!ln.name || !ln.blurb || !ln.short || !ln.color) errors.push('lane ' + ln.id + ': name, short, blurb and color required');
  // Naming rule: colliding acronyms appear only in brackets after the full title, never alone.
  for (const t of [ln.name, ln.short, ln.blurb]) {
    const bare = String(t).replace(/\((CDO|CRO|CPO|CCO)\)/g, '');
    if (/\b(CDO|CRO|CPO|CCO)\b/.test(bare)) errors.push('lane ' + ln.id + ': bare colliding acronym in "' + t + '"');
  }
}
if (laneIds.join() !== ORDER) errors.push('lanes are ' + ORDER + ' in that order (got ' + laneIds.join() + ')');
if (L.lanes.filter(l => l.active).map(l => l.id).join() !== 'sales') errors.push('Phase 0: only the sales leadership lane is open');
const levelIds = (L.levels || []).map(l => l.id);
if (levelIds.join() !== 'director,vp,c-level') errors.push('levels are director, vp, c-level');
for (const lane in L.sections) {
  if (laneIds.indexOf(lane) === -1) errors.push('sections for unknown lane ' + lane);
  for (const s of L.sections[lane]) {
    const id = lane + '-' + s.id;
    if (!ID.test(id)) errors.push('section ' + id + ': bad id');
    claim(id, 'section'); sectionIds.push(id);
    if (!s.title || !s.kind || !(s.phase >= 1)) errors.push('section ' + id + ': title, kind and phase required');
  }
}
for (const lane in L.planned) {
  if (laneIds.indexOf(lane) === -1) errors.push('planned topics for unknown lane ' + lane);
  for (const p of L.planned[lane]) {
    if (!p.title || !p.kind || !(p.phase >= 1)) errors.push('planned ' + lane + ': title, kind and phase required');
    if (/\b(CDO|CRO|CPO|CCO)\b/.test(String(p.title).replace(/\((CDO|CRO|CPO|CCO)\)/g, ''))) errors.push('planned ' + lane + ': bare colliding acronym in "' + p.title + '"');
  }
}
for (const ln of L.lanes.filter(l => l.active)) if (!(L.sections[ln.id] || []).length && !(L.planned[ln.id] || []).length) errors.push('open lane ' + ln.id + ': sections or planned topics required');

// Engines: no content yet (Phase 0).
const craft = loadCraft([], { dir: path.join(here, 'build', 'craft'), idPrefix: PREFIX.craft, takenIds: new Set() });
errors.push(...craft.errors);
const sims = validateSims({ runs: [], roleplays: [], runPrefix: PREFIX.run, rpPrefix: PREFIX.rp, takenIds: new Set(craft.ids) });
errors.push(...sims.errors);
for (const id of [].concat(craft.ids, sims.ids)) if (TAKEN.some(p => new RegExp('^' + p + '-\\d').test(id))) errors.push(id + ': starts with a prefix another app uses');

// Published link ids: the build refuses to drop any.
const PUB = path.join(here, 'published-ids.json');
const pub = JSON.parse(fs.readFileSync(PUB, 'utf8'));
const now = { lanes: laneIds, sections: sectionIds, craft: craft.ids, sims: sims.ids, lessons: [], questions: [], cards: [], decks: [], games: [] };
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
const bank = { levels: L.levels, lanes: L.lanes, sections: L.sections, planned: L.planned, exam: L.exam, craft: craft.packets, runs: sims.runs, roleplays: sims.roleplays, kitVersion, prefix: PREFIX };
const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
const json = JSON.stringify(bank).replace(/<\//g, '<\\/').split(LS).join('\\u2028').split(PS).join('\\u2029');
const tpl = read('index.src.html');
for (const t of ['__BANK__', '__STUDY_KIT__', '__SHELL_CSS__', '__KIT_CSS__']) if (tpl.split(t).length !== 2) { console.error('template must contain one ' + t); process.exit(1); }
const kit = read('vendor/study-kit/study-kit.js').replace(/<\//g, '<\\/');
const out = tpl.replace('__SHELL_CSS__', () => read('vendor/study-kit/shell.css')).replace('__KIT_CSS__', () => read('vendor/study-kit/study-kit.css'))
  .replace('__STUDY_KIT__', () => kit).replace('__BANK__', () => json);
fs.mkdirSync(path.join(here, 'build'), { recursive: true });
fs.writeFileSync(path.join(here, 'build', 'index.html'), out);
console.log('study-kit', kitVersion, '· lanes', laneIds.length, '(open: ' + L.lanes.filter(l => l.active).map(l => l.id).join(', ') + ') · sections', sectionIds.length,
  '· craft', craft.packets.length, '· runs', sims.runs.length, '· role-plays', sims.roleplays.length, '· bytes', Buffer.byteLength(out));
