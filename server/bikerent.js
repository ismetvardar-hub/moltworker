/**
 * AŞAMA 112 — Bisiklet.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('bikerent', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'bik_1',
      bikeNo: "BK-01",
      guestName: "Misafir",
      status: 'available',
      at: new Date().toISOString(),
    }];
    writeCollection('bikerent', seed);
    return seed;
  }
  return list;
}

export function listBikerent(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createBikerent(input, actor = 'system') {
  const row = {
    id: `bik_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bikeNo: input.bikeNo !== undefined ? input.bikeNo : "BK-01",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'available',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bikerent', row, 300);
  appendAudit({
    actor,
    action: 'bikerent.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateBikerent(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('bikerent', list);
  appendAudit({ actor, action: 'bikerent.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function bikerentSummary() {
  const list = listBikerent();
  return {
    total: list.length,
    available: list.filter((x) => x.status === 'available').length,
    rented: list.filter((x) => x.status === 'rented').length,
    service: list.filter((x) => x.status === 'service').length,
    bikerent: list,
  };
}
