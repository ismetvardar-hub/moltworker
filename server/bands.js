/**
 * AŞAMA 99 — Günlük Bileklik.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('bands', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'bnd_1',
      code: "B-100",
      guestName: "Misafir",
      status: 'issued',
      at: new Date().toISOString(),
    }];
    writeCollection('bands', seed);
    return seed;
  }
  return list;
}

export function listBands(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createBands(input, actor = 'system') {
  const row = {
    id: `bnd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    code: input.code !== undefined ? input.code : "B-100",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'issued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bands', row, 300);
  appendAudit({
    actor,
    action: 'bands.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateBands(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('bands', list);
  appendAudit({ actor, action: 'bands.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function bandsSummary() {
  const list = listBands();
  return {
    total: list.length,
    issued: list.filter((x) => x.status === 'issued').length,
    active: list.filter((x) => x.status === 'active').length,
    returned: list.filter((x) => x.status === 'returned').length,
    bands: list,
  };
}
