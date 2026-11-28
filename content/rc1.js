// Revenue operating cadence (rc1), Chief Revenue Officer lane. Outline approved by Kristen Nov 28, 2026 (Phase 1
// decisions 1, 2, 6 and 7). Covers the revenue side of the cadence only: the operating rhythm and executive S&OP stay in
// Throughput (coo1, coo3) and are linked; board communication is Blast Radius's module, so rc1-5 stands in for the revenue
// slides until it exists (its body then becomes a link and the id is kept). Questions are original.
'use strict';
const D = 'Draft', DIR = 'director', VP = 'vp', C = 'c-level';
module.exports = {
  deck: { id: 'rc1', lane: 'chief-revenue-officer', title: 'Revenue operating cadence', prefix: 'rc1', qPrefix: 'RC1', cPrefix: 'RC1C' },
  lessons: [
    { id: 'rc1-1', title: 'The revenue rhythm: week, month, quarter, year', status: D, levels: [DIR, VP, C], sources: ['sbi', 'sacks'], links: ['tp-coo1-1', 'tp-coo3-1'], body: [
      'Revenue runs on a calendar of reviews, each with its own horizon: the weekly forecast call on this quarter\'s deals, pipeline reviews on future quarters, a monthly business review, the quarterly business review and the board meeting. (Inferred)',
      'SBI\'s guide separates forecast calls on in-quarter deals from out-quarter pipeline calls on future coverage. It adds month-end calls on deals that can be pulled forward and short daily calls at quarter end on deals moving in and out. (Read, SBI)',
      'Each meeting feeds the next. Forecast calls produce the number, pipeline reviews say whether next quarter can be hit, the quarterly review resets plans, and the board sees whether the quarter closed where it was forecast. (Inferred; the board\'s question is Read, Sacks)',
      'The company\'s operating rhythm as a whole, and the executive S&OP meeting where demand meets supply, belong to Throughput\'s Chief Operating Officer lane, linked below. This deck covers the revenue meetings that feed them. (Inferred)'
    ] },
    { id: 'rc1-2', title: 'Running the weekly forecast call', status: D, levels: [DIR, VP], sources: ['sbi', 'sfConfig'], links: [], body: [
      'SBI\'s forecast call agenda has four parts: where the team stands against plan, a review of the critical deals, a risk review of questionable deals such as past-due close dates or no recent activity, and actions. (Read, SBI)',
      'It runs bottom up. Reps enter deals, managers inspect them, directors remove obstacles, and the sales leader confirms the final number for company leadership. (Read, SBI)',
      'A scribe records each action with an owner and a due date, sends the list after the call and opens the next call by reviewing it. (Read, SBI)',
      'Spend the time on change: deals that moved into or out of Commit since last week, close dates that moved, amounts that changed. Weekly forecast submissions make that change visible. (Inferred; submissions Read, Trailhead)',
      'End with the number and its range: the commit you will stand behind (Closed plus Commit) and the Best Case Forecast, which adds the Best case deals on top. (Read, Trailhead, for the rollups; Inferred for the advice)'
    ] },
    { id: 'rc1-3', title: 'Pipeline review is a different meeting', status: D, levels: [DIR, VP], sources: ['sbi', 'kToGo', 'kTna'], links: ['dr-sav-02', 'dr-fn-03'], body: [
      'A pipeline review asks whether there will be enough to sell, not whether this quarter\'s deals will close. SBI puts coverage at its center: the change in pipeline since the last call, who created the new opportunities, the mix by stage, and the pipeline multiple against the historical win rate. (Read, SBI)',
      'SBI\'s example: a 33% win rate implies about 3x coverage. The coverage and win-rate formulas themselves are in Dry Run, linked below. (Read, SBI)',
      'Kellogg adds to-go coverage: the pipeline still available to close divided by what is still needed to hit plan, tracked through the quarter. A falling ratio means deals are slipping, stalling or being lost faster than they close. (Read, Kellogg)',
      'Example: plan {{g.plan|$}} and starting pipeline {{g.startPipe|$}}, so {{g.start|x1}} at the start. By week 7 the team has closed {{g.closed|$}} and has {{g.openPipe|$}} of open pipeline: {{g.toGo|x1}} to-go coverage on the {{g.left|$}} still to sell. (Computed)',
      'SBI recommends at least two to three pipeline calls a quarter, each ending with actions that have owners and dates. (Read, SBI)'
    ] },
    { id: 'rc1-4', title: 'The internal sales QBR', status: D, levels: [VP], sources: ['hsQbr', 'slQbr'], links: ['dr-sav-11'], body: [
      'An internal sales QBR is where reps and managers review last quarter with leadership and use it to shape the forecast and the plan. HubSpot\'s template covers team wins, territory plans, prospecting plans, losses and how they were supported, and takeaways with actions. (Read, HubSpot)',
      'It is a different meeting from a customer QBR, which is held with the customer to show what the product did for them. The customer QBR is linked from Dry Run below. (Read, HubSpot and Salesloft)',
      'Salesloft lists the usual failures: presenters show their numbers in the best light, other teams claim wins sales did not feel, time goes on arguing over missing or stale data, and people go back to their routines afterward. (Read, Salesloft)',
      'Agree on one data source before the meeting, review losses without singling out individuals, and finish with a plan for the next 90 days with owners. (Read, HubSpot for losses and Salesloft for the 90-day plan; Inferred for the shared data source)'
    ] },
    { id: 'rc1-5', title: 'Board revenue slides', status: D, levels: [VP, C], sources: ['binch', 'sacks', 'kBoard'], links: ['tp-coo1-5', 'dr-sm-13', 'dr-sm-04'], body: [
      'Binch builds his board time around five revenue slides: a headline reel with bookings against plan, net and gross retention and cash; five quarters of results; performance by segment, region or vertical; the pipeline, with conversion rates and this quarter\'s pipeline; and sales-team health, the share of account executives at quota against the hiring plan. (Read, Binch for Battery)',
      'Sacks gives the head of sales 30 minutes: last quarter\'s results, with major wins, losses and loss reasons; the coming quarter\'s forecast, major deals, weighted pipeline and coverage, and what must change to hit the number; rep performance; and a waterfall of what was promised against what was delivered. (Read, Sacks)',
      'Kellogg\'s key-metrics slide opens with the ARR leaky bucket: starting ARR plus new ARR minus churned ARR equals ending ARR, shown over nine quarters. (Read, Kellogg)',
      'The board\'s question is plain: did the quarter close where you forecast, why or why not, and can the pipeline carry next quarter? Bring a miss early, with its cause and the plan. (Read, Sacks, for the question; Inferred for the advice)',
      'Board communication as a whole belongs to Blast Radius and is not built yet. This lesson covers only the revenue slides and stands in until that module exists. Retention formulas are in Dry Run. (Inferred)'
    ] }
  ],
  questions: [
    { id: 'RC1-01', lesson: 'rc1-1', level: 'Understand', stem: 'What separates a weekly forecast call from a pipeline review?',
      options: ['The forecast call is for the reps and the pipeline review is for the board', 'They are the same meeting held under two different names', 'The call works this quarter\'s deals; the review checks future coverage', 'The pipeline review sets quotas and the forecast call sets pay'], answer: 2,
      why: 'SBI separates in-quarter forecast calls from out-quarter pipeline calls that check whether future coverage supports the plan.',
      whyNot: { 0: 'Both are internal sales meetings; neither is a board meeting.', 1: 'They answer different questions on different horizons.', 3: 'Quotas and pay are set in planning, not in either meeting.' } },
    { id: 'RC1-02', lesson: 'rc1-1', level: 'Apply', stem: 'It is week 12 of a 13-week quarter and several deals may move in or out. Which meeting does SBI\'s guide prescribe?',
      options: ['Short daily calls on the deals moving in and out', 'A 60-minute call on next quarter\'s pipeline', 'The quarterly business review, moved up to this week', 'A monthly business review on the full P&L'], answer: 0,
      why: 'SBI recommends 30-minute daily calls at quarter end focused on the "in and out" opportunities.',
      whyNot: { 1: 'Out-quarter pipeline calls look at future coverage, not this week\'s closes.', 2: 'The QBR reviews a finished quarter.', 3: 'A monthly review is too slow for the last days of the quarter.' } },
    { id: 'RC1-03', lesson: 'rc1-1', level: 'Analyze', stem: 'A company holds a weekly forecast call and a QBR but no meeting on next quarter\'s pipeline. What is most likely to go wrong?',
      options: ['This quarter\'s forecast will become less accurate', 'The board slides will be missing a bookings figure', 'Reps will stop entering their weekly forecasts', 'Next quarter starts short because nobody checked coverage'], answer: 3,
      why: 'Without a pipeline review, nobody tests whether future quarters have enough pipeline until it is too late to build it.',
      whyNot: { 0: 'The forecast call still covers this quarter.', 1: 'Bookings come from closed deals, which the other meetings track.', 2: 'Submissions depend on the forecast process, which still runs.' } },
    { id: 'RC1-04', lesson: 'rc1-2', level: 'Remember', stem: 'In SBI\'s four-part forecast call agenda, what belongs in the risk review?',
      options: ['The plan status for the quarter against the target number', 'Questionable deals, such as past-due close dates', 'Actions with owners and dates from the call', 'Pipeline created by marketing and the BDRs'], answer: 1,
      why: 'SBI\'s risk review covers questionable deals, for example past-due close dates or no recent activity.',
      whyNot: { 0: 'Plan status is the first part, the overview.', 2: 'Actions are the fourth part.', 3: 'Pipeline creation belongs to the pipeline call.' } },
    { id: 'RC1-05', lesson: 'rc1-2', level: 'Apply', stem: 'An action agreed in last week\'s forecast call has no owner and nobody remembers it. What does SBI\'s guide prescribe?',
      options: ['Shorten the call so that fewer actions come out of each week', 'Ask each rep to keep a private list of the actions', 'A scribe logs owners and dates and reviews them next call', 'Move the actions into the quarterly business review'], answer: 2,
      why: 'SBI has a scribe record actions with owners and due dates, send them after the call and review them at the start of the next one.',
      whyNot: { 0: 'Fewer actions does not make the remaining ones stick.', 1: 'Private lists are how actions get lost.', 3: 'A quarter is far too long to wait on weekly actions.' } },
    { id: 'RC1-06', lesson: 'rc1-2', level: 'Evaluate', stem: 'A forecast call spends 50 minutes walking every deal in the same order each week. Which change would help most?',
      options: ['Start with what changed: Commit moves, pushed dates, new risks', 'Hold the same full walkthrough twice a week instead of once a week', 'Let each rep present the deals they are most proud of', 'Drop the call and read the forecast report at month end'], answer: 0,
      why: 'Change since last week is where the forecast moves; SBI\'s agenda puts risky deals and actions ahead of a full walkthrough.',
      whyNot: { 1: 'Doubling an unfocused call doubles the waste.', 2: 'That selects for good news, the opposite of a risk review.', 3: 'Monthly is too slow for a weekly forecast.' } },
    { id: 'RC1-07', lesson: 'rc1-3', level: 'Apply', stem: 'Plan is {{g.plan|$}}. By week 7 the team has closed {{g.closed|$}} and has {{g.openPipe|$}} of open pipeline. What is to-go coverage?',
      options: ['{{g.start|x1}}', '{{g.ofPlan|x1}}', '{{g.ofClosed|x1}}', '{{g.toGo|x1}}'], answer: 3,
      why: 'To-go coverage is the open pipeline divided by what is left to sell: {{g.openPipe|$}} ÷ {{g.left|$}} = {{g.toGo|x1}}.',
      whyNot: { 0: 'That is the starting coverage, measured against the whole plan at the start of the quarter.', 1: 'That divides by the whole plan, ignoring what has already closed.', 2: 'That divides by what has closed, not by what is left.' } },
    { id: 'RC1-08', lesson: 'rc1-3', level: 'Analyze', stem: 'Over six weeks, to-go coverage fell from 3.0x to 2.0x while few deals closed. What does Kellogg\'s reading suggest?',
      options: ['The team is closing deals faster than it loses them', 'Pipeline is leaving through slips, stalls or losses', 'The plan was raised in the middle of the quarter', 'Coverage always falls by this much as a quarter goes on'], answer: 1,
      why: 'A falling to-go ratio with few closes means pipeline is leaving faster than deals close.',
      whyNot: { 0: 'That would make the ratio rise.', 2: 'Nothing in the question says the plan changed.', 3: 'Kellogg treats a flat ratio as closing at the starting rate; a fall is a signal.' } },
    { id: 'RC1-09', lesson: 'rc1-4', level: 'Understand', stem: 'Who is the audience of an internal sales QBR, compared with a customer QBR?',
      options: ['Sales and other leaders; the customer QBR is with the customer', 'The board; the customer QBR is with the sales team', 'Finance alone; the customer QBR is with procurement', 'New hires; the customer QBR is with customer support'], answer: 0,
      why: 'HubSpot describes the sales QBR as reps and managers reviewing the quarter with leadership; the customer QBR is held with the customer.',
      whyNot: { 1: 'The board sees revenue at the board meeting, not the sales QBR.', 2: 'Finance may attend, but the meeting is sales performance reviewed with leadership.', 3: 'Neither QBR is a training session.' } },
    { id: 'RC1-10', lesson: 'rc1-4', level: 'Evaluate', stem: 'In a sales QBR, marketing reports record lead volume, sales says the leads were poor, and the hour goes on disputing numbers. What prevents this next time?',
      options: ['Leave marketing out of the next sales QBR', 'Let each team bring its own report as before', 'Agree one data source and definitions first', 'Move the dispute to the board meeting instead'], answer: 2,
      why: 'Salesloft names conflicting claims and arguments over data as common QBR failures; a shared source agreed in advance removes the argument.',
      whyNot: { 0: 'The handoff between marketing and sales is exactly what needs reviewing.', 1: 'Separate reports are what caused the dispute.', 3: 'Taking an internal data dispute to the board makes it worse.' } },
    { id: 'RC1-11', lesson: 'rc1-5', level: 'Remember', stem: 'In Sacks\'s SaaS board agenda, what does the forecast-tracking waterfall show?',
      options: ['Pipeline created by each source over the year', 'Headcount by team against the hiring plan', 'Cash burn by month against the budget', 'What was promised against what was delivered'], answer: 3,
      why: 'Sacks asks for a waterfall chart showing what was promised versus what was delivered.',
      whyNot: { 0: 'Pipeline sources are a marketing view, not the forecast-tracking chart.', 1: 'Hiring is in the team section of the agenda.', 2: 'Cash belongs to the financials section.' } },
    { id: 'RC1-12', lesson: 'rc1-5', level: 'Apply', stem: 'Starting ARR is {{b.start|$m}}, new ARR {{b.add|$m}} and churned ARR {{b.churn|$m}}. Using the leaky bucket, what is ending ARR?',
      options: ['{{b.allAdd|$m}}', '{{b.end|$m}}', '{{b.noChurn|$m}}', '{{b.netOnly|$m}}'], answer: 1,
      why: 'Starting ARR + new ARR − churned ARR = {{b.start|$m}} + {{b.add|$m}} − {{b.churn|$m}} = {{b.end|$m}}.',
      whyNot: { 0: 'That adds churn instead of subtracting it.', 2: 'That leaves churn out.', 3: 'That is net new ARR, without the starting ARR.' } }
  ],
  cards: [
    { id: 'RC1C-01', front: 'Forecast call vs pipeline review', back: 'The call works this quarter\'s deals; the review checks coverage for future quarters (SBI).' },
    { id: 'RC1C-02', front: 'SBI\'s forecast call agenda', back: 'Plan status, critical deal review, risk review of questionable deals, actions.' },
    { id: 'RC1C-03', front: 'The action log', back: 'A scribe records owners and due dates, sends the list after the call and reviews it at the next one.' },
    { id: 'RC1C-04', front: 'Quarter-end daily calls', back: 'About 30 minutes, on the deals moving in and out of the quarter (SBI).' },
    { id: 'RC1C-05', front: 'To-go coverage', back: 'Pipeline still open ÷ what is left to sell to hit plan, tracked through the quarter (Kellogg).' },
    { id: 'RC1C-06', front: 'Slip or loss? (this, next, all quarters)', back: 'This down, next up, total flat: slips. This down, next flat, total down: losses (Kellogg).' },
    { id: 'RC1C-07', front: 'Internal sales QBR', back: 'Reps and managers review the quarter with leadership: wins, territory plans, losses, actions.' },
    { id: 'RC1C-08', front: 'Customer QBR', back: 'Held with the customer to show what the product did for them; a different meeting.' },
    { id: 'RC1C-09', front: 'Binch\'s five board revenue slides', back: 'Headline reel, five-quarter view, segments, pipeline, sales-team health.' },
    { id: 'RC1C-10', front: 'ARR leaky bucket', back: 'Starting ARR + new ARR − churned ARR = ending ARR (Kellogg\'s key-metrics slide).' }
  ]
};
