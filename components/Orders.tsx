import React, { useMemo, useState } from 'react';
import { Order, OrderStatus, Currency, User, UserRole } from '../types';
import CurrencySwitcher from './CurrencySwitcher';
import PlusIcon from './icons/PlusIcon';
import Pagination from './Pagination';

interface OrdersProps {
    orders: Order[];
    users: User[];
    onSelectOrder: (id: string) => void;
    onShowCreateOrder: () => void;
    onCancelOrder: (id: string) => void;
    currentUser: User | null;
    currentCurrency: Currency;
    exchangeRate: number;
    onCurrencyChange: (currency: Currency) => void;
    onRateChange: (rate: number) => void;
    isEffectivelyAdmin: boolean;
}

const Orders: React.FC<OrdersProps> = ({ orders, users, onSelectOrder, onShowCreateOrder, onCancelOrder, currentUser, currentCurrency, exchangeRate, onCurrencyChange, onRateChange, isEffectivelyAdmin }) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const clearFilters = () => {
    setSelectedUserId('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const filteredOrders = useMemo(() => {
    let userFilteredOrders = orders;
    if (!isEffectivelyAdmin && currentUser?.role === UserRole.User) {
      userFilteredOrders = orders.filter(order => order.userId === currentUser.id);
    }
    
    return userFilteredOrders.filter(order => {
        const customerMatch = !selectedUserId || order.userId === selectedUserId;
        if (!customerMatch) return false;
        
        const statusMatch = !statusFilter || order.status === statusFilter;
        if (!statusMatch) return false;

        const orderDate = new Date(order.orderDate);
        if (startDate) {
            const start = new Date(startDate); // Interpreted as UTC midnight
            if (orderDate < start) return false;
        }
        if (endDate) {
            const end = new Date(endDate); // Interpreted as UTC midnight
            end.setUTCDate(end.getUTCDate() + 1); // Becomes midnight of the next day to include the full end date
            if (orderDate >= end) return false;
        }

        return true;
    }).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
  }, [orders, currentUser, isEffectivelyAdmin, selectedUserId, statusFilter, startDate, endDate]);
  
  const paginatedOrders = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredOrders.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredOrders, page, rowsPerPage]);

  const getUserNameById = (userId: string): string => {
    return users.find(u => u.id === userId)?.name || 'Usuario Desconocido';
  }

  const getStatusClass = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.Pending:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.Processing:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.Shipped:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.Delivered:
        return 'bg-green-100 text-green-800';
      case OrderStatus.Cancelled:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (totalInUSD: number) => {
    const displayValue = currentCurrency === 'USD' ? totalInUSD : totalInUSD * exchangeRate;
    const formatter = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currentCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    if (currentCurrency === 'USD') {
        return `$${displayValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return formatter.format(displayValue);
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Pedidos</h1>
            <button 
                onClick={onShowCreateOrder}
                className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 flex items-center"
            >
                <PlusIcon className="w-5 h-5 mr-2" />
                Crear Pedido
            </button>
        </div>
      
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Filtros y Opciones</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 items-end">
            <div className="sm:col-span-2">
                <CurrencySwitcher
                    currentUser={currentUser}
                    currentCurrency={currentCurrency}
                    exchangeRate={exchangeRate}
                    onCurrencyChange={onCurrencyChange}
                    onRateChange={onRateChange}
                />
            </div>
            {isEffectivelyAdmin && (
                <div>
                    <label htmlFor="customerFilter" className="block text-sm font-medium text-gray-700">Filtrar por Cliente</label>
                    <select
                        id="customerFilter"
                        value={selectedUserId}
                        onChange={(e) => { setSelectedUserId(e.target.value); setPage(0); }}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                    >
                        <option value="">Todos los Clientes</option>
                        {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                </div>
            )}
             <div>
                <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">Filtrar por Estado</label>
                <select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | ''); setPage(0); }}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                >
                    <option value="">Todos los Estados</option>
                    {Object.values(OrderStatus).map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
                    max={endDate || undefined}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
            </div>
            <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
                    min={startDate || undefined}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                />
            </div>
            <button
                onClick={clearFilters}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 w-full"
            >
                Limpiar Filtros
            </button>
          </div>
      </div>
      
       <div className="bg-white shadow-md rounded-t-lg overflow-hidden">
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                      <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID Pedido</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedOrders.map((order) => (
                          <tr key={order.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{getUserNameById(order.userId)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.orderDate).toLocaleDateString()}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                                      {order.status}
                                  </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(order.total)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button onClick={() => onSelectOrder(order.id)} className="text-teal-600 hover:text-teal-900">Ver Detalles</button>
                                  {currentUser && (isEffectivelyAdmin || currentUser.role === UserRole.Almacenero || currentUser.id === order.userId) && ![OrderStatus.Cancelled, OrderStatus.Delivered].includes(order.status) && (
                                    <button 
                                        onClick={() => onCancelOrder(order.id)}
                                        className="ml-4 text-red-600 hover:text-red-900"
                                    >
                                        Cancelar
                                    </button>
                                  )}
                              </td>
                          </tr>
                      ))}
                      {filteredOrders.length === 0 && (
                        <tr>
                            <td colSpan={6} className="text-center py-10 text-gray-500">
                                No se encontraron pedidos con los filtros seleccionados.
                            </td>
                        </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
      <Pagination
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
              setRowsPerPage(value);
              setPage(0);
          }}
      />
    </div>
  );
};

export default Orders;