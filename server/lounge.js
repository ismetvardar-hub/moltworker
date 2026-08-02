/**
 * Wave 174 - Lounge capacity ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('lounge-log', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'lou_1',
      guestName: "Misafir",
      tier: "Altın",
      status: 'in',
      seats: 1,
      at: new Date().toISOString(),
    }];
    writeCollection('lounge-log', seed);
    return seed;
  }
  return list;
}

function openLoungeFlags() {
  const flags = readCollection('lounge-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addLoungeFlag(candidate, actor = 'system') {
  const existing = readCollection('lounge-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('lof'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('lounge-flags', list.slice(0, 200));
  return flag;
}

function isCapacityBreach(row) {
  return row.capacityBreach === true || row.status === 'capacity_breach';
}

export function listLounge(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createLounge(input = {}, actor = 'system') {
  const row = {
    id: rid('lou'),
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    tier: input.tier !== undefined ? input.tier : "Altın",
    seat: input.seat !== undefined ? input.seat : undefined,
    seats: input.seats !== undefined ? Number(input.seats) || 0 : 1,
    service: input.service !== undefined ? input.service : undefined,
    afternoonTea: input.afternoonTea === true || input.service === 'afternoon_tea' || undefined,
    status: input.status || 'in',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('lounge-log', row, 300);
  appendAudit({
    actor,
    action: 'lounge.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateLounge(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.seats !== undefined) next.seats = Number(next.seats) || 0;
  list[idx] = next;
  writeCollection('lounge-log', list);
  appendAudit({ actor, action: 'lounge.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function loungeSummary() {
  const list = listLounge();
  const capacityBreaches = list.filter(isCapacityBreach);
  const seated = list.filter((x) => x.status === 'seated' || x.seated === true);
  const afternoonTea = list.filter((x) => x.service === 'afternoon_tea' || x.afternoonTea === true);
  const flags = openLoungeFlags();
  return {
    title: 'LIKYA Lounge Ops',
    total: list.length,
    inCount: list.filter((x) => x.status === 'in').length,
    outCount: list.filter((x) => x.status === 'out').length,
    seated: seated.length,
    capacityBreaches: capacityBreaches.length,
    afternoonTea: afternoonTea.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      in: list.filter((x) => x.status === 'in').length,
      out: list.filter((x) => x.status === 'out').length,
      seated: seated.length,
      capacity_breaches: capacityBreaches.length,
      afternoon_tea: afternoonTea.length,
    },
    summaryLines: [
      `Lounge ${list.length} visit - capacity breach ${capacityBreaches.length} - seated ${seated.length}`,
      `In ${list.filter((x) => x.status === 'in').length} - afternoon tea ${afternoonTea.length} - flag ${flags.length}`,
    ],
    visits: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runLoungeSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = loungeSummary();
  const threshold = Number(input.threshold ?? input.capacity ?? 24) || 24;
  const created = [];
  const candidates = [];
  if (force || overview.capacityBreaches > 0 || overview.inCount >= threshold) {
    candidates.push({
      key: 'lounge_capacity_breach',
      level: overview.capacityBreaches > 0 || overview.inCount >= threshold ? 'warn' : 'info',
      text: `Lounge capacity breaches ${overview.capacityBreaches} - in ${overview.inCount}/${threshold}`,
      domain: 'capacity',
    });
  }
  if (force || overview.seated === 0) {
    candidates.push({
      key: 'lounge_seat_guest',
      level: 'info',
      text: `Lounge seated guests ${overview.seated}`,
      domain: 'seating',
    });
  }
  if (force || overview.afternoonTea === 0) {
    candidates.push({
      key: 'lounge_afternoon_tea_seed',
      level: 'info',
      text: `Lounge afternoon tea rows ${overview.afternoonTea}`,
      domain: 'tea',
    });
  }
  for (const candidate of candidates) {
    const flag = addLoungeFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `lounge sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('los'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('lounge-sweeps', sweep, 80);
  appendAudit({ actor, action: 'lounge.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: loungeSummary() };
}

export function ackLoungeFlag(input = {}, actor = 'system') {
  const list = readCollection('lounge-flags', []) || [];
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
  writeCollection('lounge-flags', list);
  appendAudit({ actor, action: 'lounge.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: loungeSummary() };
}

export function markLoungeCapacityBreach(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.guestName && x.guestName === input.guestName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => !isCapacityBreach(x));
  if (idx < 0) return { ok: false, error: 'Capacity breach yapilacak lounge visit yok' };
  list[idx] = {
    ...list[idx],
    status: 'capacity_breach',
    capacityBreach: true,
    capacityLimit: Number(input.capacityLimit ?? 24) || 24,
    breachCount: Number(input.breachCount ?? 28) || 28,
    breachedAt: input.breachedAt || new Date().toISOString(),
    breachedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('lounge-log', list);
  appendAudit({ actor, action: 'lounge.capacity_breach', detail: list[idx].guestName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, visit: list[idx], overview: loungeSummary() };
}

export function seatLoungeGuest(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.guestName && x.guestName === input.guestName));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'in' || isCapacityBreach(x));
  if (idx < 0) {
    const visit = createLounge({
      guestName: input.guestName || 'Wave 174 Guest',
      tier: input.tier || 'Gold',
      seat: input.seat || 'L-14',
      status: 'seated',
    }, actor);
    return { ok: true, visit, overview: loungeSummary() };
  }
  list[idx] = {
    ...list[idx],
    status: 'seated',
    seated: true,
    capacityBreach: false,
    seat: input.seat || list[idx].seat || 'L-14',
    seatedAt: input.seatedAt || new Date().toISOString(),
    seatedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('lounge-log', list);
  appendAudit({ actor, action: 'lounge.seat_guest', detail: list[idx].guestName || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, visit: list[idx], overview: loungeSummary() };
}

export function seedAfternoonTea(input = {}, actor = 'system') {
  const visit = createLounge(
    {
      guestName: input.guestName || 'Wave 174 Afternoon Tea',
      tier: input.tier || 'Platinum',
      service: 'afternoon_tea',
      afternoonTea: true,
      seat: input.seat || 'Tea-1',
      status: input.status || 'in',
    },
    actor,
  );
  appendAudit({ actor, action: 'lounge.seed_afternoon_tea', detail: visit.guestName, meta: { id: visit.id } });
  return { ok: true, visit, overview: loungeSummary() };
}
