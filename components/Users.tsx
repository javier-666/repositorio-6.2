import React, { useState, useMemo } from 'react';
import { User, UserRole } from '../types';
import UserModal from './UserModal';
import UsersIcon from './icons/UsersIcon';
import ConfirmationModal from './ConfirmationModal';
import TrashIcon from './icons/TrashIcon';
import Pagination from './Pagination';

interface UsersProps {
    users: User[];
    onAddUser: (user: Omit<User, 'id' | 'avatarUrl' | 'entityId'>) => void;
    onUpdateUser: (user: User) => void;
    onDeleteUser: (userId: string) => void;
    currentUser: User;
}

const Users: React.FC<UsersProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const paginatedUsers = useMemo(() => {
        const startIndex = page * rowsPerPage;
        return users.slice(startIndex, startIndex + rowsPerPage);
    }, [users, page, rowsPerPage]);

    const handleOpenAddModal = () => {
        setUserToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user: User) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };
    
    const handleSaveUser = (user: Omit<User, 'id' | 'avatarUrl' | 'entityId'> | User) => {
        if ('id' in user) {
            onUpdateUser(user as User);
        } else {
            onAddUser(user as Omit<User, 'id' | 'avatarUrl' | 'entityId'>);
        }
    };

    const handleConfirmDelete = () => {
        if (userToDelete) {
            onDeleteUser(userToDelete.id);
            setUserToDelete(null);
        }
    }

    const getRoleClass = (role: UserRole) => {
        switch (role) {
            case UserRole.SuperUsuario:
                return 'bg-red-200 text-red-900';
            case UserRole.SuperAdmin:
                return 'bg-purple-200 text-purple-900';
            case UserRole.Admin:
                return 'bg-teal-100 text-teal-800';
            case UserRole.Almacenero:
                return 'bg-blue-100 text-blue-800';
            case UserRole.User:
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
                <button 
                    onClick={handleOpenAddModal}
                    className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 flex items-center"
                >
                    <UsersIcon className="w-5 h-5 mr-2" />
                    Añadir Usuario
                </button>
            </div>
            <div className="bg-white shadow-md rounded-t-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo Electrónico</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedUsers.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleClass(user.role)}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        <button onClick={() => handleOpenEditModal(user)} className="text-teal-600 hover:text-teal-900">Editar</button>
                                        {currentUser.id !== user.id && (
                                             <button 
                                                onClick={() => setUserToDelete(user)} 
                                                className="text-red-600 hover:text-red-900 inline-flex items-center"
                                            >
                                                <TrashIcon className="w-4 h-4 mr-1" />
                                                Eliminar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
             <Pagination
                count={users.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={setPage}
                onRowsPerPageChange={(value) => {
                    setRowsPerPage(value);
                    setPage(0);
                }}
            />
             <UserModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveUser}
                userToEdit={userToEdit}
                currentUser={currentUser}
            />
            <ConfirmationModal
                isOpen={userToDelete !== null}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación de Usuario"
                message={`¿Está seguro de que desea eliminar al usuario "${userToDelete?.name}"? Todos los pedidos asociados a este usuario también serán eliminados. Esta acción es irreversible.`}
            />
        </div>
    );
};

export default Users;