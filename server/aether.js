/**
 * AŞAMA 1080 — Aether checkpoint.
 */
import { buildElysium } from './elysium.js';
import { partnerdesk3Summary } from './partnerdesk3.js';
import { channelkit3Summary } from './channelkit3.js';
import { coinvest3Summary } from './coinvest3.js';
import { jointpromo3Summary } from './jointpromo3.js';
import { b2border3Summary } from './b2border3.js';
import { dealroom3Summary } from './dealroom3.js';

export function buildAether() {
  const prev = buildElysium();
  const s0 = partnerdesk3Summary();
  const s1 = channelkit3Summary();
  const s2 = coinvest3Summary();
  const s3 = jointpromo3Summary();
  const s4 = b2border3Summary();
  const s5 = dealroom3Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Aether",
    elysium: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    partnerdesk3Sig: s0.idle || 0,
    channelkit3Sig: s1.open || 0,
    coinvest3Sig: s2.draft || 0,
    jointpromo3Sig: s3.planned || 0,
    b2border3Sig: s4.idle || 0,
    dealroom3Sig: s5.open || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Partner Desk ${s0.idle || 0} · Channel Kit ${s1.open || 0}`,
      `Co Invest ${s2.draft || 0} · Joint Promo ${s3.planned || 0}`,
      `B2B Order ${s4.idle || 0} · Deal Room ${s5.open || 0}`,
    ],
  };
}
