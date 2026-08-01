/**
 * AŞAMA 386 — Beat Revenue.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('beatrevenue', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'btr_1', metric: "F&B",
      deltaPct: "6", status: 'above', at: new Date().toISOString() }];
    writeCollection('beatrevenue', seed);
    return seed;
  }
  return list;
}
export function listBeatrevenue(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBeatrevenue(input, actor = 'system') {
  const row = {
    id: `btr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    metric: input.metric !== undefined ? input.metric : "F&B",
    deltaPct: input.deltaPct !== undefined ? Number(input.deltaPct) || 0 : 6,
    status: input.status || 'above',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('beatrevenue', row, 300);
  appendAudit({
    actor,
    action: 'beatrevenue.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBeatrevenue(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('beatrevenue', list);
  appendAudit({ actor, action: 'beatrevenue.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function beatrevenueSummary() {
  const list = listBeatrevenue();
  return { total: list.length, above: list.filter((x) => x.status === 'above').length,
    flat: list.filter((x) => x.status === 'flat').length,
    below: list.filter((x) => x.status === 'below').length, beatrevenue: list };
}
