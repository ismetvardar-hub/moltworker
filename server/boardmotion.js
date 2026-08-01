/**
 * AŞAMA 397 — Board Motion.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('boardmotion', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bdm_1', motion: "Approve CAPEX",
      votes: "3", status: 'draft', at: new Date().toISOString() }];
    writeCollection('boardmotion', seed);
    return seed;
  }
  return list;
}
export function listBoardmotion(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBoardmotion(input, actor = 'system') {
  const row = {
    id: `bdm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    motion: input.motion !== undefined ? input.motion : "Approve CAPEX",
    votes: input.votes !== undefined ? Number(input.votes) || 0 : 3,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('boardmotion', row, 300);
  appendAudit({
    actor,
    action: 'boardmotion.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateBoardmotion(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('boardmotion', list);
  appendAudit({ actor, action: 'boardmotion.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function boardmotionSummary() {
  const list = listBoardmotion();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    passed: list.filter((x) => x.status === 'passed').length,
    tabled: list.filter((x) => x.status === 'tabled').length, boardmotion: list };
}
