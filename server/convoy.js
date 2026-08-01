/**
 * AŞAMA 600 — Convoy checkpoint.
 */
import { buildVault } from './vault.js';
import { dispatchboardSummary } from './dispatchboard.js';
import { fleetdeskSummary } from './fleetdesk.js';
import { gpspingSummary } from './gpsping.js';
import { valetopsSummary } from './valetops.js';
import { transferjobSummary } from './transferjob.js';
import { parkingbaySummary } from './parkingbay.js';

export function buildConvoy() {
  const prev = buildVault();
  const disp = dispatchboardSummary();
  const fleet = fleetdeskSummary();
  const gps = gpspingSummary();
  const valet = valetopsSummary();
  const xfer = transferjobSummary();
  const park = parkingbaySummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Convoy",
    vault: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    dispQueued: disp.queued || 0,
    fleetService: fleet.service || 0,
    gpsOffline: gps.offline || 0,
    valetReq: valet.requested || 0,
    xferBooked: xfer.booked || 0,
    parkOcc: park.occupied || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Dispatch queued ${disp.queued || 0} · Fleet service ${fleet.service || 0}`,
      `GPS offline ${gps.offline || 0} · Valet requested ${valet.requested || 0}`,
      `Transfers booked ${xfer.booked || 0} · Parking occupied ${park.occupied || 0}`,
    ],
  };
}
