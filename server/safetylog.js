/**
 * AŞAMA 511 — Safety Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('safetylog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sfl_1', zone: "Pool",
      note: "Wet floor", status: 'open', at: new Date().toISOString() }];
    writeCollection('safetylog', seed);
    return seed;
  }
  return list;
}
export function listSafetylog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSafetylog(input, actor = 'system') {
  const row = {
    id: `sfl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Pool",
    note: input.note !== undefined ? input.note : "Wet floor",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('safetylog', row, 300);
  appendAudit({
    actor,
    action: 'safetylog.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSafetylog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('safetylog', list);
  appendAudit({ actor, action: 'safetylog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function safetylogSummary() {
  const list = listSafetylog();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    mitigated: list.filter((x) => x.status === 'mitigated').length,
    closed: list.filter((x) => x.status === 'closed').length, safetylog: list };
}
