/**
 * AŞAMA 750 — Dominion checkpoint.
 */
import { buildArtery } from './artery.js';
import { supplierkpiSummary } from './supplierkpi.js';
import { boardpulseSummary } from './boardpulse.js';
import { cashpulseSummary } from './cashpulse.js';
import { guestheatSummary } from './guestheat.js';
import { agentpulseSummary } from './agentpulse.js';
import { alertfuseSummary } from './alertfuse.js';

export function buildDominion() {
  const prev = buildArtery();
  const s0 = supplierkpiSummary();
  const s1 = boardpulseSummary();
  const s2 = cashpulseSummary();
  const s3 = guestheatSummary();
  const s4 = agentpulseSummary();
  const s5 = alertfuseSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Dominion",
    artery: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    supplierkpiSig: s0.draft || 0,
    boardpulseSig: s1.planned || 0,
    cashpulseSig: s2.idle || 0,
    guestheatSig: s3.open || 0,
    agentpulseSig: s4.draft || 0,
    alertfuseSig: s5.planned || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Supplier KPI ${s0.draft || 0} · Board Pulse ${s1.planned || 0}`,
      `Cash Pulse ${s2.idle || 0} · Guest Heat ${s3.open || 0}`,
      `Agent Pulse ${s4.draft || 0} · Alert Fuse ${s5.planned || 0}`,
    ],
  };
}
