/**
 * AŞAMA 948 — Board Pulse.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('boardpulse2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'boa_1', topic: "Alpha",
      score: "5", status: 'planned', at: new Date().toISOString() }];
    writeCollection('boardpulse2', seed);
    return seed;
  }
  return list;
}
export function listBoardpulse2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBoardpulse2(input, actor = 'system') {
  const row = {
    id: `boa_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    topic: input.topic !== undefined ? input.topic : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('boardpulse2', row, 300);
  appendAudit({
    actor,
    action: 'boardpulse2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBoardpulse2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('boardpulse2', list);
  appendAudit({ actor, action: 'boardpulse2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function boardpulse2Summary() {
  const list = listBoardpulse2();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, boardpulse2: list };
}
