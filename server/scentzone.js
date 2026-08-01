/**
 * AŞAMA 439 — Koku Zone.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('scentzone', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'scz_1', zone: "Lobby",
      scent: "Citrus", status: 'on', at: new Date().toISOString() }];
    writeCollection('scentzone', seed);
    return seed;
  }
  return list;
}
export function listScentzone(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createScentzone(input, actor = 'system') {
  const row = {
    id: `scz_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Lobby",
    scent: input.scent !== undefined ? input.scent : "Citrus",
    status: input.status || 'on',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('scentzone', row, 300);
  appendAudit({
    actor,
    action: 'scentzone.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateScentzone(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('scentzone', list);
  appendAudit({ actor, action: 'scentzone.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function scentzoneSummary() {
  const list = listScentzone();
  return { total: list.length, on: list.filter((x) => x.status === 'on').length,
    refill: list.filter((x) => x.status === 'refill').length,
    off: list.filter((x) => x.status === 'off').length, scentzone: list };
}
