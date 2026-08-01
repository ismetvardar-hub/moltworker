/**
 * AŞAMA 1020 — Crucible2 checkpoint.
 */
import { buildAgora2 } from './agora2.js';
import { cohort2Summary } from './cohort2.js';
import { pilotrun2Summary } from './pilotrun2.js';
import { hypothesis2Summary } from './hypothesis2.js';
import { userboard2Summary } from './userboard2.js';
import { sandbox2Summary } from './sandbox2.js';
import { incubate2Summary } from './incubate2.js';

export function buildCrucible2() {
  const prev = buildAgora2();
  const s0 = cohort2Summary();
  const s1 = pilotrun2Summary();
  const s2 = hypothesis2Summary();
  const s3 = userboard2Summary();
  const s4 = sandbox2Summary();
  const s5 = incubate2Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Crucible2",
    agora2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    cohort2Sig: s0.draft || 0,
    pilotrun2Sig: s1.planned || 0,
    hypothesis2Sig: s2.idle || 0,
    userboard2Sig: s3.open || 0,
    sandbox2Sig: s4.draft || 0,
    incubate2Sig: s5.planned || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Cohort ${s0.draft || 0} · Pilot Run ${s1.planned || 0}`,
      `Hypothesis ${s2.idle || 0} · User Board ${s3.open || 0}`,
      `Sandbox ${s4.draft || 0} · Incubate ${s5.planned || 0}`,
    ],
  };
}
