/**
 * AŞAMA 450 — Aurora checkpoint.
 */
import { buildHarbor } from './harbor.js';
import { auroradeckSummary } from './auroradeck.js';
import { lightshowSummary } from './lightshow.js';
import { guestflowSummary } from './guestflow.js';
import { immersiveSummary } from './immersive.js';
import { nightmodeSummary } from './nightmode.js';
import { projectionSummary } from './projection.js';

export function buildAurora() {
  const prev = buildHarbor();
  const deck = auroradeckSummary();
  const light = lightshowSummary();
  const flow = guestflowSummary();
  const imm = immersiveSummary();
  const night = nightmodeSummary();
  const proj = projectionSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Aurora",
    harbor: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    deckLive: deck.live || 0,
    lightRunning: light.running || 0,
    flowJam: flow.jam || 0,
    immersiveRun: imm.running || 0,
    nightActive: night.active || 0,
    projecting: proj.projecting || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Aurora deck live ${deck.live || 0} · Light show running ${light.running || 0}`,
      `Guest flow jam ${flow.jam || 0} · Immersive running ${imm.running || 0}`,
      `Night mode active ${night.active || 0} · Projection live ${proj.projecting || 0}`,
    ],
  };
}
