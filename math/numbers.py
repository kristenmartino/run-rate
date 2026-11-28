"""Independent Python twin of math/numbers.js: the numbers the Phase 1 decks print. Prints a flat JSON map."""
import json


def values():
    out = {}
    # fc1-1 rollups: Open Pipeline = Pipeline + Best Case + Commit; Commit Forecast = Commit + Closed;
    # Best Case Forecast = Best Case + Commit + Closed.
    closed, commit, best, pipe = 300000, 250000, 150000, 400000
    out.update({"r.closed": closed, "r.commit": commit, "r.best": best, "r.pipe": pipe,
                "r.openPipe": pipe + best + commit, "r.commitF": closed + commit, "r.bestF": closed + commit + best,
                "r.all": closed + commit + best + pipe})
    # fc1-2 stage-weighted expected value
    deals = [("a", 300000, 0.10), ("b", 200000, 0.40), ("c", 150000, 0.60), ("d", 100000, 0.90)]
    total = 0
    ev = 0.0
    for key, amt, p in deals:
        out["w." + key] = amt
        out["w.p" + key] = p
        total += amt
        ev += amt * p
    out.update({"w.total": total, "w.ev": ev, "w.evEarly": total * 0.10, "w.share": ev / total, "w.avg": total / 4})
    # fc1-4 four views
    rep, mgr, c, b, p = 820000, 700000, 400000, 300000, 600000
    out.update({"t.repRoll": rep, "t.mgrRoll": mgr, "t.commit": c, "t.best": b, "t.pipe": p,
                "t.wc": 0.90, "t.wb": 0.50, "t.wp": 0.15, "t.catEv": c * 0.90 + b * 0.50 + p * 0.15, "t.gap": rep - mgr,
                "t.sum": c + b + p, "t.catEvK": c * 0.9 + b * 0.7 + p * 0.3})
    # fc1-6 one call's miss
    called, actual = 700000, 630000
    out.update({"a.called": called, "a.actual": actual, "a.miss": called - actual, "a.missPct": (called - actual) / actual,
                "a.missOfCall": (called - actual) / called, "a.ratio": actual / called, "a.over": called / actual})
    # rc1-3 to-go coverage
    plan, start_pipe, done, open_pipe = 1000000, 3000000, 400000, 1500000
    out.update({"g.plan": plan, "g.startPipe": start_pipe, "g.closed": done, "g.openPipe": open_pipe,
                "g.start": start_pipe / plan, "g.left": plan - done, "g.toGo": open_pipe / (plan - done),
                "g.ofPlan": open_pipe / plan, "g.ofClosed": open_pipe / done})
    # rc1-5 ARR leaky bucket
    s0, add, churn = 10000000, 2400000, 900000
    out.update({"b.start": s0, "b.add": add, "b.churn": churn, "b.end": s0 + add - churn, "b.allAdd": s0 + add + churn,
                "b.noChurn": s0 + add, "b.netOnly": add - churn})
    return out


def fmt(v, f):
    """Same formats as the JS fill: $, $k, %n, xn, n."""
    if f == "$":
        return "${:,}".format(int(round(v)))
    if f == "$m":
        return "${:.1f}M".format(v / 1e6)
    if f == "$k":
        return "${:,}K".format(int(round(v / 1000)))
    if f.startswith("%"):
        return ("{:.%df}" % int(f[1:])).format(v * 100) + "%"
    if f.startswith("x"):
        return ("{:.%df}" % int(f[1:])).format(v) + "x"
    return ("{:,.%df}" % int(f)).format(v)


if __name__ == "__main__":
    import sys
    vals = values()
    if len(sys.argv) > 1 and sys.argv[1] == "--fmt":
        req = json.loads(sys.stdin.read())
        print(json.dumps({k + "|" + f: fmt(vals[k], f) for k, f in req if k in vals}))
    else:
        print(json.dumps(vals))
