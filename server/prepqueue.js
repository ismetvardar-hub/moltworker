/**
 * AŞAMA 214 — Prep Kuyruk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('prepqueue', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'prp_1', item: "Sos",
      qty: "20", status: 'queued', at: new Date().toISOString() }];
    writeCollection('prepqueue', seed);
    return seed;
  }
  return list;
}
export function listPrepqueue(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPrepqueue(input, actor = 'system') {
  const row = {
    id: `prp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    item: input.item !== undefined ? input.item : "Sos",
    qty: input.qty !== undefined ? Number(input.qty) || 0 : 20,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('prepqueue', row, 300);
  appendAudit({ actor, action: 'prepqueue.create', detail: String(row.title || row.guestName || row.board || row.dish || row.station || row.item || row.table || row.wine || row.note || row.tier || row.zone || row.metric || row.id), meta: { id: row.id } });
  return row;
}
export function updatePrepqueue(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('prepqueue', list);
  appendAudit({ actor, action: 'prepqueue.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function prepqueueSummary() {
  const list = listPrepqueue();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, prepqueue: list };
}
