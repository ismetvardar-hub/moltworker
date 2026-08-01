/**
 * AŞAMA 306 — Tool İzin.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('toolpermit', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tlp_1', agent: "NEXUS",
      tool: "unlock", status: 'allowed', at: new Date().toISOString() }];
    writeCollection('toolpermit', seed);
    return seed;
  }
  return list;
}
export function listToolpermit(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createToolpermit(input, actor = 'system') {
  const row = {
    id: `tlp_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    agent: input.agent !== undefined ? input.agent : "NEXUS",
    tool: input.tool !== undefined ? input.tool : "unlock",
    status: input.status || 'allowed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('toolpermit', row, 300);
  appendAudit({ actor, action: 'toolpermit.create', detail: String(row.title || row.name || row.model || row.agent || row.corpus || row.tool || row.scenario || row.sample || row.suite || row.service || row.id), meta: { id: row.id } });
  return row;
}
export function updateToolpermit(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('toolpermit', list);
  appendAudit({ actor, action: 'toolpermit.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function toolpermitSummary() {
  const list = listToolpermit();
  return { total: list.length, allowed: list.filter((x) => x.status === 'allowed').length,
    denied: list.filter((x) => x.status === 'denied').length,
    review: list.filter((x) => x.status === 'review').length, toolpermit: list };
}
