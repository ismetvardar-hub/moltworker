/**
 * AŞAMA 351 — Mikro Segment.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('microseg', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'msg_1', segment: "Sunset VIP",
      size: "48", status: 'active', at: new Date().toISOString() }];
    writeCollection('microseg', seed);
    return seed;
  }
  return list;
}
export function listMicroseg(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMicroseg(input, actor = 'system') {
  const row = {
    id: `msg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    segment: input.segment !== undefined ? input.segment : "Sunset VIP",
    size: input.size !== undefined ? Number(input.size) || 0 : 48,
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('microseg', row, 300);
  appendAudit({
    actor,
    action: 'microseg.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMicroseg(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('microseg', list);
  appendAudit({ actor, action: 'microseg.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function microsegSummary() {
  const list = listMicroseg();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    cooling: list.filter((x) => x.status === 'cooling').length,
    retired: list.filter((x) => x.status === 'retired').length, microseg: list };
}
