/**
 * AŞAMA 1065 — Elysium checkpoint.
 */
import { buildPhoenix2 } from './phoenix2.js';
import { accessgate3Summary } from './accessgate3.js';
import { rolegrant3Summary } from './rolegrant3.js';
import { devicetrust3Summary } from './devicetrust3.js';
import { mfareg3Summary } from './mfareg3.js';
import { privacypol3Summary } from './privacypol3.js';
import { breachlog3Summary } from './breachlog3.js';

export function buildElysium() {
  const prev = buildPhoenix2();
  const s0 = accessgate3Summary();
  const s1 = rolegrant3Summary();
  const s2 = devicetrust3Summary();
  const s3 = mfareg3Summary();
  const s4 = privacypol3Summary();
  const s5 = breachlog3Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Elysium",
    phoenix2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    accessgate3Sig: s0.open || 0,
    rolegrant3Sig: s1.draft || 0,
    devicetrust3Sig: s2.planned || 0,
    mfareg3Sig: s3.idle || 0,
    privacypol3Sig: s4.open || 0,
    breachlog3Sig: s5.draft || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Access Gate ${s0.open || 0} · Role Grant ${s1.draft || 0}`,
      `Device Trust ${s2.planned || 0} · MFA Reg ${s3.idle || 0}`,
      `Privacy Pol ${s4.open || 0} · Breach Log ${s5.draft || 0}`,
    ],
  };
}
