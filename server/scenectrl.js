/**
 * AŞAMA 447 — Scene Control.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('scenectrl', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'scn_1', scene: "Welcome",
      operator: "ARTE", status: 'stored', at: new Date().toISOString() }];
    writeCollection('scenectrl', seed);
    return seed;
  }
  return list;
}
export function listScenectrl(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createScenectrl(input, actor = 'system') {
  const row = {
    id: `scn_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    scene: input.scene !== undefined ? input.scene : "Welcome",
    operator: input.operator !== undefined ? input.operator : "ARTE",
    status: input.status || 'stored',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('scenectrl', row, 300);
  appendAudit({
    actor,
    action: 'scenectrl.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateScenectrl(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('scenectrl', list);
  appendAudit({ actor, action: 'scenectrl.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function scenectrlSummary() {
  const list = listScenectrl();
  return { total: list.length, stored: list.filter((x) => x.status === 'stored').length,
    recalled: list.filter((x) => x.status === 'recalled').length,
    dirty: list.filter((x) => x.status === 'dirty').length, scenectrl: list };
}
