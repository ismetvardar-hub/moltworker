#!/usr/bin/env node
/**
 * Rol menü dumanı — login + core sayfa API’lerinin 200 döndüğünü doğrular.
 * BASE_URL=http://127.0.0.1:5173 node scripts/role-nav-smoke.mjs
 */
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173'

const ROLES = [
  {
    user: 'ceo',
    pass: 'likya2026',
    expectBrand: 'brand_likya',
    apis: ['/api/campusbrief', '/api/campus/health', '/api/agentfleet', '/api/jobs'],
  },
  {
    user: 'chef',
    pass: 'daze123',
    expectBrand: 'brand_daze',
    apis: ['/api/jobs', '/api/inventory', '/api/notifications'],
  },
  {
    user: 'crew',
    pass: 'crew123',
    expectBrand: 'brand_olympospass',
    apis: ['/api/notifications', '/api/shifts', '/api/field'],
  },
]

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
  console.log('OK ', msg)
}

async function login(username, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json().catch(() => ({}))
  assert(res.ok && data.token, `${username} login`)
  return data
}

async function main() {
  console.log('==> role-nav-smoke', BASE)
  const html = await fetch(`${BASE}/`)
  assert(html.ok, `HTML ${html.status}`)

  for (const role of ROLES) {
    const data = await login(role.user, role.pass)
    assert(data.user?.role, `${role.user} role=${data.user.role}`)
    assert(
      data.user.activeBrandId === role.expectBrand,
      `${role.user} brand ${data.user.activeBrandId}`,
    )
    assert(Array.isArray(data.user.pages) && data.user.pages.length > 0, `${role.user} pages`)
    const headers = { Authorization: `Bearer ${data.token}` }
    for (const path of role.apis) {
      const r = await fetch(`${BASE}${path}`, { headers })
      assert(r.ok, `${role.user} ${path} → ${r.status}`)
    }
  }
  console.log('ROLE_NAV_SMOKE_OK')
}

main().catch((err) => {
  console.error('FAIL', err.message || err)
  process.exit(1)
})
