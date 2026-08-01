/**
 * AŞAMA 540 — Oracle checkpoint.
 */
import { buildAegis } from './aegis.js';
import { featureflagSummary } from './featureflag.js';
import { evalbenchSummary } from './evalbench.js';
import { anomalySummary } from './anomaly.js';
import { vectorstoreSummary } from './vectorstore.js';
import { scorecardSummary } from './scorecard.js';
import { abtestSummary } from './abtest.js';

export function buildOracle() {
  const prev = buildAegis();
  const flag = featureflagSummary();
  const bench = evalbenchSummary();
  const anom = anomalySummary();
  const vec = vectorstoreSummary();
  const score = scorecardSummary();
  const ab = abtestSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Oracle",
    aegis: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    flagCanary: flag.canary || 0,
    evalFail: bench.fail || 0,
    anomOpen: anom.open || 0,
    vecStale: vec.stale || 0,
    scoreRed: score.red || 0,
    abRunning: ab.running || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Feature canary ${flag.canary || 0} · Eval fail ${bench.fail || 0}`,
      `Anomaly open ${anom.open || 0} · Vector stale ${vec.stale || 0}`,
      `Scorecard red ${score.red || 0} · A/B running ${ab.running || 0}`,
    ],
  };
}
