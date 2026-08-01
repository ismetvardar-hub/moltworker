/**
 * AŞAMA 720 — Alliance2 checkpoint.
 */
import { buildBastion } from './bastion.js';
import { partnerdeskSummary } from './partnerdesk.js';
import { channelkitSummary } from './channelkit.js';
import { coinvestSummary } from './coinvest.js';
import { jointpromoSummary } from './jointpromo.js';
import { b2borderSummary } from './b2border.js';
import { dealroomSummary } from './dealroom.js';

export function buildAlliance2() {
  const prev = buildBastion();
  const s0 = partnerdeskSummary();
  const s1 = channelkitSummary();
  const s2 = coinvestSummary();
  const s3 = jointpromoSummary();
  const s4 = b2borderSummary();
  const s5 = dealroomSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Alliance2",
    bastion: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    partnerdeskSig: s0.idle || 0,
    channelkitSig: s1.open || 0,
    coinvestSig: s2.draft || 0,
    jointpromoSig: s3.planned || 0,
    b2borderSig: s4.idle || 0,
    dealroomSig: s5.open || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Partner Desk ${s0.idle || 0} · Channel Kit ${s1.open || 0}`,
      `Co Invest ${s2.draft || 0} · Joint Promo ${s3.planned || 0}`,
      `B2B Order ${s4.idle || 0} · Deal Room ${s5.open || 0}`,
    ],
  };
}
