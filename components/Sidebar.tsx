

import React from 'react';
import HomeIcon from './icons/HomeIcon';
import BoxIcon from './icons/BoxIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import UsersIcon from './icons/UsersIcon';
import MapPinIcon from './icons/MapPinIcon';
import { User, UserRole, View, Entity } from '../types';
import BuildingIcon from './icons/BuildingIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import CogIcon from './icons/CogIcon';
import ClipboardCheckIcon from './icons/ClipboardCheckIcon';
import Logo from './icons/Logo';
import StoreIcon from './icons/StoreIcon';
import TruckIcon from './icons/TruckIcon';
import FireIcon from './icons/FireIcon';


interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  currentUser: User;
  viewingEntityId: string | null;
  activeEntity: Entity | null | undefined;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, currentUser, viewingEntityId, activeEntity }) => {
  const navItems = [
    { id: 'dashboard', label: 'Pagina principal', icon: HomeIcon, roles: [UserRole.Admin, UserRole.Almacenero, UserRole.User] },
    { id: 'store', label: 'Tienda', icon: StoreIcon, roles: [UserRole.Admin, UserRole.Almacenero, UserRole.User] },
    { id: 'entities', label: 'Entidades', icon: BuildingIcon, roles: [UserRole.SuperAdmin, UserRole.SuperUsuario] },
    { id: 'super-admin-activity-log', label: 'Registro de Admin', icon: ClipboardCheckIcon, roles: [UserRole.SuperAdmin, UserRole.SuperUsuario] },
    { id: 'super-user-activity-log', label: 'Registro de Super Admin', icon: ClipboardCheckIcon, roles: [UserRole.SuperUsuario] },
    { id: 'inventory', label: 'Inventario', icon: BoxIcon, roles: [UserRole.Admin, UserRole.Almacenero, UserRole.User] },
    { id: 'orders', label: 'Pedidos', icon: ClipboardListIcon, roles: [UserRole.Admin, UserRole.Almacenero, UserRole.User] },
    { id: 'reports', label: 'Informes', icon: ChartBarIcon, roles: [UserRole.Admin, UserRole.Almacenero] },
    { id: 'supplier-dashboard', label: 'Proveedores', icon: TruckIcon, roles: [UserRole.Admin] },
    { id: 'warehouse-heatmap', label: 'Mapa de Calor', icon: FireIcon, roles: [UserRole.Admin] },
    { id: 'activity-log', label: 'Registro de Actividad', icon: ClipboardCheckIcon, roles: [UserRole.Admin] },
    { id: 'users', label: 'Usuarios', icon: UsersIcon, roles: [UserRole.Admin, UserRole.SuperUsuario] },
    { id: 'locations', label: 'Ubicaciones', icon: MapPinIcon, roles: [UserRole.Admin] },
    { id: 'entity-settings', label: 'Ajustes', icon: CogIcon, roles: [UserRole.Admin] },
  ];

  const getVisibleNavItems = () => {
    let visibleItems;

    if (currentUser.role === UserRole.SuperAdmin) {
      if (viewingEntityId) {
        // Show full admin sidebar when viewing an entity
        visibleItems = navItems.filter(item => item.roles.includes(UserRole.Admin));
      } else {
        // Show only global management when not viewing a specific entity
        visibleItems = navItems.filter(item => item.id === 'entities' || item.id === 'super-admin-activity-log');
      }
    } else if (currentUser.role === UserRole.SuperUsuario) {
        if (viewingEntityId) {
            // Act as admin when viewing an entity
            visibleItems = navItems.filter(item => item.roles.includes(UserRole.Admin));
        } else {
            // Global view: Supervision of Admins and Entities
            const supervisionItems = navItems.filter(item => 
                item.id === 'users' || 
                item.id === 'entities' || 
                item.id === 'super-admin-activity-log' ||
                item.id === 'super-user-activity-log'
            );
            visibleItems = supervisionItems.map(item => 
                item.id === 'users' ? { ...item, label: 'Supervisión' } : item
            );
        }
    } else {
        // Default behavior for other roles
        visibleItems = navItems.filter(item => item.roles.includes(currentUser.role));
    }

    // Conditionally filter out the store item if it's not enabled for the active entity
    if (!activeEntity?.isStoreEnabled) {
      visibleItems = visibleItems.filter(item => item.id !== 'store');
    }

    return visibleItems;
  };
  
  const visibleNavItems = getVisibleNavItems();

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-800 text-white flex flex-col">
      <div className="h-16 flex items-center justify-center px-6 border-b border-gray-700">
        <Logo className="w-36 h-auto text-white" />
      </div>
      <nav className="flex-1 px-4 py-6">
        <ul>
          {visibleNavItems.map((item) => (
            <li key={item.id}>
            <a
                href="#"
                onClick={(e) => {
                e.preventDefault();
                setCurrentView(item.id as View);
                }}
                className={`flex items-center px-4 py-3 my-1 rounded-md text-sm font-medium transition-colors duration-200 ${
                currentView === item.id
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
            </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400">&copy; 2024 INFINITUM Dev. Todos los derechos reservados.</p>
      </div>
    </aside>
  );
};

export default Sidebar;