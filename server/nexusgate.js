/**
 * AŞAMA 642 — NEXUS Gate.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('nexusgate', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'nxg_1', gate: "Arena-1",
      action: "Unlock", status: 'idle', at: new Date().toISOString() }];
    writeCollection('nexusgate', seed);
    return seed;
  }
  return list;
}
export function listNexusgate(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createNexusgate(input, actor = 'system') {
  const row = {
    id: `nxg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    gate: input.gate !== undefined ? input.gate : "Arena-1",
    action: input.action !== undefined ? input.action : "Unlock",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('nexusgate', row, 300);
  appendAudit({
    actor,
    action: 'nexusgate.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateNexusgate(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('nexusgate', list);
  appendAudit({ actor, action: 'nexusgate.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function nexusgateSummary() {
  const list = listNexusgate();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    open: list.filter((x) => x.status === 'open').length,
    locked: list.filter((x) => x.status === 'locked').length,
    fault: list.filter((x) => x.status === 'fault').length, nexusgate: list };
}
