/**
 * AŞAMA 822 — Data Priv.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('datapriv', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dat_1', system: "Alpha",
      score: "5", status: 'ok', at: new Date().toISOString() }];
    writeCollection('datapriv', seed);
    return seed;
  }
  return list;
}
export function listDatapriv(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDatapriv(input, actor = 'system') {
  const row = {
    id: `dat_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    system: input.system !== undefined ? input.system : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('datapriv', row, 300);
  appendAudit({
    actor,
    action: 'datapriv.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDatapriv(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('datapriv', list);
  appendAudit({ actor, action: 'datapriv.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function dataprivSummary() {
  const list = listDatapriv();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, datapriv: list };
}
