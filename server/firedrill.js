/**
 * AŞAMA 142 — Yangın Tatbikat.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('firedrill', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fdr_1', area: "Ana bina",
      score: "95", status: 'planned', at: new Date().toISOString() }];
    writeCollection('firedrill', seed);
    return seed;
  }
  return list;
}
export function listFiredrill(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFiredrill(input, actor = 'system') {
  const row = {
    id: `fdr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    area: input.area !== undefined ? input.area : "Ana bina",
    score: input.score !== undefined ? Number(input.score) || 0 : 95,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('firedrill', row, 300);
  appendAudit({ actor, action: 'firedrill.create', detail: String(row.title || row.employee || row.name || row.vendor || row.policy || row.project || row.metric || row.area || row.zone || row.breach || row.period || row.item || row.host || row.id), meta: { id: row.id } });
  return row;
}
export function updateFiredrill(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('firedrill', list);
  appendAudit({ actor, action: 'firedrill.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function firedrillSummary() {
  const list = listFiredrill();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    done: list.filter((x) => x.status === 'done').length,
    missed: list.filter((x) => x.status === 'missed').length, firedrill: list };
}
