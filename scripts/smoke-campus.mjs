#!/usr/bin/env node
/**
 * Kampüs stack + wave-2 smoke test.
 * Kullanım: node scripts/smoke-campus.mjs
 */
import { campusCoreOverview, updateCampusZone, addCampusIncident } from '../server/campuscore.js';
import {
  stayRingOverview,
  createStayBooking,
  issueStayKeyless,
  createStayHkTask,
  setStayWintering,
} from '../server/stayring.js';
import { athleteOsOverview, logAthleteSession } from '../server/athleteos.js';
import {
  lifeCoachOverview,
  ingestWearable,
  ingestWearableWebhook,
  registerLifeDevice,
  processLifeFlags,
} from '../server/lifecoach.js';
import { agentQueueOverview, enqueueAgentJob, claimAgentJob, completeAgentJob, tickAgentQueue } from '../server/agentqueue.js';
import { greenPulseOverview, recordGreenMeter, addGreenIncident } from '../server/greenpulse.js';
import { campusBriefOverview, runCampusAutomations } from '../server/campusbrief.js';
import { extremeSlotWeatherCheck } from '../server/extremepark.js';
import { agentFleetOverview, dispatchFleetDirective, pingFleetAgent } from '../server/agentfleet.js';
import { marketOsOverview, marketCheckout, syncMarketChannel, createMarketListing } from '../server/marketos.js';
import { openMallOverview, recordMallSale } from '../server/openmall.js';
import { familyCampOverview, familyCheckIn } from '../server/familycamp.js';
import { agentBridgeOverview, agentBridgePing } from '../server/agentbridge.js';
import { extremeOverview } from '../server/extremepark.js';
import { cultureSceneOverview, holdCultureTicket, createCultureEvent } from '../server/culturescene.js';
import { sportBridgeOverview, syncSlotToSession } from '../server/sportbridge.js';

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const campus = campusCoreOverview();
assert(campus.zones?.length >= 8, 'campus zones');
updateCampusZone(campus.zones[0].id, { notes: 'smoke' }, 'smoke');
addCampusIncident({ title: 'smoke incident', zone_id: 'z_sport' }, 'smoke');

const stay = stayRingOverview();
assert(stay.units?.length >= 4, 'stay units');
createStayBooking({ unit_id: stay.units.find((u) => u.status === 'free')?.id, guestName: 'Smoke Guest', nights: 1 }, 'smoke');
issueStayKeyless({}, 'smoke');
createStayHkTask({ kind: 'linen' }, 'smoke');
setStayWintering({ unit_id: 'su_4' }, 'smoke');

const athletes = athleteOsOverview();
assert(athletes.athletes?.length >= 2, 'athletes');
logAthleteSession({ athlete_id: athletes.athletes[0].id, session: 'smoke tempo', rpe: 5 }, 'smoke');

const life = lifeCoachOverview();
assert(life.clients?.length >= 1, 'life clients');
ingestWearable({ client_id: life.clients[0].id, hrv: 62, sleep_h: 7.2, recovery: 70 }, 'smoke');
ingestWearableWebhook(
  { provider: 'apple', device_id: 'dev_deniz_watch', recoveryScore: 55, sleep: { hours: 7.5 }, hrv: { sdnn: 64 } },
  { actor: 'smoke', verified: true },
);
registerLifeDevice({ provider: 'fitbit', client_id: 'lc_1', label: 'Smoke Fitbit' }, 'smoke');

const queue = agentQueueOverview();
assert(queue.jobs?.length >= 1, 'agent queue');
enqueueAgentJob({ agent: 'DAZE-HUB', title: 'smoke job' }, 'smoke');
const claimed = claimAgentJob({}, 'smoke');
assert(claimed.ok, 'claim');
if (claimed.job?.id) completeAgentJob({ id: claimed.job.id }, 'smoke');
tickAgentQueue('smoke');

const green = greenPulseOverview();
assert(green.meters?.length >= 4, 'green meters');
recordGreenMeter({ kind: 'water', value: 40 }, 'smoke');
addGreenIncident({ title: 'smoke forest check', kind: 'forest' }, 'smoke');
processLifeFlags('smoke');

let market = marketOsOverview();
assert(market.listings?.length >= 1, 'market listings');
let buy = market.listings.find((l) => l.status === 'live');
if (!buy) {
  createMarketListing({ mode: 'buy', title: 'Smoke Helm', sku: 'SMOKE-1', price_try: 100 }, 'smoke');
  market = marketOsOverview();
  buy = market.listings.find((l) => l.status === 'live');
}
assert(buy, 'live listing');
syncMarketChannel({ listing_id: buy.id, channel: 'tybridge' }, 'smoke');
marketCheckout({ listing_id: buy.id, buyer: 'smoke' }, 'smoke');

const mall = openMallOverview();
assert(mall.tenants?.length >= 3, 'mall tenants');
assert(mall.summary.fnb_targets >= 1, 'fnb targets');
recordMallSale({ tenant_id: 'mt_4', amount_try: 120 }, 'smoke');

const family = familyCampOverview();
assert(family.programs?.length >= 2, 'family camp');
familyCheckIn({ child_name: 'Smoke Kid', program_id: 'fp_3', guardian: 'Parent' }, 'smoke');

const extreme = extremeOverview();
assert(extreme, 'extreme park');

const culture = cultureSceneOverview();
assert(culture.events?.length >= 2, 'culture events');
createCultureEvent({ title: 'Smoke Night', tickets_total: 50 }, 'smoke');
holdCultureTicket({ event_id: culture.events[0].id, qty: 1 }, 'smoke');

const sport = sportBridgeOverview();
assert(sport.links?.length >= 1, 'sport links');
syncSlotToSession({}, 'smoke');

const brief = campusBriefOverview('smoke');
assert(brief.pulses?.green && brief.actions, 'campus brief');
runCampusAutomations('smoke');
extremeSlotWeatherCheck({ force_condition: 'windy' }, 'smoke');

const fleet = agentFleetOverview();
assert(fleet.summary?.total === 28, '28 core agents');
pingFleetAgent({ agent: 'ETHOS', note: 'smoke' }, 'smoke');
const dispatched = dispatchFleetDirective({ title: 'Hava iptal ve ESG alert brifing' }, 'smoke');
assert(dispatched.targets?.includes('REMINDER-AI') || dispatched.targets?.includes('GAIA-ESG'), 'fleet dispatch');

const bridge = agentBridgeOverview();
assert(bridge.agents?.length >= 8, 'campus agents on bridge');
assert(bridge.pulses?.fleet?.total === 28, 'bridge fleet pulse');
assert(bridge.pulses?.culture && bridge.pulses?.sport && bridge.pulses?.queue && bridge.pulses?.green, 'bridge pulses');
const ping = agentBridgePing({ agent: 'DAZE-HUB', note: 'smoke' }, 'smoke');
assert(ping.ok, 'agent ping');

console.log(
  JSON.stringify(
    {
      ok: true,
      campus_zones: campus.zones.length,
      stay: stayRingOverview().summary,
      culture: cultureSceneOverview().summary,
      sport: sportBridgeOverview().summary,
      market_channels: marketOsOverview().channels,
      mall_fnb: openMallOverview().summary,
      life: lifeCoachOverview().summary,
      queue: agentQueueOverview().summary,
      green: greenPulseOverview().summary,
      brief_actions: brief.actions.length,
      fleet: agentFleetOverview().summary,
      campus_agents: bridge.agents.map((a) => a.id),
      extreme_slots: extreme.summary?.open_slots ?? null,
    },
    null,
    2,
  ),
);
