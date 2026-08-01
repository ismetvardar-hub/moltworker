/**
 * AŞAMA 958 — Decision Hub.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('decisionhub2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dec_1', decision: "Alpha",
      owner: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('decisionhub2', seed);
    return seed;
  }
  return list;
}
export function listDecisionhub2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDecisionhub2(input, actor = 'system') {
  const row = {
    id: `dec_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    decision: input.decision !== undefined ? input.decision : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('decisionhub2', row, 300);
  appendAudit({
    actor,
    action: 'decisionhub2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDecisionhub2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('decisionhub2', list);
  appendAudit({ actor, action: 'decisionhub2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function decisionhub2Summary() {
  const list = listDecisionhub2();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, decisionhub2: list };
}
