/**
 * AŞAMA 173 — Haşere.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pestctrl', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pst_1', zone: "Mutfak",
      method: "Jel", status: 'scheduled', at: new Date().toISOString() }];
    writeCollection('pestctrl', seed);
    return seed;
  }
  return list;
}
export function listPestctrl(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPestctrl(input, actor = 'system') {
  const row = {
    id: `pst_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Mutfak",
    method: input.method !== undefined ? input.method : "Jel",
    status: input.status || 'scheduled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pestctrl', row, 300);
  appendAudit({ actor, action: 'pestctrl.create', detail: String(row.title || row.guestName || row.name || row.screen || row.point || row.beacon || row.gate || row.unit || row.tank || row.area || row.zone || row.pool || row.cabin || row.room || row.slot || row.therapy || row.id), meta: { id: row.id } });
  return row;
}
export function updatePestctrl(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pestctrl', list);
  appendAudit({ actor, action: 'pestctrl.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pestctrlSummary() {
  const list = listPestctrl();
  return { total: list.length, scheduled: list.filter((x) => x.status === 'scheduled').length,
    done: list.filter((x) => x.status === 'done').length,
    followup: list.filter((x) => x.status === 'followup').length, pestctrl: list };
}
