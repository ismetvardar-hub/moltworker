/**
 * AŞAMA 431 — Kılavuzluk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pilotage', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'plt_1', vessel: "Supply-1",
      pilot: "Ali", status: 'requested', at: new Date().toISOString() }];
    writeCollection('pilotage', seed);
    return seed;
  }
  return list;
}
export function listPilotage(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPilotage(input, actor = 'system') {
  const row = {
    id: `plt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    vessel: input.vessel !== undefined ? input.vessel : "Supply-1",
    pilot: input.pilot !== undefined ? input.pilot : "Ali",
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pilotage', row, 300);
  appendAudit({
    actor,
    action: 'pilotage.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePilotage(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pilotage', list);
  appendAudit({ actor, action: 'pilotage.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pilotageSummary() {
  const list = listPilotage();
  return { total: list.length, requested: list.filter((x) => x.status === 'requested').length,
    boarding: list.filter((x) => x.status === 'boarding').length,
    done: list.filter((x) => x.status === 'done').length, pilotage: list };
}
