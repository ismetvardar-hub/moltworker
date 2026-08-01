/**
 * AŞAMA 344 — Sat Link.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('satlink', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sat_1', terminal: "SAT-1",
      snr: "14", status: 'standby', at: new Date().toISOString() }];
    writeCollection('satlink', seed);
    return seed;
  }
  return list;
}
export function listSatlink(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSatlink(input, actor = 'system') {
  const row = {
    id: `sat_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    terminal: input.terminal !== undefined ? input.terminal : "SAT-1",
    snr: input.snr !== undefined ? Number(input.snr) || 0 : 14,
    status: input.status || 'standby',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('satlink', row, 300);
  appendAudit({
    actor,
    action: 'satlink.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSatlink(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('satlink', list);
  appendAudit({ actor, action: 'satlink.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function satlinkSummary() {
  const list = listSatlink();
  return { total: list.length, standby: list.filter((x) => x.status === 'standby').length,
    online: list.filter((x) => x.status === 'online').length,
    fault: list.filter((x) => x.status === 'fault').length, satlink: list };
}
