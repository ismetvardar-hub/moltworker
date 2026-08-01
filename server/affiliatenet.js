/**
 * AŞAMA 671 — Affiliate Net.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('affiliatenet', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'afn_1', partner: "Travel blog",
      code: "LYK10", status: 'active', at: new Date().toISOString() }];
    writeCollection('affiliatenet', seed);
    return seed;
  }
  return list;
}
export function listAffiliatenet(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAffiliatenet(input, actor = 'system') {
  const row = {
    id: `afn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    partner: input.partner !== undefined ? input.partner : "Travel blog",
    code: input.code !== undefined ? input.code : "LYK10",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('affiliatenet', row, 300);
  appendAudit({
    actor,
    action: 'affiliatenet.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAffiliatenet(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('affiliatenet', list);
  appendAudit({ actor, action: 'affiliatenet.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function affiliatenetSummary() {
  const list = listAffiliatenet();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    paused: list.filter((x) => x.status === 'paused').length,
    banned: list.filter((x) => x.status === 'banned').length, affiliatenet: list };
}
