/**
 * AŞAMA 161 — Mail Kuyruk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('mailqueue', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'mlq_1', to: "ceo@likya.local",
      subject: "Digest", status: 'queued', at: new Date().toISOString() }];
    writeCollection('mailqueue', seed);
    return seed;
  }
  return list;
}
export function listMailqueue(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createMailqueue(input, actor = 'system') {
  const row = {
    id: `mlq_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    to: input.to !== undefined ? input.to : "ceo@likya.local",
    subject: input.subject !== undefined ? input.subject : "Digest",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('mailqueue', row, 300);
  appendAudit({ actor, action: 'mailqueue.create', detail: String(row.title || row.name || row.system || row.service || row.target || row.source || row.version || row.gate || row.secret || row.domain || row.to || row.zone || row.id), meta: { id: row.id } });
  return row;
}
export function updateMailqueue(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('mailqueue', list);
  appendAudit({ actor, action: 'mailqueue.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function mailqueueSummary() {
  const list = listMailqueue();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    sent: list.filter((x) => x.status === 'sent').length,
    failed: list.filter((x) => x.status === 'failed').length, mailqueue: list };
}
