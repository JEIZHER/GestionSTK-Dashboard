import React from 'react';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './components/auth/Login';
import DashboardHome from './components/dashboard/DashboardHome';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, loading } = useAuth();

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