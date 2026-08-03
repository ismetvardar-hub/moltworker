import { lazy, Suspense, useCallback, useEffect, useState, type ComponentType } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LoginPage from './pages/LoginPage';
import {
  fetchMe,
  getStoredUser,
  logout,
  type AuthUser,
} from './services/auth';
import { setActiveBrand } from './services/brands';
import { isPageVisible } from './nav/pageVisibility';

const Sidebar = lazy(() => import('./components/Sidebar'));

type PageMap = Record<string, ComponentType>;

function defaultPage(allowed: string[]): string {
  if (allowed.includes('komuta')) return 'komuta';
  if (allowed.includes('hub')) return 'hub';
  return allowed[0] || 'komuta';
}

function hashPageId(): string {
  return window.location.hash.replace('#/', '').replace('#', '').trim();
}

function pageFromHash(allowed: string[], registry: PageMap | null): string {
  const hash = hashPageId();
  if (hash && registry && hash in registry && allowed.includes(hash)) return hash;
  if (hash && allowed.includes(hash)) return hash;
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
  const [registry, setRegistry] = useState<PageMap | null>(null);

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
        const next = pageFromHash(pages, null);
        setPage(next);
        syncHash(next);
      }
      setBooting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Oturum açılınca sayfa registry + sidebar chunk’ını yükle */
  useEffect(() => {
    if (!user) {
      setRegistry(null);
      return;
    }
    let cancelled = false;
    void import('./pageRegistry').then((m) => {
      if (!cancelled) setRegistry(m.PAGES);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const pages = user.pages ?? [];
    const onHashChange = () => {
      const next = pageFromHash(pages, registry);
      setPage(next);
      syncHash(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [user, registry]);

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
    setRegistry(null);
    window.location.hash = '';
  };

  const handleBrandChange = async (brandId: string) => {
    try {
      const updated = await setActiveBrand(brandId);
      setUser(updated);
      const allowed = updated.pages ?? [];
      const brand = updated.brands?.find((b) => b.id === brandId);
      const modules = new Set(brand?.modules ?? []);
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
  const ActivePage =
    (registry && (registry[page] || (allowed.includes('komuta') ? registry.komuta : registry.hub))) ||
    null;

  return (
    <div className="flex h-full overflow-hidden">
      <Suspense
        fallback={
          <aside className="flex h-full w-72 shrink-0 items-center justify-center border-r border-obsidian-700 bg-obsidian-900 text-xs text-slate-500">
            Menü yükleniyor…
          </aside>
        }
      >
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
      </Suspense>
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
            {ActivePage ? (
              <ActivePage />
            ) : (
              <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                Sayfa kataloğu yükleniyor…
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
