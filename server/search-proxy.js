/**
 * HERODOT — Canlı Web Arama Proxy'si
 *
 * Öncelik sırası:
 *  1. Brave Search API  (BRAVE_SEARCH_API_KEY)
 *  2. Tavily API         (TAVILY_API_KEY)
 *  3. DuckDuckGo HTML    (anahtar gerektirmez)
 *  4. Yerleşik istihbarat havuzu (ağ erişimi yoksa)
 *
 * Hem Vite middleware hem de bağımsız HTTP sunucusu olarak çalışır:
 *   node server/search-proxy.js          → :8787
 *   vite plugin ile                      → /api/search
 */

import http from 'node:http';
import { URL } from 'node:url';

const FALLBACK_POOL = [
  {
    title: 'European Transit Tech Review 2026',
    url: 'https://transittechreview.eu/2026-gateless-access',
    snippet: 'Turnikesiz (gateless) geçişlerde BLE + UWB hibrit doğrulama Avrupa genelinde %34 büyüdü.',
  },
  {
    title: 'Retail & Access Weekly — QR/NFC Trends',
    url: 'https://retailaccessweekly.com/qr-nfc-trends',
    snippet: 'QR + NFC hibrit kartlar Akdeniz turizm bölgelerinde fiilî standart hâline geliyor.',
  },
  {
    title: 'IoT Gateways Quarterly Q2 2026',
    url: 'https://iotgateways.io/reports/q2-2026',
    snippet: 'ESP32 tabanlı geçiş kontrolörlerinde birim maliyet %18 düştü; küçük işletmeler için erişilebilir.',
  },
  {
    title: 'Hospitality AI Digest — Dynamic Pricing',
    url: 'https://hospitalityai.digest/dynamic-pricing',
    snippet: 'Yoğunluğa dayalı dinamik fiyatlama misafir memnuniyetini düşürmeden geliri %11 artırdı.',
  },
  {
    title: 'GDPR Watch Bulletin — Biometric Access 2026',
    url: 'https://gdprwatch.org/biometric-access-2026',
    snippet: 'Biyometrik geçişte açık rıza + 30 gün saklama sınırı yeni içtihat haline geldi.',
  },
];

function decodeHtml(html) {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}

function stripTags(html) {
  return decodeHtml(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

async function searchBrave(query, limit) {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) return null;
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${limit}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Subscription-Token': key },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Brave HTTP ${res.status}`);
  const data = await res.json();
  const results = (data.web?.results ?? []).slice(0, limit).map((r) => ({
    title: r.title ?? 'Başlıksız',
    url: r.url ?? '',
    snippet: r.description ?? '',
  }));
  return { provider: 'brave', live: true, results };
}

async function searchTavily(query, limit) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return null;
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: key, query, max_results: limit, search_depth: 'basic' }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Tavily HTTP ${res.status}`);
  const data = await res.json();
  const results = (data.results ?? []).slice(0, limit).map((r) => ({
    title: r.title ?? 'Başlıksız',
    url: r.url ?? '',
    snippet: r.content ?? '',
  }));
  return { provider: 'tavily', live: true, results };
}

async function searchDuckDuckGo(query, limit) {
  // html.duckduckgo.com — anahtar gerektirmez; HTML sonuçlarını ayrıştırır.
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; LIKYA-HERODOT/1.0; +https://github.com/ismetvardar-hub/moltworker)',
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(10000),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`DuckDuckGo HTTP ${res.status}`);
  const html = await res.text();

  const results = [];
  // Her sonuç bloğu: class="result" ... <a class="result__a" href="...">title</a> ... result__snippet
  const blocks = html.split(/class="result\s/).slice(1);
  for (const block of blocks) {
    if (results.length >= limit) break;
    const linkMatch = block.match(/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;
    let href = decodeHtml(linkMatch[1]);
    // DuckDuckGo bazen /l/?uddg=... yönlendirmesi kullanır
    try {
      const u = new URL(href, 'https://duckduckgo.com');
      if (u.pathname === '/l/' && u.searchParams.get('uddg')) {
        href = decodeURIComponent(u.searchParams.get('uddg'));
      }
    } catch {
      /* ham href kalsın */
    }
    if (!/^https?:\/\//i.test(href)) continue;
    const title = stripTags(linkMatch[2]);
    const snipMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|td|div)>/i);
    const snippet = snipMatch ? stripTags(snipMatch[1]) : '';
    if (!title) continue;
    results.push({ title, url: href, snippet });
  }

  if (results.length === 0) throw new Error('DuckDuckGo sonuç ayrıştırılamadı');
  return { provider: 'duckduckgo', live: true, results };
}

function fallbackSearch(query) {
  const q = query.toLowerCase();
  // Sorguyla ilgili kaynakları öne al, yoksa tüm havuzu kullan.
  const scored = FALLBACK_POOL.map((s) => {
    const hay = `${s.title} ${s.snippet}`.toLowerCase();
    const hits = q.split(/\s+/).filter((w) => w.length > 3 && hay.includes(w)).length;
    return { s, hits };
  }).sort((a, b) => b.hits - a.hits);

  return {
    provider: 'fallback-pool',
    live: false,
    results: scored.map(({ s }) => s),
    note: 'Canlı web erişimi yok veya API anahtarı tanımlı değil; yerleşik istihbarat havuzu kullanıldı.',
  };
}

/** Ana arama: sağlayıcı zincirini dener, en az bir sonuç döndürür. */
export async function performSearch(query, limit = 5) {
  const q = (query ?? '').trim();
  if (!q) {
    return { query: '', provider: 'none', live: false, results: [], error: 'Boş sorgu' };
  }

  const providers = [searchBrave, searchTavily, searchDuckDuckGo];
  const errors = [];

  for (const fn of providers) {
    try {
      const result = await fn(q, limit);
      if (!result) continue; // API anahtarı yok
      if (result.results.length > 0) {
        return { query: q, ...result };
      }
    } catch (err) {
      errors.push(`${fn.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const fb = fallbackSearch(q);
  return { query: q, ...fb, errors };
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  res.end(payload);
}

/** Vite middleware / bağımsız sunucu için ortak istek işleyici. */
export async function handleSearchRequest(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Yalnızca GET desteklenir' });
    return;
  }

  try {
    const host = req.headers.host ?? 'localhost';
    const url = new URL(req.url ?? '/', `http://${host}`);
    const query = url.searchParams.get('q') ?? '';
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 5) || 5, 10);
    const result = await performSearch(query, limit);
    sendJson(res, 200, result);
  } catch (err) {
    sendJson(res, 500, {
      error: err instanceof Error ? err.message : 'Arama başarısız',
      live: false,
      results: [],
    });
  }
}

/** Vite eklentisi: geliştirme sunucusuna GET /api/search ekler. */
export function herodotSearchPlugin() {
  return {
    name: 'herodot-search-proxy',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0];
        if (path === '/api/search') {
          void handleSearchRequest(req, res);
          return;
        }
        next();
      });
    },
  };
}

// Bağımsız çalıştırma: node server/search-proxy.js
const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith('search-proxy.js') || process.argv[1].includes('search-proxy'));

if (isMain) {
  const port = Number(process.env.SEARCH_PROXY_PORT ?? 8787);
  http.createServer(handleSearchRequest).listen(port, () => {
    console.log(`[HERODOT] arama proxy'si http://localhost:${port}/api/search?q=...`);
  });
}
