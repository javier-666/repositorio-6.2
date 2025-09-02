import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Omit<User, 'id' | 'avatarUrl' | 'entityId'> | User) => void;
  userToEdit: User | null;
  currentUser: User;
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onSave, userToEdit, currentUser }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Almacenero);
  const [password, setPassword] = useState('');
  
  const isEditMode = userToEdit !== null;

  useEffect(() => {
    if (isOpen && userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
      setPassword('');
    } else if (isOpen && !isEditMode) {
      // Reset for "Add User" mode
      setName('');
      setEmail('');
      setRole(UserRole.Almacenero);
      setPassword('');
    }
  }, [isOpen, userToEdit, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    if (isEditMode && userToEdit) {
        const updatedUser = { ...userToEdit, name, email, role };
        if (password) {
            updatedUser.password = password;
        }
        onSave(updatedUser);
    } else {
        onSave({ name, email, role, password });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Editar Usuario' : 'Añadir Nuevo Usuario'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
              <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" required />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
              <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" required />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">Rol</label>
              <select id="role" value={role} onChange={e => setRole(e.target.value as UserRole)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                {currentUser.role === UserRole.SuperUsuario && <option value={UserRole.SuperAdmin}>Super Admin</option>}
                <option value={UserRole.Admin}>Administrador</option>
                <option value={UserRole.Almacenero}>Almacenero</option>
                <option value={UserRole.User}>Usuario</option>
              </select>
            </div>
             <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={isEditMode ? "Dejar en blanco para no cambiar" : ""} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" required={!isEditMode}/>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              Cancelar
            </button>
            <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
              {isEditMode ? 'Guardar Cambios' : 'Guardar Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;