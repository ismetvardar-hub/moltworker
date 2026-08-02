---
name: stop-slop
description: Remove dead code, half-features, and AI junk before ship.
---

# Stop Slop (runtime quality gate)

Yayın öncesi temizle:

- Kullanılmayan import / export
- `console.log` debug kalıntısı
- Yorum satırına alınmış yarım kod
- “ileride belki” soyutlamaları
- Kopyala-yapıştır tekrarlar
- Sahte TODO / FIXME birikimi

Kapı: `npm run gate` (typecheck + slop tarama + mühür kontrolü).
