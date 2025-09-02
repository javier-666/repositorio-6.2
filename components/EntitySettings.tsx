import React, { useState, useRef, useEffect } from 'react';
import ConfirmationModal from './ConfirmationModal';
import UploadIcon from './icons/UploadIcon';
import DownloadIcon from './icons/DownloadIcon';
import { Entity, Category, Supplier, Product } from '../types';
import TrashIcon from './icons/TrashIcon';

interface EntitySettingsProps {
    onExportEntity: () => void;
    onImportEntityData: (file: File) => void;
    activeEntity: Entity;
    onUpdateEntity: (entity: Entity) => void;
    categories: Category[];
    suppliers: Supplier[];
    onAddOrUpdateCategory: (category: Omit<Category, 'id' | 'entityId'> | Category) => void;
    onDeleteCategory: (categoryId: string) => boolean;
    onAddOrUpdateSupplier: (supplier: Omit<Supplier, 'id' | 'entityId'> | Supplier) => void;
    onDeleteSupplier: (supplierId: string) => boolean;
    products: Product[];
}

const EntitySettings: React.FC<EntitySettingsProps> = ({ 
    onExportEntity, onImportEntityData, activeEntity, onUpdateEntity, 
    categories, suppliers, onAddOrUpdateCategory, onDeleteCategory, 
    onAddOrUpdateSupplier, onDeleteSupplier, products 
}) => {
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Store settings state
    const [logoPreview, setLogoPreview] = useState('');
    const [coverPreview, setCoverPreview] = useState('');
    const [storeMarkup, setStoreMarkup] = useState(0);
    const [storeSlug, setStoreSlug] = useState('');
    const [slugError, setSlugError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const logoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    // Category/Supplier management state
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newSupplierName, setNewSupplierName] = useState('');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingItemName, setEditingItemName] = useState('');
    const [modalState, setModalState] = useState<{
      isOpen: boolean;
      type: 'warning' | 'confirm';
      title: string;
      message: string;
      onConfirm: () => void;
    }>({ isOpen: false, type: 'confirm', title: '', message: '', onConfirm: () => {} });


    useEffect(() => {
        setLogoPreview(activeEntity.storeLogoUrl || '');
        setCoverPreview(activeEntity.storeCoverUrl || '');
        setStoreMarkup(activeEntity.storePriceMarkup || 0);
        setStoreSlug(activeEntity.storeSlug || '');
        setSlugError('');
    }, [activeEntity]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (type === 'logo') {
                    setLogoPreview(result);
                } else {
                    setCoverPreview(result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImportClick = () => {
        setIsConfirmModalOpen(true);
    };

    const handleConfirmImport = () => {
        setIsConfirmModalOpen(false);
        fileInputRef.current?.click();
    };

    const handleFileChangeForImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImportEntityData(file);
        }
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setStoreSlug(newSlug);
        if (newSlug !== e.target.value) {
            setSlugError('Solo se permiten letras minúsculas, números y guiones.');
        } else {
            setSlugError('');
        }
    };
    
    const handleSubmitStoreSettings = (e: React.FormEvent) => {
        e.preventDefault();
        if (slugError) return;
        const updatedEntity = {
            ...activeEntity,
            storeLogoUrl: logoPreview,
            storeCoverUrl: coverPreview,
            storePriceMarkup: storeMarkup,
            storeSlug: storeSlug.trim(),
        };
        onUpdateEntity(updatedEntity);
        setSuccessMessage('Ajustes de la tienda guardados con éxito.');
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const defaultCover = 'https://via.placeholder.com/1200x400.png/E2E8F0/4A5568?text=Portada';
    const defaultLogo = 'https://via.placeholder.com/200x200.png/E2E8F0/4A5568?text=Logo';

    // Category/Supplier Handlers
    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            onAddOrUpdateCategory({ name: newCategoryName.trim() });
            setNewCategoryName('');
        }
    };

    const handleAddSupplier = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSupplierName.trim()) {
            onAddOrUpdateSupplier({ name: newSupplierName.trim() });
            setNewSupplierName('');
        }
    };

    const startEditing = (item: Category | Supplier) => {
        setEditingItemId(item.id);
        setEditingItemName(item.name);
    };

    const cancelEditing = () => {
        setEditingItemId(null);
        setEditingItemName('');
    };

    const saveEdit = (type: 'category' | 'supplier') => {
        if (!editingItemId || !editingItemName.trim()) {
            cancelEditing();
            return;
        }
        if (type === 'category') {
            const categoryToUpdate = categories.find(c => c.id === editingItemId);
            if (categoryToUpdate) {
                onAddOrUpdateCategory({ ...categoryToUpdate, name: editingItemName.trim() });
            }
        } else {
            const supplierToUpdate = suppliers.find(s => s.id === editingItemId);
            if (supplierToUpdate) {
                onAddOrUpdateSupplier({ ...supplierToUpdate, name: editingItemName.trim() });
            }
        }
        cancelEditing();
    };

    const attemptDelete = (item: Category | Supplier, type: 'category' | 'supplier') => {
        const isInUse = type === 'category' 
            ? products.some(p => p.categoryId === item.id)
            : products.some(p => p.supplierId === item.id);

        if (isInUse) {
            setModalState({
                isOpen: true,
                type: 'warning',
                title: 'Elemento en Uso',
                message: `La ${type === 'category' ? 'categoría' : 'proveedor'} "${item.name}" no se puede eliminar porque está asignada a uno o más productos.`,
                onConfirm: () => setModalState(prev => ({...prev, isOpen: false})),
            });
        } else {
            setModalState({
                isOpen: true,
                type: 'confirm',
                title: `Confirmar Eliminación`,
                message: `¿Está seguro de que desea eliminar "${item.name}"? Esta acción no se puede deshacer.`,
                onConfirm: () => {
                    if (type === 'category') onDeleteCategory(item.id);
                    else onDeleteSupplier(item.id);
                    setModalState(prev => ({...prev, isOpen: false}));
                },
            });
        }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Ajustes de la Empresa: <span className="text-teal-600">{activeEntity.name}</span></h1>
            
            {activeEntity.isStoreEnabled && (
                <form onSubmit={handleSubmitStoreSettings}>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold text-gray-700 mb-6 pb-4 border-b">Ajustes de la Tienda Online</h2>
                        <div className="space-y-8">
                            {/* Logo Section */}
                             <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Logo de la Tienda</h3>
                                <p className="text-sm text-gray-600 mb-4">Se recomienda una imagen cuadrada (ej: 200x200 píxeles).</p>
                                <div className="flex items-center gap-6">
                                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 shadow">
                                    <img src={logoPreview || defaultLogo} alt="Vista previa del logo" className="w-full h-full object-cover" />
                                    </div>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        ref={logoInputRef} 
                                        onChange={(e) => handleFileChange(e, 'logo')} 
                                        className="hidden"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => logoInputRef.current?.click()}
                                        className="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-md hover:bg-gray-300 flex items-center"
                                    >
                                        <UploadIcon className="w-5 h-5 mr-2" />
                                        Cambiar Logo
                                    </button>
                                </div>
                            </div>
                             {/* Cover Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Foto de Portada</h3>
                                <p className="text-sm text-gray-600 mb-4">Se recomienda una imagen panorámica con una relación de aspecto de 3:1 (ej: 1200x400 píxeles).</p>
                                <div className="space-y-4">
                                    <div className="w-full aspect-[3/1] rounded-lg overflow-hidden bg-gray-200 shadow">
                                    <img src={coverPreview || defaultCover} alt="Vista previa de la portada" className="w-full h-full object-cover" />
                                    </div>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        ref={coverInputRef} 
                                        onChange={(e) => handleFileChange(e, 'cover')} 
                                        className="hidden"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => coverInputRef.current?.click()}
                                        className="bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded-md hover:bg-gray-300 flex items-center"
                                    >
                                        <UploadIcon className="w-5 h-5 mr-2" />
                                        Cambiar Portada
                                    </button>
                                </div>
                            </div>

                            {/* Slug Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Enlace de Acceso Único</h3>
                                <p className="text-sm text-gray-600 mb-4">Personalice el enlace para su tienda. Use solo letras minúsculas, números y guiones (ej. 'mi-tienda-genial').</p>
                                <div className="max-w-md">
                                    <div className="flex items-center">
                                        <span className="text-sm text-gray-500 bg-gray-100 p-2.5 rounded-l-md border border-r-0">.../?store=</span>
                                        <input 
                                            type="text"
                                            value={storeSlug}
                                            onChange={handleSlugChange}
                                            className={`flex-grow border rounded-r-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 ${slugError ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-teal-500'}`}
                                        />
                                    </div>
                                    {slugError && <p className="text-red-500 text-xs mt-1">{slugError}</p>}
                                </div>
                            </div>

                             {/* Markup Section */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">Márgen de Ganancia</h3>
                                <p className="text-sm text-gray-600 mb-4">Establezca el porcentaje mínimo que se añadirá al precio base de un producto para calcular su precio de venta en la tienda.</p>
                                <div className="max-w-xs">
                                    <label htmlFor="storeMarkup" className="block text-sm font-medium text-gray-700">Porcentaje de Ganancia Mínimo (%)</label>
                                    <input 
                                        type="number"
                                        id="storeMarkup"
                                        value={storeMarkup}
                                        onChange={(e) => setStoreMarkup(Number(e.target.value) < 0 ? 0 : Number(e.target.value))}
                                        min="0"
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-4 pt-6 border-t mt-8">
                            {successMessage && <p className="text-green-600 text-sm animate-pulse">{successMessage}</p>}
                            <button 
                                type="submit" 
                                className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 font-semibold"
                            >
                                Guardar Cambios de la Tienda
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Category Management */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Gestionar Categorías</h2>
                    <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            value={newCategoryName} 
                            onChange={(e) => setNewCategoryName(e.target.value)} 
                            placeholder="Nueva categoría..."
                            className="flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                        />
                        <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700">Añadir</button>
                    </form>
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {categories.map(cat => (
                            <li key={cat.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                {editingItemId === cat.id ? (
                                    <input 
                                        type="text" 
                                        value={editingItemName} 
                                        onChange={e => setEditingItemName(e.target.value)} 
                                        onKeyDown={e => e.key === 'Enter' && saveEdit('category')}
                                        onBlur={() => saveEdit('category')}
                                        autoFocus
                                        className="flex-grow text-sm border border-teal-300 rounded-md py-1 px-2"
                                    />
                                ) : (
                                    <span className="text-sm">{cat.name}</span>
                                )}
                                <div className="flex gap-2">
                                    <button onClick={() => startEditing(cat)} className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                                    <button onClick={() => attemptDelete(cat, 'category')} className="text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Supplier Management */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Gestionar Proveedores</h2>
                    <form onSubmit={handleAddSupplier} className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            value={newSupplierName} 
                            onChange={(e) => setNewSupplierName(e.target.value)} 
                            placeholder="Nuevo proveedor..."
                            className="flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                        />
                        <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700">Añadir</button>
                    </form>
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {suppliers.map(sup => (
                             <li key={sup.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                {editingItemId === sup.id ? (
                                     <input 
                                        type="text" 
                                        value={editingItemName} 
                                        onChange={e => setEditingItemName(e.target.value)} 
                                        onKeyDown={e => e.key === 'Enter' && saveEdit('supplier')}
                                        onBlur={() => saveEdit('supplier')}
                                        autoFocus
                                        className="flex-grow text-sm border border-teal-300 rounded-md py-1 px-2"
                                    />
                                ) : (
                                    <span className="text-sm">{sup.name}</span>
                                )}
                                <div className="flex gap-2">
                                    <button onClick={() => startEditing(sup)} className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                                    <button onClick={() => attemptDelete(sup, 'supplier')} className="text-red-600 hover:text-red-800"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

             <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-700 mb-6 pb-4 border-b">Gestión de Datos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Export Card */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Exportar Datos</h3>
                        <p className="text-gray-600 mb-4 text-sm">
                            Cree una copia de seguridad completa de todos los datos de su empresa, incluyendo usuarios, productos y pedidos.
                            Esto generará un archivo <code>.json</code> cifrado que podrá guardar.
                        </p>
                        <button
                            onClick={onExportEntity}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
                        >
                            <DownloadIcon className="w-5 h-5 mr-2" />
                            Exportar Todos los Datos
                        </button>
                    </div>

                    {/* Import Card */}
                    <div className="border-l pl-6">
                        <h3 className="text-lg font-semibold text-red-700 mb-2">Importar Datos</h3>
                        <p className="text-gray-600 mb-4 text-sm">
                            Restaure los datos de su empresa desde un archivo de exportación.
                            <strong className="text-red-600 block mt-2">Atención: Esta acción es irreversible y reemplazará todos los datos existentes de la empresa (usuarios, productos, pedidos) por los del archivo.</strong>
                        </p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChangeForImport}
                            className="hidden"
                            accept=".json"
                        />
                        <button
                            onClick={handleImportClick}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center"
                        >
                            <UploadIcon className="w-5 h-5 mr-2" />
                            Importar desde Archivo...
                        </button>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmImport}
                title="Confirmar Importación de Datos"
                message={`¿Está absolutamente seguro de que desea continuar? Todos los datos actuales de "${activeEntity.name}" serán eliminados y reemplazados por los datos del archivo que seleccione. Esta acción no se puede deshacer.`}
            />
            {modalState && (
                <ConfirmationModal
                    isOpen={modalState.isOpen}
                    onClose={() => setModalState(prev => ({...prev, isOpen: false}))}
                    onConfirm={modalState.onConfirm}
                    title={modalState.title}
                    message={modalState.message}
                    hideCancelButton={modalState.type === 'warning'}
                    confirmText={modalState.type === 'warning' ? 'Entendido' : 'Confirmar Eliminación'}
                    confirmButtonClass={
                        modalState.type === 'warning'
                        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                        : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                    }
                />
            )}
        </div>
    );
};

export default EntitySettings;