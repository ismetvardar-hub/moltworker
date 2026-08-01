/**
 * AŞAMA 743 — Brand Heat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('brandheat', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bra_1', brand: "Alpha",
      score: "5", status: 'queued', at: new Date().toISOString() }];
    writeCollection('brandheat', seed);
    return seed;
  }
  return list;
}
export function listBrandheat(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBrandheat(input, actor = 'system') {
  const row = {
    id: `bra_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    brand: input.brand !== undefined ? input.brand : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('brandheat', row, 300);
  appendAudit({
    actor,
    action: 'brandheat.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBrandheat(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('brandheat', list);
  appendAudit({ actor, action: 'brandheat.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function brandheatSummary() {
  const list = listBrandheat();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, brandheat: list };
}
