/**
 * AŞAMA 362 — Play Trigger.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('playtrigger', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'plt_1', playbook: "Gate failover",
      source: "NEXUS", status: 'armed', at: new Date().toISOString() }];
    writeCollection('playtrigger', seed);
    return seed;
  }
  return list;
}
export function listPlaytrigger(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createPlaytrigger(input, actor = 'system') {
  const row = {
    id: `plt_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    playbook: input.playbook !== undefined ? input.playbook : "Gate failover",
    source: input.source !== undefined ? input.source : "NEXUS",
    status: input.status || 'armed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('playtrigger', row, 300);
  appendAudit({
    actor,
    action: 'playtrigger.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updatePlaytrigger(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('playtrigger', list);
  appendAudit({ actor, action: 'playtrigger.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function playtriggerSummary() {
  const list = listPlaytrigger();
  return { total: list.length, armed: list.filter((x) => x.status === 'armed').length,
    fired: list.filter((x) => x.status === 'fired').length,
    disabled: list.filter((x) => x.status === 'disabled').length, playtrigger: list };
}
