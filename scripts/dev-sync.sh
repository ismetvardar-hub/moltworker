#!/usr/bin/env bash
# OlymposPass — otomatik eşitlemeli geliştirme sunucusu.
#
# Vite dev sunucusunu başlatır ve arka planda her 20 saniyede bir uzak
# daldaki yeni commit'leri çeker. Vite (HMR) değişen dosyaları anında
# tarayıcıya yansıttığı için, bulut ajanı push ettikçe önizleme kendi
# kendine güncellenir — elle "git pull" gerekmez.
#
# Kullanım:  npm run dev:sync
# Aralığı değiştirmek için:  SYNC_INTERVAL=10 npm run dev:sync
set -euo pipefail

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
INTERVAL="${SYNC_INTERVAL:-20}"

echo "[sync] izlenen dal: $BRANCH · kontrol aralığı: ${INTERVAL} sn"

(
  while true; do
    sleep "$INTERVAL"
    # Yerel düzenleme varsa karışma; yalnızca temiz çalışma alanında ilerle.
    if [[ -n "$(git status --porcelain)" ]]; then
      continue
    fi
    before="$(git rev-parse HEAD)"
    git fetch origin "$BRANCH" --quiet 2>/dev/null || continue
    git merge --ff-only "origin/$BRANCH" --quiet 2>/dev/null || continue
    after="$(git rev-parse HEAD)"
    if [[ "$before" != "$after" ]]; then
      echo "[sync] yeni sürüm alındı: ${before:0:7} → ${after:0:7}"
      if ! git diff --quiet "$before" "$after" -- package-lock.json 2>/dev/null; then
        echo "[sync] bağımlılıklar değişti → npm install çalışıyor…"
        npm install --no-audit --no-fund
      fi
    fi
  done
) &
SYNC_PID=$!
trap 'kill "$SYNC_PID" 2>/dev/null || true' EXIT

npm run dev
