/**
 * AŞAMA 154 — Sistem Alarm.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('sysalerts', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sal_1', source: "NEXUS",
      message: "Gate timeout", status: 'open', at: new Date().toISOString() }];
    writeCollection('sysalerts', seed);
    return seed;
  }
  return list;
}
export function listSysalerts(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSysalerts(input, actor = 'system') {
  const row = {
    id: `sal_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    source: input.source !== undefined ? input.source : "NEXUS",
    message: input.message !== undefined ? input.message : "Gate timeout",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('sysalerts', row, 300);
  appendAudit({ actor, action: 'sysalerts.create', detail: String(row.title || row.name || row.system || row.service || row.target || row.source || row.version || row.gate || row.secret || row.domain || row.to || row.zone || row.id), meta: { id: row.id } });
  return row;
}
export function updateSysalerts(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('sysalerts', list);
  appendAudit({ actor, action: 'sysalerts.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function sysalertsSummary() {
  const list = listSysalerts();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    acked: list.filter((x) => x.status === 'acked').length,
    resolved: list.filter((x) => x.status === 'resolved').length, sysalerts: list };
}
