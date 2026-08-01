/**
 * AŞAMA 645 — Empire checkpoint.
 */
import { buildAtlas } from './atlas.js';
import { tybridgeSummary } from './tybridge.js';
import { dolaplistSummary } from './dolaplist.js';
import { hephapickSummary } from './hephapick.js';
import { tourpackSummary } from './tourpack.js';
import { staybookSummary } from './staybook.js';
import { sportslotSummary } from './sportslot.js';

export function buildEmpire() {
  const prev = buildAtlas();
  const ty = tybridgeSummary();
  const dolap = dolaplistSummary();
  const heph = hephapickSummary();
  const tour = tourpackSummary();
  const stay = staybookSummary();
  const sport = sportslotSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Empire",
    atlas: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    tyError: ty.error || 0,
    dolapListed: dolap.listed || 0,
    hephQueued: heph.queued || 0,
    tourOpen: tour.open || 0,
    stayInhouse: stay.inhouse || 0,
    sportBooked: sport.booked || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Trendyol errors ${ty.error || 0} · Dolap listed ${dolap.listed || 0}`,
      `Hepha queued ${heph.queued || 0} · Tour packs open ${tour.open || 0}`,
      `Stay in-house ${stay.inhouse || 0} · Sport slots booked ${sport.booked || 0}`,
    ],
  };
}
