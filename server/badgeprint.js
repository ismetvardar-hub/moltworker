/**
 * AŞAMA 80 — Kart Baskı.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('badge-prints', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'bad_1',
      holderName: "İsim",
      reason: "kayıp",
      status: 'queued',
      at: new Date().toISOString(),
    }];
    writeCollection('badge-prints', seed);
    return seed;
  }
  return list;
}

export function listBadgeprint(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createBadgeprint(input, actor = 'system') {
  const row = {
    id: `bad_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    holderName: input.holderName !== undefined ? input.holderName : "İsim",
    reason: input.reason !== undefined ? input.reason : "kayıp",
    status: input.status || 'queued',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('badge-prints', row, 300);
  appendAudit({
    actor,
    action: 'badgeprint.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateBadgeprint(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('badge-prints', list);
  appendAudit({ actor, action: 'badgeprint.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function badgeprintSummary() {
  const list = listBadgeprint();
  return {
    total: list.length,
    queued: list.filter((x) => x.status === 'queued').length,
    printed: list.filter((x) => x.status === 'printed').length,
    jobs: list,
  };
}
