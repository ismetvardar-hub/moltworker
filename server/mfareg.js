/**
 * AŞAMA 697 — MFA Reg.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('mfareg', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mfa_1', person: "Alpha",
      factor: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('mfareg', seed);
    return seed;
  }
  return list;
}
export function listMfareg(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMfareg(input, actor = 'system') {
  const row = {
    id: `mfa_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    person: input.person !== undefined ? input.person : "Alpha",
    factor: input.factor !== undefined ? input.factor : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('mfareg', row, 300);
  appendAudit({
    actor,
    action: 'mfareg.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateMfareg(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('mfareg', list);
  appendAudit({ actor, action: 'mfareg.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function mfaregSummary() {
  const list = listMfareg();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, mfareg: list };
}
