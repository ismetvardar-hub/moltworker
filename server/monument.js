/**
 * AŞAMA 885 — Monument checkpoint.
 */
import { buildPrism } from './prism.js';
import { correctiveSummary } from './corrective.js';
import { oralhistorySummary } from './oralhistory.js';
import { timelineSummary } from './timeline.js';
import { brandbibleSummary } from './brandbible.js';
import { heritageSummary } from './heritage.js';
import { alumniSummary } from './alumni.js';

export function buildMonument() {
  const prev = buildPrism();
  const s0 = correctiveSummary();
  const s1 = oralhistorySummary();
  const s2 = timelineSummary();
  const s3 = brandbibleSummary();
  const s4 = heritageSummary();
  const s5 = alumniSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Monument",
    prism: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    correctiveSig: s0.open || 0,
    oralhistorySig: s1.draft || 0,
    timelineSig: s2.planned || 0,
    brandbibleSig: s3.idle || 0,
    heritageSig: s4.open || 0,
    alumniSig: s5.draft || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Corrective ${s0.open || 0} · Oral History ${s1.draft || 0}`,
      `Timeline ${s2.planned || 0} · Brand Bible ${s3.idle || 0}`,
      `Heritage ${s4.open || 0} · Alumni ${s5.draft || 0}`,
    ],
  };
}
