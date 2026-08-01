/**
 * AŞAMA 892 — Eternal Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('eternallog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ete_1', entry: "Alpha",
      era: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('eternallog', seed);
    return seed;
  }
  return list;
}
export function listEternallog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createEternallog(input, actor = 'system') {
  const row = {
    id: `ete_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    entry: input.entry !== undefined ? input.entry : "Alpha",
    era: input.era !== undefined ? input.era : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('eternallog', row, 300);
  appendAudit({
    actor,
    action: 'eternallog.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateEternallog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('eternallog', list);
  appendAudit({ actor, action: 'eternallog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function eternallogSummary() {
  const list = listEternallog();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, eternallog: list };
}
