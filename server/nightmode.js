/**
 * AŞAMA 448 — Night Mode.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('nightmode', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ngm_1', profile: "Quiet hours",
      zone: "Residences", status: 'armed', at: new Date().toISOString() }];
    writeCollection('nightmode', seed);
    return seed;
  }
  return list;
}
export function listNightmode(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createNightmode(input, actor = 'system') {
  const row = {
    id: `ngm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    profile: input.profile !== undefined ? input.profile : "Quiet hours",
    zone: input.zone !== undefined ? input.zone : "Residences",
    status: input.status || 'armed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('nightmode', row, 300);
  appendAudit({
    actor,
    action: 'nightmode.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateNightmode(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('nightmode', list);
  appendAudit({ actor, action: 'nightmode.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function nightmodeSummary() {
  const list = listNightmode();
  return { total: list.length, armed: list.filter((x) => x.status === 'armed').length,
    active: list.filter((x) => x.status === 'active').length,
    day: list.filter((x) => x.status === 'day').length, nightmode: list };
}
