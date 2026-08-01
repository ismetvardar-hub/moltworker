/**
 * AŞAMA 396 — Cap Notes.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('captable', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cap_1', note: "Seed option",
      holder: "Founder", status: 'active', at: new Date().toISOString() }];
    writeCollection('captable', seed);
    return seed;
  }
  return list;
}
export function listCaptable(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCaptable(input, actor = 'system') {
  const row = {
    id: `cap_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    note: input.note !== undefined ? input.note : "Seed option",
    holder: input.holder !== undefined ? input.holder : "Founder",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('captable', row, 300);
  appendAudit({
    actor,
    action: 'captable.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateCaptable(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('captable', list);
  appendAudit({ actor, action: 'captable.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function captableSummary() {
  const list = listCaptable();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    vesting: list.filter((x) => x.status === 'vesting').length,
    closed: list.filter((x) => x.status === 'closed').length, captable: list };
}
