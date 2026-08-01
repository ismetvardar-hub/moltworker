/**
 * AŞAMA 915 — Bastion2 checkpoint.
 */
import { buildOlympus } from './olympus.js';
import { accessgate2Summary } from './accessgate2.js';
import { rolegrant2Summary } from './rolegrant2.js';
import { devicetrust2Summary } from './devicetrust2.js';
import { mfareg2Summary } from './mfareg2.js';
import { privacypol2Summary } from './privacypol2.js';
import { breachlog2Summary } from './breachlog2.js';

export function buildBastion2() {
  const prev = buildOlympus();
  const s0 = accessgate2Summary();
  const s1 = rolegrant2Summary();
  const s2 = devicetrust2Summary();
  const s3 = mfareg2Summary();
  const s4 = privacypol2Summary();
  const s5 = breachlog2Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Bastion2",
    olympus: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    accessgate2Sig: s0.open || 0,
    rolegrant2Sig: s1.draft || 0,
    devicetrust2Sig: s2.planned || 0,
    mfareg2Sig: s3.idle || 0,
    privacypol2Sig: s4.open || 0,
    breachlog2Sig: s5.draft || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Access Gate ${s0.open || 0} · Role Grant ${s1.draft || 0}`,
      `Device Trust ${s2.planned || 0} · MFA Reg ${s3.idle || 0}`,
      `Privacy Pol ${s4.open || 0} · Breach Log ${s5.draft || 0}`,
    ],
  };
}
