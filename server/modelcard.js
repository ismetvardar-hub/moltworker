/**
 * AŞAMA 528 — Model Card.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('modelcard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mdc_1', model: "demand_forecast",
      version: "1.4", status: 'draft', at: new Date().toISOString() }];
    writeCollection('modelcard', seed);
    return seed;
  }
  return list;
}
export function listModelcard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createModelcard(input, actor = 'system') {
  const row = {
    id: `mdc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    model: input.model !== undefined ? input.model : "demand_forecast",
    version: input.version !== undefined ? input.version : "1.4",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('modelcard', row, 300);
  appendAudit({
    actor,
    action: 'modelcard.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateModelcard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('modelcard', list);
  appendAudit({ actor, action: 'modelcard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function modelcardSummary() {
  const list = listModelcard();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    approved: list.filter((x) => x.status === 'approved').length,
    deprecated: list.filter((x) => x.status === 'deprecated').length, modelcard: list };
}
