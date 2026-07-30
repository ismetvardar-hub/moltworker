/**
 * HERODOT — Otonom Web Araştırma & İstihbarat Modülü.
 *
 * Tarayıcıdan gerçek arama motoru API'sine erişim (CORS/anahtar) gerektirdiği
 * için tarama aşaması simüle edilir; toplanan bulgular Ollama çevrimiçiyse
 * gerçek modele özetletilir, değilse hazır analist raporu döndürülür.
 */

export interface ResearchSource {
  title: string;
  url: string;
  finding: string;
}

const SOURCE_POOL: ResearchSource[] = [
  {
    title: 'European Transit Tech Review 2026',
    url: 'transittechreview.eu/2026-gateless-access',
    finding: 'Turnikesiz (gateless) geçişlerde BLE + UWB hibrit doğrulama %34 büyüdü',
  },
  {
    title: 'Retail & Access Weekly',
    url: 'retailaccessweekly.com/qr-nfc-trends',
    finding: 'QR + NFC hibrit kartlar Akdeniz turizm bölgelerinde standartlaşıyor',
  },
  {
    title: 'IoT Gateways Quarterly',
    url: 'iotgateways.io/reports/q2-2026',
    finding: 'ESP32 tabanlı geçiş kontrolörlerinde birim maliyet %18 düştü',
  },
  {
    title: 'Hospitality AI Digest',
    url: 'hospitalityai.digest/dynamic-pricing',
    finding: 'Yoğunluğa dayalı dinamik fiyatlama misafir memnuniyetini düşürmeden geliri %11 artırdı',
  },
  {
    title: 'GDPR Watch Bulletin',
    url: 'gdprwatch.org/biometric-access-2026',
    finding: 'Biyometrik geçişte açık rıza + 30 gün saklama sınırı yeni içtihat haline geldi',
  },
];

/** Tarama günlüğü: HERODOT'un adım adım web taraması yapıyormuş gibi akan logları. */
export function buildSearchLog(query: string): string[] {
  const lines = [
    `[HERODOT] Otonom web taraması başlatıldı: "${query}"`,
    '[HERODOT] Arama stratejisi: 3 dil · 5 kaynak türü · son 12 ay',
  ];
  for (const s of SOURCE_POOL) {
    lines.push(`[KAYNAK] ${s.title} — ${s.url}`);
    lines.push(`  └─ bulgu: ${s.finding}`);
  }
  lines.push('[HERODOT] 5 kaynak tarandı, bulgular analiz için derlendi.');
  return lines;
}

/** Bulgular derlendikten sonra modele gidecek analist raporu promptu. */
export function buildResearchPrompt(query: string, searchLog: string): string {
  return [
    'Sen HERODOT adlı Web Rakip İstihbaratçısı ajansın.',
    `CEO araştırma talebi: "${query}"`,
    'Aşağıdaki tarama bulgularını kullanarak kısa bir analist raporu yaz.',
    'Format: 📊 HERODOT İSTİHBARAT RAPORU başlığı; ardından "Öne Çıkan Bulgular", "Riskler & Fırsatlar" ve "LİKYA-1 için Öneriler" bölümleri.',
    `Tarama bulguları:\n---\n${searchLog}\n---`,
  ].join('\n\n');
}

/** Ollama çevrimdışıyken gösterilen hazır analist raporu. */
export function simulatedReport(query: string): string {
  return [
    '📊 HERODOT İSTİHBARAT RAPORU',
    `Konu: ${query}`,
    '',
    'Öne Çıkan Bulgular:',
    '• Turnikesiz geçişte BLE + UWB hibrit doğrulama Avrupa\'da %34 büyüdü.',
    '• QR + NFC hibrit kartlar Akdeniz turizm bölgelerinde fiilî standart.',
    '• ESP32 tabanlı kontrolörlerde birim maliyet %18 düştü — NEXUS için fırsat.',
    '',
    'Riskler & Fırsatlar:',
    '• Biyometrik geçişte 30 gün saklama sınırı içtihatlaşıyor → VALKYRIE takibinde.',
    '• Dinamik fiyatlama geliri %11 artırıyor → MINT algoritmasıyla uyumlu.',
    '',
    'LİKYA-1 için Öneriler:',
    '1. OlymposPass v2 için BLE+UWB pilotu başlatılsın (NEXUS + ATLAS).',
    '2. Dinamik fiyat esnetmesi plaj girişlerinde A/B testine alınsın (MINT).',
    '3. Biyometrik veri politikası 30 gün sınırına şimdiden çekilsin (VALKYRIE).',
  ].join('\n');
}
