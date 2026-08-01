/**
 * AŞAMA 870 — Prism checkpoint.
 */
import { buildFrontier } from './frontier.js';
import { postlaunchSummary } from './postlaunch.js';
import { defectlogSummary } from './defectlog.js';
import { mysteryguestSummary } from './mysteryguest.js';
import { servicemarkSummary } from './servicemark.js';
import { labresultSummary } from './labresult.js';
import { isotrackSummary } from './isotrack.js';

export function buildPrism() {
  const prev = buildFrontier();
  const s0 = postlaunchSummary();
  const s1 = defectlogSummary();
  const s2 = mysteryguestSummary();
  const s3 = servicemarkSummary();
  const s4 = labresultSummary();
  const s5 = isotrackSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Prism",
    frontier: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    postlaunchSig: s0.draft || 0,
    defectlogSig: s1.planned || 0,
    mysteryguestSig: s2.idle || 0,
    servicemarkSig: s3.open || 0,
    labresultSig: s4.draft || 0,
    isotrackSig: s5.planned || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Post Launch ${s0.draft || 0} · Defect Log ${s1.planned || 0}`,
      `Mystery Guest ${s2.idle || 0} · Service Mark ${s3.open || 0}`,
      `Lab Result ${s4.draft || 0} · ISO Track ${s5.planned || 0}`,
    ],
  };
}
