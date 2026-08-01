/**
 * AŞAMA 1029 — Ethics Line.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ethicsline2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'eth_1', report: "Alpha",
      severity: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('ethicsline2', seed);
    return seed;
  }
  return list;
}
export function listEthicsline2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEthicsline2(input, actor = 'system') {
  const row = {
    id: `eth_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    report: input.report !== undefined ? input.report : "Alpha",
    severity: input.severity !== undefined ? input.severity : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ethicsline2', row, 300);
  appendAudit({
    actor,
    action: 'ethicsline2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEthicsline2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ethicsline2', list);
  appendAudit({ actor, action: 'ethicsline2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ethicsline2Summary() {
  const list = listEthicsline2();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, ethicsline2: list };
}
