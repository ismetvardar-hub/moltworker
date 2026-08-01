/**
 * AŞAMA 412 — Reef Guard.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('reefguard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rfg_1', sector: "East reef",
      note: "Normal", status: 'ok', at: new Date().toISOString() }];
    writeCollection('reefguard', seed);
    return seed;
  }
  return list;
}
export function listReefguard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createReefguard(input, actor = 'system') {
  const row = {
    id: `rfg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    sector: input.sector !== undefined ? input.sector : "East reef",
    note: input.note !== undefined ? input.note : "Normal",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('reefguard', row, 300);
  appendAudit({
    actor,
    action: 'reefguard.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateReefguard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('reefguard', list);
  appendAudit({ actor, action: 'reefguard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function reefguardSummary() {
  const list = listReefguard();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    stress: list.filter((x) => x.status === 'stress').length,
    alert: list.filter((x) => x.status === 'alert').length, reefguard: list };
}
