/**
 * AŞAMA 162 — SMS Kuyruk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('smsqueue', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'smq_1', to: "+90555",
      body: "Rezervasyon OK", status: 'queued', at: new Date().toISOString() }];
    writeCollection('smsqueue', seed);
    return seed;
  }
  return list;
}
export function listSmsqueue(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSmsqueue(input, actor = 'system') {
  const row = {
    id: `smq_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    to: input.to !== undefined ? input.to : "+90555",
    body: input.body !== undefined ? input.body : "Rezervasyon OK",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('smsqueue', row, 300);
  appendAudit({ actor, action: 'smsqueue.create', detail: String(row.title || row.name || row.system || row.service || row.target || row.source || row.version || row.gate || row.secret || row.domain || row.to || row.zone || row.id), meta: { id: row.id } });
  return row;
}
export function updateSmsqueue(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('smsqueue', list);
  appendAudit({ actor, action: 'smsqueue.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function smsqueueSummary() {
  const list = listSmsqueue();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    sent: list.filter((x) => x.status === 'sent').length,
    failed: list.filter((x) => x.status === 'failed').length, smsqueue: list };
}
