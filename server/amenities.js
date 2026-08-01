/**
 * AŞAMA 118 — Amenity.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('amenities', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'amn_1',
      room: "101",
      item: "Meyve tabağı",
      status: 'queued',
      at: new Date().toISOString(),
    }];
    writeCollection('amenities', seed);
    return seed;
  }
  return list;
}

export function listAmenities(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createAmenities(input, actor = 'system') {
  const row = {
    id: `amn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "101",
    item: input.item !== undefined ? input.item : "Meyve tabağı",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('amenities', row, 300);
  appendAudit({
    actor,
    action: 'amenities.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateAmenities(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('amenities', list);
  appendAudit({ actor, action: 'amenities.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function amenitiesSummary() {
  const list = listAmenities();
  return {
    total: list.length,
    queued: list.filter((x) => x.status === 'queued').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    skipped: list.filter((x) => x.status === 'skipped').length,
    amenities: list,
  };
}
