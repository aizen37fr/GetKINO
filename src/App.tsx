import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import CineDetectivePage from './pages/CineDetectivePage';
import MatchMode from './pages/MatchMode';
import WatchlistPage from './pages/WatchlistPage';
import TasteDNAPage from './pages/TasteDNAPage';
import AIDiscoveryPage from './pages/AIDiscoveryPage';
import RabbitHolePage from './pages/RabbitHolePage';
import AIChatbot from './components/AIChatbot';


// import { ParticleBackground } from './components/3D/ParticleBackground';
// import { CursorEffect } from './components/3D/CursorEffect';

type Page = 'landing' | 'detective' | 'match' | 'watchlist' | 'tasteDNA' | 'aiDiscovery' | 'rabbitHole';



function AppContent() {
  // const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('landing');

  if (currentPage === 'landing') {
    return <LandingPage onGetStarted={() => setCurrentPage('detective')} />;
  }

  // if (!user) {
  //   return <AuthPage />;
  // }

  if (currentPage === 'watchlist') {
    return <WatchlistPage onBack={() => setCurrentPage('detective')} onOpenDNA={() => setCurrentPage('tasteDNA')} />;
  }

  if (currentPage === 'tasteDNA') {
    return <TasteDNAPage onBack={() => setCurrentPage('watchlist')} />;
  }

  if (currentPage === 'aiDiscovery') {
    return <AIDiscoveryPage onBack={() => setCurrentPage('detective')} />;
  }

  if (currentPage === 'rabbitHole') {
    return <RabbitHolePage onBack={() => setCurrentPage('detective')} />;
  }

  if (currentPage === 'match') {
    return (
      <>
        <MatchMode onBack={() => setCurrentPage('detective')} />
        <AIChatbot />
      </>
    );
  }

  // Detective Page — pass navigation so it can open Watchlist
  return (
    <>
      <CineDetectivePage
        onOpenWatchlist={() => setCurrentPage('watchlist')}
        onOpenAI={() => setCurrentPage('aiDiscovery')}
        onOpenRabbitHole={() => setCurrentPage('rabbitHole')}
      />
      <AIChatbot />
    </>
  );

}

function App() {
  return (
    <AuthProvider>
      {/* <ParticleBackground theme="default" /> */}
      {/* <CursorEffect /> */}
      <AppContent />
    </AuthProvider>
  );
}

export default App;
