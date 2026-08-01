/**
 * AŞAMA 402 — Talent Bet.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('talentbet', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tlb_1', role: "Agent Eng",
      bet: "Hire 3", status: 'open', at: new Date().toISOString() }];
    writeCollection('talentbet', seed);
    return seed;
  }
  return list;
}
export function listTalentbet(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTalentbet(input, actor = 'system') {
  const row = {
    id: `tlb_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    role: input.role !== undefined ? input.role : "Agent Eng",
    bet: input.bet !== undefined ? input.bet : "Hire 3",
    status: input.status || 'open',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('talentbet', row, 300);
  appendAudit({
    actor,
    action: 'talentbet.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTalentbet(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('talentbet', list);
  appendAudit({ actor, action: 'talentbet.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function talentbetSummary() {
  const list = listTalentbet();
  return { total: list.length, open: list.filter((x) => x.status === 'open').length,
    filled: list.filter((x) => x.status === 'filled').length,
    deferred: list.filter((x) => x.status === 'deferred').length, talentbet: list };
}
