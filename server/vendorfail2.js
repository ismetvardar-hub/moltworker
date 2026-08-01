/**
 * AŞAMA 1047 — Vendor Fail.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('vendorfail2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ven_1', vendor: "Alpha",
      impact: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('vendorfail2', seed);
    return seed;
  }
  return list;
}
export function listVendorfail2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createVendorfail2(input, actor = 'system') {
  const row = {
    id: `ven_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    vendor: input.vendor !== undefined ? input.vendor : "Alpha",
    impact: input.impact !== undefined ? input.impact : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('vendorfail2', row, 300);
  appendAudit({
    actor,
    action: 'vendorfail2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateVendorfail2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('vendorfail2', list);
  appendAudit({ actor, action: 'vendorfail2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function vendorfail2Summary() {
  const list = listVendorfail2();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, vendorfail2: list };
}
