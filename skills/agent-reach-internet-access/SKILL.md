---
name: agent-reach-internet-access
description: >
  Free internet eyes — Jina Reader, gh, Reddit JSON, yt-dlp. Zero paid API.
---

# Agent Reach Internet Access

Playbook: `.agents/agent-reach.md`  
Runtime: `src/services/agentReach.ts`

## Quick recipes

```bash
# Web → Markdown
curl -sL "https://r.jina.ai/https://example.com"

# GitHub
gh repo view owner/repo --json name,description,stargazerCount

# Reddit
curl -sL "https://www.reddit.com/r/typescript/hot.json?limit=5" -H "User-Agent: likya-agent-reach/1.0"

# YouTube meta
yt-dlp --skip-download --print "%(title)s | %(channel)s" "URL"
```

Bulguları AI’ye beslerken `aiProvider.streamChat` kullan; uydurma kaynak ekleme.
