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
