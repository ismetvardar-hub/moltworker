/**
 * AŞAMA 424 — Konteyner.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('container', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ctr_1', unit: "LYKU-100",
      content: "Dry goods", status: 'in_yard', at: new Date().toISOString() }];
    writeCollection('container', seed);
    return seed;
  }
  return list;
}
export function listContainer(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createContainer(input, actor = 'system') {
  const row = {
    id: `ctr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    unit: input.unit !== undefined ? input.unit : "LYKU-100",
    content: input.content !== undefined ? input.content : "Dry goods",
    status: input.status || 'in_yard',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('container', row, 300);
  appendAudit({
    actor,
    action: 'container.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateContainer(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('container', list);
  appendAudit({ actor, action: 'container.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function containerSummary() {
  const list = listContainer();
  return { total: list.length, in_yard: list.filter((x) => x.status === 'in_yard').length,
    loading: list.filter((x) => x.status === 'loading').length,
    departed: list.filter((x) => x.status === 'departed').length, container: list };
}
