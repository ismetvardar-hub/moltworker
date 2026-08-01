/**
 * AŞAMA 39 — Günlük operasyon brifi (özet derleme).
 */

import { reservationsSummary, listReservations } from './reservations.js';
import { inventorySummary } from './inventory.js';
import { shiftsSummary, listShifts } from './shifts.js';
import { incidentsSummary, listIncidents } from './incidents.js';
import { feedbackSummary } from './feedback.js';
import { tipSummary } from './tips.js';
import { maintenanceSummary, listMaintenance } from './maintenance.js';
import { checklistsSummary } from './checklists.js';
import { lostFoundSummary } from './lostfound.js';

export function buildDailyBrief() {
  const today = new Date().toISOString().slice(0, 10);
  const res = reservationsSummary();
  const inv = inventorySummary();
  const sh = shiftsSummary();
  const inc = incidentsSummary();
  const fb = feedbackSummary();
  const tips = tipSummary();
  const mnt = maintenanceSummary();
  const chk = checklistsSummary();
  const lf = lostFoundSummary();

  const lowItems = (inv.items || []).filter((i) => i.low).slice(0, 5);
  const openIncidents = listIncidents()
    .filter((i) => i.status === 'open')
    .slice(0, 5);
  const todayRes = listReservations({ date: today }).slice(0, 8);
  const todayShifts = listShifts({ date: today });
  const openMaint = listMaintenance().filter((t) => t.status !== 'done').slice(0, 5);

  const headlines = [];
  if (inc.critical > 0) headlines.push(`${inc.critical} kritik açık olay`);
  if (lowItems.length) headlines.push(`${lowItems.length} SKU düşük stok`);
  if (res.pending > 0) headlines.push(`${res.pending} bekleyen rezervasyon`);
  if (mnt.open > 0) headlines.push(`${mnt.open} açık bakım ticket`);
  if (!headlines.length) headlines.push('Sakin sabah — ETHOS onaylar.');

  return {
    date: today,
    generatedAt: new Date().toISOString(),
    headlines,
    reservations: { ...res, sample: todayRes },
    shifts: { ...sh, today: todayShifts },
    inventory: { lowStock: inv.lowStock, lowItems },
    incidents: { ...inc, sample: openIncidents },
    feedback: fb,
    tips: { balance: tips.balance, todayIn: tips.todayIn, todayOut: tips.todayOut },
    maintenance: { ...mnt, sample: openMaint },
    checklists: chk,
    lostFound: lf,
  };
}
