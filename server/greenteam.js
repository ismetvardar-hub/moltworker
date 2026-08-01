/**
 * AŞAMA 681 — Green Team.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('greenteam', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'grt_1', task: "Beach clean",
      crew: "6", status: 'planned', at: new Date().toISOString() }];
    writeCollection('greenteam', seed);
    return seed;
  }
  return list;
}
export function listGreenteam(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createGreenteam(input, actor = 'system') {
  const row = {
    id: `grt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    task: input.task !== undefined ? input.task : "Beach clean",
    crew: input.crew !== undefined ? Number(input.crew) || 0 : 6,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('greenteam', row, 300);
  appendAudit({
    actor,
    action: 'greenteam.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateGreenteam(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('greenteam', list);
  appendAudit({ actor, action: 'greenteam.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function greenteamSummary() {
  const list = listGreenteam();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, greenteam: list };
}
