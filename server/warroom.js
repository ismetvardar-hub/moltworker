/**
 * AŞAMA 105 — War Room checkpoint (boardpack + saha/uyum sinyalleri).
 */
import { buildBoardpack } from './boardpack.js';
import { flashSummary } from './flash.js';
import { haccpSummary } from './haccp.js';
import { patrolSummary } from './patrol.js';
import { fleetSummary } from './fleet.js';
import { folioSummary } from './folio.js';
import { conciergeSummary } from './concierge.js';
import { banquetSummary } from './banquet.js';

export function buildWarroom() {
  const pack = buildBoardpack();
  const flash = flashSummary();
  const haccp = haccpSummary();
  const patrol = patrolSummary();
  const fleet = fleetSummary();
  const folio = folioSummary();
  const concierge = conciergeSummary();
  const banquet = banquetSummary();
  const alerts = [];
  if ((haccp.fail || 0) > 0) alerts.push(`HACCP fail ${haccp.fail}`);
  if ((patrol.alert || 0) > 0) alerts.push(`Patrol alert ${patrol.alert}`);
  if ((fleet.service || 0) > 0) alerts.push(`Filo servis ${fleet.service}`);
  if ((concierge.open || 0) > 0) alerts.push(`Açık concierge ${concierge.open}`);
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA War Room',
    boardpack: {
      readiness: pack.readiness,
      summaryLines: pack.summaryLines,
    },
    flashTotal: flash.total,
    flashPublished: flash.published || 0,
    haccpFail: haccp.fail || 0,
    patrolAlert: patrol.alert || 0,
    fleetOnTrip: fleet.on_trip || 0,
    folioOpen: folio.open || 0,
    conciergeOpen: concierge.open || 0,
    banquetConfirmed: banquet.confirmed || 0,
    alerts,
    summaryLines: [
      ...(pack.summaryLines || []).slice(0, 3),
      `Flash satır ${flash.total} (yayın ${flash.published || 0})`,
      `Folio açık ${folio.open || 0}`,
      `Concierge açık ${concierge.open || 0}`,
      `HACCP fail ${haccp.fail || 0} · Patrol alert ${patrol.alert || 0}`,
      `Filo seferde ${fleet.on_trip || 0} · Banket onaylı ${banquet.confirmed || 0}`,
      ...alerts.slice(0, 3),
    ],
  };
}
