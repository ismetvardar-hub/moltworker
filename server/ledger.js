/**
 * AŞAMA 255 — Ledger checkpoint (meridian + finans/ticaret sinyalleri).
 */
import { buildMeridian } from './meridian.js';
import { arbillSummary } from './arbill.js';
import { apbillSummary } from './apbill.js';
import { refundsSummary } from './refunds.js';
import { chargebackSummary } from './chargeback.js';
import { overbookSummary } from './overbook.js';
import { channelmgrSummary } from './channelmgr.js';

export function buildLedger() {
  const mer = buildMeridian();
  const ar = arbillSummary();
  const ap = apbillSummary();
  const ref = refundsSummary();
  const cb = chargebackSummary();
  const ob = overbookSummary();
  const ch = channelmgrSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Ledger',
    meridian: { summaryLines: (mer.summaryLines || []).slice(0, 2) },
    arOverdue: ar.overdue || 0,
    apHeld: ap.held || 0,
    refundsOpen: ref.requested || 0,
    chargebackOpen: cb.open || 0,
    overbookProposed: ob.proposed || 0,
    channelErrors: ch.error || 0,
    summaryLines: [
      ...(mer.summaryLines || []).slice(0, 2),
      `AR gecikmiş ${ar.overdue || 0} · AP tutulmuş ${ap.held || 0}`,
      `İade talep ${ref.requested || 0} · Chargeback açık ${cb.open || 0}`,
      `Overbook öneri ${ob.proposed || 0} · Kanal hata ${ch.error || 0}`,
    ],
  };
}
