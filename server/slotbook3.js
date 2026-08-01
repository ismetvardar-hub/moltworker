/**
 * AŞAMA 1087 — Slot Book.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('slotbook3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'slo_1', bay: "Alpha",
      slot: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('slotbook3', seed);
    return seed;
  }
  return list;
}
export function listSlotbook3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSlotbook3(input, actor = 'system') {
  const row = {
    id: `slo_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    bay: input.bay !== undefined ? input.bay : "Alpha",
    slot: input.slot !== undefined ? input.slot : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('slotbook3', row, 300);
  appendAudit({
    actor,
    action: 'slotbook3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSlotbook3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('slotbook3', list);
  appendAudit({ actor, action: 'slotbook3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function slotbook3Summary() {
  const list = listSlotbook3();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, slotbook3: list };
}
