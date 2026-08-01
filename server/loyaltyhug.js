/**
 * AŞAMA 763 — Loyalty Hug.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('loyaltyhug', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'loy_1', guestName: "Alpha",
      tier: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('loyaltyhug', seed);
    return seed;
  }
  return list;
}
export function listLoyaltyhug(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLoyaltyhug(input, actor = 'system') {
  const row = {
    id: `loy_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Alpha",
    tier: input.tier !== undefined ? input.tier : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('loyaltyhug', row, 300);
  appendAudit({
    actor,
    action: 'loyaltyhug.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLoyaltyhug(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('loyaltyhug', list);
  appendAudit({ actor, action: 'loyaltyhug.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function loyaltyhugSummary() {
  const list = listLoyaltyhug();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, loyaltyhug: list };
}
