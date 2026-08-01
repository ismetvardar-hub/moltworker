/**
 * Adım 7+ — Açık AVM: kiracı, kira, F&B asgari harcama nabzı.
 */
import { randomBytes } from 'node:crypto';
import { readCollection, writeCollection, prependItem } from './store.js';
import { appendAudit } from './audit.js';
import { enqueueAgentJob } from './agentqueue.js';

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
  const sales = readCollection('mall-sales', []) || [];
  const today = new Date().toISOString().slice(0, 10);
  const todaySales = (Array.isArray(sales) ? sales : []).filter((s) => String(s.at || '').startsWith(today));
  const day_sales_try = todaySales.reduce((s, x) => s + (Number(x.amount_try) || 0), 0);
  const invoices = readCollection('mall-invoices', []) || [];
  const invList = Array.isArray(invoices) ? invoices : [];
  const unpaid = invList.filter((i) => i.status === 'open' || i.status === 'partial');
  const overdue = unpaid.filter((i) => i.due_date && i.due_date < today);
  const payments = readCollection('mall-payments', []) || [];
  const camRuns = readCollection('mall-cam-runs', []) || [];
  const holds = readCollection('mall-lease-holds', []) || [];
  const openHolds = (Array.isArray(holds) ? holds : []).filter((h) => h.status === 'open');
  return {
    title: 'Açık AVM',
    tenants,
    day: { date: today, tickets: todaySales.length, sales_try: day_sales_try },
    invoices: invList.slice(0, 40),
    payments: (Array.isArray(payments) ? payments : []).slice(0, 20),
    cam_runs: (Array.isArray(camRuns) ? camRuns : []).slice(0, 10),
    lease_holds: (Array.isArray(holds) ? holds : []).slice(0, 20),
    summary: {
      active: tenants.filter((t) => t.status === 'active').length,
      fitout: tenants.filter((t) => t.status === 'fitout').length,
      on_hold: tenants.filter((t) => t.status === 'hold').length,
      rent_roll: tenants.reduce((s, t) => s + (Number(t.rent_try) || 0), 0),
      fnb_targets: fnbTargets.length,
      fnb_met: fnbTargets.filter((t) => t.fnb_met).length,
      fnb_gap_total: fnbTargets.reduce((s, t) => s + t.fnb_gap_try, 0),
      day_sales_try,
      day_tickets: todaySales.length,
      invoices_open: unpaid.length,
      invoices_overdue: overdue.length,
      invoices_balance_try: unpaid.reduce(
        (s, i) => s + Math.max(0, (Number(i.total_try) || 0) - (Number(i.paid_try) || 0)),
        0,
      ),
      cam_invoices_open: unpaid.filter((i) => i.kind === 'cam' || (i.lines || []).some((l) => l.code === 'cam')).length,
      lease_holds_open: openHolds.length,
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

/** Günlük POS rollup — kiracı bazlı */
export function mallDayRollup(actor = 'system') {
  const overview = openMallOverview();
  const sales = readCollection('mall-sales', []) || [];
  const today = overview.day.date;
  const todaySales = (Array.isArray(sales) ? sales : []).filter((s) => String(s.at || '').startsWith(today));
  const byTenant = {};
  for (const s of todaySales) {
    byTenant[s.tenant_id] = (byTenant[s.tenant_id] || 0) + (Number(s.amount_try) || 0);
  }
  const rollup = {
    id: rid('mdr'),
    date: today,
    by_tenant: byTenant,
    total_try: overview.summary.day_sales_try,
    tickets: overview.summary.day_tickets,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('mall-day-rollups', rollup, 90);
  appendAudit({ actor, action: 'mall.day_rollup', detail: `${today} · ${rollup.total_try} TRY`, meta: { id: rollup.id } });
  return { ok: true, rollup, overview: openMallOverview() };
}

/** F&B asgari harcama kapanışı — gap sıfırla / period reset */
export function settleMallTenantFnb(input = {}, actor = 'system') {
  const list = ensureTenants();
  const idx = list.findIndex((t) => t.id === input.tenant_id);
  if (idx < 0) return { ok: false, error: 'Kiracı yok' };
  const t = list[idx];
  if (!t.fnb_min_try) return { ok: false, error: 'F&B hedefi yok' };
  const before = withFnb([t])[0];
  const credit = Number(input.credit_try);
  const spend = Number.isFinite(credit)
    ? (Number(t.fnb_spend_try) || 0) + credit
    : Number(t.fnb_min_try) || 0;
  list[idx] = {
    ...t,
    fnb_spend_try: spend,
    fnb_settled_at: new Date().toISOString(),
    fnb_period: input.period || t.fnb_period || '2026-08',
  };
  writeCollection('mall-tenants', list);
  const after = withFnb([list[idx]])[0];
  const settlement = {
    id: rid('mfs'),
    tenant_id: t.id,
    before_gap: before.fnb_gap_try,
    after_gap: after.fnb_gap_try,
    spend,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('mall-fnb-settlements', settlement, 100);
  appendAudit({
    actor,
    action: 'mall.fnb_settle',
    detail: `${t.name || t.id} gap ${before.fnb_gap_try} → ${after.fnb_gap_try}`,
    meta: { id: settlement.id },
  });
  return { ok: true, settlement, tenant: after, overview: openMallOverview() };
}

/** Aylık kira + F&B gap + opsiyonel ciro payı faturası */
export function generateMallRentRun(input = {}, actor = 'system') {
  const period = input.period || new Date().toISOString().slice(0, 7);
  const tenants = withFnb(ensureTenants()).filter((t) => t.status === 'active' || (input.include_hold && t.status === 'hold'));
  const sales = readCollection('mall-sales', []) || [];
  const salesList = Array.isArray(sales) ? sales : [];
  const existing = readCollection('mall-invoices', []) || [];
  const invoices = Array.isArray(existing) ? [...existing] : [];
  const created = [];
  const due = new Date();
  due.setDate(due.getDate() + (Number(input.due_days) || 10));
  const dueDate = due.toISOString().slice(0, 10);

  for (const t of tenants) {
    if (input.tenant_id && t.id !== input.tenant_id) continue;
    if (!input.force && invoices.some((i) => i.tenant_id === t.id && i.period === period && i.status !== 'void')) {
      continue;
    }
    const periodSales = salesList
      .filter((s) => s.tenant_id === t.id && String(s.at || '').startsWith(period))
      .reduce((s, x) => s + (Number(x.amount_try) || 0), 0);
    const lines = [
      { code: 'rent', label: 'Kira', amount_try: Number(t.rent_try) || 0 },
    ];
    if (t.fnb_gap_try > 0) {
      lines.push({ code: 'fnb_shortfall', label: 'F&B asgari fark', amount_try: t.fnb_gap_try });
    }
    const varPct = Number(input.variable_pct);
    if (Number.isFinite(varPct) && varPct > 0 && periodSales > 0) {
      lines.push({
        code: 'variable',
        label: `Ciro payı %${varPct}`,
        amount_try: Math.round(periodSales * (varPct / 100)),
      });
    }
    const total = lines.reduce((s, l) => s + (Number(l.amount_try) || 0), 0);
    const invoice = {
      id: rid('minv'),
      tenant_id: t.id,
      tenant_name: t.name,
      unit: t.unit,
      period,
      lines,
      total_try: total,
      paid_try: 0,
      status: 'open',
      due_date: dueDate,
      at: new Date().toISOString(),
      actor,
    };
    invoices.unshift(invoice);
    created.push(invoice);
  }
  writeCollection('mall-invoices', invoices.slice(0, 400));
  if (!created.length) return { ok: false, error: 'Yeni fatura yok (dönem zaten üretildi?)' };
  appendAudit({
    actor,
    action: 'mall.rent_run',
    detail: `${period} · ${created.length} fatura · ${created.reduce((s, i) => s + i.total_try, 0)} TRY`,
    meta: { period, n: created.length },
  });
  return { ok: true, period, created, overview: openMallOverview() };
}

/** Fatura tahsilatı — partial/paid */
export function payMallInvoice(input = {}, actor = 'system') {
  const invoices = readCollection('mall-invoices', []) || [];
  if (!Array.isArray(invoices) || !invoices.length) return { ok: false, error: 'Fatura yok' };
  let idx = invoices.findIndex((i) => i.id === input.invoice_id && (i.status === 'open' || i.status === 'partial'));
  if (idx < 0) {
    idx = invoices.findIndex(
      (i) =>
        (i.status === 'open' || i.status === 'partial') &&
        (!input.tenant_id || i.tenant_id === input.tenant_id),
    );
  }
  if (idx < 0) return { ok: false, error: 'Açık fatura yok' };
  const inv = invoices[idx];
  const balance = Math.max(0, (Number(inv.total_try) || 0) - (Number(inv.paid_try) || 0));
  let amount = Number(input.amount_try);
  if (!Number.isFinite(amount) || amount <= 0) amount = balance;
  amount = Math.min(amount, balance);
  const paid = (Number(inv.paid_try) || 0) + amount;
  const status = paid >= (Number(inv.total_try) || 0) ? 'paid' : 'partial';
  invoices[idx] = {
    ...inv,
    paid_try: paid,
    status,
    last_payment_at: new Date().toISOString(),
  };
  writeCollection('mall-invoices', invoices);
  const payment = {
    id: rid('mpay'),
    invoice_id: inv.id,
    tenant_id: inv.tenant_id,
    amount_try: amount,
    method: input.method || 'transfer',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('mall-payments', payment, 300);
  appendAudit({
    actor,
    action: 'mall.invoice_pay',
    detail: `${inv.tenant_name || inv.tenant_id} · ${amount} TRY → ${status}`,
    meta: { id: payment.id, invoice_id: inv.id },
  });
  return { ok: true, payment, invoice: invoices[idx], overview: openMallOverview() };
}

/** Gecikmiş fatura dunning → MINT / HERMES-SALES */
export function runMallDunningSweep(input = {}, actor = 'system') {
  const today = new Date().toISOString().slice(0, 10);
  const invoices = readCollection('mall-invoices', []) || [];
  const unpaid = (Array.isArray(invoices) ? invoices : []).filter((i) => {
    if (i.status !== 'open' && i.status !== 'partial') return false;
    if (input.force) return true;
    return i.due_date && i.due_date < today;
  });
  const jobs = [];
  for (const inv of unpaid) {
    const balance = Math.max(0, (Number(inv.total_try) || 0) - (Number(inv.paid_try) || 0));
    const agent = balance >= 50000 ? 'MINT' : 'HERMES-SALES';
    const job = enqueueAgentJob(
      {
        agent,
        title: `mall dunning · ${inv.tenant_name || inv.tenant_id} · ${balance} TRY`,
        priority: balance >= 50000 ? 'high' : 'normal',
        payload: { invoice_id: inv.id, tenant_id: inv.tenant_id, balance_try: balance },
      },
      actor,
    );
    jobs.push({ invoice_id: inv.id, agent, job_id: job?.id || null, balance_try: balance });
  }
  const sweep = {
    id: rid('mds'),
    overdue: unpaid.length,
    balance_try: unpaid.reduce(
      (s, i) => s + Math.max(0, (Number(i.total_try) || 0) - (Number(i.paid_try) || 0)),
      0,
    ),
    jobs: jobs.length,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('mall-dunning-sweeps', sweep, 80);
  if (unpaid.length && input.force_due) {
    // demo: mark oldest open as overdue-friendly already via due_date
  }
  appendAudit({
    actor,
    action: 'mall.dunning',
    detail: `${sweep.overdue} gecikmiş · ${sweep.balance_try} TRY`,
    meta: { id: sweep.id },
  });
  return { ok: true, sweep, jobs, overview: openMallOverview() };
}

/** Ortak alan (CAM) masraf dağıtımı — kiracı faturaları */
export function generateMallCamRun(input = {}, actor = 'system') {
  const period = input.period || new Date().toISOString().slice(0, 7);
  const tenants = withFnb(ensureTenants()).filter((t) => t.status === 'active');
  if (!tenants.length) return { ok: false, error: 'Aktif kiracı yok' };
  const pool = Number(input.pool_try);
  const camPool = Number.isFinite(pool) && pool > 0
    ? pool
    : Math.round(tenants.reduce((s, t) => s + (Number(t.rent_try) || 0), 0) * (Number(input.cam_pct) || 0.12));
  const rentRoll = tenants.reduce((s, t) => s + (Number(t.rent_try) || 0), 0) || 1;
  const existing = readCollection('mall-invoices', []) || [];
  const invoices = Array.isArray(existing) ? [...existing] : [];
  const created = [];
  const due = new Date();
  due.setDate(due.getDate() + (Number(input.due_days) || 14));
  const dueDate = due.toISOString().slice(0, 10);

  for (const t of tenants) {
    if (input.tenant_id && t.id !== input.tenant_id) continue;
    if (
      !input.force &&
      invoices.some((i) => i.tenant_id === t.id && i.period === period && i.kind === 'cam' && i.status !== 'void')
    ) {
      continue;
    }
    const share = Math.max(1, Math.round(camPool * ((Number(t.rent_try) || 0) / rentRoll)));
    const invoice = {
      id: rid('mcam'),
      tenant_id: t.id,
      tenant_name: t.name,
      unit: t.unit,
      period,
      kind: 'cam',
      lines: [{ code: 'cam', label: 'Ortak alan (CAM)', amount_try: share }],
      total_try: share,
      paid_try: 0,
      status: 'open',
      due_date: dueDate,
      at: new Date().toISOString(),
      actor,
    };
    invoices.unshift(invoice);
    created.push(invoice);
  }
  writeCollection('mall-invoices', invoices.slice(0, 500));
  if (!created.length) return { ok: false, error: 'CAM faturası yok (dönem zaten üretildi?)' };
  const run = {
    id: rid('mcr'),
    period,
    pool_try: camPool,
    invoices: created.length,
    total_try: created.reduce((s, i) => s + i.total_try, 0),
    at: new Date().toISOString(),
    actor,
  };
  prependItem('mall-cam-runs', run, 80);
  enqueueAgentJob(
    {
      agent: 'MINT',
      title: `CAM run · ${period} · ${run.invoices} fatura · ${run.total_try} TRY`,
      priority: 'normal',
      payload: { cam_run_id: run.id, period },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'mall.cam_run',
    detail: `${period} · ${run.invoices} · ${run.total_try} TRY`,
    meta: { id: run.id },
  });
  return { ok: true, run, created, overview: openMallOverview() };
}

/** Kronik gecikme → lease hold */
export function holdMallLease(input = {}, actor = 'system') {
  const tenants = ensureTenants();
  const invoices = readCollection('mall-invoices', []) || [];
  const today = new Date().toISOString().slice(0, 10);
  let tenant = tenants.find((t) => t.id === input.tenant_id || t.name === input.tenant_id);
  if (!tenant) {
    const overdueByTenant = {};
    for (const inv of Array.isArray(invoices) ? invoices : []) {
      if (inv.status !== 'open' && inv.status !== 'partial') continue;
      if (!input.force && (!inv.due_date || inv.due_date >= today)) continue;
      const bal = Math.max(0, (Number(inv.total_try) || 0) - (Number(inv.paid_try) || 0));
      overdueByTenant[inv.tenant_id] = (overdueByTenant[inv.tenant_id] || 0) + bal;
    }
    const best = Object.entries(overdueByTenant).sort((a, b) => b[1] - a[1])[0];
    if (best) tenant = tenants.find((t) => t.id === best[0]);
  }
  if (!tenant && input.force) tenant = tenants.find((t) => t.status === 'active');
  if (!tenant) return { ok: false, error: 'Hold edilecek kiracı yok' };
  if (tenant.status === 'hold' && !input.force) {
    return { ok: true, tenant: withFnb([tenant])[0], already: true, overview: openMallOverview() };
  }
  const balance = (Array.isArray(invoices) ? invoices : [])
    .filter((i) => i.tenant_id === tenant.id && (i.status === 'open' || i.status === 'partial'))
    .reduce((s, i) => s + Math.max(0, (Number(i.total_try) || 0) - (Number(i.paid_try) || 0)), 0);
  const idx = tenants.findIndex((t) => t.id === tenant.id);
  tenants[idx] = {
    ...tenants[idx],
    status: 'hold',
    previous_status: tenant.status === 'hold' ? tenant.previous_status || 'active' : tenant.status,
    hold_at: new Date().toISOString(),
    hold_reason: input.reason || 'chronic_unpaid',
  };
  writeCollection('mall-tenants', tenants);
  const hold = {
    id: rid('mlh'),
    tenant_id: tenant.id,
    tenant_name: tenant.name,
    unit: tenant.unit,
    balance_try: balance,
    reason: tenants[idx].hold_reason,
    status: 'open',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('mall-lease-holds', hold, 120);
  enqueueAgentJob(
    {
      agent: 'MINT',
      title: `lease hold · ${tenant.name} · ${balance} TRY`,
      priority: 'high',
      payload: { hold_id: hold.id, tenant_id: tenant.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'mall.lease_hold',
    detail: `${tenant.name} · ${balance} TRY`,
    meta: { id: hold.id },
  });
  return { ok: true, hold, tenant: withFnb([tenants[idx]])[0], overview: openMallOverview() };
}

/** Ödeme sonrası lease hold kaldır */
export function releaseMallLease(input = {}, actor = 'system') {
  const holds = readCollection('mall-lease-holds', []) || [];
  if (!Array.isArray(holds) || !holds.length) return { ok: false, error: 'Hold yok' };
  let idx = holds.findIndex((h) => h.id === input.id && h.status === 'open');
  if (idx < 0) {
    idx = holds.findIndex(
      (h) => h.status === 'open' && (!input.tenant_id || h.tenant_id === input.tenant_id),
    );
  }
  if (idx < 0) return { ok: false, error: 'Açık hold yok' };
  const row = holds[idx];
  holds[idx] = {
    ...row,
    status: 'released',
    released_at: new Date().toISOString(),
    released_by: actor,
    note: input.note || 'paid',
  };
  writeCollection('mall-lease-holds', holds);
  const tenants = ensureTenants();
  const tidx = tenants.findIndex((t) => t.id === row.tenant_id);
  if (tidx >= 0) {
    tenants[tidx] = {
      ...tenants[tidx],
      status: tenants[tidx].previous_status || 'active',
      previous_status: null,
      hold_at: null,
      hold_reason: null,
      released_at: holds[idx].released_at,
    };
    writeCollection('mall-tenants', tenants);
  }
  enqueueAgentJob(
    {
      agent: 'MINT',
      title: `lease release · ${row.tenant_name}`,
      priority: 'normal',
      payload: { hold_id: row.id, tenant_id: row.tenant_id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'mall.lease_release',
    detail: row.tenant_name,
    meta: { id: row.id },
  });
  return {
    ok: true,
    hold: holds[idx],
    tenant: tidx >= 0 ? withFnb([tenants[tidx]])[0] : null,
    overview: openMallOverview(),
  };
}
