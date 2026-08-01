/**
 * AŞAMA 134 — Şafak Servisi.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('dawnservice', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'dwn_1',
      room: "102",
      item: "Espresso",
      status: 'queued',
      at: new Date().toISOString(),
    }];
    writeCollection('dawnservice', seed);
    return seed;
  }
  return list;
}

export function listDawnservice(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createDawnservice(input, actor = 'system') {
  const row = {
    id: `dwn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "102",
    item: input.item !== undefined ? input.item : "Espresso",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('dawnservice', row, 300);
  appendAudit({
    actor,
    action: 'dawnservice.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateDawnservice(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('dawnservice', list);
  appendAudit({ actor, action: 'dawnservice.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function dawnserviceSummary() {
  const list = listDawnservice();
  return {
    total: list.length,
    queued: list.filter((x) => x.status === 'queued').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    skipped: list.filter((x) => x.status === 'skipped').length,
    dawnservice: list,
  };
}
