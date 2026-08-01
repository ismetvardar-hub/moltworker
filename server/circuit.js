/**
 * AŞAMA 780 — Circuit checkpoint.
 */
import { buildSerenity } from './serenity.js';
import { momentmapSummary } from './momentmap.js';
import { webhookhubSummary } from './webhookhub.js';
import { schemaregSummary } from './schemareg.js';
import { jobqueue2Summary } from './jobqueue2.js';
import { cdnedgeSummary } from './cdnedge.js';
import { errorbudget2Summary } from './errorbudget2.js';

export function buildCircuit() {
  const prev = buildSerenity();
  const s0 = momentmapSummary();
  const s1 = webhookhubSummary();
  const s2 = schemaregSummary();
  const s3 = jobqueue2Summary();
  const s4 = cdnedgeSummary();
  const s5 = errorbudget2Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Circuit",
    serenity: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    momentmapSig: s0.idle || 0,
    webhookhubSig: s1.open || 0,
    schemaregSig: s2.draft || 0,
    jobqueue2Sig: s3.planned || 0,
    cdnedgeSig: s4.idle || 0,
    errorbudget2Sig: s5.open || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Moment Map ${s0.idle || 0} · Webhook Hub ${s1.open || 0}`,
      `Schema Reg ${s2.draft || 0} · Job Queue+ ${s3.planned || 0}`,
      `CDN Edge ${s4.idle || 0} · Error Budget ${s5.open || 0}`,
    ],
  };
}
