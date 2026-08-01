/**
 * AŞAMA 861 — NPS Deep.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('npsdeep', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'nps_1', segment: "Alpha",
      score: "5", status: 'green', at: new Date().toISOString() }];
    writeCollection('npsdeep', seed);
    return seed;
  }
  return list;
}
export function listNpsdeep(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createNpsdeep(input, actor = 'system') {
  const row = {
    id: `nps_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    segment: input.segment !== undefined ? input.segment : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('npsdeep', row, 300);
  appendAudit({
    actor,
    action: 'npsdeep.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateNpsdeep(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('npsdeep', list);
  appendAudit({ actor, action: 'npsdeep.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function npsdeepSummary() {
  const list = listNpsdeep();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, npsdeep: list };
}
