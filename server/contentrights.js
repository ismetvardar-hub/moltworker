/**
 * AŞAMA 662 — Content Rights.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('contentrights', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cgr_1', asset: "Brand film",
      rights: "TR+EU", status: 'cleared', at: new Date().toISOString() }];
    writeCollection('contentrights', seed);
    return seed;
  }
  return list;
}
export function listContentrights(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createContentrights(input, actor = 'system') {
  const row = {
    id: `cgr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    asset: input.asset !== undefined ? input.asset : "Brand film",
    rights: input.rights !== undefined ? input.rights : "TR+EU",
    status: input.status || 'cleared',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('contentrights', row, 300);
  appendAudit({
    actor,
    action: 'contentrights.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateContentrights(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('contentrights', list);
  appendAudit({ actor, action: 'contentrights.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function contentrightsSummary() {
  const list = listContentrights();
  return { total: list.length, cleared: list.filter((x) => x.status === 'cleared').length,
    limited: list.filter((x) => x.status === 'limited').length,
    expired: list.filter((x) => x.status === 'expired').length, contentrights: list };
}
