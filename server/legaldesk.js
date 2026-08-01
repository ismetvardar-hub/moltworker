/**
 * AŞAMA 812 — Legal Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('legaldesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'leg_1', matter: "Alpha",
      owner: "Beta", status: 'queued', at: new Date().toISOString() }];
    writeCollection('legaldesk', seed);
    return seed;
  }
  return list;
}
export function listLegaldesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLegaldesk(input, actor = 'system') {
  const row = {
    id: `leg_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    matter: input.matter !== undefined ? input.matter : "Alpha",
    owner: input.owner !== undefined ? input.owner : "Beta",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('legaldesk', row, 300);
  appendAudit({
    actor,
    action: 'legaldesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateLegaldesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('legaldesk', list);
  appendAudit({ actor, action: 'legaldesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function legaldeskSummary() {
  const list = listLegaldesk();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    running: list.filter((x) => x.status === 'running').length,
    done: list.filter((x) => x.status === 'done').length, legaldesk: list };
}
