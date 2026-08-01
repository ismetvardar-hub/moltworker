/**
 * AŞAMA 443 — Immersive.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('immersive', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'imm_1', experience: "Underwater tale",
      pax: "20", status: 'booked', at: new Date().toISOString() }];
    writeCollection('immersive', seed);
    return seed;
  }
  return list;
}
export function listImmersive(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createImmersive(input, actor = 'system') {
  const row = {
    id: `imm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    experience: input.experience !== undefined ? input.experience : "Underwater tale",
    pax: input.pax !== undefined ? Number(input.pax) || 0 : 20,
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('immersive', row, 300);
  appendAudit({
    actor,
    action: 'immersive.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateImmersive(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('immersive', list);
  appendAudit({ actor, action: 'immersive.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function immersiveSummary() {
  const list = listImmersive();
  return { total: list.length, booked: list.filter((x) => x.status === 'booked').length,
    running: list.filter((x) => x.status === 'running').length,
    ended: list.filter((x) => x.status === 'ended').length, immersive: list };
}
