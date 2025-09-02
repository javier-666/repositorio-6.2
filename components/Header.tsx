import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, Entity, UserRole, Notification } from '../types';
import LogOutIcon from './icons/LogOutIcon';
import BellIcon from './icons/BellIcon';

interface HeaderProps {
    currentUser: User;
    onLogout: () => void;
    onShowProfile: () => void;
    onOpenPasswordModal: () => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    entities: Entity[];
    viewingEntityId: string | null;
    onViewingEntityChange: (entityId: string | null) => void;
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onShowProfile, onOpenPasswordModal, searchQuery, onSearchChange, entities, viewingEntityId, onViewingEntityChange, notifications, onMarkAsRead, onMarkAllAsRead }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const userNotifications = useMemo(() => {
    if (!currentUser) return [];
    
    const isAdmin = currentUser.role === UserRole.Admin || currentUser.role === UserRole.Almacenero || currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.SuperUsuario;
    
    return notifications
        .filter(n => {
            if (n.target === 'admins_almaceneros' && isAdmin) return true;
            if (n.target === currentUser.id) return true;
            return false;
        })
        .slice(0, 15); // Show latest 15
  }, [notifications, currentUser]);

  const unreadCount = useMemo(() => {
    return userNotifications.filter(n => !n.read).length;
  }, [userNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
            setIsNotificationsOpen(false);
        }
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setIsDropdownOpen(false);
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleToggleNotifications = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsNotificationsOpen(prev => !prev);
      setIsDropdownOpen(false);
  }
  
  const handleToggleUserMenu = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDropdownOpen(prev => !prev);
      setIsNotificationsOpen(false);
  }


  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                 <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                    <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
            </span>
            <input 
                type="text" 
                placeholder="Buscar productos..." 
                className="w-full md:w-96 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>
        {(currentUser.role === UserRole.SuperAdmin || currentUser.role === UserRole.SuperUsuario) && (
            <div className="relative">
                <label htmlFor="entityView" className="text-sm font-medium text-gray-600 mr-2">Vista de Entidad:</label>
                <select
                    id="entityView"
                    value={viewingEntityId || ''}
                    onChange={(e) => onViewingEntityChange(e.target.value || null)}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                    <option value="">{currentUser.role === UserRole.SuperAdmin ? 'Gestionar Entidades' : 'Vista Global'}</option>
                    {entities.map(entity => (
                        <option key={entity.id} value={entity.id}>{entity.name}</option>
                    ))}
                </select>
            </div>
        )}
      </div>
      <div className="flex items-center">
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={handleToggleNotifications}
            className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            <BellIcon className="h-6 w-6 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 block h-2.5 w-2.5 transform rounded-full bg-red-500 ring-2 ring-white"></span>
            )}
          </button>
          {isNotificationsOpen && (
             <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-md shadow-lg z-20 border">
               <div className="flex justify-between items-center px-4 py-2 border-b">
                  <h3 className="font-semibold text-gray-800">Notificaciones</h3>
                  {unreadCount > 0 && (
                    <button onClick={onMarkAllAsRead} className="text-xs text-teal-600 hover:underline">Marcar todas como leídas</button>
                  )}
               </div>
               <ul className="max-h-96 overflow-y-auto">
                  {userNotifications.length > 0 ? userNotifications.map(n => (
                    <li key={n.id} onClick={() => onMarkAsRead(n.id)} className={`px-4 py-3 border-b last:border-b-0 cursor-pointer ${n.read ? 'bg-white' : 'bg-teal-50'} hover:bg-gray-100`}>
                       <div className="flex items-start">
                          {!n.read && <span className="h-2 w-2 bg-teal-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>}
                          <div className="flex-grow">
                            <p className={`text-sm ${n.read ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>{n.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                          </div>
                       </div>
                    </li>
                  )) : (
                    <li className="px-4 py-4 text-center text-sm text-gray-500">No tienes notificaciones.</li>
                  )}
               </ul>
             </div>
          )}
        </div>
        <div className="ml-4 relative" ref={userMenuRef}>
            <div className="flex items-center cursor-pointer" onClick={handleToggleUserMenu}>
                <img
                    className="h-9 w-9 rounded-full object-cover"
                    src={currentUser.avatarUrl}
                    alt="User Avatar"
                />
                <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
                    <p className="text-xs text-gray-500">{currentUser.role}</p>
                </div>
            </div>
            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onShowProfile();
                          setIsDropdownOpen(false);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                       Mi Perfil
                    </a>
                    <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          onOpenPasswordModal();
                          setIsDropdownOpen(false);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                       Cambiar Contraseña
                    </a>
                    <div className="border-t border-gray-100 my-1"></div>
                     <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            onLogout();
                            setIsDropdownOpen(false);
                        }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        <LogOutIcon className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                    </a>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;