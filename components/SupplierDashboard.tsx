import React, { useMemo } from 'react';
import { Product, Supplier, Currency } from '../types';
import TruckIcon from './icons/TruckIcon';

interface SupplierDashboardProps {
    products: Product[];
    suppliers: Supplier[];
    currentCurrency: Currency;
    exchangeRate: number;
}

const SupplierDashboard: React.FC<SupplierDashboardProps> = ({ products, suppliers, currentCurrency, exchangeRate }) => {

    const formatCurrency = (value: number) => {
        const displayValue = currentCurrency === 'USD' ? value : value * exchangeRate;
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

    const supplierData = useMemo(() => {
        return suppliers.map(supplier => {
            const supplierProducts = products.filter(p => p.supplierId === supplier.id);
            const totalValue = supplierProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
            const productCount = supplierProducts.length;
            
            supplierProducts.sort((a, b) => b.quantity - a.quantity);
            const highestStock = supplierProducts.slice(0, 3);
            const lowestStock = supplierProducts.slice(-3).reverse();

            return {
                ...supplier,
                totalValue,
                productCount,
                highestStock,
                lowestStock
            };
        }).sort((a, b) => b.totalValue - a.totalValue);
    }, [suppliers, products]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <TruckIcon className="w-8 h-8 mr-3 text-teal-600"/>
                    Rendimiento de Proveedores
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {supplierData.map(supplier => (
                    <div key={supplier.id} className="bg-white p-6 rounded-lg shadow-md flex flex-col">
                        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">{supplier.name}</h2>
                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-medium text-gray-500">Valor Total de Inventario:</span>
                                <span className="text-lg font-bold text-teal-600">{formatCurrency(supplier.totalValue)}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-medium text-gray-500">Productos Distintos:</span>
                                <span className="text-lg font-bold text-gray-800">{supplier.productCount}</span>
                            </div>
                        </div>
                        
                        <div className="flex-grow space-y-4">
                            <div>
                                <h4 className="text-sm font-semibold text-green-700">Top 3 Productos con Más Stock</h4>
                                {supplier.highestStock.length > 0 ? (
                                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                                        {supplier.highestStock.map(p => (
                                            <li key={p.id} className="flex justify-between">
                                                <span>{p.name}</span>
                                                <span className="font-mono bg-green-100 text-green-800 px-1.5 py-0.5 rounded">{p.quantity} u</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-xs text-gray-400 mt-1">No hay productos.</p>}
                            </div>
                             <div>
                                <h4 className="text-sm font-semibold text-red-700">Top 3 Productos con Menos Stock</h4>
                                 {supplier.lowestStock.length > 0 ? (
                                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                                        {supplier.lowestStock.map(p => (
                                            <li key={p.id} className="flex justify-between">
                                                <span>{p.name}</span>
                                                <span className="font-mono bg-red-100 text-red-800 px-1.5 py-0.5 rounded">{p.quantity} u</span>
                                            </li>
                                        ))}
                                    </ul>
                                 ) : <p className="text-xs text-gray-400 mt-1">No hay productos.</p>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SupplierDashboard;
