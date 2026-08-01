/**
 * AŞAMA 466 — Spa Flow.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('spaflow', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'spf_1', cabin: "S-3",
      guestName: "Misafir", status: 'booked', at: new Date().toISOString() }];
    writeCollection('spaflow', seed);
    return seed;
  }
  return list;
}
export function listSpaflow(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSpaflow(input, actor = 'system') {
  const row = {
    id: `spf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    cabin: input.cabin !== undefined ? input.cabin : "S-3",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('spaflow', row, 300);
  appendAudit({
    actor,
    action: 'spaflow.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSpaflow(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('spaflow', list);
  appendAudit({ actor, action: 'spaflow.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function spaflowSummary() {
  const list = listSpaflow();
  return { total: list.length, booked: list.filter((x) => x.status === 'booked').length,
    in_cabin: list.filter((x) => x.status === 'in_cabin').length,
    done: list.filter((x) => x.status === 'done').length, spaflow: list };
}
