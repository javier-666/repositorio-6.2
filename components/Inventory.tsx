import React, { useState, useMemo } from 'react';
import { Product, WarehouseStructure, Currency, User, UnitOfMeasure, Entity, Category, Supplier } from '../types';
import ProductModal from './ProductModal';
import CurrencySwitcher from './CurrencySwitcher';
import Pagination from './Pagination';

interface InventoryProps {
    products: Product[];
    onAddOrUpdateProducts: (products: (Omit<Product, 'id' | 'addedDate'> | Product)[]) => void;
    warehouseStructure: WarehouseStructure;
    searchQuery: string;
    currentUser: User | null;
    currentEntityId: string;
    currentCurrency: Currency;
    exchangeRate: number;
    onCurrencyChange: (currency: Currency) => void;
    onRateChange: (rate: number) => void;
    activeEntity: Entity;
    categories: Category[];
    suppliers: Supplier[];
}

const unitAbbreviations: Record<UnitOfMeasure, string> = {
    unidades: 'u',
    litros: 'L',
    kilogramos: 'kg'
};

const Inventory: React.FC<InventoryProps> = ({ products, onAddOrUpdateProducts, warehouseStructure, searchQuery, currentUser, currentEntityId, currentCurrency, exchangeRate, onCurrencyChange, onRateChange, activeEntity, categories, suppliers }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [filters, setFilters] = useState({
        warehouseType: '',
        section: '',
        row: '',
        categoryId: '',
        unitOfMeasure: '',
        expirationStatus: '',
        publicationStatus: '',
    });
    
    const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c.name])), [categories]);
    const supplierMap = useMemo(() => new Map(suppliers.map(s => [s.id, s.name])), [suppliers]);

    const filteredProducts = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        return products.filter(product => {
            const searchLower = searchQuery.toLowerCase();
            const nameMatch = product.name.toLowerCase().includes(searchLower);
            const skuMatch = product.sku ? product.sku.toLowerCase().includes(searchLower) : false;
            const serialMatch = product.serialNumber ? product.serialNumber.toLowerCase().includes(searchLower) : false;
            const inventoryMatch = product.inventoryNumber ? product.inventoryNumber.toLowerCase().includes(searchLower) : false;

            const warehouseMatch = !filters.warehouseType || product.location.warehouseType === filters.warehouseType;
            const sectionMatch = !filters.section || product.location.section === filters.section;
            const rowMatch = !filters.row || product.location.row === filters.row;
            const categoryMatch = !filters.categoryId || product.categoryId === filters.categoryId;
            const unitMatch = !filters.unitOfMeasure || product.unitOfMeasure === filters.unitOfMeasure;

            let expirationMatch = true;
            if (filters.expirationStatus) {
                if (!product.expirationDate) {
                    expirationMatch = filters.expirationStatus === 'not_expiring';
                } else {
                    const expirationDate = new Date(product.expirationDate);
                    if (filters.expirationStatus === 'expired') {
                        expirationMatch = expirationDate < today;
                    } else if (filters.expirationStatus === 'expiring_soon') {
                        expirationMatch = expirationDate >= today && expirationDate <= thirtyDaysFromNow;
                    } else if (filters.expirationStatus === 'not_expiring') {
                        expirationMatch = expirationDate > thirtyDaysFromNow;
                    }
                }
            }

            let publicationMatch = true;
            if (filters.publicationStatus) {
                if (filters.publicationStatus === 'published') {
                    publicationMatch = !!product.isPublished;
                } else if (filters.publicationStatus === 'not_published') {
                    publicationMatch = !product.isPublished;
                }
            }
            
            return (nameMatch || skuMatch || serialMatch || inventoryMatch) && warehouseMatch && sectionMatch && rowMatch && categoryMatch && unitMatch && expirationMatch && publicationMatch;
        });
    }, [products, searchQuery, filters]);

    const paginatedProducts = useMemo(() => {
        const startIndex = page * rowsPerPage;
        return filteredProducts.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredProducts, page, rowsPerPage]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => {
            const newFilters = {...prev, [name]: value};
            if(name === 'warehouseType') {
                newFilters.section = '';
                newFilters.row = '';
            }
            if(name === 'section') {
                newFilters.row = '';
            }
            return newFilters;
        });
        setPage(0);
    };

    const clearFilters = () => {
        setFilters({
            warehouseType: '',
            section: '',
            row: '',
            categoryId: '',
            unitOfMeasure: '',
            expirationStatus: '',
            publicationStatus: '',
        });
        setPage(0);
    };

    const handleSaveProducts = (productsData: (Omit<Product, 'id' | 'addedDate'> | Product)[]) => {
        onAddOrUpdateProducts(productsData);
    };
    
    const openAddModal = () => {
        setProductToEdit(null);
        setIsModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setProductToEdit(product);
        setIsModalOpen(true);
    };

    const warehouseTypes = Object.keys(warehouseStructure);
    const sections = filters.warehouseType ? Object.keys(warehouseStructure[filters.warehouseType] || {}) : [];
    const rows = (filters.warehouseType && filters.section) ? (warehouseStructure[filters.warehouseType]?.[filters.section] || []) : [];

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

    const formatQuantity = (product: Product) => {
        const value = product.quantity;
        const unit = unitAbbreviations[product.unitOfMeasure];
        const numberFormatOptions: Intl.NumberFormatOptions = {};
        if (product.unitOfMeasure !== 'unidades') {
            numberFormatOptions.minimumFractionDigits = 2;
            numberFormatOptions.maximumFractionDigits = 2;
        }
        return `${value.toLocaleString('es-MX', numberFormatOptions)} ${unit}`;
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Inventario</h1>
                <button 
                    onClick={openAddModal}
                    className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 flex items-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    Añadir Producto
                </button>
            </div>
            
            <CurrencySwitcher
                currentUser={currentUser}
                currentCurrency={currentCurrency}
                exchangeRate={exchangeRate}
                onCurrencyChange={onCurrencyChange}
                onRateChange={onRateChange}
            />

            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 items-end">
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Categoría</label>
                        <select name="categoryId" value={filters.categoryId} onChange={handleFilterChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                            <option value="">Todas</option>
                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                    </div>
                     <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Unidad</label>
                        <select name="unitOfMeasure" value={filters.unitOfMeasure} onChange={handleFilterChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                            <option value="">Todas</option>
                            <option value="unidades">Unidades</option>
                            <option value="litros">Litros</option>
                            <option value="kilogramos">Kilogramos</option>
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Tipo Almacén</label>
                        <select name="warehouseType" value={filters.warehouseType} onChange={handleFilterChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                            <option value="">Todos</option>
                            {warehouseTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Sección</label>
                        <select name="section" value={filters.section} onChange={handleFilterChange} disabled={!filters.warehouseType} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100">
                            <option value="">Todas</option>
                            {sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                        </select>
                    </div>
                     <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Fila</label>
                        <select name="row" value={filters.row} onChange={handleFilterChange} disabled={!filters.section} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100">
                            <option value="">Todas</option>
                            {rows.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                     <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Vencimiento</label>
                        <select name="expirationStatus" value={filters.expirationStatus} onChange={handleFilterChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                            <option value="">Todos</option>
                            <option value="expired">Vencidos</option>
                            <option value="expiring_soon">Próximos a vencer (30 días)</option>
                            <option value="not_expiring">Sin Vencimiento / Lejano</option>
                        </select>
                    </div>
                     <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Estado Tienda</label>
                        <select name="publicationStatus" value={filters.publicationStatus} onChange={handleFilterChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                            <option value="">Todos</option>
                            <option value="published">Publicados</option>
                            <option value="not_published">No Publicados</option>
                        </select>
                    </div>
                    <button onClick={clearFilters} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 lg:col-span-1">
                        Limpiar
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-t-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nro. de Serie</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nro. de Inventario</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio Unit.</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Añadido</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Tienda</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Editar</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedProducts.map((product) => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <img className="h-10 w-10 rounded-full object-cover" src={product.imageUrl} alt={product.name} />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{product.serialNumber || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{product.inventoryNumber || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className={`text-sm ${product.quantity <= 0 ? 'text-red-600 font-bold' : (product.quantity < 20 ? 'text-yellow-600 font-semibold' : 'text-gray-900')}`}>{formatQuantity(product)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(product.price)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(product.price * product.quantity)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{categoryMap.get(product.categoryId) || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {product.location && product.location.warehouseType ? (
                                            `${product.location.warehouseType} / ${product.location.section} / ${product.location.row}`
                                        ) : (
                                            <span className="italic text-gray-400">Sin Ubicación</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(product.addedDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {product.isPublished ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Publicado
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                No Publicado
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {(() => {
                                            if (!product.expirationDate) {
                                                return <span className="text-gray-400">-</span>;
                                            }
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const expirationDate = new Date(product.expirationDate);
                                            const thirtyDaysFromNow = new Date();
                                            thirtyDaysFromNow.setDate(today.getDate() + 30);
                                            
                                            let textColor = 'text-gray-700';
                                            if (expirationDate < today) {
                                                textColor = 'text-red-600 font-bold';
                                            } else if (expirationDate <= thirtyDaysFromNow) {
                                                textColor = 'text-yellow-600 font-semibold';
                                            }
                                            return <span className={textColor}>{expirationDate.toLocaleDateString()}</span>;
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => openEditModal(product)} className="text-teal-600 hover:text-teal-900">Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <Pagination
                count={filteredProducts.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={setPage}
                onRowsPerPageChange={(value) => {
                    setRowsPerPage(value);
                    setPage(0);
                }}
            />
             <ProductModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProducts}
                productToEdit={productToEdit}
                warehouseStructure={warehouseStructure}
                entityId={currentEntityId}
                activeEntity={activeEntity}
                categories={categories}
                suppliers={suppliers}
            />
        </div>
    );
};

export default Inventory;