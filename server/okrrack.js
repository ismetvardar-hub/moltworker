/**
 * AŞAMA 392 — OKR Rack.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('okrrack', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'okr_1', objective: "NPS +10",
      kr: "Survey 500", status: 'on_track', at: new Date().toISOString() }];
    writeCollection('okrrack', seed);
    return seed;
  }
  return list;
}
export function listOkrrack(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createOkrrack(input, actor = 'system') {
  const row = {
    id: `okr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    objective: input.objective !== undefined ? input.objective : "NPS +10",
    kr: input.kr !== undefined ? input.kr : "Survey 500",
    status: input.status || 'on_track',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('okrrack', row, 300);
  appendAudit({
    actor,
    action: 'okrrack.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateOkrrack(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('okrrack', list);
  appendAudit({ actor, action: 'okrrack.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function okrrackSummary() {
  const list = listOkrrack();
  return { total: list.length, on_track: list.filter((x) => x.status === 'on_track').length,
    at_risk: list.filter((x) => x.status === 'at_risk').length,
    missed: list.filter((x) => x.status === 'missed').length, okrrack: list };
}
