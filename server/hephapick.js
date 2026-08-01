/**
 * AŞAMA 633 — Hepha Pick.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('hephapick', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'hpk_1', order: "TY-10042",
      bin: "A-12", status: 'queued', at: new Date().toISOString() }];
    writeCollection('hephapick', seed);
    return seed;
  }
  return list;
}
export function listHephapick(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createHephapick(input, actor = 'system') {
  const row = {
    id: `hpk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    order: input.order !== undefined ? input.order : "TY-10042",
    bin: input.bin !== undefined ? input.bin : "A-12",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('hephapick', row, 300);
  appendAudit({
    actor,
    action: 'hephapick.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateHephapick(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('hephapick', list);
  appendAudit({ actor, action: 'hephapick.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function hephapickSummary() {
  const list = listHephapick();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    picking: list.filter((x) => x.status === 'picking').length,
    packed: list.filter((x) => x.status === 'packed').length,
    shipped: list.filter((x) => x.status === 'shipped').length, hephapick: list };
}
