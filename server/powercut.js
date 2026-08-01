/**
 * AŞAMA 838 — Power Cut.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('powercut', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pow_1', zone: "Alpha",
      mins: "5", status: 'draft', at: new Date().toISOString() }];
    writeCollection('powercut', seed);
    return seed;
  }
  return list;
}
export function listPowercut(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPowercut(input, actor = 'system') {
  const row = {
    id: `pow_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Alpha",
    mins: input.mins !== undefined ? Number(input.mins) || 0 : 5,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('powercut', row, 300);
  appendAudit({
    actor,
    action: 'powercut.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePowercut(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('powercut', list);
  appendAudit({ actor, action: 'powercut.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function powercutSummary() {
  const list = listPowercut();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, powercut: list };
}
