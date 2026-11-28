# Blind check, Phase 1 (Nov 28, 2026)

Checker: Claude Sonnet, given only a packet with no answer keys and no computed scores. Files: the 27 questions (stems
and options as printed), the 11 lessons as printed, the forecast-call briefing and `data/forecast.json`. It wrote its
own simulator in Python from the briefing. A second, fresh Sonnet run re-checked the items that changed.

## Result (Measured)
- **Questions:** 27 of 27 blind picks agree with the keys (FC1-07 and FC1-11 at medium confidence, the rest high).
- **Lessons:** every number recomputed and correct. No bare CRO, CDO, CPO or CCO.
- **Simulation:** the checker's own code reproduced every figure the debrief uses:

  | Figure | Checker | App |
  |---|---|---|
  | Commit everything | −28.66 | −28.7 |
  | Commit nothing | 0.00 | 0.0 |
  | The reps' own calls | 23.98 | 24.0 |
  | Best adjustment of each rep | 69.88 | 69.9 |
  | Best in hindsight | 98.66 | 98.7 |
  | Signal rule (two checks, two pushes) | 78.02 | 78.0 |
  | Reps' calls with Ironbark dropped at week 8 | 27.03 | 27.0 |
  | Share of no-critical-event dollars that closed | 8.11% | 8% |
  | CEO number, reps' calls, by call | 515,000 / 625,000 / 765,000 / 670,000 / 870,000 / 1,080,000 | same |
  | Won this quarter | $1,080,000 | same |
  | Per-rep rules | Mara C→B, B→P, P→C; Theo C,B,P→C, D→D; Lena C→C, B,P,D→D | same |

## Flags and what was done
1. **FC1-07 conflicted with lesson fc1-3 and the signal rule.** The stem had neither check met, keyed Best case, while the rule maps "neither" to Pipeline and Pipeline was not an option. Fixed: the stem now has a confirmed deadline and an unknown decision process (one check), and Pipeline is an option with its own why-not. The re-check picked the key, high confidence, and noted Pipeline as arguable but weaker. The key was reworded to the same "X, because Y" form as the other options.
2. **FC1-05 key longer than the distractors (83 vs 64 characters).** Shortened to 66 characters. The re-check found no length tell.
3. **fc1-2, Trailhead claim on weighted Pipeline deals.** Reworded to what the Trailhead stage unit says (Read, Nov 27).
4. **rc1-2 said Best Case Forecast applies "if the open deals land".** Corrected: it adds the Best case deals on top of Closed plus Commit.
5. **fc1-6 said the sim "scores exactly" rep adjustment.** Corrected: the sim scores each call, and its debrief shows the best adjustment rule for each rep.
6. **Briefing left two rules implicit.** It now states that a deal won before a call counts in Closed at that call, and that Drop takes a deal out of that call's numbers only.

Not changed:
- FC1-09's distractors are weak but unambiguous.
- FC1-11 option A is partly defensible; the why and why-not explain why C is better.
- FC1-10 reuses the lesson's numbers, as recall practice.
- Mara's Pipeline → Commit rule rests on one deal; the debrief shows rules for the categories each rep used, and the lesson calls the per-rep rule the manager's adjustment.
