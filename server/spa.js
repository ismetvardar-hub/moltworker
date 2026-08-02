/**
 * AŞAMA 61 — Spa / Wellness.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('spa-bookings', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [
  {
    "id": "spa_1",
    "guestName": "Elena K.",
    "service": "Masaj 60dk",
    "at": "2026-08-01T14:00:00.000Z",
    "status": "booked",
    "venueId": "venue_olympos_beach"
  }
];
    writeCollection('spa-bookings', seed);
    return seed;
  }
  return list;
}

function openSpaFlags() {
  const flags = readCollection('spa-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addSpaFlag(candidate, actor = 'system') {
  const existing = readCollection('spa-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('spaf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('spa-flags', list.slice(0, 200));
  return flag;
}

function isAppointmentOverrun(row) {
  if (row.status === 'overrun') return true;
  if (row.status === 'done' || row.status === 'completed' || row.completedAt) return false;
  const due = Date.parse(row.dueAt || row.endsAt || row.endAt || '');
  return Number.isFinite(due) && due < Date.now();
}

export function listSpa(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createSpa(input, actor = 'system') {
  const row = {
    id: `spa_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    ...Object.fromEntries(Object.keys({"guestName":"Misafir","service":"Masaj 60dk"}).map((k) => {
      return [k, input[k] !== undefined ? input[k] : {"guestName":"Misafir","service":"Masaj 60dk"}[k]];
    })),
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  if (row.qty !== undefined) row.qty = Number(row.qty) || 0;
  if (row.minutes !== undefined) row.minutes = Number(row.minutes) || 0;
  if (row.score !== undefined) row.score = Number(row.score) || 0;
  if (row.planned !== undefined) row.planned = Number(row.planned) || 0;
  if (row.actual !== undefined) row.actual = Number(row.actual) || 0;
  if (row.balance !== undefined) row.balance = Number(row.balance) || 0;
  if (row.etaMin !== undefined) row.etaMin = Number(row.etaMin) || 0;
  if (row.minQty !== undefined) row.minQty = Number(row.minQty) || 0;
  if (row.partySize !== undefined) row.partySize = Number(row.partySize) || 0;
  if (row.costTry !== undefined) row.costTry = Number(row.costTry) || 0;
  if (row.seats !== undefined) row.seats = Number(row.seats) || 0;
  
  prependItem('spa-bookings', row, 300);
  appendAudit({ actor, action: 'spa.create', detail: String(row.title || row.guestName || row.name || row.code || row.area || row.item || row.label || row.sku || row.ticket || row.id), meta: { id: row.id } });
  return row;
}

export function updateSpa(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('spa-bookings', list);
  appendAudit({ actor, action: 'spa.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function spaSummary() {
  const list = listSpa();
  const overrun = list.filter(isAppointmentOverrun);
  const couplesPackages = list.filter((x) => x.couplesPackage === true || x.packageType === 'couples');
  const flags = openSpaFlags();
  return {
    title: 'LIKYA Spa Ops',
    total: list.length,
    booked: list.filter((x) => x.status === 'booked').length,
    done: list.filter((x) => x.status === 'done').length,
    cancelled: list.filter((x) => x.status === 'cancelled').length,
    overrun: overrun.length,
    couplesPackages: couplesPackages.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      booked: list.filter((x) => x.status === 'booked').length,
      done: list.filter((x) => x.status === 'done').length,
      cancelled: list.filter((x) => x.status === 'cancelled').length,
      overrun: overrun.length,
      couples_packages: couplesPackages.length,
    },
    summaryLines: [
      `Spa ${list.length} booking - booked ${list.filter((x) => x.status === 'booked').length} - overrun ${overrun.length}`,
      `Couples packages ${couplesPackages.length} - done ${list.filter((x) => x.status === 'done').length} - flag ${flags.length}`,
    ],
    bookings: list,
  };
}

export function runSpaSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = spaSummary();
  const created = [];
  const candidates = [];
  if (force || overview.overrun > 0) {
    candidates.push({
      key: 'spa_appointment_overrun',
      level: overview.overrun > 0 ? 'warn' : 'info',
      text: `Spa appointment overrun ${overview.overrun}`,
      domain: 'appointment',
    });
  }
  if (force || overview.booked > overview.done) {
    candidates.push({
      key: 'spa_treatment_flow',
      level: 'info',
      text: `Spa booked treatments ${overview.booked}`,
      domain: 'treatment',
    });
  }
  if (force || overview.couplesPackages > 0) {
    candidates.push({
      key: 'spa_couples_package',
      level: 'info',
      text: `Spa couples packages ${overview.couplesPackages}`,
      domain: 'package',
    });
  }
  for (const candidate of candidates) {
    const flag = addSpaFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `spa sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('spas'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('spa-sweeps', sweep, 80);
  appendAudit({ actor, action: 'spa.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: spaSummary() };
}

export function ackSpaFlag(input = {}, actor = 'system') {
  const list = readCollection('spa-flags', []) || [];
  if (!Array.isArray(list) || !list.length) return { ok: false, error: 'Flag yok - once sweep' };
  let idx = list.findIndex((f) => f.id === input.id && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.key === input.key && f.status === 'open');
  if (idx < 0) idx = list.findIndex((f) => f.status === 'open');
  if (idx < 0) return { ok: false, error: 'Acik flag yok' };
  list[idx] = {
    ...list[idx],
    status: 'acked',
    note: String(input.note || '').slice(0, 240) || undefined,
    acked_at: new Date().toISOString(),
    acked_by: actor,
  };
  writeCollection('spa-flags', list);
  appendAudit({ actor, action: 'spa.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: spaSummary() };
}

export function markSpaAppointmentOverrun(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.guestName && x.guestName === input.guestName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'booked' || x.status === 'in_service');
  if (idx < 0) return { ok: false, error: 'Overrun yapilacak spa randevu yok' };
  list[idx] = {
    ...list[idx],
    status: 'overrun',
    dueAt: input.dueAt || new Date(Date.now() - 10 * 60_000).toISOString(),
    overrunAt: input.overrunAt || new Date().toISOString(),
    overrunBy: actor,
    reason: input.reason || list[idx].reason || 'Spa appointment overrun',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('spa-bookings', list);
  appendAudit({ actor, action: 'spa.appointment_overrun', detail: list[idx].guestName || list[idx].service, meta: { id: list[idx].id } });
  return { ok: true, spa: list[idx], overview: spaSummary() };
}

export function completeSpaTreatment(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.guestName && x.guestName === input.guestName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'done');
  if (idx < 0) return { ok: false, error: 'Complete edilecek spa treatment yok' };
  list[idx] = {
    ...list[idx],
    status: 'done',
    completedAt: input.completedAt || new Date().toISOString(),
    completedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('spa-bookings', list);
  appendAudit({ actor, action: 'spa.treatment_complete', detail: list[idx].guestName || list[idx].service, meta: { id: list[idx].id } });
  return { ok: true, spa: list[idx], overview: spaSummary() };
}

export function seedCouplesPackage(input = {}, actor = 'system') {
  const spa = createSpa(
    {
      guestName: input.guestName || 'Couples package',
      service: input.service || 'Couples massage 90dk',
      status: input.status || 'booked',
    },
    actor,
  );
  const patched = updateSpa(
    spa.id,
    {
      couplesPackage: true,
      packageType: 'couples',
      package: input.package || 'Sunset couples package',
      dueAt: input.dueAt || new Date(Date.now() + 90 * 60_000).toISOString(),
      venueId: input.venueId || 'venue_olympos_beach',
    },
    actor,
  );
  appendAudit({ actor, action: 'spa.seed_couples_package', detail: spa.guestName, meta: { id: spa.id } });
  return { ok: true, spa: patched || spa, overview: spaSummary() };
}
