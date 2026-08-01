/**
 * AŞAMA 360 — Mirror checkpoint.
 */
import { buildLattice } from './lattice.js';
import { guesttwinSummary } from './guesttwin.js';
import { intentscoreSummary } from './intentscore.js';
import { nextbestSummary } from './nextbest.js';
import { churnriskSummary } from './churnrisk.js';
import { emotionpulseSummary } from './emotionpulse.js';
import { recoverypathSummary } from './recoverypath.js';

export function buildMirror() {
  const prev = buildLattice();
  const twin = guesttwinSummary();
  const intent = intentscoreSummary();
  const nba = nextbestSummary();
  const churn = churnriskSummary();
  const emo = emotionpulseSummary();
  const rec = recoverypathSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Mirror",
    lattice: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    twinsStale: twin.stale || 0,
    intentHigh: intent.high || 0,
    nbaSuggested: nba.suggested || 0,
    churnHigh: churn.high || 0,
    emotionAlert: emo.alert || 0,
    recoveryOpen: rec.open || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Guest twin stale ${twin.stale || 0} · Intent high ${intent.high || 0}`,
      `NBA suggested ${nba.suggested || 0} · Churn high ${churn.high || 0}`,
      `Emotion alert ${emo.alert || 0} · Recovery open ${rec.open || 0}`,
    ],
  };
}
