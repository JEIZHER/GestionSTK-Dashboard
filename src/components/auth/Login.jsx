import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-[#ffffffe8]'>
      <div className='bg-[#F5F5F5] p-8 rounded-lg shadow-sm border border-[#E0E0E0] w-full max-w-md'>
        <div className='flex flex-col items-center justify-center mb-6'>
          <img 
            src={logo} 
            alt="GestionSTK Logo" 
            style={{ width: '64px', height: '64px', objectFit: 'contain', marginBottom: '1rem' }} 
          />
          <h1 className='font-black text-2xl tracking-tighter text-[#333333]'>
            Gestion<span className='text-[#E30613]'>STK</span>
          </h1>
        </div>
        <h2 className='text-center text-lg font-bold mb-6 text-[#333333]'>Iniciar Sesión</h2>
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-bold text-[#333333] uppercase'>Correo Electrónico</label>
            <input
              type='email'
              required
              className='p-3 border border-[#E0E0E0] rounded bg-white text-[#333333] focus:outline-none focus:border-[#E30613]'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-1'>
            <label className='text-xs font-bold text-[#333333] uppercase'>Contraseña</label>
            <input
              type='password'
              required
              className='p-3 border border-[#E0E0E0] rounded bg-white text-[#333333] focus:outline-none focus:border-[#E30613]'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className='text-[#DC3545] text-xs font-bold'>{error}</p>}
          <button
            type='submit'
            disabled={loading}
            className='mt-2 p-3 bg-[#E30613] text-white rounded font-bold hover:bg-[#c40510] transition-colors disabled:bg-gray-400'
          >
            {loading ? 'Sincronizando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}