#!/usr/bin/env node
/**
 * Kampüs stack + wave-2 smoke test.
 * Kullanım: node scripts/smoke-campus.mjs
 */
import {
  campusCoreOverview,
  updateCampusZone,
  addCampusIncident,
  transitionCampusZone,
  resolveCampusIncident,
  campusCapacityRollup,
  createCampusWorkOrder,
  completeCampusWorkOrder,
  runCampusWorkOrderSweep,
  assignCampusWorkOrder,
  startCampusWorkOrder,
  escalateCampusWorkOrder,
} from '../server/campuscore.js';
import {
  agentBridgeBroadcast,
  openAgentBridgeChannel,
  pulseAgentBridgeChannel,
  escalateAgentBridgeAlert,
  resolveAgentBridgeAlert,
  closeAgentBridgeChannel,
  runAgentBridgeAlertSlaSweep,
  routeAgentBridgeAlert,
} from '../server/agentbridge.js';
import {
  stayRingOverview,
  createStayBooking,
  issueStayKeyless,
  createStayHkTask,
  setStayWintering,
  completeStayHk,
  stayNightRollup,
  createStayGuestRequest,
  postStayFolioCharge,
  autoPostStayFolio,
  settleStayFolio,
  completeStayGuestRequest,
  runStayNightAudit,
  flagStayOverstay,
  resolveStayOverstay,
} from '../server/stayring.js';
import {
  athleteOsOverview,
  issueAthleteLicense,
  logAthleteSession,
  athleteReadinessRollup,
  setAthleteClearance,
  reportAthleteInjury,
  advanceReturnToPlay,
  runAthleteRtpSweep,
} from '../server/athleteos.js';
import {
  lifeCoachOverview,
  ingestWearable,
  ingestWearableWebhook,
  registerLifeDevice,
  processLifeFlags,
  lifeCoachCheckIn,
  lifeWeeklyDigest,
  scheduleLifeFollowUps,
  completeLifeFollowUp,
  scoreLifePlanAdherence,
} from '../server/lifecoach.js';
import {
  agentQueueOverview,
  enqueueAgentJob,
  claimAgentJob,
  completeAgentJob,
  tickAgentQueue,
  runAgentQueueSlaSweep,
  rebalanceAgentQueue,
  reviveDeadAgentJobs,
  archiveAgentJobs,
} from '../server/agentqueue.js';
import {
  greenPulseOverview,
  recordGreenMeter,
  addGreenIncident,
  createGreenWorkPermit,
  approveGreenWorkPermit,
  closeGreenWorkPermit,
  runWaterLeakTriage,
} from '../server/greenpulse.js';
import {
  campusBriefOverview,
  runCampusAutomations,
  syncCampusBriefActions,
  ackCampusBriefAction,
  assignCampusBriefAction,
  publishCampusBriefDigest,
} from '../server/campusbrief.js';
import {
  extremeSlotWeatherCheck,
  applyExtremeWeatherHold,
  clearExtremeWeatherHold,
  cancelExtremeReservation,
  checkInExtremeReservation,
  expireExtremeWaitlist,
  markExtremeNoShow,
  reserveExtremeSlot,
  returnExtremeGear,
  issueExtremeGear,
  runExtremeGearServiceSweep,
  signExtremeWaiver,
  joinExtremeWaitlist,
  promoteExtremeWaitlist,
} from '../server/extremepark.js';
import { runSportEligibilitySweep, gateSportSlotAccess } from '../server/sportbridge.js';
import { runGreenPulseAutomations } from '../server/greenpulse.js';
import {
  agentFleetOverview,
  dispatchFleetDirective,
  pingFleetAgent,
  sweepFleetPresence,
  acknowledgeFleetDirective,
  startFleetShift,
  handoffFleetShift,
} from '../server/agentfleet.js';
import { marketOsOverview, marketCheckout, syncMarketChannel, createMarketListing } from '../server/marketos.js';
import {
  openMallOverview,
  recordMallSale,
  generateMallRentRun,
  payMallInvoice,
  runMallDunningSweep,
  generateMallCamRun,
  holdMallLease,
  releaseMallLease,
} from '../server/openmall.js';
import {
  familyCampOverview,
  familyCheckIn,
  bookFamilyProgram,
  familyEmergencyNote,
  transferFamilyChild,
  issueFamilyPickupCode,
  authorizedFamilyCheckout,
  runFamilySafetySweep,
} from '../server/familycamp.js';
import {
  confirmCultureTicket,
  startCultureStream,
  pulseCultureStream,
  endCultureStream,
  setCultureStageStatus,
  cultureBoxOfficeRollup,
  expireCultureHolds,
  refundCultureSale,
  settleCultureEvent,
} from '../server/culturescene.js';
import {
  returnMarketRental,
  restockMarketListing,
  reconcileMarketChannels,
  runMarketLowStockSweep,
  createMarketPurchaseOrder,
  receiveMarketPurchaseOrder,
} from '../server/marketos.js';
import { batchRecordGreenMeters } from '../server/greenpulse.js';
import { mallDayRollup, settleMallTenantFnb } from '../server/openmall.js';
import { campusHealthCheck } from '../server/campusbrief.js';
import { buildReadiness } from '../server/readiness.js';
import { agentBridgeOverview, agentBridgePing } from '../server/agentbridge.js';
import { extremeOverview } from '../server/extremepark.js';
import { cultureSceneOverview, holdCultureTicket, createCultureEvent } from '../server/culturescene.js';
import { sportBridgeOverview, syncSlotToSession } from '../server/sportbridge.js';
// wave-12 helpers imported above

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const campus = campusCoreOverview();
assert(campus.zones?.length >= 8, 'campus zones');
updateCampusZone(campus.zones[0].id, { notes: 'smoke' }, 'smoke');
addCampusIncident({ title: 'smoke incident', zone_id: 'z_sport' }, 'smoke');
transitionCampusZone({ zone_id: 'z_culture' }, 'smoke');
resolveCampusIncident({}, 'smoke');
assert(campusCapacityRollup('smoke').ok, 'campus capacity');
assert(createCampusWorkOrder({ zone_id: 'z_sport', title: 'smoke WO' }, 'smoke').ok, 'campus WO');
assert(runCampusWorkOrderSweep({ force: true }, 'smoke').ok, 'campus WO sweep');
assert(assignCampusWorkOrder({ assignee: 'smoke-crew', agent: 'HEPHAESTUS' }, 'smoke').ok, 'campus WO assign');
assert(startCampusWorkOrder({}, 'smoke').ok, 'campus WO start');
assert(escalateCampusWorkOrder({ reason: 'smoke' }, 'smoke').ok, 'campus WO escalate');
assert(completeCampusWorkOrder({}, 'smoke').ok, 'campus WO complete');
assert(agentBridgeBroadcast({ title: 'smoke broadcast' }, 'smoke').ok, 'bridge broadcast');
assert(openAgentBridgeChannel({ topic: 'smoke-ops' }, 'smoke').ok, 'bridge channel');
assert(pulseAgentBridgeChannel({}, 'smoke').ok, 'bridge channel pulse');
assert(
  escalateAgentBridgeAlert({ title: 'smoke alert', domain: 'green', severity: 'high' }, 'smoke').ok,
  'bridge alert',
);
assert(routeAgentBridgeAlert({ mode: 'work_order' }, 'smoke').ok, 'bridge alert route');
assert(runAgentBridgeAlertSlaSweep({ force: true }, 'smoke').ok, 'bridge alert sla');
assert(resolveAgentBridgeAlert({}, 'smoke').ok, 'bridge alert resolve');
assert(closeAgentBridgeChannel({}, 'smoke').ok, 'bridge channel close');

const stay = stayRingOverview();
assert(stay.units?.length >= 4, 'stay units');
createStayBooking({ unit_id: stay.units.find((u) => u.status === 'free')?.id, guestName: 'Smoke Guest', nights: 1 }, 'smoke');
issueStayKeyless({}, 'smoke');
createStayHkTask({ kind: 'linen' }, 'smoke');
setStayWintering({ unit_id: 'su_4' }, 'smoke');
completeStayHk({ unit_id: 'su_2' }, 'smoke');
const night = stayNightRollup('smoke');
assert(night.ok && night.rollup?.occupancy_pct != null, 'stay night rollup');
assert(createStayGuestRequest({ kind: 'amenity' }, 'smoke').ok, 'stay guest request');
completeStayGuestRequest({}, 'smoke');
assert(postStayFolioCharge({ unit_id: 'su_2', kind: 'amenity', amount_try: 250 }, 'smoke').ok, 'folio charge');
assert(autoPostStayFolio({}, 'smoke').ok, 'folio auto');
assert(settleStayFolio({ unit_id: 'su_2' }, 'smoke').ok, 'folio settle');
assert(runStayNightAudit({}, 'smoke').ok, 'stay night audit');
assert(flagStayOverstay({ force: true }, 'smoke').ok, 'stay overstay flag');
assert(resolveStayOverstay({ mode: 'extend', extra_nights: 1 }, 'smoke').ok, 'stay overstay resolve');

const athletes = athleteOsOverview();
assert(athletes.athletes?.length >= 2, 'athletes');
logAthleteSession({ athlete_id: athletes.athletes[0].id, session: 'smoke tempo', rpe: 5 }, 'smoke');
const lic = issueAthleteLicense({ athlete_id: 'ath_3' }, 'smoke');
assert(lic.ok && lic.athlete?.license, 'athlete license');
assert(setAthleteClearance({ athlete_id: 'ath_3', status: 'cleared' }, 'smoke').ok, 'athlete clearance');
const ready = athleteReadinessRollup('smoke');
assert(ready.athletes?.length >= 2, 'athlete readiness');
assert(reportAthleteInjury({ athlete_id: 'ath_2', body_area: 'omuz', severity: 'mild' }, 'smoke').ok, 'athlete injury');
assert(advanceReturnToPlay({ athlete_id: 'ath_2', force: true }, 'smoke').ok, 'athlete rtp');
assert(runAthleteRtpSweep({ force: true }, 'smoke').ok, 'athlete rtp sweep');
assert(advanceReturnToPlay({ athlete_id: 'ath_2', stage: 'cleared', force: true }, 'smoke').ok, 'athlete rtp cleared');
setAthleteClearance({ athlete_id: 'ath_2', status: 'cleared' }, 'smoke');

const life = lifeCoachOverview();
assert(life.clients?.length >= 1, 'life clients');
ingestWearable({ client_id: life.clients[0].id, hrv: 62, sleep_h: 7.2, recovery: 70 }, 'smoke');
ingestWearableWebhook(
  { provider: 'apple', device_id: 'dev_deniz_watch', recoveryScore: 55, sleep: { hours: 7.5 }, hrv: { sdnn: 64 } },
  { actor: 'smoke', verified: true },
);
registerLifeDevice({ provider: 'fitbit', client_id: 'lc_1', label: 'Smoke Fitbit' }, 'smoke');
const checkin = lifeCoachCheckIn({ client_id: 'lc_2', mood: 5, sleep_h: 6 }, 'smoke');
assert(checkin.ok && checkin.checkin, 'life checkin');
assert(lifeWeeklyDigest('smoke').ok, 'life digest');
assert(scheduleLifeFollowUps({}, 'smoke').ok, 'life followups');
assert(completeLifeFollowUp({}, 'smoke').ok, 'life followup complete');
assert(scoreLifePlanAdherence({}, 'smoke').ok, 'life adherence');

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
bookFamilyProgram({ program_id: 'fp_1', child_name: 'Smoke Book' }, 'smoke');
familyCheckIn({ child_name: 'Smoke Kid', program_id: 'fp_3', guardian: 'Parent', allergy: 'fındık' }, 'smoke');
familyEmergencyNote({ child_name: 'Smoke Kid', note: 'smoke allergy' }, 'smoke');
assert(transferFamilyChild({ child_name: 'Smoke Kid', to_program_id: 'fp_1' }, 'smoke').ok, 'family transfer');
const pickup = issueFamilyPickupCode({ child_name: 'Smoke Kid', authorized_name: 'Parent' }, 'smoke');
assert(pickup.ok && pickup.pickup?.code, 'family pickup code');
assert(
  authorizedFamilyCheckout({ code: pickup.pickup.code, authorized_name: 'Parent' }, 'smoke').ok,
  'family authorized checkout',
);
familyCheckIn({ child_name: 'Safety Kid', program_id: 'fp_3', guardian: 'Veli', allergy: 'gluten' }, 'smoke');
assert(runFamilySafetySweep({ stale_hours: 0 }, 'smoke').ok, 'family safety sweep');

const extreme = extremeOverview();
assert(extreme, 'extreme park');

const culture = cultureSceneOverview();
assert(culture.events?.length >= 2, 'culture events');
createCultureEvent({ title: 'Smoke Night', tickets_total: 50 }, 'smoke');
const held = holdCultureTicket({ event_id: culture.events[0].id, qty: 1 }, 'smoke');
confirmCultureTicket({ hold_id: held.hold?.id }, 'smoke');

mallDayRollup('smoke');
settleMallTenantFnb({ tenant_id: 'mt_2' }, 'smoke');
const rentRun = generateMallRentRun({ period: '2026-08', force: true, due_days: -3 }, 'smoke');
assert(rentRun.ok && rentRun.created?.length >= 1, 'mall rent run');
assert(payMallInvoice({ invoice_id: rentRun.created[0].id, amount_try: 1000 }, 'smoke').ok, 'mall invoice pay');
assert(runMallDunningSweep({ force: true }, 'smoke').ok, 'mall dunning');
assert(generateMallCamRun({ period: '2026-08', force: true }, 'smoke').ok, 'mall cam run');
assert(holdMallLease({ force: true }, 'smoke').ok, 'mall lease hold');
assert(releaseMallLease({}, 'smoke').ok, 'mall lease release');
const rented = marketOsOverview().listings.find((l) => l.status === 'rented');
if (rented) returnMarketRental({ listing_id: rented.id }, 'smoke');
else {
  const liveRent = marketOsOverview().listings.find((l) => l.mode === 'rent' && l.status === 'live');
  if (liveRent) {
    marketCheckout({ listing_id: liveRent.id, buyer: 'smoke' }, 'smoke');
    returnMarketRental({ listing_id: liveRent.id }, 'smoke');
  }
}
const soldish = marketOsOverview().listings.find((l) => l.status !== 'live') || marketOsOverview().listings[0];
if (soldish) restockMarketListing({ listing_id: soldish.id }, 'smoke');
assert(reconcileMarketChannels({ limit: 2, channel: 'tybridge' }, 'smoke').ok, 'market reconcile');
assert(runMarketLowStockSweep({ force_all: true, limit: 2 }, 'smoke').ok, 'market low stock');
assert(createMarketPurchaseOrder({ listing_id: 'ml_1', qty: 3 }, 'smoke').ok, 'market po');
assert(receiveMarketPurchaseOrder({}, 'smoke').ok, 'market po receive');
assert(batchRecordGreenMeters({}, 'smoke').ok, 'green batch');

const stream = startCultureStream({ event_id: 'ce_1' }, 'smoke');
assert(stream.ok, 'culture stream start');
pulseCultureStream({ viewers: 33 }, 'smoke');
endCultureStream({}, 'smoke');
setCultureStageStatus({ stage_id: 'cs_studio', status: 'ready' }, 'smoke');
assert(cultureBoxOfficeRollup('smoke').ok, 'culture box office');
holdCultureTicket({ event_id: culture.events[0].id, qty: 1, guest: 'expire-me' }, 'smoke');
assert(expireCultureHolds({ force: true }, 'smoke').ok, 'culture hold expire');
assert(refundCultureSale({}, 'smoke').ok, 'culture refund');
assert(settleCultureEvent({ event_id: culture.events[0].id }, 'smoke').ok, 'culture settle');

const health = campusHealthCheck();
assert(health.score >= 0, 'campus health');

const sport = sportBridgeOverview();
assert(sport.links?.length >= 1, 'sport links');
advanceReturnToPlay({ athlete_id: 'ath_1', stage: 'cleared', force: true }, 'smoke');
setAthleteClearance({ athlete_id: 'ath_1', status: 'cleared' }, 'smoke');
signExtremeWaiver({ user_id: 'guest_can' }, 'smoke');
issueAthleteLicense({ athlete_id: 'ath_1' }, 'smoke');
const gateOk = gateSportSlotAccess({ extreme_user: 'guest_can' }, 'smoke');
assert(gateOk.ok, 'sport gate allow');
syncSlotToSession({ extreme_user: 'guest_can' }, 'smoke');
const elig = runSportEligibilitySweep({}, 'smoke');
assert(elig.ok, 'sport eligibility');
reportAthleteInjury({ athlete_id: 'ath_1', body_area: 'bilek', severity: 'moderate' }, 'smoke');
assert(gateSportSlotAccess({ extreme_user: 'guest_can' }, 'smoke').ok === false, 'sport gate block injury');
assert(gateSportSlotAccess({ extreme_user: 'guest_can', force: true }, 'smoke').ok, 'sport gate force');
setAthleteClearance({ athlete_id: 'ath_1', status: 'cleared' }, 'smoke');
assert(elig.ok && elig.summary?.scanned >= 1, 'sport eligibility');

const brief = campusBriefOverview('smoke');
assert(brief.pulses?.green && brief.actions, 'campus brief');
assert(brief.pulses?.bridge && brief.pulses?.fleet, 'campus brief bridge/fleet pulses');
const readiness = buildReadiness();
assert(
  readiness.dimensions?.some((d) => d.id === 'work_orders') &&
    readiness.dimensions?.some((d) => d.id === 'bridge'),
  'readiness work_orders/bridge dims',
);
runCampusAutomations('smoke');
const synced = syncCampusBriefActions('smoke');
assert(synced.ok, 'brief actions sync');
if ((synced.overview?.register || []).length) {
  assert(
    assignCampusBriefAction({ id: synced.overview.register[0].id, owner: 'LİKYA-1' }, 'smoke').ok,
    'brief assign',
  );
  ackCampusBriefAction({ id: synced.overview.register[0].id }, 'smoke');
}
assert(publishCampusBriefDigest('smoke').ok, 'brief publish');
const sla = runAgentQueueSlaSweep({ force: true }, 'smoke');
assert(sla.ok, 'agent sla sweep');
assert(rebalanceAgentQueue({}, 'smoke').ok, 'agent rebalance');
const failSeed = enqueueAgentJob({ agent: 'ETHOS', title: 'fail-seed-for-revive' }, 'smoke');
const failClaim = claimAgentJob({ id: failSeed.job?.id }, 'smoke');
completeAgentJob({ id: failClaim.job?.id || failSeed.job?.id, fail: true }, 'smoke');
assert(reviveDeadAgentJobs({ limit: 5 }, 'smoke').ok, 'agent revive');
assert(archiveAgentJobs({ force: true }, 'smoke').ok, 'agent archive');
extremeSlotWeatherCheck({ force_condition: 'windy' }, 'smoke');
const hold = applyExtremeWeatherHold({ force_condition: 'windy', minutes: 30, force: true }, 'smoke');
assert(hold.ok, 'weather hold');
clearExtremeWeatherHold({}, 'smoke');
signExtremeWaiver({ user_id: 'guest_can' }, 'smoke');
cancelExtremeReservation({ user_id: 'guest_ela' }, 'smoke');
cancelExtremeReservation({ user_id: 'guest_can' }, 'smoke');
let reserved = reserveExtremeSlot({ user_id: 'guest_ela' }, 'smoke');
let reserveUser = 'guest_ela';
if (!reserved.ok) {
  reserved = reserveExtremeSlot({ user_id: 'guest_can' }, 'smoke');
  reserveUser = 'guest_can';
}
assert(reserved.ok, 'slot reserve');
assert(checkInExtremeReservation({ user_id: reserveUser, gate: 'main' }, 'smoke').ok, 'extreme check-in');
cancelExtremeReservation({ user_id: reserveUser === 'guest_ela' ? 'guest_can' : 'guest_ela' }, 'smoke');
const noshowUser = reserveUser === 'guest_ela' ? 'guest_can' : 'guest_ela';
signExtremeWaiver({ user_id: noshowUser }, 'smoke');
const noshowReserve = reserveExtremeSlot({ user_id: noshowUser }, 'smoke');
assert(noshowReserve.ok, 'slot reserve for no-show');
assert(markExtremeNoShow({ user_id: noshowUser, promote: false }, 'smoke').ok, 'extreme no-show');
const gearRet = returnExtremeGear({ gear_id: 'xg_1' }, 'smoke');
assert(gearRet.ok, 'gear return');
const gearIssue = issueExtremeGear({ user_id: 'guest_ela' }, 'smoke');
assert(gearIssue.ok, 'gear issue');
const gearSweep = runExtremeGearServiceSweep({ include_open: true }, 'smoke');
assert(gearSweep.ok && gearSweep.sweep?.flagged >= 1, 'gear service sweep');
assert(joinExtremeWaitlist({ user_id: 'guest_can', slot_id: 'xs_2' }, 'smoke').ok, 'waitlist join');
promoteExtremeWaitlist({}, 'smoke');
assert(joinExtremeWaitlist({ user_id: 'guest_ela', slot_id: 'xs_2' }, 'smoke').ok !== undefined, 'waitlist join2');
assert(expireExtremeWaitlist({ force: true }, 'smoke').ok, 'waitlist expire');
const greenAuto = runGreenPulseAutomations({}, 'smoke');
assert(greenAuto.ok && Array.isArray(greenAuto.actions), 'green automations');
assert(createGreenWorkPermit({ zone_id: 'z_forest', work: 'smoke path' }, 'smoke').ok, 'green permit');
assert(approveGreenWorkPermit({}, 'smoke').ok, 'green permit approve');
assert(closeGreenWorkPermit({}, 'smoke').ok, 'green permit close');
assert(runWaterLeakTriage({ force: true }, 'smoke').ok, 'water triage');

const fleet = agentFleetOverview();
assert(fleet.summary?.total === 28, '28 core agents');
pingFleetAgent({ agent: 'ETHOS', note: 'smoke' }, 'smoke');
assert(sweepFleetPresence({ campus_only: true }, 'smoke').ok, 'presence sweep');
const dispatched = dispatchFleetDirective({ title: 'Hava iptal ve ESG alert brifing' }, 'smoke');
assert(dispatched.targets?.includes('REMINDER-AI') || dispatched.targets?.includes('GAIA-ESG'), 'fleet dispatch');
assert(
  acknowledgeFleetDirective({ id: dispatched.directive?.id, agent: 'REMINDER-AI' }, 'smoke').ok,
  'fleet directive ack',
);
assert(startFleetShift({ name: 'smoke shift' }, 'smoke').ok, 'fleet shift start');
assert(handoffFleetShift({ to_lead: 'DAZE-HUB', note: 'smoke handoff' }, 'smoke').ok, 'fleet handoff');

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
      campus_health: health,
      campus_agents: bridge.agents.map((a) => a.id),
      extreme_slots: extreme.summary?.open_slots ?? null,
    },
    null,
    2,
  ),
);
