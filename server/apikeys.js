/**
 * AŞAMA 152 — API Anahtar.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('apikeys', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'apk_1', service: "MINT",
      label: "prod", status: 'active', at: new Date().toISOString() }];
    writeCollection('apikeys', seed);
    return seed;
  }
  return list;
}
export function listApikeys(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createApikeys(input, actor = 'system') {
  const row = {
    id: `apk_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    service: input.service !== undefined ? input.service : "MINT",
    label: input.label !== undefined ? input.label : "prod",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('apikeys', row, 300);
  appendAudit({ actor, action: 'apikeys.create', detail: String(row.title || row.name || row.system || row.service || row.target || row.source || row.version || row.gate || row.secret || row.domain || row.to || row.zone || row.id), meta: { id: row.id } });
  return row;
}
export function updateApikeys(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('apikeys', list);
  appendAudit({ actor, action: 'apikeys.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function apikeysSummary() {
  const list = listApikeys();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    rotated: list.filter((x) => x.status === 'rotated').length,
    revoked: list.filter((x) => x.status === 'revoked').length, apikeys: list };
}
