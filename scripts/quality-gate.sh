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
echo "OK agent stack"

echo "GATE_OK"
