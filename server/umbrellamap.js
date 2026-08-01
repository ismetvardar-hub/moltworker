/**
 * AŞAMA 415 — Şemsiye Harita.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('umbrellamap', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'umb_1', row: "C",
      unit: "12", status: 'free', at: new Date().toISOString() }];
    writeCollection('umbrellamap', seed);
    return seed;
  }
  return list;
}
export function listUmbrellamap(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createUmbrellamap(input, actor = 'system') {
  const row = {
    id: `umb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    row: input.row !== undefined ? input.row : "C",
    unit: input.unit !== undefined ? input.unit : "12",
    status: input.status || 'free',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('umbrellamap', row, 300);
  appendAudit({
    actor,
    action: 'umbrellamap.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateUmbrellamap(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('umbrellamap', list);
  appendAudit({ actor, action: 'umbrellamap.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function umbrellamapSummary() {
  const list = listUmbrellamap();
  return { total: list.length, free: list.filter((x) => x.status === 'free').length,
    occupied: list.filter((x) => x.status === 'occupied').length,
    hold: list.filter((x) => x.status === 'hold').length, umbrellamap: list };
}
