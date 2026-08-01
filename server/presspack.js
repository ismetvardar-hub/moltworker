/**
 * AŞAMA 566 — Press Pack.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('presspack', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'prp_1', asset: "Logo pack",
      format: "ZIP", status: 'draft', at: new Date().toISOString() }];
    writeCollection('presspack', seed);
    return seed;
  }
  return list;
}
export function listPresspack(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPresspack(input, actor = 'system') {
  const row = {
    id: `prp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    asset: input.asset !== undefined ? input.asset : "Logo pack",
    format: input.format !== undefined ? input.format : "ZIP",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('presspack', row, 300);
  appendAudit({
    actor,
    action: 'presspack.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePresspack(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('presspack', list);
  appendAudit({ actor, action: 'presspack.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function presspackSummary() {
  const list = listPresspack();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    published: list.filter((x) => x.status === 'published').length,
    archived: list.filter((x) => x.status === 'archived').length, presspack: list };
}
