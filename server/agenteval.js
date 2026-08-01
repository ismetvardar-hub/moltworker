/**
 * AŞAMA 303 — Ajan Eval.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('agenteval', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'aev_1', agent: "HERODOT",
      score: "86", status: 'queued', at: new Date().toISOString() }];
    writeCollection('agenteval', seed);
    return seed;
  }
  return list;
}
export function listAgenteval(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAgenteval(input, actor = 'system') {
  const row = {
    id: `aev_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    agent: input.agent !== undefined ? input.agent : "HERODOT",
    score: input.score !== undefined ? Number(input.score) || 0 : 86,
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('agenteval', row, 300);
  appendAudit({ actor, action: 'agenteval.create', detail: String(row.title || row.name || row.model || row.agent || row.corpus || row.tool || row.scenario || row.sample || row.suite || row.service || row.id), meta: { id: row.id } });
  return row;
}
export function updateAgenteval(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('agenteval', list);
  appendAudit({ actor, action: 'agenteval.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function agentevalSummary() {
  const list = listAgenteval();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    scored: list.filter((x) => x.status === 'scored').length,
    failed: list.filter((x) => x.status === 'failed').length, agenteval: list };
}
