// The forecast call (RTN-1): engine. Rules approved by Kristen Nov 28, 2026 (Phase 1 decisions 3A, 4A, 5).
// One fixed quarter (data/forecast.json): six calls, twelve deals. At each call every open deal is put in Commit (C),
// Best case (B), Pipeline (P) or Drop (D). Each category stands for a fixed probability: C 0.90, B 0.50, P 0.15, D 0.
// Error for one deal at one call = amount × (probability − outcome)², outcome 1 if the deal is won this quarter.
// Probabilities are kept in hundredths so every error is an exact integer (units: dollars × 1/10,000).
// Score = 100 × (1 − your error ÷ the error of "commit nothing", every open deal in Pipeline at every call).
// No chance anywhere: the same plan always scores the same. Checked against math/forecast.py on every build.
(function (root) {
  'use strict';
  const CATS = ['C', 'B', 'P', 'D'];
  const P100 = { C: 90, B: 50, P: 15, D: 0 };
  const NAMES = { C: 'Commit', B: 'Best case', P: 'Pipeline', D: 'Drop' };

  const won = d => d.outcome === 'won';
  const lastCall = d => d.first + d.rows.length - 1;
  const isOpen = (d, t) => t >= d.first && t <= lastCall(d);
  const rowAt = (d, t) => d.rows[t - d.first];
  function open(data, t) { return data.deals.filter(d => isOpen(d, t)); }
  const cellErr = (d, cat) => { const y = won(d) ? 100 : 0, e = P100[cat] - y; return d.amount * e * e; };

  // Data consistency: a won or lost deal leaves the board after the last call before its end week.
  function validate(data) {
    const errs = [], n = data.calls.length, ids = new Set();
    for (const d of data.deals) {
      if (ids.has(d.id)) errs.push(d.id + ': duplicate id'); ids.add(d.id);
      if (!data.reps.some(r => r.id === d.rep)) errs.push(d.id + ': unknown rep');
      if (!(d.amount > 0) || !Number.isInteger(d.amount)) errs.push(d.id + ': amount must be a positive whole number');
      if (!d.rows.length || d.first < 0 || lastCall(d) >= n) errs.push(d.id + ': rows outside the six calls');
      for (const r of d.rows) if (r.length !== 7 || CATS.indexOf(r[0]) === -1 || !(r[1] >= 1 && r[1] < data.stages.length) || [0, 1].indexOf(r[4]) === -1 || [0, 1].indexOf(r[5]) === -1 || !r[6]) errs.push(d.id + ': bad row ' + JSON.stringify(r));
      if (d.outcome === 'slip') { if (lastCall(d) !== n - 1 || d.endWeek !== null) errs.push(d.id + ': a slipped deal stays open to the last call'); }
      else if (d.outcome === 'won' || d.outcome === 'lost') {
        if (!(data.calls[lastCall(d)] < d.endWeek && d.endWeek <= (lastCall(d) + 1 < n ? data.calls[lastCall(d) + 1] : data.endWeek))) errs.push(d.id + ': end week does not match its last open call');
      } else errs.push(d.id + ': outcome must be won, lost or slip');
    }
    return errs;
  }

  // plan: { calls: [ { D1: 'C', ... }, ... ] } with up to six calls. A plan cut short stops at the next call (waiting).
  function play(data, plan) {
    const n = data.calls.length, k = Math.min(n, (plan.calls || []).length);
    const h = { err: [], commit: [], best: [], closed: [], ceo: [], bestCase: [] };
    for (let t = 0; t < k; t++) {
      const pick = plan.calls[t] || {};
      let e = 0, c = 0, b = 0;
      for (const d of open(data, t)) {
        const cat = pick[d.id];
        if (CATS.indexOf(cat) === -1) return { h, error: 'call ' + (t + 1) + ': no category for ' + d.id, waiting: t };
        e += cellErr(d, cat);
        if (cat === 'C') c += d.amount; else if (cat === 'B') b += d.amount;
      }
      let closed = 0;
      for (const d of data.deals) if (won(d) && lastCall(d) < t) closed += d.amount;
      h.err.push(e); h.commit.push(c); h.best.push(b); h.closed.push(closed); h.ceo.push(closed + c); h.bestCase.push(closed + c + b);
    }
    return { h, error: null, waiting: k < n ? k : -1 };
  }
  const total = a => a.reduce((x, y) => x + y, 0);
  function planFrom(data, fn) {
    const calls = [];
    for (let t = 0; t < data.calls.length; t++) { const m = {}; for (const d of open(data, t)) m[d.id] = fn(d, rowAt(d, t), t); calls.push(m); }
    return { calls };
  }
  const nothing = data => planFrom(data, () => 'P');
  function stats(data, r) {
    const E = total(r.h.err), E0 = total(play(data, nothing(data)).h.err);
    return { err: E, err0: E0, score: 100 * (1 - E / E0), actual: total(data.deals.filter(won).map(d => d.amount)) };
  }

  // Best adjustment of each rep: one rule per rep mapping the rep's category to yours. The error is a sum over deals and
  // calls, so each rep's rule is found on its own: 4^4 = 256 rules per rep. Ties go to the first rule in C, B, P, D order.
  function perRep(data) {
    const maps = {};
    for (const rep of data.reps) {
      let best = null;
      for (let code = 0; code < 256; code++) {
        const map = {}; CATS.forEach((c, i) => { map[c] = CATS[Math.floor(code / Math.pow(4, 3 - i)) % 4]; });
        let e = 0;
        for (const d of data.deals) if (d.rep === rep.id) d.rows.forEach(r => { e += cellErr(d, map[r[0]]); });
        if (!best || e < best.err) best = { err: e, rule: CATS.map(c => map[c]).join('') };
      }
      maps[rep.id] = best;
    }
    return maps;
  }
  // The SPICED-style signal rule used in the debrief: Commit only with both a confirmed critical event and a known decision
  // process; Best case with one; Pipeline with neither; Drop once the close date has moved twice.
  const signalRule = (d, r) => r[2] >= 2 ? 'D' : r[4] && r[5] ? 'C' : r[4] || r[5] ? 'B' : 'P';

  function refs(data) {
    const pr = perRep(data), ruleOf = {};
    for (const id in pr) { ruleOf[id] = {}; CATS.forEach((c, i) => { ruleOf[id][c] = pr[id].rule[i]; }); }
    const plans = {
      commitAll: planFrom(data, () => 'C'),
      commitNone: nothing(data),
      reps: planFrom(data, (d, r) => r[0]),
      perRep: planFrom(data, (d, r) => ruleOf[d.rep][r[0]]),
      signals: planFrom(data, signalRule),
      hindsight: planFrom(data, d => won(d) ? 'C' : 'D')
    };
    const out = { rules: pr };
    for (const k in plans) out[k] = Object.assign({ plan: plans[k] }, stats(data, play(data, plans[k])), { ceo: play(data, plans[k]).h.ceo });
    return out;
  }
  // The reps' calls, except one deal moved to a set category from a given call on (the debrief's "drop it early" lesson).
  function repsExcept(data, id, fromCall, cat) { return planFrom(data, (d, r, t) => d.id === id && t >= fromCall ? cat : r[0]); }

  const api = { CATS, P100, NAMES, open, rowAt, isOpen, lastCall, validate, play, stats, planFrom, perRep, refs, repsExcept, signalRule, cellErr };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.ForecastEngine = api;
})(this);
