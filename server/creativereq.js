/**
 * AŞAMA 299 — Kreatif Talep.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('creativereq', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'crq_1', brief: "Pass afiş",
      owner: "ARTE", status: 'queued', at: new Date().toISOString() }];
    writeCollection('creativereq', seed);
    return seed;
  }
  return list;
}
export function listCreativereq(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCreativereq(input, actor = 'system') {
  const row = {
    id: `crq_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    brief: input.brief !== undefined ? input.brief : "Pass afiş",
    owner: input.owner !== undefined ? input.owner : "ARTE",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('creativereq', row, 300);
  appendAudit({ actor, action: 'creativereq.create', detail: String(row.title || row.asset || row.handle || row.author || row.page || row.campaign || row.target || row.episode || row.subject || row.tag || row.brief || row.id), meta: { id: row.id } });
  return row;
}
export function updateCreativereq(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('creativereq', list);
  appendAudit({ actor, action: 'creativereq.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function creativereqSummary() {
  const list = listCreativereq();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    in_progress: list.filter((x) => x.status === 'in_progress').length,
    delivered: list.filter((x) => x.status === 'delivered').length, creativereq: list };
}
