---
name: likya-master-skill
description: >
  LİKYA Holding / OlymposPass ajan orkestrasyonu. Agent Reach (ücretsiz web),
  Addy Osmani agent-skills kalite kapıları, ETHOS üslup ve Ollama+Groq hibrit AI.
---

# LİKYA Master Skill

Bu repo, mevcut CEO paneli kodunu **kırılmadan** açık kaynak ajan yetenekleriyle güçlendirir.

## Kaynaklar (ücretsiz)

| Kaynak | Katkı | Yerel adaptasyon |
|--------|--------|------------------|
| [Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) | 0 TL web/X/Reddit/GitHub/YouTube okuma | `.agents/agent-reach.md`, `skills/agent-reach-internet-access/` |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | Spec→Plan→Build→Test→Ship kalite | `skills/*`, `.agents/commands/*` |
| Everything Claude Code kalıpları | Komut + context şablonları | `CLAUDE.md`, `.agents/` |
| Stop Slop / quality gates | Yayın öncesi tip/güvenlik/TDD kapıları | `scripts/quality-gate.sh`, `skills/stop-slop/` |

## Slash komutları

| Komut | Dosya | Ne yapar |
|-------|--------|----------|
| `/spec` | `.agents/commands/spec.md` | PRD / sınırlar — koddan önce |
| `/plan` | `.agents/commands/plan.md` | Atomik görevler |
| `/build` | `.agents/commands/build.md` | İnce dilimler, rollback dostu |
| `/test` | `.agents/commands/test.md` | TDD / smoke / e2e |
| `/ship` | `.agents/commands/ship.md` | Gate → commit → push kontrol listesi |
| `/review` | `.agents/commands/review.md` | Güvenlik + kalite + stop-slop |
| `/code-simplify` | `.agents/commands/code-simplify.md` | Davranışı bozmadan sadeleştir |
| `/webperf` | `.agents/commands/webperf.md` | Ölç → sonra optimize et |

Skills: **24** adet → `skills/README.md`

## ETHOS (mühürlü)

- Dil: **sade · naif · esprili**
- Küfür / kaba espri: **yasak**
- Master kural: `Centilmenlik · Naiflik · Esprili Üslup`

## Dokunulmaz bileşenler

Aşağıdakilere **kesinlikle dokunma** (davranış/UX regressiyonu yok):

- Daze Hub, Daze Mind, Daze Crew, Daze Vision, Daze Chef, Daze-Reminder
- Antalya Extreme Park / GymBul (`ExtremeParkPage`, `server/extremepark.js`)
- Mühürlü sunucu: `server/events.js`, `server/integrations.js`

## AI runtime

Tüm çıkarım hibrit katmandan geçer:

- `src/services/aiProvider.ts` → Ollama (DeepSeek / Qwen) öncelik, Groq Free API yedek
- Mevcut `ollama.ts` durum/model listesi için korunur
- Web okuma: `src/services/agentReach.ts` + mevcut `research.ts`

## Hızlı doğrulama

```bash
npm run doctor:reach
npm run gate
npm run build
```

CEO panel: **Hibrit AI** (Ollama sayfası) + Komuta Merkezi HERODOT (Agent Reach derin okuma).
