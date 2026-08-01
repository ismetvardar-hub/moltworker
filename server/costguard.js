/**
 * AŞAMA 312 — AI Cost Guard.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('costguard', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cst_1', service: "Ollama",
      spend: "120", status: 'ok', at: new Date().toISOString() }];
    writeCollection('costguard', seed);
    return seed;
  }
  return list;
}
export function listCostguard(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCostguard(input, actor = 'system') {
  const row = {
    id: `cst_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    service: input.service !== undefined ? input.service : "Ollama",
    spend: input.spend !== undefined ? Number(input.spend) || 0 : 120,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('costguard', row, 300);
  appendAudit({ actor, action: 'costguard.create', detail: String(row.title || row.name || row.model || row.agent || row.corpus || row.tool || row.scenario || row.sample || row.suite || row.service || row.id), meta: { id: row.id } });
  return row;
}
export function updateCostguard(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('costguard', list);
  appendAudit({ actor, action: 'costguard.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function costguardSummary() {
  const list = listCostguard();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    throttle: list.filter((x) => x.status === 'throttle').length,
    halt: list.filter((x) => x.status === 'halt').length, costguard: list };
}
