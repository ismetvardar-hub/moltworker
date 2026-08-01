/**
 * AŞAMA 660 — Bazaar checkpoint.
 */
import { buildEmpire } from './empire.js';
import { retailfloorSummary } from './retailfloor.js';
import { planogramSummary } from './planogram.js';
import { shrinklogSummary } from './shrinklog.js';
import { stockhealthSummary } from './stockhealth.js';
import { darkstoreSummary } from './darkstore.js';
import { promoplaneSummary } from './promoplane.js';

export function buildBazaar() {
  const prev = buildEmpire();
  const floor = retailfloorSummary();
  const plano = planogramSummary();
  const shrink = shrinklogSummary();
  const stock = stockhealthSummary();
  const dark = darkstoreSummary();
  const promo = promoplaneSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Bazaar",
    empire: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    floorBusy: floor.busy || 0,
    planoGap: plano.gap || 0,
    shrinkLogged: shrink.logged || 0,
    stockRed: stock.red || 0,
    darkPicking: dark.picking || 0,
    promoLive: promo.live || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Retail floor busy ${floor.busy || 0} · Planogram gaps ${plano.gap || 0}`,
      `Shrink logged ${shrink.logged || 0} · Stock health red ${stock.red || 0}`,
      `Dark store picking ${dark.picking || 0} · Promos live ${promo.live || 0}`,
    ],
  };
}
