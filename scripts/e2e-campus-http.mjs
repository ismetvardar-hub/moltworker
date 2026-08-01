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
  await req('/api/extreme/weather-clear', { method: 'POST', token, body: {} });

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
  const arch = await req('/api/agentqueue/archive', { method: 'POST', token, body: { force: true } });
  assert(arch.res.ok && arch.data.ok !== false, 'agent archive');

  const syncAct = await req('/api/campusbrief/actions', { method: 'POST', token, body: {} });
  assert(syncAct.res.ok, 'brief actions sync');
  const openAct = (syncAct.data.overview?.register || [])[0];
  if (openAct?.id) {
    const assign = await req('/api/campusbrief/actions/assign', {
      method: 'POST',
      token,
      body: { id: openAct.id, owner: 'LİKYA-1' },
    });
    assert(assign.res.ok && assign.data.ok !== false, 'brief assign');
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
