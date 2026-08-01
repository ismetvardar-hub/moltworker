/**
 * AŞAMA 96 — Marina.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('marina', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'mar_1',
      berth: "A-12",
      vessel: "Likya",
      status: 'free',
      at: new Date().toISOString(),
    }];
    writeCollection('marina', seed);
    return seed;
  }
  return list;
}

export function listMarina(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createMarina(input, actor = 'system') {
  const row = {
    id: `mar_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    berth: input.berth !== undefined ? input.berth : "A-12",
    vessel: input.vessel !== undefined ? input.vessel : "Likya",
    status: input.status || 'free',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('marina', row, 300);
  appendAudit({
    actor,
    action: 'marina.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateMarina(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('marina', list);
  appendAudit({ actor, action: 'marina.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function marinaSummary() {
  const list = listMarina();
  return {
    total: list.length,
    free: list.filter((x) => x.status === 'free').length,
    occupied: list.filter((x) => x.status === 'occupied').length,
    hold: list.filter((x) => x.status === 'hold').length,
    marina: list,
  };
}
