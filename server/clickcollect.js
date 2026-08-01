/**
 * AŞAMA 323 — Click & Collect.
 * Omni-Channel Operations & Autonomous Commerce.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('clickcollect', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'clc_1', order: "CC-01",
      pickup: "Beach Desk", status: 'ready', at: new Date().toISOString() }];
    writeCollection('clickcollect', seed);
    return seed;
  }
  return list;
}
export function listClickcollect(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createClickcollect(input, actor = 'system') {
  const row = {
    id: `clc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    order: input.order !== undefined ? input.order : "CC-01",
    pickup: input.pickup !== undefined ? input.pickup : "Beach Desk",
    status: input.status || 'ready',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('clickcollect', row, 300);
  appendAudit({
    actor,
    action: 'clickcollect.create',
    detail: String(row.title || row.guestName || row.terminal || row.sku || row.courier || row.session || row.treat || row.order || row.stop || row.code || row.gift || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateClickcollect(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('clickcollect', list);
  appendAudit({ actor, action: 'clickcollect.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function clickcollectSummary() {
  const list = listClickcollect();
  return { total: list.length, ready: list.filter((x) => x.status === 'ready').length,
    picked: list.filter((x) => x.status === 'picked').length,
    expired: list.filter((x) => x.status === 'expired').length, clickcollect: list };
}
