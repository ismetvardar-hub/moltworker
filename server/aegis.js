/**
 * AŞAMA 525 — Aegis checkpoint.
 */
import { buildForge } from './forge.js';
import { safetylogSummary } from './safetylog.js';
import { incidentlogSummary } from './incidentlog.js';
import { evacrouteSummary } from './evacroute.js';
import { lockouttagSummary } from './lockouttag.js';
import { compliancerowSummary } from './compliancerow.js';
import { hazmatbaySummary } from './hazmatbay.js';

export function buildAegis() {
  const prev = buildForge();
  const safe = safetylogSummary();
  const inc = incidentlogSummary();
  const evac = evacrouteSummary();
  const loto = lockouttagSummary();
  const cmp = compliancerowSummary();
  const haz = hazmatbaySummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Aegis",
    forge: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    safetyOpen: safe.open || 0,
    incInvestigating: inc.investigating || 0,
    evacBlocked: evac.blocked || 0,
    lotoApplied: loto.applied || 0,
    cmpGap: cmp.gap || 0,
    hazSpill: haz.spill || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Safety open ${safe.open || 0} · Incidents investigating ${inc.investigating || 0}`,
      `Evac blocked ${evac.blocked || 0} · LOTO applied ${loto.applied || 0}`,
      `Compliance gaps ${cmp.gap || 0} · Hazmat spill ${haz.spill || 0}`,
    ],
  };
}
