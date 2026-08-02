/**
 * Wave 172 - Locker rental ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('lockers', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'loc_1',
      code: 'L-01',
      guestName: 'Misafir',
      status: 'free',
      at: new Date().toISOString(),
    }];
    writeCollection('lockers', seed);
    return seed;
  }
  return list;
}

function openLockersFlags() {
  const flags = readCollection('lockers-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addLockersFlag(candidate, actor = 'system') {
  const existing = readCollection('lockers-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('lkf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('lockers-flags', list.slice(0, 200));
  return flag;
}

function isOverdueRental(row) {
  if (row.overdueRental === true || row.status === 'overdue') return true;
  const dueAt = Date.parse(row.dueAt || row.expiresAt || '');
  return row.status === 'occupied' && Number.isFinite(dueAt) && dueAt < Date.now();
}

export function listLockers(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createLockers(input = {}, actor = 'system') {
  const row = {
    id: rid('loc'),
    code: input.code !== undefined ? input.code : 'L-01',
    guestName: input.guestName !== undefined ? input.guestName : 'Misafir',
    status: input.status || 'free',
    dueAt: input.dueAt || input.expiresAt || undefined,
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('lockers', row, 300);
  appendAudit({
    actor,
    action: 'lockers.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateLockers(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('lockers', list);
  appendAudit({ actor, action: 'lockers.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function lockersSummary() {
  const list = listLockers();
  const overdueRentals = list.filter(isOverdueRental);
  const dayPasses = list.filter((x) => x.dayPass === true || x.passType === 'day');
  const flags = openLockersFlags();
  return {
    title: 'LIKYA Lockers Ops',
    total: list.length,
    free: list.filter((x) => x.status === 'free').length,
    occupied: list.filter((x) => x.status === 'occupied').length,
    hold: list.filter((x) => x.status === 'hold').length,
    overdue: overdueRentals.length,
    dayPasses: dayPasses.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      free: list.filter((x) => x.status === 'free').length,
      occupied: list.filter((x) => x.status === 'occupied').length,
      hold: list.filter((x) => x.status === 'hold').length,
      overdue: overdueRentals.length,
      day_passes: dayPasses.length,
    },
    summaryLines: [
      `Lockers ${list.length} rental - overdue ${overdueRentals.length} - occupied ${list.filter((x) => x.status === 'occupied').length}`,
      `Day passes ${dayPasses.length} - free ${list.filter((x) => x.status === 'free').length} - flag ${flags.length}`,
    ],
    lockers: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runLockersSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = lockersSummary();
  const created = [];
  const candidates = [];
  if (force || overview.overdue > 0) {
    candidates.push({
      key: 'lockers_overdue_rental',
      level: overview.overdue > 0 ? 'warn' : 'info',
      text: `Locker overdue rentals ${overview.overdue}`,
      domain: 'rental',
    });
  }
  if (force || overview.free > 0) {
    candidates.push({
      key: 'lockers_release_flow',
      level: 'info',
      text: `Locker free slots ${overview.free}`,
      domain: 'release',
    });
  }
  if (force || overview.dayPasses > 0) {
    candidates.push({
      key: 'lockers_day_pass',
      level: 'info',
      text: `Locker day passes ${overview.dayPasses}`,
      domain: 'daypass',
    });
  }
  for (const candidate of candidates) {
    const flag = addLockersFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `lockers sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert' || f.level === 'warn') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('lks'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('lockers-sweeps', sweep, 80);
  appendAudit({ actor, action: 'lockers.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: lockersSummary() };
}

export function ackLockersFlag(input = {}, actor = 'system') {
  const list = readCollection('lockers-flags', []) || [];
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
  writeCollection('lockers-flags', list);
  appendAudit({ actor, action: 'lockers.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: lockersSummary() };
}

export function markLockersOverdueRental(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.code && x.code === input.code));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'occupied' || x.status === 'hold');
  if (idx < 0) return { ok: false, error: 'Overdue yapilacak locker yok' };
  list[idx] = {
    ...list[idx],
    status: 'overdue',
    overdueRental: true,
    dueAt: input.dueAt || new Date(Date.now() - 2 * 60 * 60_000).toISOString(),
    overdueAt: input.overdueAt || new Date().toISOString(),
    overdueBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('lockers', list);
  appendAudit({ actor, action: 'lockers.rental_overdue', detail: list[idx].code || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, locker: list[idx], overview: lockersSummary() };
}

export function releaseLocker(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.code && x.code === input.code));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'free');
  if (idx < 0) return { ok: false, error: 'Release edilecek locker yok' };
  list[idx] = {
    ...list[idx],
    status: 'free',
    guestName: input.keepGuest ? list[idx].guestName : '',
    overdueRental: false,
    dayPass: false,
    passType: undefined,
    releasedAt: input.releasedAt || new Date().toISOString(),
    releasedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('lockers', list);
  appendAudit({ actor, action: 'lockers.release', detail: list[idx].code || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, locker: list[idx], overview: lockersSummary() };
}

export function seedLockerDayPass(input = {}, actor = 'system') {
  const locker = createLockers(
    {
      code: input.code || `DP-${Math.floor(Math.random() * 90 + 10)}`,
      guestName: input.guestName || 'Day Pass Guest',
      status: input.status || 'occupied',
      dueAt: input.dueAt || new Date(Date.now() + 8 * 60 * 60_000).toISOString(),
    },
    actor,
  );
  const patched = updateLockers(
    locker.id,
    {
      dayPass: true,
      passType: 'day',
      source: 'wave172',
    },
    actor,
  );
  appendAudit({ actor, action: 'lockers.seed_day_pass', detail: patched?.code || locker.code, meta: { id: locker.id } });
  return { ok: true, locker: patched || locker, overview: lockersSummary() };
}
