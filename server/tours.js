/**
 * AŞAMA 95 — Tur Masası.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('tours', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'tour_1',
      tourName: "Kekova",
      guestName: "Misafir",
      status: 'booked',
      at: new Date().toISOString(),
    }];
    writeCollection('tours', seed);
    return seed;
  }
  return list;
}

export function listTours(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createTours(input, actor = 'system') {
  const row = {
    id: `tour_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    tourName: input.tourName !== undefined ? input.tourName : "Kekova",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('tours', row, 300);
  appendAudit({
    actor,
    action: 'tours.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateTours(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('tours', list);
  appendAudit({ actor, action: 'tours.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function toursSummary() {
  const list = listTours();
  return {
    total: list.length,
    booked: list.filter((x) => x.status === 'booked').length,
    departed: list.filter((x) => x.status === 'departed').length,
    cancelled: list.filter((x) => x.status === 'cancelled').length,
    tours: list,
  };
}
