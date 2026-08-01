/**
 * AŞAMA 1110 — Selene checkpoint.
 */
import { buildHelios } from './helios.js';
import { supplierkpi3Summary } from './supplierkpi3.js';
import { boardpulse3Summary } from './boardpulse3.js';
import { cashpulse3Summary } from './cashpulse3.js';
import { guestheat3Summary } from './guestheat3.js';
import { agentpulse3Summary } from './agentpulse3.js';
import { alertfuse3Summary } from './alertfuse3.js';

export function buildSelene() {
  const prev = buildHelios();
  const s0 = supplierkpi3Summary();
  const s1 = boardpulse3Summary();
  const s2 = cashpulse3Summary();
  const s3 = guestheat3Summary();
  const s4 = agentpulse3Summary();
  const s5 = alertfuse3Summary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Selene",
    helios: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    supplierkpi3Sig: s0.draft || 0,
    boardpulse3Sig: s1.planned || 0,
    cashpulse3Sig: s2.idle || 0,
    guestheat3Sig: s3.open || 0,
    agentpulse3Sig: s4.draft || 0,
    alertfuse3Sig: s5.planned || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Supplier KPI ${s0.draft || 0} · Board Pulse ${s1.planned || 0}`,
      `Cash Pulse ${s2.idle || 0} · Guest Heat ${s3.open || 0}`,
      `Agent Pulse ${s4.draft || 0} · Alert Fuse ${s5.planned || 0}`,
    ],
  };
}
