/**
 * AŞAMA 678 — Waste Sort.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('wastesort', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wst_1', stream: "Organic",
      kg: "40", status: 'sorted', at: new Date().toISOString() }];
    writeCollection('wastesort', seed);
    return seed;
  }
  return list;
}
export function listWastesort(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWastesort(input, actor = 'system') {
  const row = {
    id: `wst_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    stream: input.stream !== undefined ? input.stream : "Organic",
    kg: input.kg !== undefined ? Number(input.kg) || 0 : 40,
    status: input.status || 'sorted',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wastesort', row, 300);
  appendAudit({
    actor,
    action: 'wastesort.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWastesort(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('wastesort', list);
  appendAudit({ actor, action: 'wastesort.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function wastesortSummary() {
  const list = listWastesort();
  return { total: list.length, sorted: list.filter((x) => x.status === 'sorted').length,
    contaminated: list.filter((x) => x.status === 'contaminated').length,
    hauled: list.filter((x) => x.status === 'hauled').length, wastesort: list };
}
