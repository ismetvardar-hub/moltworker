/**
 * AŞAMA 1170 — Logos checkpoint.
 */
import { buildKairos } from './kairos.js';
import { cohort3Summary } from './cohort3.js';
import { pilotrun3Summary } from './pilotrun3.js';
import { hypothesis3Summary } from './hypothesis3.js';
import { userboard3Summary } from './userboard3.js';
import { sandbox3Summary } from './sandbox3.js';
import { incubate3Summary } from './incubate3.js';

export function buildLogos() {
  const prev = buildKairos();
  const s0 = cohort3Summary();
  const s1 = pilotrun3Summary();
  const s2 = hypothesis3Summary();
  const s3 = userboard3Summary();
  const s4 = sandbox3Summary();
  const s5 = incubate3Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Logos",
    kairos: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    cohort3Sig: s0.draft || 0,
    pilotrun3Sig: s1.planned || 0,
    hypothesis3Sig: s2.idle || 0,
    userboard3Sig: s3.open || 0,
    sandbox3Sig: s4.draft || 0,
    incubate3Sig: s5.planned || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Cohort ${s0.draft || 0} · Pilot Run ${s1.planned || 0}`,
      `Hypothesis ${s2.idle || 0} · User Board ${s3.open || 0}`,
      `Sandbox ${s4.draft || 0} · Incubate ${s5.planned || 0}`,
    ],
  };
}
