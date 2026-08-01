/**
 * AŞAMA 686 — Green Bond.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('greenbond', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'gbd_1', instrument: "GB-01",
      amount: "5000000", status: 'draft', at: new Date().toISOString() }];
    writeCollection('greenbond', seed);
    return seed;
  }
  return list;
}
export function listGreenbond(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGreenbond(input, actor = 'system') {
  const row = {
    id: `gbd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    instrument: input.instrument !== undefined ? input.instrument : "GB-01",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 5000000,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('greenbond', row, 300);
  appendAudit({
    actor,
    action: 'greenbond.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateGreenbond(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('greenbond', list);
  appendAudit({ actor, action: 'greenbond.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function greenbondSummary() {
  const list = listGreenbond();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    issued: list.filter((x) => x.status === 'issued').length,
    allocated: list.filter((x) => x.status === 'allocated').length, greenbond: list };
}
