import React, { useState, useEffect } from 'react';
import { User } from '../types';
import UserEditIcon from './icons/UserEditIcon';

interface ProfileProps {
  currentUser: User;
  onUpdateProfile: (user: User) => void;
  onBack: () => void;
}

const Profile: React.FC<ProfileProps> = ({ currentUser, onUpdateProfile, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');
    
    const updatedUser = { ...currentUser, name, email };
    onUpdateProfile(updatedUser);
    setSuccess('Perfil actualizado con éxito.');
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <UserEditIcon className="w-8 h-8 mr-3 text-teal-600"/>
            Editar Perfil
        </h1>
         <button onClick={onBack} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
            &larr; Volver
        </button>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset className="border border-gray-300 rounded-md p-4">
              <legend className="text-lg font-medium text-gray-800 px-2">Información Personal</legend>
              <div className="space-y-4 pt-2">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                    <input 
                        type="text" 
                        id="name" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" 
                        required 
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                    <input 
                        type="email" 
                        id="email" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" 
                        required 
                    />
                </div>
              </div>
          </fieldset>
          
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <div className="flex justify-end">
            <button 
              type="submit" 
              className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;