/**
 * AŞAMA 115 — Pastane.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('bakery', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'bky_1',
      item: "Cheesecake",
      qty: "1",
      status: 'ordered',
      at: new Date().toISOString(),
    }];
    writeCollection('bakery', seed);
    return seed;
  }
  return list;
}

export function listBakery(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createBakery(input, actor = 'system') {
  const row = {
    id: `bky_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    item: input.item !== undefined ? input.item : "Cheesecake",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 1,
    status: input.status || 'ordered',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bakery', row, 300);
  appendAudit({
    actor,
    action: 'bakery.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateBakery(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('bakery', list);
  appendAudit({ actor, action: 'bakery.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function bakerySummary() {
  const list = listBakery();
  return {
    total: list.length,
    ordered: list.filter((x) => x.status === 'ordered').length,
    ready: list.filter((x) => x.status === 'ready').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    bakery: list,
  };
}
