/**
 * AŞAMA 180 — Signal Hub checkpoint (pyramid + tesis altyapı sinyalleri).
 */
import { buildPyramid } from './pyramid.js';
import { poweropsSummary } from './powerops.js';
import { wateropsSummary } from './waterops.js';
import { poolopsSummary } from './poolops.js';
import { iotgatesSummary } from './iotgates.js';
import { beaconmapSummary } from './beaconmap.js';
import { chemlogSummary } from './chemlog.js';

export function buildSignalhub() {
  const pyr = buildPyramid();
  const power = poweropsSummary();
  const water = wateropsSummary();
  const pool = poolopsSummary();
  const gates = iotgatesSummary();
  const beacons = beaconmapSummary();
  const chem = chemlogSummary();
  return {
    generatedAt: new Date().toISOString(),
    title: 'LİKYA Signal Hub',
    pyramid: { summaryLines: (pyr.summaryLines || []).slice(0, 2) },
    powerAlert: power.alert || 0,
    waterCritical: water.critical || 0,
    poolWarn: pool.warn || 0,
    gateJam: gates.jam || 0,
    beaconOffline: beacons.offline || 0,
    chemAlert: chem.alert || 0,
    summaryLines: [
      ...(pyr.summaryLines || []).slice(0, 2),
      `Güç alert ${power.alert || 0} · Su kritik ${water.critical || 0}`,
      `Havuz warn ${pool.warn || 0} · Kimyasal alert ${chem.alert || 0}`,
      `Kapı jam ${gates.jam || 0} · Beacon offline ${beacons.offline || 0}`,
    ],
  };
}
