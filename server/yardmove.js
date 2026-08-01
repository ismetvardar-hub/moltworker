/**
 * AŞAMA 426 — Saha Hamle.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('yardmove', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ymv_1', from: "A1",
      to: "C3", status: 'queued', at: new Date().toISOString() }];
    writeCollection('yardmove', seed);
    return seed;
  }
  return list;
}
export function listYardmove(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createYardmove(input, actor = 'system') {
  const row = {
    id: `ymv_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    from: input.from !== undefined ? input.from : "A1",
    to: input.to !== undefined ? input.to : "C3",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('yardmove', row, 300);
  appendAudit({
    actor,
    action: 'yardmove.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateYardmove(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('yardmove', list);
  appendAudit({ actor, action: 'yardmove.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function yardmoveSummary() {
  const list = listYardmove();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    moving: list.filter((x) => x.status === 'moving').length,
    done: list.filter((x) => x.status === 'done').length, yardmove: list };
}
