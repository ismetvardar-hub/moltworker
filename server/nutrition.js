/**
 * AŞAMA 477 — Nutrition Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('nutrition', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'ntr_1', guestName: "Misafir",
      plan: "Mediterranean", status: 'intake', at: new Date().toISOString() }];
    writeCollection('nutrition', seed);
    return seed;
  }
  return list;
}
export function listNutrition(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createNutrition(input, actor = 'system') {
  const row = {
    id: `ntr_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    guestName: input.guestName !== undefined ? input.guestName : "Misafir",
    plan: input.plan !== undefined ? input.plan : "Mediterranean",
    status: input.status || 'intake',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('nutrition', row, 300);
  appendAudit({
    actor,
    action: 'nutrition.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateNutrition(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('nutrition', list);
  appendAudit({ actor, action: 'nutrition.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function nutritionSummary() {
  const list = listNutrition();
  return { total: list.length, intake: list.filter((x) => x.status === 'intake').length,
    active: list.filter((x) => x.status === 'active').length,
    review: list.filter((x) => x.status === 'review').length, nutrition: list };
}
