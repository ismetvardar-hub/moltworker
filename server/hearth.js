/**
 * AŞAMA 465 — Hearth checkpoint.
 */
import { buildAurora } from './aurora.js';
import { passrailSummary } from './passrail.js';
import { plateupSummary } from './plateup.js';
import { barrailSummary } from './barrail.js';
import { roomserviceSummary } from './roomservice.js';
import { allergenmapSummary } from './allergenmap.js';
import { cellarboxSummary } from './cellarbox.js';

export function buildHearth() {
  const prev = buildAurora();
  const pass = passrailSummary();
  const plate = plateupSummary();
  const bar = barrailSummary();
  const room = roomserviceSummary();
  const alg = allergenmapSummary();
  const cellar = cellarboxSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Hearth",
    aurora: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    passFired: pass.fired || 0,
    plateQueued: plate.queued || 0,
    barQueued: bar.queued || 0,
    roomPrep: room.prep || 0,
    allergenActive: alg.active || 0,
    cellarLow: cellar.low || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Pass fired ${pass.fired || 0} · Plate queued ${plate.queued || 0}`,
      `Bar queued ${bar.queued || 0} · Room service prep ${room.prep || 0}`,
      `Allergen active ${alg.active || 0} · Cellar low ${cellar.low || 0}`,
    ],
  };
}
