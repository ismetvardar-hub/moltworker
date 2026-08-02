---
name: test-driven-development
description: Red-Green-Refactor; smoke/e2e as campus proof.
---

# Test-Driven Development

- Mantık değişikliği: önce beklenen davranışı yaz / assert et
- Kampüs API: `npm run smoke:campus`, `npm run e2e:campus`
- UI-only: en az `npm run build`
- Flaky testte önce nedeni anla; kör retry ile “yeşil” sayma
