/**
 * AŞAMA 160 — DNS Check.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('dnscheck', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dns_1', domain: "olympospass.com",
      statusNote: "OK", status: 'ok', at: new Date().toISOString() }];
    writeCollection('dnscheck', seed);
    return seed;
  }
  return list;
}
export function listDnscheck(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDnscheck(input, actor = 'system') {
  const row = {
    id: `dns_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    domain: input.domain !== undefined ? input.domain : "olympospass.com",
    statusNote: input.statusNote !== undefined ? input.statusNote : "OK",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('dnscheck', row, 300);
  appendAudit({ actor, action: 'dnscheck.create', detail: String(row.title || row.name || row.system || row.service || row.target || row.source || row.version || row.gate || row.secret || row.domain || row.to || row.zone || row.id), meta: { id: row.id } });
  return row;
}
export function updateDnscheck(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('dnscheck', list);
  appendAudit({ actor, action: 'dnscheck.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function dnscheckSummary() {
  const list = listDnscheck();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    fail: list.filter((x) => x.status === 'fail').length, dnscheck: list };
}
