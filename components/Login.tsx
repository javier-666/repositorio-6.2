import React, { useState } from 'react';
import { Entity } from '../types';
import Logo from './icons/Logo';
import StoreIcon from './icons/StoreIcon';

interface LoginProps {
  onLogin: (email: string, password: string) => boolean;
  entities: Entity[];
}

const Login: React.FC<LoginProps> = ({ onLogin, entities }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = onLogin(email, password);
    if (!success) {
      setError('Correo o contraseña incorrectos.');
    }
  };

  const UserIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const LockIcon = () => (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  const publicStores = entities.filter(e => e.isStoreEnabled && e.storeSlug);

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      {/* Left Panel */}
      <div className="relative overflow-hidden md:flex w-2/5 bg-gradient-to-tr from-teal-500 to-teal-800 i justify-around items-center hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 border-4 rounded-full border-opacity-30 border-t-8 border-t-white"></div>
        <div className="absolute -bottom-40 -right-0 w-80 h-80 border-4 rounded-full border-opacity-30 border-t-8 border-t-white"></div>
        <div className="relative z-10 p-12 text-center">
            <Logo className="w-full max-w-sm h-auto text-white" />
        </div>
      </div>
      
      {/* Right Panel */}
      <div className="flex md:w-3/5 justify-center py-10 items-center bg-gray-50">
        <div className="w-full max-w-md px-6">
          <h1 className="text-gray-800 font-bold text-3xl mb-1 text-center">¡Bienvenido!</h1>
          <p className="text-sm font-normal text-gray-600 mb-8 text-center">Inicia sesión en tu cuenta</p>
          
          <form onSubmit={handleSubmit}>
            <div className="relative mb-4">
               <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <UserIcon />
              </div>
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Usuario o Correo Electrónico"
                required 
              />
            </div>

            <div className="relative mb-6">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <LockIcon />
              </div>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500" 
                placeholder="Contraseña"
                required
              />
            </div>
            
            {error && <p className="text-red-500 text-xs mb-4 text-center">{error}</p>}
            
            <button 
              type="submit" 
              className="transition-all duration-300 ease-in-out bg-teal-600 hover:bg-teal-700 focus:bg-teal-800 focus:shadow-sm focus:ring-4 focus:ring-teal-500 focus:ring-opacity-50 text-white w-full py-2.5 rounded-lg text-sm shadow-sm hover:shadow-md font-semibold text-center inline-block"
            >
              <span className="inline-block">Iniciar Sesión</span>
            </button>
          </form>

          {publicStores.length > 0 && (
            <div className="mt-8 text-center text-sm text-gray-500 bg-gray-100 p-4 rounded-lg border">
                <h4 className="font-bold mb-3 text-gray-700">Tiendas Públicas Disponibles</h4>
                <div className="space-y-2">
                    {publicStores.map(store => {
                        const storeUrl = `/?store=${store.storeSlug}`;
                        return (
                            <a 
                                key={store.id} 
                                href={storeUrl}
                                className="flex items-center justify-center gap-2 text-teal-600 hover:text-teal-800 hover:underline"
                            >
                                <StoreIcon className="w-4 h-4" />
                                <span>Visitar tienda de {store.name}</span>
                            </a>
                        )
                    })}
                </div>
            </div>
          )}

          <div className="mt-4 text-center text-xs text-gray-500 bg-gray-100 p-3 rounded-lg border">
            <p className="font-bold mb-2">Datos de Prueba</p>
            <div className="space-y-1">
               <p><span className="font-semibold">Super Usuario:</span> Usuario: <span className="font-mono">void</span>, Pass: <span className="font-mono">456</span></p>
               <p><span className="font-semibold">Super Admin:</span> Usuario: <span className="font-mono">adm</span>, Pass: <span className="font-mono">123</span></p>
               <p><span className="font-semibold">Admin (Empresa A):</span> Usuario: <span className="font-mono">admin</span>, Pass: <span className="font-mono">123</span></p>
               <p><span className="font-semibold">Admin (Empresa B):</span> Usuario: <span className="font-mono">admin_b</span>, Pass: <span className="font-mono">123</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;