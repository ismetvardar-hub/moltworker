/**
 * AŞAMA 726 — Cold Chain+.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('coldchain2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'col_1', unit: "Alpha",
      tempC: "5", status: 'queued', at: new Date().toISOString() }];
    writeCollection('coldchain2', seed);
    return seed;
  }
  return list;
}
export function listColdchain2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createColdchain2(input, actor = 'system') {
  const row = {
    id: `col_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    unit: input.unit !== undefined ? input.unit : "Alpha",
    tempC: input.tempC !== undefined ? Number(input.tempC) || 0 : 5,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('coldchain2', row, 300);
  appendAudit({
    actor,
    action: 'coldchain2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateColdchain2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('coldchain2', list);
  appendAudit({ actor, action: 'coldchain2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function coldchain2Summary() {
  const list = listColdchain2();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, coldchain2: list };
}
