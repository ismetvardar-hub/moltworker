import { getToken } from './auth';

export interface LiveEvent {
  type: string;
  id?: string;
  at: string;
  actor?: string;
  action?: string;
  detail?: string;
  meta?: Record<string, unknown>;
}

type Handler = (event: LiveEvent) => void;

/**
 * SSE canlı olay akışı. EventSource Authorization desteklemediği için token query'de gider.
 */
export function subscribeLiveEvents(onEvent: Handler): () => void {
  const token = getToken();
  if (!token || typeof EventSource === 'undefined') {
    return () => undefined;
  }
  const es = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);
  es.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data) as LiveEvent;
      onEvent(data);
    } catch {
      /* ignore malformed */
    }
  };
  return () => {
    es.close();
  };
}
