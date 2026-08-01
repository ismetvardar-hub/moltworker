/**
 * AŞAMA 375 — Keystone checkpoint.
 */
import { buildMirror } from './mirror.js';
import { incidentbusSummary } from './incidentbus.js';
import { slotrackSummary } from './slotrack.js';
import { errorbudgetSummary } from './errorbudget.js';
import { statuspageSummary } from './statuspage.js';
import { escalationSummary } from './escalation.js';
import { afteractionSummary } from './afteraction.js';

export function buildKeystone() {
  const prev = buildMirror();
  const bus = incidentbusSummary();
  const slo = slotrackSummary();
  const budget = errorbudgetSummary();
  const status = statuspageSummary();
  const esc = escalationSummary();
  const aa = afteractionSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Keystone",
    mirror: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    busDead: bus.dead || 0,
    sloBreached: slo.breached || 0,
    budgetExhausted: budget.exhausted || 0,
    statusOutage: status.outage || 0,
    escL3: esc.L3 || 0,
    actionsOpen: aa.open || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Incident bus dead ${bus.dead || 0} · SLO breached ${slo.breached || 0}`,
      `Error budget exhausted ${budget.exhausted || 0} · Status outage ${status.outage || 0}`,
      `Escalation L3 ${esc.L3 || 0} · After-action open ${aa.open || 0}`,
    ],
  };
}
