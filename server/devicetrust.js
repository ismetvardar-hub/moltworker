/**
 * AŞAMA 695 — Device Trust.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('devicetrust', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'dev_1', device: "Alpha",
      score: "5", status: 'planned', at: new Date().toISOString() }];
    writeCollection('devicetrust', seed);
    return seed;
  }
  return list;
}
export function listDevicetrust(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createDevicetrust(input, actor = 'system') {
  const row = {
    id: `dev_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    device: input.device !== undefined ? input.device : "Alpha",
    score: input.score !== undefined ? Number(input.score) || 0 : 5,
    status: input.status || 'planned',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('devicetrust', row, 300);
  appendAudit({
    actor,
    action: 'devicetrust.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateDevicetrust(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('devicetrust', list);
  appendAudit({ actor, action: 'devicetrust.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function devicetrustSummary() {
  const list = listDevicetrust();
  return { total: list.length, planned: list.filter((x) => x.status === 'planned').length,
    doing: list.filter((x) => x.status === 'doing').length,
    done: list.filter((x) => x.status === 'done').length, devicetrust: list };
}
