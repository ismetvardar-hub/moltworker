/**
 * AŞAMA 122 — Oda Durumu.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('roomstatus', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'rms_1',
      room: "101",
      hk: "Clean",
      status: 'dirty',
      at: new Date().toISOString(),
    }];
    writeCollection('roomstatus', seed);
    return seed;
  }
  return list;
}

export function listRoomstatus(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createRoomstatus(input, actor = 'system') {
  const row = {
    id: `rms_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "101",
    hk: input.hk !== undefined ? input.hk : "Clean",
    status: input.status || 'dirty',
    at: new Date().toISOString(),
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
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('roomstatus', list);
  appendAudit({ actor, action: 'roomstatus.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function roomstatusSummary() {
  const list = listRoomstatus();
  return {
    total: list.length,
    dirty: list.filter((x) => x.status === 'dirty').length,
    clean: list.filter((x) => x.status === 'clean').length,
    inspected: list.filter((x) => x.status === 'inspected').length,
    ooo: list.filter((x) => x.status === 'ooo').length,
    roomstatus: list,
  };
}
