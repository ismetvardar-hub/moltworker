/**
 * AŞAMA 498 — Skill Matrix.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('skillmatrix', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'skm_1', person: "Ela",
      skill: "Sommelier", status: 'trainee', at: new Date().toISOString() }];
    writeCollection('skillmatrix', seed);
    return seed;
  }
  return list;
}
export function listSkillmatrix(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createSkillmatrix(input, actor = 'system') {
  const row = {
    id: `skm_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    person: input.person !== undefined ? input.person : "Ela",
    skill: input.skill !== undefined ? input.skill : "Sommelier",
    status: input.status || 'trainee',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('skillmatrix', row, 300);
  appendAudit({
    actor,
    action: 'skillmatrix.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateSkillmatrix(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('skillmatrix', list);
  appendAudit({ actor, action: 'skillmatrix.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function skillmatrixSummary() {
  const list = listSkillmatrix();
  return { total: list.length, trainee: list.filter((x) => x.status === 'trainee').length,
    proficient: list.filter((x) => x.status === 'proficient').length,
    trainer: list.filter((x) => x.status === 'trainer').length, skillmatrix: list };
}
