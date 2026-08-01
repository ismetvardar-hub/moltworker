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
| **41** | Kampanya / promo (`/api/campaigns`) |
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
| **56** | Şikayet kuyruğu (`/api/complaints`) |
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
