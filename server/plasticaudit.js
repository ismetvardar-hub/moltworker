/**
 * AŞAMA 687 — Plastic Audit.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('plasticaudit', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pla_1', zone: "F&B",
      items: "12", status: 'found', at: new Date().toISOString() }];
    writeCollection('plasticaudit', seed);
    return seed;
  }
  return list;
}
export function listPlasticaudit(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPlasticaudit(input, actor = 'system') {
  const row = {
    id: `pla_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "F&B",
    items: input.items !== undefined ? Number(input.items) || 0 : 12,
    status: input.status || 'found',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('plasticaudit', row, 300);
  appendAudit({
    actor,
    action: 'plasticaudit.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePlasticaudit(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('plasticaudit', list);
  appendAudit({ actor, action: 'plasticaudit.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function plasticauditSummary() {
  const list = listPlasticaudit();
  return { total: list.length, found: list.filter((x) => x.status === 'found').length,
    replaced: list.filter((x) => x.status === 'replaced').length,
    cleared: list.filter((x) => x.status === 'cleared').length, plasticaudit: list };
}
