/**
 * AŞAMA 810 — Crucible checkpoint.
 */
import { buildAgora } from './agora.js';
import { cohortSummary } from './cohort.js';
import { pilotrunSummary } from './pilotrun.js';
import { hypothesisSummary } from './hypothesis.js';
import { userboardSummary } from './userboard.js';
import { sandboxSummary } from './sandbox.js';
import { incubateSummary } from './incubate.js';

export function buildCrucible() {
  const prev = buildAgora();
  const s0 = cohortSummary();
  const s1 = pilotrunSummary();
  const s2 = hypothesisSummary();
  const s3 = userboardSummary();
  const s4 = sandboxSummary();
  const s5 = incubateSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Crucible",
    agora: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    cohortSig: s0.draft || 0,
    pilotrunSig: s1.planned || 0,
    hypothesisSig: s2.idle || 0,
    userboardSig: s3.open || 0,
    sandboxSig: s4.draft || 0,
    incubateSig: s5.planned || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Cohort ${s0.draft || 0} · Pilot Run ${s1.planned || 0}`,
      `Hypothesis ${s2.idle || 0} · User Board ${s3.open || 0}`,
      `Sandbox ${s4.draft || 0} · Incubate ${s5.planned || 0}`,
    ],
  };
}
