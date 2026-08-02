/**
 * Wave 167 - Breakfast slot ops.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

function rid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensure() {
  const list = readCollection('breakfast', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'brk_1',
      slot: "08:00",
      guestName: "Misafir",
      status: 'booked',
      covers: 2,
      at: new Date().toISOString(),
    }];
    writeCollection('breakfast', seed);
    return seed;
  }
  return list;
}

function openBreakfastFlags() {
  const flags = readCollection('breakfast-flags', []) || [];
  return Array.isArray(flags) ? flags.filter((f) => f.status === 'open') : [];
}

function addBreakfastFlag(candidate, actor = 'system') {
  const existing = readCollection('breakfast-flags', []) || [];
  const list = Array.isArray(existing) ? existing : [];
  const openKeys = new Set(list.filter((f) => f.status === 'open').map((f) => f.key));
  if (openKeys.has(candidate.key)) return null;
  const flag = { id: rid('brf'), ...candidate, status: 'open', at: new Date().toISOString(), actor };
  list.unshift(flag);
  writeCollection('breakfast-flags', list.slice(0, 200));
  return flag;
}

function isNoShowCover(row) {
  if (row.status === 'no_show') return true;
  const due = Date.parse(row.dueAt || row.slotAt || '');
  return row.status === 'booked' && Number.isFinite(due) && due + 20 * 60_000 < Date.now();
}

export function listBreakfast(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
}

export function createBreakfast(input = {}, actor = 'system') {
  const row = {
    id: `brk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    slot: input.slot !== undefined ? input.slot : "08:00",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    covers: Number(input.covers ?? input.seats ?? 2) || 0,
    table: input.table || null,
    dueAt: input.dueAt || null,
    status: input.status || 'booked',
    at: input.at || new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('breakfast', row, 300);
  appendAudit({
    actor,
    action: 'breakfast.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateBreakfast(id, patch = {}, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  const next = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  if (next.covers !== undefined) next.covers = Number(next.covers) || 0;
  list[idx] = next;
  writeCollection('breakfast', list);
  appendAudit({ actor, action: 'breakfast.update', detail: `${id} -> ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function breakfastSummary() {
  const list = listBreakfast();
  const noShowCovers = list.filter(isNoShowCover).reduce((sum, row) => sum + (Number(row.covers) || 1), 0);
  const seatedCovers = list.filter((x) => x.status === 'seated').reduce((sum, row) => sum + (Number(row.covers) || 1), 0);
  const rush = list.filter((x) => x.status === 'rush' || x.buffetRush === true);
  const flags = openBreakfastFlags();
  return {
    title: 'LIKYA Breakfast Ops',
    total: list.length,
    booked: list.filter((x) => x.status === 'booked').length,
    seated: list.filter((x) => x.status === 'seated').length,
    done: list.filter((x) => x.status === 'done').length,
    noShowCovers,
    seatedCovers,
    rush: rush.length,
    flags: flags.slice(0, 30),
    summary: {
      flags_open: flags.length,
      total: list.length,
      booked: list.filter((x) => x.status === 'booked').length,
      seated: list.filter((x) => x.status === 'seated').length,
      done: list.filter((x) => x.status === 'done').length,
      no_show_covers: noShowCovers,
      seated_covers: seatedCovers,
      rush: rush.length,
    },
    summaryLines: [
      `Breakfast ${list.length} party - booked ${list.filter((x) => x.status === 'booked').length} - seated covers ${seatedCovers}`,
      `No-show covers ${noShowCovers} - buffet rush ${rush.length} - flag ${flags.length}`,
    ],
    breakfast: list,
    generatedAt: new Date().toISOString(),
  };
}

export function runBreakfastSweep(input = {}, actor = 'system') {
  const force = !!input.force;
  const overview = breakfastSummary();
  const created = [];
  const candidates = [];
  if (force || overview.noShowCovers > 0) {
    candidates.push({
      key: 'breakfast_no_show_covers',
      level: overview.noShowCovers > 0 ? 'warn' : 'info',
      text: `Breakfast no-show covers ${overview.noShowCovers}`,
      domain: 'covers',
    });
  }
  if (force || overview.rush > 0) {
    candidates.push({
      key: 'breakfast_buffet_rush',
      level: overview.rush > 0 ? 'warn' : 'info',
      text: `Buffet rush parties ${overview.rush}`,
      domain: 'buffet',
    });
  }
  if (force || overview.booked > overview.seated + overview.done) {
    candidates.push({
      key: 'breakfast_seating_backlog',
      level: overview.booked > overview.seated + overview.done ? 'warn' : 'info',
      text: `Breakfast booked backlog ${overview.booked}`,
      domain: 'seating',
    });
  }
  for (const candidate of candidates) {
    const flag = addBreakfastFlag(candidate, actor);
    if (flag) created.push(flag);
  }
  if (created.length) {
    enqueueAgentJob({
      agent: 'HERMES',
      title: `breakfast sweep - ${created.length} flag`,
      priority: created.some((f) => f.level === 'alert') ? 'high' : 'normal',
      payload: { flag_ids: created.map((f) => f.id) },
    }, actor);
  }
  const sweep = { id: rid('brs'), created: created.length, at: new Date().toISOString(), actor };
  prependItem('breakfast-sweeps', sweep, 80);
  appendAudit({ actor, action: 'breakfast.sweep', detail: `${created.length} flag`, meta: { id: sweep.id } });
  return { ok: true, sweep, created, overview: breakfastSummary() };
}

export function ackBreakfastFlag(input = {}, actor = 'system') {
  const list = readCollection('breakfast-flags', []) || [];
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
  writeCollection('breakfast-flags', list);
  appendAudit({ actor, action: 'breakfast.ack', detail: list[idx].text, meta: { id: list[idx].id } });
  return { ok: true, flag: list[idx], overview: breakfastSummary() };
}

export function markBreakfastNoShowCovers(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.slot && x.slot === input.slot));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status === 'booked' || x.status === 'rush');
  if (idx < 0) return { ok: false, error: 'No-show yapilacak kahvalti yok' };
  list[idx] = {
    ...list[idx],
    status: 'no_show',
    covers: Number(input.covers ?? list[idx].covers ?? 1) || 1,
    noShowAt: input.noShowAt || new Date().toISOString(),
    noShowBy: actor,
    reason: input.reason || list[idx].reason || 'No-show breakfast covers',
    updatedAt: new Date().toISOString(),
  };
  writeCollection('breakfast', list);
  appendAudit({ actor, action: 'breakfast.no_show_covers', detail: list[idx].guestName || list[idx].slot, meta: { id: list[idx].id } });
  return { ok: true, breakfast: list[idx], overview: breakfastSummary() };
}

export function seatBreakfastParty(input = {}, actor = 'system') {
  const list = ensure();
  const explicitIdx = list.findIndex((x) => x.id === input.id || (input.slot && x.slot === input.slot));
  const idx = explicitIdx >= 0 ? explicitIdx : list.findIndex((x) => x.status !== 'seated' && x.status !== 'done');
  if (idx < 0) return { ok: false, error: 'Seat edilecek kahvalti yok' };
  list[idx] = {
    ...list[idx],
    status: 'seated',
    table: input.table || list[idx].table || 'B-1',
    covers: Number(input.covers ?? list[idx].covers ?? 1) || 1,
    seatedAt: input.seatedAt || new Date().toISOString(),
    seatedBy: actor,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('breakfast', list);
  appendAudit({ actor, action: 'breakfast.seat_party', detail: list[idx].guestName || list[idx].slot, meta: { id: list[idx].id } });
  return { ok: true, breakfast: list[idx], overview: breakfastSummary() };
}

export function seedBuffetRush(input = {}, actor = 'system') {
  const breakfast = createBreakfast(
    {
      slot: input.slot || '09:15',
      guestName: input.guestName || 'Buffet rush party',
      covers: Number(input.covers ?? input.seats ?? 8) || 8,
      table: input.table || 'Buffet',
      status: input.status || 'rush',
      dueAt: input.dueAt || new Date(Date.now() - 10 * 60_000).toISOString(),
    },
    actor,
  );
  breakfast.buffetRush = true;
  updateBreakfast(breakfast.id, { buffetRush: true, priority: input.priority || 'high' }, actor);
  appendAudit({ actor, action: 'breakfast.seed_buffet_rush', detail: breakfast.guestName, meta: { id: breakfast.id } });
  return { ok: true, breakfast: { ...breakfast, buffetRush: true, priority: input.priority || 'high' }, overview: breakfastSummary() };
}
