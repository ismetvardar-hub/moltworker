/**
 * AŞAMA 304 — Token Bütçe.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('tokenbudget', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tkb_1', agent: "ATLAS",
      limit: "100000", status: 'ok', at: new Date().toISOString() }];
    writeCollection('tokenbudget', seed);
    return seed;
  }
  return list;
}
export function listTokenbudget(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTokenbudget(input, actor = 'system') {
  const row = {
    id: `tkb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    agent: input.agent !== undefined ? input.agent : "ATLAS",
    limit: input.limit !== undefined ? Number(input.limit) || 0 : 100000,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('tokenbudget', row, 300);
  appendAudit({ actor, action: 'tokenbudget.create', detail: String(row.title || row.name || row.model || row.agent || row.corpus || row.tool || row.scenario || row.sample || row.suite || row.service || row.id), meta: { id: row.id } });
  return row;
}
export function updateTokenbudget(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('tokenbudget', list);
  appendAudit({ actor, action: 'tokenbudget.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function tokenbudgetSummary() {
  const list = listTokenbudget();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    exhausted: list.filter((x) => x.status === 'exhausted').length, tokenbudget: list };
}
