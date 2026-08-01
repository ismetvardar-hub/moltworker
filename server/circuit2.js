/**
 * AŞAMA 990 — Circuit2 checkpoint.
 */
import { buildSerenity2 } from './serenity2.js';
import { momentmap2Summary } from './momentmap2.js';
import { webhookhub2Summary } from './webhookhub2.js';
import { schemareg2Summary } from './schemareg2.js';
import { jobqueue22Summary } from './jobqueue22.js';
import { cdnedge2Summary } from './cdnedge2.js';
import { errorbudget3Summary } from './errorbudget3.js';

export function buildCircuit2() {
  const prev = buildSerenity2();
  const s0 = momentmap2Summary();
  const s1 = webhookhub2Summary();
  const s2 = schemareg2Summary();
  const s3 = jobqueue22Summary();
  const s4 = cdnedge2Summary();
  const s5 = errorbudget3Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Circuit2",
    serenity2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    momentmap2Sig: s0.idle || 0,
    webhookhub2Sig: s1.open || 0,
    schemareg2Sig: s2.draft || 0,
    jobqueue22Sig: s3.planned || 0,
    cdnedge2Sig: s4.idle || 0,
    errorbudget3Sig: s5.open || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Moment Map ${s0.idle || 0} · Webhook Hub ${s1.open || 0}`,
      `Schema Reg ${s2.draft || 0} · Job Queue+ ${s3.planned || 0}`,
      `CDN Edge ${s4.idle || 0} · Error Budget ${s5.open || 0}`,
    ],
  };
}
