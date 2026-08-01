/**
 * AŞAMA 77 — Kids Club.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('kids-club', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'kid_1',
      childName: "Çocuk",
      guardian: "Veli",
      status: 'checked_in',
      at: new Date().toISOString(),
    }];
    writeCollection('kids-club', seed);
    return seed;
  }
  return list;
}

export function listKidsclub(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createKidsclub(input, actor = 'system') {
  const row = {
    id: `kid_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    childName: input.childName !== undefined ? input.childName : "Çocuk",
    guardian: input.guardian !== undefined ? input.guardian : "Veli",
    status: input.status || 'checked_in',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('kids-club', row, 300);
  appendAudit({
    actor,
    action: 'kidsclub.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateKidsclub(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('kids-club', list);
  appendAudit({ actor, action: 'kidsclub.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function kidsclubSummary() {
  const list = listKidsclub();
  return {
    total: list.length,
    checked_in: list.filter((x) => x.status === 'checked_in').length,
    checked_out: list.filter((x) => x.status === 'checked_out').length,
    entries: list,
  };
}
