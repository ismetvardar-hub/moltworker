/**
 * AŞAMA 76 — Dolap Kiralama.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('lockers', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'loc_1',
      code: "L-01",
      guestName: "Misafir",
      status: 'free',
      at: new Date().toISOString(),
    }];
    writeCollection('lockers', seed);
    return seed;
  }
  return list;
}

export function listLockers(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createLockers(input, actor = 'system') {
  const row = {
    id: `loc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    code: input.code !== undefined ? input.code : "L-01",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'free',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('lockers', row, 300);
  appendAudit({
    actor,
    action: 'lockers.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateLockers(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('lockers', list);
  appendAudit({ actor, action: 'lockers.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function lockersSummary() {
  const list = listLockers();
  return {
    total: list.length,
    free: list.filter((x) => x.status === 'free').length,
    occupied: list.filter((x) => x.status === 'occupied').length,
    hold: list.filter((x) => x.status === 'hold').length,
    lockers: list,
  };
}
