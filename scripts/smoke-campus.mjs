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
  escalateCampusIncident,
  lockdownCampusZone,
  clearCampusZoneLockdown,
  runCampusCapacityAlertSweep,
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
  muteAgentBridgeAlert,
  unmuteAgentBridgeAlerts,
  snoozeAgentBridgeChannel,
  wakeSnoozedAgentBridgeChannels,
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
  scheduleStayLateCheckout,
  disputeStayFolioCharge,
  revokeStayKeyless,
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
  registerAthleteCompetition,
  clearAthleteForCompetition,
  runAthleteCompetitionClearanceSweep,
  assignAthleteCoach,
  placeAthleteMedicalHold,
  clearAthleteMedicalHold,
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
  flagLifeCrisis,
  clearLifeCrisis,
  runLifeMissedCheckInSweep,
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
  bumpAgentJobPriority,
  snoozeAgentJob,
  cancelAgentJob,
  wakeSnoozedAgentJobs,
} from '../server/agentqueue.js';
import {
  greenPulseOverview,
  recordGreenMeter,
  addGreenIncident,
  createGreenWorkPermit,
  approveGreenWorkPermit,
  runGreenPermitExpirySweep,
  issueGreenCurtailment,
  clearGreenCurtailment,
  closeGreenWorkPermit,
  runWaterLeakTriage,
} from '../server/greenpulse.js';
import {
  campusBriefOverview,
  runCampusAutomations,
  syncCampusBriefActions,
  ackCampusBriefAction,
  assignCampusBriefAction,
  escalateCampusBriefAction,
  snoozeCampusBriefAction,
  wakeSnoozedCampusBriefActions,
  dismissCampusBriefAction,
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
  createExtremeMaas,
  renewExtremeMaas,
  topUpExtremeWallet,
  extremeWalletSpend,
  runExtremeWeatherHoldSweep,
} from '../server/extremepark.js';
import {
  runSportEligibilitySweep,
  gateSportSlotAccess,
  applySportCompetitionHold,
  completeBridgeRecovery,
  runSportPostCompSweep,
  syncSlotToSession,
  snoozeSportHold,
  wakeSportHolds,
  escalateSportGate,
  archiveSportBridgeLink,
  linkSportProfiles,
} from '../server/sportbridge.js';
import { runGreenPulseAutomations } from '../server/greenpulse.js';
import {
  agentFleetOverview,
  dispatchFleetDirective,
  pingFleetAgent,
  sweepFleetPresence,
  acknowledgeFleetDirective,
  startFleetShift,
  handoffFleetShift,
  retireFleetDirective,
  parkFleetAgent,
  unparkFleetAgents,
  runFleetLoadBalance,
  closeFleetShift,
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
  disputeMallInvoice,
  pauseMallTenant,
  resumeMallTenant,
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
  assignFamilyStaff,
  runFamilyRollCall,
  runFamilyStaffRatioSweep,
  flagFamilyPickupNoShow,
  cancelFamilyProgramBooking,
  runFamilyPickupExpirySweep,
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
  scanCultureDoor,
  callCultureCrew,
  ackCultureCrewCall,
  upgradeCultureSaleVip,
  transferCultureHold,
  denyCultureDoor,
} from '../server/culturescene.js';
import {
  returnMarketRental,
  restockMarketListing,
  reconcileMarketChannels,
  runMarketLowStockSweep,
  createMarketPurchaseOrder,
  receiveMarketPurchaseOrder,
  flagMarketRentalOverdue,
  assessMarketRentalDamage,
  settleMarketDeposit,
  runMarketRentalSweep,
} from '../server/marketos.js';
import { batchRecordGreenMeters } from '../server/greenpulse.js';
import { mallDayRollup, settleMallTenantFnb } from '../server/openmall.js';
import { campusHealthCheck } from '../server/campusbrief.js';
import {
  buildReadiness,
  refreshReadinessSnapshot,
  setReadinessThreshold,
  ackReadinessDimension,
  escalateReadinessGap,
  resolveReadinessGap,
} from '../server/readiness.js';
import {
  buildCognisphere,
  runCognisphereSweep,
  ackCognisphereFlag,
  haltCognisphereCost,
  clearCognisphereDrift,
  mitigateCognisphereRisk,
} from '../server/cognisphere.js';
import {
  runOpsIntegritySweep,
  rotateOpsBackup,
  quarantineOpsFile,
  clearOpsDegraded,
} from '../server/ops.js';
import {
  buildVanguard,
  runVanguardSweep,
  ackVanguardFlag,
  forceVanguardPosOnline,
  clearVanguardInvDrift,
  flushVanguardMintQueue,
} from '../server/vanguard.js';
import {
  buildWarroom,
  runWarroomSweep,
  ackWarroomFlag,
  clearWarroomHaccp,
  clearWarroomPatrol,
  closeWarroomConcierge,
} from '../server/warroom.js';
import {
  buildOracle,
  runOracleSweep,
  ackOracleFlag,
  resolveOracleAnomaly,
  clearOracleScoreRed,
  promoteOracleCanary,
} from '../server/oracle.js';
import {
  buildAegis,
  runAegisSweep,
  ackAegisFlag,
  clearAegisSafety,
  closeAegisIncident,
  clearAegisEvac,
} from '../server/aegis.js';
import {
  buildBrandpulse,
  runBrandpulseSweep,
  ackBrandpulseFlag,
  triageBrandpulseInbox,
  approveBrandpulseUgc,
  actionBrandpulseGuard,
} from '../server/brandpulse.js';
import {
  buildForge,
  runForgeSweep,
  ackForgeFlag,
  advanceForgeTalent,
  renewForgeCert,
  approveForgeShift,
} from '../server/forge.js';
import {
  buildEcosphere,
  runEcosphereSweep,
  ackEcosphereFlag,
  mitigateEcosphereFinding,
  fulfillEcosphereDataprotect,
  clearEcosphereVendorHigh,
} from '../server/ecosphere.js';
import {
  buildBoardpack,
  runBoardpackSweep,
  ackBoardpackFlag,
  snapshotBoardpack,
  renewBoardpackContract,
  rebalanceBoardpackBudget,
} from '../server/boardpack.js';
import {
  buildCitadel,
  runCitadelSweep,
  ackCitadelFlag,
  clearCitadelPlant,
  clearCitadelHvac,
  closeCitadelWorkorder,
} from '../server/citadel.js';
import {
  buildPeoplehub,
  runPeoplehubSweep,
  ackPeoplehubFlag,
  approvePeoplehubLeave,
  closePeoplehubNearmiss,
  completePeoplehubOnboarding,
} from '../server/peoplehub.js';
import {
  buildBastion,
  runBastionSweep,
  ackBastionFlag,
  closeBastionAccess,
  approveBastionRole,
  archiveBastionBreach,
} from '../server/bastion.js';
import {
  buildApex,
  runApexSweep,
  ackApexFlag,
  clearApexInvoices,
  renewApexLicenses,
  approveApexOvertime,
} from '../server/apex.js';
import {
  buildVerdant,
  runVerdantSweep,
  ackVerdantFlag,
  clearVerdantWater,
  closeVerdantEsg,
  fixVerdantEv,
} from '../server/verdant.js';
import {
  buildSanctum,
  runSanctumSweep,
  ackSanctumFlag,
  clearSanctumSpa,
  clearSanctumBio,
  completeSanctumSession,
} from '../server/sanctum.js';
import {
  buildLedger,
  runLedgerSweep,
  ackLedgerFlag,
  collectLedgerAr,
  resolveLedgerChargeback,
  clearLedgerChannel,
} from '../server/ledger.js';
import {
  buildOrbit,
  runOrbitSweep,
  ackOrbitFlag,
  cleanOrbitRooms,
  encodeOrbitKeys,
  retryOrbitGuestapp,
} from '../server/orbit.js';
import {
  buildHearth,
  runHearthSweep,
  ackHearthFlag,
  runHearthPass,
  clearHearthAllergen,
  sendHearthPlate,
} from '../server/hearth.js';
import {
  buildMeridian,
  runMeridianSweep,
  ackMeridianFlag,
  approveMeridianMove,
  approveMeridianEarly,
  clearMeridianTurndown,
} from '../server/meridian.js';
import {
  buildNightly,
  runNightlySweep,
  ackNightlyFlag,
  closeNightlyLog,
  closeNightlyFolio,
  approveNightlyLate,
} from '../server/nightly.js';
import {
  buildStudio,
  runStudioSweep,
  ackStudioFlag,
  approveStudioUgc,
  endStudioLive,
  deliverStudioBrief,
} from '../server/studio.js';
import {
  buildAether, runAetherSweep, ackAetherFlag, activateAetherPartner, closeAetherDeal, liveAetherCoinvest,
} from '../server/aether.js';
import {
  buildAurora, runAuroraSweep, ackAuroraFlag, clearAuroraFlow, endAuroraLight, dayAuroraNightmode,
} from '../server/aurora.js';
import {
  buildHorizon, runHorizonSweep, ackHorizonFlag, clearHorizonAllergy, closeHorizonTabs, approveHorizonComps,
} from '../server/horizon.js';
import {
  buildBazaar, runBazaarSweep, ackBazaarFlag, healBazaarStock, reviewBazaarShrink, dispatchBazaarDark,
} from '../server/bazaar.js';
import {
  buildHarbor, runHarborSweep, ackHarborFlag, clearHarborCold, releaseHarborHold, invoiceHarborDemurrage,
} from '../server/harbor.js';
import {
  buildSentinel, runSentinelSweep, ackSentinelFlag, resolveSentinelLost, serviceSentinelAed, flowSentinelGate,
} from '../server/sentinel.js';
import {
  buildEmpire, runEmpireSweep, ackEmpireFlag, syncEmpireTy, shipEmpireHepha, departEmpireTour,
} from '../server/empire.js';
import {
  buildElysium, runElysiumSweep, ackElysiumFlag, closeElysiumAccess, approveElysiumRole, archiveElysiumBreach,
} from '../server/elysium.js';
import {
  buildTide, runTideSweep, ackTideFlag, clearTideReef, openTideCliff, freeTidePier,
} from '../server/tide.js';
import {
  buildSkyline, runSkylineSweep, ackSkylineFlag, passSkylineSound, endSkylineEscape, serviceSkylineJet,
} from '../server/skyline.js';
import {
  buildAtlas, runAtlasSweep, ackAtlasFlag, closeAtlasFolio, serveAtlasDesk, runAtlasAudit,
} from '../server/atlas.js';
import {
  buildPhoenix2, runPhoenix2Sweep, ackPhoenix2Flag, closePhoenix2Backup, livePhoenix2Runbook, closePhoenix2Drill,
} from '../server/phoenix2.js';
import { agentBridgeOverview, agentBridgePing } from '../server/agentbridge.js';
import { extremeOverview } from '../server/extremepark.js';
import { cultureSceneOverview, holdCultureTicket, createCultureEvent } from '../server/culturescene.js';
import { sportBridgeOverview } from '../server/sportbridge.js';
// wave-12 helpers imported above

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const campus = campusCoreOverview();
assert(campus.zones?.length >= 8, 'campus zones');
updateCampusZone(campus.zones[0].id, { notes: 'smoke' }, 'smoke');
addCampusIncident({ title: 'smoke incident', zone_id: 'z_sport' }, 'smoke');
transitionCampusZone({ zone_id: 'z_culture' }, 'smoke');
addCampusIncident({ title: 'smoke escalate target', zone_id: 'z_sport', severity: 'info' }, 'smoke');
assert(escalateCampusIncident({ reason: 'smoke' }, 'smoke').ok, 'campus incident escalate');
assert(lockdownCampusZone({ zone_id: 'z_sport', reason: 'smoke', force: true }, 'smoke').ok, 'campus lockdown');
assert(clearCampusZoneLockdown({ zone_id: 'z_sport' }, 'smoke').ok, 'campus lockdown clear');
assert(runCampusCapacityAlertSweep({ force: true, threshold: 1 }, 'smoke').ok, 'campus capacity alert');
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
assert(muteAgentBridgeAlert({ minutes: 1, reason: 'smoke mute' }, 'smoke').ok, 'bridge alert mute');
assert(unmuteAgentBridgeAlerts({ force: true }, 'smoke').ok, 'bridge alert unmute');
assert(snoozeAgentBridgeChannel({ minutes: 1, reason: 'smoke snooze' }, 'smoke').ok, 'bridge channel snooze');
assert(wakeSnoozedAgentBridgeChannels({ force: true }, 'smoke').ok, 'bridge channel wake');
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
assert(scheduleStayLateCheckout({ unit_id: 'su_2', hours: 2 }, 'smoke').ok, 'stay late checkout');
assert(disputeStayFolioCharge({ unit_id: 'su_2', reason: 'smoke' }, 'smoke').ok, 'stay folio dispute');
assert(postStayFolioCharge({ unit_id: 'su_2', kind: 'amenity', amount_try: 120 }, 'smoke').ok, 'folio charge after dispute');
assert(issueStayKeyless({ unit_id: 'su_2' }, 'smoke').ok, 'stay keyless reissue');
assert(revokeStayKeyless({ unit_id: 'su_2' }, 'smoke').ok, 'stay keyless revoke');
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
issueAthleteLicense({ athlete_id: 'ath_1' }, 'smoke');
setAthleteClearance({ athlete_id: 'ath_1', status: 'cleared' }, 'smoke');
assert(registerAthleteCompetition({ athlete_id: 'ath_1', title: 'Smoke Cup' }, 'smoke').ok, 'athlete competition');
assert(clearAthleteForCompetition({ athlete_id: 'ath_1' }, 'smoke').ok, 'athlete competition clear');
assert(assignAthleteCoach({ athlete_id: 'ath_3', coach_name: 'Smoke Coach' }, 'smoke').ok, 'athlete coach');
assert(placeAthleteMedicalHold({ athlete_id: 'ath_3', days: 3, reason: 'smoke' }, 'smoke').ok, 'athlete medical hold');
assert(clearAthleteMedicalHold({ athlete_id: 'ath_3' }, 'smoke').ok, 'athlete medical hold clear');
assert(runAthleteCompetitionClearanceSweep({ force: true }, 'smoke').ok, 'athlete competition sweep');

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
assert(flagLifeCrisis({ client_id: 'lc_2', severity: 'high', force: true }, 'smoke').ok, 'life crisis');
assert(clearLifeCrisis({ client_id: 'lc_2' }, 'smoke').ok, 'life crisis clear');
assert(runLifeMissedCheckInSweep({ force: true, stale_hours: 1 }, 'smoke').ok, 'life missed checkin');

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
assert(assignFamilyStaff({ program_id: 'fp_3', name: 'Smoke Rehber', max_ratio: 6 }, 'smoke').ok, 'family staff');
assert(runFamilyRollCall({ mark_first_absent: true }, 'smoke').ok, 'family roll call');
assert(runFamilyStaffRatioSweep({ force: true }, 'smoke').ok, 'family staff ratio');
familyCheckIn({ child_name: 'Pickup Kid', program_id: 'fp_3', guardian: 'Veli' }, 'smoke');
const pickup2 = issueFamilyPickupCode({ child_name: 'Pickup Kid', authorized_name: 'Veli', minutes: 1 }, 'smoke');
assert(pickup2.ok, 'family pickup for noshow');
assert(flagFamilyPickupNoShow({ pickup_id: pickup2.pickup.id, force: true }, 'smoke').ok, 'family pickup noshow');
assert(cancelFamilyProgramBooking({ program_id: 'fp_1', seats: 1 }, 'smoke').ok, 'family program cancel');
familyCheckIn({ child_name: 'Expiry Kid', program_id: 'fp_3', guardian: 'Veli2' }, 'smoke');
issueFamilyPickupCode({ child_name: 'Expiry Kid', authorized_name: 'Veli2', minutes: 1 }, 'smoke');
assert(runFamilyPickupExpirySweep({ force: true }, 'smoke').ok, 'family pickup expiry');

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
assert(
  disputeMallInvoice({ invoice_id: rentRun.created[0].id, reason: 'smoke' }, 'smoke').ok ||
    disputeMallInvoice({ reason: 'smoke' }, 'smoke').ok,
  'mall invoice dispute',
);
assert(pauseMallTenant({ force: true }, 'smoke').ok, 'mall tenant pause');
assert(resumeMallTenant({}, 'smoke').ok, 'mall tenant resume');
assert(runMallDunningSweep({ force: true }, 'smoke').ok, 'mall dunning');
assert(generateMallCamRun({ period: '2026-08', force: true }, 'smoke').ok, 'mall cam run');
assert(holdMallLease({ force: true }, 'smoke').ok, 'mall lease hold');
assert(releaseMallLease({}, 'smoke').ok, 'mall lease release');
let rentListing = marketOsOverview().listings.find((l) => l.mode === 'rent' && l.status === 'live');
if (!rentListing) {
  const held = marketOsOverview().listings.find((l) => l.mode === 'rent');
  if (held) restockMarketListing({ listing_id: held.id, stock: 2 }, 'smoke');
  rentListing = marketOsOverview().listings.find((l) => l.mode === 'rent' && l.status === 'live');
}
assert(rentListing, 'live rent listing');
const rentCo = marketCheckout({ listing_id: rentListing.id, buyer: 'smoke', days: 1 }, 'smoke');
assert(rentCo.ok && rentCo.order?.due_at, 'market rent checkout due');
assert(flagMarketRentalOverdue({ order_id: rentCo.order.id, force: true }, 'smoke').ok, 'market rental overdue');
assert(
  assessMarketRentalDamage(
    { order_id: rentCo.order.id, severity: 'moderate', charge_try: 400, notes: 'smoke scratch' },
    'smoke',
  ).ok,
  'market rental damage',
);
assert(returnMarketRental({ listing_id: rentListing.id }, 'smoke').ok, 'market rental return overdue');
assert(
  settleMarketDeposit({ order_id: rentCo.order.id, disposition: 'auto' }, 'smoke').ok,
  'market deposit settle',
);
const rent2 = marketOsOverview().listings.find((l) => l.mode === 'rent' && l.status === 'live');
if (rent2) {
  marketCheckout({ listing_id: rent2.id, buyer: 'smoke', days: 1 }, 'smoke');
  assert(runMarketRentalSweep({ force: true }, 'smoke').ok, 'market rental sweep');
  returnMarketRental({ listing_id: rent2.id }, 'smoke');
  settleMarketDeposit({ listing_id: rent2.id, disposition: 'refund' }, 'smoke');
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
assert(scanCultureDoor({ force: true, gate: 'main' }, 'smoke').ok, 'culture door scan');
assert(callCultureCrew({ event_id: culture.events[0].id }, 'smoke').ok, 'culture crew call');
assert(ackCultureCrewCall({ role: 'stage' }, 'smoke').ok, 'culture crew ack');
assert(upgradeCultureSaleVip({ force: true }, 'smoke').ok, 'culture vip upgrade');
const holdX = holdCultureTicket({ event_id: culture.events[0].id, qty: 1, guest: 'transfer-from' }, 'smoke');
assert(holdX.ok, 'culture hold for transfer');
assert(
  transferCultureHold({ hold_id: holdX.hold.id, to_guest: 'transfer-to' }, 'smoke').ok,
  'culture hold transfer',
);
assert(denyCultureDoor({ gate: 'vip', reason: 'smoke_deny', guest: 'blocked' }, 'smoke').ok, 'culture door deny');
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
// Clear leftover post-comp holds from prior runs so gate allow is deterministic
for (let i = 0; i < 40; i++) {
  if (!completeBridgeRecovery({ athlete_id: 'ath_1' }, 'smoke').ok) break;
}
for (let i = 0; i < 10; i++) {
  if (!completeBridgeRecovery({}, 'smoke').ok) break;
}
const gateOk = gateSportSlotAccess({ extreme_user: 'guest_can' }, 'smoke');
assert(gateOk.ok, 'sport gate allow');
syncSlotToSession({ extreme_user: 'guest_can' }, 'smoke');
const elig = runSportEligibilitySweep({}, 'smoke');
assert(elig.ok, 'sport eligibility');
assert(applySportCompetitionHold({ athlete_id: 'ath_1', hours: 24 }, 'smoke').ok, 'sport comp hold');
assert(gateSportSlotAccess({ extreme_user: 'guest_can' }, 'smoke').ok === false, 'sport gate block hold');
assert(snoozeSportHold({ athlete_id: 'ath_1', minutes: 1, reason: 'smoke' }, 'smoke').ok, 'sport hold snooze');
assert(wakeSportHolds({ force: true }, 'smoke').ok, 'sport hold wake');
assert(completeBridgeRecovery({ athlete_id: 'ath_1' }, 'smoke').ok, 'sport recovery close');
assert(runSportPostCompSweep({ force: true }, 'smoke').ok, 'sport postcomp sweep');
completeBridgeRecovery({}, 'smoke');
reportAthleteInjury({ athlete_id: 'ath_1', body_area: 'bilek', severity: 'moderate' }, 'smoke');
assert(gateSportSlotAccess({ extreme_user: 'guest_can' }, 'smoke').ok === false, 'sport gate block injury');
assert(escalateSportGate({ extreme_user: 'guest_can', reason: 'smoke' }, 'smoke').ok, 'sport gate escalate');
assert(gateSportSlotAccess({ extreme_user: 'guest_can', force: true }, 'smoke').ok, 'sport gate force');
setAthleteClearance({ athlete_id: 'ath_1', status: 'cleared' }, 'smoke');
assert(linkSportProfiles({ extreme_user: 'guest_arch', athlete_id: 'ath_2', note: 'archive-seed' }, 'smoke').ok, 'sport link seed');
assert(archiveSportBridgeLink({ extreme_user: 'guest_arch', reason: 'smoke archive' }, 'smoke').ok, 'sport link archive');
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
assert(refreshReadinessSnapshot({ note: 'smoke' }, 'smoke').ok, 'readiness snapshot');
assert(setReadinessThreshold({ warn: 72, alert: 58, critical: 42 }, 'smoke').ok, 'readiness threshold');
assert(ackReadinessDimension({ id: 'bridge' }, 'smoke').ok, 'readiness ack');
assert(escalateReadinessGap({ id: 'agents', reason: 'smoke' }, 'smoke').ok, 'readiness escalate');
assert(resolveReadinessGap({}, 'smoke').ok, 'readiness gap resolve');
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
const syncedEsc = syncCampusBriefActions('smoke');
const escTarget = (syncedEsc.overview?.register || []).find((a) => a.status === 'open' || a.status === 'assigned');
if (escTarget?.id) {
  assert(escalateCampusBriefAction({ id: escTarget.id, reason: 'smoke esc' }, 'smoke').ok, 'brief escalate');
  assert(snoozeCampusBriefAction({ id: escTarget.id, minutes: 1, reason: 'smoke snooze' }, 'smoke').ok, 'brief snooze');
  assert(wakeSnoozedCampusBriefActions({ force: true }, 'smoke').ok, 'brief wake');
  assert(dismissCampusBriefAction({ id: escTarget.id, reason: 'smoke dismiss' }, 'smoke').ok, 'brief dismiss');
}
assert(publishCampusBriefDigest('smoke').ok, 'brief publish');
const sla = runAgentQueueSlaSweep({ force: true }, 'smoke');
assert(sla.ok, 'agent sla sweep');
assert(rebalanceAgentQueue({}, 'smoke').ok, 'agent rebalance');
const failSeed = enqueueAgentJob({ agent: 'ETHOS', title: 'fail-seed-for-revive' }, 'smoke');
const failClaim = claimAgentJob({ id: failSeed.job?.id }, 'smoke');
completeAgentJob({ id: failClaim.job?.id || failSeed.job?.id, fail: true }, 'smoke');
assert(reviveDeadAgentJobs({ limit: 5 }, 'smoke').ok, 'agent revive');
const bumpSeed = enqueueAgentJob({ agent: 'DAZE-HUB', title: 'bump-snooze-cancel-seed', priority: 'normal' }, 'smoke');
assert(bumpAgentJobPriority({ id: bumpSeed.job?.id, reason: 'smoke bump' }, 'smoke').ok, 'agent priority bump');
assert(snoozeAgentJob({ id: bumpSeed.job?.id, minutes: 1, reason: 'smoke snooze' }, 'smoke').ok, 'agent snooze');
assert(wakeSnoozedAgentJobs({ force: true }, 'smoke').ok, 'agent wake snoozed');
const cancelSeed = enqueueAgentJob({ agent: 'ETHOS', title: 'cancel-seed' }, 'smoke');
assert(cancelAgentJob({ id: cancelSeed.job?.id, reason: 'smoke cancel' }, 'smoke').ok, 'agent cancel');
assert(archiveAgentJobs({ force: true }, 'smoke').ok, 'agent archive');
extremeSlotWeatherCheck({ force_condition: 'windy' }, 'smoke');
const hold = applyExtremeWeatherHold({ force_condition: 'windy', minutes: 30, force: true }, 'smoke');
assert(hold.ok, 'weather hold');
assert(
  runExtremeWeatherHoldSweep({ force_clear: true, force_hold: true, force_condition: 'windy', minutes: 15 }, 'smoke')
    .ok,
  'weather hold sweep',
);
clearExtremeWeatherHold({}, 'smoke');
const maas = createExtremeMaas({ user_id: 'guest_can', kind: 'gopro' }, 'smoke');
assert(maas.ok, 'extreme maas');
assert(renewExtremeMaas({ id: maas.maas.id, hours: 24 }, 'smoke').ok, 'extreme maas renew');
assert(topUpExtremeWallet({ user_id: 'guest_can', amount: 400 }, 'smoke').ok, 'extreme wallet topup');
assert(extremeWalletSpend({ user_id: 'guest_can', amount: 100 }, 'smoke').ok, 'extreme wallet spend');
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
assert(
  createGreenWorkPermit({ zone_id: 'z_forest', work: 'expire me', hours: 1, status: 'approved' }, 'smoke').ok,
  'green permit for expiry',
);
assert(runGreenPermitExpirySweep({ force: true }, 'smoke').ok, 'green permit expiry');
assert(issueGreenCurtailment({ kind: 'grid', pct: 25, hours: 2, force: true }, 'smoke').ok, 'green curtailment');
assert(clearGreenCurtailment({ kind: 'grid' }, 'smoke').ok, 'green curtailment clear');

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
dispatchFleetDirective({ title: 'retire-seed ESG alert' }, 'smoke');
assert(retireFleetDirective({ reason: 'smoke retire' }, 'smoke').ok, 'fleet directive retire');
assert(parkFleetAgent({ agent: 'MINT', minutes: 1, reason: 'smoke park' }, 'smoke').ok, 'fleet park');
assert(unparkFleetAgents({ force: true }, 'smoke').ok, 'fleet unpark');
assert(runFleetLoadBalance({ limit: 2 }, 'smoke').ok, 'fleet load balance');
assert(closeFleetShift({ reason: 'smoke close' }, 'smoke').ok, 'fleet shift close');

const bridge = agentBridgeOverview();
assert(bridge.agents?.length >= 8, 'campus agents on bridge');
assert(bridge.pulses?.fleet?.total === 28, 'bridge fleet pulse');
assert(bridge.pulses?.culture && bridge.pulses?.sport && bridge.pulses?.queue && bridge.pulses?.green, 'bridge pulses');
const ping = agentBridgePing({ agent: 'DAZE-HUB', note: 'smoke' }, 'smoke');
assert(ping.ok, 'agent ping');

assert(buildCognisphere().title, 'cognisphere overview');
assert(runCognisphereSweep({ force: true }, 'smoke').ok, 'cognisphere sweep');
assert(haltCognisphereCost({ service: 'Ollama', reason: 'smoke' }, 'smoke').ok, 'cognisphere cost halt');
assert(clearCognisphereDrift({ force: true }, 'smoke').ok, 'cognisphere drift clear');
assert(mitigateCognisphereRisk({}, 'smoke').ok, 'cognisphere mitigate');
assert(ackCognisphereFlag({}, 'smoke').ok, 'cognisphere flag ack');

assert(runOpsIntegritySweep({ force: true }, 'smoke').ok, 'ops integrity');
assert(rotateOpsBackup({ note: 'smoke' }, 'smoke').ok, 'ops backup rotate');
assert(quarantineOpsFile({ file: 'ops-backup-rotations.json', reason: 'smoke' }, 'smoke').ok, 'ops quarantine');
assert(clearOpsDegraded({}, 'smoke').ok, 'ops clear degraded');

assert(buildVanguard().title, 'vanguard overview');
assert(runVanguardSweep({ force: true }, 'smoke').ok, 'vanguard sweep');
assert(forceVanguardPosOnline({}, 'smoke').ok, 'vanguard pos online');
assert(clearVanguardInvDrift({ force: true }, 'smoke').ok, 'vanguard inv clear');
assert(flushVanguardMintQueue({}, 'smoke').ok, 'vanguard mint flush');
assert(ackVanguardFlag({}, 'smoke').ok, 'vanguard flag ack');

assert(buildWarroom().title, 'warroom overview');
assert(runWarroomSweep({ force: true }, 'smoke').ok, 'warroom sweep');
assert(clearWarroomHaccp({}, 'smoke').ok, 'warroom haccp clear');
assert(clearWarroomPatrol({}, 'smoke').ok, 'warroom patrol clear');
assert(closeWarroomConcierge({}, 'smoke').ok, 'warroom concierge close');
assert(ackWarroomFlag({}, 'smoke').ok, 'warroom flag ack');

assert(buildOracle().title, 'oracle overview');
assert(runOracleSweep({ force: true }, 'smoke').ok, 'oracle sweep');
assert(resolveOracleAnomaly({}, 'smoke').ok, 'oracle anomaly resolve');
assert(clearOracleScoreRed({}, 'smoke').ok, 'oracle score clear');
assert(promoteOracleCanary({}, 'smoke').ok, 'oracle canary promote');
assert(ackOracleFlag({}, 'smoke').ok, 'oracle flag ack');

assert(buildAegis().title, 'aegis overview');
assert(runAegisSweep({ force: true }, 'smoke').ok, 'aegis sweep');
assert(clearAegisSafety({}, 'smoke').ok, 'aegis safety clear');
assert(closeAegisIncident({}, 'smoke').ok, 'aegis incident close');
assert(clearAegisEvac({}, 'smoke').ok, 'aegis evac clear');
assert(ackAegisFlag({}, 'smoke').ok, 'aegis flag ack');

assert(buildBrandpulse().title, 'brandpulse overview');
assert(runBrandpulseSweep({ force: true }, 'smoke').ok, 'brandpulse sweep');
assert(triageBrandpulseInbox({}, 'smoke').ok, 'brandpulse inbox triage');
assert(approveBrandpulseUgc({}, 'smoke').ok, 'brandpulse ugc approve');
assert(actionBrandpulseGuard({}, 'smoke').ok, 'brandpulse guard action');
assert(ackBrandpulseFlag({}, 'smoke').ok, 'brandpulse flag ack');

assert(buildForge().title, 'forge overview');
assert(runForgeSweep({ force: true }, 'smoke').ok, 'forge sweep');
assert(advanceForgeTalent({}, 'smoke').ok, 'forge talent advance');
assert(renewForgeCert({}, 'smoke').ok, 'forge cert renew');
assert(approveForgeShift({}, 'smoke').ok, 'forge shift approve');
assert(ackForgeFlag({}, 'smoke').ok, 'forge flag ack');

assert(buildEcosphere().title, 'ecosphere overview');
assert(runEcosphereSweep({ force: true }, 'smoke').ok, 'ecosphere sweep');
assert(mitigateEcosphereFinding({}, 'smoke').ok, 'ecosphere finding mitigate');
assert(fulfillEcosphereDataprotect({}, 'smoke').ok, 'ecosphere dataprotect fulfill');
assert(clearEcosphereVendorHigh({}, 'smoke').ok, 'ecosphere vendor clear');
assert(ackEcosphereFlag({}, 'smoke').ok, 'ecosphere flag ack');

assert(buildBoardpack().title, 'boardpack overview');
assert(runBoardpackSweep({ force: true }, 'smoke').ok, 'boardpack sweep');
assert(snapshotBoardpack({}, 'smoke').ok, 'boardpack snapshot');
assert(renewBoardpackContract({}, 'smoke').ok, 'boardpack contract renew');
assert(rebalanceBoardpackBudget({}, 'smoke').ok, 'boardpack budget rebalance');
assert(ackBoardpackFlag({}, 'smoke').ok, 'boardpack flag ack');

assert(buildCitadel().title, 'citadel overview');
assert(runCitadelSweep({ force: true }, 'smoke').ok, 'citadel sweep');
assert(clearCitadelPlant({}, 'smoke').ok, 'citadel plant clear');
assert(clearCitadelHvac({}, 'smoke').ok, 'citadel hvac clear');
assert(closeCitadelWorkorder({}, 'smoke').ok, 'citadel wo close');
assert(ackCitadelFlag({}, 'smoke').ok, 'citadel flag ack');

assert(buildPeoplehub().title, 'peoplehub overview');
assert(runPeoplehubSweep({ force: true }, 'smoke').ok, 'peoplehub sweep');
assert(approvePeoplehubLeave({}, 'smoke').ok, 'peoplehub leave approve');
assert(closePeoplehubNearmiss({}, 'smoke').ok, 'peoplehub nearmiss close');
assert(completePeoplehubOnboarding({}, 'smoke').ok, 'peoplehub onboarding complete');
assert(ackPeoplehubFlag({}, 'smoke').ok, 'peoplehub flag ack');

assert(buildBastion().title, 'bastion overview');
assert(runBastionSweep({ force: true }, 'smoke').ok, 'bastion sweep');
assert(closeBastionAccess({}, 'smoke').ok, 'bastion access close');
assert(approveBastionRole({}, 'smoke').ok, 'bastion role approve');
assert(archiveBastionBreach({}, 'smoke').ok, 'bastion breach archive');
assert(ackBastionFlag({}, 'smoke').ok, 'bastion flag ack');

assert(buildApex().title, 'apex overview');
assert(runApexSweep({ force: true }, 'smoke').ok, 'apex sweep');
assert(clearApexInvoices({}, 'smoke').ok, 'apex invoice clear');
assert(renewApexLicenses({}, 'smoke').ok, 'apex license renew');
assert(approveApexOvertime({}, 'smoke').ok, 'apex overtime approve');
assert(ackApexFlag({}, 'smoke').ok, 'apex flag ack');


assert(buildSanctum().title, 'sanctum overview');
assert(runSanctumSweep({ force: true }, 'smoke').ok, 'sanctum sweep');
assert(clearSanctumSpa({}, 'smoke').ok, 'sanctum spa clear');
assert(clearSanctumBio({}, 'smoke').ok, 'sanctum bio clear');
assert(completeSanctumSession({}, 'smoke').ok, 'sanctum session complete');
assert(ackSanctumFlag({}, 'smoke').ok, 'sanctum flag ack');

assert(buildLedger().title, 'ledger overview');
assert(runLedgerSweep({ force: true }, 'smoke').ok, 'ledger sweep');
assert(collectLedgerAr({}, 'smoke').ok, 'ledger ar collect');
assert(resolveLedgerChargeback({}, 'smoke').ok, 'ledger chargeback resolve');
assert(clearLedgerChannel({}, 'smoke').ok, 'ledger channel clear');
assert(ackLedgerFlag({}, 'smoke').ok, 'ledger flag ack');

assert(buildOrbit().title, 'orbit overview');
assert(runOrbitSweep({ force: true }, 'smoke').ok, 'orbit sweep');
assert(cleanOrbitRooms({}, 'smoke').ok, 'orbit room clean');
assert(encodeOrbitKeys({}, 'smoke').ok, 'orbit key encode');
assert(retryOrbitGuestapp({}, 'smoke').ok, 'orbit guestapp retry');
assert(ackOrbitFlag({}, 'smoke').ok, 'orbit flag ack');

assert(buildVerdant().title, 'verdant overview');
assert(runVerdantSweep({ force: true }, 'smoke').ok, 'verdant sweep');
assert(clearVerdantWater({}, 'smoke').ok, 'verdant water clear');
assert(closeVerdantEsg({}, 'smoke').ok, 'verdant esg close');
assert(fixVerdantEv({}, 'smoke').ok, 'verdant ev fix');
assert(ackVerdantFlag({}, 'smoke').ok, 'verdant flag ack');


assert(buildHearth().title, 'hearth overview');
assert(runHearthSweep({ force: true }, 'smoke').ok, 'hearth sweep');
assert(runHearthPass({}, 'smoke').ok, 'hearth pass run');
assert(clearHearthAllergen({}, 'smoke').ok, 'hearth allergen clear');
assert(sendHearthPlate({}, 'smoke').ok, 'hearth plate send');
assert(ackHearthFlag({}, 'smoke').ok, 'hearth flag ack');

assert(buildMeridian().title, 'meridian overview');
assert(runMeridianSweep({ force: true }, 'smoke').ok, 'meridian sweep');
assert(approveMeridianMove({}, 'smoke').ok, 'meridian move approve');
assert(approveMeridianEarly({}, 'smoke').ok, 'meridian early approve');
assert(clearMeridianTurndown({}, 'smoke').ok, 'meridian turndown clear');
assert(ackMeridianFlag({}, 'smoke').ok, 'meridian flag ack');

assert(buildNightly().title, 'nightly overview');
assert(runNightlySweep({ force: true }, 'smoke').ok, 'nightly sweep');
assert(closeNightlyLog({}, 'smoke').ok, 'nightly log close');
assert(closeNightlyFolio({}, 'smoke').ok, 'nightly folio close');
assert(approveNightlyLate({}, 'smoke').ok, 'nightly late approve');
assert(ackNightlyFlag({}, 'smoke').ok, 'nightly flag ack');

assert(buildStudio().title, 'studio overview');
assert(runStudioSweep({ force: true }, 'smoke').ok, 'studio sweep');
assert(approveStudioUgc({}, 'smoke').ok, 'studio ugc approve');
assert(endStudioLive({}, 'smoke').ok, 'studio live end');
assert(deliverStudioBrief({}, 'smoke').ok, 'studio brief deliver');
assert(ackStudioFlag({}, 'smoke').ok, 'studio flag ack');


assert(buildAether().title, 'aether overview');
assert(runAetherSweep({ force: true }, 'smoke').ok, 'aether sweep');
assert(activateAetherPartner({}, 'smoke').ok, 'aether partner activate');
assert(closeAetherDeal({}, 'smoke').ok, 'aether deal close');
assert(liveAetherCoinvest({}, 'smoke').ok, 'aether coinvest live');
assert(ackAetherFlag({}, 'smoke').ok, 'aether flag ack');

assert(buildAurora().title, 'aurora overview');
assert(runAuroraSweep({ force: true }, 'smoke').ok, 'aurora sweep');
assert(clearAuroraFlow({}, 'smoke').ok, 'aurora flow clear');
assert(endAuroraLight({}, 'smoke').ok, 'aurora light end');
assert(dayAuroraNightmode({}, 'smoke').ok, 'aurora night day');
assert(ackAuroraFlag({}, 'smoke').ok, 'aurora flag ack');

assert(buildHorizon().title, 'horizon overview');
assert(runHorizonSweep({ force: true }, 'smoke').ok, 'horizon sweep');
assert(clearHorizonAllergy({}, 'smoke').ok, 'horizon allergy clear');
assert(closeHorizonTabs({}, 'smoke').ok, 'horizon tab close');
assert(approveHorizonComps({}, 'smoke').ok, 'horizon comp approve');
assert(ackHorizonFlag({}, 'smoke').ok, 'horizon flag ack');

assert(buildBazaar().title, 'bazaar overview');
assert(runBazaarSweep({ force: true }, 'smoke').ok, 'bazaar sweep');
assert(healBazaarStock({}, 'smoke').ok, 'bazaar stock heal');
assert(reviewBazaarShrink({}, 'smoke').ok, 'bazaar shrink review');
assert(dispatchBazaarDark({}, 'smoke').ok, 'bazaar dark dispatch');
assert(ackBazaarFlag({}, 'smoke').ok, 'bazaar flag ack');


assert(buildHarbor().title, 'harbor overview');
assert(runHarborSweep({ force: true }, 'smoke').ok, 'harbor sweep');
assert(clearHarborCold({}, 'smoke').ok, 'harbor cold clear');
assert(releaseHarborHold({}, 'smoke').ok, 'harbor hold release');
assert(invoiceHarborDemurrage({}, 'smoke').ok, 'harbor demurrage invoice');
assert(ackHarborFlag({}, 'smoke').ok, 'harbor flag ack');

assert(buildSentinel().title, 'sentinel overview');
assert(runSentinelSweep({ force: true }, 'smoke').ok, 'sentinel sweep');
assert(resolveSentinelLost({}, 'smoke').ok, 'sentinel lost resolve');
assert(serviceSentinelAed({}, 'smoke').ok, 'sentinel aed service');
assert(flowSentinelGate({}, 'smoke').ok, 'sentinel gate flow');
assert(ackSentinelFlag({}, 'smoke').ok, 'sentinel flag ack');

assert(buildEmpire().title, 'empire overview');
assert(runEmpireSweep({ force: true }, 'smoke').ok, 'empire sweep');
assert(syncEmpireTy({}, 'smoke').ok, 'empire ty sync');
assert(shipEmpireHepha({}, 'smoke').ok, 'empire hepha ship');
assert(departEmpireTour({}, 'smoke').ok, 'empire tour depart');
assert(ackEmpireFlag({}, 'smoke').ok, 'empire flag ack');

assert(buildElysium().title, 'elysium overview');
assert(runElysiumSweep({ force: true }, 'smoke').ok, 'elysium sweep');
assert(closeElysiumAccess({}, 'smoke').ok, 'elysium access close');
assert(approveElysiumRole({}, 'smoke').ok, 'elysium role approve');
assert(archiveElysiumBreach({}, 'smoke').ok, 'elysium breach archive');
assert(ackElysiumFlag({}, 'smoke').ok, 'elysium flag ack');


assert(buildTide().title, 'tide overview');
assert(runTideSweep({ force: true }, 'smoke').ok, 'tide sweep');
assert(clearTideReef({}, 'smoke').ok, 'tide reef clear');
assert(openTideCliff({}, 'smoke').ok, 'tide cliff open');
assert(freeTidePier({}, 'smoke').ok, 'tide pier free');
assert(ackTideFlag({}, 'smoke').ok, 'tide flag ack');

assert(buildSkyline().title, 'skyline overview');
assert(runSkylineSweep({ force: true }, 'smoke').ok, 'skyline sweep');
assert(passSkylineSound({}, 'smoke').ok, 'skyline sound pass');
assert(endSkylineEscape({}, 'smoke').ok, 'skyline escape end');
assert(serviceSkylineJet({}, 'smoke').ok, 'skyline jet service');
assert(ackSkylineFlag({}, 'smoke').ok, 'skyline flag ack');

assert(buildAtlas().title, 'atlas overview');
assert(runAtlasSweep({ force: true }, 'smoke').ok, 'atlas sweep');
assert(closeAtlasFolio({}, 'smoke').ok, 'atlas folio close');
assert(serveAtlasDesk({}, 'smoke').ok, 'atlas desk serve');
assert(runAtlasAudit({}, 'smoke').ok, 'atlas audit run');
assert(ackAtlasFlag({}, 'smoke').ok, 'atlas flag ack');

assert(buildPhoenix2().title, 'phoenix2 overview');
assert(runPhoenix2Sweep({ force: true }, 'smoke').ok, 'phoenix2 sweep');
assert(closePhoenix2Backup({}, 'smoke').ok, 'phoenix2 backup close');
assert(livePhoenix2Runbook({}, 'smoke').ok, 'phoenix2 runbook live');
assert(closePhoenix2Drill({}, 'smoke').ok, 'phoenix2 drill close');
assert(ackPhoenix2Flag({}, 'smoke').ok, 'phoenix2 flag ack');

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
