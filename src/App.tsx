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
