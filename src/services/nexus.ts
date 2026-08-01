/** NEXUS — IoT turnike / kapı röle / RFID protokol istemcisi. */

export type NexusAction = 'unlock' | 'lock' | 'pulse' | 'status' | 'scan';

export interface NexusDevice {
  id: string;
  name: string;
  type: string;
  protocol: string;
  host: string;
  firmware: string;
  state: string;
  online: boolean;
  venueId?: string;
}

export interface NexusEvent {
  id: string;
  at: string;
  deviceId: string;
  action: string;
  detail: string;
  ok: boolean;
  passCode?: string | null;
  mode?: string;
}

export async function fetchNexusDevices(venueId?: string): Promise<{
  protocol: string;
  mode: string;
  venueId: string | null;
  devices: NexusDevice[];
}> {
  const qs = venueId ? `?venueId=${encodeURIComponent(venueId)}` : '';
  const res = await fetch(`/api/nexus/devices${qs}`);
  if (!res.ok) throw new Error(`NEXUS devices HTTP ${res.status}`);
  return (await res.json()) as {
    protocol: string;
    mode: string;
    venueId: string | null;
    devices: NexusDevice[];
  };
}

export async function fetchNexusEvents(): Promise<NexusEvent[]> {
  const res = await fetch('/api/nexus/events');
  if (!res.ok) return [];
  const data = (await res.json()) as { events?: NexusEvent[] };
  return data.events ?? [];
}

export async function sendNexusCommand(input: {
  deviceId: string;
  action: NexusAction;
  passCode?: string;
}): Promise<{ ok: boolean; device: NexusDevice; event: NexusEvent }> {
  const res = await fetch('/api/nexus/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || `NEXUS command HTTP ${res.status}`);
  }
  return (await res.json()) as { ok: boolean; device: NexusDevice; event: NexusEvent };
}
