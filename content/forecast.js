// The forecast call (RTN-1). Design approved by Kristen Nov 28, 2026 (Phase 1 decisions 3A: 6 calls × 12 deals, 4A: the
// deal-level proper score, 5: the fifth reference plan). Engine: math/forecast.js, checked against math/forecast.py on
// every build. {key} placeholders are filled by build.js from the checked engine, and build.js asserts each claim the
// lesson makes. The company, reps and deals are fictional.
'use strict';
module.exports = {
  id: 'RTN-1', title: 'The forecast call', status: 'Draft', levels: ['director', 'vp'],
  blurb: '{nCalls} forecast calls, {nDeals} deals, three reps. Put each open deal in Commit, Best case, Pipeline or Drop, and see how your calls score against what actually closed.',
  briefing: [
    'You run the forecast call at {company}, a fictional software company. The quarter has {weeks} weeks and you hold {nCalls} calls, in weeks {callWeeks}. {nDeals} deals belong to three reps: Mara Quinn, Theo Brandt and Lena Ortiz. Two of the deals arrive in week 6, pulled in from next quarter. The plan for the quarter is {plan}.',
    'At each call you see every open deal: its amount, the rep\'s own category, the stage, how many times the close date has moved, the days since the buyer last replied, a note for the week, and two checks from discovery: whether the buyer has confirmed a critical event, and whether the decision process is known. You put each deal in Commit, Best case, Pipeline or Drop.',
    'Between calls, deals are won or lost and leave the board; a deal won before a call counts in Closed at that call. Drop takes a deal out of this call\'s numbers only: it stays on the board and is called again next time. Your number for the CEO is Closed plus Commit; the Best Case Forecast adds Best case on top. Both totals update on the board as you choose.',
    'Scoring. Each category stands for a probability: Commit {pC}, Best case {pB}, Pipeline {pP}, Drop 0. For every deal at every call, the error is the deal\'s amount times the square of the gap between that probability and what happened: 1 if the deal is won this quarter, 0 if it slips or is lost. Your score is 100 × (1 − your error ÷ the error of putting every open deal in Pipeline at every call). Saying what you really believe about each deal is the best strategy: padding and sandbagging both cost points.',
    'There is no chance in the run. The outcomes are fixed in advance and the same choices always give the same score. Deals that are won or lost leave the board as the weeks pass; which of the others slip to next quarter, you see in the debrief.'
  ],
  lesson: [
    'The reps\' own calls score {repsScore}. Committing every open deal scores {allScore}, and committing nothing scores 0 by definition. The reps beat both, but they leave most of the possible accuracy on the table. (Computed)',
    'Adjusting each rep by one rule scores {perRepScore}: {ruleText}. Each rep\'s rule was found by trying all 256. That is the manager\'s work in the call: knowing whose Commit to discount and whose Best case to lift. (Computed; see Sales forecasting, lesson fc1-6)',
    'Ironbark Foods ({ironAmt}) stayed in Lena\'s Best case at the week 8 call, when a new CEO froze large purchases and its close date moved. Dropping it at that call, one call before Lena did, raises the reps\' score from {repsScore} to {dropScore}. Bramble Health ({brambleAmt}) sat in Mara\'s Commit for four calls with no confirmed critical event, and slipped. (Computed)',
    'A rule built on the two checks (Commit only with a confirmed critical event and a known decision process, Best case with one of them, Pipeline with neither, Drop once the close date has moved twice) scores {signalScore}. Of the dollars sitting at calls with no confirmed critical event, {noCePct} closed this quarter. (Computed; the checks follow SPICED\'s Critical Event and Decision, Read, Winning by Design)',
    'Knowing the outcomes scores {hindScore}: Commit every deal that closed, Drop the rest. It stops short of 100 because Commit stands for 90%, not certainty. No plan you can play beats it; the build checks that. (Computed)',
    'With the reps\' calls, your number for the CEO read {repsCeo1} at the first call and {repsCeoLast} at the last. The quarter closed at {actual} against a plan of {plan}. (Computed)',
    'This is one quarter at one fictional company, with a table written for teaching: real signals are noisier. Read the gaps between the plans as the lesson, not the exact scores. (Inferred)'
  ],
  links: [['fc1-3', 'What earns Commit'], ['fc1-4', 'Triangulating the number'], ['fc1-6', 'Forecast accuracy and rep calibration'], ['rc1-2', 'Running the weekly forecast call']],
  outside: ['dr-sav-04'],
  sources: ['sfConfig', 'kTri', 'spiced', 'sbi']
};
