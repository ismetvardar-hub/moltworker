import type { OllamaModel, OllamaStatus } from '../types';

export const OLLAMA_BASE_URL = 'http://localhost:11434';

/** Panelin takip ettiği hedef modeller. */
export const TARGET_MODELS = ['deepseek-coder', 'qwen2.5', 'llama3'] as const;

async function fetchWithTimeout(path: string, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${OLLAMA_BASE_URL}${path}`, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Ollama sunucusunun ayakta olup olmadığını ve sürümünü kontrol eder. */
export async function checkOllamaStatus(): Promise<OllamaStatus> {
  try {
    const res = await fetchWithTimeout('/api/version');
    if (!res.ok) {
      return {
        reachable: false,
        error: `Sunucu ${res.status} yanıtı döndürdü`,
        checkedAt: new Date(),
      };
    }
    const data = (await res.json()) as { version?: string };
    return { reachable: true, version: data.version, checkedAt: new Date() };
  } catch (err) {
    const message =
      err instanceof DOMException && err.name === 'AbortError'
        ? 'Bağlantı zaman aşımına uğradı'
        : 'Sunucuya ulaşılamadı (Ollama çalışıyor mu?)';
    return { reachable: false, error: message, checkedAt: new Date() };
  }
}

/** Yüklü modellerin listesini çeker (GET /api/tags). */
export async function listOllamaModels(): Promise<OllamaModel[]> {
  const res = await fetchWithTimeout('/api/tags');
  if (!res.ok) {
    throw new Error(`Model listesi alınamadı (HTTP ${res.status})`);
  }
  const data = (await res.json()) as { models?: OllamaModel[] };
  return data.models ?? [];
}

/** Bayt cinsinden boyutu okunabilir biçime çevirir. */
export function formatBytes(bytes: number): string {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

/** Yüklü model listesinde hedef modelin bulunup bulunmadığını kontrol eder. */
export function isModelInstalled(target: string, installed: OllamaModel[]): boolean {
  return installed.some((m) => m.name.toLowerCase().startsWith(target.toLowerCase()));
}

/**
 * Ajan motorunu yüklü bir Ollama modeline çözümler.
 * Önce tam ön ek (örn. "qwen2.5:32b"), sonra taban ad (örn. "qwen2.5") denenir;
 * eşleşme yoksa (örn. "Midjourney / Flux" gibi harici motorlar) fallback döner.
 */
export function resolveModel(engine: string, installed: OllamaModel[], fallback: string): string {
  const lower = engine.toLowerCase();
  const exact = installed.find((m) => m.name.toLowerCase().startsWith(lower));
  if (exact) return exact.name;
  const base = lower.split(':')[0];
  const baseMatch = installed.find((m) => m.name.toLowerCase().startsWith(base));
  if (baseMatch) return baseMatch.name;
  return fallback;
}

const SYSTEM_PROMPT =
  'Sen OlymposPass Ekosistemi için çalışan LİKYA adlı otonom bir yazılım ajanısın. ' +
  'CEO panelinden gelen talimatları yerine getirir, kod üretir ve kısa, teknik yanıtlar verirsin. ' +
  'Kod bloklarını markdown biçiminde döndür.';

/**
 * Talimatı Ollama'ya gönderir ve yanıtı token token akıtır (POST /api/generate, NDJSON stream).
 * Yanıt tamamlanana kadar her parça için string üretir; iptal için AbortSignal kullanılır.
 */
export async function* streamGenerate(
  model: string,
  prompt: string,
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, system: SYSTEM_PROMPT, stream: true }),
    signal,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Ollama isteği başarısız (HTTP ${res.status})${detail ? `: ${detail}` : ''}`);
  }
  if (!res.body) {
    throw new Error('Ollama akış gövdesi boş döndü');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // NDJSON: her satır ayrı bir JSON parçası.
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        const chunk = JSON.parse(line) as { response?: string; done?: boolean; error?: string };
        if (chunk.error) throw new Error(chunk.error);
        if (chunk.response) yield chunk.response;
        if (chunk.done) return;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
