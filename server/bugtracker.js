/**
 * AŞAMA 155 — Bug Tracker.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('bugtracker', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'bug_1', title: "Sidebar scroll",
      severity: "low", status: 'open', at: new Date().toISOString() }];
    writeCollection('bugtracker', seed);
    return seed;
  }
  return list;
}
export function listBugtracker(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createBugtracker(input, actor = 'system') {
  const row = {
    id: `bug_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    title: input.title !== undefined ? input.title : "Sidebar scroll",
    severity: input.severity !== undefined ? input.severity : "low",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('bugtracker', row, 300);
  appendAudit({ actor, action: 'bugtracker.create', detail: String(row.title || row.name || row.system || row.service || row.target || row.source || row.version || row.gate || row.secret || row.domain || row.to || row.zone || row.id), meta: { id: row.id } });
  return row;
}
export function updateBugtracker(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('bugtracker', list);
  appendAudit({ actor, action: 'bugtracker.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function bugtrackerSummary() {
  const list = listBugtracker();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    in_progress: list.filter((x) => x.status === 'in_progress').length,
    closed: list.filter((x) => x.status === 'closed').length, bugtracker: list };
}
