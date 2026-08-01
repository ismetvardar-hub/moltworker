/**
 * AŞAMA 285 — Ecosphere checkpoint (peoplehub + ESG/uyum sinyalleri).
 */
import { buildPeoplehub } from './peoplehub.js';
import { carbonlogSummary } from './carbonlog.js';
import { waterauditSummary } from './wateraudit.js';
import { airqualitySummary } from './airquality.js';
import { auditfindSummary } from './auditfind.js';
import { dataprotectSummary } from './dataprotect.js';
import { vendorriskSummary } from './vendorrisk.js';

export function buildEcosphere() {
  const people = buildPeoplehub();
  const carbon = carbonlogSummary();
  const water = waterauditSummary();
  const air = airqualitySummary();
  const findings = auditfindSummary();
  const dp = dataprotectSummary();
  const risk = vendorriskSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Ecosphere',
    peoplehub: { summaryLines: (people.summaryLines || []).slice(0, 2) },
    carbonLogged: carbon.total || 0,
    waterCritical: water.critical || 0,
    airPoor: air.poor || 0,
    findingsOpen: findings.open || 0,
    dataprotectOpen: dp.open || 0,
    vendorHigh: risk.high || 0,
    summaryLines: [
      ...(people.summaryLines || []).slice(0, 2),
      `Karbon kayıt ${carbon.total || 0} · Su kritik ${water.critical || 0}`,
      `Hava poor ${air.poor || 0} · Denetim açık ${findings.open || 0}`,
      `KVKK talep açık ${dp.open || 0} · Vendor high ${risk.high || 0}`,
    ],
  };
}
