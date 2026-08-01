/**
 * AŞAMA 272 — Su Denetim.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('wateraudit', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wau_1', zone: "Havuz",
      m3: "120", status: 'ok', at: new Date().toISOString() }];
    writeCollection('wateraudit', seed);
    return seed;
  }
  return list;
}
export function listWateraudit(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWateraudit(input, actor = 'system') {
  const row = {
    id: `wau_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Havuz",
    m3: input.m3 !== undefined ? Number(input.m3) || 0 : 120,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wateraudit', row, 300);
  appendAudit({ actor, action: 'wateraudit.create', detail: String(row.title || row.name || row.source || row.zone || row.array || row.species || row.material || row.finding || row.policy || row.request || row.dataset || row.user || row.vendor || row.matter || row.id), meta: { id: row.id } });
  return row;
}
export function updateWateraudit(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('wateraudit', list);
  appendAudit({ actor, action: 'wateraudit.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function waterauditSummary() {
  const list = listWateraudit();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    leak: list.filter((x) => x.status === 'leak').length,
    critical: list.filter((x) => x.status === 'critical').length, wateraudit: list };
}
