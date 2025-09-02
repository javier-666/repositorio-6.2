import React, { useState, useEffect } from 'react';
import { User, Entity, EntityType } from '../types';

interface EntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entityData: Omit<Entity, 'id'>, adminUser?: Omit<User, 'id' | 'avatarUrl' | 'entityId' | 'role'>) => void;
  entityToEdit: Entity | null;
}

const EntityModal: React.FC<EntityModalProps> = ({ isOpen, onClose, onSave, entityToEdit }) => {
  const [entityName, setEntityName] = useState('');
  const [entityType, setEntityType] = useState<EntityType>(EntityType.TCP);
  const [exchangeRate, setExchangeRate] = useState(120);
  const [isStoreEnabled, setIsStoreEnabled] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const isEditMode = entityToEdit !== null;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && entityToEdit) {
        setEntityName(entityToEdit.name);
        setEntityType(entityToEdit.type);
        setExchangeRate(entityToEdit.exchangeRate);
        setIsStoreEnabled(entityToEdit.isStoreEnabled);
      } else {
        // Reset fields for add mode
        setEntityName('');
        setEntityType(EntityType.TCP);
        setExchangeRate(120);
        setIsStoreEnabled(false);
        setAdminName('');
        setAdminEmail('');
        setAdminPassword('');
      }
    }
  }, [isOpen, entityToEdit, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityName) return;
    
    const entityData: Omit<Entity, 'id'> = { 
        name: entityName, 
        type: entityType, 
        exchangeRate, 
        isStoreEnabled,
    };

    if (isEditMode) {
      onSave(entityData);
    } else {
      if (!adminName || !adminEmail || !adminPassword) return;
      onSave(entityData, { name: adminName, email: adminEmail, password: adminPassword });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Editar Entidad' : 'Añadir Nueva Entidad'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <fieldset className="border border-gray-300 rounded-md p-4">
              <legend className="text-lg font-medium text-gray-800 px-2">Datos de la Empresa</legend>
              <div className="space-y-4">
                <div>
                  <label htmlFor="entityName" className="block text-sm font-medium text-gray-700">Nombre de la Entidad</label>
                  <input type="text" id="entityName" value={entityName} onChange={e => setEntityName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" required />
                </div>
                <div>
                  <label htmlFor="entityType" className="block text-sm font-medium text-gray-700">Tipo de Entidad</label>
                  <select 
                    id="entityType" 
                    value={entityType} 
                    onChange={e => setEntityType(e.target.value as EntityType)} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 bg-white" 
                    required
                  >
                      {Object.values(EntityType).map(type => (
                          <option key={type} value={type}>{type}</option>
                      ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="exchangeRate" className="block text-sm font-medium text-gray-700">Tasa de Cambio (1 USD a CUP)</label>
                  <input 
                    type="number" 
                    id="exchangeRate" 
                    value={exchangeRate} 
                    onChange={e => setExchangeRate(Number(e.target.value) || 0)} 
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" 
                    required
                  />
                </div>
                 <div>
                    <label className="flex items-center space-x-3 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={isStoreEnabled} 
                            onChange={(e) => setIsStoreEnabled(e.target.checked)}
                            className="form-checkbox h-5 w-5 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Habilitar Tienda Online</span>
                    </label>
                </div>
              </div>
            </fieldset>

            {!isEditMode && (
              <fieldset className="border border-gray-300 rounded-md p-4">
                  <legend className="text-lg font-medium text-gray-800 px-2">Primer Usuario Administrador</legend>
                  <div className="space-y-4">
                      <div>
                          <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">Nombre Completo del Admin</label>
                          <input type="text" id="adminName" value={adminName} onChange={e => setAdminName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" required={!isEditMode} />
                      </div>
                      <div>
                          <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">Correo Electrónico del Admin</label>
                          <input type="email" id="adminEmail" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" required={!isEditMode} />
                      </div>
                      <div>
                          <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">Contraseña para el Admin</label>
                          <input type="password" id="adminPassword" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" required={!isEditMode} />
                      </div>
                  </div>
              </fieldset>
            )}

          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              Cancelar
            </button>
            <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
              {isEditMode ? 'Guardar Cambios' : 'Guardar Entidad y Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EntityModal;