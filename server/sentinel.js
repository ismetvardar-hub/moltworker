/**
 * AŞAMA 210 — Sentinel checkpoint (skyline + güvenlik/sağlık sinyalleri).
 */
import { buildSkyline } from './skyline.js';
import { lostchildSummary } from './lostchild.js';
import { firstaidSummary } from './firstaid.js';
import { crowddensSummary } from './crowddens.js';
import { gatequeueSummary } from './gatequeue.js';
import { watchlistSummary } from './watchlist.js';
import { aedcheckSummary } from './aedcheck.js';

export function buildSentinel() {
  const sky = buildSkyline();
  const lost = lostchildSummary();
  const aid = firstaidSummary();
  const crowd = crowddensSummary();
  const gate = gatequeueSummary();
  const watch = watchlistSummary();
  const aed = aedcheckSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Sentinel',
    skyline: { summaryLines: (sky.summaryLines || []).slice(0, 2) },
    lostOpen: lost.open || 0,
    firstaidOpen: aid.open || 0,
    crowdHigh: crowd.high || 0,
    gateStop: gate.stop || 0,
    watchActive: watch.active || 0,
    aedMissing: aed.missing || 0,
    summaryLines: [
      ...(sky.summaryLines || []).slice(0, 2),
      `Kayıp çocuk açık ${lost.open || 0} · İlk yardım açık ${aid.open || 0}`,
      `Yoğunluk high ${crowd.high || 0} · Gate stop ${gate.stop || 0}`,
      `Watchlist aktif ${watch.active || 0} · AED missing ${aed.missing || 0}`,
    ],
  };
}
