/**
 * AŞAMA 510 — Forge checkpoint.
 */
import { buildCitadel } from './citadel.js';
import { talentdeskSummary } from './talentdesk.js';
import { certtrackSummary } from './certtrack.js';
import { traininghubSummary } from './traininghub.js';
import { payrollrunSummary } from './payrollrun.js';
import { attritionSummary } from './attrition.js';
import { shifttradeSummary } from './shifttrade.js';

export function buildForge() {
  const prev = buildCitadel();
  const talent = talentdeskSummary();
  const cert = certtrackSummary();
  const train = traininghubSummary();
  const pay = payrollrunSummary();
  const attr = attritionSummary();
  const swap = shifttradeSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Forge",
    citadel: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    talentOffer: talent.offer || 0,
    certExpiring: cert.expiring || 0,
    trainLive: train.live || 0,
    payDraft: pay.draft || 0,
    attrNotice: attr.notice || 0,
    swapReq: swap.requested || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Talent offers ${talent.offer || 0} · Certs expiring ${cert.expiring || 0}`,
      `Training live ${train.live || 0} · Payroll draft ${pay.draft || 0}`,
      `Attrition notice ${attr.notice || 0} · Shift swaps ${swap.requested || 0}`,
    ],
  };
}
