#!/usr/bin/env node
/**
 * Production smoke — dist + npm start (PORT) üzerinde hızlı doğrulama.
 * Kullanım: npm run build && npm start &  npm run smoke:prod
 * veya: BASE=http://127.0.0.1:4173 npm run smoke:prod
 */
const BASE = process.env.BASE || 'http://127.0.0.1:4173';
const USER = process.env.AUTH_CEO_USER || 'ceo';
const PASS = process.env.AUTH_CEO_PASS || 'likya2026';

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL', msg);
    process.exit(1);
  }
  console.log('OK ', msg);
}

async function main() {
  console.log('==> prod-smoke', BASE);

  const html = await fetch(`${BASE}/`);
  assert(html.ok, `GET / → ${html.status}`);
  const htmlText = await html.text();
  assert(htmlText.includes('root') || htmlText.includes('OlymposPass'), 'index shell');

  for (const path of ['/sw.js', '/manifest.webmanifest', '/favicon.svg']) {
    const r = await fetch(`${BASE}${path}`);
    assert(r.ok, `GET ${path} → ${r.status}`);
  }

  const health = await fetch(`${BASE}/api/health`).then((r) => r.json());
  assert(health.status === 'healthy' || health.status === 'degraded', `health ${health.status}`);

  const login = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USER, password: PASS }),
  }).then((r) => r.json());
  assert(login.token && login.user?.role === 'ceo', 'ceo login');
  assert(login.user?.activeBrandId === 'brand_likya' || login.user?.brands?.[0]?.id === 'brand_likya', 'ceo brand order');

  const headers = { Authorization: `Bearer ${login.token}`, 'Content-Type': 'application/json' };

  const campus = await fetch(`${BASE}/api/campus/health`, { headers }).then((r) => r.json());
  assert(typeof campus.score === 'number', `campus score ${campus.score}`);

  const heal = await fetch(`${BASE}/api/campus/heal`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ limit: 200 }),
  }).then((r) => r.json());
  assert(heal.ok, 'campus heal ok');
  assert(
    typeof heal.after?.score === 'number' && heal.after.score >= (heal.before?.score ?? 0),
    `heal ${heal.before?.score} → ${heal.after?.score}`,
  );

  // SPA fallback — bilinmeyen path index dönmeli
  const spa = await fetch(`${BASE}/does-not-exist-likya`);
  assert(spa.ok, `SPA fallback → ${spa.status}`);

  console.log('PROD_SMOKE_OK', {
    health: health.status,
    campus: campus.score,
    healAfter: heal.after?.score,
    brand: login.user?.activeBrandId,
  });
}

main().catch((err) => {
  console.error('FAIL', err);
  process.exit(1);
});
