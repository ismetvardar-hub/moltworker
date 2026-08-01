/**
 * AŞAMA 652 — Assort Mix.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('assortmix', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'asm2_1', category: "Apparel",
      skus: "42", status: 'draft', at: new Date().toISOString() }];
    writeCollection('assortmix', seed);
    return seed;
  }
  return list;
}
export function listAssortmix(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAssortmix(input, actor = 'system') {
  const row = {
    id: `asm2_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    category: input.category !== undefined ? input.category : "Apparel",
    skus: input.skus !== undefined ? Number(input.skus) || 0 : 42,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('assortmix', row, 300);
  appendAudit({
    actor,
    action: 'assortmix.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAssortmix(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('assortmix', list);
  appendAudit({ actor, action: 'assortmix.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function assortmixSummary() {
  const list = listAssortmix();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    retired: list.filter((x) => x.status === 'retired').length, assortmix: list };
}
