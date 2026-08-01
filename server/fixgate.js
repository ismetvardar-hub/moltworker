/**
 * AŞAMA 868 — Form Gate.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('fixgate', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fix_1', form: "Alpha",
      version: "5", status: 'idle', at: new Date().toISOString() }];
    writeCollection('fixgate', seed);
    return seed;
  }
  return list;
}
export function listFixgate(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFixgate(input, actor = 'system') {
  const row = {
    id: `fix_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    form: input.form !== undefined ? input.form : "Alpha",
    version: input.version !== undefined ? Number(input.version) || 0 : 5,
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('fixgate', row, 300);
  appendAudit({
    actor,
    action: 'fixgate.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFixgate(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('fixgate', list);
  appendAudit({ actor, action: 'fixgate.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function fixgateSummary() {
  const list = listFixgate();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, fixgate: list };
}
