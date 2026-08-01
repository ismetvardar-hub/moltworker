/**
 * AŞAMA 463 — Chef Brief.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('chefbrief', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cbf_1', shift: "Dinner",
      note: "86 lobster", status: 'draft', at: new Date().toISOString() }];
    writeCollection('chefbrief', seed);
    return seed;
  }
  return list;
}
export function listChefbrief(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createChefbrief(input, actor = 'system') {
  const row = {
    id: `cbf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    shift: input.shift !== undefined ? input.shift : "Dinner",
    note: input.note !== undefined ? input.note : "86 lobster",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('chefbrief', row, 300);
  appendAudit({
    actor,
    action: 'chefbrief.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateChefbrief(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('chefbrief', list);
  appendAudit({ actor, action: 'chefbrief.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function chefbriefSummary() {
  const list = listChefbrief();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    posted: list.filter((x) => x.status === 'posted').length,
    archived: list.filter((x) => x.status === 'archived').length, chefbrief: list };
}
