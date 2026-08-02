/**
 * Wave 167 - Marina berth and slip ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('marina', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'mar_1',
      berth: "A-12",
      vessel: "Likya",
      status: 'free',
      dueAt: new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
      at: new Date().toISOString(),
    }];
    writeCollection('marina', seed);
    return seed;
  }
  return list;
}

function openMarinaFlags() {
  const flags = readCollection('marina-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addMarinaFlag(candidate, actor = 'system') {
  const existing = readCollection('marina-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('maf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('marina-flags', list.slice(0, 200));
  return flag;
}

function isBerthOverdue(row) {
  if (row.status === 'overdue') return true;
  if (row.status === 'free' || row.status === 'cleared') return false;
  const due = Date.parse(row.dueAt || row.departureDueAt || row.until || '');
  return Number.isFinite(due) && due < Date.now();
}

export function listMarina(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createMarina(input = {}, actor = 'system') {
  const row = {
    id: `mar_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    berth: input.berth !== undefined ? input.berth : "A-12",
    vessel: input.vessel !== undefined ? input.vessel : "Likya",
    captain: input.captain || null,
    eta: input.eta || input.arrivalAt || null,
    dueAt: input.dueAt || input.departureDueAt || null,
    feesDue: Number(input.feesDue ?? input.balanceDue ?? 0) || 0,
    status: input.status || 'free',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('marina', row, 300);
  appendAudit({
    actor,
    action: 'marina.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateMarina(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.feesDue !== undefined) next.feesDue = Number(next.feesDue) || 0;
  list[idx] = next;
  writeCollection('marina', list);
  appendAudit({ actor, action: 'marina.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function marinaSummary() {
  const list = listMarina();
  const overdue = list.filter(isBerthOverdue);
  const arrivals = list.filter((x) => x.status === 'arrival' || x.arrivalPending === true);
  const feesDue = list.filter((x) => Number(x.feesDue || 0) > 0).length;
  const flags = openMarinaFlags();
  return {
    title: 'LIKYA Marina Ops',
    total: list.length,
    free: list.filter((x) => x.status === 'free').length,
    occupied: list.filter((x) => x.status === 'occupied').length,
    hold: list.filter((x) => x.status === 'hold').length,
    overdue: overdue.length,
    arrivals: arrivals.length,
    feesDue,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      free: list.filter((x) => x.status === 'free').length,
      occupied: list.filter((x) => x.status === 'occupied').length,
      hold: list.filter((x) => x.status === 'hold').length,
      overdue: overdue.length,
      arrivals: arrivals.length,
      fees_due: feesDue,
    },
    summaryLines: [
      `Marina ${list.length} berth - occupied ${list.filter((x) => x.status === 'occupied').length} - overdue ${overdue.length}`,
      `Arrivals ${arrivals.length} - fees due ${feesDue} - flag ${flags.length}`,
    ],
    marina: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runMarinaSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = marinaSummary();
  const created = [];
  const candidates = [];
  if (force || overview.overdue > 0) {
    candidates.push({
      key: 'marina_berth_overdue',
      level: overview.overdue > 0 ? 'warn' : 'info',
      text: `Marina berth overdue ${overview.overdue}`,
      domain: 'berth',
    });
  }
  if (force || overview.arrivals > 0) {
    candidates.push({
      key: 'marina_arrival_queue',
      level: overview.arrivals > 0 ? 'info' : 'info',
      text: `Marina arrivals ${overview.arrivals}`,
      domain: 'arrival',
    });
  }
  if (force || overview.feesDue > 0) {
    candidates.push({
      key: 'marina_fees_due',
      level: overview.feesDue > 0 ? 'warn' : 'info',
      text: `Marina berths with fees due ${overview.feesDue}`,
      domain: 'billing',
    });
  }
  for (const candidate of candidates) {
    const flag = addMarinaFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `marina sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('mas'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('marina-sweeps', sweep, 80);
  appendAudit({ actor, action: 'marina.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: marinaSummary() };
}

export function ackMarinaFlag(input = {}, actor = 'system') {
  const list = readCollection('marina-flags', []) || [];
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
  writeCollection('marina-flags', list);
  appendAudit({ actor, action: 'marina.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: marinaSummary() };
}

export function markMarinaBerthOverdue(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.berth && x.berth === input.berth));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'occupied' || x.status === 'hold' || x.status === 'arrival');
  if (idx < 0) return { ok: false, error: 'Overdue yapilacak berth yok' };
  list[idx] = {
    ...list[idx],
    status: 'overdue',
    dueAt: input.dueAt || new Date(Date.now() - 60_000).toISOString(),
    feesDue: Number(input.feesDue ?? list[idx].feesDue ?? 250) || 250,
    overdueAt: input.overdueAt || new Date().toISOString(),
    overdueBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('marina', list);
  appendAudit({ actor, action: 'marina.berth_overdue', detail: list[idx].berth || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, marina: list[idx], overview: marinaSummary() };
}

export function clearMarinaSlip(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.berth && x.berth === input.berth));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'free');
  if (idx < 0) return { ok: false, error: 'Clear edilecek slip yok' };
  list[idx] = {
    ...list[idx],
    status: 'free',
    vessel: input.vessel || '',
    feesDue: 0,
    clearedAt: input.clearedAt || new Date().toISOString(),
    clearedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('marina', list);
  appendAudit({ actor, action: 'marina.clear_slip', detail: list[idx].berth || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, marina: list[idx], overview: marinaSummary() };
}

export function seedMarinaArrival(input = {}, actor = 'system') {
  const marina = createMarina(
    {
      berth: input.berth || `M-${randomBytes(1).toString('hex').toUpperCase()}`,
      vessel: input.vessel || 'Arrival yacht',
      captain: input.captain || 'Captain',
      status: input.status || 'arrival',
      eta: input.eta || new Date(Date.now() + 45 * 60_000).toISOString(),
      dueAt: input.dueAt || new Date(Date.now() + 24 * 60 * 60_000).toISOString(),
      feesDue: Number(input.feesDue ?? 0) || 0,
    },
    actor,
  );
  updateMarina(marina.id, { arrivalPending: true }, actor);
  appendAudit({ actor, action: 'marina.seed_arrival', detail: marina.vessel, meta: { id: marina.id } });
  return { ok: true, marina: { ...marina, arrivalPending: true }, overview: marinaSummary() };
}
