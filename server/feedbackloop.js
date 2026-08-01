/**
 * AŞAMA 764 — Feedback Loop.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('feedbackloop', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'fee_1', channel: "Alpha",
      score: "5", status: 'pending', at: new Date().toISOString() }];
    writeCollection('feedbackloop', seed);
    return seed;
  }
  return list;
}
export function listFeedbackloop(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createFeedbackloop(input, actor = 'system') {
  const row = {
    id: `fee_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    channel: input.channel !== undefined ? input.channel : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'pending',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('feedbackloop', row, 300);
  appendAudit({
    actor,
    action: 'feedbackloop.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateFeedbackloop(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('feedbackloop', list);
  appendAudit({ actor, action: 'feedbackloop.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function feedbackloopSummary() {
  const list = listFeedbackloop();
  return { total: list.length, pending: list.filter((x) => x.status === 'pending').length,
    approved: list.filter((x) => x.status === 'approved').length,
    rejected: list.filter((x) => x.status === 'rejected').length, feedbackloop: list };
}
