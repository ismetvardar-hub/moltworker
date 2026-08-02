#!/usr/bin/env bash
# Agent Reach sağlık kontrolü — ücretsiz kanallar
set -euo pipefail

ok() { echo "OK  $1"; }
warn() { echo "WARN $1"; }
fail() { echo "FAIL $1"; }

echo "==> Agent Reach doctor (LİKYA)"

if command -v curl >/dev/null 2>&1; then ok "curl"; else fail "curl missing"; fi
if command -v gh >/dev/null 2>&1; then ok "gh CLI"; else warn "gh CLI missing (GitHub derin inceleme sınırlı)"; fi
if command -v yt-dlp >/dev/null 2>&1; then ok "yt-dlp"; else warn "yt-dlp missing (YouTube altyazı shell yolu kapalı)"; fi

echo "==> Jina Reader smoke"
if curl -fsSL --max-time 20 "https://r.jina.ai/https://example.com" | head -c 80 >/dev/null; then
  ok "Jina Reader reachable"
else
  warn "Jina Reader unreachable from this environment"
fi

echo "==> Repo skill files"
for f in SKILL.md CLAUDE.md .agents/agent-reach.md src/services/agentReach.ts src/services/aiProvider.ts; do
  if [[ -f "$f" ]]; then ok "$f"; else fail "$f missing"; fi
done

echo "DOCTOR_DONE"
