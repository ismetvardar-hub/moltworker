/**
 * AŞAMA 330 — Vanguard (Nexus Prime) checkpoint.
 * Cognisphere + omni-kanal / otonom ticaret sinyalleri.
 */
import { buildCognisphere } from './cognisphere.js';
import { posbridgeSummary } from './posbridge.js';
import { dynamintSummary } from './dynamint.js';
import { couriertrackSummary } from './couriertrack.js';
import { autocheckoutSummary } from './autocheckout.js';
import { loyaltyburnSummary } from './loyaltyburn.js';
import { lastmileSummary } from './lastmile.js';
import { invsyncSummary } from './invsync.js';
import { qrpaySummary } from './qrpay.js';

export function buildVanguard() {
  const cog = buildCognisphere();
  const pos = posbridgeSummary();
  const mint = dynamintSummary();
  const courier = couriertrackSummary();
  const checkout = autocheckoutSummary();
  const burn = loyaltyburnSummary();
  const mile = lastmileSummary();
  const sync = invsyncSummary();
  const qr = qrpaySummary();
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Vanguard · Nexus Prime',
    subtitle: 'Omni-Channel Operations & Autonomous Commerce',
    cognisphere: { summaryLines: (cog.summaryLines || []).slice(0, 2) },
    posOnline: pos.online || 0,
    posOffline: pos.offline || 0,
    mintQueued: mint.queued || 0,
    mintPushed: mint.pushed || 0,
    courierEnroute: courier.enroute || 0,
    checkoutOpen: checkout.open || 0,
    loyaltyPending: burn.pending || 0,
    lastmileQueued: mile.queued || 0,
    invDrift: sync.drift || 0,
    qrPending: qr.pending || 0,
    summaryLines: [
      ...(cog.summaryLines || []).slice(0, 2),
      `POS online ${pos.online || 0} / offline ${pos.offline || 0}`,
      `MINT push kuyruk ${mint.queued || 0} · yayında ${mint.pushed || 0}`,
      `Kurye enroute ${courier.enroute || 0} · Last-mile kuyruk ${mile.queued || 0}`,
      `Otonom checkout açık ${checkout.open || 0} · QR pay bekleyen ${qr.pending || 0}`,
      `Sadakat burn pending ${burn.pending || 0} · Stok drift ${sync.drift || 0}`,
    ],
  };
}
