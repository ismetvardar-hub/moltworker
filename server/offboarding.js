/**
 * AŞAMA 257 — Offboarding.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('offboarding', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ofb_1', employee: "Ali",
      reason: "İstifa", status: 'started', at: new Date().toISOString() }];
    writeCollection('offboarding', seed);
    return seed;
  }
  return list;
}
export function listOffboarding(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createOffboarding(input, actor = 'system') {
  const row = {
    id: `ofb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    employee: input.employee !== undefined ? input.employee : "Ali",
    reason: input.reason !== undefined ? input.reason : "İstifa",
    status: input.status || 'started',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('offboarding', row, 300);
  appendAudit({ actor, action: 'offboarding.create', detail: String(row.title || row.employee || row.candidate || row.fromEmp || row.topic || row.zone || row.award || row.cert || row.language || row.id), meta: { id: row.id } });
  return row;
}
export function updateOffboarding(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('offboarding', list);
  appendAudit({ actor, action: 'offboarding.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function offboardingSummary() {
  const list = listOffboarding();
  return { total: list.length, started: list.filter((x) => x.status === 'started').length,
    clearance: list.filter((x) => x.status === 'clearance').length,
    closed: list.filter((x) => x.status === 'closed').length, offboarding: list };
}
