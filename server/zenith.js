/**
 * AŞAMA 390 — Zenith checkpoint.
 */
import { buildKeystone } from './keystone.js';
import { pickuppaceSummary } from './pickuppace.js';
import { noshowriskSummary } from './noshowrisk.js';
import { pricefloorSummary } from './pricefloor.js';
import { marginwatchSummary } from './marginwatch.js';
import { beatrevenueSummary } from './beatrevenue.js';
import { walkinflowSummary } from './walkinflow.js';

export function buildZenith() {
  const prev = buildKeystone();
  const pace = pickuppaceSummary();
  const noshow = noshowriskSummary();
  const floor = pricefloorSummary();
  const margin = marginwatchSummary();
  const beat = beatrevenueSummary();
  const walk = walkinflowSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Zenith",
    keystone: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    paceBehind: pace.behind || 0,
    noshowHigh: noshow.high || 0,
    floorBreached: floor.breached || 0,
    marginNeg: margin.negative || 0,
    beatBelow: beat.below || 0,
    walkSurge: walk.surge || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Pickup behind ${pace.behind || 0} · No-show high ${noshow.high || 0}`,
      `Price floor breached ${floor.breached || 0} · Margin negative ${margin.negative || 0}`,
      `Beat below ${beat.below || 0} · Walk-in surge ${walk.surge || 0}`,
    ],
  };
}
