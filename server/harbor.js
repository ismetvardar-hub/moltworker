/**
 * AŞAMA 435 — Harbor checkpoint.
 */
import { buildTide } from './tide.js';
import { harborlaneSummary } from './harborlane.js';
import { dockslotSummary } from './dockslot.js';
import { coldbaySummary } from './coldbay.js';
import { boltholdSummary } from './bolthold.js';
import { demurrageSummary } from './demurrage.js';
import { craneopsSummary } from './craneops.js';

export function buildHarbor() {
  const prev = buildTide();
  const lane = harborlaneSummary();
  const dock = dockslotSummary();
  const cold = coldbaySummary();
  const hold = boltholdSummary();
  const dem = demurrageSummary();
  const crane = craneopsSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Harbor",
    tide: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    laneCongested: lane.congested || 0,
    dockOcc: dock.occupied || 0,
    coldAlarm: cold.alarm || 0,
    holds: hold.hold || 0,
    demAccruing: dem.accruing || 0,
    craneService: crane.service || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Harbor lane congested ${lane.congested || 0} · Dock occupied ${dock.occupied || 0}`,
      `Cold bay alarm ${cold.alarm || 0} · Bolt holds ${hold.hold || 0}`,
      `Demurrage accruing ${dem.accruing || 0} · Crane service ${crane.service || 0}`,
    ],
  };
}
