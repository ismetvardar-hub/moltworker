/**
 * AŞAMA 202 — Kalabalık Kontrol.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('crowdctrl', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'crc_1', zone: "Sahil",
      staff: "4", status: 'standby', at: new Date().toISOString() }];
    writeCollection('crowdctrl', seed);
    return seed;
  }
  return list;
}
export function listCrowdctrl(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCrowdctrl(input, actor = 'system') {
  const row = {
    id: `crc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Sahil",
    staff: input.staff !== undefined ? Number(input.staff) || 0 : 4,
    status: input.status || 'standby',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('crowdctrl', row, 300);
  appendAudit({ actor, action: 'crowdctrl.create', detail: String(row.title || row.guestName || row.childName || row.name || row.zone || row.point || row.location || row.unit || row.area || row.channel || row.gate || row.code || row.id), meta: { id: row.id } });
  return row;
}
export function updateCrowdctrl(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('crowdctrl', list);
  appendAudit({ actor, action: 'crowdctrl.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function crowdctrlSummary() {
  const list = listCrowdctrl();
  return { total: list.length, standby: list.filter((x) => x.status === 'standby').length,
    active: list.filter((x) => x.status === 'active').length,
    standdown: list.filter((x) => x.status === 'standdown').length, crowdctrl: list };
}
