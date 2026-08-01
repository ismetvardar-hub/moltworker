/**
 * AŞAMA 930 — Alliance3 checkpoint.
 */
import { buildBastion2 } from './bastion2.js';
import { partnerdesk2Summary } from './partnerdesk2.js';
import { channelkit2Summary } from './channelkit2.js';
import { coinvest2Summary } from './coinvest2.js';
import { jointpromo2Summary } from './jointpromo2.js';
import { b2border2Summary } from './b2border2.js';
import { dealroom2Summary } from './dealroom2.js';

export function buildAlliance3() {
  const prev = buildBastion2();
  const s0 = partnerdesk2Summary();
  const s1 = channelkit2Summary();
  const s2 = coinvest2Summary();
  const s3 = jointpromo2Summary();
  const s4 = b2border2Summary();
  const s5 = dealroom2Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Alliance3",
    bastion2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    partnerdesk2Sig: s0.idle || 0,
    channelkit2Sig: s1.open || 0,
    coinvest2Sig: s2.draft || 0,
    jointpromo2Sig: s3.planned || 0,
    b2border2Sig: s4.idle || 0,
    dealroom2Sig: s5.open || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Partner Desk ${s0.idle || 0} · Channel Kit ${s1.open || 0}`,
      `Co Invest ${s2.draft || 0} · Joint Promo ${s3.planned || 0}`,
      `B2B Order ${s4.idle || 0} · Deal Room ${s5.open || 0}`,
    ],
  };
}
