/**
 * AŞAMA 149 — SLA İhlal.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('slabreaches', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sla_1', vendor: "Lojistik",
      breach: "Geç teslim", status: 'open', at: new Date().toISOString() }];
    writeCollection('slabreaches', seed);
    return seed;
  }
  return list;
}
export function listSlabreaches(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSlabreaches(input, actor = 'system') {
  const row = {
    id: `sla_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    vendor: input.vendor !== undefined ? input.vendor : "Lojistik",
    breach: input.breach !== undefined ? input.breach : "Geç teslim",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('slabreaches', row, 300);
  appendAudit({ actor, action: 'slabreaches.create', detail: String(row.title || row.employee || row.name || row.vendor || row.policy || row.project || row.metric || row.area || row.zone || row.breach || row.period || row.item || row.host || row.id), meta: { id: row.id } });
  return row;
}
export function updateSlabreaches(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('slabreaches', list);
  appendAudit({ actor, action: 'slabreaches.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function slabreachesSummary() {
  const list = listSlabreaches();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    mitigated: list.filter((x) => x.status === 'mitigated').length,
    closed: list.filter((x) => x.status === 'closed').length, slabreaches: list };
}
