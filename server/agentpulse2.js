/**
 * AŞAMA 954 — Agent Pulse.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('agentpulse2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'age_1', agent: "Alpha",
      status: "Beta", status: 'draft', at: new Date().toISOString() }];
    writeCollection('agentpulse2', seed);
    return seed;
  }
  return list;
}
export function listAgentpulse2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAgentpulse2(input, actor = 'system') {
  const row = {
    id: `age_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    agent: input.agent !== undefined ? input.agent : "Alpha",
    status: input.status !== undefined ? input.status : "Beta",
    status: input.status || 'draft',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('agentpulse2', row, 300);
  appendAudit({
    actor,
    action: 'agentpulse2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAgentpulse2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('agentpulse2', list);
  appendAudit({ actor, action: 'agentpulse2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function agentpulse2Summary() {
  const list = listAgentpulse2();
  return { total: list.length, draft: list.filter((x) => x.status === 'draft').length,
    live: list.filter((x) => x.status === 'live').length,
    archived: list.filter((x) => x.status === 'archived').length, agentpulse2: list };
}
