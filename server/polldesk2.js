/**
 * AŞAMA 996 — Poll Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('polldesk2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pol_1', poll: "Alpha",
      votes: "5", status: 'queued', at: new Date().toISOString() }];
    writeCollection('polldesk2', seed);
    return seed;
  }
  return list;
}
export function listPolldesk2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPolldesk2(input, actor = 'system') {
  const row = {
    id: `pol_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    poll: input.poll !== undefined ? input.poll : "Alpha",
    votes: input.votes !== undefined ? Number(input.votes) || 0 : 5,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('polldesk2', row, 300);
  appendAudit({
    actor,
    action: 'polldesk2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePolldesk2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('polldesk2', list);
  appendAudit({ actor, action: 'polldesk2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function polldesk2Summary() {
  const list = listPolldesk2();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, polldesk2: list };
}
