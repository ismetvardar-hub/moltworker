/**
 * AŞAMA 562 — A/B Copy.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('abcopy', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'abc_1', headline: "Escape south",
      variant: "B", status: 'testing', at: new Date().toISOString() }];
    writeCollection('abcopy', seed);
    return seed;
  }
  return list;
}
export function listAbcopy(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAbcopy(input, actor = 'system') {
  const row = {
    id: `abc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    headline: input.headline !== undefined ? input.headline : "Escape south",
    variant: input.variant !== undefined ? input.variant : "B",
    status: input.status || 'testing',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('abcopy', row, 300);
  appendAudit({
    actor,
    action: 'abcopy.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAbcopy(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('abcopy', list);
  appendAudit({ actor, action: 'abcopy.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function abcopySummary() {
  const list = listAbcopy();
  return { total: list.length, testing: list.filter((x) => x.status === 'testing').length,
    winner: list.filter((x) => x.status === 'winner').length,
    archived: list.filter((x) => x.status === 'archived').length, abcopy: list };
}
