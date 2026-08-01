/**
 * AŞAMA 269 — Bildirim Hattı.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('whistle', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'wst_1', topic: "Etik",
      detail: "Gözlem", status: 'open', at: new Date().toISOString() }];
    writeCollection('whistle', seed);
    return seed;
  }
  return list;
}
export function listWhistle(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createWhistle(input, actor = 'system') {
  const row = {
    id: `wst_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    topic: input.topic !== undefined ? input.topic : "Etik",
    detail: input.detail !== undefined ? input.detail : "Gözlem",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('whistle', row, 300);
  appendAudit({ actor, action: 'whistle.create', detail: String(row.title || row.employee || row.candidate || row.fromEmp || row.topic || row.zone || row.award || row.cert || row.language || row.id), meta: { id: row.id } });
  return row;
}
export function updateWhistle(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('whistle', list);
  appendAudit({ actor, action: 'whistle.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function whistleSummary() {
  const list = listWhistle();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    investigating: list.filter((x) => x.status === 'investigating').length,
    closed: list.filter((x) => x.status === 'closed').length, whistle: list };
}
