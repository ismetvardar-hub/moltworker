/**
 * AŞAMA 86 — Lounge Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('lounge-log', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'lou_1',
      guestName: "Misafir",
      tier: "Altın",
      status: 'in',
      at: new Date().toISOString(),
    }];
    writeCollection('lounge-log', seed);
    return seed;
  }
  return list;
}

export function listLounge(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createLounge(input, actor = 'system') {
  const row = {
    id: `lou_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    tier: input.tier !== undefined ? input.tier : "Altın",
    status: input.status || 'in',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('lounge-log', row, 300);
  appendAudit({
    actor,
    action: 'lounge.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateLounge(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('lounge-log', list);
  appendAudit({ actor, action: 'lounge.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function loungeSummary() {
  const list = listLounge();
  return {
    total: list.length,
    inCount: list.filter((x) => x.status === 'in').length,
    outCount: list.filter((x) => x.status === 'out').length,
    visits: list,
  };
}
