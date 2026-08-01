/**
 * AŞAMA 1013 — Patent Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('patentdesk2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pat_1', title: "Alpha",
      status: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('patentdesk2', seed);
    return seed;
  }
  return list;
}
export function listPatentdesk2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPatentdesk2(input, actor = 'system') {
  const row = {
    id: `pat_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: input.title !== undefined ? input.title : "Alpha",
    status: input.status !== undefined ? input.status : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('patentdesk2', row, 300);
  appendAudit({
    actor,
    action: 'patentdesk2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePatentdesk2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('patentdesk2', list);
  appendAudit({ actor, action: 'patentdesk2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function patentdesk2Summary() {
  const list = listPatentdesk2();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, patentdesk2: list };
}
