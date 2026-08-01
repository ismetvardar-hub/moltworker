/**
 * AŞAMA 991 — Chaos Drill.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('chaosdrill2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cha_1', target: "Alpha",
      score: "5", status: 'planned', at: new Date().toISOString() }];
    writeCollection('chaosdrill2', seed);
    return seed;
  }
  return list;
}
export function listChaosdrill2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createChaosdrill2(input, actor = 'system') {
  const row = {
    id: `cha_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    target: input.target !== undefined ? input.target : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('chaosdrill2', row, 300);
  appendAudit({
    actor,
    action: 'chaosdrill2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateChaosdrill2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('chaosdrill2', list);
  appendAudit({ actor, action: 'chaosdrill2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function chaosdrill2Summary() {
  const list = listChaosdrill2();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, chaosdrill2: list };
}
