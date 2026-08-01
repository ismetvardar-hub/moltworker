/**
 * AŞAMA 513 — Hazard Note.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('hazardnote', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'hzd_1', hazard: "Loose railing",
      zone: "Pier", status: 'noted', at: new Date().toISOString() }];
    writeCollection('hazardnote', seed);
    return seed;
  }
  return list;
}
export function listHazardnote(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHazardnote(input, actor = 'system') {
  const row = {
    id: `hzd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    hazard: input.hazard !== undefined ? input.hazard : "Loose railing",
    zone: input.zone !== undefined ? input.zone : "Pier",
    status: input.status || 'noted',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('hazardnote', row, 300);
  appendAudit({
    actor,
    action: 'hazardnote.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateHazardnote(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('hazardnote', list);
  appendAudit({ actor, action: 'hazardnote.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function hazardnoteSummary() {
  const list = listHazardnote();
  return { total: list.length, noted: list.filter((x) => x.status === 'noted').length,
    tagged: list.filter((x) => x.status === 'tagged').length,
    fixed: list.filter((x) => x.status === 'fixed').length, hazardnote: list };
}
