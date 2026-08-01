/**
 * AŞAMA 98 — Havlu Takibi.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('towels', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'twl_1',
      zone: "Beach",
      qty: "50",
      status: 'ok',
      at: new Date().toISOString(),
    }];
    writeCollection('towels', seed);
    return seed;
  }
  return list;
}

export function listTowels(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createTowels(input, actor = 'system') {
  const row = {
    id: `twl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Beach",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 50,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('towels', row, 300);
  appendAudit({
    actor,
    action: 'towels.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.room || row.eventName || row.tourName || row.vessel || row.zone || row.plate || row.employee || row.metric || row.request || row.checkpoint || row.item || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateTowels(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('towels', list);
  appendAudit({ actor, action: 'towels.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function towelsSummary() {
  const list = listTowels();
  return {
    total: list.length,
    ok: list.filter((x) => x.status === 'ok').length,
    low: list.filter((x) => x.status === 'low').length,
    critical: list.filter((x) => x.status === 'critical').length,
    towels: list,
  };
}
