/**
 * AŞAMA 543 — Point Ledger.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pointledger', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ptl_1', guestName: "Misafir",
      points: "500", status: 'earn', at: new Date().toISOString() }];
    writeCollection('pointledger', seed);
    return seed;
  }
  return list;
}
export function listPointledger(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPointledger(input, actor = 'system') {
  const row = {
    id: `ptl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    points: input.points !== undefined ? Number(input.points) || 0 : 500,
    status: input.status || 'earn',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pointledger', row, 300);
  appendAudit({
    actor,
    action: 'pointledger.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePointledger(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pointledger', list);
  appendAudit({ actor, action: 'pointledger.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pointledgerSummary() {
  const list = listPointledger();
  return { total: list.length, earn: list.filter((x) => x.status === 'earn').length,
    burn: list.filter((x) => x.status === 'burn').length,
    expire: list.filter((x) => x.status === 'expire').length, pointledger: list };
}
