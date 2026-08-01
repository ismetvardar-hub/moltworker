/**
 * Adım 7+ — Açık AVM: kiracı, kira, F&B asgari harcama nabzı.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';

function rid(p) {
  return `${p}_${Date.now().toString(36)}_${randomBytes(2).toString('hex')}`;
}

function ensureTenants() {
  let list = readCollection('mall-tenants', null);
  if (!Array.isArray(list) || !list.length) {
    list = [
      { id: 'mt_1', name: 'Orman Market', category: 'market', unit: 'A-01', rent_try: 45000, fnb_min_try: 0, fnb_spend_try: 0, status: 'active' },
      { id: 'mt_2', name: 'Dere Kahve', category: 'cafe', unit: 'A-02', rent_try: 28000, fnb_min_try: 40000, fnb_spend_try: 18500, status: 'active' },
      { id: 'mt_3', name: 'Likya Kasap', category: 'butcher', unit: 'B-01', rent_try: 32000, fnb_min_try: 0, fnb_spend_try: 0, status: 'active' },
      { id: 'mt_4', name: 'Trail Kitchen', category: 'restaurant', unit: 'C-01', rent_try: 55000, fnb_min_try: 120000, fnb_spend_try: 64000, status: 'active' },
      { id: 'mt_5', name: 'Souvenir Hut', category: 'gift', unit: 'A-03', rent_try: 18000, fnb_min_try: 0, fnb_spend_try: 0, status: 'fitout' },
    ];
    writeCollection('mall-tenants', list);
  }
  return list.map((t) => ({
    ...t,
    fnb_spend_try: Number(t.fnb_spend_try) || 0,
    fnb_min_try: Number(t.fnb_min_try) || 0,
  }));
}

function withFnb(tenants) {
  return tenants.map((t) => {
    const min = Number(t.fnb_min_try) || 0;
    const spend = Number(t.fnb_spend_try) || 0;
    return {
      ...t,
      fnb_gap_try: Math.max(0, min - spend),
      fnb_met: min === 0 ? true : spend >= min,
      fnb_pct: min === 0 ? 100 : Math.min(100, Math.round((spend / min) * 100)),
    };
  });
}

export function openMallOverview() {
  const tenants = withFnb(ensureTenants());
  const fnbTargets = tenants.filter((t) => t.fnb_min_try > 0);
  return {
    title: 'Açık AVM',
    tenants,
    summary: {
      active: tenants.filter((t) => t.status === 'active').length,
      fitout: tenants.filter((t) => t.status === 'fitout').length,
      rent_roll: tenants.reduce((s, t) => s + (Number(t.rent_try) || 0), 0),
      fnb_targets: fnbTargets.length,
      fnb_met: fnbTargets.filter((t) => t.fnb_met).length,
      fnb_gap_total: fnbTargets.reduce((s, t) => s + t.fnb_gap_try, 0),
    },
    generatedAt: new Date().toISOString(),
  };
}

export function recordMallSale(input = {}, actor = 'system') {
  const list = ensureTenants();
  const idx = list.findIndex((t) => t.id === (input.tenant_id || 'mt_4'));
  if (idx < 0) return { ok: false, error: 'Kiracı yok' };
  const amount = Number(input.amount_try) || 0;
  const row = {
    id: rid('ms'),
    tenant_id: list[idx].id,
    amount_try: amount,
    channel: input.channel || 'pos',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('mall-sales', row, 500);
  list[idx] = {
    ...list[idx],
    fnb_spend_try: (Number(list[idx].fnb_spend_try) || 0) + amount,
  };
  writeCollection('mall-tenants', list);
  appendAudit({
    actor,
    action: 'mall.sale',
    detail: `${row.tenant_id} · ${row.amount_try}`,
    meta: { id: row.id },
  });
  return { ok: true, sale: row, tenant: withFnb([list[idx]])[0], overview: openMallOverview() };
}

export function updateMallTenant(id, patch = {}, actor = 'system') {
  const list = ensureTenants();
  const idx = list.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch, id, updatedAt: new Date().toISOString() };
  writeCollection('mall-tenants', list);
  appendAudit({ actor, action: 'mall.tenant', detail: `${id} → ${list[idx].status}`, meta: { id } });
  return withFnb([list[idx]])[0];
}
