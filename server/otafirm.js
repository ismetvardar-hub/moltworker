/**
 * AŞAMA 335 — OTA Firmware.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('otafirm', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'otf_1', device: "Gate-3",
      version: "2.4.1", status: 'queued', at: new Date().toISOString() }];
    writeCollection('otafirm', seed);
    return seed;
  }
  return list;
}
export function listOtafirm(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createOtafirm(input, actor = 'system') {
  const row = {
    id: `otf_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    device: input.device !== undefined ? input.device : "Gate-3",
    version: input.version !== undefined ? input.version : "2.4.1",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('otafirm', row, 300);
  appendAudit({
    actor,
    action: 'otafirm.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateOtafirm(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('otafirm', list);
  appendAudit({ actor, action: 'otafirm.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function otafirmSummary() {
  const list = listOtafirm();
  return { total: list.length, queued: list.filter((x) => x.status === 'queued').length,
    flashing: list.filter((x) => x.status === 'flashing').length,
    done: list.filter((x) => x.status === 'done').length,
    failed: list.filter((x) => x.status === 'failed').length, otafirm: list };
}
