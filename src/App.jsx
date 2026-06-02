import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className='min-h-screen bg-gray-100'>
        <h1 className='text-3xl font-bold text-red-600 p-8'>GestionSTK Dashboard PWA</h1>
        <p className='px-8'>Proyecto inicializado correctamente con Vite + React + Tailwind</p>
      </div>
    </Router>
  );
}

export default App;