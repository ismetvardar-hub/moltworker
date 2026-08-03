# LİKYA paneli — çalıştırma kontrol listesi

## Önemli ayrım

| Ortam | Adres | Kim çalıştırır? |
|--------|--------|------------------|
| Cloud agent VM | `http://localhost:5173` **yalnızca o VM içinde** | Ajan / `npm run dev` |
| Senin Mac’in | `http://localhost:5173` (veya 5175) | Senin terminalin |

Cloud ajanın `localhost`’u senin bilgisayarının `localhost`’u **değildir**. Mac’te sayfa açılmıyorsa panel orada başlatılmamış demektir.

## Mac’te geliştirme

```bash
cd ~/moltworker   # veya repo klasörün
git fetch origin
git checkout cursor/ceo-tabs-runtime-fix-f59e
git pull origin cursor/ceo-tabs-runtime-fix-f59e
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Tarayıcı: http://localhost:5173

| Rol | Kullanıcı | Şifre |
|-----|-----------|--------|
| CEO | `ceo` | `likya2026` |
| Mutfak | `chef` | `daze123` |
| Saha | `crew` | `crew123` |

## Hibrit AI (opsiyonel)

Ollama/Groq yoksa panel simülasyonda açılır.

```bash
ollama serve
ollama pull qwen2.5
# veya .env:
# VITE_GROQ_API_KEY=...
npm run doctor:reach
```

## Port doluysa

```bash
lsof -i :5173
npm run dev -- --host 0.0.0.0 --port 5175
```

## Sağlık kontrolü (dev)

```bash
curl -s http://127.0.0.1:5173/api/health | head
curl -s -X POST http://127.0.0.1:5173/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"ceo","password":"likya2026"}' | head
```

## Production

```bash
npm run build
npm start
# http://localhost:4173
BASE=http://127.0.0.1:4173 npm run smoke:prod
```

## Kalite / yayın sırası

Kısa: `npm run verify`  
Tam zincir: `npm run verify:full`  
Adım adım: [DEPLOY.md](./DEPLOY.md)

```bash
npm run gate
npm run smoke:campus
npm run e2e:campus
npm run backup -- "not"
```

## Sık hatalar

1. Wrong directory — `package.json` görünmeli.
2. Eski dal — `git pull` şart (`cursor/ceo-tabs-runtime-fix-f59e`).
3. Ollama şart değil; AI simülasyonda da panel açılır.
4. Cloud preview Mac localhost değildir.
5. Production’da `dist/` yoksa önce `npm run build`.
