// Sales forecasting (fc1), Sales leadership lane. Outline approved by Kristen Nov 28, 2026 (Phase 1 decisions 1 and 2).
// Every lesson paragraph ends with its tier. Numbers come from math/numbers.js through {{key|format}} placeholders.
// Questions are original; no practice-exam item is used. Boundary: metric formulas (win rate, coverage, MAPE) are linked
// from Dry Run, not restated.
'use strict';
const D = 'Draft', DIR = 'director', VP = 'vp', C = 'c-level';
module.exports = {
  deck: { id: 'fc1', lane: 'sales', title: 'Sales forecasting', prefix: 'fc1', qPrefix: 'FC1', cPrefix: 'FC1C' },
  lessons: [
    { id: 'fc1-1', title: 'Forecast categories and how they roll up', status: D, levels: [DIR, VP], sources: ['sfConfig', 'msCategory', 'oracleBands', 'sbi'], links: [], body: [
      'Every open deal carries a forecast category: a statement of how likely it is to close in the period. In Salesforce each opportunity stage maps to a category by default, and admins can change the mapping and rename or hide categories that do not fit. (Read, Trailhead)',
      'Salesforce\'s defaults are Pipeline, Best Case, Most Likely (optional), Commit and Closed. Commit is for deals with a higher chance of closing, such as those in negotiation; Pipeline is for early-stage deals. Dynamics 365 uses Pipeline, Best case, Committed and Omitted, and sets Won or Lost when a deal is closed. (Read, Trailhead and Microsoft Learn)',
      'A single-category view counts only that category. A cumulative view adds the later ones: Commit Forecast is Commit plus Closed; Best Case Forecast is Best Case, Most Likely, Commit and Closed; Open Pipeline is every open category, without Closed. (Read, Trailhead)',
      'Example: Closed {{r.closed|$}}, Commit {{r.commit|$}}, Best Case {{r.best|$}} and Pipeline {{r.pipe|$}}, with no Most Likely. Commit Forecast is {{r.commitF|$}}, Best Case Forecast {{r.bestF|$}} and Open Pipeline {{r.openPipe|$}}. (Computed)',
      'Some systems set the category from the win probability instead: Oracle places 0–39% in Pipeline, 40–59% in Best Case and 60–99% in Committed. SBI\'s guide advises keeping the sales stage separate from the forecast category, since one records progress and the other confidence. (Read, Oracle and SBI)'
    ] },
    { id: 'fc1-2', title: 'Stages, probabilities and the weighted pipeline', status: D, levels: [DIR], sources: ['sfStages', 'kTri'], links: ['dr-sav-02', 'dr-fn-03'], body: [
      'Each stage carries a probability. Early stages such as Qualification get a low number, like 10%; a deal where the buyer is reviewing a formal proposal might get 60%. Teams set these numbers when they map their sales process. (Read, Trailhead)',
      'Weighting each deal by its stage probability gives an expected value for the pipeline. Trailhead\'s stage unit says deals in stages mapped to the Pipeline category show up in pipeline reports with their value weighted by the stage probability. (Read, Trailhead)',
      'Four deals worth {{w.total|$}} in all, at 10%, 40%, 60% and 90%, have an expected value of {{w.ev|$}}: {{w.share|%0}} of their face value. The same {{w.total|$}} sitting entirely in Discovery at 10% is worth {{w.evEarly|$}}. (Computed)',
      'The same dollar total can mean very different things depending on how far along the deals are. That is why the stage-weighted value is one of the views a leader puts beside the reps\' call. (Read, Kellogg)',
      'Stage probabilities are averages. They say nothing certain about one deal, and they drift when reps move deals forward without meeting a stage\'s exit criteria, so check them against what actually closed from each stage. (Inferred)',
      'Whether there is enough pipeline for the target is the coverage question. The coverage and win-rate formulas live in Dry Run\'s metric cards, linked below. (Inferred)'
    ] },
    { id: 'fc1-3', title: 'What earns Commit', status: D, levels: [DIR, VP], sources: ['msCategory', 'sbi', 'spiced'], links: [], body: [
      'Commit is the number the manager calls and the business plans on, so it needs evidence from the buyer. Dynamics 365 keeps Committed for deals where the customer has made a verbal or contractual commitment and you are mainly waiting on paperwork or approvals. (Inferred for the first sentence; Read, Microsoft Learn for the second)',
      'SBI\'s guide defines Commit as expected to close this quarter based on need, timing, budget and access to the decision-maker, and Best Case as a deal that needs several things to go right. (Read, SBI)',
      'Winning by Design\'s SPICED framework names two elements that bear directly on timing: the Critical Event, the deadline or outside force that sets when a decision must be made, and the Decision, how the customer will choose, including the people and the process. (Read, Winning by Design)',
      'A working test before Commit: has the buyer confirmed the critical event, and is the decision process known, with names and dates? A deal with neither is a hope. (Inferred)',
      'Two patterns spoil the call. Happy ears: a rep commits on a champion\'s enthusiasm with no buyer-side date. Sandbagging: a rep holds deals in Best case so as to beat the number. Both make Commit mean less. (Inferred)'
    ] },
    { id: 'fc1-4', title: 'Triangulating the number', status: D, levels: [VP, C], sources: ['kTri', 'sfConfig'], links: [], body: [
      'One forecast invites one argument. Kellogg recommends putting several side by side: the sum of the reps\' forecasts, the sum of the managers\' forecasts, the stage-weighted expected value of the pipeline and the category-weighted expected value. (Read, Kellogg)',
      'Each tells you something different. In his experience the rep roll-up tends to run optimistic and the manager roll-up is usually the most accurate; the weighted values show what the pipeline is worth on probabilities rather than on anyone\'s judgment. (Read, Kellogg)',
      'Example: the reps sum to {{t.repRoll|$}} and the managers to {{t.mgrRoll|$}}. Commit {{t.commit|$}}, Best case {{t.best|$}} and Pipeline {{t.pipe|$}} weighted at 0.90, 0.50 and 0.15 give {{t.catEv|$}}. The managers have taken {{t.gap|$}} out of the reps\' number, and the weighted view sits below both. (Computed)',
      'When a leader\'s call sits well above the roll-ups, Kellogg reads it as a sign the leader may be counting on a large deal pulling forward, or inflating the call under budget pressure. (Read, Kellogg)',
      'In Salesforce, managers can apply judgments and adjustments to the forecast. Adjustments change only the forecast amounts, not the underlying opportunity data, so the record of what the reps said survives. (Read, Trailhead)'
    ] },
    { id: 'fc1-5', title: 'Reading pipeline change', status: D, levels: [DIR, VP], sources: ['sfInspect', 'kTna'], links: [], body: [
      'Pipeline moves between calls for a few reasons: new deals arrive, deals are won or lost, amounts go up or down, and close dates move into or out of the period. Salesforce\'s Pipeline Inspection reports these as New, Won, Lost, Increased, Decreased, Moved In and Moved Out. (Read, Trailhead)',
      'Its waterfall chart starts with the open pipeline at the start of the period and ends with today\'s, with each kind of change as a bar in between. (Read, Trailhead)',
      'Moved Out is where slipped deals show up. A deal whose close date has moved twice is a risk to the forecast even if its category has not changed. (Read, Trailhead, for Moved Out; Inferred for the risk)',
      'Kellogg reads this-quarter, next-quarter and all-quarters pipeline together. This quarter down and next quarter up, with the total barely changed, means deals slipped. This quarter down, next quarter flat and the total down means deals were lost. (Read, Kellogg)',
      'Deals that slip a quarter at a time can pile up far out, where nobody inspects them; looking only at annual or rolling views hides them. (Read, Kellogg)'
    ] },
    { id: 'fc1-6', title: 'Forecast accuracy and rep calibration', status: D, levels: [VP, C], sources: ['sfConfig', 'kTri'], links: ['dr-sav-04'], body: [
      'Salesforce lets admins require forecast submissions: each rep submits a weekly best estimate, which keeps a record of how the call changed over the period. (Read, Trailhead)',
      'With the submissions kept, accuracy can be measured. A team that called {{a.called|$}} at week 6 and closed {{a.actual|$}} missed by {{a.miss|$}}, or {{a.missPct|%1}} of the actual. The standard accuracy formulas, including MAPE, are in Dry Run\'s metric cards. (Computed)',
      'Accuracy by rep matters more than the team total. Compare each rep\'s Commit with what closed over several quarters: one rep\'s Commit may close at 60 cents on the dollar and another\'s at 100. (Inferred)',
      'A manager who knows each rep\'s pattern adjusts the call rep by rep: discount the optimist\'s Commit, lift the sandbagger\'s Best case. The forecast-call simulation in this lane scores each call you make, and its debrief shows the best adjustment rule for each rep. (Inferred)',
      'Kellogg warns against tying expense cuts to the forecast, because it pushes leaders to inflate the call. (Read, Kellogg)'
    ] }
  ],
  questions: [
    { id: 'FC1-01', lesson: 'fc1-1', level: 'Apply', stem: 'Closed is {{r.closed|$}}, Commit {{r.commit|$}}, Best Case {{r.best|$}} and Pipeline {{r.pipe|$}}, with no Most Likely. What is the cumulative Best Case Forecast?',
      options: ['{{r.openPipe|$}}', '{{r.bestF|$}}', '{{r.commitF|$}}', '{{r.all|$}}'], answer: 1,
      why: 'Best Case Forecast adds Best Case, Most Likely, Commit and Closed: {{r.best|$}} + {{r.commit|$}} + {{r.closed|$}} = {{r.bestF|$}}.',
      whyNot: { 0: 'That is Open Pipeline: Pipeline, Best Case and Commit, without Closed.', 2: 'That is Commit Forecast: Commit plus Closed.', 3: 'That adds every category, including Pipeline, which a Best Case Forecast leaves out.' } },
    { id: 'FC1-02', lesson: 'fc1-1', level: 'Remember', stem: 'In Dynamics 365 Sales, which forecast category takes a deal out of every forecast total?',
      options: ['Omitted', 'Pipeline', 'Best case', 'Committed'], answer: 0,
      why: 'Microsoft Learn defines Omitted as excluding the opportunity from all forecast totals, for deals on hold or not relevant to the period.',
      whyNot: { 1: 'Pipeline is the default category for early or stalled deals; they still count in the pipeline column.', 2: 'Best case deals count in the best case column.', 3: 'Committed deals count in the committed column.' } },
    { id: 'FC1-03', lesson: 'fc1-1', level: 'Understand', stem: 'What is the difference between a deal\'s sales stage and its forecast category?',
      options: ['They are two names for the same field in most CRMs', 'Category is copied from the stage by the system and can never change', 'Stage records progress; category records confidence for the period', 'Stage is owned by the manager and category by finance'], answer: 2,
      why: 'The stage says where the sale is in the process; the category says how likely it is to close this period. SBI\'s guide advises keeping them separate.',
      whyNot: { 0: 'They are separate fields; Salesforce maps one to the other by default but they mean different things.', 1: 'Salesforce lets admins change the stage-to-category mapping, and Dynamics 365 lets reps set the category.', 3: 'Neither source assigns the fields this way; reps and managers set both.' } },
    { id: 'FC1-04', lesson: 'fc1-2', level: 'Apply', stem: 'Deals of {{w.a|$}}, {{w.b|$}}, {{w.c|$}} and {{w.d|$}} sit at stages with probabilities of 10%, 40%, 60% and 90%. What is the stage-weighted pipeline?',
      options: ['{{w.total|$}}', '{{w.evEarly|$}}', '{{w.avg|$}}', '{{w.ev|$}}'], answer: 3,
      why: 'Multiply each deal by its stage probability and add: {{w.ev|$}}.',
      whyNot: { 0: 'That is the face value, with no weighting.', 1: 'That treats every deal as if it were at 10%.', 2: 'That is the average deal size, not an expected value.' } },
    { id: 'FC1-05', lesson: 'fc1-2', level: 'Understand', stem: 'Two pipelines have the same dollar total but very different stage-weighted values. Why?',
      options: ['Their deals sit at different stages, each with its own probability', 'One of the pipelines must be counting some of its deals twice', 'Expected value counts the number of deals and ignores their size', 'Expected value only includes deals already placed in Commit'], answer: 0,
      why: 'Each deal is weighted by its stage probability, so a pipeline of late-stage deals is worth more than the same dollars in early stages.',
      whyNot: { 1: 'Double counting would change the dollar total too, and the totals are the same here.', 2: 'Expected value multiplies each deal\'s amount by its probability, so size matters.', 3: 'Stage weighting applies to open deals in every stage, not only Commit.' } },
    { id: 'FC1-06', lesson: 'fc1-2', level: 'Analyze', stem: 'The stage table says Negotiation closes 60% of the time, but last year only 35% of Negotiation dollars closed. What is the best first step?',
      options: ['Keep 60%, since the CRM vendor supplied that number as the stage default', 'Recalibrate from actual results and check deals against exit criteria', 'Move every Negotiation deal to Commit so the number goes up', 'Remove the Negotiation stage from the sales process altogether'], answer: 1,
      why: 'Stage probabilities are averages that should match what closes. A gap this large also suggests deals reach Negotiation without meeting its exit criteria.',
      whyNot: { 0: 'Teams set stage probabilities for their own process; a default that history contradicts should change.', 2: 'Raising categories does not raise the chance of closing and makes the call less accurate.', 3: 'The stage is not the problem; its probability and entry discipline are.' } },
    { id: 'FC1-07', lesson: 'fc1-3', level: 'Apply', stem: 'The buyer has confirmed a go-live deadline this quarter, but nobody yet knows who signs or how the decision gets made. Which category fits?',
      options: ['Commit, because the buyer\'s deadline is confirmed', 'Best case, because the deadline holds but not the process', 'Pipeline, because the deal has no signed paperwork', 'Drop, until the buyer explains the whole process'], answer: 1,
      why: 'One of the two tests is met: a confirmed critical event. Without a known decision process the deal needs things to go right, which is Best case, not Commit.',
      whyNot: { 0: 'Commit needs both a confirmed critical event and a known decision process; the process is missing.', 2: 'A confirmed buyer deadline makes this more than an early-stage deal; Pipeline understates it.', 3: 'The deal is alive and has a real deadline; dropping it hides a likely close.' } },
    { id: 'FC1-08', lesson: 'fc1-3', level: 'Remember', stem: 'In Winning by Design\'s SPICED framework, what does the Critical Event describe?',
      options: ['The moment the rep first logs the opportunity in the CRM', 'The customer\'s largest pain point in its current process', 'The deadline or outside force that sets when they must decide', 'The signature date the rep types into the CRM as the expected close date'], answer: 2,
      why: 'Winning by Design defines the Critical Event as the deadline, milestone or external force that creates urgency and sets when a decision must be made.',
      whyNot: { 0: 'Logging the deal is a seller event, not a customer one.', 1: 'That is the Pain element of SPICED.', 3: 'The rep\'s close date is a guess unless the customer\'s own deadline backs it.' } },
    { id: 'FC1-09', lesson: 'fc1-3', level: 'Evaluate', stem: 'For four quarters a rep has called a low Commit and then beaten it by a wide margin. What does that most likely mean for the forecast?',
      options: ['The rep is sandbagging, so Commit understates what will close', 'This rep\'s Commit is the most accurate one on the whole sales team', 'The team\'s stage probabilities have been set too high', 'The team\'s win rate formula must be calculated wrongly'], answer: 0,
      why: 'Beating a low call quarter after quarter is the sandbagging pattern: the rep holds deals back, so the team\'s Commit is too low to plan on.',
      whyNot: { 1: 'A Commit that is always far below the result is inaccurate, just in the safe direction.', 2: 'The pattern is about one rep\'s calls, not the stage table.', 3: 'Win rate does not enter a rep\'s Commit call.' } },
    { id: 'FC1-10', lesson: 'fc1-4', level: 'Apply', stem: 'Commit is {{t.commit|$}}, Best case {{t.best|$}} and Pipeline {{t.pipe|$}}. Weighted at 0.90, 0.50 and 0.15, what is the category-weighted value?',
      options: ['{{t.catEvK|$}}', '{{t.mgrRoll|$}}', '{{t.sum|$}}', '{{t.catEv|$}}'], answer: 3,
      why: '{{t.commit|$}} × 0.90 + {{t.best|$}} × 0.50 + {{t.pipe|$}} × 0.15 = {{t.catEv|$}}.',
      whyNot: { 0: 'That uses weights of 0.9, 0.7 and 0.3, not the ones given.', 1: 'That is the managers\' roll-up, a different view.', 2: 'That adds the categories with no weighting.' } },
    { id: 'FC1-11', lesson: 'fc1-4', level: 'Evaluate', stem: 'The Chief Revenue Officer calls $900,000. Reps sum to {{t.repRoll|$}}, managers to {{t.mgrRoll|$}}, and both weighted views are near {{t.catEv|$}}. What should the CEO ask first?',
      options: ['Why the reps\' roll-up is higher than the managers\' roll-up', 'Whether stage probabilities should be raised to match the call', 'Which deals fill the gap above the managers, and on what evidence', 'Whether next quarter\'s budget should be cut to the weighted value'], answer: 2,
      why: 'A call well above every roll-up and weighted view rests on specific deals; the first question is which ones and what supports them.',
      whyNot: { 0: 'Reps running above managers is normal and smaller than the gap that matters here.', 1: 'Changing probabilities to fit a call reverses the purpose of the weighted view.', 3: 'Kellogg warns against tying expense cuts to the forecast; it pushes leaders to inflate the call.' } },
    { id: 'FC1-12', lesson: 'fc1-5', level: 'Analyze', stem: 'Since the last call, this-quarter pipeline fell $400,000, next-quarter pipeline rose $380,000 and total pipeline barely moved. What most likely happened?',
      options: ['Deals slipped from this quarter into the next', 'Several deals were lost to competitors', 'New deals were created in this quarter', 'Reps cut the amounts on deals in this quarter'], answer: 0,
      why: 'In Kellogg\'s reading, this quarter down and next quarter up with the total about flat means pipeline moved between quarters.',
      whyNot: { 1: 'Losses would take the total down, and next quarter would not rise.', 2: 'New deals in this quarter would raise this-quarter pipeline, not lower it.', 3: 'Cutting amounts lowers the total; it does not move dollars into next quarter.' } },
    { id: 'FC1-13', lesson: 'fc1-5', level: 'Remember', stem: 'In Salesforce Pipeline Inspection, what does the Moved Out metric count?',
      options: ['Deals moved from Commit down to Best case in the period', 'Deals reassigned from one rep to another', 'Deals closed as lost during the period', 'Deals whose close date moved out of the period'], answer: 3,
      why: 'Trailhead describes Moved Out as deals whose close date moved out of the period, that is, deals pushed out.',
      whyNot: { 0: 'Category changes are not what Moved Out tracks.', 1: 'Ownership changes are not a pipeline-change metric there.', 2: 'Losses are counted separately, as Lost.' } },
    { id: 'FC1-14', lesson: 'fc1-6', level: 'Apply', stem: 'A team called {{a.called|$}} at week 6 and closed {{a.actual|$}}. By how much did it miss, as a share of the actual?',
      options: ['{{a.missOfCall|%1}}', '{{a.missPct|%1}}', '{{a.ratio|%1}}', '{{a.over|%1}}'], answer: 1,
      why: 'The miss is {{a.miss|$}}; divided by the actual {{a.actual|$}} it is {{a.missPct|%1}}.',
      whyNot: { 0: 'That divides the miss by the call, not by the actual.', 2: 'That is the actual as a share of the call.', 3: 'That is the call as a share of the actual.' } },
    { id: 'FC1-15', lesson: 'fc1-6', level: 'Evaluate', stem: 'Over four quarters Rep A\'s Commit closed at 95% and Rep B\'s at 55%. Each commits $400,000 this quarter. What should the manager call for them?',
      options: ['$800,000 in all, since both reps put the deals in Commit', 'Nothing for Rep B until Rep B\'s record improves', 'Near $400,000 for A and well below it for B, from each record', 'The average record, 75%, applied to each of the two reps'], answer: 2,
      why: 'Each rep\'s history says what their Commit is worth; the manager adjusts rep by rep.',
      whyNot: { 0: 'That treats both reps\' Commit as equally reliable, which the record contradicts.', 1: 'More than half of Rep B\'s Commit closes; calling zero is as wrong as calling all of it.', 3: 'Averaging throws away what you know about each rep.' } }
  ],
  cards: [
    { id: 'FC1C-01', front: 'Forecast category', back: 'How likely an open deal is to close in the period. In Salesforce each stage maps to one by default; the mapping can change.' },
    { id: 'FC1C-02', front: 'Cumulative rollup', back: 'A category plus every later one. Best Case Forecast = Best Case + Most Likely + Commit + Closed.' },
    { id: 'FC1C-03', front: 'Open Pipeline (cumulative view)', back: 'Pipeline + Best Case + Most Likely + Commit, without Closed.' },
    { id: 'FC1C-04', front: 'Omitted (Dynamics 365)', back: 'Takes the deal out of every forecast total; for deals on hold or not relevant to the period.' },
    { id: 'FC1C-05', front: 'Stage-weighted expected value', back: 'Each deal\'s amount times its stage probability, added up.' },
    { id: 'FC1C-06', front: 'Evidence for Commit', back: 'A critical event the buyer has confirmed and a known decision process with names and dates; mainly waiting on paperwork.' },
    { id: 'FC1C-07', front: 'SPICED', back: 'Situation, Pain, Impact, Critical Event, Decision (Winning by Design).' },
    { id: 'FC1C-08', front: 'Happy ears and sandbagging', back: 'Committing on enthusiasm with no buyer date, and holding deals back to beat the number.' },
    { id: 'FC1C-09', front: 'Triangulating the forecast', back: 'Rep roll-up, manager roll-up, stage-weighted value and category-weighted value side by side (Kellogg).' },
    { id: 'FC1C-10', front: 'Forecast adjustment (Salesforce)', back: 'Changes the forecast amount only; the opportunity data stays as the rep entered it.' },
    { id: 'FC1C-11', front: 'Moved Out', back: 'Deals whose close date moved out of the period: where slips show up in Pipeline Inspection.' },
    { id: 'FC1C-12', front: 'Forecast submission', back: 'A rep\'s weekly best estimate, kept so the change in the call over the period can be tracked.' }
  ]
};
