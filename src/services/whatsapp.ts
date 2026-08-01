/** REMINDER-AI — WhatsApp bildirim servisi (Twilio / Meta / mock). */

export interface WhatsAppResult {
  ok: boolean;
  live: boolean;
  id: string;
  provider: string;
  status: string;
  body: string;
  to: string;
  guest?: string | null;
  orderId?: number | null;
  kind?: string;
  note?: string;
  at: string;
}

export function buildReadyMessage(guest: string, item: string, orderId: number): string {
  const name = guest.split(' ')[0] || 'Misafirimiz';
  return (
    `Merhaba ${name} ☕ Siparişiniz hazır: ${item} (#${orderId}). ` +
    `Tezgâhtan nazikçe teslim alabilirsiniz — kuyruk yok, gülümseyen bir el bekliyor.`
  );
}

export function buildThermalMessage(guest: string, item: string, orderId: number): string {
  const name = guest.split(' ')[0] || 'Misafirimiz';
  return (
    `Merhaba ${name}, ${item} (#${orderId}) 2 dakikadır sizi özledi 🌡️ ` +
    `Ürünü termal korumaya aldık; geldiğinizde taze ve sıcak teslim edeceğiz.`
  );
}

export async function sendWhatsApp(input: {
  to?: string;
  body: string;
  guest?: string;
  orderId?: number;
  kind?: 'ready' | 'thermal' | 'custom';
}): Promise<WhatsAppResult> {
  const res = await fetch('/api/whatsapp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || `WhatsApp HTTP ${res.status}`);
  }
  return (await res.json()) as WhatsAppResult;
}

export async function fetchWhatsAppLog(): Promise<WhatsAppResult[]> {
  const res = await fetch('/api/whatsapp/log');
  if (!res.ok) return [];
  const data = (await res.json()) as { messages?: WhatsAppResult[] };
  return data.messages ?? [];
}
