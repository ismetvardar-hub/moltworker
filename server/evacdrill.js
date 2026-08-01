/**
 * AŞAMA 201 — Tahliye Tatbikat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('evacdrill', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'evc_1', area: "Ana",
      score: "90", status: 'planned', at: new Date().toISOString() }];
    writeCollection('evacdrill', seed);
    return seed;
  }
  return list;
}
export function listEvacdrill(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEvacdrill(input, actor = 'system') {
  const row = {
    id: `evc_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    area: input.area !== undefined ? input.area : "Ana",
    score: input.score !== undefined ? Number(input.score) || 0 : 90,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('evacdrill', row, 300);
  appendAudit({ actor, action: 'evacdrill.create', detail: String(row.title || row.guestName || row.childName || row.name || row.zone || row.point || row.location || row.unit || row.area || row.channel || row.gate || row.code || row.id), meta: { id: row.id } });
  return row;
}
export function updateEvacdrill(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('evacdrill', list);
  appendAudit({ actor, action: 'evacdrill.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function evacdrillSummary() {
  const list = listEvacdrill();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    done: list.filter((x) => x.status === 'done').length,
    missed: list.filter((x) => x.status === 'missed').length, evacdrill: list };
}
