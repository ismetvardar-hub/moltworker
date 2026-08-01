/**
 * AŞAMA 1185 — Pathos checkpoint.
 */
import { buildLogos } from './logos.js';
import { ipvault3Summary } from './ipvault3.js';
import { riskreg3Summary } from './riskreg3.js';
import { claimdesk3Summary } from './claimdesk3.js';
import { litigation3Summary } from './litigation3.js';
import { ethicsline3Summary } from './ethicsline3.js';
import { sanctions3Summary } from './sanctions3.js';

export function buildPathos() {
  const prev = buildLogos();
  const s0 = ipvault3Summary();
  const s1 = riskreg3Summary();
  const s2 = claimdesk3Summary();
  const s3 = litigation3Summary();
  const s4 = ethicsline3Summary();
  const s5 = sanctions3Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Pathos",
    logos: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    ipvault3Sig: s0.open || 0,
    riskreg3Sig: s1.draft || 0,
    claimdesk3Sig: s2.planned || 0,
    litigation3Sig: s3.idle || 0,
    ethicsline3Sig: s4.open || 0,
    sanctions3Sig: s5.draft || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `IP Vault ${s0.open || 0} · Risk Reg ${s1.draft || 0}`,
      `Claim Desk ${s2.planned || 0} · Litigation ${s3.idle || 0}`,
      `Ethics Line ${s4.open || 0} · Sanctions ${s5.draft || 0}`,
    ],
  };
}
