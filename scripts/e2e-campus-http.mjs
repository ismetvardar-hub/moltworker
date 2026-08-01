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
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

let child = null;
if (OWN_SERVER) {
  child = spawn('node', ['server/prod-server.js'], {
    cwd: new URL('..', import.meta.url).pathname,
    env: { ...process.env, PORT: String(PORT), HOST: '127.0.0.1' },
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

  const ready = await req('/api/athleteos/readiness', { token });
  assert(ready.res.ok && Array.isArray(ready.data.athletes), 'athlete readiness');

  const checkin = await req('/api/lifecoach/checkin', {
    method: 'POST',
    token,
    body: { client_id: 'lc_1', mood: 6, sleep_h: 7 },
  });
  assert(checkin.res.ok && checkin.data.ok !== false, 'life checkin');
  const dig = await req('/api/lifecoach/digest', { method: 'POST', token, body: {} });
  assert(dig.res.ok && dig.data.digest, 'life digest');

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

  const presence = await req('/api/agentfleet/presence-sweep', {
    method: 'POST',
    token,
    body: { campus_only: true },
  });
  assert(presence.res.ok && presence.data.updated >= 1, 'presence sweep');

  const elig = await req('/api/sportbridge/eligibility', { method: 'POST', token, body: {} });
  assert(elig.res.ok, 'sport eligibility');

  const green = await req('/api/greenpulse/automations', { method: 'POST', token, body: {} });
  assert(green.res.ok, 'green automations');

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

  const ztr = await req('/api/campus/zone-transition', {
    method: 'POST',
    token,
    body: { zone_id: 'z_caravan' },
  });
  assert(ztr.res.ok, 'zone transition');
  await req('/api/campus/incident', { method: 'POST', token, body: { title: 'e2e', zone_id: 'z_sport' } });
  await req('/api/campus/incident/resolve', { method: 'POST', token, body: {} });
  const cap = await req('/api/campus/capacity', { method: 'POST', token, body: {} });
  assert(cap.res.ok && cap.data.rollup, 'campus capacity');
  const bc = await req('/api/agentbridge/broadcast', {
    method: 'POST',
    token,
    body: { title: 'e2e broadcast' },
  });
  assert(bc.res.ok && bc.data.ok !== false, 'bridge broadcast');

  const sla = await req('/api/agentqueue/sla-sweep', {
    method: 'POST',
    token,
    body: { force: true },
  });
  assert(sla.res.ok, 'sla sweep');

  const syncAct = await req('/api/campusbrief/actions', { method: 'POST', token, body: {} });
  assert(syncAct.res.ok, 'brief actions sync');
  const openAct = (syncAct.data.overview?.register || [])[0];
  if (openAct?.id) {
    const ack = await req('/api/campusbrief/actions/ack', {
      method: 'POST',
      token,
      body: { id: openAct.id },
    });
    assert(ack.res.ok, 'brief ack');
  }

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
