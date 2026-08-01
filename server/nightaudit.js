/**
 * AŞAMA 616 — Night Audit.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('nightaudit', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'naud_1', step: "Post room",
      owner: "FO", status: 'pending', at: new Date().toISOString() }];
    writeCollection('nightaudit', seed);
    return seed;
  }
  return list;
}
export function listNightaudit(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createNightaudit(input, actor = 'system') {
  const row = {
    id: `naud_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    step: input.step !== undefined ? input.step : "Post room",
    owner: input.owner !== undefined ? input.owner : "FO",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('nightaudit', row, 300);
  appendAudit({
    actor,
    action: 'nightaudit.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateNightaudit(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('nightaudit', list);
  appendAudit({ actor, action: 'nightaudit.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function nightauditSummary() {
  const list = listNightaudit();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, nightaudit: list };
}
