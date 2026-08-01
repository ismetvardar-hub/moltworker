/**
 * AŞAMA 124 — Wake-up.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('wakeups', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'wup_1',
      room: "305",
      time: "06:30",
      status: 'scheduled',
      at: new Date().toISOString(),
    }];
    writeCollection('wakeups', seed);
    return seed;
  }
  return list;
}

export function listWakeups(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createWakeups(input, actor = 'system') {
  const row = {
    id: `wup_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "305",
    time: input.time !== undefined ? input.time : "06:30",
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wakeups', row, 300);
  appendAudit({
    actor,
    action: 'wakeups.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateWakeups(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('wakeups', list);
  appendAudit({ actor, action: 'wakeups.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function wakeupsSummary() {
  const list = listWakeups();
  return {
    total: list.length,
    scheduled: list.filter((x) => x.status === 'scheduled').length,
    done: list.filter((x) => x.status === 'done').length,
    missed: list.filter((x) => x.status === 'missed').length,
    wakeups: list,
  };
}
