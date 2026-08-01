/**
 * AŞAMA 897 — Crown Final.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('crownfinal', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cro_1', tier: "Alpha",
      status: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('crownfinal', seed);
    return seed;
  }
  return list;
}
export function listCrownfinal(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCrownfinal(input, actor = 'system') {
  const row = {
    id: `cro_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    tier: input.tier !== undefined ? input.tier : "Alpha",
    status: input.status !== undefined ? input.status : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('crownfinal', row, 300);
  appendAudit({
    actor,
    action: 'crownfinal.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCrownfinal(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('crownfinal', list);
  appendAudit({ actor, action: 'crownfinal.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function crownfinalSummary() {
  const list = listCrownfinal();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, crownfinal: list };
}
