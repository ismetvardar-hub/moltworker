/**
 * AŞAMA 1081 — Inbound PO.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('inboundpo3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'inb_1', po: "Alpha",
      vendor: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('inboundpo3', seed);
    return seed;
  }
  return list;
}
export function listInboundpo3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createInboundpo3(input, actor = 'system') {
  const row = {
    id: `inb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    po: input.po !== undefined ? input.po : "Alpha",
    vendor: input.vendor !== undefined ? input.vendor : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('inboundpo3', row, 300);
  appendAudit({
    actor,
    action: 'inboundpo3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateInboundpo3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('inboundpo3', list);
  appendAudit({ actor, action: 'inboundpo3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function inboundpo3Summary() {
  const list = listInboundpo3();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, inboundpo3: list };
}
