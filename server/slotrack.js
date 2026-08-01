/**
 * AŞAMA 366 — SLO Track.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('slotrack', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'slo_1', service: "Pass admit",
      target: "99.5", status: 'met', at: new Date().toISOString() }];
    writeCollection('slotrack', seed);
    return seed;
  }
  return list;
}
export function listSlotrack(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSlotrack(input, actor = 'system') {
  const row = {
    id: `slo_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    service: input.service !== undefined ? input.service : "Pass admit",
    target: input.target !== undefined ? Number(input.target) || 0 : 99.5,
    status: input.status || 'met',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('slotrack', row, 300);
  appendAudit({
    actor,
    action: 'slotrack.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSlotrack(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('slotrack', list);
  appendAudit({ actor, action: 'slotrack.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function slotrackSummary() {
  const list = listSlotrack();
  return { total: list.length, met: list.filter((x) => x.status === 'met').length,
    at_risk: list.filter((x) => x.status === 'at_risk').length,
    breached: list.filter((x) => x.status === 'breached').length, slotrack: list };
}
