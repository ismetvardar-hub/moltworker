export type PageId = 'komuta' | 'ollama' | 'ajanlar' | 'olympospass';

export type SystemHealth = 'online' | 'degraded' | 'offline' | 'unknown';

export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
  details?: {
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
}

export interface OllamaStatus {
  reachable: boolean;
  version?: string;
  error?: string;
  checkedAt: Date;
}

export interface Directive {
  id: number;
  text: string;
  issuedAt: Date;
  status: 'kuyrukta' | 'isleniyor' | 'tamamlandi';
}

export type AgentState = 'aktif' | 'beklemede' | 'hata';

export interface Agent {
  id: string;
  name: string;
  role: string;
  model: string;
  state: AgentState;
  task: string;
}

export type PassTier = 'Platin' | 'Altın' | 'Gümüş' | 'Standart';

export interface PassHolder {
  id: string;
  name: string;
  tier: PassTier;
  zones: string[];
  lastEntry: string;
  active: boolean;
}

export interface AccessEvent {
  id: number;
  holder: string;
  gate: string;
  time: string;
  allowed: boolean;
}
