import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { CharacterPage } from './pages/CharacterPage';
import { CatalogPage } from './pages/CatalogPage';
import { PreparePage } from './pages/PreparePage';
import { AppProvider, useApp } from './state/AppContext';

function RouterContent() {
  const { loading, error } = useApp();

  if (loading) {
    return <p className="mx-auto max-w-2xl p-6 text-sm text-text-muted">Loading Spellbook...</p>;
  }

  if (error) {
    return <p className="mx-auto max-w-2xl p-6 text-sm text-blood">{error}</p>;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/catalog" replace />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/prepare" element={<PreparePage />} />
        <Route path="/character" element={<CharacterPage />} />
        <Route path="*" element={<Navigate to="/catalog" replace />} />
      </Routes>
    </AppShell>
  );
}

export function App() {
  return (
    <div className="dark">
      <AppProvider>
        <Router basename={import.meta.env.BASE_URL}>
          <RouterContent />
        </Router>
      </AppProvider>
    </div>
  );
}
