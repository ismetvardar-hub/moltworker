/**
 * AŞAMA 964 — Scent Mood.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('scentmood2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sce_1', zone: "Alpha",
      scent: "Beta", status: 'ok', at: new Date().toISOString() }];
    writeCollection('scentmood2', seed);
    return seed;
  }
  return list;
}
export function listScentmood2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createScentmood2(input, actor = 'system') {
  const row = {
    id: `sce_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Alpha",
    scent: input.scent !== undefined ? input.scent : "Beta",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('scentmood2', row, 300);
  appendAudit({
    actor,
    action: 'scentmood2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateScentmood2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('scentmood2', list);
  appendAudit({ actor, action: 'scentmood2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function scentmood2Summary() {
  const list = listScentmood2();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, scentmood2: list };
}
