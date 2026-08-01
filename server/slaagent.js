/**
 * AŞAMA 311 — Ajan SLA.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('slaagent', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'asl_1', agent: "REMINDER-AI",
      p95ms: "800", status: 'ok', at: new Date().toISOString() }];
    writeCollection('slaagent', seed);
    return seed;
  }
  return list;
}
export function listSlaagent(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSlaagent(input, actor = 'system') {
  const row = {
    id: `asl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    agent: input.agent !== undefined ? input.agent : "REMINDER-AI",
    p95ms: input.p95ms !== undefined ? Number(input.p95ms) || 0 : 800,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('slaagent', row, 300);
  appendAudit({ actor, action: 'slaagent.create', detail: String(row.title || row.name || row.model || row.agent || row.corpus || row.tool || row.scenario || row.sample || row.suite || row.service || row.id), meta: { id: row.id } });
  return row;
}
export function updateSlaagent(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('slaagent', list);
  appendAudit({ actor, action: 'slaagent.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function slaagentSummary() {
  const list = listSlaagent();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    breach: list.filter((x) => x.status === 'breach').length, slaagent: list };
}
