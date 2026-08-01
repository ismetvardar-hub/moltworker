/**
 * AŞAMA 596 — Transfer Job.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('transferjob', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'trj_1', guestName: "Misafir",
      flight: "TK2430", status: 'booked', at: new Date().toISOString() }];
    writeCollection('transferjob', seed);
    return seed;
  }
  return list;
}
export function listTransferjob(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTransferjob(input, actor = 'system') {
  const row = {
    id: `trj_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    flight: input.flight !== undefined ? input.flight : "TK2430",
    status: input.status || 'booked',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('transferjob', row, 300);
  appendAudit({
    actor,
    action: 'transferjob.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTransferjob(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('transferjob', list);
  appendAudit({ actor, action: 'transferjob.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function transferjobSummary() {
  const list = listTransferjob();
  return { total: list.length, booked: list.filter((x) => x.status === 'booked').length,
    assigned: list.filter((x) => x.status === 'assigned').length,
    done: list.filter((x) => x.status === 'done').length, transferjob: list };
}
