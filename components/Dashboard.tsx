

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from './StatCard';
import { StatCardData, OrderStatus, Currency, User, Product, Order, UserRole, UnitOfMeasure } from '../types';
import BoxIcon from './icons/BoxIcon';
import ClipboardListIcon from './icons/ClipboardListIcon';
import CurrencySwitcher from './CurrencySwitcher';

interface DashboardProps {
  products: Product[];
  orders: Order[];
  users: User[];
  currentUser: User | null;
  currentCurrency: Currency;
  exchangeRate: number;
  onCurrencyChange: (currency: Currency) => void;
  onRateChange: (rate: number) => void;
}


const Dashboard: React.FC<DashboardProps> = ({ products, orders, users, currentUser, currentCurrency, exchangeRate, onCurrencyChange, onRateChange }) => {

  const userVisibleOrders = useMemo(() => {
    if (currentUser?.role === UserRole.User) {
      return orders.filter(order => order.userId === currentUser.id);
    }
    return orders;
  }, [orders, currentUser]);

  const inventorySummary = useMemo(() => {
    return products.reduce((acc, product) => {
      acc[product.unitOfMeasure] = (acc[product.unitOfMeasure] || 0) + product.quantity;
      return acc;
    }, {} as Record<UnitOfMeasure, number>);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.reorderPoint && p.quantity <= p.reorderPoint)
      .sort((a, b) => (a.quantity / a.reorderPoint!) - (b.quantity / b.reorderPoint!));
  }, [products]);


  const getUserNameById = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Usuario Desconocido';
  };

  const pendingOrders = userVisibleOrders.filter(o => o.status === OrderStatus.Pending).length;
  
  const totalRevenueUSD = userVisibleOrders.filter(o => o.status === OrderStatus.Delivered).reduce((sum, order) => sum + order.total, 0);
  const totalInventoryValueUSD = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);

  const formatCurrency = (value: number) => {
    const displayValue = currentCurrency === 'USD' ? value : value * exchangeRate;
    const formatter = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currentCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    // Intl shows USD as MXN in es-MX, so we manually fix it.
    if (currentCurrency === 'USD') {
        return `$${displayValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return formatter.format(displayValue);
  };

  const stats: StatCardData[] = [
    {
      title: 'Ingresos Totales (Entregados)',
      value: formatCurrency(totalRevenueUSD),
      change: '12.5%',
      changeType: 'increase',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01"></path></svg>,
    },
    {
      title: 'Pedidos Pendientes',
      value: pendingOrders.toString(),
      change: '2.1%',
      changeType: 'decrease',
      icon: <ClipboardListIcon className="w-6 h-6" />,
    },
    {
      title: 'Valor del Inventario',
      value: formatCurrency(totalInventoryValueUSD),
      change: '8.2%',
      changeType: 'increase',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    }
  ];

  const chartData = products.filter(p => p.unitOfMeasure === 'unidades').slice(0, 5).map(p => ({ name: p.name, Stock: p.quantity }));

  // Custom Tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 bg-opacity-90 text-white p-3 rounded-lg shadow-xl border border-gray-700">
          <p className="font-bold text-sm">{label}</p>
          <p className="text-teal-400">{`Stock: ${payload[0].value.toLocaleString('es-MX')}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Pagina principal</h1>

      <CurrencySwitcher
          currentUser={currentUser}
          currentCurrency={currentCurrency}
          exchangeRate={exchangeRate}
          onCurrencyChange={onCurrencyChange}
          onRateChange={onRateChange}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
        {stats.map(stat => <StatCard key={stat.title} data={stat} />)}
      </div>
      
      {lowStockProducts.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-md mb-6">
              <h3 className="text-lg font-bold text-yellow-800">Productos con Bajo Stock (Sugerencias de Compra)</h3>
              <ul className="mt-2 space-y-1 list-disc list-inside text-yellow-700">
                  {lowStockProducts.map(p => (
                      <li key={p.id} className="text-sm">
                          <span className="font-semibold">{p.name}</span> - Stock actual: <span className="font-bold">{p.quantity}</span>, Punto de reorden: {p.reorderPoint}
                      </li>
                  ))}
              </ul>
          </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Resumen de Inventario</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
                <p className="text-2xl font-bold text-gray-800">{(inventorySummary.unidades || 0).toLocaleString('es-MX')}</p>
                <p className="text-sm text-gray-500">Unidades</p>
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-800">{(inventorySummary.litros || 0).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-sm text-gray-500">Litros</p>
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-800">{(inventorySummary.kilogramos || 0).toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                <p className="text-sm text-gray-500">Kilogramos</p>
            </div>
        </div>
    </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Stock de Productos Principales (en Unidades)</h2>
              <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <defs>
                        <linearGradient id="stockGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.9}/>
                            <stop offset="95%" stopColor="#0d9488" stopOpacity={0.8}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(13, 148, 136, 0.1)' }} />
                    <Bar dataKey="Stock" fill="url(#stockGradient)" radius={[6, 6, 0, 0]} />
                  </BarChart>
              </ResponsiveContainer>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Pedidos Recientes</h2>
              <ul className="space-y-4">
              {userVisibleOrders.slice(0, 4).map(order => (
                  <li key={order.id} className="flex items-center justify-between">
                      <div>
                          <p className="font-medium text-gray-800">{getUserNameById(order.userId)}</p>
                          <p className="text-sm text-gray-500">{order.id}</p>
                      </div>
                      <span className="text-gray-700 font-semibold">{formatCurrency(order.total)}</span>
                  </li>
              ))}
              </ul>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;