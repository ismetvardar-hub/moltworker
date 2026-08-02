/**
 * HERODOT — Otonom Web Araştırma & İstihbarat Modülü.
 *
 * Canlı arama: Vite middleware / bağımsız proxy üzerinden GET /api/search.
 * Sağlayıcı sırası (sunucu tarafı): Brave → Tavily → DuckDuckGo → fallback havuz.
 *
 * Ücretsiz derin okuma (Agent Reach): `agentReach.ts` — Jina / Reddit / GitHub README.
 * Ajan playbook: `.agents/agent-reach.md`
 */

export {
  readUrlAsMarkdown,
  fetchRedditHot,
  fetchGithubReadme,
  readXPostAsMarkdown,
  packReachContext,
} from './agentReach'

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface SearchResponse {
  query: string;
  provider: string;
  live: boolean;
  results: ResearchSource[];
  note?: string;
  errors?: string[];
  error?: string;
}

/** Yerel arama proxy'sine istek atar (Vite middleware: /api/search). */
export async function fetchLiveSources(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  const url = `/api/search?q=${encodeURIComponent(query)}&limit=5`;
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Arama proxy'si HTTP ${res.status}`);
  }
  return (await res.json()) as SearchResponse;
}

/** Tarama günlüğü satırları — canlı kaynaklardan veya hata mesajından. */
export function buildSearchLogLines(query: string, search: SearchResponse): string[] {
  const mode = search.live ? 'CANLI WEB' : 'FALLBACK HAVUZ';
  const lines = [
    `[HERODOT] Otonom web taraması başlatıldı: "${query}"`,
    `[HERODOT] Sağlayıcı: ${search.provider} · mod: ${mode}`,
  ];
  if (search.note) lines.push(`[HERODOT] Not: ${search.note}`);

  for (const s of search.results) {
    lines.push(`[KAYNAK] ${s.title}`);
    lines.push(`  └─ ${s.url}`);
    if (s.snippet) lines.push(`  └─ snippet: ${s.snippet}`);
  }

  lines.push(
    `[HERODOT] ${search.results.length} kaynak derlendi; analist raporu için Ollama'ya besleniyor…`,
  );
  return lines;
}

/** Bulgular derlendikten sonra modele gidecek analist raporu promptu. */
export function buildResearchPrompt(query: string, sources: ResearchSource[]): string {
  const context = sources
    .map(
      (s, i) =>
        `${i + 1}. ${s.title}\n   URL: ${s.url}\n   Özet: ${s.snippet || '(snippet yok)'}`,
    )
    .join('\n\n');

  return [
    'Sen HERODOT adlı Web Rakip İstihbaratçısı ajansın.',
    `CEO araştırma talebi: "${query}"`,
    'Aşağıdaki CANLI web arama bulgularını kullanarak kısa bir analist raporu yaz.',
    'Format: 📊 HERODOT İSTİHBARAT RAPORU başlığı; ardından "Öne Çıkan Bulgular", "Riskler & Fırsatlar" ve "LİKYA-1 için Öneriler" bölümleri.',
    'Kaynak numaralarına (1, 2, …) atıf yap. Uydurma bilgi ekleme; yalnızca verilen bağlamı kullan.',
    `Canlı web kaynakları:\n---\n${context || '(kaynak yok)'}\n---`,
  ].join('\n\n');
}

/** Ollama çevrimdışıyken, canlı kaynaklara dayalı hazır analist raporu. */
export function reportFromSources(query: string, sources: ResearchSource[], live: boolean): string {
  const bullets =
    sources.length > 0
      ? sources
          .slice(0, 5)
          .map((s, i) => `• [${i + 1}] ${s.title}: ${s.snippet || s.url}`)
          .join('\n')
      : '• Canlı kaynak bulunamadı; genel istihbarat çerçevesi kullanıldı.';

  return [
    '📊 HERODOT İSTİHBARAT RAPORU',
    `Konu: ${query}`,
    `Veri modu: ${live ? 'Canlı web araması' : 'Fallback istihbarat havuzu'}`,
    '',
    'Öne Çıkan Bulgular:',
    bullets,
    '',
    'Riskler & Fırsatlar:',
    '• Geçiş teknolojilerinde hibrit (QR/NFC/BLE) yaklaşımlar hızla yayılıyor — NEXUS uyumu kritik.',
    '• Veri saklama ve biyometrik uyum (KVKK/GDPR) VALKYRIE takibinde tutulmalı.',
    '',
    'LİKYA-1 için Öneriler:',
    '1. En güncel canlı kaynakları ARTE/KALYPSO lansman metnine dayanak olarak kullanın.',
    '2. Teknik bulguları ATLAS + NEXUS ile OlymposPass v2 yol haritasına işleyin.',
    '3. Uyum risklerini VALKYRIE denetim kuyruğuna ekleyin.',
  ].join('\n');
}
