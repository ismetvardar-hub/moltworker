/**
 * AŞAMA 880 — Anniversary.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('anniversary', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ann_1', event: "Alpha",
      year: "5", status: 'queued', at: new Date().toISOString() }];
    writeCollection('anniversary', seed);
    return seed;
  }
  return list;
}
export function listAnniversary(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAnniversary(input, actor = 'system') {
  const row = {
    id: `ann_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    event: input.event !== undefined ? input.event : "Alpha",
    year: input.year !== undefined ? Number(input.year) || 0 : 5,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('anniversary', row, 300);
  appendAudit({
    actor,
    action: 'anniversary.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAnniversary(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('anniversary', list);
  appendAudit({ actor, action: 'anniversary.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function anniversarySummary() {
  const list = listAnniversary();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, anniversary: list };
}
