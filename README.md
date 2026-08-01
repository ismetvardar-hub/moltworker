# OlymposPass Ekosistemi & LİKYA CEO Paneli

Vite + React + TypeScript + Tailwind CSS ile geliştirilmiş modern yönetim paneli.

## Modüller

| Modül | Açıklama |
|-------|----------|
| **LİKYA CEO Komuta Merkezi** | Sistem durumu kartları + talimatları **gerçek Ollama modeline** gönderip yanıtı canlı akışla gösteren otonom talimat ekranı (Ollama kapalıysa simülasyon moduna düşer) |
| **Yerel AI (Ollama Entegrasyonu)** | `http://localhost:11434` üzerindeki Ollama sunucusuyla haberleşir; modelleri (`deepseek-coder`, `qwen2.5`, `llama3`) listeler ve durum kontrolü yapar |
| **IT & AI Ajanlar Paneli** | LİKYA Holding otonom filosu: 28 uzman ajan, 9 stratejik departman; seçilen departmanın ajan kadrosu ve canlı üretim akışı daktilo efektiyle izlenir |
| **OlymposPass Yönetim Paneli** | Kullanıcı geçişleri, erişim yetkileri ve kart/kod doğrulama modülü |
| **Daze Chef (Mutfak Paneli)** | 120 sn teslim geri sayımı (2 dk kuralı → termal koruma), reçete hazırlama adımları ve HEPHAESTUS canlı stok düşüş terminali |
| **Daze Crew (Personel Portalı)** | Saatlik kazanç hesaplayıcı (taban + performans primi), canlı görev listesi ve DAZE-CREW/SOCRATES performans-centilmenlik puanlama kartları |
| **Daze Vision (Müşteri Portalı)** | MINT canlı talep yoğunluğu matrisi (`/api/mint/demand`) ile dinamik borsa, Daze-Gift ikram simülatörü ve Yaşam Koçu |
| **NEXUS IoT Komuta** | Turnike / kapı röle / RFID protokolü (`/api/nexus/*`); unlock/lock/pulse/scan; opsiyonel canlı ESP32 köprüsü |
| **Daze Hub** | Merkezi operasyon özeti — arşiv / WhatsApp / NEXUS sayaçları ve son olaylar |
| **Rol tabanlı giriş** | CEO / kitchen / crew demo hesapları; sayfa erişimi role göre kısıtlanır |

## Kurulum

```bash
npm install
npm run dev
```

Uygulama varsayılan olarak [http://localhost:5173](http://localhost:5173) adresinde açılır.

### Otomatik Eşitlemeli Önizleme (dev:sync)

Bulut ajanı geliştirmeye devam ederken önizlemenizin **kendi kendine güncel kalmasını** istiyorsanız `npm run dev` yerine şunu kullanın:

```bash
npm run dev:sync
```

Bu komut Vite sunucusunu başlatır ve arka planda her 20 saniyede bir uzak daldaki yeni commit'leri çeker; Vite değişiklikleri anında tarayıcıya yansıtır. Bağımlılık değiştiyse `npm install` otomatik çalışır. Yerel düzenlenmemiş dosyanız varsa eşitleme o turu atlar (çalışmanızı ezmez). Kontrol aralığı: `SYNC_INTERVAL=10 npm run dev:sync`.

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

### LİKYA-1 Orkestrasyonu ve Master Kural

Her talimat, gönderildiği anda LİKYA-1'in anahtar kelime tabanlı dağıtım matrisinden geçer ve ilgili ajanlara alt görev olarak bölünür. Örneğin *"OlymposPass için Rusça ve Almanca lansman postu ve görseli hazırla"* talimatı KALYPSO (metin), BABEL (çeviri) ve ARTE (görsel) ajanlarına dağıtılır; dağılım, talimat akışında rozetler halinde görünür.

**Master Kural:** ETHOS (Ahlak & Nezaket Muhafızı), her dağıtıma otomatik eklenir ve tüm çıktıların "Centilmenlik, Naiflik ve Esprili Üslup" ilkelerine uymasını denetler. Dağıtım mantığı `src/services/orchestrator.ts`, ajan kadrosu `src/data/agents.ts` dosyasındadır.

### Ajanlar Arası Üretim Zinciri (Task Chaining)

Dağıtım artık sıralı bir **üretim zinciri** olarak çalışır: her ajanın çıktısı bir sonraki ajana girdi olarak devredilir. Örneğin *"OlymposPass için Almanca lansman metni hazırla"* talimatı şu zinciri kurar:

1. **KALYPSO** (llama3) — Türkçe lansman metnini üretir
2. **BABEL** (qwen2.5) — metni kültürel bağlamı koruyarak Almancaya çevirir
3. **ETHOS** (llama3) — Master Kural denetimi yapıp "ONAY ✓" verir

Zincir, Komuta Merkezi'ndeki **"Ajanlar Arası Üretim Zinciri"** kartında adım adım canlı akar; hangi ajanın ne zaman çıktı üretip devrettiği izlenebilir. Zincir sıralaması: istihbarat (HERODOT) → üreticiler → dönüştürücüler (BABEL) → denetçiler (ETHOS).

### HERODOT — Canlı Web Araştırma Modülü (AŞAMA 1)

Araştırma içeren talimatlar (örn. *"Avrupa'daki turnikesiz geçiş sistemlerini incele"*) HERODOT'a yönlendirilir:

1. Vite middleware `GET /api/search?q=...` üzerinden canlı arama yapılır (`server/search-proxy.js`)
2. Sağlayıcı sırası: **Brave Search** (`BRAVE_SEARCH_API_KEY`) → **Tavily** (`TAVILY_API_KEY`) → **DuckDuckGo HTML** (anahtarsız) → yerleşik fallback havuz
3. Kaynaklar (başlık, URL, snippet) Ollama'ya bağlam olarak beslenir; analist raporu üretilir
4. Raporun altında **"Canlı Web Kaynakları"** tıklanabilir listesi gösterilir

Bağımsız proxy: `npm run search-proxy` (port 8787). Anahtar örnekleri: `.env.example`.

### Talimat Hafızası & Zincir Arşivi (AŞAMA 2)

Tamamlanan (veya hata alan) her üretim zinciri `localStorage` içinde saklanır (`src/services/archive.ts`):

- Komuta Merkezi altındaki **Talimat Hafızası & Zincir Arşivi** panelinden geçmiş görevler listelenir
- Metin / ajan / durum filtreleri
- Tek kayıt veya tüm filtre sonucu için **JSON dışa aktarma**
- Kaydı açıp adım çıktılarını ve HERODOT kaynaklarını yeniden görüntüleme
- "Bu zinciri üretim kartında yeniden görüntüle" ile aktif pipeline paneline geri yükleme

### Dış Dünya Entegrasyonları (AŞAMA 3)

Vite middleware (`server/integrations.js`):

| Uç nokta | Amaç |
|----------|------|
| `POST /api/whatsapp/send` | REMINDER-AI — Twilio → Meta Graph → mock |
| `GET /api/whatsapp/log` | Son gönderilen mesajlar |
| `GET /api/mint/demand` | MINT canlı talep yoğunluğu + dinamik fiyatlar |
| `GET /api/nexus/devices` | IoT cihaz envanteri |
| `POST /api/nexus/command` | unlock / lock / pulse / scan / status |
| `GET /api/nexus/events` | Protokol olay günlüğü |

Daze Chef hazır/termal geçişlerinde otomatik WhatsApp; Daze Vision fiyatları MINT matrisinden akar; NEXUS sekmesinden cihaz komutları gönderilir. Anahtarlar: `.env.example`.

### Platform — Auth, Kalıcı Depo & Daze Hub (AŞAMA 4)

Dosya tabanlı JSON depo (`server/store.js` → `data/*.json`), hafif Bearer token oturumu (`server/auth.js`) ve Hub özeti (`server/platform.js`).

#### Demo hesaplar

| Kullanıcı | Şifre | Rol | Erişim |
|-----------|-------|-----|--------|
| `ceo` | `likya2026` | ceo | Tüm paneller |
| `chef` | `daze123` | kitchen | Hub, Chef, NEXUS |
| `crew` | `crew123` | crew | Hub, Crew, OlymposPass, Vision |

#### API

| Uç nokta | Amaç |
|----------|------|
| `POST /api/auth/login` | Giriş → token + kullanıcı |
| `GET /api/auth/me` | Oturum doğrula |
| `POST /api/auth/logout` | Çıkış |
| `GET /api/auth/demo-users` | Demo hesap listesi |
| `GET/POST /api/archive` | Kalıcı zincir arşivi (localStorage ile birlikte senkron) |
| `GET /api/hub/summary` | Daze Hub operasyon özeti |

`data/` dizini git’e eklenmez. WhatsApp ve NEXUS logları da aynı depoya yazılır.

### Platform Operasyonları (AŞAMA 5)

| Özellik | Açıklama |
|---------|----------|
| **Platform Ayarları** | CEO-only UI → `data/settings.json`; anahtarlar çalışma zamanında `process.env` üzerine uygulanır |
| **Audit günlüğü** | Login, arşiv, WhatsApp, NEXUS, ayar değişiklikleri (`GET /api/audit`) |
| **Canlı filo** | Daze Hub’da 28 ajanın arşiv bazlı aktif/beklemede durumu |

| Uç nokta | Amaç |
|----------|------|
| `GET/POST /api/settings` | Maskelenmiş ayarlar (CEO) |
| `GET /api/audit` | Operasyon izleri |

### Görev Kuyruğu (AŞAMA 6)

5 sn ticker ile `dueAt` geçmiş işler otomatik çalışır.

| Tür | Açıklama |
|-----|----------|
| `whatsapp.reminder` | Zamanlanmış REMINDER-AI mesajı |
| `directive.queue` | Komuta talimat kuyruğu (`ready` durumu) |

| Uç nokta | Amaç |
|----------|------|
| `GET/POST /api/jobs` | Listele / oluştur |
| `POST /api/jobs/:id/run` | Hemen çalıştır |
| `POST /api/jobs/:id/cancel` | İptal |
| `POST /api/jobs/tick` | Manuel tick (CEO) |
| `POST /api/jobs/:id/claim` | Hazır talimatı Komuta’ya teslim et |
| `GET /api/events?token=` | SSE canlı olay akışı |

### Kuyruk → Komuta & SSE (AŞAMA 7)

- Hazır `directive.queue` görevleri Komuta Merkezi’nde listelenir
- **Taslağa Al** / **Al & Çalıştır** veya Hub’dan **Komuta’ya Al**
- Audit ve operasyon olayları SSE ile Hub/Komuta canlı feed’ine akar

### Operasyon Raporu & ETHOS (AŞAMA 8)

| Uç nokta | Amaç |
|----------|------|
| `GET /api/report` | JSON operasyon raporu + ETHOS skoru |
| `GET /api/report?format=markdown` | Markdown indirme |

Rapor & ETHOS sayfasından JSON/Markdown dışa aktarma.

### Production & Docker (AŞAMA 9)

```bash
npm run build && npm start          # http://localhost:4173
docker compose up --build           # data volume ile
```

Oturumlar `data/sessions.json` içinde kalıcıdır (sunucu restart sonrası geçerli).

### Tesisler · Ops · Bildirimler (AŞAMA 10–12)

| Aşama | Özellik |
|-------|---------|
| **10** | Çoklu tesis (`/api/venues`), NEXUS cihazlarında `venueId` filtresi |
| **11** | `GET /api/health`, `GET /api/ops/backup`, `POST /api/ops/restore` |
| **12** | Bildirim merkezi (`/api/notifications`), SSE ile canlı gelen kutusu |

### Geçiş · Saha · Metrikler (AŞAMA 13–15)

| Aşama | Özellik |
|-------|---------|
| **13** | OlymposPass geçiş motoru (`/api/pass/*`) — kapı yetkisi + NEXUS pulse |
| **14** | Saha Modu — tablet UI, offline WhatsApp/görev kuyruğu |
| **15** | Gözlemlenebilirlik (`/api/metrics`) — zincir/geçiş/WA başarı oranları |

### Marka · CRM · PWA (AŞAMA 16–18)

| Aşama | Özellik |
|-------|---------|
| **16** | Marka/kiracı (`/api/brands`) + sidebar marka seçici / modül süzgeci |
| **17** | Misafir CRM (`/api/guests`) — pass + WA + geçiş zaman çizelgesi |
| **18** | PWA — `manifest.webmanifest` + shell service worker |

### Güvenlik · Playbook · Webhook (AŞAMA 19–21)

| Aşama | Özellik |
|-------|---------|
| **19** | API rate limit + güvenlik başlıkları (`X-RateLimit-*`, CSP) |
| **20** | Komuta playbook şablonları (`/api/playbooks`) |
| **21** | Outbound webhooks (`/api/webhooks`) + delivery log |

### OpenAPI · Envanter · Vardiya (AŞAMA 22–24)

| Aşama | Özellik |
|-------|---------|
| **22** | OpenAPI sözleşmesi (`GET /api/openapi.json`, `GET /api/docs`) + Docs paneli |
| **23** | HEPHAESTUS stok envanteri (`/api/inventory`, `/api/inventory/adjust`) |
| **24** | Crew vardiya planı (`/api/shifts` CRUD) |

### LİKYA Holding Ajan Kadrosu (28 ajan · 9 departman)

| Departman | Ajanlar |
|-----------|---------|
| **C-Suite & Stratejik Komuta** | LİKYA-1 (CEO Orchestrator), DAZE-HUB (Merkezi Beyin & Borsa), ETHOS (Ahlak & Nezaket Muhafızı) |
| **Teknoloji, Bulut & Yazılım** | ATLAS (Backend), PHASELIS (Web), OLYMPOS-MOBILE (Mobil), CHIMERA (DevSecOps), NEXUS (IoT & Donanım) |
| **Satın Alma, Depo & Stok** | AGORA (Tedarik), HEPHAESTUS (Depo & Stok), LOGOS (Lojistik & Soğuk Zincir) |
| **Hukuk, Uyum & Risk** | THEMIS (Hukuk), VALKYRIE (KVKK & GDPR), VERITAS (Marka & Telif) |
| **Satış, İş Geliştirme & CRM** | HERMES-SALES (B2B), DAZE-VISION (Müşteri Deneyimi), REMINDER-AI (WhatsApp), AURA (Sadakat & Daze-Gift) |
| **Kreatif, Medya & Pazarlama** | ARTE (Görsel), PROMETHEUS (Video), KALYPSO (Storyteller), BABEL (Lokalizasyon) |
| **İnsan Kaynakları & Operasyon** | DAZE-CREW (Personel Portalı), SOCRATES (Nezaket Akademisi) |
| **Finans, Fiyatlandırma & Borsa** | PLUTUS (Bütçe & API Harcama), MINT (Borsa Algoritması) |
| **AR-GE & Pazar İstihbaratı** | HERODOT (Rakip İstihbaratı), ODYSSEUS (Yeni AI Teknolojileri) |

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusunu başlatır (Vite) |
| `npm run build` | Tip kontrolü + üretim derlemesi |
| `npm run preview` | Üretim derlemesini yerelde önizler (yalnızca statik) |
| `npm start` | Production sunucu (`dist/` + tüm `/api/*`) |
| `npm run typecheck` | Yalnızca TypeScript tip kontrolü |

## Teknolojiler

- [Vite 8](https://vitejs.dev) — derleme ve geliştirme sunucusu
- [React 19](https://react.dev) — arayüz
- [Tailwind CSS 4](https://tailwindcss.com) — stil
- [Lucide](https://lucide.dev) — ikonlar
- TypeScript (strict mode)
