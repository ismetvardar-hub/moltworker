/**
 * AŞAMA 1140 — Chronos checkpoint.
 */
import { buildGaia } from './gaia.js';
import { momentmap3Summary } from './momentmap3.js';
import { webhookhub3Summary } from './webhookhub3.js';
import { schemareg3Summary } from './schemareg3.js';
import { jobqueue23Summary } from './jobqueue23.js';
import { cdnedge3Summary } from './cdnedge3.js';
import { errorbudget4Summary } from './errorbudget4.js';

export function buildChronos() {
  const prev = buildGaia();
  const s0 = momentmap3Summary();
  const s1 = webhookhub3Summary();
  const s2 = schemareg3Summary();
  const s3 = jobqueue23Summary();
  const s4 = cdnedge3Summary();
  const s5 = errorbudget4Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Chronos",
    gaia: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    momentmap3Sig: s0.idle || 0,
    webhookhub3Sig: s1.open || 0,
    schemareg3Sig: s2.draft || 0,
    jobqueue23Sig: s3.planned || 0,
    cdnedge3Sig: s4.idle || 0,
    errorbudget4Sig: s5.open || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Moment Map ${s0.idle || 0} · Webhook Hub ${s1.open || 0}`,
      `Schema Reg ${s2.draft || 0} · Job Queue+ ${s3.planned || 0}`,
      `CDN Edge ${s4.idle || 0} · Error Budget ${s5.open || 0}`,
    ],
  };
}
