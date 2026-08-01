/**
 * AŞAMA 369 — Blameless Review.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('blameless', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'blm_1', incident: "WiFi outage",
      owner: "CHIMERA", status: 'draft', at: new Date().toISOString() }];
    writeCollection('blameless', seed);
    return seed;
  }
  return list;
}
export function listBlameless(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBlameless(input, actor = 'system') {
  const row = {
    id: `blm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    incident: input.incident !== undefined ? input.incident : "WiFi outage",
    owner: input.owner !== undefined ? input.owner : "CHIMERA",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('blameless', row, 300);
  appendAudit({
    actor,
    action: 'blameless.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBlameless(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('blameless', list);
  appendAudit({ actor, action: 'blameless.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function blamelessSummary() {
  const list = listBlameless();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    published: list.filter((x) => x.status === 'published').length,
    actions_open: list.filter((x) => x.status === 'actions_open').length, blameless: list };
}
