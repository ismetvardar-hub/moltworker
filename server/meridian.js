/**
 * AŞAMA 240 — Meridian checkpoint (horizon + misafir oda servis sinyalleri).
 */
import { buildHorizon } from './horizon.js';
import { stayextSummary } from './stayext.js';
import { roommoveSummary } from './roommove.js';
import { earlyinSummary } from './earlyin.js';
import { luggageSummary } from './luggage.js';
import { turndownSummary } from './turndown.js';
import { dndflagsSummary } from './dndflags.js';

export function buildMeridian() {
  const hor = buildHorizon();
  const stay = stayextSummary();
  const move = roommoveSummary();
  const early = earlyinSummary();
  const lug = luggageSummary();
  const turn = turndownSummary();
  const dnd = dndflagsSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Meridian',
    horizon: { summaryLines: (hor.summaryLines || []).slice(0, 2) },
    stayAccepted: stay.accepted || 0,
    movesOpen: move.requested || 0,
    earlyRequested: early.requested || 0,
    luggageHeld: lug.held || 0,
    turndownQueued: turn.queued || 0,
    dndActive: dnd.dnd || 0,
    summaryLines: [
      ...(hor.summaryLines || []).slice(0, 2),
      `Stay uzatma kabul ${stay.accepted || 0} · Oda taşıma talep ${move.requested || 0}`,
      `Erken check-in ${early.requested || 0} · Bagaj emanet ${lug.held || 0}`,
      `Turndown kuyruk ${turn.queued || 0} · DND ${dnd.dnd || 0}`,
    ],
  };
}
