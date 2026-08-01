/**
 * AŞAMA 408 — Snorkel Bay.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('snorkelbay', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'snk_1', slot: "10:00",
      pax: "8", status: 'open', at: new Date().toISOString() }];
    writeCollection('snorkelbay', seed);
    return seed;
  }
  return list;
}
export function listSnorkelbay(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSnorkelbay(input, actor = 'system') {
  const row = {
    id: `snk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    slot: input.slot !== undefined ? input.slot : "10:00",
    pax: input.pax !== undefined ? Number(input.pax) || 0 : 8,
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('snorkelbay', row, 300);
  appendAudit({
    actor,
    action: 'snorkelbay.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSnorkelbay(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('snorkelbay', list);
  appendAudit({ actor, action: 'snorkelbay.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function snorkelbaySummary() {
  const list = listSnorkelbay();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    full: list.filter((x) => x.status === 'full').length,
    closed: list.filter((x) => x.status === 'closed').length, snorkelbay: list };
}
