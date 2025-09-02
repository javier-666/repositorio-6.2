import React, { useState, useEffect, useMemo } from 'react';
import { Product, WarehouseStructure, WarehouseLocation, UnitOfMeasure, Entity, Category, Supplier } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';

type SerialItem = {
  id: number;
  serialNumber: string;
  inventoryNumber: string;
};

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (products: (Omit<Product, 'id' | 'addedDate'> | Product)[]) => void;
  productToEdit: Product | null;
  warehouseStructure: WarehouseStructure;
  entityId: string;
  activeEntity: Entity;
  categories: Category[];
  suppliers: Supplier[];
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, productToEdit, warehouseStructure, entityId, activeEntity, categories, suppliers }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState<number | string>(1);
  const [price, setPrice] = useState<number | string>(0);
  const [supplierId, setSupplierId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [inventoryNumber, setInventoryNumber] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState<UnitOfMeasure>('unidades');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedRow, setSelectedRow] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<'single' | 'serialized'>('single');
  const [serialItems, setSerialItems] = useState<SerialItem[]>([{ id: Date.now(), serialNumber: '', inventoryNumber: '' }]);
  const [isConvertingToBulk, setIsConvertingToBulk] = useState(false);
  const [expirationDate, setExpirationDate] = useState('');
  const [reorderPoint, setReorderPoint] = useState<number | string>('');
  
  // Store settings state
  const [isPublished, setIsPublished] = useState(false);
  const [storePrice, setStorePrice] = useState<number | string>('');
  const [storePriceError, setStorePriceError] = useState('');

  const isEditMode = productToEdit !== null;
  const isEditingSerializedItem = isEditMode && (!!productToEdit?.serialNumber || !!productToEdit?.inventoryNumber);

  const minStorePrice = useMemo(() => {
    const basePrice = Number(price);
    const markup = activeEntity.storePriceMarkup || 0;
    if (isNaN(basePrice) || basePrice <= 0) return 0;
    return basePrice * (1 + markup / 100);
  }, [price, activeEntity.storePriceMarkup]);

  useEffect(() => {
    if (isOpen) {
      setIsConvertingToBulk(false); // Reset conversion state on open
      if (productToEdit) {
        setName(productToEdit.name);
        setSku(productToEdit.sku || '');
        setCategoryId(productToEdit.categoryId);
        setQuantity(productToEdit.quantity);
        setPrice(productToEdit.price);
        setSupplierId(productToEdit.supplierId);
        setSerialNumber(productToEdit.serialNumber || '');
        setInventoryNumber(productToEdit.inventoryNumber || '');
        setUnitOfMeasure(productToEdit.unitOfMeasure);
        setSelectedWarehouse(productToEdit.location.warehouseType);
        setSelectedSection(productToEdit.location.section);
        setSelectedRow(productToEdit.location.row);
        setImagePreview(productToEdit.imageUrl);
        setExpirationDate(productToEdit.expirationDate ? productToEdit.expirationDate.split('T')[0] : '');
        setReorderPoint(productToEdit.reorderPoint || '');
        setAddMode('single'); // Edit mode is always single

        // Store fields
        setIsPublished(productToEdit.isPublished || false);
        setStorePrice(productToEdit.storePrice || '');

      } else {
        // Reset form for adding new product
        setName('');
        setSku('');
        setCategoryId('');
        setQuantity(1);
        setPrice(0);
        setSupplierId('');
        setSerialNumber('');
        setInventoryNumber('');
        setUnitOfMeasure('unidades');
        setSelectedWarehouse('');
        setSelectedSection('');
        setSelectedRow('');
        setImagePreview(null);
        setAddMode('single');
        setSerialItems([{ id: Date.now(), serialNumber: '', inventoryNumber: '' }]);
        setExpirationDate('');
        setReorderPoint('');
        
        // Store fields
        setIsPublished(false);
        setStorePrice('');
      }
      setStorePriceError(''); // Reset error on open
    }
  }, [isOpen, productToEdit]);
  
  useEffect(() => {
    if (selectedWarehouse && !warehouseStructure[selectedWarehouse]?.[selectedSection]) {
      setSelectedSection('');
    }
    if (selectedSection && !warehouseStructure[selectedWarehouse]?.[selectedSection]?.includes(selectedRow)) {
        setSelectedRow('');
    }
  }, [selectedWarehouse, selectedSection, selectedRow, warehouseStructure]);
  
  useEffect(() => {
    // When price changes, re-validate store price
    handleStorePriceChange(String(storePrice));
  }, [price, isPublished]);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSerialItem = () => {
    setSerialItems([...serialItems, { id: Date.now(), serialNumber: '', inventoryNumber: '' }]);
  };

  const handleRemoveSerialItem = (id: number) => {
    setSerialItems(serialItems.filter(item => item.id !== id));
  };

  const handleSerialItemChange = (id: number, field: 'serialNumber' | 'inventoryNumber', value: string) => {
    setSerialItems(serialItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleConvertToBulk = () => {
    setIsConvertingToBulk(true);
    setSerialNumber('');
    setInventoryNumber('');
  };

  const handleStorePriceChange = (value: string) => {
      setStorePrice(value);
      const numericValue = Number(value);
      if (isPublished && (value === '' || isNaN(numericValue) || numericValue < minStorePrice)) {
          setStorePriceError(`El precio debe ser al menos ${minStorePrice.toFixed(2)} USD.`);
      } else {
          setStorePriceError('');
      }
  };
  
  const handlePublishToggle = (checked: boolean) => {
    setIsPublished(checked);
    if (!checked) {
        setStorePriceError(''); // Clear error if unpublishing
    } else {
        // Re-validate when toggling on
        handleStorePriceChange(String(storePrice));
    }
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isPublished) {
        const numericStorePrice = Number(storePrice);
        if (storePrice === '' || isNaN(numericStorePrice) || numericStorePrice < minStorePrice) {
            setStorePriceError(`El precio debe ser al menos ${minStorePrice.toFixed(2)} USD.`);
            return; // Prevent submission
        }
    }
    
    const finalQuantity = Number(quantity);
    if (isNaN(finalQuantity)) return;

    const location: WarehouseLocation = {
        warehouseType: selectedWarehouse,
        section: selectedSection,
        row: selectedRow,
    };
    
    if (isEditMode && productToEdit) {
        const productIsNowBulk = finalQuantity > 1 || isConvertingToBulk;
        onSave([{ 
            ...productToEdit, 
            name, sku, categoryId, quantity: finalQuantity, unitOfMeasure, price: Number(price), supplierId, location,
            serialNumber: productIsNowBulk ? '' : serialNumber, 
            inventoryNumber: productIsNowBulk ? '' : inventoryNumber,
            imageUrl: imagePreview || productToEdit.imageUrl,
            expirationDate: expirationDate ? new Date(expirationDate).toISOString() : undefined,
            reorderPoint: reorderPoint ? Number(reorderPoint) : undefined,
            isPublished,
            storePrice: isPublished ? Number(storePrice) : undefined,
        }]);
    } else { // Add mode
        const commonProductData = {
            name, sku, categoryId, price: Number(price), supplierId, location, entityId,
            imageUrl: imagePreview || `https://picsum.photos/seed/${Date.now()}/200/200`,
            expirationDate: expirationDate ? new Date(expirationDate).toISOString() : undefined,
            reorderPoint: reorderPoint ? Number(reorderPoint) : undefined,
            isPublished,
            storePrice: isPublished ? Number(storePrice) : undefined,
        };
        
        if (addMode === 'single') {
            onSave([{...commonProductData, quantity: finalQuantity, serialNumber: '', inventoryNumber: '', unitOfMeasure}]);
        } else { // Serialized
            const productsToCreate = serialItems
                .filter(item => item.serialNumber.trim() !== '' || item.inventoryNumber.trim() !== '')
                .map(item => ({
                    ...commonProductData,
                    quantity: 1,
                    unitOfMeasure: 'unidades' as UnitOfMeasure,
                    serialNumber: item.serialNumber.trim(),
                    inventoryNumber: item.inventoryNumber.trim(),
                    isPublished: false, // Serialized items cannot be published from this modal
                    storePrice: undefined,
                }));
            
            if (productsToCreate.length > 0) {
                onSave(productsToCreate);
            }
        }
    }
    onClose();
  };

  if (!isOpen) return null;

  const warehouseTypes = Object.keys(warehouseStructure);
  const sections = selectedWarehouse ? Object.keys(warehouseStructure[selectedWarehouse] || {}) : [];
  const rows = (selectedWarehouse && selectedSection) ? (warehouseStructure[selectedWarehouse]?.[selectedSection] || []) : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{isEditMode ? 'Editar Producto' : 'Añadir Nuevo Producto'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2">
            
            {!isEditMode && (
                <fieldset className="border border-gray-300 rounded-md p-3">
                    <legend className="text-sm font-medium text-gray-700 px-1">Modo de Creación</legend>
                    <div className="flex gap-x-4">
                        <label className="flex items-center">
                            <input type="radio" value="single" checked={addMode === 'single'} onChange={() => setAddMode('single')} className="form-radio h-4 w-4 text-teal-600"/>
                            <span className="ml-2 text-sm text-gray-700">Único / Granel</span>
                        </label>
                        <label className="flex items-center">
                            <input type="radio" value="serialized" checked={addMode === 'serialized'} onChange={() => setAddMode('serialized')} className="form-radio h-4 w-4 text-teal-600"/>
                            <span className="ml-2 text-sm text-gray-700">Productos Serializados</span>
                        </label>
                    </div>
                </fieldset>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Producto</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" required />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">Categoría</label>
                  <select id="categoryId" value={categoryId} onChange={e => setCategoryId(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 bg-white" required>
                      <option value="">Seleccione una categoría</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700">Modelo (Opcional)</label>
                  <input type="text" id="sku" value={sku} onChange={e => setSku(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                </div>
            </div>
            
            {(addMode === 'single' || isEditMode) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="unitOfMeasure" className="block text-sm font-medium text-gray-700">Unidad</label>
                  <select 
                    id="unitOfMeasure" 
                    value={unitOfMeasure} 
                    onChange={e => setUnitOfMeasure(e.target.value as UnitOfMeasure)} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 bg-white"
                    required
                  >
                      <option value="unidades">Unidades</option>
                      <option value="litros">Litros</option>
                      <option value="kilogramos">Kilogramos</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Cantidad</label>
                  <input 
                    type="number" 
                    id="quantity" 
                    value={quantity} 
                    onChange={e => setQuantity(e.target.value)} 
                    step={unitOfMeasure === 'unidades' ? 1 : 0.01}
                    min="0"
                    disabled={isEditingSerializedItem && !isConvertingToBulk}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100 disabled:cursor-not-allowed" 
                    required 
                  />
                   {isEditingSerializedItem && !isConvertingToBulk && (
                      <button 
                          type="button" 
                          onClick={handleConvertToBulk}
                          className="mt-1 text-xs text-teal-600 hover:text-teal-800 hover:underline"
                      >
                          Convertir a granel para cambiar cantidad
                      </button>
                  )}
                </div>
                <div>
                    <label htmlFor="reorderPoint" className="block text-sm font-medium text-gray-700">Punto de Reorden (Opcional)</label>
                    <input 
                        type="number" 
                        id="reorderPoint" 
                        value={reorderPoint} 
                        onChange={e => setReorderPoint(e.target.value)} 
                        step="1"
                        min="0"
                        disabled={addMode === 'serialized'}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100" 
                    />
                </div>
                 <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">Precio Base (USD)</label>
                  <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} step="0.01" min="0" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" required />
                </div>
              </div>
            )}
            
            {isEditingSerializedItem && !isConvertingToBulk && (
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-md border">
                    <div>
                        <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">Nro. de Serie</label>
                        <input type="text" id="serialNumber" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                    <div>
                        <label htmlFor="inventoryNumber" className="block text-sm font-medium text-gray-700">Nro. de Inventario</label>
                        <input type="text" id="inventoryNumber" value={inventoryNumber} onChange={e => setInventoryNumber(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                    </div>
                </div>
            )}
            
            {!isEditMode && addMode === 'serialized' && (
                <fieldset className="border border-gray-300 rounded-md p-3">
                    <legend className="text-sm font-medium text-gray-700 px-1">Artículos Serializados</legend>
                    <div className="space-y-2">
                        {serialItems.map((item, index) => (
                            <div key={item.id} className="grid grid-cols-10 gap-2 items-center">
                                <div className="col-span-4">
                                    <label className="text-xs text-gray-600">Nro. de Serie</label>
                                    <input type="text" value={item.serialNumber} onChange={(e) => handleSerialItemChange(item.id, 'serialNumber', e.target.value)} className="mt-1 block w-full text-sm border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:ring-teal-500"/>
                                </div>
                                <div className="col-span-4">
                                     <label className="text-xs text-gray-600">Nro. de Inventario</label>
                                    <input type="text" value={item.inventoryNumber} onChange={(e) => handleSerialItemChange(item.id, 'inventoryNumber', e.target.value)} className="mt-1 block w-full text-sm border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:ring-teal-500"/>
                                </div>
                                <div className="col-span-2 flex justify-end pt-5">
                                    {serialItems.length > 1 && <button type="button" onClick={() => handleRemoveSerialItem(item.id)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="h-4 w-4"/></button>}
                                </div>
                            </div>
                        ))}
                    </div>
                     <button type="button" onClick={handleAddSerialItem} className="mt-3 text-sm flex items-center text-teal-600 hover:text-teal-800 font-semibold">
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Añadir Otro Artículo
                    </button>
                </fieldset>
            )}

            {activeEntity.isStoreEnabled && (addMode === 'single' || isEditMode) && (
              <fieldset className="border border-gray-300 rounded-md p-3">
                  <legend className="text-sm font-medium text-gray-700 px-1">Tienda Online</legend>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={isPublished} 
                            onChange={(e) => handlePublishToggle(e.target.checked)}
                            className="form-checkbox h-5 w-5 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <span className="font-medium text-gray-700">Publicar en la Tienda</span>
                    </label>

                    {isPublished && (
                        <div>
                            <label htmlFor="storePrice" className="block text-sm font-medium text-gray-700">Precio en Tienda (USD)</label>
                            <input 
                                type="number" 
                                id="storePrice" 
                                value={storePrice} 
                                onChange={e => handleStorePriceChange(e.target.value)} 
                                step="0.01" 
                                min={minStorePrice.toFixed(2)}
                                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 ${storePriceError ? 'border-red-500' : 'border-gray-300'}`} 
                                required 
                            />
                            {storePriceError ? (
                                <p className="mt-1 text-xs text-red-600">{storePriceError}</p>
                            ) : (
                                <p className="mt-1 text-xs text-gray-500">
                                    Precio base: ${Number(price).toFixed(2)}. Mínimo con {activeEntity.storePriceMarkup || 0}% de ganancia: ${minStorePrice.toFixed(2)}
                                </p>
                            )}
                        </div>
                    )}
                  </div>
              </fieldset>
            )}

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">Imagen del Producto</label>
              <input 
                  type="file" id="image" onChange={handleImageChange} accept="image/*" 
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-600 hover:file:bg-teal-100" 
              />
              {imagePreview && <img src={imagePreview} alt="Vista previa" className="mt-2 h-20 w-20 object-cover rounded-md" />}
            </div>

            <fieldset className="border border-gray-300 rounded-md p-3">
                <legend className="text-sm font-medium text-gray-700 px-1">Ubicación</legend>
                 <div className="space-y-3">
                     <div>
                        <label htmlFor="warehouseType" className="block text-xs font-medium text-gray-600">Tipo de Almacén</label>
                        <select id="warehouseType" value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm" required>
                            <option value="">Seleccione un tipo</option>
                            {warehouseTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="section" className="block text-xs font-medium text-gray-600">Sección</label>
                        <select id="section" value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm" disabled={!selectedWarehouse} required>
                            <option value="">Seleccione una sección</option>
                            {sections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="row" className="block text-xs font-medium text-gray-600">Fila</label>
                        <select id="row" value={selectedRow} onChange={e => setSelectedRow(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-sm" disabled={!selectedSection} required>
                            <option value="">Seleccione una fila</option>
                             {rows.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                </div>
            </fieldset>

            <div>
              <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700">Proveedor</label>
              <select id="supplierId" value={supplierId} onChange={e => setSupplierId(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 bg-white" required>
                  <option value="">Seleccione un proveedor</option>
                  {suppliers.map(sup => <option key={sup.id} value={sup.id}>{sup.name}</option>)}
              </select>
            </div>

            <div className="relative">
                <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">Fecha de Vencimiento (Opcional)</label>
                <input 
                    type="date" 
                    id="expirationDate" 
                    value={expirationDate} 
                    onChange={e => setExpirationDate(e.target.value)} 
                    disabled={addMode === 'serialized'}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100" 
                />
            </div>

          </div>
          <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              Cancelar
            </button>
            <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
              {isEditMode ? 'Guardar Cambios' : 'Guardar Producto(s)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;