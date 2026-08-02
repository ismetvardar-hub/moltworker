/**
 * AŞAMA 65 — Temizlik Görevleri.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const HOUR_MS = 60 * 60_000;
const ACTIVE_STATUSES = new Set(['open', 'assigned', 'in_progress', 'inspection_failed']);

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('cleaning-tasks', null);
  if (!Array.isArray(list) || list.length === 0) {
    const now = new Date();
    const seed = [
      {
        id: 'cln_1',
        area: 'VIP tuvalet',
        room: '101',
        venueId: 'venue_olympos_beach',
        status: 'open',
        priority: 'high',
        dueAt: new Date(now.getTime() + 2 * HOUR_MS).toISOString(),
        at: now.toISOString(),
      },
    ];
    writeCollection('cleaning-tasks', seed);
    return seed;
  }
  return list;
}

function isOverdue(task) {
  if (!ACTIVE_STATUSES.has(task.status)) return false;
  const dueAt = Date.parse(task.dueAt || '');
  if (Number.isFinite(dueAt)) return dueAt < Date.now();
  const started = Date.parse(task.at || task.createdAt || '');
  const slaHours = Number(task.slaHours || 4);
  return Number.isFinite(started) && started + slaHours * HOUR_MS < Date.now();
}

function openCleaningFlags() {
  const flags = readCollection('cleaning-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addCleaningFlag(candidate, actor = 'system') {
  const existing = readCollection('cleaning-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('clf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('cleaning-flags', list.slice(0, 200));
  return flag;
}

export function listCleaning(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createCleaning(input = {}, actor = 'system') {
  const slaHours = Number(input.slaHours ?? 4) || 4;
  const now = new Date();
  const row = {
    id: `cle_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    ...Object.fromEntries(Object.keys({"area":"Salon","priority":"normal"}).map((k) => {
      return [k, input[k] !== undefined ? input[k] : {"area":"Salon","priority":"normal"}[k]];
    })),
    room: input.room || null,
    venueId: input.venueId || 'venue_olympos_beach',
    status: input.status || 'open',
    inspectionStatus: input.inspectionStatus || null,
    attendant: input.attendant || null,
    slaHours,
    dueAt: input.dueAt || new Date(now.getTime() + slaHours * HOUR_MS).toISOString(),
    at: input.at || now.toISOString(),
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
  
  prependItem('cleaning-tasks', row, 300);
  appendAudit({ actor, action: 'cleaning.create', detail: String(row.title || row.guestName || row.name || row.code || row.area || row.item || row.label || row.sku || row.ticket || row.id), meta: { id: row.id } });
  return row;
}

export function updateCleaning(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.slaHours !== undefined) next.slaHours = Number(next.slaHours) || 0;
  list[idx] = next;
  writeCollection('cleaning-tasks', list);
  appendAudit({ actor, action: 'cleaning.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function cleaningSummary() {
  const list = listCleaning();
  const overdue = list.filter(isOverdue);
  const inspectionFailed = list.filter((x) => x.status === 'inspection_failed' || x.inspectionStatus === 'failed');
  const flags = openCleaningFlags();
  return {
    title: 'LİKYA Temizlik Ops',
    total: list.length,
    open: list.filter((x) => x.status === 'open').length,
    done: list.filter((x) => x.status === 'done').length,
    clean: list.filter((x) => x.status === 'clean').length,
    overdueRooms: overdue.length,
    inspectionFailed: inspectionFailed.length,
    active: list.filter((x) => ACTIVE_STATUSES.has(x.status)).length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      open: list.filter((x) => x.status === 'open').length,
      clean: list.filter((x) => x.status === 'clean').length,
      done: list.filter((x) => x.status === 'done').length,
      overdue_rooms: overdue.length,
      inspection_failed: inspectionFailed.length,
      active: list.filter((x) => ACTIVE_STATUSES.has(x.status)).length,
    },
    summaryLines: [
      `Temizlik ${list.length} görev · aktif ${list.filter((x) => ACTIVE_STATUSES.has(x.status)).length} · overdue ${overdue.length}`,
      `Clean ${list.filter((x) => x.status === 'clean').length} · inspection fail ${inspectionFailed.length} · flag ${flags.length}`,
    ],
    tasks: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runCleaningSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = cleaningSummary();
  const created = [];
  const candidates = [];
  if (force || overview.overdueRooms > 0) {
    candidates.push({
      key: 'cleaning_overdue_rooms',
      level: overview.overdueRooms > 0 ? 'alert' : 'info',
      text: `Gecikmiş temizlik odası ${overview.overdueRooms}`,
      domain: 'rooms',
    });
  }
  if (force || overview.inspectionFailed > 0) {
    candidates.push({
      key: 'cleaning_inspection_failed',
      level: overview.inspectionFailed > 0 ? 'warn' : 'info',
      text: `Inspection fail temizlik ${overview.inspectionFailed}`,
      domain: 'inspection',
    });
  }
  if (force || overview.open > 5) {
    candidates.push({
      key: 'cleaning_open_queue',
      level: overview.open > 5 ? 'warn' : 'info',
      text: `Açık temizlik kuyruğu ${overview.open}`,
      domain: 'queue',
    });
  }
  for (const candidate of candidates) {
    const flag = addCleaningFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'HEPHAESTUS',
        title: `cleaning sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('cls'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('cleaning-sweeps', sweep, 80);
  appendAudit({ actor, action: 'cleaning.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: cleaningSummary() };
}

export function ackCleaningFlag(input = {}, actor = 'system') {
  const list = readCollection('cleaning-flags', []) || [];
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
  writeCollection('cleaning-flags', list);
  appendAudit({ actor, action: 'cleaning.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: cleaningSummary() };
}

export function markCleaningClean(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => ACTIVE_STATUSES.has(x.status));
  if (idx < 0) return { ok: false, error: 'Temizlenecek oda yok' };
  list[idx] = {
    ...list[idx],
    status: input.status || 'clean',
    inspectionStatus: input.inspectionStatus || 'passed',
    cleanedAt: input.cleanedAt || new Date().toISOString(),
    cleanedBy: actor,
    attendant: input.attendant || list[idx].attendant || 'Ops HK',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('cleaning-tasks', list);
  appendAudit({ actor, action: 'cleaning.clean', detail: list[idx].room || list[idx].area || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, task: list[idx], overview: cleaningSummary() };
}

export function failCleaningInspection(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'clean' || x.status === 'done' || x.status === 'open');
  if (idx < 0) return { ok: false, error: 'Inspection fail yazılacak oda yok' };
  list[idx] = {
    ...list[idx],
    status: 'inspection_failed',
    inspectionStatus: 'failed',
    failReason: input.reason || input.failReason || list[idx].failReason || 'Ops inspection fail',
    failedAt: input.failedAt || new Date().toISOString(),
    failedBy: actor,
    dueAt: input.dueAt || new Date(Date.now() - HOUR_MS).toISOString(),
    updatedAt: new Date().toISOString(),
  };
  writeCollection('cleaning-tasks', list);
  appendAudit({ actor, action: 'cleaning.inspection_fail', detail: list[idx].room || list[idx].area || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, task: list[idx], overview: cleaningSummary() };
}

export function seedCleaningInspectionFail(input = {}, actor = 'system') {
  const task = createCleaning(
    {
      area: input.area || 'Ops oda inspection',
      room: input.room || '209',
      priority: input.priority || 'high',
      status: 'inspection_failed',
      inspectionStatus: 'failed',
      failReason: input.reason || 'Mirror streak',
      slaHours: Number(input.slaHours ?? 1),
      dueAt: input.dueAt || new Date(Date.now() - HOUR_MS).toISOString(),
      venueId: input.venueId || 'venue_olympos_beach',
    },
    actor,
  );
  appendAudit({ actor, action: 'cleaning.seed_inspection_fail', detail: task.room || task.area, meta: { id: task.id } });
  return { ok: true, task, overview: cleaningSummary() };
}
