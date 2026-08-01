/**
 * AŞAMA 705 — Bastion checkpoint.
 */
import { buildVerdant } from './verdant.js';
import { accessgateSummary } from './accessgate.js';
import { rolegrantSummary } from './rolegrant.js';
import { devicetrustSummary } from './devicetrust.js';
import { mfaregSummary } from './mfareg.js';
import { privacypolSummary } from './privacypol.js';
import { breachlogSummary } from './breachlog.js';

export function buildBastion() {
  const prev = buildVerdant();
  const s0 = accessgateSummary();
  const s1 = rolegrantSummary();
  const s2 = devicetrustSummary();
  const s3 = mfaregSummary();
  const s4 = privacypolSummary();
  const s5 = breachlogSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Bastion",
    verdant: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    accessgateSig: s0.open || 0,
    rolegrantSig: s1.draft || 0,
    devicetrustSig: s2.planned || 0,
    mfaregSig: s3.idle || 0,
    privacypolSig: s4.open || 0,
    breachlogSig: s5.draft || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Access Gate ${s0.open || 0} · Role Grant ${s1.draft || 0}`,
      `Device Trust ${s2.planned || 0} · MFA Reg ${s3.idle || 0}`,
      `Privacy Pol ${s4.open || 0} · Breach Log ${s5.draft || 0}`,
    ],
  };
}
