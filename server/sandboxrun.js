/**
 * AŞAMA 307 — Sandbox Run.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('sandboxrun', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sbx_1', agent: "ODYSSEUS",
      scenario: "Gate failover", status: 'queued', at: new Date().toISOString() }];
    writeCollection('sandboxrun', seed);
    return seed;
  }
  return list;
}
export function listSandboxrun(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSandboxrun(input, actor = 'system') {
  const row = {
    id: `sbx_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    agent: input.agent !== undefined ? input.agent : "ODYSSEUS",
    scenario: input.scenario !== undefined ? input.scenario : "Gate failover",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('sandboxrun', row, 300);
  appendAudit({ actor, action: 'sandboxrun.create', detail: String(row.title || row.name || row.model || row.agent || row.corpus || row.tool || row.scenario || row.sample || row.suite || row.service || row.id), meta: { id: row.id } });
  return row;
}
export function updateSandboxrun(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('sandboxrun', list);
  appendAudit({ actor, action: 'sandboxrun.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function sandboxrunSummary() {
  const list = listSandboxrun();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    passed: list.filter((x) => x.status === 'passed').length,
    failed: list.filter((x) => x.status === 'failed').length, sandboxrun: list };
}
