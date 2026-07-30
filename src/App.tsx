import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import CommandCenter from './pages/CommandCenter';
import OllamaPanel from './pages/OllamaPanel';
import AgentsPanel from './pages/AgentsPanel';
import OlymposPassPanel from './pages/OlymposPassPanel';
import type { PageId } from './types';

const PAGES: Record<PageId, () => React.JSX.Element> = {
  komuta: CommandCenter,
  ollama: OllamaPanel,
  ajanlar: AgentsPanel,
  olympospass: OlymposPassPanel,
};

function pageFromHash(): PageId {
  const hash = window.location.hash.replace('#/', '').replace('#', '');
  return hash in PAGES ? (hash as PageId) : 'komuta';
}

export default function App() {
  const [page, setPage] = useState<PageId>(pageFromHash);
  const ActivePage = PAGES[page];

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: PageId) => {
    window.location.hash = `/${next}`;
    setPage(next);
  };

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar active={page} onNavigate={navigate} />
      <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8">
        <ActivePage />
      </main>
    </div>
  );
}
