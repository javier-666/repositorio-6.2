import React, { useState, useMemo } from 'react';
import { Product, WarehouseStructure, Order, OrderStatus } from '../types';
import FireIcon from './icons/FireIcon';

interface WarehouseHeatmapProps {
    products: Product[];
    warehouseStructure: WarehouseStructure;
    orders: Order[];
}

type HeatmapMode = 'rotation' | 'value';

const WarehouseHeatmap: React.FC<WarehouseHeatmapProps> = ({ products, warehouseStructure, orders }) => {
    const [mode, setMode] = useState<HeatmapMode>('rotation');

    const locationData = useMemo(() => {
        const data: { [key: string]: { value: number; rotation: number } } = {};

        // Calculate total value for each location
        products.forEach(product => {
            const key = `${product.location.warehouseType}-${product.location.section}-${product.location.row}`;
            if (!data[key]) {
                data[key] = { value: 0, rotation: 0 };
            }
            data[key].value += product.price * product.quantity;
        });

        // Calculate rotation for each location (sales in last 90 days)
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        orders.filter(o => o.status === OrderStatus.Delivered && new Date(o.orderDate) > ninetyDaysAgo)
              .forEach(order => {
                order.items.forEach(item => {
                    const product = products.find(p => p.id === item.productId);
                    if (product) {
                        const key = `${product.location.warehouseType}-${product.location.section}-${product.location.row}`;
                        if (!data[key]) {
                            data[key] = { value: 0, rotation: 0 };
                        }
                        data[key].rotation += item.quantity;
                    }
                });
              });
        
        return data;

    }, [products, orders]);

    const { min, max } = useMemo(() => {
        const values = Object.values(locationData).map(d => d[mode]);
        if (values.length === 0) return { min: 0, max: 1 };
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        return { min: minVal, max: maxVal > 0 ? maxVal : 1 };
    }, [locationData, mode]);
    
    // Green (low) -> Yellow (mid) -> Red (high)
    const getColorForValue = (value: number) => {
        if (value === 0) return 'bg-gray-200';
        const normalized = (value - min) / (max - min);
        const hue = (1 - normalized) * 120; // 120 (green) -> 0 (red)
        return `hsl(${hue}, 80%, 60%)`;
    };

    const renderLegend = () => (
        <div className="flex items-center gap-4 p-2 bg-gray-100 rounded-md">
            <span className="text-sm font-medium text-gray-600">Bajo</span>
            <div className="flex-grow h-4 rounded-full" style={{ background: 'linear-gradient(to right, hsl(120, 80%, 60%), hsl(60, 80%, 60%), hsl(0, 80%, 60%))' }}></div>
            <span className="text-sm font-medium text-gray-600">Alto</span>
        </div>
    );
    
    return (
        <div>
             <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <FireIcon className="w-8 h-8 mr-3 text-red-500" />
                    Mapa de Calor del Almacén
                </h1>
                <div className="flex items-center gap-2 p-1 bg-gray-200 rounded-lg">
                    <button onClick={() => setMode('rotation')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'rotation' ? 'bg-white text-gray-800 shadow' : 'text-gray-600'}`}>
                        Rotación de Productos
                    </button>
                    <button onClick={() => setMode('value')} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${mode === 'value' ? 'bg-white text-gray-800 shadow' : 'text-gray-600'}`}>
                        Valor del Inventario
                    </button>
                </div>
            </div>

            <div className="mb-6 max-w-sm">
                {renderLegend()}
            </div>

            <div className="space-y-8">
                {Object.entries(warehouseStructure).map(([type, sections]) => (
                    <div key={type} className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">{type}</h2>
                        <div className="space-y-6">
                            {Object.entries(sections).map(([section, rows]) => (
                                <div key={section}>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">{section}</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                        {rows.map(row => {
                                            const key = `${type}-${section}-${row}`;
                                            const value = locationData[key]?.[mode] || 0;
                                            const color = getColorForValue(value);

                                            return (
                                                <div key={row} title={`${mode === 'rotation' ? `Rotación: ${value} unidades` : `Valor: ${value.toFixed(2)} USD`}`}
                                                     className="p-3 rounded-md text-center text-sm font-medium shadow-sm transition-transform hover:scale-105"
                                                     style={{ backgroundColor: color, color: 'white', textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}>
                                                    {row}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WarehouseHeatmap;
