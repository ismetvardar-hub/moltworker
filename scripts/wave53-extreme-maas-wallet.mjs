import { readFileSync, writeFileSync } from 'node:fs';

const p = '/workspace/server/extremepark.js';
let t = readFileSync(p, 'utf8');

// Wallet balance = base + credit - spend
const oldWallet = `  const spend = Number(member.fnb_spend_try) || 0;
  const fnbMin = seg.fnbMinTry;
  const wallet = {
    nfc_wallet_id: member.user_profile.nfc_wallet_id,
    balance_try: Math.max(0, 2500 - spend),
    fnb_spend_try: spend,
    fnb_min_try: fnbMin,
    fnb_gap_try: Math.max(0, fnbMin - spend),
    fnb_met: spend >= fnbMin,
  };`;

const newWallet = `  const spend = Number(member.fnb_spend_try) || 0;
  const credit = Number(member.wallet_credit_try) || 0;
  const fnbMin = seg.fnbMinTry;
  const wallet = {
    nfc_wallet_id: member.user_profile.nfc_wallet_id,
    balance_try: Math.max(0, 2500 + credit - spend),
    credit_try: credit,
    fnb_spend_try: spend,
    fnb_min_try: fnbMin,
    fnb_gap_try: Math.max(0, fnbMin - spend),
    fnb_met: spend >= fnbMin,
  };`;

if (t.includes(oldWallet)) {
  t = t.replace(oldWallet, newWallet);
  console.log('wallet formula');
} else if (!t.includes('credit_try: credit')) {
  console.error('WALLET_PATTERN_MISS');
  process.exit(1);
}

// Spend should respect balance
const oldSpend = `  const userId = input.user_id || 'guest_can';
  const amount = Number(input.amount) || 0;
  if (amount <= 0) return { ok: false, error: 'Geçersiz tutar' };
  const members = ensureMembers();
  const idx = members.findIndex((m) => m.user_profile?.user_id === userId);
  if (idx < 0) return { ok: false, error: 'Üye bulunamadı' };
  members[idx] = {
    ...members[idx],
    fnb_spend_try: (Number(members[idx].fnb_spend_try) || 0) + amount,
    updatedAt: new Date().toISOString(),
  };`;

const newSpend = `  const userId = input.user_id || 'guest_can';
  const amount = Number(input.amount) || 0;
  if (amount <= 0) return { ok: false, error: 'Geçersiz tutar' };
  const members = ensureMembers();
  const idx = members.findIndex((m) => m.user_profile?.user_id === userId);
  if (idx < 0) return { ok: false, error: 'Üye bulunamadı' };
  const bal = Math.max(
    0,
    2500 + (Number(members[idx].wallet_credit_try) || 0) - (Number(members[idx].fnb_spend_try) || 0),
  );
  if (amount > bal && !input.force) return { ok: false, error: 'Yetersiz bakiye', balance_try: bal };
  members[idx] = {
    ...members[idx],
    fnb_spend_try: (Number(members[idx].fnb_spend_try) || 0) + amount,
    updatedAt: new Date().toISOString(),
  };`;

if (t.includes(oldSpend)) {
  t = t.replace(oldSpend, newSpend);
  console.log('spend guard');
}

if (t.includes('export function renewExtremeMaas')) {
  console.log('apis already');
} else {
  t =
    t.trimEnd() +
    `
/** MaaS QR yenile / süre uzat */
export function renewExtremeMaas(input = {}, actor = 'system') {
  const list = readCollection('extreme-maas', []) || [];
  const maasList = Array.isArray(list) ? list : [];
  let idx = maasList.findIndex((m) => m.id === input.id);
  if (idx < 0) {
    idx = maasList.findIndex(
      (m) =>
        (m.status === 'ready' || m.status === 'expired') &&
        (!input.user_id || m.user_id === input.user_id) &&
        (!input.kind || m.kind === input.kind),
    );
  }
  if (idx < 0) {
    const created = createExtremeMaas(input, actor);
    if (!created.ok) return created;
    return { ok: true, maas: created.maas, renewed: false, overview: extremeOverview() };
  }
  const hours = Number(input.hours) || 48;
  const token = randomBytes(6).toString('hex');
  maasList[idx] = {
    ...maasList[idx],
    status: 'ready',
    qr_url: \`https://media.likya.local/maas/\${token}\`,
    qr_payload: \`LYK-MAAS:\${maasList[idx].kind}:\${token}\`,
    expires_at: new Date(Date.now() + hours * 3600_000).toISOString(),
    renewed_at: new Date().toISOString(),
    renewed_by: actor,
    renew_count: (Number(maasList[idx].renew_count) || 0) + 1,
  };
  writeCollection('extreme-maas', maasList);
  prependItem(
    'extreme-maas-renewals',
    {
      id: rid('xmr'),
      maas_id: maasList[idx].id,
      user_id: maasList[idx].user_id,
      hours,
      at: new Date().toISOString(),
      actor,
    },
    120,
  );
  appendAudit({
    actor,
    action: 'extreme.maas_renew',
    detail: \`\${maasList[idx].user_id} · \${maasList[idx].kind}\`,
    meta: { id: maasList[idx].id },
  });
  return { ok: true, maas: maasList[idx], renewed: true, overview: extremeOverview() };
}

/** NFC cüzdan top-up */
export function topUpExtremeWallet(input = {}, actor = 'system') {
  const userId = input.user_id || 'guest_can';
  const amount = Number(input.amount) || 0;
  if (amount <= 0) return { ok: false, error: 'Geçersiz tutar' };
  const members = ensureMembers();
  const idx = members.findIndex((m) => m.user_profile?.user_id === userId || m.id === userId);
  if (idx < 0) return { ok: false, error: 'Üye bulunamadı' };
  const credit = (Number(members[idx].wallet_credit_try) || 0) + amount;
  members[idx] = {
    ...members[idx],
    wallet_credit_try: credit,
    updatedAt: new Date().toISOString(),
  };
  writeCollection('extreme-members', members);
  const topup = {
    id: rid('xwt'),
    user_id: members[idx].user_profile.user_id,
    amount_try: amount,
    credit_try: credit,
    channel: input.channel || 'nfc_kiosk',
    at: new Date().toISOString(),
    actor,
  };
  prependItem('extreme-wallet-topups', topup, 200);
  appendAudit({
    actor,
    action: 'extreme.wallet_topup',
    detail: \`\${userId} · +\${amount} TRY\`,
    meta: { id: topup.id },
  });
  return { ok: true, topup, user_spec: extremeUserSpec(userId) };
}

/** Hava hold sweep — süresi dolan hold temizle / yeni hold uygula */
export function runExtremeWeatherHoldSweep(input = {}, actor = 'system') {
  const slots = ensureSlots();
  const now = Date.now();
  const expiredHolds = [];
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (slot.status !== 'weather_hold') continue;
    const until = slot.hold_until ? new Date(slot.hold_until).getTime() : 0;
    if (!input.force && until && until > now) continue;
    expiredHolds.push(slot.id);
  }
  let cleared = { cleared: [] };
  if (expiredHolds.length || input.force_clear) {
    cleared = clearExtremeWeatherHold(
      { cancel: !!input.cancel_expired, force: true },
      actor,
    );
  }
  let held = { held: [] };
  const weather = buildWeatherBrief('venue_antalya_extreme');
  const condition = input.force_condition || weather.condition || 'clear';
  const sensitive = ['windy', 'storm', 'rain', 'lightning'];
  if (input.force_hold || sensitive.includes(condition)) {
    held = applyExtremeWeatherHold(
      {
        force_condition: condition,
        minutes: Number(input.minutes) || 45,
        force: !!input.force_hold || sensitive.includes(condition),
        slot_id: input.slot_id,
      },
      actor,
    );
  }
  const sweep = {
    id: rid('xwhs'),
    expired_holds: expiredHolds.length,
    cleared: (cleared.cleared || []).length,
    held: (held.held || []).length,
    condition,
    at: new Date().toISOString(),
    actor,
  };
  prependItem('extreme-weather-hold-sweeps', sweep, 80);
  appendAudit({
    actor,
    action: 'extreme.weather_hold_sweep',
    detail: \`clear \${sweep.cleared} · hold \${sweep.held} · \${condition}\`,
    meta: { id: sweep.id },
  });
  return {
    ok: true,
    sweep,
    cleared: cleared.cleared || [],
    held: held.held || [],
    overview: extremeOverview(),
  };
}
`;
  console.log('apis');
}

writeFileSync(p, t);
console.log('WAVE53_EXTREME_OK');
