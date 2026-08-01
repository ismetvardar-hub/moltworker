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

  const book = await req('/api/familycamp/book', {
    method: 'POST',
    token,
    body: { program_id: 'fp_1', child_name: 'E2E' },
  });
  assert(book.res.ok && book.data.ok !== false, 'family book');

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

  const ready = await req('/api/athleteos/readiness', { token });
  assert(ready.res.ok && Array.isArray(ready.data.athletes), 'athlete readiness');

  const checkin = await req('/api/lifecoach/checkin', {
    method: 'POST',
    token,
    body: { client_id: 'lc_1', mood: 6, sleep_h: 7 },
  });
  assert(checkin.res.ok && checkin.data.ok !== false, 'life checkin');

  const night = await req('/api/stayring/night-rollup', { method: 'POST', token, body: {} });
  assert(night.res.ok && night.data.rollup, 'stay night rollup');

  const hk = await req('/api/stayring/hk-complete', {
    method: 'POST',
    token,
    body: { unit_id: 'su_2' },
  });
  assert(hk.res.ok, 'stay hk complete');

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
