import type { PipelineStep, WebSource } from '../types';

const STORAGE_KEY = 'likya-directive-archive-v1';
const MAX_ENTRIES = 100;

export interface ArchiveStep {
  agentId: string;
  agentName: string;
  subtask: string;
  engine: string;
  status: PipelineStep['status'];
  output: string;
  sources?: WebSource[];
  searchProvider?: string;
  searchLive?: boolean;
}

export interface ArchiveEntry {
  id: number;
  text: string;
  issuedAt: string;
  completedAt: string;
  status: 'tamamlandi' | 'hata';
  model?: string;
  agents: string[];
  steps: ArchiveStep[];
}

export type ArchiveFilter = {
  query?: string;
  agent?: string;
  status?: 'all' | 'tamamlandi' | 'hata';
};

function readRaw(): ArchiveEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ArchiveEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(entries: ArchiveEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function loadArchive(): ArchiveEntry[] {
  return readRaw();
}

export function saveArchiveEntry(entry: ArchiveEntry): ArchiveEntry[] {
  const next = [entry, ...readRaw().filter((e) => e.id !== entry.id)].slice(0, MAX_ENTRIES);
  writeRaw(next);
  return next;
}

export function deleteArchiveEntry(id: number): ArchiveEntry[] {
  const next = readRaw().filter((e) => e.id !== id);
  writeRaw(next);
  return next;
}

export function clearArchive(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Pipeline adımlarından arşiv kaydı üretir. */
export function buildArchiveEntry(input: {
  id: number;
  text: string;
  issuedAt: Date;
  status: 'tamamlandi' | 'hata';
  model?: string;
  steps: PipelineStep[];
}): ArchiveEntry {
  return {
    id: input.id,
    text: input.text,
    issuedAt: input.issuedAt.toISOString(),
    completedAt: new Date().toISOString(),
    status: input.status,
    model: input.model,
    agents: input.steps.map((s) => s.assignment.agentName),
    steps: input.steps.map((s) => ({
      agentId: s.assignment.agentId,
      agentName: s.assignment.agentName,
      subtask: s.assignment.subtask,
      engine: s.engine,
      status: s.status,
      output: s.output,
      sources: s.sources,
      searchProvider: s.searchProvider,
      searchLive: s.searchLive,
    })),
  };
}

export function filterArchive(entries: ArchiveEntry[], filter: ArchiveFilter): ArchiveEntry[] {
  const q = (filter.query ?? '').trim().toLowerCase();
  return entries.filter((e) => {
    if (filter.status && filter.status !== 'all' && e.status !== filter.status) return false;
    if (filter.agent && !e.agents.some((a) => a === filter.agent)) return false;
    if (!q) return true;
    const hay = [
      e.text,
      e.model ?? '',
      ...e.agents,
      ...e.steps.map((s) => s.output),
    ]
      .join('\n')
      .toLowerCase();
    return hay.includes(q);
  });
}

/** Arşivi JSON dosyası olarak indirir. */
export function exportArchiveJson(entries: ArchiveEntry[], filename?: string): void {
  const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    filename ?? `likya-arsiv-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Tek bir kaydı JSON olarak indirir. */
export function exportEntryJson(entry: ArchiveEntry): void {
  const safe = entry.text.slice(0, 40).replace(/[^\wğüşıöçĞÜŞİÖÇ\- ]+/gi, '').trim().replace(/\s+/g, '-');
  exportArchiveJson([entry], `likya-${entry.id}-${safe || 'kayit'}.json`);
}
