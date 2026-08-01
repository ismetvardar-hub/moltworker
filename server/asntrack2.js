/**
 * AŞAMA 933 — ASN Track.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('asntrack2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'asn_1', asn: "Alpha",
      carrier: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('asntrack2', seed);
    return seed;
  }
  return list;
}
export function listAsntrack2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAsntrack2(input, actor = 'system') {
  const row = {
    id: `asn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    asn: input.asn !== undefined ? input.asn : "Alpha",
    carrier: input.carrier !== undefined ? input.carrier : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('asntrack2', row, 300);
  appendAudit({
    actor,
    action: 'asntrack2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAsntrack2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('asntrack2', list);
  appendAudit({ actor, action: 'asntrack2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function asntrack2Summary() {
  const list = listAsntrack2();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, asntrack2: list };
}
