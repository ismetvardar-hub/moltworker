/**
 * AŞAMA 120 — Night Audit checkpoint (warroom + gece kapanış sinyalleri).
 */
import { buildWarroom } from './warroom.js';
import { nightlogSummary } from './nightlog.js';
import { flashSummary } from './flash.js';
import { folioSummary } from './folio.js';
import { lateoutSummary } from './lateout.js';
import { cashSummary } from './cash.js';
import { upsellSummary } from './upsell.js';
import { groupsSummary } from './groups.js';

export function buildNightly() {
  const war = buildWarroom();
  const night = nightlogSummary();
  const flash = flashSummary();
  const folio = folioSummary();
  const late = lateoutSummary();
  const cash = cashSummary();
  const upsell = upsellSummary();
  const groups = groupsSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Night Audit',
    warroom: { readiness: war.boardpack?.readiness, alerts: war.alerts },
    nightOpen: night.open || 0,
    nightClosed: night.closed || 0,
    flashPublished: flash.published || 0,
    folioOpen: folio.open || 0,
    lateRequested: late.requested || 0,
    cashBalance: cash.balance ?? cash.total ?? null,
    upsellAccepted: upsell.accepted || 0,
    groupsConfirmed: groups.confirmed || 0,
    summaryLines: [
      ...(war.summaryLines || []).slice(0, 2),
      `Gece log açık ${night.open || 0} / kapalı ${night.closed || 0}`,
      `Flash yayın ${flash.published || 0} · Folio açık ${folio.open || 0}`,
      `Late checkout talep ${late.requested || 0}`,
      `Upsell kabul ${upsell.accepted || 0} · Grup onay ${groups.confirmed || 0}`,
      cash.balance !== undefined ? `Kasa bakiye ${cash.balance}` : `Kasa satır ${cash.total || 0}`,
    ],
  };
}
