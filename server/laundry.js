/**
 * AŞAMA 66 — Çamaşırhane.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const HOUR_MS = 60 * 60_000;
const ACTIVE_STATUSES = new Set(['queued', 'washing', 'drying', 'pressing', 'rush']);

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('laundry-batches', null);
  if (!Array.isArray(list) || list.length === 0) {
    const now = new Date();
    const seed = [
      {
        id: 'lau_1',
        item: 'Şef önlüğü',
        qty: 12,
        status: 'washing',
        venueId: 'venue_kaleici',
        priority: 'normal',
        dueAt: new Date(now.getTime() + 12 * HOUR_MS).toISOString(),
        at: now.toISOString(),
      },
    ];
    writeCollection('laundry-batches', seed);
    return seed;
  }
  return list;
}

function isOverdue(batch) {
  if (!ACTIVE_STATUSES.has(batch.status)) return false;
  const dueAt = Date.parse(batch.dueAt || '');
  if (Number.isFinite(dueAt)) return dueAt < Date.now();
  const started = Date.parse(batch.at || batch.createdAt || '');
  const turnaroundHours = Number(batch.turnaroundHours || 24);
  return Number.isFinite(started) && started + turnaroundHours * HOUR_MS < Date.now();
}

function openLaundryFlags() {
  const flags = readCollection('laundry-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addLaundryFlag(candidate, actor = 'system') {
  const existing = readCollection('laundry-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('laf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('laundry-flags', list.slice(0, 200));
  return flag;
}

export function listLaundry(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createLaundry(input = {}, actor = 'system') {
  const turnaroundHours = Number(input.turnaroundHours ?? 24) || 24;
  const now = new Date();
  const row = {
    id: `lau_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    item: input.item !== undefined ? input.item : 'Peçete',
    qty: Number(input.qty ?? 20) || 0,
    venueId: input.venueId || 'venue_kaleici',
    status: input.status || 'washing',
    priority: input.priority || 'normal',
    turnaroundHours,
    dueAt: input.dueAt || new Date(now.getTime() + turnaroundHours * HOUR_MS).toISOString(),
    at: input.at || now.toISOString(),
    createdBy: actor,
  };
  prependItem('laundry-batches', row, 300);
  appendAudit({ actor, action: 'laundry.create', detail: String(row.item || row.id), meta: { id: row.id } });
  return row;
}

export function updateLaundry(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.qty !== undefined) next.qty = Number(next.qty) || 0;
  if (next.turnaroundHours !== undefined) next.turnaroundHours = Number(next.turnaroundHours) || 0;
  list[idx] = next;
  writeCollection('laundry-batches', list);
  appendAudit({ actor, action: 'laundry.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function laundrySummary() {
  const list = listLaundry();
  const overdue = list.filter(isOverdue);
  const flags = openLaundryFlags();
  return {
    title: 'LİKYA Çamaşırhane Ops',
    total: list.length,
    washing: list.filter((x) => x.status === 'washing').length,
    ready: list.filter((x) => x.status === 'ready').length,
    returned: list.filter((x) => x.status === 'returned').length,
    rush: list.filter((x) => x.priority === 'rush' || x.status === 'rush').length,
    overdueTurnaround: overdue.length,
    active: list.filter((x) => ACTIVE_STATUSES.has(x.status)).length,
    piecesInFlow: list.filter((x) => ACTIVE_STATUSES.has(x.status)).reduce((sum, x) => sum + Number(x.qty || 0), 0),
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      active: list.filter((x) => ACTIVE_STATUSES.has(x.status)).length,
      washing: list.filter((x) => x.status === 'washing').length,
      ready: list.filter((x) => x.status === 'ready').length,
      returned: list.filter((x) => x.status === 'returned').length,
      rush: list.filter((x) => x.priority === 'rush' || x.status === 'rush').length,
      overdue_turnaround: overdue.length,
      pieces_in_flow: list.filter((x) => ACTIVE_STATUSES.has(x.status)).reduce((sum, x) => sum + Number(x.qty || 0), 0),
    },
    summaryLines: [
      `Laundry ${list.length} parti · aktif ${list.filter((x) => ACTIVE_STATUSES.has(x.status)).length} · overdue ${overdue.length}`,
      `Rush ${list.filter((x) => x.priority === 'rush' || x.status === 'rush').length} · hazır ${list.filter((x) => x.status === 'ready').length} · flag ${flags.length}`,
    ],
    batches: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runLaundrySweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = laundrySummary();
  const created = [];
  const candidates = [];
  if (force || overview.overdueTurnaround > 0) {
    candidates.push({
      key: 'laundry_overdue_turnaround',
      level: overview.overdueTurnaround > 0 ? 'alert' : 'info',
      text: `Gecikmiş çamaşırhane turnaround ${overview.overdueTurnaround}`,
      domain: 'turnaround',
    });
  }
  if (force || overview.rush > 0) {
    candidates.push({
      key: 'laundry_rush_queue',
      level: overview.rush > 0 ? 'warn' : 'info',
      text: `Rush laundry parti ${overview.rush}`,
      domain: 'rush',
    });
  }
  if (force || overview.ready > 3) {
    candidates.push({
      key: 'laundry_ready_pickup',
      level: overview.ready > 3 ? 'warn' : 'info',
      text: `Teslim bekleyen hazır laundry ${overview.ready}`,
      domain: 'pickup',
    });
  }
  for (const candidate of candidates) {
    const flag = addLaundryFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'HEPHAESTUS',
        title: `laundry sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('las'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('laundry-sweeps', sweep, 80);
  appendAudit({ actor, action: 'laundry.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: laundrySummary() };
}

export function ackLaundryFlag(input = {}, actor = 'system') {
  const list = readCollection('laundry-flags', []) || [];
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
  writeCollection('laundry-flags', list);
  appendAudit({ actor, action: 'laundry.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: laundrySummary() };
}

export function markLaundryReady(input = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === input.id) >= 0
    ? list.findIndex((x) => x.id === input.id)
    : list.findIndex((x) => ACTIVE_STATUSES.has(x.status));
  if (idx < 0) return { ok: false, error: 'Hazıra alınacak parti yok' };
  list[idx] = {
    ...list[idx],
    status: 'ready',
    readyAt: input.readyAt || new Date().toISOString(),
    readyBy: actor,
    rack: input.rack || list[idx].rack || 'ops-rack',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('laundry-batches', list);
  appendAudit({ actor, action: 'laundry.ready', detail: list[idx].item || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, batch: list[idx], overview: laundrySummary() };
}

export function returnLaundryBatch(input = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === input.id) >= 0
    ? list.findIndex((x) => x.id === input.id)
    : list.findIndex((x) => x.status === 'ready');
  if (idx < 0) return { ok: false, error: 'İade edilecek hazır parti yok' };
  list[idx] = {
    ...list[idx],
    status: 'returned',
    returnedAt: input.returnedAt || new Date().toISOString(),
    returnedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('laundry-batches', list);
  appendAudit({ actor, action: 'laundry.return', detail: list[idx].item || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, batch: list[idx], overview: laundrySummary() };
}

export function seedRushLaundryOrder(input = {}, actor = 'system') {
  const overdue = input.overdue !== false;
  const batch = createLaundry(
    {
      item: input.item || 'Ops rush havlu',
      qty: Number(input.qty ?? 8),
      venueId: input.venueId || 'venue_kaleici',
      status: input.status || 'rush',
      priority: 'rush',
      turnaroundHours: Number(input.turnaroundHours ?? 2),
      dueAt: input.dueAt || new Date(Date.now() + (overdue ? -1 : 2) * HOUR_MS).toISOString(),
    },
    actor,
  );
  appendAudit({ actor, action: 'laundry.seed_rush', detail: batch.item, meta: { id: batch.id } });
  return { ok: true, batch, overview: laundrySummary() };
}
