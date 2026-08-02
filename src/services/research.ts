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
  type AgentReachDoc,
} from './agentReach'
import {
  readUrlAsMarkdown,
  fetchRedditHot,
  readXPostAsMarkdown,
  type AgentReachDoc,
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
    `[HERODOT] ${search.results.length} kaynak derlendi; Agent Reach derin okuma + AI analist raporu…`,
  );
  return lines;
}

/**
 * Agent Reach derin okuma: arama sonuçlarından ilk URL'leri Jina ile Markdown'a çevir.
 * Reddit / X URL veya r/subreddit sorgularını da yakalar.
 */
export async function deepReadWithAgentReach(
  query: string,
  sources: ResearchSource[],
  signal?: AbortSignal,
  limit = 2,
): Promise<{ docs: AgentReachDoc[]; log: string[] }> {
  const log: string[] = []
  const docs: AgentReachDoc[] = []
  const q = query.trim()

  // Doğrudan X / Twitter URL
  const xMatch = q.match(/https?:\/\/(?:x\.com|twitter\.com)\/\S+/i)
  if (xMatch) {
    try {
      log.push(`[REACH] X/Twitter okunuyor: ${xMatch[0]}`)
      docs.push(await readXPostAsMarkdown(xMatch[0], signal))
    } catch (err) {
      log.push(`[REACH] X okuma hatası: ${err instanceof Error ? err.message : 'bilinmiyor'}`)
    }
  }

  // r/subreddit veya "reddit xxx"
  const subMatch = q.match(/\br\/([a-zA-Z0-9_]+)\b/) || q.match(/\breddit\s+([a-zA-Z0-9_]+)\b/i)
  if (subMatch && docs.length < limit) {
    try {
      log.push(`[REACH] Reddit hot: r/${subMatch[1]}`)
      const hot = await fetchRedditHot(subMatch[1], 3, signal)
      for (const item of hot.slice(0, 2)) {
        if (docs.length >= limit) break
        try {
          docs.push(await readUrlAsMarkdown(item.permalink || item.url, signal))
        } catch {
          /* tek post başarısız olabilir */
        }
      }
    } catch (err) {
      log.push(`[REACH] Reddit hatası: ${err instanceof Error ? err.message : 'bilinmiyor'}`)
    }
  }

  for (const src of sources) {
    if (docs.length >= limit) break
    if (!src.url || !/^https?:\/\//i.test(src.url)) continue
    if (/reddit\.com|x\.com|twitter\.com/i.test(src.url) && docs.length > 0) continue
    try {
      log.push(`[REACH] Jina derin okuma: ${src.url}`)
      docs.push(await readUrlAsMarkdown(src.url, signal))
    } catch (err) {
      log.push(
        `[REACH] Okunamadı (${src.title || src.url}): ${err instanceof Error ? err.message : 'hata'}`,
      )
    }
  }

  log.push(`[REACH] ${docs.length} sayfa Markdown olarak derlendi (0 TL).`)
  return { docs, log }
}

/** Bulgular derlendikten sonra modele gidecek analist raporu promptu. */
export function buildResearchPrompt(
  query: string,
  sources: ResearchSource[],
  deepMarkdown = '',
): string {
  const context = sources
    .map(
      (s, i) =>
        `${i + 1}. ${s.title}\n   URL: ${s.url}\n   Özet: ${s.snippet || '(snippet yok)'}`,
    )
    .join('\n\n');

  const deepBlock = deepMarkdown
    ? `\nAgent Reach derin okuma (Markdown):\n---\n${deepMarkdown.slice(0, 12000)}\n---`
    : '';

  return [
    'Sen HERODOT adlı Web Rakip İstihbaratçısı ajansın.',
    `CEO araştırma talebi: "${query}"`,
    'Aşağıdaki CANLI web arama bulgularını ve (varsa) Agent Reach derin okumayı kullanarak kısa bir analist raporu yaz.',
    'Format: 📊 HERODOT İSTİHBARAT RAPORU başlığı; ardından "Öne Çıkan Bulgular", "Riskler & Fırsatlar" ve "LİKYA-1 için Öneriler" bölümleri.',
    'Kaynak numaralarına (1, 2, …) atıf yap. Uydurma bilgi ekleme; yalnızca verilen bağlamı kullan.',
    'Üslup: sade, naif, zarif esprili (ETHOS). Küfür yok.',
    `Canlı web kaynakları:\n---\n${context || '(kaynak yok)'}\n---${deepBlock}`,
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
