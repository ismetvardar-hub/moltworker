#!/usr/bin/env bash
# Localhost nöbetçi — Vite :5173 + opsiyonel prod :4173
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEV_URL="${DEV_URL:-http://127.0.0.1:5173}"
PROD_URL="${PROD_URL:-http://127.0.0.1:4173}"
CHECK_PROD="${CHECK_PROD:-1}"
AUTO_RESTART="${AUTO_RESTART:-0}"

ok() { echo "OK  $1"; }
fail() { echo "FAIL $1"; FAILED=1; }
FAILED=0

http_code() {
  local url="$1"
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "$url" 2>/dev/null || true)"
  echo "${code:-000}"
}

ensure_dev() {
  if [[ "$(http_code "$DEV_URL/")" == "200" ]]; then return 0; fi
  [[ "$AUTO_RESTART" == "1" ]] || return 1
  echo "WARN restarting Vite on :5173"
  fuser -k 5173/tcp 2>/dev/null || true
  sleep 1
  nohup npm run dev -- --host 0.0.0.0 --port 5173 >/tmp/vite-likya.log 2>&1 &
  echo $! >/tmp/vite-likya.pid
  for _ in $(seq 1 30); do
    [[ "$(http_code "$DEV_URL/")" == "200" ]] && return 0
    sleep 0.5
  done
  return 1
}

check_base() {
  local base="$1" label="$2"
  local code health login status score brand

  code="$(http_code "$base/")"
  if [[ "$code" == "200" ]]; then ok "$label HTML $code"; else fail "$label HTML $code"; return; fi

  health="$(curl -sS --max-time 8 "$base/api/health" 2>/dev/null || true)"
  if echo "$health" | grep -q '"status"'; then
    status="$(echo "$health" | python3 -c 'import sys,json;print(json.load(sys.stdin).get("status"))' 2>/dev/null || echo '?')"
    score="$(echo "$health" | python3 -c 'import sys,json;print((json.load(sys.stdin).get("campus") or {}).get("score"))' 2>/dev/null || echo '?')"
    ok "$label health=$status campus=$score"
  else
    fail "$label /api/health"
  fi

  login="$(curl -sS --max-time 8 -X POST "$base/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d '{"username":"ceo","password":"likya2026"}' 2>/dev/null || true)"
  if echo "$login" | grep -q '"token"'; then
    brand="$(echo "$login" | python3 -c 'import sys,json;print(json.load(sys.stdin)["user"].get("activeBrandId"))' 2>/dev/null || echo '?')"
    ok "$label login brand=$brand"
  else
    fail "$label login"
  fi
}

echo "==> localhost watchdog $(date -u +%Y-%m-%dT%H:%M:%SZ)"

if ! ensure_dev; then
  fail "dev unreachable ($DEV_URL)"
else
  check_base "$DEV_URL" "dev"
fi

if [[ "$CHECK_PROD" == "1" ]]; then
  if [[ "$(http_code "$PROD_URL/api/health")" =~ ^2 ]]; then
    check_base "$PROD_URL" "prod"
  else
    echo "WARN prod down ($PROD_URL) — atlanıyor"
  fi
fi

if [[ "$FAILED" -ne 0 ]]; then
  echo "WATCHDOG_FAIL"
  exit 1
fi
echo "WATCHDOG_OK"
