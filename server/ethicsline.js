/**
 * AŞAMA 819 — Ethics Line.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ethicsline', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'eth_1', report: "Alpha",
      severity: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('ethicsline', seed);
    return seed;
  }
  return list;
}
export function listEthicsline(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEthicsline(input, actor = 'system') {
  const row = {
    id: `eth_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    report: input.report !== undefined ? input.report : "Alpha",
    severity: input.severity !== undefined ? input.severity : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ethicsline', row, 300);
  appendAudit({
    actor,
    action: 'ethicsline.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEthicsline(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ethicsline', list);
  appendAudit({ actor, action: 'ethicsline.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ethicslineSummary() {
  const list = listEthicsline();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, ethicsline: list };
}
