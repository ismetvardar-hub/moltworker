/**
 * AŞAMA 538 — Scorecard.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('scorecard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'scd_1', kpi: "NPS",
      score: "72", status: 'green', at: new Date().toISOString() }];
    writeCollection('scorecard', seed);
    return seed;
  }
  return list;
}
export function listScorecard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createScorecard(input, actor = 'system') {
  const row = {
    id: `scd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    kpi: input.kpi !== undefined ? input.kpi : "NPS",
    score: input.score !== undefined ? Number(input.score) || 0 : 72,
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('scorecard', row, 300);
  appendAudit({
    actor,
    action: 'scorecard.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateScorecard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('scorecard', list);
  appendAudit({ actor, action: 'scorecard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function scorecardSummary() {
  const list = listScorecard();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, scorecard: list };
}
