/**
 * AŞAMA 365 — Decision Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('decisionlog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dcl_1', decision: "Open beach",
      by: "LİKYA-1", status: 'proposed', at: new Date().toISOString() }];
    writeCollection('decisionlog', seed);
    return seed;
  }
  return list;
}
export function listDecisionlog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDecisionlog(input, actor = 'system') {
  const row = {
    id: `dcl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    decision: input.decision !== undefined ? input.decision : "Open beach",
    by: input.by !== undefined ? input.by : "LİKYA-1",
    status: input.status || 'proposed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('decisionlog', row, 300);
  appendAudit({
    actor,
    action: 'decisionlog.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDecisionlog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('decisionlog', list);
  appendAudit({ actor, action: 'decisionlog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function decisionlogSummary() {
  const list = listDecisionlog();
  return { total: list.length, proposed: list.filter((x) => x.status === 'proposed').length,
    approved: list.filter((x) => x.status === 'approved').length,
    reversed: list.filter((x) => x.status === 'reversed').length, decisionlog: list };
}
