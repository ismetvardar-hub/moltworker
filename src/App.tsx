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
import {
  fetchMe,
  getStoredUser,
  logout,
  type AuthUser,
} from './services/auth';
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
};

function pageFromHash(allowed: string[]): PageId {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  if (hash in PAGES && allowed.includes(hash)) return hash as PageId;
  return (allowed[0] as PageId) || 'hub';
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [booting, setBooting] = useState(true);
  const [page, setPage] = useState<PageId>('hub');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetchMe();
      if (cancelled) return;
      setUser(me);
      if (me) setPage(pageFromHash(me.pages));
      setBooting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const onHashChange = () => setPage(pageFromHash(user.pages));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [user]);

  const navigate = useCallback(
    (next: PageId) => {
      if (!user?.pages.includes(next)) return;
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
            const first = pageFromHash(u.pages);
            setPage(first);
            window.location.hash = `/${first}`;
          }
        }}
      />
    );
  }

  const ActivePage = PAGES[page] ?? PAGES.hub;

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar
        active={page}
        onNavigate={navigate}
        allowedPages={user.pages}
        userName={user.name}
        userRole={user.role}
        onLogout={() => void handleLogout()}
      />
      <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8">
        <ActivePage />
      </main>
    </div>
  );
}
