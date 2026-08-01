/**
 * AŞAMA 800 — Hypothesis.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('hypothesis', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'hyp_1', claim: "Alpha",
      confidence: "5", status: 'idle', at: new Date().toISOString() }];
    writeCollection('hypothesis', seed);
    return seed;
  }
  return list;
}
export function listHypothesis(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHypothesis(input, actor = 'system') {
  const row = {
    id: `hyp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    claim: input.claim !== undefined ? input.claim : "Alpha",
    confidence: input.confidence !== undefined ? Number(input.confidence) || 0 : 5,
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('hypothesis', row, 300);
  appendAudit({
    actor,
    action: 'hypothesis.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateHypothesis(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('hypothesis', list);
  appendAudit({ actor, action: 'hypothesis.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function hypothesisSummary() {
  const list = listHypothesis();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, hypothesis: list };
}
