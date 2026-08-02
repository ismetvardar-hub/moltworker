#!/usr/bin/env node
/**
 * HTTP e2e — prod-server üzerinde kampüs API duman testi.
 * Kullanım: PORT=4177 node scripts/e2e-campus-http.mjs
 * (sunucu zaten ayaktaysa BASE_URL ver)
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = Number(process.env.PORT || 4177);
const BASE = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;
const OWN_SERVER = !process.env.BASE_URL;

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function req(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  let data = {};
  for (let attempt = 0; attempt < 4; attempt++) {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    data = await res.json().catch(() => ({}));
    if (res.status !== 429) break;
    const waitSec = Number(data.retryAfterSec) || Number(res.headers.get('retry-after')) || 2;
    await sleep(Math.min(Math.max(waitSec, 1), 15) * 1000);
  }
  return { res, data };
}

let child = null;
if (OWN_SERVER) {
  child = spawn('node', ['server/prod-server.js'], {
    cwd: new URL('..', import.meta.url).pathname,
    env: {
      ...process.env,
      PORT: String(PORT),
      HOST: '127.0.0.1',
      RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX || '2000',
      RATE_LIMIT_AUTH_MAX: process.env.RATE_LIMIT_AUTH_MAX || '200',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {
      /* wait */
    }
    await sleep(250);
  }
  if (!ready) {
    child.kill();
    throw new Error('server not ready');
  }
}

try {
  const login = await req('/api/auth/login', { method: 'POST', body: { username: 'ceo', password: 'likya2026' } });
  assert(login.res.ok && login.data.token, 'login');
  const token = login.data.token;

  const paths = [
    '/api/campusbrief',
    '/api/campus/health',
    '/api/agentfleet',
    '/api/greenpulse',
    '/api/stayring',
    '/api/culture',
    '/api/familycamp',
    '/api/marketos',
    '/api/openmall',
    '/api/sportbridge',
    '/api/agentqueue',
    '/api/cognisphere',
    '/api/readiness',
    '/api/vanguard',
    '/api/warroom',
    '/api/oracle',
    '/api/aegis',
    '/api/brandpulse',
    '/api/forge',
    '/api/ecosphere',
    '/api/boardpack',
    '/api/citadel',
    '/api/peoplehub',
    '/api/bastion',
    '/api/apex',
    '/api/sanctum',
    '/api/ledger',
    '/api/orbit',
    '/api/verdant',
    '/api/hearth',
    '/api/meridian',
    '/api/nightly',
    '/api/studio',
    '/api/aether',
    '/api/aurora',
    '/api/horizon',
    '/api/bazaar',
    '/api/harbor',
    '/api/sentinel',
    '/api/empire',
    '/api/elysium',
    '/api/tide',
    '/api/skyline',
    '/api/atlas',
    '/api/phoenix2',
    '/api/odyssey',
    '/api/signalhub',
    '/api/linen',
    '/api/charter2',
    '/api/zenith',
    '/api/pyramid',
    '/api/convoy',
    '/api/crucible2',
    '/api/agora',
    '/api/beacon',
    '/api/chronos',
    '/api/circuit',
    '/api/crown',
    '/api/dominion',
    '/api/frontier',
    '/api/gaia',
    '/api/helios',
    '/api/kairos',
    '/api/keystone',
    '/api/lattice',
    '/api/mirror',
    '/api/monument',
    '/api/olympus',
    '/api/pathos',
    '/api/prism',
    '/api/selene',
    '/api/serenity',
    '/api/vault',
    '/api/alliance2',
    '/api/artery',
    '/api/bastion2',
    '/api/agora2',
    '/api/alliance3',
    '/api/artery2',
    '/api/circuit2',
    '/api/crucible',
    '/api/apotheosis',
    '/api/charter',
    '/api/dominion2',
    '/api/logos',
    '/api/phoenix',
    '/api/serenity2',
    '/api/brief',
    '/api/digest',
    '/api/report',
    '/api/metrics',
    '/api/exports',
    '/api/weather',
    '/api/maintenance',
    '/api/inventory',
    '/api/training',
    '/api/menu',
    '/api/seating',
    '/api/announcements',
    '/api/incidents',
    '/api/reservations',
    '/api/shifts',
    '/api/checklists',
    '/api/alertrules',
    '/api/crudops',
    '/api/contracts',
    '/api/delivery',
    '/api/giftcards',
    '/api/laundry',
    '/api/cleaning',
    '/api/emergency',
    '/api/folio',
    '/api/roomstatus',
    '/api/minibar',
    '/api/transfers',
    '/api/concierge',
    '/api/shuttle',
    '/api/wifi',
    '/api/kds',
    '/api/budget',
    '/api/eventcal',
    '/api/keycards',
    '/api/parcels',
    '/api/wakeups',
    '/api/upsell',
    '/api/health',
  ];
  for (const p of paths) {
    const { res, data } = await req(p, { token });
    assert(res.ok, `${p} ${res.status}`);
    assert(data && typeof data === 'object', `${p} json`);
  }

  const auto = await req('/api/campusbrief/auto', { method: 'POST', token, body: {} });
  assert(auto.res.ok, 'campusbrief auto');

  const fam = await req('/api/familycamp', { token });
  const openProg =
    (fam.data.programs || []).find((p) => p.status === 'open' && (p.booked || 0) < (p.seats || 0)) ||
    { id: 'fp_3' };
  const book = await req('/api/familycamp/book', {
    method: 'POST',
    token,
    body: { program_id: openProg.id, child_name: 'E2E' },
  });
  assert(book.res.ok && book.data.ok !== false, 'family book');
  await req('/api/familycamp/checkin', {
    method: 'POST',
    token,
    body: { child_name: 'E2E', program_id: 'fp_3', guardian: 'e2e' },
  });
  const xfer = await req('/api/familycamp/transfer', {
    method: 'POST',
    token,
    body: { child_name: 'E2E', to_program_id: openProg.id },
  });
  assert(xfer.res.ok && xfer.data.ok !== false, 'family transfer');

  const pickup = await req('/api/familycamp/pickup-code', {
    method: 'POST',
    token,
    body: { child_name: 'E2E', authorized_name: 'e2e' },
  });
  assert(pickup.res.ok && pickup.data.ok !== false, 'family pickup code');
  const authOut = await req('/api/familycamp/authorized-checkout', {
    method: 'POST',
    token,
    body: { code: pickup.data.pickup?.code, authorized_name: 'e2e' },
  });
  assert(authOut.res.ok && authOut.data.ok !== false, 'family authorized checkout');
  await req('/api/familycamp/checkin', {
    method: 'POST',
    token,
    body: { child_name: 'E2E-Safe', program_id: 'fp_3', guardian: 'e2e', allergy: 'fındık' },
  });
  const safety = await req('/api/familycamp/safety-sweep', {
    method: 'POST',
    token,
    body: { stale_hours: 0 },
  });
  assert(safety.res.ok && safety.data.ok !== false, 'family safety sweep');
  const staff = await req('/api/familycamp/staff/assign', {
    method: 'POST',
    token,
    body: { program_id: 'fp_3', name: 'E2E Rehber', max_ratio: 6 },
  });
  assert(staff.res.ok && staff.data.ok !== false, 'family staff');
  const famRoll = await req('/api/familycamp/roll-call', {
    method: 'POST',
    token,
    body: { mark_first_absent: true },
  });
  assert(famRoll.res.ok && famRoll.data.ok !== false, 'family roll call');
  const famRatio = await req('/api/familycamp/staff-ratio', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(famRatio.res.ok && famRatio.data.ok !== false, 'family staff ratio');
  await req('/api/familycamp/checkin', {
    method: 'POST',
    token,
    body: { child_name: 'E2E Pickup', program_id: 'fp_3', guardian: 'E2E Veli' },
  });
  const pickup2 = await req('/api/familycamp/pickup-code', {
    method: 'POST',
    token,
    body: { child_name: 'E2E Pickup', authorized_name: 'E2E Veli', minutes: 1 },
  });
  assert(pickup2.res.ok && pickup2.data.ok !== false, 'family pickup seed noshow');
  const famNoshow = await req('/api/familycamp/pickup/noshow', {
    method: 'POST',
    token,
    body: { pickup_id: pickup2.data.pickup?.id, force: true },
  });
  assert(famNoshow.res.ok && famNoshow.data.ok !== false, 'family pickup noshow');
  const progCancel = await req('/api/familycamp/program/cancel', {
    method: 'POST',
    token,
    body: { program_id: 'fp_1', seats: 1 },
  });
  assert(progCancel.res.ok && progCancel.data.ok !== false, 'family program cancel');
  await req('/api/familycamp/checkin', {
    method: 'POST',
    token,
    body: { child_name: 'E2E Expiry', program_id: 'fp_3', guardian: 'E2E Veli2' },
  });
  await req('/api/familycamp/pickup-code', {
    method: 'POST',
    token,
    body: { child_name: 'E2E Expiry', authorized_name: 'E2E Veli2', minutes: 1 },
  });
  const pickupExp = await req('/api/familycamp/pickup/expiry-sweep', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(pickupExp.res.ok && pickupExp.data.ok !== false, 'family pickup expiry');

  const hold = await req('/api/culture/hold', {
    method: 'POST',
    token,
    body: { event_id: 'ce_1', qty: 1, guest: 'e2e' },
  });
  assert(hold.res.ok, 'culture hold');
  const confirm = await req('/api/culture/confirm', {
    method: 'POST',
    token,
    body: { hold_id: hold.data.hold?.id },
  });
  assert(confirm.res.ok, 'culture confirm');

  const roll = await req('/api/openmall/day-rollup', { method: 'POST', token, body: {} });
  assert(roll.res.ok, 'mall rollup');

  const lic = await req('/api/athleteos/license', {
    method: 'POST',
    token,
    body: { athlete_id: 'ath_3' },
  });
  assert(lic.res.ok && lic.data.ok !== false, 'athlete license');

  const clr = await req('/api/athleteos/clearance', {
    method: 'POST',
    token,
    body: { athlete_id: 'ath_3', status: 'cleared' },
  });
  assert(clr.res.ok && clr.data.ok !== false, 'athlete clearance');

  const injury = await req('/api/athleteos/injury', {
    method: 'POST',
    token,
    body: { athlete_id: 'ath_2', body_area: 'omuz', severity: 'mild' },
  });
  assert(injury.res.ok && injury.data.ok !== false, 'athlete injury');
  const rtp = await req('/api/athleteos/return-to-play', {
    method: 'POST',
    token,
    body: { athlete_id: 'ath_2', force: true },
  });
  assert(rtp.res.ok && rtp.data.ok !== false, 'athlete rtp');
  const rtpSweep = await req('/api/athleteos/rtp-sweep', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(rtpSweep.res.ok && rtpSweep.data.ok !== false, 'athlete rtp sweep');

  const ready = await req('/api/athleteos/readiness', { token });
  assert(ready.res.ok && Array.isArray(ready.data.athletes), 'athlete readiness');

  await req('/api/athleteos/license', { method: 'POST', token, body: { athlete_id: 'ath_1' } });
  await req('/api/athleteos/return-to-play', {
    method: 'POST',
    token,
    body: { athlete_id: 'ath_1', stage: 'cleared', force: true },
  });

  await req('/api/athleteos/clearance', {
    method: 'POST',
    token,
    body: { athlete_id: 'ath_1', status: 'cleared' },
  });
  const comp = await req('/api/athleteos/competition', {
    method: 'POST',
    token,
    body: { athlete_id: 'ath_1', title: 'E2E Cup' },
  });
  assert(comp.res.ok && comp.data.ok !== false, 'athlete competition');
  const compClear = await req('/api/athleteos/competition/clear', {
    method: 'POST',
    token,
    body: { athlete_id: 'ath_1' },
  });
  assert(compClear.res.ok && compClear.data.clearance?.status, 'athlete competition clear');
  if (compClear.data.ok === false) {
    const forced = await req('/api/athleteos/competition/clear', {
      method: 'POST',
      token,
      body: { athlete_id: 'ath_1', force: true },
    });
    assert(forced.res.ok && forced.data.ok !== false, 'athlete competition clear force');
  }
  const compSweep = await req('/api/athleteos/competition/sweep', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(compSweep.res.ok && compSweep.data.ok !== false, 'athlete competition sweep');
  const coach = await req('/api/athleteos/coach', {
    method: 'POST',
    token,
    body: { athlete_id: 'ath_3', coach_name: 'E2E Coach' },
  });
  assert(coach.res.ok && coach.data.ok !== false, 'athlete coach');
  const medHold = await req('/api/athleteos/medical-hold', {
    method: 'POST',
    token,
    body: { athlete_id: 'ath_3', days: 2, reason: 'e2e' },
  });
  assert(medHold.res.ok && medHold.data.ok !== false, 'athlete medical hold');
  const medClear = await req('/api/athleteos/medical-hold/clear', {
    method: 'POST',
    token,
    body: { athlete_id: 'ath_3' },
  });
  assert(medClear.res.ok && medClear.data.ok !== false, 'athlete medical hold clear');

  const checkin = await req('/api/lifecoach/checkin', {
    method: 'POST',
    token,
    body: { client_id: 'lc_1', mood: 6, sleep_h: 7 },
  });
  assert(checkin.res.ok && checkin.data.ok !== false, 'life checkin');
  const dig = await req('/api/lifecoach/digest', { method: 'POST', token, body: {} });
  assert(dig.res.ok && dig.data.ok !== false, 'life digest');
  const fu = await req('/api/lifecoach/followups/schedule', { method: 'POST', token, body: {} });
  assert(fu.res.ok && fu.data.ok !== false, 'life followups');
  const fuDone = await req('/api/lifecoach/followups/complete', { method: 'POST', token, body: {} });
  assert(fuDone.res.ok && fuDone.data.ok !== false, 'life followup complete');
  const adh = await req('/api/lifecoach/adherence', { method: 'POST', token, body: {} });
  assert(adh.res.ok && adh.data.ok !== false, 'life adherence');
  const crisis = await req('/api/lifecoach/crisis', {
    method: 'POST',
    token,
    body: { client_id: 'lc_2', severity: 'high', force: true },
  });
  assert(crisis.res.ok && crisis.data.ok !== false, 'life crisis');
  const crisisClear = await req('/api/lifecoach/crisis/clear', {
    method: 'POST',
    token,
    body: { client_id: 'lc_2' },
  });
  assert(crisisClear.res.ok && crisisClear.data.ok !== false, 'life crisis clear');
  const missed = await req('/api/lifecoach/checkin/missed-sweep', {
    method: 'POST',
    token,
    body: { force: true, stale_hours: 1 },
  });
  assert(missed.res.ok && missed.data.ok !== false, 'life missed checkin sweep');

  const night = await req('/api/stayring/night-rollup', { method: 'POST', token, body: {} });
  assert(night.res.ok && night.data.rollup, 'stay night rollup');

  const greq = await req('/api/stayring/request', {
    method: 'POST',
    token,
    body: { kind: 'amenity', note: 'e2e' },
  });
  assert(greq.res.ok && greq.data.ok !== false, 'stay guest request');
  await req('/api/stayring/request/complete', { method: 'POST', token, body: {} });

  const folioCharge = await req('/api/stayring/folio/charge', {
    method: 'POST',
    token,
    body: { unit_id: 'su_2', kind: 'amenity', amount_try: 250 },
  });
  assert(folioCharge.res.ok && folioCharge.data.ok !== false, 'folio charge');
  const folioAuto = await req('/api/stayring/folio/auto', { method: 'POST', token, body: {} });
  assert(folioAuto.res.ok && folioAuto.data.ok !== false, 'folio auto');
  const lateCo = await req('/api/stayring/late-checkout', {
    method: 'POST',
    token,
    body: { unit_id: 'su_2', hours: 2 },
  });
  assert(lateCo.res.ok && lateCo.data.ok !== false, 'stay late checkout');
  const folioDispute = await req('/api/stayring/folio/dispute', {
    method: 'POST',
    token,
    body: { unit_id: 'su_2', reason: 'e2e' },
  });
  assert(folioDispute.res.ok && folioDispute.data.ok !== false, 'stay folio dispute');
  await req('/api/stayring/folio/charge', {
    method: 'POST',
    token,
    body: { unit_id: 'su_2', kind: 'amenity', amount_try: 100 },
  });
  await req('/api/stayring/keyless', { method: 'POST', token, body: { unit_id: 'su_2' } });
  const keyRevoke = await req('/api/stayring/keyless/revoke', {
    method: 'POST',
    token,
    body: { unit_id: 'su_2' },
  });
  assert(keyRevoke.res.ok && keyRevoke.data.ok !== false, 'stay keyless revoke');
  const folioSettle = await req('/api/stayring/folio/settle', {
    method: 'POST',
    token,
    body: { unit_id: 'su_2' },
  });
  assert(folioSettle.res.ok && folioSettle.data.ok !== false, 'folio settle');

  const nightAudit = await req('/api/stayring/night-audit', { method: 'POST', token, body: {} });
  assert(nightAudit.res.ok && nightAudit.data.ok !== false, 'stay night audit');
  const overFlag = await req('/api/stayring/overstay/flag', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(overFlag.res.ok && overFlag.data.ok !== false, 'stay overstay flag');
  const overRes = await req('/api/stayring/overstay/resolve', {
    method: 'POST',
    token,
    body: { mode: 'extend', extra_nights: 1 },
  });
  assert(overRes.res.ok && overRes.data.ok !== false, 'stay overstay resolve');

  const hk = await req('/api/stayring/hk-complete', {
    method: 'POST',
    token,
    body: { unit_id: 'su_2' },
  });
  assert(hk.res.ok, 'stay hk complete');

  const wxHold = await req('/api/extreme/weather-hold', {
    method: 'POST',
    token,
    body: { force_condition: 'windy', minutes: 30, force: true },
  });
  assert(wxHold.res.ok, 'weather hold');
  const wxSweep = await req('/api/extreme/weather-hold/sweep', {
    method: 'POST',
    token,
    body: { force_clear: true, force_hold: true, force_condition: 'windy', minutes: 15 },
  });
  assert(wxSweep.res.ok && wxSweep.data.ok !== false, 'weather hold sweep');
  await req('/api/extreme/weather-clear', { method: 'POST', token, body: {} });
  const maas = await req('/api/extreme/maas', {
    method: 'POST',
    token,
    body: { user_id: 'guest_can', kind: 'gopro' },
  });
  assert(maas.res.ok && maas.data.ok !== false, 'extreme maas');
  const maasRenew = await req('/api/extreme/maas/renew', {
    method: 'POST',
    token,
    body: { id: maas.data.maas?.id, hours: 24 },
  });
  assert(maasRenew.res.ok && maasRenew.data.ok !== false, 'extreme maas renew');
  const topup = await req('/api/extreme/wallet/topup', {
    method: 'POST',
    token,
    body: { user_id: 'guest_can', amount: 300 },
  });
  assert(topup.res.ok && topup.data.ok !== false, 'extreme wallet topup');
  const spend = await req('/api/extreme/wallet/spend', {
    method: 'POST',
    token,
    body: { user_id: 'guest_can', amount: 50 },
  });
  assert(spend.res.ok && spend.data.ok !== false, 'extreme wallet spend');

  await req('/api/extreme/waiver', { method: 'POST', token, body: { user_id: 'guest_can' } });
  await req('/api/extreme/slot-cancel', { method: 'POST', token, body: { user_id: 'guest_ela' } });
  await req('/api/extreme/slot-cancel', { method: 'POST', token, body: { user_id: 'guest_can' } });
  let reserve = await req('/api/extreme/slot-reserve', {
    method: 'POST',
    token,
    body: { user_id: 'guest_ela' },
  });
  if (!reserve.res.ok || reserve.data.ok === false) {
    reserve = await req('/api/extreme/slot-reserve', {
      method: 'POST',
      token,
      body: { user_id: 'guest_can' },
    });
  }
  assert(reserve.res.ok && reserve.data.ok !== false, 'slot reserve');
  const reserveUser = reserve.data.reservation?.user_id || 'guest_ela';
  const checkIn = await req('/api/extreme/reservation/check-in', {
    method: 'POST',
    token,
    body: { user_id: reserveUser, gate: 'main' },
  });
  assert(checkIn.res.ok && checkIn.data.ok !== false, 'extreme check-in');

  const noshowUser = reserveUser === 'guest_ela' ? 'guest_can' : 'guest_ela';
  await req('/api/extreme/slot-cancel', { method: 'POST', token, body: { user_id: noshowUser } });
  await req('/api/extreme/waiver', { method: 'POST', token, body: { user_id: noshowUser } });
  const noshowReserve = await req('/api/extreme/slot-reserve', {
    method: 'POST',
    token,
    body: { user_id: noshowUser },
  });
  assert(noshowReserve.res.ok && noshowReserve.data.ok !== false, 'slot reserve for no-show');
  const noshow = await req('/api/extreme/reservation/no-show', {
    method: 'POST',
    token,
    body: { user_id: noshowUser, promote: false },
  });
  assert(noshow.res.ok && noshow.data.ok !== false, 'extreme no-show');

  const gear = await req('/api/extreme/gear-return', {
    method: 'POST',
    token,
    body: { gear_id: 'xg_1' },
  });
  assert(gear.res.ok, 'gear return');

  const gearIssue = await req('/api/extreme/gear-issue', {
    method: 'POST',
    token,
    body: { user_id: 'guest_ela' },
  });
  assert(gearIssue.res.ok && gearIssue.data.ok !== false, 'gear issue');

  const gearSweep = await req('/api/extreme/gear-service-sweep', {
    method: 'POST',
    token,
    body: { include_open: true },
  });
  assert(gearSweep.res.ok && gearSweep.data.ok !== false, 'gear service sweep');

  const wl = await req('/api/extreme/waitlist', {
    method: 'POST',
    token,
    body: { user_id: 'guest_can', slot_id: 'xs_2' },
  });
  assert(wl.res.ok, 'waitlist');
  await req('/api/extreme/waitlist/promote', { method: 'POST', token, body: {} });
  await req('/api/extreme/waitlist', {
    method: 'POST',
    token,
    body: { user_id: 'guest_ela', slot_id: 'xs_2' },
  });
  const wlExpire = await req('/api/extreme/waitlist/expire', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(wlExpire.res.ok && wlExpire.data.ok !== false, 'waitlist expire');

  const presence = await req('/api/agentfleet/presence-sweep', {
    method: 'POST',
    token,
    body: { campus_only: true },
  });
  assert(presence.res.ok && presence.data.updated >= 1, 'presence sweep');

  const dispatch = await req('/api/agentfleet/dispatch', {
    method: 'POST',
    token,
    body: { title: 'Hava iptal ve ESG alert brifing' },
  });
  assert(dispatch.res.ok && dispatch.data.ok !== false, 'fleet dispatch');
  const dAck = await req('/api/agentfleet/directive/ack', {
    method: 'POST',
    token,
    body: { id: dispatch.data.directive?.id, agent: 'REMINDER-AI' },
  });
  assert(dAck.res.ok && dAck.data.ok !== false, 'fleet directive ack');
  const shift = await req('/api/agentfleet/shift/start', {
    method: 'POST',
    token,
    body: { name: 'e2e shift' },
  });
  assert(shift.res.ok && shift.data.ok !== false, 'fleet shift');
  const handoff = await req('/api/agentfleet/shift/handoff', {
    method: 'POST',
    token,
    body: { to_lead: 'DAZE-HUB', note: 'e2e handoff' },
  });
  assert(handoff.res.ok && handoff.data.ok !== false, 'fleet handoff');
  const retireSeed = await req('/api/agentfleet/dispatch', {
    method: 'POST',
    token,
    body: { title: 'e2e retire-seed ESG' },
  });
  const retire = await req('/api/agentfleet/directive/retire', {
    method: 'POST',
    token,
    body: { id: retireSeed.data.directive?.id, reason: 'e2e retire' },
  });
  assert(retire.res.ok && retire.data.ok !== false, 'fleet directive retire');
  const park = await req('/api/agentfleet/park', {
    method: 'POST',
    token,
    body: { agent: 'MINT', minutes: 1 },
  });
  assert(park.res.ok && park.data.ok !== false, 'fleet park');
  const unpark = await req('/api/agentfleet/unpark', { method: 'POST', token, body: { force: true } });
  assert(unpark.res.ok && unpark.data.ok !== false, 'fleet unpark');
  const lb = await req('/api/agentfleet/load-balance', { method: 'POST', token, body: { limit: 2 } });
  assert(lb.res.ok && lb.data.ok !== false, 'fleet load balance');
  const shiftClose = await req('/api/agentfleet/shift/close', {
    method: 'POST',
    token,
    body: { reason: 'e2e close' },
  });
  assert(shiftClose.res.ok && shiftClose.data.ok !== false, 'fleet shift close');

  const cogSweep = await req('/api/cognisphere/sweep', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(cogSweep.res.ok && cogSweep.data.ok !== false, 'cognisphere sweep');
  const cogHalt = await req('/api/cognisphere/cost/halt', {
    method: 'POST',
    token,
    body: { service: 'Ollama' },
  });
  assert(cogHalt.res.ok && cogHalt.data.ok !== false, 'cognisphere cost halt');
  const cogDrift = await req('/api/cognisphere/drift/clear', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(cogDrift.res.ok && cogDrift.data.ok !== false, 'cognisphere drift clear');
  const cogMit = await req('/api/cognisphere/mitigate', { method: 'POST', token, body: {} });
  assert(cogMit.res.ok && cogMit.data.ok !== false, 'cognisphere mitigate');
  const cogAck = await req('/api/cognisphere/flag/ack', { method: 'POST', token, body: {} });
  assert(cogAck.res.ok && cogAck.data.ok !== false, 'cognisphere flag ack');

  const rdySweep = await req('/api/readiness/sweep', { method: 'POST', token, body: { force: true } });
  assert(rdySweep.res.ok && rdySweep.data.ok !== false, 'readiness sweep');
  const readySnap = await req('/api/readiness/snapshot', {
    method: 'POST',
    token,
    body: { note: 'e2e' },
  });
  assert(readySnap.res.ok && readySnap.data.ok !== false, 'readiness snapshot');
  const readyThr = await req('/api/readiness/threshold', {
    method: 'POST',
    token,
    body: { warn: 72, alert: 58, critical: 42 },
  });
  assert(readyThr.res.ok && readyThr.data.ok !== false, 'readiness threshold');
  const readyAck = await req('/api/readiness/ack', {
    method: 'POST',
    token,
    body: { id: 'bridge' },
  });
  assert(readyAck.res.ok && readyAck.data.ok !== false, 'readiness ack');
  const readyEsc = await req('/api/readiness/escalate', {
    method: 'POST',
    token,
    body: { id: 'agents', reason: 'e2e' },
  });
  assert(readyEsc.res.ok && readyEsc.data.ok !== false, 'readiness escalate');
  const readyGap = await req('/api/readiness/gap/resolve', { method: 'POST', token, body: {} });
  assert(readyGap.res.ok && readyGap.data.ok !== false, 'readiness gap resolve');
  const rdyAck = await req('/api/readiness/flag/ack', { method: 'POST', token, body: {} });
  assert(rdyAck.res.ok && rdyAck.data.ok !== false, 'readiness flag ack');

  const opsInt = await req('/api/ops/integrity', { method: 'POST', token, body: { force: true } });
  assert(opsInt.res.ok && opsInt.data.ok !== false, 'ops integrity');
  const opsRot = await req('/api/ops/backup/rotate', { method: 'POST', token, body: { note: 'e2e' } });
  assert(opsRot.res.ok && opsRot.data.ok !== false, 'ops backup rotate');
  const opsQ = await req('/api/ops/quarantine', {
    method: 'POST',
    token,
    body: { file: 'ops-backup-rotations.json', reason: 'e2e' },
  });
  assert(opsQ.res.ok && opsQ.data.ok !== false, 'ops quarantine');
  const opsClear = await req('/api/ops/degraded/clear', { method: 'POST', token, body: {} });
  assert(opsClear.res.ok && opsClear.data.ok !== false, 'ops clear degraded');

  const vgSweep = await req('/api/vanguard/sweep', { method: 'POST', token, body: { force: true } });
  assert(vgSweep.res.ok && vgSweep.data.ok !== false, 'vanguard sweep');
  const vgPos = await req('/api/vanguard/pos/online', { method: 'POST', token, body: {} });
  assert(vgPos.res.ok && vgPos.data.ok !== false, 'vanguard pos online');
  const vgInv = await req('/api/vanguard/inv/clear', { method: 'POST', token, body: { force: true } });
  assert(vgInv.res.ok && vgInv.data.ok !== false, 'vanguard inv clear');
  const vgMint = await req('/api/vanguard/mint/flush', { method: 'POST', token, body: {} });
  assert(vgMint.res.ok && vgMint.data.ok !== false, 'vanguard mint flush');
  const vgAck = await req('/api/vanguard/flag/ack', { method: 'POST', token, body: {} });
  assert(vgAck.res.ok && vgAck.data.ok !== false, 'vanguard flag ack');

  const wrSweep = await req('/api/warroom/sweep', { method: 'POST', token, body: { force: true } });
  assert(wrSweep.res.ok && wrSweep.data.ok !== false, 'warroom sweep');
  const wrHaccp = await req('/api/warroom/haccp/clear', { method: 'POST', token, body: {} });
  assert(wrHaccp.res.ok && wrHaccp.data.ok !== false, 'warroom haccp clear');
  const wrPatrol = await req('/api/warroom/patrol/clear', { method: 'POST', token, body: {} });
  assert(wrPatrol.res.ok && wrPatrol.data.ok !== false, 'warroom patrol clear');
  const wrConc = await req('/api/warroom/concierge/close', { method: 'POST', token, body: {} });
  assert(wrConc.res.ok && wrConc.data.ok !== false, 'warroom concierge close');
  const wrAck = await req('/api/warroom/flag/ack', { method: 'POST', token, body: {} });
  assert(wrAck.res.ok && wrAck.data.ok !== false, 'warroom flag ack');

  const orSweep = await req('/api/oracle/sweep', { method: 'POST', token, body: { force: true } });
  assert(orSweep.res.ok && orSweep.data.ok !== false, 'oracle sweep');
  const orAnom = await req('/api/oracle/anomaly/resolve', { method: 'POST', token, body: {} });
  assert(orAnom.res.ok && orAnom.data.ok !== false, 'oracle anomaly resolve');
  const orScore = await req('/api/oracle/score/clear', { method: 'POST', token, body: {} });
  assert(orScore.res.ok && orScore.data.ok !== false, 'oracle score clear');
  const orCanary = await req('/api/oracle/canary/promote', { method: 'POST', token, body: {} });
  assert(orCanary.res.ok && orCanary.data.ok !== false, 'oracle canary promote');
  const orAck = await req('/api/oracle/flag/ack', { method: 'POST', token, body: {} });
  assert(orAck.res.ok && orAck.data.ok !== false, 'oracle flag ack');

  const aeSweep = await req('/api/aegis/sweep', { method: 'POST', token, body: { force: true } });
  assert(aeSweep.res.ok && aeSweep.data.ok !== false, 'aegis sweep');
  const aeSafe = await req('/api/aegis/safety/clear', { method: 'POST', token, body: {} });
  assert(aeSafe.res.ok && aeSafe.data.ok !== false, 'aegis safety clear');
  const aeInc = await req('/api/aegis/incident/close', { method: 'POST', token, body: {} });
  assert(aeInc.res.ok && aeInc.data.ok !== false, 'aegis incident close');
  const aeEvac = await req('/api/aegis/evac/clear', { method: 'POST', token, body: {} });
  assert(aeEvac.res.ok && aeEvac.data.ok !== false, 'aegis evac clear');
  const aeAck = await req('/api/aegis/flag/ack', { method: 'POST', token, body: {} });
  assert(aeAck.res.ok && aeAck.data.ok !== false, 'aegis flag ack');

  const bpSweep = await req('/api/brandpulse/sweep', { method: 'POST', token, body: { force: true } });
  assert(bpSweep.res.ok && bpSweep.data.ok !== false, 'brandpulse sweep');
  const bpInbox = await req('/api/brandpulse/inbox/triage', { method: 'POST', token, body: {} });
  assert(bpInbox.res.ok && bpInbox.data.ok !== false, 'brandpulse inbox triage');
  const bpUgc = await req('/api/brandpulse/ugc/approve', { method: 'POST', token, body: {} });
  assert(bpUgc.res.ok && bpUgc.data.ok !== false, 'brandpulse ugc approve');
  const bpGuard = await req('/api/brandpulse/guard/action', { method: 'POST', token, body: {} });
  assert(bpGuard.res.ok && bpGuard.data.ok !== false, 'brandpulse guard action');
  const bpAck = await req('/api/brandpulse/flag/ack', { method: 'POST', token, body: {} });
  assert(bpAck.res.ok && bpAck.data.ok !== false, 'brandpulse flag ack');

  const fgSweep = await req('/api/forge/sweep', { method: 'POST', token, body: { force: true } });
  assert(fgSweep.res.ok && fgSweep.data.ok !== false, 'forge sweep');
  const fgTalent = await req('/api/forge/talent/advance', { method: 'POST', token, body: {} });
  assert(fgTalent.res.ok && fgTalent.data.ok !== false, 'forge talent advance');
  const fgCert = await req('/api/forge/cert/renew', { method: 'POST', token, body: {} });
  assert(fgCert.res.ok && fgCert.data.ok !== false, 'forge cert renew');
  const fgShift = await req('/api/forge/shift/approve', { method: 'POST', token, body: {} });
  assert(fgShift.res.ok && fgShift.data.ok !== false, 'forge shift approve');
  const fgAck = await req('/api/forge/flag/ack', { method: 'POST', token, body: {} });
  assert(fgAck.res.ok && fgAck.data.ok !== false, 'forge flag ack');

  const ecoSweep = await req('/api/ecosphere/sweep', { method: 'POST', token, body: { force: true } });
  assert(ecoSweep.res.ok && ecoSweep.data.ok !== false, 'ecosphere sweep');
  const ecoFind = await req('/api/ecosphere/finding/mitigate', { method: 'POST', token, body: {} });
  assert(ecoFind.res.ok && ecoFind.data.ok !== false, 'ecosphere finding mitigate');
  const ecoDp = await req('/api/ecosphere/dataprotect/fulfill', { method: 'POST', token, body: {} });
  assert(ecoDp.res.ok && ecoDp.data.ok !== false, 'ecosphere dataprotect fulfill');
  const ecoVen = await req('/api/ecosphere/vendor/clear', { method: 'POST', token, body: {} });
  assert(ecoVen.res.ok && ecoVen.data.ok !== false, 'ecosphere vendor clear');
  const ecoAck = await req('/api/ecosphere/flag/ack', { method: 'POST', token, body: {} });
  assert(ecoAck.res.ok && ecoAck.data.ok !== false, 'ecosphere flag ack');

  const bdSweep = await req('/api/boardpack/sweep', { method: 'POST', token, body: { force: true } });
  assert(bdSweep.res.ok && bdSweep.data.ok !== false, 'boardpack sweep');
  const bdSnap = await req('/api/boardpack/snapshot', { method: 'POST', token, body: {} });
  assert(bdSnap.res.ok && bdSnap.data.ok !== false, 'boardpack snapshot');
  const bdCtr = await req('/api/boardpack/contract/renew', { method: 'POST', token, body: {} });
  assert(bdCtr.res.ok && bdCtr.data.ok !== false, 'boardpack contract renew');
  const bdBud = await req('/api/boardpack/budget/rebalance', { method: 'POST', token, body: {} });
  assert(bdBud.res.ok && bdBud.data.ok !== false, 'boardpack budget rebalance');
  const bdAck = await req('/api/boardpack/flag/ack', { method: 'POST', token, body: {} });
  assert(bdAck.res.ok && bdAck.data.ok !== false, 'boardpack flag ack');

  const ctSweep = await req('/api/citadel/sweep', { method: 'POST', token, body: { force: true } });
  assert(ctSweep.res.ok && ctSweep.data.ok !== false, 'citadel sweep');
  const ctPlant = await req('/api/citadel/plant/clear', { method: 'POST', token, body: {} });
  assert(ctPlant.res.ok && ctPlant.data.ok !== false, 'citadel plant clear');
  const ctHvac = await req('/api/citadel/hvac/clear', { method: 'POST', token, body: {} });
  assert(ctHvac.res.ok && ctHvac.data.ok !== false, 'citadel hvac clear');
  const ctWo = await req('/api/citadel/workorder/close', { method: 'POST', token, body: {} });
  assert(ctWo.res.ok && ctWo.data.ok !== false, 'citadel wo close');
  const ctAck = await req('/api/citadel/flag/ack', { method: 'POST', token, body: {} });
  assert(ctAck.res.ok && ctAck.data.ok !== false, 'citadel flag ack');

  const phSweep = await req('/api/peoplehub/sweep', { method: 'POST', token, body: { force: true } });
  assert(phSweep.res.ok && phSweep.data.ok !== false, 'peoplehub sweep');
  const phLeave = await req('/api/peoplehub/leave/approve', { method: 'POST', token, body: {} });
  assert(phLeave.res.ok && phLeave.data.ok !== false, 'peoplehub leave approve');
  const phNear = await req('/api/peoplehub/nearmiss/close', { method: 'POST', token, body: {} });
  assert(phNear.res.ok && phNear.data.ok !== false, 'peoplehub nearmiss close');
  const phOnb = await req('/api/peoplehub/onboarding/complete', { method: 'POST', token, body: {} });
  assert(phOnb.res.ok && phOnb.data.ok !== false, 'peoplehub onboarding complete');
  const phAck = await req('/api/peoplehub/flag/ack', { method: 'POST', token, body: {} });
  assert(phAck.res.ok && phAck.data.ok !== false, 'peoplehub flag ack');

  const bsSweep = await req('/api/bastion/sweep', { method: 'POST', token, body: { force: true } });
  assert(bsSweep.res.ok && bsSweep.data.ok !== false, 'bastion sweep');
  const bsAcc = await req('/api/bastion/access/close', { method: 'POST', token, body: {} });
  assert(bsAcc.res.ok && bsAcc.data.ok !== false, 'bastion access close');
  const bsRole = await req('/api/bastion/role/approve', { method: 'POST', token, body: {} });
  assert(bsRole.res.ok && bsRole.data.ok !== false, 'bastion role approve');
  const bsBreach = await req('/api/bastion/breach/archive', { method: 'POST', token, body: {} });
  assert(bsBreach.res.ok && bsBreach.data.ok !== false, 'bastion breach archive');
  const bsAck = await req('/api/bastion/flag/ack', { method: 'POST', token, body: {} });
  assert(bsAck.res.ok && bsAck.data.ok !== false, 'bastion flag ack');

  const apSweep = await req('/api/apex/sweep', { method: 'POST', token, body: { force: true } });
  assert(apSweep.res.ok && apSweep.data.ok !== false, 'apex sweep');
  const apInv = await req('/api/apex/invoice/clear', { method: 'POST', token, body: {} });
  assert(apInv.res.ok && apInv.data.ok !== false, 'apex invoice clear');
  const apLic = await req('/api/apex/license/renew', { method: 'POST', token, body: {} });
  assert(apLic.res.ok && apLic.data.ok !== false, 'apex license renew');
  const apOt = await req('/api/apex/overtime/approve', { method: 'POST', token, body: {} });
  assert(apOt.res.ok && apOt.data.ok !== false, 'apex overtime approve');
  const apAck = await req('/api/apex/flag/ack', { method: 'POST', token, body: {} });
  assert(apAck.res.ok && apAck.data.ok !== false, 'apex flag ack');


  const snSweep = await req('/api/sanctum/sweep', { method: 'POST', token, body: { force: true } });
  assert(snSweep.res.ok && snSweep.data.ok !== false, 'sanctum sweep');
  const snSpa = await req('/api/sanctum/spa/clear', { method: 'POST', token, body: {} });
  assert(snSpa.res.ok && snSpa.data.ok !== false, 'sanctum spa clear');
  const snBio = await req('/api/sanctum/bio/clear', { method: 'POST', token, body: {} });
  assert(snBio.res.ok && snBio.data.ok !== false, 'sanctum bio clear');
  const snSes = await req('/api/sanctum/session/complete', { method: 'POST', token, body: {} });
  assert(snSes.res.ok && snSes.data.ok !== false, 'sanctum session complete');
  const snAck = await req('/api/sanctum/flag/ack', { method: 'POST', token, body: {} });
  assert(snAck.res.ok && snAck.data.ok !== false, 'sanctum flag ack');

  const ldSweep = await req('/api/ledger/sweep', { method: 'POST', token, body: { force: true } });
  assert(ldSweep.res.ok && ldSweep.data.ok !== false, 'ledger sweep');
  const ldAr = await req('/api/ledger/ar/collect', { method: 'POST', token, body: {} });
  assert(ldAr.res.ok && ldAr.data.ok !== false, 'ledger ar collect');
  const ldCb = await req('/api/ledger/chargeback/resolve', { method: 'POST', token, body: {} });
  assert(ldCb.res.ok && ldCb.data.ok !== false, 'ledger chargeback resolve');
  const ldCh = await req('/api/ledger/channel/clear', { method: 'POST', token, body: {} });
  assert(ldCh.res.ok && ldCh.data.ok !== false, 'ledger channel clear');
  const ldAck = await req('/api/ledger/flag/ack', { method: 'POST', token, body: {} });
  assert(ldAck.res.ok && ldAck.data.ok !== false, 'ledger flag ack');

  const orbSweep = await req('/api/orbit/sweep', { method: 'POST', token, body: { force: true } });
  assert(orbSweep.res.ok && orbSweep.data.ok !== false, 'orbit sweep');
  const orbRm = await req('/api/orbit/room/clean', { method: 'POST', token, body: {} });
  assert(orbRm.res.ok && orbRm.data.ok !== false, 'orbit room clean');
  const orbKey = await req('/api/orbit/key/encode', { method: 'POST', token, body: {} });
  assert(orbKey.res.ok && orbKey.data.ok !== false, 'orbit key encode');
  const orbApp = await req('/api/orbit/guestapp/retry', { method: 'POST', token, body: {} });
  assert(orbApp.res.ok && orbApp.data.ok !== false, 'orbit guestapp retry');
  const orbAck = await req('/api/orbit/flag/ack', { method: 'POST', token, body: {} });
  assert(orbAck.res.ok && orbAck.data.ok !== false, 'orbit flag ack');

  const vdSweep = await req('/api/verdant/sweep', { method: 'POST', token, body: { force: true } });
  assert(vdSweep.res.ok && vdSweep.data.ok !== false, 'verdant sweep');
  const vdWat = await req('/api/verdant/water/clear', { method: 'POST', token, body: {} });
  assert(vdWat.res.ok && vdWat.data.ok !== false, 'verdant water clear');
  const vdEsg = await req('/api/verdant/esg/close', { method: 'POST', token, body: {} });
  assert(vdEsg.res.ok && vdEsg.data.ok !== false, 'verdant esg close');
  const vdEv = await req('/api/verdant/ev/fix', { method: 'POST', token, body: {} });
  assert(vdEv.res.ok && vdEv.data.ok !== false, 'verdant ev fix');
  const vdAck = await req('/api/verdant/flag/ack', { method: 'POST', token, body: {} });
  assert(vdAck.res.ok && vdAck.data.ok !== false, 'verdant flag ack');

  const hhSweep = await req('/api/hearth/sweep', { method: 'POST', token, body: { force: true } });
  assert(hhSweep.res.ok && hhSweep.data.ok !== false, 'hearth sweep');
  const hhPass = await req('/api/hearth/pass/run', { method: 'POST', token, body: {} });
  assert(hhPass.res.ok && hhPass.data.ok !== false, 'hearth pass run');
  const hhAlg = await req('/api/hearth/allergen/clear', { method: 'POST', token, body: {} });
  assert(hhAlg.res.ok && hhAlg.data.ok !== false, 'hearth allergen clear');
  const hhPlate = await req('/api/hearth/plate/send', { method: 'POST', token, body: {} });
  assert(hhPlate.res.ok && hhPlate.data.ok !== false, 'hearth plate send');
  const hhAck = await req('/api/hearth/flag/ack', { method: 'POST', token, body: {} });
  assert(hhAck.res.ok && hhAck.data.ok !== false, 'hearth flag ack');

  const mdSweep = await req('/api/meridian/sweep', { method: 'POST', token, body: { force: true } });
  assert(mdSweep.res.ok && mdSweep.data.ok !== false, 'meridian sweep');
  const mdMove = await req('/api/meridian/move/approve', { method: 'POST', token, body: {} });
  assert(mdMove.res.ok && mdMove.data.ok !== false, 'meridian move approve');
  const mdEarly = await req('/api/meridian/early/approve', { method: 'POST', token, body: {} });
  assert(mdEarly.res.ok && mdEarly.data.ok !== false, 'meridian early approve');
  const mdTurn = await req('/api/meridian/turndown/clear', { method: 'POST', token, body: {} });
  assert(mdTurn.res.ok && mdTurn.data.ok !== false, 'meridian turndown clear');
  const mdAck = await req('/api/meridian/flag/ack', { method: 'POST', token, body: {} });
  assert(mdAck.res.ok && mdAck.data.ok !== false, 'meridian flag ack');

  const ntSweep = await req('/api/nightly/sweep', { method: 'POST', token, body: { force: true } });
  assert(ntSweep.res.ok && ntSweep.data.ok !== false, 'nightly sweep');
  const ntLog = await req('/api/nightly/log/close', { method: 'POST', token, body: {} });
  assert(ntLog.res.ok && ntLog.data.ok !== false, 'nightly log close');
  const ntFolio = await req('/api/nightly/folio/close', { method: 'POST', token, body: {} });
  assert(ntFolio.res.ok && ntFolio.data.ok !== false, 'nightly folio close');
  const ntLate = await req('/api/nightly/late/approve', { method: 'POST', token, body: {} });
  assert(ntLate.res.ok && ntLate.data.ok !== false, 'nightly late approve');
  const ntAck = await req('/api/nightly/flag/ack', { method: 'POST', token, body: {} });
  assert(ntAck.res.ok && ntAck.data.ok !== false, 'nightly flag ack');

  const stSweep = await req('/api/studio/sweep', { method: 'POST', token, body: { force: true } });
  assert(stSweep.res.ok && stSweep.data.ok !== false, 'studio sweep');
  const stUgc = await req('/api/studio/ugc/approve', { method: 'POST', token, body: {} });
  assert(stUgc.res.ok && stUgc.data.ok !== false, 'studio ugc approve');
  const stLive = await req('/api/studio/live/end', { method: 'POST', token, body: {} });
  assert(stLive.res.ok && stLive.data.ok !== false, 'studio live end');
  const stBrief = await req('/api/studio/brief/deliver', { method: 'POST', token, body: {} });
  assert(stBrief.res.ok && stBrief.data.ok !== false, 'studio brief deliver');
  const stAck = await req('/api/studio/flag/ack', { method: 'POST', token, body: {} });
  assert(stAck.res.ok && stAck.data.ok !== false, 'studio flag ack');

  const athSweep = await req('/api/aether/sweep', { method: 'POST', token, body: { force: true } });
  assert(athSweep.res.ok && athSweep.data.ok !== false, 'aether sweep');
  const athPart = await req('/api/aether/partner/activate', { method: 'POST', token, body: {} });
  assert(athPart.res.ok && athPart.data.ok !== false, 'aether partner activate');
  const athDeal = await req('/api/aether/deal/close', { method: 'POST', token, body: {} });
  assert(athDeal.res.ok && athDeal.data.ok !== false, 'aether deal close');
  const athCoin = await req('/api/aether/coinvest/live', { method: 'POST', token, body: {} });
  assert(athCoin.res.ok && athCoin.data.ok !== false, 'aether coinvest live');
  const athAck = await req('/api/aether/flag/ack', { method: 'POST', token, body: {} });
  assert(athAck.res.ok && athAck.data.ok !== false, 'aether flag ack');

  const auSweep = await req('/api/aurora/sweep', { method: 'POST', token, body: { force: true } });
  assert(auSweep.res.ok && auSweep.data.ok !== false, 'aurora sweep');
  const auFlow = await req('/api/aurora/flow/clear', { method: 'POST', token, body: {} });
  assert(auFlow.res.ok && auFlow.data.ok !== false, 'aurora flow clear');
  const auLight = await req('/api/aurora/light/end', { method: 'POST', token, body: {} });
  assert(auLight.res.ok && auLight.data.ok !== false, 'aurora light end');
  const auNight = await req('/api/aurora/night/day', { method: 'POST', token, body: {} });
  assert(auNight.res.ok && auNight.data.ok !== false, 'aurora night day');
  const auAck = await req('/api/aurora/flag/ack', { method: 'POST', token, body: {} });
  assert(auAck.res.ok && auAck.data.ok !== false, 'aurora flag ack');

  const hzSweep = await req('/api/horizon/sweep', { method: 'POST', token, body: { force: true } });
  assert(hzSweep.res.ok && hzSweep.data.ok !== false, 'horizon sweep');
  const hzAlg = await req('/api/horizon/allergy/clear', { method: 'POST', token, body: {} });
  assert(hzAlg.res.ok && hzAlg.data.ok !== false, 'horizon allergy clear');
  const hzTab = await req('/api/horizon/tab/close', { method: 'POST', token, body: {} });
  assert(hzTab.res.ok && hzTab.data.ok !== false, 'horizon tab close');
  const hzComp = await req('/api/horizon/comp/approve', { method: 'POST', token, body: {} });
  assert(hzComp.res.ok && hzComp.data.ok !== false, 'horizon comp approve');
  const hzAck = await req('/api/horizon/flag/ack', { method: 'POST', token, body: {} });
  assert(hzAck.res.ok && hzAck.data.ok !== false, 'horizon flag ack');

  const bzSweep = await req('/api/bazaar/sweep', { method: 'POST', token, body: { force: true } });
  assert(bzSweep.res.ok && bzSweep.data.ok !== false, 'bazaar sweep');
  const bzStock = await req('/api/bazaar/stock/heal', { method: 'POST', token, body: {} });
  assert(bzStock.res.ok && bzStock.data.ok !== false, 'bazaar stock heal');
  const bzShrink = await req('/api/bazaar/shrink/review', { method: 'POST', token, body: {} });
  assert(bzShrink.res.ok && bzShrink.data.ok !== false, 'bazaar shrink review');
  const bzDark = await req('/api/bazaar/dark/dispatch', { method: 'POST', token, body: {} });
  assert(bzDark.res.ok && bzDark.data.ok !== false, 'bazaar dark dispatch');
  const bzAck = await req('/api/bazaar/flag/ack', { method: 'POST', token, body: {} });
  assert(bzAck.res.ok && bzAck.data.ok !== false, 'bazaar flag ack');

  const hbSweep = await req('/api/harbor/sweep', { method: 'POST', token, body: { force: true } });
  assert(hbSweep.res.ok && hbSweep.data.ok !== false, 'harbor sweep');
  const hbCold = await req('/api/harbor/cold/clear', { method: 'POST', token, body: {} });
  assert(hbCold.res.ok && hbCold.data.ok !== false, 'harbor cold clear');
  const hbHold = await req('/api/harbor/hold/release', { method: 'POST', token, body: {} });
  assert(hbHold.res.ok && hbHold.data.ok !== false, 'harbor hold release');
  const hbDem = await req('/api/harbor/demurrage/invoice', { method: 'POST', token, body: {} });
  assert(hbDem.res.ok && hbDem.data.ok !== false, 'harbor demurrage invoice');
  const hbAck = await req('/api/harbor/flag/ack', { method: 'POST', token, body: {} });
  assert(hbAck.res.ok && hbAck.data.ok !== false, 'harbor flag ack');

  const snlSweep = await req('/api/sentinel/sweep', { method: 'POST', token, body: { force: true } });
  assert(snlSweep.res.ok && snlSweep.data.ok !== false, 'sentinel sweep');
  const snlLost = await req('/api/sentinel/lost/resolve', { method: 'POST', token, body: {} });
  assert(snlLost.res.ok && snlLost.data.ok !== false, 'sentinel lost resolve');
  const snlAed = await req('/api/sentinel/aed/service', { method: 'POST', token, body: {} });
  assert(snlAed.res.ok && snlAed.data.ok !== false, 'sentinel aed service');
  const snlGate = await req('/api/sentinel/gate/flow', { method: 'POST', token, body: {} });
  assert(snlGate.res.ok && snlGate.data.ok !== false, 'sentinel gate flow');
  const snlAck = await req('/api/sentinel/flag/ack', { method: 'POST', token, body: {} });
  assert(snlAck.res.ok && snlAck.data.ok !== false, 'sentinel flag ack');

  const emSweep = await req('/api/empire/sweep', { method: 'POST', token, body: { force: true } });
  assert(emSweep.res.ok && emSweep.data.ok !== false, 'empire sweep');
  const emTy = await req('/api/empire/ty/sync', { method: 'POST', token, body: {} });
  assert(emTy.res.ok && emTy.data.ok !== false, 'empire ty sync');
  const emHeph = await req('/api/empire/hepha/ship', { method: 'POST', token, body: {} });
  assert(emHeph.res.ok && emHeph.data.ok !== false, 'empire hepha ship');
  const emTour = await req('/api/empire/tour/depart', { method: 'POST', token, body: {} });
  assert(emTour.res.ok && emTour.data.ok !== false, 'empire tour depart');
  const emAck = await req('/api/empire/flag/ack', { method: 'POST', token, body: {} });
  assert(emAck.res.ok && emAck.data.ok !== false, 'empire flag ack');

  const elySweep = await req('/api/elysium/sweep', { method: 'POST', token, body: { force: true } });
  assert(elySweep.res.ok && elySweep.data.ok !== false, 'elysium sweep');
  const elyAcc = await req('/api/elysium/access/close', { method: 'POST', token, body: {} });
  assert(elyAcc.res.ok && elyAcc.data.ok !== false, 'elysium access close');
  const elyRole = await req('/api/elysium/role/approve', { method: 'POST', token, body: {} });
  assert(elyRole.res.ok && elyRole.data.ok !== false, 'elysium role approve');
  const elyBreach = await req('/api/elysium/breach/archive', { method: 'POST', token, body: {} });
  assert(elyBreach.res.ok && elyBreach.data.ok !== false, 'elysium breach archive');
  const elyAck = await req('/api/elysium/flag/ack', { method: 'POST', token, body: {} });
  assert(elyAck.res.ok && elyAck.data.ok !== false, 'elysium flag ack');

  const tdSweep = await req('/api/tide/sweep', { method: 'POST', token, body: { force: true } });
  assert(tdSweep.res.ok && tdSweep.data.ok !== false, 'tide sweep');
  const tdReef = await req('/api/tide/reef/clear', { method: 'POST', token, body: {} });
  assert(tdReef.res.ok && tdReef.data.ok !== false, 'tide reef clear');
  const tdCliff = await req('/api/tide/cliff/open', { method: 'POST', token, body: {} });
  assert(tdCliff.res.ok && tdCliff.data.ok !== false, 'tide cliff open');
  const tdPier = await req('/api/tide/pier/free', { method: 'POST', token, body: {} });
  assert(tdPier.res.ok && tdPier.data.ok !== false, 'tide pier free');
  const tdAck = await req('/api/tide/flag/ack', { method: 'POST', token, body: {} });
  assert(tdAck.res.ok && tdAck.data.ok !== false, 'tide flag ack');

  const skSweep = await req('/api/skyline/sweep', { method: 'POST', token, body: { force: true } });
  assert(skSweep.res.ok && skSweep.data.ok !== false, 'skyline sweep');
  const skSound = await req('/api/skyline/sound/pass', { method: 'POST', token, body: {} });
  assert(skSound.res.ok && skSound.data.ok !== false, 'skyline sound pass');
  const skEsc = await req('/api/skyline/escape/end', { method: 'POST', token, body: {} });
  assert(skEsc.res.ok && skEsc.data.ok !== false, 'skyline escape end');
  const skJet = await req('/api/skyline/jet/service', { method: 'POST', token, body: {} });
  assert(skJet.res.ok && skJet.data.ok !== false, 'skyline jet service');
  const skAck = await req('/api/skyline/flag/ack', { method: 'POST', token, body: {} });
  assert(skAck.res.ok && skAck.data.ok !== false, 'skyline flag ack');

  const atlSweep = await req('/api/atlas/sweep', { method: 'POST', token, body: { force: true } });
  assert(atlSweep.res.ok && atlSweep.data.ok !== false, 'atlas sweep');
  const atlFolio = await req('/api/atlas/folio/close', { method: 'POST', token, body: {} });
  assert(atlFolio.res.ok && atlFolio.data.ok !== false, 'atlas folio close');
  const atlDesk = await req('/api/atlas/desk/serve', { method: 'POST', token, body: {} });
  assert(atlDesk.res.ok && atlDesk.data.ok !== false, 'atlas desk serve');
  const atlAudit = await req('/api/atlas/audit/run', { method: 'POST', token, body: {} });
  assert(atlAudit.res.ok && atlAudit.data.ok !== false, 'atlas audit run');
  const atlAck = await req('/api/atlas/flag/ack', { method: 'POST', token, body: {} });
  assert(atlAck.res.ok && atlAck.data.ok !== false, 'atlas flag ack');

  const pxSweep = await req('/api/phoenix2/sweep', { method: 'POST', token, body: { force: true } });
  assert(pxSweep.res.ok && pxSweep.data.ok !== false, 'phoenix2 sweep');
  const pxBackup = await req('/api/phoenix2/backup/close', { method: 'POST', token, body: {} });
  assert(pxBackup.res.ok && pxBackup.data.ok !== false, 'phoenix2 backup close');
  const pxRun = await req('/api/phoenix2/runbook/live', { method: 'POST', token, body: {} });
  assert(pxRun.res.ok && pxRun.data.ok !== false, 'phoenix2 runbook live');
  const pxDrill = await req('/api/phoenix2/drill/close', { method: 'POST', token, body: {} });
  assert(pxDrill.res.ok && pxDrill.data.ok !== false, 'phoenix2 drill close');
  const pxAck = await req('/api/phoenix2/flag/ack', { method: 'POST', token, body: {} });
  assert(pxAck.res.ok && pxAck.data.ok !== false, 'phoenix2 flag ack');

  const odSweep = await req('/api/odyssey/sweep', { method: 'POST', token, body: { force: true } });
  assert(odSweep.res.ok && odSweep.data.ok !== false, 'odyssey sweep');
  const odOkr = await req('/api/odyssey/okr/recover', { method: 'POST', token, body: {} });
  assert(odOkr.res.ok && odOkr.data.ok !== false, 'odyssey okr recover');
  const odRisk = await req('/api/odyssey/risk/cool', { method: 'POST', token, body: {} });
  assert(odRisk.res.ok && odRisk.data.ok !== false, 'odyssey risk cool');
  const odStar = await req('/api/odyssey/star/hit', { method: 'POST', token, body: {} });
  assert(odStar.res.ok && odStar.data.ok !== false, 'odyssey star hit');
  const odAck = await req('/api/odyssey/flag/ack', { method: 'POST', token, body: {} });
  assert(odAck.res.ok && odAck.data.ok !== false, 'odyssey flag ack');

  const shSweep = await req('/api/signalhub/sweep', { method: 'POST', token, body: { force: true } });
  assert(shSweep.res.ok && shSweep.data.ok !== false, 'signalhub sweep');
  const shWater = await req('/api/signalhub/water/clear', { method: 'POST', token, body: {} });
  assert(shWater.res.ok && shWater.data.ok !== false, 'signalhub water clear');
  const shChem = await req('/api/signalhub/chem/clear', { method: 'POST', token, body: {} });
  assert(shChem.res.ok && shChem.data.ok !== false, 'signalhub chem clear');
  const shGate = await req('/api/signalhub/gate/clear', { method: 'POST', token, body: {} });
  assert(shGate.res.ok && shGate.data.ok !== false, 'signalhub gate clear');
  const shAck = await req('/api/signalhub/flag/ack', { method: 'POST', token, body: {} });
  assert(shAck.res.ok && shAck.data.ok !== false, 'signalhub flag ack');

  const lnSweep = await req('/api/linen/sweep', { method: 'POST', token, body: { force: true } });
  assert(lnSweep.res.ok && lnSweep.data.ok !== false, 'linen sweep');
  const lnPass = await req('/api/linen/inspect/pass', { method: 'POST', token, body: {} });
  assert(lnPass.res.ok && lnPass.data.ok !== false, 'linen inspect pass');
  const lnOoo = await req('/api/linen/ooo/release', { method: 'POST', token, body: {} });
  assert(lnOoo.res.ok && lnOoo.data.ok !== false, 'linen ooo release');
  const lnHk = await req('/api/linen/hk/complete', { method: 'POST', token, body: {} });
  assert(lnHk.res.ok && lnHk.data.ok !== false, 'linen hk complete');
  const lnAck = await req('/api/linen/flag/ack', { method: 'POST', token, body: {} });
  assert(lnAck.res.ok && lnAck.data.ok !== false, 'linen flag ack');

  const c2Sweep = await req('/api/charter2/sweep', { method: 'POST', token, body: { force: true } });
  assert(c2Sweep.res.ok && c2Sweep.data.ok !== false, 'charter2 sweep');
  const c2Ethics = await req('/api/charter2/ethics/close', { method: 'POST', token, body: {} });
  assert(c2Ethics.res.ok && c2Ethics.data.ok !== false, 'charter2 ethics close');
  const c2Risk = await req('/api/charter2/risk/live', { method: 'POST', token, body: {} });
  assert(c2Risk.res.ok && c2Risk.data.ok !== false, 'charter2 risk live');
  const c2Claim = await req('/api/charter2/claim/done', { method: 'POST', token, body: {} });
  assert(c2Claim.res.ok && c2Claim.data.ok !== false, 'charter2 claim done');
  const c2Ack = await req('/api/charter2/flag/ack', { method: 'POST', token, body: {} });
  assert(c2Ack.res.ok && c2Ack.data.ok !== false, 'charter2 flag ack');

  const znSweep = await req('/api/zenith/sweep', { method: 'POST', token, body: { force: true } });
  assert(znSweep.res.ok && znSweep.data.ok !== false, 'zenith sweep');
  const znPace = await req('/api/zenith/pace/catch', { method: 'POST', token, body: {} });
  assert(znPace.res.ok && znPace.data.ok !== false, 'zenith pace catch');
  const znMargin = await req('/api/zenith/margin/heal', { method: 'POST', token, body: {} });
  assert(znMargin.res.ok && znMargin.data.ok !== false, 'zenith margin heal');
  const znDemand = await req('/api/zenith/demand/cool', { method: 'POST', token, body: {} });
  assert(znDemand.res.ok && znDemand.data.ok !== false, 'zenith demand cool');
  const znAck = await req('/api/zenith/flag/ack', { method: 'POST', token, body: {} });
  assert(znAck.res.ok && znAck.data.ok !== false, 'zenith flag ack');

  const pySweep = await req('/api/pyramid/sweep', { method: 'POST', token, body: { force: true } });
  assert(pySweep.res.ok && pySweep.data.ok !== false, 'pyramid sweep');
  const pySys = await req('/api/pyramid/sys/resolve', { method: 'POST', token, body: {} });
  assert(pySys.res.ok && pySys.data.ok !== false, 'pyramid sys resolve');
  const pyNet = await req('/api/pyramid/net/heal', { method: 'POST', token, body: {} });
  assert(pyNet.res.ok && pyNet.data.ok !== false, 'pyramid net heal');
  const pyComms = await req('/api/pyramid/comms/flush', { method: 'POST', token, body: {} });
  assert(pyComms.res.ok && pyComms.data.ok !== false, 'pyramid comms flush');
  const pyAck = await req('/api/pyramid/flag/ack', { method: 'POST', token, body: {} });
  assert(pyAck.res.ok && pyAck.data.ok !== false, 'pyramid flag ack');

  const cvSweep = await req('/api/convoy/sweep', { method: 'POST', token, body: { force: true } });
  assert(cvSweep.res.ok && cvSweep.data.ok !== false, 'convoy sweep');
  const cvDisp = await req('/api/convoy/dispatch/clear', { method: 'POST', token, body: {} });
  assert(cvDisp.res.ok && cvDisp.data.ok !== false, 'convoy dispatch clear');
  const cvFleet = await req('/api/convoy/fleet/ready', { method: 'POST', token, body: {} });
  assert(cvFleet.res.ok && cvFleet.data.ok !== false, 'convoy fleet ready');
  const cvCurb = await req('/api/convoy/curb/free', { method: 'POST', token, body: {} });
  assert(cvCurb.res.ok && cvCurb.data.ok !== false, 'convoy curb free');
  const cvAck = await req('/api/convoy/flag/ack', { method: 'POST', token, body: {} });
  assert(cvAck.res.ok && cvAck.data.ok !== false, 'convoy flag ack');

  const crSweep = await req('/api/crucible2/sweep', { method: 'POST', token, body: { force: true } });
  assert(crSweep.res.ok && crSweep.data.ok !== false, 'crucible2 sweep');
  const crPilot = await req('/api/crucible2/pilot/live', { method: 'POST', token, body: {} });
  assert(crPilot.res.ok && crPilot.data.ok !== false, 'crucible2 pilot live');
  const crLearn = await req('/api/crucible2/learn/busy', { method: 'POST', token, body: {} });
  assert(crLearn.res.ok && crLearn.data.ok !== false, 'crucible2 learn busy');
  const crLab = await req('/api/crucible2/lab/ship', { method: 'POST', token, body: {} });
  assert(crLab.res.ok && crLab.data.ok !== false, 'crucible2 lab ship');
  const crAck = await req('/api/crucible2/flag/ack', { method: 'POST', token, body: {} });
  assert(crAck.res.ok && crAck.data.ok !== false, 'crucible2 flag ack');

  const agSweep = await req('/api/agora/sweep', { method: 'POST', token, body: { force: true } });
  assert(agSweep.res.ok && agSweep.data.ok !== false, 'agora sweep');
  const agDrill = await req('/api/agora/drill/run', { method: 'POST', token, body: {} });
  assert(agDrill.res.ok && agDrill.data.ok !== false, 'agora drill run');
  const agCircle = await req('/api/agora/circle/busy', { method: 'POST', token, body: {} });
  assert(agCircle.res.ok && agCircle.data.ok !== false, 'agora circle busy');
  const agBadge = await req('/api/agora/badge/live', { method: 'POST', token, body: {} });
  assert(agBadge.res.ok && agBadge.data.ok !== false, 'agora badge live');
  const agAck = await req('/api/agora/flag/ack', { method: 'POST', token, body: {} });
  assert(agAck.res.ok && agAck.data.ok !== false, 'agora flag ack');

  const bcSweep = await req('/api/beacon/sweep', { method: 'POST', token, body: { force: true } });
  assert(bcSweep.res.ok && bcSweep.data.ok !== false, 'beacon sweep');
  const bcCamp = await req('/api/beacon/camp/live', { method: 'POST', token, body: {} });
  assert(bcCamp.res.ok && bcCamp.data.ok !== false, 'beacon camp live');
  const bcSocial = await req('/api/beacon/social/fix', { method: 'POST', token, body: {} });
  assert(bcSocial.res.ok && bcSocial.data.ok !== false, 'beacon social fix');
  const bcSeo = await req('/api/beacon/seo/heal', { method: 'POST', token, body: {} });
  assert(bcSeo.res.ok && bcSeo.data.ok !== false, 'beacon seo heal');
  const bcAck = await req('/api/beacon/flag/ack', { method: 'POST', token, body: {} });
  assert(bcAck.res.ok && bcAck.data.ok !== false, 'beacon flag ack');

  const chSweep = await req('/api/chronos/sweep', { method: 'POST', token, body: { force: true } });
  assert(chSweep.res.ok && chSweep.data.ok !== false, 'chronos sweep');
  const chMoment = await req('/api/chronos/moment/busy', { method: 'POST', token, body: {} });
  assert(chMoment.res.ok && chMoment.data.ok !== false, 'chronos moment busy');
  const chHook = await req('/api/chronos/hook/close', { method: 'POST', token, body: {} });
  assert(chHook.res.ok && chHook.data.ok !== false, 'chronos hook close');
  const chSchema = await req('/api/chronos/schema/live', { method: 'POST', token, body: {} });
  assert(chSchema.res.ok && chSchema.data.ok !== false, 'chronos schema live');
  const chAck = await req('/api/chronos/flag/ack', { method: 'POST', token, body: {} });
  assert(chAck.res.ok && chAck.data.ok !== false, 'chronos flag ack');

  const ciSweep = await req('/api/circuit/sweep', { method: 'POST', token, body: { force: true } });
  assert(ciSweep.res.ok && ciSweep.data.ok !== false, 'circuit sweep');
  const ciMoment = await req('/api/circuit/moment/busy', { method: 'POST', token, body: {} });
  assert(ciMoment.res.ok && ciMoment.data.ok !== false, 'circuit moment busy');
  const ciHook = await req('/api/circuit/hook/close', { method: 'POST', token, body: {} });
  assert(ciHook.res.ok && ciHook.data.ok !== false, 'circuit hook close');
  const ciSchema = await req('/api/circuit/schema/live', { method: 'POST', token, body: {} });
  assert(ciSchema.res.ok && ciSchema.data.ok !== false, 'circuit schema live');
  const ciAck = await req('/api/circuit/flag/ack', { method: 'POST', token, body: {} });
  assert(ciAck.res.ok && ciAck.data.ok !== false, 'circuit flag ack');

  const crwSweep = await req('/api/crown/sweep', { method: 'POST', token, body: { force: true } });
  assert(crwSweep.res.ok && crwSweep.data.ok !== false, 'crown sweep');
  const crwVip = await req('/api/crown/vip/house', { method: 'POST', token, body: {} });
  assert(crwVip.res.ok && crwVip.data.ok !== false, 'crown vip house');
  const crwCase = await req('/api/crown/case/close', { method: 'POST', token, body: {} });
  assert(crwCase.res.ok && crwCase.data.ok !== false, 'crown case close');
  const crwWin = await req('/api/crown/winback/live', { method: 'POST', token, body: {} });
  assert(crwWin.res.ok && crwWin.data.ok !== false, 'crown winback live');
  const crwAck = await req('/api/crown/flag/ack', { method: 'POST', token, body: {} });
  assert(crwAck.res.ok && crwAck.data.ok !== false, 'crown flag ack');

  const domSweep = await req('/api/dominion/sweep', { method: 'POST', token, body: { force: true } });
  assert(domSweep.res.ok && domSweep.data.ok !== false, 'dominion sweep');
  const domSup = await req('/api/dominion/supplier/live', { method: 'POST', token, body: {} });
  assert(domSup.res.ok && domSup.data.ok !== false, 'dominion supplier live');
  const domBoard = await req('/api/dominion/board/run', { method: 'POST', token, body: {} });
  assert(domBoard.res.ok && domBoard.data.ok !== false, 'dominion board run');
  const domCash = await req('/api/dominion/cash/busy', { method: 'POST', token, body: {} });
  assert(domCash.res.ok && domCash.data.ok !== false, 'dominion cash busy');
  const domAck = await req('/api/dominion/flag/ack', { method: 'POST', token, body: {} });
  assert(domAck.res.ok && domAck.data.ok !== false, 'dominion flag ack');

  const frSweep = await req('/api/frontier/sweep', { method: 'POST', token, body: { force: true } });
  assert(frSweep.res.ok && frSweep.data.ok !== false, 'frontier sweep');
  const frRestore = await req('/api/frontier/restore/run', { method: 'POST', token, body: {} });
  assert(frRestore.res.ok && frRestore.data.ok !== false, 'frontier restore run');
  const frSite = await req('/api/frontier/site/busy', { method: 'POST', token, body: {} });
  assert(frSite.res.ok && frSite.data.ok !== false, 'frontier site busy');
  const frHire = await req('/api/frontier/hire/live', { method: 'POST', token, body: {} });
  assert(frHire.res.ok && frHire.data.ok !== false, 'frontier hire live');
  const frAck = await req('/api/frontier/flag/ack', { method: 'POST', token, body: {} });
  assert(frAck.res.ok && frAck.data.ok !== false, 'frontier flag ack');

  const gaSweep = await req('/api/gaia/sweep', { method: 'POST', token, body: { force: true } });
  assert(gaSweep.res.ok && gaSweep.data.ok !== false, 'gaia sweep');
  const gaLegacy = await req('/api/gaia/legacy/close', { method: 'POST', token, body: {} });
  assert(gaLegacy.res.ok && gaLegacy.data.ok !== false, 'gaia legacy close');
  const gaQuiet = await req('/api/gaia/quiet/live', { method: 'POST', token, body: {} });
  assert(gaQuiet.res.ok && gaQuiet.data.ok !== false, 'gaia quiet live');
  const gaPillow = await req('/api/gaia/pillow/run', { method: 'POST', token, body: {} });
  assert(gaPillow.res.ok && gaPillow.data.ok !== false, 'gaia pillow run');
  const gaAck = await req('/api/gaia/flag/ack', { method: 'POST', token, body: {} });
  assert(gaAck.res.ok && gaAck.data.ok !== false, 'gaia flag ack');

  const helSweep = await req('/api/helios/sweep', { method: 'POST', token, body: { force: true } });
  assert(helSweep.res.ok && helSweep.data.ok !== false, 'helios sweep');
  const helInbound = await req('/api/helios/inbound/run', { method: 'POST', token, body: {} });
  assert(helInbound.res.ok && helInbound.data.ok !== false, 'helios inbound run');
  const helAsn = await req('/api/helios/asn/busy', { method: 'POST', token, body: {} });
  assert(helAsn.res.ok && helAsn.data.ok !== false, 'helios asn busy');
  const helSlot = await req('/api/helios/slot/live', { method: 'POST', token, body: {} });
  assert(helSlot.res.ok && helSlot.data.ok !== false, 'helios slot live');
  const helAck = await req('/api/helios/flag/ack', { method: 'POST', token, body: {} });
  assert(helAck.res.ok && helAck.data.ok !== false, 'helios flag ack');

  const kaiSweep = await req('/api/kairos/sweep', { method: 'POST', token, body: { force: true } });
  assert(kaiSweep.res.ok && kaiSweep.data.ok !== false, 'kairos sweep');
  const kaiDrill = await req('/api/kairos/drill/run', { method: 'POST', token, body: {} });
  assert(kaiDrill.res.ok && kaiDrill.data.ok !== false, 'kairos drill run');
  const kaiCircle = await req('/api/kairos/circle/busy', { method: 'POST', token, body: {} });
  assert(kaiCircle.res.ok && kaiCircle.data.ok !== false, 'kairos circle busy');
  const kaiBadge = await req('/api/kairos/badge/live', { method: 'POST', token, body: {} });
  assert(kaiBadge.res.ok && kaiBadge.data.ok !== false, 'kairos badge live');
  const kaiAck = await req('/api/kairos/flag/ack', { method: 'POST', token, body: {} });
  assert(kaiAck.res.ok && kaiAck.data.ok !== false, 'kairos flag ack');

  const keySweep = await req('/api/keystone/sweep', { method: 'POST', token, body: { force: true } });
  assert(keySweep.res.ok && keySweep.data.ok !== false, 'keystone sweep');
  const keyBus = await req('/api/keystone/bus/clear', { method: 'POST', token, body: {} });
  assert(keyBus.res.ok && keyBus.data.ok !== false, 'keystone bus clear');
  const keySlo = await req('/api/keystone/slo/heal', { method: 'POST', token, body: {} });
  assert(keySlo.res.ok && keySlo.data.ok !== false, 'keystone slo heal');
  const keyEsc = await req('/api/keystone/esc/close', { method: 'POST', token, body: {} });
  assert(keyEsc.res.ok && keyEsc.data.ok !== false, 'keystone esc close');
  const keyAck = await req('/api/keystone/flag/ack', { method: 'POST', token, body: {} });
  assert(keyAck.res.ok && keyAck.data.ok !== false, 'keystone flag ack');

  const latSweep = await req('/api/lattice/sweep', { method: 'POST', token, body: { force: true } });
  assert(latSweep.res.ok && latSweep.data.ok !== false, 'lattice sweep');
  const latGate = await req('/api/lattice/gate/heal', { method: 'POST', token, body: {} });
  assert(latGate.res.ok && latGate.data.ok !== false, 'lattice gate heal');
  const latOta = await req('/api/lattice/ota/retry', { method: 'POST', token, body: {} });
  assert(latOta.res.ok && latOta.data.ok !== false, 'lattice ota retry');
  const latFail = await req('/api/lattice/failback/clear', { method: 'POST', token, body: {} });
  assert(latFail.res.ok && latFail.data.ok !== false, 'lattice failback clear');
  const latAck = await req('/api/lattice/flag/ack', { method: 'POST', token, body: {} });
  assert(latAck.res.ok && latAck.data.ok !== false, 'lattice flag ack');

  const mirSweep = await req('/api/mirror/sweep', { method: 'POST', token, body: { force: true } });
  assert(mirSweep.res.ok && mirSweep.data.ok !== false, 'mirror sweep');
  const mirTwin = await req('/api/mirror/twin/refresh', { method: 'POST', token, body: {} });
  assert(mirTwin.res.ok && mirTwin.data.ok !== false, 'mirror twin refresh');
  const mirNba = await req('/api/mirror/nba/accept', { method: 'POST', token, body: {} });
  assert(mirNba.res.ok && mirNba.data.ok !== false, 'mirror nba accept');
  const mirRec = await req('/api/mirror/recovery/close', { method: 'POST', token, body: {} });
  assert(mirRec.res.ok && mirRec.data.ok !== false, 'mirror recovery close');
  const mirAck = await req('/api/mirror/flag/ack', { method: 'POST', token, body: {} });
  assert(mirAck.res.ok && mirAck.data.ok !== false, 'mirror flag ack');

  const monSweep = await req('/api/monument/sweep', { method: 'POST', token, body: { force: true } });
  assert(monSweep.res.ok && monSweep.data.ok !== false, 'monument sweep');
  const monCor = await req('/api/monument/corrective/close', { method: 'POST', token, body: {} });
  assert(monCor.res.ok && monCor.data.ok !== false, 'monument corrective close');
  const monOral = await req('/api/monument/oral/live', { method: 'POST', token, body: {} });
  assert(monOral.res.ok && monOral.data.ok !== false, 'monument oral live');
  const monTim = await req('/api/monument/timeline/run', { method: 'POST', token, body: {} });
  assert(monTim.res.ok && monTim.data.ok !== false, 'monument timeline run');
  const monAck = await req('/api/monument/flag/ack', { method: 'POST', token, body: {} });
  assert(monAck.res.ok && monAck.data.ok !== false, 'monument flag ack');

  const olySweep = await req('/api/olympus/sweep', { method: 'POST', token, body: { force: true } });
  assert(olySweep.res.ok && olySweep.data.ok !== false, 'olympus sweep');
  const olySeal = await req('/api/olympus/seal/close', { method: 'POST', token, body: {} });
  assert(olySeal.res.ok && olySeal.data.ok !== false, 'olympus seal close');
  const olyBrief = await req('/api/olympus/brief/live', { method: 'POST', token, body: {} });
  assert(olyBrief.res.ok && olyBrief.data.ok !== false, 'olympus brief live');
  const olyStory = await req('/api/olympus/story/busy', { method: 'POST', token, body: {} });
  assert(olyStory.res.ok && olyStory.data.ok !== false, 'olympus story busy');
  const olyAck = await req('/api/olympus/flag/ack', { method: 'POST', token, body: {} });
  assert(olyAck.res.ok && olyAck.data.ok !== false, 'olympus flag ack');

  const patSweep = await req('/api/pathos/sweep', { method: 'POST', token, body: { force: true } });
  assert(patSweep.res.ok && patSweep.data.ok !== false, 'pathos sweep');
  const patIp = await req('/api/pathos/ip/close', { method: 'POST', token, body: {} });
  assert(patIp.res.ok && patIp.data.ok !== false, 'pathos ip close');
  const patRisk = await req('/api/pathos/risk/live', { method: 'POST', token, body: {} });
  assert(patRisk.res.ok && patRisk.data.ok !== false, 'pathos risk live');
  const patClaim = await req('/api/pathos/claim/run', { method: 'POST', token, body: {} });
  assert(patClaim.res.ok && patClaim.data.ok !== false, 'pathos claim run');
  const patAck = await req('/api/pathos/flag/ack', { method: 'POST', token, body: {} });
  assert(patAck.res.ok && patAck.data.ok !== false, 'pathos flag ack');

  const priSweep = await req('/api/prism/sweep', { method: 'POST', token, body: { force: true } });
  assert(priSweep.res.ok && priSweep.data.ok !== false, 'prism sweep');
  const priMark = await req('/api/prism/mark/close', { method: 'POST', token, body: {} });
  assert(priMark.res.ok && priMark.data.ok !== false, 'prism mark close');
  const priPost = await req('/api/prism/post/live', { method: 'POST', token, body: {} });
  assert(priPost.res.ok && priPost.data.ok !== false, 'prism post live');
  const priDef = await req('/api/prism/defect/run', { method: 'POST', token, body: {} });
  assert(priDef.res.ok && priDef.data.ok !== false, 'prism defect run');
  const priAck = await req('/api/prism/flag/ack', { method: 'POST', token, body: {} });
  assert(priAck.res.ok && priAck.data.ok !== false, 'prism flag ack');

  const selSweep = await req('/api/selene/sweep', { method: 'POST', token, body: { force: true } });
  assert(selSweep.res.ok && selSweep.data.ok !== false, 'selene sweep');
  const selHeat = await req('/api/selene/heat/close', { method: 'POST', token, body: {} });
  assert(selHeat.res.ok && selHeat.data.ok !== false, 'selene heat close');
  const selSup = await req('/api/selene/supplier/live', { method: 'POST', token, body: {} });
  assert(selSup.res.ok && selSup.data.ok !== false, 'selene supplier live');
  const selBoard = await req('/api/selene/board/run', { method: 'POST', token, body: {} });
  assert(selBoard.res.ok && selBoard.data.ok !== false, 'selene board run');
  const selAck = await req('/api/selene/flag/ack', { method: 'POST', token, body: {} });
  assert(selAck.res.ok && selAck.data.ok !== false, 'selene flag ack');

  const snySweep = await req('/api/serenity/sweep', { method: 'POST', token, body: { force: true } });
  assert(snySweep.res.ok && snySweep.data.ok !== false, 'serenity sweep');
  const snyLeg = await req('/api/serenity/legacy/close', { method: 'POST', token, body: {} });
  assert(snyLeg.res.ok && snyLeg.data.ok !== false, 'serenity legacy close');
  const snyQuiet = await req('/api/serenity/quiet/live', { method: 'POST', token, body: {} });
  assert(snyQuiet.res.ok && snyQuiet.data.ok !== false, 'serenity quiet live');
  const snyPillow = await req('/api/serenity/pillow/run', { method: 'POST', token, body: {} });
  assert(snyPillow.res.ok && snyPillow.data.ok !== false, 'serenity pillow run');
  const snyAck = await req('/api/serenity/flag/ack', { method: 'POST', token, body: {} });
  assert(snyAck.res.ok && snyAck.data.ok !== false, 'serenity flag ack');

  const vltSweep = await req('/api/vault/sweep', { method: 'POST', token, body: { force: true } });
  assert(vltSweep.res.ok && vltSweep.data.ok !== false, 'vault sweep');
  const vltTres = await req('/api/vault/treasury/heal', { method: 'POST', token, body: {} });
  assert(vltTres.res.ok && vltTres.data.ok !== false, 'vault treasury heal');
  const vltAp = await req('/api/vault/ap/close', { method: 'POST', token, body: {} });
  assert(vltAp.res.ok && vltAp.data.ok !== false, 'vault ap close');
  const vltRecon = await req('/api/vault/recon/clear', { method: 'POST', token, body: {} });
  assert(vltRecon.res.ok && vltRecon.data.ok !== false, 'vault recon clear');
  const vltAck = await req('/api/vault/flag/ack', { method: 'POST', token, body: {} });
  assert(vltAck.res.ok && vltAck.data.ok !== false, 'vault flag ack');

  const al2Sweep = await req('/api/alliance2/sweep', { method: 'POST', token, body: { force: true } });
  assert(al2Sweep.res.ok && al2Sweep.data.ok !== false, 'alliance2 sweep');
  const al2Partner = await req('/api/alliance2/partner/busy', { method: 'POST', token, body: {} });
  assert(al2Partner.res.ok && al2Partner.data.ok !== false, 'alliance2 partner busy');
  const al2Channel = await req('/api/alliance2/channel/close', { method: 'POST', token, body: {} });
  assert(al2Channel.res.ok && al2Channel.data.ok !== false, 'alliance2 channel close');
  const al2Invest = await req('/api/alliance2/invest/live', { method: 'POST', token, body: {} });
  assert(al2Invest.res.ok && al2Invest.data.ok !== false, 'alliance2 invest live');
  const al2Ack = await req('/api/alliance2/flag/ack', { method: 'POST', token, body: {} });
  assert(al2Ack.res.ok && al2Ack.data.ok !== false, 'alliance2 flag ack');

  const artSweep = await req('/api/artery/sweep', { method: 'POST', token, body: { force: true } });
  assert(artSweep.res.ok && artSweep.data.ok !== false, 'artery sweep');
  const artInbound = await req('/api/artery/inbound/run', { method: 'POST', token, body: {} });
  assert(artInbound.res.ok && artInbound.data.ok !== false, 'artery inbound run');
  const artAsn = await req('/api/artery/asn/busy', { method: 'POST', token, body: {} });
  assert(artAsn.res.ok && artAsn.data.ok !== false, 'artery asn busy');
  const artDock = await req('/api/artery/dock/close', { method: 'POST', token, body: {} });
  assert(artDock.res.ok && artDock.data.ok !== false, 'artery dock close');
  const artAck = await req('/api/artery/flag/ack', { method: 'POST', token, body: {} });
  assert(artAck.res.ok && artAck.data.ok !== false, 'artery flag ack');

  const bs2Sweep = await req('/api/bastion2/sweep', { method: 'POST', token, body: { force: true } });
  assert(bs2Sweep.res.ok && bs2Sweep.data.ok !== false, 'bastion2 sweep');
  const bs2Acc = await req('/api/bastion2/access/close', { method: 'POST', token, body: {} });
  assert(bs2Acc.res.ok && bs2Acc.data.ok !== false, 'bastion2 access close');
  const bs2Role = await req('/api/bastion2/role/approve', { method: 'POST', token, body: {} });
  assert(bs2Role.res.ok && bs2Role.data.ok !== false, 'bastion2 role approve');
  const bs2Breach = await req('/api/bastion2/breach/archive', { method: 'POST', token, body: {} });
  assert(bs2Breach.res.ok && bs2Breach.data.ok !== false, 'bastion2 breach archive');
  const bs2Ack = await req('/api/bastion2/flag/ack', { method: 'POST', token, body: {} });
  assert(bs2Ack.res.ok && bs2Ack.data.ok !== false, 'bastion2 flag ack');

  const ag2Sweep = await req('/api/agora2/sweep', { method: 'POST', token, body: { force: true } });
  assert(ag2Sweep.res.ok && ag2Sweep.data.ok !== false, 'agora2 sweep');
  const ag2Drill = await req('/api/agora2/drill/run', { method: 'POST', token, body: {} });
  assert(ag2Drill.res.ok && ag2Drill.data.ok !== false, 'agora2 drill run');
  const ag2Circle = await req('/api/agora2/circle/busy', { method: 'POST', token, body: {} });
  assert(ag2Circle.res.ok && ag2Circle.data.ok !== false, 'agora2 circle busy');
  const ag2Badge = await req('/api/agora2/badge/live', { method: 'POST', token, body: {} });
  assert(ag2Badge.res.ok && ag2Badge.data.ok !== false, 'agora2 badge live');
  const ag2Ack = await req('/api/agora2/flag/ack', { method: 'POST', token, body: {} });
  assert(ag2Ack.res.ok && ag2Ack.data.ok !== false, 'agora2 flag ack');

  const al3Sweep = await req('/api/alliance3/sweep', { method: 'POST', token, body: { force: true } });
  assert(al3Sweep.res.ok && al3Sweep.data.ok !== false, 'alliance3 sweep');
  const al3Partner = await req('/api/alliance3/partner/busy', { method: 'POST', token, body: {} });
  assert(al3Partner.res.ok && al3Partner.data.ok !== false, 'alliance3 partner busy');
  const al3Channel = await req('/api/alliance3/channel/close', { method: 'POST', token, body: {} });
  assert(al3Channel.res.ok && al3Channel.data.ok !== false, 'alliance3 channel close');
  const al3Invest = await req('/api/alliance3/invest/live', { method: 'POST', token, body: {} });
  assert(al3Invest.res.ok && al3Invest.data.ok !== false, 'alliance3 invest live');
  const al3Ack = await req('/api/alliance3/flag/ack', { method: 'POST', token, body: {} });
  assert(al3Ack.res.ok && al3Ack.data.ok !== false, 'alliance3 flag ack');

  const ar2Sweep = await req('/api/artery2/sweep', { method: 'POST', token, body: { force: true } });
  assert(ar2Sweep.res.ok && ar2Sweep.data.ok !== false, 'artery2 sweep');
  const ar2Inbound = await req('/api/artery2/inbound/run', { method: 'POST', token, body: {} });
  assert(ar2Inbound.res.ok && ar2Inbound.data.ok !== false, 'artery2 inbound run');
  const ar2Asn = await req('/api/artery2/asn/busy', { method: 'POST', token, body: {} });
  assert(ar2Asn.res.ok && ar2Asn.data.ok !== false, 'artery2 asn busy');
  const ar2Dock = await req('/api/artery2/dock/close', { method: 'POST', token, body: {} });
  assert(ar2Dock.res.ok && ar2Dock.data.ok !== false, 'artery2 dock close');
  const ar2Ack = await req('/api/artery2/flag/ack', { method: 'POST', token, body: {} });
  assert(ar2Ack.res.ok && ar2Ack.data.ok !== false, 'artery2 flag ack');

  const ci2Sweep = await req('/api/circuit2/sweep', { method: 'POST', token, body: { force: true } });
  assert(ci2Sweep.res.ok && ci2Sweep.data.ok !== false, 'circuit2 sweep');
  const ci2Moment = await req('/api/circuit2/moment/busy', { method: 'POST', token, body: {} });
  assert(ci2Moment.res.ok && ci2Moment.data.ok !== false, 'circuit2 moment busy');
  const ci2Hook = await req('/api/circuit2/hook/close', { method: 'POST', token, body: {} });
  assert(ci2Hook.res.ok && ci2Hook.data.ok !== false, 'circuit2 hook close');
  const ci2Schema = await req('/api/circuit2/schema/live', { method: 'POST', token, body: {} });
  assert(ci2Schema.res.ok && ci2Schema.data.ok !== false, 'circuit2 schema live');
  const ci2Ack = await req('/api/circuit2/flag/ack', { method: 'POST', token, body: {} });
  assert(ci2Ack.res.ok && ci2Ack.data.ok !== false, 'circuit2 flag ack');

  const cruSweep = await req('/api/crucible/sweep', { method: 'POST', token, body: { force: true } });
  assert(cruSweep.res.ok && cruSweep.data.ok !== false, 'crucible sweep');
  const cruPilot = await req('/api/crucible/pilot/live', { method: 'POST', token, body: {} });
  assert(cruPilot.res.ok && cruPilot.data.ok !== false, 'crucible pilot live');
  const cruLearn = await req('/api/crucible/learn/busy', { method: 'POST', token, body: {} });
  assert(cruLearn.res.ok && cruLearn.data.ok !== false, 'crucible learn busy');
  const cruLab = await req('/api/crucible/lab/ship', { method: 'POST', token, body: {} });
  assert(cruLab.res.ok && cruLab.data.ok !== false, 'crucible lab ship');
  const cruAck = await req('/api/crucible/flag/ack', { method: 'POST', token, body: {} });
  assert(cruAck.res.ok && cruAck.data.ok !== false, 'crucible flag ack');

  const apoSweep = await req('/api/apotheosis/sweep', { method: 'POST', token, body: { force: true } });
  assert(apoSweep.res.ok && apoSweep.data.ok !== false, 'apotheosis sweep');
  const apoBackup = await req('/api/apotheosis/backup/close', { method: 'POST', token, body: {} });
  assert(apoBackup.res.ok && apoBackup.data.ok !== false, 'apotheosis backup');
  const apoRun = await req('/api/apotheosis/runbook/live', { method: 'POST', token, body: {} });
  assert(apoRun.res.ok && apoRun.data.ok !== false, 'apotheosis runbook');
  const apoDrill = await req('/api/apotheosis/drill/close', { method: 'POST', token, body: {} });
  assert(apoDrill.res.ok && apoDrill.data.ok !== false, 'apotheosis drill');
  const apoAck = await req('/api/apotheosis/flag/ack', { method: 'POST', token, body: {} });
  assert(apoAck.res.ok && apoAck.data.ok !== false, 'apotheosis ack');

  const chrSweep = await req('/api/charter/sweep', { method: 'POST', token, body: { force: true } });
  assert(chrSweep.res.ok && chrSweep.data.ok !== false, 'charter sweep');
  const chrEthics = await req('/api/charter/ethics/close', { method: 'POST', token, body: {} });
  assert(chrEthics.res.ok && chrEthics.data.ok !== false, 'charter ethics');
  const chrRisk = await req('/api/charter/risk/live', { method: 'POST', token, body: {} });
  assert(chrRisk.res.ok && chrRisk.data.ok !== false, 'charter risk');
  const chrClaim = await req('/api/charter/claim/done', { method: 'POST', token, body: {} });
  assert(chrClaim.res.ok && chrClaim.data.ok !== false, 'charter claim');
  const chrAck = await req('/api/charter/flag/ack', { method: 'POST', token, body: {} });
  assert(chrAck.res.ok && chrAck.data.ok !== false, 'charter ack');

  const dm2Sweep = await req('/api/dominion2/sweep', { method: 'POST', token, body: { force: true } });
  assert(dm2Sweep.res.ok && dm2Sweep.data.ok !== false, 'dominion2 sweep');
  const dm2Sup = await req('/api/dominion2/supplier/live', { method: 'POST', token, body: {} });
  assert(dm2Sup.res.ok && dm2Sup.data.ok !== false, 'dominion2 supplier');
  const dm2Board = await req('/api/dominion2/board/run', { method: 'POST', token, body: {} });
  assert(dm2Board.res.ok && dm2Board.data.ok !== false, 'dominion2 board');
  const dm2Cash = await req('/api/dominion2/cash/busy', { method: 'POST', token, body: {} });
  assert(dm2Cash.res.ok && dm2Cash.data.ok !== false, 'dominion2 cash');
  const dm2Ack = await req('/api/dominion2/flag/ack', { method: 'POST', token, body: {} });
  assert(dm2Ack.res.ok && dm2Ack.data.ok !== false, 'dominion2 ack');

  const logSweep = await req('/api/logos/sweep', { method: 'POST', token, body: { force: true } });
  assert(logSweep.res.ok && logSweep.data.ok !== false, 'logos sweep');
  const logPilot = await req('/api/logos/pilot/live', { method: 'POST', token, body: {} });
  assert(logPilot.res.ok && logPilot.data.ok !== false, 'logos pilot');
  const logLearn = await req('/api/logos/learn/busy', { method: 'POST', token, body: {} });
  assert(logLearn.res.ok && logLearn.data.ok !== false, 'logos learn');
  const logLab = await req('/api/logos/lab/ship', { method: 'POST', token, body: {} });
  assert(logLab.res.ok && logLab.data.ok !== false, 'logos lab');
  const logAck = await req('/api/logos/flag/ack', { method: 'POST', token, body: {} });
  assert(logAck.res.ok && logAck.data.ok !== false, 'logos ack');

  const phxSweep = await req('/api/phoenix/sweep', { method: 'POST', token, body: { force: true } });
  assert(phxSweep.res.ok && phxSweep.data.ok !== false, 'phoenix sweep');
  const phxBackup = await req('/api/phoenix/backup/close', { method: 'POST', token, body: {} });
  assert(phxBackup.res.ok && phxBackup.data.ok !== false, 'phoenix backup');
  const phxRun = await req('/api/phoenix/runbook/live', { method: 'POST', token, body: {} });
  assert(phxRun.res.ok && phxRun.data.ok !== false, 'phoenix runbook');
  const phxDrill = await req('/api/phoenix/drill/close', { method: 'POST', token, body: {} });
  assert(phxDrill.res.ok && phxDrill.data.ok !== false, 'phoenix drill');
  const phxAck = await req('/api/phoenix/flag/ack', { method: 'POST', token, body: {} });
  assert(phxAck.res.ok && phxAck.data.ok !== false, 'phoenix ack');

  const sy2Sweep = await req('/api/serenity2/sweep', { method: 'POST', token, body: { force: true } });
  assert(sy2Sweep.res.ok && sy2Sweep.data.ok !== false, 'serenity2 sweep');
  const sy2Leg = await req('/api/serenity2/legacy/close', { method: 'POST', token, body: {} });
  assert(sy2Leg.res.ok && sy2Leg.data.ok !== false, 'serenity2 legacy');
  const sy2Quiet = await req('/api/serenity2/quiet/live', { method: 'POST', token, body: {} });
  assert(sy2Quiet.res.ok && sy2Quiet.data.ok !== false, 'serenity2 quiet');
  const sy2Pillow = await req('/api/serenity2/pillow/run', { method: 'POST', token, body: {} });
  assert(sy2Pillow.res.ok && sy2Pillow.data.ok !== false, 'serenity2 pillow');
  const sy2Ack = await req('/api/serenity2/flag/ack', { method: 'POST', token, body: {} });
  assert(sy2Ack.res.ok && sy2Ack.data.ok !== false, 'serenity2 ack');

  const brfSweep = await req('/api/brief/sweep', { method: 'POST', token, body: { force: true } });
  assert(brfSweep.res.ok && brfSweep.data.ok !== false, 'brief sweep');
  const brfInc = await req('/api/brief/incidents/ack', { method: 'POST', token, body: {} });
  assert(brfInc.res.ok && brfInc.data.ok !== false, 'brief incidents');
  const brfInv = await req('/api/brief/inventory/restock', { method: 'POST', token, body: {} });
  assert(brfInv.res.ok && brfInv.data.ok !== false, 'brief inventory');
  const brfMnt = await req('/api/brief/maintenance/close', { method: 'POST', token, body: {} });
  assert(brfMnt.res.ok && brfMnt.data.ok !== false, 'brief maintenance');
  const brfAck = await req('/api/brief/flag/ack', { method: 'POST', token, body: {} });
  assert(brfAck.res.ok && brfAck.data.ok !== false, 'brief ack');

  const wthSweep = await req('/api/weather/sweep', { method: 'POST', token, body: { force: true } });
  assert(wthSweep.res.ok && wthSweep.data.ok !== false, 'weather sweep');
  const wthOps = await req('/api/weather/ops/refresh', { method: 'POST', token, body: {} });
  assert(wthOps.res.ok && wthOps.data.ok !== false, 'weather ops refresh');
  const wthHold = await req('/api/weather/advisory/hold', { method: 'POST', token, body: { hold: true } });
  assert(wthHold.res.ok && wthHold.data.ok !== false, 'weather advisory hold');
  const wthExt = await req('/api/weather/extreme/ack', { method: 'POST', token, body: { tip: 'e2e tip' } });
  assert(wthExt.res.ok && wthExt.data.ok !== false, 'weather extreme');
  const wthAck = await req('/api/weather/flag/ack', { method: 'POST', token, body: {} });
  assert(wthAck.res.ok && wthAck.data.ok !== false, 'weather ack');
  const wthRef = await req('/api/weather/refresh', { method: 'POST', token });
  assert(wthRef.res.ok && wthRef.data.label, 'weather refresh legacy');

  const mntSweep = await req('/api/maintenance/sweep', { method: 'POST', token, body: { force: true } });
  assert(mntSweep.res.ok && mntSweep.data.ok !== false, 'maintenance sweep');
  const mntCrit = await req('/api/maintenance/critical/close', { method: 'POST', token, body: {} });
  assert(mntCrit.res.ok && mntCrit.data.ok !== false, 'maintenance critical');
  const mntEsc = await req('/api/maintenance/overdue/escalate', { method: 'POST', token, body: {} });
  assert(mntEsc.res.ok && mntEsc.data.ok !== false, 'maintenance escalate');
  const mntPrev = await req('/api/maintenance/preventive/create', { method: 'POST', token, body: {} });
  assert(mntPrev.res.ok && mntPrev.data.ok !== false, 'maintenance preventive');
  const mntAck = await req('/api/maintenance/flag/ack', { method: 'POST', token, body: {} });
  assert(mntAck.res.ok && mntAck.data.ok !== false, 'maintenance ack');

  const invSweep = await req('/api/inventory/sweep', { method: 'POST', token, body: { force: true } });
  assert(invSweep.res.ok && invSweep.data.ok !== false, 'inventory sweep');
  const invRestock = await req('/api/inventory/lows/restock', { method: 'POST', token, body: {} });
  assert(invRestock.res.ok && invRestock.data.ok !== false, 'inventory restock');
  const invQuar = await req('/api/inventory/sku/quarantine', { method: 'POST', token, body: {} });
  assert(invQuar.res.ok && invQuar.data.ok !== false, 'inventory quarantine');
  const invRecv = await req('/api/inventory/delivery/receive', { method: 'POST', token, body: {} });
  assert(invRecv.res.ok && invRecv.data.ok !== false, 'inventory receive');
  const invAck = await req('/api/inventory/flag/ack', { method: 'POST', token, body: {} });
  assert(invAck.res.ok && invAck.data.ok !== false, 'inventory ack');

  const sup156Sweep = await req('/api/suppliers/sweep', { method: 'POST', token, body: { force: true } });
  assert(sup156Sweep.res.ok && sup156Sweep.data.ok !== false, 'suppliers sweep');
  const sup156Seed = await req('/api/suppliers/po/seed', { method: 'POST', token, body: { overdue: true } });
  assert(sup156Seed.res.ok && sup156Seed.data.ok !== false, 'suppliers po seed');
  const sup156Flag = await req('/api/suppliers/po/overdue/flag', { method: 'POST', token, body: {} });
  assert(sup156Flag.res.ok && sup156Flag.data.ok !== false, 'suppliers overdue flag');
  const sup156Ack = await req('/api/suppliers/flag/ack', { method: 'POST', token, body: {} });
  assert(sup156Ack.res.ok && sup156Ack.data.ok !== false, 'suppliers ack');

  const rcp156Sweep = await req('/api/recipes/sweep', { method: 'POST', token, body: { force: true } });
  assert(rcp156Sweep.res.ok && rcp156Sweep.data.ok !== false, 'recipes sweep');
  const rcp156Cost = await req('/api/recipes/cost/refresh', { method: 'POST', token, body: {} });
  assert(rcp156Cost.res.ok && rcp156Cost.data.ok !== false, 'recipes cost refresh');
  const rcp156Stock = await req('/api/recipes/stock/flag', { method: 'POST', token, body: {} });
  assert(rcp156Stock.res.ok && rcp156Stock.data.ok !== false, 'recipes stock flag');
  const rcp156Ack = await req('/api/recipes/flag/ack', { method: 'POST', token, body: {} });
  assert(rcp156Ack.res.ok && rcp156Ack.data.ok !== false, 'recipes ack');

  const cmp156Sweep = await req('/api/campaigns/sweep', { method: 'POST', token, body: { force: true } });
  assert(cmp156Sweep.res.ok && cmp156Sweep.data.ok !== false, 'campaigns sweep');
  const cmp156Soon = await req('/api/campaigns/ending-soon/seed', { method: 'POST', token, body: {} });
  assert(cmp156Soon.res.ok && cmp156Soon.data.ok !== false, 'campaigns ending soon');
  const cmp156Expire = await req('/api/campaigns/expire', { method: 'POST', token, body: {} });
  assert(cmp156Expire.res.ok && cmp156Expire.data.ok !== false, 'campaigns expire');
  const cmp156Ack = await req('/api/campaigns/flag/ack', { method: 'POST', token, body: {} });
  assert(cmp156Ack.res.ok && cmp156Ack.data.ok !== false, 'campaigns ack');

  const cpl156Sweep = await req('/api/complaints/sweep', { method: 'POST', token, body: { force: true } });
  assert(cpl156Sweep.res.ok && cpl156Sweep.data.ok !== false, 'complaints sweep');
  const cpl156Seed = await req('/api/complaints/aging/seed', { method: 'POST', token, body: {} });
  assert(cpl156Seed.res.ok && cpl156Seed.data.ok !== false, 'complaints aging seed');
  const cpl156Esc = await req('/api/complaints/escalate', { method: 'POST', token, body: {} });
  assert(cpl156Esc.res.ok && cpl156Esc.data.ok !== false, 'complaints escalate');
  const cpl156Ack = await req('/api/complaints/flag/ack', { method: 'POST', token, body: {} });
  assert(cpl156Ack.res.ok && cpl156Ack.data.ok !== false, 'complaints ack');

  const incdSweep = await req('/api/incidents/sweep', { method: 'POST', token, body: { force: true } });
  assert(incdSweep.res.ok && incdSweep.data.ok !== false, 'incidents sweep');
  const incdCrit = await req('/api/incidents/critical/ack', { method: 'POST', token, body: {} });
  assert(incdCrit.res.ok && incdCrit.data.ok !== false, 'incidents critical ack');
  const incdRes = await req('/api/incidents/open/resolve', { method: 'POST', token, body: {} });
  assert(incdRes.res.ok && incdRes.data.ok !== false, 'incidents resolve');
  const incdEsc = await req('/api/incidents/severity/escalate', { method: 'POST', token, body: {} });
  assert(incdEsc.res.ok && incdEsc.data.ok !== false, 'incidents escalate');
  const incdAck = await req('/api/incidents/flag/ack', { method: 'POST', token, body: {} });
  assert(incdAck.res.ok && incdAck.data.ok !== false, 'incidents ack');

  const rsvSweep = await req('/api/reservations/sweep', { method: 'POST', token, body: { force: true } });
  assert(rsvSweep.res.ok && rsvSweep.data.ok !== false, 'reservations sweep');
  const rsvConf = await req('/api/reservations/pending/confirm', { method: 'POST', token, body: {} });
  assert(rsvConf.res.ok && rsvConf.data.ok !== false, 'reservations confirm');
  const rsvNo = await req('/api/reservations/noshow/cancel', { method: 'POST', token, body: {} });
  assert(rsvNo.res.ok && rsvNo.data.ok !== false, 'reservations noshow');
  const rsvSeat = await req('/api/reservations/seat/assign', { method: 'POST', token, body: {} });
  assert(rsvSeat.res.ok && rsvSeat.data.ok !== false, 'reservations seat');
  const rsvAck = await req('/api/reservations/flag/ack', { method: 'POST', token, body: {} });
  assert(rsvAck.res.ok && rsvAck.data.ok !== false, 'reservations ack');

  const shfSweep = await req('/api/shifts/sweep', { method: 'POST', token, body: { force: true } });
  assert(shfSweep.res.ok && shfSweep.data.ok !== false, 'shifts sweep');
  const shfGap = await req('/api/shifts/gap/cover', { method: 'POST', token, body: {} });
  assert(shfGap.res.ok && shfGap.data.ok !== false, 'shifts cover');
  const shfClose = await req('/api/shifts/close', { method: 'POST', token, body: {} });
  assert(shfClose.res.ok && shfClose.data.ok !== false, 'shifts close');
  const shfAssign = await req('/api/shifts/staff/assign', { method: 'POST', token, body: {} });
  assert(shfAssign.res.ok && shfAssign.data.ok !== false, 'shifts assign');
  const shfAck = await req('/api/shifts/flag/ack', { method: 'POST', token, body: {} });
  assert(shfAck.res.ok && shfAck.data.ok !== false, 'shifts ack');

  const chkSweep = await req('/api/checklists/sweep', { method: 'POST', token, body: { force: true } });
  assert(chkSweep.res.ok && chkSweep.data.ok !== false, 'checklists sweep');
  const chkStart = await req('/api/checklists/run/start', { method: 'POST', token, body: {} });
  assert(chkStart.res.ok && chkStart.data.ok !== false, 'checklists start');
  const chkComp = await req('/api/checklists/run/complete', { method: 'POST', token, body: {} });
  assert(chkComp.res.ok && chkComp.data.ok !== false, 'checklists complete');
  const chkFail = await req('/api/checklists/item/fail', { method: 'POST', token, body: {} });
  assert(chkFail.res.ok && chkFail.data.ok !== false, 'checklists fail');
  const chkAck = await req('/api/checklists/flag/ack', { method: 'POST', token, body: {} });
  assert(chkAck.res.ok && chkAck.data.ok !== false, 'checklists ack');

  const alrSweep = await req('/api/alertrules/sweep', { method: 'POST', token, body: { force: true } });
  assert(alrSweep.res.ok && alrSweep.data.ok !== false, 'alertrules sweep');
  const alrEn = await req('/api/alertrules/enable', { method: 'POST', token, body: {} });
  assert(alrEn.res.ok && alrEn.data.ok !== false, 'alertrules enable');
  const alrDis = await req('/api/alertrules/disable', { method: 'POST', token, body: {} });
  assert(alrDis.res.ok && alrDis.data.ok !== false, 'alertrules disable');
  const alrFire = await req('/api/alertrules/fire', { method: 'POST', token, body: {} });
  assert(alrFire.res.ok && alrFire.data.ok !== false, 'alertrules fire');
  const alrAck = await req('/api/alertrules/flag/ack', { method: 'POST', token, body: {} });
  assert(alrAck.res.ok && alrAck.data.ok !== false, 'alertrules ack');

  const crudReg = await req('/api/crudops', { token });
  assert(crudReg.res.ok && (crudReg.data.total || 0) >= 500, 'crudops registry');
  for (const domain of ['carbonlog', 'fxrates', 'handbook', 'yieldrule', 'accessreview']) {
    const ops = await req(`/api/${domain}/ops`, { token });
    assert(ops.res.ok && ops.data.domain === domain, `crudops ops ${domain}`);
    const sw = await req(`/api/${domain}/sweep`, { method: 'POST', token, body: { force: true } });
    assert(sw.res.ok && sw.data.ok !== false, `crudops sweep ${domain}`);
    const adv = await req(`/api/${domain}/advance`, { method: 'POST', token, body: {} });
    assert(adv.res.ok && adv.data.ok !== false, `crudops advance ${domain}`);
    const heal = await req(`/api/${domain}/heal`, { method: 'POST', token, body: {} });
    assert(heal.res.ok && heal.data.ok !== false, `crudops heal ${domain}`);
    const seed = await req(`/api/${domain}/seed`, { method: 'POST', token, body: {} });
    assert(seed.res.ok && seed.data.ok !== false, `crudops seed ${domain}`);
    const ack = await req(`/api/${domain}/flag/ack`, { method: 'POST', token, body: {} });
    assert(ack.res.ok && ack.data.ok !== false, `crudops ack ${domain}`);
  }

  const digSweep = await req('/api/digest/sweep', { method: 'POST', token, body: { force: true } });
  assert(digSweep.res.ok && digSweep.data.ok !== false, 'digest sweep');
  const digReady = await req('/api/digest/readiness/refresh', { method: 'POST', token, body: {} });
  assert(digReady.res.ok && digReady.data.ok !== false, 'digest readiness');
  const digEsc = await req('/api/digest/gap/escalate', { method: 'POST', token, body: {} });
  assert(digEsc.res.ok && digEsc.data.ok !== false, 'digest escalate');
  const digRes = await req('/api/digest/gap/resolve', { method: 'POST', token, body: {} });
  assert(digRes.res.ok && digRes.data.ok !== false, 'digest resolve');
  const digAck = await req('/api/digest/flag/ack', { method: 'POST', token, body: {} });
  assert(digAck.res.ok && digAck.data.ok !== false, 'digest ack');

  const rptSweep = await req('/api/report/sweep', { method: 'POST', token, body: { force: true } });
  assert(rptSweep.res.ok && rptSweep.data.ok !== false, 'report sweep');
  const rptJobs = await req('/api/report/jobs/cancel', { method: 'POST', token, body: {} });
  assert(rptJobs.res.ok && rptJobs.data.ok !== false, 'report jobs');
  const rptEthos = await req('/api/report/ethos/ack', { method: 'POST', token, body: {} });
  assert(rptEthos.res.ok && rptEthos.data.ok !== false, 'report ethos');
  const rptSnap = await req('/api/report/audit/snapshot', { method: 'POST', token, body: {} });
  assert(rptSnap.res.ok && rptSnap.data.ok !== false, 'report snapshot');
  const rptAck = await req('/api/report/flag/ack', { method: 'POST', token, body: {} });
  assert(rptAck.res.ok && rptAck.data.ok !== false, 'report ack');

  const metSweep = await req('/api/metrics/sweep', { method: 'POST', token, body: { force: true } });
  assert(metSweep.res.ok && metSweep.data.ok !== false, 'metrics sweep');
  const metSnap = await req('/api/metrics/snapshot', { method: 'POST', token, body: {} });
  assert(metSnap.res.ok && metSnap.data.ok !== false, 'metrics snapshot');
  const metPurge = await req('/api/metrics/jobs/purge', { method: 'POST', token, body: {} });
  assert(metPurge.res.ok && metPurge.data.ok !== false, 'metrics jobs purge');
  const metEthos = await req('/api/metrics/ethos/ack', { method: 'POST', token, body: {} });
  assert(metEthos.res.ok && metEthos.data.ok !== false, 'metrics ethos');
  const metAck = await req('/api/metrics/flag/ack', { method: 'POST', token, body: {} });
  assert(metAck.res.ok && metAck.data.ok !== false, 'metrics ack');

  const kdSweep = await req('/api/kudos/sweep', { method: 'POST', token, body: { force: true } });
  assert(kdSweep.res.ok && kdSweep.data.ok !== false, 'kudos sweep');
  const kdBurst = await req('/api/kudos/burst', { method: 'POST', token, body: {} });
  assert(kdBurst.res.ok && kdBurst.data.ok !== false, 'kudos burst');
  const kdTag = await req('/api/kudos/tags/refresh', { method: 'POST', token, body: {} });
  assert(kdTag.res.ok && kdTag.data.ok !== false, 'kudos tags');
  const kdDaily = await req('/api/kudos/daily/seed', { method: 'POST', token, body: { force: true } });
  assert(kdDaily.res.ok && kdDaily.data.ok !== false, 'kudos daily');
  const kdAck = await req('/api/kudos/flag/ack', { method: 'POST', token, body: {} });
  assert(kdAck.res.ok && kdAck.data.ok !== false, 'kudos ack');

  const tipSweep = await req('/api/tips/sweep', { method: 'POST', token, body: { force: true } });
  assert(tipSweep.res.ok && tipSweep.data.ok !== false, 'tips sweep');
  const tipIn = await req('/api/tips/in', { method: 'POST', token, body: {} });
  assert(tipIn.res.ok && tipIn.data.ok !== false, 'tips in');
  const tipOut = await req('/api/tips/out', { method: 'POST', token, body: {} });
  assert(tipOut.res.ok && tipOut.data.ok !== false, 'tips out');
  const tipSnap = await req('/api/tips/balance/snapshot', { method: 'POST', token, body: {} });
  assert(tipSnap.res.ok && tipSnap.data.ok !== false, 'tips snapshot');
  const tipAck = await req('/api/tips/flag/ack', { method: 'POST', token, body: {} });
  assert(tipAck.res.ok && tipAck.data.ok !== false, 'tips ack');

  const fbSweep = await req('/api/feedback/sweep', { method: 'POST', token, body: { force: true } });
  assert(fbSweep.res.ok && fbSweep.data.ok !== false, 'feedback sweep');
  const fbSeed = await req('/api/feedback/nps/seed', { method: 'POST', token, body: {} });
  assert(fbSeed.res.ok && fbSeed.data.ok !== false, 'feedback nps');
  const fbLow = await req('/api/feedback/low/flag', { method: 'POST', token, body: {} });
  assert(fbLow.res.ok && fbLow.data.ok !== false, 'feedback low');
  const fbAck = await req('/api/feedback/flag/ack', { method: 'POST', token, body: {} });
  assert(fbAck.res.ok && fbAck.data.ok !== false, 'feedback ack');
  const fbArch = await req('/api/feedback/flags/archive', { method: 'POST', token, body: {} });
  assert(fbArch.res.ok && fbArch.data.ok !== false, 'feedback archive');

  const hrsSweep = await req('/api/hours/sweep', { method: 'POST', token, body: { force: true } });
  assert(hrsSweep.res.ok && hrsSweep.data.ok !== false, 'hours sweep');
  const hrsOpen = await req('/api/hours/open', { method: 'POST', token, body: {} });
  assert(hrsOpen.res.ok && hrsOpen.data.ok !== false, 'hours open');
  const hrsClose = await req('/api/hours/close', { method: 'POST', token, body: {} });
  assert(hrsClose.res.ok && hrsClose.data.ok !== false, 'hours close');
  const hrsHol = await req('/api/hours/holiday', { method: 'POST', token, body: {} });
  assert(hrsHol.res.ok && hrsHol.data.ok !== false, 'hours holiday');
  const hrsAck = await req('/api/hours/flag/ack', { method: 'POST', token, body: {} });
  assert(hrsAck.res.ok && hrsAck.data.ok !== false, 'hours ack');

  const cnsSweep = await req('/api/consents/sweep', { method: 'POST', token, body: { force: true } });
  assert(cnsSweep.res.ok && cnsSweep.data.ok !== false, 'consent sweep');
  const cnsRec = await req('/api/consents/record', { method: 'POST', token, body: {} });
  assert(cnsRec.res.ok && cnsRec.data.ok !== false, 'consent record');
  const cnsRev = await req('/api/consents/revoke', { method: 'POST', token, body: {} });
  assert(cnsRev.res.ok && cnsRev.data.ok !== false, 'consent revoke');
  const cnsMiss = await req('/api/consents/missing/seed', { method: 'POST', token, body: {} });
  assert(cnsMiss.res.ok && cnsMiss.data.ok !== false, 'consent missing');
  const cnsAck = await req('/api/consents/flag/ack', { method: 'POST', token, body: {} });
  assert(cnsAck.res.ok && cnsAck.data.ok !== false, 'consent ack');

  const gstSweep = await req('/api/guests/sweep', { method: 'POST', token, body: { force: true } });
  assert(gstSweep.res.ok && gstSweep.data.ok !== false, 'guests sweep');
  const gstUps = await req('/api/guests/upsert', { method: 'POST', token, body: {} });
  assert(gstUps.res.ok && gstUps.data.ok !== false, 'guests upsert');
  const gstSync = await req('/api/guests/sync/ops', { method: 'POST', token, body: {} });
  assert(gstSync.res.ok && gstSync.data.ok !== false, 'guests sync ops');
  const gstAck = await req('/api/guests/flag/ack', { method: 'POST', token, body: {} });
  assert(gstAck.res.ok && gstAck.data.ok !== false, 'guests ack');

  const loySweep = await req('/api/loyalty/sweep', { method: 'POST', token, body: { force: true } });
  assert(loySweep.res.ok && loySweep.data.ok !== false, 'loyalty sweep');
  const loyAward = await req('/api/loyalty/award', { method: 'POST', token, body: {} });
  assert(loyAward.res.ok && loyAward.data.ok !== false, 'loyalty award');
  const loyRedeem = await req('/api/loyalty/redeem', { method: 'POST', token, body: {} });
  assert(loyRedeem.res.ok && loyRedeem.data.ok !== false, 'loyalty redeem');
  const loyAck = await req('/api/loyalty/flag/ack', { method: 'POST', token, body: {} });
  assert(loyAck.res.ok && loyAck.data.ok !== false, 'loyalty ack');

  const expSweep = await req('/api/exports/sweep', { method: 'POST', token, body: { force: true } });
  assert(expSweep.res.ok && expSweep.data.ok !== false, 'exports sweep');
  const expSnap = await req('/api/exports/snapshot', { method: 'POST', token, body: {} });
  assert(expSnap.res.ok && expSnap.data.ok !== false, 'exports snapshot');
  const expAll = await req('/api/exports/catalog/export', { method: 'POST', token, body: { sample: true } });
  assert(expAll.res.ok && expAll.data.ok !== false, 'exports catalog');
  const expClear = await req('/api/exports/runs/clear', { method: 'POST', token, body: {} });
  assert(expClear.res.ok && expClear.data.ok !== false, 'exports clear');
  const expAck = await req('/api/exports/flag/ack', { method: 'POST', token, body: {} });
  assert(expAck.res.ok && expAck.data.ok !== false, 'exports ack');

  const trn157Sweep = await req('/api/training/sweep', { method: 'POST', token, body: { force: true } });
  assert(trn157Sweep.res.ok && trn157Sweep.data.ok !== false, 'training sweep');
  const trn157Low = await req('/api/training/attempt/low-score/seed', {
    method: 'POST',
    token,
    body: { person: 'E2E-157' },
  });
  assert(trn157Low.res.ok && trn157Low.data.ok !== false, 'training low score seed');

  const menu157Sweep = await req('/api/menu/sweep', { method: 'POST', token, body: { force: true } });
  assert(menu157Sweep.res.ok && menu157Sweep.data.ok !== false, 'menu sweep');
  const menu157Feature = await req('/api/menu/feature', { method: 'POST', token, body: {} });
  assert(menu157Feature.res.ok && menu157Feature.data.ok !== false, 'menu feature');

  const seat157Sweep = await req('/api/seating/sweep', { method: 'POST', token, body: { force: true } });
  assert(seat157Sweep.res.ok && seat157Sweep.data.ok !== false, 'seating sweep');
  const seat157Walk = await req('/api/seating/walk-in', {
    method: 'POST',
    token,
    body: { partyName: 'E2E-157', hours: 4 },
  });
  assert(seat157Walk.res.ok && seat157Walk.data.ok !== false, 'seating walk-in');

  const ann157Sweep = await req('/api/announcements/sweep', { method: 'POST', token, body: { force: true } });
  assert(ann157Sweep.res.ok && ann157Sweep.data.ok !== false, 'announcements sweep');
  const ann157Seed = await req('/api/announcements/ending-soon/seed', {
    method: 'POST',
    token,
    body: { title: 'E2E-157 ending soon' },
  });
  assert(ann157Seed.res.ok && ann157Seed.data.ok !== false, 'announcements ending soon seed');

  const lost158Sweep = await req('/api/lost-found/sweep', { method: 'POST', token, body: { force: true } });
  assert(lost158Sweep.res.ok && lost158Sweep.data.ok !== false, 'lostfound sweep');
  const lost158Seed = await req('/api/lost-found/aging/seed', {
    method: 'POST',
    token,
    body: { item: 'E2E-158 lost item', missingLocation: true },
  });
  assert(lost158Seed.res.ok && lost158Seed.data.ok !== false, 'lostfound aging seed');

  const wait158Sweep = await req('/api/waitlist/sweep', { method: 'POST', token, body: { force: true } });
  assert(wait158Sweep.res.ok && wait158Sweep.data.ok !== false, 'waitlist sweep');
  const wait158Seat = await req('/api/waitlist/seat', {
    method: 'POST',
    token,
    body: { tableId: 'tbl_e2e_158', tableLabel: 'E2E-158' },
  });
  assert(wait158Seat.res.ok && wait158Seat.data.ok !== false, 'waitlist seat');

  const asset158Sweep = await req('/api/assets/sweep', { method: 'POST', token, body: { force: true } });
  assert(asset158Sweep.res.ok && asset158Sweep.data.ok !== false, 'assets sweep');
  const asset158Maint = await req('/api/assets/maintenance/schedule', {
    method: 'POST',
    token,
    body: { assignee: 'E2E-158' },
  });
  assert(asset158Maint.res.ok && asset158Maint.data.ok !== false, 'assets maintenance schedule');

  const valet158Sweep = await req('/api/valet/sweep', { method: 'POST', token, body: { force: true } });
  assert(valet158Sweep.res.ok && valet158Sweep.data.ok !== false, 'valet sweep');
  const valet158Pickup = await req('/api/valet/pickup/request', {
    method: 'POST',
    token,
    body: { pickupBay: 'e2e-158', minutes: 20 },
  });
  assert(valet158Pickup.res.ok && valet158Pickup.data.ok !== false, 'valet pickup request');

  const stay159Sweep = await req('/api/stayring/sweep', { method: 'POST', token, body: { force: true } });
  assert(stay159Sweep.res.ok && stay159Sweep.data.ok !== false, 'stayring sweep');
  const stay159Audit = await req('/api/stayring/night-audit', { method: 'POST', token, body: {} });
  assert(stay159Audit.res.ok && stay159Audit.data.ok !== false, 'stayring night audit mutator');

  const culture159Sweep = await req('/api/culturescene/sweep', { method: 'POST', token, body: { force: true } });
  assert(culture159Sweep.res.ok && culture159Sweep.data.ok !== false, 'culturescene sweep');
  const culture159Hold = await req('/api/culture/hold', {
    method: 'POST',
    token,
    body: { event_id: 'ce_1', qty: 1, guest: 'e2e-159' },
  });
  assert(culture159Hold.res.ok && culture159Hold.data.ok !== false, 'culturescene hold mutator');

  const agentfleet159Sweep = await req('/api/agentfleet/sweep', { method: 'POST', token, body: { force: true } });
  assert(agentfleet159Sweep.res.ok && agentfleet159Sweep.data.ok !== false, 'agentfleet sweep');
  const agentfleet159Ping = await req('/api/agentfleet/ping', {
    method: 'POST',
    token,
    body: { agent: 'ETHOS', note: 'e2e-159' },
  });
  assert(agentfleet159Ping.res.ok && agentfleet159Ping.data.ok !== false, 'agentfleet ping mutator');

  const notifications159Sweep = await req('/api/notifications/sweep', { method: 'POST', token, body: { force: true } });
  assert(notifications159Sweep.res.ok && notifications159Sweep.data.ok !== false, 'notifications sweep');
  const notifications159Seed = await req('/api/notifications/push-seed', {
    method: 'POST',
    token,
    body: { detail: 'E2E-159 notification seed', level: 'warn' },
  });
  assert(notifications159Seed.res.ok && notifications159Seed.data.ok !== false, 'notifications push seed mutator');

  const cash160Sweep = await req('/api/cash/sweep', { method: 'POST', token, body: { force: true } });
  assert(cash160Sweep.res.ok && cash160Sweep.data.ok !== false, 'cash sweep');
  const cash160Entry = await req('/api/cash/entry', {
    method: 'POST',
    token,
    body: { amount: 250, kind: 'in', note: 'e2e-160' },
  });
  assert(cash160Entry.res.ok && cash160Entry.data.ok !== false, 'cash entry mutator');
  const cash160Seed = await req('/api/cash/daily-close/seed', {
    method: 'POST',
    token,
    body: { varianceTry: 125 },
  });
  assert(cash160Seed.res.ok && cash160Seed.data.ok !== false, 'cash daily close seed');

  const cold160Sweep = await req('/api/coldchain/sweep', { method: 'POST', token, body: { force: true } });
  assert(cold160Sweep.res.ok && cold160Sweep.data.ok !== false, 'coldchain sweep');
  const cold160Breach = await req('/api/coldchain/breach/flag', {
    method: 'POST',
    token,
    body: { note: 'e2e-160 breach' },
  });
  assert(cold160Breach.res.ok && cold160Breach.data.ok !== false, 'coldchain breach flag');
  const cold160Probe = await req('/api/coldchain/probe/seed', {
    method: 'POST',
    token,
    body: { name: 'E2E-160 probe' },
  });
  assert(cold160Probe.res.ok && cold160Probe.data.ok !== false, 'coldchain probe seed');

  const energy160Sweep = await req('/api/energy/sweep', { method: 'POST', token, body: { force: true } });
  assert(energy160Sweep.res.ok && energy160Sweep.data.ok !== false, 'energy sweep');
  const energy160Spike = await req('/api/energy/spike/flag', {
    method: 'POST',
    token,
    body: { note: 'e2e-160 spike' },
  });
  assert(energy160Spike.res.ok && energy160Spike.data.ok !== false, 'energy spike flag');
  const energy160Meter = await req('/api/energy/meter/seed', {
    method: 'POST',
    token,
    body: { name: 'E2E-160 meter' },
  });
  assert(energy160Meter.res.ok && energy160Meter.data.ok !== false, 'energy meter seed');

  const waste160Sweep = await req('/api/waste/sweep', { method: 'POST', token, body: { force: true } });
  assert(waste160Sweep.res.ok && waste160Sweep.data.ok !== false, 'waste sweep');
  const waste160Overage = await req('/api/waste/overage/flag', {
    method: 'POST',
    token,
    body: { item: 'E2E-160 waste', qty: 12, costTry: 750 },
  });
  assert(waste160Overage.res.ok && waste160Overage.data.ok !== false, 'waste overage flag');
  const waste160Category = await req('/api/waste/category/seed', {
    method: 'POST',
    token,
    body: { name: 'E2E-160 category' },
  });
  assert(waste160Category.res.ok && waste160Category.data.ok !== false, 'waste category seed');

  const webhook161Seed = await req('/api/webhooks/seed', {
    method: 'POST',
    token,
    body: { url: `https://example.com/e2e-161-${Date.now()}` },
  });
  assert(webhook161Seed.res.ok && webhook161Seed.data.ok !== false, 'webhooks seed');
  const webhook161Probe = await req('/api/webhooks/delivery/probe', {
    method: 'POST',
    token,
    body: { status: 202 },
  });
  assert(webhook161Probe.res.ok && webhook161Probe.data.ok !== false, 'webhooks probe');
  const webhook161Sweep = await req('/api/webhooks/sweep', { method: 'POST', token, body: { force: true } });
  assert(webhook161Sweep.res.ok && webhook161Sweep.data.ok !== false, 'webhooks sweep');
  const webhook161Ack = await req('/api/webhooks/flag/ack', { method: 'POST', token, body: {} });
  assert(webhook161Ack.res.ok && webhook161Ack.data.ok !== false, 'webhooks flag ack');

  const docs161Seed = await req('/api/documents/policy/seed', {
    method: 'POST',
    token,
    body: { title: 'E2E-161 policy' },
  });
  assert(docs161Seed.res.ok && docs161Seed.data.ok !== false, 'documents policy seed');
  const docs161Revise = await req('/api/documents/revise', {
    method: 'POST',
    token,
    body: { id: docs161Seed.data.document?.id, version: '1.0.e2e' },
  });
  assert(docs161Revise.res.ok && docs161Revise.data.ok !== false, 'documents revise');
  const docs161Flag = await req('/api/documents/review/flag', {
    method: 'POST',
    token,
    body: { id: docs161Seed.data.document?.id },
  });
  assert(docs161Flag.res.ok && docs161Flag.data.ok !== false, 'documents review flag');
  const docs161Sweep = await req('/api/documents/sweep', { method: 'POST', token, body: { force: true } });
  assert(docs161Sweep.res.ok && docs161Sweep.data.ok !== false, 'documents sweep');
  const docs161Ack = await req('/api/documents/flag/ack', { method: 'POST', token, body: {} });
  assert(docs161Ack.res.ok && docs161Ack.data.ok !== false, 'documents flag ack');

  const vendor161Seed = await req('/api/vendorscore/seed', {
    method: 'POST',
    token,
    body: { supplierName: 'E2E-161 vendor' },
  });
  assert(vendor161Seed.res.ok && vendor161Seed.data.ok !== false, 'vendorscore seed');
  const vendor161Review = await req('/api/vendorscore/review', {
    method: 'POST',
    token,
    body: { id: vendor161Seed.data.score?.id, note: 'e2e review' },
  });
  assert(vendor161Review.res.ok && vendor161Review.data.ok !== false, 'vendorscore review');
  const vendor161Under = await req('/api/vendorscore/underperform', {
    method: 'POST',
    token,
    body: { supplierId: vendor161Seed.data.score?.supplierId },
  });
  assert(vendor161Under.res.ok && vendor161Under.data.ok !== false, 'vendorscore underperform');
  const vendor161Sweep = await req('/api/vendorscore/sweep', { method: 'POST', token, body: { force: true } });
  assert(vendor161Sweep.res.ok && vendor161Sweep.data.ok !== false, 'vendorscore sweep');
  const vendor161Ack = await req('/api/vendorscore/flag/ack', { method: 'POST', token, body: {} });
  assert(vendor161Ack.res.ok && vendor161Ack.data.ok !== false, 'vendorscore flag ack');

  const brief161Seed = await req('/api/campusbrief/actions/seed', {
    method: 'POST',
    token,
    body: { text: 'E2E-161 brif aksiyon', at: new Date(Date.now() - 36 * 60 * 60_000).toISOString() },
  });
  assert(brief161Seed.res.ok && brief161Seed.data.ok !== false, 'campusbrief action seed');
  const brief161Age = await req('/api/campusbrief/actions/age', { method: 'POST', token, body: { force: true } });
  assert(brief161Age.res.ok && brief161Age.data.ok !== false, 'campusbrief action age');
  const brief161Health = await req('/api/campusbrief/health/flag', { method: 'POST', token, body: {} });
  assert(brief161Health.res.ok && brief161Health.data.ok !== false, 'campusbrief health flag');
  const brief161Sweep = await req('/api/campusbrief/sweep', { method: 'POST', token, body: { force: true } });
  assert(brief161Sweep.res.ok && brief161Sweep.data.ok !== false, 'campusbrief sweep');
  const brief161Ack = await req('/api/campusbrief/flag/ack', { method: 'POST', token, body: {} });
  assert(brief161Ack.res.ok && brief161Ack.data.ok !== false, 'campusbrief flag ack');

  const contracts162Sweep = await req('/api/contracts/sweep', { method: 'POST', token, body: { force: true } });
  assert(contracts162Sweep.res.ok && contracts162Sweep.data.ok !== false, 'contracts sweep');
  const contracts162Seed = await req('/api/contracts/renewal/seed', {
    method: 'POST',
    token,
    body: { title: 'E2E-162 renewal', vendor: 'E2E-162 vendor' },
  });
  assert(contracts162Seed.res.ok && contracts162Seed.data.ok !== false, 'contracts renewal seed');
  const contracts162Renew = await req('/api/contracts/renew', {
    method: 'POST',
    token,
    body: { id: contracts162Seed.data.contract?.id, months: 6 },
  });
  assert(contracts162Renew.res.ok && contracts162Renew.data.ok !== false, 'contracts renew mutator');

  const delivery162Sweep = await req('/api/delivery/sweep', { method: 'POST', token, body: { force: true } });
  assert(delivery162Sweep.res.ok && delivery162Sweep.data.ok !== false, 'delivery sweep');
  const delivery162Seed = await req('/api/delivery/pending/seed', {
    method: 'POST',
    token,
    body: { guestName: 'E2E-162 delivery', items: 'Test paket' },
  });
  assert(delivery162Seed.res.ok && delivery162Seed.data.ok !== false, 'delivery pending seed');
  const delivery162Delivered = await req('/api/delivery/delivered', {
    method: 'POST',
    token,
    body: { id: delivery162Seed.data.order?.id, courier: 'e2e-162' },
  });
  assert(delivery162Delivered.res.ok && delivery162Delivered.data.ok !== false, 'delivery delivered mutator');

  const giftcards162Sweep = await req('/api/giftcards/sweep', { method: 'POST', token, body: { force: true } });
  assert(giftcards162Sweep.res.ok && giftcards162Sweep.data.ok !== false, 'giftcards sweep');
  const giftcards162Seed = await req('/api/giftcards/promo/seed', {
    method: 'POST',
    token,
    body: { holder: 'E2E-162 promo', balance: 125 },
  });
  assert(giftcards162Seed.res.ok && giftcards162Seed.data.ok !== false, 'giftcards promo seed');
  const giftcards162Redeem = await req('/api/giftcards/redeem', {
    method: 'POST',
    token,
    body: { id: giftcards162Seed.data.card?.id, amount: 25 },
  });
  assert(giftcards162Redeem.res.ok && giftcards162Redeem.data.ok !== false, 'giftcards redeem mutator');

  const laundry162Sweep = await req('/api/laundry/sweep', { method: 'POST', token, body: { force: true } });
  assert(laundry162Sweep.res.ok && laundry162Sweep.data.ok !== false, 'laundry sweep');
  const laundry162Seed = await req('/api/laundry/rush/seed', {
    method: 'POST',
    token,
    body: { item: 'E2E-162 rush laundry', qty: 4 },
  });
  assert(laundry162Seed.res.ok && laundry162Seed.data.ok !== false, 'laundry rush seed');
  const laundry162Ready = await req('/api/laundry/ready', {
    method: 'POST',
    token,
    body: { id: laundry162Seed.data.batch?.id, rack: 'e2e-162' },
  });
  assert(laundry162Ready.res.ok && laundry162Ready.data.ok !== false, 'laundry ready mutator');

  const cleaning163Sweep = await req('/api/cleaning/sweep', { method: 'POST', token, body: { force: true } });
  assert(cleaning163Sweep.res.ok && cleaning163Sweep.data.ok !== false, 'cleaning sweep');
  const cleaning163Seed = await req('/api/cleaning/inspection/seed', {
    method: 'POST',
    token,
    body: { room: 'E2E-163-CLEAN', area: 'E2E suite' },
  });
  assert(cleaning163Seed.res.ok && cleaning163Seed.data.ok !== false, 'cleaning inspection seed');
  const cleaning163Clean = await req('/api/cleaning/clean', {
    method: 'POST',
    token,
    body: { id: cleaning163Seed.data.task?.id },
  });
  assert(cleaning163Clean.res.ok && cleaning163Clean.data.ok !== false, 'cleaning mark clean');

  const emergency163Sweep = await req('/api/emergency/sweep', { method: 'POST', token, body: { force: true } });
  assert(emergency163Sweep.res.ok && emergency163Sweep.data.ok !== false, 'emergency sweep');
  const emergency163Seed = await req('/api/emergency/drill/seed', {
    method: 'POST',
    token,
    body: { title: 'E2E-163 drill' },
  });
  assert(emergency163Seed.res.ok && emergency163Seed.data.ok !== false, 'emergency drill seed');
  const emergency163Ack = await req('/api/emergency/incident/ack', {
    method: 'POST',
    token,
    body: { id: emergency163Seed.data.incident?.id },
  });
  assert(emergency163Ack.res.ok && emergency163Ack.data.ok !== false, 'emergency incident ack');

  const folio163Sweep = await req('/api/folio/sweep', { method: 'POST', token, body: { force: true } });
  assert(folio163Sweep.res.ok && folio163Sweep.data.ok !== false, 'folio sweep');
  const folio163Dispute = await req('/api/folio/dispute/seed', {
    method: 'POST',
    token,
    body: { guestName: 'E2E-163 dispute', amount: 222 },
  });
  assert(folio163Dispute.res.ok && folio163Dispute.data.ok !== false, 'folio dispute seed');
  const folio163Post = await req('/api/folio/charge/post', {
    method: 'POST',
    token,
    body: { guestName: 'E2E-163 charge', amount: 111 },
  });
  assert(folio163Post.res.ok && folio163Post.data.ok !== false, 'folio post charge');

  const roomstatus163Sweep = await req('/api/roomstatus/sweep', { method: 'POST', token, body: { force: true } });
  assert(roomstatus163Sweep.res.ok && roomstatus163Sweep.data.ok !== false, 'roomstatus sweep');
  const roomstatus163Seed = await req('/api/roomstatus/blocked/seed', {
    method: 'POST',
    token,
    body: { room: 'E2E-163-RS' },
  });
  assert(roomstatus163Seed.res.ok && roomstatus163Seed.data.ok !== false, 'roomstatus blocked seed');
  const roomstatus163Ready = await req('/api/roomstatus/ready', {
    method: 'POST',
    token,
    body: { id: roomstatus163Seed.data.room?.id },
  });
  assert(roomstatus163Ready.res.ok && roomstatus163Ready.data.ok !== false, 'roomstatus ready');

  const minibar164Sweep = await req('/api/minibar/sweep', { method: 'POST', token, body: { force: true } });
  assert(minibar164Sweep.res.ok && minibar164Sweep.data.ok !== false, 'minibar sweep');
  const minibar164Seed = await req('/api/minibar/empty/seed', {
    method: 'POST',
    token,
    body: { room: 'E2E-164-MNB' },
  });
  assert(minibar164Seed.res.ok && minibar164Seed.data.ok !== false, 'minibar empty seed');
  const minibar164Restock = await req('/api/minibar/restock/due', {
    method: 'POST',
    token,
    body: { id: minibar164Seed.data.item?.id },
  });
  assert(minibar164Restock.res.ok && minibar164Restock.data.ok !== false, 'minibar restock due');
  const minibar164Charge = await req('/api/minibar/folio/charge', {
    method: 'POST',
    token,
    body: { id: minibar164Seed.data.item?.id, amount: 88 },
  });
  assert(minibar164Charge.res.ok && minibar164Charge.data.ok !== false, 'minibar folio charge');
  const minibar164Ack = await req('/api/minibar/flag/ack', { method: 'POST', token, body: {} });
  assert(minibar164Ack.res.ok && minibar164Ack.data.ok !== false, 'minibar flag ack');

  const transfers164Sweep = await req('/api/transfers/sweep', { method: 'POST', token, body: { force: true } });
  assert(transfers164Sweep.res.ok && transfers164Sweep.data.ok !== false, 'transfers sweep');
  const transfers164Seed = await req('/api/transfers/airport/seed', {
    method: 'POST',
    token,
    body: { guestName: 'E2E-164 airport' },
  });
  assert(transfers164Seed.res.ok && transfers164Seed.data.ok !== false, 'transfers airport seed');
  const transfers164Delay = await req('/api/transfers/pickup/delay', {
    method: 'POST',
    token,
    body: { id: transfers164Seed.data.ride?.id, minutes: 25 },
  });
  assert(transfers164Delay.res.ok && transfers164Delay.data.ok !== false, 'transfers pickup delay');
  const transfers164Complete = await req('/api/transfers/complete', {
    method: 'POST',
    token,
    body: { id: transfers164Seed.data.ride?.id },
  });
  assert(transfers164Complete.res.ok && transfers164Complete.data.ok !== false, 'transfers complete');
  const transfers164Ack = await req('/api/transfers/flag/ack', { method: 'POST', token, body: {} });
  assert(transfers164Ack.res.ok && transfers164Ack.data.ok !== false, 'transfers flag ack');

  const concierge164Sweep = await req('/api/concierge/sweep', { method: 'POST', token, body: { force: true } });
  assert(concierge164Sweep.res.ok && concierge164Sweep.data.ok !== false, 'concierge sweep');
  const concierge164Seed = await req('/api/concierge/vip/seed', {
    method: 'POST',
    token,
    body: { guestName: 'E2E-164 VIP' },
  });
  assert(concierge164Seed.res.ok && concierge164Seed.data.ok !== false, 'concierge vip seed');
  const concierge164Age = await req('/api/concierge/request/age', {
    method: 'POST',
    token,
    body: { id: concierge164Seed.data.request?.id },
  });
  assert(concierge164Age.res.ok && concierge164Age.data.ok !== false, 'concierge request aging');
  const concierge164Fulfill = await req('/api/concierge/fulfill', {
    method: 'POST',
    token,
    body: { id: concierge164Seed.data.request?.id },
  });
  assert(concierge164Fulfill.res.ok && concierge164Fulfill.data.ok !== false, 'concierge fulfill');
  const concierge164Ack = await req('/api/concierge/flag/ack', { method: 'POST', token, body: {} });
  assert(concierge164Ack.res.ok && concierge164Ack.data.ok !== false, 'concierge flag ack');

  const shuttle164Sweep = await req('/api/shuttle/sweep', { method: 'POST', token, body: { force: true } });
  assert(shuttle164Sweep.res.ok && shuttle164Sweep.data.ok !== false, 'shuttle sweep');
  const shuttle164Seed = await req('/api/shuttle/route/seed', {
    method: 'POST',
    token,
    body: { route: 'E2E-164 route' },
  });
  assert(shuttle164Seed.res.ok && shuttle164Seed.data.ok !== false, 'shuttle route seed');
  const shuttle164Late = await req('/api/shuttle/departure/late', {
    method: 'POST',
    token,
    body: { id: shuttle164Seed.data.run?.id, minutes: 15 },
  });
  assert(shuttle164Late.res.ok && shuttle164Late.data.ok !== false, 'shuttle late departure');
  const shuttle164Board = await req('/api/shuttle/board', {
    method: 'POST',
    token,
    body: { id: shuttle164Seed.data.run?.id, guests: 3 },
  });
  assert(shuttle164Board.res.ok && shuttle164Board.data.ok !== false, 'shuttle board guests');
  const shuttle164Ack = await req('/api/shuttle/flag/ack', { method: 'POST', token, body: {} });
  assert(shuttle164Ack.res.ok && shuttle164Ack.data.ok !== false, 'shuttle flag ack');

  const wifi165Sweep = await req('/api/wifi/sweep', { method: 'POST', token, body: { force: true } });
  assert(wifi165Sweep.res.ok && wifi165Sweep.data.ok !== false, 'wifi sweep');
  const wifi165Seed = await req('/api/wifi/voucher/seed', {
    method: 'POST',
    token,
    body: { guestName: 'E2E-165 WiFi' },
  });
  assert(wifi165Seed.res.ok && wifi165Seed.data.ok !== false, 'wifi voucher seed');
  const wifi165Issue = await req('/api/wifi/portal/issue', {
    method: 'POST',
    token,
    body: { id: wifi165Seed.data.voucher?.id },
  });
  assert(wifi165Issue.res.ok && wifi165Issue.data.ok !== false, 'wifi portal issue');
  const wifi165Reset = await req('/api/wifi/ap/reset', {
    method: 'POST',
    token,
    body: { id: wifi165Seed.data.voucher?.id },
  });
  assert(wifi165Reset.res.ok && wifi165Reset.data.ok !== false, 'wifi ap reset');
  const wifi165Ack = await req('/api/wifi/flag/ack', { method: 'POST', token, body: {} });
  assert(wifi165Ack.res.ok && wifi165Ack.data.ok !== false, 'wifi flag ack');

  const kds165Sweep = await req('/api/kds/sweep', { method: 'POST', token, body: { force: true } });
  assert(kds165Sweep.res.ok && kds165Sweep.data.ok !== false, 'kds sweep');
  const kds165Seed = await req('/api/kds/rush/seed', {
    method: 'POST',
    token,
    body: { ticket: 'E2E-165-KDS' },
  });
  assert(kds165Seed.res.ok && kds165Seed.data.ok !== false, 'kds rush seed');
  const kds165Age = await req('/api/kds/ticket/age', {
    method: 'POST',
    token,
    body: { id: kds165Seed.data.ticket?.id },
  });
  assert(kds165Age.res.ok && kds165Age.data.ok !== false, 'kds ticket aging');
  const kds165Bump = await req('/api/kds/ticket/bump', {
    method: 'POST',
    token,
    body: { id: kds165Seed.data.ticket?.id },
  });
  assert(kds165Bump.res.ok && kds165Bump.data.ok !== false, 'kds ticket bump');
  const kds165Ack = await req('/api/kds/flag/ack', { method: 'POST', token, body: {} });
  assert(kds165Ack.res.ok && kds165Ack.data.ok !== false, 'kds flag ack');

  const budget165Sweep = await req('/api/budget/sweep', { method: 'POST', token, body: { force: true } });
  assert(budget165Sweep.res.ok && budget165Sweep.data.ok !== false, 'budget sweep');
  const budget165Seed = await req('/api/budget/forecast/seed', {
    method: 'POST',
    token,
    body: { label: 'E2E-165 forecast gap' },
  });
  assert(budget165Seed.res.ok && budget165Seed.data.ok !== false, 'budget forecast seed');
  const budget165Overspend = await req('/api/budget/line/overspend', {
    method: 'POST',
    token,
    body: { id: budget165Seed.data.line?.id },
  });
  assert(budget165Overspend.res.ok && budget165Overspend.data.ok !== false, 'budget overspend line');
  const budget165Approve = await req('/api/budget/adjustment/approve', {
    method: 'POST',
    token,
    body: { id: budget165Seed.data.line?.id },
  });
  assert(budget165Approve.res.ok && budget165Approve.data.ok !== false, 'budget adjustment approve');
  const budget165Ack = await req('/api/budget/flag/ack', { method: 'POST', token, body: {} });
  assert(budget165Ack.res.ok && budget165Ack.data.ok !== false, 'budget flag ack');

  const eventcal165Sweep = await req('/api/eventcal/sweep', { method: 'POST', token, body: { force: true } });
  assert(eventcal165Sweep.res.ok && eventcal165Sweep.data.ok !== false, 'eventcal sweep');
  const eventcal165Seed = await req('/api/eventcal/holding/seed', {
    method: 'POST',
    token,
    body: { title: 'E2E-165 holding' },
  });
  assert(eventcal165Seed.res.ok && eventcal165Seed.data.ok !== false, 'eventcal holding seed');
  const eventcal165Conflict = await req('/api/eventcal/conflict', {
    method: 'POST',
    token,
    body: { id: eventcal165Seed.data.event?.id },
  });
  assert(eventcal165Conflict.res.ok && eventcal165Conflict.data.ok !== false, 'eventcal conflict');
  const eventcal165Publish = await req('/api/eventcal/publish', {
    method: 'POST',
    token,
    body: { id: eventcal165Seed.data.event?.id },
  });
  assert(eventcal165Publish.res.ok && eventcal165Publish.data.ok !== false, 'eventcal publish');
  const eventcal165Ack = await req('/api/eventcal/flag/ack', { method: 'POST', token, body: {} });
  assert(eventcal165Ack.res.ok && eventcal165Ack.data.ok !== false, 'eventcal flag ack');

  const keycards166Sweep = await req('/api/keycards/sweep', { method: 'POST', token, body: { force: true } });
  assert(keycards166Sweep.res.ok && keycards166Sweep.data.ok !== false, 'keycards sweep');
  const keycards166Seed = await req('/api/keycards/lost/seed', {
    method: 'POST',
    token,
    body: { guestName: 'E2E-166 lost card' },
  });
  assert(keycards166Seed.res.ok && keycards166Seed.data.ok !== false, 'keycards lost seed');
  const keycards166Expire = await req('/api/keycards/access/expire', {
    method: 'POST',
    token,
    body: { id: keycards166Seed.data.keycard?.id },
  });
  assert(keycards166Expire.res.ok && keycards166Expire.data.ok !== false, 'keycards expire access');
  const keycards166Reissue = await req('/api/keycards/reissue', {
    method: 'POST',
    token,
    body: { id: keycards166Seed.data.keycard?.id },
  });
  assert(keycards166Reissue.res.ok && keycards166Reissue.data.ok !== false, 'keycards reissue');
  const keycards166Ack = await req('/api/keycards/flag/ack', { method: 'POST', token, body: {} });
  assert(keycards166Ack.res.ok && keycards166Ack.data.ok !== false, 'keycards flag ack');

  const parcels166Sweep = await req('/api/parcels/sweep', { method: 'POST', token, body: { force: true } });
  assert(parcels166Sweep.res.ok && parcels166Sweep.data.ok !== false, 'parcels sweep');
  const parcels166Seed = await req('/api/parcels/hold/seed', {
    method: 'POST',
    token,
    body: { guestName: 'E2E-166 front desk' },
  });
  assert(parcels166Seed.res.ok && parcels166Seed.data.ok !== false, 'parcels hold seed');
  const parcels166Age = await req('/api/parcels/undelivered/age', {
    method: 'POST',
    token,
    body: { id: parcels166Seed.data.parcel?.id },
  });
  assert(parcels166Age.res.ok && parcels166Age.data.ok !== false, 'parcels undelivered aging');
  const parcels166Deliver = await req('/api/parcels/deliver', {
    method: 'POST',
    token,
    body: { id: parcels166Seed.data.parcel?.id },
  });
  assert(parcels166Deliver.res.ok && parcels166Deliver.data.ok !== false, 'parcels delivered');
  const parcels166Ack = await req('/api/parcels/flag/ack', { method: 'POST', token, body: {} });
  assert(parcels166Ack.res.ok && parcels166Ack.data.ok !== false, 'parcels flag ack');

  const wakeups166Sweep = await req('/api/wakeups/sweep', { method: 'POST', token, body: { force: true } });
  assert(wakeups166Sweep.res.ok && wakeups166Sweep.data.ok !== false, 'wakeups sweep');
  const wakeups166Seed = await req('/api/wakeups/vip/seed', {
    method: 'POST',
    token,
    body: { guestName: 'E2E-166 VIP' },
  });
  assert(wakeups166Seed.res.ok && wakeups166Seed.data.ok !== false, 'wakeups vip seed');
  const wakeups166Missed = await req('/api/wakeups/missed', {
    method: 'POST',
    token,
    body: { id: wakeups166Seed.data.wakeup?.id },
  });
  assert(wakeups166Missed.res.ok && wakeups166Missed.data.ok !== false, 'wakeups missed');
  const wakeups166Complete = await req('/api/wakeups/complete', {
    method: 'POST',
    token,
    body: { id: wakeups166Seed.data.wakeup?.id },
  });
  assert(wakeups166Complete.res.ok && wakeups166Complete.data.ok !== false, 'wakeups complete');
  const wakeups166Ack = await req('/api/wakeups/flag/ack', { method: 'POST', token, body: {} });
  assert(wakeups166Ack.res.ok && wakeups166Ack.data.ok !== false, 'wakeups flag ack');

  const upsell166Sweep = await req('/api/upsell/sweep', { method: 'POST', token, body: { force: true } });
  assert(upsell166Sweep.res.ok && upsell166Sweep.data.ok !== false, 'upsell sweep');
  const upsell166Seed = await req('/api/upsell/latecheckout/seed', {
    method: 'POST',
    token,
    body: { guestName: 'E2E-166 late checkout' },
  });
  assert(upsell166Seed.res.ok && upsell166Seed.data.ok !== false, 'upsell late checkout seed');
  const upsell166Age = await req('/api/upsell/offer/age', {
    method: 'POST',
    token,
    body: { id: upsell166Seed.data.offer?.id },
  });
  assert(upsell166Age.res.ok && upsell166Age.data.ok !== false, 'upsell offer aging');
  const upsell166Accept = await req('/api/upsell/offer/accept', {
    method: 'POST',
    token,
    body: { id: upsell166Seed.data.offer?.id },
  });
  assert(upsell166Accept.res.ok && upsell166Accept.data.ok !== false, 'upsell accept');
  const upsell166Ack = await req('/api/upsell/flag/ack', { method: 'POST', token, body: {} });
  assert(upsell166Ack.res.ok && upsell166Ack.data.ok !== false, 'upsell flag ack');

  await req('/api/athleteos/clearance', {
    method: 'POST',
    token,
    body: { athlete_id: 'ath_1', status: 'cleared' },
  });
  await req('/api/extreme/waiver', { method: 'POST', token, body: { user_id: 'guest_can' } });
  const gate = await req('/api/sportbridge/gate', {
    method: 'POST',
    token,
    body: { extreme_user: 'guest_can' },
  });
  assert(gate.res.ok && gate.data.status, 'sport gate');
  const elig = await req('/api/sportbridge/eligibility', { method: 'POST', token, body: {} });
  assert(elig.res.ok, 'sport eligibility');
  const compHold = await req('/api/sportbridge/comp-hold', {
    method: 'POST',
    token,
    body: { athlete_id: 'ath_1', hours: 24 },
  });
  assert(compHold.res.ok && compHold.data.ok !== false, 'sport comp hold');
  const gateHold = await req('/api/sportbridge/gate', {
    method: 'POST',
    token,
    body: { extreme_user: 'guest_can' },
  });
  assert(gateHold.res.ok && gateHold.data.ok === false, 'sport gate blocked by hold');
  const holdSnooze = await req('/api/sportbridge/hold/snooze', {
    method: 'POST',
    token,
    body: { athlete_id: 'ath_1', minutes: 1 },
  });
  assert(holdSnooze.res.ok && holdSnooze.data.ok !== false, 'sport hold snooze');
  const holdWake = await req('/api/sportbridge/hold/wake', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(holdWake.res.ok && holdWake.data.ok !== false, 'sport hold wake');
  const recClose = await req('/api/sportbridge/recovery/complete', {
    method: 'POST',
    token,
    body: { athlete_id: 'ath_1' },
  });
  assert(recClose.res.ok && recClose.data.ok !== false, 'sport recovery close');
  const postSweep = await req('/api/sportbridge/postcomp-sweep', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(postSweep.res.ok && postSweep.data.ok !== false, 'sport postcomp sweep');
  await req('/api/sportbridge/recovery/complete', { method: 'POST', token, body: {} });
  const gateEsc = await req('/api/sportbridge/gate/escalate', {
    method: 'POST',
    token,
    body: { extreme_user: 'guest_can', reason: 'e2e' },
  });
  assert(gateEsc.res.ok && gateEsc.data.ok !== false, 'sport gate escalate');
  const linkSeed = await req('/api/sportbridge/link', {
    method: 'POST',
    token,
    body: { extreme_user: 'guest_arch', athlete_id: 'ath_2', note: 'e2e archive' },
  });
  assert(linkSeed.res.ok && linkSeed.data.ok !== false, 'sport link seed');
  const linkArch = await req('/api/sportbridge/link/archive', {
    method: 'POST',
    token,
    body: { extreme_user: 'guest_arch', reason: 'e2e archive' },
  });
  assert(linkArch.res.ok && linkArch.data.ok !== false, 'sport link archive');

  const green = await req('/api/greenpulse/automations', { method: 'POST', token, body: {} });
  assert(green.res.ok, 'green automations');

  const permit = await req('/api/greenpulse/permit', {
    method: 'POST',
    token,
    body: { zone_id: 'z_forest', work: 'e2e path' },
  });
  assert(permit.res.ok && permit.data.ok !== false, 'green permit');
  const approve = await req('/api/greenpulse/permit/approve', { method: 'POST', token, body: {} });
  assert(approve.res.ok && approve.data.ok !== false, 'green permit approve');
  const closePermit = await req('/api/greenpulse/permit/close', { method: 'POST', token, body: {} });
  assert(closePermit.res.ok && closePermit.data.ok !== false, 'green permit close');
  const triage = await req('/api/greenpulse/water-triage', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(triage.res.ok && triage.data.ok !== false, 'water triage');
  const permitExp = await req('/api/greenpulse/permit', {
    method: 'POST',
    token,
    body: { zone_id: 'z_forest', work: 'e2e expire', hours: 1, status: 'approved' },
  });
  assert(permitExp.res.ok && permitExp.data.ok !== false, 'green permit expiry seed');
  const expirySweep = await req('/api/greenpulse/permit/expiry-sweep', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(expirySweep.res.ok && expirySweep.data.ok !== false, 'green permit expiry sweep');
  const curtail = await req('/api/greenpulse/curtailment', {
    method: 'POST',
    token,
    body: { kind: 'grid', pct: 20, hours: 2, force: true },
  });
  assert(curtail.res.ok && curtail.data.ok !== false, 'green curtailment');
  const curtailClear = await req('/api/greenpulse/curtailment/clear', {
    method: 'POST',
    token,
    body: { kind: 'grid' },
  });
  assert(curtailClear.res.ok && curtailClear.data.ok !== false, 'green curtailment clear');

  const stream = await req('/api/culture/stream/start', {
    method: 'POST',
    token,
    body: { event_id: 'ce_1' },
  });
  assert(stream.res.ok && stream.data.ok !== false, 'culture stream');
  await req('/api/culture/stream/pulse', { method: 'POST', token, body: { viewers: 40 } });
  await req('/api/culture/stream/end', { method: 'POST', token, body: {} });
  await req('/api/culture/stage', { method: 'POST', token, body: { stage_id: 'cs_studio', status: 'ready' } });
  const box = await req('/api/culture/box-office', { method: 'POST', token, body: {} });
  assert(box.res.ok && box.data.rollup, 'culture box office');

  await req('/api/culture/hold', {
    method: 'POST',
    token,
    body: { event_id: 'ce_1', qty: 1, guest: 'expire-e2e' },
  });
  const expire = await req('/api/culture/holds/expire', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(expire.res.ok && expire.data.ok !== false, 'culture hold expire');
  const door = await req('/api/culture/door/scan', {
    method: 'POST',
    token,
    body: { force: true, gate: 'main' },
  });
  assert(door.res.ok && door.data.ok !== false, 'culture door scan');
  const crew = await req('/api/culture/crew/call', {
    method: 'POST',
    token,
    body: { event_id: 'ce_1' },
  });
  assert(crew.res.ok && crew.data.ok !== false, 'culture crew call');
  const crewAck = await req('/api/culture/crew/ack', {
    method: 'POST',
    token,
    body: { role: 'stage' },
  });
  assert(crewAck.res.ok && crewAck.data.ok !== false, 'culture crew ack');
  const vip = await req('/api/culture/sale/vip', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(vip.res.ok && vip.data.ok !== false, 'culture vip upgrade');
  const holdTr = await req('/api/culture/hold', {
    method: 'POST',
    token,
    body: { event_id: 'ce_1', qty: 1, guest: 'e2e-from' },
  });
  assert(holdTr.res.ok && holdTr.data.ok !== false, 'culture hold for transfer');
  const holdTransfer = await req('/api/culture/hold/transfer', {
    method: 'POST',
    token,
    body: { hold_id: holdTr.data.hold?.id, to_guest: 'e2e-to' },
  });
  assert(holdTransfer.res.ok && holdTransfer.data.ok !== false, 'culture hold transfer');
  const doorDeny = await req('/api/culture/door/deny', {
    method: 'POST',
    token,
    body: { gate: 'vip', reason: 'e2e_deny', guest: 'blocked' },
  });
  assert(doorDeny.res.ok && doorDeny.data.ok !== false, 'culture door deny');
  const refund = await req('/api/culture/refund', { method: 'POST', token, body: {} });
  assert(refund.res.ok && refund.data.ok !== false, 'culture refund');
  const settleEv = await req('/api/culture/event/settle', {
    method: 'POST',
    token,
    body: { event_id: 'ce_1' },
  });
  assert(settleEv.res.ok && settleEv.data.ok !== false, 'culture settle');

  const restock = await req('/api/marketos/restock', {
    method: 'POST',
    token,
    body: { listing_id: 'ml_1' },
  });
  assert(restock.res.ok, 'market restock');

  const recon = await req('/api/marketos/reconcile', {
    method: 'POST',
    token,
    body: { limit: 2, channel: 'tybridge' },
  });
  assert(recon.res.ok, 'market reconcile');

  const low = await req('/api/marketos/low-stock', {
    method: 'POST',
    token,
    body: { force_all: true, limit: 2 },
  });
  assert(low.res.ok && low.data.ok !== false, 'market low stock');
  const po = await req('/api/marketos/po', {
    method: 'POST',
    token,
    body: { listing_id: 'ml_1', qty: 3 },
  });
  assert(po.res.ok && po.data.ok !== false, 'market po');
  const poRecv = await req('/api/marketos/po/receive', { method: 'POST', token, body: {} });
  assert(poRecv.res.ok && poRecv.data.ok !== false, 'market po receive');

  await req('/api/marketos/restock', { method: 'POST', token, body: { listing_id: 'ml_2', stock: 3 } });
  const rentCo = await req('/api/marketos/checkout', {
    method: 'POST',
    token,
    body: { listing_id: 'ml_2', buyer: 'e2e', days: 1 },
  });
  assert(rentCo.res.ok && rentCo.data.ok !== false && rentCo.data.order?.id, 'market rent checkout');
  const overdue = await req('/api/marketos/rental/overdue', {
    method: 'POST',
    token,
    body: { order_id: rentCo.data.order.id, force: true },
  });
  assert(overdue.res.ok && overdue.data.ok !== false, 'market rental overdue');
  const dmg = await req('/api/marketos/rental/damage', {
    method: 'POST',
    token,
    body: { order_id: rentCo.data.order.id, severity: 'moderate', charge_try: 350 },
  });
  assert(dmg.res.ok && dmg.data.ok !== false, 'market rental damage');
  const rentRet = await req('/api/marketos/return', {
    method: 'POST',
    token,
    body: { listing_id: 'ml_2' },
  });
  assert(rentRet.res.ok && rentRet.data.ok !== false, 'market rental return');
  const dep = await req('/api/marketos/deposit/settle', {
    method: 'POST',
    token,
    body: { order_id: rentCo.data.order.id, disposition: 'auto' },
  });
  assert(dep.res.ok && dep.data.ok !== false, 'market deposit settle');
  await req('/api/marketos/restock', { method: 'POST', token, body: { listing_id: 'ml_2', stock: 2 } });
  await req('/api/marketos/checkout', {
    method: 'POST',
    token,
    body: { listing_id: 'ml_2', buyer: 'e2e-sweep', days: 1 },
  });
  const rentSweep = await req('/api/marketos/rental/sweep', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(rentSweep.res.ok && rentSweep.data.ok !== false, 'market rental sweep');
  await req('/api/marketos/return', { method: 'POST', token, body: { listing_id: 'ml_2' } });
  await req('/api/marketos/deposit/settle', {
    method: 'POST',
    token,
    body: { listing_id: 'ml_2', disposition: 'refund' },
  });

  const gbatch = await req('/api/greenpulse/batch', { method: 'POST', token, body: {} });
  assert(gbatch.res.ok && gbatch.data.batch, 'green batch');

  const settle = await req('/api/openmall/fnb-settle', {
    method: 'POST',
    token,
    body: { tenant_id: 'mt_4' },
  });
  assert(settle.res.ok && settle.data.ok !== false, 'mall fnb settle');

  const rentRun = await req('/api/openmall/rent-run', {
    method: 'POST',
    token,
    body: { period: '2026-08', force: true, due_days: -3 },
  });
  assert(rentRun.res.ok && rentRun.data.ok !== false, 'mall rent run');
  const invPay = await req('/api/openmall/invoice/pay', {
    method: 'POST',
    token,
    body: { invoice_id: rentRun.data.created?.[0]?.id, amount_try: 1000 },
  });
  assert(invPay.res.ok && invPay.data.ok !== false, 'mall invoice pay');
  let invDispute = await req('/api/openmall/invoice/dispute', {
    method: 'POST',
    token,
    body: { invoice_id: rentRun.data.created?.[0]?.id, reason: 'e2e' },
  });
  if (!invDispute.res.ok || invDispute.data.ok === false) {
    invDispute = await req('/api/openmall/invoice/dispute', {
      method: 'POST',
      token,
      body: { reason: 'e2e' },
    });
  }
  assert(invDispute.res.ok && invDispute.data.ok !== false, 'mall invoice dispute');
  const tenantPause = await req('/api/openmall/tenant/pause', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(tenantPause.res.ok && tenantPause.data.ok !== false, 'mall tenant pause');
  const tenantResume = await req('/api/openmall/tenant/resume', { method: 'POST', token, body: {} });
  assert(tenantResume.res.ok && tenantResume.data.ok !== false, 'mall tenant resume');
  const dunning = await req('/api/openmall/dunning', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(dunning.res.ok && dunning.data.ok !== false, 'mall dunning');
  const camRun = await req('/api/openmall/cam-run', {
    method: 'POST',
    token,
    body: { period: '2026-08', force: true },
  });
  assert(camRun.res.ok && camRun.data.ok !== false, 'mall cam run');
  const leaseHold = await req('/api/openmall/lease/hold', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(leaseHold.res.ok && leaseHold.data.ok !== false, 'mall lease hold');
  const leaseRelease = await req('/api/openmall/lease/release', {
    method: 'POST',
    token,
    body: {},
  });
  assert(leaseRelease.res.ok && leaseRelease.data.ok !== false, 'mall lease release');

  const ztr = await req('/api/campus/zone-transition', {
    method: 'POST',
    token,
    body: { zone_id: 'z_caravan' },
  });
  assert(ztr.res.ok, 'zone transition');
  await req('/api/campus/incident', { method: 'POST', token, body: { title: 'e2e', zone_id: 'z_sport' } });
  const wo = await req('/api/campus/work-order', {
    method: 'POST',
    token,
    body: { zone_id: 'z_sport', title: 'e2e WO' },
  });
  assert(wo.res.ok && wo.data.ok !== false, 'campus WO');
  const woSweep = await req('/api/campus/work-order/sweep', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(woSweep.res.ok && woSweep.data.ok !== false, 'campus WO sweep');
  const woAssign = await req('/api/campus/work-order/assign', {
    method: 'POST',
    token,
    body: { assignee: 'e2e-crew', agent: 'HEPHAESTUS' },
  });
  assert(woAssign.res.ok && woAssign.data.ok !== false, 'campus WO assign');
  const woStart = await req('/api/campus/work-order/start', { method: 'POST', token, body: {} });
  assert(woStart.res.ok && woStart.data.ok !== false, 'campus WO start');
  const woEsc = await req('/api/campus/work-order/escalate', {
    method: 'POST',
    token,
    body: { reason: 'e2e' },
  });
  assert(woEsc.res.ok && woEsc.data.ok !== false, 'campus WO escalate');
  const woDone = await req('/api/campus/work-order/complete', { method: 'POST', token, body: {} });
  assert(woDone.res.ok && woDone.data.ok !== false, 'campus WO complete');
  await req('/api/campus/incident', {
    method: 'POST',
    token,
    body: { title: 'e2e escalate', zone_id: 'z_sport', severity: 'info' },
  });
  const incEsc = await req('/api/campus/incident/escalate', {
    method: 'POST',
    token,
    body: { reason: 'e2e' },
  });
  assert(incEsc.res.ok && incEsc.data.ok !== false, 'campus incident escalate');
  const lock = await req('/api/campus/zone/lockdown', {
    method: 'POST',
    token,
    body: { zone_id: 'z_sport', reason: 'e2e', force: true },
  });
  assert(lock.res.ok && lock.data.ok !== false, 'campus lockdown');
  const lockClear = await req('/api/campus/zone/lockdown/clear', {
    method: 'POST',
    token,
    body: { zone_id: 'z_sport' },
  });
  assert(lockClear.res.ok && lockClear.data.ok !== false, 'campus lockdown clear');
  const capAlert = await req('/api/campus/capacity/alert-sweep', {
    method: 'POST',
    token,
    body: { force: true, threshold: 1 },
  });
  assert(capAlert.res.ok && capAlert.data.ok !== false, 'campus capacity alert');
  await req('/api/campus/incident/resolve', { method: 'POST', token, body: {} });
  const cap = await req('/api/campus/capacity', { method: 'POST', token, body: {} });
  assert(cap.res.ok && cap.data.rollup, 'campus capacity');
  const bc = await req('/api/agentbridge/broadcast', {
    method: 'POST',
    token,
    body: { title: 'e2e broadcast' },
  });
  assert(bc.res.ok && bc.data.ok !== false, 'bridge broadcast');
  const ch = await req('/api/agentbridge/channel', {
    method: 'POST',
    token,
    body: { topic: 'e2e-ops' },
  });
  assert(ch.res.ok && ch.data.ok !== false, 'bridge channel');
  const chPulse = await req('/api/agentbridge/channel/pulse', { method: 'POST', token, body: {} });
  assert(chPulse.res.ok && chPulse.data.ok !== false, 'bridge channel pulse');
  const alertEsc = await req('/api/agentbridge/alert', {
    method: 'POST',
    token,
    body: { title: 'e2e alert', domain: 'green', severity: 'high' },
  });
  assert(alertEsc.res.ok && alertEsc.data.ok !== false, 'bridge alert');
  const alertRoute = await req('/api/agentbridge/alert/route', {
    method: 'POST',
    token,
    body: { mode: 'work_order' },
  });
  assert(alertRoute.res.ok && alertRoute.data.ok !== false, 'bridge alert route');
  const alertMute = await req('/api/agentbridge/alert/mute', {
    method: 'POST',
    token,
    body: { minutes: 1, reason: 'e2e mute' },
  });
  assert(alertMute.res.ok && alertMute.data.ok !== false, 'bridge alert mute');
  const alertUnmute = await req('/api/agentbridge/alert/unmute', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(alertUnmute.res.ok && alertUnmute.data.ok !== false, 'bridge alert unmute');
  const chSnooze = await req('/api/agentbridge/channel/snooze', {
    method: 'POST',
    token,
    body: { minutes: 1 },
  });
  assert(chSnooze.res.ok && chSnooze.data.ok !== false, 'bridge channel snooze');
  const chWake = await req('/api/agentbridge/channel/wake', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(chWake.res.ok && chWake.data.ok !== false, 'bridge channel wake');
  const alertSla = await req('/api/agentbridge/alert/sla-sweep', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(alertSla.res.ok && alertSla.data.ok !== false, 'bridge alert sla');
  const alertRes = await req('/api/agentbridge/alert/resolve', { method: 'POST', token, body: {} });
  assert(alertRes.res.ok && alertRes.data.ok !== false, 'bridge alert resolve');
  const chClose = await req('/api/agentbridge/channel/close', { method: 'POST', token, body: {} });
  assert(chClose.res.ok && chClose.data.ok !== false, 'bridge channel close');

  const sla = await req('/api/agentqueue/sla-sweep', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(sla.res.ok, 'sla sweep');

  const reb = await req('/api/agentqueue/rebalance', { method: 'POST', token, body: {} });
  assert(reb.res.ok && reb.data.ok !== false, 'agent rebalance');
  const enqFail = await req('/api/agentqueue/enqueue', {
    method: 'POST',
    token,
    body: { agent: 'ETHOS', title: 'e2e-fail-seed' },
  });
  const claimFail = await req('/api/agentqueue/claim', {
    method: 'POST',
    token,
    body: { id: enqFail.data.job?.id },
  });
  await req('/api/agentqueue/complete', {
    method: 'POST',
    token,
    body: { id: claimFail.data.job?.id || enqFail.data.job?.id, fail: true },
  });
  const revive = await req('/api/agentqueue/revive', { method: 'POST', token, body: { limit: 5 } });
  assert(revive.res.ok && revive.data.ok !== false, 'agent revive');
  const bumpEnq = await req('/api/agentqueue/enqueue', {
    method: 'POST',
    token,
    body: { agent: 'DAZE-HUB', title: 'e2e-bump-snooze', priority: 'normal' },
  });
  const bump = await req('/api/agentqueue/priority-bump', {
    method: 'POST',
    token,
    body: { id: bumpEnq.data.job?.id, reason: 'e2e bump' },
  });
  assert(bump.res.ok && bump.data.ok !== false, 'agent priority bump');
  const snooze = await req('/api/agentqueue/snooze', {
    method: 'POST',
    token,
    body: { id: bumpEnq.data.job?.id, minutes: 1 },
  });
  assert(snooze.res.ok && snooze.data.ok !== false, 'agent snooze');
  const wake = await req('/api/agentqueue/wake-snoozed', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(wake.res.ok && wake.data.ok !== false, 'agent wake snoozed');
  const cancelEnq = await req('/api/agentqueue/enqueue', {
    method: 'POST',
    token,
    body: { agent: 'ETHOS', title: 'e2e-cancel' },
  });
  const cancel = await req('/api/agentqueue/cancel', {
    method: 'POST',
    token,
    body: { id: cancelEnq.data.job?.id, reason: 'e2e cancel' },
  });
  assert(cancel.res.ok && cancel.data.ok !== false, 'agent cancel');
  const arch = await req('/api/agentqueue/archive', { method: 'POST', token, body: { force: true } });
  assert(arch.res.ok && arch.data.ok !== false, 'agent archive');

  const syncAct = await req('/api/campusbrief/actions', { method: 'POST', token, body: {} });
  assert(syncAct.res.ok, 'brief actions sync');
  const openAct = (syncAct.data.overview?.register || []).find(
    (a) => a.status === 'open' || a.status === 'assigned',
  ) || (syncAct.data.overview?.register || [])[0];
  if (openAct?.id) {
    const assign = await req('/api/campusbrief/actions/assign', {
      method: 'POST',
      token,
      body: { id: openAct.id, owner: 'LİKYA-1' },
    });
    assert(assign.res.ok && assign.data.ok !== false, 'brief assign');
    const esc = await req('/api/campusbrief/actions/escalate', {
      method: 'POST',
      token,
      body: { id: openAct.id, reason: 'e2e esc' },
    });
    assert(esc.res.ok && esc.data.ok !== false, 'brief escalate');
    const snoozeAct = await req('/api/campusbrief/actions/snooze', {
      method: 'POST',
      token,
      body: { id: openAct.id, minutes: 1 },
    });
    assert(snoozeAct.res.ok && snoozeAct.data.ok !== false, 'brief snooze');
    const wakeAct = await req('/api/campusbrief/actions/wake', {
      method: 'POST',
      token,
      body: { force: true },
    });
    assert(wakeAct.res.ok && wakeAct.data.ok !== false, 'brief wake');
    const dismiss = await req('/api/campusbrief/actions/dismiss', {
      method: 'POST',
      token,
      body: { id: openAct.id, reason: 'e2e dismiss' },
    });
    assert(dismiss.res.ok && dismiss.data.ok !== false, 'brief dismiss');
    const ack = await req('/api/campusbrief/actions/ack', {
      method: 'POST',
      token,
      body: { id: openAct.id },
    });
    assert(ack.res.ok, 'brief ack');
  }
  const pub = await req('/api/campusbrief/publish', { method: 'POST', token, body: {} });
  assert(pub.res.ok && pub.data.ok !== false, 'brief publish');

  const health = await req('/api/health', { token });
  assert(health.data.status, 'health status');

  console.log(
    JSON.stringify(
      {
        ok: true,
        base: BASE,
        health: health.data.status,
        campus_score: (await req('/api/campus/health', { token })).data.score,
        fleet: (await req('/api/agentfleet', { token })).data.summary?.total,
        readiness_avg: ready.data.avg,
        occupancy_pct: night.data.rollup?.occupancy_pct,
        elig_flagged: elig.data.summary?.flagged,
        green_actions: green.data.actions?.length,
        sla_esc: sla.data.escalated?.length,
        brief_register: syncAct.data.created?.length,
      },
      null,
      2,
    ),
  );
} finally {
  if (child) {
    child.kill('SIGTERM');
    await sleep(200);
  }
}
