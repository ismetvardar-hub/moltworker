/**
 * AŞAMA 626 — VIP Arrive.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('viparrive', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'vpa_1', guestName: "Misafir",
      handler: "GM", status: 'prep', at: new Date().toISOString() }];
    writeCollection('viparrive', seed);
    return seed;
  }
  return list;
}
export function listViparrive(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createViparrive(input, actor = 'system') {
  const row = {
    id: `vpa_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    handler: input.handler !== undefined ? input.handler : "GM",
    status: input.status || 'prep',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('viparrive', row, 300);
  appendAudit({
    actor,
    action: 'viparrive.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateViparrive(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('viparrive', list);
  appendAudit({ actor, action: 'viparrive.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function viparriveSummary() {
  const list = listViparrive();
  return { total: list.length, prep: list.filter((x) => x.status === 'prep').length,
    greeted: list.filter((x) => x.status === 'greeted').length,
    settled: list.filter((x) => x.status === 'settled').length, viparrive: list };
}
