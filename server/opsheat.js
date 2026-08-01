/**
 * AŞAMA 741 — Ops Heat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('opsheat', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ops_1', zone: "Alpha",
      score: "5", status: 'green', at: new Date().toISOString() }];
    writeCollection('opsheat', seed);
    return seed;
  }
  return list;
}
export function listOpsheat(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createOpsheat(input, actor = 'system') {
  const row = {
    id: `ops_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('opsheat', row, 300);
  appendAudit({
    actor,
    action: 'opsheat.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateOpsheat(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('opsheat', list);
  appendAudit({ actor, action: 'opsheat.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function opsheatSummary() {
  const list = listOpsheat();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, opsheat: list };
}
