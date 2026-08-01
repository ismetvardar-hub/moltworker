/**
 * AŞAMA 639 — Keyless Door.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('keylessdoor', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'kld_1', door: "412",
      passId: "OP-88", status: 'armed', at: new Date().toISOString() }];
    writeCollection('keylessdoor', seed);
    return seed;
  }
  return list;
}
export function listKeylessdoor(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createKeylessdoor(input, actor = 'system') {
  const row = {
    id: `kld_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    door: input.door !== undefined ? input.door : "412",
    passId: input.passId !== undefined ? input.passId : "OP-88",
    status: input.status || 'armed',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('keylessdoor', row, 300);
  appendAudit({
    actor,
    action: 'keylessdoor.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateKeylessdoor(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('keylessdoor', list);
  appendAudit({ actor, action: 'keylessdoor.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function keylessdoorSummary() {
  const list = listKeylessdoor();
  return { total: list.length, armed: list.filter((x) => x.status === 'armed').length,
    granted: list.filter((x) => x.status === 'granted').length,
    denied: list.filter((x) => x.status === 'denied').length,
    revoked: list.filter((x) => x.status === 'revoked').length, keylessdoor: list };
}
