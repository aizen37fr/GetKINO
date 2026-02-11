import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/Auth';
import LandingPage from './pages/LandingPage';
import CineDetectivePage from './pages/CineDetectivePage';
import MatchMode from './pages/MatchMode';
import AIChatbot from './components/AIChatbot';
// import { ParticleBackground } from './components/3D/ParticleBackground';
// import { CursorEffect } from './components/3D/CursorEffect';

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<'landing' | 'detective' | 'match'>('landing');

  // Landing Page - Al ways show first (for both logged in and not logged in users)
  if (currentPage === 'landing') {
    return <LandingPage onGetStarted={() => setCurrentPage('detective')} />;
  }

  // Auth required for other pages
  if (!user) {
    return <AuthPage />;
  }

  // Match Mode
  if (currentPage === 'match') {
    return (
      <>
        <MatchMode onBack={() => setCurrentPage('detective')} />
        <AIChatbot />
      </>
    );
  }

  // Detective Page - Main app experience
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

