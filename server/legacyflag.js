/**
 * AŞAMA 751 — Legacy Flag.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('legacyflag', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'leg_1', system: "Alpha",
      flag: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('legacyflag', seed);
    return seed;
  }
  return list;
}
export function listLegacyflag(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLegacyflag(input, actor = 'system') {
  const row = {
    id: `leg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    system: input.system !== undefined ? input.system : "Alpha",
    flag: input.flag !== undefined ? input.flag : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('legacyflag', row, 300);
  appendAudit({
    actor,
    action: 'legacyflag.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLegacyflag(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('legacyflag', list);
  appendAudit({ actor, action: 'legacyflag.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function legacyflagSummary() {
  const list = listLegacyflag();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, legacyflag: list };
}
