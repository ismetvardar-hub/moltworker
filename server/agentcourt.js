/**
 * AŞAMA 889 — Agent Court.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('agentcourt', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'age_1', agent: "Alpha",
      verdict: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('agentcourt', seed);
    return seed;
  }
  return list;
}
export function listAgentcourt(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAgentcourt(input, actor = 'system') {
  const row = {
    id: `age_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    agent: input.agent !== undefined ? input.agent : "Alpha",
    verdict: input.verdict !== undefined ? input.verdict : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('agentcourt', row, 300);
  appendAudit({
    actor,
    action: 'agentcourt.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAgentcourt(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('agentcourt', list);
  appendAudit({ actor, action: 'agentcourt.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function agentcourtSummary() {
  const list = listAgentcourt();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, agentcourt: list };
}
