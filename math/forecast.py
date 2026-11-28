"""The forecast call (RTN-1): independent Python twin of math/forecast.js.

Written from the rules, not translated line by line: categories C/B/P/D stand for 0.90/0.50/0.15/0. The error for a deal
at a call is amount * (probability - outcome)^2 with probabilities in hundredths, so errors are exact integers. Score is
100 * (1 - error / error of putting every open deal in Pipeline). Reads data/forecast.json; reads plans as JSON on stdin
and prints results as JSON. With --search, also runs the brute-force checks.
"""
import itertools
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROB = {"C": 90, "B": 50, "P": 15, "D": 0}
ORDER = "CBPD"


def load():
    with open(os.path.join(HERE, "..", "data", "forecast.json")) as f:
        return json.load(f)


def board(data):
    """For each call, the (deal, row) pairs open at it."""
    calls = [[] for _ in data["calls"]]
    for deal in data["deals"]:
        for i, row in enumerate(deal["rows"]):
            calls[deal["first"] + i].append((deal, row))
    return calls


def won_flag(deal):
    return 1 if deal["outcome"] == "won" else 0


def cost(deal, cat):
    gap = PROB[cat] - 100 * won_flag(deal)
    return deal["amount"] * gap * gap


def leaves_after(deal):
    return deal["first"] + len(deal["rows"]) - 1


def run(data, plan):
    calls = plan.get("calls", [])
    n = len(data["calls"])
    hist = {"err": [], "commit": [], "best": [], "closed": [], "ceo": [], "bestCase": []}
    open_at = board(data)
    for t in range(min(n, len(calls))):
        pick = calls[t] or {}
        err = commit = best = 0
        for deal, _row in open_at[t]:
            cat = pick.get(deal["id"])
            if cat not in PROB:
                return {"h": hist, "error": "call %d: no category for %s" % (t + 1, deal["id"]), "waiting": t}
            err += cost(deal, cat)
            if cat == "C":
                commit += deal["amount"]
            elif cat == "B":
                best += deal["amount"]
        closed = sum(d["amount"] for d in data["deals"] if won_flag(d) and leaves_after(d) < t)
        for key, val in (("err", err), ("commit", commit), ("best", best), ("closed", closed),
                         ("ceo", closed + commit), ("bestCase", closed + commit + best)):
            hist[key].append(val)
    k = min(n, len(calls))
    return {"h": hist, "error": None, "waiting": k if k < n else -1}


def make_plan(data, choose):
    out = []
    for t, cell in enumerate(board(data)):
        out.append({deal["id"]: choose(deal, row, t) for deal, row in cell})
    return {"calls": out}


def score(data, result):
    err = sum(result["h"]["err"])
    base = sum(run(data, make_plan(data, lambda d, r, t: "P"))["h"]["err"])
    actual = sum(d["amount"] for d in data["deals"] if won_flag(d))
    return {"err": err, "err0": base, "score": 100 * (1 - err / base), "actual": actual}


def best_rule_per_rep(data):
    out = {}
    for rep in data["reps"]:
        cells = [(deal, row[0]) for deal in data["deals"] if deal["rep"] == rep["id"] for row in deal["rows"]]
        best = None
        for rule in itertools.product(ORDER, repeat=4):  # same order as the JS code count: C, B, P, D digits
            mapping = dict(zip(ORDER, rule))
            err = sum(cost(deal, mapping[cat]) for deal, cat in cells)
            if best is None or err < best["err"]:
                best = {"err": err, "rule": "".join(rule)}
        out[rep["id"]] = best
    return out


def signal_cat(deal, row):
    pushes, ce, dp = row[2], row[4], row[5]
    if pushes >= 2:
        return "D"
    if ce and dp:
        return "C"
    if ce or dp:
        return "B"
    return "P"


def references(data):
    rules = best_rule_per_rep(data)
    plans = {
        "commitAll": make_plan(data, lambda d, r, t: "C"),
        "commitNone": make_plan(data, lambda d, r, t: "P"),
        "reps": make_plan(data, lambda d, r, t: r[0]),
        "perRep": make_plan(data, lambda d, r, t: rules[d["rep"]]["rule"][ORDER.index(r[0])]),
        "signals": make_plan(data, lambda d, r, t: signal_cat(d, r)),
        "hindsight": make_plan(data, lambda d, r, t: "C" if won_flag(d) else "D"),
    }
    out = {"rules": rules}
    for name, plan in plans.items():
        res = run(data, plan)
        entry = score(data, res)
        entry["ceo"] = res["h"]["ceo"]
        out[name] = entry
    return out


def brute_slice(data, deal_ids, call_ids):
    """Exhaustive search over every category choice for a few deals at a few calls; returns the least error found."""
    cells = []
    for deal in data["deals"]:
        if deal["id"] in deal_ids:
            for t in call_ids:
                if deal["first"] <= t <= leaves_after(deal):
                    cells.append(deal)
    best = None
    for combo in itertools.product(ORDER, repeat=len(cells)):
        err = sum(cost(deal, cat) for deal, cat in zip(cells, combo))
        if best is None or err < best:
            best = err
    return best


def main():
    data = load()
    req = json.loads(sys.stdin.read() or "{}")
    out = {"plans": []}
    for plan in req.get("plans", []):
        res = run(data, plan)
        if res["error"] is None and res["waiting"] < 0:
            res["stats"] = score(data, res)
        out["plans"].append(res)
    out["refs"] = references(data)
    if "--search" in sys.argv:
        out["slice"] = brute_slice(data, set(req.get("sliceDeals", [])), req.get("sliceCalls", []))
    print(json.dumps(out))


if __name__ == "__main__":
    main()
