---
name: debugging-and-error-recovery
description: Reproduce, isolate, fix, prove — no blind retries.
---

# Debugging & Error Recovery

1. Hatayı yeniden üret
2. En dar dosyayı bul
3. Tek nedenli düzelt
4. `npm run gate` / ilgili smoke
5. Flaky e2e: önce kök neden (agent queue vb.), kör retry değil
