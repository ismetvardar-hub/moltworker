/**
 * AŞAMA 60 — Operasyon hazırlık skoru (checkpoint panosu).
 */
import { inventorySummary } from './inventory.js';
import { incidentsSummary, listIncidents } from './incidents.js';
import { shiftsSummary } from './shifts.js';
import { checklistsSummary } from './checklists.js';
import { coldchainSummary } from './coldchain.js';
import { maintenanceSummary } from './maintenance.js';
import { complaintsSummary } from './complaints.js';
import { seatingSummary } from './seating.js';
import { waitlistSummary } from './waitlist.js';
import { wasteSummary } from './waste.js';

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function buildReadiness() {
  const inv = inventorySummary();
  const inc = incidentsSummary();
  const sh = shiftsSummary();
  const chk = checklistsSummary();
  const cc = coldchainSummary();
  const mnt = maintenanceSummary();
  const cmp = complaintsSummary();
  const seat = seatingSummary();
  const wl = waitlistSummary();
  const wst = wasteSummary();

  const openCritical = listIncidents().filter(
    (i) => i.status === 'open' && (i.severity === 'critical' || i.severity === 'error'),
  ).length;

  const dimensions = [
    {
      id: 'stock',
      label: 'Stok',
      score: clamp(100 - (inv.lowStock || 0) * 12),
      detail: `${inv.lowStock || 0} düşük SKU`,
    },
    {
      id: 'incidents',
      label: 'Olaylar',
      score: clamp(100 - (inc.open || 0) * 8 - openCritical * 15),
      detail: `${inc.open} açık · ${openCritical} kritik`,
    },
    {
      id: 'crew',
      label: 'Vardiya',
      score: clamp(sh.todayCount > 0 ? 70 + Math.min(30, sh.todayCount * 5) : 40),
      detail: `Bugün ${sh.todayCount} vardiya`,
    },
    {
      id: 'checklists',
      label: 'Checklist',
      score: clamp(80 + (chk.completedToday || 0) * 5 - (chk.openRuns || 0) * 10),
      detail: `${chk.openRuns} açık run`,
    },
    {
      id: 'coldchain',
      label: 'Soğuk zincir',
      score: clamp(100 - (cc.recentAlerts || 0) * 20),
      detail: `${cc.recentAlerts || 0} alarm`,
    },
    {
      id: 'maintenance',
      label: 'Bakım',
      score: clamp(100 - (mnt.open || 0) * 10 - (mnt.critical || 0) * 15),
      detail: `${mnt.open} açık ticket`,
    },
    {
      id: 'guest',
      label: 'Misafir',
      score: clamp(100 - (cmp.open || 0) * 12 - Math.min(20, wl.waiting || 0) * 2),
      detail: `${cmp.open} şikayet · ${wl.waiting} bekleyen`,
    },
    {
      id: 'floor',
      label: 'Salon',
      score: clamp(
        seat.total
          ? ((seat.free + seat.reserved * 0.5) / seat.total) * 100
          : 70,
      ),
      detail: `${seat.free} boş / ${seat.total} masa`,
    },
  ];

  const overall = clamp(
    dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length,
  );

  let grade = 'C';
  if (overall >= 90) grade = 'A';
  else if (overall >= 75) grade = 'B';
  else if (overall >= 60) grade = 'C';
  else grade = 'D';

  return {
    overall,
    grade,
    generatedAt: new Date().toISOString(),
    dimensions,
    signals: {
      lowStock: inv.lowStock,
      openIncidents: inc.open,
      coldAlerts: cc.recentAlerts,
      openComplaints: cmp.open,
      todayWasteCost: wst.todayCost,
      waitingGuests: wl.waiting,
    },
  };
}
