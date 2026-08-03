#!/usr/bin/env bash
# Localhost denetçi — Vite :5173 ve (opsiyonel) prod :4173
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEV_PORT="${DEV_PORT:-5173}"
PROD_PORT="${PROD_PORT:-4173}"
ENSURE_PROD="${ENSURE_PROD:-0}"

ok() { echo "OK  $1"; }
warn() { echo "WARN $1"; }
fail() { echo "FAIL $1"; }

check_http() {
  local url=$1
  curl -fsS --connect-timeout 2 --max-time 5 "$url" >/dev/null 2>&1
}

ensure_vite() {
  if check_http "http://127.0.0.1:${DEV_PORT}/api/health"; then
    local status
    status=$(curl -fsS "http://127.0.0.1:${DEV_PORT}/api/health" | python3 -c 'import sys,json;d=json.load(sys.stdin);print(d.get("status","?"), d.get("campus",{}).get("score","?"))' 2>/dev/null || echo "? ?")
    ok "vite :${DEV_PORT} health $status"
    return 0
  fi
  warn "vite :${DEV_PORT} down — restarting"
  fuser -k "${DEV_PORT}/tcp" 2>/dev/null || true
  sleep 1
  nohup npm run dev -- --host 0.0.0.0 --port "$DEV_PORT" >/tmp/vite-likya.log 2>&1 &
  for i in $(seq 1 40); do
    check_http "http://127.0.0.1:${DEV_PORT}/api/health" && break
    sleep 0.25
  done
  if check_http "http://127.0.0.1:${DEV_PORT}/api/health"; then
    ok "vite :${DEV_PORT} restarted"
  else
    fail "vite :${DEV_PORT} failed to start — see /tmp/vite-likya.log"
    return 1
  fi
}

ensure_prod() {
  if [[ "$ENSURE_PROD" != "1" ]]; then
    if check_http "http://127.0.0.1:${PROD_PORT}/api/health"; then
      ok "prod :${PROD_PORT} up"
    else
      warn "prod :${PROD_PORT} down (ENSURE_PROD=1 ile ayağa kalkar)"
    fi
    return 0
  fi
  if check_http "http://127.0.0.1:${PROD_PORT}/api/health"; then
    ok "prod :${PROD_PORT} up"
    return 0
  fi
  if [[ ! -f dist/index.html ]]; then
    warn "dist yok — npm run build"
    npm run build
  fi
  warn "prod :${PROD_PORT} down — restarting"
  fuser -k "${PROD_PORT}/tcp" 2>/dev/null || true
  sleep 1
  nohup env PORT="$PROD_PORT" HOST=0.0.0.0 node server/prod-server.js >/tmp/prod-likya.log 2>&1 &
  for i in $(seq 1 40); do
    check_http "http://127.0.0.1:${PROD_PORT}/api/health" && break
    sleep 0.25
  done
  if check_http "http://127.0.0.1:${PROD_PORT}/api/health"; then
    ok "prod :${PROD_PORT} restarted"
  else
    fail "prod :${PROD_PORT} failed — see /tmp/prod-likya.log"
    return 1
  fi
}

login_smoke() {
  local base=$1
  local json
  json=$(curl -fsS -X POST "$base/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"username":"ceo","password":"likya2026"}')
  echo "$json" | python3 -c 'import sys,json;d=json.load(sys.stdin);assert d.get("token"); assert d.get("user",{}).get("role")=="ceo"'
  ok "login smoke $base"
}

echo "==> localhost-doctor"
ensure_vite
ensure_prod
login_smoke "http://127.0.0.1:${DEV_PORT}" || warn "vite login smoke failed"
if check_http "http://127.0.0.1:${PROD_PORT}/api/health"; then
  login_smoke "http://127.0.0.1:${PROD_PORT}" || warn "prod login smoke failed"
fi
echo "LOCALHOST_DOCTOR_DONE"
