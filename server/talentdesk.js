/**
 * AŞAMA 496 — Talent Desk.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';
function ensure() {
  const list = readCollection('talentdesk', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{ id: 'tld_1', candidate: "Aday",
      role: "FOH", status: 'sourced', at: new Date().toISOString() }];
    writeCollection('talentdesk', seed);
    return seed;
  }
  return list;
}
export function listTalentdesk(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}
export function createTalentdesk(input, actor = 'system') {
  const row = {
    id: `tld_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    candidate: input.candidate !== undefined ? input.candidate : "Aday",
    role: input.role !== undefined ? input.role : "FOH",
    status: input.status || 'sourced',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('talentdesk', row, 300);
  appendAudit({
    actor,
    action: 'talentdesk.create',
    detail: String(row.title || row.name || row.guestName || row.label || row.code || row.zone || row.sku || row.metric || row.id),
    meta: { id: row.id },
  });
  return row;
}
export function updateTalentdesk(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('talentdesk', list);
  appendAudit({ actor, action: 'talentdesk.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}
export function talentdeskSummary() {
  const list = listTalentdesk();
  return { total: list.length, sourced: list.filter((x) => x.status === 'sourced').length,
    interview: list.filter((x) => x.status === 'interview').length,
    offer: list.filter((x) => x.status === 'offer').length, talentdesk: list };
}
