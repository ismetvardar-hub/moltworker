/**
 * AŞAMA 890 — Final Brief.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('finalbrief', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fin_1', topic: "Alpha",
      owner: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('finalbrief', seed);
    return seed;
  }
  return list;
}
export function listFinalbrief(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFinalbrief(input, actor = 'system') {
  const row = {
    id: `fin_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    topic: input.topic !== undefined ? input.topic : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('finalbrief', row, 300);
  appendAudit({
    actor,
    action: 'finalbrief.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFinalbrief(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('finalbrief', list);
  appendAudit({ actor, action: 'finalbrief.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function finalbriefSummary() {
  const list = listFinalbrief();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, finalbrief: list };
}
