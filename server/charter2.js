/**
 * AŞAMA 1035 — Charter2 checkpoint.
 */
import { buildCrucible2 } from './crucible2.js';
import { ipvault2Summary } from './ipvault2.js';
import { riskreg2Summary } from './riskreg2.js';
import { claimdesk2Summary } from './claimdesk2.js';
import { litigation2Summary } from './litigation2.js';
import { ethicsline2Summary } from './ethicsline2.js';
import { sanctions2Summary } from './sanctions2.js';

export function buildCharter2() {
  const prev = buildCrucible2();
  const s0 = ipvault2Summary();
  const s1 = riskreg2Summary();
  const s2 = claimdesk2Summary();
  const s3 = litigation2Summary();
  const s4 = ethicsline2Summary();
  const s5 = sanctions2Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Charter2",
    crucible2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    ipvault2Sig: s0.open || 0,
    riskreg2Sig: s1.draft || 0,
    claimdesk2Sig: s2.planned || 0,
    litigation2Sig: s3.idle || 0,
    ethicsline2Sig: s4.open || 0,
    sanctions2Sig: s5.draft || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `IP Vault ${s0.open || 0} · Risk Reg ${s1.draft || 0}`,
      `Claim Desk ${s2.planned || 0} · Litigation ${s3.idle || 0}`,
      `Ethics Line ${s4.open || 0} · Sanctions ${s5.draft || 0}`,
    ],
  };
}
