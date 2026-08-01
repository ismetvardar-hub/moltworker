/**
 * AŞAMA 141 — CCTV Log.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('cctvlog', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'cct_1', zone: "Lobby",
      note: "Normal", status: 'noted', at: new Date().toISOString() }];
    writeCollection('cctvlog', seed);
    return seed;
  }
  return list;
}
export function listCctvlog(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createCctvlog(input, actor = 'system') {
  const row = {
    id: `cct_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    zone: input.zone !== undefined ? input.zone : "Lobby",
    note: input.note !== undefined ? input.note : "Normal",
    status: input.status || 'noted',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('cctvlog', row, 300);
  appendAudit({ actor, action: 'cctvlog.create', detail: String(row.title || row.employee || row.name || row.vendor || row.policy || row.project || row.metric || row.area || row.zone || row.breach || row.period || row.item || row.host || row.id), meta: { id: row.id } });
  return row;
}
export function updateCctvlog(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('cctvlog', list);
  appendAudit({ actor, action: 'cctvlog.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function cctvlogSummary() {
  const list = listCctvlog();
  return { total: list.length, noted: list.filter((x) => x.status === 'noted').length,
    review: list.filter((x) => x.status === 'review').length,
    escalated: list.filter((x) => x.status === 'escalated').length, cctvlog: list };
}
