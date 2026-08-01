import { useCallback, useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DazeHubPage from './pages/DazeHubPage';
import CommandCenter from './pages/CommandCenter';
import OllamaPanel from './pages/OllamaPanel';
import AgentsPanel from './pages/AgentsPanel';
import OlymposPassPanel from './pages/OlymposPassPanel';
import DazeChefPage from './pages/DazeChefPage';
import DazeCrewPage from './pages/DazeCrewPage';
import DazeVisionPage from './pages/DazeVisionPage';
import NexusPanel from './pages/NexusPanel';
import SettingsPage from './pages/SettingsPage';
import JobsPage from './pages/JobsPage';
import ReportsPage from './pages/ReportsPage';
import VenuesPage from './pages/VenuesPage';
import OpsPage from './pages/OpsPage';
import NotificationsPage from './pages/NotificationsPage';
import FieldPage from './pages/FieldPage';
import MetricsPage from './pages/MetricsPage';
import BrandsPage from './pages/BrandsPage';
import GuestsPage from './pages/GuestsPage';
import WebhooksPage from './pages/WebhooksPage';
import InventoryPage from './pages/InventoryPage';
import ShiftsPage from './pages/ShiftsPage';
import ReservationsPage from './pages/ReservationsPage';
import LoyaltyPage from './pages/LoyaltyPage';
import IncidentsPage from './pages/IncidentsPage';
import SuppliersPage from './pages/SuppliersPage';
import FeedbackPage from './pages/FeedbackPage';
import ExportsPage from './pages/ExportsPage';
import ConsentPage from './pages/ConsentPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import RecipesPage from './pages/RecipesPage';
import ChecklistsPage from './pages/ChecklistsPage';
import LostFoundPage from './pages/LostFoundPage';
import TipsPage from './pages/TipsPage';
import AuditPage from './pages/AuditPage';
import MaintenancePage from './pages/MaintenancePage';
import BriefPage from './pages/BriefPage';
import MenuPage from './pages/MenuPage';
import CampaignsPage from './pages/CampaignsPage';
import I18nPage from './pages/I18nPage';
import ColdchainPage from './pages/ColdchainPage';
import HandoverPage from './pages/HandoverPage';
import CashPage from './pages/CashPage';
import AssetsPage from './pages/AssetsPage';
import EnergyPage from './pages/EnergyPage';
import TrainingPage from './pages/TrainingPage';
import ValetPage from './pages/ValetPage';
import MusicPage from './pages/MusicPage';
import DocumentsPage from './pages/DocumentsPage';
import VendorscorePage from './pages/VendorscorePage';
import WastePage from './pages/WastePage';
import SeatingPage from './pages/SeatingPage';
import WaitlistPage from './pages/WaitlistPage';
import ComplaintsPage from './pages/ComplaintsPage';
import KudosPage from './pages/KudosPage';
import HoursPage from './pages/HoursPage';
import WeatherPage from './pages/WeatherPage';
import ReadinessPage from './pages/ReadinessPage';
import SpaPage from './pages/SpaPage';
import EventcalPage from './pages/EventcalPage';
import GiftcardsPage from './pages/GiftcardsPage';
import DeliveryPage from './pages/DeliveryPage';
import CleaningPage from './pages/CleaningPage';
import LaundryPage from './pages/LaundryPage';
import WifiPage from './pages/WifiPage';
import ContentPage from './pages/ContentPage';
import PulsePage from './pages/PulsePage';
import BudgetPage from './pages/BudgetPage';
import ContractsPage from './pages/ContractsPage';
import PassstockPage from './pages/PassstockPage';
import KdsPage from './pages/KdsPage';
import EmergencyPage from './pages/EmergencyPage';
import DigestPage from './pages/DigestPage';
import LockersPage from './pages/LockersPage';
import KidsclubPage from './pages/KidsclubPage';
import BeachbedsPage from './pages/BeachbedsPage';
import TransfersPage from './pages/TransfersPage';
import BadgeprintPage from './pages/BadgeprintPage';
import MeetingroomsPage from './pages/MeetingroomsPage';
import MediakitPage from './pages/MediakitPage';
import SustainPage from './pages/SustainPage';
import AllergensPage from './pages/AllergensPage';
import WinecellarPage from './pages/WinecellarPage';
import LoungePage from './pages/LoungePage';
import ShuttlePage from './pages/ShuttlePage';
import PartnersPage from './pages/PartnersPage';
import MysteryshopPage from './pages/MysteryshopPage';
import BoardpackPage from './pages/BoardpackPage';
import ConciergePage from './pages/ConciergePage';
import MinibarPage from './pages/MinibarPage';
import FolioPage from './pages/FolioPage';
import BanquetPage from './pages/BanquetPage';
import ToursPage from './pages/ToursPage';
import MarinaPage from './pages/MarinaPage';
import HammamPage from './pages/HammamPage';
import TowelsPage from './pages/TowelsPage';
import BandsPage from './pages/BandsPage';
import HaccpPage from './pages/HaccpPage';
import PatrolPage from './pages/PatrolPage';
import FleetPage from './pages/FleetPage';
import PayrollPage from './pages/PayrollPage';
import FlashPage from './pages/FlashPage';
import WarroomPage from './pages/WarroomPage';
import UpsellPage from './pages/UpsellPage';
import OtareviewsPage from './pages/OtareviewsPage';
import GroupsPage from './pages/GroupsPage';
import VipnotesPage from './pages/VipnotesPage';
import PhotoshootPage from './pages/PhotoshootPage';
import DivePage from './pages/DivePage';
import BikerentPage from './pages/BikerentPage';
import CinemaPage from './pages/CinemaPage';
import RetailPage from './pages/RetailPage';
import BakeryPage from './pages/BakeryPage';
import BreakfastPage from './pages/BreakfastPage';
import LateoutPage from './pages/LateoutPage';
import AmenitiesPage from './pages/AmenitiesPage';
import NightlogPage from './pages/NightlogPage';
import NightlyPage from './pages/NightlyPage';
import KeycardsPage from './pages/KeycardsPage';
import RoomstatusPage from './pages/RoomstatusPage';
import BeddingPage from './pages/BeddingPage';
import WakeupsPage from './pages/WakeupsPage';
import ParcelsPage from './pages/ParcelsPage';
import QrcheckinPage from './pages/QrcheckinPage';
import GuestappPage from './pages/GuestappPage';
import KaraokePage from './pages/KaraokePage';
import ArtwallPage from './pages/ArtwallPage';
import FloralsPage from './pages/FloralsPage';
import PrivatechefPage from './pages/PrivatechefPage';
import MocktailsPage from './pages/MocktailsPage';
import PromosPage from './pages/PromosPage';
import DawnservicePage from './pages/DawnservicePage';
import OrbitPage from './pages/OrbitPage';
import RostersPage from './pages/RostersPage';
import OvertimePage from './pages/OvertimePage';
import UniformsPage from './pages/UniformsPage';
import HealthcardsPage from './pages/HealthcardsPage';
import VisitorsPage from './pages/VisitorsPage';
import CctvlogPage from './pages/CctvlogPage';
import FiredrillPage from './pages/FiredrillPage';
import InsurancePage from './pages/InsurancePage';
import InvoicesPage from './pages/InvoicesPage';
import TaxpackPage from './pages/TaxpackPage';
import ForecastPage from './pages/ForecastPage';
import CapexPage from './pages/CapexPage';
import LicensesPage from './pages/LicensesPage';
import SlabreachesPage from './pages/SlabreachesPage';
import ApexPage from './pages/ApexPage';
import ExtlinksPage from './pages/ExtlinksPage';
import ApikeysPage from './pages/ApikeysPage';
import BackupschedPage from './pages/BackupschedPage';
import SysalertsPage from './pages/SysalertsPage';
import BugtrackerPage from './pages/BugtrackerPage';
import ReleasenotesPage from './pages/ReleasenotesPage';
import RunbooksPage from './pages/RunbooksPage';
import BiometricsPage from './pages/BiometricsPage';
import SecretsrotPage from './pages/SecretsrotPage';
import DnscheckPage from './pages/DnscheckPage';
import MailqueuePage from './pages/MailqueuePage';
import SmsqueuePage from './pages/SmsqueuePage';
import AlertrulesPage from './pages/AlertrulesPage';
import EdgecachePage from './pages/EdgecachePage';
import PyramidPage from './pages/PyramidPage';
import SignagePage from './pages/SignagePage';
import WayfindPage from './pages/WayfindPage';
import BeaconmapPage from './pages/BeaconmapPage';
import IotgatesPage from './pages/IotgatesPage';
import PoweropsPage from './pages/PoweropsPage';
import WateropsPage from './pages/WateropsPage';
import GreenopsPage from './pages/GreenopsPage';
import PestctrlPage from './pages/PestctrlPage';
import ChemlogPage from './pages/ChemlogPage';
import PoolopsPage from './pages/PoolopsPage';
import SaunaopsPage from './pages/SaunaopsPage';
import SteamopsPage from './pages/SteamopsPage';
import IcebathPage from './pages/IcebathPage';
import RecovslotsPage from './pages/RecovslotsPage';
import SignalhubPage from './pages/SignalhubPage';
import HelipadPage from './pages/HelipadPage';
import JetskiPage from './pages/JetskiPage';
import YachtPage from './pages/YachtPage';
import SurfschoolPage from './pages/SurfschoolPage';
import PaddlePage from './pages/PaddlePage';
import ClimwallPage from './pages/ClimwallPage';
import EscaperoomPage from './pages/EscaperoomPage';
import ArcadePage from './pages/ArcadePage';
import BowlingPage from './pages/BowlingPage';
import BilliardsPage from './pages/BilliardsPage';
import PokertablePage from './pages/PokertablePage';
import TriviaPage from './pages/TriviaPage';
import DjboothPage from './pages/DjboothPage';
import SoundcheckPage from './pages/SoundcheckPage';
import SkylinePage from './pages/SkylinePage';
import CrowddensPage from './pages/CrowddensPage';
import QueuetimesPage from './pages/QueuetimesPage';
import LostchildPage from './pages/LostchildPage';
import FirstaidPage from './pages/FirstaidPage';
import AedcheckPage from './pages/AedcheckPage';
import EvacdrillPage from './pages/EvacdrillPage';
import CrowdctrlPage from './pages/CrowdctrlPage';
import RadiologPage from './pages/RadiologPage';
import GatequeuePage from './pages/GatequeuePage';
import WristscanPage from './pages/WristscanPage';
import FacepassPage from './pages/FacepassPage';
import BagcheckPage from './pages/BagcheckPage';
import MetaldetPage from './pages/MetaldetPage';
import WatchlistPage from './pages/WatchlistPage';
import SentinelPage from './pages/SentinelPage';
import MenuboardPage from './pages/MenuboardPage';
import AllergenalertPage from './pages/AllergenalertPage';
import TempprobePage from './pages/TempprobePage';
import PrepqueuePage from './pages/PrepqueuePage';
import VoidlogPage from './pages/VoidlogPage';
import CompsPage from './pages/CompsPage';
import SplitbillPage from './pages/SplitbillPage';
import TabopenPage from './pages/TabopenPage';
import CorkagePage from './pages/CorkagePage';
import SommelierPage from './pages/SommelierPage';
import ChefnotePage from './pages/ChefnotePage';
import PassticketPage from './pages/PassticketPage';
import ZoneheatPage from './pages/ZoneheatPage';
import RevpulsePage from './pages/RevpulsePage';
import HorizonPage from './pages/HorizonPage';
import StayextPage from './pages/StayextPage';
import RoommovePage from './pages/RoommovePage';
import EarlyinPage from './pages/EarlyinPage';
import LuggagePage from './pages/LuggagePage';
import TurndownPage from './pages/TurndownPage';
import PillowmenuPage from './pages/PillowmenuPage';
import ScentingPage from './pages/ScentingPage';
import DndflagsPage from './pages/DndflagsPage';
import BathstockPage from './pages/BathstockPage';
import IronreqPage from './pages/IronreqPage';
import PressingPage from './pages/PressingPage';
import ShoeshinePage from './pages/ShoeshinePage';
import BabycotPage from './pages/BabycotPage';
import PetstayPage from './pages/PetstayPage';
import MeridianPage from './pages/MeridianPage';
import ArbillPage from './pages/ArbillPage';
import ApbillPage from './pages/ApbillPage';
import BankrecPage from './pages/BankrecPage';
import FxratesPage from './pages/FxratesPage';
import TipoutPage from './pages/TipoutPage';
import DepositPage from './pages/DepositPage';
import RefundsPage from './pages/RefundsPage';
import ChargebackPage from './pages/ChargebackPage';
import GiftredPage from './pages/GiftredPage';
import MemberbillPage from './pages/MemberbillPage';
import RateplanPage from './pages/RateplanPage';
import ChannelmgrPage from './pages/ChannelmgrPage';
import OverbookPage from './pages/OverbookPage';
import YieldrulePage from './pages/YieldrulePage';
import LedgerPage from './pages/LedgerPage';
import OnboardingPage from './pages/OnboardingPage';
import OffboardingPage from './pages/OffboardingPage';
import InterviewsPage from './pages/InterviewsPage';
import CertificationsPage from './pages/CertificationsPage';
import LangskillPage from './pages/LangskillPage';
import ShiftswapPage from './pages/ShiftswapPage';
import LeaverequestPage from './pages/LeaverequestPage';
import AttendancePage from './pages/AttendancePage';
import PerformancePage from './pages/PerformancePage';
import RecognitionPage from './pages/RecognitionPage';
import HandbookPage from './pages/HandbookPage';
import SafetybriefPage from './pages/SafetybriefPage';
import NearmissPage from './pages/NearmissPage';
import WhistlePage from './pages/WhistlePage';
import PeoplehubPage from './pages/PeoplehubPage';
import CarbonlogPage from './pages/CarbonlogPage';
import WaterauditPage from './pages/WaterauditPage';
import AirqualityPage from './pages/AirqualityPage';
import SolaropsPage from './pages/SolaropsPage';
import BiodiversityPage from './pages/BiodiversityPage';
import RecyclingPage from './pages/RecyclingPage';
import GreencertPage from './pages/GreencertPage';
import AuditfindPage from './pages/AuditfindPage';
import PolicyackPage from './pages/PolicyackPage';
import DataprotectPage from './pages/DataprotectPage';
import RetentionPage from './pages/RetentionPage';
import AccessreviewPage from './pages/AccessreviewPage';
import VendorriskPage from './pages/VendorriskPage';
import LegalholdPage from './pages/LegalholdPage';
import EcospherePage from './pages/EcospherePage';
import PresskitPage from './pages/PresskitPage';
import InfluencerPage from './pages/InfluencerPage';
import UgcmodPage from './pages/UgcmodPage';
import SeoauditPage from './pages/SeoauditPage';
import AdspendPage from './pages/AdspendPage';
import BrandguardPage from './pages/BrandguardPage';
import StoryboardPage from './pages/StoryboardPage';
import LivestreamPage from './pages/LivestreamPage';
import PodcastshowPage from './pages/PodcastshowPage';
import NewsletterPage from './pages/NewsletterPage';
import TagmapPage from './pages/TagmapPage';
import SocialinboxPage from './pages/SocialinboxPage';
import MediaembargoPage from './pages/MediaembargoPage';
import CreativereqPage from './pages/CreativereqPage';
import BrandpulsePage from './pages/BrandpulsePage';
import ModelopsPage from './pages/ModelopsPage';
import PromptlibPage from './pages/PromptlibPage';
import AgentevalPage from './pages/AgentevalPage';
import TokenbudgetPage from './pages/TokenbudgetPage';
import RagindexPage from './pages/RagindexPage';
import ToolpermitPage from './pages/ToolpermitPage';
import SandboxrunPage from './pages/SandboxrunPage';
import HallucheckPage from './pages/HallucheckPage';
import DatasetcurPage from './pages/DatasetcurPage';
import RedteamPage from './pages/RedteamPage';
import SlaagentPage from './pages/SlaagentPage';
import CostguardPage from './pages/CostguardPage';
import LatencylogPage from './pages/LatencylogPage';
import DriftmonitorPage from './pages/DriftmonitorPage';
import CognispherePage from './pages/CognispherePage';
import PosbridgePage from './pages/PosbridgePage';
import DynamintPage from './pages/DynamintPage';
import CouriertrackPage from './pages/CouriertrackPage';
import AutocheckoutPage from './pages/AutocheckoutPage';
import LoyaltyburnPage from './pages/LoyaltyburnPage';
import TreatofferPage from './pages/TreatofferPage';
import OmnimarketPage from './pages/OmnimarketPage';
import ClickcollectPage from './pages/ClickcollectPage';
import LastmilePage from './pages/LastmilePage';
import InvsyncPage from './pages/InvsyncPage';
import PricepushPage from './pages/PricepushPage';
import QrpayPage from './pages/QrpayPage';
import CourierpoolPage from './pages/CourierpoolPage';
import GiftrelayPage from './pages/GiftrelayPage';
import VanguardPage from './pages/VanguardPage';
import EdgegatePage from './pages/EdgegatePage';
import MeshlinkPage from './pages/MeshlinkPage';
import RadiomeshPage from './pages/RadiomeshPage';
import SensorfusePage from './pages/SensorfusePage';
import OtafirmPage from './pages/OtafirmPage';
import DevinventoryPage from './pages/DevinventoryPage';
import PowerbudgetPage from './pages/PowerbudgetPage';
import BackhaulPage from './pages/BackhaulPage';
import Edgecache2Page from './pages/Edgecache2Page';
import SyncreplPage from './pages/SyncreplPage';
import FailoverPage from './pages/FailoverPage';
import TelemetryPage from './pages/TelemetryPage';
import NetslicePage from './pages/NetslicePage';
import SatlinkPage from './pages/SatlinkPage';
import LatticePage from './pages/LatticePage';
import GuesttwinPage from './pages/GuesttwinPage';
import PrefgraphPage from './pages/PrefgraphPage';
import IntentscorePage from './pages/IntentscorePage';
import NextbestPage from './pages/NextbestPage';
import JourneymapPage from './pages/JourneymapPage';
import MicrosegPage from './pages/MicrosegPage';
import OfferlabPage from './pages/OfferlabPage';
import ConsentgraphPage from './pages/ConsentgraphPage';
import EmotionpulsePage from './pages/EmotionpulsePage';
import ServicememoryPage from './pages/ServicememoryPage';
import RecoverypathPage from './pages/RecoverypathPage';
import LifetimevalPage from './pages/LifetimevalPage';
import ChurnriskPage from './pages/ChurnriskPage';
import WowmomentPage from './pages/WowmomentPage';
import MirrorPage from './pages/MirrorPage';
import IncidentbusPage from './pages/IncidentbusPage';
import PlaytriggerPage from './pages/PlaytriggerPage';
import EscalationPage from './pages/EscalationPage';
import WarroomseatPage from './pages/WarroomseatPage';
import DecisionlogPage from './pages/DecisionlogPage';
import SlotrackPage from './pages/SlotrackPage';
import ErrorbudgetPage from './pages/ErrorbudgetPage';
import ChangewindowPage from './pages/ChangewindowPage';
import BlamelessPage from './pages/BlamelessPage';
import PagerdutyPage from './pages/PagerdutyPage';
import StatuspagePage from './pages/StatuspagePage';
import RunbooklinkPage from './pages/RunbooklinkPage';
import CommsbridgePage from './pages/CommsbridgePage';
import AfteractionPage from './pages/AfteractionPage';
import KeystonePage from './pages/KeystonePage';
import RevstreamPage from './pages/RevstreamPage';
import PackagemixPage from './pages/PackagemixPage';
import AncillaryPage from './pages/AncillaryPage';
import DynamicbundlePage from './pages/DynamicbundlePage';
import PricefloorPage from './pages/PricefloorPage';
import CompsetPage from './pages/CompsetPage';
import PickuppacePage from './pages/PickuppacePage';
import NoshowriskPage from './pages/NoshowriskPage';
import WalkinflowPage from './pages/WalkinflowPage';
import TableturnPage from './pages/TableturnPage';
import BeatrevenuePage from './pages/BeatrevenuePage';
import CashforecastPage from './pages/CashforecastPage';
import MarginwatchPage from './pages/MarginwatchPage';
import PromoattrPage from './pages/PromoattrPage';
import ZenithPage from './pages/ZenithPage';
import MasterplanPage from './pages/MasterplanPage';
import OkrrackPage from './pages/OkrrackPage';
import RoadmapPage from './pages/RoadmapPage';
import BetboardPage from './pages/BetboardPage';
import PortfolioriskPage from './pages/PortfolioriskPage';
import CaptablePage from './pages/CaptablePage';
import BoardmotionPage from './pages/BoardmotionPage';
import AlliancePage from './pages/AlliancePage';
import ExpansionPage from './pages/ExpansionPage';
import LegacyarcPage from './pages/LegacyarcPage';
import CulturecodePage from './pages/CulturecodePage';
import TalentbetPage from './pages/TalentbetPage';
import MoatwatchPage from './pages/MoatwatchPage';
import NorthstarPage from './pages/NorthstarPage';
import OdysseyPage from './pages/OdysseyPage';
import TidewatchPage from './pages/TidewatchPage';
import DuneopsPage from './pages/DuneopsPage';
import SnorkelbayPage from './pages/SnorkelbayPage';
import CliffpathPage from './pages/CliffpathPage';
import CampglowPage from './pages/CampglowPage';
import LookoutPage from './pages/LookoutPage';
import ReefguardPage from './pages/ReefguardPage';
import PieropsPage from './pages/PieropsPage';
import SaildeskPage from './pages/SaildeskPage';
import UmbrellamapPage from './pages/UmbrellamapPage';
import SandcleanPage from './pages/SandcleanPage';
import NightswimPage from './pages/NightswimPage';
import StargazePage from './pages/StargazePage';
import CoastpatrolPage from './pages/CoastpatrolPage';
import TidePage from './pages/TidePage';
import HarborlanePage from './pages/HarborlanePage';
import DockslotPage from './pages/DockslotPage';
import CraneopsPage from './pages/CraneopsPage';
import ContainerPage from './pages/ContainerPage';
import ColdbayPage from './pages/ColdbayPage';
import YardmovePage from './pages/YardmovePage';
import GatepassPage from './pages/GatepassPage';
import BoltholdPage from './pages/BoltholdPage';
import ManifestPage from './pages/ManifestPage';
import DemurragePage from './pages/DemurragePage';
import PilotagePage from './pages/PilotagePage';
import TugassistPage from './pages/TugassistPage';
import WharfagePage from './pages/WharfagePage';
import StevedorePage from './pages/StevedorePage';
import HarborPage from './pages/HarborPage';
import AuroradeckPage from './pages/AuroradeckPage';
import LightshowPage from './pages/LightshowPage';
import SoundscapePage from './pages/SoundscapePage';
import ScentzonePage from './pages/ScentzonePage';
import MoodlightPage from './pages/MoodlightPage';
import FogscenePage from './pages/FogscenePage';
import ProjectionPage from './pages/ProjectionPage';
import ImmersivePage from './pages/ImmersivePage';
import HapticcuePage from './pages/HapticcuePage';
import AtmosmixPage from './pages/AtmosmixPage';
import GuestflowPage from './pages/GuestflowPage';
import ScenectrlPage from './pages/ScenectrlPage';
import NightmodePage from './pages/NightmodePage';
import DawnmodePage from './pages/DawnmodePage';
import AuroraPage from './pages/AuroraPage';
import MiseplanPage from './pages/MiseplanPage';
import PassrailPage from './pages/PassrailPage';
import PlateupPage from './pages/PlateupPage';
import GardebayPage from './pages/GardebayPage';
import PastrylabPage from './pages/PastrylabPage';
import TastingmenuPage from './pages/TastingmenuPage';
import CellarboxPage from './pages/CellarboxPage';
import BarrailPage from './pages/BarrailPage';
import RoomservicePage from './pages/RoomservicePage';
import CaterdeskPage from './pages/CaterdeskPage';
import AllergenmapPage from './pages/AllergenmapPage';
import WastekitchenPage from './pages/WastekitchenPage';
import ChefbriefPage from './pages/ChefbriefPage';
import SupplypullPage from './pages/SupplypullPage';
import HearthPage from './pages/HearthPage';
import SpaflowPage from './pages/SpaflowPage';
import ThermalbayPage from './pages/ThermalbayPage';
import SaunalogPage from './pages/SaunalogPage';
import CryochamberPage from './pages/CryochamberPage';
import FloatpodPage from './pages/FloatpodPage';
import MassagebookPage from './pages/MassagebookPage';
import YogamatPage from './pages/YogamatPage';
import BreathworkPage from './pages/BreathworkPage';
import RecoverybayPage from './pages/RecoverybayPage';
import IvloungePage from './pages/IvloungePage';
import SleepcoachPage from './pages/SleepcoachPage';
import NutritionPage from './pages/NutritionPage';
import BiomarkerPage from './pages/BiomarkerPage';
import WellnesskitPage from './pages/WellnesskitPage';
import SanctumPage from './pages/SanctumPage';
import AssetmapPage from './pages/AssetmapPage';
import PlantroomPage from './pages/PlantroomPage';
import HvacloopPage from './pages/HvacloopPage';
import WaterloopPage from './pages/WaterloopPage';
import PowergridPage from './pages/PowergridPage';
import ElevatorlogPage from './pages/ElevatorlogPage';
import SparepartsPage from './pages/SparepartsPage';
import WorkorderPage from './pages/WorkorderPage';
import LeaseholdPage from './pages/LeaseholdPage';
import TenantopsPage from './pages/TenantopsPage';
import FacilitytourPage from './pages/FacilitytourPage';
import CapexdeskPage from './pages/CapexdeskPage';
import OpexdeskPage from './pages/OpexdeskPage';
import EstatescanPage from './pages/EstatescanPage';
import CitadelPage from './pages/CitadelPage';
import TalentdeskPage from './pages/TalentdeskPage';
import ShiftbidPage from './pages/ShiftbidPage';
import SkillmatrixPage from './pages/SkillmatrixPage';
import CerttrackPage from './pages/CerttrackPage';
import TraininghubPage from './pages/TraininghubPage';
import MentorshipPage from './pages/MentorshipPage';
import SuccessionPage from './pages/SuccessionPage';
import PayrollrunPage from './pages/PayrollrunPage';
import PerformnotePage from './pages/PerformnotePage';
import ReviewcyclePage from './pages/ReviewcyclePage';
import HeadcountPage from './pages/HeadcountPage';
import AttritionPage from './pages/AttritionPage';
import CulturepulsePage from './pages/CulturepulsePage';
import ShifttradePage from './pages/ShifttradePage';
import ForgePage from './pages/ForgePage';
import SafetylogPage from './pages/SafetylogPage';
import IncidentlogPage from './pages/IncidentlogPage';
import HazardnotePage from './pages/HazardnotePage';
import EvacroutePage from './pages/EvacroutePage';
import DrillrunPage from './pages/DrillrunPage';
import AidkitPage from './pages/AidkitPage';
import HazmatbayPage from './pages/HazmatbayPage';
import PpekitPage from './pages/PpekitPage';
import LockouttagPage from './pages/LockouttagPage';
import PermitworkPage from './pages/PermitworkPage';
import CompliancerowPage from './pages/CompliancerowPage';
import Audittrail2Page from './pages/Audittrail2Page';
import CctvreviewPage from './pages/CctvreviewPage';
import GuestsafetyPage from './pages/GuestsafetyPage';
import AegisPage from './pages/AegisPage';
import DatalakePage from './pages/DatalakePage';
import FeatureflagPage from './pages/FeatureflagPage';
import ModelcardPage from './pages/ModelcardPage';
import PromptlabPage from './pages/PromptlabPage';
import EvalbenchPage from './pages/EvalbenchPage';
import DatasetcatPage from './pages/DatasetcatPage';
import LineagePage from './pages/LineagePage';
import VectorstorePage from './pages/VectorstorePage';
import InsightboardPage from './pages/InsightboardPage';
import AnomalyPage from './pages/AnomalyPage';
import DemandcastPage from './pages/DemandcastPage';
import AbtestPage from './pages/AbtestPage';
import ScorecardPage from './pages/ScorecardPage';
import DecidlogPage from './pages/DecidlogPage';
import OraclePage from './pages/OraclePage';
import MemberdeskPage from './pages/MemberdeskPage';
import TierladderPage from './pages/TierladderPage';
import PointledgerPage from './pages/PointledgerPage';
import PerkshopPage from './pages/PerkshopPage';
import ReferralPage from './pages/ReferralPage';
import GiftcardPage from './pages/GiftcardPage';
import VipdeskPage from './pages/VipdeskPage';
import StayhistoryPage from './pages/StayhistoryPage';
import PrefernotePage from './pages/PrefernotePage';
import NpspulsePage from './pages/NpspulsePage';
import GuestcasePage from './pages/GuestcasePage';
import PraisePage from './pages/PraisePage';
import WinbackPage from './pages/WinbackPage';
import ClubnightPage from './pages/ClubnightPage';
import CrownPage from './pages/CrownPage';
import CampdeskPage from './pages/CampdeskPage';
import ContentcalPage from './pages/ContentcalPage';
import SocialqueuePage from './pages/SocialqueuePage';
import CreatordeskPage from './pages/CreatordeskPage';
import UtmtrackPage from './pages/UtmtrackPage';
import LandingPage from './pages/LandingPage';
import AbcopyPage from './pages/AbcopyPage';
import SeopagePage from './pages/SeopagePage';
import PushdeskPage from './pages/PushdeskPage';
import EmailblastPage from './pages/EmailblastPage';
import PresspackPage from './pages/PresspackPage';
import BrandkitPage from './pages/BrandkitPage';
import MediabuyPage from './pages/MediabuyPage';
import LeadmagnetPage from './pages/LeadmagnetPage';
import BeaconPage from './pages/BeaconPage';
import TreasuryPage from './pages/TreasuryPage';
import CashflowPage from './pages/CashflowPage';
import ApdeskPage from './pages/ApdeskPage';
import ArdeskPage from './pages/ArdeskPage';
import InvoicedeskPage from './pages/InvoicedeskPage';
import TaxdeskPage from './pages/TaxdeskPage';
import BudgetlinePage from './pages/BudgetlinePage';
import FxdeskPage from './pages/FxdeskPage';
import BankreconPage from './pages/BankreconPage';
import PayoutPage from './pages/PayoutPage';
import PettycashPage from './pages/PettycashPage';
import CostcenterPage from './pages/CostcenterPage';
import GlmapPage from './pages/GlmapPage';
import ClosebookPage from './pages/ClosebookPage';
import VaultPage from './pages/VaultPage';
import ShuttlelanePage from './pages/ShuttlelanePage';
import FleetdeskPage from './pages/FleetdeskPage';
import DriverostPage from './pages/DriverostPage';
import FuelcardPage from './pages/FuelcardPage';
import RouteplanPage from './pages/RouteplanPage';
import DispatchboardPage from './pages/DispatchboardPage';
import GpspingPage from './pages/GpspingPage';
import VehiclemaintPage from './pages/VehiclemaintPage';
import ValetopsPage from './pages/ValetopsPage';
import ParkingbayPage from './pages/ParkingbayPage';
import TransferjobPage from './pages/TransferjobPage';
import PickupdropPage from './pages/PickupdropPage';
import TollpassPage from './pages/TollpassPage';
import LanecontrolPage from './pages/LanecontrolPage';
import ConvoyPage from './pages/ConvoyPage';
import RoomrackPage from './pages/RoomrackPage';
import HkboardPage from './pages/HkboardPage';
import LinenroomPage from './pages/LinenroomPage';
import MinibarbayPage from './pages/MinibarbayPage';
import FoundlogPage from './pages/FoundlogPage';
import KeydeskPage from './pages/KeydeskPage';
import TurnupPage from './pages/TurnupPage';
import DeepcleanPage from './pages/DeepcleanPage';
import InspectroomPage from './pages/InspectroomPage';
import VipprepPage from './pages/VipprepPage';
import OutoforderPage from './pages/OutoforderPage';
import GuestrequestPage from './pages/GuestrequestPage';
import AmensavePage from './pages/AmensavePage';
import PublicareaPage from './pages/PublicareaPage';
import LinenPage from './pages/LinenPage';
import NightauditPage from './pages/NightauditPage';
import FoliodeskPage from './pages/FoliodeskPage';
import DeskqueuePage from './pages/DeskqueuePage';
import WakeallPage from './pages/WakeallPage';
import EarlycheckPage from './pages/EarlycheckPage';
import LatecheckPage from './pages/LatecheckPage';
import BagstorePage from './pages/BagstorePage';
import CallsheetPage from './pages/CallsheetPage';
import ArrivalboardPage from './pages/ArrivalboardPage';
import DepartureboardPage from './pages/DepartureboardPage';
import ViparrivePage from './pages/ViparrivePage';
import FrontlogPage from './pages/FrontlogPage';
import MoveticketPage from './pages/MoveticketPage';
import ConciergejobPage from './pages/ConciergejobPage';
import AtlasPage from './pages/AtlasPage';
import TybridgePage from './pages/TybridgePage';
import DolaplistPage from './pages/DolaplistPage';
import HephapickPage from './pages/HephapickPage';
import TourpackPage from './pages/TourpackPage';
import RentgearPage from './pages/RentgearPage';
import WareservePage from './pages/WareservePage';
import StaybookPage from './pages/StaybookPage';
import DazeroomPage from './pages/DazeroomPage';
import KeylessdoorPage from './pages/KeylessdoorPage';
import SportslotPage from './pages/SportslotPage';
import ArenabookPage from './pages/ArenabookPage';
import NexusgatePage from './pages/NexusgatePage';
import MintbundlePage from './pages/MintbundlePage';
import PackfolioPage from './pages/PackfolioPage';
import EmpirePage from './pages/EmpirePage';
import RetailfloorPage from './pages/RetailfloorPage';
import PlanogramPage from './pages/PlanogramPage';
import ShelfscanPage from './pages/ShelfscanPage';
import PriceauditPage from './pages/PriceauditPage';
import ShrinklogPage from './pages/ShrinklogPage';
import VendorportalPage from './pages/VendorportalPage';
import AssortmixPage from './pages/AssortmixPage';
import PromoplanePage from './pages/PromoplanePage';
import CategorybuyPage from './pages/CategorybuyPage';
import DemandplanPage from './pages/DemandplanPage';
import StockhealthPage from './pages/StockhealthPage';
import ReturnbayPage from './pages/ReturnbayPage';
import DarkstorePage from './pages/DarkstorePage';
import PoslanePage from './pages/PoslanePage';
import BazaarPage from './pages/BazaarPage';
import MediawallPage from './pages/MediawallPage';
import ContentrightsPage from './pages/ContentrightsPage';
import AdslotPage from './pages/AdslotPage';
import SponsorpackPage from './pages/SponsorpackPage';
import BrandambassPage from './pages/BrandambassPage';
import CreatorpayPage from './pages/CreatorpayPage';
import UgcqueuePage from './pages/UgcqueuePage';
import PressroomPage from './pages/PressroomPage';
import LivecastPage from './pages/LivecastPage';
import EventstreamPage from './pages/EventstreamPage';
import AffiliatenetPage from './pages/AffiliatenetPage';
import BoostdeskPage from './pages/BoostdeskPage';
import AssetlibPage from './pages/AssetlibPage';
import BriefdeskPage from './pages/BriefdeskPage';
import StudioPage from './pages/StudioPage';
import CarbonledgerPage from './pages/CarbonledgerPage';
import WaterusePage from './pages/WaterusePage';
import WastesortPage from './pages/WastesortPage';
import EnergybidPage from './pages/EnergybidPage';
import SolaryieldPage from './pages/SolaryieldPage';
import GreenteamPage from './pages/GreenteamPage';
import EsgauditPage from './pages/EsgauditPage';
import BiosurveyPage from './pages/BiosurveyPage';
import OffsetbuyPage from './pages/OffsetbuyPage';
import ClimategoalPage from './pages/ClimategoalPage';
import GreenbondPage from './pages/GreenbondPage';
import PlasticauditPage from './pages/PlasticauditPage';
import EvchargerPage from './pages/EvchargerPage';
import ReefwatchPage from './pages/ReefwatchPage';
import VerdantPage from './pages/VerdantPage';
import AccessgatePage from './pages/AccessgatePage';
import IdproofPage from './pages/IdproofPage';
import RolegrantPage from './pages/RolegrantPage';
import SessionguardPage from './pages/SessionguardPage';
import DevicetrustPage from './pages/DevicetrustPage';
import SecretvaultPage from './pages/SecretvaultPage';
import MfaregPage from './pages/MfaregPage';
import SsobridgePage from './pages/SsobridgePage';
import PrivacypolPage from './pages/PrivacypolPage';
import ConsentrowPage from './pages/ConsentrowPage';
import BreachlogPage from './pages/BreachlogPage';
import SocqueuePage from './pages/SocqueuePage';
import PatchdeskPage from './pages/PatchdeskPage';
import ZerohourPage from './pages/ZerohourPage';
import BastionPage from './pages/BastionPage';
import PartnerdeskPage from './pages/PartnerdeskPage';
import FranchisePage from './pages/FranchisePage';
import ChannelkitPage from './pages/ChannelkitPage';
import RebatePage from './pages/RebatePage';
import CoinvestPage from './pages/CoinvestPage';
import SlatrackPage from './pages/SlatrackPage';
import JointpromoPage from './pages/JointpromoPage';
import LeadsharePage from './pages/LeadsharePage';
import B2borderPage from './pages/B2borderPage';
import WholesalePage from './pages/WholesalePage';
import DealroomPage from './pages/DealroomPage';
import ContractrowPage from './pages/ContractrowPage';
import CommissionPage from './pages/CommissionPage';
import OnboardkitPage from './pages/OnboardkitPage';
import Alliance2Page from './pages/Alliance2Page';
import InboundpoPage from './pages/InboundpoPage';
import OutboundsoPage from './pages/OutboundsoPage';
import AsntrackPage from './pages/AsntrackPage';
import DockyardPage from './pages/DockyardPage';
import CrossdockPage from './pages/CrossdockPage';
import Coldchain2Page from './pages/Coldchain2Page';
import SlotbookPage from './pages/SlotbookPage';
import CarrierbidPage from './pages/CarrierbidPage';
import FreightbillPage from './pages/FreightbillPage';
import MilestonetPage from './pages/MilestonetPage';
import ExceptionlogPage from './pages/ExceptionlogPage';
import InventoryagePage from './pages/InventoryagePage';
import ReplenplanPage from './pages/ReplenplanPage';
import SafetystockPage from './pages/SafetystockPage';
import ArteryPage from './pages/ArteryPage';
import SupplierkpiPage from './pages/SupplierkpiPage';
import CmdpulsePage from './pages/CmdpulsePage';
import BoardpulsePage from './pages/BoardpulsePage';
import RiskheatPage from './pages/RiskheatPage';
import CashpulsePage from './pages/CashpulsePage';
import OpsheatPage from './pages/OpsheatPage';
import GuestheatPage from './pages/GuestheatPage';
import BrandheatPage from './pages/BrandheatPage';
import AgentpulsePage from './pages/AgentpulsePage';
import SystempulsePage from './pages/SystempulsePage';
import AlertfusePage from './pages/AlertfusePage';
import WarbriefPage from './pages/WarbriefPage';
import DecisionhubPage from './pages/DecisionhubPage';
import SealnotePage from './pages/SealnotePage';
import DominionPage from './pages/DominionPage';
import LegacyflagPage from './pages/LegacyflagPage';
import CalmroomPage from './pages/CalmroomPage';
import QuiethoursPage from './pages/QuiethoursPage';
import ScentmoodPage from './pages/ScentmoodPage';
import Pillowmenu2Page from './pages/Pillowmenu2Page';
import BathritualPage from './pages/BathritualPage';
import SleepscorePage from './pages/SleepscorePage';
import WelcomeamenPage from './pages/WelcomeamenPage';
import FarewellPage from './pages/FarewellPage';
import MemorybookPage from './pages/MemorybookPage';
import CarecallPage from './pages/CarecallPage';
import SurprisegiftPage from './pages/SurprisegiftPage';
import LoyaltyhugPage from './pages/LoyaltyhugPage';
import FeedbackloopPage from './pages/FeedbackloopPage';
import SerenityPage from './pages/SerenityPage';
import MomentmapPage from './pages/MomentmapPage';
import ApigatewayPage from './pages/ApigatewayPage';
import WebhookhubPage from './pages/WebhookhubPage';
import Ratelimit2Page from './pages/Ratelimit2Page';
import SchemaregPage from './pages/SchemaregPage';
import EventbusPage from './pages/EventbusPage';
import Jobqueue2Page from './pages/Jobqueue2Page';
import CachemeshPage from './pages/CachemeshPage';
import CdnedgePage from './pages/CdnedgePage';
import ObservemapPage from './pages/ObservemapPage';
import Errorbudget2Page from './pages/Errorbudget2Page';
import FeaturegatePage from './pages/FeaturegatePage';
import CanaryrunPage from './pages/CanaryrunPage';
import RollbackPage from './pages/RollbackPage';
import CircuitPage from './pages/CircuitPage';
import ChaosdrillPage from './pages/ChaosdrillPage';
import MemberhubPage from './pages/MemberhubPage';
import CirclePage from './pages/CirclePage';
import MeetupPage from './pages/MeetupPage';
import ForummodPage from './pages/ForummodPage';
import PolldeskPage from './pages/PolldeskPage';
import BadgeearnPage from './pages/BadgeearnPage';
import QuestlinePage from './pages/QuestlinePage';
import VolunteerPage from './pages/VolunteerPage';
import DonationPage from './pages/DonationPage';
import ChapterPage from './pages/ChapterPage';
import Ambassador2Page from './pages/Ambassador2Page';
import StorywallPage from './pages/StorywallPage';
import RitualcalPage from './pages/RitualcalPage';
import AgoraPage from './pages/AgoraPage';
import CohortPage from './pages/CohortPage';
import LabbenchPage from './pages/LabbenchPage';
import PilotrunPage from './pages/PilotrunPage';
import PrototypePage from './pages/PrototypePage';
import HypothesisPage from './pages/HypothesisPage';
import MetricslabPage from './pages/MetricslabPage';
import UserboardPage from './pages/UserboardPage';
import PatentdeskPage from './pages/PatentdeskPage';
import SandboxPage from './pages/SandboxPage';
import HackdayPage from './pages/HackdayPage';
import IncubatePage from './pages/IncubatePage';
import SpindeskPage from './pages/SpindeskPage';
import ResearchnotePage from './pages/ResearchnotePage';
import LabbudgetPage from './pages/LabbudgetPage';
import CruciblePage from './pages/CruciblePage';
import IpvaultPage from './pages/IpvaultPage';
import LegaldeskPage from './pages/LegaldeskPage';
import RiskregPage from './pages/RiskregPage';
import PolicyhubPage from './pages/PolicyhubPage';
import ClaimdeskPage from './pages/ClaimdeskPage';
import InsurancetPage from './pages/InsurancetPage';
import LitigationPage from './pages/LitigationPage';
import Compliance2Page from './pages/Compliance2Page';
import EthicslinePage from './pages/EthicslinePage';
import KycrowPage from './pages/KycrowPage';
import SanctionsPage from './pages/SanctionsPage';
import DataprivPage from './pages/DataprivPage';
import RetentionpolPage from './pages/RetentionpolPage';
import AuditevidencePage from './pages/AuditevidencePage';
import CharterPage from './pages/CharterPage';
import BoardresolvePage from './pages/BoardresolvePage';
import DrplanPage from './pages/DrplanPage';
import BackupjobPage from './pages/BackupjobPage';
import Failover2Page from './pages/Failover2Page';
import RunbookPage from './pages/RunbookPage';
import Warroom2Page from './pages/Warroom2Page';
import Commsbridge2Page from './pages/Commsbridge2Page';
import SiteevacPage from './pages/SiteevacPage';
import ColdsitePage from './pages/ColdsitePage';
import HotsparePage from './pages/HotsparePage';
import DrillscorePage from './pages/DrillscorePage';
import VendorfailPage from './pages/VendorfailPage';
import PowercutPage from './pages/PowercutPage';
import NetsplitPage from './pages/NetsplitPage';
import PhoenixPage from './pages/PhoenixPage';
import RestorejobPage from './pages/RestorejobPage';
import MarketscanPage from './pages/MarketscanPage';
import SitehuntPage from './pages/SitehuntPage';
import CapextablePage from './pages/CapextablePage';
import SoftopenPage from './pages/SoftopenPage';
import LaunchpadPage from './pages/LaunchpadPage';
import LocalhirePage from './pages/LocalhirePage';
import PermitdeskPage from './pages/PermitdeskPage';
import LandleasePage from './pages/LandleasePage';
import BuildphasePage from './pages/BuildphasePage';
import FfespecPage from './pages/FfespecPage';
import BrandrolloutPage from './pages/BrandrolloutPage';
import TrainwavePage from './pages/TrainwavePage';
import GolivePage from './pages/GolivePage';
import FrontierPage from './pages/FrontierPage';
import PostlaunchPage from './pages/PostlaunchPage';
import QasamplePage from './pages/QasamplePage';
import DefectlogPage from './pages/DefectlogPage';
import StandardopPage from './pages/StandardopPage';
import MysteryguestPage from './pages/MysteryguestPage';
import NpsdeepPage from './pages/NpsdeepPage';
import ServicemarkPage from './pages/ServicemarkPage';
import CalibdeskPage from './pages/CalibdeskPage';
import LabresultPage from './pages/LabresultPage';
import CertrenewPage from './pages/CertrenewPage';
import IsotrackPage from './pages/IsotrackPage';
import GuestvoicePage from './pages/GuestvoicePage';
import FixgatePage from './pages/FixgatePage';
import RootcausePage from './pages/RootcausePage';
import PrismPage from './pages/PrismPage';
import CorrectivePage from './pages/CorrectivePage';
import ArchiveboxPage from './pages/ArchiveboxPage';
import OralhistoryPage from './pages/OralhistoryPage';
import ArtifactPage from './pages/ArtifactPage';
import TimelinePage from './pages/TimelinePage';
import FoundersnotePage from './pages/FoundersnotePage';
import BrandbiblePage from './pages/BrandbiblePage';
import MuseumdeskPage from './pages/MuseumdeskPage';
import HeritagePage from './pages/HeritagePage';
import AnniversaryPage from './pages/AnniversaryPage';
import AlumniPage from './pages/AlumniPage';
import ScholarshipPage from './pages/ScholarshipPage';
import FoundationPage from './pages/FoundationPage';
import LegacygiftPage from './pages/LegacygiftPage';
import MonumentPage from './pages/MonumentPage';
import StoryvaultPage from './pages/StoryvaultPage';
import OlympulsePage from './pages/OlympulsePage';
import HoldingsealPage from './pages/HoldingsealPage';
import AgentcourtPage from './pages/AgentcourtPage';
import FinalbriefPage from './pages/FinalbriefPage';
import LegacycodePage from './pages/LegacycodePage';
import EternallogPage from './pages/EternallogPage';
import SummitnotePage from './pages/SummitnotePage';
import ConstellatePage from './pages/ConstellatePage';
import MythosPage from './pages/MythosPage';
import AegisfinalPage from './pages/AegisfinalPage';
import CrownfinalPage from './pages/CrownfinalPage';
import VaultfinalPage from './pages/VaultfinalPage';
import EmpirefinalPage from './pages/EmpirefinalPage';
import OlympusPage from './pages/OlympusPage';
import Accessgate2Page from './pages/Accessgate2Page';
import Idproof2Page from './pages/Idproof2Page';
import Rolegrant2Page from './pages/Rolegrant2Page';
import Sessionguard2Page from './pages/Sessionguard2Page';
import Devicetrust2Page from './pages/Devicetrust2Page';
import Secretvault2Page from './pages/Secretvault2Page';
import Mfareg2Page from './pages/Mfareg2Page';
import Ssobridge2Page from './pages/Ssobridge2Page';
import Privacypol2Page from './pages/Privacypol2Page';
import Consentrow2Page from './pages/Consentrow2Page';
import Breachlog2Page from './pages/Breachlog2Page';
import Socqueue2Page from './pages/Socqueue2Page';
import Patchdesk2Page from './pages/Patchdesk2Page';
import Zerohour2Page from './pages/Zerohour2Page';
import Bastion2Page from './pages/Bastion2Page';
import Partnerdesk2Page from './pages/Partnerdesk2Page';
import Franchise2Page from './pages/Franchise2Page';
import Channelkit2Page from './pages/Channelkit2Page';
import Rebate2Page from './pages/Rebate2Page';
import Coinvest2Page from './pages/Coinvest2Page';
import Slatrack2Page from './pages/Slatrack2Page';
import Jointpromo2Page from './pages/Jointpromo2Page';
import Leadshare2Page from './pages/Leadshare2Page';
import B2border2Page from './pages/B2border2Page';
import Wholesale2Page from './pages/Wholesale2Page';
import Dealroom2Page from './pages/Dealroom2Page';
import Contractrow2Page from './pages/Contractrow2Page';
import Commission2Page from './pages/Commission2Page';
import Onboardkit2Page from './pages/Onboardkit2Page';
import Alliance3Page from './pages/Alliance3Page';
import Inboundpo2Page from './pages/Inboundpo2Page';
import Outboundso2Page from './pages/Outboundso2Page';
import Asntrack2Page from './pages/Asntrack2Page';
import Dockyard2Page from './pages/Dockyard2Page';
import Crossdock2Page from './pages/Crossdock2Page';
import Coldchain22Page from './pages/Coldchain22Page';
import Slotbook2Page from './pages/Slotbook2Page';
import Carrierbid2Page from './pages/Carrierbid2Page';
import Freightbill2Page from './pages/Freightbill2Page';
import Milestonet2Page from './pages/Milestonet2Page';
import Exceptionlog2Page from './pages/Exceptionlog2Page';
import Inventoryage2Page from './pages/Inventoryage2Page';
import Replenplan2Page from './pages/Replenplan2Page';
import Safetystock2Page from './pages/Safetystock2Page';
import Artery2Page from './pages/Artery2Page';
import Supplierkpi2Page from './pages/Supplierkpi2Page';
import Cmdpulse2Page from './pages/Cmdpulse2Page';
import Boardpulse2Page from './pages/Boardpulse2Page';
import Riskheat2Page from './pages/Riskheat2Page';
import Cashpulse2Page from './pages/Cashpulse2Page';
import Opsheat2Page from './pages/Opsheat2Page';
import Guestheat2Page from './pages/Guestheat2Page';
import Brandheat2Page from './pages/Brandheat2Page';
import Agentpulse2Page from './pages/Agentpulse2Page';
import Systempulse2Page from './pages/Systempulse2Page';
import Alertfuse2Page from './pages/Alertfuse2Page';
import Warbrief2Page from './pages/Warbrief2Page';
import Decisionhub2Page from './pages/Decisionhub2Page';
import Sealnote2Page from './pages/Sealnote2Page';
import Dominion2Page from './pages/Dominion2Page';
import Legacyflag2Page from './pages/Legacyflag2Page';
import Calmroom2Page from './pages/Calmroom2Page';
import Quiethours2Page from './pages/Quiethours2Page';
import Scentmood2Page from './pages/Scentmood2Page';
import Pillowmenu3Page from './pages/Pillowmenu3Page';
import Bathritual2Page from './pages/Bathritual2Page';
import Sleepscore2Page from './pages/Sleepscore2Page';
import Welcomeamen2Page from './pages/Welcomeamen2Page';
import Farewell2Page from './pages/Farewell2Page';
import Memorybook2Page from './pages/Memorybook2Page';
import Carecall2Page from './pages/Carecall2Page';
import Surprisegift2Page from './pages/Surprisegift2Page';
import Loyaltyhug2Page from './pages/Loyaltyhug2Page';
import Feedbackloop2Page from './pages/Feedbackloop2Page';
import Serenity2Page from './pages/Serenity2Page';
import Momentmap2Page from './pages/Momentmap2Page';
import Apigateway2Page from './pages/Apigateway2Page';
import Webhookhub2Page from './pages/Webhookhub2Page';
import Ratelimit22Page from './pages/Ratelimit22Page';
import Schemareg2Page from './pages/Schemareg2Page';
import Eventbus2Page from './pages/Eventbus2Page';
import Jobqueue22Page from './pages/Jobqueue22Page';
import Cachemesh2Page from './pages/Cachemesh2Page';
import Cdnedge2Page from './pages/Cdnedge2Page';
import Observemap2Page from './pages/Observemap2Page';
import Errorbudget3Page from './pages/Errorbudget3Page';
import Featuregate2Page from './pages/Featuregate2Page';
import Canaryrun2Page from './pages/Canaryrun2Page';
import Rollback2Page from './pages/Rollback2Page';
import Circuit2Page from './pages/Circuit2Page';
import Chaosdrill2Page from './pages/Chaosdrill2Page';
import Memberhub2Page from './pages/Memberhub2Page';
import Circle2Page from './pages/Circle2Page';
import Meetup2Page from './pages/Meetup2Page';
import Forummod2Page from './pages/Forummod2Page';
import Polldesk2Page from './pages/Polldesk2Page';
import Badgeearn2Page from './pages/Badgeearn2Page';
import Questline2Page from './pages/Questline2Page';
import Volunteer2Page from './pages/Volunteer2Page';
import Donation2Page from './pages/Donation2Page';
import Chapter2Page from './pages/Chapter2Page';
import Ambassador22Page from './pages/Ambassador22Page';
import Storywall2Page from './pages/Storywall2Page';
import Ritualcal2Page from './pages/Ritualcal2Page';
import Agora2Page from './pages/Agora2Page';
import Cohort2Page from './pages/Cohort2Page';
import Labbench2Page from './pages/Labbench2Page';
import Pilotrun2Page from './pages/Pilotrun2Page';
import Prototype2Page from './pages/Prototype2Page';
import Hypothesis2Page from './pages/Hypothesis2Page';
import Metricslab2Page from './pages/Metricslab2Page';
import Userboard2Page from './pages/Userboard2Page';
import Patentdesk2Page from './pages/Patentdesk2Page';
import Sandbox2Page from './pages/Sandbox2Page';
import Hackday2Page from './pages/Hackday2Page';
import Incubate2Page from './pages/Incubate2Page';
import Spindesk2Page from './pages/Spindesk2Page';
import Researchnote2Page from './pages/Researchnote2Page';
import Labbudget2Page from './pages/Labbudget2Page';
import Crucible2Page from './pages/Crucible2Page';
import Ipvault2Page from './pages/Ipvault2Page';
import Legaldesk2Page from './pages/Legaldesk2Page';
import Riskreg2Page from './pages/Riskreg2Page';
import Policyhub2Page from './pages/Policyhub2Page';
import Claimdesk2Page from './pages/Claimdesk2Page';
import Insurancet2Page from './pages/Insurancet2Page';
import Litigation2Page from './pages/Litigation2Page';
import Compliance22Page from './pages/Compliance22Page';
import Ethicsline2Page from './pages/Ethicsline2Page';
import Kycrow2Page from './pages/Kycrow2Page';
import Sanctions2Page from './pages/Sanctions2Page';
import Datapriv2Page from './pages/Datapriv2Page';
import Retentionpol2Page from './pages/Retentionpol2Page';
import Auditevidence2Page from './pages/Auditevidence2Page';
import Charter2Page from './pages/Charter2Page';
import Boardresolve2Page from './pages/Boardresolve2Page';
import Drplan2Page from './pages/Drplan2Page';
import Backupjob2Page from './pages/Backupjob2Page';
import Failover3Page from './pages/Failover3Page';
import Runbook2Page from './pages/Runbook2Page';
import Warroom22Page from './pages/Warroom22Page';
import Commsbridge22Page from './pages/Commsbridge22Page';
import Siteevac2Page from './pages/Siteevac2Page';
import Coldsite2Page from './pages/Coldsite2Page';
import Hotspare2Page from './pages/Hotspare2Page';
import Drillscore2Page from './pages/Drillscore2Page';
import Vendorfail2Page from './pages/Vendorfail2Page';
import Powercut2Page from './pages/Powercut2Page';
import Netsplit2Page from './pages/Netsplit2Page';
import Phoenix2Page from './pages/Phoenix2Page';
import Accessgate3Page from './pages/Accessgate3Page';
import Idproof3Page from './pages/Idproof3Page';
import Rolegrant3Page from './pages/Rolegrant3Page';
import Sessionguard3Page from './pages/Sessionguard3Page';
import Devicetrust3Page from './pages/Devicetrust3Page';
import Secretvault3Page from './pages/Secretvault3Page';
import Mfareg3Page from './pages/Mfareg3Page';
import Ssobridge3Page from './pages/Ssobridge3Page';
import Privacypol3Page from './pages/Privacypol3Page';
import Consentrow3Page from './pages/Consentrow3Page';
import Breachlog3Page from './pages/Breachlog3Page';
import Socqueue3Page from './pages/Socqueue3Page';
import Patchdesk3Page from './pages/Patchdesk3Page';
import Zerohour3Page from './pages/Zerohour3Page';
import ElysiumPage from './pages/ElysiumPage';
import Partnerdesk3Page from './pages/Partnerdesk3Page';
import Franchise3Page from './pages/Franchise3Page';
import Channelkit3Page from './pages/Channelkit3Page';
import Rebate3Page from './pages/Rebate3Page';
import Coinvest3Page from './pages/Coinvest3Page';
import Slatrack3Page from './pages/Slatrack3Page';
import Jointpromo3Page from './pages/Jointpromo3Page';
import Leadshare3Page from './pages/Leadshare3Page';
import B2border3Page from './pages/B2border3Page';
import Wholesale3Page from './pages/Wholesale3Page';
import Dealroom3Page from './pages/Dealroom3Page';
import Contractrow3Page from './pages/Contractrow3Page';
import Commission3Page from './pages/Commission3Page';
import Onboardkit3Page from './pages/Onboardkit3Page';
import AetherPage from './pages/AetherPage';
import Inboundpo3Page from './pages/Inboundpo3Page';
import Outboundso3Page from './pages/Outboundso3Page';
import Asntrack3Page from './pages/Asntrack3Page';
import Dockyard3Page from './pages/Dockyard3Page';
import Crossdock3Page from './pages/Crossdock3Page';
import Coldchain23Page from './pages/Coldchain23Page';
import Slotbook3Page from './pages/Slotbook3Page';
import Carrierbid3Page from './pages/Carrierbid3Page';
import Freightbill3Page from './pages/Freightbill3Page';
import Milestonet3Page from './pages/Milestonet3Page';
import Exceptionlog3Page from './pages/Exceptionlog3Page';
import Inventoryage3Page from './pages/Inventoryage3Page';
import Replenplan3Page from './pages/Replenplan3Page';
import Safetystock3Page from './pages/Safetystock3Page';
import HeliosPage from './pages/HeliosPage';
import Supplierkpi3Page from './pages/Supplierkpi3Page';
import Cmdpulse3Page from './pages/Cmdpulse3Page';
import Boardpulse3Page from './pages/Boardpulse3Page';
import Riskheat3Page from './pages/Riskheat3Page';
import Cashpulse3Page from './pages/Cashpulse3Page';
import Opsheat3Page from './pages/Opsheat3Page';
import Guestheat3Page from './pages/Guestheat3Page';
import Brandheat3Page from './pages/Brandheat3Page';
import Agentpulse3Page from './pages/Agentpulse3Page';
import Systempulse3Page from './pages/Systempulse3Page';
import Alertfuse3Page from './pages/Alertfuse3Page';
import Warbrief3Page from './pages/Warbrief3Page';
import Decisionhub3Page from './pages/Decisionhub3Page';
import Sealnote3Page from './pages/Sealnote3Page';
import SelenePage from './pages/SelenePage';
import Legacyflag3Page from './pages/Legacyflag3Page';
import Calmroom3Page from './pages/Calmroom3Page';
import Quiethours3Page from './pages/Quiethours3Page';
import Scentmood3Page from './pages/Scentmood3Page';
import Pillowmenu4Page from './pages/Pillowmenu4Page';
import Bathritual3Page from './pages/Bathritual3Page';
import Sleepscore3Page from './pages/Sleepscore3Page';
import Welcomeamen3Page from './pages/Welcomeamen3Page';
import Farewell3Page from './pages/Farewell3Page';
import Memorybook3Page from './pages/Memorybook3Page';
import Carecall3Page from './pages/Carecall3Page';
import Surprisegift3Page from './pages/Surprisegift3Page';
import Loyaltyhug3Page from './pages/Loyaltyhug3Page';
import Feedbackloop3Page from './pages/Feedbackloop3Page';
import GaiaPage from './pages/GaiaPage';
import Momentmap3Page from './pages/Momentmap3Page';
import Apigateway3Page from './pages/Apigateway3Page';
import Webhookhub3Page from './pages/Webhookhub3Page';
import Ratelimit23Page from './pages/Ratelimit23Page';
import Schemareg3Page from './pages/Schemareg3Page';
import Eventbus3Page from './pages/Eventbus3Page';
import Jobqueue23Page from './pages/Jobqueue23Page';
import Cachemesh3Page from './pages/Cachemesh3Page';
import Cdnedge3Page from './pages/Cdnedge3Page';
import Observemap3Page from './pages/Observemap3Page';
import Errorbudget4Page from './pages/Errorbudget4Page';
import Featuregate3Page from './pages/Featuregate3Page';
import Canaryrun3Page from './pages/Canaryrun3Page';
import Rollback3Page from './pages/Rollback3Page';
import ChronosPage from './pages/ChronosPage';
import Chaosdrill3Page from './pages/Chaosdrill3Page';
import Memberhub3Page from './pages/Memberhub3Page';
import Circle3Page from './pages/Circle3Page';
import Meetup3Page from './pages/Meetup3Page';
import Forummod3Page from './pages/Forummod3Page';
import Polldesk3Page from './pages/Polldesk3Page';
import Badgeearn3Page from './pages/Badgeearn3Page';
import Questline3Page from './pages/Questline3Page';
import Volunteer3Page from './pages/Volunteer3Page';
import Donation3Page from './pages/Donation3Page';
import Chapter3Page from './pages/Chapter3Page';
import Ambassador23Page from './pages/Ambassador23Page';
import Storywall3Page from './pages/Storywall3Page';
import Ritualcal3Page from './pages/Ritualcal3Page';
import KairosPage from './pages/KairosPage';
import Cohort3Page from './pages/Cohort3Page';
import Labbench3Page from './pages/Labbench3Page';
import Pilotrun3Page from './pages/Pilotrun3Page';
import Prototype3Page from './pages/Prototype3Page';
import Hypothesis3Page from './pages/Hypothesis3Page';
import Metricslab3Page from './pages/Metricslab3Page';
import Userboard3Page from './pages/Userboard3Page';
import Patentdesk3Page from './pages/Patentdesk3Page';
import Sandbox3Page from './pages/Sandbox3Page';
import Hackday3Page from './pages/Hackday3Page';
import Incubate3Page from './pages/Incubate3Page';
import Spindesk3Page from './pages/Spindesk3Page';
import Researchnote3Page from './pages/Researchnote3Page';
import Labbudget3Page from './pages/Labbudget3Page';
import LogosPage from './pages/LogosPage';
import Ipvault3Page from './pages/Ipvault3Page';
import Legaldesk3Page from './pages/Legaldesk3Page';
import Riskreg3Page from './pages/Riskreg3Page';
import Policyhub3Page from './pages/Policyhub3Page';
import Claimdesk3Page from './pages/Claimdesk3Page';
import Insurancet3Page from './pages/Insurancet3Page';
import Litigation3Page from './pages/Litigation3Page';
import Compliance23Page from './pages/Compliance23Page';
import Ethicsline3Page from './pages/Ethicsline3Page';
import Kycrow3Page from './pages/Kycrow3Page';
import Sanctions3Page from './pages/Sanctions3Page';
import Datapriv3Page from './pages/Datapriv3Page';
import Retentionpol3Page from './pages/Retentionpol3Page';
import Auditevidence3Page from './pages/Auditevidence3Page';
import PathosPage from './pages/PathosPage';
import Boardresolve3Page from './pages/Boardresolve3Page';
import Drplan3Page from './pages/Drplan3Page';
import Backupjob3Page from './pages/Backupjob3Page';
import Failover4Page from './pages/Failover4Page';
import Runbook3Page from './pages/Runbook3Page';
import Warroom23Page from './pages/Warroom23Page';
import Commsbridge23Page from './pages/Commsbridge23Page';
import Siteevac3Page from './pages/Siteevac3Page';
import Coldsite3Page from './pages/Coldsite3Page';
import Hotspare3Page from './pages/Hotspare3Page';
import Drillscore3Page from './pages/Drillscore3Page';
import Vendorfail3Page from './pages/Vendorfail3Page';
import Powercut3Page from './pages/Powercut3Page';
import Netsplit3Page from './pages/Netsplit3Page';
import ApotheosisPage from './pages/ApotheosisPage';
import ExtremeParkPage from './pages/ExtremeParkPage';
import DocsPage from './pages/DocsPage';
import {
  fetchMe,
  getStoredUser,
  logout,
  type AuthUser,
} from './services/auth';
import { setActiveBrand } from './services/brands';

const PAGES: Record<string, () => React.JSX.Element> = {
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

function pageFromHash(allowed: string[]): string {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  if (hash && hash in PAGES && allowed.includes(hash)) return hash;
  return defaultPage(allowed);
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [booting, setBooting] = useState(true);
  const [page, setPage] = useState<string>('komuta');

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
        // Hash yoksa varsayılan sayfayı (CEO → Komuta) URL'ye yaz
        if (!window.location.hash.replace('#', '').trim()) {
          window.location.hash = `/${next}`;
        }
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
    const onHashChange = () => setPage(pageFromHash(pages));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [user]);

  const navigate = useCallback(
    (next: string) => {
      const pages = user?.pages ?? [];
      if (!pages.includes(next)) return;
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
      if (
        page !== 'hub' &&
        page !== 'brands' &&
        page !== 'guests' &&
        page !== 'notifications' &&
        page !== 'settings' &&
        !modules.has(page) &&
        allowed.includes('hub')
      ) {
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
        <ActivePage />
      </main>
    </div>
  );
}
