#!/usr/bin/env bash
# LİKYA Stop-Slop / Quality Gate — yayın öncesi
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> [gate] TypeScript"
npm run typecheck

echo "==> [gate] Sealed files must not be dirty"
SEALED=(
  "server/events.js"
  "server/integrations.js"
)
DIRTY=0
for f in "${SEALED[@]}"; do
  if ! git diff --quiet -- "$f" 2>/dev/null || ! git diff --cached --quiet -- "$f" 2>/dev/null; then
    echo "FAIL: sealed file modified: $f"
    DIRTY=1
  fi
done
if [[ "$DIRTY" -ne 0 ]]; then
  exit 1
fi
echo "OK sealed clean"

echo "==> [gate] Stop-slop quick scan (staged/unstaged TS/TSX)"
# Debug leftover console.log in newly touched pages (warn only for services noise)
HITS="$(git diff --name-only HEAD 2>/dev/null | grep -E '\\.(ts|tsx)$' || true)"
if [[ -n "${HITS}" ]]; then
  while IFS= read -r file; do
    [[ -f "$file" ]] || continue
    if grep -nE 'console\\.(log|debug)\\(' "$file" >/dev/null 2>&1; then
      # allow listed debug panels
      case "$file" in
        src/pages/CommandCenter.tsx|src/pages/OllamaPanel.tsx|src/services/research.ts) ;;
        *)
          echo "WARN: console.log in $file — stop-slop review"
          ;;
      esac
    fi
  done <<< "$HITS"
fi

echo "==> [gate] Agent stack present"
test -f SKILL.md
test -f CLAUDE.md
test -f .agents/agent-reach.md
test -f src/services/aiProvider.ts
test -f src/services/agentReach.ts
SKILL_COUNT="$(find skills -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
if [[ "$SKILL_COUNT" -lt 24 ]]; then
  echo "FAIL: expected >=24 skills, found $SKILL_COUNT"
  exit 1
fi
echo "OK agent stack ($SKILL_COUNT skills)"

echo "==> [gate] doctor:reach (warn-only)"
if bash scripts/agent-reach-doctor.sh >/tmp/likya-doctor-reach.log 2>&1; then
  echo "OK doctor:reach"
else
  echo "WARN doctor:reach reported issues (non-fatal)"
  tail -5 /tmp/likya-doctor-reach.log || true
fi

echo "==> [gate] localhost (warn-only if down)"
if bash scripts/localhost-watchdog.sh >/tmp/likya-localhost-watch.log 2>&1; then
  echo "OK localhost watchdog"
else
  echo "WARN localhost not serving (dev/prod) — non-fatal in gate"
  tail -8 /tmp/likya-localhost-watch.log || true
fi

echo "GATE_OK"
