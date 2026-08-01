/**
 * AŞAMA 495 — Citadel checkpoint.
 */
import { buildSanctum } from './sanctum.js';
import { plantroomSummary } from './plantroom.js';
import { hvacloopSummary } from './hvacloop.js';
import { powergridSummary } from './powergrid.js';
import { workorderSummary } from './workorder.js';
import { sparepartsSummary } from './spareparts.js';
import { estatescanSummary } from './estatescan.js';

export function buildCitadel() {
  const prev = buildSanctum();
  const plant = plantroomSummary();
  const hvac = hvacloopSummary();
  const power = powergridSummary();
  const wo = workorderSummary();
  const spare = sparepartsSummary();
  const scan = estatescanSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Citadel",
    sanctum: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    plantCritical: plant.critical || 0,
    hvacFault: hvac.fault || 0,
    powerOutage: power.outage || 0,
    woOpen: wo.open || 0,
    spareLow: spare.low || 0,
    scanRed: scan.red || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Plant critical ${plant.critical || 0} · HVAC fault ${hvac.fault || 0}`,
      `Power outage ${power.outage || 0} · Work orders open ${wo.open || 0}`,
      `Spare parts low ${spare.low || 0} · Estate scan red ${scan.red || 0}`,
    ],
  };
}
