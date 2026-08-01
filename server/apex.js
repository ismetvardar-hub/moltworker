/**
 * AŞAMA 150 — Apex checkpoint (orbit + finans/uyum sinyalleri).
 */
import { buildOrbit } from './orbit.js';
import { invoicesSummary } from './invoices.js';
import { forecastSummary } from './forecast.js';
import { capexSummary } from './capex.js';
import { licensesSummary } from './licenses.js';
import { slabreachesSummary } from './slabreaches.js';
import { healthcardsSummary } from './healthcards.js';
import { overtimeSummary } from './overtime.js';

export function buildApex() {
  const orbit = buildOrbit();
  const inv = invoicesSummary();
  const fc = forecastSummary();
  const cx = capexSummary();
  const lic = licensesSummary();
  const sla = slabreachesSummary();
  const hc = healthcardsSummary();
  const ot = overtimeSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Apex',
    orbit: { summaryLines: (orbit.summaryLines || []).slice(0, 2) },
    invoicesOverdue: inv.overdue || 0,
    forecastLocked: fc.locked || 0,
    capexProposed: cx.proposed || 0,
    licensesExpiring: lic.expiring || 0,
    slaOpen: sla.open || 0,
    healthExpiring: hc.expiring || 0,
    overtimeOpen: ot.requested || 0,
    summaryLines: [
      ...(orbit.summaryLines || []).slice(0, 2),
      `Fatura gecikmiş ${inv.overdue || 0} · Forecast kilit ${fc.locked || 0}`,
      `CAPEX öneri ${cx.proposed || 0} · Ruhsat bitiyor ${lic.expiring || 0}`,
      `SLA açık ${sla.open || 0} · Sağlık kartı bitiyor ${hc.expiring || 0}`,
      `Mesai talep ${ot.requested || 0}`,
    ],
  };
}
