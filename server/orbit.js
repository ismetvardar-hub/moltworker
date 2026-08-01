/**
 * AŞAMA 135 — Orbit checkpoint (nightly + oda/erişim saha sinyalleri).
 */
import { buildNightly } from './nightly.js';
import { roomstatusSummary } from './roomstatus.js';
import { keycardsSummary } from './keycards.js';
import { parcelsSummary } from './parcels.js';
import { wakeupsSummary } from './wakeups.js';
import { qrcheckinSummary } from './qrcheckin.js';
import { guestappSummary } from './guestapp.js';

export function buildOrbit() {
  const nightly = buildNightly();
  const rooms = roomstatusSummary();
  const keys = keycardsSummary();
  const parcels = parcelsSummary();
  const wake = wakeupsSummary();
  const qr = qrcheckinSummary();
  const app = guestappSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Orbit',
    nightly: { summaryLines: (nightly.summaryLines || []).slice(0, 3) },
    dirtyRooms: rooms.dirty || 0,
    oooRooms: rooms.ooo || 0,
    keyQueued: keys.queued || 0,
    parcelsHeld: parcels.held || 0,
    wakeScheduled: wake.scheduled || 0,
    qrPending: qr.pending || 0,
    appFailed: app.failed || 0,
    summaryLines: [
      ...(nightly.summaryLines || []).slice(0, 2),
      `Kirli oda ${rooms.dirty || 0} · OOO ${rooms.ooo || 0}`,
      `Kart kuyruk ${keys.queued || 0} · Emanet ${parcels.held || 0}`,
      `Wake-up ${wake.scheduled || 0} · QR bekleyen ${qr.pending || 0}`,
      `App push fail ${app.failed || 0}`,
    ],
  };
}
