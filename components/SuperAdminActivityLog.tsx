import React, { useState, useMemo } from 'react';
import { AuditLogEntry, User, UserRole, Entity } from '../types';
import PlusIcon from './icons/PlusIcon';
import PencilIcon from './icons/PencilIcon';
import TrashIcon from './icons/TrashIcon';
import DownloadIcon from './icons/DownloadIcon';
import UploadIcon from './icons/UploadIcon';
import ClipboardCheckIcon from './icons/ClipboardCheckIcon';
import Pagination from './Pagination';

interface SuperAdminActivityLogProps {
  logs: AuditLogEntry[];
  users: User[];
  entities: Entity[];
}

const getActionIcon = (action: string): { icon: JSX.Element; bgColor: string } => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('creó') || actionLower.includes('añadió')) {
        return { icon: <PlusIcon className="w-5 h-5 text-green-600" />, bgColor: 'bg-green-100' };
    }
    if (actionLower.includes('actualizó') || actionLower.includes('modificó') || actionLower.includes('renombró') || actionLower.includes('cambió')) {
        return { icon: <PencilIcon className="w-5 h-5 text-blue-600" />, bgColor: 'bg-blue-100' };
    }
    if (actionLower.includes('eliminó') || actionLower.includes('canceló')) {
        return { icon: <TrashIcon className="w-5 h-5 text-red-600" />, bgColor: 'bg-red-100' };
    }
    if (actionLower.includes('exportó')) {
        return { icon: <DownloadIcon className="w-5 h-5 text-indigo-600" />, bgColor: 'bg-indigo-100' };
    }
    if (actionLower.includes('importó') || actionLower.includes('reemplazó')) {
        return { icon: <UploadIcon className="w-5 h-5 text-purple-600" />, bgColor: 'bg-purple-100' };
    }
    return { icon: <ClipboardCheckIcon className="w-5 h-5 text-gray-600" />, bgColor: 'bg-gray-200' };
};

const SuperAdminActivityLog: React.FC<SuperAdminActivityLogProps> = ({ logs, users, entities }) => {
  const [filters, setFilters] = useState({
    userId: '',
    entityId: '',
    startDate: '',
    endDate: '',
    year: '',
    month: '',
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const adminUsers = useMemo(() => {
    return users.filter(u => u.role === UserRole.Admin);
  }, [users]);

  const availableYears = useMemo(() => {
    const years = new Set(logs.map(log => new Date(log.timestamp).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [logs]);
  
  const months = [
    { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' }, { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' }, { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
  ];

  const filteredLogs = useMemo(() => {
    const adminUserIds = new Set(adminUsers.map(u => u.id));
    return logs
      .filter(log => adminUserIds.has(log.userId))
      .filter(log => {
        const userMatch = !filters.userId || log.userId === filters.userId;
        const entityMatch = !filters.entityId || log.entityId === filters.entityId;
        const logDate = new Date(log.timestamp);
        let dateMatch = true;

        if (filters.year) {
          const year = Number(filters.year);
          const month = Number(filters.month);
          
          dateMatch = logDate.getFullYear() === year;
          if (dateMatch && month) {
            dateMatch = logDate.getMonth() + 1 === month;
          }
        } else if (filters.startDate || filters.endDate) {
          if (filters.startDate) {
            const start = new Date(filters.startDate);
            start.setHours(0, 0, 0, 0);
            if (logDate < start) dateMatch = false;
          }
          if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999);
            if (logDate > end) dateMatch = false;
          }
        }
        
        return userMatch && entityMatch && dateMatch;
      });
  }, [logs, filters, adminUsers]);

  const paginatedLogs = useMemo(() => {
      const startIndex = page * rowsPerPage;
      return filteredLogs.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredLogs, page, rowsPerPage]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => {
        const newFilters = { ...prev, [name]: value };
        if (name === 'year' || name === 'month') {
            newFilters.startDate = '';
            newFilters.endDate = '';
        } else if ((name === 'startDate' || name === 'endDate') && value) {
            newFilters.year = '';
            newFilters.month = '';
        }

        if (name === 'year' && !value) {
            newFilters.month = '';
        }
        return newFilters;
    });
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      entityId: '',
      startDate: '',
      endDate: '',
      year: '',
      month: '',
    });
    setPage(0);
  };

  const getUser = (userId: string) => users.find(u => u.id === userId);
  const getEntity = (entityId: string) => entities.find(e => e.id === entityId);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Registro de Actividad de Administradores</h1>

       <div className="bg-white p-6 rounded-lg shadow-md mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Entidad</label>
            <select name="entityId" value={filters.entityId} onChange={handleFilterChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500">
              <option value="">Todas</option>
              {entities.map(entity => (<option key={entity.id} value={entity.id}>{entity.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Administrador</label>
            <select name="userId" value={filters.userId} onChange={handleFilterChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500">
              <option value="">Todos</option>
              {adminUsers.map(user => (<option key={user.id} value={user.id}>{user.name}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Año</label>
              <select name="year" value={filters.year} onChange={handleFilterChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm">
                  <option value="">Cualquiera</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mes</label>
              <select name="month" value={filters.month} onChange={handleFilterChange} disabled={!filters.year} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 text-sm">
                  <option value="">Cualquiera</option>
                  {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Desde</label>
              <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hasta</label>
              <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm" />
            </div>
          </div>
        </div>
        <div>
            <button onClick={clearFilters} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm">
                Limpiar Filtros
            </button>
        </div>
      </div>

      <div className="flow-root">
        <ul className="-mb-8">
            {paginatedLogs.map((log, logIdx) => {
                const user = getUser(log.userId);
                const entity = getEntity(log.entityId);
                const iconInfo = getActionIcon(log.action);
                return (
                    <li key={log.id}>
                        <div className="relative pb-8">
                            {logIdx !== paginatedLogs.length - 1 ? (
                                <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex items-start space-x-3">
                                <div className="z-10">
                                    <span className={`h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-gray-100 ${iconInfo.bgColor}`}>
                                        {iconInfo.icon}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1 bg-white p-4 rounded-lg shadow-sm border">
                                    <div className="flex items-center gap-3">
                                        <img src={user?.avatarUrl} alt={user?.name} className="w-8 h-8 rounded-full object-cover" />
                                        <div>
                                            <p className="font-semibold text-gray-800">{user?.name || 'Usuario Desconocido'}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(log.timestamp).toLocaleString()} en <span className="font-medium text-gray-700">{entity?.name || 'N/A'}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-gray-700">{log.action}</p>
                                </div>
                            </div>
                        </div>
                    </li>
                )
            })}
            {filteredLogs.length === 0 && (
            <li>
                <div className="text-center py-10 bg-white rounded-lg shadow-md">
                    <p className="text-gray-500">No se encontraron registros de actividad con los filtros seleccionados.</p>
                </div>
            </li>
            )}
        </ul>
      </div>
      {filteredLogs.length > 0 && (
          <div className="mt-6">
            <Pagination
                count={filteredLogs.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={setPage}
                onRowsPerPageChange={(value) => {
                    setRowsPerPage(value);
                    setPage(0);
                }}
            />
          </div>
      )}
    </div>
  );
};

export default SuperAdminActivityLog;