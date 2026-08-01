/**
 * Adım 7 — Açık AVM: kiracı, kira, F&B asgari.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';

function rid(p) { return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`; }

function ensureTenants() {
  let list = readCollection('mall-tenants', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'mt_1', name: 'Orman Market', category: 'market', unit: 'A-01', rent_try: 45000, fnb_min_try: 0, status: 'active' },
      { id: 'mt_2', name: 'Dere Kahve', category: 'cafe', unit: 'A-02', rent_try: 28000, fnb_min_try: 0, status: 'active' },
      { id: 'mt_3', name: 'Likya Kasap', category: 'butcher', unit: 'B-01', rent_try: 32000, fnb_min_try: 0, status: 'active' },
      { id: 'mt_4', name: 'Trail Kitchen', category: 'restaurant', unit: 'C-01', rent_try: 55000, fnb_min_try: 120000, status: 'active' },
      { id: 'mt_5', name: 'Souvenir Hut', category: 'gift', unit: 'A-03', rent_try: 18000, fnb_min_try: 0, status: 'fitout' },
    ];
    writeCollection('mall-tenants', list);
  }
  return list;
}

export function openMallOverview() {
  const tenants = ensureTenants();
  return {
    title: 'Açık AVM',
    tenants,
    summary: {
      active: tenants.filter((t) => t.status === 'active').length,
      fitout: tenants.filter((t) => t.status === 'fitout').length,
      rent_roll: tenants.reduce((s, t) => s + (Number(t.rent_try) || 0), 0),
    },
    generatedAt: new Date().toISOString(),
  };
}

export function recordMallSale(input = {}, actor = 'system') {
  const row = {
    id: rid('ms'),
    tenant_id: input.tenant_id || 'mt_4',
    amount_try: Number(input.amount_try) || 0,
    channel: input.channel || 'pos',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('mall-sales', row, 500);
  appendAudit({ actor, action: 'mall.sale', detail: `${row.tenant_id} · ${row.amount_try}`, meta: { id: row.id } });
  return { ok: true, sale: row };
}

export function updateMallTenant(id, patch = {}, actor = 'system') {
  const list = ensureTenants();
  const idx = list.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('mall-tenants', list);
  appendAudit({ actor, action: 'mall.tenant', detail: `${id} → ${list[idx].status}`, meta: { id } });
  return list[idx];
}
