/**
 * AŞAMA 827 — DR Plan.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('drplan', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'drp_1', system: "Alpha",
      rto: "5", status: 'green', at: new Date().toISOString() }];
    writeCollection('drplan', seed);
    return seed;
  }
  return list;
}
export function listDrplan(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDrplan(input, actor = 'system') {
  const row = {
    id: `drp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    system: input.system !== undefined ? input.system : "Alpha",
    rto: input.rto !== undefined ? Number(input.rto) || 0 : 5,
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('drplan', row, 300);
  appendAudit({
    actor,
    action: 'drplan.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDrplan(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('drplan', list);
  appendAudit({ actor, action: 'drplan.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function drplanSummary() {
  const list = listDrplan();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, drplan: list };
}
