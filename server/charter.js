/**
 * AŞAMA 825 — Charter checkpoint.
 */
import { buildCrucible } from './crucible.js';
import { ipvaultSummary } from './ipvault.js';
import { riskregSummary } from './riskreg.js';
import { claimdeskSummary } from './claimdesk.js';
import { litigationSummary } from './litigation.js';
import { ethicslineSummary } from './ethicsline.js';
import { sanctionsSummary } from './sanctions.js';

export function buildCharter() {
  const prev = buildCrucible();
  const s0 = ipvaultSummary();
  const s1 = riskregSummary();
  const s2 = claimdeskSummary();
  const s3 = litigationSummary();
  const s4 = ethicslineSummary();
  const s5 = sanctionsSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Charter",
    crucible: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    ipvaultSig: s0.open || 0,
    riskregSig: s1.draft || 0,
    claimdeskSig: s2.planned || 0,
    litigationSig: s3.idle || 0,
    ethicslineSig: s4.open || 0,
    sanctionsSig: s5.draft || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `IP Vault ${s0.open || 0} · Risk Reg ${s1.draft || 0}`,
      `Claim Desk ${s2.planned || 0} · Litigation ${s3.idle || 0}`,
      `Ethics Line ${s4.open || 0} · Sanctions ${s5.draft || 0}`,
    ],
  };
}
