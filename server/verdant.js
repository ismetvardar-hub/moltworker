/**
 * AŞAMA 690 — Verdant checkpoint.
 */
import { buildStudio } from './studio.js';
import { carbonledgerSummary } from './carbonledger.js';
import { wateruseSummary } from './wateruse.js';
import { solaryieldSummary } from './solaryield.js';
import { esgauditSummary } from './esgaudit.js';
import { climategoalSummary } from './climategoal.js';
import { evchargerSummary } from './evcharger.js';

export function buildVerdant() {
  const prev = buildStudio();
  const carbon = carbonledgerSummary();
  const water = wateruseSummary();
  const solar = solaryieldSummary();
  const esg = esgauditSummary();
  const climate = climategoalSummary();
  const ev = evchargerSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Verdant",
    studio: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    carbonLogged: carbon.logged || 0,
    waterAlarm: water.alarm || 0,
    solarFault: solar.fault || 0,
    esgOpen: esg.open || 0,
    climateLag: climate.lag || 0,
    evFault: ev.fault || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Carbon logged ${carbon.logged || 0} · Water alarm ${water.alarm || 0}`,
      `Solar fault ${solar.fault || 0} · ESG open ${esg.open || 0}`,
      `Climate lag ${climate.lag || 0} · EV charger fault ${ev.fault || 0}`,
    ],
  };
}
