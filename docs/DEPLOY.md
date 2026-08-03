# LİKYA — sırayla yayın / doğrulama

Bu dal: `cursor/ceo-tabs-runtime-fix-f59e` → hedef `main`  
Dokunma: `server/events.js`, `server/integrations.js`, Daze* / Extreme Park ürün yüzeyleri.

## 0) PR’ı aç / birleştir

Cursor Cloud ajanında PR onayı bekleniyor olabilir (otomatik açılmıyorsa UI’dan **Create PR**).

- Dal: `cursor/ceo-tabs-runtime-fix-f59e`
- Base: `main`
- Notlar: [RELEASE_NOTES.md](./RELEASE_NOTES.md)

Merge sonrası:

```bash
git checkout main && git pull
bash scripts/post-merge.sh
```

## 1) Kod al

```bash
cd ~/moltworker
git fetch origin
git checkout cursor/ceo-tabs-runtime-fix-f59e
git pull origin cursor/ceo-tabs-runtime-fix-f59e
npm install
```

## 2) Geliştirme doğrula

```bash
npm run doctor:reach
npm run gate
npm run dev -- --host 0.0.0.0 --port 5173
```

Tarayıcı: http://localhost:5173  
Giriş: `ceo` / `likya2026` (mutfak `chef`/`daze123`, saha `crew`/`crew123`)

Kontrol: Komuta · Campusbrief · Hibrit AI · domain sekmeleri.

## 3) Kampüs duman

```bash
npm run smoke:campus
```

## 4) Production build + smoke

```bash
npm run build
npm start
# http://localhost:4173
BASE=http://127.0.0.1:4173 npm run smoke:prod
```

## 5) HTTP e2e (tam)

```bash
# dist güncel olmalı; script kendi 4177 portunda sunucu açar
npm run e2e:campus
```

Beklenen özet: `"ok": true`, `campus_score` / heal sağlıklı.

## 6) Yedek (çift)

```bash
npm run backup -- "pre-deploy-notu"
# → backups/*.tar.gz + /opt/cursor/artifacts/backups/ + git tag backup/<stamp>
```

## 7) Hibrit AI (opsiyonel prod)

```bash
ollama serve && ollama pull qwen2.5
# veya .env: VITE_GROQ_API_KEY=...  (build öncesi)
```

## Tek komut (gate + campus smoke)

```bash
npm run verify
```

Tam zincir (uzun): `npm run verify && npm run build && npm start & sleep 2 && npm run smoke:prod && npm run e2e:campus && npm run backup -- "verify-full"`
