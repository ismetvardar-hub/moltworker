/**
 * AŞAMA 949 — Risk Heat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('riskheat2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ris_1', domain: "Alpha",
      score: "5", status: 'pending', at: new Date().toISOString() }];
    writeCollection('riskheat2', seed);
    return seed;
  }
  return list;
}
export function listRiskheat2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRiskheat2(input, actor = 'system') {
  const row = {
    id: `ris_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    domain: input.domain !== undefined ? input.domain : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('riskheat2', row, 300);
  appendAudit({
    actor,
    action: 'riskheat2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRiskheat2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('riskheat2', list);
  appendAudit({ actor, action: 'riskheat2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function riskheat2Summary() {
  const list = listRiskheat2();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, riskheat2: list };
}
