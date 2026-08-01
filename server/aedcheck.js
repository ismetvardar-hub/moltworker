/**
 * AŞAMA 200 — AED Kontrol.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('aedcheck', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'aed_1', unit: "AED-1",
      location: "Lobby", status: 'ok', at: new Date().toISOString() }];
    writeCollection('aedcheck', seed);
    return seed;
  }
  return list;
}
export function listAedcheck(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAedcheck(input, actor = 'system') {
  const row = {
    id: `aed_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    unit: input.unit !== undefined ? input.unit : "AED-1",
    location: input.location !== undefined ? input.location : "Lobby",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('aedcheck', row, 300);
  appendAudit({ actor, action: 'aedcheck.create', detail: String(row.title || row.guestName || row.childName || row.name || row.zone || row.point || row.location || row.unit || row.area || row.channel || row.gate || row.code || row.id), meta: { id: row.id } });
  return row;
}
export function updateAedcheck(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('aedcheck', list);
  appendAudit({ actor, action: 'aedcheck.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function aedcheckSummary() {
  const list = listAedcheck();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    service: list.filter((x) => x.status === 'service').length,
    missing: list.filter((x) => x.status === 'missing').length, aedcheck: list };
}
