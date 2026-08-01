#!/usr/bin/env node
/**
 * Adım 10 — Kampüs stack smoke test (API builder’ları).
 * Kullanım: node scripts/smoke-campus.mjs
 */
import { campusCoreOverview, updateCampusZone, addCampusIncident } from '../server/campuscore.js';
import { stayRingOverview, createStayBooking } from '../server/stayring.js';
import { athleteOsOverview, logAthleteSession } from '../server/athleteos.js';
import { lifeCoachOverview, ingestWearable } from '../server/lifecoach.js';
import { marketOsOverview, marketCheckout } from '../server/marketos.js';
import { openMallOverview, recordMallSale } from '../server/openmall.js';
import { familyCampOverview, familyCheckIn } from '../server/familycamp.js';
import { agentBridgeOverview, agentBridgePing } from '../server/agentbridge.js';
import { extremeOverview } from '../server/extremepark.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const campus = campusCoreOverview();
assert(campus.zones?.length >= 8, 'campus zones');
assert(campus.summary.total_ha >= 50, 'campus ha');
updateCampusZone(campus.zones[0].id, { notes: 'smoke' }, 'smoke');
addCampusIncident({ title: 'smoke incident', zone_id: 'z_sport' }, 'smoke');

const stay = stayRingOverview();
assert(stay.units?.length >= 4, 'stay units');
createStayBooking({ unit_id: stay.units.find((u) => u.status === 'free')?.id, guestName: 'Smoke Guest', nights: 1 }, 'smoke');

const athletes = athleteOsOverview();
assert(athletes.athletes?.length >= 2, 'athletes');
logAthleteSession({ athlete_id: athletes.athletes[0].id, session: 'smoke tempo', rpe: 5 }, 'smoke');

const life = lifeCoachOverview();
assert(life.clients?.length >= 1, 'life clients');
ingestWearable({ client_id: life.clients[0].id, hrv: 62, sleep_h: 7.2, recovery: 70 }, 'smoke');

const market = marketOsOverview();
assert(market.listings?.length >= 3, 'market listings');
const buy = market.listings.find((l) => l.mode === 'buy' && l.status === 'live') || market.listings.find((l) => l.status === 'live');
assert(buy, 'live listing');
marketCheckout({ listing_id: buy.id, buyer: 'smoke' }, 'smoke');

const mall = openMallOverview();
assert(mall.tenants?.length >= 3, 'mall tenants');
recordMallSale({ tenant_id: mall.tenants[0].id, amount_try: 120 }, 'smoke');

const family = familyCampOverview();
assert(family.programs?.length >= 2, 'family camp');
familyCheckIn({ child_name: 'Smoke Kid', program_id: family.programs.find((p) => p.status === 'open')?.id || 'fp_3', guardian: 'Parent' }, 'smoke');

const extreme = extremeOverview();
assert(extreme, 'extreme park');

const bridge = agentBridgeOverview();
assert(bridge.agents?.length >= 5, 'agent fleet');
assert(bridge.pulses?.campus && bridge.pulses?.extreme, 'bridge pulses');
const ping = agentBridgePing({ agent: 'DAZE-HUB', note: 'smoke' }, 'smoke');
assert(ping.ok, 'agent ping');

console.log(
  JSON.stringify(
    {
      ok: true,
      campus_zones: campus.zones.length,
      stay_units: stay.units.length,
      athletes: athletes.athletes.length,
      life_clients: life.clients.length,
      market_listings: market.listings.length,
      mall_tenants: mall.tenants.length,
      family: family.summary,
      agents: bridge.agents.map((a) => a.id),
      extreme_slots: extreme.summary?.open_slots ?? extreme.slots?.length ?? null,
    },
    null,
    2,
  ),
);
