/**
 * AŞAMA 39 — Günlük operasyon brifi (özet derleme).
 */

import { reservationsSummary, listReservations, updateReservation } from './reservations.js';
import { inventorySummary, listInventory, adjustStock } from './inventory.js';
import { shiftsSummary, listShifts } from './shifts.js';
import { incidentsSummary, listIncidents, ackIncident, createIncident } from './incidents.js';
import { feedbackSummary } from './feedback.js';
import { tipSummary } from './tips.js';
import { maintenanceSummary, listMaintenance, updateTicket, createTicket } from './maintenance.js';
import { checklistsSummary } from './checklists.js';
import { lostFoundSummary } from './lostfound.js';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 6)}`;
}

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

  const flags = readCollection('brief-flags', []) || [];
  const flagList = Array.isArray(flags) ? flags : [];
  const openFlags = flagList.filter((f) => f.status === 'open');

  const headlines = [];
  if (inc.critical > 0) headlines.push(`${inc.critical} kritik açık olay`);
  if (lowItems.length) headlines.push(`${lowItems.length} SKU düşük stok`);
  if (res.pending > 0) headlines.push(`${res.pending} bekleyen rezervasyon`);
  if (mnt.open > 0) headlines.push(`${mnt.open} açık bakım ticket`);
  if (!headlines.length) headlines.push('Sakin sabah — ETHOS onaylar.');

  const summaryLines = [
    ...headlines.slice(0, 4),
    `Olay ${inc.open || 0} · stok düşük ${inv.lowStock || 0} · bakım ${mnt.open || 0}`,
    `Brief flag ${openFlags.length} açık`,
  ];

  return {
    date: today,
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Günlük Brief',
    headlines,
    summaryLines,
    flags: openFlags.slice(0, 30),
    summary: {
      flags_open: openFlags.length,
      incidents_open: inc.open || 0,
      incidents_critical: inc.critical || 0,
      low_stock: inv.lowStock || 0,
      maintenance_open: mnt.open || 0,
      reservations_pending: res.pending || 0,
    },
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

export function runBriefSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const o = buildDailyBrief();
  const existing = readCollection('brief-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  const created = [];
  const candidates = [];
  if (force || (o.summary?.incidents_critical || 0) > 0 || (o.summary?.incidents_open || 0) > 0) {
    candidates.push({
      key: 'incidents',
      level: (o.summary?.incidents_critical || 0) > 0 ? 'alert' : 'warn',
      text: `Açık olay ${o.summary?.incidents_open || 0} · kritik ${o.summary?.incidents_critical || 0}`,
      domain: 'incidents',
    });
  }
  if (force || (o.summary?.low_stock || 0) > 0) {
    candidates.push({
      key: 'inventory',
      level: 'warn',
      text: `Düşük stok SKU ${o.summary?.low_stock || 0}`,
      domain: 'inventory',
    });
  }
  if (force || (o.summary?.maintenance_open || 0) > 0 || (o.summary?.reservations_pending || 0) > 0) {
    candidates.push({
      key: 'ops',
      level: 'info',
      text: `Bakım ${o.summary?.maintenance_open || 0} · bekleyen rez ${o.summary?.reservations_pending || 0}`,
      domain: 'ops',
    });
  }
  if (force && !candidates.length) {
    candidates.push({ key: 'heartbeat', level: 'info', text: 'Brief heartbeat OK', domain: 'system' });
  }
  for (const c of candidates) {
    if (openKeys.has(c.key)) continue;
    const row = { id: rid('brf'), ...c, status: 'open', at: new Date().toISOString(), actor };
    list.unshift(row);
    created.push(row);
    openKeys.add(c.key);
  }
  writeCollection('brief-flags', list.slice(0, 200));
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'ETHOS',
        title: `brief sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('brs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('brief-sweeps', sweep, 80);
  appendAudit({ actor, action: 'brief.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: buildDailyBrief() };
}

export function ackBriefFlag(input = {}, actor = 'system') {
  const list = readCollection('brief-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok — önce sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Açık flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('brief-flags', list);
  appendAudit({ actor, action: 'brief.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: buildDailyBrief() };
}

export function ackBriefIncidents(input = {}, actor = 'system') {
  const open = listIncidents().filter(
    (i) => i.status === 'open' || i.severity === 'critical' || i.severity === 'error',
  );
  const acked = [];
  for (const row of open.slice(0, Number(input.limit) || 20)) {
    if (input.id && row.id !== input.id) continue;
    const next = ackIncident(row.id, 'acked', actor);
    if (next) acked.push(row.id);
  }
  if (!acked.length) {
    const seeded = createIncident(
      { title: 'brief-seed incident', severity: 'info', detail: 'brief ack seed' },
      actor,
    );
    const next = ackIncident(seeded.id, 'acked', actor);
    if (next) acked.push(seeded.id);
    else acked.push(seeded.id);
  }
  for (const r of listReservations().filter((x) => x.status === 'pending').slice(0, 5)) {
    updateReservation(r.id, { status: 'confirmed' }, actor);
  }
  appendAudit({ actor, action: 'brief.incidents_ack', detail: `${acked.length}`, meta: { n: acked.length } });
  return { ok: true, acked, overview: buildDailyBrief() };
}

export function restockBriefInventory(input = {}, actor = 'system') {
  const low = listInventory().filter((i) => i.low || i.qty <= i.minQty);
  const restocked = [];
  for (const item of low.slice(0, Number(input.limit) || 20)) {
    if (input.id && item.id !== input.id) continue;
    const need = Math.max(1, Number(item.minQty || 0) - Number(item.qty || 0) + 5);
    const next = adjustStock({ id: item.id, delta: need, reason: 'brief-restock' }, actor);
    if (next) restocked.push(item.id);
  }
  if (!restocked.length) {
    const any = listInventory()[0];
    if (any) {
      const next = adjustStock({ id: any.id, delta: 5, reason: 'brief-restock-seed' }, actor);
      if (next) restocked.push(any.id);
    }
  }
  appendAudit({ actor, action: 'brief.inventory_restock', detail: `${restocked.length}`, meta: { n: restocked.length } });
  return { ok: true, restocked, overview: buildDailyBrief() };
}

export function closeBriefMaintenance(input = {}, actor = 'system') {
  const open = listMaintenance().filter((t) => t.status !== 'done');
  const closed = [];
  for (const t of open.slice(0, Number(input.limit) || 20)) {
    if (input.id && t.id !== input.id) continue;
    const next = updateTicket(t.id, { status: 'done' }, actor);
    if (next) closed.push(next.id);
  }
  if (!closed.length) {
    const seeded = createTicket({ title: 'brief-seed maintenance', priority: 'low', note: 'brief close seed' }, actor);
    const next = updateTicket(seeded.id, { status: 'done' }, actor);
    if (next) closed.push(next.id);
    else closed.push(seeded.id);
  }
  appendAudit({ actor, action: 'brief.maintenance_close', detail: `${closed.length}`, meta: { n: closed.length } });
  return { ok: true, closed, overview: buildDailyBrief() };
}
