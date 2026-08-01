/**
 * AŞAMA 960 — Dominion2 checkpoint.
 */
import { buildArtery2 } from './artery2.js';
import { supplierkpi2Summary } from './supplierkpi2.js';
import { boardpulse2Summary } from './boardpulse2.js';
import { cashpulse2Summary } from './cashpulse2.js';
import { guestheat2Summary } from './guestheat2.js';
import { agentpulse2Summary } from './agentpulse2.js';
import { alertfuse2Summary } from './alertfuse2.js';

export function buildDominion2() {
  const prev = buildArtery2();
  const s0 = supplierkpi2Summary();
  const s1 = boardpulse2Summary();
  const s2 = cashpulse2Summary();
  const s3 = guestheat2Summary();
  const s4 = agentpulse2Summary();
  const s5 = alertfuse2Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Dominion2",
    artery2: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    supplierkpi2Sig: s0.draft || 0,
    boardpulse2Sig: s1.planned || 0,
    cashpulse2Sig: s2.idle || 0,
    guestheat2Sig: s3.open || 0,
    agentpulse2Sig: s4.draft || 0,
    alertfuse2Sig: s5.planned || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Supplier KPI ${s0.draft || 0} · Board Pulse ${s1.planned || 0}`,
      `Cash Pulse ${s2.idle || 0} · Guest Heat ${s3.open || 0}`,
      `Agent Pulse ${s4.draft || 0} · Alert Fuse ${s5.planned || 0}`,
    ],
  };
}
