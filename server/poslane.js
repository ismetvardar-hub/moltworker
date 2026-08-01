/**
 * AŞAMA 659 — POS Lane.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('poslane', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'psl_1', lane: "3",
      queue: "4", status: 'open', at: new Date().toISOString() }];
    writeCollection('poslane', seed);
    return seed;
  }
  return list;
}
export function listPoslane(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPoslane(input, actor = 'system') {
  const row = {
    id: `psl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    lane: input.lane !== undefined ? input.lane : "3",
    queue: input.queue !== undefined ? Number(input.queue) || 0 : 4,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('poslane', row, 300);
  appendAudit({
    actor,
    action: 'poslane.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePoslane(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('poslane', list);
  appendAudit({ actor, action: 'poslane.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function poslaneSummary() {
  const list = listPoslane();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    slow: list.filter((x) => x.status === 'slow').length,
    closed: list.filter((x) => x.status === 'closed').length, poslane: list };
}
