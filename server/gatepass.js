/**
 * AŞAMA 427 — Liman Gate.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('gatepass', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'gpg_1', plate: "07 LYK 22",
      purpose: "Delivery", status: 'issued', at: new Date().toISOString() }];
    writeCollection('gatepass', seed);
    return seed;
  }
  return list;
}
export function listGatepass(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGatepass(input, actor = 'system') {
  const row = {
    id: `gpg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    plate: input.plate !== undefined ? input.plate : "07 LYK 22",
    purpose: input.purpose !== undefined ? input.purpose : "Delivery",
    status: input.status || 'issued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('gatepass', row, 300);
  appendAudit({
    actor,
    action: 'gatepass.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateGatepass(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('gatepass', list);
  appendAudit({ actor, action: 'gatepass.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function gatepassSummary() {
  const list = listGatepass();
  return { total: list.length, issued: list.filter((x) => x.status === 'issued').length,
    used: list.filter((x) => x.status === 'used').length,
    expired: list.filter((x) => x.status === 'expired').length, gatepass: list };
}
