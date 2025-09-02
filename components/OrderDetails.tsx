

import React, { useState, useMemo } from 'react';
import { Order, Product, User, OrderStatus, UserRole, Currency } from '../types';
import PrintIcon from './icons/PrintIcon';

interface OrderDetailsProps {
    order: Order;
    products: Product[];
    users: User[];
    currentUser: User;
    onUpdateOrder: (order: Order) => void;
    onBack: () => void;
    currentCurrency: Currency;
    exchangeRate: number;
    isEffectivelyAdmin: boolean;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, products, users, currentUser, onUpdateOrder, onBack, currentCurrency, exchangeRate, isEffectivelyAdmin }) => {
    const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
    
    const customerName = useMemo(() => {
        if (order.customerDetails) {
            return `${order.customerDetails.name} ${order.customerDetails.lastName}`;
        }
        return users.find(u => u.id === order.userId)?.name || 'Usuario Desconocido';
    }, [users, order]);

    const getProductDetails = (productId: string) => {
        return products.find(p => p.id === productId);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setCurrentStatus(e.target.value as OrderStatus);
    };
    
    const handleSaveChanges = () => {
        onUpdateOrder({ ...order, status: currentStatus });
    };

    const formatCurrency = (priceInUSD: number) => {
        const displayValue = currentCurrency === 'USD' ? priceInUSD : priceInUSD * exchangeRate;
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

    const canSeeManageSection = isEffectivelyAdmin || currentUser.role === UserRole.Almacenero;
    const isOrderClosed = order.status === OrderStatus.Delivered || order.status === OrderStatus.Cancelled;
    const areControlsDisabled = isOrderClosed && !isEffectivelyAdmin;

    return (
        <div>
             <style>{`
                @media print {
                    body > #root > div > aside, 
                    body > #root > div > div > header,
                    .no-print { 
                        display: none !important; 
                    }
                    main { 
                        padding: 1.5rem !important;
                        margin: 0 !important;
                        background-color: white !important;
                    }
                    .print-container {
                        box-shadow: none !important;
                        padding: 0 !important;
                        border: none !important;
                    }
                }
            `}</style>
             <div className="flex justify-between items-center mb-6 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Detalles del Pedido</h1>
                    <p className="text-gray-500 font-mono">{order.id}</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={() => window.print()}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center transition-colors"
                    >
                        <PrintIcon className="w-5 h-5 mr-2" />
                        Imprimir / Guardar PDF
                    </button>
                    <button onClick={onBack} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
                        &larr; Volver a Pedidos
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {/* Order Summary & Financials Card */}
                <div className="bg-white p-6 rounded-lg shadow-md print-container">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-700 mb-4">Resumen del Pedido</h2>
                            <dl className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <dt className="text-sm font-medium text-gray-500">ID del Pedido</dt>
                                    <dd className="text-sm text-gray-900 font-mono">{order.id}</dd>
                                </div>
                                <div className="flex justify-between items-center">
                                    <dt className="text-sm font-medium text-gray-500">Cliente</dt>
                                    <dd className="text-sm font-semibold text-gray-900">{customerName}</dd>
                                </div>
                                <div className="flex justify-between items-center">
                                    <dt className="text-sm font-medium text-gray-500">Fecha del Pedido</dt>
                                    <dd className="text-sm text-gray-900">{new Date(order.orderDate).toLocaleDateString()}</dd>
                                </div>
                                <div className="flex justify-between items-center">
                                    <dt className="text-sm font-medium text-gray-500">Estado</dt>
                                    <dd>
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-lg flex flex-col justify-center items-center text-center">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total del Pedido</h3>
                            <p className="text-4xl font-bold text-gray-800 mt-2">{formatCurrency(order.total)}</p>
                        </div>
                    </div>
                </div>

                {order.customerDetails && (
                    <div className="bg-white p-6 rounded-lg shadow-md print-container">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Información del Cliente</h2>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Nombre Completo</dt>
                                <dd className="text-sm font-semibold text-gray-900 mt-1">{`${order.customerDetails.name} ${order.customerDetails.lastName}`}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Correo Electrónico</dt>
                                <dd className="text-sm text-gray-900 mt-1">{order.customerDetails.email}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Carnet de Identidad</dt>
                                <dd className="text-sm text-gray-900 mt-1 font-mono">{order.customerDetails.idCard}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-gray-500">Dirección de Entrega</dt>
                                <dd className="text-sm text-gray-900 mt-1">{order.customerDetails.address}</dd>
                            </div>
                        </dl>
                    </div>
                )}


                {/* Order Items Card */}
                <div className="bg-white p-6 rounded-lg shadow-md print-container">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Artículos del Pedido</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unitario</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {order.items.map(item => {
                                    const product = getProductDetails(item.productId);
                                    if (!product) return null;
                                    const subtotal = product.price * item.quantity;
                                    return (
                                        <tr key={item.productId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <img className="h-10 w-10 rounded-md object-cover" src={product.imageUrl} alt={product.name} />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(product.price)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-800">{formatCurrency(subtotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-800 uppercase">Total del Pedido</td>
                                    <td className="px-6 py-3 text-right text-lg font-bold text-gray-900">{formatCurrency(order.total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Manage Order Card */}
                {canSeeManageSection && (
                    <div className="bg-white p-6 rounded-lg shadow-md no-print">
                         <h3 className="text-xl font-semibold text-gray-700 mb-4">Gestionar Pedido</h3>
                         <div className="flex items-center space-x-4">
                             <label htmlFor="status" className="block text-sm font-medium text-gray-700">Cambiar Estado:</label>
                             <select
                                id="status"
                                value={currentStatus}
                                onChange={handleStatusChange}
                                disabled={areControlsDisabled}
                                className="block w-full max-w-xs border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                             >
                                {Object.values(OrderStatus).map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                             </select>
                             <button
                                onClick={handleSaveChanges}
                                disabled={areControlsDisabled || currentStatus === order.status}
                                className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 disabled:bg-teal-300 disabled:cursor-not-allowed"
                             >
                                Guardar Cambios
                             </button>
                         </div>
                         {areControlsDisabled && (
                            <p className="text-sm text-gray-500 mt-2">
                                Este pedido está cerrado y solo puede ser modificado por un Administrador.
                            </p>
                         )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderDetails;