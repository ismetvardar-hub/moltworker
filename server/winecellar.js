/**
 * AŞAMA 85 — Şarap Mahzeni.
 */
import { randomBytes } from 'node:crypto';
import { prependItem, readCollection, writeCollection } from './store.js';
import { appendAudit } from './audit.js';

function ensure() {
  const list = readCollection('wine-cellar', null);
  if (!Array.isArray(list) || list.length === 0) {
    const seed = [{
      id: 'win_1',
      label: "Lokal kırmızı",
      qty: "6",
      status: 'ok',
      at: new Date().toISOString(),
    }];
    writeCollection('wine-cellar', seed);
    return seed;
  }
  return list;
}

export function listWinecellar(filter = {}) {
  let list = ensure();
  if (filter.status) list = list.filter((x) => x.status === filter.status);
  return list;
}

export function createWinecellar(input, actor = 'system') {
  const row = {
    id: `win_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`,
    label: input.label !== undefined ? input.label : "Lokal kırmızı",
    qty: Number(input.qty ?? "6") || 0,
    status: input.status || 'ok',
    at: new Date().toISOString(),
    createdBy: actor,
  };
  prependItem('wine-cellar', row, 300);
  appendAudit({
    actor,
    action: 'winecellar.create',
    detail: String(row.title || row.guestName || row.name || row.code || row.childName || row.bedNo || row.label || row.dish || row.metric || row.holderName || row.room || row.route || row.id),
    meta: { id: row.id },
  });
  return row;
}

export function updateWinecellar(id, patch, actor = 'system') {
  const list = ensure();
  const idx = list.findIndex((x) => x.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('wine-cellar', list);
  appendAudit({ actor, action: 'winecellar.update', detail: `${id} → ${list[idx].status || 'ok'}`, meta: { id } });
  return list[idx];
}

export function winecellarSummary() {
  const list = listWinecellar();
  return {
    total: list.length,
    ok: list.filter((x) => x.status === 'ok').length,
    low: list.filter((x) => x.status === 'low').length,
    bottles: list,
  };
}
