/**
 * AŞAMA 130 — Çiçek.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('florals', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'flr_1',
      arrangement: "Buket",
      room: "101",
      status: 'ordered',
      at: new Date().toISOString(),
    }];
    writeCollection('florals', seed);
    return seed;
  }
  return list;
}

export function listFlorals(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createFlorals(input, actor = 'system') {
  const row = {
    id: `flr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    arrangement: input.arrangement !== undefined ? input.arrangement : "Buket",
    room: input.room !== undefined ? input.room : "101",
    status: input.status || 'ordered',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('florals', row, 300);
  appendAudit({
    actor,
    action: 'florals.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.piece || row.arrangement || row.menu || row.drink || row.item || row.hk || row.time || row.label || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateFlorals(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('florals', list);
  appendAudit({ actor, action: 'florals.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function floralsSummary() {
  const list = listFlorals();
  return {
    total: list.length,
    ordered: list.filter((x) => x.status === 'ordered').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    cancelled: list.filter((x) => x.status === 'cancelled').length,
    florals: list,
  };
}
