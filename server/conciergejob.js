/**
 * AŞAMA 629 — Concierge Job.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('conciergejob', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cnj_1', job: "Restaurant",
      guestName: "Misafir", status: 'open', at: new Date().toISOString() }];
    writeCollection('conciergejob', seed);
    return seed;
  }
  return list;
}
export function listConciergejob(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createConciergejob(input, actor = 'system') {
  const row = {
    id: `cnj_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    job: input.job !== undefined ? input.job : "Restaurant",
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('conciergejob', row, 300);
  appendAudit({
    actor,
    action: 'conciergejob.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateConciergejob(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('conciergejob', list);
  appendAudit({ actor, action: 'conciergejob.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function conciergejobSummary() {
  const list = listConciergejob();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    working: list.filter((x) => x.status === 'working').length,
    done: list.filter((x) => x.status === 'done').length, conciergejob: list };
}
