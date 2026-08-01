/** MINT — canlı talep yoğunluğu & dinamik fiyatlama motoru. */

export interface MintProduct {
  id: string;
  name: string;
  base: number;
  demand: number;
  demandPct: number;
  price: number;
  band: string;
  updatedAt: string;
}

export interface MintDemandSnapshot {
  provider: string;
  live: boolean;
  intensity: number;
  label: string;
  products: MintProduct[];
  generatedAt: string;
}

export async function fetchMintDemand(signal?: AbortSignal): Promise<MintDemandSnapshot> {
  const res = await fetch('/api/mint/demand', { signal });
  if (!res.ok) throw new Error(`MINT HTTP ${res.status}`);
  return (await res.json()) as MintDemandSnapshot;
}
