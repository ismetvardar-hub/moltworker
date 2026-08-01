import { readFileSync, writeFileSync } from 'node:fs';

const p = '/workspace/server/marketos.js';
let t = readFileSync(p, 'utf8');

// Enrich checkout for rentals with due_at + deposit
const oldCheckoutOrder = `  const order = {
    id: rid('mo'),
    listing_id: item.id,
    mode: item.mode,
    title: item.title,
    price_try: item.price_try,
    buyer: input.buyer || actor,
    status: item.mode === 'rent' ? 'rented' : 'sold',
    at: new Date().toISOString(),
  };`;

const newCheckoutOrder = `  const days = Math.max(1, Number(input.days) || 1);
  const order = {
    id: rid('mo'),
    listing_id: item.id,
    mode: item.mode,
    title: item.title,
    price_try: item.price_try,
    deposit_try: item.mode === 'rent' ? Number(item.deposit_try) || Number(input.deposit_try) || 0 : 0,
    buyer: input.buyer || actor,
    status: item.mode === 'rent' ? 'rented' : 'sold',
    due_at:
      item.mode === 'rent'
        ? input.due_at || new Date(Date.now() + days * 86400_000).toISOString()
        : null,
    at: new Date().toISOString(),
  };`;

if (t.includes(oldCheckoutOrder)) {
  t = t.replace(oldCheckoutOrder, newCheckoutOrder);
  console.log('checkout enriched');
} else if (!t.includes('due_at:')) {
  console.error('CHECKOUT_PATTERN_MISS');
  process.exit(1);
}

// Allow return of overdue rentals
t = t.replace(
  `  if (!order) order = olist.find((o) => o.listing_id === input.listing_id && o.status === 'rented');`,
  `  if (!order) order = olist.find((o) => o.listing_id === input.listing_id && (o.status === 'rented' || o.status === 'overdue'));`,
);
t = t.replace(
  `    const idx = list.findIndex((l) => l.id === input.listing_id && l.status === 'rented');`,
  `    const idx = list.findIndex((l) => l.id === input.listing_id && (l.status === 'rented' || l.status === 'overdue'));`,
);

// Overview summary extras
const oldSummary = `    summary: {
      buy: listings.filter((l) => l.mode === 'buy' && l.status === 'live').length,
      rent: listings.filter((l) => l.mode === 'rent' && l.status === 'live').length,
      used: listings.filter((l) => l.mode === 'used' && l.status === 'live').length,
      channelled: listings.filter((l) => (l.channels || []).length).length,
      low_stock: low.length,
      open_pos: openPo.length,
    },`;

const newSummary = `    summary: {
      buy: listings.filter((l) => l.mode === 'buy' && l.status === 'live').length,
      rent: listings.filter((l) => l.mode === 'rent' && l.status === 'live').length,
      used: listings.filter((l) => l.mode === 'used' && l.status === 'live').length,
      channelled: listings.filter((l) => (l.channels || []).length).length,
      low_stock: low.length,
      open_pos: openPo.length,
      overdue_rentals: listings.filter((l) => l.status === 'overdue').length,
      open_damage: (readCollection('market-damage-assessments', []) || []).filter((d) => d.status === 'open').length,
      unsettled_deposits: (readCollection('market-orders', []) || []).filter(
        (o) => o.mode === 'rent' && o.status === 'returned' && !o.deposit_settled_at,
      ).length,
    },`;

if (t.includes(oldSummary)) {
  t = t.replace(oldSummary, newSummary);
  console.log('summary enriched');
}

if (t.includes('export function flagMarketRentalOverdue')) {
  console.log('apis already present');
} else {
  const block = `
/** Kiralama gecikme — due_at geçtiyse overdue + HERMES */
export function flagMarketRentalOverdue(input = {}, actor = 'system') {
  const orders = readCollection('market-orders', []) || [];
  const olist = Array.isArray(orders) ? orders : [];
  let idx = olist.findIndex((o) => o.id === input.order_id && (o.status === 'rented' || o.status === 'overdue'));
  if (idx < 0) {
    idx = olist.findIndex(
      (o) =>
        o.mode === 'rent' &&
        (o.status === 'rented' || o.status === 'overdue') &&
        (!input.listing_id || o.listing_id === input.listing_id),
    );
  }
  if (idx < 0) return { ok: false, error: 'Aktif kiralama yok' };
  const order = olist[idx];
  const dueAt = order.due_at ? new Date(order.due_at).getTime() : 0;
  if (dueAt && dueAt > Date.now() && !input.force && order.status !== 'overdue') {
    return { ok: false, error: 'Henüz vadesi gelmedi', due_at: order.due_at };
  }
  olist[idx] = {
    ...order,
    status: 'overdue',
    overdue_at: new Date().toISOString(),
    overdue_reason: String(input.reason || 'due_passed').slice(0, 240),
    overdue_by: actor,
  };
  writeCollection('market-orders', olist);
  const list = ensureListings();
  const lidx = list.findIndex((l) => l.id === order.listing_id);
  if (lidx >= 0) {
    list[lidx] = { ...list[lidx], status: 'overdue' };
    writeCollection('market-listings', list);
  }
  const flag = {
    id: rid('mro'),
    order_id: order.id,
    listing_id: order.listing_id,
    buyer: order.buyer,
    due_at: order.due_at,
    reason: olist[idx].overdue_reason,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('market-rental-overdues', flag, 200);
  enqueueAgentJob(
    {
      agent: 'HERMES',
      title: \`kiralama overdue · \${order.title || order.listing_id}\`,
      priority: 'high',
      payload: { order_id: order.id, flag_id: flag.id },
    },
    actor,
  );
  appendAudit({
    actor,
    action: 'market.rental_overdue',
    detail: order.title || order.listing_id,
    meta: { id: flag.id, order_id: order.id },
  });
  return { ok: true, order: olist[idx], flag, overview: marketOsOverview() };
}

/** Hasar değerlendirmesi — depozito hold */
export function assessMarketRentalDamage(input = {}, actor = 'system') {
  const orders = readCollection('market-orders', []) || [];
  const olist = Array.isArray(orders) ? orders : [];
  let idx = olist.findIndex((o) => o.id === input.order_id);
  if (idx < 0) {
    idx = olist.findIndex(
      (o) =>
        o.mode === 'rent' &&
        ['rented', 'overdue', 'returned'].includes(o.status) &&
        (!input.listing_id || o.listing_id === input.listing_id),
    );
  }
  if (idx < 0) return { ok: false, error: 'Kiralama yok' };
  const order = olist[idx];
  const sev = ['minor', 'moderate', 'severe'].includes(input.severity) ? input.severity : 'minor';
  const charge = Math.max(0, Number(input.charge_try) || 0);
  const deposit = Number(order.deposit_try) || 0;
  const assessment = {
    id: rid('mdmg'),
    order_id: order.id,
    listing_id: order.listing_id,
    severity: sev,
    notes: String(input.notes || '').slice(0, 400),
    charge_try: charge,
    deposit_hold_try: Math.min(deposit, charge || (sev === 'severe' ? deposit : sev === 'moderate' ? Math.round(deposit * 0.5) : 0)),
    status: 'open',
    at: new Date().toISOString(),
    actor,
  };
  if (!charge && assessment.deposit_hold_try) assessment.charge_try = assessment.deposit_hold_try;
  prependItem('market-damage-assessments', assessment, 200);
  olist[idx] = {
    ...order,
    damage_assessment_id: assessment.id,
    damage_severity: sev,
    damage_charge_try: assessment.charge_try,
    deposit_hold_try: assessment.deposit_hold_try,
    damage_notes: assessment.notes,
  };
  writeCollection('market-orders', olist);
  if (sev === 'severe' || assessment.charge_try > 0) {
    enqueueAgentJob(
      {
        agent: 'HERMES',
        title: \`hasar · \${order.title || order.listing_id} · \${sev}\`,
        priority: sev === 'severe' ? 'critical' : 'high',
        payload: { assessment_id: assessment.id, order_id: order.id },
      },
      actor,
    );
  }
  appendAudit({
    actor,
    action: 'market.damage_assess',
    detail: \`\${sev} · \${assessment.charge_try} TRY\`,
    meta: { id: assessment.id, order_id: order.id },
  });
  return { ok: true, order: olist[idx], assessment, overview: marketOsOverview() };
}

/** Depozito kapanışı — refund / forfeit / partial */
export function settleMarketDeposit(input = {}, actor = 'system') {
  const orders = readCollection('market-orders', []) || [];
  const olist = Array.isArray(orders) ? orders : [];
  let idx = olist.findIndex((o) => o.id === input.order_id);
  if (idx < 0) {
    idx = olist.findIndex(
      (o) =>
        o.mode === 'rent' &&
        (o.status === 'returned' || o.status === 'overdue') &&
        !o.deposit_settled_at &&
        (!input.listing_id || o.listing_id === input.listing_id),
    );
  }
  if (idx < 0) return { ok: false, error: 'Kapanacak kiralama yok' };
  const order = olist[idx];
  if (order.deposit_settled_at) return { ok: false, error: 'Depozito zaten kapandı' };
  if (order.status !== 'returned' && order.status !== 'overdue') {
    return { ok: false, error: 'İade veya overdue gerekli' };
  }
  const deposit = Number(order.deposit_try) || 0;
  const hold = Number(order.deposit_hold_try || order.damage_charge_try) || 0;
  let disposition = input.disposition || 'auto';
  let refund;
  let forfeited;
  if (disposition === 'auto') {
    forfeited = Math.min(deposit, Math.max(0, hold));
    refund = Math.max(0, deposit - forfeited);
    disposition = forfeited > 0 ? (refund > 0 ? 'partial' : 'forfeit') : 'refund';
  } else if (disposition === 'refund') {
    refund = deposit;
    forfeited = 0;
  } else if (disposition === 'forfeit') {
    refund = 0;
    forfeited = deposit;
  } else if (disposition === 'partial') {
    refund = Math.max(0, Math.min(deposit, Number(input.refund_try ?? deposit - hold)));
    forfeited = Math.max(0, deposit - refund);
  } else {
    return { ok: false, error: 'Geçersiz disposition' };
  }
  const settlement = {
    id: rid('mdep'),
    order_id: order.id,
    listing_id: order.listing_id,
    buyer: order.buyer,
    deposit_try: deposit,
    refund_try: refund,
    forfeited_try: forfeited,
    disposition,
    notes: String(input.notes || '').slice(0, 400),
    at: new Date().toISOString(),
    actor,
  };
  prependItem('market-deposit-settlements', settlement, 200);
  olist[idx] = {
    ...order,
    status: 'returned',
    deposit_settled_at: settlement.at,
    deposit_settlement_id: settlement.id,
    deposit_refund_try: refund,
    deposit_forfeited_try: forfeited,
    deposit_disposition: disposition,
    returned_at: order.returned_at || settlement.at,
  };
  writeCollection('market-orders', olist);
  if (order.damage_assessment_id) {
    const dmgs = readCollection('market-damage-assessments', []) || [];
    if (Array.isArray(dmgs)) {
      const di = dmgs.findIndex((d) => d.id === order.damage_assessment_id && d.status === 'open');
      if (di >= 0) {
        dmgs[di] = { ...dmgs[di], status: 'settled', settled_at: settlement.at };
        writeCollection('market-damage-assessments', dmgs);
      }
    }
  }
  const list = ensureListings();
  const lidx = list.findIndex((l) => l.id === order.listing_id);
  if (lidx >= 0 && (list[lidx].status === 'overdue' || list[lidx].status === 'rented')) {
    list[lidx] = { ...list[lidx], status: 'live' };
    writeCollection('market-listings', list);
  }
  appendAudit({
    actor,
    action: 'market.deposit_settle',
    detail: \`\${disposition} · refund \${refund} · forfeit \${forfeited}\`,
    meta: { id: settlement.id, order_id: order.id },
  });
  return { ok: true, order: olist[idx], settlement, overview: marketOsOverview() };
}

/** Vadesi geçmiş kiralamaları toplu overdue işaretle */
export function runMarketRentalSweep(input = {}, actor = 'system') {
  const orders = readCollection('market-orders', []) || [];
  const olist = Array.isArray(orders) ? orders : [];
  const now = Date.now();
  const flagged = [];
  for (const o of olist) {
    if (o.mode !== 'rent' || o.status !== 'rented') continue;
    const due = o.due_at ? new Date(o.due_at).getTime() : 0;
    if (!input.force && (!due || due > now)) continue;
    const r = flagMarketRentalOverdue(
      { order_id: o.id, reason: input.force && (!due || due > now) ? 'force_sweep' : 'sweep_due_passed', force: !!input.force },
      actor,
    );
    if (r.ok) flagged.push(r.order);
  }
  const sweep = {
    id: rid('mrs'),
    flagged: flagged.length,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('market-rental-sweeps', sweep, 80);
  appendAudit({
    actor,
    action: 'market.rental_sweep',
    detail: \`\${flagged.length} overdue\`,
    meta: { id: sweep.id },
  });
  return { ok: true, sweep, flagged, overview: marketOsOverview() };
}
`;
  t = t.trimEnd() + '\n' + block;
  console.log('apis appended');
}

writeFileSync(p, t);
console.log('WAVE49_MARKETOS_OK');
