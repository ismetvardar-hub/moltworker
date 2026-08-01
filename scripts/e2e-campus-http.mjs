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
