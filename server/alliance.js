/**
 * AŞAMA 398 — Alliance.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('alliance', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'aln_1', partner: "Airline X",
      scope: "Miles", status: 'exploring', at: new Date().toISOString() }];
    writeCollection('alliance', seed);
    return seed;
  }
  return list;
}
export function listAlliance(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAlliance(input, actor = 'system') {
  const row = {
    id: `aln_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    partner: input.partner !== undefined ? input.partner : "Airline X",
    scope: input.scope !== undefined ? input.scope : "Miles",
    status: input.status || 'exploring',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('alliance', row, 300);
  appendAudit({
    actor,
    action: 'alliance.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAlliance(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('alliance', list);
  appendAudit({ actor, action: 'alliance.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function allianceSummary() {
  const list = listAlliance();
  return { total: list.length, exploring: list.filter((x) => x.status === 'exploring').length,
    live: list.filter((x) => x.status === 'live').length,
    ended: list.filter((x) => x.status === 'ended').length, alliance: list };
}
