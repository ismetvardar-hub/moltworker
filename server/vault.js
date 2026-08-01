/**
 * AŞAMA 585 — Vault checkpoint.
 */
import { buildBeacon } from './beacon.js';
import { treasurySummary } from './treasury.js';
import { apdeskSummary } from './apdesk.js';
import { ardeskSummary } from './ardesk.js';
import { payoutSummary } from './payout.js';
import { bankreconSummary } from './bankrecon.js';
import { closebookSummary } from './closebook.js';

export function buildVault() {
  const prev = buildBeacon();
  const tres = treasurySummary();
  const ap = apdeskSummary();
  const ar = ardeskSummary();
  const pay = payoutSummary();
  const recon = bankreconSummary();
  const close = closebookSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Vault",
    beacon: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    tresCritical: tres.critical || 0,
    apOpen: ap.open || 0,
    arOpen: ar.open || 0,
    payFailed: pay.failed || 0,
    reconException: recon.exception || 0,
    closeOpen: close.open || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Treasury critical ${tres.critical || 0} · AP open ${ap.open || 0}`,
      `AR open ${ar.open || 0} · Payout failed ${pay.failed || 0}`,
      `Bank recon exceptions ${recon.exception || 0} · Close books open ${close.open || 0}`,
    ],
  };
}
