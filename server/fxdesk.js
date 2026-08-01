/**
 * AŞAMA 578 — FX Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('fxdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fxd_1', pair: "USD/TRY",
      rate: "33.2", status: 'spot', at: new Date().toISOString() }];
    writeCollection('fxdesk', seed);
    return seed;
  }
  return list;
}
export function listFxdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFxdesk(input, actor = 'system') {
  const row = {
    id: `fxd_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    pair: input.pair !== undefined ? input.pair : "USD/TRY",
    rate: input.rate !== undefined ? Number(input.rate) || 0 : 33.2,
    status: input.status || 'spot',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('fxdesk', row, 300);
  appendAudit({
    actor,
    action: 'fxdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFxdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('fxdesk', list);
  appendAudit({ actor, action: 'fxdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function fxdeskSummary() {
  const list = listFxdesk();
  return { total: list.length, spot: list.filter((x) => x.status === 'spot').length,
    hedged: list.filter((x) => x.status === 'hedged').length,
    expired: list.filter((x) => x.status === 'expired').length, fxdesk: list };
}
