/**
 * AŞAMA 1163 — Patent Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('patentdesk3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pat_1', title: "Alpha",
      status: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('patentdesk3', seed);
    return seed;
  }
  return list;
}
export function listPatentdesk3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPatentdesk3(input, actor = 'system') {
  const row = {
    id: `pat_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: input.title !== undefined ? input.title : "Alpha",
    status: input.status !== undefined ? input.status : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('patentdesk3', row, 300);
  appendAudit({
    actor,
    action: 'patentdesk3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePatentdesk3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('patentdesk3', list);
  appendAudit({ actor, action: 'patentdesk3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function patentdesk3Summary() {
  const list = listPatentdesk3();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, patentdesk3: list };
}
