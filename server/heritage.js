/**
 * AŞAMA 879 — Heritage.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('heritage', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'her_1', asset: "Alpha",
      era: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('heritage', seed);
    return seed;
  }
  return list;
}
export function listHeritage(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHeritage(input, actor = 'system') {
  const row = {
    id: `her_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    asset: input.asset !== undefined ? input.asset : "Alpha",
    era: input.era !== undefined ? input.era : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('heritage', row, 300);
  appendAudit({
    actor,
    action: 'heritage.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateHeritage(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('heritage', list);
  appendAudit({ actor, action: 'heritage.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function heritageSummary() {
  const list = listHeritage();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, heritage: list };
}
