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

### Rezervasyon · Sadakat · Olay (AŞAMA 25–27)

| Aşama | Özellik |
|-------|---------|
| **25** | Tesis rezervasyonları (`/api/reservations`) |
| **26** | AURA sadakat / Daze-Gift defteri (`/api/loyalty`) |
| **27** | Olay panosu — stok + görev + geçiş birleşik (`/api/incidents`) |

### Tedarik · NPS · Export (AŞAMA 28–30)

| Aşama | Özellik |
|-------|---------|
| **28** | AGORA tedarikçi & satınalma (`/api/suppliers`, `/api/purchase-orders`) |
| **29** | Misafir geri bildirim / NPS (`/api/feedback`) |
| **30** | CSV dışa aktarım merkezi (`/api/exports`) |

### KVKK · Duyuru · Reçete (AŞAMA 31–33)

| Aşama | Özellik |
|-------|---------|
| **31** | VALKYRIE KVKK onay günlüğü (`/api/consents`) |
| **32** | Holding duyuru panosu (`/api/announcements`) |
| **33** | Mutfak reçeteleri + stok düşüm (`/api/recipes`, `/cook`) |

### Operasyon sahası (AŞAMA 34–36)

| Aşama | Özellik |
|-------|---------|
| **34** | Açılış/kapanış kontrol listeleri (`/api/checklists`) |
| **35** | Kayıp eşya defteri (`/api/lost-found`) |
| **36** | Crew bahşiş havuzu (`/api/tips`) |

### Denetim · Bakım · Brief (AŞAMA 37–39)

| Aşama | Özellik |
|-------|---------|
| **37** | Denetim günlüğü paneli (`/api/audit`) |
| **38** | Bakım / arıza ticket (`/api/maintenance`) |
| **39** | Günlük operasyon brifi (`/api/brief`) |

### Menü · Kampanya · Sahada (AŞAMA 40–45)

| Aşama | Özellik |
|-------|---------|
| **40** | Menü kataloğu (`/api/menu`) |
| **41** | Kampanya / promo (`/api/campdesks`) |
| **42** | BABEL lokalizasyon notları (`/api/i18n`) |
| **43** | LOGOS soğuk zincir (`/api/coldchain`) |
| **44** | Vardiya teslim notları (`/api/handover`) |
| **45** | Kasa / till (`/api/cash`) |

### Varlık · Enerji · Eğitim (AŞAMA 46–48)

| Aşama | Özellik |
|-------|---------|
| **46** | Fiziksel varlık envanteri (`/api/assets`) |
| **47** | Enerji sayaç okumaları (`/api/energy`) |
| **48** | SOCRATES eğitim quiz (`/api/training`) |

### Sahada tamamlayıcılar · Checkpoint (AŞAMA 49–60)

| Aşama | Özellik |
|-------|---------|
| **49** | Vale / otopark (`/api/valet`) |
| **50** | Müzik istekleri (`/api/music`) |
| **51** | Belge kasası (`/api/documents`) |
| **52** | Tedarikçi skor kartı (`/api/vendor-scores`) |
| **53** | Fire / atık (`/api/waste`) |
| **54** | Oturma planı (`/api/seating`) |
| **55** | Bekleme listesi (`/api/waitlist`) |
| **56** | Şikayet kuyruğu (`/api/guestcases`) |
| **57** | Takdir / kudos (`/api/kudos`) |
| **58** | Çalışma saatleri (`/api/hours`) |
| **59** | Hava brifi (`/api/weather`) |
| **60** | Hazırlık skoru checkpoint (`/api/readiness`) |

### Genişleme · CEO Digest (AŞAMA 61–75)

| Aşama | Özellik |
|-------|---------|
| **61** | Spa / wellness |
| **62** | Etkinlik takvimi |
| **63** | Hediye kartları |
| **64** | Paket / teslimat |
| **65** | Temizlik görevleri |
| **66** | Çamaşırhane |
| **67** | WiFi kuponları |
| **68** | İçerik kuyruğu |
| **69** | Ekip nabız anketi |
| **70** | Bütçe kalemleri |
| **71** | Sözleşme yenileme |
| **72** | Pass medya stok |
| **73** | Mutfak KDS |
| **74** | Acil rehber |
| **75** | CEO Digest checkpoint |

### Misafir deneyimi · Board Pack (AŞAMA 76–90)

| Aşama | Özellik |
|-------|---------|
| **76–89** | Dolap · Kids Club · Şezlong · Transfer · Kart baskı · Toplantı · Medya · ESG · Alerjen · Şarap · Lounge · Shuttle · Partner · Gizli müşteri |
| **90** | Board Pack checkpoint (`/api/boardpack`) |

### Gelir · Uyum · War Room (AŞAMA 91–105)

| Aşama | Özellik |
|-------|---------|
| **91** | Concierge talepleri |
| **92** | Minibar ikmal |
| **93** | Misafir hesap / folio |
| **94** | Banket / düğün |
| **95** | Tur masası |
| **96** | Marina / bağlama |
| **97** | Hamam randevu |
| **98** | Havlu takibi |
| **99** | Günlük bileklik |
| **100** | HACCP kayıt |
| **101** | Güvenlik turu |
| **102** | Araç filosu |
| **103** | Bordro özeti |
| **104** | Flash rapor |
| **105** | War Room checkpoint (`/api/warroom`) |

### Gelir deneyimi · Night Audit (AŞAMA 106–120)

| Aşama | Özellik |
|-------|---------|
| **106** | Upsell teklifleri |
| **107** | OTA yorum kuyruğu |
| **108** | Grup rezervasyon |
| **109** | VIP notları |
| **110** | Fotoğraf çekim |
| **111** | Dalış aktivite |
| **112** | Bisiklet kiralama |
| **113** | Açık hava sinema |
| **114** | Butik satış |
| **115** | Pastane sipariş |
| **116** | Kahvaltı slot |
| **117** | Late checkout |
| **118** | Amenity ikram |
| **119** | Gece log |
| **120** | Night Audit checkpoint (`/api/nightly`) |

### Oda · Erişim · Orbit (AŞAMA 121–135)

| Aşama | Özellik |
|-------|---------|
| **121** | Oda kartı programlama |
| **122** | Oda durumu (HK) |
| **123** | Yatak / extra |
| **124** | Wake-up çağrı |
| **125** | Kargo / emanet |
| **126** | QR check-in |
| **127** | Misafir app push |
| **128** | Karaoke |
| **129** | Sanat duvarı |
| **130** | Çiçek sipariş |
| **131** | Özel şef |
| **132** | Mocktail bar |
| **133** | Promo kod |
| **134** | Şafak servisi |
| **135** | Orbit checkpoint (`/api/orbit`) |

### İK · Finans · Apex (AŞAMA 136–150)

| Aşama | Özellik |
|-------|---------|
| **136** | Haftalık roster |
| **137** | Mesai |
| **138** | Üniforma |
| **139** | Sağlık kartı |
| **140** | Ziyaretçi kayıt |
| **141** | CCTV log |
| **142** | Yangın tatbikat |
| **143** | Sigorta |
| **144** | Fatura |
| **145** | Vergi paketi |
| **146** | Gelir forecast |
| **147** | CAPEX |
| **148** | Ruhsat |
| **149** | SLA ihlal |
| **150** | Apex checkpoint (`/api/apex`) |

### Platform · Pyramid (AŞAMA 151–165)

| Aşama | Özellik |
|-------|---------|
| **151** | Harici bağlantı panosu (`extlinks`) |
| **152** | API anahtar |
| **153** | Yedek zamanlama |
| **154** | Sistem alarm |
| **155** | Bug tracker |
| **156** | Release notes |
| **157** | Runbook |
| **158** | Biyometrik log |
| **159** | Secret rotation |
| **160** | DNS check |
| **161** | Mail kuyruk |
| **162** | SMS kuyruk |
| **163** | Alert kuralları |
| **164** | Edge cache |
| **165** | Pyramid checkpoint (`/api/pyramid`) |

### Tesis altyapı · Signal Hub (AŞAMA 166–180)

| Aşama | Özellik |
|-------|---------|
| **166** | Dijital tabela |
| **167** | Wayfinding |
| **168** | Beacon harita |
| **169** | IoT kapı |
| **170** | Güç ops |
| **171** | Su ops |
| **172** | Yeşil ops |
| **173** | Haşere kontrol |
| **174** | Kimyasal log |
| **175** | Havuz ops |
| **176** | Sauna |
| **177** | Steam |
| **178** | Buz banyo |
| **179** | Recovery slot |
| **180** | Signal Hub checkpoint (`/api/signalhub`) |

### Leisure · Skyline (AŞAMA 181–195)

| Aşama | Özellik |
|-------|---------|
| **181** | Helipad |
| **182** | Jet ski |
| **183** | Yat charter |
| **184** | Surf school |
| **185** | Paddle / SUP |
| **186** | Tırmanma duvarı |
| **187** | Escape room |
| **188** | Arcade |
| **189** | Bowling |
| **190** | Bilardo |
| **191** | Poker masa |
| **192** | Trivia |
| **193** | DJ booth |
| **194** | Soundcheck |
| **195** | Skyline checkpoint (`/api/skyline`) |

### Güvenlik · Sentinel (AŞAMA 196–210)

| Aşama | Özellik |
|-------|---------|
| **196** | Yoğunluk |
| **197** | Kuyruk süresi |
| **198** | Kayıp çocuk |
| **199** | İlk yardım |
| **200** | AED kontrol |
| **201** | Tahliye tatbikat |
| **202** | Kalabalık kontrol |
| **203** | Telsiz log |
| **204** | Gate kuyruk |
| **205** | Bileklik scan |
| **206** | Face pass |
| **207** | Çanta kontrol |
| **208** | Metal dedektör |
| **209** | İzleme listesi |
| **210** | Sentinel checkpoint (`/api/sentinel`) |

### F&B · Horizon (AŞAMA 211–225)

| Aşama | Özellik |
|-------|---------|
| **211** | Menü board |
| **212** | Alerjen alarm |
| **213** | Sıcaklık probe |
| **214** | Prep kuyruk |
| **215** | Void log |
| **216** | Comp |
| **217** | Split bill |
| **218** | Açık tab |
| **219** | Corkage |
| **220** | Sommelier |
| **221** | Şef notu |
| **222** | Pass ticket |
| **223** | Zone heat |
| **224** | Rev pulse |
| **225** | Horizon checkpoint (`/api/horizon`) |

### Oda servis · Meridian (AŞAMA 226–240)

| Aşama | Özellik |
|-------|---------|
| **226** | Konaklama uzatma |
| **227** | Oda taşıma |
| **228** | Erken check-in |
| **229** | Bagaj |
| **230** | Turndown |
| **231** | Yastık menü |
| **232** | Oda kokusu |
| **233** | DND / MUR |
| **234** | Bornoz stok |
| **235** | Ütü talebi |
| **236** | Pressing |
| **237** | Ayakkabı boya |
| **238** | Bebek karyola |
| **239** | Pet stay |
| **240** | Meridian checkpoint (`/api/meridian`) |

### Finans · Ledger (AŞAMA 241–255)

| Aşama | Özellik |
|-------|---------|
| **241** | AR fatura |
| **242** | AP ödeme |
| **243** | Banka mutabakat |
| **244** | Döviz kur |
| **245** | Tip out |
| **246** | Depozito |
| **247** | İade |
| **248** | Chargeback |
| **249** | Hediye kullanım |
| **250** | Üyelik fatura |
| **251** | Rate plan |
| **252** | Channel manager |
| **253** | Overbooking |
| **254** | Yield kural |
| **255** | Ledger checkpoint (`/api/ledger`) |

### İK · People Hub (AŞAMA 256–270)

| Aşama | Özellik |
|-------|---------|
| **256** | Onboarding |
| **257** | Offboarding |
| **258** | Mülakat |
| **259** | Sertifika |
| **260** | Dil yetkinlik |
| **261** | Vardiya takas |
| **262** | İzin talebi |
| **263** | Yoklama |
| **264** | Performans |
| **265** | Ödül |
| **266** | El kitabı |
| **267** | İSG brifi |
| **268** | Near miss |
| **269** | Bildirim hattı |
| **270** | People Hub checkpoint (`/api/peoplehub`) |

### ESG · Ecosphere (AŞAMA 271–285)

| Aşama | Özellik |
|-------|---------|
| **271** | Karbon log |
| **272** | Su denetim |
| **273** | Hava kalite |
| **274** | Güneş enerji |
| **275** | Biyoçeşitlilik |
| **276** | Geri dönüşüm |
| **277** | Yeşil sertifika |
| **278** | Denetim bulgu |
| **279** | Politika onay |
| **280** | Veri koruma |
| **281** | Saklama politikası |
| **282** | Erişim gözden geçir |
| **283** | Tedarik risk |
| **284** | Legal hold |
| **285** | Ecosphere checkpoint (`/api/ecosphere`) |

### Marka · Brand Pulse (AŞAMA 286–300)

| Aşama | Özellik |
|-------|---------|
| **286** | Basın kiti |
| **287** | Influencer |
| **288** | UGC moderasyon |
| **289** | SEO denetim |
| **290** | Reklam harcama |
| **291** | Marka koruma |
| **292** | Storyboard |
| **293** | Canlı yayın |
| **294** | Podcast |
| **295** | Bülten |
| **296** | Hashtag harita |
| **297** | Sosyal inbox |
| **298** | Embargo |
| **299** | Kreatif talep |
| **300** | Brand Pulse checkpoint (`/api/brandpulse`) |

### AI · Cognisphere (AŞAMA 301–315)

| Aşama | Özellik |
|-------|---------|
| **301** | Model ops |
| **302** | Prompt lib |
| **303** | Ajan eval |
| **304** | Token bütçe |
| **305** | RAG index |
| **306** | Tool izin |
| **307** | Sandbox run |
| **308** | Hallucination check |
| **309** | Dataset kürasyon |
| **310** | Red team |
| **311** | Ajan SLA |
| **312** | AI cost guard |
| **313** | Latency log |
| **314** | Drift monitor |
| **315** | Cognisphere checkpoint (`/api/cognisphere`) |

### Omni-Kanal · Vanguard (AŞAMA 316–330)

| Aşama | Özellik |
|-------|---------|
| **316** | POS Bridge |
| **317** | MINT fiyat push |
| **318** | Kurye takip |
| **319** | Otonom checkout |
| **320** | Sadakat harcama |
| **321** | İkram teklifi |
| **322** | Omni market |
| **323** | Click & collect |
| **324** | Last mile |
| **325** | Stok senkron |
| **326** | Fiyat push |
| **327** | QR pay |
| **328** | Kurye havuzu |
| **329** | Hediye relay |
| **330** | Vanguard · Nexus Prime (`/api/vanguard`) |

### Edge Mesh · Lattice (AŞAMA 331–345)

| Aşama | Özellik |
|-------|---------|
| **331** | Edge Gate |
| **332** | Mesh Link |
| **333** | Radio Mesh |
| **334** | Sensor Fuse |
| **335** | OTA Firmware |
| **336** | Cihaz Envanter |
| **337** | Güç Bütçe |
| **338** | Backhaul |
| **339** | Edge Store |
| **340** | Sync Replica |
| **341** | Failover |
| **342** | Telemetry |
| **343** | Net Slice |
| **344** | Sat Link |
| **345** | Lattice checkpoint (`/api/lattice`) |

### Guest Twin · Mirror (AŞAMA 346–360)

| Aşama | Özellik |
|-------|---------|
| **346** | Guest Twin |
| **347** | Tercih Grafı |
| **348** | Niyet Skoru |
| **349** | Next Best Action |
| **350** | Yolculuk Haritası |
| **351** | Mikro Segment |
| **352** | Offer Lab |
| **353** | Consent Graph |
| **354** | Duygu Nabız |
| **355** | Servis Hafızası |
| **356** | Recovery Path |
| **357** | LTV |
| **358** | Churn Risk |
| **359** | Wow Moment |
| **360** | Mirror checkpoint (`/api/mirror`) |

### Command Fabric · Keystone (AŞAMA 361–375)

| Aşama | Özellik |
|-------|---------|
| **361** | Incident Bus |
| **362** | Play Trigger |
| **363** | Escalation |
| **364** | War Room Seat |
| **365** | Decision Log |
| **366** | SLO Track |
| **367** | Error Budget |
| **368** | Change Window |
| **369** | Blameless Review |
| **370** | On-Call |
| **371** | Status Page |
| **372** | Runbook Link |
| **373** | Comms Bridge |
| **374** | After Action |
| **375** | Keystone checkpoint (`/api/keystone`) |

### Revenue OS · Zenith (AŞAMA 376–390)

| Aşama | Özellik |
|-------|---------|
| **376** | Gelir Akışı |
| **377** | Paket Mix |
| **378** | Ancillary |
| **379** | Dinamik Bundle |
| **380** | Fiyat Tabanı |
| **381** | Comp Set |
| **382** | Pickup Pace |
| **383** | No-show Risk |
| **384** | Walk-in Flow |
| **385** | Table Turn |
| **386** | Beat Revenue |
| **387** | Nakit Forecast |
| **388** | Marj İzleme |
| **389** | Promo Attribution |
| **390** | Zenith checkpoint (`/api/zenith`) |

### Finale · Odyssey (AŞAMA 391–405)

| Aşama | Özellik |
|-------|---------|
| **391** | Master Plan |
| **392** | OKR Rack |
| **393** | Roadmap |
| **394** | Bet Board |
| **395** | Portföy Risk |
| **396** | Cap Notes |
| **397** | Board Motion |
| **398** | Alliance |
| **399** | Expansion |
| **400** | Legacy Arc |
| **401** | Culture Code |
| **402** | Talent Bet |
| **403** | Moat Watch |
| **404** | North Star |
| **405** | Odyssey checkpoint (`/api/odyssey`) |

### Coastal Ops · Tide (AŞAMA 406–420)

| Aşama | Özellik |
|-------|---------|
| **406** | Gelgit İzleme |
| **407** | Kumsal Ops |
| **408** | Snorkel Bay |
| **409** | Uçurum Yolu |
| **410** | Camp Glow |
| **411** | Lookout |
| **412** | Reef Guard |
| **413** | İskele Ops |
| **414** | Yelken Desk |
| **415** | Şemsiye Harita |
| **416** | Kum Temizlik |
| **417** | Gece Yüzme |
| **418** | Yıldız İzleme |
| **419** | Sahil Devriye |
| **420** | Tide checkpoint (`/api/tide`) |

### Port Logistics · Harbor (AŞAMA 421–435)

| Aşama | Özellik |
|-------|---------|
| **421** | Liman Şeridi |
| **422** | Rıhtım Slot |
| **423** | Vinç Ops |
| **424** | Konteyner |
| **425** | Soğuk Bay |
| **426** | Saha Hamle |
| **427** | Liman Gate |
| **428** | Bolt Hold |
| **429** | Manifest |
| **430** | Demurrage |
| **431** | Kılavuzluk |
| **432** | Römorkör |
| **433** | Wharfage |
| **434** | Stevedore |
| **435** | Harbor checkpoint (`/api/harbor`) |

### Experience Fabric · Aurora (AŞAMA 436–450)

| Aşama | Özellik |
|-------|---------|
| **436** | Aurora Deck |
| **437** | Işık Show |
| **438** | Soundscape |
| **439** | Koku Zone |
| **440** | Mood Light |
| **441** | Fog Scene |
| **442** | Projection |
| **443** | Immersive |
| **444** | Haptic Cue |
| **445** | Atmos Mix |
| **446** | Guest Flow |
| **447** | Scene Control |
| **448** | Night Mode |
| **449** | Dawn Mode |
| **450** | Aurora checkpoint (`/api/aurora`) |

### Culinary OS · Hearth (AŞAMA 451–465)

| Aşama | Özellik |
|-------|---------|
| **451** | Mise Plan |
| **452** | Pass Rail |
| **453** | Plate Up |
| **454** | Garde Bay |
| **455** | Pastry Lab |
| **456** | Tasting Menu |
| **457** | Cellar Box |
| **458** | Bar Rail |
| **459** | Room Service |
| **460** | Cater Desk |
| **461** | Allergen Map |
| **462** | Kitchen Waste |
| **463** | Chef Brief |
| **464** | Supply Pull |
| **465** | Hearth checkpoint (`/api/hearth`) |

### Wellness OS · Sanctum (AŞAMA 466–480)

| Aşama | Özellik |
|-------|---------|
| **466** | Spa Flow |
| **467** | Thermal Bay |
| **468** | Sauna Log |
| **469** | Cryo Chamber |
| **470** | Float Pod |
| **471** | Massage Book |
| **472** | Yoga Mat |
| **473** | Breathwork |
| **474** | Recovery Bay |
| **475** | IV Lounge |
| **476** | Sleep Coach |
| **477** | Nutrition Desk |
| **478** | Biomarker |
| **479** | Wellness Kit |
| **480** | Sanctum checkpoint (`/api/sanctum`) |

### Estate Ops · Citadel (AŞAMA 481–495)

| Aşama | Özellik |
|-------|---------|
| **481** | Asset Map |
| **482** | Plant Room |
| **483** | HVAC Loop |
| **484** | Water Loop |
| **485** | Power Grid |
| **486** | Elevator Log |
| **487** | Spare Parts |
| **488** | Work Order |
| **489** | Leasehold |
| **490** | Tenant Ops |
| **491** | Facility Tour |
| **492** | Capex Desk |
| **493** | Opex Desk |
| **494** | Estate Scan |
| **495** | Citadel checkpoint (`/api/citadel`) |

### Talent OS · Forge (AŞAMA 496–510)

| Aşama | Özellik |
|-------|---------|
| **496** | Talent Desk |
| **497** | Shift Bid |
| **498** | Skill Matrix |
| **499** | Cert Track |
| **500** | Training Hub |
| **501** | Mentorship |
| **502** | Succession |
| **503** | Payroll Run |
| **504** | Perform Note |
| **505** | Review Cycle |
| **506** | Headcount |
| **507** | Attrition |
| **508** | Culture Pulse |
| **509** | Shift Trade |
| **510** | Forge checkpoint (`/api/forge`) |

### Safety OS · Aegis (AŞAMA 511–525)

| Aşama | Özellik |
|-------|---------|
| **511** | Safety Log |
| **512** | Incident Log |
| **513** | Hazard Note |
| **514** | Evac Route |
| **515** | Drill Run |
| **516** | Aid Kit |
| **517** | Hazmat Bay |
| **518** | PPE Kit |
| **519** | Lockout Tag |
| **520** | Permit Work |
| **521** | Compliance Row |
| **522** | Audit Trail+ |
| **523** | CCTV Review |
| **524** | Guest Safety |
| **525** | Aegis checkpoint (`/api/aegis`) |

### Intelligence OS · Oracle (AŞAMA 526–540)

| Aşama | Özellik |
|-------|---------|
| **526** | Data Lake |
| **527** | Feature Flag |
| **528** | Model Card |
| **529** | Prompt Lab |
| **530** | Eval Bench |
| **531** | Dataset Cat |
| **532** | Lineage |
| **533** | Vector Store |
| **534** | Insight Board |
| **535** | Anomaly |
| **536** | Demand Cast |
| **537** | A/B Test |
| **538** | Scorecard |
| **539** | Decid Log |
| **540** | Oracle checkpoint (`/api/oracle`) |

### Loyalty OS · Crown (AŞAMA 541–555)

| Aşama | Özellik |
|-------|---------|
| **541** | Member Desk |
| **542** | Tier Ladder |
| **543** | Point Ledger |
| **544** | Perk Shop |
| **545** | Referral |
| **546** | Gift Card |
| **547** | VIP Desk |
| **548** | Stay History |
| **549** | Prefer Note |
| **550** | NPS Pulse |
| **551** | Complaint |
| **552** | Praise |
| **553** | Winback |
| **554** | Club Night |
| **555** | Crown checkpoint (`/api/crown`) |

### Marketing OS · Beacon (AŞAMA 556–570)

| Aşama | Özellik |
|-------|---------|
| **556** | Campaign |
| **557** | Content Cal |
| **558** | Social Queue |
| **559** | Creator Desk |
| **560** | UTM Track |
| **561** | Landing |
| **562** | A/B Copy |
| **563** | SEO Page |
| **564** | Push Desk |
| **565** | Email Blast |
| **566** | Press Pack |
| **567** | Brand Kit |
| **568** | Media Buy |
| **569** | Lead Magnet |
| **570** | Beacon checkpoint (`/api/beacon`) |

### Treasury OS · Vault (AŞAMA 571–585)

| Aşama | Özellik |
|-------|---------|
| **571** | Treasury |
| **572** | Cash Flow |
| **573** | AP Desk |
| **574** | AR Desk |
| **575** | Invoice Desk |
| **576** | Tax Desk |
| **577** | Budget Line |
| **578** | FX Desk |
| **579** | Bank Recon |
| **580** | Payout |
| **581** | Petty Cash |
| **582** | Cost Center |
| **583** | GL Map |
| **584** | Close Book |
| **585** | Vault checkpoint (`/api/vault`) |

### Mobility OS · Convoy (AŞAMA 586–600)

| Aşama | Özellik |
|-------|---------|
| **586** | Shuttle Lane |
| **587** | Fleet Desk |
| **588** | Driver Rost |
| **589** | Fuel Card |
| **590** | Route Plan |
| **591** | Dispatch Board |
| **592** | GPS Ping |
| **593** | Vehicle Maint |
| **594** | Valet Ops |
| **595** | Parking Bay |
| **596** | Transfer Job |
| **597** | Pickup Drop |
| **598** | Toll Pass |
| **599** | Lane Control |
| **600** | Convoy checkpoint (`/api/convoy`) |

### Housekeeping OS · Linen (AŞAMA 601–615)

| Aşama | Özellik |
|-------|---------|
| **601** | Room Rack |
| **602** | HK Board |
| **603** | Linen Room |
| **604** | Minibar Bay |
| **605** | Found Log |
| **606** | Key Desk |
| **607** | Turndown |
| **608** | Deep Clean |
| **609** | Inspect Room |
| **610** | VIP Prep |
| **611** | Out of Order |
| **612** | Guest Request |
| **613** | Amen Save |
| **614** | Public Area |
| **615** | Linen checkpoint (`/api/linen`) |

### Front Office OS · Atlas (AŞAMA 616–630)

| Aşama | Özellik |
|-------|---------|
| **616** | Night Audit |
| **617** | Folio Desk |
| **618** | Desk Queue |
| **619** | Wake All |
| **620** | Early Check |
| **621** | Late Check |
| **622** | Bag Store |
| **623** | Call Sheet |
| **624** | Arrival Board |
| **625** | Departure Board |
| **626** | VIP Arrive |
| **627** | Front Log |
| **628** | Move Ticket |
| **629** | Concierge Job |
| **630** | Atlas checkpoint (`/api/atlas`) |

### Konglomerat Ticaret · Empire (AŞAMA 631–645)

| Aşama | Özellik |
|-------|---------|
| **631** | Trendyol Bridge |
| **632** | Dolap List |
| **633** | Hepha Pick |
| **634** | Tour Pack |
| **635** | Rent Gear |
| **636** | WA Reserve |
| **637** | Stay Book |
| **638** | Daze Room |
| **639** | Keyless Door |
| **640** | Sport Slot |
| **641** | Arena Book |
| **642** | NEXUS Gate |
| **643** | MINT Bundle |
| **644** | Pack Folio |
| **645** | Empire checkpoint (`/api/empire`) |

### Retail OS · Bazaar (AŞAMA 646–660)

| Aşama | Özellik |
|-------|---------|
| **646** | Retail Floor |
| **647** | Planogram |
| **648** | Shelf Scan |
| **649** | Price Audit |
| **650** | Shrink Log |
| **651** | Vendor Portal |
| **652** | Assort Mix |
| **653** | Promo Plane |
| **654** | Category Buy |
| **655** | Demand Plan |
| **656** | Stock Health |
| **657** | Return Bay |
| **658** | Dark Store |
| **659** | POS Lane |
| **660** | Bazaar checkpoint (`/api/bazaar`) |

### Media OS · Studio (AŞAMA 661–675)

| Aşama | Özellik |
|-------|---------|
| **661** | Media Wall |
| **662** | Content Rights |
| **663** | Ad Slot |
| **664** | Sponsor Pack |
| **665** | Brand Ambass |
| **666** | Creator Pay |
| **667** | UGC Queue |
| **668** | Press Room |
| **669** | Live Cast |
| **670** | Event Stream |
| **671** | Affiliate Net |
| **672** | Boost Desk |
| **673** | Asset Lib |
| **674** | Brief Desk |
| **675** | Studio checkpoint (`/api/studio`) |

### Green OS · Verdant (AŞAMA 676–690)

| Aşama | Özellik |
|-------|---------|
| **676** | Carbon Ledger |
| **677** | Water Use |
| **678** | Waste Sort |
| **679** | Energy Bid |
| **680** | Solar Yield |
| **681** | Green Team |
| **682** | ESG Audit |
| **683** | Bio Survey |
| **684** | Offset Buy |
| **685** | Climate Goal |
| **686** | Green Bond |
| **687** | Plastic Audit |
| **688** | EV Charger |
| **689** | Reef Watch |
| **690** | Verdant checkpoint (`/api/verdant`) |

### Identity OS · Bastion (AŞAMA 691–705)

| Aşama | Özellik |
|-------|---------|
| **691** | Access Gate |
| **692** | ID Proof |
| **693** | Role Grant |
| **694** | Session Guard |
| **695** | Device Trust |
| **696** | Secret Vault |
| **697** | MFA Reg |
| **698** | SSO Bridge |
| **699** | Privacy Pol |
| **700** | Consent Row |
| **701** | Breach Log |
| **702** | SOC Queue |
| **703** | Patch Desk |
| **704** | Zero Hour |
| **705** | Bastion checkpoint (`/api/bastion`) |

### Alliance OS · Alliance2 (AŞAMA 706–720)

| Aşama | Özellik |
|-------|---------|
| **706** | Partner Desk |
| **707** | Franchise |
| **708** | Channel Kit |
| **709** | Rebate |
| **710** | Co Invest |
| **711** | SLA Track |
| **712** | Joint Promo |
| **713** | Lead Share |
| **714** | B2B Order |
| **715** | Wholesale |
| **716** | Deal Room |
| **717** | Contract Row |
| **718** | Commission |
| **719** | Onboard Kit |
| **720** | Alliance2 checkpoint (`/api/alliance2`) |

### Supply OS · Artery (AŞAMA 721–735)

| Aşama | Özellik |
|-------|---------|
| **721** | Inbound PO |
| **722** | Outbound SO |
| **723** | ASN Track |
| **724** | Dock Yard |
| **725** | Cross Dock |
| **726** | Cold Chain+ |
| **727** | Slot Book |
| **728** | Carrier Bid |
| **729** | Freight Bill |
| **730** | Milestone T |
| **731** | Exception Log |
| **732** | Inventory Age |
| **733** | Replen Plan |
| **734** | Safety Stock |
| **735** | Artery checkpoint (`/api/artery`) |

### Dominion Seal · Dominion (AŞAMA 736–750)

| Aşama | Özellik |
|-------|---------|
| **736** | Supplier KPI |
| **737** | Cmd Pulse |
| **738** | Board Pulse |
| **739** | Risk Heat |
| **740** | Cash Pulse |
| **741** | Ops Heat |
| **742** | Guest Heat |
| **743** | Brand Heat |
| **744** | Agent Pulse |
| **745** | System Pulse |
| **746** | Alert Fuse |
| **747** | War Brief |
| **748** | Decision Hub |
| **749** | Seal Note |
| **750** | Dominion checkpoint (`/api/dominion`) |

### Serenity OS · Serenity (AŞAMA 751–765)

| Aşama | Özellik |
|-------|---------|
| **751** | Legacy Flag |
| **752** | Calm Room |
| **753** | Quiet Hours |
| **754** | Scent Mood |
| **755** | Pillow Menu |
| **756** | Bath Ritual |
| **757** | Sleep Score |
| **758** | Welcome Amen |
| **759** | Farewell |
| **760** | Memory Book |
| **761** | Care Call |
| **762** | Surprise Gift |
| **763** | Loyalty Hug |
| **764** | Feedback Loop |
| **765** | Serenity checkpoint (`/api/serenity`) |

### Circuit OS · Circuit (AŞAMA 766–780)

| Aşama | Özellik |
|-------|---------|
| **766** | Moment Map |
| **767** | API Gateway |
| **768** | Webhook Hub |
| **769** | Rate Limit+ |
| **770** | Schema Reg |
| **771** | Event Bus |
| **772** | Job Queue+ |
| **773** | Cache Mesh |
| **774** | CDN Edge |
| **775** | Observe Map |
| **776** | Error Budget |
| **777** | Feature Gate |
| **778** | Canary Run |
| **779** | Rollback |
| **780** | Circuit checkpoint (`/api/circuit`) |

### Agora OS · Agora (AŞAMA 781–795)

| Aşama | Özellik |
|-------|---------|
| **781** | Chaos Drill |
| **782** | Member Hub |
| **783** | Circle |
| **784** | Meetup |
| **785** | Forum Mod |
| **786** | Poll Desk |
| **787** | Badge Earn |
| **788** | Quest Line |
| **789** | Volunteer |
| **790** | Donation |
| **791** | Chapter |
| **792** | Ambassador+ |
| **793** | Story Wall |
| **794** | Ritual Cal |
| **795** | Agora checkpoint (`/api/agora`) |

### Crucible OS · Crucible (AŞAMA 796–810)

| Aşama | Özellik |
|-------|---------|
| **796** | Cohort |
| **797** | Lab Bench |
| **798** | Pilot Run |
| **799** | Prototype |
| **800** | Hypothesis |
| **801** | Metrics Lab |
| **802** | User Board |
| **803** | Patent Desk |
| **804** | Sandbox |
| **805** | Hack Day |
| **806** | Incubate |
| **807** | Spin Desk |
| **808** | Research Note |
| **809** | Lab Budget |
| **810** | Crucible checkpoint (`/api/crucible`) |

### Charter OS · Charter (AŞAMA 811–825)

| Aşama | Özellik |
|-------|---------|
| **811** | IP Vault |
| **812** | Legal Desk |
| **813** | Risk Reg |
| **814** | Policy Hub |
| **815** | Claim Desk |
| **816** | Insurance T |
| **817** | Litigation |
| **818** | Compliance+ |
| **819** | Ethics Line |
| **820** | KYC Row |
| **821** | Sanctions |
| **822** | Data Priv |
| **823** | Retention Pol |
| **824** | Audit Evidence |
| **825** | Charter checkpoint (`/api/charter`) |

### Phoenix OS · Phoenix (AŞAMA 826–840)

| Aşama | Özellik |
|-------|---------|
| **826** | Board Resolve |
| **827** | DR Plan |
| **828** | Backup Job |
| **829** | Failover |
| **830** | Runbook |
| **831** | War Room+ |
| **832** | Comms Bridge+ |
| **833** | Site Evac |
| **834** | Cold Site |
| **835** | Hot Spare |
| **836** | Drill Score |
| **837** | Vendor Fail |
| **838** | Power Cut |
| **839** | Net Split |
| **840** | Phoenix checkpoint (`/api/phoenix`) |

### Frontier OS · Frontier (AŞAMA 841–855)

| Aşama | Özellik |
|-------|---------|
| **841** | Restore Job |
| **842** | Market Scan |
| **843** | Site Hunt |
| **844** | Capex Table |
| **845** | Soft Open |
| **846** | Launch Pad |
| **847** | Local Hire |
| **848** | Permit Desk |
| **849** | Land Lease |
| **850** | Build Phase |
| **851** | FFE Spec |
| **852** | Brand Rollout |
| **853** | Train Wave |
| **854** | Go Live |
| **855** | Frontier checkpoint (`/api/frontier`) |

### Prism OS · Prism (AŞAMA 856–870)

| Aşama | Özellik |
|-------|---------|
| **856** | Post Launch |
| **857** | QA Sample |
| **858** | Defect Log |
| **859** | Standard OP |
| **860** | Mystery Guest |
| **861** | NPS Deep |
| **862** | Service Mark |
| **863** | Calib Desk |
| **864** | Lab Result |
| **865** | Cert Renew |
| **866** | ISO Track |
| **867** | Guest Voice |
| **868** | Form Gate |
| **869** | Root Cause |
| **870** | Prism checkpoint (`/api/prism`) |

### Monument OS · Monument (AŞAMA 871–885)

| Aşama | Özellik |
|-------|---------|
| **871** | Corrective |
| **872** | Archive Box |
| **873** | Oral History |
| **874** | Artifact |
| **875** | Timeline |
| **876** | Founders Note |
| **877** | Brand Bible |
| **878** | Museum Desk |
| **879** | Heritage |
| **880** | Anniversary |
| **881** | Alumni |
| **882** | Scholarship |
| **883** | Foundation |
| **884** | Legacy Gift |
| **885** | Monument checkpoint (`/api/monument`) |

### Olympus Finale · Olympus (AŞAMA 886–900)

| Aşama | Özellik |
|-------|---------|
| **886** | Story Vault |
| **887** | Olym Pulse |
| **888** | Holding Seal |
| **889** | Agent Court |
| **890** | Final Brief |
| **891** | Legacy Code |
| **892** | Eternal Log |
| **893** | Summit Note |
| **894** | Constellate |
| **895** | Mythos |
| **896** | Aegis Final |
| **897** | Crown Final |
| **898** | Vault Final |
| **899** | Empire Final |
| **900** | Olympus checkpoint (`/api/olympus`) |

### Identity OS · Bastion2 (AŞAMA 901–915)

| Aşama | Özellik |
|-------|---------|
| **901** | Access Gate |
| **902** | ID Proof |
| **903** | Role Grant |
| **904** | Session Guard |
| **905** | Device Trust |
| **906** | Secret Vault |
| **907** | MFA Reg |
| **908** | SSO Bridge |
| **909** | Privacy Pol |
| **910** | Consent Row |
| **911** | Breach Log |
| **912** | SOC Queue |
| **913** | Patch Desk |
| **914** | Zero Hour |
| **915** | Bastion2 checkpoint (`/api/bastion2`) |

### Alliance OS · Alliance3 (AŞAMA 916–930)

| Aşama | Özellik |
|-------|---------|
| **916** | Partner Desk |
| **917** | Franchise |
| **918** | Channel Kit |
| **919** | Rebate |
| **920** | Co Invest |
| **921** | SLA Track |
| **922** | Joint Promo |
| **923** | Lead Share |
| **924** | B2B Order |
| **925** | Wholesale |
| **926** | Deal Room |
| **927** | Contract Row |
| **928** | Commission |
| **929** | Onboard Kit |
| **930** | Alliance3 checkpoint (`/api/alliance3`) |

### Supply OS · Artery2 (AŞAMA 931–945)

| Aşama | Özellik |
|-------|---------|
| **931** | Inbound PO |
| **932** | Outbound SO |
| **933** | ASN Track |
| **934** | Dock Yard |
| **935** | Cross Dock |
| **936** | Cold Chain+ |
| **937** | Slot Book |
| **938** | Carrier Bid |
| **939** | Freight Bill |
| **940** | Milestone T |
| **941** | Exception Log |
| **942** | Inventory Age |
| **943** | Replen Plan |
| **944** | Safety Stock |
| **945** | Artery2 checkpoint (`/api/artery2`) |

### Dominion Seal · Dominion2 (AŞAMA 946–960)

| Aşama | Özellik |
|-------|---------|
| **946** | Supplier KPI |
| **947** | Cmd Pulse |
| **948** | Board Pulse |
| **949** | Risk Heat |
| **950** | Cash Pulse |
| **951** | Ops Heat |
| **952** | Guest Heat |
| **953** | Brand Heat |
| **954** | Agent Pulse |
| **955** | System Pulse |
| **956** | Alert Fuse |
| **957** | War Brief |
| **958** | Decision Hub |
| **959** | Seal Note |
| **960** | Dominion2 checkpoint (`/api/dominion2`) |

### Serenity OS · Serenity2 (AŞAMA 961–975)

| Aşama | Özellik |
|-------|---------|
| **961** | Legacy Flag |
| **962** | Calm Room |
| **963** | Quiet Hours |
| **964** | Scent Mood |
| **965** | Pillow Menu |
| **966** | Bath Ritual |
| **967** | Sleep Score |
| **968** | Welcome Amen |
| **969** | Farewell |
| **970** | Memory Book |
| **971** | Care Call |
| **972** | Surprise Gift |
| **973** | Loyalty Hug |
| **974** | Feedback Loop |
| **975** | Serenity2 checkpoint (`/api/serenity2`) |

### Circuit OS · Circuit2 (AŞAMA 976–990)

| Aşama | Özellik |
|-------|---------|
| **976** | Moment Map |
| **977** | API Gateway |
| **978** | Webhook Hub |
| **979** | Rate Limit+ |
| **980** | Schema Reg |
| **981** | Event Bus |
| **982** | Job Queue+ |
| **983** | Cache Mesh |
| **984** | CDN Edge |
| **985** | Observe Map |
| **986** | Error Budget |
| **987** | Feature Gate |
| **988** | Canary Run |
| **989** | Rollback |
| **990** | Circuit2 checkpoint (`/api/circuit2`) |

### Agora OS · Agora2 (AŞAMA 991–1005)

| Aşama | Özellik |
|-------|---------|
| **991** | Chaos Drill |
| **992** | Member Hub |
| **993** | Circle |
| **994** | Meetup |
| **995** | Forum Mod |
| **996** | Poll Desk |
| **997** | Badge Earn |
| **998** | Quest Line |
| **999** | Volunteer |
| **1000** | Donation |
| **1001** | Chapter |
| **1002** | Ambassador+ |
| **1003** | Story Wall |
| **1004** | Ritual Cal |
| **1005** | Agora2 checkpoint (`/api/agora2`) |

### Crucible OS · Crucible2 (AŞAMA 1006–1020)

| Aşama | Özellik |
|-------|---------|
| **1006** | Cohort |
| **1007** | Lab Bench |
| **1008** | Pilot Run |
| **1009** | Prototype |
| **1010** | Hypothesis |
| **1011** | Metrics Lab |
| **1012** | User Board |
| **1013** | Patent Desk |
| **1014** | Sandbox |
| **1015** | Hack Day |
| **1016** | Incubate |
| **1017** | Spin Desk |
| **1018** | Research Note |
| **1019** | Lab Budget |
| **1020** | Crucible2 checkpoint (`/api/crucible2`) |

### Charter OS · Charter2 (AŞAMA 1021–1035)

| Aşama | Özellik |
|-------|---------|
| **1021** | IP Vault |
| **1022** | Legal Desk |
| **1023** | Risk Reg |
| **1024** | Policy Hub |
| **1025** | Claim Desk |
| **1026** | Insurance T |
| **1027** | Litigation |
| **1028** | Compliance+ |
| **1029** | Ethics Line |
| **1030** | KYC Row |
| **1031** | Sanctions |
| **1032** | Data Priv |
| **1033** | Retention Pol |
| **1034** | Audit Evidence |
| **1035** | Charter2 checkpoint (`/api/charter2`) |

### Phoenix OS · Phoenix2 (AŞAMA 1036–1050)

| Aşama | Özellik |
|-------|---------|
| **1036** | Board Resolve |
| **1037** | DR Plan |
| **1038** | Backup Job |
| **1039** | Failover |
| **1040** | Runbook |
| **1041** | War Room+ |
| **1042** | Comms Bridge+ |
| **1043** | Site Evac |
| **1044** | Cold Site |
| **1045** | Hot Spare |
| **1046** | Drill Score |
| **1047** | Vendor Fail |
| **1048** | Power Cut |
| **1049** | Net Split |
| **1050** | Phoenix2 checkpoint (`/api/phoenix2`) |

### Elysium OS · Elysium (AŞAMA 1051–1065)

| Aşama | Özellik |
|-------|---------|
| **1051** | Access Gate |
| **1052** | ID Proof |
| **1053** | Role Grant |
| **1054** | Session Guard |
| **1055** | Device Trust |
| **1056** | Secret Vault |
| **1057** | MFA Reg |
| **1058** | SSO Bridge |
| **1059** | Privacy Pol |
| **1060** | Consent Row |
| **1061** | Breach Log |
| **1062** | SOC Queue |
| **1063** | Patch Desk |
| **1064** | Zero Hour |
| **1065** | Elysium checkpoint (`/api/elysium`) |

### Aether OS · Aether (AŞAMA 1066–1080)

| Aşama | Özellik |
|-------|---------|
| **1066** | Partner Desk |
| **1067** | Franchise |
| **1068** | Channel Kit |
| **1069** | Rebate |
| **1070** | Co Invest |
| **1071** | SLA Track |
| **1072** | Joint Promo |
| **1073** | Lead Share |
| **1074** | B2B Order |
| **1075** | Wholesale |
| **1076** | Deal Room |
| **1077** | Contract Row |
| **1078** | Commission |
| **1079** | Onboard Kit |
| **1080** | Aether checkpoint (`/api/aether`) |

### Helios OS · Helios (AŞAMA 1081–1095)

| Aşama | Özellik |
|-------|---------|
| **1081** | Inbound PO |
| **1082** | Outbound SO |
| **1083** | ASN Track |
| **1084** | Dock Yard |
| **1085** | Cross Dock |
| **1086** | Cold Chain+ |
| **1087** | Slot Book |
| **1088** | Carrier Bid |
| **1089** | Freight Bill |
| **1090** | Milestone T |
| **1091** | Exception Log |
| **1092** | Inventory Age |
| **1093** | Replen Plan |
| **1094** | Safety Stock |
| **1095** | Helios checkpoint (`/api/helios`) |

### Selene OS · Selene (AŞAMA 1096–1110)

| Aşama | Özellik |
|-------|---------|
| **1096** | Supplier KPI |
| **1097** | Cmd Pulse |
| **1098** | Board Pulse |
| **1099** | Risk Heat |
| **1100** | Cash Pulse |
| **1101** | Ops Heat |
| **1102** | Guest Heat |
| **1103** | Brand Heat |
| **1104** | Agent Pulse |
| **1105** | System Pulse |
| **1106** | Alert Fuse |
| **1107** | War Brief |
| **1108** | Decision Hub |
| **1109** | Seal Note |
| **1110** | Selene checkpoint (`/api/selene`) |

### Gaia OS · Gaia (AŞAMA 1111–1125)

| Aşama | Özellik |
|-------|---------|
| **1111** | Legacy Flag |
| **1112** | Calm Room |
| **1113** | Quiet Hours |
| **1114** | Scent Mood |
| **1115** | Pillow Menu |
| **1116** | Bath Ritual |
| **1117** | Sleep Score |
| **1118** | Welcome Amen |
| **1119** | Farewell |
| **1120** | Memory Book |
| **1121** | Care Call |
| **1122** | Surprise Gift |
| **1123** | Loyalty Hug |
| **1124** | Feedback Loop |
| **1125** | Gaia checkpoint (`/api/gaia`) |

### Chronos OS · Chronos (AŞAMA 1126–1140)

| Aşama | Özellik |
|-------|---------|
| **1126** | Moment Map |
| **1127** | API Gateway |
| **1128** | Webhook Hub |
| **1129** | Rate Limit+ |
| **1130** | Schema Reg |
| **1131** | Event Bus |
| **1132** | Job Queue+ |
| **1133** | Cache Mesh |
| **1134** | CDN Edge |
| **1135** | Observe Map |
| **1136** | Error Budget |
| **1137** | Feature Gate |
| **1138** | Canary Run |
| **1139** | Rollback |
| **1140** | Chronos checkpoint (`/api/chronos`) |

### Kairos OS · Kairos (AŞAMA 1141–1155)

| Aşama | Özellik |
|-------|---------|
| **1141** | Chaos Drill |
| **1142** | Member Hub |
| **1143** | Circle |
| **1144** | Meetup |
| **1145** | Forum Mod |
| **1146** | Poll Desk |
| **1147** | Badge Earn |
| **1148** | Quest Line |
| **1149** | Volunteer |
| **1150** | Donation |
| **1151** | Chapter |
| **1152** | Ambassador+ |
| **1153** | Story Wall |
| **1154** | Ritual Cal |
| **1155** | Kairos checkpoint (`/api/kairos`) |

### Logos OS · Logos (AŞAMA 1156–1170)

| Aşama | Özellik |
|-------|---------|
| **1156** | Cohort |
| **1157** | Lab Bench |
| **1158** | Pilot Run |
| **1159** | Prototype |
| **1160** | Hypothesis |
| **1161** | Metrics Lab |
| **1162** | User Board |
| **1163** | Patent Desk |
| **1164** | Sandbox |
| **1165** | Hack Day |
| **1166** | Incubate |
| **1167** | Spin Desk |
| **1168** | Research Note |
| **1169** | Lab Budget |
| **1170** | Logos checkpoint (`/api/logos`) |

### Pathos OS · Pathos (AŞAMA 1171–1185)

| Aşama | Özellik |
|-------|---------|
| **1171** | IP Vault |
| **1172** | Legal Desk |
| **1173** | Risk Reg |
| **1174** | Policy Hub |
| **1175** | Claim Desk |
| **1176** | Insurance T |
| **1177** | Litigation |
| **1178** | Compliance+ |
| **1179** | Ethics Line |
| **1180** | KYC Row |
| **1181** | Sanctions |
| **1182** | Data Priv |
| **1183** | Retention Pol |
| **1184** | Audit Evidence |
| **1185** | Pathos checkpoint (`/api/pathos`) |

### Apotheosis · Apotheosis (AŞAMA 1186–1200)

| Aşama | Özellik |
|-------|---------|
| **1186** | Board Resolve |
| **1187** | DR Plan |
| **1188** | Backup Job |
| **1189** | Failover |
| **1190** | Runbook |
| **1191** | War Room+ |
| **1192** | Comms Bridge+ |
| **1193** | Site Evac |
| **1194** | Cold Site |
| **1195** | Hot Spare |
| **1196** | Drill Score |
| **1197** | Vendor Fail |
| **1198** | Power Cut |
| **1199** | Net Split |
| **1200** | Apotheosis checkpoint (`/api/apotheosis`) |

### Kampüs stack — sealed + wave-2

| Modül | API | İş |
|-------|-----|-----|
| campuscore | `/api/campus` | Arazi zonları |
| stayring | `/api/stayring` | Glamping/karavan/bungalow + keyless/HK/kışlama |
| athleteos | `/api/athleteos` | Kulüp & sporcu |
| lifecoach | `/api/lifecoach` | Yaşam uzmanı + saat |
| marketos | `/api/marketos` | Al / kirala / 2. el + TY/Dolap kanal |
| openmall | `/api/openmall` | Açık AVM + F&B asgari |
| familycamp | `/api/familycamp` | Aile & çocuk |
| culturescene | `/api/culture` | Kültür & sahne |
| sportbridge | `/api/sportbridge` | Extreme ↔ athlete köprü |
| agentbridge | `/api/agentbridge` | Ajan komuta |
| agentqueue | `/api/agentqueue` | Ajan iş kuyruğu |
| lifecoach+ | `/api/lifecoach/webhook` | Wearable webhook (HMAC / demo) |
| greenpulse | `/api/greenpulse` | Yeşil ESG nabız |
| life flags | `/api/lifecoach/flags` | Flag → ajan kuyruk + recovery |
| campusbrief | `/api/campusbrief` | CEO sabah brifi + çapraz otomasyon |
| agentfleet | `/api/agentfleet` | 28 ajan filo + LİKYA-1 dispatch |
| campus health | `/api/campus/health` | Kampüs sağlık skoru |
| family+ | `/api/familycamp/book` · `/emergency` | Rezervasyon + acil not |
| culture+ | `/api/culture/confirm` · `/release` | Bilet hold → satış |
| market+ | `/api/marketos/return` | Kiralama iade |
| mall+ | `/api/openmall/day-rollup` | Günlük POS rollup |
| athlete+ | `/api/athleteos/license` · `/readiness` | Lisans + RPE/recovery readiness |
| life+ | `/api/lifecoach/checkin` | Uzman check-in → metrik/plan |
| stay+ | `/api/stayring/hk-complete` · `/night-rollup` | HK tamam + gece RevPAR |

Smoke: `npm run smoke:campus` · HTTP e2e: `npm run e2e:campus` · Yedek: `npm run backup`  
`App.tsx`: LoginPage eager, diğer tüm sayfalar lazy.  
Jobs ticker: `tickAgentQueue` + `runCampusAutomations`.

### Kampüs menü (Adım 1)

CEO sidebar artık **domain hub** + **Lab arama** ile sade.
Sayfa: `campus` (Kampüs Haritası). İnce CRUD’lar Lab’da aranır.

### Antalya Extreme Park (AŞAMA 321–325 vizyon)

Bağımsız `extremepark` modülü — 316–330 Vanguard ile çakışmadan üst katman.

| Uç nokta | Açıklama |
|----------|----------|
| `GET /api/extreme` | Hub özeti · slot · hava · ekipman |
| `GET /api/extreme/user-spec` | Üye yetki / kota / F&B şeması |
| `POST /api/extreme/waiver` | Dijital feragatname |
| `POST /api/extreme/slot-weather-check` | Hava oto-iptal + REMINDER-AI WA |
| `POST /api/extreme/maas` | Drone/GoPro MaaS QR |
| `POST /api/extreme/wallet/spend` | NFC cüzdan F&B |

> `server/events.js` ve `server/integrations.js` dokunulmaz; bildirim `appendAudit` ile akar.

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
