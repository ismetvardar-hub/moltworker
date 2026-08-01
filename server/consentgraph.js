/**
 * AŞAMA 353 — Consent Graph.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('consentgraph', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'csg_1', guestName: "Misafir",
      channel: "WhatsApp", status: 'granted', at: new Date().toISOString() }];
    writeCollection('consentgraph', seed);
    return seed;
  }
  return list;
}
export function listConsentgraph(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createConsentgraph(input, actor = 'system') {
  const row = {
    id: `csg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    channel: input.channel !== undefined ? input.channel : "WhatsApp",
    status: input.status || 'granted',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('consentgraph', row, 300);
  appendAudit({
    actor,
    action: 'consentgraph.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateConsentgraph(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('consentgraph', list);
  appendAudit({ actor, action: 'consentgraph.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function consentgraphSummary() {
  const list = listConsentgraph();
  return { total: list.length, granted: list.filter((x) => x.status === 'granted').length,
    pending: list.filter((x) => x.status === 'pending').length,
    revoked: list.filter((x) => x.status === 'revoked').length, consentgraph: list };
}
