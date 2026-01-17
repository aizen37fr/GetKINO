
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/Auth';
import HomePage from './pages/Home';

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <AuthPage />;
  }

  return <HomePage />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App
