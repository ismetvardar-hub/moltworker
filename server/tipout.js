/**
 * AŞAMA 245 — Tip Out.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('tipout', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tpo_1', pool: "Restoran",
      amount: "1200", status: 'draft', at: new Date().toISOString() }];
    writeCollection('tipout', seed);
    return seed;
  }
  return list;
}
export function listTipout(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTipout(input, actor = 'system') {
  const row = {
    id: `tpo_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    pool: input.pool !== undefined ? input.pool : "Restoran",
    amount: input.amount !== undefined ? Number(input.amount) || 0 : 1200,
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('tipout', row, 300);
  appendAudit({ actor, action: 'tipout.create', detail: String(row.title || row.guestName || row.customer || row.vendor || row.account || row.pair || row.pool || row.caseId || row.code || row.member || row.plan || row.channel || row.name || row.date || row.id), meta: { id: row.id } });
  return row;
}
export function updateTipout(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('tipout', list);
  appendAudit({ actor, action: 'tipout.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function tipoutSummary() {
  const list = listTipout();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    distributed: list.filter((x) => x.status === 'distributed').length,
    locked: list.filter((x) => x.status === 'locked').length, tipout: list };
}
