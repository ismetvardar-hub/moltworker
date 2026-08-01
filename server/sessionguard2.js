/**
 * AŞAMA 904 — Session Guard.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('sessionguard2', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ses_1', session: "Alpha",
      device: "Beta", status: 'ok', at: new Date().toISOString() }];
    writeCollection('sessionguard2', seed);
    return seed;
  }
  return list;
}
export function listSessionguard2(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSessionguard2(input, actor = 'system') {
  const row = {
    id: `ses_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    session: input.session !== undefined ? input.session : "Alpha",
    device: input.device !== undefined ? input.device : "Beta",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('sessionguard2', row, 300);
  appendAudit({
    actor,
    action: 'sessionguard2.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSessionguard2(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('sessionguard2', list);
  appendAudit({ actor, action: 'sessionguard2.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function sessionguard2Summary() {
  const list = listSessionguard2();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, sessionguard2: list };
}
