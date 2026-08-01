/**
 * AŞAMA 310 — Red Team.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('redteam', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'rdt_1', suite: "Prompt inject",
      severity: "high", status: 'open', at: new Date().toISOString() }];
    writeCollection('redteam', seed);
    return seed;
  }
  return list;
}
export function listRedteam(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createRedteam(input, actor = 'system') {
  const row = {
    id: `rdt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    suite: input.suite !== undefined ? input.suite : "Prompt inject",
    severity: input.severity !== undefined ? input.severity : "high",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('redteam', row, 300);
  appendAudit({ actor, action: 'redteam.create', detail: String(row.title || row.name || row.model || row.agent || row.corpus || row.tool || row.scenario || row.sample || row.suite || row.service || row.id), meta: { id: row.id } });
  return row;
}
export function updateRedteam(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('redteam', list);
  appendAudit({ actor, action: 'redteam.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function redteamSummary() {
  const list = listRedteam();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    mitigated: list.filter((x) => x.status === 'mitigated').length,
    closed: list.filter((x) => x.status === 'closed').length, redteam: list };
}
