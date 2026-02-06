import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/Auth';
import CineDetectivePage from './pages/CineDetectivePage';
import MatchMode from './pages/MatchMode';
import AIChatbot from './components/AIChatbot';
// import { ParticleBackground } from './components/3D/ParticleBackground';
import { CursorEffect } from './components/3D/CursorEffect';

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<'detective' | 'match'>('detective');

  if (!user) {
    return <AuthPage />;
  }

  if (currentPage === 'match') {
    return (
      <>
        <MatchMode onBack={() => setCurrentPage('detective')} />
        <AIChatbot />
      </>
    );
  }

  return (
    <>
      <CineDetectivePage />
      <AIChatbot />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      {/* 3D Background Effects */}
      {/* <ParticleBackground theme="default" /> */}
      {/* <CursorEffect /> */}

      <AppContent />
    </AuthProvider>
  );
}

export default App
