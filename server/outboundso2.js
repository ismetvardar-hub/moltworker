/**
 * AŞAMA 932 — Outbound SO.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('outboundso2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'out_1', so: "Alpha",
      buyer: "Beta", status: 'pending', at: new Date().toISOString() }];
    writeCollection('outboundso2', seed);
    return seed;
  }
  return list;
}
export function listOutboundso2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createOutboundso2(input, actor = 'system') {
  const row = {
    id: `out_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    so: input.so !== undefined ? input.so : "Alpha",
    buyer: input.buyer !== undefined ? input.buyer : "Beta",
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('outboundso2', row, 300);
  appendAudit({
    actor,
    action: 'outboundso2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateOutboundso2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('outboundso2', list);
  appendAudit({ actor, action: 'outboundso2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function outboundso2Summary() {
  const list = listOutboundso2();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, outboundso2: list };
}
