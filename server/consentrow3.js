/**
 * AŞAMA 1060 — Consent Row.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('consentrow3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'con_1', guestName: "Alpha",
      purpose: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('consentrow3', seed);
    return seed;
  }
  return list;
}
export function listConsentrow3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createConsentrow3(input, actor = 'system') {
  const row = {
    id: `con_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Alpha",
    purpose: input.purpose !== undefined ? input.purpose : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('consentrow3', row, 300);
  appendAudit({
    actor,
    action: 'consentrow3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateConsentrow3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('consentrow3', list);
  appendAudit({ actor, action: 'consentrow3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function consentrow3Summary() {
  const list = listConsentrow3();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, consentrow3: list };
}
