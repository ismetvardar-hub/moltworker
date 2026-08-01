/**
 * AŞAMA 857 — QA Sample.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('qasample', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'qas_1', sku: "Alpha",
      score: "5", status: 'ok', at: new Date().toISOString() }];
    writeCollection('qasample', seed);
    return seed;
  }
  return list;
}
export function listQasample(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createQasample(input, actor = 'system') {
  const row = {
    id: `qas_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sku: input.sku !== undefined ? input.sku : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('qasample', row, 300);
  appendAudit({
    actor,
    action: 'qasample.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateQasample(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('qasample', list);
  appendAudit({ actor, action: 'qasample.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function qasampleSummary() {
  const list = listQasample();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, qasample: list };
}
