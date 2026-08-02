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
  runStayringSweep,
  ackStayringFlag,
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
  runCampusbriefSweep,
  ackCampusbriefFlag,
  ageCampusBriefActions,
  seedCampusbriefAction,
  flagCampusbriefHealth,
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
  runAgentfleetSweep,
  ackAgentfleetFlag,
  closeFleetShift,
} from '../server/agentfleet.js';
import {
  ackNotificationsFlag,
  markAllRead,
  notificationsSummary,
  runNotificationsSweep,
  seedNotification,
} from '../server/notifications.js';
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
  runCulturesceneSweep,
  ackCulturesceneFlag,
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
  runReadinessSweep,
  ackReadinessFlag,
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
import {
  buildOdyssey, runOdysseySweep, ackOdysseyFlag, recoverOdysseyOkr, coolOdysseyRisk, hitOdysseyStar,
} from '../server/odyssey.js';
import {
  buildSignalhub, runSignalhubSweep, ackSignalhubFlag, clearSignalhubWater, clearSignalhubChem, clearSignalhubGate,
} from '../server/signalhub.js';
import {
  buildLinen, runLinenSweep, ackLinenFlag, passLinenInspect, releaseLinenOoo, completeLinenHk,
} from '../server/linen.js';
import {
  buildCharter2, runCharter2Sweep, ackCharter2Flag, closeCharter2Ethics, liveCharter2Risk, doneCharter2Claim,
} from '../server/charter2.js';
import {
  buildZenith, runZenithSweep, ackZenithFlag, catchZenithPace, healZenithMargin, coolZenithDemand,
} from '../server/zenith.js';
import {
  buildHelios, runHeliosSweep, ackHeliosFlag, runHeliosInbound, busyHeliosAsn, liveHeliosSlot,
} from '../server/helios.js';
import {
  buildKairos, runKairosSweep, ackKairosFlag, runKairosDrill, busyKairosCircle, liveKairosBadge,
} from '../server/kairos.js';
import {
  buildKeystone, runKeystoneSweep, ackKeystoneFlag, clearKeystoneBus, healKeystoneSlo, closeKeystoneEsc,
} from '../server/keystone.js';
import {
  buildLattice, runLatticeSweep, ackLatticeFlag, healLatticeGate, retryLatticeOta, clearLatticeFailback,
} from '../server/lattice.js';
import {
  buildMirror, runMirrorSweep, ackMirrorFlag, refreshMirrorTwin, acceptMirrorNba, closeMirrorRecovery,
} from '../server/mirror.js';
import {
  buildMonument, runMonumentSweep, ackMonumentFlag, closeMonumentCorrective, liveMonumentOral, runMonumentTimeline,
} from '../server/monument.js';
import {
  buildOlympus, runOlympusSweep, ackOlympusFlag, closeOlympusSeal, liveOlympusBrief, busyOlympusStory,
} from '../server/olympus.js';
import {
  buildPathos, runPathosSweep, ackPathosFlag, closePathosIp, livePathosRisk, runPathosClaim,
} from '../server/pathos.js';
import {
  buildPrism, runPrismSweep, ackPrismFlag, closePrismMark, livePrismPost, runPrismDefect,
} from '../server/prism.js';
import {
  buildPyramid, runPyramidSweep, ackPyramidFlag, resolvePyramidSys, healPyramidNet, flushPyramidComms,
} from '../server/pyramid.js';
import {
  buildSelene, runSeleneSweep, ackSeleneFlag, closeSeleneHeat, liveSeleneSupplier, runSeleneBoard,
} from '../server/selene.js';
import {
  buildSerenity, runSerenitySweep, ackSerenityFlag, closeSerenityLegacy, liveSerenityQuiet, runSerenityPillow,
} from '../server/serenity.js';
import {
  buildVault, runVaultSweep, ackVaultFlag, healVaultTreasury, closeVaultAp, clearVaultRecon,
} from '../server/vault.js';
import {
  buildConvoy, runConvoySweep, ackConvoyFlag, clearConvoyDispatch, readyConvoyFleet, freeConvoyCurb,
} from '../server/convoy.js';
import {
  buildCrucible2, runCrucible2Sweep, ackCrucible2Flag, liveCrucible2Pilot, busyCrucible2Learn, shipCrucible2Lab,
} from '../server/crucible2.js';
import {
  buildAgora, runAgoraSweep, ackAgoraFlag, runAgoraDrill, busyAgoraCircle, liveAgoraBadge,
} from '../server/agora.js';
import {
  buildAgora2, runAgora2Sweep, ackAgora2Flag, runAgora2Drill, busyAgora2Circle, liveAgora2Badge,
} from '../server/agora2.js';
import {
  buildAlliance2, runAlliance2Sweep, ackAlliance2Flag, busyAlliance2Partner, closeAlliance2Channel, liveAlliance2Invest,
} from '../server/alliance2.js';
import {
  buildAlliance3, runAlliance3Sweep, ackAlliance3Flag, busyAlliance3Partner, closeAlliance3Channel, liveAlliance3Invest,
} from '../server/alliance3.js';
import {
  buildArtery, runArterySweep, ackArteryFlag, runArteryInbound, busyArteryAsn, closeArteryDock,
} from '../server/artery.js';
import {
  buildArtery2, runArtery2Sweep, ackArtery2Flag, runArtery2Inbound, busyArtery2Asn, closeArtery2Dock,
} from '../server/artery2.js';
import {
  buildBastion2, runBastion2Sweep, ackBastion2Flag, closeBastion2Access, approveBastion2Role, archiveBastion2Breach,
} from '../server/bastion2.js';
import {
  buildCircuit2, runCircuit2Sweep, ackCircuit2Flag, busyCircuit2Moment, closeCircuit2Hook, liveCircuit2Schema,
} from '../server/circuit2.js';
import {
  buildCrucible, runCrucibleSweep, ackCrucibleFlag, liveCruciblePilot, busyCrucibleLearn, shipCrucibleLab,
} from '../server/crucible.js';
import {
  buildApotheosis, runApotheosisSweep, ackApotheosisFlag, closeApotheosisBackup, liveApotheosisRunbook, closeApotheosisDrill,
} from '../server/apotheosis.js';
import {
  buildCharter, runCharterSweep, ackCharterFlag, closeCharterEthics, liveCharterRisk, doneCharterClaim,
} from '../server/charter.js';
import {
  buildDominion2, runDominion2Sweep, ackDominion2Flag, liveDominion2Supplier, runDominion2Board, busyDominion2Cash,
} from '../server/dominion2.js';
import {
  buildLogos, runLogosSweep, ackLogosFlag, liveLogosPilot, busyLogosLearn, shipLogosLab,
} from '../server/logos.js';
import {
  buildPhoenix, runPhoenixSweep, ackPhoenixFlag, closePhoenixBackup, livePhoenixRunbook, closePhoenixDrill,
} from '../server/phoenix.js';
import {
  buildSerenity2, runSerenity2Sweep, ackSerenity2Flag, closeSerenity2Legacy, liveSerenity2Quiet, runSerenity2Pillow,
} from '../server/serenity2.js';
import {
  buildDailyBrief, runBriefSweep, ackBriefFlag, ackBriefIncidents, restockBriefInventory, closeBriefMaintenance,
} from '../server/brief.js';
import {
  buildWeatherBrief, refreshWeather, runWeatherSweep, ackWeatherFlag, opsRefreshWeather, setWeatherAdvisoryHold, ackWeatherExtreme,
} from '../server/weather.js';
import {
  maintenanceSummary, runMaintenanceSweep, ackMaintenanceFlag, closeCriticalMaintenance, escalateOverdueMaintenance, createPreventiveMaintenance,
} from '../server/maintenance.js';
import {
  inventorySummary, runInventorySweep, ackInventoryFlag, restockInventoryLows, quarantineInventorySku, receiveInventoryDelivery,
} from '../server/inventory.js';
import {
  trainingSummary, runTrainingSweep, ackTrainingFlag, startTrainingAttempt, completeTrainingAttempt, seedLowScoreTrainingAttempt,
} from '../server/training.js';
import {
  menuSummary, runMenuSweep, ackMenuFlag, markMenuItemUnavailable, repairMenuRecipeLinks, featureMenuItem,
} from '../server/menu.js';
import {
  seatingSummary, runSeatingSweep, ackSeatingFlag, seatWalkInParty, clearSeatingTable, reserveSeatingTable,
} from '../server/seating.js';
import {
  lostFoundSummary, runLostfoundSweep, ackLostfoundFlag, returnLostFoundItem, relocateLostFoundItem, seedAgingLostFoundItem,
} from '../server/lostfound.js';
import {
  waitlistSummary, runWaitlistSweep, ackWaitlistFlag, seatWaitlistEntry, abandonWaitlistEntry, seedAgingWaitlistEntry,
} from '../server/waitlist.js';
import {
  assetsSummary, runAssetsSweep, ackAssetsFlag, scheduleAssetMaintenance, bringAssetOnline, assignAssetOwner,
} from '../server/assets.js';
import {
  valetSummary, runValetSweep, ackValetFlag, requestValetPickup, deliverValetVehicle, seedLongParkedValetTicket,
} from '../server/valet.js';
import {
  cashSummary, runCashSweep, ackCashFlag, postCashEntry, flagCashImbalance, seedCashDailyClose,
} from '../server/cash.js';
import {
  coldchainSummary, runColdchainSweep, ackColdchainFlag, recordColdchainReading, flagColdchainBreach, seedColdchainProbe,
} from '../server/coldchain.js';
import {
  energySummary, runEnergySweep, ackEnergyFlag, recordEnergyReading, flagEnergySpike, seedEnergyMeter,
} from '../server/energy.js';
import {
  wasteSummary, runWasteSweep, ackWasteFlag, recordWasteLog, flagWasteOverage, seedWasteCategory,
} from '../server/waste.js';
import {
  announcementsSummary, runAnnouncementsSweep, ackAnnouncementsFlag, publishHighPriorityAnnouncements, archiveStaleAnnouncements, seedEndingSoonAnnouncement,
} from '../server/announcements.js';
import {
  suppliersSummary, runSuppliersSweep, ackSuppliersFlag, receiveSupplierPurchaseOrder, flagOverduePurchaseOrders, seedOpenPurchaseOrder,
} from '../server/suppliers.js';
import {
  recipesSummary, runRecipesSweep, ackRecipesFlag, cookRecipeOps, flagMissingRecipeStock, refreshRecipeCosts,
} from '../server/recipes.js';
import {
  campaignsSummary, runCampaignsSweep, ackCampaignsFlag, activateCampaignOps, expireCampaignOps, seedEndingSoonCampaign,
} from '../server/campaigns.js';
import {
  complaintsSummary, runComplaintsSweep, ackComplaintsFlag, escalateComplaintOps, resolveComplaintOps, seedAgingOpenComplaint,
} from '../server/complaints.js';
import {
  incidentsSummary, runIncidentsSweep, ackIncidentsFlag, ackOpenCriticalIncidents, resolveOpenIncidents, escalateIncidentSeverity,
} from '../server/incidents.js';
import {
  reservationsSummary, runReservationsSweep, ackReservationsFlag, confirmPendingReservations, cancelNoShowReservations, seatAssignReservations,
} from '../server/reservations.js';
import {
  shiftsSummary, runShiftsSweep, ackShiftsFlag, openCoverShiftGap, closeShiftOps, assignShiftStaff,
} from '../server/shifts.js';
import {
  checklistsSummary, runChecklistsSweep, ackChecklistsFlag, startChecklistOpsRun, completeChecklistOpsRun, failResetChecklistItem,
} from '../server/checklists.js';
import {
  alertrulesSummary, runAlertrulesSweep, ackAlertrulesFlag, enableAlertrules, disableAlertrules, fireAlertrules,
} from '../server/alertrules.js';
import {
  buildDigest, runDigestSweep, ackDigestFlag, refreshDigestReadiness, escalateDigestGap, resolveDigestGap,
} from '../server/digest.js';
import {
  buildOpsReport, runReportSweep, ackReportFlag, cancelReportJobs, ackReportEthos, snapshotReportAudit,
} from '../server/report.js';
import {
  buildMetrics, runMetricsSweep, ackMetricsFlag, snapshotMetrics, purgeFailedJobs, ackEthosFails,
} from '../server/metrics.js';
import {
  kudosSummary, runKudosSweep, ackKudosFlag, createThankYouBurst, refreshKudosTagFilter, seedDailyKudos,
} from '../server/kudos.js';
import {
  tipSummary, runTipsSweep, ackTipsFlag, addTipIn, addTipOut, tipBalanceSnapshot,
} from '../server/tips.js';
import {
  feedbackSummary, runFeedbackSweep, ackFeedbackFlag, seedNpsFeedback, flagLowScores, archiveFeedbackFlags,
} from '../server/feedback.js';
import {
  hoursSummary, runHoursSweep, ackHoursFlag, openVenueHours, closeVenueHours, applyHolidayNote,
} from '../server/hours.js';
import {
  consentSummary, runConsentSweep, ackConsentFlag, recordConsentOps, revokeConsent, seedMissingConsents,
} from '../server/consent.js';
import {
  guestsSummary, runGuestsSweep, ackGuestsFlag, upsertGuestOps, syncGuestsOps,
} from '../server/guests.js';
import {
  loyaltySummary, runLoyaltySweep, ackLoyaltyFlag, awardLoyaltyPoints, redeemLoyaltyPoints,
} from '../server/loyalty.js';
import {
  webhooksSummary, runWebhooksSweep, ackWebhooksFlag, seedWebhookHook, toggleWebhookActive, recordWebhookProbeDelivery,
} from '../server/webhooks.js';
import {
  documentsSummary, runDocumentsSweep, ackDocumentsFlag, reviseDocumentVersion, flagDocumentReview, seedPolicyDocument,
} from '../server/documents.js';
import {
  vendorScoreSummary, runVendorscoreSweep, ackVendorscoreFlag, reviewVendorScore, flagVendorUnderperformance, seedVendorScore,
} from '../server/vendorscore.js';
import {
  contractsSummary, runContractsSweep, ackContractsFlag, renewContractOps, signContractOps, seedRenewingContract,
} from '../server/contracts.js';
import {
  deliverySummary, runDeliverySweep, ackDeliveryFlag, markDeliveryDelivered, delayDeliveryEta, seedPendingDelivery,
} from '../server/delivery.js';
import {
  giftcardsSummary, runGiftcardsSweep, ackGiftcardsFlag, redeemGiftcardOps, topUpGiftcardOps, seedPromoGiftcard,
} from '../server/giftcards.js';
import {
  laundrySummary, runLaundrySweep, ackLaundryFlag, markLaundryReady, returnLaundryBatch, seedRushLaundryOrder,
} from '../server/laundry.js';
import {
  cleaningSummary, runCleaningSweep, ackCleaningFlag, markCleaningClean, failCleaningInspection, seedCleaningInspectionFail,
} from '../server/cleaning.js';
import {
  emergencySummary, runEmergencySweep, ackEmergencyFlag, acknowledgeEmergencyIncident, closeEmergencyIncident, seedEmergencyDrill,
} from '../server/emergency.js';
import {
  folioSummary, runFolioSweep, ackFolioFlag, postFolioCharge, settleFolioBalance, seedFolioDispute,
} from '../server/folio.js';
import {
  roomstatusSummary, runRoomstatusSweep, ackRoomstatusFlag, setRoomstatusReady, extendRoomstatusOoo, seedBlockedRoomstatus,
} from '../server/roomstatus.js';
import {
  minibarSummary, runMinibarSweep, ackMinibarFlag, restockDueMinibar, chargeMinibarFolio, seedEmptyMinibarFridge,
} from '../server/minibar.js';
import {
  transfersSummary, runTransfersSweep, ackTransfersFlag, delayTransferPickup, completeTransferRide, seedAirportTransferRun,
} from '../server/transfers.js';
import {
  conciergeSummary, runConciergeSweep, ackConciergeFlag, ageConciergeRequest, fulfillConciergeRequest, seedVipConciergeAsk,
} from '../server/concierge.js';
import {
  shuttleSummary, runShuttleSweep, ackShuttleFlag, markShuttleLateDeparture, boardShuttleGuests, seedShuttleRoute,
} from '../server/shuttle.js';
import {
  wifiSummary, runWifiSweep, ackWifiFlag, flagWifiCaptivePortalIssue, resetWifiAccessPoint, seedGuestWifiVoucher,
} from '../server/wifi.js';
import {
  kdsSummary, runKdsSweep, ackKdsFlag, ageKdsTicket, bumpKdsTicket, seedRushKdsTicket,
} from '../server/kds.js';
import {
  budgetSummary, runBudgetSweep, ackBudgetFlag, flagBudgetOverspendLine, approveBudgetAdjustment, seedForecastBudgetGap,
} from '../server/budget.js';
import {
  eventcalSummary, runEventcalSweep, ackEventcalFlag, flagEventcalConflict, publishEventcalEvent, seedHoldingEventcalEvent,
} from '../server/eventcal.js';
import {
  keycardsSummary, runKeycardsSweep, ackKeycardsFlag, expireKeycardAccess, reissueKeycard, seedLostKeycard,
} from '../server/keycards.js';
import {
  parcelsSummary, runParcelsSweep, ackParcelsFlag, ageParcelUndelivered, markParcelDelivered, seedFrontdeskParcelHold,
} from '../server/parcels.js';
import {
  wakeupsSummary, runWakeupsSweep, ackWakeupsFlag, markWakeupMissed, completeWakeupCall, seedVipWakeup,
} from '../server/wakeups.js';
import {
  upsellSummary, runUpsellSweep, ackUpsellFlag, ageUpsellPendingOffer, acceptUpsellOffer, seedLateCheckoutOffer,
} from '../server/upsell.js';
import {
  breakfastSummary, runBreakfastSweep, ackBreakfastFlag, markBreakfastNoShowCovers, seatBreakfastParty, seedBuffetRush,
} from '../server/breakfast.js';
import {
  banquetSummary, runBanquetSweep, ackBanquetFlag, markBanquetSetupOverdue, confirmBanquetEvent, seedBanquetTasting,
} from '../server/banquet.js';
import {
  beachbedsSummary, runBeachbedsSweep, ackBeachbedsFlag, markBeachbedUnpaid, checkInBeachbed, seedVipCabana,
} from '../server/beachbeds.js';
import {
  marinaSummary, runMarinaSweep, ackMarinaFlag, markMarinaBerthOverdue, clearMarinaSlip, seedMarinaArrival,
} from '../server/marina.js';
import {
  hammamSummary, runHammamSweep, ackHammamFlag, markHammamSlotOverrun, completeHammamSession, seedCouplesRitual,
} from '../server/hammam.js';
import {
  diveSummary, runDiveSweep, ackDiveFlag, markDiveCertExpired, checkInDive, seedBoatTrip,
} from '../server/dive.js';
import {
  meetingroomsSummary, runMeetingroomsSweep, ackMeetingroomsFlag, markMeetingroomsBookingOverrun, releaseMeetingroomRoom, seedBoardSetup,
} from '../server/meetingrooms.js';
import {
  retailSummary, runRetailSweep, ackRetailFlag, markRetailLowStockSku, restockRetailSku, seedFlashSale,
} from '../server/retail.js';
import {
  toursSummary, runToursSweep, ackToursFlag, markTourDepartureSoon, checkInTourGuest, seedSunsetTour,
} from '../server/tours.js';
import {
  privatechefSummary, runPrivatechefSweep, ackPrivatechefFlag, markPrivatechefMenuPending, confirmPrivatechefBooking, seedTastingMenu,
} from '../server/privatechef.js';
import {
  qrcheckinSummary, runQrcheckinSweep, ackQrcheckinFlag, markQrcheckinInvalidScanSpike, admitQrcheckinGuest, seedVipQr,
} from '../server/qrcheckin.js';
import {
  patrolSummary, runPatrolSweep, ackPatrolFlag, markPatrolMissedCheckpoint, completePatrolRound, seedNightRoute,
} from '../server/patrol.js';
import {
  venuesSummary, runVenuesSweep, ackVenuesFlag, markVenueInactive, activateVenue, seedSeasonalVenue,
} from '../server/venues.js';
import {
  spaSummary, runSpaSweep, ackSpaFlag, markSpaAppointmentOverrun, completeSpaTreatment, seedCouplesPackage,
} from '../server/spa.js';
import {
  contentSummary, runContentSweep, ackContentFlag, markContentStaleDraft, publishContentItem, seedCampaignPost,
} from '../server/content.js';
import {
  musicSummary, runMusicSweep, ackMusicFlag, markMusicZoneSilence, setMusicPlaylist, seedSunsetMix,
} from '../server/music.js';
import {
  passstockSummary, runPassstockSweep, ackPassstockFlag, markPassstockLowWristbandStock, restockPassstock, seedEventBatch,
} from '../server/passstock.js';
import {
  pulseSummary, runPulseSweep, ackPulseFlag, markPulseStaleSignal, refreshPulseChannel, seedCampusBeat,
} from '../server/pulse.js';
import {
  amenitiesSummary, runAmenitiesSweep, ackAmenitiesFlag, markAmenitiesRequestBacklog, fulfillAmenitiesRequest, seedPillowMenu,
} from '../server/amenities.js';
import {
  haccpSummary, runHaccpSweep, ackHaccpFlag, markHaccpTempBreach, logHaccpCorrective, seedProbeCheck,
} from '../server/haccp.js';
import {
  lateoutSummary, runLateoutSweep, ackLateoutFlag, markLateoutUnpaidFee, approveLateoutExtension, seedVipLateOut,
} from '../server/lateout.js';
import {
  lockersSummary, runLockersSweep, ackLockersFlag, markLockersOverdueRental, releaseLocker, seedLockerDayPass,
} from '../server/lockers.js';
import {
  towelsSummary, runTowelsSweep, ackTowelsFlag, markTowelsShortageZone, restockTowels, seedPoolRush,
} from '../server/towels.js';
import {
  kidsclubSummary, runKidsclubSweep, ackKidsclubFlag, markKidsclubUncheckedChild, checkInKidsclubChild, seedKidsclubActivitySlot,
} from '../server/kidsclub.js';

import {
  buildExportsHub, runExportsSweep, ackExportsFlag, runExportsSnapshot, exportAllCatalog, clearExportsRuns, buildExport,
} from '../server/exports.js';
import {
  listCrudDomains,
  crudopsOverview,
  runCrudDomainSweep,
  advanceCrudDomain,
  healCrudDomain,
  seedCrudDomain,
  ackCrudDomainFlag,
  isCrudOpsPath,
} from '../server/crudops.js';

import {
  buildBeacon, runBeaconSweep, ackBeaconFlag, liveBeaconCamp, fixBeaconSocial, healBeaconSeo,
} from '../server/beacon.js';
import {
  buildChronos, runChronosSweep, ackChronosFlag, busyChronosMoment, closeChronosHook, liveChronosSchema,
} from '../server/chronos.js';
import {
  buildCircuit, runCircuitSweep, ackCircuitFlag, busyCircuitMoment, closeCircuitHook, liveCircuitSchema,
} from '../server/circuit.js';
import {
  buildCrown, runCrownSweep, ackCrownFlag, houseCrownVip, closeCrownCase, liveCrownWinback,
} from '../server/crown.js';
import {
  buildDominion, runDominionSweep, ackDominionFlag, liveDominionSupplier, runDominionBoard, busyDominionCash,
} from '../server/dominion.js';
import {
  buildFrontier, runFrontierSweep, ackFrontierFlag, runFrontierRestore, busyFrontierSite, liveFrontierHire,
} from '../server/frontier.js';
import {
  buildGaia, runGaiaSweep, ackGaiaFlag, closeGaiaLegacy, liveGaiaQuiet, runGaiaPillow,
} from '../server/gaia.js';
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
assert(runStayringSweep({ force: true }, 'smoke').ok, 'stayring sweep');
assert(ackStayringFlag({}, 'smoke').ok, 'stayring flag ack');

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
assert(runCulturesceneSweep({ force: true }, 'smoke').ok, 'culturescene sweep');
assert(ackCulturesceneFlag({}, 'smoke').ok, 'culturescene flag ack');

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
assert(runAgentfleetSweep({ force: true }, 'smoke').ok, 'agentfleet sweep');
assert(ackAgentfleetFlag({}, 'smoke').ok, 'agentfleet flag ack');
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

assert(buildOdyssey().title, 'odyssey overview');
assert(runOdysseySweep({ force: true }, 'smoke').ok, 'odyssey sweep');
assert(recoverOdysseyOkr({}, 'smoke').ok, 'odyssey okr recover');
assert(coolOdysseyRisk({}, 'smoke').ok, 'odyssey risk cool');
assert(hitOdysseyStar({}, 'smoke').ok, 'odyssey star hit');
assert(ackOdysseyFlag({}, 'smoke').ok, 'odyssey flag ack');

assert(buildSignalhub().title, 'signalhub overview');
assert(runSignalhubSweep({ force: true }, 'smoke').ok, 'signalhub sweep');
assert(clearSignalhubWater({}, 'smoke').ok, 'signalhub water clear');
assert(clearSignalhubChem({}, 'smoke').ok, 'signalhub chem clear');
assert(clearSignalhubGate({}, 'smoke').ok, 'signalhub gate clear');
assert(ackSignalhubFlag({}, 'smoke').ok, 'signalhub flag ack');

assert(buildLinen().title, 'linen overview');
assert(runLinenSweep({ force: true }, 'smoke').ok, 'linen sweep');
assert(passLinenInspect({}, 'smoke').ok, 'linen inspect pass');
assert(releaseLinenOoo({}, 'smoke').ok, 'linen ooo release');
assert(completeLinenHk({}, 'smoke').ok, 'linen hk complete');
assert(ackLinenFlag({}, 'smoke').ok, 'linen flag ack');

assert(buildCharter2().title, 'charter2 overview');
assert(runCharter2Sweep({ force: true }, 'smoke').ok, 'charter2 sweep');
assert(closeCharter2Ethics({}, 'smoke').ok, 'charter2 ethics close');
assert(liveCharter2Risk({}, 'smoke').ok, 'charter2 risk live');
assert(doneCharter2Claim({}, 'smoke').ok, 'charter2 claim done');
assert(ackCharter2Flag({}, 'smoke').ok, 'charter2 flag ack');

assert(buildZenith().title, 'zenith overview');
assert(runZenithSweep({ force: true }, 'smoke').ok, 'zenith sweep');
assert(catchZenithPace({}, 'smoke').ok, 'zenith pace catch');
assert(healZenithMargin({}, 'smoke').ok, 'zenith margin heal');
assert(coolZenithDemand({}, 'smoke').ok, 'zenith demand cool');
assert(ackZenithFlag({}, 'smoke').ok, 'zenith flag ack');

assert(buildPyramid().title, 'pyramid overview');
assert(runPyramidSweep({ force: true }, 'smoke').ok, 'pyramid sweep');
assert(resolvePyramidSys({}, 'smoke').ok, 'pyramid sys resolve');
assert(healPyramidNet({}, 'smoke').ok, 'pyramid net heal');
assert(flushPyramidComms({}, 'smoke').ok, 'pyramid comms flush');
assert(ackPyramidFlag({}, 'smoke').ok, 'pyramid flag ack');

assert(buildConvoy().title, 'convoy overview');
assert(runConvoySweep({ force: true }, 'smoke').ok, 'convoy sweep');
assert(clearConvoyDispatch({}, 'smoke').ok, 'convoy dispatch clear');
assert(readyConvoyFleet({}, 'smoke').ok, 'convoy fleet ready');
assert(freeConvoyCurb({}, 'smoke').ok, 'convoy curb free');
assert(ackConvoyFlag({}, 'smoke').ok, 'convoy flag ack');

assert(buildCrucible2().title, 'crucible2 overview');
assert(runCrucible2Sweep({ force: true }, 'smoke').ok, 'crucible2 sweep');
assert(liveCrucible2Pilot({}, 'smoke').ok, 'crucible2 pilot live');
assert(busyCrucible2Learn({}, 'smoke').ok, 'crucible2 learn busy');
assert(shipCrucible2Lab({}, 'smoke').ok, 'crucible2 lab ship');
assert(ackCrucible2Flag({}, 'smoke').ok, 'crucible2 flag ack');

assert(buildAgora().title, 'agora overview');
assert(runAgoraSweep({ force: true }, 'smoke').ok, 'agora sweep');
assert(runAgoraDrill({}, 'smoke').ok, 'agora drill run');
assert(busyAgoraCircle({}, 'smoke').ok, 'agora circle busy');
assert(liveAgoraBadge({}, 'smoke').ok, 'agora badge live');
assert(ackAgoraFlag({}, 'smoke').ok, 'agora flag ack');

assert(buildBeacon().title, 'beacon overview');
assert(runBeaconSweep({ force: true }, 'smoke').ok, 'beacon sweep');
assert(liveBeaconCamp({}, 'smoke').ok, 'beacon camp live');
assert(fixBeaconSocial({}, 'smoke').ok, 'beacon social fix');
assert(healBeaconSeo({}, 'smoke').ok, 'beacon seo heal');
assert(ackBeaconFlag({}, 'smoke').ok, 'beacon flag ack');

assert(buildChronos().title, 'chronos overview');
assert(runChronosSweep({ force: true }, 'smoke').ok, 'chronos sweep');
assert(busyChronosMoment({}, 'smoke').ok, 'chronos moment busy');
assert(closeChronosHook({}, 'smoke').ok, 'chronos hook close');
assert(liveChronosSchema({}, 'smoke').ok, 'chronos schema live');
assert(ackChronosFlag({}, 'smoke').ok, 'chronos flag ack');

assert(buildCircuit().title, 'circuit overview');
assert(runCircuitSweep({ force: true }, 'smoke').ok, 'circuit sweep');
assert(busyCircuitMoment({}, 'smoke').ok, 'circuit moment busy');
assert(closeCircuitHook({}, 'smoke').ok, 'circuit hook close');
assert(liveCircuitSchema({}, 'smoke').ok, 'circuit schema live');
assert(ackCircuitFlag({}, 'smoke').ok, 'circuit flag ack');

assert(buildCrown().title, 'crown overview');
assert(runCrownSweep({ force: true }, 'smoke').ok, 'crown sweep');
assert(houseCrownVip({}, 'smoke').ok, 'crown vip house');
assert(closeCrownCase({}, 'smoke').ok, 'crown case close');
assert(liveCrownWinback({}, 'smoke').ok, 'crown winback live');
assert(ackCrownFlag({}, 'smoke').ok, 'crown flag ack');

assert(buildDominion().title, 'dominion overview');
assert(runDominionSweep({ force: true }, 'smoke').ok, 'dominion sweep');
assert(liveDominionSupplier({}, 'smoke').ok, 'dominion supplier live');
assert(runDominionBoard({}, 'smoke').ok, 'dominion board run');
assert(busyDominionCash({}, 'smoke').ok, 'dominion cash busy');
assert(ackDominionFlag({}, 'smoke').ok, 'dominion flag ack');

assert(buildFrontier().title, 'frontier overview');
assert(runFrontierSweep({ force: true }, 'smoke').ok, 'frontier sweep');
assert(runFrontierRestore({}, 'smoke').ok, 'frontier restore run');
assert(busyFrontierSite({}, 'smoke').ok, 'frontier site busy');
assert(liveFrontierHire({}, 'smoke').ok, 'frontier hire live');
assert(ackFrontierFlag({}, 'smoke').ok, 'frontier flag ack');

assert(buildGaia().title, 'gaia overview');
assert(runGaiaSweep({ force: true }, 'smoke').ok, 'gaia sweep');
assert(closeGaiaLegacy({}, 'smoke').ok, 'gaia legacy close');
assert(liveGaiaQuiet({}, 'smoke').ok, 'gaia quiet live');
assert(runGaiaPillow({}, 'smoke').ok, 'gaia pillow run');
assert(ackGaiaFlag({}, 'smoke').ok, 'gaia flag ack');

assert(buildHelios().title, 'helios overview');
assert(runHeliosSweep({ force: true }, 'smoke').ok, 'helios sweep');
assert(runHeliosInbound({}, 'smoke').ok, 'helios inbound run');
assert(busyHeliosAsn({}, 'smoke').ok, 'helios asn busy');
assert(liveHeliosSlot({}, 'smoke').ok, 'helios slot live');
assert(ackHeliosFlag({}, 'smoke').ok, 'helios flag ack');

assert(buildKairos().title, 'kairos overview');
assert(runKairosSweep({ force: true }, 'smoke').ok, 'kairos sweep');
assert(runKairosDrill({}, 'smoke').ok, 'kairos drill run');
assert(busyKairosCircle({}, 'smoke').ok, 'kairos circle busy');
assert(liveKairosBadge({}, 'smoke').ok, 'kairos badge live');
assert(ackKairosFlag({}, 'smoke').ok, 'kairos flag ack');

assert(buildKeystone().title, 'keystone overview');
assert(runKeystoneSweep({ force: true }, 'smoke').ok, 'keystone sweep');
assert(clearKeystoneBus({}, 'smoke').ok, 'keystone bus clear');
assert(healKeystoneSlo({}, 'smoke').ok, 'keystone slo heal');
assert(closeKeystoneEsc({}, 'smoke').ok, 'keystone esc close');
assert(ackKeystoneFlag({}, 'smoke').ok, 'keystone flag ack');

assert(buildLattice().title, 'lattice overview');
assert(runLatticeSweep({ force: true }, 'smoke').ok, 'lattice sweep');
assert(healLatticeGate({}, 'smoke').ok, 'lattice gate heal');
assert(retryLatticeOta({}, 'smoke').ok, 'lattice ota retry');
assert(clearLatticeFailback({}, 'smoke').ok, 'lattice failback clear');
assert(ackLatticeFlag({}, 'smoke').ok, 'lattice flag ack');

assert(buildMirror().title, 'mirror overview');
assert(runMirrorSweep({ force: true }, 'smoke').ok, 'mirror sweep');
assert(refreshMirrorTwin({}, 'smoke').ok, 'mirror twin refresh');
assert(acceptMirrorNba({}, 'smoke').ok, 'mirror nba accept');
assert(closeMirrorRecovery({}, 'smoke').ok, 'mirror recovery close');
assert(ackMirrorFlag({}, 'smoke').ok, 'mirror flag ack');

assert(buildMonument().title, 'monument overview');
assert(runMonumentSweep({ force: true }, 'smoke').ok, 'monument sweep');
assert(closeMonumentCorrective({}, 'smoke').ok, 'monument corrective close');
assert(liveMonumentOral({}, 'smoke').ok, 'monument oral live');
assert(runMonumentTimeline({}, 'smoke').ok, 'monument timeline run');
assert(ackMonumentFlag({}, 'smoke').ok, 'monument flag ack');

assert(buildOlympus().title, 'olympus overview');
assert(runOlympusSweep({ force: true }, 'smoke').ok, 'olympus sweep');
assert(closeOlympusSeal({}, 'smoke').ok, 'olympus seal close');
assert(liveOlympusBrief({}, 'smoke').ok, 'olympus brief live');
assert(busyOlympusStory({}, 'smoke').ok, 'olympus story busy');
assert(ackOlympusFlag({}, 'smoke').ok, 'olympus flag ack');

assert(buildPathos().title, 'pathos overview');
assert(runPathosSweep({ force: true }, 'smoke').ok, 'pathos sweep');
assert(closePathosIp({}, 'smoke').ok, 'pathos ip close');
assert(livePathosRisk({}, 'smoke').ok, 'pathos risk live');
assert(runPathosClaim({}, 'smoke').ok, 'pathos claim run');
assert(ackPathosFlag({}, 'smoke').ok, 'pathos flag ack');

assert(buildPrism().title, 'prism overview');
assert(runPrismSweep({ force: true }, 'smoke').ok, 'prism sweep');
assert(closePrismMark({}, 'smoke').ok, 'prism mark close');
assert(livePrismPost({}, 'smoke').ok, 'prism post live');
assert(runPrismDefect({}, 'smoke').ok, 'prism defect run');
assert(ackPrismFlag({}, 'smoke').ok, 'prism flag ack');

assert(buildSelene().title, 'selene overview');
assert(runSeleneSweep({ force: true }, 'smoke').ok, 'selene sweep');
assert(closeSeleneHeat({}, 'smoke').ok, 'selene heat close');
assert(liveSeleneSupplier({}, 'smoke').ok, 'selene supplier live');
assert(runSeleneBoard({}, 'smoke').ok, 'selene board run');
assert(ackSeleneFlag({}, 'smoke').ok, 'selene flag ack');

assert(buildSerenity().title, 'serenity overview');
assert(runSerenitySweep({ force: true }, 'smoke').ok, 'serenity sweep');
assert(closeSerenityLegacy({}, 'smoke').ok, 'serenity legacy close');
assert(liveSerenityQuiet({}, 'smoke').ok, 'serenity quiet live');
assert(runSerenityPillow({}, 'smoke').ok, 'serenity pillow run');
assert(ackSerenityFlag({}, 'smoke').ok, 'serenity flag ack');

assert(buildVault().title, 'vault overview');
assert(runVaultSweep({ force: true }, 'smoke').ok, 'vault sweep');
assert(healVaultTreasury({}, 'smoke').ok, 'vault treasury heal');
assert(closeVaultAp({}, 'smoke').ok, 'vault ap close');
assert(clearVaultRecon({}, 'smoke').ok, 'vault recon clear');
assert(ackVaultFlag({}, 'smoke').ok, 'vault flag ack');

assert(buildAlliance2().title, 'alliance2 overview');
assert(runAlliance2Sweep({ force: true }, 'smoke').ok, 'alliance2 sweep');
assert(busyAlliance2Partner({}, 'smoke').ok, 'alliance2 partner busy');
assert(closeAlliance2Channel({}, 'smoke').ok, 'alliance2 channel close');
assert(liveAlliance2Invest({}, 'smoke').ok, 'alliance2 invest live');
assert(ackAlliance2Flag({}, 'smoke').ok, 'alliance2 flag ack');

assert(buildArtery().title, 'artery overview');
assert(runArterySweep({ force: true }, 'smoke').ok, 'artery sweep');
assert(runArteryInbound({}, 'smoke').ok, 'artery inbound run');
assert(busyArteryAsn({}, 'smoke').ok, 'artery asn busy');
assert(closeArteryDock({}, 'smoke').ok, 'artery dock close');
assert(ackArteryFlag({}, 'smoke').ok, 'artery flag ack');

assert(buildBastion2().title, 'bastion2 overview');
assert(runBastion2Sweep({ force: true }, 'smoke').ok, 'bastion2 sweep');
assert(closeBastion2Access({}, 'smoke').ok, 'bastion2 access close');
assert(approveBastion2Role({}, 'smoke').ok, 'bastion2 role approve');
assert(archiveBastion2Breach({}, 'smoke').ok, 'bastion2 breach archive');
assert(ackBastion2Flag({}, 'smoke').ok, 'bastion2 flag ack');

assert(buildAgora2().title, 'agora2 overview');
assert(runAgora2Sweep({ force: true }, 'smoke').ok, 'agora2 sweep');
assert(runAgora2Drill({}, 'smoke').ok, 'agora2 drill run');
assert(busyAgora2Circle({}, 'smoke').ok, 'agora2 circle busy');
assert(liveAgora2Badge({}, 'smoke').ok, 'agora2 badge live');
assert(ackAgora2Flag({}, 'smoke').ok, 'agora2 flag ack');

assert(buildAlliance3().title, 'alliance3 overview');
assert(runAlliance3Sweep({ force: true }, 'smoke').ok, 'alliance3 sweep');
assert(busyAlliance3Partner({}, 'smoke').ok, 'alliance3 partner busy');
assert(closeAlliance3Channel({}, 'smoke').ok, 'alliance3 channel close');
assert(liveAlliance3Invest({}, 'smoke').ok, 'alliance3 invest live');
assert(ackAlliance3Flag({}, 'smoke').ok, 'alliance3 flag ack');

assert(buildArtery2().title, 'artery2 overview');
assert(runArtery2Sweep({ force: true }, 'smoke').ok, 'artery2 sweep');
assert(runArtery2Inbound({}, 'smoke').ok, 'artery2 inbound run');
assert(busyArtery2Asn({}, 'smoke').ok, 'artery2 asn busy');
assert(closeArtery2Dock({}, 'smoke').ok, 'artery2 dock close');
assert(ackArtery2Flag({}, 'smoke').ok, 'artery2 flag ack');

assert(buildCircuit2().title, 'circuit2 overview');
assert(runCircuit2Sweep({ force: true }, 'smoke').ok, 'circuit2 sweep');
assert(busyCircuit2Moment({}, 'smoke').ok, 'circuit2 moment busy');
assert(closeCircuit2Hook({}, 'smoke').ok, 'circuit2 hook close');
assert(liveCircuit2Schema({}, 'smoke').ok, 'circuit2 schema live');
assert(ackCircuit2Flag({}, 'smoke').ok, 'circuit2 flag ack');

assert(buildCrucible().title, 'crucible overview');
assert(runCrucibleSweep({ force: true }, 'smoke').ok, 'crucible sweep');
assert(liveCruciblePilot({}, 'smoke').ok, 'crucible pilot live');
assert(busyCrucibleLearn({}, 'smoke').ok, 'crucible learn busy');
assert(shipCrucibleLab({}, 'smoke').ok, 'crucible lab ship');
assert(ackCrucibleFlag({}, 'smoke').ok, 'crucible flag ack');

assert(buildApotheosis().title, 'apotheosis overview');
assert(runApotheosisSweep({ force: true }, 'smoke').ok, 'apotheosis sweep');
assert(closeApotheosisBackup({}, 'smoke').ok, 'apotheosis backup close');
assert(liveApotheosisRunbook({}, 'smoke').ok, 'apotheosis runbook live');
assert(closeApotheosisDrill({}, 'smoke').ok, 'apotheosis drill close');
assert(ackApotheosisFlag({}, 'smoke').ok, 'apotheosis flag ack');

assert(buildCharter().title, 'charter overview');
assert(runCharterSweep({ force: true }, 'smoke').ok, 'charter sweep');
assert(closeCharterEthics({}, 'smoke').ok, 'charter ethics close');
assert(liveCharterRisk({}, 'smoke').ok, 'charter risk live');
assert(doneCharterClaim({}, 'smoke').ok, 'charter claim done');
assert(ackCharterFlag({}, 'smoke').ok, 'charter flag ack');

assert(buildDominion2().title, 'dominion2 overview');
assert(runDominion2Sweep({ force: true }, 'smoke').ok, 'dominion2 sweep');
assert(liveDominion2Supplier({}, 'smoke').ok, 'dominion2 supplier live');
assert(runDominion2Board({}, 'smoke').ok, 'dominion2 board run');
assert(busyDominion2Cash({}, 'smoke').ok, 'dominion2 cash busy');
assert(ackDominion2Flag({}, 'smoke').ok, 'dominion2 flag ack');

assert(buildLogos().title, 'logos overview');
assert(runLogosSweep({ force: true }, 'smoke').ok, 'logos sweep');
assert(liveLogosPilot({}, 'smoke').ok, 'logos pilot live');
assert(busyLogosLearn({}, 'smoke').ok, 'logos learn busy');
assert(shipLogosLab({}, 'smoke').ok, 'logos lab ship');
assert(ackLogosFlag({}, 'smoke').ok, 'logos flag ack');

assert(buildPhoenix().title, 'phoenix overview');
assert(runPhoenixSweep({ force: true }, 'smoke').ok, 'phoenix sweep');
assert(closePhoenixBackup({}, 'smoke').ok, 'phoenix backup close');
assert(livePhoenixRunbook({}, 'smoke').ok, 'phoenix runbook live');
assert(closePhoenixDrill({}, 'smoke').ok, 'phoenix drill close');
assert(ackPhoenixFlag({}, 'smoke').ok, 'phoenix flag ack');

assert(buildSerenity2().title, 'serenity2 overview');
assert(runSerenity2Sweep({ force: true }, 'smoke').ok, 'serenity2 sweep');
assert(closeSerenity2Legacy({}, 'smoke').ok, 'serenity2 legacy close');
assert(liveSerenity2Quiet({}, 'smoke').ok, 'serenity2 quiet live');
assert(runSerenity2Pillow({}, 'smoke').ok, 'serenity2 pillow run');
assert(ackSerenity2Flag({}, 'smoke').ok, 'serenity2 flag ack');

assert(buildDailyBrief().title, 'brief overview');
assert(runBriefSweep({ force: true }, 'smoke').ok, 'brief sweep');
assert(ackBriefIncidents({}, 'smoke').ok, 'brief incidents ack');
assert(restockBriefInventory({}, 'smoke').ok, 'brief inventory restock');
assert(closeBriefMaintenance({}, 'smoke').ok, 'brief maintenance close');
assert(ackBriefFlag({}, 'smoke').ok, 'brief flag ack');

assert(buildWeatherBrief().title, 'weather overview');
assert(runWeatherSweep({ force: true }, 'smoke').ok, 'weather sweep');
assert(opsRefreshWeather({}, 'smoke').ok, 'weather ops refresh');
assert(setWeatherAdvisoryHold({ hold: true }, 'smoke').ok, 'weather advisory hold');
assert(setWeatherAdvisoryHold({ clear: true }, 'smoke').ok, 'weather advisory clear');
assert(ackWeatherExtreme({ tip: 'smoke tip' }, 'smoke').ok, 'weather extreme ack');
assert(ackWeatherFlag({}, 'smoke').ok, 'weather flag ack');
assert(refreshWeather('smoke').label, 'weather refresh legacy');

assert(maintenanceSummary().title, 'maintenance overview');
assert(runMaintenanceSweep({ force: true }, 'smoke').ok, 'maintenance sweep');
assert(closeCriticalMaintenance({}, 'smoke').ok, 'maintenance critical close');
assert(escalateOverdueMaintenance({}, 'smoke').ok, 'maintenance overdue escalate');
assert(createPreventiveMaintenance({}, 'smoke').ok, 'maintenance preventive create');
assert(ackMaintenanceFlag({}, 'smoke').ok, 'maintenance flag ack');

assert(inventorySummary().title, 'inventory overview');
assert(runInventorySweep({ force: true }, 'smoke').ok, 'inventory sweep');
assert(restockInventoryLows({}, 'smoke').ok, 'inventory restock lows');
assert(quarantineInventorySku({}, 'smoke').ok, 'inventory quarantine');
assert(receiveInventoryDelivery({}, 'smoke').ok, 'inventory receive delivery');
assert(ackInventoryFlag({}, 'smoke').ok, 'inventory flag ack');

assert(suppliersSummary().title, 'suppliers overview');
assert(runSuppliersSweep({ force: true }, 'smoke').ok, 'suppliers sweep');
assert(seedOpenPurchaseOrder({ overdue: true }, 'smoke').ok, 'suppliers seed open po');
assert(flagOverduePurchaseOrders({}, 'smoke').ok, 'suppliers overdue flag');
assert(receiveSupplierPurchaseOrder({}, 'smoke').ok, 'suppliers receive po');
assert(ackSuppliersFlag({}, 'smoke').ok, 'suppliers flag ack');

assert(recipesSummary().title, 'recipes overview');
assert(runRecipesSweep({ force: true }, 'smoke').ok, 'recipes sweep');
assert(cookRecipeOps({ portions: 1 }, 'smoke').ok, 'recipes cook ops');
assert(flagMissingRecipeStock({}, 'smoke').ok, 'recipes missing stock flag');
assert(refreshRecipeCosts({}, 'smoke').ok, 'recipes cost refresh');
assert(ackRecipesFlag({}, 'smoke').ok, 'recipes flag ack');

assert(campaignsSummary().title, 'campaigns overview');
assert(runCampaignsSweep({ force: true }, 'smoke').ok, 'campaigns sweep');
assert(seedEndingSoonCampaign({}, 'smoke').ok, 'campaigns ending soon seed');
assert(activateCampaignOps({}, 'smoke').ok, 'campaigns activate');
assert(expireCampaignOps({}, 'smoke').ok, 'campaigns expire');
assert(ackCampaignsFlag({}, 'smoke').ok, 'campaigns flag ack');

assert(complaintsSummary().title, 'complaints overview');
assert(runComplaintsSweep({ force: true }, 'smoke').ok, 'complaints sweep');
assert(seedAgingOpenComplaint({}, 'smoke').ok, 'complaints aging seed');
assert(escalateComplaintOps({}, 'smoke').ok, 'complaints escalate');
assert(resolveComplaintOps({}, 'smoke').ok, 'complaints resolve');
assert(ackComplaintsFlag({}, 'smoke').ok, 'complaints flag ack');

assert(trainingSummary().title, 'training overview');
assert(runTrainingSweep({ force: true }, 'smoke').ok, 'training sweep');
assert(startTrainingAttempt({ stale: true }, 'smoke').ok, 'training start stale');
assert(completeTrainingAttempt({}, 'smoke').ok, 'training complete attempt');
assert(seedLowScoreTrainingAttempt({}, 'smoke').ok, 'training low score seed');
assert(ackTrainingFlag({}, 'smoke').ok, 'training flag ack');

assert(menuSummary().title, 'menu overview');
assert(runMenuSweep({ force: true }, 'smoke').ok, 'menu sweep');
assert(markMenuItemUnavailable({}, 'smoke').ok, 'menu mark unavailable');
assert(repairMenuRecipeLinks({}, 'smoke').ok, 'menu repair recipe links');
assert(featureMenuItem({}, 'smoke').ok, 'menu feature item');
assert(ackMenuFlag({}, 'smoke').ok, 'menu flag ack');

assert(seatingSummary().title, 'seating overview');
assert(runSeatingSweep({ force: true }, 'smoke').ok, 'seating sweep');
assert(seatWalkInParty({ hours: 4 }, 'smoke').ok, 'seating walk-in');
assert(clearSeatingTable({}, 'smoke').ok, 'seating clear');
assert(reserveSeatingTable({}, 'smoke').ok, 'seating reserve');
assert(ackSeatingFlag({}, 'smoke').ok, 'seating flag ack');

assert(announcementsSummary().title, 'announcements overview');
assert(runAnnouncementsSweep({ force: true }, 'smoke').ok, 'announcements sweep');
assert(publishHighPriorityAnnouncements({}, 'smoke').ok, 'announcements publish high');
assert(archiveStaleAnnouncements({}, 'smoke').ok, 'announcements archive stale');
assert(seedEndingSoonAnnouncement({}, 'smoke').ok, 'announcements ending soon seed');
assert(ackAnnouncementsFlag({}, 'smoke').ok, 'announcements flag ack');

assert(lostFoundSummary().title, 'lostfound overview');
assert(runLostfoundSweep({ force: true }, 'smoke').ok, 'lostfound sweep');
assert(seedAgingLostFoundItem({ missingLocation: true }, 'smoke').ok, 'lostfound aging seed');
assert(relocateLostFoundItem({}, 'smoke').ok, 'lostfound relocate');
assert(returnLostFoundItem({ claimant: 'Smoke Claimant' }, 'smoke').ok, 'lostfound return');
assert(ackLostfoundFlag({}, 'smoke').ok, 'lostfound flag ack');

assert(waitlistSummary().title, 'waitlist overview');
assert(runWaitlistSweep({ force: true }, 'smoke').ok, 'waitlist sweep');
assert(seedAgingWaitlistEntry({}, 'smoke').ok, 'waitlist aging seed');
assert(seatWaitlistEntry({ tableId: 'tbl_smoke' }, 'smoke').ok, 'waitlist seat');
assert(abandonWaitlistEntry({}, 'smoke').ok, 'waitlist abandon');
assert(ackWaitlistFlag({}, 'smoke').ok, 'waitlist flag ack');

assert(assetsSummary().title, 'assets overview');
assert(runAssetsSweep({ force: true }, 'smoke').ok, 'assets sweep');
assert(scheduleAssetMaintenance({ assignee: 'HEPHAESTUS' }, 'smoke').ok, 'assets maintenance schedule');
assert(bringAssetOnline({}, 'smoke').ok, 'assets bring online');
assert(assignAssetOwner({ assignee: 'Ops owner' }, 'smoke').ok, 'assets assign owner');
assert(ackAssetsFlag({}, 'smoke').ok, 'assets flag ack');

assert(valetSummary().title, 'valet overview');
assert(runValetSweep({ force: true }, 'smoke').ok, 'valet sweep');
assert(seedLongParkedValetTicket({}, 'smoke').ok, 'valet long parked seed');
assert(requestValetPickup({ minutes: 20 }, 'smoke').ok, 'valet pickup request');
assert(deliverValetVehicle({}, 'smoke').ok, 'valet deliver');
assert(ackValetFlag({}, 'smoke').ok, 'valet flag ack');

assert(cashSummary().title, 'cash overview');
assert(runCashSweep({ force: true }, 'smoke').ok, 'cash sweep');
assert(postCashEntry({ amount: 250, kind: 'in' }, 'smoke').ok, 'cash post entry');
assert(flagCashImbalance({ varianceTry: 125 }, 'smoke').ok, 'cash flag imbalance');
assert(seedCashDailyClose({ varianceTry: 125 }, 'smoke').ok, 'cash daily close seed');
assert(ackCashFlag({}, 'smoke').ok, 'cash flag ack');

assert(coldchainSummary().title, 'coldchain overview');
assert(runColdchainSweep({ force: true }, 'smoke').ok, 'coldchain sweep');
assert(recordColdchainReading({}, 'smoke').ok, 'coldchain reading');
assert(flagColdchainBreach({}, 'smoke').ok, 'coldchain flag breach');
assert(seedColdchainProbe({}, 'smoke').ok, 'coldchain probe seed');
assert(ackColdchainFlag({}, 'smoke').ok, 'coldchain flag ack');

assert(energySummary().title, 'energy overview');
assert(runEnergySweep({ force: true }, 'smoke').ok, 'energy sweep');
assert(recordEnergyReading({ value: 100 }, 'smoke').ok, 'energy reading');
assert(flagEnergySpike({}, 'smoke').ok, 'energy flag spike');
assert(seedEnergyMeter({}, 'smoke').ok, 'energy meter seed');
assert(ackEnergyFlag({}, 'smoke').ok, 'energy flag ack');

assert(wasteSummary().title, 'waste overview');
assert(runWasteSweep({ force: true }, 'smoke').ok, 'waste sweep');
assert(recordWasteLog({}, 'smoke').ok, 'waste log');
assert(flagWasteOverage({}, 'smoke').ok, 'waste flag overage');
assert(seedWasteCategory({}, 'smoke').ok, 'waste category seed');
assert(ackWasteFlag({}, 'smoke').ok, 'waste flag ack');

assert(incidentsSummary().title, 'incidents overview');
assert(runIncidentsSweep({ force: true }, 'smoke').ok, 'incidents sweep');
assert(ackOpenCriticalIncidents({}, 'smoke').ok, 'incidents ack critical');
assert(resolveOpenIncidents({}, 'smoke').ok, 'incidents resolve open');
assert(escalateIncidentSeverity({}, 'smoke').ok, 'incidents escalate');
assert(ackIncidentsFlag({}, 'smoke').ok, 'incidents flag ack');

assert(reservationsSummary().title, 'reservations overview');
assert(runReservationsSweep({ force: true }, 'smoke').ok, 'reservations sweep');
assert(confirmPendingReservations({}, 'smoke').ok, 'reservations confirm pending');
assert(cancelNoShowReservations({}, 'smoke').ok, 'reservations cancel noshow');
assert(seatAssignReservations({}, 'smoke').ok, 'reservations seat assign');
assert(ackReservationsFlag({}, 'smoke').ok, 'reservations flag ack');

assert(shiftsSummary().title, 'shifts overview');
assert(runShiftsSweep({ force: true }, 'smoke').ok, 'shifts sweep');
assert(openCoverShiftGap({}, 'smoke').ok, 'shifts cover gap');
assert(closeShiftOps({}, 'smoke').ok, 'shifts close');
assert(assignShiftStaff({}, 'smoke').ok, 'shifts assign staff');
assert(ackShiftsFlag({}, 'smoke').ok, 'shifts flag ack');

assert(checklistsSummary().title, 'checklists overview');
assert(runChecklistsSweep({ force: true }, 'smoke').ok, 'checklists sweep');
assert(startChecklistOpsRun({}, 'smoke').ok, 'checklists start run');
assert(completeChecklistOpsRun({}, 'smoke').ok, 'checklists complete run');
assert(failResetChecklistItem({}, 'smoke').ok, 'checklists fail/reset');
assert(ackChecklistsFlag({}, 'smoke').ok, 'checklists flag ack');

assert(alertrulesSummary().title, 'alertrules overview');
assert(runAlertrulesSweep({ force: true }, 'smoke').ok, 'alertrules sweep');
assert(enableAlertrules({}, 'smoke').ok, 'alertrules enable');
assert(disableAlertrules({}, 'smoke').ok, 'alertrules disable');
assert(fireAlertrules({}, 'smoke').ok, 'alertrules fire');
assert(ackAlertrulesFlag({}, 'smoke').ok, 'alertrules flag ack');

assert(buildDigest().title, 'digest overview');
assert(runDigestSweep({ force: true }, 'smoke').ok, 'digest sweep');
assert(refreshDigestReadiness({}, 'smoke').ok, 'digest readiness refresh');
assert(escalateDigestGap({}, 'smoke').ok, 'digest gap escalate');
assert(resolveDigestGap({}, 'smoke').ok, 'digest gap resolve');
assert(ackDigestFlag({}, 'smoke').ok, 'digest flag ack');

assert(buildOpsReport().title, 'report overview');
assert(runReportSweep({ force: true }, 'smoke').ok, 'report sweep');
assert(cancelReportJobs({}, 'smoke').ok, 'report jobs cancel');
assert(ackReportEthos({}, 'smoke').ok, 'report ethos ack');
assert(snapshotReportAudit({}, 'smoke').ok, 'report audit snapshot');
assert(ackReportFlag({}, 'smoke').ok, 'report flag ack');

const met = buildMetrics();
assert(met.title, 'metrics overview');
assert(runMetricsSweep({ force: true }, 'smoke').ok, 'metrics sweep');
assert(snapshotMetrics({}, 'smoke').ok, 'metrics snapshot');
assert(purgeFailedJobs({}, 'smoke').ok, 'metrics jobs purge');
assert(ackEthosFails({}, 'smoke').ok, 'metrics ethos ack');
assert(ackMetricsFlag({}, 'smoke').ok, 'metrics flag ack');

const exp = buildExportsHub();
assert(exp.title && Array.isArray(exp.catalog), 'exports hub');
assert(buildExport(exp.catalog[0]?.id || 'guests')?.csv, 'exports csv key');
assert(runExportsSweep({ force: true }, 'smoke').ok, 'exports sweep');
assert(runExportsSnapshot({}, 'smoke').ok, 'exports snapshot');
assert(exportAllCatalog({ sample: true }, 'smoke').ok, 'exports catalog export');
assert(clearExportsRuns({}, 'smoke').ok, 'exports runs clear');
assert(ackExportsFlag({}, 'smoke').ok, 'exports flag ack');

const rdy = buildReadiness();
assert(rdy.title || rdy.overall != null, 'readiness overview');
assert(runReadinessSweep({ force: true }, 'smoke').ok, 'readiness sweep');
assert(refreshReadinessSnapshot({}, 'smoke').ok, 'readiness snapshot');
assert(escalateReadinessGap({}, 'smoke').ok, 'readiness escalate');
assert(resolveReadinessGap({}, 'smoke').ok, 'readiness gap resolve');
assert(ackReadinessFlag({}, 'smoke').ok, 'readiness flag ack');


assert(kudosSummary().title, 'kudos overview');
assert(runKudosSweep({ force: true }, 'smoke').ok, 'kudos sweep');
assert(createThankYouBurst({}, 'smoke').ok, 'kudos burst');
assert(refreshKudosTagFilter({}, 'smoke').ok, 'kudos tags');
assert(seedDailyKudos({ force: true }, 'smoke').ok, 'kudos daily');
assert(ackKudosFlag({}, 'smoke').ok, 'kudos flag ack');

assert(tipSummary().title, 'tips overview');
assert(runTipsSweep({ force: true }, 'smoke').ok, 'tips sweep');
assert(addTipIn({}, 'smoke').ok, 'tips in');
assert(addTipOut({}, 'smoke').ok, 'tips out');
assert(tipBalanceSnapshot({}, 'smoke').ok, 'tips snapshot');
assert(ackTipsFlag({}, 'smoke').ok, 'tips flag ack');

assert(feedbackSummary().title, 'feedback overview');
assert(runFeedbackSweep({ force: true }, 'smoke').ok, 'feedback sweep');
assert(seedNpsFeedback({}, 'smoke').ok, 'feedback nps seed');
assert(flagLowScores({}, 'smoke').ok, 'feedback low flag');
assert(ackFeedbackFlag({}, 'smoke').ok, 'feedback flag ack');
assert(archiveFeedbackFlags({}, 'smoke').ok, 'feedback archive');

assert(hoursSummary().title, 'hours overview');
assert(runHoursSweep({ force: true }, 'smoke').ok, 'hours sweep');
assert(openVenueHours({}, 'smoke').ok, 'hours open');
assert(closeVenueHours({}, 'smoke').ok, 'hours close');
assert(applyHolidayNote({}, 'smoke').ok, 'hours holiday');
assert(ackHoursFlag({}, 'smoke').ok, 'hours flag ack');

assert(consentSummary().title, 'consent overview');
assert(runConsentSweep({ force: true }, 'smoke').ok, 'consent sweep');
assert(recordConsentOps({}, 'smoke').ok, 'consent record');
assert(revokeConsent({}, 'smoke').ok, 'consent revoke');
assert(seedMissingConsents({}, 'smoke').ok, 'consent missing');
assert(ackConsentFlag({}, 'smoke').ok, 'consent flag ack');

assert(guestsSummary().title, 'guests overview');
assert(runGuestsSweep({ force: true }, 'smoke').ok, 'guests sweep');
assert(upsertGuestOps({}, 'smoke').ok, 'guests upsert');
assert(syncGuestsOps({}, 'smoke').ok, 'guests sync ops');
assert(ackGuestsFlag({}, 'smoke').ok, 'guests flag ack');

assert(loyaltySummary().title, 'loyalty overview');
assert(runLoyaltySweep({ force: true }, 'smoke').ok, 'loyalty sweep');
assert(awardLoyaltyPoints({}, 'smoke').ok, 'loyalty award');
assert(redeemLoyaltyPoints({}, 'smoke').ok, 'loyalty redeem');
assert(ackLoyaltyFlag({}, 'smoke').ok, 'loyalty flag ack');

assert(seedNotification({ detail: 'smoke notification seed', level: 'warn' }, 'smoke').ok, 'notifications seed');
assert(runNotificationsSweep({ force: true }, 'smoke').ok, 'notifications sweep');
assert(ackNotificationsFlag({}, 'smoke').ok, 'notifications flag ack');
assert(markAllRead().ok, 'notifications mark all read');
assert(notificationsSummary().summary?.total >= 1, 'notifications summary');

assert(webhooksSummary().title, 'webhooks overview');
assert(seedWebhookHook({ url: `https://example.com/smoke-161-${Date.now()}` }, 'smoke').ok, 'webhooks seed');
assert(recordWebhookProbeDelivery({ status: 202 }, 'smoke').ok, 'webhooks probe');
assert(toggleWebhookActive({}, 'smoke').ok, 'webhooks toggle');
assert(runWebhooksSweep({ force: true }, 'smoke').ok, 'webhooks sweep');
assert(ackWebhooksFlag({}, 'smoke').ok, 'webhooks flag ack');

assert(documentsSummary().title, 'documents overview');
assert(seedPolicyDocument({ title: 'Smoke 161 policy' }, 'smoke').ok, 'documents policy seed');
assert(reviseDocumentVersion({}, 'smoke').ok, 'documents revise');
assert(flagDocumentReview({}, 'smoke').ok, 'documents review flag');
assert(runDocumentsSweep({ force: true }, 'smoke').ok, 'documents sweep');
assert(ackDocumentsFlag({}, 'smoke').ok, 'documents flag ack');

assert(vendorScoreSummary().title, 'vendorscore overview');
assert(seedVendorScore({ supplierName: 'Smoke 161 vendor' }, 'smoke').ok, 'vendorscore seed');
assert(reviewVendorScore({}, 'smoke').ok, 'vendorscore review');
assert(flagVendorUnderperformance({}, 'smoke').ok, 'vendorscore underperform');
assert(runVendorscoreSweep({ force: true }, 'smoke').ok, 'vendorscore sweep');
assert(ackVendorscoreFlag({}, 'smoke').ok, 'vendorscore flag ack');

assert(contractsSummary().title, 'contracts overview');
assert(seedRenewingContract({ title: 'Smoke 162 renewal' }, 'smoke').ok, 'contracts renewal seed');
assert(signContractOps({}, 'smoke').ok, 'contracts sign');
assert(renewContractOps({}, 'smoke').ok, 'contracts renew');
assert(runContractsSweep({ force: true }, 'smoke').ok, 'contracts sweep');
assert(ackContractsFlag({}, 'smoke').ok, 'contracts flag ack');

assert(deliverySummary().title, 'delivery overview');
assert(seedPendingDelivery({ guestName: 'Smoke 162 delivery' }, 'smoke').ok, 'delivery pending seed');
assert(delayDeliveryEta({}, 'smoke').ok, 'delivery eta delay');
assert(markDeliveryDelivered({}, 'smoke').ok, 'delivery delivered');
assert(runDeliverySweep({ force: true }, 'smoke').ok, 'delivery sweep');
assert(ackDeliveryFlag({}, 'smoke').ok, 'delivery flag ack');

assert(giftcardsSummary().title, 'giftcards overview');
assert(seedPromoGiftcard({ holder: 'Smoke 162 promo' }, 'smoke').ok, 'giftcards promo seed');
assert(redeemGiftcardOps({ amount: 25 }, 'smoke').ok, 'giftcards redeem');
assert(topUpGiftcardOps({ amount: 50 }, 'smoke').ok, 'giftcards topup');
assert(runGiftcardsSweep({ force: true }, 'smoke').ok, 'giftcards sweep');
assert(ackGiftcardsFlag({}, 'smoke').ok, 'giftcards flag ack');

assert(laundrySummary().title, 'laundry overview');
assert(seedRushLaundryOrder({ item: 'Smoke 162 rush' }, 'smoke').ok, 'laundry rush seed');
assert(markLaundryReady({}, 'smoke').ok, 'laundry ready');
assert(returnLaundryBatch({}, 'smoke').ok, 'laundry return');
assert(runLaundrySweep({ force: true }, 'smoke').ok, 'laundry sweep');
assert(ackLaundryFlag({}, 'smoke').ok, 'laundry flag ack');

assert(cleaningSummary().title, 'cleaning overview');
assert(seedCleaningInspectionFail({ room: 'Smoke 163 clean fail' }, 'smoke').ok, 'cleaning inspection seed');
assert(failCleaningInspection({}, 'smoke').ok, 'cleaning inspection fail');
assert(markCleaningClean({}, 'smoke').ok, 'cleaning mark clean');
assert(runCleaningSweep({ force: true }, 'smoke').ok, 'cleaning sweep');
assert(ackCleaningFlag({}, 'smoke').ok, 'cleaning flag ack');

assert(emergencySummary().title, 'emergency overview');
assert(seedEmergencyDrill({ title: 'Smoke 163 drill' }, 'smoke').ok, 'emergency drill seed');
assert(acknowledgeEmergencyIncident({}, 'smoke').ok, 'emergency incident ack');
assert(closeEmergencyIncident({}, 'smoke').ok, 'emergency incident close');
assert(runEmergencySweep({ force: true }, 'smoke').ok, 'emergency sweep');
assert(ackEmergencyFlag({}, 'smoke').ok, 'emergency flag ack');

assert(folioSummary().title, 'folio overview');
assert(seedFolioDispute({ guestName: 'Smoke 163 dispute' }, 'smoke').ok, 'folio dispute seed');
assert(postFolioCharge({ guestName: 'Smoke 163 charge', amount: 180 }, 'smoke').ok, 'folio post charge');
assert(settleFolioBalance({}, 'smoke').ok, 'folio settle');
assert(runFolioSweep({ force: true }, 'smoke').ok, 'folio sweep');
assert(ackFolioFlag({}, 'smoke').ok, 'folio flag ack');

assert(roomstatusSummary().title, 'roomstatus overview');
assert(seedBlockedRoomstatus({ room: 'Smoke 163 blocked' }, 'smoke').ok, 'roomstatus blocked seed');
assert(extendRoomstatusOoo({}, 'smoke').ok, 'roomstatus ooo extend');
assert(setRoomstatusReady({}, 'smoke').ok, 'roomstatus ready');
assert(runRoomstatusSweep({ force: true }, 'smoke').ok, 'roomstatus sweep');
assert(ackRoomstatusFlag({}, 'smoke').ok, 'roomstatus flag ack');

assert(minibarSummary().title, 'minibar overview');
assert(seedEmptyMinibarFridge({ room: 'Smoke 164 empty' }, 'smoke').ok, 'minibar empty seed');
assert(restockDueMinibar({}, 'smoke').ok, 'minibar restock due');
assert(chargeMinibarFolio({ amount: 75 }, 'smoke').ok, 'minibar folio charge');
assert(runMinibarSweep({ force: true }, 'smoke').ok, 'minibar sweep');
assert(ackMinibarFlag({}, 'smoke').ok, 'minibar flag ack');

assert(transfersSummary().title, 'transfers overview');
assert(seedAirportTransferRun({ guestName: 'Smoke 164 airport' }, 'smoke').ok, 'transfers airport seed');
assert(delayTransferPickup({}, 'smoke').ok, 'transfers pickup delay');
assert(completeTransferRide({}, 'smoke').ok, 'transfers complete');
assert(runTransfersSweep({ force: true }, 'smoke').ok, 'transfers sweep');
assert(ackTransfersFlag({}, 'smoke').ok, 'transfers flag ack');

assert(conciergeSummary().title, 'concierge overview');
assert(seedVipConciergeAsk({ guestName: 'Smoke 164 VIP' }, 'smoke').ok, 'concierge vip seed');
assert(ageConciergeRequest({}, 'smoke').ok, 'concierge request aging');
assert(fulfillConciergeRequest({}, 'smoke').ok, 'concierge fulfill');
assert(runConciergeSweep({ force: true }, 'smoke').ok, 'concierge sweep');
assert(ackConciergeFlag({}, 'smoke').ok, 'concierge flag ack');

assert(shuttleSummary().title, 'shuttle overview');
assert(seedShuttleRoute({ route: 'Smoke 164 route' }, 'smoke').ok, 'shuttle route seed');
assert(markShuttleLateDeparture({}, 'smoke').ok, 'shuttle late departure');
assert(boardShuttleGuests({}, 'smoke').ok, 'shuttle board guests');
assert(runShuttleSweep({ force: true }, 'smoke').ok, 'shuttle sweep');
assert(ackShuttleFlag({}, 'smoke').ok, 'shuttle flag ack');

assert(wifiSummary().title, 'wifi overview');
assert(seedGuestWifiVoucher({ guestName: 'Smoke 165 WiFi' }, 'smoke').ok, 'wifi guest voucher seed');
assert(flagWifiCaptivePortalIssue({}, 'smoke').ok, 'wifi portal issue');
assert(resetWifiAccessPoint({}, 'smoke').ok, 'wifi ap reset');
assert(runWifiSweep({ force: true }, 'smoke').ok, 'wifi sweep');
assert(ackWifiFlag({}, 'smoke').ok, 'wifi flag ack');

assert(kdsSummary().title, 'kds overview');
assert(seedRushKdsTicket({ ticket: 'SMK-165' }, 'smoke').ok, 'kds rush seed');
assert(ageKdsTicket({}, 'smoke').ok, 'kds ticket aging');
assert(bumpKdsTicket({}, 'smoke').ok, 'kds ticket bump');
assert(runKdsSweep({ force: true }, 'smoke').ok, 'kds sweep');
assert(ackKdsFlag({}, 'smoke').ok, 'kds flag ack');

assert(budgetSummary().title, 'budget overview');
assert(seedForecastBudgetGap({ label: 'Smoke 165 gap' }, 'smoke').ok, 'budget forecast gap seed');
assert(flagBudgetOverspendLine({}, 'smoke').ok, 'budget overspend line');
assert(approveBudgetAdjustment({}, 'smoke').ok, 'budget adjustment approve');
assert(runBudgetSweep({ force: true }, 'smoke').ok, 'budget sweep');
assert(ackBudgetFlag({}, 'smoke').ok, 'budget flag ack');

assert(eventcalSummary().title, 'eventcal overview');
assert(seedHoldingEventcalEvent({ title: 'Smoke 165 holding' }, 'smoke').ok, 'eventcal holding seed');
assert(flagEventcalConflict({}, 'smoke').ok, 'eventcal conflict');
assert(publishEventcalEvent({ id: seedHoldingEventcalEvent({ title: 'Smoke 165 publish' }, 'smoke').event.id }, 'smoke').ok, 'eventcal publish');
assert(runEventcalSweep({ force: true }, 'smoke').ok, 'eventcal sweep');
assert(ackEventcalFlag({}, 'smoke').ok, 'eventcal flag ack');

assert(keycardsSummary().title, 'keycards overview');
assert(seedLostKeycard({ guestName: 'Smoke 166 lost card' }, 'smoke').ok, 'keycards lost seed');
assert(expireKeycardAccess({}, 'smoke').ok, 'keycards expire access');
assert(reissueKeycard({}, 'smoke').ok, 'keycards reissue');
assert(runKeycardsSweep({ force: true }, 'smoke').ok, 'keycards sweep');
assert(ackKeycardsFlag({}, 'smoke').ok, 'keycards flag ack');

assert(parcelsSummary().title, 'parcels overview');
assert(seedFrontdeskParcelHold({ guestName: 'Smoke 166 front desk' }, 'smoke').ok, 'parcels front-desk hold seed');
assert(ageParcelUndelivered({}, 'smoke').ok, 'parcels undelivered aging');
assert(markParcelDelivered({}, 'smoke').ok, 'parcels mark delivered');
assert(runParcelsSweep({ force: true }, 'smoke').ok, 'parcels sweep');
assert(ackParcelsFlag({}, 'smoke').ok, 'parcels flag ack');

assert(wakeupsSummary().title, 'wakeups overview');
assert(seedVipWakeup({ guestName: 'Smoke 166 VIP' }, 'smoke').ok, 'wakeups vip seed');
assert(markWakeupMissed({}, 'smoke').ok, 'wakeups missed call');
assert(completeWakeupCall({}, 'smoke').ok, 'wakeups complete');
assert(runWakeupsSweep({ force: true }, 'smoke').ok, 'wakeups sweep');
assert(ackWakeupsFlag({}, 'smoke').ok, 'wakeups flag ack');

assert(upsellSummary().title, 'upsell overview');
assert(seedLateCheckoutOffer({ guestName: 'Smoke 166 late checkout' }, 'smoke').ok, 'upsell late checkout seed');
assert(ageUpsellPendingOffer({}, 'smoke').ok, 'upsell pending offer aging');
assert(acceptUpsellOffer({}, 'smoke').ok, 'upsell accept offer');
assert(runUpsellSweep({ force: true }, 'smoke').ok, 'upsell sweep');
assert(ackUpsellFlag({}, 'smoke').ok, 'upsell flag ack');

assert(breakfastSummary().title, 'breakfast overview');
assert(seedBuffetRush({ guestName: 'Smoke 167 buffet rush' }, 'smoke').ok, 'breakfast buffet rush seed');
assert(markBreakfastNoShowCovers({}, 'smoke').ok, 'breakfast no-show covers');
assert(seatBreakfastParty({}, 'smoke').ok, 'breakfast seat party');
assert(runBreakfastSweep({ force: true }, 'smoke').ok, 'breakfast sweep');
assert(ackBreakfastFlag({}, 'smoke').ok, 'breakfast flag ack');

assert(banquetSummary().title, 'banquet overview');
assert(seedBanquetTasting({ eventName: 'Smoke 167 tasting' }, 'smoke').ok, 'banquet tasting seed');
assert(markBanquetSetupOverdue({}, 'smoke').ok, 'banquet setup overdue');
assert(confirmBanquetEvent({}, 'smoke').ok, 'banquet confirm event');
assert(runBanquetSweep({ force: true }, 'smoke').ok, 'banquet sweep');
assert(ackBanquetFlag({}, 'smoke').ok, 'banquet flag ack');

assert(beachbedsSummary().title, 'beachbeds overview');
assert(seedVipCabana({ guestName: 'Smoke 167 VIP cabana' }, 'smoke').ok, 'beachbeds vip cabana seed');
assert(markBeachbedUnpaid({}, 'smoke').ok, 'beachbeds unpaid daybed');
assert(checkInBeachbed({}, 'smoke').ok, 'beachbeds check-in');
assert(runBeachbedsSweep({ force: true }, 'smoke').ok, 'beachbeds sweep');
assert(ackBeachbedsFlag({}, 'smoke').ok, 'beachbeds flag ack');

assert(marinaSummary().title, 'marina overview');
assert(seedMarinaArrival({ vessel: 'Smoke 167 arrival' }, 'smoke').ok, 'marina arrival seed');
assert(markMarinaBerthOverdue({}, 'smoke').ok, 'marina berth overdue');
assert(clearMarinaSlip({}, 'smoke').ok, 'marina clear slip');
assert(runMarinaSweep({ force: true }, 'smoke').ok, 'marina sweep');
assert(ackMarinaFlag({}, 'smoke').ok, 'marina flag ack');

assert(hammamSummary().title, 'hammam overview');
assert(seedCouplesRitual({ guestName: 'Smoke 168 couples ritual' }, 'smoke').ok, 'hammam couples ritual seed');
assert(markHammamSlotOverrun({}, 'smoke').ok, 'hammam slot overrun');
assert(completeHammamSession({}, 'smoke').ok, 'hammam session complete');
assert(runHammamSweep({ force: true }, 'smoke').ok, 'hammam sweep');
assert(ackHammamFlag({}, 'smoke').ok, 'hammam flag ack');

assert(diveSummary().title, 'dive overview');
const smokeDiveCert = seedBoatTrip({ guestName: 'Smoke 168 boat trip' }, 'smoke');
assert(smokeDiveCert.ok, 'dive boat trip seed');
assert(markDiveCertExpired({ id: smokeDiveCert.dive.id }, 'smoke').ok, 'dive cert expired');
const smokeDiveCheckin = seedBoatTrip({ guestName: 'Smoke 168 check-in' }, 'smoke');
assert(checkInDive({ id: smokeDiveCheckin.dive.id }, 'smoke').ok, 'dive check-in');
assert(runDiveSweep({ force: true }, 'smoke').ok, 'dive sweep');
assert(ackDiveFlag({}, 'smoke').ok, 'dive flag ack');

assert(meetingroomsSummary().title, 'meetingrooms overview');
assert(seedBoardSetup({ title: 'Smoke 168 board setup' }, 'smoke').ok, 'meetingrooms board setup seed');
assert(markMeetingroomsBookingOverrun({}, 'smoke').ok, 'meetingrooms booking overrun');
assert(releaseMeetingroomRoom({}, 'smoke').ok, 'meetingrooms room release');
assert(runMeetingroomsSweep({ force: true }, 'smoke').ok, 'meetingrooms sweep');
assert(ackMeetingroomsFlag({}, 'smoke').ok, 'meetingrooms flag ack');

assert(retailSummary().title, 'retail overview');
assert(seedFlashSale({ sku: 'Smoke 168 flash sale' }, 'smoke').ok, 'retail flash sale seed');
assert(markRetailLowStockSku({}, 'smoke').ok, 'retail low stock sku');
assert(restockRetailSku({}, 'smoke').ok, 'retail restock');
assert(runRetailSweep({ force: true }, 'smoke').ok, 'retail sweep');
assert(ackRetailFlag({}, 'smoke').ok, 'retail flag ack');

assert(toursSummary().title, 'tours overview');
assert(seedSunsetTour({ tourName: 'Smoke 169 sunset tour' }, 'smoke').ok, 'tours sunset seed');
assert(markTourDepartureSoon({}, 'smoke').ok, 'tours departure soon');
assert(checkInTourGuest({}, 'smoke').ok, 'tours check-in guest');
assert(runToursSweep({ force: true }, 'smoke').ok, 'tours sweep');
assert(ackToursFlag({}, 'smoke').ok, 'tours flag ack');

assert(privatechefSummary().title, 'privatechef overview');
assert(seedTastingMenu({ menu: 'Smoke 169 tasting menu' }, 'smoke').ok, 'privatechef tasting seed');
assert(markPrivatechefMenuPending({}, 'smoke').ok, 'privatechef menu pending');
assert(confirmPrivatechefBooking({}, 'smoke').ok, 'privatechef booking confirm');
assert(runPrivatechefSweep({ force: true }, 'smoke').ok, 'privatechef sweep');
assert(ackPrivatechefFlag({}, 'smoke').ok, 'privatechef flag ack');

assert(qrcheckinSummary().title, 'qrcheckin overview');
assert(seedVipQr({ guestName: 'Smoke 169 VIP QR' }, 'smoke').ok, 'qrcheckin vip seed');
assert(markQrcheckinInvalidScanSpike({}, 'smoke').ok, 'qrcheckin invalid scan spike');
assert(admitQrcheckinGuest({}, 'smoke').ok, 'qrcheckin admit guest');
assert(runQrcheckinSweep({ force: true }, 'smoke').ok, 'qrcheckin sweep');
assert(ackQrcheckinFlag({}, 'smoke').ok, 'qrcheckin flag ack');

assert(patrolSummary().title, 'patrol overview');
assert(seedNightRoute({ routeName: 'Smoke 169 night route' }, 'smoke').ok, 'patrol night route seed');
assert(markPatrolMissedCheckpoint({}, 'smoke').ok, 'patrol missed checkpoint');
assert(completePatrolRound({}, 'smoke').ok, 'patrol round complete');
assert(runPatrolSweep({ force: true }, 'smoke').ok, 'patrol sweep');
assert(ackPatrolFlag({}, 'smoke').ok, 'patrol flag ack');

assert(venuesSummary().title, 'venues overview');
const smokeVenue = seedSeasonalVenue({ name: 'Smoke 170 seasonal venue' }, 'smoke');
assert(smokeVenue.ok, 'venues seasonal seed');
assert(markVenueInactive({ id: smokeVenue.venue.id }, 'smoke').ok, 'venues inactive venue');
assert(activateVenue({ id: smokeVenue.venue.id }, 'smoke').ok, 'venues activate');
assert(runVenuesSweep({ force: true }, 'smoke').ok, 'venues sweep');
assert(ackVenuesFlag({}, 'smoke').ok, 'venues flag ack');

assert(spaSummary().title, 'spa overview');
const smokeSpa = seedCouplesPackage({ guestName: 'Smoke 170 couples package' }, 'smoke');
assert(smokeSpa.ok, 'spa couples package seed');
assert(markSpaAppointmentOverrun({ id: smokeSpa.spa.id }, 'smoke').ok, 'spa appointment overrun');
assert(completeSpaTreatment({ id: smokeSpa.spa.id }, 'smoke').ok, 'spa treatment complete');
assert(runSpaSweep({ force: true }, 'smoke').ok, 'spa sweep');
assert(ackSpaFlag({}, 'smoke').ok, 'spa flag ack');

assert(contentSummary().title, 'content overview');
const smokeContent = seedCampaignPost({ title: 'Smoke 170 campaign post' }, 'smoke');
assert(smokeContent.ok, 'content campaign post seed');
assert(markContentStaleDraft({ id: smokeContent.content.id }, 'smoke').ok, 'content stale draft');
assert(publishContentItem({ id: smokeContent.content.id }, 'smoke').ok, 'content publish');
assert(runContentSweep({ force: true }, 'smoke').ok, 'content sweep');
assert(ackContentFlag({}, 'smoke').ok, 'content flag ack');

assert(musicSummary().title, 'music overview');
const smokeMusic = seedSunsetMix({ title: 'Smoke 170 sunset mix' }, 'smoke');
assert(smokeMusic.ok, 'music sunset mix seed');
assert(markMusicZoneSilence({ id: smokeMusic.music.id }, 'smoke').ok, 'music zone silence');
assert(setMusicPlaylist({ id: smokeMusic.music.id, playlist: 'Smoke 170 sunset playlist' }, 'smoke').ok, 'music playlist set');
assert(runMusicSweep({ force: true }, 'smoke').ok, 'music sweep');
assert(ackMusicFlag({}, 'smoke').ok, 'music flag ack');

assert(passstockSummary().title, 'passstock overview');
const smokePassstock = seedEventBatch({ eventName: 'Smoke 171 event batch' }, 'smoke');
assert(smokePassstock.ok, 'passstock event batch seed');
assert(markPassstockLowWristbandStock({ id: smokePassstock.passstock.id }, 'smoke').ok, 'passstock low wristband stock');
assert(restockPassstock({ id: smokePassstock.passstock.id }, 'smoke').ok, 'passstock restock');
assert(runPassstockSweep({ force: true }, 'smoke').ok, 'passstock sweep');
assert(ackPassstockFlag({}, 'smoke').ok, 'passstock flag ack');

assert(pulseSummary().title, 'pulse overview');
const smokePulse = seedCampusBeat({ beatName: 'Smoke 171 campus beat' }, 'smoke');
assert(smokePulse.ok, 'pulse campus beat seed');
assert(markPulseStaleSignal({ id: smokePulse.pulse.id }, 'smoke').ok, 'pulse stale signal');
assert(refreshPulseChannel({ id: smokePulse.pulse.id }, 'smoke').ok, 'pulse channel refresh');
assert(runPulseSweep({ force: true }, 'smoke').ok, 'pulse sweep');
assert(ackPulseFlag({}, 'smoke').ok, 'pulse flag ack');

assert(amenitiesSummary().title, 'amenities overview');
const smokeAmenity = seedPillowMenu({ room: '171' }, 'smoke');
assert(smokeAmenity.ok, 'amenities pillow menu seed');
assert(markAmenitiesRequestBacklog({ id: smokeAmenity.amenity.id }, 'smoke').ok, 'amenities request backlog');
assert(fulfillAmenitiesRequest({ id: smokeAmenity.amenity.id }, 'smoke').ok, 'amenities fulfill');
assert(runAmenitiesSweep({ force: true }, 'smoke').ok, 'amenities sweep');
assert(ackAmenitiesFlag({}, 'smoke').ok, 'amenities flag ack');

assert(haccpSummary().title, 'haccp overview');
const smokeHaccp = seedProbeCheck({ checkpoint: 'Smoke 171 probe check' }, 'smoke');
assert(smokeHaccp.ok, 'haccp probe check seed');
assert(markHaccpTempBreach({ id: smokeHaccp.haccp.id }, 'smoke').ok, 'haccp temp breach');
assert(logHaccpCorrective({ id: smokeHaccp.haccp.id }, 'smoke').ok, 'haccp corrective log');
assert(runHaccpSweep({ force: true }, 'smoke').ok, 'haccp sweep');
assert(ackHaccpFlag({}, 'smoke').ok, 'haccp flag ack');

assert(lateoutSummary().title, 'lateout overview');
const smokeLateout = seedVipLateOut({ room: '172' }, 'smoke');
assert(smokeLateout.ok, 'lateout vip seed');
assert(markLateoutUnpaidFee({ id: smokeLateout.lateout.id }, 'smoke').ok, 'lateout unpaid fee');
assert(approveLateoutExtension({ id: smokeLateout.lateout.id }, 'smoke').ok, 'lateout extension approve');
assert(runLateoutSweep({ force: true }, 'smoke').ok, 'lateout sweep');
assert(ackLateoutFlag({}, 'smoke').ok, 'lateout flag ack');

assert(lockersSummary().title, 'lockers overview');
const smokeLocker = seedLockerDayPass({ code: 'SM-172' }, 'smoke');
assert(smokeLocker.ok, 'lockers day pass seed');
assert(markLockersOverdueRental({ id: smokeLocker.locker.id }, 'smoke').ok, 'lockers overdue rental');
assert(runLockersSweep({ force: true }, 'smoke').ok, 'lockers sweep');
assert(releaseLocker({ id: smokeLocker.locker.id }, 'smoke').ok, 'lockers release');
assert(ackLockersFlag({}, 'smoke').ok, 'lockers flag ack');

assert(towelsSummary().title, 'towels overview');
const smokeTowel = seedPoolRush({ zone: 'Smoke Pool 172' }, 'smoke');
assert(smokeTowel.ok, 'towels pool rush seed');
assert(markTowelsShortageZone({ id: smokeTowel.towel.id }, 'smoke').ok, 'towels shortage zone');
assert(runTowelsSweep({ force: true }, 'smoke').ok, 'towels sweep');
assert(restockTowels({ id: smokeTowel.towel.id }, 'smoke').ok, 'towels restock');
assert(ackTowelsFlag({}, 'smoke').ok, 'towels flag ack');

assert(kidsclubSummary().title, 'kidsclub overview');
const smokeKid = seedKidsclubActivitySlot({ activity: 'Smoke 172 activity' }, 'smoke');
assert(smokeKid.ok, 'kidsclub activity slot seed');
assert(markKidsclubUncheckedChild({ id: smokeKid.entry.id }, 'smoke').ok, 'kidsclub unchecked child');
assert(runKidsclubSweep({ force: true }, 'smoke').ok, 'kidsclub sweep');
assert(checkInKidsclubChild({ id: smokeKid.entry.id }, 'smoke').ok, 'kidsclub check-in');
assert(ackKidsclubFlag({}, 'smoke').ok, 'kidsclub flag ack');

assert(seedCampusbriefAction({ text: 'Smoke 161 brif aksiyon', at: new Date(Date.now() - 36 * 60 * 60_000).toISOString() }, 'smoke').ok, 'campusbrief action seed');
assert(ageCampusBriefActions({ force: true }, 'smoke').ok, 'campusbrief action aging');
assert(flagCampusbriefHealth({}, 'smoke').ok, 'campusbrief health flag');
assert(runCampusbriefSweep({ force: true }, 'smoke').ok, 'campusbrief sweep');
assert(ackCampusbriefFlag({}, 'smoke').ok, 'campusbrief flag ack');

console.log('MOD141_OK');
console.log('MOD135_OK');
console.log('MOD144_OK');
console.log('MOD148_OK');
console.log('MOD152_OK');
console.log('MOD155_OK');
console.log('MOD156_OK');
console.log('MOD157_OK');
console.log('MOD158_OK');
console.log('MOD159_OK');
console.log('MOD160_OK');
console.log('MOD161_OK');
console.log('MOD162_OK');
console.log('MOD163_OK');
console.log('MOD164_OK');
console.log('MOD165_OK');
console.log('MOD166_OK');
console.log('MOD167_OK');
console.log('MOD168_OK');
console.log('MOD169_OK');
console.log('MOD170_OK');
console.log('MOD171_OK');
console.log('MOD172_OK');

const crudDomains = listCrudDomains({ force: true });
assert(crudDomains.length >= 1000, 'crudops registry size');
assert(crudopsOverview().total === crudDomains.length, 'crudops overview total');
assert(crudDomains.some((d) => d.name === 'brands'), 'crudops includes brands');
for (const thickened158 of ['lostfound', 'waitlist', 'assets', 'valet']) {
  assert(!crudDomains.some((d) => d.name === thickened158), `crudops skips thickened ${thickened158}`);
}
for (const thickened159 of ['stayring', 'culturescene', 'agentfleet', 'notifications']) {
  assert(!crudDomains.some((d) => d.name === thickened159), `crudops skips thickened ${thickened159}`);
}
for (const thickened160 of ['cash', 'coldchain', 'energy', 'waste']) {
  assert(!crudDomains.some((d) => d.name === thickened160), `crudops skips thickened ${thickened160}`);
}
for (const thickened161 of ['webhooks', 'documents', 'vendorscore', 'campusbrief']) {
  assert(!crudDomains.some((d) => d.name === thickened161), `crudops skips thickened ${thickened161}`);
}
for (const thickened162 of ['contracts', 'delivery', 'giftcards', 'laundry']) {
  assert(!crudDomains.some((d) => d.name === thickened162), `crudops skips thickened ${thickened162}`);
}
for (const thickened163 of ['cleaning', 'emergency', 'folio', 'roomstatus']) {
  assert(!crudDomains.some((d) => d.name === thickened163), `crudops skips thickened ${thickened163}`);
}
for (const thickened164 of ['minibar', 'transfers', 'concierge', 'shuttle']) {
  assert(!crudDomains.some((d) => d.name === thickened164), `crudops skips thickened ${thickened164}`);
}
for (const thickened165 of ['wifi', 'kds', 'budget', 'eventcal']) {
  assert(!crudDomains.some((d) => d.name === thickened165), `crudops skips thickened ${thickened165}`);
}
for (const thickened166 of ['keycards', 'parcels', 'wakeups', 'upsell']) {
  assert(!crudDomains.some((d) => d.name === thickened166), `crudops skips thickened ${thickened166}`);
}
for (const thickened167 of ['breakfast', 'banquet', 'beachbeds', 'marina']) {
  assert(!crudDomains.some((d) => d.name === thickened167), `crudops skips thickened ${thickened167}`);
}
for (const thickened168 of ['hammam', 'dive', 'meetingrooms', 'retail']) {
  assert(!crudDomains.some((d) => d.name === thickened168), `crudops skips thickened ${thickened168}`);
}
for (const thickened169 of ['tours', 'privatechef', 'qrcheckin', 'patrol']) {
  assert(!crudDomains.some((d) => d.name === thickened169), `crudops skips thickened ${thickened169}`);
}
for (const thickened170 of ['venues', 'spa', 'content', 'music']) {
  assert(!crudDomains.some((d) => d.name === thickened170), `crudops skips thickened ${thickened170}`);
  assert(!isCrudOpsPath(`/api/${thickened170}/sweep`, 'POST'), `crudops skips ${thickened170} sweep`);
  assert(!isCrudOpsPath(`/api/${thickened170}/flag/ack`, 'POST'), `crudops skips ${thickened170} ack`);
}
for (const thickened171 of ['passstock', 'pulse', 'amenities', 'haccp']) {
  assert(!crudDomains.some((d) => d.name === thickened171), `crudops skips thickened ${thickened171}`);
  assert(!isCrudOpsPath(`/api/${thickened171}/sweep`, 'POST'), `crudops skips ${thickened171} sweep`);
  assert(!isCrudOpsPath(`/api/${thickened171}/flag/ack`, 'POST'), `crudops skips ${thickened171} ack`);
}
for (const thickened172 of ['lateout', 'lockers', 'towels', 'kidsclub']) {
  assert(!crudDomains.some((d) => d.name === thickened172), `crudops skips thickened ${thickened172}`);
  assert(!isCrudOpsPath(`/api/${thickened172}/sweep`, 'POST'), `crudops skips ${thickened172} sweep`);
  assert(!isCrudOpsPath(`/api/${thickened172}/flag/ack`, 'POST'), `crudops skips ${thickened172} ack`);
}
assert(isCrudOpsPath('/api/carbonlog/sweep', 'POST'), 'crudops path carbonlog');
assert(!isCrudOpsPath('/api/brief/sweep', 'POST'), 'crudops skips thickened brief');
assert(!isCrudOpsPath('/api/kudos/sweep', 'POST'), 'crudops skips thickened kudos');
assert(!isCrudOpsPath('/api/tips/sweep', 'POST'), 'crudops skips thickened tips');
assert(!isCrudOpsPath('/api/feedback/sweep', 'POST'), 'crudops skips thickened feedback');
assert(!isCrudOpsPath('/api/suppliers/sweep', 'POST'), 'crudops skips thickened suppliers');
assert(!isCrudOpsPath('/api/suppliers/flag/ack', 'POST'), 'crudops skips suppliers ack');
assert(!isCrudOpsPath('/api/recipes/sweep', 'POST'), 'crudops skips thickened recipes');
assert(!isCrudOpsPath('/api/recipes/flag/ack', 'POST'), 'crudops skips recipes ack');
assert(!isCrudOpsPath('/api/campaigns/sweep', 'POST'), 'crudops skips thickened campaigns');
assert(!isCrudOpsPath('/api/campaigns/flag/ack', 'POST'), 'crudops skips campaigns ack');
assert(!isCrudOpsPath('/api/complaints/sweep', 'POST'), 'crudops skips thickened complaints');
assert(!isCrudOpsPath('/api/complaints/flag/ack', 'POST'), 'crudops skips complaints ack');
assert(!isCrudOpsPath('/api/training/sweep', 'POST'), 'crudops skips thickened training');
assert(!isCrudOpsPath('/api/training/flag/ack', 'POST'), 'crudops skips training ack');
assert(!isCrudOpsPath('/api/menu/sweep', 'POST'), 'crudops skips thickened menu');
assert(!isCrudOpsPath('/api/menu/flag/ack', 'POST'), 'crudops skips menu ack');
assert(!isCrudOpsPath('/api/seating/sweep', 'POST'), 'crudops skips thickened seating');
assert(!isCrudOpsPath('/api/seating/flag/ack', 'POST'), 'crudops skips seating ack');
assert(!isCrudOpsPath('/api/announcements/sweep', 'POST'), 'crudops skips thickened announcements');
assert(!isCrudOpsPath('/api/announcements/flag/ack', 'POST'), 'crudops skips announcements ack');
assert(!isCrudOpsPath('/api/lostfound/sweep', 'POST'), 'crudops skips thickened lostfound');
assert(!isCrudOpsPath('/api/lostfound/flag/ack', 'POST'), 'crudops skips lostfound ack');
assert(!isCrudOpsPath('/api/lost-found/sweep', 'POST'), 'crudops skips lost-found prefix');
assert(!isCrudOpsPath('/api/waitlist/sweep', 'POST'), 'crudops skips thickened waitlist');
assert(!isCrudOpsPath('/api/waitlist/flag/ack', 'POST'), 'crudops skips waitlist ack');
assert(!isCrudOpsPath('/api/assets/sweep', 'POST'), 'crudops skips thickened assets');
assert(!isCrudOpsPath('/api/assets/flag/ack', 'POST'), 'crudops skips assets ack');
assert(!isCrudOpsPath('/api/valet/sweep', 'POST'), 'crudops skips thickened valet');
assert(!isCrudOpsPath('/api/valet/flag/ack', 'POST'), 'crudops skips valet ack');
assert(!isCrudOpsPath('/api/stayring/sweep', 'POST'), 'crudops skips thickened stayring');
assert(!isCrudOpsPath('/api/stayring/flag/ack', 'POST'), 'crudops skips stayring ack');
assert(!isCrudOpsPath('/api/culture/sweep', 'POST'), 'crudops skips culture prefix');
assert(!isCrudOpsPath('/api/culturescene/sweep', 'POST'), 'crudops skips thickened culturescene');
assert(!isCrudOpsPath('/api/culturescene/flag/ack', 'POST'), 'crudops skips culturescene ack');
assert(!isCrudOpsPath('/api/agentfleet/sweep', 'POST'), 'crudops skips thickened agentfleet');
assert(!isCrudOpsPath('/api/agentfleet/flag/ack', 'POST'), 'crudops skips agentfleet ack');
assert(!isCrudOpsPath('/api/notifications/sweep', 'POST'), 'crudops skips thickened notifications');
assert(!isCrudOpsPath('/api/notifications/flag/ack', 'POST'), 'crudops skips notifications ack');
assert(!isCrudOpsPath('/api/cash/sweep', 'POST'), 'crudops skips thickened cash');
assert(!isCrudOpsPath('/api/cash/flag/ack', 'POST'), 'crudops skips cash ack');
assert(!isCrudOpsPath('/api/coldchain/sweep', 'POST'), 'crudops skips thickened coldchain');
assert(!isCrudOpsPath('/api/coldchain/flag/ack', 'POST'), 'crudops skips coldchain ack');
assert(!isCrudOpsPath('/api/energy/sweep', 'POST'), 'crudops skips thickened energy');
assert(!isCrudOpsPath('/api/energy/flag/ack', 'POST'), 'crudops skips energy ack');
assert(!isCrudOpsPath('/api/waste/sweep', 'POST'), 'crudops skips thickened waste');
assert(!isCrudOpsPath('/api/waste/flag/ack', 'POST'), 'crudops skips waste ack');
assert(!isCrudOpsPath('/api/webhooks/sweep', 'POST'), 'crudops skips thickened webhooks');
assert(!isCrudOpsPath('/api/webhooks/flag/ack', 'POST'), 'crudops skips webhooks ack');
assert(!isCrudOpsPath('/api/documents/sweep', 'POST'), 'crudops skips thickened documents');
assert(!isCrudOpsPath('/api/documents/flag/ack', 'POST'), 'crudops skips documents ack');
assert(!isCrudOpsPath('/api/vendorscore/sweep', 'POST'), 'crudops skips thickened vendorscore');
assert(!isCrudOpsPath('/api/vendorscore/flag/ack', 'POST'), 'crudops skips vendorscore ack');
assert(!isCrudOpsPath('/api/campusbrief/sweep', 'POST'), 'crudops skips thickened campusbrief');
assert(!isCrudOpsPath('/api/campusbrief/flag/ack', 'POST'), 'crudops skips campusbrief ack');
assert(!isCrudOpsPath('/api/contracts/sweep', 'POST'), 'crudops skips thickened contracts');
assert(!isCrudOpsPath('/api/contracts/flag/ack', 'POST'), 'crudops skips contracts ack');
assert(!isCrudOpsPath('/api/delivery/sweep', 'POST'), 'crudops skips thickened delivery');
assert(!isCrudOpsPath('/api/delivery/flag/ack', 'POST'), 'crudops skips delivery ack');
assert(!isCrudOpsPath('/api/giftcards/sweep', 'POST'), 'crudops skips thickened giftcards');
assert(!isCrudOpsPath('/api/giftcards/flag/ack', 'POST'), 'crudops skips giftcards ack');
assert(!isCrudOpsPath('/api/laundry/sweep', 'POST'), 'crudops skips thickened laundry');
assert(!isCrudOpsPath('/api/laundry/flag/ack', 'POST'), 'crudops skips laundry ack');
assert(!isCrudOpsPath('/api/cleaning/sweep', 'POST'), 'crudops skips thickened cleaning');
assert(!isCrudOpsPath('/api/cleaning/flag/ack', 'POST'), 'crudops skips cleaning ack');
assert(!isCrudOpsPath('/api/emergency/sweep', 'POST'), 'crudops skips thickened emergency');
assert(!isCrudOpsPath('/api/emergency/flag/ack', 'POST'), 'crudops skips emergency ack');
assert(!isCrudOpsPath('/api/folio/sweep', 'POST'), 'crudops skips thickened folio');
assert(!isCrudOpsPath('/api/folio/flag/ack', 'POST'), 'crudops skips folio ack');
assert(!isCrudOpsPath('/api/roomstatus/sweep', 'POST'), 'crudops skips thickened roomstatus');
assert(!isCrudOpsPath('/api/roomstatus/flag/ack', 'POST'), 'crudops skips roomstatus ack');
assert(!isCrudOpsPath('/api/minibar/sweep', 'POST'), 'crudops skips thickened minibar');
assert(!isCrudOpsPath('/api/minibar/flag/ack', 'POST'), 'crudops skips minibar ack');
assert(!isCrudOpsPath('/api/transfers/sweep', 'POST'), 'crudops skips thickened transfers');
assert(!isCrudOpsPath('/api/transfers/flag/ack', 'POST'), 'crudops skips transfers ack');
assert(!isCrudOpsPath('/api/concierge/sweep', 'POST'), 'crudops skips thickened concierge');
assert(!isCrudOpsPath('/api/concierge/flag/ack', 'POST'), 'crudops skips concierge ack');
assert(!isCrudOpsPath('/api/shuttle/sweep', 'POST'), 'crudops skips thickened shuttle');
assert(!isCrudOpsPath('/api/shuttle/flag/ack', 'POST'), 'crudops skips shuttle ack');
assert(!isCrudOpsPath('/api/wifi/sweep', 'POST'), 'crudops skips thickened wifi');
assert(!isCrudOpsPath('/api/wifi/flag/ack', 'POST'), 'crudops skips wifi ack');
assert(!isCrudOpsPath('/api/kds/sweep', 'POST'), 'crudops skips thickened kds');
assert(!isCrudOpsPath('/api/kds/flag/ack', 'POST'), 'crudops skips kds ack');
assert(!isCrudOpsPath('/api/budget/sweep', 'POST'), 'crudops skips thickened budget');
assert(!isCrudOpsPath('/api/budget/flag/ack', 'POST'), 'crudops skips budget ack');
assert(!isCrudOpsPath('/api/eventcal/sweep', 'POST'), 'crudops skips thickened eventcal');
assert(!isCrudOpsPath('/api/eventcal/flag/ack', 'POST'), 'crudops skips eventcal ack');
assert(!isCrudOpsPath('/api/keycards/sweep', 'POST'), 'crudops skips thickened keycards');
assert(!isCrudOpsPath('/api/keycards/flag/ack', 'POST'), 'crudops skips keycards ack');
assert(!isCrudOpsPath('/api/parcels/sweep', 'POST'), 'crudops skips thickened parcels');
assert(!isCrudOpsPath('/api/parcels/flag/ack', 'POST'), 'crudops skips parcels ack');
assert(!isCrudOpsPath('/api/wakeups/sweep', 'POST'), 'crudops skips thickened wakeups');
assert(!isCrudOpsPath('/api/wakeups/flag/ack', 'POST'), 'crudops skips wakeups ack');
assert(!isCrudOpsPath('/api/upsell/sweep', 'POST'), 'crudops skips thickened upsell');
assert(!isCrudOpsPath('/api/upsell/flag/ack', 'POST'), 'crudops skips upsell ack');
assert(!isCrudOpsPath('/api/breakfast/sweep', 'POST'), 'crudops skips thickened breakfast');
assert(!isCrudOpsPath('/api/breakfast/flag/ack', 'POST'), 'crudops skips breakfast ack');
assert(!isCrudOpsPath('/api/banquet/sweep', 'POST'), 'crudops skips thickened banquet');
assert(!isCrudOpsPath('/api/banquet/flag/ack', 'POST'), 'crudops skips banquet ack');
assert(!isCrudOpsPath('/api/beachbeds/sweep', 'POST'), 'crudops skips thickened beachbeds');
assert(!isCrudOpsPath('/api/beachbeds/flag/ack', 'POST'), 'crudops skips beachbeds ack');
assert(!isCrudOpsPath('/api/marina/sweep', 'POST'), 'crudops skips thickened marina');
assert(!isCrudOpsPath('/api/marina/flag/ack', 'POST'), 'crudops skips marina ack');
assert(!isCrudOpsPath('/api/hammam/sweep', 'POST'), 'crudops skips thickened hammam');
assert(!isCrudOpsPath('/api/hammam/flag/ack', 'POST'), 'crudops skips hammam ack');
assert(!isCrudOpsPath('/api/dive/sweep', 'POST'), 'crudops skips thickened dive');
assert(!isCrudOpsPath('/api/dive/flag/ack', 'POST'), 'crudops skips dive ack');
assert(!isCrudOpsPath('/api/meetingrooms/sweep', 'POST'), 'crudops skips thickened meetingrooms');
assert(!isCrudOpsPath('/api/meetingrooms/flag/ack', 'POST'), 'crudops skips meetingrooms ack');
assert(!isCrudOpsPath('/api/retail/sweep', 'POST'), 'crudops skips thickened retail');
assert(!isCrudOpsPath('/api/retail/flag/ack', 'POST'), 'crudops skips retail ack');
assert(!isCrudOpsPath('/api/tours/sweep', 'POST'), 'crudops skips thickened tours');
assert(!isCrudOpsPath('/api/tours/flag/ack', 'POST'), 'crudops skips tours ack');
assert(!isCrudOpsPath('/api/privatechef/sweep', 'POST'), 'crudops skips thickened privatechef');
assert(!isCrudOpsPath('/api/privatechef/flag/ack', 'POST'), 'crudops skips privatechef ack');
assert(!isCrudOpsPath('/api/qrcheckin/sweep', 'POST'), 'crudops skips thickened qrcheckin');
assert(!isCrudOpsPath('/api/qrcheckin/flag/ack', 'POST'), 'crudops skips qrcheckin ack');
assert(!isCrudOpsPath('/api/patrol/sweep', 'POST'), 'crudops skips thickened patrol');
assert(!isCrudOpsPath('/api/patrol/flag/ack', 'POST'), 'crudops skips patrol ack');
assert(!isCrudOpsPath('/api/hours/sweep', 'POST'), 'crudops skips thickened hours');
assert(!isCrudOpsPath('/api/consents/sweep', 'POST'), 'crudops skips thickened consents');
assert(!isCrudOpsPath('/api/guests/sweep', 'POST'), 'crudops skips thickened guests');
assert(!isCrudOpsPath('/api/loyalty/sweep', 'POST'), 'crudops skips thickened loyalty');
for (const name of ['carbonlog', 'fxrates', 'handbook', 'yieldrule', 'accessreview']) {
  // eslint-disable-next-line no-await-in-loop
  assert((await runCrudDomainSweep(name, { force: true }, 'smoke')).ok, `crudops sweep ${name}`);
  assert((await advanceCrudDomain(name, {}, 'smoke')).ok, `crudops advance ${name}`);
  assert((await healCrudDomain(name, {}, 'smoke')).ok, `crudops heal ${name}`);
  assert((await seedCrudDomain(name, {}, 'smoke')).ok, `crudops seed ${name}`);
  assert((await ackCrudDomainFlag(name, {}, 'smoke')).ok, `crudops ack ${name}`);
}
console.log('CRUDOPS_OK', crudDomains.length);

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
