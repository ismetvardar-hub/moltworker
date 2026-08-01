/**
 * AŞAMA 449 — Dawn Mode.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('dawnmode', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dnm_1', profile: "Soft wake",
      zone: "Spa", status: 'armed', at: new Date().toISOString() }];
    writeCollection('dawnmode', seed);
    return seed;
  }
  return list;
}
export function listDawnmode(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDawnmode(input, actor = 'system') {
  const row = {
    id: `dnm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    profile: input.profile !== undefined ? input.profile : "Soft wake",
    zone: input.zone !== undefined ? input.zone : "Spa",
    status: input.status || 'armed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('dawnmode', row, 300);
  appendAudit({
    actor,
    action: 'dawnmode.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDawnmode(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('dawnmode', list);
  appendAudit({ actor, action: 'dawnmode.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function dawnmodeSummary() {
  const list = listDawnmode();
  return { total: list.length, armed: list.filter((x) => x.status === 'armed').length,
    active: list.filter((x) => x.status === 'active').length,
    day: list.filter((x) => x.status === 'day').length, dawnmode: list };
}
