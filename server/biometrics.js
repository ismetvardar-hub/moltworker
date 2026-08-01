/**
 * AŞAMA 158 — Biyometrik.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('biometrics', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bio_1', gate: "VIP",
      result: "ok", status: 'ok', at: new Date().toISOString() }];
    writeCollection('biometrics', seed);
    return seed;
  }
  return list;
}
export function listBiometrics(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBiometrics(input, actor = 'system') {
  const row = {
    id: `bio_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    gate: input.gate !== undefined ? input.gate : "VIP",
    result: input.result !== undefined ? input.result : "ok",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('biometrics', row, 300);
  appendAudit({ actor, action: 'biometrics.create', detail: String(row.title || row.name || row.system || row.service || row.target || row.source || row.version || row.gate || row.secret || row.domain || row.to || row.zone || row.id), meta: { id: row.id } });
  return row;
}
export function updateBiometrics(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('biometrics', list);
  appendAudit({ actor, action: 'biometrics.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function biometricsSummary() {
  const list = listBiometrics();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    fail: list.filter((x) => x.status === 'fail').length,
    review: list.filter((x) => x.status === 'review').length, biometrics: list };
}
