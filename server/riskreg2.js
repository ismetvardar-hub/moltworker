/**
 * AŞAMA 1023 — Risk Reg.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('riskreg2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ris_1', risk: "Alpha",
      score: "5", status: 'draft', at: new Date().toISOString() }];
    writeCollection('riskreg2', seed);
    return seed;
  }
  return list;
}
export function listRiskreg2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRiskreg2(input, actor = 'system') {
  const row = {
    id: `ris_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    risk: input.risk !== undefined ? input.risk : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('riskreg2', row, 300);
  appendAudit({
    actor,
    action: 'riskreg2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateRiskreg2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('riskreg2', list);
  appendAudit({ actor, action: 'riskreg2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function riskreg2Summary() {
  const list = listRiskreg2();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, riskreg2: list };
}
