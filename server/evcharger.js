/**
 * AŞAMA 688 — EV Charger.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('evcharger', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'evc_1', unit: "EV-3",
      kw: "22", status: 'free', at: new Date().toISOString() }];
    writeCollection('evcharger', seed);
    return seed;
  }
  return list;
}
export function listEvcharger(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEvcharger(input, actor = 'system') {
  const row = {
    id: `evc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    unit: input.unit !== undefined ? input.unit : "EV-3",
    kw: input.kw !== undefined ? Number(input.kw) || 0 : 22,
    status: input.status || 'free',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('evcharger', row, 300);
  appendAudit({
    actor,
    action: 'evcharger.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEvcharger(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('evcharger', list);
  appendAudit({ actor, action: 'evcharger.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function evchargerSummary() {
  const list = listEvcharger();
  return { total: list.length, free: list.filter((x) => x.status === 'free').length,
    charging: list.filter((x) => x.status === 'charging').length,
    fault: list.filter((x) => x.status === 'fault').length, evcharger: list };
}
