/**
 * AŞAMA 206 — Face Pass.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('facepass', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fce_1', gate: "VIP",
      result: "match", status: 'match', at: new Date().toISOString() }];
    writeCollection('facepass', seed);
    return seed;
  }
  return list;
}
export function listFacepass(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFacepass(input, actor = 'system') {
  const row = {
    id: `fce_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    gate: input.gate !== undefined ? input.gate : "VIP",
    result: input.result !== undefined ? input.result : "match",
    status: input.status || 'match',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('facepass', row, 300);
  appendAudit({ actor, action: 'facepass.create', detail: String(row.title || row.guestName || row.childName || row.name || row.zone || row.point || row.location || row.unit || row.area || row.channel || row.gate || row.code || row.id), meta: { id: row.id } });
  return row;
}
export function updateFacepass(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('facepass', list);
  appendAudit({ actor, action: 'facepass.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function facepassSummary() {
  const list = listFacepass();
  return { total: list.length, match: list.filter((x) => x.status === 'match').length,
    nomatch: list.filter((x) => x.status === 'nomatch').length,
    review: list.filter((x) => x.status === 'review').length, facepass: list };
}
