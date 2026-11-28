// Runs the Python twins and compares. Called by build.js before anything is built.
//   numbers: every deck number within 1e-9 (relative), and every placeholder the content uses prints the same text.
//   forecast call: 400 seeded random plans (some cut short, some with a missing category) plus every reference plan;
//   every per-call value equal; the reference scores and per-rep rules equal; and the best plan in hindsight is checked
//   two ways: an exhaustive search over a slice of the board (Python, every category choice) and no random plan beats it.
'use strict';
const { execFileSync } = require('child_process');
const path = require('path');
const NJ = require('./numbers.js'), F = require('./forecast.js');
const DATA = require('../data/forecast.json');

function py(file, input, args) { return JSON.parse(execFileSync('python3', ['-I', path.join(__dirname, file)].concat(args || []), { input: input || '', maxBuffer: 1 << 28, timeout: 600000 }).toString()); }

function check(usedFormats) {
  const errs = []; let n = 0;
  // ---- deck numbers
  const J = NJ.flat(NJ.compute()), P = py('numbers.py');
  for (const k of new Set(Object.keys(J).concat(Object.keys(P)))) {
    n++;
    if (!(k in J) || !(k in P)) { errs.push('number ' + k + ' only in ' + (k in J ? 'JS' : 'Python')); continue; }
    if (Math.abs(J[k] - P[k]) > 1e-9 * Math.max(1, Math.abs(P[k]))) errs.push('number ' + k + ': JS ' + J[k] + ' vs Python ' + P[k]);
  }
  const fm = (usedFormats || []).filter(u => u[0] in J);
  if (fm.length) { const PF = py('numbers.py', JSON.stringify(fm), ['--fmt']);
    for (const [k, f] of fm) { n++; if (NJ.fmt(J[k], f) !== PF[k + '|' + f]) errs.push('number ' + k + '|' + f + ' prints ' + NJ.fmt(J[k], f) + ' in JS and ' + PF[k + '|' + f] + ' in Python'); } }

  // ---- forecast call
  const v = F.validate(DATA); if (v.length) errs.push('forecast data: ' + v.join('; '));
  let seed = 11; const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const plans = [];
  for (let k = 0; k < 400; k++) {
    const len = k % 9 === 0 ? k % 6 : 6, calls = [];
    for (let t = 0; t < len; t++) { const m = {}; for (const d of F.open(DATA, t)) if (!(k % 37 === 0 && rnd() < 0.2)) m[d.id] = F.CATS[Math.floor(rnd() * 4)]; calls.push(m); }
    plans.push({ calls });
  }
  const refs = F.refs(DATA), names = ['commitAll', 'commitNone', 'reps', 'perRep', 'signals', 'hindsight'];
  names.forEach(k => plans.push(refs[k].plan));
  const R = py('forecast.py', JSON.stringify({ plans, sliceDeals: ['D1', 'D2', 'D9'], sliceCalls: [0, 1, 2] }), ['--search']);
  let full = 0, beat = 0;
  plans.forEach((p, i) => {
    const a = F.play(DATA, p), b = R.plans[i];
    for (const key in a.h) { n += a.h[key].length; if (JSON.stringify(a.h[key]) !== JSON.stringify(b.h[key])) errs.push('forecast plan ' + i + ' ' + key + ' differs'); }
    if (a.waiting !== b.waiting || (a.error === null) !== (b.error === null)) errs.push('forecast plan ' + i + ' pause or error differs');
    if (a.error === null && a.waiting < 0) { full++; const s = F.stats(DATA, a), t = b.stats; n += 4;
      for (const key of ['err', 'err0', 'actual']) if (s[key] !== t[key]) errs.push('forecast plan ' + i + ' ' + key + ': JS ' + s[key] + ' vs Python ' + t[key]);
      if (Math.abs(s.score - t.score) > 1e-12) errs.push('forecast plan ' + i + ' score differs');
      if (s.err < refs.hindsight.err) beat++; }
  });
  if (full < 300) errs.push('forecast: only ' + full + ' plans ran to the end; the cross-check is too thin');
  if (beat) errs.push('forecast: ' + beat + ' plans beat the best plan in hindsight');
  for (const k of names) { n += 3; const a = refs[k], b = R.refs[k];
    if (a.err !== b.err || Math.abs(a.score - b.score) > 1e-12 || JSON.stringify(a.ceo) !== JSON.stringify(b.ceo)) errs.push('forecast reference ' + k + ' differs: JS ' + a.err + ' vs Python ' + b.err); }
  n++; if (JSON.stringify(refs.rules) !== JSON.stringify(R.refs.rules)) errs.push('forecast per-rep rules differ: ' + JSON.stringify(refs.rules) + ' vs ' + JSON.stringify(R.refs.rules));
  // Hindsight on the slice (3 deals × calls 1-3 = 9 cells, 4^9 = 262,144 choices in Python) must equal the error of the
  // hindsight plan on the same cells.
  let sliceJs = 0; for (const d of DATA.deals) if (['D1', 'D2', 'D9'].indexOf(d.id) !== -1) for (const t of [0, 1, 2]) if (F.isOpen(d, t)) sliceJs += F.cellErr(d, d.outcome === 'won' ? 'C' : 'D');
  n++; if (R.slice !== sliceJs) errs.push('forecast: exhaustive slice search found ' + R.slice + ', hindsight rule gives ' + sliceJs);
  return { errs, n, forecast: { refs, randomFull: full, slice: R.slice } };
}
module.exports = { check };
if (require.main === module) { const r = check(); console.log(r.errs.length ? r.errs.join('\n') : 'ok, ' + r.n + ' values'); }
