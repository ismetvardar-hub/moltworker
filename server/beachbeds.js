/**
 * AŞAMA 78 — Şezlong.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('beach-beds', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'bea_1',
      bedNo: "S-14",
      guestName: "Misafir",
      status: 'free',
      at: new Date().toISOString(),
    }];
    writeCollection('beach-beds', seed);
    return seed;
  }
  return list;
}

export function listBeachbeds(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createBeachbeds(input, actor = 'system') {
  const row = {
    id: `bea_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bedNo: input.bedNo !== undefined ? input.bedNo : "S-14",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'free',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('beach-beds', row, 300);
  appendAudit({
    actor,
    action: 'beachbeds.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateBeachbeds(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('beach-beds', list);
  appendAudit({ actor, action: 'beachbeds.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function beachbedsSummary() {
  const list = listBeachbeds();
  return {
    total: list.length,
    free: list.filter((x) => x.status === 'free').length,
    reserved: list.filter((x) => x.status === 'reserved').length,
    occupied: list.filter((x) => x.status === 'occupied').length,
    beds: list,
  };
}
