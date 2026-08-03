import { lazy, Suspense, useCallback, useEffect, useState, type ComponentType } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';

/** Lazy page chunks — Lab/stage + kampüs (LoginPage eager) */
const AbcopyPage = lazy(() => import('./pages/AbcopyPage'));
const AbtestPage = lazy(() => import('./pages/AbtestPage'));
const Accessgate2Page = lazy(() => import('./pages/Accessgate2Page'));
const Accessgate3Page = lazy(() => import('./pages/Accessgate3Page'));
const AccessgatePage = lazy(() => import('./pages/AccessgatePage'));
const AccessreviewPage = lazy(() => import('./pages/AccessreviewPage'));
const AdslotPage = lazy(() => import('./pages/AdslotPage'));
const AdspendPage = lazy(() => import('./pages/AdspendPage'));
const AedcheckPage = lazy(() => import('./pages/AedcheckPage'));
const AegisfinalPage = lazy(() => import('./pages/AegisfinalPage'));
const AegisPage = lazy(() => import('./pages/AegisPage'));
const AetherPage = lazy(() => import('./pages/AetherPage'));
const AffiliatenetPage = lazy(() => import('./pages/AffiliatenetPage'));
const AfteractionPage = lazy(() => import('./pages/AfteractionPage'));
const AgentbridgePage = lazy(() => import('./pages/AgentbridgePage'));
const AgentqueuePage = lazy(() => import('./pages/AgentqueuePage'));
const GreenpulsePage = lazy(() => import('./pages/GreenpulsePage'));
const CampusbriefPage = lazy(() => import('./pages/CampusbriefPage'));
const AgentfleetPage = lazy(() => import('./pages/AgentfleetPage'));
const AgentcourtPage = lazy(() => import('./pages/AgentcourtPage'));
const AgentevalPage = lazy(() => import('./pages/AgentevalPage'));
const Agentpulse2Page = lazy(() => import('./pages/Agentpulse2Page'));
const Agentpulse3Page = lazy(() => import('./pages/Agentpulse3Page'));
const AgentpulsePage = lazy(() => import('./pages/AgentpulsePage'));
const AgentsPanel = lazy(() => import('./pages/AgentsPanel'));
const Agora2Page = lazy(() => import('./pages/Agora2Page'));
const AgoraPage = lazy(() => import('./pages/AgoraPage'));
const AidkitPage = lazy(() => import('./pages/AidkitPage'));
const AirqualityPage = lazy(() => import('./pages/AirqualityPage'));
const Alertfuse2Page = lazy(() => import('./pages/Alertfuse2Page'));
const Alertfuse3Page = lazy(() => import('./pages/Alertfuse3Page'));
const AlertfusePage = lazy(() => import('./pages/AlertfusePage'));
const AlertrulesPage = lazy(() => import('./pages/AlertrulesPage'));
const AllergenalertPage = lazy(() => import('./pages/AllergenalertPage'));
const AllergenmapPage = lazy(() => import('./pages/AllergenmapPage'));
const AllergensPage = lazy(() => import('./pages/AllergensPage'));
const Alliance2Page = lazy(() => import('./pages/Alliance2Page'));
const Alliance3Page = lazy(() => import('./pages/Alliance3Page'));
const AlliancePage = lazy(() => import('./pages/AlliancePage'));
const AlumniPage = lazy(() => import('./pages/AlumniPage'));
const Ambassador22Page = lazy(() => import('./pages/Ambassador22Page'));
const Ambassador23Page = lazy(() => import('./pages/Ambassador23Page'));
const Ambassador2Page = lazy(() => import('./pages/Ambassador2Page'));
const AmenitiesPage = lazy(() => import('./pages/AmenitiesPage'));
const AmensavePage = lazy(() => import('./pages/AmensavePage'));
const AncillaryPage = lazy(() => import('./pages/AncillaryPage'));
const AnniversaryPage = lazy(() => import('./pages/AnniversaryPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const AnomalyPage = lazy(() => import('./pages/AnomalyPage'));
const ApbillPage = lazy(() => import('./pages/ApbillPage'));
const ApdeskPage = lazy(() => import('./pages/ApdeskPage'));
const ApexPage = lazy(() => import('./pages/ApexPage'));
const Apigateway2Page = lazy(() => import('./pages/Apigateway2Page'));
const Apigateway3Page = lazy(() => import('./pages/Apigateway3Page'));
const ApigatewayPage = lazy(() => import('./pages/ApigatewayPage'));
const ApikeysPage = lazy(() => import('./pages/ApikeysPage'));
const ApotheosisPage = lazy(() => import('./pages/ApotheosisPage'));
const ArbillPage = lazy(() => import('./pages/ArbillPage'));
const ArcadePage = lazy(() => import('./pages/ArcadePage'));
const ArchiveboxPage = lazy(() => import('./pages/ArchiveboxPage'));
const ArdeskPage = lazy(() => import('./pages/ArdeskPage'));
const ArenabookPage = lazy(() => import('./pages/ArenabookPage'));
const ArrivalboardPage = lazy(() => import('./pages/ArrivalboardPage'));
const Artery2Page = lazy(() => import('./pages/Artery2Page'));
const ArteryPage = lazy(() => import('./pages/ArteryPage'));
const ArtifactPage = lazy(() => import('./pages/ArtifactPage'));
const ArtwallPage = lazy(() => import('./pages/ArtwallPage'));
const Asntrack2Page = lazy(() => import('./pages/Asntrack2Page'));
const Asntrack3Page = lazy(() => import('./pages/Asntrack3Page'));
const AsntrackPage = lazy(() => import('./pages/AsntrackPage'));
const AssetlibPage = lazy(() => import('./pages/AssetlibPage'));
const AssetmapPage = lazy(() => import('./pages/AssetmapPage'));
const AssetsPage = lazy(() => import('./pages/AssetsPage'));
const AssortmixPage = lazy(() => import('./pages/AssortmixPage'));
const AthleteosPage = lazy(() => import('./pages/AthleteosPage'));
const AtlasPage = lazy(() => import('./pages/AtlasPage'));
const AtmosmixPage = lazy(() => import('./pages/AtmosmixPage'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const AttritionPage = lazy(() => import('./pages/AttritionPage'));
const Auditevidence2Page = lazy(() => import('./pages/Auditevidence2Page'));
const Auditevidence3Page = lazy(() => import('./pages/Auditevidence3Page'));
const AuditevidencePage = lazy(() => import('./pages/AuditevidencePage'));
const AuditfindPage = lazy(() => import('./pages/AuditfindPage'));
const AuditPage = lazy(() => import('./pages/AuditPage'));
const Audittrail2Page = lazy(() => import('./pages/Audittrail2Page'));
const AuroradeckPage = lazy(() => import('./pages/AuroradeckPage'));
const AuroraPage = lazy(() => import('./pages/AuroraPage'));
const AutocheckoutPage = lazy(() => import('./pages/AutocheckoutPage'));
const B2border2Page = lazy(() => import('./pages/B2border2Page'));
const B2border3Page = lazy(() => import('./pages/B2border3Page'));
const B2borderPage = lazy(() => import('./pages/B2borderPage'));
const BabycotPage = lazy(() => import('./pages/BabycotPage'));
const BackhaulPage = lazy(() => import('./pages/BackhaulPage'));
const Backupjob2Page = lazy(() => import('./pages/Backupjob2Page'));
const Backupjob3Page = lazy(() => import('./pages/Backupjob3Page'));
const BackupjobPage = lazy(() => import('./pages/BackupjobPage'));
const BackupschedPage = lazy(() => import('./pages/BackupschedPage'));
const Badgeearn2Page = lazy(() => import('./pages/Badgeearn2Page'));
const Badgeearn3Page = lazy(() => import('./pages/Badgeearn3Page'));
const BadgeearnPage = lazy(() => import('./pages/BadgeearnPage'));
const BadgeprintPage = lazy(() => import('./pages/BadgeprintPage'));
const BagcheckPage = lazy(() => import('./pages/BagcheckPage'));
const BagstorePage = lazy(() => import('./pages/BagstorePage'));
const BakeryPage = lazy(() => import('./pages/BakeryPage'));
const BandsPage = lazy(() => import('./pages/BandsPage'));
const BankreconPage = lazy(() => import('./pages/BankreconPage'));
const BankrecPage = lazy(() => import('./pages/BankrecPage'));
const BanquetPage = lazy(() => import('./pages/BanquetPage'));
const BarrailPage = lazy(() => import('./pages/BarrailPage'));
const Bastion2Page = lazy(() => import('./pages/Bastion2Page'));
const BastionPage = lazy(() => import('./pages/BastionPage'));
const Bathritual2Page = lazy(() => import('./pages/Bathritual2Page'));
const Bathritual3Page = lazy(() => import('./pages/Bathritual3Page'));
const BathritualPage = lazy(() => import('./pages/BathritualPage'));
const BathstockPage = lazy(() => import('./pages/BathstockPage'));
const BazaarPage = lazy(() => import('./pages/BazaarPage'));
const BeachbedsPage = lazy(() => import('./pages/BeachbedsPage'));
const BeaconmapPage = lazy(() => import('./pages/BeaconmapPage'));
const BeaconPage = lazy(() => import('./pages/BeaconPage'));
const BeatrevenuePage = lazy(() => import('./pages/BeatrevenuePage'));
const BeddingPage = lazy(() => import('./pages/BeddingPage'));
const BetboardPage = lazy(() => import('./pages/BetboardPage'));
const BikerentPage = lazy(() => import('./pages/BikerentPage'));
const BilliardsPage = lazy(() => import('./pages/BilliardsPage'));
const BiodiversityPage = lazy(() => import('./pages/BiodiversityPage'));
const BiomarkerPage = lazy(() => import('./pages/BiomarkerPage'));
const BiometricsPage = lazy(() => import('./pages/BiometricsPage'));
const BiosurveyPage = lazy(() => import('./pages/BiosurveyPage'));
const BlamelessPage = lazy(() => import('./pages/BlamelessPage'));
const BoardmotionPage = lazy(() => import('./pages/BoardmotionPage'));
const BoardpackPage = lazy(() => import('./pages/BoardpackPage'));
const Boardpulse2Page = lazy(() => import('./pages/Boardpulse2Page'));
const Boardpulse3Page = lazy(() => import('./pages/Boardpulse3Page'));
const BoardpulsePage = lazy(() => import('./pages/BoardpulsePage'));
const Boardresolve2Page = lazy(() => import('./pages/Boardresolve2Page'));
const Boardresolve3Page = lazy(() => import('./pages/Boardresolve3Page'));
const BoardresolvePage = lazy(() => import('./pages/BoardresolvePage'));
const BoltholdPage = lazy(() => import('./pages/BoltholdPage'));
const BoostdeskPage = lazy(() => import('./pages/BoostdeskPage'));
const BowlingPage = lazy(() => import('./pages/BowlingPage'));
const BrandambassPage = lazy(() => import('./pages/BrandambassPage'));
const BrandbiblePage = lazy(() => import('./pages/BrandbiblePage'));
const BrandguardPage = lazy(() => import('./pages/BrandguardPage'));
const Brandheat2Page = lazy(() => import('./pages/Brandheat2Page'));
const Brandheat3Page = lazy(() => import('./pages/Brandheat3Page'));
const BrandheatPage = lazy(() => import('./pages/BrandheatPage'));
const BrandkitPage = lazy(() => import('./pages/BrandkitPage'));
const BrandpulsePage = lazy(() => import('./pages/BrandpulsePage'));
const BrandrolloutPage = lazy(() => import('./pages/BrandrolloutPage'));
const BrandsPage = lazy(() => import('./pages/BrandsPage'));
const Breachlog2Page = lazy(() => import('./pages/Breachlog2Page'));
const Breachlog3Page = lazy(() => import('./pages/Breachlog3Page'));
const BreachlogPage = lazy(() => import('./pages/BreachlogPage'));
const BreakfastPage = lazy(() => import('./pages/BreakfastPage'));
const BreathworkPage = lazy(() => import('./pages/BreathworkPage'));
const BriefdeskPage = lazy(() => import('./pages/BriefdeskPage'));
const BriefPage = lazy(() => import('./pages/BriefPage'));
const BudgetlinePage = lazy(() => import('./pages/BudgetlinePage'));
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
const BugtrackerPage = lazy(() => import('./pages/BugtrackerPage'));
const BuildphasePage = lazy(() => import('./pages/BuildphasePage'));
const Cachemesh2Page = lazy(() => import('./pages/Cachemesh2Page'));
const Cachemesh3Page = lazy(() => import('./pages/Cachemesh3Page'));
const CachemeshPage = lazy(() => import('./pages/CachemeshPage'));
const CalibdeskPage = lazy(() => import('./pages/CalibdeskPage'));
const CallsheetPage = lazy(() => import('./pages/CallsheetPage'));
const Calmroom2Page = lazy(() => import('./pages/Calmroom2Page'));
const Calmroom3Page = lazy(() => import('./pages/Calmroom3Page'));
const CalmroomPage = lazy(() => import('./pages/CalmroomPage'));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage'));
const CampdeskPage = lazy(() => import('./pages/CampdeskPage'));
const CampglowPage = lazy(() => import('./pages/CampglowPage'));
const CampuscorePage = lazy(() => import('./pages/CampuscorePage'));
const CampusMapPage = lazy(() => import('./pages/CampusMapPage'));
const Canaryrun2Page = lazy(() => import('./pages/Canaryrun2Page'));
const Canaryrun3Page = lazy(() => import('./pages/Canaryrun3Page'));
const CanaryrunPage = lazy(() => import('./pages/CanaryrunPage'));
const CapexdeskPage = lazy(() => import('./pages/CapexdeskPage'));
const CapexPage = lazy(() => import('./pages/CapexPage'));
const CapextablePage = lazy(() => import('./pages/CapextablePage'));
const CaptablePage = lazy(() => import('./pages/CaptablePage'));
const CarbonledgerPage = lazy(() => import('./pages/CarbonledgerPage'));
const CarbonlogPage = lazy(() => import('./pages/CarbonlogPage'));
const CrudopsPage = lazy(() => import('./pages/CrudopsPage'));
const Carecall2Page = lazy(() => import('./pages/Carecall2Page'));
const Carecall3Page = lazy(() => import('./pages/Carecall3Page'));
const CarecallPage = lazy(() => import('./pages/CarecallPage'));
const Carrierbid2Page = lazy(() => import('./pages/Carrierbid2Page'));
const Carrierbid3Page = lazy(() => import('./pages/Carrierbid3Page'));
const CarrierbidPage = lazy(() => import('./pages/CarrierbidPage'));
const CashflowPage = lazy(() => import('./pages/CashflowPage'));
const CashforecastPage = lazy(() => import('./pages/CashforecastPage'));
const CashPage = lazy(() => import('./pages/CashPage'));
const Cashpulse2Page = lazy(() => import('./pages/Cashpulse2Page'));
const Cashpulse3Page = lazy(() => import('./pages/Cashpulse3Page'));
const CashpulsePage = lazy(() => import('./pages/CashpulsePage'));
const CategorybuyPage = lazy(() => import('./pages/CategorybuyPage'));
const CaterdeskPage = lazy(() => import('./pages/CaterdeskPage'));
const CctvlogPage = lazy(() => import('./pages/CctvlogPage'));
const CctvreviewPage = lazy(() => import('./pages/CctvreviewPage'));
const Cdnedge2Page = lazy(() => import('./pages/Cdnedge2Page'));
const Cdnedge3Page = lazy(() => import('./pages/Cdnedge3Page'));
const CdnedgePage = lazy(() => import('./pages/CdnedgePage'));
const CellarboxPage = lazy(() => import('./pages/CellarboxPage'));
const CertificationsPage = lazy(() => import('./pages/CertificationsPage'));
const CertrenewPage = lazy(() => import('./pages/CertrenewPage'));
const CerttrackPage = lazy(() => import('./pages/CerttrackPage'));
const ChangewindowPage = lazy(() => import('./pages/ChangewindowPage'));
const Channelkit2Page = lazy(() => import('./pages/Channelkit2Page'));
const Channelkit3Page = lazy(() => import('./pages/Channelkit3Page'));
const ChannelkitPage = lazy(() => import('./pages/ChannelkitPage'));
const ChannelmgrPage = lazy(() => import('./pages/ChannelmgrPage'));
const Chaosdrill2Page = lazy(() => import('./pages/Chaosdrill2Page'));
const Chaosdrill3Page = lazy(() => import('./pages/Chaosdrill3Page'));
const ChaosdrillPage = lazy(() => import('./pages/ChaosdrillPage'));
const Chapter2Page = lazy(() => import('./pages/Chapter2Page'));
const Chapter3Page = lazy(() => import('./pages/Chapter3Page'));
const ChapterPage = lazy(() => import('./pages/ChapterPage'));
const ChargebackPage = lazy(() => import('./pages/ChargebackPage'));
const Charter2Page = lazy(() => import('./pages/Charter2Page'));
const CharterPage = lazy(() => import('./pages/CharterPage'));
const ChecklistsPage = lazy(() => import('./pages/ChecklistsPage'));
const ChefbriefPage = lazy(() => import('./pages/ChefbriefPage'));
const ChefnotePage = lazy(() => import('./pages/ChefnotePage'));
const ChemlogPage = lazy(() => import('./pages/ChemlogPage'));
const ChronosPage = lazy(() => import('./pages/ChronosPage'));
const ChurnriskPage = lazy(() => import('./pages/ChurnriskPage'));
const CinemaPage = lazy(() => import('./pages/CinemaPage'));
const Circle2Page = lazy(() => import('./pages/Circle2Page'));
const Circle3Page = lazy(() => import('./pages/Circle3Page'));
const CirclePage = lazy(() => import('./pages/CirclePage'));
const Circuit2Page = lazy(() => import('./pages/Circuit2Page'));
const CircuitPage = lazy(() => import('./pages/CircuitPage'));
const CitadelPage = lazy(() => import('./pages/CitadelPage'));
const Claimdesk2Page = lazy(() => import('./pages/Claimdesk2Page'));
const Claimdesk3Page = lazy(() => import('./pages/Claimdesk3Page'));
const ClaimdeskPage = lazy(() => import('./pages/ClaimdeskPage'));
const CleaningPage = lazy(() => import('./pages/CleaningPage'));
const ClickcollectPage = lazy(() => import('./pages/ClickcollectPage'));
const CliffpathPage = lazy(() => import('./pages/CliffpathPage'));
const ClimategoalPage = lazy(() => import('./pages/ClimategoalPage'));
const ClimwallPage = lazy(() => import('./pages/ClimwallPage'));
const ClosebookPage = lazy(() => import('./pages/ClosebookPage'));
const ClubnightPage = lazy(() => import('./pages/ClubnightPage'));
const Cmdpulse2Page = lazy(() => import('./pages/Cmdpulse2Page'));
const Cmdpulse3Page = lazy(() => import('./pages/Cmdpulse3Page'));
const CmdpulsePage = lazy(() => import('./pages/CmdpulsePage'));
const CoastpatrolPage = lazy(() => import('./pages/CoastpatrolPage'));
const CognispherePage = lazy(() => import('./pages/CognispherePage'));
const Cohort2Page = lazy(() => import('./pages/Cohort2Page'));
const Cohort3Page = lazy(() => import('./pages/Cohort3Page'));
const CohortPage = lazy(() => import('./pages/CohortPage'));
const Coinvest2Page = lazy(() => import('./pages/Coinvest2Page'));
const Coinvest3Page = lazy(() => import('./pages/Coinvest3Page'));
const CoinvestPage = lazy(() => import('./pages/CoinvestPage'));
const ColdbayPage = lazy(() => import('./pages/ColdbayPage'));
const Coldchain22Page = lazy(() => import('./pages/Coldchain22Page'));
const Coldchain23Page = lazy(() => import('./pages/Coldchain23Page'));
const Coldchain2Page = lazy(() => import('./pages/Coldchain2Page'));
const ColdchainPage = lazy(() => import('./pages/ColdchainPage'));
const Coldsite2Page = lazy(() => import('./pages/Coldsite2Page'));
const Coldsite3Page = lazy(() => import('./pages/Coldsite3Page'));
const ColdsitePage = lazy(() => import('./pages/ColdsitePage'));
const CommandCenter = lazy(() => import('./pages/CommandCenter'));
const Commission2Page = lazy(() => import('./pages/Commission2Page'));
const Commission3Page = lazy(() => import('./pages/Commission3Page'));
const CommissionPage = lazy(() => import('./pages/CommissionPage'));
const Commsbridge22Page = lazy(() => import('./pages/Commsbridge22Page'));
const Commsbridge23Page = lazy(() => import('./pages/Commsbridge23Page'));
const Commsbridge2Page = lazy(() => import('./pages/Commsbridge2Page'));
const CommsbridgePage = lazy(() => import('./pages/CommsbridgePage'));
const ComplaintsPage = lazy(() => import('./pages/ComplaintsPage'));
const Compliance22Page = lazy(() => import('./pages/Compliance22Page'));
const Compliance23Page = lazy(() => import('./pages/Compliance23Page'));
const Compliance2Page = lazy(() => import('./pages/Compliance2Page'));
const CompliancerowPage = lazy(() => import('./pages/CompliancerowPage'));
const CompsetPage = lazy(() => import('./pages/CompsetPage'));
const CompsPage = lazy(() => import('./pages/CompsPage'));
const ConciergejobPage = lazy(() => import('./pages/ConciergejobPage'));
const ConciergePage = lazy(() => import('./pages/ConciergePage'));
const ConsentgraphPage = lazy(() => import('./pages/ConsentgraphPage'));
const ConsentPage = lazy(() => import('./pages/ConsentPage'));
const Consentrow2Page = lazy(() => import('./pages/Consentrow2Page'));
const Consentrow3Page = lazy(() => import('./pages/Consentrow3Page'));
const ConsentrowPage = lazy(() => import('./pages/ConsentrowPage'));
const ConstellatePage = lazy(() => import('./pages/ConstellatePage'));
const ContainerPage = lazy(() => import('./pages/ContainerPage'));
const ContentcalPage = lazy(() => import('./pages/ContentcalPage'));
const ContentPage = lazy(() => import('./pages/ContentPage'));
const ContentrightsPage = lazy(() => import('./pages/ContentrightsPage'));
const Contractrow2Page = lazy(() => import('./pages/Contractrow2Page'));
const Contractrow3Page = lazy(() => import('./pages/Contractrow3Page'));
const ContractrowPage = lazy(() => import('./pages/ContractrowPage'));
const ContractsPage = lazy(() => import('./pages/ContractsPage'));
const ConvoyPage = lazy(() => import('./pages/ConvoyPage'));
const CorkagePage = lazy(() => import('./pages/CorkagePage'));
const CorrectivePage = lazy(() => import('./pages/CorrectivePage'));
const CostcenterPage = lazy(() => import('./pages/CostcenterPage'));
const CostguardPage = lazy(() => import('./pages/CostguardPage'));
const CourierpoolPage = lazy(() => import('./pages/CourierpoolPage'));
const CouriertrackPage = lazy(() => import('./pages/CouriertrackPage'));
const CraneopsPage = lazy(() => import('./pages/CraneopsPage'));
const CreativereqPage = lazy(() => import('./pages/CreativereqPage'));
const CreatordeskPage = lazy(() => import('./pages/CreatordeskPage'));
const CreatorpayPage = lazy(() => import('./pages/CreatorpayPage'));
const Crossdock2Page = lazy(() => import('./pages/Crossdock2Page'));
const Crossdock3Page = lazy(() => import('./pages/Crossdock3Page'));
const CrossdockPage = lazy(() => import('./pages/CrossdockPage'));
const CrowdctrlPage = lazy(() => import('./pages/CrowdctrlPage'));
const CrowddensPage = lazy(() => import('./pages/CrowddensPage'));
const CrownfinalPage = lazy(() => import('./pages/CrownfinalPage'));
const CrownPage = lazy(() => import('./pages/CrownPage'));
const Crucible2Page = lazy(() => import('./pages/Crucible2Page'));
const CruciblePage = lazy(() => import('./pages/CruciblePage'));
const CryochamberPage = lazy(() => import('./pages/CryochamberPage'));
const CulturecodePage = lazy(() => import('./pages/CulturecodePage'));
const CulturepulsePage = lazy(() => import('./pages/CulturepulsePage'));
const CulturescenePage = lazy(() => import('./pages/CulturescenePage'));
const DarkstorePage = lazy(() => import('./pages/DarkstorePage'));
const DatalakePage = lazy(() => import('./pages/DatalakePage'));
const Datapriv2Page = lazy(() => import('./pages/Datapriv2Page'));
const Datapriv3Page = lazy(() => import('./pages/Datapriv3Page'));
const DataprivPage = lazy(() => import('./pages/DataprivPage'));
const DataprotectPage = lazy(() => import('./pages/DataprotectPage'));
const DatasetcatPage = lazy(() => import('./pages/DatasetcatPage'));
const DatasetcurPage = lazy(() => import('./pages/DatasetcurPage'));
const DawnmodePage = lazy(() => import('./pages/DawnmodePage'));
const DawnservicePage = lazy(() => import('./pages/DawnservicePage'));
const DazeChefPage = lazy(() => import('./pages/DazeChefPage'));
const DazeCrewPage = lazy(() => import('./pages/DazeCrewPage'));
const DazeHubPage = lazy(() => import('./pages/DazeHubPage'));
const DazeroomPage = lazy(() => import('./pages/DazeroomPage'));
const DazeVisionPage = lazy(() => import('./pages/DazeVisionPage'));
const Dealroom2Page = lazy(() => import('./pages/Dealroom2Page'));
const Dealroom3Page = lazy(() => import('./pages/Dealroom3Page'));
const DealroomPage = lazy(() => import('./pages/DealroomPage'));
const DecidlogPage = lazy(() => import('./pages/DecidlogPage'));
const Decisionhub2Page = lazy(() => import('./pages/Decisionhub2Page'));
const Decisionhub3Page = lazy(() => import('./pages/Decisionhub3Page'));
const DecisionhubPage = lazy(() => import('./pages/DecisionhubPage'));
const DecisionlogPage = lazy(() => import('./pages/DecisionlogPage'));
const DeepcleanPage = lazy(() => import('./pages/DeepcleanPage'));
const DefectlogPage = lazy(() => import('./pages/DefectlogPage'));
const DeliveryPage = lazy(() => import('./pages/DeliveryPage'));
const DemandcastPage = lazy(() => import('./pages/DemandcastPage'));
const DemandplanPage = lazy(() => import('./pages/DemandplanPage'));
const DemurragePage = lazy(() => import('./pages/DemurragePage'));
const DepartureboardPage = lazy(() => import('./pages/DepartureboardPage'));
const DepositPage = lazy(() => import('./pages/DepositPage'));
const DeskqueuePage = lazy(() => import('./pages/DeskqueuePage'));
const Devicetrust2Page = lazy(() => import('./pages/Devicetrust2Page'));
const Devicetrust3Page = lazy(() => import('./pages/Devicetrust3Page'));
const DevicetrustPage = lazy(() => import('./pages/DevicetrustPage'));
const DevinventoryPage = lazy(() => import('./pages/DevinventoryPage'));
const DigestPage = lazy(() => import('./pages/DigestPage'));
const DispatchboardPage = lazy(() => import('./pages/DispatchboardPage'));
const DivePage = lazy(() => import('./pages/DivePage'));
const DjboothPage = lazy(() => import('./pages/DjboothPage'));
const DndflagsPage = lazy(() => import('./pages/DndflagsPage'));
const DnscheckPage = lazy(() => import('./pages/DnscheckPage'));
const DockslotPage = lazy(() => import('./pages/DockslotPage'));
const Dockyard2Page = lazy(() => import('./pages/Dockyard2Page'));
const Dockyard3Page = lazy(() => import('./pages/Dockyard3Page'));
const DockyardPage = lazy(() => import('./pages/DockyardPage'));
const DocsPage = lazy(() => import('./pages/DocsPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const DolaplistPage = lazy(() => import('./pages/DolaplistPage'));
const Dominion2Page = lazy(() => import('./pages/Dominion2Page'));
const DominionPage = lazy(() => import('./pages/DominionPage'));
const Donation2Page = lazy(() => import('./pages/Donation2Page'));
const Donation3Page = lazy(() => import('./pages/Donation3Page'));
const DonationPage = lazy(() => import('./pages/DonationPage'));
const DriftmonitorPage = lazy(() => import('./pages/DriftmonitorPage'));
const DrillrunPage = lazy(() => import('./pages/DrillrunPage'));
const Drillscore2Page = lazy(() => import('./pages/Drillscore2Page'));
const Drillscore3Page = lazy(() => import('./pages/Drillscore3Page'));
const DrillscorePage = lazy(() => import('./pages/DrillscorePage'));
const DriverostPage = lazy(() => import('./pages/DriverostPage'));
const Drplan2Page = lazy(() => import('./pages/Drplan2Page'));
const Drplan3Page = lazy(() => import('./pages/Drplan3Page'));
const DrplanPage = lazy(() => import('./pages/DrplanPage'));
const DuneopsPage = lazy(() => import('./pages/DuneopsPage'));
const DynamicbundlePage = lazy(() => import('./pages/DynamicbundlePage'));
const DynamintPage = lazy(() => import('./pages/DynamintPage'));
const EarlycheckPage = lazy(() => import('./pages/EarlycheckPage'));
const EarlyinPage = lazy(() => import('./pages/EarlyinPage'));
const EcospherePage = lazy(() => import('./pages/EcospherePage'));
const Edgecache2Page = lazy(() => import('./pages/Edgecache2Page'));
const EdgecachePage = lazy(() => import('./pages/EdgecachePage'));
const EdgegatePage = lazy(() => import('./pages/EdgegatePage'));
const ElevatorlogPage = lazy(() => import('./pages/ElevatorlogPage'));
const ElysiumPage = lazy(() => import('./pages/ElysiumPage'));
const EmailblastPage = lazy(() => import('./pages/EmailblastPage'));
const EmergencyPage = lazy(() => import('./pages/EmergencyPage'));
const EmotionpulsePage = lazy(() => import('./pages/EmotionpulsePage'));
const EmpirefinalPage = lazy(() => import('./pages/EmpirefinalPage'));
const EmpirePage = lazy(() => import('./pages/EmpirePage'));
const EnergybidPage = lazy(() => import('./pages/EnergybidPage'));
const EnergyPage = lazy(() => import('./pages/EnergyPage'));
const Errorbudget2Page = lazy(() => import('./pages/Errorbudget2Page'));
const Errorbudget3Page = lazy(() => import('./pages/Errorbudget3Page'));
const Errorbudget4Page = lazy(() => import('./pages/Errorbudget4Page'));
const ErrorbudgetPage = lazy(() => import('./pages/ErrorbudgetPage'));
const EscalationPage = lazy(() => import('./pages/EscalationPage'));
const EscaperoomPage = lazy(() => import('./pages/EscaperoomPage'));
const EsgauditPage = lazy(() => import('./pages/EsgauditPage'));
const EstatescanPage = lazy(() => import('./pages/EstatescanPage'));
const EternallogPage = lazy(() => import('./pages/EternallogPage'));
const Ethicsline2Page = lazy(() => import('./pages/Ethicsline2Page'));
const Ethicsline3Page = lazy(() => import('./pages/Ethicsline3Page'));
const EthicslinePage = lazy(() => import('./pages/EthicslinePage'));
const EvacdrillPage = lazy(() => import('./pages/EvacdrillPage'));
const EvacroutePage = lazy(() => import('./pages/EvacroutePage'));
const EvalbenchPage = lazy(() => import('./pages/EvalbenchPage'));
const EvchargerPage = lazy(() => import('./pages/EvchargerPage'));
const Eventbus2Page = lazy(() => import('./pages/Eventbus2Page'));
const Eventbus3Page = lazy(() => import('./pages/Eventbus3Page'));
const EventbusPage = lazy(() => import('./pages/EventbusPage'));
const EventcalPage = lazy(() => import('./pages/EventcalPage'));
const EventstreamPage = lazy(() => import('./pages/EventstreamPage'));
const Exceptionlog2Page = lazy(() => import('./pages/Exceptionlog2Page'));
const Exceptionlog3Page = lazy(() => import('./pages/Exceptionlog3Page'));
const ExceptionlogPage = lazy(() => import('./pages/ExceptionlogPage'));
const ExpansionPage = lazy(() => import('./pages/ExpansionPage'));
const ExportsPage = lazy(() => import('./pages/ExportsPage'));
const ExtlinksPage = lazy(() => import('./pages/ExtlinksPage'));
const ExtremeParkPage = lazy(() => import('./pages/ExtremeParkPage'));
const FacepassPage = lazy(() => import('./pages/FacepassPage'));
const FacilitytourPage = lazy(() => import('./pages/FacilitytourPage'));
const Failover2Page = lazy(() => import('./pages/Failover2Page'));
const Failover3Page = lazy(() => import('./pages/Failover3Page'));
const Failover4Page = lazy(() => import('./pages/Failover4Page'));
const FailoverPage = lazy(() => import('./pages/FailoverPage'));
const FamilycampPage = lazy(() => import('./pages/FamilycampPage'));
const Farewell2Page = lazy(() => import('./pages/Farewell2Page'));
const Farewell3Page = lazy(() => import('./pages/Farewell3Page'));
const FarewellPage = lazy(() => import('./pages/FarewellPage'));
const FeatureflagPage = lazy(() => import('./pages/FeatureflagPage'));
const Featuregate2Page = lazy(() => import('./pages/Featuregate2Page'));
const Featuregate3Page = lazy(() => import('./pages/Featuregate3Page'));
const FeaturegatePage = lazy(() => import('./pages/FeaturegatePage'));
const Feedbackloop2Page = lazy(() => import('./pages/Feedbackloop2Page'));
const Feedbackloop3Page = lazy(() => import('./pages/Feedbackloop3Page'));
const FeedbackloopPage = lazy(() => import('./pages/FeedbackloopPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const FfespecPage = lazy(() => import('./pages/FfespecPage'));
const FieldPage = lazy(() => import('./pages/FieldPage'));
const FinalbriefPage = lazy(() => import('./pages/FinalbriefPage'));
const FiredrillPage = lazy(() => import('./pages/FiredrillPage'));
const FirstaidPage = lazy(() => import('./pages/FirstaidPage'));
const FixgatePage = lazy(() => import('./pages/FixgatePage'));
const FlashPage = lazy(() => import('./pages/FlashPage'));
const FleetdeskPage = lazy(() => import('./pages/FleetdeskPage'));
const FleetPage = lazy(() => import('./pages/FleetPage'));
const FloatpodPage = lazy(() => import('./pages/FloatpodPage'));
const FloralsPage = lazy(() => import('./pages/FloralsPage'));
const FogscenePage = lazy(() => import('./pages/FogscenePage'));
const FoliodeskPage = lazy(() => import('./pages/FoliodeskPage'));
const FolioPage = lazy(() => import('./pages/FolioPage'));
const ForecastPage = lazy(() => import('./pages/ForecastPage'));
const ForgePage = lazy(() => import('./pages/ForgePage'));
const Forummod2Page = lazy(() => import('./pages/Forummod2Page'));
const Forummod3Page = lazy(() => import('./pages/Forummod3Page'));
const ForummodPage = lazy(() => import('./pages/ForummodPage'));
const FoundationPage = lazy(() => import('./pages/FoundationPage'));
const FoundersnotePage = lazy(() => import('./pages/FoundersnotePage'));
const FoundlogPage = lazy(() => import('./pages/FoundlogPage'));
const Franchise2Page = lazy(() => import('./pages/Franchise2Page'));
const Franchise3Page = lazy(() => import('./pages/Franchise3Page'));
const FranchisePage = lazy(() => import('./pages/FranchisePage'));
const Freightbill2Page = lazy(() => import('./pages/Freightbill2Page'));
const Freightbill3Page = lazy(() => import('./pages/Freightbill3Page'));
const FreightbillPage = lazy(() => import('./pages/FreightbillPage'));
const FrontierPage = lazy(() => import('./pages/FrontierPage'));
const FrontlogPage = lazy(() => import('./pages/FrontlogPage'));
const FuelcardPage = lazy(() => import('./pages/FuelcardPage'));
const FxdeskPage = lazy(() => import('./pages/FxdeskPage'));
const FxratesPage = lazy(() => import('./pages/FxratesPage'));
const GaiaPage = lazy(() => import('./pages/GaiaPage'));
const GardebayPage = lazy(() => import('./pages/GardebayPage'));
const GatepassPage = lazy(() => import('./pages/GatepassPage'));
const GatequeuePage = lazy(() => import('./pages/GatequeuePage'));
const GiftcardPage = lazy(() => import('./pages/GiftcardPage'));
const GiftcardsPage = lazy(() => import('./pages/GiftcardsPage'));
const GiftredPage = lazy(() => import('./pages/GiftredPage'));
const GiftrelayPage = lazy(() => import('./pages/GiftrelayPage'));
const GlmapPage = lazy(() => import('./pages/GlmapPage'));
const GolivePage = lazy(() => import('./pages/GolivePage'));
const GpspingPage = lazy(() => import('./pages/GpspingPage'));
const GreenbondPage = lazy(() => import('./pages/GreenbondPage'));
const GreencertPage = lazy(() => import('./pages/GreencertPage'));
const GreenopsPage = lazy(() => import('./pages/GreenopsPage'));
const GreenteamPage = lazy(() => import('./pages/GreenteamPage'));
const GroupsPage = lazy(() => import('./pages/GroupsPage'));
const GuestappPage = lazy(() => import('./pages/GuestappPage'));
const GuestcasePage = lazy(() => import('./pages/GuestcasePage'));
const GuestflowPage = lazy(() => import('./pages/GuestflowPage'));
const Guestheat2Page = lazy(() => import('./pages/Guestheat2Page'));
const Guestheat3Page = lazy(() => import('./pages/Guestheat3Page'));
const GuestheatPage = lazy(() => import('./pages/GuestheatPage'));
const GuestrequestPage = lazy(() => import('./pages/GuestrequestPage'));
const GuestsafetyPage = lazy(() => import('./pages/GuestsafetyPage'));
const GuestsPage = lazy(() => import('./pages/GuestsPage'));
const GuesttwinPage = lazy(() => import('./pages/GuesttwinPage'));
const GuestvoicePage = lazy(() => import('./pages/GuestvoicePage'));
const HaccpPage = lazy(() => import('./pages/HaccpPage'));
const Hackday2Page = lazy(() => import('./pages/Hackday2Page'));
const Hackday3Page = lazy(() => import('./pages/Hackday3Page'));
const HackdayPage = lazy(() => import('./pages/HackdayPage'));
const HallucheckPage = lazy(() => import('./pages/HallucheckPage'));
const HammamPage = lazy(() => import('./pages/HammamPage'));
const HandbookPage = lazy(() => import('./pages/HandbookPage'));
const HandoverPage = lazy(() => import('./pages/HandoverPage'));
const HapticcuePage = lazy(() => import('./pages/HapticcuePage'));
const HarborlanePage = lazy(() => import('./pages/HarborlanePage'));
const HarborPage = lazy(() => import('./pages/HarborPage'));
const HazardnotePage = lazy(() => import('./pages/HazardnotePage'));
const HazmatbayPage = lazy(() => import('./pages/HazmatbayPage'));
const HeadcountPage = lazy(() => import('./pages/HeadcountPage'));
const HealthcardsPage = lazy(() => import('./pages/HealthcardsPage'));
const HearthPage = lazy(() => import('./pages/HearthPage'));
const HeliosPage = lazy(() => import('./pages/HeliosPage'));
const HelipadPage = lazy(() => import('./pages/HelipadPage'));
const HephapickPage = lazy(() => import('./pages/HephapickPage'));
const HeritagePage = lazy(() => import('./pages/HeritagePage'));
const HkboardPage = lazy(() => import('./pages/HkboardPage'));
const HoldingsealPage = lazy(() => import('./pages/HoldingsealPage'));
const HorizonPage = lazy(() => import('./pages/HorizonPage'));
const Hotspare2Page = lazy(() => import('./pages/Hotspare2Page'));
const Hotspare3Page = lazy(() => import('./pages/Hotspare3Page'));
const HotsparePage = lazy(() => import('./pages/HotsparePage'));
const HoursPage = lazy(() => import('./pages/HoursPage'));
const HvacloopPage = lazy(() => import('./pages/HvacloopPage'));
const Hypothesis2Page = lazy(() => import('./pages/Hypothesis2Page'));
const Hypothesis3Page = lazy(() => import('./pages/Hypothesis3Page'));
const HypothesisPage = lazy(() => import('./pages/HypothesisPage'));
const I18nPage = lazy(() => import('./pages/I18nPage'));
const IcebathPage = lazy(() => import('./pages/IcebathPage'));
const Idproof2Page = lazy(() => import('./pages/Idproof2Page'));
const Idproof3Page = lazy(() => import('./pages/Idproof3Page'));
const IdproofPage = lazy(() => import('./pages/IdproofPage'));
const ImmersivePage = lazy(() => import('./pages/ImmersivePage'));
const Inboundpo2Page = lazy(() => import('./pages/Inboundpo2Page'));
const Inboundpo3Page = lazy(() => import('./pages/Inboundpo3Page'));
const InboundpoPage = lazy(() => import('./pages/InboundpoPage'));
const IncidentbusPage = lazy(() => import('./pages/IncidentbusPage'));
const IncidentlogPage = lazy(() => import('./pages/IncidentlogPage'));
const IncidentsPage = lazy(() => import('./pages/IncidentsPage'));
const Incubate2Page = lazy(() => import('./pages/Incubate2Page'));
const Incubate3Page = lazy(() => import('./pages/Incubate3Page'));
const IncubatePage = lazy(() => import('./pages/IncubatePage'));
const InfluencerPage = lazy(() => import('./pages/InfluencerPage'));
const InsightboardPage = lazy(() => import('./pages/InsightboardPage'));
const InspectroomPage = lazy(() => import('./pages/InspectroomPage'));
const InsurancePage = lazy(() => import('./pages/InsurancePage'));
const Insurancet2Page = lazy(() => import('./pages/Insurancet2Page'));
const Insurancet3Page = lazy(() => import('./pages/Insurancet3Page'));
const InsurancetPage = lazy(() => import('./pages/InsurancetPage'));
const IntentscorePage = lazy(() => import('./pages/IntentscorePage'));
const InterviewsPage = lazy(() => import('./pages/InterviewsPage'));
const Inventoryage2Page = lazy(() => import('./pages/Inventoryage2Page'));
const Inventoryage3Page = lazy(() => import('./pages/Inventoryage3Page'));
const InventoryagePage = lazy(() => import('./pages/InventoryagePage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const InvoicedeskPage = lazy(() => import('./pages/InvoicedeskPage'));
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'));
const InvsyncPage = lazy(() => import('./pages/InvsyncPage'));
const IotgatesPage = lazy(() => import('./pages/IotgatesPage'));
const Ipvault2Page = lazy(() => import('./pages/Ipvault2Page'));
const Ipvault3Page = lazy(() => import('./pages/Ipvault3Page'));
const IpvaultPage = lazy(() => import('./pages/IpvaultPage'));
const IronreqPage = lazy(() => import('./pages/IronreqPage'));
const IsotrackPage = lazy(() => import('./pages/IsotrackPage'));
const IvloungePage = lazy(() => import('./pages/IvloungePage'));
const JetskiPage = lazy(() => import('./pages/JetskiPage'));
const Jobqueue22Page = lazy(() => import('./pages/Jobqueue22Page'));
const Jobqueue23Page = lazy(() => import('./pages/Jobqueue23Page'));
const Jobqueue2Page = lazy(() => import('./pages/Jobqueue2Page'));
const JobsPage = lazy(() => import('./pages/JobsPage'));
const Jointpromo2Page = lazy(() => import('./pages/Jointpromo2Page'));
const Jointpromo3Page = lazy(() => import('./pages/Jointpromo3Page'));
const JointpromoPage = lazy(() => import('./pages/JointpromoPage'));
const JourneymapPage = lazy(() => import('./pages/JourneymapPage'));
const KairosPage = lazy(() => import('./pages/KairosPage'));
const KaraokePage = lazy(() => import('./pages/KaraokePage'));
const KdsPage = lazy(() => import('./pages/KdsPage'));
const KeycardsPage = lazy(() => import('./pages/KeycardsPage'));
const KeydeskPage = lazy(() => import('./pages/KeydeskPage'));
const KeylessdoorPage = lazy(() => import('./pages/KeylessdoorPage'));
const KeystonePage = lazy(() => import('./pages/KeystonePage'));
const KidsclubPage = lazy(() => import('./pages/KidsclubPage'));
const KudosPage = lazy(() => import('./pages/KudosPage'));
const Kycrow2Page = lazy(() => import('./pages/Kycrow2Page'));
const Kycrow3Page = lazy(() => import('./pages/Kycrow3Page'));
const KycrowPage = lazy(() => import('./pages/KycrowPage'));
const Labbench2Page = lazy(() => import('./pages/Labbench2Page'));
const Labbench3Page = lazy(() => import('./pages/Labbench3Page'));
const LabbenchPage = lazy(() => import('./pages/LabbenchPage'));
const Labbudget2Page = lazy(() => import('./pages/Labbudget2Page'));
const Labbudget3Page = lazy(() => import('./pages/Labbudget3Page'));
const LabbudgetPage = lazy(() => import('./pages/LabbudgetPage'));
const LabresultPage = lazy(() => import('./pages/LabresultPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LandleasePage = lazy(() => import('./pages/LandleasePage'));
const LanecontrolPage = lazy(() => import('./pages/LanecontrolPage'));
const LangskillPage = lazy(() => import('./pages/LangskillPage'));
const LastmilePage = lazy(() => import('./pages/LastmilePage'));
const LatecheckPage = lazy(() => import('./pages/LatecheckPage'));
const LatencylogPage = lazy(() => import('./pages/LatencylogPage'));
const LateoutPage = lazy(() => import('./pages/LateoutPage'));
const LatticePage = lazy(() => import('./pages/LatticePage'));
const LaunchpadPage = lazy(() => import('./pages/LaunchpadPage'));
const LaundryPage = lazy(() => import('./pages/LaundryPage'));
const LeadmagnetPage = lazy(() => import('./pages/LeadmagnetPage'));
const Leadshare2Page = lazy(() => import('./pages/Leadshare2Page'));
const Leadshare3Page = lazy(() => import('./pages/Leadshare3Page'));
const LeadsharePage = lazy(() => import('./pages/LeadsharePage'));
const LeaseholdPage = lazy(() => import('./pages/LeaseholdPage'));
const LeaverequestPage = lazy(() => import('./pages/LeaverequestPage'));
const LedgerPage = lazy(() => import('./pages/LedgerPage'));
const LegacyarcPage = lazy(() => import('./pages/LegacyarcPage'));
const LegacycodePage = lazy(() => import('./pages/LegacycodePage'));
const Legacyflag2Page = lazy(() => import('./pages/Legacyflag2Page'));
const Legacyflag3Page = lazy(() => import('./pages/Legacyflag3Page'));
const LegacyflagPage = lazy(() => import('./pages/LegacyflagPage'));
const LegacygiftPage = lazy(() => import('./pages/LegacygiftPage'));
const Legaldesk2Page = lazy(() => import('./pages/Legaldesk2Page'));
const Legaldesk3Page = lazy(() => import('./pages/Legaldesk3Page'));
const LegaldeskPage = lazy(() => import('./pages/LegaldeskPage'));
const LegalholdPage = lazy(() => import('./pages/LegalholdPage'));
const LicensesPage = lazy(() => import('./pages/LicensesPage'));
const LifecoachPage = lazy(() => import('./pages/LifecoachPage'));
const LifetimevalPage = lazy(() => import('./pages/LifetimevalPage'));
const LightshowPage = lazy(() => import('./pages/LightshowPage'));
const LineagePage = lazy(() => import('./pages/LineagePage'));
const LinenPage = lazy(() => import('./pages/LinenPage'));
const LinenroomPage = lazy(() => import('./pages/LinenroomPage'));
const Litigation2Page = lazy(() => import('./pages/Litigation2Page'));
const Litigation3Page = lazy(() => import('./pages/Litigation3Page'));
const LitigationPage = lazy(() => import('./pages/LitigationPage'));
const LivecastPage = lazy(() => import('./pages/LivecastPage'));
const LivestreamPage = lazy(() => import('./pages/LivestreamPage'));
const LocalhirePage = lazy(() => import('./pages/LocalhirePage'));
const LockersPage = lazy(() => import('./pages/LockersPage'));
const LockouttagPage = lazy(() => import('./pages/LockouttagPage'));
const LogosPage = lazy(() => import('./pages/LogosPage'));
const LookoutPage = lazy(() => import('./pages/LookoutPage'));
const LostchildPage = lazy(() => import('./pages/LostchildPage'));
const LostFoundPage = lazy(() => import('./pages/LostFoundPage'));
const LoungePage = lazy(() => import('./pages/LoungePage'));
const LoyaltyburnPage = lazy(() => import('./pages/LoyaltyburnPage'));
const Loyaltyhug2Page = lazy(() => import('./pages/Loyaltyhug2Page'));
const Loyaltyhug3Page = lazy(() => import('./pages/Loyaltyhug3Page'));
const LoyaltyhugPage = lazy(() => import('./pages/LoyaltyhugPage'));
const LoyaltyPage = lazy(() => import('./pages/LoyaltyPage'));
const LuggagePage = lazy(() => import('./pages/LuggagePage'));
const MailqueuePage = lazy(() => import('./pages/MailqueuePage'));
const MaintenancePage = lazy(() => import('./pages/MaintenancePage'));
const ManifestPage = lazy(() => import('./pages/ManifestPage'));
const MarginwatchPage = lazy(() => import('./pages/MarginwatchPage'));
const MarinaPage = lazy(() => import('./pages/MarinaPage'));
const MarketosPage = lazy(() => import('./pages/MarketosPage'));
const MarketscanPage = lazy(() => import('./pages/MarketscanPage'));
const MassagebookPage = lazy(() => import('./pages/MassagebookPage'));
const MasterplanPage = lazy(() => import('./pages/MasterplanPage'));
const MediabuyPage = lazy(() => import('./pages/MediabuyPage'));
const MediaembargoPage = lazy(() => import('./pages/MediaembargoPage'));
const MediakitPage = lazy(() => import('./pages/MediakitPage'));
const MediawallPage = lazy(() => import('./pages/MediawallPage'));
const MeetingroomsPage = lazy(() => import('./pages/MeetingroomsPage'));
const Meetup2Page = lazy(() => import('./pages/Meetup2Page'));
const Meetup3Page = lazy(() => import('./pages/Meetup3Page'));
const MeetupPage = lazy(() => import('./pages/MeetupPage'));
const MemberbillPage = lazy(() => import('./pages/MemberbillPage'));
const MemberdeskPage = lazy(() => import('./pages/MemberdeskPage'));
const Memberhub2Page = lazy(() => import('./pages/Memberhub2Page'));
const Memberhub3Page = lazy(() => import('./pages/Memberhub3Page'));
const MemberhubPage = lazy(() => import('./pages/MemberhubPage'));
const Memorybook2Page = lazy(() => import('./pages/Memorybook2Page'));
const Memorybook3Page = lazy(() => import('./pages/Memorybook3Page'));
const MemorybookPage = lazy(() => import('./pages/MemorybookPage'));
const MentorshipPage = lazy(() => import('./pages/MentorshipPage'));
const MenuboardPage = lazy(() => import('./pages/MenuboardPage'));
const MenuPage = lazy(() => import('./pages/MenuPage'));
const MeridianPage = lazy(() => import('./pages/MeridianPage'));
const MeshlinkPage = lazy(() => import('./pages/MeshlinkPage'));
const MetaldetPage = lazy(() => import('./pages/MetaldetPage'));
const Metricslab2Page = lazy(() => import('./pages/Metricslab2Page'));
const Metricslab3Page = lazy(() => import('./pages/Metricslab3Page'));
const MetricslabPage = lazy(() => import('./pages/MetricslabPage'));
const MetricsPage = lazy(() => import('./pages/MetricsPage'));
const Mfareg2Page = lazy(() => import('./pages/Mfareg2Page'));
const Mfareg3Page = lazy(() => import('./pages/Mfareg3Page'));
const MfaregPage = lazy(() => import('./pages/MfaregPage'));
const MicrosegPage = lazy(() => import('./pages/MicrosegPage'));
const Milestonet2Page = lazy(() => import('./pages/Milestonet2Page'));
const Milestonet3Page = lazy(() => import('./pages/Milestonet3Page'));
const MilestonetPage = lazy(() => import('./pages/MilestonetPage'));
const MinibarbayPage = lazy(() => import('./pages/MinibarbayPage'));
const MinibarPage = lazy(() => import('./pages/MinibarPage'));
const MintbundlePage = lazy(() => import('./pages/MintbundlePage'));
const MirrorPage = lazy(() => import('./pages/MirrorPage'));
const MiseplanPage = lazy(() => import('./pages/MiseplanPage'));
const MoatwatchPage = lazy(() => import('./pages/MoatwatchPage'));
const MocktailsPage = lazy(() => import('./pages/MocktailsPage'));
const ModelcardPage = lazy(() => import('./pages/ModelcardPage'));
const ModelopsPage = lazy(() => import('./pages/ModelopsPage'));
const Momentmap2Page = lazy(() => import('./pages/Momentmap2Page'));
const Momentmap3Page = lazy(() => import('./pages/Momentmap3Page'));
const MomentmapPage = lazy(() => import('./pages/MomentmapPage'));
const MonumentPage = lazy(() => import('./pages/MonumentPage'));
const MoodlightPage = lazy(() => import('./pages/MoodlightPage'));
const MoveticketPage = lazy(() => import('./pages/MoveticketPage'));
const MuseumdeskPage = lazy(() => import('./pages/MuseumdeskPage'));
const MusicPage = lazy(() => import('./pages/MusicPage'));
const MysteryguestPage = lazy(() => import('./pages/MysteryguestPage'));
const MysteryshopPage = lazy(() => import('./pages/MysteryshopPage'));
const MythosPage = lazy(() => import('./pages/MythosPage'));
const NearmissPage = lazy(() => import('./pages/NearmissPage'));
const NetslicePage = lazy(() => import('./pages/NetslicePage'));
const Netsplit2Page = lazy(() => import('./pages/Netsplit2Page'));
const Netsplit3Page = lazy(() => import('./pages/Netsplit3Page'));
const NetsplitPage = lazy(() => import('./pages/NetsplitPage'));
const NewsletterPage = lazy(() => import('./pages/NewsletterPage'));
const NextbestPage = lazy(() => import('./pages/NextbestPage'));
const NexusgatePage = lazy(() => import('./pages/NexusgatePage'));
const NexusPanel = lazy(() => import('./pages/NexusPanel'));
const NightauditPage = lazy(() => import('./pages/NightauditPage'));
const NightlogPage = lazy(() => import('./pages/NightlogPage'));
const NightlyPage = lazy(() => import('./pages/NightlyPage'));
const NightmodePage = lazy(() => import('./pages/NightmodePage'));
const NightswimPage = lazy(() => import('./pages/NightswimPage'));
const NorthstarPage = lazy(() => import('./pages/NorthstarPage'));
const NoshowriskPage = lazy(() => import('./pages/NoshowriskPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const NpsdeepPage = lazy(() => import('./pages/NpsdeepPage'));
const NpspulsePage = lazy(() => import('./pages/NpspulsePage'));
const NutritionPage = lazy(() => import('./pages/NutritionPage'));
const Observemap2Page = lazy(() => import('./pages/Observemap2Page'));
const Observemap3Page = lazy(() => import('./pages/Observemap3Page'));
const ObservemapPage = lazy(() => import('./pages/ObservemapPage'));
const OdysseyPage = lazy(() => import('./pages/OdysseyPage'));
const OffboardingPage = lazy(() => import('./pages/OffboardingPage'));
const OfferlabPage = lazy(() => import('./pages/OfferlabPage'));
const OffsetbuyPage = lazy(() => import('./pages/OffsetbuyPage'));
const OkrrackPage = lazy(() => import('./pages/OkrrackPage'));
const OllamaPanel = lazy(() => import('./pages/OllamaPanel'));
const OlymposPassPanel = lazy(() => import('./pages/OlymposPassPanel'));
const OlympulsePage = lazy(() => import('./pages/OlympulsePage'));
const OlympusPage = lazy(() => import('./pages/OlympusPage'));
const OmnimarketPage = lazy(() => import('./pages/OmnimarketPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const Onboardkit2Page = lazy(() => import('./pages/Onboardkit2Page'));
const Onboardkit3Page = lazy(() => import('./pages/Onboardkit3Page'));
const OnboardkitPage = lazy(() => import('./pages/OnboardkitPage'));
const OpenmallPage = lazy(() => import('./pages/OpenmallPage'));
const OpexdeskPage = lazy(() => import('./pages/OpexdeskPage'));
const Opsheat2Page = lazy(() => import('./pages/Opsheat2Page'));
const Opsheat3Page = lazy(() => import('./pages/Opsheat3Page'));
const OpsheatPage = lazy(() => import('./pages/OpsheatPage'));
const OpsPage = lazy(() => import('./pages/OpsPage'));
const OraclePage = lazy(() => import('./pages/OraclePage'));
const OralhistoryPage = lazy(() => import('./pages/OralhistoryPage'));
const OrbitPage = lazy(() => import('./pages/OrbitPage'));
const OtafirmPage = lazy(() => import('./pages/OtafirmPage'));
const OtareviewsPage = lazy(() => import('./pages/OtareviewsPage'));
const Outboundso2Page = lazy(() => import('./pages/Outboundso2Page'));
const Outboundso3Page = lazy(() => import('./pages/Outboundso3Page'));
const OutboundsoPage = lazy(() => import('./pages/OutboundsoPage'));
const OutoforderPage = lazy(() => import('./pages/OutoforderPage'));
const OverbookPage = lazy(() => import('./pages/OverbookPage'));
const OvertimePage = lazy(() => import('./pages/OvertimePage'));
const PackagemixPage = lazy(() => import('./pages/PackagemixPage'));
const PackfolioPage = lazy(() => import('./pages/PackfolioPage'));
const PaddlePage = lazy(() => import('./pages/PaddlePage'));
const PagerdutyPage = lazy(() => import('./pages/PagerdutyPage'));
const ParcelsPage = lazy(() => import('./pages/ParcelsPage'));
const ParkingbayPage = lazy(() => import('./pages/ParkingbayPage'));
const Partnerdesk2Page = lazy(() => import('./pages/Partnerdesk2Page'));
const Partnerdesk3Page = lazy(() => import('./pages/Partnerdesk3Page'));
const PartnerdeskPage = lazy(() => import('./pages/PartnerdeskPage'));
const PartnersPage = lazy(() => import('./pages/PartnersPage'));
const PassrailPage = lazy(() => import('./pages/PassrailPage'));
const PassstockPage = lazy(() => import('./pages/PassstockPage'));
const PassticketPage = lazy(() => import('./pages/PassticketPage'));
const PastrylabPage = lazy(() => import('./pages/PastrylabPage'));
const Patchdesk2Page = lazy(() => import('./pages/Patchdesk2Page'));
const Patchdesk3Page = lazy(() => import('./pages/Patchdesk3Page'));
const PatchdeskPage = lazy(() => import('./pages/PatchdeskPage'));
const Patentdesk2Page = lazy(() => import('./pages/Patentdesk2Page'));
const Patentdesk3Page = lazy(() => import('./pages/Patentdesk3Page'));
const PatentdeskPage = lazy(() => import('./pages/PatentdeskPage'));
const PathosPage = lazy(() => import('./pages/PathosPage'));
const PatrolPage = lazy(() => import('./pages/PatrolPage'));
const PayoutPage = lazy(() => import('./pages/PayoutPage'));
const PayrollPage = lazy(() => import('./pages/PayrollPage'));
const PayrollrunPage = lazy(() => import('./pages/PayrollrunPage'));
const PeoplehubPage = lazy(() => import('./pages/PeoplehubPage'));
const PerformancePage = lazy(() => import('./pages/PerformancePage'));
const PerformnotePage = lazy(() => import('./pages/PerformnotePage'));
const PerkshopPage = lazy(() => import('./pages/PerkshopPage'));
const PermitdeskPage = lazy(() => import('./pages/PermitdeskPage'));
const PermitworkPage = lazy(() => import('./pages/PermitworkPage'));
const PestctrlPage = lazy(() => import('./pages/PestctrlPage'));
const PetstayPage = lazy(() => import('./pages/PetstayPage'));
const PettycashPage = lazy(() => import('./pages/PettycashPage'));
const Phoenix2Page = lazy(() => import('./pages/Phoenix2Page'));
const PhoenixPage = lazy(() => import('./pages/PhoenixPage'));
const PhotoshootPage = lazy(() => import('./pages/PhotoshootPage'));
const PickupdropPage = lazy(() => import('./pages/PickupdropPage'));
const PickuppacePage = lazy(() => import('./pages/PickuppacePage'));
const PieropsPage = lazy(() => import('./pages/PieropsPage'));
const Pillowmenu2Page = lazy(() => import('./pages/Pillowmenu2Page'));
const Pillowmenu3Page = lazy(() => import('./pages/Pillowmenu3Page'));
const Pillowmenu4Page = lazy(() => import('./pages/Pillowmenu4Page'));
const PillowmenuPage = lazy(() => import('./pages/PillowmenuPage'));
const PilotagePage = lazy(() => import('./pages/PilotagePage'));
const Pilotrun2Page = lazy(() => import('./pages/Pilotrun2Page'));
const Pilotrun3Page = lazy(() => import('./pages/Pilotrun3Page'));
const PilotrunPage = lazy(() => import('./pages/PilotrunPage'));
const PlanogramPage = lazy(() => import('./pages/PlanogramPage'));
const PlantroomPage = lazy(() => import('./pages/PlantroomPage'));
const PlasticauditPage = lazy(() => import('./pages/PlasticauditPage'));
const PlateupPage = lazy(() => import('./pages/PlateupPage'));
const PlaytriggerPage = lazy(() => import('./pages/PlaytriggerPage'));
const PodcastshowPage = lazy(() => import('./pages/PodcastshowPage'));
const PointledgerPage = lazy(() => import('./pages/PointledgerPage'));
const PokertablePage = lazy(() => import('./pages/PokertablePage'));
const PolicyackPage = lazy(() => import('./pages/PolicyackPage'));
const Policyhub2Page = lazy(() => import('./pages/Policyhub2Page'));
const Policyhub3Page = lazy(() => import('./pages/Policyhub3Page'));
const PolicyhubPage = lazy(() => import('./pages/PolicyhubPage'));
const Polldesk2Page = lazy(() => import('./pages/Polldesk2Page'));
const Polldesk3Page = lazy(() => import('./pages/Polldesk3Page'));
const PolldeskPage = lazy(() => import('./pages/PolldeskPage'));
const PoolopsPage = lazy(() => import('./pages/PoolopsPage'));
const PortfolioriskPage = lazy(() => import('./pages/PortfolioriskPage'));
const PosbridgePage = lazy(() => import('./pages/PosbridgePage'));
const PoslanePage = lazy(() => import('./pages/PoslanePage'));
const PostlaunchPage = lazy(() => import('./pages/PostlaunchPage'));
const PowerbudgetPage = lazy(() => import('./pages/PowerbudgetPage'));
const Powercut2Page = lazy(() => import('./pages/Powercut2Page'));
const Powercut3Page = lazy(() => import('./pages/Powercut3Page'));
const PowercutPage = lazy(() => import('./pages/PowercutPage'));
const PowergridPage = lazy(() => import('./pages/PowergridPage'));
const PoweropsPage = lazy(() => import('./pages/PoweropsPage'));
const PpekitPage = lazy(() => import('./pages/PpekitPage'));
const PraisePage = lazy(() => import('./pages/PraisePage'));
const PrefernotePage = lazy(() => import('./pages/PrefernotePage'));
const PrefgraphPage = lazy(() => import('./pages/PrefgraphPage'));
const PrepqueuePage = lazy(() => import('./pages/PrepqueuePage'));
const PressingPage = lazy(() => import('./pages/PressingPage'));
const PresskitPage = lazy(() => import('./pages/PresskitPage'));
const PresspackPage = lazy(() => import('./pages/PresspackPage'));
const PressroomPage = lazy(() => import('./pages/PressroomPage'));
const PriceauditPage = lazy(() => import('./pages/PriceauditPage'));
const PricefloorPage = lazy(() => import('./pages/PricefloorPage'));
const PricepushPage = lazy(() => import('./pages/PricepushPage'));
const PrismPage = lazy(() => import('./pages/PrismPage'));
const Privacypol2Page = lazy(() => import('./pages/Privacypol2Page'));
const Privacypol3Page = lazy(() => import('./pages/Privacypol3Page'));
const PrivacypolPage = lazy(() => import('./pages/PrivacypolPage'));
const PrivatechefPage = lazy(() => import('./pages/PrivatechefPage'));
const ProjectionPage = lazy(() => import('./pages/ProjectionPage'));
const PromoattrPage = lazy(() => import('./pages/PromoattrPage'));
const PromoplanePage = lazy(() => import('./pages/PromoplanePage'));
const PromosPage = lazy(() => import('./pages/PromosPage'));
const PromptlabPage = lazy(() => import('./pages/PromptlabPage'));
const PromptlibPage = lazy(() => import('./pages/PromptlibPage'));
const Prototype2Page = lazy(() => import('./pages/Prototype2Page'));
const Prototype3Page = lazy(() => import('./pages/Prototype3Page'));
const PrototypePage = lazy(() => import('./pages/PrototypePage'));
const PublicareaPage = lazy(() => import('./pages/PublicareaPage'));
const PulsePage = lazy(() => import('./pages/PulsePage'));
const PushdeskPage = lazy(() => import('./pages/PushdeskPage'));
const PyramidPage = lazy(() => import('./pages/PyramidPage'));
const QasamplePage = lazy(() => import('./pages/QasamplePage'));
const QrcheckinPage = lazy(() => import('./pages/QrcheckinPage'));
const QrpayPage = lazy(() => import('./pages/QrpayPage'));
const Questline2Page = lazy(() => import('./pages/Questline2Page'));
const Questline3Page = lazy(() => import('./pages/Questline3Page'));
const QuestlinePage = lazy(() => import('./pages/QuestlinePage'));
const QueuetimesPage = lazy(() => import('./pages/QueuetimesPage'));
const Quiethours2Page = lazy(() => import('./pages/Quiethours2Page'));
const Quiethours3Page = lazy(() => import('./pages/Quiethours3Page'));
const QuiethoursPage = lazy(() => import('./pages/QuiethoursPage'));
const RadiologPage = lazy(() => import('./pages/RadiologPage'));
const RadiomeshPage = lazy(() => import('./pages/RadiomeshPage'));
const RagindexPage = lazy(() => import('./pages/RagindexPage'));
const Ratelimit22Page = lazy(() => import('./pages/Ratelimit22Page'));
const Ratelimit23Page = lazy(() => import('./pages/Ratelimit23Page'));
const Ratelimit2Page = lazy(() => import('./pages/Ratelimit2Page'));
const RateplanPage = lazy(() => import('./pages/RateplanPage'));
const ReadinessPage = lazy(() => import('./pages/ReadinessPage'));
const Rebate2Page = lazy(() => import('./pages/Rebate2Page'));
const Rebate3Page = lazy(() => import('./pages/Rebate3Page'));
const RebatePage = lazy(() => import('./pages/RebatePage'));
const RecipesPage = lazy(() => import('./pages/RecipesPage'));
const RecognitionPage = lazy(() => import('./pages/RecognitionPage'));
const RecoverybayPage = lazy(() => import('./pages/RecoverybayPage'));
const RecoverypathPage = lazy(() => import('./pages/RecoverypathPage'));
const RecovslotsPage = lazy(() => import('./pages/RecovslotsPage'));
const RecyclingPage = lazy(() => import('./pages/RecyclingPage'));
const RedteamPage = lazy(() => import('./pages/RedteamPage'));
const ReefguardPage = lazy(() => import('./pages/ReefguardPage'));
const ReefwatchPage = lazy(() => import('./pages/ReefwatchPage'));
const ReferralPage = lazy(() => import('./pages/ReferralPage'));
const RefundsPage = lazy(() => import('./pages/RefundsPage'));
const ReleasenotesPage = lazy(() => import('./pages/ReleasenotesPage'));
const RentgearPage = lazy(() => import('./pages/RentgearPage'));
const Replenplan2Page = lazy(() => import('./pages/Replenplan2Page'));
const Replenplan3Page = lazy(() => import('./pages/Replenplan3Page'));
const ReplenplanPage = lazy(() => import('./pages/ReplenplanPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const Researchnote2Page = lazy(() => import('./pages/Researchnote2Page'));
const Researchnote3Page = lazy(() => import('./pages/Researchnote3Page'));
const ResearchnotePage = lazy(() => import('./pages/ResearchnotePage'));
const ReservationsPage = lazy(() => import('./pages/ReservationsPage'));
const RestorejobPage = lazy(() => import('./pages/RestorejobPage'));
const RetailfloorPage = lazy(() => import('./pages/RetailfloorPage'));
const RetailPage = lazy(() => import('./pages/RetailPage'));
const RetentionPage = lazy(() => import('./pages/RetentionPage'));
const Retentionpol2Page = lazy(() => import('./pages/Retentionpol2Page'));
const Retentionpol3Page = lazy(() => import('./pages/Retentionpol3Page'));
const RetentionpolPage = lazy(() => import('./pages/RetentionpolPage'));
const ReturnbayPage = lazy(() => import('./pages/ReturnbayPage'));
const ReviewcyclePage = lazy(() => import('./pages/ReviewcyclePage'));
const RevpulsePage = lazy(() => import('./pages/RevpulsePage'));
const RevstreamPage = lazy(() => import('./pages/RevstreamPage'));
const Riskheat2Page = lazy(() => import('./pages/Riskheat2Page'));
const Riskheat3Page = lazy(() => import('./pages/Riskheat3Page'));
const RiskheatPage = lazy(() => import('./pages/RiskheatPage'));
const Riskreg2Page = lazy(() => import('./pages/Riskreg2Page'));
const Riskreg3Page = lazy(() => import('./pages/Riskreg3Page'));
const RiskregPage = lazy(() => import('./pages/RiskregPage'));
const Ritualcal2Page = lazy(() => import('./pages/Ritualcal2Page'));
const Ritualcal3Page = lazy(() => import('./pages/Ritualcal3Page'));
const RitualcalPage = lazy(() => import('./pages/RitualcalPage'));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage'));
const Rolegrant2Page = lazy(() => import('./pages/Rolegrant2Page'));
const Rolegrant3Page = lazy(() => import('./pages/Rolegrant3Page'));
const RolegrantPage = lazy(() => import('./pages/RolegrantPage'));
const Rollback2Page = lazy(() => import('./pages/Rollback2Page'));
const Rollback3Page = lazy(() => import('./pages/Rollback3Page'));
const RollbackPage = lazy(() => import('./pages/RollbackPage'));
const RoommovePage = lazy(() => import('./pages/RoommovePage'));
const RoomrackPage = lazy(() => import('./pages/RoomrackPage'));
const RoomservicePage = lazy(() => import('./pages/RoomservicePage'));
const RoomstatusPage = lazy(() => import('./pages/RoomstatusPage'));
const RootcausePage = lazy(() => import('./pages/RootcausePage'));
const RostersPage = lazy(() => import('./pages/RostersPage'));
const RouteplanPage = lazy(() => import('./pages/RouteplanPage'));
const Runbook2Page = lazy(() => import('./pages/Runbook2Page'));
const Runbook3Page = lazy(() => import('./pages/Runbook3Page'));
const RunbooklinkPage = lazy(() => import('./pages/RunbooklinkPage'));
const RunbookPage = lazy(() => import('./pages/RunbookPage'));
const RunbooksPage = lazy(() => import('./pages/RunbooksPage'));
const SafetybriefPage = lazy(() => import('./pages/SafetybriefPage'));
const SafetylogPage = lazy(() => import('./pages/SafetylogPage'));
const Safetystock2Page = lazy(() => import('./pages/Safetystock2Page'));
const Safetystock3Page = lazy(() => import('./pages/Safetystock3Page'));
const SafetystockPage = lazy(() => import('./pages/SafetystockPage'));
const SaildeskPage = lazy(() => import('./pages/SaildeskPage'));
const Sanctions2Page = lazy(() => import('./pages/Sanctions2Page'));
const Sanctions3Page = lazy(() => import('./pages/Sanctions3Page'));
const SanctionsPage = lazy(() => import('./pages/SanctionsPage'));
const SanctumPage = lazy(() => import('./pages/SanctumPage'));
const Sandbox2Page = lazy(() => import('./pages/Sandbox2Page'));
const Sandbox3Page = lazy(() => import('./pages/Sandbox3Page'));
const SandboxPage = lazy(() => import('./pages/SandboxPage'));
const SandboxrunPage = lazy(() => import('./pages/SandboxrunPage'));
const SandcleanPage = lazy(() => import('./pages/SandcleanPage'));
const SatlinkPage = lazy(() => import('./pages/SatlinkPage'));
const SaunalogPage = lazy(() => import('./pages/SaunalogPage'));
const SaunaopsPage = lazy(() => import('./pages/SaunaopsPage'));
const ScenectrlPage = lazy(() => import('./pages/ScenectrlPage'));
const ScentingPage = lazy(() => import('./pages/ScentingPage'));
const Scentmood2Page = lazy(() => import('./pages/Scentmood2Page'));
const Scentmood3Page = lazy(() => import('./pages/Scentmood3Page'));
const ScentmoodPage = lazy(() => import('./pages/ScentmoodPage'));
const ScentzonePage = lazy(() => import('./pages/ScentzonePage'));
const Schemareg2Page = lazy(() => import('./pages/Schemareg2Page'));
const Schemareg3Page = lazy(() => import('./pages/Schemareg3Page'));
const SchemaregPage = lazy(() => import('./pages/SchemaregPage'));
const ScholarshipPage = lazy(() => import('./pages/ScholarshipPage'));
const ScorecardPage = lazy(() => import('./pages/ScorecardPage'));
const Sealnote2Page = lazy(() => import('./pages/Sealnote2Page'));
const Sealnote3Page = lazy(() => import('./pages/Sealnote3Page'));
const SealnotePage = lazy(() => import('./pages/SealnotePage'));
const SeatingPage = lazy(() => import('./pages/SeatingPage'));
const SecretsrotPage = lazy(() => import('./pages/SecretsrotPage'));
const Secretvault2Page = lazy(() => import('./pages/Secretvault2Page'));
const Secretvault3Page = lazy(() => import('./pages/Secretvault3Page'));
const SecretvaultPage = lazy(() => import('./pages/SecretvaultPage'));
const SelenePage = lazy(() => import('./pages/SelenePage'));
const SensorfusePage = lazy(() => import('./pages/SensorfusePage'));
const SentinelPage = lazy(() => import('./pages/SentinelPage'));
const SeoauditPage = lazy(() => import('./pages/SeoauditPage'));
const SeopagePage = lazy(() => import('./pages/SeopagePage'));
const Serenity2Page = lazy(() => import('./pages/Serenity2Page'));
const SerenityPage = lazy(() => import('./pages/SerenityPage'));
const ServicemarkPage = lazy(() => import('./pages/ServicemarkPage'));
const ServicememoryPage = lazy(() => import('./pages/ServicememoryPage'));
const Sessionguard2Page = lazy(() => import('./pages/Sessionguard2Page'));
const Sessionguard3Page = lazy(() => import('./pages/Sessionguard3Page'));
const SessionguardPage = lazy(() => import('./pages/SessionguardPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ShelfscanPage = lazy(() => import('./pages/ShelfscanPage'));
const ShiftbidPage = lazy(() => import('./pages/ShiftbidPage'));
const ShiftsPage = lazy(() => import('./pages/ShiftsPage'));
const ShiftswapPage = lazy(() => import('./pages/ShiftswapPage'));
const ShifttradePage = lazy(() => import('./pages/ShifttradePage'));
const ShoeshinePage = lazy(() => import('./pages/ShoeshinePage'));
const ShrinklogPage = lazy(() => import('./pages/ShrinklogPage'));
const ShuttlelanePage = lazy(() => import('./pages/ShuttlelanePage'));
const ShuttlePage = lazy(() => import('./pages/ShuttlePage'));
const SignagePage = lazy(() => import('./pages/SignagePage'));
const SignalhubPage = lazy(() => import('./pages/SignalhubPage'));
const Siteevac2Page = lazy(() => import('./pages/Siteevac2Page'));
const Siteevac3Page = lazy(() => import('./pages/Siteevac3Page'));
const SiteevacPage = lazy(() => import('./pages/SiteevacPage'));
const SitehuntPage = lazy(() => import('./pages/SitehuntPage'));
const SkillmatrixPage = lazy(() => import('./pages/SkillmatrixPage'));
const SkylinePage = lazy(() => import('./pages/SkylinePage'));
const SlaagentPage = lazy(() => import('./pages/SlaagentPage'));
const SlabreachesPage = lazy(() => import('./pages/SlabreachesPage'));
const Slatrack2Page = lazy(() => import('./pages/Slatrack2Page'));
const Slatrack3Page = lazy(() => import('./pages/Slatrack3Page'));
const SlatrackPage = lazy(() => import('./pages/SlatrackPage'));
const SleepcoachPage = lazy(() => import('./pages/SleepcoachPage'));
const Sleepscore2Page = lazy(() => import('./pages/Sleepscore2Page'));
const Sleepscore3Page = lazy(() => import('./pages/Sleepscore3Page'));
const SleepscorePage = lazy(() => import('./pages/SleepscorePage'));
const Slotbook2Page = lazy(() => import('./pages/Slotbook2Page'));
const Slotbook3Page = lazy(() => import('./pages/Slotbook3Page'));
const SlotbookPage = lazy(() => import('./pages/SlotbookPage'));
const SlotrackPage = lazy(() => import('./pages/SlotrackPage'));
const SmsqueuePage = lazy(() => import('./pages/SmsqueuePage'));
const SnorkelbayPage = lazy(() => import('./pages/SnorkelbayPage'));
const SocialinboxPage = lazy(() => import('./pages/SocialinboxPage'));
const SocialqueuePage = lazy(() => import('./pages/SocialqueuePage'));
const Socqueue2Page = lazy(() => import('./pages/Socqueue2Page'));
const Socqueue3Page = lazy(() => import('./pages/Socqueue3Page'));
const SocqueuePage = lazy(() => import('./pages/SocqueuePage'));
const SoftopenPage = lazy(() => import('./pages/SoftopenPage'));
const SolaropsPage = lazy(() => import('./pages/SolaropsPage'));
const SolaryieldPage = lazy(() => import('./pages/SolaryieldPage'));
const SommelierPage = lazy(() => import('./pages/SommelierPage'));
const SoundcheckPage = lazy(() => import('./pages/SoundcheckPage'));
const SoundscapePage = lazy(() => import('./pages/SoundscapePage'));
const SpaflowPage = lazy(() => import('./pages/SpaflowPage'));
const SpaPage = lazy(() => import('./pages/SpaPage'));
const SparepartsPage = lazy(() => import('./pages/SparepartsPage'));
const Spindesk2Page = lazy(() => import('./pages/Spindesk2Page'));
const Spindesk3Page = lazy(() => import('./pages/Spindesk3Page'));
const SpindeskPage = lazy(() => import('./pages/SpindeskPage'));
const SplitbillPage = lazy(() => import('./pages/SplitbillPage'));
const SponsorpackPage = lazy(() => import('./pages/SponsorpackPage'));
const SportbridgePage = lazy(() => import('./pages/SportbridgePage'));
const SportslotPage = lazy(() => import('./pages/SportslotPage'));
const Ssobridge2Page = lazy(() => import('./pages/Ssobridge2Page'));
const Ssobridge3Page = lazy(() => import('./pages/Ssobridge3Page'));
const SsobridgePage = lazy(() => import('./pages/SsobridgePage'));
const StandardopPage = lazy(() => import('./pages/StandardopPage'));
const StargazePage = lazy(() => import('./pages/StargazePage'));
const StatuspagePage = lazy(() => import('./pages/StatuspagePage'));
const StaybookPage = lazy(() => import('./pages/StaybookPage'));
const StayextPage = lazy(() => import('./pages/StayextPage'));
const StayhistoryPage = lazy(() => import('./pages/StayhistoryPage'));
const StayringPage = lazy(() => import('./pages/StayringPage'));
const SteamopsPage = lazy(() => import('./pages/SteamopsPage'));
const StevedorePage = lazy(() => import('./pages/StevedorePage'));
const StockhealthPage = lazy(() => import('./pages/StockhealthPage'));
const StoryboardPage = lazy(() => import('./pages/StoryboardPage'));
const StoryvaultPage = lazy(() => import('./pages/StoryvaultPage'));
const Storywall2Page = lazy(() => import('./pages/Storywall2Page'));
const Storywall3Page = lazy(() => import('./pages/Storywall3Page'));
const StorywallPage = lazy(() => import('./pages/StorywallPage'));
const StudioPage = lazy(() => import('./pages/StudioPage'));
const SuccessionPage = lazy(() => import('./pages/SuccessionPage'));
const SummitnotePage = lazy(() => import('./pages/SummitnotePage'));
const Supplierkpi2Page = lazy(() => import('./pages/Supplierkpi2Page'));
const Supplierkpi3Page = lazy(() => import('./pages/Supplierkpi3Page'));
const SupplierkpiPage = lazy(() => import('./pages/SupplierkpiPage'));
const SuppliersPage = lazy(() => import('./pages/SuppliersPage'));
const SupplypullPage = lazy(() => import('./pages/SupplypullPage'));
const SurfschoolPage = lazy(() => import('./pages/SurfschoolPage'));
const Surprisegift2Page = lazy(() => import('./pages/Surprisegift2Page'));
const Surprisegift3Page = lazy(() => import('./pages/Surprisegift3Page'));
const SurprisegiftPage = lazy(() => import('./pages/SurprisegiftPage'));
const SustainPage = lazy(() => import('./pages/SustainPage'));
const SyncreplPage = lazy(() => import('./pages/SyncreplPage'));
const SysalertsPage = lazy(() => import('./pages/SysalertsPage'));
const Systempulse2Page = lazy(() => import('./pages/Systempulse2Page'));
const Systempulse3Page = lazy(() => import('./pages/Systempulse3Page'));
const SystempulsePage = lazy(() => import('./pages/SystempulsePage'));
const TableturnPage = lazy(() => import('./pages/TableturnPage'));
const TabopenPage = lazy(() => import('./pages/TabopenPage'));
const TagmapPage = lazy(() => import('./pages/TagmapPage'));
const TalentbetPage = lazy(() => import('./pages/TalentbetPage'));
const TalentdeskPage = lazy(() => import('./pages/TalentdeskPage'));
const TastingmenuPage = lazy(() => import('./pages/TastingmenuPage'));
const TaxdeskPage = lazy(() => import('./pages/TaxdeskPage'));
const TaxpackPage = lazy(() => import('./pages/TaxpackPage'));
const TelemetryPage = lazy(() => import('./pages/TelemetryPage'));
const TempprobePage = lazy(() => import('./pages/TempprobePage'));
const TenantopsPage = lazy(() => import('./pages/TenantopsPage'));
const ThermalbayPage = lazy(() => import('./pages/ThermalbayPage'));
const TidePage = lazy(() => import('./pages/TidePage'));
const TidewatchPage = lazy(() => import('./pages/TidewatchPage'));
const TierladderPage = lazy(() => import('./pages/TierladderPage'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const TipoutPage = lazy(() => import('./pages/TipoutPage'));
const TipsPage = lazy(() => import('./pages/TipsPage'));
const TokenbudgetPage = lazy(() => import('./pages/TokenbudgetPage'));
const TollpassPage = lazy(() => import('./pages/TollpassPage'));
const ToolpermitPage = lazy(() => import('./pages/ToolpermitPage'));
const TourpackPage = lazy(() => import('./pages/TourpackPage'));
const ToursPage = lazy(() => import('./pages/ToursPage'));
const TowelsPage = lazy(() => import('./pages/TowelsPage'));
const TraininghubPage = lazy(() => import('./pages/TraininghubPage'));
const TrainingPage = lazy(() => import('./pages/TrainingPage'));
const TrainwavePage = lazy(() => import('./pages/TrainwavePage'));
const TransferjobPage = lazy(() => import('./pages/TransferjobPage'));
const TransfersPage = lazy(() => import('./pages/TransfersPage'));
const TreasuryPage = lazy(() => import('./pages/TreasuryPage'));
const TreatofferPage = lazy(() => import('./pages/TreatofferPage'));
const TriviaPage = lazy(() => import('./pages/TriviaPage'));
const TugassistPage = lazy(() => import('./pages/TugassistPage'));
const TurndownPage = lazy(() => import('./pages/TurndownPage'));
const TurnupPage = lazy(() => import('./pages/TurnupPage'));
const TybridgePage = lazy(() => import('./pages/TybridgePage'));
const UgcmodPage = lazy(() => import('./pages/UgcmodPage'));
const UgcqueuePage = lazy(() => import('./pages/UgcqueuePage'));
const UmbrellamapPage = lazy(() => import('./pages/UmbrellamapPage'));
const UniformsPage = lazy(() => import('./pages/UniformsPage'));
const UpsellPage = lazy(() => import('./pages/UpsellPage'));
const Userboard2Page = lazy(() => import('./pages/Userboard2Page'));
const Userboard3Page = lazy(() => import('./pages/Userboard3Page'));
const UserboardPage = lazy(() => import('./pages/UserboardPage'));
const UtmtrackPage = lazy(() => import('./pages/UtmtrackPage'));
const ValetopsPage = lazy(() => import('./pages/ValetopsPage'));
const ValetPage = lazy(() => import('./pages/ValetPage'));
const VanguardPage = lazy(() => import('./pages/VanguardPage'));
const VaultfinalPage = lazy(() => import('./pages/VaultfinalPage'));
const VaultPage = lazy(() => import('./pages/VaultPage'));
const VectorstorePage = lazy(() => import('./pages/VectorstorePage'));
const VehiclemaintPage = lazy(() => import('./pages/VehiclemaintPage'));
const Vendorfail2Page = lazy(() => import('./pages/Vendorfail2Page'));
const Vendorfail3Page = lazy(() => import('./pages/Vendorfail3Page'));
const VendorfailPage = lazy(() => import('./pages/VendorfailPage'));
const VendorportalPage = lazy(() => import('./pages/VendorportalPage'));
const VendorriskPage = lazy(() => import('./pages/VendorriskPage'));
const VendorscorePage = lazy(() => import('./pages/VendorscorePage'));
const VenuesPage = lazy(() => import('./pages/VenuesPage'));
const VerdantPage = lazy(() => import('./pages/VerdantPage'));
const ViparrivePage = lazy(() => import('./pages/ViparrivePage'));
const VipdeskPage = lazy(() => import('./pages/VipdeskPage'));
const VipnotesPage = lazy(() => import('./pages/VipnotesPage'));
const VipprepPage = lazy(() => import('./pages/VipprepPage'));
const VisitorsPage = lazy(() => import('./pages/VisitorsPage'));
const VoidlogPage = lazy(() => import('./pages/VoidlogPage'));
const Volunteer2Page = lazy(() => import('./pages/Volunteer2Page'));
const Volunteer3Page = lazy(() => import('./pages/Volunteer3Page'));
const VolunteerPage = lazy(() => import('./pages/VolunteerPage'));
const WaitlistPage = lazy(() => import('./pages/WaitlistPage'));
const WakeallPage = lazy(() => import('./pages/WakeallPage'));
const WakeupsPage = lazy(() => import('./pages/WakeupsPage'));
const WalkinflowPage = lazy(() => import('./pages/WalkinflowPage'));
const Warbrief2Page = lazy(() => import('./pages/Warbrief2Page'));
const Warbrief3Page = lazy(() => import('./pages/Warbrief3Page'));
const WarbriefPage = lazy(() => import('./pages/WarbriefPage'));
const WareservePage = lazy(() => import('./pages/WareservePage'));
const Warroom22Page = lazy(() => import('./pages/Warroom22Page'));
const Warroom23Page = lazy(() => import('./pages/Warroom23Page'));
const Warroom2Page = lazy(() => import('./pages/Warroom2Page'));
const WarroomPage = lazy(() => import('./pages/WarroomPage'));
const WarroomseatPage = lazy(() => import('./pages/WarroomseatPage'));
const WastekitchenPage = lazy(() => import('./pages/WastekitchenPage'));
const WastePage = lazy(() => import('./pages/WastePage'));
const WastesortPage = lazy(() => import('./pages/WastesortPage'));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage'));
const WaterauditPage = lazy(() => import('./pages/WaterauditPage'));
const WaterloopPage = lazy(() => import('./pages/WaterloopPage'));
const WateropsPage = lazy(() => import('./pages/WateropsPage'));
const WaterusePage = lazy(() => import('./pages/WaterusePage'));
const WayfindPage = lazy(() => import('./pages/WayfindPage'));
const WeatherPage = lazy(() => import('./pages/WeatherPage'));
const Webhookhub2Page = lazy(() => import('./pages/Webhookhub2Page'));
const Webhookhub3Page = lazy(() => import('./pages/Webhookhub3Page'));
const WebhookhubPage = lazy(() => import('./pages/WebhookhubPage'));
const WebhooksPage = lazy(() => import('./pages/WebhooksPage'));
const Welcomeamen2Page = lazy(() => import('./pages/Welcomeamen2Page'));
const Welcomeamen3Page = lazy(() => import('./pages/Welcomeamen3Page'));
const WelcomeamenPage = lazy(() => import('./pages/WelcomeamenPage'));
const WellnesskitPage = lazy(() => import('./pages/WellnesskitPage'));
const WharfagePage = lazy(() => import('./pages/WharfagePage'));
const WhistlePage = lazy(() => import('./pages/WhistlePage'));
const Wholesale2Page = lazy(() => import('./pages/Wholesale2Page'));
const Wholesale3Page = lazy(() => import('./pages/Wholesale3Page'));
const WholesalePage = lazy(() => import('./pages/WholesalePage'));
const WifiPage = lazy(() => import('./pages/WifiPage'));
const WinbackPage = lazy(() => import('./pages/WinbackPage'));
const WinecellarPage = lazy(() => import('./pages/WinecellarPage'));
const WorkorderPage = lazy(() => import('./pages/WorkorderPage'));
const WowmomentPage = lazy(() => import('./pages/WowmomentPage'));
const WristscanPage = lazy(() => import('./pages/WristscanPage'));
const YachtPage = lazy(() => import('./pages/YachtPage'));
const YardmovePage = lazy(() => import('./pages/YardmovePage'));
const YieldrulePage = lazy(() => import('./pages/YieldrulePage'));
const YogamatPage = lazy(() => import('./pages/YogamatPage'));
const ZenithPage = lazy(() => import('./pages/ZenithPage'));
const Zerohour2Page = lazy(() => import('./pages/Zerohour2Page'));
const Zerohour3Page = lazy(() => import('./pages/Zerohour3Page'));
const ZerohourPage = lazy(() => import('./pages/ZerohourPage'));
const ZoneheatPage = lazy(() => import('./pages/ZoneheatPage'));

/** Adım 10 — kampüs stack lazy chunk’ları (ilk yükü hafiflet) */
import {
  fetchMe,
  getStoredUser,
  logout,
  type AuthUser,
} from './services/auth';
import { setActiveBrand } from './services/brands';
import { isPageVisible } from './nav/pageVisibility';

const PAGES: Record<string, ComponentType> = {
  hub: DazeHubPage,
  komuta: CommandCenter,
  ollama: OllamaPanel,
  ajanlar: AgentsPanel,
  olympospass: OlymposPassPanel,
  chef: DazeChefPage,
  crew: DazeCrewPage,
  vision: DazeVisionPage,
  nexus: NexusPanel,
  jobs: JobsPage,
  venues: VenuesPage,
  brands: BrandsPage,
  guests: GuestsPage,
  reports: ReportsPage,
  notifications: NotificationsPage,
  ops: OpsPage,
  metrics: MetricsPage,
  field: FieldPage,
  inventory: InventoryPage,
  shifts: ShiftsPage,
  reservations: ReservationsPage,
  loyalty: LoyaltyPage,
  incidents: IncidentsPage,
  suppliers: SuppliersPage,
  feedback: FeedbackPage,
  exports: ExportsPage,
  consent: ConsentPage,
  announcements: AnnouncementsPage,
  recipes: RecipesPage,
  checklists: ChecklistsPage,
  lostfound: LostFoundPage,
  tips: TipsPage,
  audit: AuditPage,
  maintenance: MaintenancePage,
  brief: BriefPage,
  menu: MenuPage,
  campaigns: CampaignsPage,
  i18n: I18nPage,
  coldchain: ColdchainPage,
  handover: HandoverPage,
  cash: CashPage,
  assets: AssetsPage,
  energy: EnergyPage,
  training: TrainingPage,
  readiness: ReadinessPage,
  digest: DigestPage,
  boardpack: BoardpackPage,
  concierge: ConciergePage,
  minibar: MinibarPage,
  folio: FolioPage,
  banquet: BanquetPage,
  tours: ToursPage,
  marina: MarinaPage,
  hammam: HammamPage,
  towels: TowelsPage,
  bands: BandsPage,
  haccp: HaccpPage,
  patrol: PatrolPage,
  fleet: FleetPage,
  payroll: PayrollPage,
  flash: FlashPage,
  warroom: WarroomPage,
  upsell: UpsellPage,
  otareviews: OtareviewsPage,
  groups: GroupsPage,
  vipnotes: VipnotesPage,
  photoshoot: PhotoshootPage,
  dive: DivePage,
  bikerent: BikerentPage,
  cinema: CinemaPage,
  retail: RetailPage,
  bakery: BakeryPage,
  breakfast: BreakfastPage,
  lateout: LateoutPage,
  amenities: AmenitiesPage,
  nightlog: NightlogPage,
  nightly: NightlyPage,
  keycards: KeycardsPage,
  roomstatus: RoomstatusPage,
  bedding: BeddingPage,
  wakeups: WakeupsPage,
  parcels: ParcelsPage,
  qrcheckin: QrcheckinPage,
  guestapp: GuestappPage,
  karaoke: KaraokePage,
  artwall: ArtwallPage,
  florals: FloralsPage,
  privatechef: PrivatechefPage,
  mocktails: MocktailsPage,
  promos: PromosPage,
  dawnservice: DawnservicePage,
  orbit: OrbitPage,
  rosters: RostersPage,
  overtime: OvertimePage,
  uniforms: UniformsPage,
  healthcards: HealthcardsPage,
  visitors: VisitorsPage,
  cctvlog: CctvlogPage,
  firedrill: FiredrillPage,
  insurance: InsurancePage,
  invoices: InvoicesPage,
  taxpack: TaxpackPage,
  forecast: ForecastPage,
  capex: CapexPage,
  licenses: LicensesPage,
  slabreaches: SlabreachesPage,
  apex: ApexPage,
  extlinks: ExtlinksPage,
  apikeys: ApikeysPage,
  backupsched: BackupschedPage,
  sysalerts: SysalertsPage,
  bugtracker: BugtrackerPage,
  releasenotes: ReleasenotesPage,
  runbooks: RunbooksPage,
  biometrics: BiometricsPage,
  secretsrot: SecretsrotPage,
  dnscheck: DnscheckPage,
  mailqueue: MailqueuePage,
  smsqueue: SmsqueuePage,
  alertrules: AlertrulesPage,
  edgecache: EdgecachePage,
  pyramid: PyramidPage,
  signage: SignagePage,
  wayfind: WayfindPage,
  beaconmap: BeaconmapPage,
  iotgates: IotgatesPage,
  powerops: PoweropsPage,
  waterops: WateropsPage,
  greenops: GreenopsPage,
  pestctrl: PestctrlPage,
  chemlog: ChemlogPage,
  poolops: PoolopsPage,
  saunaops: SaunaopsPage,
  steamops: SteamopsPage,
  icebath: IcebathPage,
  recovslots: RecovslotsPage,
  signalhub: SignalhubPage,
  helipad: HelipadPage,
  jetski: JetskiPage,
  yacht: YachtPage,
  surfschool: SurfschoolPage,
  paddle: PaddlePage,
  climwall: ClimwallPage,
  escaperoom: EscaperoomPage,
  arcade: ArcadePage,
  bowling: BowlingPage,
  billiards: BilliardsPage,
  pokertable: PokertablePage,
  trivia: TriviaPage,
  djbooth: DjboothPage,
  soundcheck: SoundcheckPage,
  skyline: SkylinePage,
  crowddens: CrowddensPage,
  queuetimes: QueuetimesPage,
  lostchild: LostchildPage,
  firstaid: FirstaidPage,
  aedcheck: AedcheckPage,
  evacdrill: EvacdrillPage,
  crowdctrl: CrowdctrlPage,
  radiolog: RadiologPage,
  gatequeue: GatequeuePage,
  wristscan: WristscanPage,
  facepass: FacepassPage,
  bagcheck: BagcheckPage,
  metaldet: MetaldetPage,
  watchlist: WatchlistPage,
  sentinel: SentinelPage,
  menuboard: MenuboardPage,
  allergenalert: AllergenalertPage,
  tempprobe: TempprobePage,
  prepqueue: PrepqueuePage,
  voidlog: VoidlogPage,
  comps: CompsPage,
  splitbill: SplitbillPage,
  tabopen: TabopenPage,
  corkage: CorkagePage,
  sommelier: SommelierPage,
  chefnote: ChefnotePage,
  passticket: PassticketPage,
  zoneheat: ZoneheatPage,
  revpulse: RevpulsePage,
  horizon: HorizonPage,
  stayext: StayextPage,
  roommove: RoommovePage,
  earlyin: EarlyinPage,
  luggage: LuggagePage,
  turndown: TurndownPage,
  pillowmenu: PillowmenuPage,
  scenting: ScentingPage,
  dndflags: DndflagsPage,
  bathstock: BathstockPage,
  ironreq: IronreqPage,
  pressing: PressingPage,
  shoeshine: ShoeshinePage,
  babycot: BabycotPage,
  petstay: PetstayPage,
  meridian: MeridianPage,
  arbill: ArbillPage,
  apbill: ApbillPage,
  bankrec: BankrecPage,
  fxrates: FxratesPage,
  tipout: TipoutPage,
  deposit: DepositPage,
  refunds: RefundsPage,
  chargeback: ChargebackPage,
  giftred: GiftredPage,
  memberbill: MemberbillPage,
  rateplan: RateplanPage,
  channelmgr: ChannelmgrPage,
  overbook: OverbookPage,
  yieldrule: YieldrulePage,
  ledger: LedgerPage,
  onboarding: OnboardingPage,
  offboarding: OffboardingPage,
  interviews: InterviewsPage,
  certifications: CertificationsPage,
  langskill: LangskillPage,
  shiftswap: ShiftswapPage,
  leaverequest: LeaverequestPage,
  attendance: AttendancePage,
  performance: PerformancePage,
  recognition: RecognitionPage,
  handbook: HandbookPage,
  safetybrief: SafetybriefPage,
  nearmiss: NearmissPage,
  whistle: WhistlePage,
  peoplehub: PeoplehubPage,
  carbonlog: CarbonlogPage,
  crudops: CrudopsPage,
  wateraudit: WaterauditPage,
  airquality: AirqualityPage,
  solarops: SolaropsPage,
  biodiversity: BiodiversityPage,
  recycling: RecyclingPage,
  greencert: GreencertPage,
  auditfind: AuditfindPage,
  policyack: PolicyackPage,
  dataprotect: DataprotectPage,
  retention: RetentionPage,
  accessreview: AccessreviewPage,
  vendorrisk: VendorriskPage,
  legalhold: LegalholdPage,
  ecosphere: EcospherePage,
  presskit: PresskitPage,
  influencer: InfluencerPage,
  ugcmod: UgcmodPage,
  seoaudit: SeoauditPage,
  adspend: AdspendPage,
  brandguard: BrandguardPage,
  storyboard: StoryboardPage,
  livestream: LivestreamPage,
  podcastshow: PodcastshowPage,
  newsletter: NewsletterPage,
  tagmap: TagmapPage,
  socialinbox: SocialinboxPage,
  mediaembargo: MediaembargoPage,
  creativereq: CreativereqPage,
  brandpulse: BrandpulsePage,
  modelops: ModelopsPage,
  promptlib: PromptlibPage,
  agenteval: AgentevalPage,
  tokenbudget: TokenbudgetPage,
  ragindex: RagindexPage,
  toolpermit: ToolpermitPage,
  sandboxrun: SandboxrunPage,
  hallucheck: HallucheckPage,
  datasetcur: DatasetcurPage,
  redteam: RedteamPage,
  slaagent: SlaagentPage,
  costguard: CostguardPage,
  latencylog: LatencylogPage,
  driftmonitor: DriftmonitorPage,
  cognisphere: CognispherePage,
  posbridge: PosbridgePage,
  dynamint: DynamintPage,
  couriertrack: CouriertrackPage,
  autocheckout: AutocheckoutPage,
  loyaltyburn: LoyaltyburnPage,
  treatoffer: TreatofferPage,
  omnimarket: OmnimarketPage,
  clickcollect: ClickcollectPage,
  lastmile: LastmilePage,
  invsync: InvsyncPage,
  pricepush: PricepushPage,
  qrpay: QrpayPage,
  courierpool: CourierpoolPage,
  giftrelay: GiftrelayPage,
  vanguard: VanguardPage,
  edgegate: EdgegatePage,
  meshlink: MeshlinkPage,
  radiomesh: RadiomeshPage,
  sensorfuse: SensorfusePage,
  otafirm: OtafirmPage,
  devinventory: DevinventoryPage,
  powerbudget: PowerbudgetPage,
  backhaul: BackhaulPage,
  edgecache2: Edgecache2Page,
  syncrepl: SyncreplPage,
  failover: FailoverPage,
  telemetry: TelemetryPage,
  netslice: NetslicePage,
  satlink: SatlinkPage,
  lattice: LatticePage,
  guesttwin: GuesttwinPage,
  prefgraph: PrefgraphPage,
  intentscore: IntentscorePage,
  nextbest: NextbestPage,
  journeymap: JourneymapPage,
  microseg: MicrosegPage,
  offerlab: OfferlabPage,
  consentgraph: ConsentgraphPage,
  emotionpulse: EmotionpulsePage,
  servicememory: ServicememoryPage,
  recoverypath: RecoverypathPage,
  lifetimeval: LifetimevalPage,
  churnrisk: ChurnriskPage,
  wowmoment: WowmomentPage,
  mirror: MirrorPage,
  incidentbus: IncidentbusPage,
  playtrigger: PlaytriggerPage,
  escalation: EscalationPage,
  warroomseat: WarroomseatPage,
  decisionlog: DecisionlogPage,
  slotrack: SlotrackPage,
  errorbudget: ErrorbudgetPage,
  changewindow: ChangewindowPage,
  blameless: BlamelessPage,
  pagerduty: PagerdutyPage,
  statuspage: StatuspagePage,
  runbooklink: RunbooklinkPage,
  commsbridge: CommsbridgePage,
  afteraction: AfteractionPage,
  keystone: KeystonePage,
  revstream: RevstreamPage,
  packagemix: PackagemixPage,
  ancillary: AncillaryPage,
  dynamicbundle: DynamicbundlePage,
  pricefloor: PricefloorPage,
  compset: CompsetPage,
  pickuppace: PickuppacePage,
  noshowrisk: NoshowriskPage,
  walkinflow: WalkinflowPage,
  tableturn: TableturnPage,
  beatrevenue: BeatrevenuePage,
  cashforecast: CashforecastPage,
  marginwatch: MarginwatchPage,
  promoattr: PromoattrPage,
  zenith: ZenithPage,
  masterplan: MasterplanPage,
  okrrack: OkrrackPage,
  roadmap: RoadmapPage,
  betboard: BetboardPage,
  portfoliorisk: PortfolioriskPage,
  captable: CaptablePage,
  boardmotion: BoardmotionPage,
  alliance: AlliancePage,
  expansion: ExpansionPage,
  legacyarc: LegacyarcPage,
  culturecode: CulturecodePage,
  talentbet: TalentbetPage,
  moatwatch: MoatwatchPage,
  northstar: NorthstarPage,
  odyssey: OdysseyPage,
  tidewatch: TidewatchPage,
  duneops: DuneopsPage,
  snorkelbay: SnorkelbayPage,
  cliffpath: CliffpathPage,
  campglow: CampglowPage,
  lookout: LookoutPage,
  reefguard: ReefguardPage,
  pierops: PieropsPage,
  saildesk: SaildeskPage,
  umbrellamap: UmbrellamapPage,
  sandclean: SandcleanPage,
  nightswim: NightswimPage,
  stargaze: StargazePage,
  coastpatrol: CoastpatrolPage,
  tide: TidePage,
  harborlane: HarborlanePage,
  dockslot: DockslotPage,
  craneops: CraneopsPage,
  container: ContainerPage,
  coldbay: ColdbayPage,
  yardmove: YardmovePage,
  gatepass: GatepassPage,
  bolthold: BoltholdPage,
  manifest: ManifestPage,
  demurrage: DemurragePage,
  pilotage: PilotagePage,
  tugassist: TugassistPage,
  wharfage: WharfagePage,
  stevedore: StevedorePage,
  harbor: HarborPage,
  auroradeck: AuroradeckPage,
  lightshow: LightshowPage,
  soundscape: SoundscapePage,
  scentzone: ScentzonePage,
  moodlight: MoodlightPage,
  fogscene: FogscenePage,
  projection: ProjectionPage,
  immersive: ImmersivePage,
  hapticcue: HapticcuePage,
  atmosmix: AtmosmixPage,
  guestflow: GuestflowPage,
  scenectrl: ScenectrlPage,
  nightmode: NightmodePage,
  dawnmode: DawnmodePage,
  aurora: AuroraPage,
  miseplan: MiseplanPage,
  passrail: PassrailPage,
  plateup: PlateupPage,
  gardebay: GardebayPage,
  pastrylab: PastrylabPage,
  tastingmenu: TastingmenuPage,
  cellarbox: CellarboxPage,
  barrail: BarrailPage,
  roomservice: RoomservicePage,
  caterdesk: CaterdeskPage,
  allergenmap: AllergenmapPage,
  wastekitchen: WastekitchenPage,
  chefbrief: ChefbriefPage,
  supplypull: SupplypullPage,
  hearth: HearthPage,
  spaflow: SpaflowPage,
  thermalbay: ThermalbayPage,
  saunalog: SaunalogPage,
  cryochamber: CryochamberPage,
  floatpod: FloatpodPage,
  massagebook: MassagebookPage,
  yogamat: YogamatPage,
  breathwork: BreathworkPage,
  recoverybay: RecoverybayPage,
  ivlounge: IvloungePage,
  sleepcoach: SleepcoachPage,
  nutrition: NutritionPage,
  biomarker: BiomarkerPage,
  wellnesskit: WellnesskitPage,
  sanctum: SanctumPage,
  assetmap: AssetmapPage,
  plantroom: PlantroomPage,
  hvacloop: HvacloopPage,
  waterloop: WaterloopPage,
  powergrid: PowergridPage,
  elevatorlog: ElevatorlogPage,
  spareparts: SparepartsPage,
  workorder: WorkorderPage,
  leasehold: LeaseholdPage,
  tenantops: TenantopsPage,
  facilitytour: FacilitytourPage,
  capexdesk: CapexdeskPage,
  opexdesk: OpexdeskPage,
  estatescan: EstatescanPage,
  citadel: CitadelPage,
  talentdesk: TalentdeskPage,
  shiftbid: ShiftbidPage,
  skillmatrix: SkillmatrixPage,
  certtrack: CerttrackPage,
  traininghub: TraininghubPage,
  mentorship: MentorshipPage,
  succession: SuccessionPage,
  payrollrun: PayrollrunPage,
  performnote: PerformnotePage,
  reviewcycle: ReviewcyclePage,
  headcount: HeadcountPage,
  attrition: AttritionPage,
  culturepulse: CulturepulsePage,
  shifttrade: ShifttradePage,
  forge: ForgePage,
  safetylog: SafetylogPage,
  incidentlog: IncidentlogPage,
  hazardnote: HazardnotePage,
  evacroute: EvacroutePage,
  drillrun: DrillrunPage,
  aidkit: AidkitPage,
  hazmatbay: HazmatbayPage,
  ppekit: PpekitPage,
  lockouttag: LockouttagPage,
  permitwork: PermitworkPage,
  compliancerow: CompliancerowPage,
  audittrail2: Audittrail2Page,
  cctvreview: CctvreviewPage,
  guestsafety: GuestsafetyPage,
  aegis: AegisPage,
  datalake: DatalakePage,
  featureflag: FeatureflagPage,
  modelcard: ModelcardPage,
  promptlab: PromptlabPage,
  evalbench: EvalbenchPage,
  datasetcat: DatasetcatPage,
  lineage: LineagePage,
  vectorstore: VectorstorePage,
  insightboard: InsightboardPage,
  anomaly: AnomalyPage,
  demandcast: DemandcastPage,
  abtest: AbtestPage,
  scorecard: ScorecardPage,
  decidlog: DecidlogPage,
  oracle: OraclePage,
  memberdesk: MemberdeskPage,
  tierladder: TierladderPage,
  pointledger: PointledgerPage,
  perkshop: PerkshopPage,
  referral: ReferralPage,
  giftcard: GiftcardPage,
  vipdesk: VipdeskPage,
  stayhistory: StayhistoryPage,
  prefernote: PrefernotePage,
  npspulse: NpspulsePage,
  guestcase: GuestcasePage,
  praise: PraisePage,
  winback: WinbackPage,
  clubnight: ClubnightPage,
  crown: CrownPage,
  campdesk: CampdeskPage,
  contentcal: ContentcalPage,
  socialqueue: SocialqueuePage,
  creatordesk: CreatordeskPage,
  utmtrack: UtmtrackPage,
  landing: LandingPage,
  abcopy: AbcopyPage,
  seopage: SeopagePage,
  pushdesk: PushdeskPage,
  emailblast: EmailblastPage,
  presspack: PresspackPage,
  brandkit: BrandkitPage,
  mediabuy: MediabuyPage,
  leadmagnet: LeadmagnetPage,
  beacon: BeaconPage,
  treasury: TreasuryPage,
  cashflow: CashflowPage,
  apdesk: ApdeskPage,
  ardesk: ArdeskPage,
  invoicedesk: InvoicedeskPage,
  taxdesk: TaxdeskPage,
  budgetline: BudgetlinePage,
  fxdesk: FxdeskPage,
  bankrecon: BankreconPage,
  payout: PayoutPage,
  pettycash: PettycashPage,
  costcenter: CostcenterPage,
  glmap: GlmapPage,
  closebook: ClosebookPage,
  vault: VaultPage,
  shuttlelane: ShuttlelanePage,
  fleetdesk: FleetdeskPage,
  driverost: DriverostPage,
  fuelcard: FuelcardPage,
  routeplan: RouteplanPage,
  dispatchboard: DispatchboardPage,
  gpsping: GpspingPage,
  vehiclemaint: VehiclemaintPage,
  valetops: ValetopsPage,
  parkingbay: ParkingbayPage,
  transferjob: TransferjobPage,
  pickupdrop: PickupdropPage,
  tollpass: TollpassPage,
  lanecontrol: LanecontrolPage,
  convoy: ConvoyPage,
  roomrack: RoomrackPage,
  hkboard: HkboardPage,
  linenroom: LinenroomPage,
  minibarbay: MinibarbayPage,
  foundlog: FoundlogPage,
  keydesk: KeydeskPage,
  turnup: TurnupPage,
  deepclean: DeepcleanPage,
  inspectroom: InspectroomPage,
  vipprep: VipprepPage,
  outoforder: OutoforderPage,
  guestrequest: GuestrequestPage,
  amensave: AmensavePage,
  publicarea: PublicareaPage,
  linen: LinenPage,
  nightaudit: NightauditPage,
  foliodesk: FoliodeskPage,
  deskqueue: DeskqueuePage,
  wakeall: WakeallPage,
  earlycheck: EarlycheckPage,
  latecheck: LatecheckPage,
  bagstore: BagstorePage,
  callsheet: CallsheetPage,
  arrivalboard: ArrivalboardPage,
  departureboard: DepartureboardPage,
  viparrive: ViparrivePage,
  frontlog: FrontlogPage,
  moveticket: MoveticketPage,
  conciergejob: ConciergejobPage,
  atlas: AtlasPage,
  tybridge: TybridgePage,
  dolaplist: DolaplistPage,
  hephapick: HephapickPage,
  tourpack: TourpackPage,
  rentgear: RentgearPage,
  wareserve: WareservePage,
  staybook: StaybookPage,
  dazeroom: DazeroomPage,
  keylessdoor: KeylessdoorPage,
  sportslot: SportslotPage,
  arenabook: ArenabookPage,
  nexusgate: NexusgatePage,
  mintbundle: MintbundlePage,
  packfolio: PackfolioPage,
  empire: EmpirePage,
  retailfloor: RetailfloorPage,
  planogram: PlanogramPage,
  shelfscan: ShelfscanPage,
  priceaudit: PriceauditPage,
  shrinklog: ShrinklogPage,
  vendorportal: VendorportalPage,
  assortmix: AssortmixPage,
  promoplane: PromoplanePage,
  categorybuy: CategorybuyPage,
  demandplan: DemandplanPage,
  stockhealth: StockhealthPage,
  returnbay: ReturnbayPage,
  darkstore: DarkstorePage,
  poslane: PoslanePage,
  bazaar: BazaarPage,
  mediawall: MediawallPage,
  contentrights: ContentrightsPage,
  adslot: AdslotPage,
  sponsorpack: SponsorpackPage,
  brandambass: BrandambassPage,
  creatorpay: CreatorpayPage,
  ugcqueue: UgcqueuePage,
  pressroom: PressroomPage,
  livecast: LivecastPage,
  eventstream: EventstreamPage,
  affiliatenet: AffiliatenetPage,
  boostdesk: BoostdeskPage,
  assetlib: AssetlibPage,
  briefdesk: BriefdeskPage,
  studio: StudioPage,
  carbonledger: CarbonledgerPage,
  wateruse: WaterusePage,
  wastesort: WastesortPage,
  energybid: EnergybidPage,
  solaryield: SolaryieldPage,
  greenteam: GreenteamPage,
  esgaudit: EsgauditPage,
  biosurvey: BiosurveyPage,
  offsetbuy: OffsetbuyPage,
  climategoal: ClimategoalPage,
  greenbond: GreenbondPage,
  plasticaudit: PlasticauditPage,
  evcharger: EvchargerPage,
  reefwatch: ReefwatchPage,
  verdant: VerdantPage,
  accessgate: AccessgatePage,
  idproof: IdproofPage,
  rolegrant: RolegrantPage,
  sessionguard: SessionguardPage,
  devicetrust: DevicetrustPage,
  secretvault: SecretvaultPage,
  mfareg: MfaregPage,
  ssobridge: SsobridgePage,
  privacypol: PrivacypolPage,
  consentrow: ConsentrowPage,
  breachlog: BreachlogPage,
  socqueue: SocqueuePage,
  patchdesk: PatchdeskPage,
  zerohour: ZerohourPage,
  bastion: BastionPage,
  partnerdesk: PartnerdeskPage,
  franchise: FranchisePage,
  channelkit: ChannelkitPage,
  rebate: RebatePage,
  coinvest: CoinvestPage,
  slatrack: SlatrackPage,
  jointpromo: JointpromoPage,
  leadshare: LeadsharePage,
  b2border: B2borderPage,
  wholesale: WholesalePage,
  dealroom: DealroomPage,
  contractrow: ContractrowPage,
  commission: CommissionPage,
  onboardkit: OnboardkitPage,
  alliance2: Alliance2Page,
  inboundpo: InboundpoPage,
  outboundso: OutboundsoPage,
  asntrack: AsntrackPage,
  dockyard: DockyardPage,
  crossdock: CrossdockPage,
  coldchain2: Coldchain2Page,
  slotbook: SlotbookPage,
  carrierbid: CarrierbidPage,
  freightbill: FreightbillPage,
  milestonet: MilestonetPage,
  exceptionlog: ExceptionlogPage,
  inventoryage: InventoryagePage,
  replenplan: ReplenplanPage,
  safetystock: SafetystockPage,
  artery: ArteryPage,
  supplierkpi: SupplierkpiPage,
  cmdpulse: CmdpulsePage,
  boardpulse: BoardpulsePage,
  riskheat: RiskheatPage,
  cashpulse: CashpulsePage,
  opsheat: OpsheatPage,
  guestheat: GuestheatPage,
  brandheat: BrandheatPage,
  agentpulse: AgentpulsePage,
  systempulse: SystempulsePage,
  alertfuse: AlertfusePage,
  warbrief: WarbriefPage,
  decisionhub: DecisionhubPage,
  sealnote: SealnotePage,
  dominion: DominionPage,
  legacyflag: LegacyflagPage,
  calmroom: CalmroomPage,
  quiethours: QuiethoursPage,
  scentmood: ScentmoodPage,
  pillowmenu2: Pillowmenu2Page,
  bathritual: BathritualPage,
  sleepscore: SleepscorePage,
  welcomeamen: WelcomeamenPage,
  farewell: FarewellPage,
  memorybook: MemorybookPage,
  carecall: CarecallPage,
  surprisegift: SurprisegiftPage,
  loyaltyhug: LoyaltyhugPage,
  feedbackloop: FeedbackloopPage,
  serenity: SerenityPage,
  momentmap: MomentmapPage,
  apigateway: ApigatewayPage,
  webhookhub: WebhookhubPage,
  ratelimit2: Ratelimit2Page,
  schemareg: SchemaregPage,
  eventbus: EventbusPage,
  jobqueue2: Jobqueue2Page,
  cachemesh: CachemeshPage,
  cdnedge: CdnedgePage,
  observemap: ObservemapPage,
  errorbudget2: Errorbudget2Page,
  featuregate: FeaturegatePage,
  canaryrun: CanaryrunPage,
  rollback: RollbackPage,
  circuit: CircuitPage,
  chaosdrill: ChaosdrillPage,
  memberhub: MemberhubPage,
  circle: CirclePage,
  meetup: MeetupPage,
  forummod: ForummodPage,
  polldesk: PolldeskPage,
  badgeearn: BadgeearnPage,
  questline: QuestlinePage,
  volunteer: VolunteerPage,
  donation: DonationPage,
  chapter: ChapterPage,
  ambassador2: Ambassador2Page,
  storywall: StorywallPage,
  ritualcal: RitualcalPage,
  agora: AgoraPage,
  cohort: CohortPage,
  labbench: LabbenchPage,
  pilotrun: PilotrunPage,
  prototype: PrototypePage,
  hypothesis: HypothesisPage,
  metricslab: MetricslabPage,
  userboard: UserboardPage,
  patentdesk: PatentdeskPage,
  sandbox: SandboxPage,
  hackday: HackdayPage,
  incubate: IncubatePage,
  spindesk: SpindeskPage,
  researchnote: ResearchnotePage,
  labbudget: LabbudgetPage,
  crucible: CruciblePage,
  ipvault: IpvaultPage,
  legaldesk: LegaldeskPage,
  riskreg: RiskregPage,
  policyhub: PolicyhubPage,
  claimdesk: ClaimdeskPage,
  insurancet: InsurancetPage,
  litigation: LitigationPage,
  compliance2: Compliance2Page,
  ethicsline: EthicslinePage,
  kycrow: KycrowPage,
  sanctions: SanctionsPage,
  datapriv: DataprivPage,
  retentionpol: RetentionpolPage,
  auditevidence: AuditevidencePage,
  charter: CharterPage,
  boardresolve: BoardresolvePage,
  drplan: DrplanPage,
  backupjob: BackupjobPage,
  failover2: Failover2Page,
  runbook: RunbookPage,
  warroom2: Warroom2Page,
  commsbridge2: Commsbridge2Page,
  siteevac: SiteevacPage,
  coldsite: ColdsitePage,
  hotspare: HotsparePage,
  drillscore: DrillscorePage,
  vendorfail: VendorfailPage,
  powercut: PowercutPage,
  netsplit: NetsplitPage,
  phoenix: PhoenixPage,
  restorejob: RestorejobPage,
  marketscan: MarketscanPage,
  sitehunt: SitehuntPage,
  capextable: CapextablePage,
  softopen: SoftopenPage,
  launchpad: LaunchpadPage,
  localhire: LocalhirePage,
  permitdesk: PermitdeskPage,
  landlease: LandleasePage,
  buildphase: BuildphasePage,
  ffespec: FfespecPage,
  brandrollout: BrandrolloutPage,
  trainwave: TrainwavePage,
  golive: GolivePage,
  frontier: FrontierPage,
  postlaunch: PostlaunchPage,
  qasample: QasamplePage,
  defectlog: DefectlogPage,
  standardop: StandardopPage,
  mysteryguest: MysteryguestPage,
  npsdeep: NpsdeepPage,
  servicemark: ServicemarkPage,
  calibdesk: CalibdeskPage,
  labresult: LabresultPage,
  certrenew: CertrenewPage,
  isotrack: IsotrackPage,
  guestvoice: GuestvoicePage,
  fixgate: FixgatePage,
  rootcause: RootcausePage,
  prism: PrismPage,
  corrective: CorrectivePage,
  archivebox: ArchiveboxPage,
  oralhistory: OralhistoryPage,
  artifact: ArtifactPage,
  timeline: TimelinePage,
  foundersnote: FoundersnotePage,
  brandbible: BrandbiblePage,
  museumdesk: MuseumdeskPage,
  heritage: HeritagePage,
  anniversary: AnniversaryPage,
  alumni: AlumniPage,
  scholarship: ScholarshipPage,
  foundation: FoundationPage,
  legacygift: LegacygiftPage,
  monument: MonumentPage,
  storyvault: StoryvaultPage,
  olympulse: OlympulsePage,
  holdingseal: HoldingsealPage,
  agentcourt: AgentcourtPage,
  finalbrief: FinalbriefPage,
  legacycode: LegacycodePage,
  eternallog: EternallogPage,
  summitnote: SummitnotePage,
  constellate: ConstellatePage,
  mythos: MythosPage,
  aegisfinal: AegisfinalPage,
  crownfinal: CrownfinalPage,
  vaultfinal: VaultfinalPage,
  empirefinal: EmpirefinalPage,
  olympus: OlympusPage,
  accessgate2: Accessgate2Page,
  idproof2: Idproof2Page,
  rolegrant2: Rolegrant2Page,
  sessionguard2: Sessionguard2Page,
  devicetrust2: Devicetrust2Page,
  secretvault2: Secretvault2Page,
  mfareg2: Mfareg2Page,
  ssobridge2: Ssobridge2Page,
  privacypol2: Privacypol2Page,
  consentrow2: Consentrow2Page,
  breachlog2: Breachlog2Page,
  socqueue2: Socqueue2Page,
  patchdesk2: Patchdesk2Page,
  zerohour2: Zerohour2Page,
  bastion2: Bastion2Page,
  partnerdesk2: Partnerdesk2Page,
  franchise2: Franchise2Page,
  channelkit2: Channelkit2Page,
  rebate2: Rebate2Page,
  coinvest2: Coinvest2Page,
  slatrack2: Slatrack2Page,
  jointpromo2: Jointpromo2Page,
  leadshare2: Leadshare2Page,
  b2border2: B2border2Page,
  wholesale2: Wholesale2Page,
  dealroom2: Dealroom2Page,
  contractrow2: Contractrow2Page,
  commission2: Commission2Page,
  onboardkit2: Onboardkit2Page,
  alliance3: Alliance3Page,
  inboundpo2: Inboundpo2Page,
  outboundso2: Outboundso2Page,
  asntrack2: Asntrack2Page,
  dockyard2: Dockyard2Page,
  crossdock2: Crossdock2Page,
  coldchain22: Coldchain22Page,
  slotbook2: Slotbook2Page,
  carrierbid2: Carrierbid2Page,
  freightbill2: Freightbill2Page,
  milestonet2: Milestonet2Page,
  exceptionlog2: Exceptionlog2Page,
  inventoryage2: Inventoryage2Page,
  replenplan2: Replenplan2Page,
  safetystock2: Safetystock2Page,
  artery2: Artery2Page,
  supplierkpi2: Supplierkpi2Page,
  cmdpulse2: Cmdpulse2Page,
  boardpulse2: Boardpulse2Page,
  riskheat2: Riskheat2Page,
  cashpulse2: Cashpulse2Page,
  opsheat2: Opsheat2Page,
  guestheat2: Guestheat2Page,
  brandheat2: Brandheat2Page,
  agentpulse2: Agentpulse2Page,
  systempulse2: Systempulse2Page,
  alertfuse2: Alertfuse2Page,
  warbrief2: Warbrief2Page,
  decisionhub2: Decisionhub2Page,
  sealnote2: Sealnote2Page,
  dominion2: Dominion2Page,
  legacyflag2: Legacyflag2Page,
  calmroom2: Calmroom2Page,
  quiethours2: Quiethours2Page,
  scentmood2: Scentmood2Page,
  pillowmenu3: Pillowmenu3Page,
  bathritual2: Bathritual2Page,
  sleepscore2: Sleepscore2Page,
  welcomeamen2: Welcomeamen2Page,
  farewell2: Farewell2Page,
  memorybook2: Memorybook2Page,
  carecall2: Carecall2Page,
  surprisegift2: Surprisegift2Page,
  loyaltyhug2: Loyaltyhug2Page,
  feedbackloop2: Feedbackloop2Page,
  serenity2: Serenity2Page,
  momentmap2: Momentmap2Page,
  apigateway2: Apigateway2Page,
  webhookhub2: Webhookhub2Page,
  ratelimit22: Ratelimit22Page,
  schemareg2: Schemareg2Page,
  eventbus2: Eventbus2Page,
  jobqueue22: Jobqueue22Page,
  cachemesh2: Cachemesh2Page,
  cdnedge2: Cdnedge2Page,
  observemap2: Observemap2Page,
  errorbudget3: Errorbudget3Page,
  featuregate2: Featuregate2Page,
  canaryrun2: Canaryrun2Page,
  rollback2: Rollback2Page,
  circuit2: Circuit2Page,
  chaosdrill2: Chaosdrill2Page,
  memberhub2: Memberhub2Page,
  circle2: Circle2Page,
  meetup2: Meetup2Page,
  forummod2: Forummod2Page,
  polldesk2: Polldesk2Page,
  badgeearn2: Badgeearn2Page,
  questline2: Questline2Page,
  volunteer2: Volunteer2Page,
  donation2: Donation2Page,
  chapter2: Chapter2Page,
  ambassador22: Ambassador22Page,
  storywall2: Storywall2Page,
  ritualcal2: Ritualcal2Page,
  agora2: Agora2Page,
  cohort2: Cohort2Page,
  labbench2: Labbench2Page,
  pilotrun2: Pilotrun2Page,
  prototype2: Prototype2Page,
  hypothesis2: Hypothesis2Page,
  metricslab2: Metricslab2Page,
  userboard2: Userboard2Page,
  patentdesk2: Patentdesk2Page,
  sandbox2: Sandbox2Page,
  hackday2: Hackday2Page,
  incubate2: Incubate2Page,
  spindesk2: Spindesk2Page,
  researchnote2: Researchnote2Page,
  labbudget2: Labbudget2Page,
  crucible2: Crucible2Page,
  ipvault2: Ipvault2Page,
  legaldesk2: Legaldesk2Page,
  riskreg2: Riskreg2Page,
  policyhub2: Policyhub2Page,
  claimdesk2: Claimdesk2Page,
  insurancet2: Insurancet2Page,
  litigation2: Litigation2Page,
  compliance22: Compliance22Page,
  ethicsline2: Ethicsline2Page,
  kycrow2: Kycrow2Page,
  sanctions2: Sanctions2Page,
  datapriv2: Datapriv2Page,
  retentionpol2: Retentionpol2Page,
  auditevidence2: Auditevidence2Page,
  charter2: Charter2Page,
  boardresolve2: Boardresolve2Page,
  drplan2: Drplan2Page,
  backupjob2: Backupjob2Page,
  failover3: Failover3Page,
  runbook2: Runbook2Page,
  warroom22: Warroom22Page,
  commsbridge22: Commsbridge22Page,
  siteevac2: Siteevac2Page,
  coldsite2: Coldsite2Page,
  hotspare2: Hotspare2Page,
  drillscore2: Drillscore2Page,
  vendorfail2: Vendorfail2Page,
  powercut2: Powercut2Page,
  netsplit2: Netsplit2Page,
  phoenix2: Phoenix2Page,
  accessgate3: Accessgate3Page,
  idproof3: Idproof3Page,
  rolegrant3: Rolegrant3Page,
  sessionguard3: Sessionguard3Page,
  devicetrust3: Devicetrust3Page,
  secretvault3: Secretvault3Page,
  mfareg3: Mfareg3Page,
  ssobridge3: Ssobridge3Page,
  privacypol3: Privacypol3Page,
  consentrow3: Consentrow3Page,
  breachlog3: Breachlog3Page,
  socqueue3: Socqueue3Page,
  patchdesk3: Patchdesk3Page,
  zerohour3: Zerohour3Page,
  elysium: ElysiumPage,
  partnerdesk3: Partnerdesk3Page,
  franchise3: Franchise3Page,
  channelkit3: Channelkit3Page,
  rebate3: Rebate3Page,
  coinvest3: Coinvest3Page,
  slatrack3: Slatrack3Page,
  jointpromo3: Jointpromo3Page,
  leadshare3: Leadshare3Page,
  b2border3: B2border3Page,
  wholesale3: Wholesale3Page,
  dealroom3: Dealroom3Page,
  contractrow3: Contractrow3Page,
  commission3: Commission3Page,
  onboardkit3: Onboardkit3Page,
  aether: AetherPage,
  inboundpo3: Inboundpo3Page,
  outboundso3: Outboundso3Page,
  asntrack3: Asntrack3Page,
  dockyard3: Dockyard3Page,
  crossdock3: Crossdock3Page,
  coldchain23: Coldchain23Page,
  slotbook3: Slotbook3Page,
  carrierbid3: Carrierbid3Page,
  freightbill3: Freightbill3Page,
  milestonet3: Milestonet3Page,
  exceptionlog3: Exceptionlog3Page,
  inventoryage3: Inventoryage3Page,
  replenplan3: Replenplan3Page,
  safetystock3: Safetystock3Page,
  helios: HeliosPage,
  supplierkpi3: Supplierkpi3Page,
  cmdpulse3: Cmdpulse3Page,
  boardpulse3: Boardpulse3Page,
  riskheat3: Riskheat3Page,
  cashpulse3: Cashpulse3Page,
  opsheat3: Opsheat3Page,
  guestheat3: Guestheat3Page,
  brandheat3: Brandheat3Page,
  agentpulse3: Agentpulse3Page,
  systempulse3: Systempulse3Page,
  alertfuse3: Alertfuse3Page,
  warbrief3: Warbrief3Page,
  decisionhub3: Decisionhub3Page,
  sealnote3: Sealnote3Page,
  selene: SelenePage,
  legacyflag3: Legacyflag3Page,
  calmroom3: Calmroom3Page,
  quiethours3: Quiethours3Page,
  scentmood3: Scentmood3Page,
  pillowmenu4: Pillowmenu4Page,
  bathritual3: Bathritual3Page,
  sleepscore3: Sleepscore3Page,
  welcomeamen3: Welcomeamen3Page,
  farewell3: Farewell3Page,
  memorybook3: Memorybook3Page,
  carecall3: Carecall3Page,
  surprisegift3: Surprisegift3Page,
  loyaltyhug3: Loyaltyhug3Page,
  feedbackloop3: Feedbackloop3Page,
  gaia: GaiaPage,
  momentmap3: Momentmap3Page,
  apigateway3: Apigateway3Page,
  webhookhub3: Webhookhub3Page,
  ratelimit23: Ratelimit23Page,
  schemareg3: Schemareg3Page,
  eventbus3: Eventbus3Page,
  jobqueue23: Jobqueue23Page,
  cachemesh3: Cachemesh3Page,
  cdnedge3: Cdnedge3Page,
  observemap3: Observemap3Page,
  errorbudget4: Errorbudget4Page,
  featuregate3: Featuregate3Page,
  canaryrun3: Canaryrun3Page,
  rollback3: Rollback3Page,
  chronos: ChronosPage,
  chaosdrill3: Chaosdrill3Page,
  memberhub3: Memberhub3Page,
  circle3: Circle3Page,
  meetup3: Meetup3Page,
  forummod3: Forummod3Page,
  polldesk3: Polldesk3Page,
  badgeearn3: Badgeearn3Page,
  questline3: Questline3Page,
  volunteer3: Volunteer3Page,
  donation3: Donation3Page,
  chapter3: Chapter3Page,
  ambassador23: Ambassador23Page,
  storywall3: Storywall3Page,
  ritualcal3: Ritualcal3Page,
  kairos: KairosPage,
  cohort3: Cohort3Page,
  labbench3: Labbench3Page,
  pilotrun3: Pilotrun3Page,
  prototype3: Prototype3Page,
  hypothesis3: Hypothesis3Page,
  metricslab3: Metricslab3Page,
  userboard3: Userboard3Page,
  patentdesk3: Patentdesk3Page,
  sandbox3: Sandbox3Page,
  hackday3: Hackday3Page,
  incubate3: Incubate3Page,
  spindesk3: Spindesk3Page,
  researchnote3: Researchnote3Page,
  labbudget3: Labbudget3Page,
  logos: LogosPage,
  ipvault3: Ipvault3Page,
  legaldesk3: Legaldesk3Page,
  riskreg3: Riskreg3Page,
  policyhub3: Policyhub3Page,
  claimdesk3: Claimdesk3Page,
  insurancet3: Insurancet3Page,
  litigation3: Litigation3Page,
  compliance23: Compliance23Page,
  ethicsline3: Ethicsline3Page,
  kycrow3: Kycrow3Page,
  sanctions3: Sanctions3Page,
  datapriv3: Datapriv3Page,
  retentionpol3: Retentionpol3Page,
  auditevidence3: Auditevidence3Page,
  pathos: PathosPage,
  boardresolve3: Boardresolve3Page,
  drplan3: Drplan3Page,
  backupjob3: Backupjob3Page,
  failover4: Failover4Page,
  runbook3: Runbook3Page,
  warroom23: Warroom23Page,
  commsbridge23: Commsbridge23Page,
  siteevac3: Siteevac3Page,
  coldsite3: Coldsite3Page,
  hotspare3: Hotspare3Page,
  drillscore3: Drillscore3Page,
  vendorfail3: Vendorfail3Page,
  powercut3: Powercut3Page,
  netsplit3: Netsplit3Page,
  apotheosis: ApotheosisPage,
  extremepark: ExtremeParkPage,
  campus: CampusMapPage,
  campuscore: CampuscorePage,
  stayring: StayringPage,
  athleteos: AthleteosPage,
  lifecoach: LifecoachPage,
  marketos: MarketosPage,
  openmall: OpenmallPage,
  familycamp: FamilycampPage,
  agentbridge: AgentbridgePage,
  culturescene: CulturescenePage,
  sportbridge: SportbridgePage,
  agentqueue: AgentqueuePage,
  greenpulse: GreenpulsePage,
  campusbrief: CampusbriefPage,
  agentfleet: AgentfleetPage,
  mysteryshop: MysteryshopPage,
  partners: PartnersPage,
  shuttle: ShuttlePage,
  lounge: LoungePage,
  winecellar: WinecellarPage,
  allergens: AllergensPage,
  sustain: SustainPage,
  mediakit: MediakitPage,
  meetingrooms: MeetingroomsPage,
  badgeprint: BadgeprintPage,
  transfers: TransfersPage,
  beachbeds: BeachbedsPage,
  kidsclub: KidsclubPage,
  lockers: LockersPage,
  emergency: EmergencyPage,
  kds: KdsPage,
  passstock: PassstockPage,
  contracts: ContractsPage,
  budget: BudgetPage,
  pulse: PulsePage,
  content: ContentPage,
  wifi: WifiPage,
  laundry: LaundryPage,
  cleaning: CleaningPage,
  delivery: DeliveryPage,
  giftcards: GiftcardsPage,
  eventcal: EventcalPage,
  spa: SpaPage,
  weather: WeatherPage,
  hours: HoursPage,
  kudos: KudosPage,
  complaints: ComplaintsPage,
  waitlist: WaitlistPage,
  seating: SeatingPage,
  waste: WastePage,
  vendorscore: VendorscorePage,
  documents: DocumentsPage,
  music: MusicPage,
  valet: ValetPage,
  docs: DocsPage,
  webhooks: WebhooksPage,
  settings: SettingsPage,
};

function defaultPage(allowed: string[]): string {
  if (allowed.includes('komuta')) return 'komuta';
  if (allowed.includes('hub')) return 'hub';
  return allowed[0] || 'komuta';
}

function hashPageId(): string {
  return window.location.hash.replace('#/', '').replace('#', '').trim();
}

function pageFromHash(allowed: string[]): string {
  const hash = hashPageId();
  if (hash && hash in PAGES && allowed.includes(hash)) return hash;
  return defaultPage(allowed);
}

/** Geçersiz / yetkisiz hash varsa kanonik sayfaya yaz */
function syncHash(next: string) {
  const current = hashPageId();
  if (current !== next) {
    window.location.hash = `/${next}`;
  }
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [booting, setBooting] = useState(true);
  const [page, setPage] = useState<string>('komuta');
  const [navNotice, setNavNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!navNotice) return;
    const t = window.setTimeout(() => setNavNotice(null), 3200);
    return () => window.clearTimeout(t);
  }, [navNotice]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetchMe();
      if (cancelled) return;
      setUser(me);
      if (me) {
        const pages = me.pages ?? [];
        const next = pageFromHash(pages);
        setPage(next);
        syncHash(next);
      }
      setBooting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const pages = user.pages ?? [];
    const onHashChange = () => {
      const next = pageFromHash(pages);
      setPage(next);
      syncHash(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [user]);

  const navigate = useCallback(
    (next: string) => {
      const pages = user?.pages ?? [];
      if (!pages.includes(next)) {
        setNavNotice('Bu sekme rolünde yok.');
        return;
      }
      const brand = user?.brands?.find((b) => b.id === user.activeBrandId);
      const modules = new Set(brand?.modules ?? []);
      if (
        !isPageVisible(next, pages, modules, {
          role: user?.role,
          brand: brand ?? null,
        })
      ) {
        setNavNotice('Bu sekme aktif markada kapalı.');
        return;
      }
      setNavNotice(null);
      window.location.hash = `/${next}`;
      setPage(next);
    },
    [user],
  );

  const handleLogout = async () => {
    await logout();
    setUser(null);
    window.location.hash = '';
  };

  const handleBrandChange = async (brandId: string) => {
    try {
      const updated = await setActiveBrand(brandId);
      setUser(updated);
      const allowed = updated.pages ?? [];
      const brand = updated.brands?.find((b) => b.id === brandId);
      const modules = new Set(brand?.modules ?? []);
      // CEO / Holding veya ALWAYS_VISIBLE sayfalarda marka değişince hub'a fırlatma
      const stillVisible = isPageVisible(page, allowed, modules, {
        role: updated.role,
        brand: brand ?? null,
      });
      if (!stillVisible && allowed.includes('hub')) {
        navigate('hub');
      }
    } catch {
      /* ignore */
    }
  };

  if (booting) {
    return (
      <div className="flex h-full items-center justify-center bg-obsidian-950 text-sm text-slate-500">
        Oturum kontrol ediliyor…
      </div>
    );
  }

  if (!user) {
    return (
      <LoginPage
        onSuccess={() => {
          const u = getStoredUser();
          setUser(u);
          if (u) {
            const first = defaultPage(u.pages ?? []);
            setPage(first);
            window.location.hash = `/${first}`;
          }
        }}
      />
    );
  }

  const allowed = user.pages ?? [];
  const ActivePage = PAGES[page] ?? (allowed.includes('komuta') ? PAGES.komuta : PAGES.hub);

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar
        active={page}
        onNavigate={navigate}
        allowedPages={allowed}
        userName={user.name}
        userRole={user.role}
        brands={user.brands ?? []}
        activeBrandId={user.activeBrandId}
        onBrandChange={(id) => void handleBrandChange(id)}
        onLogout={() => void handleLogout()}
      />
      <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8">
        {navNotice && (
          <div
            role="status"
            className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
          >
            {navNotice}
          </div>
        )}
        <ErrorBoundary key={page} onReset={() => navigate(page)}>
          <Suspense
            fallback={
              <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                Modül yükleniyor…
              </div>
            }
          >
            <ActivePage />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
