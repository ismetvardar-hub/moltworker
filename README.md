# OlymposPass Ekosistemi & LİKYA CEO Paneli

Vite + React + TypeScript + Tailwind CSS ile geliştirilmiş modern yönetim paneli.

## Modüller

| Modül | Açıklama |
|-------|----------|
| **LİKYA CEO Komuta Merkezi** | Sistem durumu kartları + talimatları **gerçek Ollama modeline** gönderip yanıtı canlı akışla gösteren otonom talimat ekranı (Ollama kapalıysa simülasyon moduna düşer) |
| **Yerel AI (Ollama Entegrasyonu)** | `http://localhost:11434` üzerindeki Ollama sunucusuyla haberleşir; modelleri (`deepseek-coder`, `qwen2.5`, `llama3`) listeler ve durum kontrolü yapar |
| **IT & AI Ajanlar Paneli** | 12 ajanlık, 3 departmanlı otonom filo (Core IT, Creative & Social, Global & Ops); her departmanın canlı üretim akışı daktilo efektiyle izlenir |
| **OlymposPass Yönetim Paneli** | Kullanıcı geçişleri, erişim yetkileri ve kart/kod doğrulama modülü |

## Kurulum

```bash
npm install
npm run dev
```

Uygulama varsayılan olarak [http://localhost:5173](http://localhost:5173) adresinde açılır.

## Ollama Entegrasyonu

Yerel AI panelinin çalışması için makinenizde [Ollama](https://ollama.com) kurulu ve çalışıyor olmalıdır:

```bash
# Sunucuyu başlat (tarayıcı erişimi için CORS izni ile)
OLLAMA_ORIGINS=* ollama serve

# Hedef modelleri indir
ollama pull deepseek-coder
ollama pull qwen2.5
ollama pull llama3
```

Ollama çalışmıyorsa panel bunu "Çevrimdışı" olarak gösterir; uygulamanın geri kalanı normal çalışmaya devam eder.

### Canlı AI Komuta Akışı

Komuta Merkezi'ndeki talimatlar, Ollama çevrimiçiyse seçili modele `POST /api/generate` (stream) ile gönderilir ve yanıt token token "AI Yanıtı" terminaline yazılır. Akış sırasında **Durdur** düğmesiyle üretim iptal edilebilir. Model seçici, sunucuda yüklü modelleri otomatik listeler ve varsayılan olarak hedef modellerden ilk yüklü olanı seçer.

### LİKYA-1 Orkestrasyonu

Her talimat, gönderildiği anda LİKYA-1'in anahtar kelime tabanlı dağıtım matrisinden geçer ve ilgili ajanlara alt görev olarak bölünür. Örneğin *"OlymposPass için Rusça ve Almanca lansman postu ve görseli hazırla"* talimatı KALYPSO (metin), BABEL (çeviri), ARTE (görsel) ve HERMES (paylaşım) ajanlarına dağıtılır; dağılım, talimat akışında rozetler halinde görünür. Dağıtım mantığı `src/services/orchestrator.ts` dosyasındadır.

### Ajan Kadrosu (12 ajan · 3 departman)

| Departman | Ajanlar |
|-----------|---------|
| **Yazılım & Sistem (Core IT)** | ATLAS (Backend & Mimari), PHASELIS (Web App), OLYMPOS-MOBILE (Mobil), CHIMERA (Güvenlik & QA) |
| **Medya & İçerik (Creative & Social)** | ARTE (Görsel & Tasarım), PROMETHEUS (Video & Motion), HERMES (Sosyal Medya), KALYPSO (Kreatif Metin) |
| **Dil, Operasyon & Analiz (Global & Ops)** | BABEL (Lokalizasyon), LİKYA-1 (Orchestrator), HERMES-COMM (WhatsApp & Bildirim), MINOS (Veri & Analiz) |

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusunu başlatır (Vite) |
| `npm run build` | Tip kontrolü + üretim derlemesi |
| `npm run preview` | Üretim derlemesini yerelde önizler |
| `npm run typecheck` | Yalnızca TypeScript tip kontrolü |

## Teknolojiler

- [Vite 8](https://vitejs.dev) — derleme ve geliştirme sunucusu
- [React 19](https://react.dev) — arayüz
- [Tailwind CSS 4](https://tailwindcss.com) — stil
- [Lucide](https://lucide.dev) — ikonlar
- TypeScript (strict mode)
