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
