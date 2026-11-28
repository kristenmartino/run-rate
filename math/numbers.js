// Numbers printed in the Phase 1 decks. Lessons and questions get numbers only through {{key|format}} placeholders,
// filled from compute(). Checked against math/numbers.py on every build (math/check.js). All examples are invented.
// Boundary: metric formulas (win rate, coverage, MAPE, NRR, GRR, CAC payback, LTV:CAC) live in Dry Run; these are the
// forecasting arithmetic the lessons teach (rollups, expected value, category weighting, to-go coverage).
'use strict';
function compute() {
  // fc1-1: Salesforce-style rollups (Read, Trailhead). Single category vs cumulative.
  const r = { closed: 300000, commit: 250000, best: 150000, pipe: 400000 };
  r.openPipe = r.pipe + r.best + r.commit;            // Open Pipeline: Pipeline + Best Case + Commit (no Most Likely here)
  r.commitF = r.commit + r.closed;                    // Commit Forecast: Commit + Closed
  r.bestF = r.best + r.commit + r.closed;             // Best Case Forecast: Best Case + Commit + Closed
  r.all = r.closed + r.commit + r.best + r.pipe;      // every category added together (a wrong answer)
  // fc1-2: stage-weighted expected value. Four deals, stage probabilities 10/40/60/90%.
  const w = { a: 300000, pa: 0.10, b: 200000, pb: 0.40, c: 150000, pc: 0.60, d: 100000, pd: 0.90 };
  w.total = w.a + w.b + w.c + w.d;
  w.ev = w.a * w.pa + w.b * w.pb + w.c * w.pc + w.d * w.pd;
  w.evEarly = w.total * w.pa;                         // the same dollars, all in Discovery
  w.share = w.ev / w.total;
  w.avg = w.total / 4;
  // fc1-4: four views of one quarter. Category weights are the app's stated weights (0.90 / 0.50 / 0.15), as in RTN-1.
  const t = { repRoll: 820000, mgrRoll: 700000, commit: 400000, best: 300000, pipe: 600000, wc: 0.90, wb: 0.50, wp: 0.15 };
  t.catEv = t.commit * t.wc + t.best * t.wb + t.pipe * t.wp;
  t.gap = t.repRoll - t.mgrRoll;
  t.sum = t.commit + t.best + t.pipe;
  t.catEvK = t.commit * 0.9 + t.best * 0.7 + t.pipe * 0.3;   // Kellogg's illustrative 0.9 / 0.7 / 0.3 (a wrong answer here)
  // fc1-6: one call's miss.
  const a = { called: 700000, actual: 630000 };
  a.miss = a.called - a.actual;
  a.missPct = a.miss / a.actual;
  a.missOfCall = a.miss / a.called;
  a.ratio = a.actual / a.called;
  a.over = a.called / a.actual;
  // rc1-3: to-go coverage (Read, Kellogg): pipeline left to close ÷ what is left to sell to hit plan.
  const g = { plan: 1000000, startPipe: 3000000, closed: 400000, openPipe: 1500000 };
  g.start = g.startPipe / g.plan;
  g.left = g.plan - g.closed;
  g.toGo = g.openPipe / g.left;
  g.ofPlan = g.openPipe / g.plan;
  g.ofClosed = g.openPipe / g.closed;
  // rc1-5: the ARR leaky bucket (Read, Kellogg): starting ARR + new ARR - churned ARR = ending ARR.
  const b = { start: 10000000, add: 2400000, churn: 900000 };
  b.end = b.start + b.add - b.churn;
  b.allAdd = b.start + b.add + b.churn;
  b.noChurn = b.start + b.add;
  b.netOnly = b.add - b.churn;
  return { r, w, t, a, g, b };
}
function flat(o, pre, out) {
  out = out || {};
  for (const k in o) { const key = pre ? pre + '.' + k : k; if (o[k] && typeof o[k] === 'object') flat(o[k], key, out); else out[key] = o[k]; }
  return out;
}
const group = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
function fmt(v, f) {
  if (typeof v === 'string') return v;
  if (f === '$') return '$' + group(Math.round(v).toString());
  if (f === '$k') return '$' + group(Math.round(v / 1000).toString()) + 'K';
  if (f === '$m') return '$' + (v / 1e6).toFixed(1) + 'M';
  const pct = /^%(\d)$/.exec(f || ''); if (pct) return (v * 100).toFixed(+pct[1]) + '%';
  const x = /^x(\d)$/.exec(f || ''); if (x) return v.toFixed(+x[1]) + 'x';
  const d = /^(\d)$/.exec(f || ''); if (!d) throw new Error('bad format ' + f);
  const s = v.toFixed(+d[1]), parts = s.split('.'); return group(parts[0]) + (parts[1] ? '.' + parts[1] : '');
}
// Replaces {{key|format}}. An unknown key or format is an error, so a typo never reaches the page.
function fill(text, FL) {
  return String(text).replace(/\{\{([a-z0-9.]+)(?:\|([^}]+))?\}\}/gi, (m, k, f) => { if (!(k in FL)) throw new Error('unknown number ' + m); return fmt(FL[k], f || '0'); });
}
module.exports = { compute, flat, fill, fmt };
