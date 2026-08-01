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
