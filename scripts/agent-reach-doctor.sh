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

echo "==> Hibrit AI endpoints"
OLLAMA_URL="${OLLAMA_HOST:-http://127.0.0.1:11434}"
if curl -fsS --max-time 3 "$OLLAMA_URL/api/version" >/dev/null 2>&1; then
  ok "Ollama reachable ($OLLAMA_URL)"
else
  warn "Ollama offline ($OLLAMA_URL) — panel simülasyon / Groq yedek kullanır"
fi
if [[ -n "${VITE_GROQ_API_KEY:-}" ]]; then
  ok "VITE_GROQ_API_KEY set in environment"
elif [[ -f .env ]] && grep -qE '^VITE_GROQ_API_KEY=.+' .env 2>/dev/null; then
  ok "VITE_GROQ_API_KEY present in .env"
else
  warn "Groq key yok — .env içine VITE_GROQ_API_KEY ekle (ücretsiz: console.groq.com)"
fi

echo "DOCTOR_DONE"
