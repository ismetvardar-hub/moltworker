/**
 * AŞAMA 1094 — Safety Stock.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('safetystock3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'saf_1', sku: "Alpha",
      min: "5", status: 'queued', at: new Date().toISOString() }];
    writeCollection('safetystock3', seed);
    return seed;
  }
  return list;
}
export function listSafetystock3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSafetystock3(input, actor = 'system') {
  const row = {
    id: `saf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "Alpha",
    min: input.min !== undefined ? Number(input.min) || 0 : 5,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('safetystock3', row, 300);
  appendAudit({
    actor,
    action: 'safetystock3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSafetystock3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('safetystock3', list);
  appendAudit({ actor, action: 'safetystock3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function safetystock3Summary() {
  const list = listSafetystock3();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, safetystock3: list };
}
