/**
 * AŞAMA 534 — Insight Board.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('insightboard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ins_1', insight: "ADR up",
      owner: "Rev", status: 'draft', at: new Date().toISOString() }];
    writeCollection('insightboard', seed);
    return seed;
  }
  return list;
}
export function listInsightboard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createInsightboard(input, actor = 'system') {
  const row = {
    id: `ins_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    insight: input.insight !== undefined ? input.insight : "ADR up",
    owner: input.owner !== undefined ? input.owner : "Rev",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('insightboard', row, 300);
  appendAudit({
    actor,
    action: 'insightboard.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateInsightboard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('insightboard', list);
  appendAudit({ actor, action: 'insightboard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function insightboardSummary() {
  const list = listInsightboard();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    published: list.filter((x) => x.status === 'published').length,
    archived: list.filter((x) => x.status === 'archived').length, insightboard: list };
}
