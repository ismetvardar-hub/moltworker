---
name: agent-reach
description: >
  0 TL maliyetle web, GitHub, Reddit, YouTube altyazı ve sayfa okuma.
  Agent Reach (Panniantong) mantığı — LİKYA HERODOT / Command Center ile uyumlu.
---

# Agent Reach — LİKYA Adaptasyonu

Amaç: Ajanın interneti **ücretsiz** görmesi. Ücretli API zorunlu değil.

## Sıfır maliyet kanallar

### 1) Web sayfası → Markdown (Jina Reader)

```bash
curl -sL "https://r.jina.ai/https://example.com"
```

Tarayıcı / Vite ortamında: `src/services/agentReach.ts` → `readUrlAsMarkdown(url)`.

### 2) GitHub (gh CLI)

```bash
gh repo view owner/repo
gh search repos "olympos pass turnstile" --limit 5
gh api repos/owner/repo/readme --jq .content | base64 -d | head
```

### 3) Reddit (public JSON)

```bash
curl -sL "https://www.reddit.com/r/reactjs/hot.json?limit=5" \
  -H "User-Agent: likya-agent-reach/1.0"
```

### 4) YouTube altyazı / meta (yt-dlp)

```bash
yt-dlp --skip-download --write-auto-sub --sub-lang en,tr \
  --print "%(title)s" "https://www.youtube.com/watch?v=VIDEO_ID"
```

### 5) V2EX / RSS

```bash
curl -sL "https://www.v2ex.com/api/topics/hot.json" -H "User-Agent: likya-agent-reach/1.0"
```

## Ne zaman kullan

- Rakip / kütüphane araştırması
- GitHub repo inceleme
- Trend taraması (Reddit hot)
- YouTube teknik video özeti
- Herhangi bir URL’yi Markdown olarak okuma

## Ne zaman kullanma

- Yazma / beğeni / yorum (salt okuma)
- Ücretli API anahtarı gerektiren kapalı uçlar (zorunlu değilse)
- Daze / Extreme Park ürün kodunu değiştirmek için “araştırayım” bahanesi

## LİKYA entegrasyon noktaları

| Katman | Dosya |
|--------|--------|
| Ajan skill | `skills/agent-reach-internet-access/SKILL.md` |
| Runtime helper | `src/services/agentReach.ts` |
| Mevcut arama | `src/services/research.ts` (`/api/search`) |
| AI çıkarım | `src/services/aiProvider.ts` |

## ETHOS

Bulguları CEO’ya iletirken: kısa, net, nazik. Uydurma kaynak yok; yalnızca okunan içerik.
