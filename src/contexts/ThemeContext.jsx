import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Intentar recuperar preferencia guardada
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('dashboard-theme');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('dashboard-theme', JSON.stringify(isDark));
    // Aplicar clase al body para selectores CSS globales si fuera necesario
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  // Colores exactos de GestionSTK /src/styles/themes.js
  const colors = {
    light: {
      background: '#ffffffe8',
      text: '#333333',
      card: '#F5F5F5',
      border: '#E0E0E0',
      accent: '#FF3B30', // Rojo Starken (Light)
      sidebar: '#FFFFFF',
      primary: '#007bff'
    },
    dark: {
      background: '#121212',
      text: '#E0E0E0',
      card: '#1E1E1E',
      border: '#363636',
      accent: '#FF9500', // Naranja/Ambar (Dark) para mejor visibilidad
      sidebar: '#1E1E1E',
      primary: '#89CFF0'
    }
  };

  const theme = isDark ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
};
