// Links into the other study apps. Link, never copy (Decision 22 and the topic homes in claude/study-apps-index.md).
// Each address was checked in that app's repo (Measured, Nov 27, 2026): Throughput lesson ids in its published-ids.json
// (main bb7e826); Dry Run card and item ids in decks/*.py and stats/stats.json (582f9a5) with routes #dk-<id> and #sx-<id>.
// build.js refuses a lesson link whose key is not here.
'use strict';
const TP = 'https://claude.ai/artifact/GrsGQNfo6gq52VaAbfGViN', DR = 'https://claude.ai/artifact/1kZMmGtxwBPidFEo3Uwfea';
module.exports = {
  'tp-coo1-1': ['Throughput: The operating rhythm (coo1-1)', TP + '#lesson-coo1-1'],
  'tp-coo1-5': ['Throughput: The operations update for the CEO and board (coo1-5)', TP + '#lesson-coo1-5'],
  'tp-coo3-1': ['Throughput: The monthly S&OP cycle and what the executive meeting decides (coo3-1)', TP + '#lesson-coo3-1'],
  'dr-fn-01': ['Dry Run: Sales velocity (FN-01)', DR + '#dk-fn-01'],
  'dr-fn-03': ['Dry Run: Win rate (FN-03)', DR + '#dk-fn-03'],
  'dr-sav-02': ['Dry Run: Pipeline coverage ratio (SAV-02)', DR + '#dk-sav-02'],
  'dr-sav-04': ['Dry Run: Forecast accuracy and MAPE (SAV-04)', DR + '#dk-sav-04'],
  'dr-sav-11': ['Dry Run: Customer quarterly business review (SAV-11)', DR + '#dk-sav-11'],
  'dr-sm-04': ['Dry Run: Net and gross retention, worked example (SM-04)', DR + '#sx-sm-04'],
  'dr-sm-13': ['Dry Run: Net revenue retention, defined (SM-13)', DR + '#sx-sm-13']
};
