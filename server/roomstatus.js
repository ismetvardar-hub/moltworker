/**
 * AŞAMA 122 — Oda Durumu.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

const HOUR_MS = 60 * 60_000;
const AGING_STATUSES = new Set(['dirty', 'ooo', 'blocked']);

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('roomstatus', null);
  if (!Array.isArray(list) || list.length === 0) {
    const now = new Date();
    const seed = [{
      id: 'rms_1',
      room: "101",
      hk: "Clean",
      status: 'dirty',
      dueAt: new Date(now.getTime() + 2 * HOUR_MS).toISOString(),
      at: now.toISOString(),
    }];
    writeCollection('roomstatus', seed);
    return seed;
  }
  return list;
}

function isAging(room) {
  if (!AGING_STATUSES.has(room.status)) return false;
  const dueAt = Date.parse(room.dueAt || room.until || '');
  if (Number.isFinite(dueAt)) return dueAt < Date.now();
  const started = Date.parse(room.updatedAt || room.at || room.createdAt || '');
  const agingHours = Number(room.agingHours || 4);
  return Number.isFinite(started) && started + agingHours * HOUR_MS < Date.now();
}

function openRoomstatusFlags() {
  const flags = readCollection('roomstatus-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addRoomstatusFlag(candidate, actor = 'system') {
  const existing = readCollection('roomstatus-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('rsf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('roomstatus-flags', list.slice(0, 200));
  return flag;
}

export function listRoomstatus(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(a.room || '').localeCompare(String(b.room || '')));
}

export function createRoomstatus(input = {}, actor = 'system') {
  const agingHours = Number(input.agingHours ?? 4) || 4;
  const now = new Date();
  const row = {
    id: `rms_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "101",
    hk: input.hk !== undefined ? input.hk : "Clean",
    status: input.status || 'dirty',
    reason: input.reason || null,
    agingHours,
    dueAt: input.dueAt || new Date(now.getTime() + agingHours * HOUR_MS).toISOString(),
    at: input.at || now.toISOString(),
    createdBy: actor,
  };
  prependItem('roomstatus', row, 300);
  appendAudit({
    actor,
    action: 'roomstatus.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateRoomstatus(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.agingHours !== undefined) next.agingHours = Number(next.agingHours) || 0;
  list[idx] = next;
  writeCollection('roomstatus', list);
  appendAudit({ actor, action: 'roomstatus.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function roomstatusSummary() {
  const list = listRoomstatus();
  const aging = list.filter(isAging);
  const dirtyAging = aging.filter((x) => x.status === 'dirty');
  const oooAging = aging.filter((x) => x.status === 'ooo' || x.status === 'blocked');
  const flags = openRoomstatusFlags();
  return {
    title: 'LİKYA Oda Durumu Ops',
    total: list.length,
    dirty: list.filter((x) => x.status === 'dirty').length,
    clean: list.filter((x) => x.status === 'clean').length,
    inspected: list.filter((x) => x.status === 'inspected').length,
    ooo: list.filter((x) => x.status === 'ooo').length,
    ready: list.filter((x) => x.status === 'ready').length,
    blocked: list.filter((x) => x.status === 'blocked').length,
    dirtyAging: dirtyAging.length,
    oooAging: oooAging.length,
    aging: aging.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      dirty: list.filter((x) => x.status === 'dirty').length,
      clean: list.filter((x) => x.status === 'clean').length,
      inspected: list.filter((x) => x.status === 'inspected').length,
      ooo: list.filter((x) => x.status === 'ooo').length,
      ready: list.filter((x) => x.status === 'ready').length,
      blocked: list.filter((x) => x.status === 'blocked').length,
      dirty_aging: dirtyAging.length,
      ooo_aging: oooAging.length,
    },
    summaryLines: [
      `Oda ${list.length} · dirty ${list.filter((x) => x.status === 'dirty').length} · aging ${aging.length}`,
      `OOO ${list.filter((x) => x.status === 'ooo').length} · ready ${list.filter((x) => x.status === 'ready').length} · flag ${flags.length}`,
    ],
    roomstatus: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runRoomstatusSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = roomstatusSummary();
  const created = [];
  const candidates = [];
  if (force || overview.dirtyAging > 0) {
    candidates.push({
      key: 'roomstatus_dirty_aging',
      level: overview.dirtyAging > 0 ? 'warn' : 'info',
      text: `Yaşlanan dirty oda ${overview.dirtyAging}`,
      domain: 'housekeeping',
    });
  }
  if (force || overview.oooAging > 0) {
    candidates.push({
      key: 'roomstatus_ooo_aging',
      level: overview.oooAging > 0 ? 'alert' : 'info',
      text: `Yaşlanan OOO/blocked oda ${overview.oooAging}`,
      domain: 'availability',
    });
  }
  if (force || overview.blocked > 0) {
    candidates.push({
      key: 'roomstatus_blocked_rooms',
      level: overview.blocked > 0 ? 'alert' : 'info',
      text: `Blocked oda ${overview.blocked}`,
      domain: 'inventory',
    });
  }
  for (const candidate of candidates) {
    const flag = addRoomstatusFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob(
      {
        agent: 'HEPHAESTUS',
        title: `roomstatus sweep · ${created.length} flag`,
        priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
        payload: { flag_ids: created.map((f) => f.id) },
      },
      actor,
    );
  }
  const sweep = { id: rid('rss'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('roomstatus-sweeps', sweep, 80);
  appendAudit({ actor, action: 'roomstatus.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: roomstatusSummary() };
}

export function ackRoomstatusFlag(input = {}, actor = 'system') {
  const list = readCollection('roomstatus-flags', []) || [];
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
  writeCollection('roomstatus-flags', list);
  appendAudit({ actor, action: 'roomstatus.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: roomstatusSummary() };
}

export function setRoomstatusReady(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || x.room === input.room);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => ['dirty', 'clean', 'inspected'].includes(x.status));
  if (idx < 0) return { ok: false, error: 'Ready yapılacak oda yok' };
  list[idx] = {
    ...list[idx],
    status: 'ready',
    hk: input.hk || list[idx].hk || 'Ready',
    readyAt: input.readyAt || new Date().toISOString(),
    readyBy: actor,
    reason: null,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('roomstatus', list);
  appendAudit({ actor, action: 'roomstatus.ready', detail: list[idx].room || list[idx].id, meta: { id: list[idx].id } });
  return { ok: true, room: list[idx], overview: roomstatusSummary() };
}

export function extendRoomstatusOoo(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || x.room === input.room);
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'ooo' || x.status === 'blocked');
  if (idx < 0) return { ok: false, error: 'OOO uzatılacak oda yok' };
  const hours = Number(input.hours ?? 4) || 4;
  const base = Math.max(Date.parse(list[idx].dueAt || '') || Date.now(), Date.now());
  list[idx] = {
    ...list[idx],
    status: input.status || list[idx].status || 'ooo',
    dueAt: input.dueAt || new Date(base + hours * HOUR_MS).toISOString(),
    reason: input.reason || list[idx].reason || 'Ops OOO extension',
    extendedAt: new Date().toISOString(),
    extendedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('roomstatus', list);
  appendAudit({ actor, action: 'roomstatus.ooo_extend', detail: `${list[idx].room || list[idx].id} +${hours}h`, meta: { id: list[idx].id } });
  return { ok: true, room: list[idx], overview: roomstatusSummary() };
}

export function seedBlockedRoomstatus(input = {}, actor = 'system') {
  const room = createRoomstatus(
    {
      room: input.room || '418',
      hk: input.hk || 'Engineering',
      status: input.status || 'blocked',
      reason: input.reason || 'Ops maintenance block',
      agingHours: Number(input.agingHours ?? 2),
      dueAt: input.dueAt || new Date(Date.now() - HOUR_MS).toISOString(),
    },
    actor,
  );
  appendAudit({ actor, action: 'roomstatus.seed_blocked', detail: room.room, meta: { id: room.id } });
  return { ok: true, room, overview: roomstatusSummary() };
}
