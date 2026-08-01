/**
 * AŞAMA 753 — Quiet Hours.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('quiethours', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'qui_1', zone: "Alpha",
      profile: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('quiethours', seed);
    return seed;
  }
  return list;
}
export function listQuiethours(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createQuiethours(input, actor = 'system') {
  const row = {
    id: `qui_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Alpha",
    profile: input.profile !== undefined ? input.profile : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('quiethours', row, 300);
  appendAudit({
    actor,
    action: 'quiethours.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateQuiethours(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('quiethours', list);
  appendAudit({ actor, action: 'quiethours.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function quiethoursSummary() {
  const list = listQuiethours();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, quiethours: list };
}
