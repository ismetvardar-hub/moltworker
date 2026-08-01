/**
 * AŞAMA 539 — Decid Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('decidlog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dcl_1', decision: "Extend season",
      owner: "CEO", status: 'proposed', at: new Date().toISOString() }];
    writeCollection('decidlog', seed);
    return seed;
  }
  return list;
}
export function listDecidlog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDecidlog(input, actor = 'system') {
  const row = {
    id: `dcl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    decision: input.decision !== undefined ? input.decision : "Extend season",
    owner: input.owner !== undefined ? input.owner : "CEO",
    status: input.status || 'proposed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('decidlog', row, 300);
  appendAudit({
    actor,
    action: 'decidlog.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDecidlog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('decidlog', list);
  appendAudit({ actor, action: 'decidlog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function decidlogSummary() {
  const list = listDecidlog();
  return { total: list.length, proposed: list.filter((x) => x.status === 'proposed').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, decidlog: list };
}
