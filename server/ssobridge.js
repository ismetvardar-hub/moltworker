/**
 * AŞAMA 698 — SSO Bridge.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('ssobridge', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'sso_1', idp: "Alpha",
      app: "Beta", status: 'green', at: new Date().toISOString() }];
    writeCollection('ssobridge', seed);
    return seed;
  }
  return list;
}
export function listSsobridge(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSsobridge(input, actor = 'system') {
  const row = {
    id: `sso_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    idp: input.idp !== undefined ? input.idp : "Alpha",
    app: input.app !== undefined ? input.app : "Beta",
    status: input.status || 'green',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('ssobridge', row, 300);
  appendAudit({
    actor,
    action: 'ssobridge.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSsobridge(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('ssobridge', list);
  appendAudit({ actor, action: 'ssobridge.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function ssobridgeSummary() {
  const list = listSsobridge();
  return { total: list.length, green: list.filter((x) => x.status === 'green').length,
    amber: list.filter((x) => x.status === 'amber').length,
    red: list.filter((x) => x.status === 'red').length, ssobridge: list };
}
