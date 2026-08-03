#!/usr/bin/env bash
# Tam doğrulama zinciri: gate → campus smoke → build → prod smoke → e2e
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> [1/5] gate"
bash scripts/quality-gate.sh

echo "==> [2/5] smoke:campus"
node scripts/smoke-campus.mjs

echo "==> [3/5] build"
npm run build

echo "==> [4/5] smoke:prod (geçici :4178)"
fuser -k 4178/tcp 2>/dev/null || true
PORT=4178 HOST=127.0.0.1 node server/prod-server.js >/tmp/likya-verify-prod.log 2>&1 &
PROD_PID=$!
cleanup() { kill "$PROD_PID" 2>/dev/null || true; }
trap cleanup EXIT
for i in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:4178/api/health" >/dev/null 2>&1; then break; fi
  sleep 0.25
done
BASE=http://127.0.0.1:4178 node scripts/prod-smoke.mjs
cleanup
trap - EXIT

echo "==> [5/5] e2e:campus (kendi :4177 sunucusu)"
PORT=4177 RATE_LIMIT_MAX="${RATE_LIMIT_MAX:-5000}" RATE_LIMIT_AUTH_MAX="${RATE_LIMIT_AUTH_MAX:-500}" \
  node scripts/e2e-campus-http.mjs

echo "VERIFY_FULL_OK"
