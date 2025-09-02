import React, { useState, useRef, useEffect } from 'react';
import { Entity } from '../types';
import UploadIcon from './icons/UploadIcon';

interface StoreSettingsProps {
    activeEntity: Entity;
    onUpdateEntity: (entity: Entity) => void;
}

const StoreSettings: React.FC<StoreSettingsProps> = ({ activeEntity, onUpdateEntity }) => {
    const [logoPreview, setLogoPreview] = useState(activeEntity.storeLogoUrl || '');
    const [coverPreview, setCoverPreview] = useState(activeEntity.storeCoverUrl || '');
    const [successMessage, setSuccessMessage] = useState('');

    const logoInputRef = useRef<HTMLInputElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        setLogoPreview(activeEntity.storeLogoUrl || '');
        setCoverPreview(activeEntity.storeCoverUrl || '');
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const updatedEntity = {
            ...activeEntity,
            storeLogoUrl: logoPreview,
            storeCoverUrl: coverPreview,
        };
        onUpdateEntity(updatedEntity);
        setSuccessMessage('Ajustes de la tienda guardados con éxito.');
        setTimeout(() => setSuccessMessage(''), 3000);
    };
    
    const defaultCover = 'https://via.placeholder.com/1200x400.png/E2E8F0/4A5568?text=Portada';
    const defaultLogo = 'https://via.placeholder.com/200x200.png/E2E8F0/4A5568?text=Logo';

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Ajustes de la Tienda Online</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Logo Section */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Logo de la Tienda</h2>
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
                <div className="bg-white p-6 rounded-lg shadow-md">
                     <h2 className="text-xl font-semibold text-gray-700 mb-4">Foto de Portada</h2>
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
                
                <div className="flex justify-end items-center gap-4 pt-4 border-t">
                    {successMessage && <p className="text-green-600 text-sm animate-pulse">{successMessage}</p>}
                    <button 
                        type="submit" 
                        className="bg-teal-600 text-white px-6 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 font-semibold"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StoreSettings;
