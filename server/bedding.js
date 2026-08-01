/**
 * AŞAMA 123 — Yatak / Extra.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('bedding', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'bed_1',
      room: "204",
      item: "Extra bed",
      status: 'requested',
      at: new Date().toISOString(),
    }];
    writeCollection('bedding', seed);
    return seed;
  }
  return list;
}

export function listBedding(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createBedding(input, actor = 'system') {
  const row = {
    id: `bed_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "204",
    item: input.item !== undefined ? input.item : "Extra bed",
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bedding', row, 300);
  appendAudit({
    actor,
    action: 'bedding.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateBedding(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('bedding', list);
  appendAudit({ actor, action: 'bedding.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function beddingSummary() {
  const list = listBedding();
  return {
    total: list.length,
    requested: list.filter((x) => x.status === 'requested').length,
    set: list.filter((x) => x.status === 'set').length,
    removed: list.filter((x) => x.status === 'removed').length,
    bedding: list,
  };
}
