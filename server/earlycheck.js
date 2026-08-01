/**
 * AŞAMA 620 — Early Check.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('earlycheck', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'eck_1', guestName: "Misafir",
      eta: "11:00", status: 'requested', at: new Date().toISOString() }];
    writeCollection('earlycheck', seed);
    return seed;
  }
  return list;
}
export function listEarlycheck(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEarlycheck(input, actor = 'system') {
  const row = {
    id: `eck_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    eta: input.eta !== undefined ? input.eta : "11:00",
    status: input.status || 'requested',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('earlycheck', row, 300);
  appendAudit({
    actor,
    action: 'earlycheck.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEarlycheck(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('earlycheck', list);
  appendAudit({ actor, action: 'earlycheck.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function earlycheckSummary() {
  const list = listEarlycheck();
  return { total: list.length, requested: list.filter((x) => x.status === 'requested').length,
    approved: list.filter((x) => x.status === 'approved').length,
    denied: list.filter((x) => x.status === 'denied').length, earlycheck: list };
}
