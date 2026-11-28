# Run Rate

Revenue study app: sales leadership (including Chief Sales Officer), revenue operations (RevOps), customer success (including Chief Customer Officer), marketing (including Chief Marketing Officer) and Chief Revenue Officer (CRO). Plan of record: `claude/revenue-cro-app-plan.md` in the claude.ai Project "Interview, Cert Exam, and Career Prep Apps". Status and handoffs: `claude/run-rate-status.md`. Shared rules: `claude/study-apps-index.md`. Shared module owners: `claude/c-suite-series-plan.md`.

## Rules
- Engines come from study-kit, pinned in `vendor/study-kit/VERSION` (v0.2.3, 0fd3156). Never edit `vendor/study-kit/` by hand: engine fixes go to study-kit, get a new tag, and are copied in. Kit changes this app needs are listed in the status doc for Kristen's approval.
- Routes use the dash form only (`#lane-sales`, `#stage-rt-1-1`, `#run-rtn-1`).
- Never rename or drop a published id. `build.js` refuses to build if an id in `published-ids.json` is missing. After a publish, run `node build.js --record`. Section ids are claimed only when a phase's outline is approved; until then a lane lists its topics as Planned, with no ids.
- Lane names and all text use full titles. No bare colliding acronyms (CDO, CRO, CPO, CCO): write "Chief Revenue Officer (CRO)", never "CRO" alone. The build checks lane names, blurbs and planned topics.
- Role-plays: rules `guarded`, `noCoaching`, `noUnpromptedOffer` and scoring `outcomeAgreesWithScore`, `verifiedQuotes` are on. Learner label 'revenue leader'.
- Id prefixes: Craft packets RT-n, runs RTN-n, role-plays RTL-n. RR- is taken by Dry Run's requirements role-plays.
- Level tags Director / VP / C-level on every item in a leveled lane; the filter is the saved preference `levels`.
- Saving: study-kit's `save.createStore`; confirmations use the in-page dialog (`host.confirm`), never `window.confirm`.
- New content: helper drafts; sources opened before writing, every claim tagged Read, Relayed or Inferred; blind check by a second model (record and fixes in `docs/`); all arithmetic in `math/`, JS checked against an independently written Python twin, text gets numbers only through placeholders; Draft label until Kristen reviews. Practice-exam questions are never copied. Never copy Winning by Design's diagrams.
- Answer keys: the key is at most 1.3 × the longest distractor, strictly longest in at most 30% of a deck, and each letter is keyed 20–30% of the time.
- Boundaries (link, never copy; check each address exists in the other repo): metric formulas (win rate, CAC payback, LTV:CAC, NRR, GRR, pipeline coverage) live in Dry Run (Decision 22); pricing, gtm, revrec, contract and o2c and the negotiation cases live in Going Concern; operating cadence and S&OP live in Throughput (decks coo1 and coo3), and Run Rate covers the revenue side of the cadence; board communication is Blast Radius's module; procurement negotiation is Critical Path's.
- One branch per phase; open the pull request with `gh api` (`gh pr create` is refused); never push to main or force-push; publish from the branch; merge only on Kristen's word.

## Content (Phase 1, Draft)
- Decks: `content/fc1.js` (Sales forecasting, Sales leadership lane) and `content/rc1.js` (Revenue operating cadence, Chief Revenue Officer lane). Sources in `content/sources.js`; links into other apps in `content/outside.js` (each address checked in that repo).
- The forecast call RTN-1 (`#run-rtn-1`): data `data/forecast.json`, engine `math/forecast.js`, independent twin `math/forecast.py`, text `content/forecast.js`. `math/check.js` compares 400 random plans and every reference plan on every build; `build.js` asserts each debrief claim.
- Deck numbers: `math/numbers.js` with twin `math/numbers.py`.
- Blind check record: `docs/blind-check-phase1.md`.

## Build and test
```sh
node build.js        # build/index.html (runs the JS/Python cross-check, under a second)
node test.js         # Playwright: every screen at 360/390/414 px in light and dark, decks, keyed answers, sim runs, level filter, confirm dialog, idle-write check
```
