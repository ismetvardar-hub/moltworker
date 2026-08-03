# Release notes — CEO menü / Hibrit AI / prod (dal `cursor/ceo-tabs-runtime-fix-f59e`)

Ajan: https://cursor.com/agents/bc-252b4ae8-c959-4e7a-b424-93d477a6f59e

## Özet

Panel sekmeleri CEO’da yeniden kullanılabilir; kitchen/crew menüleri boş hub göstermez; giriş paketi küçüldü; production + e2e yeşil.

## Kullanıcıya yansıyan

- CEO varsayılan marka: **LİKYA Holding** (menü boğulmaz)
- Domain accordion yalnızca **açılırken** sayfa değiştirir
- Mutfak / saha için ayrı çekirdek + domain menü
- Hibrit AI: Ollama → Groq → simülasyon
- Production PWA: SW v2, HTML network-first
- Yetkisiz sekme uyarısı + ErrorBoundary

## Komutlar

| Komut | Ne yapar |
|--------|-----------|
| `npm run doctor:reach` | Reach + Ollama/Groq durumu |
| `npm run gate` | Typecheck + sealed + 24 skill |
| `npm run verify` | gate + campus smoke |
| `npm run smoke:prod` | prod login/heal/PWA |
| `npm run e2e:campus` | tam HTTP e2e |
| `npm run verify:full` | yukarıdakilerin zinciri |
| `npm run backup -- "not"` | tar.gz + artifact + tag |

## Bu ajan doğrulaması

- `gate` ✓
- `smoke:prod` ✓ (campus 100, heal ok)
- `e2e:campus` ✓ (`ok: true`, heal 65→100)
- Backup tag: `backup/20260803T055750Z` (örnek)

## Mac’te merge sonrası

```bash
git fetch origin
git checkout main   # merge sonrası
git pull
npm install
npm run verify
npm run dev -- --host 0.0.0.0 --port 5173
```

Detay: [DEPLOY.md](./DEPLOY.md)

## Dokunulmaz

`server/events.js`, `server/integrations.js`, Daze* / Extreme Park ürün yüzeyleri (bilinçli değişiklik yok).
