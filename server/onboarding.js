/**
 * AŞAMA 256 — Onboarding.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('onboarding', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'onb_1', employee: "Yeni",
      role: "Garson", status: 'started', at: new Date().toISOString() }];
    writeCollection('onboarding', seed);
    return seed;
  }
  return list;
}
export function listOnboarding(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createOnboarding(input, actor = 'system') {
  const row = {
    id: `onb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    employee: input.employee !== undefined ? input.employee : "Yeni",
    role: input.role !== undefined ? input.role : "Garson",
    status: input.status || 'started',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('onboarding', row, 300);
  appendAudit({ actor, action: 'onboarding.create', detail: String(row.title || row.employee || row.candidate || row.fromEmp || row.topic || row.zone || row.award || row.cert || row.language || row.id), meta: { id: row.id } });
  return row;
}
export function updateOnboarding(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('onboarding', list);
  appendAudit({ actor, action: 'onboarding.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function onboardingSummary() {
  const list = listOnboarding();
  return { total: list.length, started: list.filter((x) => x.status === 'started').length,
    in_progress: list.filter((x) => x.status === 'in_progress').length,
    done: list.filter((x) => x.status === 'done').length, onboarding: list };
}
