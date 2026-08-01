/**
 * AŞAMA 526 — Data Lake.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('datalake', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dlk_1', dataset: "guest_events",
      rows: "120000", status: 'landing', at: new Date().toISOString() }];
    writeCollection('datalake', seed);
    return seed;
  }
  return list;
}
export function listDatalake(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDatalake(input, actor = 'system') {
  const row = {
    id: `dlk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    dataset: input.dataset !== undefined ? input.dataset : "guest_events",
    rows: input.rows !== undefined ? Number(input.rows) || 0 : 120000,
    status: input.status || 'landing',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('datalake', row, 300);
  appendAudit({
    actor,
    action: 'datalake.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDatalake(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('datalake', list);
  appendAudit({ actor, action: 'datalake.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function datalakeSummary() {
  const list = listDatalake();
  return { total: list.length, landing: list.filter((x) => x.status === 'landing').length,
    curated: list.filter((x) => x.status === 'curated').length,
    retired: list.filter((x) => x.status === 'retired').length, datalake: list };
}
