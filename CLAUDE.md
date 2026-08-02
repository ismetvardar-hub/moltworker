# CLAUDE.md — LİKYA Holding Quality Gates (mühürlü)

Bu dosya Cursor / Claude Code / VSCodium ajanları için **zorunlu** çalışma anayasasıdır.
Mevcut yazılımı koru; hız için kısa yol = kaliteyi düşürmek değildir.

## 0) Dokunulmazlar

Aşağıdakilere **KESİNLİKLE DOKUNMA** (refactor / “temizlik” dahil):

- Daze Hub, Daze Mind, Daze Crew, Daze Vision, Daze Chef, Daze-Reminder sayfa/servisleri
- Antalya Extreme Park / GymBul (`src/pages/ExtremeParkPage.tsx`, `server/extremepark.js`)
- `server/events.js`, `server/integrations.js`

## 1) ETHOS Master Kuralı

`Centilmenlik · Naiflik · Esprili Üslup`

- İletişim dili sade, naif, zarif esprili
- Küfürlü / kaba espri **engellenir**
- Skill: `skills/ethos-voice/SKILL.md`

## 2) AI runtime (ücretsiz hibrit)

Tüm çıkarım:

```
src/services/aiProvider.ts
  ├─ Ollama localhost (DeepSeek / Qwen / llama)
  └─ Groq Free API (VITE_GROQ_API_KEY varsa yedek)
```

Web gözü: Agent Reach → `.agents/agent-reach.md` + `src/services/agentReach.ts`  
(Jina `r.jina.ai`, `gh`, Reddit JSON, `yt-dlp` — 0 TL)

## 3) Slash komutları (SDLC)

| Komut | Kapı |
|-------|------|
| `/spec` | Spec before code |
| `/plan` | Atomic tasks |
| `/build` | Thin slices |
| `/test` | TDD + smoke/e2e |
| `/review` | Security + stop-slop |
| `/code-simplify` | Clarity over cleverness |
| `/webperf` | Measure before optimize |
| `/ship` | `npm run gate` → commit → push |

Skills pack: **24** (`skills/README.md`)

Kaynak: `.agents/commands/*` · `skills/*` · kök `SKILL.md`

## 4) Strict Quality Gates (Stop Slop)

Yayın / push öncesi **zorunlu**:

```bash
npm run doctor:reach   # Agent Reach kanal sağlığı
npm run gate           # typecheck + mühür + slop tarama
npm run build          # tsc --noEmit && vite build
```

Gate başarısızsa ship yok.

Kontrol listesi:

1. TypeScript strict — yeni `any` salgını yok
2. Kullanılmayan import / ölü kod yok
3. Secret / API key commit yok
4. Mühürlü dosya diff’i yok
5. ETHOS metin ihlali yok
6. Test/smoke ihtiyacı olan değişiklikte kanıt var

## 5) Git

- Branch: `cursor/<name>-f59e`
- Base: `main`
- `tsconfig.tsbuildinfo` commit etme
- Demo: `ceo` / `likya2026`

## 6) Referans açık kaynak

- Agent Reach — Panniantong/agent-reach
- Agent Skills — addyosmani/agent-skills
- Everything Claude Code kalıpları — komut + context şablonları
- Stop Slop — runtime öncesi kalite kapıları

## 7) Hızlı başlangıç (sohbet)

```
Mevcut kodu koruyarak /plan ile dilimle; Agent Reach ile araştır;
aiProvider üzerinden üret; npm run gate && npm run build; /ship.
```
