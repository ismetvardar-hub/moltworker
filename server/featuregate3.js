/**
 * AŞAMA 1137 — Feature Gate.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('featuregate3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fea_1', flag: "Alpha",
      pct: "5", status: 'queued', at: new Date().toISOString() }];
    writeCollection('featuregate3', seed);
    return seed;
  }
  return list;
}
export function listFeaturegate3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFeaturegate3(input, actor = 'system') {
  const row = {
    id: `fea_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    flag: input.flag !== undefined ? input.flag : "Alpha",
    pct: input.pct !== undefined ? Number(input.pct) || 0 : 5,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('featuregate3', row, 300);
  appendAudit({
    actor,
    action: 'featuregate3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFeaturegate3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('featuregate3', list);
  appendAudit({ actor, action: 'featuregate3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function featuregate3Summary() {
  const list = listFeaturegate3();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, featuregate3: list };
}
