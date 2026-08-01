/**
 * AŞAMA 555 — Crown checkpoint.
 */
import { buildOracle } from './oracle.js';
import { vipdeskSummary } from './vipdesk.js';
import { guestcaseSummary } from './guestcase.js';
import { tierladderSummary } from './tierladder.js';
import { giftcardSummary } from './giftcard.js';
import { winbackSummary } from './winback.js';
import { npspulseSummary } from './npspulse.js';

export function buildCrown() {
  const prev = buildOracle();
  const vip = vipdeskSummary();
  const comp = guestcaseSummary();
  const tier = tierladderSummary();
  const gift = giftcardSummary();
  const win = winbackSummary();
  const nps = npspulseSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Crown",
    oracle: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    vipInhouse: vip.inhouse || 0,
    complaintOpen: comp.open || 0,
    tierEligible: tier.eligible || 0,
    giftActive: gift.active || 0,
    winLive: win.live || 0,
    npsCaptured: nps.captured || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `VIP in-house ${vip.inhouse || 0} · Complaints open ${comp.open || 0}`,
      `Tier eligible ${tier.eligible || 0} · Gift cards active ${gift.active || 0}`,
      `Winback live ${win.live || 0} · NPS captured ${nps.captured || 0}`,
    ],
  };
}
