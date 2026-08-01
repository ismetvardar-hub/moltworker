/**
 * AŞAMA 163 — Alert Kuralları.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('alertrules', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'arl_1', name: "Low stock",
      channel: "push", status: 'enabled', at: new Date().toISOString() }];
    writeCollection('alertrules', seed);
    return seed;
  }
  return list;
}
export function listAlertrules(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAlertrules(input, actor = 'system') {
  const row = {
    id: `arl_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    name: input.name !== undefined ? input.name : "Low stock",
    channel: input.channel !== undefined ? input.channel : "push",
    status: input.status || 'enabled',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('alertrules', row, 300);
  appendAudit({ actor, action: 'alertrules.create', detail: String(row.title || row.name || row.system || row.service || row.target || row.source || row.version || row.gate || row.secret || row.domain || row.to || row.zone || row.id), meta: { id: row.id } });
  return row;
}
export function updateAlertrules(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('alertrules', list);
  appendAudit({ actor, action: 'alertrules.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function alertrulesSummary() {
  const list = listAlertrules();
  return { total: list.length, enabled: list.filter((x) => x.status === 'enabled').length,
    disabled: list.filter((x) => x.status === 'disabled').length, alertrules: list };
}
