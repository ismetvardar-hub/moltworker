#!/usr/bin/env bash
# main'e merge sonrası Mac / CI doğrulama
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> branch: $(git rev-parse --abbrev-ref HEAD)"
echo "==> head:   $(git rev-parse --short HEAD)"

echo "==> install (gerekirse)"
npm install --no-fund --no-audit

echo "==> gate"
bash scripts/quality-gate.sh

echo "==> campus smoke"
node scripts/smoke-campus.mjs

echo "==> build"
npm run build

echo "==> prod smoke (:4180)"
fuser -k 4180/tcp 2>/dev/null || true
PORT=4180 HOST=127.0.0.1 node server/prod-server.js >/tmp/likya-post-merge-prod.log 2>&1 &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; }
trap cleanup EXIT
for i in $(seq 1 40); do
  curl -fsS "http://127.0.0.1:4180/api/health" >/dev/null 2>&1 && break
  sleep 0.25
done
BASE=http://127.0.0.1:4180 node scripts/prod-smoke.mjs
cleanup
trap - EXIT

echo "POST_MERGE_OK — isteğe bağlı: npm run e2e:campus && npm run backup -- post-merge"
echo "Dev: npm run dev -- --host 0.0.0.0 --port 5173"
