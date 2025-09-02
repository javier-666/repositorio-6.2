import React, { useState, useRef } from 'react';
import { Entity, User } from '../types';
import EntityModal from './EntityModal';
import BuildingIcon from './icons/BuildingIcon';
import ConfirmationModal from './ConfirmationModal';
import TrashIcon from './icons/TrashIcon';
import UploadIcon from './icons/UploadIcon';
import DownloadIcon from './icons/DownloadIcon';

interface EntitiesProps {
    entities: Entity[];
    onAddEntity: (entityData: Omit<Entity, 'id'>, adminUser: Omit<User, 'id' | 'avatarUrl' | 'entityId' | 'role'>) => void;
    onUpdateEntity: (entity: Entity) => void;
    onDeleteEntity: (entityId: string) => void;
    onExportEntity: (entityId: string) => void;
    onImportEntity: (file: File) => void;
}

const Entities: React.FC<EntitiesProps> = ({ entities, onAddEntity, onUpdateEntity, onDeleteEntity, onExportEntity, onImportEntity }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [entityToEdit, setEntityToEdit] = useState<Entity | null>(null);
    const [entityToDelete, setEntityToDelete] = useState<Entity | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleOpenAddModal = () => {
        setEntityToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (entity: Entity) => {
        setEntityToEdit(entity);
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEntityToEdit(null);
    }

    const handleSave = (
        entityData: Omit<Entity, 'id'>, 
        adminUser?: Omit<User, 'id' | 'avatarUrl' | 'entityId' | 'role'>
    ) => {
        if (entityToEdit) {
            onUpdateEntity({ ...entityToEdit, ...entityData });
        } else if (adminUser) {
            onAddEntity(entityData, adminUser);
        }
    };
    
    const handleConfirmDelete = () => {
        if (entityToDelete) {
            onDeleteEntity(entityToDelete.id);
            setEntityToDelete(null);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImportEntity(file);
        }
    };


    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Entidades</h1>
                <div className="flex space-x-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".json"
                    />
                    <button 
                        onClick={handleImportClick}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                    >
                        <UploadIcon className="w-5 h-5 mr-2" />
                        Importar Entidad
                    </button>
                    <button 
                        onClick={handleOpenAddModal}
                        className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 flex items-center"
                    >
                        <BuildingIcon className="w-5 h-5 mr-2" />
                        Añadir Entidad
                    </button>
                </div>
            </div>
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre de la Entidad</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tienda Online</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID de Entidad</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {entities.map((entity) => (
                                <tr key={entity.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{entity.name}</div>
                                    </td>
                                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entity.type}</td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${entity.isStoreEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {entity.isStoreEnabled ? 'Habilitada' : 'Deshabilitada'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entity.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        <button onClick={() => onExportEntity(entity.id)} className="text-green-600 hover:text-green-900 flex items-center inline-flex">
                                            <DownloadIcon className="w-4 h-4 mr-1" />
                                            Exportar
                                        </button>
                                        <button onClick={() => handleOpenEditModal(entity)} className="text-teal-600 hover:text-teal-900">Editar</button>
                                        <button onClick={() => setEntityToDelete(entity)} className="text-red-600 hover:text-red-900 flex items-center inline-flex">
                                            <TrashIcon className="w-4 h-4 mr-1" />
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <EntityModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSave}
                entityToEdit={entityToEdit}
            />
            <ConfirmationModal
                isOpen={entityToDelete !== null}
                onClose={() => setEntityToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación"
                message={`¿Está seguro de que desea eliminar la entidad "${entityToDelete?.name}"? Esta acción es irreversible y eliminará todos los usuarios, productos y pedidos asociados.`}
            />
        </div>
    );
};

export default Entities;