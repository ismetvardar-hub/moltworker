/**
 * AŞAMA 972 — Surprise Gift.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('surprisegift2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sur_1', guestName: "Alpha",
      gift: "Beta", status: 'ok', at: new Date().toISOString() }];
    writeCollection('surprisegift2', seed);
    return seed;
  }
  return list;
}
export function listSurprisegift2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSurprisegift2(input, actor = 'system') {
  const row = {
    id: `sur_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Alpha",
    gift: input.gift !== undefined ? input.gift : "Beta",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('surprisegift2', row, 300);
  appendAudit({
    actor,
    action: 'surprisegift2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSurprisegift2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('surprisegift2', list);
  appendAudit({ actor, action: 'surprisegift2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function surprisegift2Summary() {
  const list = listSurprisegift2();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, surprisegift2: list };
}
