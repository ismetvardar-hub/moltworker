/**
 * AŞAMA 1079 — Onboard Kit.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('onboardkit3', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'onb_1', partner: "Alpha",
      step: "Beta", status: 'ok', at: new Date().toISOString() }];
    writeCollection('onboardkit3', seed);
    return seed;
  }
  return list;
}
export function listOnboardkit3(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createOnboardkit3(input, actor = 'system') {
  const row = {
    id: `onb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    partner: input.partner !== undefined ? input.partner : "Alpha",
    step: input.step !== undefined ? input.step : "Beta",
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('onboardkit3', row, 300);
  appendAudit({
    actor,
    action: 'onboardkit3.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateOnboardkit3(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('onboardkit3', list);
  appendAudit({ actor, action: 'onboardkit3.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function onboardkit3Summary() {
  const list = listOnboardkit3();
  return { total: list.length, ok: list.filter((x) => x.status === 'ok').length,
    warn: list.filter((x) => x.status === 'warn').length,
    alarm: list.filter((x) => x.status === 'alarm').length, onboardkit3: list };
}
