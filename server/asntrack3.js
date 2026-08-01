/**
 * AŞAMA 1083 — ASN Track.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('asntrack3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'asn_1', asn: "Alpha",
      carrier: "Beta", status: 'idle', at: new Date().toISOString() }];
    writeCollection('asntrack3', seed);
    return seed;
  }
  return list;
}
export function listAsntrack3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createAsntrack3(input, actor = 'system') {
  const row = {
    id: `asn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    asn: input.asn !== undefined ? input.asn : "Alpha",
    carrier: input.carrier !== undefined ? input.carrier : "Beta",
    status: input.status || 'idle',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('asntrack3', row, 300);
  appendAudit({
    actor,
    action: 'asntrack3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateAsntrack3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('asntrack3', list);
  appendAudit({ actor, action: 'asntrack3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function asntrack3Summary() {
  const list = listAsntrack3();
  return { total: list.length, idle: list.filter((x) => x.status === 'idle').length,
    busy: list.filter((x) => x.status === 'busy').length,
    fault: list.filter((x) => x.status === 'fault').length, asntrack3: list };
}
