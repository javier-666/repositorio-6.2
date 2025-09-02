import React, { useState } from 'react';
import { WarehouseStructure, Product } from '../types';
import MapPinIcon from './icons/MapPinIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmationModal from './ConfirmationModal';

interface LocationsProps {
  structure: WarehouseStructure;
  products: Product[];
  onUpdateStructure: (newStructure: WarehouseStructure) => void;
  onRenameItem: (type: 'type' | 'section' | 'row', path: string[], newName: string) => void;
  onDeleteItem: (type: 'type' | 'section' | 'row', path: string[]) => void;
}

const Locations: React.FC<LocationsProps> = ({ structure, products, onUpdateStructure, onRenameItem, onDeleteItem }) => {
  const [newWarehouseType, setNewWarehouseType] = useState('');
  const [newSection, setNewSection] = useState<{ [key: string]: string }>({});
  const [newRow, setNewRow] = useState<{ [key: string]: string }>({});

  const [editingPath, setEditingPath] = useState<string[] | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'warning';
    title: string;
    message: string;
    itemToDelete: { type: 'type' | 'section' | 'row'; path: string[] } | null;
  }>({ isOpen: false, type: 'confirm', title: '', message: '', itemToDelete: null });


  const handleAddWarehouseType = () => {
    if (newWarehouseType && !structure[newWarehouseType]) {
      const newStructure = { ...structure, [newWarehouseType]: {} };
      onUpdateStructure(newStructure);
      setNewWarehouseType('');
    }
  };

  const handleAddSection = (warehouseType: string) => {
    const sectionName = newSection[warehouseType];
    if (sectionName && !structure[warehouseType][sectionName]) {
      const newStructure = { ...structure };
      newStructure[warehouseType][sectionName] = [];
      onUpdateStructure(newStructure);
      setNewSection({ ...newSection, [warehouseType]: '' });
    }
  };
  
  const handleAddRow = (warehouseType: string, section: string) => {
    const rowName = newRow[`${warehouseType}-${section}`];
    if (rowName && !structure[warehouseType][section].includes(rowName)) {
      const newStructure = { ...structure };
      newStructure[warehouseType][section].push(rowName);
      onUpdateStructure(newStructure);
      setNewRow({ ...newRow, [`${warehouseType}-${section}`]: '' });
    }
  };

  const handleStartEdit = (path: string[], currentValue: string) => {
    setEditingPath(path);
    setEditingValue(currentValue);
  };

  const handleCancelEdit = () => {
    setEditingPath(null);
    setEditingValue('');
  };

  const handleSaveEdit = () => {
    if (!editingPath || !editingValue.trim() || editingPath[editingPath.length - 1] === editingValue.trim()) {
        handleCancelEdit();
        return;
    }

    const type = editingPath.length === 1 ? 'type' : editingPath.length === 2 ? 'section' : 'row';
    onRenameItem(type, editingPath, editingValue.trim());
    handleCancelEdit();
  };

  const isEditing = (path: string[]) => {
      if(!editingPath) return false;
      if(editingPath.length !== path.length) return false;
      return editingPath.every((p, i) => p === path[i]);
  };

  const isLocationInUse = (type: 'type' | 'section' | 'row', path: string[]): boolean => {
    const [typeName, sectionName] = path;
    if (type === 'type') {
      return products.some(p => p.location.warehouseType === typeName);
    } else if (type === 'section') {
      return products.some(p => p.location.warehouseType === typeName && p.location.section === sectionName);
    } else if (type === 'row') {
      const rowName = path[2];
      return products.some(p => p.location.warehouseType === typeName && p.location.section === sectionName && p.location.row === rowName);
    }
    return false;
  };

  const handleAttemptDelete = (type: 'type' | 'section' | 'row', path: string[]) => {
    const itemName = path[path.length - 1];

    if (isLocationInUse(type, path)) {
        setModalState({
            isOpen: true,
            type: 'warning',
            title: 'Ubicación en Uso',
            message: `La ubicación "${itemName}" no se puede eliminar porque contiene productos. Por favor, mueva los productos a otra ubicación antes de intentarlo de nuevo.`,
            itemToDelete: null,
        });
    } else {
        setModalState({
            isOpen: true,
            type: 'confirm',
            title: 'Confirmar Eliminación',
            message: `¿Está seguro de que desea eliminar "${itemName}"? Esta acción es irreversible.`,
            itemToDelete: { type, path },
        });
    }
  };

  const handleConfirmDelete = () => {
    if (modalState.itemToDelete) {
        onDeleteItem(modalState.itemToDelete.type, modalState.itemToDelete.path);
    }
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, type: 'confirm', title: '', message: '', itemToDelete: null });
  };


  const renderEditableItem = (value: string, path: string[], textClass: string) => {
    const type = path.length === 1 ? 'type' : path.length === 2 ? 'section' : 'row';
    const itemInUse = isLocationInUse(type, path);

    if (isEditing(path)) {
        return (
            <div className="flex items-center gap-2 flex-grow">
                <input
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    autoFocus
                    className="flex-grow text-sm border border-teal-300 rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button onClick={handleCancelEdit} className="text-gray-500 hover:text-gray-700">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        )
    }
    return (
        <div className="flex items-center justify-between flex-grow">
            <span className={textClass}>{value}</span>
            <div className="flex items-center gap-2">
                 <button 
                    onClick={() => handleStartEdit(path, value)}
                    disabled={itemInUse}
                    title={itemInUse ? 'Esta ubicación está en uso y no se puede editar.' : 'Editar nombre'}
                    className={`bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-opacity ${itemInUse ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-200'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
                    Editar
                </button>
                 <button 
                    onClick={() => handleAttemptDelete(type, path)}
                    title={itemInUse ? 'Esta ubicación está en uso y no se puede eliminar.' : 'Eliminar'}
                    className={'bg-red-100 text-red-700 px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-opacity hover:bg-red-200'}
                >
                    <TrashIcon className="h-3 w-3" />
                    Eliminar
                </button>
            </div>
        </div>
    )
  };


  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestionar Ubicaciones del Almacén</h1>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Añadir Tipo de Almacén</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newWarehouseType}
            onChange={(e) => setNewWarehouseType(e.target.value)}
            placeholder="Ej: Almacén Seco"
            className="flex-grow border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
          <button onClick={handleAddWarehouseType} className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700">
            Añadir
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(structure).map(([warehouseType, sections]) => (
          <div key={warehouseType} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <MapPinIcon className="w-6 h-6 mr-2 text-teal-600 flex-shrink-0" />
              {renderEditableItem(warehouseType, [warehouseType], 'text-2xl font-bold text-gray-800')}
            </div>
            
            <div className="pl-4 border-l-2 border-teal-200 space-y-4">
               {Object.entries(sections).map(([section, rows]) => (
                    <div key={section} className="bg-gray-50 p-4 rounded-md">
                        <div className="flex items-center">
                           {renderEditableItem(section, [warehouseType, section], 'text-lg font-semibold text-gray-700')}
                        </div>
                        <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1">
                            {rows.map(row => (
                              <li key={row} className="ml-4 flex items-center">
                                {renderEditableItem(row, [warehouseType, section, row], '')}
                              </li>
                            ))}
                             {rows.length === 0 && <li className="text-gray-400">No hay filas en esta sección.</li>}
                        </ul>
                         <div className="flex space-x-2 mt-3">
                           <input
                            type="text"
                            value={newRow[`${warehouseType}-${section}`] || ''}
                            onChange={(e) => setNewRow({ ...newRow, [`${warehouseType}-${section}`]: e.target.value })}
                            placeholder="Añadir nueva fila"
                            className="flex-grow text-sm border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:ring-teal-500"
                            />
                            <button onClick={() => handleAddRow(warehouseType, section)} className="bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded-md hover:bg-gray-300">
                                Añadir Fila
                            </button>
                        </div>
                    </div>
                ))}

                <div className="pt-4">
                     <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newSection[warehouseType] || ''}
                            onChange={(e) => setNewSection({ ...newSection, [warehouseType]: e.target.value })}
                            placeholder="Añadir nueva sección"
                            className="flex-grow border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-teal-500"
                        />
                        <button onClick={() => handleAddSection(warehouseType)} className="bg-teal-200 text-teal-800 px-4 py-2 rounded-md hover:bg-teal-300 font-semibold">
                            Añadir Sección
                        </button>
                     </div>
                </div>

            </div>
          </div>
        ))}
      </div>
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        onConfirm={modalState.type === 'confirm' ? handleConfirmDelete : handleCloseModal}
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
    </div>
  );
};

export default Locations;
