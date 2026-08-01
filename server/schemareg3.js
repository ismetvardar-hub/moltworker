/**
 * AŞAMA 1130 — Schema Reg.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('schemareg3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sch_1', schema: "Alpha",
      version: "5", status: 'draft', at: new Date().toISOString() }];
    writeCollection('schemareg3', seed);
    return seed;
  }
  return list;
}
export function listSchemareg3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSchemareg3(input, actor = 'system') {
  const row = {
    id: `sch_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    schema: input.schema !== undefined ? input.schema : "Alpha",
    version: input.version !== undefined ? Number(input.version) || 0 : 5,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('schemareg3', row, 300);
  appendAudit({
    actor,
    action: 'schemareg3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSchemareg3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('schemareg3', list);
  appendAudit({ actor, action: 'schemareg3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function schemareg3Summary() {
  const list = listSchemareg3();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, schemareg3: list };
}
