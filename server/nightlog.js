/**
 * AŞAMA 119 — Gece Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('nightlog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'ngl_1',
      metric: "No-show",
      value: "2",
      status: 'open',
      at: new Date().toISOString(),
    }];
    writeCollection('nightlog', seed);
    return seed;
  }
  return list;
}

export function listNightlog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createNightlog(input, actor = 'system') {
  const row = {
    id: `ngl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    metric: input.metric !== undefined ? input.metric : "No-show",
    value: input.value !== undefined ? Number(input.value) || 0 : 2,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('nightlog', row, 300);
  appendAudit({
    actor,
    action: 'nightlog.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.offer || row.groupName || row.channel || row.activity || row.bikeNo || row.film || row.sku || row.item || row.slot || row.metric || row.note || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateNightlog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('nightlog', list);
  appendAudit({ actor, action: 'nightlog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function nightlogSummary() {
  const list = listNightlog();
  return {
    total: list.length,
    open: list.filter((x) => x.status === 'open').length,
    closed: list.filter((x) => x.status === 'closed').length,
    nightlog: list,
  };
}
