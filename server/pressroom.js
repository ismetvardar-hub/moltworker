/**
 * AŞAMA 668 — Press Room.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('pressroom', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'prs2_1', headline: "Season open",
      outlet: "AA", status: 'draft', at: new Date().toISOString() }];
    writeCollection('pressroom', seed);
    return seed;
  }
  return list;
}
export function listPressroom(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPressroom(input, actor = 'system') {
  const row = {
    id: `prs2_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    headline: input.headline !== undefined ? input.headline : "Season open",
    outlet: input.outlet !== undefined ? input.outlet : "AA",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('pressroom', row, 300);
  appendAudit({
    actor,
    action: 'pressroom.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePressroom(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('pressroom', list);
  appendAudit({ actor, action: 'pressroom.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function pressroomSummary() {
  const list = listPressroom();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    embargo: list.filter((x) => x.status === 'embargo').length,
    published: list.filter((x) => x.status === 'published').length, pressroom: list };
}
