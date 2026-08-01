/**
 * AŞAMA 721 — Inbound PO.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('inboundpo', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'inb_1', po: "Alpha",
      vendor: "Beta", status: 'planned', at: new Date().toISOString() }];
    writeCollection('inboundpo', seed);
    return seed;
  }
  return list;
}
export function listInboundpo(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createInboundpo(input, actor = 'system') {
  const row = {
    id: `inb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    po: input.po !== undefined ? input.po : "Alpha",
    vendor: input.vendor !== undefined ? input.vendor : "Beta",
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('inboundpo', row, 300);
  appendAudit({
    actor,
    action: 'inboundpo.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateInboundpo(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('inboundpo', list);
  appendAudit({ actor, action: 'inboundpo.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function inboundpoSummary() {
  const list = listInboundpo();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, inboundpo: list };
}
