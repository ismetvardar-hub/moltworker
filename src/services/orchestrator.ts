import { AGENTS } from '../data/agents';
import type { Assignment, PipelineStep } from '../types';

interface RoutingRule {
  agentId: string;
  keywords: string[];
  subtask: string;
}

/**
 * LİKYA-1'in anahtar kelime tabanlı görev dağıtım matrisi (26 ajan / 9 departman).
 * Bir talimat birden fazla kurala uyarsa ilgili tüm ajanlara iş düşer.
 */
const ROUTING_RULES: RoutingRule[] = [
  // C-Suite & Stratejik Komuta
  {
    agentId: 'daze-hub',
    keywords: ['daze hub', 'merkezi beyin', 'sistem performans', 'veri akışı'],
    subtask: 'Merkezi veri ve performans koordinasyonu',
  },

  // Teknoloji, Bulut & Yazılım
  {
    agentId: 'atlas',
    keywords: ['api', 'backend', 'veritabanı', 'postgresql', 'redis', 'mikroservis', 'endpoint', 'sunucu', 'fonksiyon', 'kod', 'python'],
    subtask: 'Backend/API geliştirme',
  },
  {
    agentId: 'phaselis',
    keywords: ['web', 'arayüz', 'panel', 'portal', 'sayfa', 'frontend', 'responsive', 'react'],
    subtask: 'Web arayüzü geliştirme',
  },
  {
    agentId: 'olympos-mobile',
    keywords: ['mobil', 'ios', 'android', 'flutter', 'react native', 'cüzdan uygulaması'],
    subtask: 'Mobil uygulama geliştirme',
  },
  {
    agentId: 'chimera',
    keywords: ['güvenlik', 'penetrasyon', 'owasp', 'auth', 'yetkilendirme', 'siber', 'qa testi'],
    subtask: 'Güvenlik denetimi ve QA',
  },
  {
    agentId: 'nexus',
    keywords: ['iot', 'turnike', 'rfid', 'esp32', 'raspberry', 'donanım', 'sensör', 'mutfak ekranı', 'kapı geçiş'],
    subtask: 'IoT ve donanım entegrasyonu',
  },

  // Satın Alma, Depo & Stok
  {
    agentId: 'agora',
    keywords: ['tedarik', 'satın alma', 'fiyat teklifi', 'tedarikçi', 'hammadde', 'sipariş hazırla'],
    subtask: 'Tedarik ve satın alma süreci',
  },
  {
    agentId: 'hephaestus',
    keywords: ['stok', 'depo', 'reçete', 're-order', 'envanter'],
    subtask: 'Depo ve stok takibi',
  },
  {
    agentId: 'logos',
    keywords: ['lojistik', 'teslimat', 'rota', 'soğuk zincir', 'termal'],
    subtask: 'Lojistik ve soğuk zincir planlaması',
  },

  // Hukuk, Uyum & Risk
  {
    agentId: 'themis',
    keywords: ['sözleşme', 'nda', 'hukuk', 'şartname', 'gizlilik metni'],
    subtask: 'Hukuki metin hazırlığı',
  },
  {
    agentId: 'valkyrie',
    keywords: ['kvkk', 'gdpr', 'veri koruma', 'biyometrik', 'uyum raporu'],
    subtask: 'KVKK/GDPR uyum denetimi',
  },
  {
    agentId: 'veritas',
    keywords: ['marka tescil', 'telif', 'lisans', 'patent', 'fikri mülkiyet'],
    subtask: 'Fikri mülkiyet koruması',
  },

  // Satış, İş Geliştirme & CRM
  {
    agentId: 'hermes-sales',
    keywords: ['satış', 'b2b', 'kurumsal paket', 'teklif hazırla', 'sunum', 'fiyatlama stratejisi'],
    subtask: 'Kurumsal satış teklifi',
  },
  {
    agentId: 'daze-vision',
    keywords: ['müşteri deneyimi', 'yaşam koçu', 'kıyafet', 'buzdolabı', 'daze vision'],
    subtask: 'Müşteri deneyimi tasarımı',
  },
  {
    agentId: 'reminder-ai',
    keywords: ['whatsapp', 'hatırlatma', 'bildirim', 'sipariş hazır', 'reminder'],
    subtask: 'WhatsApp bildirim akışı',
  },
  {
    agentId: 'aura',
    keywords: ['sadakat', 'hediye', 'ikram', 'puan', 'daze-gift', 'daze gift'],
    subtask: 'Sadakat ve ödül planlaması',
  },

  // Kreatif, Medya & Pazarlama
  {
    agentId: 'arte',
    keywords: ['görsel', 'tasarım', 'afiş', 'poster', 'logo', 'banner', 'illüstrasyon'],
    subtask: 'Görsel/afiş üretimi',
  },
  {
    agentId: 'prometheus',
    keywords: ['video', 'shorts', 'reels', 'motion', 'animasyon', 'kurgu'],
    subtask: 'Video içerik üretimi',
  },
  {
    agentId: 'kalypso',
    keywords: ['metin', 'slogan', 'lansman', 'blog', 'hikaye', 'kampanya', 'post'],
    subtask: 'Kreatif metin üretimi',
  },
  {
    agentId: 'babel',
    keywords: ['çevir', 'çeviri', 'ingilizce', 'almanca', 'rusça', 'arapça', 'lokalizasyon', 'dil'],
    subtask: 'Çoklu dil çevirisi',
  },

  // İnsan Kaynakları & Operasyon
  {
    agentId: 'daze-crew',
    keywords: ['personel', 'vardiya', 'saatlik kazanç', 'performans puan', 'daze crew'],
    subtask: 'Personel portalı ve vardiya takibi',
  },
  {
    agentId: 'socrates',
    keywords: ['eğitim', 'akademi', 'nezaket eğitimi', 'simülasyon senaryo'],
    subtask: 'Nezaket akademisi eğitimi',
  },

  // Finans, Fiyatlandırma & Borsa
  {
    agentId: 'plutus',
    keywords: ['bütçe', 'harcama', 'maliyet', 'gider', 'api harcama'],
    subtask: 'Bütçe ve maliyet analizi',
  },
  {
    agentId: 'mint',
    keywords: ['borsa', 'dinamik fiyat', 'fiyat esnet', 'yoğunluk fiyat'],
    subtask: 'Dinamik fiyatlama algoritması',
  },

  // AR-GE & Pazar İstihbaratı
  {
    agentId: 'herodot',
    keywords: ['rakip', 'pazar araştırma', 'istihbarat', 'trend tara', 'pazar analizi', 'incele', 'araştır', 'tara'],
    subtask: 'Otonom web araştırması ve istihbarat raporu',
  },
  {
    agentId: 'odysseus',
    keywords: ['yeni model', 'deepseek-r1', 'llama-3.3', 'açık kaynak model', 'model test'],
    subtask: 'Yeni AI model entegrasyonu',
  },

  // Genel raporlama (DAZE-HUB'a düşer)
  {
    agentId: 'daze-hub',
    keywords: ['rapor', 'analiz', 'istatistik', 'metrik'],
    subtask: 'Veri analizi ve raporlama',
  },
];

function toAssignment(agentId: string, subtask: string): Assignment | null {
  const agent = AGENTS.find((a) => a.id === agentId);
  return agent ? { agentId: agent.id, agentName: agent.name, subtask } : null;
}

/**
 * LİKYA-1: CEO talimatını analiz eder ve ilgili ajanlara alt görev dağıtır.
 * - Hiçbir kural eşleşmezse talimat varsayılan olarak ATLAS'a yönlendirilir.
 * - Master Kural gereği her dağıtıma ETHOS üslup denetimi eklenir.
 */
export function routeDirective(directive: string): Assignment[] {
  const text = ` ${directive.toLowerCase()} `;
  const assignments: Assignment[] = [];

  for (const rule of ROUTING_RULES) {
    if (rule.keywords.some((k) => text.includes(k))) {
      const found = toAssignment(rule.agentId, rule.subtask);
      if (found && !assignments.some((a) => a.agentId === found.agentId)) {
        assignments.push(found);
      }
    }
  }

  if (assignments.length === 0) {
    const fallback = toAssignment('atlas', 'Genel teknik görev');
    if (fallback) assignments.push(fallback);
  }

  // Master Kural: ETHOS her çıktıyı centilmenlik/naiflik/espri filtresinden geçirir.
  const ethos = toAssignment('ethos', 'Üslup ve nezaket denetimi (Master Kural)');
  if (ethos && !assignments.some((a) => a.agentId === ethos.agentId)) {
    assignments.push(ethos);
  }

  return assignments;
}

// ─── Zincirleme Görev Akışı (Task Chaining Pipeline) ─────────────────

/**
 * Zincir sıralaması: üreticiler önce çalışır, dönüştürücüler (çeviri vb.)
 * ortada, ETHOS Master Kural denetimi her zaman zincirin sonundadır.
 */
const CHAIN_STAGE: Record<string, number> = {
  herodot: 5, // istihbarat önce toplanır ki üreticiler ondan beslenebilsin
  babel: 50,
  chimera: 60,
  valkyrie: 60,
  ethos: 99,
};

/**
 * LİKYA-1: talimatın dağılımını sıralı bir üretim zincirine dönüştürür.
 * Her adımın çıktısı bir sonraki adıma girdi olarak aktarılır.
 */
export function buildPipeline(directive: string): PipelineStep[] {
  return routeDirective(directive)
    .map((assignment) => ({
      assignment,
      engine: AGENTS.find((a) => a.id === assignment.agentId)?.engine ?? 'llama3',
      status: 'bekliyor' as const,
      output: '',
    }))
    .sort(
      (a, b) =>
        (CHAIN_STAGE[a.assignment.agentId] ?? 10) - (CHAIN_STAGE[b.assignment.agentId] ?? 10),
    );
}

/** Ajan bazlı adım talimatları: modele o adımda ne yapacağını söyler. */
const STEP_INSTRUCTIONS: Record<string, string> = {
  kalypso:
    'Marka dilimize uygun (centilmen, naif ve zarif esprili) Türkçe içerik üret. Kısa ve etkili yaz.',
  babel:
    'Önceki ajandan gelen içeriği, talimatta belirtilen hedef dile kültürel bağlamı koruyarak çevir. Dil belirtilmemişse İngilizceye çevir. Sadece çeviriyi ve kısa bir çevirmen notunu döndür.',
  ethos:
    'Önceki içeriği Master Kural olan "Centilmenlik, Naiflik ve Esprili Üslup" kriterlerine göre denetle. 2-3 cümlelik denetim raporu yaz; uygunsa raporu "ONAY ✓" ile bitir, değilse nazikçe düzeltme öner.',
  arte: 'İstenen görsel için ayrıntılı bir görüntü üretim promptu (İngilizce) ve kısa Türkçe konsept açıklaması hazırla.',
  prometheus: 'İstenen video için sahne sahne kurgu planı ve senaryo taslağı hazırla.',
  atlas: 'İstenen backend/API görevini kod örneğiyle birlikte yerine getir.',
  themis: 'İstenen hukuki metnin madde madde taslağını hazırla.',
  herodot:
    'Aşağıdaki web taraması bulgularını analist raporu formatında özetle: Bulgular, Riskler/Fırsatlar ve LİKYA-1 için Öneriler bölümleri olsun.',
};

/** Zincirdeki bir adım için modele gidecek promptu üretir. */
export function buildStepPrompt(
  step: PipelineStep,
  directive: string,
  previousOutput: string,
): string {
  const agent = AGENTS.find((a) => a.id === step.assignment.agentId);
  const instruction =
    STEP_INSTRUCTIONS[step.assignment.agentId] ??
    `Rolüne uygun şekilde şu alt görevi yerine getir: ${step.assignment.subtask}.`;

  const parts = [
    `Sen ${agent?.name ?? step.assignment.agentName} adlı ajansın (${agent?.role ?? ''}).`,
    instruction,
    `CEO talimatı: "${directive}"`,
  ];
  if (previousOutput.trim()) {
    parts.push(`Önceki ajandan devraldığın çıktı:\n---\n${previousOutput.trim()}\n---`);
  }
  return parts.join('\n\n');
}

/** Ollama çevrimdışıyken zincirin adım adım çalıştığını gösteren simülasyon çıktıları. */
const SIMULATED_OUTPUTS: Record<string, (directive: string) => string> = {
  kalypso: () =>
    'Taslak metin: "Likya\'nın kapıları tek bir zarif dokunuşla açılır. OlymposPass — ' +
    'cebinizde taşıdığınız küçük bir anahtar, ama açtığı kapılar kocaman. ' +
    'Kuyruklar mı? Onları tarih kitaplarına havale ettik."',
  babel: () =>
    'Übersetzung (DE): "Die Tore Lykiens öffnen sich mit einer einzigen eleganten Berührung. ' +
    'OlymposPass — ein kleiner Schlüssel in Ihrer Tasche, der große Türen öffnet. ' +
    'Warteschlangen? Die haben wir den Geschichtsbüchern überlassen."\n\n' +
    'Çevirmen notu: Espri kültürel bağlama uyarlandı.',
  ethos: () =>
    'ETHOS Denetim Raporu: Metin sade ve naif; espri zarif, kimseyi kırmıyor. ' +
    'Centilmenlik kriterleri tam puan. ONAY ✓',
  arte: (d) =>
    `Görsel prompt: "elegant minimalist poster, turquoise Lycian coast, golden pass card, soft morning light" — Konsept: ${d.slice(0, 60)}…`,
  atlas: () => '// Örnek uç nokta taslağı hazırlandı: POST /api/pass/verify (bkz. API şeması)',
  default: (d) => `Alt görev tamamlandı: "${d.slice(0, 80)}" için çıktı üretildi ve zincire devredildi.`,
};

export function simulatedStepOutput(agentId: string, directive: string): string {
  return (SIMULATED_OUTPUTS[agentId] ?? SIMULATED_OUTPUTS.default)(directive);
}
