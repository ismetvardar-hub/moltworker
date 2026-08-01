/**
 * AŞAMA 978 — Webhook Hub.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('webhookhub2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'web_1', url: "Alpha",
      event: "Beta", status: 'open', at: new Date().toISOString() }];
    writeCollection('webhookhub2', seed);
    return seed;
  }
  return list;
}
export function listWebhookhub2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWebhookhub2(input, actor = 'system') {
  const row = {
    id: `web_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    url: input.url !== undefined ? input.url : "Alpha",
    event: input.event !== undefined ? input.event : "Beta",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('webhookhub2', row, 300);
  appendAudit({
    actor,
    action: 'webhookhub2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateWebhookhub2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('webhookhub2', list);
  appendAudit({ actor, action: 'webhookhub2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function webhookhub2Summary() {
  const list = listWebhookhub2();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    active: list.filter((x) => x.status === 'active').length,
    closed: list.filter((x) => x.status === 'closed').length, webhookhub2: list };
}
