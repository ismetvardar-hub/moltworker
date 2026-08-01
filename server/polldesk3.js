/**
 * AŞAMA 1146 — Poll Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('polldesk3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'pol_1', poll: "Alpha",
      votes: "5", status: 'queued', at: new Date().toISOString() }];
    writeCollection('polldesk3', seed);
    return seed;
  }
  return list;
}
export function listPolldesk3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPolldesk3(input, actor = 'system') {
  const row = {
    id: `pol_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    poll: input.poll !== undefined ? input.poll : "Alpha",
    votes: input.votes !== undefined ? Number(input.votes) || 0 : 5,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('polldesk3', row, 300);
  appendAudit({
    actor,
    action: 'polldesk3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePolldesk3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('polldesk3', list);
  appendAudit({ actor, action: 'polldesk3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function polldesk3Summary() {
  const list = listPolldesk3();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, polldesk3: list };
}
