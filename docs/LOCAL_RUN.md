# LİKYA paneli — çalıştırma kontrol listesi

## Önemli ayrım

| Ortam | Adres | Kim çalıştırır? |
|--------|--------|------------------|
| Cloud agent VM | `http://localhost:5173` **yalnızca o VM içinde** | Ajan / `npm run dev` |
| Senin Mac’in | `http://localhost:5173` (veya 5175) | Senin terminalin |

Cloud ajanın `localhost`’u senin bilgisayarının `localhost`’u **değildir**. Mac’te sayfa açılmıyorsa panel orada başlatılmamış demektir.

## Mac’te çalıştır

```bash
cd ~/moltworker   # veya repo klasörün
git fetch origin
git checkout cursor/olympospass-ceo-panel-f59e
git pull origin cursor/olympospass-ceo-panel-f59e
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Tarayıcı: http://localhost:5173

Giriş: `ceo` / `likya2026`

## Port doluysa

```bash
lsof -i :5173
npm run dev -- --host 0.0.0.0 --port 5175
```

## Sağlık kontrolü

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
```

## Sık hatalar

1. Wrong directory — `package.json` görünmeli.
2. Eski dal — `git pull` şart.
3. Ollama şart değil; AI simülasyonda da panel açılır.
4. Cloud preview Mac localhost değildir.
