/**
 * AŞAMA 1069 — Rebate.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('rebate3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'reb_1', partner: "Alpha",
      amount: "5", status: 'queued', at: new Date().toISOString() }];
    writeCollection('rebate3', seed);
    return seed;
  }
  return list;
}
export function listRebate3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRebate3(input, actor = 'system') {
  const row = {
    id: `reb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    partner: input.partner !== undefined ? input.partner : "Alpha",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 5,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('rebate3', row, 300);
  appendAudit({
    actor,
    action: 'rebate3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRebate3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('rebate3', list);
  appendAudit({ actor, action: 'rebate3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function rebate3Summary() {
  const list = listRebate3();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, rebate3: list };
}
