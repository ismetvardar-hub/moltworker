/**
 * Wave 166 - Wake-up call ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const MINUTE_MS = 60_000;

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('wakeups', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'wup_1',
      room: '305',
      time: '06:30',
      status: 'scheduled',
      at: new Date().toISOString(),
    }];
    writeCollection('wakeups', seed);
    return seed;
  }
  return list;
}

function openWakeupsFlags() {
  const flags = readCollection('wakeups-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addWakeupsFlag(candidate, actor = 'system') {
  const existing = readCollection('wakeups-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('wuf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('wakeups-flags', list.slice(0, 200));
  return flag;
}

function isMissedWakeup(row) {
  if (row.status === 'missed') return true;
  if (row.status !== 'scheduled' && row.status !== 'vip') return false;
  const due = Date.parse(row.dueAt || row.scheduledAt || '');
  return Number.isFinite(due) && due + 10 * MINUTE_MS < Date.now();
}

export function listWakeups(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createWakeups(input = {}, actor = 'system') {
  const row = {
    id: `wup_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : '305',
    time: input.time !== undefined ? input.time : '06:30',
    guestName: input.guestName || null,
    vip: input.vip === true,
    dueAt: input.dueAt || input.scheduledAt || null,
    status: input.status || 'scheduled',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wakeups', row, 300);
  appendAudit({
    actor,
    action: 'wakeups.create',
    detail: String(row.guestName || row.room || row.time || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateWakeups(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('wakeups', list);
  appendAudit({ actor, action: 'wakeups.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function wakeupsSummary() {
  const list = listWakeups();
  const missedCalls = list.filter(isMissedWakeup);
  const vip = list.filter((x) => x.vip === true || x.status === 'vip');
  const flags = openWakeupsFlags();
  return {
    title: 'LIKYA Wake-up Ops',
    total: list.length,
    scheduled: list.filter((x) => x.status === 'scheduled').length,
    done: list.filter((x) => x.status === 'done').length,
    missed: missedCalls.length,
    vip: vip.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      scheduled: list.filter((x) => x.status === 'scheduled').length,
      done: list.filter((x) => x.status === 'done').length,
      missed: missedCalls.length,
      vip: vip.length,
    },
    summaryLines: [
      `Wakeups ${list.length} call - scheduled ${list.filter((x) => x.status === 'scheduled').length} - missed ${missedCalls.length}`,
      `VIP ${vip.length} - done ${list.filter((x) => x.status === 'done').length} - flag ${flags.length}`,
    ],
    wakeups: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runWakeupsSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = wakeupsSummary();
  const created = [];
  const candidates = [];
  if (force || overview.missed > 0) {
    candidates.push({
      key: 'wakeups_missed_call',
      level: overview.missed > 0 ? 'alert' : 'info',
      text: `Missed wake-up calls ${overview.missed}`,
      domain: 'missed',
    });
  }
  if (force || overview.vip > 0) {
    candidates.push({
      key: 'wakeups_vip_queue',
      level: overview.vip > 0 ? 'warn' : 'info',
      text: `VIP wake-up calls ${overview.vip}`,
      domain: 'vip',
    });
  }
  if (force || overview.scheduled > 0) {
    candidates.push({
      key: 'wakeups_scheduled_queue',
      level: overview.scheduled > 10 ? 'warn' : 'info',
      text: `Scheduled wake-up calls ${overview.scheduled}`,
      domain: 'schedule',
    });
  }
  for (const candidate of candidates) {
    const flag = addWakeupsFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `wakeups sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('wus'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('wakeups-sweeps', sweep, 80);
  appendAudit({ actor, action: 'wakeups.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: wakeupsSummary() };
}

export function ackWakeupsFlag(input = {}, actor = 'system') {
  const list = readCollection('wakeups-flags', []) || [];
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
  writeCollection('wakeups-flags', list);
  appendAudit({ actor, action: 'wakeups.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: wakeupsSummary() };
}

export function markWakeupMissed(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'scheduled' || x.status === 'vip');
  if (idx < 0) return { ok: false, error: 'Missed yapilacak wake-up yok' };
  list[idx] = {
    ...list[idx],
    status: 'missed',
    missedAt: input.missedAt || new Date().toISOString(),
    missedBy: actor,
    missReason: input.reason || input.missReason || 'No answer on wake-up call',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('wakeups', list);
  appendAudit({ actor, action: 'wakeups.missed', detail: list[idx].room || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, wakeup: list[idx], overview: wakeupsSummary() };
}

export function completeWakeupCall(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.room && x.room === input.room));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'done');
  if (idx < 0) return { ok: false, error: 'Complete edilecek wake-up yok' };
  list[idx] = {
    ...list[idx],
    status: 'done',
    completedAt: input.completedAt || new Date().toISOString(),
    completedBy: actor,
    completionNote: input.note || input.completionNote || 'Wake-up call completed',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('wakeups', list);
  appendAudit({ actor, action: 'wakeups.complete', detail: list[idx].room || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, wakeup: list[idx], overview: wakeupsSummary() };
}

export function seedVipWakeup(input = {}, actor = 'system') {
  const wakeup = createWakeups(
    {
      room: input.room || '501',
      time: input.time || '05:45',
      guestName: input.guestName || 'VIP guest',
      vip: true,
      status: input.status || 'vip',
      dueAt: input.dueAt || new Date(Date.now() - 15 * MINUTE_MS).toISOString(),
    },
    actor,
  );
  appendAudit({ actor, action: 'wakeups.seed_vip_wake', detail: wakeup.room, meta: { id: wakeup.id } });
  return { ok: true, wakeup, overview: wakeupsSummary() };
}
