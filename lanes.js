// Lanes, levels and planned topics. Ids are link ids: once published they never change (published-ids.json).
// Lane names use full titles (naming rule, claude/c-suite-series-plan.md); acronyms appear only in brackets.
// Lane order is the build order in claude/revenue-cro-app-plan.md (Read, Nov 25): sales leadership and RevOps first,
// then customer success, marketing and the Chief Revenue Officer.
'use strict';
module.exports = {
  // Level tags, the same three as Blast Radius and Throughput. Items in leveled lanes carry one or more.
  levels: [
    { id: 'director', name: 'Director', scope: 'Runs the team, the pipeline or the program' },
    { id: 'vp', name: 'VP', scope: 'Owns the number, the budget and the org' },
    { id: 'c-level', name: 'C-level', scope: 'Owns the revenue plan and the board update' }
  ],
  lanes: [
    { id: 'sales', name: 'Sales leadership (including Chief Sales Officer)', short: 'Sales leadership', active: true, leveled: true, color: '--s-sky',
      blurb: 'Pipeline stages, qualification, sales methodology, coverage and segmentation, forecasting, territory and quota, capacity, compensation, deal reviews.' },
    { id: 'revops', name: 'Revenue operations (RevOps)', short: 'RevOps', active: false, leveled: true, color: '--s-mint',
      blurb: 'Funnel and lifecycle stages, CRM data model and hygiene, routing, attribution, the revenue tech stack, annual planning, deal desk.' },
    { id: 'customer-success', name: 'Customer success (including Chief Customer Officer)', short: 'Customer success', active: false, leveled: true, color: '--s-orange',
      blurb: 'Onboarding and time to value, health scores, renewals and expansion, churn, QBRs, coverage models.' },
    { id: 'marketing', name: 'Marketing (including Chief Marketing Officer)', short: 'Marketing', active: false, leveled: true, color: '--s-pink',
      blurb: 'The eight AMA PCM Marketing Management domains with a timed mock, and the executive marketing chair: brand, budget, board reporting.' },
    { id: 'chief-revenue-officer', name: 'Chief Revenue Officer (CRO)', short: 'Chief Revenue Officer', active: true, leveled: true, color: '--s-lilac',
      blurb: 'Revenue operating cadence, the annual revenue plan, go-to-market motion, aligning sales, marketing and customer success, unit economics, org design.' }
  ],
  // Built sections, by lane. Section ids are link ids (lane-section) and never change once published. Ids are claimed when
  // a phase's outline is approved. Phase 1 (approved Nov 28, decisions 2 and 6): sales-forecasting, sales-forecast-call,
  // chief-revenue-officer-cadence, chief-revenue-officer-forecast-call.
  sections: {
    sales: [
      { id: 'forecasting', title: 'Sales forecasting', kind: 'Deck', phase: 1, deck: 'fc1' },
      { id: 'forecast-call', title: 'The forecast call', kind: 'Simulation', phase: 1, route: '#run-rtn-1' }
    ],
    'chief-revenue-officer': [
      { id: 'cadence', title: 'Revenue operating cadence', kind: 'Deck', phase: 1, deck: 'rc1' },
      { id: 'forecast-call', title: 'The forecast call', kind: 'Simulation', phase: 1, route: '#run-rtn-1' }
    ]
  },
  // Planned topics shown on a lane screen until they are built. Text only: no link ids. From the plan's lane list and
  // phases (Read, claude/revenue-cro-app-plan.md). Built topics move to sections.
  planned: {
    sales: [
      { title: 'Pipeline stages and exit criteria', kind: 'Deck', phase: 2 },
      { title: 'Qualification frameworks (BANT, MEDDICC, SPICED)', kind: 'Deck', phase: 2 },
      { title: 'Sales methodology (Challenger, SPIN, solution selling, Command of the Message)', kind: 'Deck', phase: 2 },
      { title: 'Sales strategy: coverage models, segmentation, account tiering', kind: 'Deck', phase: 2 },
      { title: 'Territory and quota design; capacity and ramp', kind: 'Deck', phase: 2 },
      { title: 'Compensation plans', kind: 'Deck', phase: 2 },
      { title: 'Deal reviews, enablement and hiring', kind: 'Deck', phase: 2 },
      { title: 'The Chief Sales Officer’s job', kind: 'Deck', phase: 2 },
      { title: 'Territory and quota capacity plan', kind: 'Simulation', phase: 2 },
      { title: 'Comp plan design', kind: 'Simulation', phase: 2 }
    ],
    revops: [
      { title: 'Funnel, CRM, routing, attribution, tech stack, planning, deal desk', kind: 'Decks', phase: 2 },
      { title: 'Sales ops interview drills', kind: 'Drills', phase: 2 },
      { title: 'Attribution puzzle', kind: 'Simulation', phase: 2 }
    ],
    'customer-success': [
      { title: 'Onboarding, health scores, renewals, churn, QBRs, coverage; Chief Customer Officer', kind: 'Decks', phase: 3 },
      { title: 'Retention over eight quarters', kind: 'Simulation', phase: 3 }
    ],
    marketing: [
      { title: 'Eight PCM Marketing Management domain decks', kind: 'Decks', phase: 3 },
      { title: 'Timed mock (150 questions, 3 h)', kind: 'Mock exam', phase: 3 },
      { title: 'The Chief Marketing Officer’s job', kind: 'Deck', phase: 3 }
    ],
    'chief-revenue-officer': [
      { title: 'Annual revenue plan, go-to-market motion, alignment, unit economics, org design', kind: 'Decks', phase: 4 },
      { title: 'Craft packets and role-plays', kind: 'Practice', phase: 4 }
    ]
  },
  exam: {}
};
