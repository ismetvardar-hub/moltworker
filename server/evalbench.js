/**
 * AŞAMA 530 — Eval Bench.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('evalbench', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'evb_1', suite: "guest_tone",
      score: "0.91", status: 'queued', at: new Date().toISOString() }];
    writeCollection('evalbench', seed);
    return seed;
  }
  return list;
}
export function listEvalbench(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEvalbench(input, actor = 'system') {
  const row = {
    id: `evb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    suite: input.suite !== undefined ? input.suite : "guest_tone",
    score: input.score !== undefined ? Number(input.score) || 0 : 0.91,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('evalbench', row, 300);
  appendAudit({
    actor,
    action: 'evalbench.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEvalbench(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('evalbench', list);
  appendAudit({ actor, action: 'evalbench.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function evalbenchSummary() {
  const list = listEvalbench();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    pass: list.filter((x) => x.status === 'pass').length,
    fail: list.filter((x) => x.status === 'fail').length, evalbench: list };
}
