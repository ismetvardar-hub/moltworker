/**
 * AŞAMA 479 — Wellness Kit.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('wellnesskit', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wlk_1', room: "508",
      kit: "Sleep", status: 'staged', at: new Date().toISOString() }];
    writeCollection('wellnesskit', seed);
    return seed;
  }
  return list;
}
export function listWellnesskit(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWellnesskit(input, actor = 'system') {
  const row = {
    id: `wlk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    room: input.room !== undefined ? input.room : "508",
    kit: input.kit !== undefined ? input.kit : "Sleep",
    status: input.status || 'staged',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wellnesskit', row, 300);
  appendAudit({
    actor,
    action: 'wellnesskit.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWellnesskit(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('wellnesskit', list);
  appendAudit({ actor, action: 'wellnesskit.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function wellnesskitSummary() {
  const list = listWellnesskit();
  return { total: list.length, staged: list.filter((x) => x.status === 'staged').length,
    delivered: list.filter((x) => x.status === 'delivered').length,
    returned: list.filter((x) => x.status === 'returned').length, wellnesskit: list };
}
