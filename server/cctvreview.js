/**
 * AŞAMA 523 — CCTV Review.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('cctvreview', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ccv_1', cam: "Pier-1",
      window: "22:00", status: 'queued', at: new Date().toISOString() }];
    writeCollection('cctvreview', seed);
    return seed;
  }
  return list;
}
export function listCctvreview(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCctvreview(input, actor = 'system') {
  const row = {
    id: `ccv_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    cam: input.cam !== undefined ? input.cam : "Pier-1",
    window: input.window !== undefined ? input.window : "22:00",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('cctvreview', row, 300);
  appendAudit({
    actor,
    action: 'cctvreview.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCctvreview(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('cctvreview', list);
  appendAudit({ actor, action: 'cctvreview.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function cctvreviewSummary() {
  const list = listCctvreview();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    reviewing: list.filter((x) => x.status === 'reviewing').length,
    filed: list.filter((x) => x.status === 'filed').length, cctvreview: list };
}
