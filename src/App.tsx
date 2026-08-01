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
import DocsPage from './pages/DocsPage';
import {
  fetchMe,
  getStoredUser,
  logout,
  type AuthUser,
} from './services/auth';
import { setActiveBrand } from './services/brands';
import type { PageId } from './types';

const PAGES: Record<PageId, () => React.JSX.Element> = {
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

function defaultPage(allowed: string[]): PageId {
  if (allowed.includes('komuta')) return 'komuta';
  if (allowed.includes('hub')) return 'hub';
  return (allowed[0] as PageId) || 'komuta';
}

function pageFromHash(allowed: string[]): PageId {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  if (hash && hash in PAGES && allowed.includes(hash)) return hash as PageId;
  return defaultPage(allowed);
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [booting, setBooting] = useState(true);
  const [page, setPage] = useState<PageId>('komuta');

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
    (next: PageId) => {
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
