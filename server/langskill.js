/**
 * AŞAMA 260 — Dil Yetkinlik.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('langskill', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'lng_1', employee: "Mehmet",
      language: "EN",
      level: "B2", status: 'active', at: new Date().toISOString() }];
    writeCollection('langskill', seed);
    return seed;
  }
  return list;
}
export function listLangskill(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createLangskill(input, actor = 'system') {
  const row = {
    id: `lng_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    employee: input.employee !== undefined ? input.employee : "Mehmet",
    language: input.language !== undefined ? input.language : "EN",
    level: input.level !== undefined ? input.level : "B2",
    status: input.status || 'active',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('langskill', row, 300);
  appendAudit({ actor, action: 'langskill.create', detail: String(row.title || row.employee || row.candidate || row.fromEmp || row.topic || row.zone || row.award || row.cert || row.language || row.id), meta: { id: row.id } });
  return row;
}
export function updateLangskill(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('langskill', list);
  appendAudit({ actor, action: 'langskill.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function langskillSummary() {
  const list = listLangskill();
  return { total: list.length, active: list.filter((x) => x.status === 'active').length,
    review: list.filter((x) => x.status === 'review').length, langskill: list };
}
