/**
 * AŞAMA 416 — Kum Temizlik.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('sandclean', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sdc_1', zone: "Central",
      crew: "3", status: 'queued', at: new Date().toISOString() }];
    writeCollection('sandclean', seed);
    return seed;
  }
  return list;
}
export function listSandclean(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSandclean(input, actor = 'system') {
  const row = {
    id: `sdc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Central",
    crew: input.crew !== undefined ? Number(input.crew) || 0 : 3,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('sandclean', row, 300);
  appendAudit({
    actor,
    action: 'sandclean.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSandclean(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('sandclean', list);
  appendAudit({ actor, action: 'sandclean.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function sandcleanSummary() {
  const list = listSandclean();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, sandclean: list };
}
