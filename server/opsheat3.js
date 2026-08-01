/**
 * AŞAMA 1101 — Ops Heat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('opsheat3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ops_1', zone: "Alpha",
      score: "5", status: 'green', at: new Date().toISOString() }];
    writeCollection('opsheat3', seed);
    return seed;
  }
  return list;
}
export function listOpsheat3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createOpsheat3(input, actor = 'system') {
  const row = {
    id: `ops_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('opsheat3', row, 300);
  appendAudit({
    actor,
    action: 'opsheat3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateOpsheat3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('opsheat3', list);
  appendAudit({ actor, action: 'opsheat3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function opsheat3Summary() {
  const list = listOpsheat3();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, opsheat3: list };
}
