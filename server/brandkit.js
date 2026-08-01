/**
 * AŞAMA 567 — Brand Kit.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('brandkit', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'brk_1', token: "lykia-blue",
      value: "#0B6E99", status: 'draft', at: new Date().toISOString() }];
    writeCollection('brandkit', seed);
    return seed;
  }
  return list;
}
export function listBrandkit(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBrandkit(input, actor = 'system') {
  const row = {
    id: `brk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    token: input.token !== undefined ? input.token : "lykia-blue",
    value: input.value !== undefined ? input.value : "#0B6E99",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('brandkit', row, 300);
  appendAudit({
    actor,
    action: 'brandkit.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBrandkit(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('brandkit', list);
  appendAudit({ actor, action: 'brandkit.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function brandkitSummary() {
  const list = listBrandkit();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    approved: list.filter((x) => x.status === 'approved').length,
    live: list.filter((x) => x.status === 'live').length, brandkit: list };
}
