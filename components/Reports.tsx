import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, Product, User, Currency, WarehouseStructure, UnitOfMeasure, Category, SalesReportData, AnnualSalesReportData, FinancialSummaryReportData } from '../types';
import PrintIcon from './icons/PrintIcon';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import DollarSignIcon from './icons/DollarSignIcon';
import ArchiveIcon from './icons/ArchiveIcon';
import ClockIcon from './icons/ClockIcon';
import CalendarIcon from './icons/CalendarIcon';


interface ReportsProps {
    orders: Order[];
    products: Product[];
    users: User[];
    currentCurrency: Currency;
    exchangeRate: number;
    entityName: string;
    warehouseStructure: WarehouseStructure;
    categories: Category[];
}

type ReportView = 'sales' | 'inventory' | 'pendingOrders' | 'annualSales' | 'financialSummary';

interface InventoryReportData {
    type: 'inventory';
    totalProductTypes: number;
    summary: {
      unidades: number;
      litros: number;
      kilogramos: number;
    };
    totalValue: number;
    items: {
        name: string;
        sku?: string;
        category: string;
        quantity: number;
        unitOfMeasure: UnitOfMeasure;
        price: number;
        location: string;
    }[];
}

interface PendingOrdersReportData {
    type: 'pendingOrders';
    totalPendingOrders: number;
    totalPendingValue: number;
    items: {
        orderId: string;
        customerName: string;
        orderDate: string;
        status: OrderStatus;
        total: number;
    }[];
}

type GeneratedReport = SalesReportData | InventoryReportData | PendingOrdersReportData | AnnualSalesReportData | FinancialSummaryReportData;

const unitAbbreviations: Record<UnitOfMeasure, string> = {
    unidades: 'u',
    litros: 'L',
    kilogramos: 'kg'
};

const Reports: React.FC<ReportsProps> = ({ orders, products, users, currentCurrency, exchangeRate, entityName, warehouseStructure, categories }) => {
    const [selectedReportType, setSelectedReportType] = useState<ReportView | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null);
    const [inventoryFilters, setInventoryFilters] = useState({
        warehouseType: '',
        section: '',
        row: '',
        categoryId: '',
    });

    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);

    const warehouseTypes = Object.keys(warehouseStructure);
    const sections = inventoryFilters.warehouseType ? Object.keys(warehouseStructure[inventoryFilters.warehouseType] || {}) : [];
    const rows = (inventoryFilters.warehouseType && inventoryFilters.section) ? (warehouseStructure[inventoryFilters.warehouseType]?.[inventoryFilters.section] || []) : [];

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

    const getUserName = (userId: string) => users.find(u => u.id === userId)?.name || 'N/A';
    const getProduct = (productId: string) => products.find(p => p.id === productId);

    const handleGenerateReport = () => {
       switch(selectedReportType) {
            case 'sales':
                generateSalesReport();
                break;
            case 'inventory':
                generateInventoryReport();
                break;
            case 'pendingOrders':
                generatePendingOrdersReport();
                break;
            case 'annualSales':
                generateAnnualSalesReport();
                break;
            case 'financialSummary':
                generateFinancialSummaryReport();
                break;
       }
    };

    const generateFinancialSummaryReport = () => {
        const start = startDate ? new Date(startDate) : null;
        if(start) start.setUTCHours(0, 0, 0, 0);
        const end = endDate ? new Date(endDate) : null;
        if(end) end.setUTCHours(23, 59, 59, 999);
    
        const period = start && end ? `del ${start.toLocaleDateString()} al ${end.toLocaleDateString()}` : 'desde el inicio';
    
        const deliveredOrders = orders.filter(o => {
            if (o.status !== OrderStatus.Delivered) return false;
            if (!start && !end) return true; // No date filter
            const orderDate = new Date(o.orderDate);
            if (start && orderDate < start) return false;
            if (end && orderDate > end) return false;
            return true;
        });
    
        const totalSalesRevenue = deliveredOrders.reduce((sum, order) => sum + order.total, 0);
    
        const totalCostOfGoodsSold = deliveredOrders.reduce((totalCost, order) => {
            const orderCost = order.items.reduce((cost, item) => {
                const product = getProduct(item.productId);
                return cost + ((product?.price || 0) * item.quantity);
            }, 0);
            return totalCost + orderCost;
        }, 0);
        
        const totalGrossProfit = totalSalesRevenue - totalCostOfGoodsSold;
        
        const totalInventoryValue = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
        
        setGeneratedReport({
            type: 'financialSummary',
            period,
            totalSalesRevenue,
            totalInventoryValue,
            totalGrossProfit,
        });
    };
    
    const generateAnnualSalesReport = () => {
        const deliveredOrders = orders.filter(o => 
            o.status === OrderStatus.Delivered && 
            new Date(o.orderDate).getFullYear() === selectedYear
        );

        const monthlyData = Array.from({ length: 12 }, (_, i) => ({
            month: new Date(0, i).toLocaleString('es-ES', { month: 'long' }),
            revenue: 0,
            profit: 0,
            orders: 0,
        }));

        let totalRevenue = 0;
        let totalProfit = 0;
        let totalOrders = deliveredOrders.length;

        deliveredOrders.forEach(order => {
            const monthIndex = new Date(order.orderDate).getMonth();
            const orderCost = order.items.reduce((cost, item) => {
                const product = getProduct(item.productId);
                return cost + ((product?.price || 0) * item.quantity);
            }, 0);
            const orderProfit = order.total - orderCost;
            
            monthlyData[monthIndex].revenue += order.total;
            monthlyData[monthIndex].profit += orderProfit;
            monthlyData[monthIndex].orders += 1;
            totalRevenue += order.total;
            totalProfit += orderProfit;
        });
        
        const capitalizedMonthlyData = monthlyData.map(m => ({
            ...m,
            month: m.month.charAt(0).toUpperCase() + m.month.slice(1)
        }));

        setGeneratedReport({
            type: 'annualSales',
            year: selectedYear,
            totalRevenue,
            totalProfit,
            totalOrders,
            monthlyData: capitalizedMonthlyData
        });
    };


    const generateSalesReport = () => {
         const deliveredOrders = orders.filter(o => o.status === OrderStatus.Delivered);

        let filteredOrders: Order[] = [];
        let period = '';
        let dateFilterType: 'dateRange' | 'month' = 'dateRange';
        
        if(selectedMonth) dateFilterType = 'month';

        if (dateFilterType === 'dateRange' && startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            
            filteredOrders = deliveredOrders.filter(o => {
                const orderDate = new Date(o.orderDate);
                return orderDate >= start && orderDate <= end;
            });
            period = `del ${start.toLocaleDateString()} al ${end.toLocaleDateString()}`;

        } else if (dateFilterType === 'month' && selectedMonth) {
            const [year, month] = selectedMonth.split('-').map(Number);
            filteredOrders = deliveredOrders.filter(o => {
                const orderDate = new Date(o.orderDate);
                return orderDate.getFullYear() === year && orderDate.getMonth() + 1 === month;
            });
            const monthName = new Date(year, month - 1, 1).toLocaleString('es-ES', { month: 'long' });
            period = `para ${monthName} de ${year}`;
        } else {
            alert('Por favor, seleccione un rango de fechas o un mes válido.');
            return;
        }

        let totalRevenue = 0;
        let totalProfit = 0;
        let totalItemsSold = 0;
        const reportItems: SalesReportData['items'] = [];

        filteredOrders.forEach(order => {
            totalRevenue += order.total;
            const orderCost = order.items.reduce((cost, item) => {
                const product = getProduct(item.productId);
                return cost + ((product?.price || 0) * item.quantity);
            }, 0);
            totalProfit += (order.total - orderCost);

            order.items.forEach(item => {
                const product = getProduct(item.productId);
                if (product) {
                    totalItemsSold += item.quantity;
                    reportItems.push({
                        orderId: order.id,
                        orderDate: new Date(order.orderDate).toLocaleDateString(),
                        customerName: getUserName(order.userId),
                        productName: product.name,
                        quantity: item.quantity,
                        unitPrice: product.price,
                        subtotal: product.price * item.quantity
                    });
                }
            });
        });

        setGeneratedReport({
            type: 'sales',
            period,
            totalRevenue,
            totalProfit,
            totalOrders: filteredOrders.length,
            totalItemsSold,
            items: reportItems,
        });
    };
    
    const generateInventoryReport = () => {
        const filteredProducts = products.filter(product => {
            const warehouseMatch = !inventoryFilters.warehouseType || product.location.warehouseType === inventoryFilters.warehouseType;
            const sectionMatch = !inventoryFilters.section || product.location.section === inventoryFilters.section;
            const rowMatch = !inventoryFilters.row || product.location.row === inventoryFilters.row;
            const categoryMatch = !inventoryFilters.categoryId || product.categoryId === inventoryFilters.categoryId;
            return warehouseMatch && sectionMatch && rowMatch && categoryMatch;
        });

        const summary = filteredProducts.reduce((acc, p) => {
            acc[p.unitOfMeasure] = (acc[p.unitOfMeasure] || 0) + p.quantity;
            return acc;
        }, { unidades: 0, litros: 0, kilogramos: 0 } as Record<UnitOfMeasure, number>);
        

        const totalProductTypes = filteredProducts.length;
        const totalValue = filteredProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);

        const reportItems = filteredProducts.map(p => ({
            name: p.name,
            sku: p.sku,
            category: categoryMap.get(p.categoryId) || 'N/A',
            quantity: p.quantity,
            unitOfMeasure: p.unitOfMeasure,
            price: p.price,
            location: `${p.location.warehouseType} / ${p.location.section} / ${p.location.row}`
        }));

        setGeneratedReport({
            type: 'inventory',
            totalProductTypes,
            summary,
            totalValue,
            items: reportItems
        });
    };

    const generatePendingOrdersReport = () => {
        const pending = orders.filter(o => o.status === OrderStatus.Pending || o.status === OrderStatus.Processing);
        const totalPendingOrders = pending.length;
        const totalPendingValue = pending.reduce((sum, o) => sum + o.total, 0);
        
        const reportItems = pending.map(o => ({
            orderId: o.id,
            customerName: getUserName(o.userId),
            orderDate: new Date(o.orderDate).toLocaleDateString(),
            status: o.status,
            total: o.total,
        }));

        setGeneratedReport({
            type: 'pendingOrders',
            totalPendingOrders,
            totalPendingValue,
            items: reportItems
        });
    };

    const handlePrint = () => {
        window.print();
    };
    
    const getReportTitle = (report: GeneratedReport) => {
        switch (report.type) {
            case 'sales': return 'Informe de Entrega por Período';
            case 'inventory': return 'Informe de Inventario';
            case 'pendingOrders': return 'Informe de Pedidos Pendientes';
            case 'annualSales': return `Informe de Entregas Anuales - ${report.year}`;
            case 'financialSummary': return 'Resumen Financiero';
            default: return 'Informe';
        }
    }
    
    const handleInventoryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setInventoryFilters(prev => {
            const newFilters = { ...prev, [name]: value };
            if (name === 'warehouseType') {
                newFilters.section = '';
                newFilters.row = '';
            }
            if (name === 'section') {
                newFilters.row = '';
            }
            return newFilters;
        });
    };

    const clearInventoryFilters = () => {
        setInventoryFilters({
            warehouseType: '',
            section: '',
            row: '',
            categoryId: '',
        });
    };

    const reportTypes: { type: ReportView; title: string; description: string; icon: React.FC<any>; color: string }[] = [
        { type: 'financialSummary', title: 'Resumen Financiero', description: 'Visión general de ingresos, inversión y ganancias.', icon: DollarSignIcon, color: 'text-green-500' },
        { type: 'sales', title: 'Entregas por Período', description: 'Analiza ventas y ganancias en un rango de fechas.', icon: DollarSignIcon, color: 'text-teal-500' },
        { type: 'annualSales', title: 'Entregas Anuales', description: 'Compara ingresos y ganancias mes a mes durante un año.', icon: CalendarIcon, color: 'text-blue-500' },
        { type: 'inventory', title: 'Inventario', description: 'Informe detallado del estado y valor del stock actual.', icon: ArchiveIcon, color: 'text-indigo-500' },
        { type: 'pendingOrders', title: 'Pedidos Pendientes', description: 'Revisa los pedidos que aún no han sido entregados.', icon: ClockIcon, color: 'text-yellow-500' },
    ];
    
    const currentReportMeta = reportTypes.find(r => r.type === selectedReportType);

    const handleSelectReport = (type: ReportView) => {
        setSelectedReportType(type);
        setGeneratedReport(null);
        setStartDate('');
        setEndDate('');
        setSelectedMonth('');
        setSelectedYear(new Date().getFullYear());
        clearInventoryFilters();
    };

    const handleBackToSelection = () => {
        setSelectedReportType(null);
        setGeneratedReport(null);
    };

    const renderFilters = () => {
        if (!selectedReportType) return null;

        return (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6 animate-fade-in">
                 <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                         {currentReportMeta && <currentReportMeta.icon className={`w-8 h-8 ${currentReportMeta.color}`} />}
                         <h2 className="text-2xl font-bold text-gray-800">{currentReportMeta?.title}</h2>
                    </div>
                     <button onClick={handleBackToSelection} className="text-sm text-gray-600 hover:text-gray-900">&larr; Volver a la selección</button>
                 </div>
                <div className="border-t pt-4">
                    {(selectedReportType === 'sales' || selectedReportType === 'financialSummary') && (
                        <div className="space-y-4">
                            <h4 className="text-base font-medium text-gray-800">Filtrar por Período de Ventas</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                                    <input type="date" id="startDate" value={startDate} onChange={e => {setStartDate(e.target.value); setSelectedMonth('')}} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                                    <input type="date" id="endDate" value={endDate} onChange={e => {setEndDate(e.target.value); setSelectedMonth('')}} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
                                </div>
                            </div>
                            {selectedReportType === 'sales' && (
                                <>
                                    <div className="flex items-center my-2">
                                        <div className="flex-grow border-t border-gray-300"></div>
                                        <span className="px-2 text-sm text-gray-500">o</span>
                                        <div className="flex-grow border-t border-gray-300"></div>
                                    </div>
                                    <div>
                                        <label htmlFor="month" className="block text-sm font-medium text-gray-700">Seleccionar Mes</label>
                                        <input type="month" id="month" value={selectedMonth} onChange={e => {setSelectedMonth(e.target.value); setStartDate(''); setEndDate('');}} className="mt-1 block w-full md:w-1/2 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"/>
                                    </div>
                                </>
                            )}
                             <p className="text-xs text-gray-500 mt-2">
                                {selectedReportType === 'financialSummary' ? 'El rango de fechas se aplica a los Ingresos y Ganancias. El Valor del Inventario es siempre el valor actual.' : 'Seleccione un rango de fechas o un mes específico para el informe de entregas.'}
                            </p>
                        </div>
                    )}

                    {selectedReportType === 'annualSales' && (
                         <div>
                             <label htmlFor="year" className="block text-sm font-medium text-gray-700">Seleccionar Año</label>
                             <input 
                                type="number" 
                                id="year" 
                                value={selectedYear} 
                                onChange={e => setSelectedYear(Number(e.target.value))} 
                                className="mt-1 block w-full max-w-xs border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                                placeholder="Ej: 2024"
                            />
                         </div>
                    )}
                    
                    {selectedReportType === 'inventory' && (
                        <div className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Categoría</label>
                                    <select name="categoryId" value={inventoryFilters.categoryId} onChange={handleInventoryFilterChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                                        <option value="">Todas</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tipo Almacén</label>
                                    <select name="warehouseType" value={inventoryFilters.warehouseType} onChange={handleInventoryFilterChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                                        <option value="">Todos</option>
                                        {warehouseTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Sección</label>
                                    <select name="section" value={inventoryFilters.section} onChange={handleInventoryFilterChange} disabled={!inventoryFilters.warehouseType} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100">
                                        <option value="">Todas</option>
                                        {sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                                    </select>
                                </div>
                                 <div>
                                    <label className="block text-sm font-medium text-gray-700">Fila</label>
                                    <select name="row" value={inventoryFilters.row} onChange={handleInventoryFilterChange} disabled={!inventoryFilters.section} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100">
                                        <option value="">Todas</option>
                                        {rows.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <button onClick={clearInventoryFilters} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                                    Limpiar
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <div className="mt-6">
                        <button onClick={handleGenerateReport} className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 text-lg font-semibold">
                           Generar Informe
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    
    const renderReport = () => {
        if (!generatedReport) return null;
        
        return (
            <div className="print-container bg-white p-8 rounded-lg shadow-2xl animate-fade-in">
                 <div className="flex justify-between items-start mb-8">
                     <div>
                        <h2 className="text-3xl font-bold text-gray-900">{entityName}</h2>
                        <p className="text-gray-600">{getReportTitle(generatedReport)}</p>
                        {(generatedReport.type === 'sales' || generatedReport.type === 'financialSummary') && <p className="text-gray-500 text-sm mt-1">Período: {generatedReport.period}</p>}
                     </div>
                     <div className="text-right">
                         <button onClick={handlePrint} className="no-print bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center transition-colors mb-2">
                            <PrintIcon className="w-5 h-5 mr-2" />
                            Imprimir / Guardar
                         </button>
                         <button onClick={handleBackToSelection} className="no-print text-sm text-gray-600 hover:text-gray-900 mt-2">
                            &larr; Generar otro informe
                         </button>
                        <p className="text-sm text-gray-500 mt-2">Generado el: {new Date().toLocaleString()}</p>
                     </div>
                 </div>
                 
                {/* --- SUMMARIES --- */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 pb-6 border-b">
                    {generatedReport.type === 'financialSummary' && <>
                        <div className="bg-green-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-green-700">Ingresos por Ventas</h3><p className="mt-1 text-3xl font-semibold text-green-800">{formatCurrency(generatedReport.totalSalesRevenue)}</p></div>
                        <div className="bg-blue-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-blue-700">Valor Inventario</h3><p className="mt-1 text-3xl font-semibold text-blue-800">{formatCurrency(generatedReport.totalInventoryValue)}</p></div>
                        <div className="bg-emerald-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-emerald-700">Ganancia Bruta</h3><p className="mt-1 text-3xl font-semibold text-emerald-800">{formatCurrency(generatedReport.totalGrossProfit)}</p></div>
                    </>}
                    {generatedReport.type === 'sales' && <>
                        <div className="bg-teal-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-teal-700">Ingresos Totales</h3><p className="mt-1 text-2xl font-semibold text-teal-800">{formatCurrency(generatedReport.totalRevenue)}</p></div>
                        <div className="bg-green-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-green-700">Ganancia Total</h3><p className="mt-1 text-2xl font-semibold text-green-800">{formatCurrency(generatedReport.totalProfit)}</p></div>
                        <div className="bg-sky-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-sky-700">Pedidos Completados</h3><p className="mt-1 text-2xl font-semibold text-sky-800">{generatedReport.totalOrders}</p></div>
                        <div className="bg-indigo-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-indigo-700">Artículos Vendidos</h3><p className="mt-1 text-2xl font-semibold text-indigo-800">{generatedReport.totalItemsSold}</p></div>
                    </>}
                    {generatedReport.type === 'inventory' && <>
                        <div className="bg-indigo-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-indigo-700">Tipos de Producto</h3><p className="mt-1 text-2xl font-semibold text-indigo-800">{generatedReport.totalProductTypes}</p></div>
                        <div className="col-span-3 bg-blue-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-blue-700">Valor del Inventario</h3><p className="mt-1 text-2xl font-semibold text-blue-800">{formatCurrency(generatedReport.totalValue)}</p></div>
                    </>}
                    {generatedReport.type === 'pendingOrders' && <>
                        <div className="bg-yellow-50 p-4 rounded-lg md:col-span-2"><h3 className="text-sm font-medium text-yellow-700">Total Pedidos Pendientes</h3><p className="mt-1 text-2xl font-semibold text-yellow-800">{generatedReport.totalPendingOrders}</p></div>
                        <div className="bg-orange-50 p-4 rounded-lg md:col-span-2"><h3 className="text-sm font-medium text-orange-700">Valor Total Pendiente</h3><p className="mt-1 text-2xl font-semibold text-orange-800">{formatCurrency(generatedReport.totalPendingValue)}</p></div>
                    </>}
                    {generatedReport.type === 'annualSales' && <>
                        <div className="bg-blue-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-blue-700">Ingresos Totales</h3><p className="mt-1 text-2xl font-semibold text-blue-800">{formatCurrency(generatedReport.totalRevenue)}</p></div>
                        <div className="bg-green-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-green-700">Ganancia Total</h3><p className="mt-1 text-2xl font-semibold text-green-800">{formatCurrency(generatedReport.totalProfit)}</p></div>
                        <div className="bg-sky-50 p-4 rounded-lg col-span-2"><h3 className="text-sm font-medium text-sky-700">Total de Pedidos</h3><p className="mt-1 text-2xl font-semibold text-sky-800">{generatedReport.totalOrders.toLocaleString()}</p></div>
                    </>}
                </div>

                {/* --- VISUALS AND TABLES --- */}
                 {(generatedReport.type === 'financialSummary' || generatedReport.type === 'annualSales') && (
                    <div className="mb-8">
                        <h3 className="text-xl font-semibold text-gray-700 mb-4">{generatedReport.type === 'financialSummary' ? 'Comparativa Financiera' : 'Desglose Mensual'}</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            {generatedReport.type === 'financialSummary' ? (
                                <BarChart data={[{ name: 'Ingresos', valor: generatedReport.totalSalesRevenue }, { name: 'Inversión Inventario', valor: generatedReport.totalInventoryValue }, { name: 'Ganancia', valor: generatedReport.totalGrossProfit }]} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(value) => formatCurrency(value as number).replace(/(\.00|,00)/, '')} />
                                    <Tooltip formatter={(value) => formatCurrency(value as number)} cursor={{ fill: 'rgba(13, 148, 136, 0.1)' }} />
                                    <Bar dataKey="valor" name="Valor">
                                        <Cell key={`cell-0`} fill={'#0d9488'} />
                                        <Cell key={`cell-1`} fill={'#0891b2'} />
                                        <Cell key={`cell-2`} fill={'#10b981'} />
                                    </Bar>
                                </BarChart>
                            ) : (
                                <BarChart data={generatedReport.monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tickFormatter={(value) => formatCurrency(value as number).replace(/(\.00|,00)/, '')} />
                                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                    <Legend />
                                    <Bar dataKey="revenue" fill="#0d9488" name="Ingresos" />
                                    <Bar dataKey="profit" fill="#10b981" name="Ganancia" />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                )}
                
                <h3 className="text-xl font-semibold text-gray-700 mb-4 mt-8">Detalles</h3>
                <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        {generatedReport.type === 'sales' && (
                            <>
                                <thead className="bg-gray-50"><tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cant.</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">P. Unit.</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                </tr></thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                    {generatedReport.items.map((item, index) => (
                                        <tr key={`${item.orderId}-${index}`}>
                                            <td className="px-4 py-3 whitespace-nowrap">{item.orderId}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{item.orderDate}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{item.customerName}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{item.productName}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">{item.quantity}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">{formatCurrency(item.unitPrice)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right font-medium">{formatCurrency(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        )}
                        {generatedReport.type === 'inventory' && (
                            <>
                                <thead className="bg-gray-50"><tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                                </tr></thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                    {generatedReport.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 whitespace-nowrap">{item.name}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{item.category}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs">{item.location}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">{`${item.quantity.toLocaleString('es-MX', {minimumFractionDigits: item.unitOfMeasure === 'unidades' ? 0 : 2})} ${unitAbbreviations[item.unitOfMeasure]}`}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">{formatCurrency(item.price)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right font-medium">{formatCurrency(item.price * item.quantity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        )}
                        {generatedReport.type === 'pendingOrders' && (
                            <>
                                <thead className="bg-gray-50"><tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pedido</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                </tr></thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                    {generatedReport.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3 whitespace-nowrap">{item.orderId}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{item.orderDate}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{item.customerName}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{item.status}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right font-medium">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        )}
                        {generatedReport.type === 'annualSales' && (
                            <>
                                <thead className="bg-gray-50"><tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mes</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ganancia</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pedidos</th>
                                </tr></thead>
                                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                    {generatedReport.monthlyData.map((item) => (
                                        <tr key={item.month}>
                                            <td className="px-4 py-3 whitespace-nowrap font-medium">{item.month}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">{formatCurrency(item.revenue)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right text-green-700">{formatCurrency(item.profit)}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">{item.orders.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </>
                        )}
                    </table>
                     {generatedReport.type !== 'financialSummary' && 'items' in generatedReport && generatedReport.items?.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                            {generatedReport.type === 'sales' && 'No se encontraron entregas para el período seleccionado.'}
                            {generatedReport.type === 'inventory' && 'No se encontraron productos para los filtros seleccionados.'}
                            {generatedReport.type === 'pendingOrders' && 'No hay pedidos pendientes.'}
                        </div>
                     )}
                     {generatedReport.type === 'annualSales' && generatedReport.totalOrders === 0 && (
                         <div className="text-center py-4 text-gray-500">
                            No se encontraron entregas para el año seleccionado.
                         </div>
                     )}
                </div>
            </div>
        );
    };

    return (
        <div>
            <style>{`
                @media print {
                    body > #root > div > aside, 
                    body > #root > div > div > header,
                    .no-print { display: none !important; }
                    main { padding: 1.5rem !important; margin: 0 !important; background-color: white !important; }
                    .print-container { box-shadow: none !important; padding: 0 !important; }
                    @page { size: A4; margin: 1.5cm; }
                }
                @keyframes fade-in { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
            `}</style>
            
            <div className="no-print">
                {!selectedReportType && !generatedReport && (
                     <div className="animate-fade-in">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Informes</h1>
                        <p className="text-gray-600 mb-6">Seleccione el tipo de informe que desea generar.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reportTypes.map(report => (
                                <div key={report.type} onClick={() => handleSelectReport(report.type)} className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 bg-gray-100 rounded-lg ${report.color}`}>
                                            <report.icon className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800">{report.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {selectedReportType && !generatedReport && renderFilters()}
            </div>
            
            {generatedReport && renderReport()}
        </div>
    );
};

export default Reports;
