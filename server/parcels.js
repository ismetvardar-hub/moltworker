/**
 * AŞAMA 125 — Kargo / Emanet.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('parcels', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'pcl_1',
      guestName: "Misafir",
      label: "Kargo",
      status: 'held',
      at: new Date().toISOString(),
    }];
    writeCollection('parcels', seed);
    return seed;
  }
  return list;
}

export function listParcels(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createParcels(input, actor = 'system') {
  const row = {
    id: `pcl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    label: input.label !== undefined ? input.label : "Kargo",
    status: input.status || 'held',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('parcels', row, 300);
  appendAudit({
    actor,
    action: 'parcels.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateParcels(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('parcels', list);
  appendAudit({ actor, action: 'parcels.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function parcelsSummary() {
  const list = listParcels();
  return {
    total: list.length,
    held: list.filter((x) => x.status === 'held').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    returned: list.filter((x) => x.status === 'returned').length,
    parcels: list,
  };
}
