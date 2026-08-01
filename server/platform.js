/**
 * AŞAMA 4–5 — Platform API: auth + arşiv + hub + ayarlar + audit
 */

import {
  login,
  logout,
  sessionFromToken,
  listDemoUsers,
  ROLE_PAGES,
  setActiveBrand,
} from './auth.js';
import {
  readCollection,
  writeCollection,
  prependItem,
  deleteItem,
  clearCollection,
} from './store.js';
import { appendAudit, readAudit } from './audit.js';
import { applySettingsToEnv, getPublicSettings, saveSettings } from './settings.js';
import {
  cancelJob,
  claimDirective,
  createJob,
  deleteJob,
  getJob,
  jobsSummary,
  listJobs,
  runJob,
  startJobTicker,
  tickJobs,
} from './jobs.js';
import { addSseClient, sseClientCount } from './events.js';
import { buildOpsReport, reportToMarkdown } from './report.js';
import {
  createVenue,
  getVenue,
  listVenues,
  removeVenue,
  updateVenue,
  venuesSummary,
} from './venues.js';
import { createBackup, healthCheck, listDataFiles, restoreBackup } from './ops.js';
import {
  listNotifications,
  markAllRead,
  markRead,
  unreadCount,
} from './notifications.js';
import {
  admitPass,
  listAccessEvents,
  listGates,
  listHolders,
  passStats,
  verifyPass,
} from './pass.js';
import { buildMetrics } from './metrics.js';
import {
  brandsForRole,
  brandsSummary,
  createBrand,
  getBrand,
  listBrands,
  removeBrand,
  updateBrand,
} from './brands.js';
import {
  getGuest,
  guestTimeline,
  guestsSummary,
  listGuests,
  syncGuestsFromSources,
  upsertGuest,
} from './guests.js';
import { createPlaybook, listPlaybooks, removePlaybook } from './playbooks.js';
import {
  createWebhook,
  listDeliveries,
  listWebhooks,
  removeWebhook,
} from './webhooks.js';
import { buildOpenApi } from './openapi.js';
import { adjustStock, inventorySummary, listInventory } from './inventory.js';
import {
  createShift,
  listShifts,
  removeShift,
  shiftsSummary,
  updateShift,
} from './shifts.js';
import {
  createReservation,
  listReservations,
  removeReservation,
  reservationsSummary,
  updateReservation,
} from './reservations.js';
import {
  adjustPoints,
  listLedger,
  listLoyaltyAccounts,
  loyaltySummary,
} from './loyalty.js';
import {
  ackIncident,
  createIncident,
  incidentsSummary,
  listIncidents,
} from './incidents.js';
import {
  createPurchaseOrder,
  createSupplier,
  listPurchaseOrders,
  listSuppliers,
  receivePurchaseOrder,
  removePurchaseOrder,
  suppliersSummary,
  updatePurchaseOrder,
} from './suppliers.js';
import { createFeedback, feedbackSummary, listFeedback } from './feedback.js';
import { buildExport, listExportCatalog } from './exports.js';
import { consentSummary, listConsents, recordConsent } from './consent.js';
import {
  announcementsSummary,
  createAnnouncement,
  listAnnouncements,
  removeAnnouncement,
  updateAnnouncement,
} from './announcements.js';
import {
  cookRecipe,
  createRecipe,
  listRecipes,
  recipesSummary,
  removeRecipe,
  updateRecipe,
} from './recipes.js';
import {
  checklistsSummary,
  listChecklistRuns,
  listChecklistTemplates,
  startChecklistRun,
  toggleChecklistItem,
} from './checklists.js';
import {
  createLostFound,
  listLostFound,
  lostFoundSummary,
  updateLostFound,
} from './lostfound.js';
import { addTip, tipSummary } from './tips.js';
import {
  createTicket,
  listMaintenance,
  maintenanceSummary,
  updateTicket,
} from './maintenance.js';
import { buildDailyBrief } from './brief.js';
import {
  createMenuItem,
  listMenu,
  menuSummary,
  removeMenuItem,
  updateMenuItem,
} from './menu.js';
import {
  campaignsSummary,
  createCampaign,
  listCampaigns,
  removeCampaign,
  updateCampaign,
} from './campaigns.js';
import {
  i18nSummary,
  listI18nNotes,
  removeI18nNote,
  upsertI18nNote,
} from './i18nNotes.js';
import {
  coldchainSummary,
  listColdAssets,
  listColdReadings,
  logColdReading,
} from './coldchain.js';
import { createHandover, handoverSummary, listHandover } from './handover.js';
import { cashSummary, postCash } from './cash.js';
import {
  assetsSummary,
  createAsset,
  listAssets,
  updateAsset,
} from './assets.js';
import {
  energySummary,
  listEnergyReadings,
  listMeters,
  logEnergyReading,
} from './energy.js';
import {
  getQuiz,
  listAttempts,
  listQuizzes,
  submitAttempt,
  trainingSummary,
} from './training.js';
import {
  createValet,
  listValet,
  updateValet,
  valetSummary,
} from './valet.js';
import {
  createMusicRequest,
  listMusic,
  musicSummary,
  updateMusicRequest,
} from './music.js';
import {
  createDocument,
  documentsSummary,
  listDocuments,
  removeDocument,
} from './documents.js';
import {
  listVendorScores,
  upsertVendorScore,
  vendorScoreSummary,
} from './vendorscore.js';
import { listWaste, logWaste, wasteSummary } from './waste.js';
import {
  createSeat,
  listSeating,
  seatingSummary,
  updateSeat,
} from './seating.js';
import {
  createWaitlistEntry,
  listWaitlist,
  updateWaitlist,
  waitlistSummary,
} from './waitlist.js';
import {
  complaintsSummary,
  createComplaint,
  listComplaints,
  updateComplaint,
} from './complaints.js';
import { createKudos, kudosSummary, listKudos } from './kudos.js';
import { hoursSummary, listHours, updateHours } from './hours.js';
import { buildWeatherBrief, refreshWeather } from './weather.js';
import { buildReadiness } from './readiness.js';

import {
  createSpa, listSpa, spaSummary, updateSpa,
} from './spa.js';
import {
  createEventcal, eventcalSummary, listEventcal, updateEventcal,
} from './eventcal.js';
import {
  createGiftcards, giftcardsSummary, listGiftcards, updateGiftcards,
} from './giftcards.js';
import {
  createDelivery, deliverySummary, listDelivery, updateDelivery,
} from './delivery.js';
import {
  cleaningSummary, createCleaning, listCleaning, updateCleaning,
} from './cleaning.js';
import {
  createLaundry, laundrySummary, listLaundry, updateLaundry,
} from './laundry.js';
import {
  createWifi, listWifi, updateWifi, wifiSummary,
} from './wifi.js';
import {
  contentSummary, createContent, listContent, updateContent,
} from './content.js';
import {
  createPulse, listPulse, pulseSummary, updatePulse,
} from './pulse.js';
import {
  budgetSummary, createBudget, listBudget, updateBudget,
} from './budget.js';
import {
  contractsSummary, createContracts, listContracts, updateContracts,
} from './contracts.js';
import {
  createPassstock, listPassstock, passstockSummary, updatePassstock,
} from './passstock.js';
import {
  createKds, kdsSummary, listKds, updateKds,
} from './kds.js';
import {
  createEmergency, emergencySummary, listEmergency, updateEmergency,
} from './emergency.js';
import { buildDigest } from './digest.js';
import {
  createLockers,
  listLockers,
  lockersSummary,
  updateLockers,
} from './lockers.js';
import {
  createKidsclub,
  listKidsclub,
  kidsclubSummary,
  updateKidsclub,
} from './kidsclub.js';
import {
  createBeachbeds,
  listBeachbeds,
  beachbedsSummary,
  updateBeachbeds,
} from './beachbeds.js';
import {
  createTransfers,
  listTransfers,
  transfersSummary,
  updateTransfers,
} from './transfers.js';
import {
  createBadgeprint,
  listBadgeprint,
  badgeprintSummary,
  updateBadgeprint,
} from './badgeprint.js';
import {
  createMeetingrooms,
  listMeetingrooms,
  meetingroomsSummary,
  updateMeetingrooms,
} from './meetingrooms.js';
import {
  createMediakit,
  listMediakit,
  mediakitSummary,
  updateMediakit,
} from './mediakit.js';
import {
  createSustain,
  listSustain,
  sustainSummary,
  updateSustain,
} from './sustain.js';
import {
  createAllergens,
  listAllergens,
  allergensSummary,
  updateAllergens,
} from './allergens.js';
import {
  createWinecellar,
  listWinecellar,
  winecellarSummary,
  updateWinecellar,
} from './winecellar.js';
import {
  createLounge,
  listLounge,
  loungeSummary,
  updateLounge,
} from './lounge.js';
import {
  createShuttle,
  listShuttle,
  shuttleSummary,
  updateShuttle,
} from './shuttle.js';
import {
  createPartners,
  listPartners,
  partnersSummary,
  updatePartners,
} from './partners.js';
import {
  createMysteryshop,
  listMysteryshop,
  mysteryshopSummary,
  updateMysteryshop,
} from './mysteryshop.js';
import { buildBoardpack } from './boardpack.js';
import {
  createConcierge,
  listConcierge,
  conciergeSummary,
  updateConcierge,
} from './concierge.js';
import {
  createMinibar,
  listMinibar,
  minibarSummary,
  updateMinibar,
} from './minibar.js';
import {
  createFolio,
  listFolio,
  folioSummary,
  updateFolio,
} from './folio.js';
import {
  createBanquet,
  listBanquet,
  banquetSummary,
  updateBanquet,
} from './banquet.js';
import {
  createTours,
  listTours,
  toursSummary,
  updateTours,
} from './tours.js';
import {
  createMarina,
  listMarina,
  marinaSummary,
  updateMarina,
} from './marina.js';
import {
  createHammam,
  listHammam,
  hammamSummary,
  updateHammam,
} from './hammam.js';
import {
  createTowels,
  listTowels,
  towelsSummary,
  updateTowels,
} from './towels.js';
import {
  createBands,
  listBands,
  bandsSummary,
  updateBands,
} from './bands.js';
import {
  createHaccp,
  listHaccp,
  haccpSummary,
  updateHaccp,
} from './haccp.js';
import {
  createPatrol,
  listPatrol,
  patrolSummary,
  updatePatrol,
} from './patrol.js';
import {
  createFleet,
  listFleet,
  fleetSummary,
  updateFleet,
} from './fleet.js';
import {
  createPayroll,
  listPayroll,
  payrollSummary,
  updatePayroll,
} from './payroll.js';
import {
  createFlash,
  listFlash,
  flashSummary,
  updateFlash,
} from './flash.js';
import { buildWarroom } from './warroom.js';
import {
  createUpsell,
  listUpsell,
  upsellSummary,
  updateUpsell,
} from './upsell.js';
import {
  createOtareviews,
  listOtareviews,
  otareviewsSummary,
  updateOtareviews,
} from './otareviews.js';
import {
  createGroups,
  listGroups,
  groupsSummary,
  updateGroups,
} from './groups.js';
import {
  createVipnotes,
  listVipnotes,
  vipnotesSummary,
  updateVipnotes,
} from './vipnotes.js';
import {
  createPhotoshoot,
  listPhotoshoot,
  photoshootSummary,
  updatePhotoshoot,
} from './photoshoot.js';
import {
  createDive,
  listDive,
  diveSummary,
  updateDive,
} from './dive.js';
import {
  createBikerent,
  listBikerent,
  bikerentSummary,
  updateBikerent,
} from './bikerent.js';
import {
  createCinema,
  listCinema,
  cinemaSummary,
  updateCinema,
} from './cinema.js';
import {
  createRetail,
  listRetail,
  retailSummary,
  updateRetail,
} from './retail.js';
import {
  createBakery,
  listBakery,
  bakerySummary,
  updateBakery,
} from './bakery.js';
import {
  createBreakfast,
  listBreakfast,
  breakfastSummary,
  updateBreakfast,
} from './breakfast.js';
import {
  createLateout,
  listLateout,
  lateoutSummary,
  updateLateout,
} from './lateout.js';
import {
  createAmenities,
  listAmenities,
  amenitiesSummary,
  updateAmenities,
} from './amenities.js';
import {
  createNightlog,
  listNightlog,
  nightlogSummary,
  updateNightlog,
} from './nightlog.js';
import { buildNightly } from './nightly.js';
import {
  createKeycards,
  listKeycards,
  keycardsSummary,
  updateKeycards,
} from './keycards.js';
import {
  createRoomstatus,
  listRoomstatus,
  roomstatusSummary,
  updateRoomstatus,
} from './roomstatus.js';
import {
  createBedding,
  listBedding,
  beddingSummary,
  updateBedding,
} from './bedding.js';
import {
  createWakeups,
  listWakeups,
  wakeupsSummary,
  updateWakeups,
} from './wakeups.js';
import {
  createParcels,
  listParcels,
  parcelsSummary,
  updateParcels,
} from './parcels.js';
import {
  createQrcheckin,
  listQrcheckin,
  qrcheckinSummary,
  updateQrcheckin,
} from './qrcheckin.js';
import {
  createGuestapp,
  listGuestapp,
  guestappSummary,
  updateGuestapp,
} from './guestapp.js';
import {
  createKaraoke,
  listKaraoke,
  karaokeSummary,
  updateKaraoke,
} from './karaoke.js';
import {
  createArtwall,
  listArtwall,
  artwallSummary,
  updateArtwall,
} from './artwall.js';
import {
  createFlorals,
  listFlorals,
  floralsSummary,
  updateFlorals,
} from './florals.js';
import {
  createPrivatechef,
  listPrivatechef,
  privatechefSummary,
  updatePrivatechef,
} from './privatechef.js';
import {
  createMocktails,
  listMocktails,
  mocktailsSummary,
  updateMocktails,
} from './mocktails.js';
import {
  createPromos,
  listPromos,
  promosSummary,
  updatePromos,
} from './promos.js';
import {
  createDawnservice,
  listDawnservice,
  dawnserviceSummary,
  updateDawnservice,
} from './dawnservice.js';
import { buildOrbit } from './orbit.js';
import {
  createRosters,
  listRosters,
  rostersSummary,
  updateRosters,
} from './rosters.js';
import {
  createOvertime,
  listOvertime,
  overtimeSummary,
  updateOvertime,
} from './overtime.js';
import {
  createUniforms,
  listUniforms,
  uniformsSummary,
  updateUniforms,
} from './uniforms.js';
import {
  createHealthcards,
  listHealthcards,
  healthcardsSummary,
  updateHealthcards,
} from './healthcards.js';
import {
  createVisitors,
  listVisitors,
  visitorsSummary,
  updateVisitors,
} from './visitors.js';
import {
  createCctvlog,
  listCctvlog,
  cctvlogSummary,
  updateCctvlog,
} from './cctvlog.js';
import {
  createFiredrill,
  listFiredrill,
  firedrillSummary,
  updateFiredrill,
} from './firedrill.js';
import {
  createInsurance,
  listInsurance,
  insuranceSummary,
  updateInsurance,
} from './insurance.js';
import {
  createInvoices,
  listInvoices,
  invoicesSummary,
  updateInvoices,
} from './invoices.js';
import {
  createTaxpack,
  listTaxpack,
  taxpackSummary,
  updateTaxpack,
} from './taxpack.js';
import {
  createForecast,
  listForecast,
  forecastSummary,
  updateForecast,
} from './forecast.js';
import {
  createCapex,
  listCapex,
  capexSummary,
  updateCapex,
} from './capex.js';
import {
  createLicenses,
  listLicenses,
  licensesSummary,
  updateLicenses,
} from './licenses.js';
import {
  createSlabreaches,
  listSlabreaches,
  slabreachesSummary,
  updateSlabreaches,
} from './slabreaches.js';
import { buildApex } from './apex.js';
import {
  createExtlinks,
  listExtlinks,
  extlinksSummary,
  updateExtlinks,
} from './extlinks.js';
import {
  createApikeys,
  listApikeys,
  apikeysSummary,
  updateApikeys,
} from './apikeys.js';
import {
  createBackupsched,
  listBackupsched,
  backupschedSummary,
  updateBackupsched,
} from './backupsched.js';
import {
  createSysalerts,
  listSysalerts,
  sysalertsSummary,
  updateSysalerts,
} from './sysalerts.js';
import {
  createBugtracker,
  listBugtracker,
  bugtrackerSummary,
  updateBugtracker,
} from './bugtracker.js';
import {
  createReleasenotes,
  listReleasenotes,
  releasenotesSummary,
  updateReleasenotes,
} from './releasenotes.js';
import {
  createRunbooks,
  listRunbooks,
  runbooksSummary,
  updateRunbooks,
} from './runbooks.js';
import {
  createBiometrics,
  listBiometrics,
  biometricsSummary,
  updateBiometrics,
} from './biometrics.js';
import {
  createSecretsrot,
  listSecretsrot,
  secretsrotSummary,
  updateSecretsrot,
} from './secretsrot.js';
import {
  createDnscheck,
  listDnscheck,
  dnscheckSummary,
  updateDnscheck,
} from './dnscheck.js';
import {
  createMailqueue,
  listMailqueue,
  mailqueueSummary,
  updateMailqueue,
} from './mailqueue.js';
import {
  createSmsqueue,
  listSmsqueue,
  smsqueueSummary,
  updateSmsqueue,
} from './smsqueue.js';
import {
  createAlertrules,
  listAlertrules,
  alertrulesSummary,
  updateAlertrules,
} from './alertrules.js';
import {
  createEdgecache,
  listEdgecache,
  edgecacheSummary,
  updateEdgecache,
} from './edgecache.js';
import { buildPyramid } from './pyramid.js';
import {
  createSignage,
  listSignage,
  signageSummary,
  updateSignage,
} from './signage.js';
import {
  createWayfind,
  listWayfind,
  wayfindSummary,
  updateWayfind,
} from './wayfind.js';
import {
  createBeaconmap,
  listBeaconmap,
  beaconmapSummary,
  updateBeaconmap,
} from './beaconmap.js';
import {
  createIotgates,
  listIotgates,
  iotgatesSummary,
  updateIotgates,
} from './iotgates.js';
import {
  createPowerops,
  listPowerops,
  poweropsSummary,
  updatePowerops,
} from './powerops.js';
import {
  createWaterops,
  listWaterops,
  wateropsSummary,
  updateWaterops,
} from './waterops.js';
import {
  createGreenops,
  listGreenops,
  greenopsSummary,
  updateGreenops,
} from './greenops.js';
import {
  createPestctrl,
  listPestctrl,
  pestctrlSummary,
  updatePestctrl,
} from './pestctrl.js';
import {
  createChemlog,
  listChemlog,
  chemlogSummary,
  updateChemlog,
} from './chemlog.js';
import {
  createPoolops,
  listPoolops,
  poolopsSummary,
  updatePoolops,
} from './poolops.js';
import {
  createSaunaops,
  listSaunaops,
  saunaopsSummary,
  updateSaunaops,
} from './saunaops.js';
import {
  createSteamops,
  listSteamops,
  steamopsSummary,
  updateSteamops,
} from './steamops.js';
import {
  createIcebath,
  listIcebath,
  icebathSummary,
  updateIcebath,
} from './icebath.js';
import {
  createRecovslots,
  listRecovslots,
  recovslotsSummary,
  updateRecovslots,
} from './recovslots.js';
import { buildSignalhub } from './signalhub.js';
import {
  createHelipad,
  listHelipad,
  helipadSummary,
  updateHelipad,
} from './helipad.js';
import {
  createJetski,
  listJetski,
  jetskiSummary,
  updateJetski,
} from './jetski.js';
import {
  createYacht,
  listYacht,
  yachtSummary,
  updateYacht,
} from './yacht.js';
import {
  createSurfschool,
  listSurfschool,
  surfschoolSummary,
  updateSurfschool,
} from './surfschool.js';
import {
  createPaddle,
  listPaddle,
  paddleSummary,
  updatePaddle,
} from './paddle.js';
import {
  createClimwall,
  listClimwall,
  climwallSummary,
  updateClimwall,
} from './climwall.js';
import {
  createEscaperoom,
  listEscaperoom,
  escaperoomSummary,
  updateEscaperoom,
} from './escaperoom.js';
import {
  createArcade,
  listArcade,
  arcadeSummary,
  updateArcade,
} from './arcade.js';
import {
  createBowling,
  listBowling,
  bowlingSummary,
  updateBowling,
} from './bowling.js';
import {
  createBilliards,
  listBilliards,
  billiardsSummary,
  updateBilliards,
} from './billiards.js';
import {
  createPokertable,
  listPokertable,
  pokertableSummary,
  updatePokertable,
} from './pokertable.js';
import {
  createTrivia,
  listTrivia,
  triviaSummary,
  updateTrivia,
} from './trivia.js';
import {
  createDjbooth,
  listDjbooth,
  djboothSummary,
  updateDjbooth,
} from './djbooth.js';
import {
  createSoundcheck,
  listSoundcheck,
  soundcheckSummary,
  updateSoundcheck,
} from './soundcheck.js';
import { buildSkyline } from './skyline.js';
import {
  createCrowddens,
  listCrowddens,
  crowddensSummary,
  updateCrowddens,
} from './crowddens.js';
import {
  createQueuetimes,
  listQueuetimes,
  queuetimesSummary,
  updateQueuetimes,
} from './queuetimes.js';
import {
  createLostchild,
  listLostchild,
  lostchildSummary,
  updateLostchild,
} from './lostchild.js';
import {
  createFirstaid,
  listFirstaid,
  firstaidSummary,
  updateFirstaid,
} from './firstaid.js';
import {
  createAedcheck,
  listAedcheck,
  aedcheckSummary,
  updateAedcheck,
} from './aedcheck.js';
import {
  createEvacdrill,
  listEvacdrill,
  evacdrillSummary,
  updateEvacdrill,
} from './evacdrill.js';
import {
  createCrowdctrl,
  listCrowdctrl,
  crowdctrlSummary,
  updateCrowdctrl,
} from './crowdctrl.js';
import {
  createRadiolog,
  listRadiolog,
  radiologSummary,
  updateRadiolog,
} from './radiolog.js';
import {
  createGatequeue,
  listGatequeue,
  gatequeueSummary,
  updateGatequeue,
} from './gatequeue.js';
import {
  createWristscan,
  listWristscan,
  wristscanSummary,
  updateWristscan,
} from './wristscan.js';
import {
  createFacepass,
  listFacepass,
  facepassSummary,
  updateFacepass,
} from './facepass.js';
import {
  createBagcheck,
  listBagcheck,
  bagcheckSummary,
  updateBagcheck,
} from './bagcheck.js';
import {
  createMetaldet,
  listMetaldet,
  metaldetSummary,
  updateMetaldet,
} from './metaldet.js';
import {
  createWatchlist,
  listWatchlist,
  watchlistSummary,
  updateWatchlist,
} from './watchlist.js';
import { buildSentinel } from './sentinel.js';
import {
  createMenuboard,
  listMenuboard,
  menuboardSummary,
  updateMenuboard,
} from './menuboard.js';
import {
  createAllergenalert,
  listAllergenalert,
  allergenalertSummary,
  updateAllergenalert,
} from './allergenalert.js';
import {
  createTempprobe,
  listTempprobe,
  tempprobeSummary,
  updateTempprobe,
} from './tempprobe.js';
import {
  createPrepqueue,
  listPrepqueue,
  prepqueueSummary,
  updatePrepqueue,
} from './prepqueue.js';
import {
  createVoidlog,
  listVoidlog,
  voidlogSummary,
  updateVoidlog,
} from './voidlog.js';
import {
  createComps,
  listComps,
  compsSummary,
  updateComps,
} from './comps.js';
import {
  createSplitbill,
  listSplitbill,
  splitbillSummary,
  updateSplitbill,
} from './splitbill.js';
import {
  createTabopen,
  listTabopen,
  tabopenSummary,
  updateTabopen,
} from './tabopen.js';
import {
  createCorkage,
  listCorkage,
  corkageSummary,
  updateCorkage,
} from './corkage.js';
import {
  createSommelier,
  listSommelier,
  sommelierSummary,
  updateSommelier,
} from './sommelier.js';
import {
  createChefnote,
  listChefnote,
  chefnoteSummary,
  updateChefnote,
} from './chefnote.js';
import {
  createPassticket,
  listPassticket,
  passticketSummary,
  updatePassticket,
} from './passticket.js';
import {
  createZoneheat,
  listZoneheat,
  zoneheatSummary,
  updateZoneheat,
} from './zoneheat.js';
import {
  createRevpulse,
  listRevpulse,
  revpulseSummary,
  updateRevpulse,
} from './revpulse.js';
import { buildHorizon } from './horizon.js';
import {
  createStayext,
  listStayext,
  stayextSummary,
  updateStayext,
} from './stayext.js';
import {
  createRoommove,
  listRoommove,
  roommoveSummary,
  updateRoommove,
} from './roommove.js';
import {
  createEarlyin,
  listEarlyin,
  earlyinSummary,
  updateEarlyin,
} from './earlyin.js';
import {
  createLuggage,
  listLuggage,
  luggageSummary,
  updateLuggage,
} from './luggage.js';
import {
  createTurndown,
  listTurndown,
  turndownSummary,
  updateTurndown,
} from './turndown.js';
import {
  createPillowmenu,
  listPillowmenu,
  pillowmenuSummary,
  updatePillowmenu,
} from './pillowmenu.js';
import {
  createScenting,
  listScenting,
  scentingSummary,
  updateScenting,
} from './scenting.js';
import {
  createDndflags,
  listDndflags,
  dndflagsSummary,
  updateDndflags,
} from './dndflags.js';
import {
  createBathstock,
  listBathstock,
  bathstockSummary,
  updateBathstock,
} from './bathstock.js';
import {
  createIronreq,
  listIronreq,
  ironreqSummary,
  updateIronreq,
} from './ironreq.js';
import {
  createPressing,
  listPressing,
  pressingSummary,
  updatePressing,
} from './pressing.js';
import {
  createShoeshine,
  listShoeshine,
  shoeshineSummary,
  updateShoeshine,
} from './shoeshine.js';
import {
  createBabycot,
  listBabycot,
  babycotSummary,
  updateBabycot,
} from './babycot.js';
import {
  createPetstay,
  listPetstay,
  petstaySummary,
  updatePetstay,
} from './petstay.js';
import { buildMeridian } from './meridian.js';
import {
  createArbill,
  listArbill,
  arbillSummary,
  updateArbill,
} from './arbill.js';
import {
  createApbill,
  listApbill,
  apbillSummary,
  updateApbill,
} from './apbill.js';
import {
  createBankrec,
  listBankrec,
  bankrecSummary,
  updateBankrec,
} from './bankrec.js';
import {
  createFxrates,
  listFxrates,
  fxratesSummary,
  updateFxrates,
} from './fxrates.js';
import {
  createTipout,
  listTipout,
  tipoutSummary,
  updateTipout,
} from './tipout.js';
import {
  createDeposit,
  listDeposit,
  depositSummary,
  updateDeposit,
} from './deposit.js';
import {
  createRefunds,
  listRefunds,
  refundsSummary,
  updateRefunds,
} from './refunds.js';
import {
  createChargeback,
  listChargeback,
  chargebackSummary,
  updateChargeback,
} from './chargeback.js';
import {
  createGiftred,
  listGiftred,
  giftredSummary,
  updateGiftred,
} from './giftred.js';
import {
  createMemberbill,
  listMemberbill,
  memberbillSummary,
  updateMemberbill,
} from './memberbill.js';
import {
  createRateplan,
  listRateplan,
  rateplanSummary,
  updateRateplan,
} from './rateplan.js';
import {
  createChannelmgr,
  listChannelmgr,
  channelmgrSummary,
  updateChannelmgr,
} from './channelmgr.js';
import {
  createOverbook,
  listOverbook,
  overbookSummary,
  updateOverbook,
} from './overbook.js';
import {
  createYieldrule,
  listYieldrule,
  yieldruleSummary,
  updateYieldrule,
} from './yieldrule.js';
import { buildLedger } from './ledger.js';
import {
  createOnboarding,
  listOnboarding,
  onboardingSummary,
  updateOnboarding,
} from './onboarding.js';
import {
  createOffboarding,
  listOffboarding,
  offboardingSummary,
  updateOffboarding,
} from './offboarding.js';
import {
  createInterviews,
  listInterviews,
  interviewsSummary,
  updateInterviews,
} from './interviews.js';
import {
  createCertifications,
  listCertifications,
  certificationsSummary,
  updateCertifications,
} from './certifications.js';
import {
  createLangskill,
  listLangskill,
  langskillSummary,
  updateLangskill,
} from './langskill.js';
import {
  createShiftswap,
  listShiftswap,
  shiftswapSummary,
  updateShiftswap,
} from './shiftswap.js';
import {
  createLeaverequest,
  listLeaverequest,
  leaverequestSummary,
  updateLeaverequest,
} from './leaverequest.js';
import {
  createAttendance,
  listAttendance,
  attendanceSummary,
  updateAttendance,
} from './attendance.js';
import {
  createPerformance,
  listPerformance,
  performanceSummary,
  updatePerformance,
} from './performance.js';
import {
  createRecognition,
  listRecognition,
  recognitionSummary,
  updateRecognition,
} from './recognition.js';
import {
  createHandbook,
  listHandbook,
  handbookSummary,
  updateHandbook,
} from './handbook.js';
import {
  createSafetybrief,
  listSafetybrief,
  safetybriefSummary,
  updateSafetybrief,
} from './safetybrief.js';
import {
  createNearmiss,
  listNearmiss,
  nearmissSummary,
  updateNearmiss,
} from './nearmiss.js';
import {
  createWhistle,
  listWhistle,
  whistleSummary,
  updateWhistle,
} from './whistle.js';
import { buildPeoplehub } from './peoplehub.js';
import {
  createCarbonlog,
  listCarbonlog,
  carbonlogSummary,
  updateCarbonlog,
} from './carbonlog.js';
import {
  createWateraudit,
  listWateraudit,
  waterauditSummary,
  updateWateraudit,
} from './wateraudit.js';
import {
  createAirquality,
  listAirquality,
  airqualitySummary,
  updateAirquality,
} from './airquality.js';
import {
  createSolarops,
  listSolarops,
  solaropsSummary,
  updateSolarops,
} from './solarops.js';
import {
  createBiodiversity,
  listBiodiversity,
  biodiversitySummary,
  updateBiodiversity,
} from './biodiversity.js';
import {
  createRecycling,
  listRecycling,
  recyclingSummary,
  updateRecycling,
} from './recycling.js';
import {
  createGreencert,
  listGreencert,
  greencertSummary,
  updateGreencert,
} from './greencert.js';
import {
  createAuditfind,
  listAuditfind,
  auditfindSummary,
  updateAuditfind,
} from './auditfind.js';
import {
  createPolicyack,
  listPolicyack,
  policyackSummary,
  updatePolicyack,
} from './policyack.js';
import {
  createDataprotect,
  listDataprotect,
  dataprotectSummary,
  updateDataprotect,
} from './dataprotect.js';
import {
  createRetention,
  listRetention,
  retentionSummary,
  updateRetention,
} from './retention.js';
import {
  createAccessreview,
  listAccessreview,
  accessreviewSummary,
  updateAccessreview,
} from './accessreview.js';
import {
  createVendorrisk,
  listVendorrisk,
  vendorriskSummary,
  updateVendorrisk,
} from './vendorrisk.js';
import {
  createLegalhold,
  listLegalhold,
  legalholdSummary,
  updateLegalhold,
} from './legalhold.js';
import { buildEcosphere } from './ecosphere.js';
import {
  createPresskit,
  listPresskit,
  presskitSummary,
  updatePresskit,
} from './presskit.js';
import {
  createInfluencer,
  listInfluencer,
  influencerSummary,
  updateInfluencer,
} from './influencer.js';
import {
  createUgcmod,
  listUgcmod,
  ugcmodSummary,
  updateUgcmod,
} from './ugcmod.js';
import {
  createSeoaudit,
  listSeoaudit,
  seoauditSummary,
  updateSeoaudit,
} from './seoaudit.js';
import {
  createAdspend,
  listAdspend,
  adspendSummary,
  updateAdspend,
} from './adspend.js';
import {
  createBrandguard,
  listBrandguard,
  brandguardSummary,
  updateBrandguard,
} from './brandguard.js';
import {
  createStoryboard,
  listStoryboard,
  storyboardSummary,
  updateStoryboard,
} from './storyboard.js';
import {
  createLivestream,
  listLivestream,
  livestreamSummary,
  updateLivestream,
} from './livestream.js';
import {
  createPodcastshow,
  listPodcastshow,
  podcastshowSummary,
  updatePodcastshow,
} from './podcastshow.js';
import {
  createNewsletter,
  listNewsletter,
  newsletterSummary,
  updateNewsletter,
} from './newsletter.js';
import {
  createTagmap,
  listTagmap,
  tagmapSummary,
  updateTagmap,
} from './tagmap.js';
import {
  createSocialinbox,
  listSocialinbox,
  socialinboxSummary,
  updateSocialinbox,
} from './socialinbox.js';
import {
  createMediaembargo,
  listMediaembargo,
  mediaembargoSummary,
  updateMediaembargo,
} from './mediaembargo.js';
import {
  createCreativereq,
  listCreativereq,
  creativereqSummary,
  updateCreativereq,
} from './creativereq.js';
import { buildBrandpulse } from './brandpulse.js';
import {
  createModelops,
  listModelops,
  modelopsSummary,
  updateModelops,
} from './modelops.js';
import {
  createPromptlib,
  listPromptlib,
  promptlibSummary,
  updatePromptlib,
} from './promptlib.js';
import {
  createAgenteval,
  listAgenteval,
  agentevalSummary,
  updateAgenteval,
} from './agenteval.js';
import {
  createTokenbudget,
  listTokenbudget,
  tokenbudgetSummary,
  updateTokenbudget,
} from './tokenbudget.js';
import {
  createRagindex,
  listRagindex,
  ragindexSummary,
  updateRagindex,
} from './ragindex.js';
import {
  createToolpermit,
  listToolpermit,
  toolpermitSummary,
  updateToolpermit,
} from './toolpermit.js';
import {
  createSandboxrun,
  listSandboxrun,
  sandboxrunSummary,
  updateSandboxrun,
} from './sandboxrun.js';
import {
  createHallucheck,
  listHallucheck,
  hallucheckSummary,
  updateHallucheck,
} from './hallucheck.js';
import {
  createDatasetcur,
  listDatasetcur,
  datasetcurSummary,
  updateDatasetcur,
} from './datasetcur.js';
import {
  createRedteam,
  listRedteam,
  redteamSummary,
  updateRedteam,
} from './redteam.js';
import {
  createSlaagent,
  listSlaagent,
  slaagentSummary,
  updateSlaagent,
} from './slaagent.js';
import {
  createCostguard,
  listCostguard,
  costguardSummary,
  updateCostguard,
} from './costguard.js';
import {
  createLatencylog,
  listLatencylog,
  latencylogSummary,
  updateLatencylog,
} from './latencylog.js';
import {
  createDriftmonitor,
  listDriftmonitor,
  driftmonitorSummary,
  updateDriftmonitor,
} from './driftmonitor.js';
import { buildCognisphere } from './cognisphere.js';
import {
  createPosbridge,
  listPosbridge,
  posbridgeSummary,
  updatePosbridge,
} from './posbridge.js';
import {
  createDynamint,
  listDynamint,
  dynamintSummary,
  updateDynamint,
} from './dynamint.js';
import {
  createCouriertrack,
  listCouriertrack,
  couriertrackSummary,
  updateCouriertrack,
} from './couriertrack.js';
import {
  createAutocheckout,
  listAutocheckout,
  autocheckoutSummary,
  updateAutocheckout,
} from './autocheckout.js';
import {
  createLoyaltyburn,
  listLoyaltyburn,
  loyaltyburnSummary,
  updateLoyaltyburn,
} from './loyaltyburn.js';
import {
  createTreatoffer,
  listTreatoffer,
  treatofferSummary,
  updateTreatoffer,
} from './treatoffer.js';
import {
  createOmnimarket,
  listOmnimarket,
  omnimarketSummary,
  updateOmnimarket,
} from './omnimarket.js';
import {
  createClickcollect,
  listClickcollect,
  clickcollectSummary,
  updateClickcollect,
} from './clickcollect.js';
import {
  createLastmile,
  listLastmile,
  lastmileSummary,
  updateLastmile,
} from './lastmile.js';
import {
  createInvsync,
  listInvsync,
  invsyncSummary,
  updateInvsync,
} from './invsync.js';
import {
  createPricepush,
  listPricepush,
  pricepushSummary,
  updatePricepush,
} from './pricepush.js';
import {
  createQrpay,
  listQrpay,
  qrpaySummary,
  updateQrpay,
} from './qrpay.js';
import {
  createCourierpool,
  listCourierpool,
  courierpoolSummary,
  updateCourierpool,
} from './courierpool.js';
import {
  createGiftrelay,
  listGiftrelay,
  giftrelaySummary,
  updateGiftrelay,
} from './giftrelay.js';
import { buildVanguard } from './vanguard.js';
import {
  createEdgegate,
  listEdgegate,
  edgegateSummary,
  updateEdgegate,
} from './edgegate.js';
import {
  createMeshlink,
  listMeshlink,
  meshlinkSummary,
  updateMeshlink,
} from './meshlink.js';
import {
  createRadiomesh,
  listRadiomesh,
  radiomeshSummary,
  updateRadiomesh,
} from './radiomesh.js';
import {
  createSensorfuse,
  listSensorfuse,
  sensorfuseSummary,
  updateSensorfuse,
} from './sensorfuse.js';
import {
  createOtafirm,
  listOtafirm,
  otafirmSummary,
  updateOtafirm,
} from './otafirm.js';
import {
  createDevinventory,
  listDevinventory,
  devinventorySummary,
  updateDevinventory,
} from './devinventory.js';
import {
  createPowerbudget,
  listPowerbudget,
  powerbudgetSummary,
  updatePowerbudget,
} from './powerbudget.js';
import {
  createBackhaul,
  listBackhaul,
  backhaulSummary,
  updateBackhaul,
} from './backhaul.js';
import {
  createEdgecache2,
  listEdgecache2,
  edgecache2Summary,
  updateEdgecache2,
} from './edgecache2.js';
import {
  createSyncrepl,
  listSyncrepl,
  syncreplSummary,
  updateSyncrepl,
} from './syncrepl.js';
import {
  createFailover,
  listFailover,
  failoverSummary,
  updateFailover,
} from './failover.js';
import {
  createTelemetry,
  listTelemetry,
  telemetrySummary,
  updateTelemetry,
} from './telemetry.js';
import {
  createNetslice,
  listNetslice,
  netsliceSummary,
  updateNetslice,
} from './netslice.js';
import {
  createSatlink,
  listSatlink,
  satlinkSummary,
  updateSatlink,
} from './satlink.js';
import { buildLattice } from './lattice.js';
import {
  createGuesttwin,
  listGuesttwin,
  guesttwinSummary,
  updateGuesttwin,
} from './guesttwin.js';
import {
  createPrefgraph,
  listPrefgraph,
  prefgraphSummary,
  updatePrefgraph,
} from './prefgraph.js';
import {
  createIntentscore,
  listIntentscore,
  intentscoreSummary,
  updateIntentscore,
} from './intentscore.js';
import {
  createNextbest,
  listNextbest,
  nextbestSummary,
  updateNextbest,
} from './nextbest.js';
import {
  createJourneymap,
  listJourneymap,
  journeymapSummary,
  updateJourneymap,
} from './journeymap.js';
import {
  createMicroseg,
  listMicroseg,
  microsegSummary,
  updateMicroseg,
} from './microseg.js';
import {
  createOfferlab,
  listOfferlab,
  offerlabSummary,
  updateOfferlab,
} from './offerlab.js';
import {
  createConsentgraph,
  listConsentgraph,
  consentgraphSummary,
  updateConsentgraph,
} from './consentgraph.js';
import {
  createEmotionpulse,
  listEmotionpulse,
  emotionpulseSummary,
  updateEmotionpulse,
} from './emotionpulse.js';
import {
  createServicememory,
  listServicememory,
  servicememorySummary,
  updateServicememory,
} from './servicememory.js';
import {
  createRecoverypath,
  listRecoverypath,
  recoverypathSummary,
  updateRecoverypath,
} from './recoverypath.js';
import {
  createLifetimeval,
  listLifetimeval,
  lifetimevalSummary,
  updateLifetimeval,
} from './lifetimeval.js';
import {
  createChurnrisk,
  listChurnrisk,
  churnriskSummary,
  updateChurnrisk,
} from './churnrisk.js';
import {
  createWowmoment,
  listWowmoment,
  wowmomentSummary,
  updateWowmoment,
} from './wowmoment.js';
import { buildMirror } from './mirror.js';
import {
  createIncidentbus,
  listIncidentbus,
  incidentbusSummary,
  updateIncidentbus,
} from './incidentbus.js';
import {
  createPlaytrigger,
  listPlaytrigger,
  playtriggerSummary,
  updatePlaytrigger,
} from './playtrigger.js';
import {
  createEscalation,
  listEscalation,
  escalationSummary,
  updateEscalation,
} from './escalation.js';
import {
  createWarroomseat,
  listWarroomseat,
  warroomseatSummary,
  updateWarroomseat,
} from './warroomseat.js';
import {
  createDecisionlog,
  listDecisionlog,
  decisionlogSummary,
  updateDecisionlog,
} from './decisionlog.js';
import {
  createSlotrack,
  listSlotrack,
  slotrackSummary,
  updateSlotrack,
} from './slotrack.js';
import {
  createErrorbudget,
  listErrorbudget,
  errorbudgetSummary,
  updateErrorbudget,
} from './errorbudget.js';
import {
  createChangewindow,
  listChangewindow,
  changewindowSummary,
  updateChangewindow,
} from './changewindow.js';
import {
  createBlameless,
  listBlameless,
  blamelessSummary,
  updateBlameless,
} from './blameless.js';
import {
  createPagerduty,
  listPagerduty,
  pagerdutySummary,
  updatePagerduty,
} from './pagerduty.js';
import {
  createStatuspage,
  listStatuspage,
  statuspageSummary,
  updateStatuspage,
} from './statuspage.js';
import {
  createRunbooklink,
  listRunbooklink,
  runbooklinkSummary,
  updateRunbooklink,
} from './runbooklink.js';
import {
  createCommsbridge,
  listCommsbridge,
  commsbridgeSummary,
  updateCommsbridge,
} from './commsbridge.js';
import {
  createAfteraction,
  listAfteraction,
  afteractionSummary,
  updateAfteraction,
} from './afteraction.js';
import { buildKeystone } from './keystone.js';
import {
  createRevstream,
  listRevstream,
  revstreamSummary,
  updateRevstream,
} from './revstream.js';
import {
  createPackagemix,
  listPackagemix,
  packagemixSummary,
  updatePackagemix,
} from './packagemix.js';
import {
  createAncillary,
  listAncillary,
  ancillarySummary,
  updateAncillary,
} from './ancillary.js';
import {
  createDynamicbundle,
  listDynamicbundle,
  dynamicbundleSummary,
  updateDynamicbundle,
} from './dynamicbundle.js';
import {
  createPricefloor,
  listPricefloor,
  pricefloorSummary,
  updatePricefloor,
} from './pricefloor.js';
import {
  createCompset,
  listCompset,
  compsetSummary,
  updateCompset,
} from './compset.js';
import {
  createPickuppace,
  listPickuppace,
  pickuppaceSummary,
  updatePickuppace,
} from './pickuppace.js';
import {
  createNoshowrisk,
  listNoshowrisk,
  noshowriskSummary,
  updateNoshowrisk,
} from './noshowrisk.js';
import {
  createWalkinflow,
  listWalkinflow,
  walkinflowSummary,
  updateWalkinflow,
} from './walkinflow.js';
import {
  createTableturn,
  listTableturn,
  tableturnSummary,
  updateTableturn,
} from './tableturn.js';
import {
  createBeatrevenue,
  listBeatrevenue,
  beatrevenueSummary,
  updateBeatrevenue,
} from './beatrevenue.js';
import {
  createCashforecast,
  listCashforecast,
  cashforecastSummary,
  updateCashforecast,
} from './cashforecast.js';
import {
  createMarginwatch,
  listMarginwatch,
  marginwatchSummary,
  updateMarginwatch,
} from './marginwatch.js';
import {
  createPromoattr,
  listPromoattr,
  promoattrSummary,
  updatePromoattr,
} from './promoattr.js';
import { buildZenith } from './zenith.js';



applySettingsToEnv();
startJobTicker(5000);
// tesis / marka / misafir tohumu
listVenues();
listHolders();
listBrands();
listGuests();
listReservations();
listLoyaltyAccounts();
listIncidents();
listSuppliers();
listFeedback();
listConsents();
listAnnouncements();
listRecipes();
listChecklistTemplates();
listLostFound();
tipSummary();
listMaintenance();
listMenu();
listCampaigns();
listI18nNotes();
listColdAssets();
listHandover();
cashSummary();
listAssets();
listMeters();
listQuizzes();
listPlaybooks();
listInventory();
listShifts();
listValet();
listMusic();
listDocuments();
listVendorScores();
listSeating();
listWaitlist();
listComplaints();
listHours();
buildWeatherBrief();
buildReadiness();
listSpa();
listEventcal();
listGiftcards();
listDelivery();
listCleaning();
listLaundry();
listWifi();
listContent();
listPulse();
listBudget();
listContracts();
listPassstock();
listKds();
listEmergency();
listLockers();
listKidsclub();
listBeachbeds();
listTransfers();
listBadgeprint();
listMeetingrooms();
listMediakit();
listSustain();
listAllergens();
listWinecellar();
listLounge();
listShuttle();
listPartners();
listMysteryshop();



function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

function getToken(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  return null;
}

function requireUser(req, res) {
  const user = sessionFromToken(getToken(req));
  if (!user) {
    sendJson(res, 401, { error: 'Oturum gerekli' });
    return null;
  }
  return user;
}

function requireCeo(req, res) {
  const user = requireUser(req, res);
  if (!user) return null;
  if (user.role !== 'ceo') {
    sendJson(res, 403, { error: 'Yalnızca CEO erişebilir' });
    return null;
  }
  return user;
}

function hubSummary() {
  const archive = readCollection('archive', []);
  const whatsapp = readCollection('whatsapp', []);
  const nexus = readCollection('nexus-events', []);
  const audit = readAudit(12);
  const settings = getPublicSettings();
  const byAgent = {};
  for (const e of archive) {
    for (const a of e.agents ?? []) byAgent[a] = (byAgent[a] ?? 0) + 1;
  }
  const configuredKeys = settings.fields.filter((f) => f.configured).length;
  const jobs = jobsSummary();
  return {
    archiveCount: archive.length,
    whatsappCount: whatsapp.length,
    nexusEventCount: nexus.length,
    auditCount: readCollection('audit', []).length,
    settingsConfigured: configuredKeys,
    settingsTotal: settings.fields.length,
    jobsTotal: jobs.total,
    jobsByStatus: jobs.byStatus,
    upcomingJobs: jobs.upcoming,
    readyDirectives: jobs.readyDirectives,
    sseClients: sseClientCount(),
    recentArchive: archive.slice(0, 5),
    recentWhatsapp: whatsapp.slice(0, 5),
    recentNexus: nexus.slice(0, 8),
    recentAudit: audit,
    recentJobs: jobs.recent,
    venues: venuesSummary(),
    unreadNotifications: unreadCount(),
    health: healthCheck().status,
    agentHits: Object.entries(byAgent)
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    generatedAt: new Date().toISOString(),
  };
}

/** Connect uyumlu middleware — hem Vite hem production sunucusu kullanır. */
export function createPlatformMiddleware() {
  return (req, res, next) => {
        const path = (req.url ?? '').split('?')[0];

        if (req.method === 'OPTIONS' && path.startsWith('/api/')) {
          sendJson(res, 204, {});
          return;
        }

        // Auth
        if (path === '/api/auth/demo-users' && req.method === 'GET') {
          sendJson(res, 200, { users: listDemoUsers(), rolePages: ROLE_PAGES });
          return;
        }
        if (path === '/api/auth/login' && req.method === 'POST') {
          void (async () => {
            try {
              const { username, password } = await readBody(req);
              const result = login(username, password);
              if (!result) {
                appendAudit({
                  actor: username || 'unknown',
                  action: 'auth.login_failed',
                  detail: 'Hatalı kimlik bilgisi',
                });
                sendJson(res, 401, { error: 'Kullanıcı adı veya şifre hatalı' });
                return;
              }
              appendAudit({
                actor: result.user.username,
                action: 'auth.login',
                detail: `${result.user.name} oturum açtı (${result.user.role})`,
              });
              sendJson(res, 200, result);
            } catch (err) {
              sendJson(res, 500, { error: err instanceof Error ? err.message : 'Login hatası' });
            }
          })();
          return;
        }
        if (path === '/api/auth/logout' && req.method === 'POST') {
          const user = sessionFromToken(getToken(req));
          logout(getToken(req));
          if (user) {
            appendAudit({
              actor: user.username,
              action: 'auth.logout',
              detail: 'Oturum kapatıldı',
            });
          }
          sendJson(res, 200, { ok: true });
          return;
        }
        if (path === '/api/auth/me' && req.method === 'GET') {
          const user = sessionFromToken(getToken(req));
          if (!user) {
            sendJson(res, 401, { error: 'Oturum yok' });
            return;
          }
          sendJson(res, 200, { user });
          return;
        }

        // Kalıcı arşiv
        if (path === '/api/archive' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, { entries: readCollection('archive', []) });
          return;
        }
        if (path === '/api/archive' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            try {
              const entry = await readBody(req);
              if (!entry?.id || !entry?.text) {
                sendJson(res, 400, { error: 'Geçersiz arşiv kaydı' });
                return;
              }
              const entries = prependItem('archive', entry, 200);
              appendAudit({
                actor: user.username,
                action: 'archive.save',
                detail: String(entry.text).slice(0, 100),
                meta: { id: entry.id, agents: entry.agents },
              });
              sendJson(res, 200, { ok: true, entries });
            } catch (err) {
              sendJson(res, 500, { error: err instanceof Error ? err.message : 'Arşiv yazılamadı' });
            }
          })();
          return;
        }
        if (path.startsWith('/api/archive/') && req.method === 'DELETE') {
          const user = requireUser(req, res);
          if (!user) return;
          const id = Number(path.split('/').pop());
          appendAudit({
            actor: user.username,
            action: 'archive.delete',
            detail: `Kayıt silindi: ${id}`,
          });
          sendJson(res, 200, { entries: deleteItem('archive', id) });
          return;
        }
        if (path === '/api/archive' && req.method === 'DELETE') {
          const user = requireUser(req, res);
          if (!user) return;
          clearCollection('archive');
          appendAudit({
            actor: user.username,
            action: 'archive.clear',
            detail: 'Arşiv temizlendi',
          });
          sendJson(res, 200, { entries: [] });
          return;
        }

        // Hub özeti
        if (path === '/api/hub/summary' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, hubSummary());
          return;
        }

        // Audit
        if (path === '/api/audit' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          const limit = Number(url.searchParams.get('limit') || 50);
          sendJson(res, 200, { entries: readAudit(limit) });
          return;
        }

        // Ayarlar (CEO)
        if (path === '/api/settings' && req.method === 'GET') {
          if (!requireCeo(req, res)) return;
          sendJson(res, 200, getPublicSettings());
          return;
        }
        if (path === '/api/settings' && req.method === 'POST') {
          const user = requireCeo(req, res);
          if (!user) return;
          void (async () => {
            try {
              const patch = await readBody(req);
              const result = saveSettings(patch);
              appendAudit({
                actor: user.username,
                action: 'settings.update',
                detail: `Ayarlar güncellendi (${result.fields.filter((f) => f.configured).length}/${result.fields.length} yapılandırıldı)`,
              });
              sendJson(res, 200, result);
            } catch (err) {
              sendJson(res, 500, {
                error: err instanceof Error ? err.message : 'Ayarlar kaydedilemedi',
              });
            }
          })();
          return;
        }

        // Görevler / kuyruk (AŞAMA 6)
        if (path === '/api/jobs' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            jobs: listJobs({
              status: url.searchParams.get('status') || undefined,
              kind: url.searchParams.get('kind') || undefined,
            }),
            summary: jobsSummary(),
          });
          return;
        }
        if (path === '/api/jobs' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            try {
              const body = await readBody(req);
              if (!body.kind) {
                sendJson(res, 400, { error: 'kind zorunlu (whatsapp.reminder | directive.queue)' });
                return;
              }
              if (
                body.kind !== 'whatsapp.reminder' &&
                body.kind !== 'directive.queue'
              ) {
                sendJson(res, 400, { error: 'Geçersiz kind' });
                return;
              }
              // kitchen yalnızca whatsapp; crew talimat kuyruğu oluşturamaz
              if (user.role === 'kitchen' && body.kind !== 'whatsapp.reminder') {
                sendJson(res, 403, { error: 'Mutfak yalnızca WhatsApp hatırlatması oluşturabilir' });
                return;
              }
              if (user.role === 'crew') {
                sendJson(res, 403, { error: 'Crew rolü görev oluşturamaz' });
                return;
              }
              const job = createJob({
                kind: body.kind,
                title: body.title,
                payload: body.payload,
                dueAt: body.dueAt,
                createdBy: user.username,
              });
              // dueAt geçmişse hemen tick
              if (new Date(job.dueAt).getTime() <= Date.now()) {
                const ran = await runJob(job.id, user.username);
                sendJson(res, 200, { job: ran });
                return;
              }
              sendJson(res, 200, { job });
            } catch (err) {
              sendJson(res, 500, {
                error: err instanceof Error ? err.message : 'Görev oluşturulamadı',
              });
            }
          })();
          return;
        }
        if (path === '/api/jobs/tick' && req.method === 'POST') {
          if (!requireCeo(req, res)) return;
          void (async () => {
            const results = await tickJobs();
            sendJson(res, 200, { ran: results.length, results });
          })();
          return;
        }
        if (path.startsWith('/api/jobs/') && path.endsWith('/run') && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          void (async () => {
            const job = await runJob(id, user.username);
            if (!job) {
              sendJson(res, 404, { error: 'Görev bulunamadı' });
              return;
            }
            sendJson(res, 200, { job });
          })();
          return;
        }
        if (path.startsWith('/api/jobs/') && path.endsWith('/cancel') && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          const job = cancelJob(id, user.username);
          if (!job) {
            sendJson(res, 404, { error: 'Görev bulunamadı' });
            return;
          }
          sendJson(res, 200, { job });
          return;
        }
        if (path.startsWith('/api/jobs/') && path.endsWith('/claim') && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          if (user.role === 'crew') {
            sendJson(res, 403, { error: 'Crew talimat claim edemez' });
            return;
          }
          const id = path.split('/')[3];
          void (async () => {
            const result = await claimDirective(id, user.username);
            if (!result) {
              sendJson(res, 404, { error: 'Talimat görevi bulunamadı' });
              return;
            }
            if (result.error) {
              sendJson(res, 409, { error: result.error, job: result.job });
              return;
            }
            sendJson(res, 200, { job: result.job, text: result.text });
          })();
          return;
        }
        // Operasyon raporu (AŞAMA 8)
        if (path === '/api/report' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          const format = url.searchParams.get('format') || 'json';
          const report = buildOpsReport();
          if (format === 'markdown' || format === 'md') {
            const md = reportToMarkdown(report);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
            res.setHeader(
              'Content-Disposition',
              `attachment; filename="likya-rapor-${report.generatedAt.slice(0, 10)}.md"`,
            );
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(md);
            return;
          }
          sendJson(res, 200, report);
          return;
        }

        // SSE canlı olay akışı (AŞAMA 7) — token query ile (EventSource header desteklemez)
        if (path === '/api/events' && req.method === 'GET') {
          const url = new URL(req.url ?? '', 'http://local');
          const token = url.searchParams.get('token') || getToken(req);
          const user = sessionFromToken(token);
          if (!user) {
            sendJson(res, 401, { error: 'Oturum gerekli' });
            return;
          }
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          res.write(`: connected as ${user.username}\n\n`);
          addSseClient(res);
          return;
        }
        if (path.startsWith('/api/jobs/') && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const id = path.split('/')[3];
          const job = getJob(id);
          if (!job) {
            sendJson(res, 404, { error: 'Görev bulunamadı' });
            return;
          }
          sendJson(res, 200, { job });
          return;
        }
        if (path.startsWith('/api/jobs/') && req.method === 'DELETE') {
          const user = requireCeo(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          sendJson(res, 200, { jobs: deleteJob(id) });
          return;
        }

        // ── AŞAMA 10: Tesisler ────────────────────────────────────────
        if (path === '/api/venues' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, venuesSummary());
          return;
        }
        if (path === '/api/venues' && req.method === 'POST') {
          const user = requireCeo(req, res);
          if (!user) return;
          void (async () => {
            try {
              const body = await readBody(req);
              if (!body.name) {
                sendJson(res, 400, { error: 'name zorunlu' });
                return;
              }
              const venue = createVenue(body, user.username);
              sendJson(res, 200, { venue });
            } catch (err) {
              sendJson(res, 500, {
                error: err instanceof Error ? err.message : 'Tesis oluşturulamadı',
              });
            }
          })();
          return;
        }
        if (path.startsWith('/api/venues/') && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const id = path.split('/')[3];
          const venue = getVenue(id);
          if (!venue) {
            sendJson(res, 404, { error: 'Tesis bulunamadı' });
            return;
          }
          sendJson(res, 200, { venue });
          return;
        }
        if (path.startsWith('/api/venues/') && req.method === 'PATCH') {
          const user = requireCeo(req, res);
          if (!user) return;
          void (async () => {
            const id = path.split('/')[3];
            const patch = await readBody(req);
            const venue = updateVenue(id, patch, user.username);
            if (!venue) {
              sendJson(res, 404, { error: 'Tesis bulunamadı' });
              return;
            }
            sendJson(res, 200, { venue });
          })();
          return;
        }
        if (path.startsWith('/api/venues/') && req.method === 'DELETE') {
          const user = requireCeo(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          const venue = removeVenue(id, user.username);
          if (!venue) {
            sendJson(res, 404, { error: 'Tesis bulunamadı' });
            return;
          }
          sendJson(res, 200, { ok: true, venue });
          return;
        }

        // ── AŞAMA 11: Health + yedek ──────────────────────────────────
        if (path === '/api/health' && req.method === 'GET') {
          // health auth gerektirmez (load balancer / docker healthcheck)
          sendJson(res, 200, healthCheck());
          return;
        }
        if (path === '/api/ops/files' && req.method === 'GET') {
          if (!requireCeo(req, res)) return;
          sendJson(res, 200, { files: listDataFiles() });
          return;
        }
        if (path === '/api/ops/backup' && req.method === 'GET') {
          const user = requireCeo(req, res);
          if (!user) return;
          const backup = createBackup();
          appendAudit({
            actor: user.username,
            action: 'ops.backup',
            detail: `Yedek alındı (${Object.keys(backup.collections).length} koleksiyon)`,
          });
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="likya-backup-${backup.createdAt.slice(0, 10)}.json"`,
          );
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify(backup, null, 2));
          return;
        }
        if (path === '/api/ops/restore' && req.method === 'POST') {
          const user = requireCeo(req, res);
          if (!user) return;
          void (async () => {
            try {
              const body = await readBody(req);
              const result = restoreBackup(body, user.username);
              sendJson(res, 200, result);
            } catch (err) {
              sendJson(res, 400, {
                error: err instanceof Error ? err.message : 'Geri yükleme başarısız',
              });
            }
          })();
          return;
        }

        // ── AŞAMA 12: Bildirimler ─────────────────────────────────────
        if (path === '/api/notifications' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          const unreadOnly = url.searchParams.get('unread') === '1';
          const limit = Number(url.searchParams.get('limit') || 50);
          sendJson(res, 200, {
            unread: unreadCount(),
            notifications: listNotifications(limit, unreadOnly),
          });
          return;
        }
        if (path === '/api/notifications/read-all' && req.method === 'POST') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, markAllRead());
          return;
        }
        if (path.startsWith('/api/notifications/') && path.endsWith('/read') && req.method === 'POST') {
          if (!requireUser(req, res)) return;
          const id = path.split('/')[3];
          const n = markRead(id);
          if (!n) {
            sendJson(res, 404, { error: 'Bildirim bulunamadı' });
            return;
          }
          sendJson(res, 200, { notification: n, unread: unreadCount() });
          return;
        }

        // ── AŞAMA 13: OlymposPass geçiş motoru ────────────────────────
        if (path === '/api/pass/holders' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, { holders: listHolders(), stats: passStats() });
          return;
        }
        if (path === '/api/pass/gates' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, { gates: listGates() });
          return;
        }
        if (path === '/api/pass/events' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          const limit = Number(url.searchParams.get('limit') || 40);
          sendJson(res, 200, { events: listAccessEvents(limit) });
          return;
        }
        if (path === '/api/pass/verify' && req.method === 'POST') {
          if (!requireUser(req, res)) return;
          void (async () => {
            try {
              const body = await readBody(req);
              sendJson(res, 200, verifyPass(body));
            } catch (err) {
              sendJson(res, 500, {
                error: err instanceof Error ? err.message : 'Doğrulama hatası',
              });
            }
          })();
          return;
        }
        if (path === '/api/pass/admit' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            try {
              const body = await readBody(req);
              const result = admitPass({
                code: body.code,
                gateId: body.gateId,
                actor: user.username,
              });
              sendJson(res, 200, result);
            } catch (err) {
              sendJson(res, 500, {
                error: err instanceof Error ? err.message : 'Geçiş kaydı başarısız',
              });
            }
          })();
          return;
        }

        // ── AŞAMA 15: Metrikler ───────────────────────────────────────
        if (path === '/api/metrics' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildMetrics());
          return;
        }

        // ── AŞAMA 16: Markalar ────────────────────────────────────────
        if (path === '/api/brands' && req.method === 'GET') {
          const user = requireUser(req, res);
          if (!user) return;
          sendJson(res, 200, {
            ...brandsSummary(),
            mine: brandsForRole(user.role),
            activeBrandId: user.activeBrandId ?? null,
          });
          return;
        }
        if (path === '/api/brands/active' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const body = await readBody(req);
            const updated = setActiveBrand(getToken(req), body.brandId);
            if (!updated) {
              sendJson(res, 403, { error: 'Bu markaya erişim yok' });
              return;
            }
            sendJson(res, 200, { user: updated });
          })();
          return;
        }
        if (path === '/api/brands' && req.method === 'POST') {
          const user = requireCeo(req, res);
          if (!user) return;
          void (async () => {
            const body = await readBody(req);
            if (!body.name) {
              sendJson(res, 400, { error: 'name zorunlu' });
              return;
            }
            sendJson(res, 200, { brand: createBrand(body, user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/brands/') && req.method === 'PATCH') {
          const user = requireCeo(req, res);
          if (!user) return;
          void (async () => {
            const id = path.split('/')[3];
            const brand = updateBrand(id, await readBody(req), user.username);
            if (!brand) {
              sendJson(res, 404, { error: 'Marka bulunamadı' });
              return;
            }
            sendJson(res, 200, { brand });
          })();
          return;
        }
        if (path.startsWith('/api/brands/') && req.method === 'DELETE') {
          const user = requireCeo(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          if (id === 'active') return; // reserved
          const brand = removeBrand(id, user.username);
          if (!brand) {
            sendJson(res, 404, { error: 'Marka bulunamadı' });
            return;
          }
          sendJson(res, 200, { ok: true, brand });
          return;
        }
        if (path.startsWith('/api/brands/') && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const id = path.split('/')[3];
          const brand = getBrand(id);
          if (!brand) {
            sendJson(res, 404, { error: 'Marka bulunamadı' });
            return;
          }
          sendJson(res, 200, { brand });
          return;
        }

        // ── AŞAMA 17: Misafir CRM ─────────────────────────────────────
        if (path === '/api/guests' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, guestsSummary());
          return;
        }
        if (path === '/api/guests/sync' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          sendJson(res, 200, syncGuestsFromSources(user.username));
          return;
        }
        if (path === '/api/guests' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const body = await readBody(req);
            if (!body.name) {
              sendJson(res, 400, { error: 'name zorunlu' });
              return;
            }
            sendJson(res, 200, { guest: upsertGuest(body, user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/guests/') && path.endsWith('/timeline') && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const id = path.split('/')[3];
          const data = guestTimeline(id);
          if (!data) {
            sendJson(res, 404, { error: 'Misafir bulunamadı' });
            return;
          }
          sendJson(res, 200, data);
          return;
        }
        if (path.startsWith('/api/guests/') && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const id = path.split('/')[3];
          const guest = getGuest(id);
          if (!guest) {
            sendJson(res, 404, { error: 'Misafir bulunamadı' });
            return;
          }
          sendJson(res, 200, { guest });
          return;
        }

        // ── AŞAMA 20: Playbooks ───────────────────────────────────────
        if (path === '/api/playbooks' && req.method === 'GET') {
          const user = requireUser(req, res);
          if (!user) return;
          const url = new URL(req.url ?? '', 'http://local');
          const brandId = url.searchParams.get('brandId') || user.activeBrandId || undefined;
          sendJson(res, 200, { playbooks: listPlaybooks(brandId) });
          return;
        }
        if (path === '/api/playbooks' && req.method === 'POST') {
          const user = requireCeo(req, res);
          if (!user) return;
          void (async () => {
            const body = await readBody(req);
            if (!body.prompt) {
              sendJson(res, 400, { error: 'prompt zorunlu' });
              return;
            }
            sendJson(res, 200, { playbook: createPlaybook(body, user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/playbooks/') && req.method === 'DELETE') {
          const user = requireCeo(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          const pb = removePlaybook(id, user.username);
          if (!pb) {
            sendJson(res, 404, { error: 'Playbook bulunamadı' });
            return;
          }
          sendJson(res, 200, { ok: true, playbook: pb });
          return;
        }

        // ── AŞAMA 21: Webhooks ────────────────────────────────────────
        if (path === '/api/webhooks' && req.method === 'GET') {
          if (!requireCeo(req, res)) return;
          sendJson(res, 200, {
            webhooks: listWebhooks(),
            deliveries: listDeliveries(30),
          });
          return;
        }
        if (path === '/api/webhooks' && req.method === 'POST') {
          const user = requireCeo(req, res);
          if (!user) return;
          void (async () => {
            try {
              const body = await readBody(req);
              sendJson(res, 200, { webhook: createWebhook(body, user.username) });
            } catch (err) {
              sendJson(res, 400, {
                error: err instanceof Error ? err.message : 'Webhook oluşturulamadı',
              });
            }
          })();
          return;
        }
        if (path.startsWith('/api/webhooks/') && req.method === 'DELETE') {
          const user = requireCeo(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          const hook = removeWebhook(id, user.username);
          if (!hook) {
            sendJson(res, 404, { error: 'Webhook bulunamadı' });
            return;
          }
          sendJson(res, 200, { ok: true, webhook: hook });
          return;
        }

        // ── AŞAMA 22: OpenAPI ─────────────────────────────────────────
        if ((path === '/api/openapi.json' || path === '/api/docs') && req.method === 'GET') {
          sendJson(res, 200, buildOpenApi());
          return;
        }

        // ── AŞAMA 23: Envanter ────────────────────────────────────────
        if (path === '/api/inventory' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            ...inventorySummary(),
            items: listInventory({
              venueId: url.searchParams.get('venueId') || undefined,
              brandId: url.searchParams.get('brandId') || undefined,
            }),
          });
          return;
        }
        if (path === '/api/inventory/adjust' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          if (user.role === 'crew') {
            sendJson(res, 403, { error: 'Crew stok düşemez' });
            return;
          }
          void (async () => {
            const body = await readBody(req);
            const result = adjustStock(body, user.username);
            if (!result) {
              sendJson(res, 404, { error: 'SKU bulunamadı' });
              return;
            }
            sendJson(res, 200, result);
          })();
          return;
        }

        // ── AŞAMA 24: Vardiyalar ──────────────────────────────────────
        if (path === '/api/shifts' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            ...shiftsSummary(),
            shifts: listShifts({
              date: url.searchParams.get('date') || undefined,
              venueId: url.searchParams.get('venueId') || undefined,
              brandId: url.searchParams.get('brandId') || undefined,
            }),
          });
          return;
        }
        if (path === '/api/shifts' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const body = await readBody(req);
            sendJson(res, 200, { shift: createShift(body, user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/shifts/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const id = path.split('/')[3];
            const shift = updateShift(id, await readBody(req), user.username);
            if (!shift) {
              sendJson(res, 404, { error: 'Vardiya bulunamadı' });
              return;
            }
            sendJson(res, 200, { shift });
          })();
          return;
        }
        if (path.startsWith('/api/shifts/') && req.method === 'DELETE') {
          const user = requireCeo(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          const shift = removeShift(id, user.username);
          if (!shift) {
            sendJson(res, 404, { error: 'Vardiya bulunamadı' });
            return;
          }
          sendJson(res, 200, { ok: true, shift });
          return;
        }

        // ── AŞAMA 25: Rezervasyonlar ──────────────────────────────────
        if (path === '/api/reservations' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            ...reservationsSummary(),
            reservations: listReservations({
              date: url.searchParams.get('date') || undefined,
              venueId: url.searchParams.get('venueId') || undefined,
              brandId: url.searchParams.get('brandId') || undefined,
              status: url.searchParams.get('status') || undefined,
            }),
          });
          return;
        }
        if (path === '/api/reservations' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const body = await readBody(req);
            sendJson(res, 200, { reservation: createReservation(body, user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/reservations/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const id = path.split('/')[3];
            const reservation = updateReservation(id, await readBody(req), user.username);
            if (!reservation) {
              sendJson(res, 404, { error: 'Rezervasyon bulunamadı' });
              return;
            }
            sendJson(res, 200, { reservation });
          })();
          return;
        }
        if (path.startsWith('/api/reservations/') && req.method === 'DELETE') {
          const user = requireUser(req, res);
          if (!user) return;
          if (user.role === 'crew') {
            sendJson(res, 403, { error: 'Crew rezervasyon silemez' });
            return;
          }
          const id = path.split('/')[3];
          const reservation = removeReservation(id, user.username);
          if (!reservation) {
            sendJson(res, 404, { error: 'Rezervasyon bulunamadı' });
            return;
          }
          sendJson(res, 200, { ok: true, reservation });
          return;
        }

        // ── AŞAMA 26: Sadakat / Daze-Gift ─────────────────────────────
        if (path === '/api/loyalty' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            ...loyaltySummary(),
            accounts: listLoyaltyAccounts({
              brandId: url.searchParams.get('brandId') || undefined,
            }),
            ledger: listLedger(Number(url.searchParams.get('limit')) || 40),
          });
          return;
        }
        if (path === '/api/loyalty/adjust' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          if (user.role === 'crew') {
            sendJson(res, 403, { error: 'Crew puan düşemez' });
            return;
          }
          void (async () => {
            const body = await readBody(req);
            const result = adjustPoints(body, user.username);
            if (!result) {
              sendJson(res, 404, { error: 'Hesap bulunamadı' });
              return;
            }
            sendJson(res, 200, result);
          })();
          return;
        }

        // ── AŞAMA 27: Olay panosu ─────────────────────────────────────
        if (path === '/api/incidents' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, {
            ...incidentsSummary(),
            incidents: listIncidents(),
          });
          return;
        }
        if (path === '/api/incidents' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const body = await readBody(req);
            sendJson(res, 200, { incident: createIncident(body, user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/incidents/') && path.endsWith('/ack') && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const id = path.split('/')[3];
            const body = await readBody(req);
            const incident = ackIncident(id, body.status || 'acked', user.username);
            if (!incident) {
              sendJson(res, 404, { error: 'Olay bulunamadı' });
              return;
            }
            sendJson(res, 200, { incident });
          })();
          return;
        }

        // ── AŞAMA 28: Tedarik / satınalma ─────────────────────────────
        if (path === '/api/suppliers' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, {
            ...suppliersSummary(),
            suppliers: listSuppliers(),
            orders: listPurchaseOrders(),
          });
          return;
        }
        if (path === '/api/suppliers' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          if (user.role === 'crew') {
            sendJson(res, 403, { error: 'Crew tedarikçi ekleyemez' });
            return;
          }
          void (async () => {
            sendJson(res, 200, { supplier: createSupplier(await readBody(req), user.username) });
          })();
          return;
        }
        if (path === '/api/purchase-orders' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            orders: listPurchaseOrders({
              status: url.searchParams.get('status') || undefined,
              supplierId: url.searchParams.get('supplierId') || undefined,
            }),
          });
          return;
        }
        if (path === '/api/purchase-orders' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          if (user.role === 'crew') {
            sendJson(res, 403, { error: 'Crew sipariş açamaz' });
            return;
          }
          void (async () => {
            sendJson(res, 200, {
              order: createPurchaseOrder(await readBody(req), user.username),
            });
          })();
          return;
        }
        if (path.startsWith('/api/purchase-orders/') && path.endsWith('/receive') && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          const result = receivePurchaseOrder(id, user.username);
          if (!result) {
            sendJson(res, 404, { error: 'Sipariş bulunamadı' });
            return;
          }
          sendJson(res, 200, result);
          return;
        }
        if (path.startsWith('/api/purchase-orders/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const id = path.split('/')[3];
            const order = updatePurchaseOrder(id, await readBody(req), user.username);
            if (!order) {
              sendJson(res, 404, { error: 'Sipariş bulunamadı' });
              return;
            }
            sendJson(res, 200, { order });
          })();
          return;
        }
        if (path.startsWith('/api/purchase-orders/') && req.method === 'DELETE') {
          const user = requireCeo(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          const order = removePurchaseOrder(id, user.username);
          if (!order) {
            sendJson(res, 404, { error: 'Silinemedi (yok veya teslim alınmış)' });
            return;
          }
          sendJson(res, 200, { ok: true, order });
          return;
        }

        // ── AŞAMA 29: Geri bildirim / NPS ─────────────────────────────
        if (path === '/api/feedback' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            ...feedbackSummary(),
            feedback: listFeedback({
              venueId: url.searchParams.get('venueId') || undefined,
              brandId: url.searchParams.get('brandId') || undefined,
              channel: url.searchParams.get('channel') || undefined,
            }),
          });
          return;
        }
        if (path === '/api/feedback' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { feedback: createFeedback(await readBody(req), user.username) });
          })();
          return;
        }

        // ── AŞAMA 30: CSV export ──────────────────────────────────────
        if (path === '/api/exports' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, { catalog: listExportCatalog() });
          return;
        }
        if (path.startsWith('/api/exports/') && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const id = path.split('/')[3];
          const file = buildExport(id);
          if (!file) {
            sendJson(res, 404, { error: 'Export türü bulunamadı', catalog: listExportCatalog() });
            return;
          }
          const url = new URL(req.url ?? '', 'http://local');
          if (url.searchParams.get('format') === 'json') {
            sendJson(res, 200, file);
            return;
          }
          res.statusCode = 200;
          res.setHeader('Content-Type', file.contentType);
          res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Cache-Control', 'no-store');
          res.end(file.csv);
          return;
        }

        // ── AŞAMA 31: KVKK onay günlüğü ───────────────────────────────
        if (path === '/api/consents' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            ...consentSummary(),
            consents: listConsents({
              purpose: url.searchParams.get('purpose') || undefined,
              granted: url.searchParams.get('granted') || undefined,
            }),
          });
          return;
        }
        if (path === '/api/consents' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { consent: recordConsent(await readBody(req), user.username) });
          })();
          return;
        }

        // ── AŞAMA 32: Duyurular ───────────────────────────────────────
        if (path === '/api/announcements' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            ...announcementsSummary(),
            announcements: listAnnouncements({
              status: url.searchParams.get('status') || undefined,
              brandId: url.searchParams.get('brandId') || undefined,
            }),
          });
          return;
        }
        if (path === '/api/announcements' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          if (user.role === 'crew') {
            sendJson(res, 403, { error: 'Crew duyuru yayınlayamaz' });
            return;
          }
          void (async () => {
            sendJson(res, 200, {
              announcement: createAnnouncement(await readBody(req), user.username),
            });
          })();
          return;
        }
        if (path.startsWith('/api/announcements/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const id = path.split('/')[3];
            const announcement = updateAnnouncement(id, await readBody(req), user.username);
            if (!announcement) {
              sendJson(res, 404, { error: 'Duyuru bulunamadı' });
              return;
            }
            sendJson(res, 200, { announcement });
          })();
          return;
        }
        if (path.startsWith('/api/announcements/') && req.method === 'DELETE') {
          const user = requireCeo(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          const announcement = removeAnnouncement(id, user.username);
          if (!announcement) {
            sendJson(res, 404, { error: 'Duyuru bulunamadı' });
            return;
          }
          sendJson(res, 200, { ok: true, announcement });
          return;
        }

        // ── AŞAMA 33: Reçeteler ───────────────────────────────────────
        if (path === '/api/recipes' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, {
            ...recipesSummary(),
            recipes: listRecipes(),
          });
          return;
        }
        if (path === '/api/recipes' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          if (user.role === 'crew') {
            sendJson(res, 403, { error: 'Crew reçete ekleyemez' });
            return;
          }
          void (async () => {
            sendJson(res, 200, { recipe: createRecipe(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/recipes/') && path.endsWith('/cook') && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const id = path.split('/')[3];
            const body = await readBody(req);
            const result = cookRecipe(id, body.portions || 1, user.username);
            if (!result) {
              sendJson(res, 404, { error: 'Reçete bulunamadı' });
              return;
            }
            sendJson(res, 200, result);
          })();
          return;
        }
        if (path.startsWith('/api/recipes/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const id = path.split('/')[3];
            const recipe = updateRecipe(id, await readBody(req), user.username);
            if (!recipe) {
              sendJson(res, 404, { error: 'Reçete bulunamadı' });
              return;
            }
            sendJson(res, 200, { recipe });
          })();
          return;
        }
        if (path.startsWith('/api/recipes/') && req.method === 'DELETE') {
          const user = requireCeo(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          const recipe = removeRecipe(id, user.username);
          if (!recipe) {
            sendJson(res, 404, { error: 'Reçete bulunamadı' });
            return;
          }
          sendJson(res, 200, { ok: true, recipe });
          return;
        }

        // ── AŞAMA 34: Kontrol listeleri ───────────────────────────────
        if (path === '/api/checklists' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, {
            ...checklistsSummary(),
            templates: listChecklistTemplates(),
            runs: listChecklistRuns(),
          });
          return;
        }
        if (path === '/api/checklists/start' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const body = await readBody(req);
            const run = startChecklistRun(body.templateId, user.username);
            if (!run) {
              sendJson(res, 404, { error: 'Şablon bulunamadı' });
              return;
            }
            sendJson(res, 200, { run });
          })();
          return;
        }
        if (path.startsWith('/api/checklists/') && path.includes('/toggle') && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const runId = path.split('/')[3];
            const body = await readBody(req);
            const run = toggleChecklistItem(runId, body.checkId, body.done, user.username);
            if (!run) {
              sendJson(res, 404, { error: 'Çalıştırma bulunamadı' });
              return;
            }
            sendJson(res, 200, { run });
          })();
          return;
        }

        // ── AŞAMA 35: Kayıp eşya ──────────────────────────────────────
        if (path === '/api/lost-found' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            ...lostFoundSummary(),
            items: listLostFound({
              status: url.searchParams.get('status') || undefined,
              venueId: url.searchParams.get('venueId') || undefined,
            }),
          });
          return;
        }
        if (path === '/api/lost-found' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createLostFound(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/lost-found/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const id = path.split('/')[3];
            const item = updateLostFound(id, await readBody(req), user.username);
            if (!item) {
              sendJson(res, 404, { error: 'Kayıt bulunamadı' });
              return;
            }
            sendJson(res, 200, { item });
          })();
          return;
        }

        // ── AŞAMA 36: Bahşiş havuzu ───────────────────────────────────
        if (path === '/api/tips' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, tipSummary());
          return;
        }
        if (path === '/api/tips' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const body = await readBody(req);
            const result = addTip(body, user.username);
            if (!result) {
              sendJson(res, 400, { error: 'Geçersiz tutar veya yetersiz bakiye' });
              return;
            }
            sendJson(res, 200, result);
          })();
          return;
        }

        // ── AŞAMA 38: Bakım ticket ────────────────────────────────────
        if (path === '/api/maintenance' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            ...maintenanceSummary(),
            tickets: listMaintenance({
              status: url.searchParams.get('status') || undefined,
              venueId: url.searchParams.get('venueId') || undefined,
            }),
          });
          return;
        }
        if (path === '/api/maintenance' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { ticket: createTicket(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/maintenance/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const id = path.split('/')[3];
            const ticket = updateTicket(id, await readBody(req), user.username);
            if (!ticket) {
              sendJson(res, 404, { error: 'Ticket bulunamadı' });
              return;
            }
            sendJson(res, 200, { ticket });
          })();
          return;
        }

        // ── AŞAMA 39: Günlük brief ────────────────────────────────────
        if (path === '/api/brief' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildDailyBrief());
          return;
        }

        // ── AŞAMA 40: Menü ────────────────────────────────────────────
        if (path === '/api/menu' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            ...menuSummary(),
            items: listMenu({
              venueId: url.searchParams.get('venueId') || undefined,
              brandId: url.searchParams.get('brandId') || undefined,
              available: url.searchParams.get('available') || undefined,
            }),
          });
          return;
        }
        if (path === '/api/menu' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          if (user.role === 'crew') {
            sendJson(res, 403, { error: 'Crew menü ekleyemez' });
            return;
          }
          void (async () => {
            sendJson(res, 200, { item: createMenuItem(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/menu/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const id = path.split('/')[3];
            const item = updateMenuItem(id, await readBody(req), user.username);
            if (!item) {
              sendJson(res, 404, { error: 'Menü kalemi bulunamadı' });
              return;
            }
            sendJson(res, 200, { item });
          })();
          return;
        }
        if (path.startsWith('/api/menu/') && req.method === 'DELETE') {
          const user = requireCeo(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          const item = removeMenuItem(id, user.username);
          if (!item) {
            sendJson(res, 404, { error: 'Menü kalemi bulunamadı' });
            return;
          }
          sendJson(res, 200, { ok: true, item });
          return;
        }

        // ── AŞAMA 41: Kampanyalar ─────────────────────────────────────
        if (path === '/api/campaigns' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            ...campaignsSummary(),
            campaigns: listCampaigns({
              status: url.searchParams.get('status') || undefined,
              brandId: url.searchParams.get('brandId') || undefined,
            }),
          });
          return;
        }
        if (path === '/api/campaigns' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          if (user.role === 'crew') {
            sendJson(res, 403, { error: 'Crew kampanya açamaz' });
            return;
          }
          void (async () => {
            sendJson(res, 200, {
              campaign: createCampaign(await readBody(req), user.username),
            });
          })();
          return;
        }
        if (path.startsWith('/api/campaigns/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const id = path.split('/')[3];
            const campaign = updateCampaign(id, await readBody(req), user.username);
            if (!campaign) {
              sendJson(res, 404, { error: 'Kampanya bulunamadı' });
              return;
            }
            sendJson(res, 200, { campaign });
          })();
          return;
        }
        if (path.startsWith('/api/campaigns/') && req.method === 'DELETE') {
          const user = requireCeo(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          const campaign = removeCampaign(id, user.username);
          if (!campaign) {
            sendJson(res, 404, { error: 'Kampanya bulunamadı' });
            return;
          }
          sendJson(res, 200, { ok: true, campaign });
          return;
        }

        // ── AŞAMA 42: Lokalizasyon notları ────────────────────────────
        if (path === '/api/i18n' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            ...i18nSummary(),
            notes: listI18nNotes({
              locale: url.searchParams.get('locale') || undefined,
              status: url.searchParams.get('status') || undefined,
              module: url.searchParams.get('module') || undefined,
            }),
          });
          return;
        }
        if (path === '/api/i18n' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { note: upsertI18nNote(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/i18n/') && req.method === 'DELETE') {
          const user = requireCeo(req, res);
          if (!user) return;
          const id = path.split('/')[3];
          const note = removeI18nNote(id, user.username);
          if (!note) {
            sendJson(res, 404, { error: 'Not bulunamadı' });
            return;
          }
          sendJson(res, 200, { ok: true, note });
          return;
        }

        // ── AŞAMA 43: Soğuk zincir ────────────────────────────────────
        if (path === '/api/coldchain' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, {
            ...coldchainSummary(),
            assets: listColdAssets(),
            readings: listColdReadings(40),
          });
          return;
        }
        if (path === '/api/coldchain' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const reading = logColdReading(await readBody(req), user.username);
            if (!reading) {
              sendJson(res, 400, { error: 'Geçersiz varlık/sıcaklık' });
              return;
            }
            sendJson(res, 200, { reading });
          })();
          return;
        }

        // ── AŞAMA 44: Vardiya teslim ──────────────────────────────────
        if (path === '/api/handover' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            ...handoverSummary(),
            notes: listHandover({
              venueId: url.searchParams.get('venueId') || undefined,
            }),
          });
          return;
        }
        if (path === '/api/handover' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, {
              note: createHandover(await readBody(req), user.username),
            });
          })();
          return;
        }

        // ── AŞAMA 45: Kasa ────────────────────────────────────────────
        if (path === '/api/cash' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, cashSummary(url.searchParams.get('venueId') || undefined));
          return;
        }
        if (path === '/api/cash' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          if (user.role === 'crew') {
            sendJson(res, 403, { error: 'Crew kasa hareketi giremez' });
            return;
          }
          void (async () => {
            const result = postCash(await readBody(req), user.username);
            if (!result) {
              sendJson(res, 400, { error: 'Geçersiz tutar veya yetersiz bakiye' });
              return;
            }
            sendJson(res, 200, result);
          })();
          return;
        }

        // ── AŞAMA 46: Varlıklar ───────────────────────────────────────
        if (path === '/api/assets' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const url = new URL(req.url ?? '', 'http://local');
          sendJson(res, 200, {
            ...assetsSummary(),
            assets: listAssets({
              venueId: url.searchParams.get('venueId') || undefined,
              status: url.searchParams.get('status') || undefined,
            }),
          });
          return;
        }
        if (path === '/api/assets' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { asset: createAsset(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/assets/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const id = path.split('/')[3];
            const asset = updateAsset(id, await readBody(req), user.username);
            if (!asset) {
              sendJson(res, 404, { error: 'Varlık bulunamadı' });
              return;
            }
            sendJson(res, 200, { asset });
          })();
          return;
        }

        // ── AŞAMA 47: Enerji ──────────────────────────────────────────
        if (path === '/api/energy' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, {
            ...energySummary(),
            meters: listMeters(),
            readings: listEnergyReadings(40),
          });
          return;
        }
        if (path === '/api/energy' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const reading = logEnergyReading(await readBody(req), user.username);
            if (!reading) {
              sendJson(res, 400, { error: 'Geçersiz sayaç' });
              return;
            }
            sendJson(res, 200, { reading });
          })();
          return;
        }

        // ── AŞAMA 48: Eğitim quiz ─────────────────────────────────────
        if (path === '/api/training' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, trainingSummary());
          return;
        }
        if (path.startsWith('/api/training/') && path.endsWith('/quiz') && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          const id = path.split('/')[3];
          const quiz = getQuiz(id);
          if (!quiz) {
            sendJson(res, 404, { error: 'Quiz bulunamadı' });
            return;
          }
          // cevapları gizle
          sendJson(res, 200, {
            quiz: {
              id: quiz.id,
              title: quiz.title,
              questions: (quiz.questions || []).map((q) => ({
                id: q.id,
                prompt: q.prompt,
                options: q.options,
              })),
            },
          });
          return;
        }
        if (path === '/api/training/attempt' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const body = await readBody(req);
            const attempt = submitAttempt(body, user.username);
            if (!attempt) {
              sendJson(res, 404, { error: 'Quiz bulunamadı' });
              return;
            }
            sendJson(res, 200, { attempt, recent: listAttempts(10) });
          })();
          return;
        }

        // ── AŞAMA 49: Vale ────────────────────────────────────────────
        if (path === '/api/valet' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, { ...valetSummary(), tickets: listValet() });
          return;
        }
        if (path === '/api/valet' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { ticket: createValet(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/valet/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const ticket = updateValet(path.split('/')[3], await readBody(req), user.username);
            if (!ticket) {
              sendJson(res, 404, { error: 'Fiş bulunamadı' });
              return;
            }
            sendJson(res, 200, { ticket });
          })();
          return;
        }

        // ── AŞAMA 50: Müzik ───────────────────────────────────────────
        if (path === '/api/music' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, { ...musicSummary(), requests: listMusic() });
          return;
        }
        if (path === '/api/music' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, {
              request: createMusicRequest(await readBody(req), user.username),
            });
          })();
          return;
        }
        if (path.startsWith('/api/music/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const request = updateMusicRequest(
              path.split('/')[3],
              await readBody(req),
              user.username,
            );
            if (!request) {
              sendJson(res, 404, { error: 'İstek bulunamadı' });
              return;
            }
            sendJson(res, 200, { request });
          })();
          return;
        }

        // ── AŞAMA 51: Belgeler ────────────────────────────────────────
        if (path === '/api/documents' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, { ...documentsSummary(), documents: listDocuments() });
          return;
        }
        if (path === '/api/documents' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, {
              document: createDocument(await readBody(req), user.username),
            });
          })();
          return;
        }
        if (path.startsWith('/api/documents/') && req.method === 'DELETE') {
          const user = requireCeo(req, res);
          if (!user) return;
          const document = removeDocument(path.split('/')[3], user.username);
          if (!document) {
            sendJson(res, 404, { error: 'Belge bulunamadı' });
            return;
          }
          sendJson(res, 200, { ok: true, document });
          return;
        }

        // ── AŞAMA 52: Tedarikçi skor ──────────────────────────────────
        if (path === '/api/vendor-scores' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, { ...vendorScoreSummary(), scores: listVendorScores() });
          return;
        }
        if (path === '/api/vendor-scores' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, {
              score: upsertVendorScore(await readBody(req), user.username),
            });
          })();
          return;
        }

        // ── AŞAMA 53: Fire ────────────────────────────────────────────
        if (path === '/api/waste' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, wasteSummary());
          return;
        }
        if (path === '/api/waste' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { entry: logWaste(await readBody(req), user.username) });
          })();
          return;
        }

        // ── AŞAMA 54: Oturma ──────────────────────────────────────────
        if (path === '/api/seating' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, { ...seatingSummary(), tables: listSeating() });
          return;
        }
        if (path === '/api/seating' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { table: createSeat(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/seating/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const table = updateSeat(path.split('/')[3], await readBody(req), user.username);
            if (!table) {
              sendJson(res, 404, { error: 'Masa bulunamadı' });
              return;
            }
            sendJson(res, 200, { table });
          })();
          return;
        }

        // ── AŞAMA 55: Bekleme listesi ─────────────────────────────────
        if (path === '/api/waitlist' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, { ...waitlistSummary(), entries: listWaitlist() });
          return;
        }
        if (path === '/api/waitlist' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, {
              entry: createWaitlistEntry(await readBody(req), user.username),
            });
          })();
          return;
        }
        if (path.startsWith('/api/waitlist/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const entry = updateWaitlist(path.split('/')[3], await readBody(req), user.username);
            if (!entry) {
              sendJson(res, 404, { error: 'Kayıt bulunamadı' });
              return;
            }
            sendJson(res, 200, { entry });
          })();
          return;
        }

        // ── AŞAMA 56: Şikayetler ──────────────────────────────────────
        if (path === '/api/complaints' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, { ...complaintsSummary(), complaints: listComplaints() });
          return;
        }
        if (path === '/api/complaints' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, {
              complaint: createComplaint(await readBody(req), user.username),
            });
          })();
          return;
        }
        if (path.startsWith('/api/complaints/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const complaint = updateComplaint(
              path.split('/')[3],
              await readBody(req),
              user.username,
            );
            if (!complaint) {
              sendJson(res, 404, { error: 'Şikayet bulunamadı' });
              return;
            }
            sendJson(res, 200, { complaint });
          })();
          return;
        }

        // ── AŞAMA 57: Kudos ───────────────────────────────────────────
        if (path === '/api/kudos' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, kudosSummary());
          return;
        }
        if (path === '/api/kudos' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { entry: createKudos(await readBody(req), user.username) });
          })();
          return;
        }

        // ── AŞAMA 58: Çalışma saatleri ────────────────────────────────
        if (path === '/api/hours' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, hoursSummary());
          return;
        }
        if (path.startsWith('/api/hours/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const venueId = path.split('/')[3];
            const row = updateHours(venueId, await readBody(req), user.username);
            if (!row) {
              sendJson(res, 404, { error: 'Tesis saatleri bulunamadı' });
              return;
            }
            sendJson(res, 200, { hours: row });
          })();
          return;
        }

        // ── AŞAMA 59: Hava brifi ──────────────────────────────────────
        if (path === '/api/weather' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildWeatherBrief());
          return;
        }
        if (path === '/api/weather/refresh' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          sendJson(res, 200, refreshWeather(user.username));
          return;
        }

        // ── AŞAMA 60: Hazırlık skoru ──────────────────────────────────
        if (path === '/api/readiness' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildReadiness());
          return;
        }


        // ── AŞAMA 61–75 ─────────────────────────────────────────────

        if (path === '/api/spa' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, spaSummary());
          return;
        }
        if (path === '/api/spa' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSpa(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/spa/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSpa(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/eventcal' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, eventcalSummary());
          return;
        }
        if (path === '/api/eventcal' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createEventcal(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/eventcal/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateEventcal(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/giftcards' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, giftcardsSummary());
          return;
        }
        if (path === '/api/giftcards' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createGiftcards(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/giftcards/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateGiftcards(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/delivery' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, deliverySummary());
          return;
        }
        if (path === '/api/delivery' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createDelivery(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/delivery/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateDelivery(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/cleaning' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, cleaningSummary());
          return;
        }
        if (path === '/api/cleaning' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createCleaning(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/cleaning/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateCleaning(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/laundry' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, laundrySummary());
          return;
        }
        if (path === '/api/laundry' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createLaundry(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/laundry/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateLaundry(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/wifi' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, wifiSummary());
          return;
        }
        if (path === '/api/wifi' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createWifi(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/wifi/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateWifi(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/content' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, contentSummary());
          return;
        }
        if (path === '/api/content' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createContent(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/content/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateContent(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/pulse' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, pulseSummary());
          return;
        }
        if (path === '/api/pulse' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPulse(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/pulse/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePulse(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/budget' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, budgetSummary());
          return;
        }
        if (path === '/api/budget' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBudget(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/budget/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBudget(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/contracts' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, contractsSummary());
          return;
        }
        if (path === '/api/contracts' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createContracts(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/contracts/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateContracts(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/passstock' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, passstockSummary());
          return;
        }
        if (path === '/api/passstock' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPassstock(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/passstock/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePassstock(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/kds' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, kdsSummary());
          return;
        }
        if (path === '/api/kds' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createKds(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/kds/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateKds(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/emergency' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, emergencySummary());
          return;
        }
        if (path === '/api/emergency' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createEmergency(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/emergency/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateEmergency(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/digest' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildDigest());
          return;
        }


        // ── AŞAMA 76–90 ─────────────────────────────────────────────

        if (path === '/api/lockers' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, lockersSummary());
          return;
        }
        if (path === '/api/lockers' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createLockers(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/lockers/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateLockers(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/kidsclub' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, kidsclubSummary());
          return;
        }
        if (path === '/api/kidsclub' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createKidsclub(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/kidsclub/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateKidsclub(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/beachbeds' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, beachbedsSummary());
          return;
        }
        if (path === '/api/beachbeds' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBeachbeds(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/beachbeds/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBeachbeds(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/transfers' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, transfersSummary());
          return;
        }
        if (path === '/api/transfers' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createTransfers(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/transfers/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateTransfers(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/badgeprint' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, badgeprintSummary());
          return;
        }
        if (path === '/api/badgeprint' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBadgeprint(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/badgeprint/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBadgeprint(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/meetingrooms' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, meetingroomsSummary());
          return;
        }
        if (path === '/api/meetingrooms' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createMeetingrooms(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/meetingrooms/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateMeetingrooms(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/mediakit' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, mediakitSummary());
          return;
        }
        if (path === '/api/mediakit' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createMediakit(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/mediakit/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateMediakit(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/sustain' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, sustainSummary());
          return;
        }
        if (path === '/api/sustain' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSustain(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/sustain/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSustain(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/allergens' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, allergensSummary());
          return;
        }
        if (path === '/api/allergens' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createAllergens(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/allergens/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateAllergens(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/winecellar' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, winecellarSummary());
          return;
        }
        if (path === '/api/winecellar' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createWinecellar(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/winecellar/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateWinecellar(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/lounge' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, loungeSummary());
          return;
        }
        if (path === '/api/lounge' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createLounge(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/lounge/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateLounge(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/shuttle' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, shuttleSummary());
          return;
        }
        if (path === '/api/shuttle' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createShuttle(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/shuttle/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateShuttle(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/partners' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, partnersSummary());
          return;
        }
        if (path === '/api/partners' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPartners(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/partners/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePartners(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/mysteryshop' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, mysteryshopSummary());
          return;
        }
        if (path === '/api/mysteryshop' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createMysteryshop(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/mysteryshop/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateMysteryshop(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/boardpack' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildBoardpack());
          return;
        }

        // ── AŞAMA 91–105 ──

        if (path === '/api/concierge' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, conciergeSummary());
          return;
        }
        if (path === '/api/concierge' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createConcierge(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/concierge/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateConcierge(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/minibar' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, minibarSummary());
          return;
        }
        if (path === '/api/minibar' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createMinibar(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/minibar/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateMinibar(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/folio' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, folioSummary());
          return;
        }
        if (path === '/api/folio' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createFolio(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/folio/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateFolio(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/banquet' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, banquetSummary());
          return;
        }
        if (path === '/api/banquet' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBanquet(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/banquet/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBanquet(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/tours' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, toursSummary());
          return;
        }
        if (path === '/api/tours' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createTours(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/tours/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateTours(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/marina' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, marinaSummary());
          return;
        }
        if (path === '/api/marina' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createMarina(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/marina/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateMarina(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/hammam' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, hammamSummary());
          return;
        }
        if (path === '/api/hammam' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createHammam(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/hammam/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateHammam(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/towels' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, towelsSummary());
          return;
        }
        if (path === '/api/towels' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createTowels(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/towels/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateTowels(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/bands' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, bandsSummary());
          return;
        }
        if (path === '/api/bands' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBands(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/bands/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBands(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/haccp' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, haccpSummary());
          return;
        }
        if (path === '/api/haccp' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createHaccp(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/haccp/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateHaccp(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/patrol' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, patrolSummary());
          return;
        }
        if (path === '/api/patrol' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPatrol(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/patrol/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePatrol(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/fleet' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, fleetSummary());
          return;
        }
        if (path === '/api/fleet' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createFleet(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/fleet/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateFleet(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/payroll' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, payrollSummary());
          return;
        }
        if (path === '/api/payroll' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPayroll(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/payroll/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePayroll(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/flash' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, flashSummary());
          return;
        }
        if (path === '/api/flash' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createFlash(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/flash/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateFlash(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/warroom' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildWarroom());
          return;
        }

        // ── AŞAMA 106–120 ──

        if (path === '/api/upsell' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, upsellSummary());
          return;
        }
        if (path === '/api/upsell' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createUpsell(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/upsell/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateUpsell(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/otareviews' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, otareviewsSummary());
          return;
        }
        if (path === '/api/otareviews' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createOtareviews(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/otareviews/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateOtareviews(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/groups' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, groupsSummary());
          return;
        }
        if (path === '/api/groups' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createGroups(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/groups/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateGroups(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/vipnotes' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, vipnotesSummary());
          return;
        }
        if (path === '/api/vipnotes' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createVipnotes(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/vipnotes/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateVipnotes(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/photoshoot' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, photoshootSummary());
          return;
        }
        if (path === '/api/photoshoot' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPhotoshoot(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/photoshoot/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePhotoshoot(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/dive' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, diveSummary());
          return;
        }
        if (path === '/api/dive' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createDive(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/dive/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateDive(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/bikerent' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, bikerentSummary());
          return;
        }
        if (path === '/api/bikerent' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBikerent(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/bikerent/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBikerent(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/cinema' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, cinemaSummary());
          return;
        }
        if (path === '/api/cinema' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createCinema(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/cinema/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateCinema(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/retail' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, retailSummary());
          return;
        }
        if (path === '/api/retail' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRetail(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/retail/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRetail(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/bakery' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, bakerySummary());
          return;
        }
        if (path === '/api/bakery' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBakery(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/bakery/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBakery(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/breakfast' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, breakfastSummary());
          return;
        }
        if (path === '/api/breakfast' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBreakfast(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/breakfast/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBreakfast(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/lateout' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, lateoutSummary());
          return;
        }
        if (path === '/api/lateout' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createLateout(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/lateout/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateLateout(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/amenities' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, amenitiesSummary());
          return;
        }
        if (path === '/api/amenities' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createAmenities(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/amenities/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateAmenities(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/nightlog' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, nightlogSummary());
          return;
        }
        if (path === '/api/nightlog' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createNightlog(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/nightlog/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateNightlog(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/nightly' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildNightly());
          return;
        }

        // ── AŞAMA 121–135 ──

        if (path === '/api/keycards' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, keycardsSummary());
          return;
        }
        if (path === '/api/keycards' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createKeycards(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/keycards/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateKeycards(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/roomstatus' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, roomstatusSummary());
          return;
        }
        if (path === '/api/roomstatus' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRoomstatus(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/roomstatus/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRoomstatus(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/bedding' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, beddingSummary());
          return;
        }
        if (path === '/api/bedding' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBedding(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/bedding/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBedding(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/wakeups' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, wakeupsSummary());
          return;
        }
        if (path === '/api/wakeups' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createWakeups(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/wakeups/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateWakeups(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/parcels' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, parcelsSummary());
          return;
        }
        if (path === '/api/parcels' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createParcels(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/parcels/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateParcels(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/qrcheckin' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, qrcheckinSummary());
          return;
        }
        if (path === '/api/qrcheckin' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createQrcheckin(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/qrcheckin/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateQrcheckin(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/guestapp' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, guestappSummary());
          return;
        }
        if (path === '/api/guestapp' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createGuestapp(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/guestapp/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateGuestapp(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/karaoke' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, karaokeSummary());
          return;
        }
        if (path === '/api/karaoke' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createKaraoke(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/karaoke/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateKaraoke(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/artwall' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, artwallSummary());
          return;
        }
        if (path === '/api/artwall' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createArtwall(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/artwall/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateArtwall(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/florals' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, floralsSummary());
          return;
        }
        if (path === '/api/florals' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createFlorals(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/florals/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateFlorals(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/privatechef' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, privatechefSummary());
          return;
        }
        if (path === '/api/privatechef' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPrivatechef(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/privatechef/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePrivatechef(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/mocktails' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, mocktailsSummary());
          return;
        }
        if (path === '/api/mocktails' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createMocktails(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/mocktails/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateMocktails(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/promos' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, promosSummary());
          return;
        }
        if (path === '/api/promos' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPromos(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/promos/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePromos(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/dawnservice' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, dawnserviceSummary());
          return;
        }
        if (path === '/api/dawnservice' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createDawnservice(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/dawnservice/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateDawnservice(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/orbit' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildOrbit());
          return;
        }

        // ── AŞAMA 136–150 ──

        if (path === '/api/rosters' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, rostersSummary());
          return;
        }
        if (path === '/api/rosters' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRosters(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/rosters/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRosters(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/overtime' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, overtimeSummary());
          return;
        }
        if (path === '/api/overtime' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createOvertime(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/overtime/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateOvertime(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/uniforms' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, uniformsSummary());
          return;
        }
        if (path === '/api/uniforms' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createUniforms(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/uniforms/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateUniforms(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/healthcards' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, healthcardsSummary());
          return;
        }
        if (path === '/api/healthcards' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createHealthcards(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/healthcards/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateHealthcards(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/visitors' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, visitorsSummary());
          return;
        }
        if (path === '/api/visitors' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createVisitors(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/visitors/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateVisitors(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/cctvlog' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, cctvlogSummary());
          return;
        }
        if (path === '/api/cctvlog' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createCctvlog(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/cctvlog/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateCctvlog(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/firedrill' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, firedrillSummary());
          return;
        }
        if (path === '/api/firedrill' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createFiredrill(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/firedrill/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateFiredrill(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/insurance' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, insuranceSummary());
          return;
        }
        if (path === '/api/insurance' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createInsurance(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/insurance/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateInsurance(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/invoices' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, invoicesSummary());
          return;
        }
        if (path === '/api/invoices' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createInvoices(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/invoices/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateInvoices(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/taxpack' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, taxpackSummary());
          return;
        }
        if (path === '/api/taxpack' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createTaxpack(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/taxpack/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateTaxpack(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/forecast' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, forecastSummary());
          return;
        }
        if (path === '/api/forecast' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createForecast(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/forecast/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateForecast(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/capex' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, capexSummary());
          return;
        }
        if (path === '/api/capex' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createCapex(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/capex/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateCapex(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/licenses' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, licensesSummary());
          return;
        }
        if (path === '/api/licenses' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createLicenses(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/licenses/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateLicenses(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/slabreaches' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, slabreachesSummary());
          return;
        }
        if (path === '/api/slabreaches' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSlabreaches(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/slabreaches/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSlabreaches(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/apex' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildApex());
          return;
        }

        // ── AŞAMA 151–165 ──

        if (path === '/api/extlinks' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, extlinksSummary());
          return;
        }
        if (path === '/api/extlinks' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createExtlinks(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/extlinks/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateExtlinks(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/apikeys' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, apikeysSummary());
          return;
        }
        if (path === '/api/apikeys' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createApikeys(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/apikeys/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateApikeys(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/backupsched' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, backupschedSummary());
          return;
        }
        if (path === '/api/backupsched' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBackupsched(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/backupsched/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBackupsched(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/sysalerts' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, sysalertsSummary());
          return;
        }
        if (path === '/api/sysalerts' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSysalerts(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/sysalerts/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSysalerts(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/bugtracker' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, bugtrackerSummary());
          return;
        }
        if (path === '/api/bugtracker' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBugtracker(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/bugtracker/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBugtracker(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/releasenotes' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, releasenotesSummary());
          return;
        }
        if (path === '/api/releasenotes' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createReleasenotes(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/releasenotes/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateReleasenotes(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/runbooks' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, runbooksSummary());
          return;
        }
        if (path === '/api/runbooks' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRunbooks(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/runbooks/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRunbooks(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/biometrics' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, biometricsSummary());
          return;
        }
        if (path === '/api/biometrics' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBiometrics(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/biometrics/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBiometrics(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/secretsrot' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, secretsrotSummary());
          return;
        }
        if (path === '/api/secretsrot' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSecretsrot(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/secretsrot/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSecretsrot(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/dnscheck' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, dnscheckSummary());
          return;
        }
        if (path === '/api/dnscheck' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createDnscheck(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/dnscheck/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateDnscheck(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/mailqueue' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, mailqueueSummary());
          return;
        }
        if (path === '/api/mailqueue' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createMailqueue(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/mailqueue/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateMailqueue(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/smsqueue' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, smsqueueSummary());
          return;
        }
        if (path === '/api/smsqueue' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSmsqueue(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/smsqueue/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSmsqueue(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/alertrules' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, alertrulesSummary());
          return;
        }
        if (path === '/api/alertrules' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createAlertrules(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/alertrules/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateAlertrules(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/edgecache' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, edgecacheSummary());
          return;
        }
        if (path === '/api/edgecache' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createEdgecache(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/edgecache/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateEdgecache(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/pyramid' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildPyramid());
          return;
        }

        // ── AŞAMA 166–180 ──

        if (path === '/api/signage' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, signageSummary());
          return;
        }
        if (path === '/api/signage' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSignage(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/signage/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSignage(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/wayfind' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, wayfindSummary());
          return;
        }
        if (path === '/api/wayfind' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createWayfind(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/wayfind/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateWayfind(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/beaconmap' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, beaconmapSummary());
          return;
        }
        if (path === '/api/beaconmap' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBeaconmap(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/beaconmap/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBeaconmap(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/iotgates' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, iotgatesSummary());
          return;
        }
        if (path === '/api/iotgates' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createIotgates(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/iotgates/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateIotgates(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/powerops' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, poweropsSummary());
          return;
        }
        if (path === '/api/powerops' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPowerops(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/powerops/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePowerops(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/waterops' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, wateropsSummary());
          return;
        }
        if (path === '/api/waterops' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createWaterops(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/waterops/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateWaterops(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/greenops' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, greenopsSummary());
          return;
        }
        if (path === '/api/greenops' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createGreenops(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/greenops/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateGreenops(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/pestctrl' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, pestctrlSummary());
          return;
        }
        if (path === '/api/pestctrl' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPestctrl(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/pestctrl/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePestctrl(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/chemlog' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, chemlogSummary());
          return;
        }
        if (path === '/api/chemlog' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createChemlog(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/chemlog/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateChemlog(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/poolops' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, poolopsSummary());
          return;
        }
        if (path === '/api/poolops' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPoolops(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/poolops/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePoolops(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/saunaops' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, saunaopsSummary());
          return;
        }
        if (path === '/api/saunaops' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSaunaops(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/saunaops/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSaunaops(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/steamops' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, steamopsSummary());
          return;
        }
        if (path === '/api/steamops' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSteamops(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/steamops/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSteamops(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/icebath' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, icebathSummary());
          return;
        }
        if (path === '/api/icebath' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createIcebath(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/icebath/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateIcebath(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/recovslots' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, recovslotsSummary());
          return;
        }
        if (path === '/api/recovslots' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRecovslots(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/recovslots/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRecovslots(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/signalhub' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildSignalhub());
          return;
        }

        // ── AŞAMA 181–195 ──

        if (path === '/api/helipad' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, helipadSummary());
          return;
        }
        if (path === '/api/helipad' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createHelipad(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/helipad/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateHelipad(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/jetski' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, jetskiSummary());
          return;
        }
        if (path === '/api/jetski' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createJetski(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/jetski/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateJetski(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/yacht' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, yachtSummary());
          return;
        }
        if (path === '/api/yacht' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createYacht(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/yacht/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateYacht(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/surfschool' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, surfschoolSummary());
          return;
        }
        if (path === '/api/surfschool' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSurfschool(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/surfschool/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSurfschool(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/paddle' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, paddleSummary());
          return;
        }
        if (path === '/api/paddle' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPaddle(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/paddle/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePaddle(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/climwall' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, climwallSummary());
          return;
        }
        if (path === '/api/climwall' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createClimwall(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/climwall/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateClimwall(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/escaperoom' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, escaperoomSummary());
          return;
        }
        if (path === '/api/escaperoom' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createEscaperoom(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/escaperoom/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateEscaperoom(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/arcade' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, arcadeSummary());
          return;
        }
        if (path === '/api/arcade' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createArcade(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/arcade/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateArcade(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/bowling' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, bowlingSummary());
          return;
        }
        if (path === '/api/bowling' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBowling(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/bowling/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBowling(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/billiards' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, billiardsSummary());
          return;
        }
        if (path === '/api/billiards' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBilliards(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/billiards/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBilliards(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/pokertable' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, pokertableSummary());
          return;
        }
        if (path === '/api/pokertable' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPokertable(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/pokertable/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePokertable(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/trivia' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, triviaSummary());
          return;
        }
        if (path === '/api/trivia' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createTrivia(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/trivia/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateTrivia(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/djbooth' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, djboothSummary());
          return;
        }
        if (path === '/api/djbooth' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createDjbooth(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/djbooth/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateDjbooth(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/soundcheck' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, soundcheckSummary());
          return;
        }
        if (path === '/api/soundcheck' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSoundcheck(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/soundcheck/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSoundcheck(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/skyline' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildSkyline());
          return;
        }

        // ── AŞAMA 196–210 ──

        if (path === '/api/crowddens' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, crowddensSummary());
          return;
        }
        if (path === '/api/crowddens' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createCrowddens(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/crowddens/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateCrowddens(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/queuetimes' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, queuetimesSummary());
          return;
        }
        if (path === '/api/queuetimes' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createQueuetimes(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/queuetimes/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateQueuetimes(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/lostchild' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, lostchildSummary());
          return;
        }
        if (path === '/api/lostchild' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createLostchild(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/lostchild/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateLostchild(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/firstaid' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, firstaidSummary());
          return;
        }
        if (path === '/api/firstaid' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createFirstaid(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/firstaid/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateFirstaid(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/aedcheck' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, aedcheckSummary());
          return;
        }
        if (path === '/api/aedcheck' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createAedcheck(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/aedcheck/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateAedcheck(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/evacdrill' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, evacdrillSummary());
          return;
        }
        if (path === '/api/evacdrill' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createEvacdrill(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/evacdrill/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateEvacdrill(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/crowdctrl' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, crowdctrlSummary());
          return;
        }
        if (path === '/api/crowdctrl' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createCrowdctrl(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/crowdctrl/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateCrowdctrl(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/radiolog' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, radiologSummary());
          return;
        }
        if (path === '/api/radiolog' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRadiolog(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/radiolog/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRadiolog(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/gatequeue' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, gatequeueSummary());
          return;
        }
        if (path === '/api/gatequeue' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createGatequeue(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/gatequeue/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateGatequeue(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/wristscan' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, wristscanSummary());
          return;
        }
        if (path === '/api/wristscan' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createWristscan(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/wristscan/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateWristscan(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/facepass' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, facepassSummary());
          return;
        }
        if (path === '/api/facepass' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createFacepass(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/facepass/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateFacepass(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/bagcheck' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, bagcheckSummary());
          return;
        }
        if (path === '/api/bagcheck' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBagcheck(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/bagcheck/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBagcheck(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/metaldet' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, metaldetSummary());
          return;
        }
        if (path === '/api/metaldet' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createMetaldet(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/metaldet/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateMetaldet(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/watchlist' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, watchlistSummary());
          return;
        }
        if (path === '/api/watchlist' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createWatchlist(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/watchlist/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateWatchlist(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/sentinel' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildSentinel());
          return;
        }

        // ── AŞAMA 211–225 ──

        if (path === '/api/menuboard' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, menuboardSummary());
          return;
        }
        if (path === '/api/menuboard' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createMenuboard(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/menuboard/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateMenuboard(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/allergenalert' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, allergenalertSummary());
          return;
        }
        if (path === '/api/allergenalert' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createAllergenalert(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/allergenalert/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateAllergenalert(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/tempprobe' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, tempprobeSummary());
          return;
        }
        if (path === '/api/tempprobe' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createTempprobe(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/tempprobe/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateTempprobe(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/prepqueue' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, prepqueueSummary());
          return;
        }
        if (path === '/api/prepqueue' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPrepqueue(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/prepqueue/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePrepqueue(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/voidlog' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, voidlogSummary());
          return;
        }
        if (path === '/api/voidlog' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createVoidlog(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/voidlog/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateVoidlog(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/comps' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, compsSummary());
          return;
        }
        if (path === '/api/comps' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createComps(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/comps/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateComps(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/splitbill' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, splitbillSummary());
          return;
        }
        if (path === '/api/splitbill' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSplitbill(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/splitbill/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSplitbill(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/tabopen' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, tabopenSummary());
          return;
        }
        if (path === '/api/tabopen' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createTabopen(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/tabopen/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateTabopen(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/corkage' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, corkageSummary());
          return;
        }
        if (path === '/api/corkage' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createCorkage(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/corkage/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateCorkage(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/sommelier' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, sommelierSummary());
          return;
        }
        if (path === '/api/sommelier' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSommelier(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/sommelier/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSommelier(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/chefnote' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, chefnoteSummary());
          return;
        }
        if (path === '/api/chefnote' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createChefnote(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/chefnote/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateChefnote(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/passticket' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, passticketSummary());
          return;
        }
        if (path === '/api/passticket' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPassticket(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/passticket/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePassticket(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/zoneheat' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, zoneheatSummary());
          return;
        }
        if (path === '/api/zoneheat' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createZoneheat(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/zoneheat/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateZoneheat(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/revpulse' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, revpulseSummary());
          return;
        }
        if (path === '/api/revpulse' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRevpulse(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/revpulse/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRevpulse(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/horizon' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildHorizon());
          return;
        }

        // ── AŞAMA 226–240 ──

        if (path === '/api/stayext' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, stayextSummary());
          return;
        }
        if (path === '/api/stayext' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createStayext(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/stayext/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateStayext(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/roommove' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, roommoveSummary());
          return;
        }
        if (path === '/api/roommove' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRoommove(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/roommove/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRoommove(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/earlyin' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, earlyinSummary());
          return;
        }
        if (path === '/api/earlyin' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createEarlyin(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/earlyin/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateEarlyin(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/luggage' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, luggageSummary());
          return;
        }
        if (path === '/api/luggage' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createLuggage(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/luggage/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateLuggage(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/turndown' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, turndownSummary());
          return;
        }
        if (path === '/api/turndown' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createTurndown(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/turndown/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateTurndown(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/pillowmenu' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, pillowmenuSummary());
          return;
        }
        if (path === '/api/pillowmenu' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPillowmenu(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/pillowmenu/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePillowmenu(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/scenting' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, scentingSummary());
          return;
        }
        if (path === '/api/scenting' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createScenting(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/scenting/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateScenting(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/dndflags' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, dndflagsSummary());
          return;
        }
        if (path === '/api/dndflags' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createDndflags(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/dndflags/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateDndflags(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/bathstock' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, bathstockSummary());
          return;
        }
        if (path === '/api/bathstock' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBathstock(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/bathstock/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBathstock(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/ironreq' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, ironreqSummary());
          return;
        }
        if (path === '/api/ironreq' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createIronreq(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/ironreq/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateIronreq(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/pressing' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, pressingSummary());
          return;
        }
        if (path === '/api/pressing' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPressing(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/pressing/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePressing(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/shoeshine' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, shoeshineSummary());
          return;
        }
        if (path === '/api/shoeshine' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createShoeshine(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/shoeshine/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateShoeshine(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/babycot' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, babycotSummary());
          return;
        }
        if (path === '/api/babycot' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBabycot(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/babycot/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBabycot(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/petstay' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, petstaySummary());
          return;
        }
        if (path === '/api/petstay' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPetstay(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/petstay/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePetstay(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/meridian' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildMeridian());
          return;
        }

        // ── AŞAMA 241–255 ──

        if (path === '/api/arbill' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, arbillSummary());
          return;
        }
        if (path === '/api/arbill' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createArbill(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/arbill/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateArbill(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/apbill' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, apbillSummary());
          return;
        }
        if (path === '/api/apbill' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createApbill(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/apbill/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateApbill(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/bankrec' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, bankrecSummary());
          return;
        }
        if (path === '/api/bankrec' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBankrec(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/bankrec/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBankrec(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/fxrates' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, fxratesSummary());
          return;
        }
        if (path === '/api/fxrates' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createFxrates(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/fxrates/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateFxrates(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/tipout' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, tipoutSummary());
          return;
        }
        if (path === '/api/tipout' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createTipout(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/tipout/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateTipout(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/deposit' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, depositSummary());
          return;
        }
        if (path === '/api/deposit' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createDeposit(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/deposit/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateDeposit(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/refunds' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, refundsSummary());
          return;
        }
        if (path === '/api/refunds' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRefunds(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/refunds/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRefunds(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/chargeback' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, chargebackSummary());
          return;
        }
        if (path === '/api/chargeback' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createChargeback(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/chargeback/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateChargeback(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/giftred' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, giftredSummary());
          return;
        }
        if (path === '/api/giftred' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createGiftred(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/giftred/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateGiftred(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/memberbill' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, memberbillSummary());
          return;
        }
        if (path === '/api/memberbill' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createMemberbill(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/memberbill/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateMemberbill(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/rateplan' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, rateplanSummary());
          return;
        }
        if (path === '/api/rateplan' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRateplan(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/rateplan/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRateplan(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/channelmgr' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, channelmgrSummary());
          return;
        }
        if (path === '/api/channelmgr' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createChannelmgr(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/channelmgr/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateChannelmgr(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/overbook' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, overbookSummary());
          return;
        }
        if (path === '/api/overbook' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createOverbook(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/overbook/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateOverbook(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/yieldrule' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, yieldruleSummary());
          return;
        }
        if (path === '/api/yieldrule' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createYieldrule(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/yieldrule/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateYieldrule(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/ledger' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildLedger());
          return;
        }

        // ── AŞAMA 256–270 ──

        if (path === '/api/onboarding' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, onboardingSummary());
          return;
        }
        if (path === '/api/onboarding' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createOnboarding(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/onboarding/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateOnboarding(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/offboarding' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, offboardingSummary());
          return;
        }
        if (path === '/api/offboarding' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createOffboarding(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/offboarding/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateOffboarding(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/interviews' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, interviewsSummary());
          return;
        }
        if (path === '/api/interviews' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createInterviews(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/interviews/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateInterviews(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/certifications' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, certificationsSummary());
          return;
        }
        if (path === '/api/certifications' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createCertifications(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/certifications/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateCertifications(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/langskill' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, langskillSummary());
          return;
        }
        if (path === '/api/langskill' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createLangskill(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/langskill/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateLangskill(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/shiftswap' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, shiftswapSummary());
          return;
        }
        if (path === '/api/shiftswap' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createShiftswap(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/shiftswap/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateShiftswap(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/leaverequest' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, leaverequestSummary());
          return;
        }
        if (path === '/api/leaverequest' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createLeaverequest(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/leaverequest/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateLeaverequest(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/attendance' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, attendanceSummary());
          return;
        }
        if (path === '/api/attendance' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createAttendance(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/attendance/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateAttendance(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/performance' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, performanceSummary());
          return;
        }
        if (path === '/api/performance' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPerformance(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/performance/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePerformance(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/recognition' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, recognitionSummary());
          return;
        }
        if (path === '/api/recognition' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRecognition(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/recognition/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRecognition(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/handbook' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, handbookSummary());
          return;
        }
        if (path === '/api/handbook' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createHandbook(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/handbook/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateHandbook(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/safetybrief' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, safetybriefSummary());
          return;
        }
        if (path === '/api/safetybrief' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSafetybrief(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/safetybrief/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSafetybrief(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/nearmiss' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, nearmissSummary());
          return;
        }
        if (path === '/api/nearmiss' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createNearmiss(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/nearmiss/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateNearmiss(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/whistle' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, whistleSummary());
          return;
        }
        if (path === '/api/whistle' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createWhistle(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/whistle/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateWhistle(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/peoplehub' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildPeoplehub());
          return;
        }

        // ── AŞAMA 271–285 ──

        if (path === '/api/carbonlog' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, carbonlogSummary());
          return;
        }
        if (path === '/api/carbonlog' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createCarbonlog(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/carbonlog/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateCarbonlog(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/wateraudit' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, waterauditSummary());
          return;
        }
        if (path === '/api/wateraudit' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createWateraudit(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/wateraudit/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateWateraudit(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/airquality' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, airqualitySummary());
          return;
        }
        if (path === '/api/airquality' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createAirquality(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/airquality/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateAirquality(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/solarops' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, solaropsSummary());
          return;
        }
        if (path === '/api/solarops' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSolarops(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/solarops/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSolarops(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/biodiversity' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, biodiversitySummary());
          return;
        }
        if (path === '/api/biodiversity' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBiodiversity(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/biodiversity/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBiodiversity(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/recycling' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, recyclingSummary());
          return;
        }
        if (path === '/api/recycling' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRecycling(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/recycling/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRecycling(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/greencert' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, greencertSummary());
          return;
        }
        if (path === '/api/greencert' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createGreencert(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/greencert/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateGreencert(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/auditfind' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, auditfindSummary());
          return;
        }
        if (path === '/api/auditfind' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createAuditfind(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/auditfind/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateAuditfind(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/policyack' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, policyackSummary());
          return;
        }
        if (path === '/api/policyack' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPolicyack(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/policyack/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePolicyack(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/dataprotect' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, dataprotectSummary());
          return;
        }
        if (path === '/api/dataprotect' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createDataprotect(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/dataprotect/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateDataprotect(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/retention' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, retentionSummary());
          return;
        }
        if (path === '/api/retention' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRetention(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/retention/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRetention(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/accessreview' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, accessreviewSummary());
          return;
        }
        if (path === '/api/accessreview' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createAccessreview(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/accessreview/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateAccessreview(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/vendorrisk' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, vendorriskSummary());
          return;
        }
        if (path === '/api/vendorrisk' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createVendorrisk(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/vendorrisk/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateVendorrisk(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/legalhold' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, legalholdSummary());
          return;
        }
        if (path === '/api/legalhold' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createLegalhold(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/legalhold/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateLegalhold(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/ecosphere' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildEcosphere());
          return;
        }

        // ── AŞAMA 286–300 ──

        if (path === '/api/presskit' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, presskitSummary());
          return;
        }
        if (path === '/api/presskit' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPresskit(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/presskit/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePresskit(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/influencer' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, influencerSummary());
          return;
        }
        if (path === '/api/influencer' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createInfluencer(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/influencer/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateInfluencer(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/ugcmod' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, ugcmodSummary());
          return;
        }
        if (path === '/api/ugcmod' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createUgcmod(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/ugcmod/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateUgcmod(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/seoaudit' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, seoauditSummary());
          return;
        }
        if (path === '/api/seoaudit' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSeoaudit(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/seoaudit/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSeoaudit(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/adspend' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, adspendSummary());
          return;
        }
        if (path === '/api/adspend' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createAdspend(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/adspend/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateAdspend(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/brandguard' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, brandguardSummary());
          return;
        }
        if (path === '/api/brandguard' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBrandguard(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/brandguard/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBrandguard(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/storyboard' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, storyboardSummary());
          return;
        }
        if (path === '/api/storyboard' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createStoryboard(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/storyboard/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateStoryboard(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/livestream' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, livestreamSummary());
          return;
        }
        if (path === '/api/livestream' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createLivestream(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/livestream/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateLivestream(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/podcastshow' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, podcastshowSummary());
          return;
        }
        if (path === '/api/podcastshow' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPodcastshow(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/podcastshow/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePodcastshow(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/newsletter' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, newsletterSummary());
          return;
        }
        if (path === '/api/newsletter' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createNewsletter(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/newsletter/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateNewsletter(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/tagmap' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, tagmapSummary());
          return;
        }
        if (path === '/api/tagmap' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createTagmap(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/tagmap/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateTagmap(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/socialinbox' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, socialinboxSummary());
          return;
        }
        if (path === '/api/socialinbox' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSocialinbox(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/socialinbox/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSocialinbox(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/mediaembargo' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, mediaembargoSummary());
          return;
        }
        if (path === '/api/mediaembargo' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createMediaembargo(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/mediaembargo/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateMediaembargo(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/creativereq' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, creativereqSummary());
          return;
        }
        if (path === '/api/creativereq' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createCreativereq(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/creativereq/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateCreativereq(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/brandpulse' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildBrandpulse());
          return;
        }

        // ── AŞAMA 301–315 ──

        if (path === '/api/modelops' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, modelopsSummary());
          return;
        }
        if (path === '/api/modelops' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createModelops(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/modelops/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateModelops(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/promptlib' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, promptlibSummary());
          return;
        }
        if (path === '/api/promptlib' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPromptlib(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/promptlib/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePromptlib(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/agenteval' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, agentevalSummary());
          return;
        }
        if (path === '/api/agenteval' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createAgenteval(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/agenteval/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateAgenteval(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/tokenbudget' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, tokenbudgetSummary());
          return;
        }
        if (path === '/api/tokenbudget' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createTokenbudget(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/tokenbudget/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateTokenbudget(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/ragindex' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, ragindexSummary());
          return;
        }
        if (path === '/api/ragindex' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRagindex(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/ragindex/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRagindex(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/toolpermit' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, toolpermitSummary());
          return;
        }
        if (path === '/api/toolpermit' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createToolpermit(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/toolpermit/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateToolpermit(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/sandboxrun' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, sandboxrunSummary());
          return;
        }
        if (path === '/api/sandboxrun' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSandboxrun(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/sandboxrun/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSandboxrun(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/hallucheck' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, hallucheckSummary());
          return;
        }
        if (path === '/api/hallucheck' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createHallucheck(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/hallucheck/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateHallucheck(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/datasetcur' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, datasetcurSummary());
          return;
        }
        if (path === '/api/datasetcur' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createDatasetcur(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/datasetcur/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateDatasetcur(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/redteam' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, redteamSummary());
          return;
        }
        if (path === '/api/redteam' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRedteam(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/redteam/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRedteam(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/slaagent' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, slaagentSummary());
          return;
        }
        if (path === '/api/slaagent' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSlaagent(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/slaagent/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSlaagent(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/costguard' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, costguardSummary());
          return;
        }
        if (path === '/api/costguard' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createCostguard(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/costguard/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateCostguard(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/latencylog' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, latencylogSummary());
          return;
        }
        if (path === '/api/latencylog' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createLatencylog(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/latencylog/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateLatencylog(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/driftmonitor' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, driftmonitorSummary());
          return;
        }
        if (path === '/api/driftmonitor' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createDriftmonitor(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/driftmonitor/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateDriftmonitor(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/cognisphere' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildCognisphere());
          return;
        }

        // ── AŞAMA 316–330 · Omni-Channel & Autonomous Commerce ──

        if (path === '/api/posbridge' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, posbridgeSummary());
          return;
        }
        if (path === '/api/posbridge' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPosbridge(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/posbridge/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePosbridge(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/dynamint' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, dynamintSummary());
          return;
        }
        if (path === '/api/dynamint' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createDynamint(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/dynamint/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateDynamint(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/couriertrack' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, couriertrackSummary());
          return;
        }
        if (path === '/api/couriertrack' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createCouriertrack(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/couriertrack/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateCouriertrack(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/autocheckout' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, autocheckoutSummary());
          return;
        }
        if (path === '/api/autocheckout' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createAutocheckout(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/autocheckout/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateAutocheckout(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/loyaltyburn' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, loyaltyburnSummary());
          return;
        }
        if (path === '/api/loyaltyburn' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createLoyaltyburn(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/loyaltyburn/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateLoyaltyburn(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/treatoffer' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, treatofferSummary());
          return;
        }
        if (path === '/api/treatoffer' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createTreatoffer(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/treatoffer/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateTreatoffer(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/omnimarket' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, omnimarketSummary());
          return;
        }
        if (path === '/api/omnimarket' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createOmnimarket(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/omnimarket/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateOmnimarket(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/clickcollect' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, clickcollectSummary());
          return;
        }
        if (path === '/api/clickcollect' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createClickcollect(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/clickcollect/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateClickcollect(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/lastmile' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, lastmileSummary());
          return;
        }
        if (path === '/api/lastmile' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createLastmile(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/lastmile/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateLastmile(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/invsync' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, invsyncSummary());
          return;
        }
        if (path === '/api/invsync' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createInvsync(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/invsync/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateInvsync(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/pricepush' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, pricepushSummary());
          return;
        }
        if (path === '/api/pricepush' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPricepush(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/pricepush/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePricepush(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/qrpay' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, qrpaySummary());
          return;
        }
        if (path === '/api/qrpay' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createQrpay(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/qrpay/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateQrpay(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/courierpool' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, courierpoolSummary());
          return;
        }
        if (path === '/api/courierpool' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createCourierpool(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/courierpool/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateCourierpool(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/giftrelay' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, giftrelaySummary());
          return;
        }
        if (path === '/api/giftrelay' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createGiftrelay(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/giftrelay/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateGiftrelay(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/vanguard' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildVanguard());
          return;
        }

        // ── Edge Mesh · Lattice (AŞAMA 331–345) ──

        if (path === '/api/edgegate' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, edgegateSummary());
          return;
        }
        if (path === '/api/edgegate' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createEdgegate(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/edgegate/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateEdgegate(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/meshlink' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, meshlinkSummary());
          return;
        }
        if (path === '/api/meshlink' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createMeshlink(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/meshlink/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateMeshlink(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/radiomesh' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, radiomeshSummary());
          return;
        }
        if (path === '/api/radiomesh' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRadiomesh(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/radiomesh/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRadiomesh(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/sensorfuse' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, sensorfuseSummary());
          return;
        }
        if (path === '/api/sensorfuse' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSensorfuse(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/sensorfuse/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSensorfuse(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/otafirm' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, otafirmSummary());
          return;
        }
        if (path === '/api/otafirm' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createOtafirm(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/otafirm/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateOtafirm(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/devinventory' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, devinventorySummary());
          return;
        }
        if (path === '/api/devinventory' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createDevinventory(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/devinventory/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateDevinventory(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/powerbudget' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, powerbudgetSummary());
          return;
        }
        if (path === '/api/powerbudget' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPowerbudget(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/powerbudget/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePowerbudget(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/backhaul' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, backhaulSummary());
          return;
        }
        if (path === '/api/backhaul' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBackhaul(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/backhaul/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBackhaul(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/edgecache2' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, edgecache2Summary());
          return;
        }
        if (path === '/api/edgecache2' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createEdgecache2(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/edgecache2/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateEdgecache2(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/syncrepl' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, syncreplSummary());
          return;
        }
        if (path === '/api/syncrepl' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSyncrepl(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/syncrepl/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSyncrepl(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/failover' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, failoverSummary());
          return;
        }
        if (path === '/api/failover' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createFailover(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/failover/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateFailover(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/telemetry' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, telemetrySummary());
          return;
        }
        if (path === '/api/telemetry' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createTelemetry(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/telemetry/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateTelemetry(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/netslice' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, netsliceSummary());
          return;
        }
        if (path === '/api/netslice' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createNetslice(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/netslice/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateNetslice(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/satlink' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, satlinkSummary());
          return;
        }
        if (path === '/api/satlink' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSatlink(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/satlink/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSatlink(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/lattice' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildLattice());
          return;
        }

        // ── Guest Twin · Mirror (AŞAMA 346–360) ──

        if (path === '/api/guesttwin' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, guesttwinSummary());
          return;
        }
        if (path === '/api/guesttwin' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createGuesttwin(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/guesttwin/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateGuesttwin(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/prefgraph' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, prefgraphSummary());
          return;
        }
        if (path === '/api/prefgraph' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPrefgraph(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/prefgraph/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePrefgraph(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/intentscore' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, intentscoreSummary());
          return;
        }
        if (path === '/api/intentscore' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createIntentscore(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/intentscore/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateIntentscore(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/nextbest' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, nextbestSummary());
          return;
        }
        if (path === '/api/nextbest' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createNextbest(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/nextbest/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateNextbest(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/journeymap' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, journeymapSummary());
          return;
        }
        if (path === '/api/journeymap' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createJourneymap(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/journeymap/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateJourneymap(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/microseg' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, microsegSummary());
          return;
        }
        if (path === '/api/microseg' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createMicroseg(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/microseg/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateMicroseg(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/offerlab' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, offerlabSummary());
          return;
        }
        if (path === '/api/offerlab' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createOfferlab(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/offerlab/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateOfferlab(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/consentgraph' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, consentgraphSummary());
          return;
        }
        if (path === '/api/consentgraph' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createConsentgraph(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/consentgraph/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateConsentgraph(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/emotionpulse' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, emotionpulseSummary());
          return;
        }
        if (path === '/api/emotionpulse' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createEmotionpulse(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/emotionpulse/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateEmotionpulse(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/servicememory' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, servicememorySummary());
          return;
        }
        if (path === '/api/servicememory' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createServicememory(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/servicememory/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateServicememory(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/recoverypath' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, recoverypathSummary());
          return;
        }
        if (path === '/api/recoverypath' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRecoverypath(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/recoverypath/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRecoverypath(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/lifetimeval' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, lifetimevalSummary());
          return;
        }
        if (path === '/api/lifetimeval' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createLifetimeval(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/lifetimeval/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateLifetimeval(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/churnrisk' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, churnriskSummary());
          return;
        }
        if (path === '/api/churnrisk' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createChurnrisk(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/churnrisk/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateChurnrisk(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/wowmoment' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, wowmomentSummary());
          return;
        }
        if (path === '/api/wowmoment' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createWowmoment(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/wowmoment/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateWowmoment(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/mirror' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildMirror());
          return;
        }

        // ── Command Fabric · Keystone (AŞAMA 361–375) ──

        if (path === '/api/incidentbus' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, incidentbusSummary());
          return;
        }
        if (path === '/api/incidentbus' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createIncidentbus(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/incidentbus/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateIncidentbus(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/playtrigger' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, playtriggerSummary());
          return;
        }
        if (path === '/api/playtrigger' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPlaytrigger(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/playtrigger/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePlaytrigger(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/escalation' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, escalationSummary());
          return;
        }
        if (path === '/api/escalation' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createEscalation(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/escalation/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateEscalation(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/warroomseat' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, warroomseatSummary());
          return;
        }
        if (path === '/api/warroomseat' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createWarroomseat(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/warroomseat/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateWarroomseat(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/decisionlog' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, decisionlogSummary());
          return;
        }
        if (path === '/api/decisionlog' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createDecisionlog(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/decisionlog/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateDecisionlog(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/slotrack' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, slotrackSummary());
          return;
        }
        if (path === '/api/slotrack' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createSlotrack(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/slotrack/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateSlotrack(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/errorbudget' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, errorbudgetSummary());
          return;
        }
        if (path === '/api/errorbudget' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createErrorbudget(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/errorbudget/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateErrorbudget(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/changewindow' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, changewindowSummary());
          return;
        }
        if (path === '/api/changewindow' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createChangewindow(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/changewindow/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateChangewindow(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/blameless' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, blamelessSummary());
          return;
        }
        if (path === '/api/blameless' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBlameless(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/blameless/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBlameless(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/pagerduty' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, pagerdutySummary());
          return;
        }
        if (path === '/api/pagerduty' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPagerduty(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/pagerduty/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePagerduty(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/statuspage' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, statuspageSummary());
          return;
        }
        if (path === '/api/statuspage' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createStatuspage(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/statuspage/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateStatuspage(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/runbooklink' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, runbooklinkSummary());
          return;
        }
        if (path === '/api/runbooklink' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRunbooklink(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/runbooklink/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRunbooklink(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/commsbridge' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, commsbridgeSummary());
          return;
        }
        if (path === '/api/commsbridge' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createCommsbridge(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/commsbridge/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateCommsbridge(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/afteraction' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, afteractionSummary());
          return;
        }
        if (path === '/api/afteraction' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createAfteraction(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/afteraction/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateAfteraction(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/keystone' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildKeystone());
          return;
        }

        // ── Revenue OS · Zenith (AŞAMA 376–390) ──

        if (path === '/api/revstream' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, revstreamSummary());
          return;
        }
        if (path === '/api/revstream' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createRevstream(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/revstream/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateRevstream(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/packagemix' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, packagemixSummary());
          return;
        }
        if (path === '/api/packagemix' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPackagemix(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/packagemix/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePackagemix(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/ancillary' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, ancillarySummary());
          return;
        }
        if (path === '/api/ancillary' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createAncillary(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/ancillary/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateAncillary(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/dynamicbundle' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, dynamicbundleSummary());
          return;
        }
        if (path === '/api/dynamicbundle' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createDynamicbundle(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/dynamicbundle/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateDynamicbundle(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/pricefloor' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, pricefloorSummary());
          return;
        }
        if (path === '/api/pricefloor' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPricefloor(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/pricefloor/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePricefloor(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/compset' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, compsetSummary());
          return;
        }
        if (path === '/api/compset' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createCompset(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/compset/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateCompset(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/pickuppace' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, pickuppaceSummary());
          return;
        }
        if (path === '/api/pickuppace' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPickuppace(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/pickuppace/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePickuppace(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/noshowrisk' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, noshowriskSummary());
          return;
        }
        if (path === '/api/noshowrisk' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createNoshowrisk(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/noshowrisk/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateNoshowrisk(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/walkinflow' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, walkinflowSummary());
          return;
        }
        if (path === '/api/walkinflow' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createWalkinflow(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/walkinflow/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateWalkinflow(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/tableturn' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, tableturnSummary());
          return;
        }
        if (path === '/api/tableturn' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createTableturn(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/tableturn/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateTableturn(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/beatrevenue' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, beatrevenueSummary());
          return;
        }
        if (path === '/api/beatrevenue' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createBeatrevenue(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/beatrevenue/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateBeatrevenue(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/cashforecast' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, cashforecastSummary());
          return;
        }
        if (path === '/api/cashforecast' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createCashforecast(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/cashforecast/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateCashforecast(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/marginwatch' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, marginwatchSummary());
          return;
        }
        if (path === '/api/marginwatch' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createMarginwatch(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/marginwatch/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updateMarginwatch(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }


        if (path === '/api/promoattr' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, promoattrSummary());
          return;
        }
        if (path === '/api/promoattr' && req.method === 'POST') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            sendJson(res, 200, { item: createPromoattr(await readBody(req), user.username) });
          })();
          return;
        }
        if (path.startsWith('/api/promoattr/') && req.method === 'PATCH') {
          const user = requireUser(req, res);
          if (!user) return;
          void (async () => {
            const item = updatePromoattr(path.split('/')[3], await readBody(req), user.username);
            if (!item) { sendJson(res, 404, { error: 'Kayıt bulunamadı' }); return; }
            sendJson(res, 200, { item });
          })();
          return;
        }

        if (path === '/api/zenith' && req.method === 'GET') {
          if (!requireUser(req, res)) return;
          sendJson(res, 200, buildZenith());
          return;
        }

        next();
  };
}

export function platformPlugin() {
  return {
    name: 'likya-platform',
    configureServer(server) {
      server.middlewares.use(createPlatformMiddleware());
    },
  };
}

/** Entegrasyon katmanından kalıcı log yazmak için. */
export function persistWhatsapp(entry) {
  const list = prependItem('whatsapp', entry, 100);
  appendAudit({
    actor: 'REMINDER-AI',
    action: 'whatsapp.send',
    detail: String(entry.body ?? '').slice(0, 100),
    meta: { provider: entry.provider, status: entry.status, guest: entry.guest },
  });
  return list;
}

export function persistNexusEvent(event) {
  const list = prependItem('nexus-events', event, 200);
  if (event.action !== 'protocol_ready') {
    appendAudit({
      actor: 'NEXUS',
      action: `nexus.${event.action}`,
      detail: event.detail || event.deviceId,
      meta: { deviceId: event.deviceId, ok: event.ok },
    });
  }
  return list;
}

export function readWhatsapp() {
  return readCollection('whatsapp', []);
}

export function readNexusEvents() {
  return readCollection('nexus-events', []);
}

export { writeCollection, readCollection };
