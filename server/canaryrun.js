/**
 * AŞAMA 778 — Canary Run.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('canaryrun', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'can_1', service: "Alpha",
      version: "5", status: 'draft', at: new Date().toISOString() }];
    writeCollection('canaryrun', seed);
    return seed;
  }
  return list;
}
export function listCanaryrun(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCanaryrun(input, actor = 'system') {
  const row = {
    id: `can_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    service: input.service !== undefined ? input.service : "Alpha",
    version: input.version !== undefined ? Number(input.version) || 0 : 5,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('canaryrun', row, 300);
  appendAudit({
    actor,
    action: 'canaryrun.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCanaryrun(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('canaryrun', list);
  appendAudit({ actor, action: 'canaryrun.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function canaryrunSummary() {
  const list = listCanaryrun();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, canaryrun: list };
}
