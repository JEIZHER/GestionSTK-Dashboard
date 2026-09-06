import React from 'react';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Login from './components/auth/Login';
import DashboardHome from './components/dashboard/DashboardHome';
import ManualView from './components/dashboard/ManualView';
import { Loader2 } from 'lucide-react';

function StandaloneManual() {
  const { theme } = useTheme();
  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.background, color: theme.text, padding: '1rem' }}>
      <ManualView theme={theme} isMobile={window.innerWidth <= 768} />
    </div>
  );
}

function App() {
  const { user, loading } = useAuth();
  const isManualView = new URLSearchParams(window.location.search).get('view') === 'manual';

  if (isManualView) {
    return (
      <ThemeProvider>
        <StandaloneManual />
      </ThemeProvider>
    );
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <Loader2 className='h-10 w-10 animate-spin text-red-600' />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div className='min-h-screen'>
        {!user ? <Login /> : <DashboardHome />}
      </div>
    </ThemeProvider>
  );
}

export default App;