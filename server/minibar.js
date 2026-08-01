/**
 * AŞAMA 92 — Minibar.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('minibar', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'mnb_1',
      room: "101",
      item: "Su",
      status: 'pending',
      at: new Date().toISOString(),
    }];
    writeCollection('minibar', seed);
    return seed;
  }
  return list;
}

export function listMinibar(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createMinibar(input, actor = 'system') {
  const row = {
    id: `mnb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "101",
    item: input.item !== undefined ? input.item : "Su",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('minibar', row, 300);
  appendAudit({
    actor,
    action: 'minibar.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateMinibar(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('minibar', list);
  appendAudit({ actor, action: 'minibar.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function minibarSummary() {
  const list = listMinibar();
  return {
    total: list.length,
    pending: list.filter((x) => x.status === 'pending').length,
    restocked: list.filter((x) => x.status === 'restocked').length,
    billed: list.filter((x) => x.status === 'billed').length,
    minibar: list,
  };
}
