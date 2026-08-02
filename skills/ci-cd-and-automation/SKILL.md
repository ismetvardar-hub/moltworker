---
name: ci-cd-and-automation
description: Local gates before push; keep campus smoke/e2e green.
---

# CI/CD & Automation

```bash
npm run gate
npm run build
npm run smoke:campus   # API değiştiyse
npm run e2e:campus
bash scripts/backup-likya.sh "note"
```

Branch: `cursor/<name>-f59e` → push → PR.
