/**
 * AŞAMA 350 — Yolculuk Haritası.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('journeymap', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'jrn_1', step: "Check-in",
      guestName: "Misafir", status: 'planned', at: new Date().toISOString() }];
    writeCollection('journeymap', seed);
    return seed;
  }
  return list;
}
export function listJourneymap(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createJourneymap(input, actor = 'system') {
  const row = {
    id: `jrn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    step: input.step !== undefined ? input.step : "Check-in",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('journeymap', row, 300);
  appendAudit({
    actor,
    action: 'journeymap.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateJourneymap(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('journeymap', list);
  appendAudit({ actor, action: 'journeymap.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function journeymapSummary() {
  const list = listJourneymap();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    live: list.filter((x) => x.status === 'live').length,
    done: list.filter((x) => x.status === 'done').length, journeymap: list };
}
