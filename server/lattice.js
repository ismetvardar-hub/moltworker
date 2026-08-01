/**
 * AŞAMA 345 — Lattice checkpoint.
 */
import { buildVanguard } from './vanguard.js';
import { edgegateSummary } from './edgegate.js';
import { meshlinkSummary } from './meshlink.js';
import { otafirmSummary } from './otafirm.js';
import { syncreplSummary } from './syncrepl.js';
import { backhaulSummary } from './backhaul.js';
import { failoverSummary } from './failover.js';

export function buildLattice() {
  const prev = buildVanguard();
  const gate = edgegateSummary();
  const mesh = meshlinkSummary();
  const ota = otafirmSummary();
  const sync = syncreplSummary();
  const bh = backhaulSummary();
  const fo = failoverSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: "LİKYA Lattice",
    vanguard: { summaryLines: (prev.summaryLines || []).slice(0, 2) },
    gateOffline: gate.offline || 0,
    meshDown: mesh.down || 0,
    otaFailed: ota.failed || 0,
    syncLag: sync.lagging || 0,
    backhaulDown: bh.down || 0,
    failoverActive: fo.active || 0,
    summaryLines: [
      ...(prev.summaryLines || []).slice(0, 2),
      `Edge gate offline ${gate.offline || 0} · Mesh down ${mesh.down || 0}`,
      `OTA fail ${ota.failed || 0} · Sync lagging ${sync.lagging || 0}`,
      `Backhaul down ${bh.down || 0} · Failover active ${fo.active || 0}`,
    ],
  };
}
