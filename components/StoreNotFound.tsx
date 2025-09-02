import React from 'react';
import Logo from './icons/Logo';

interface StoreNotFoundProps {
    message?: string;
}

const StoreNotFound: React.FC<StoreNotFoundProps> = ({ message }) => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-md w-full">
                <Logo className="w-48 h-auto mx-auto text-gray-400" />
                <h1 className="mt-6 text-4xl font-bold text-gray-800">Tienda no Encontrada</h1>
                <p className="mt-4 text-gray-600">
                    {message || "Lo sentimos, no pudimos encontrar la tienda que está buscando. Puede que la URL sea incorrecta o que la tienda ya no esté disponible."}
                </p>
                <a 
                    href="/" 
                    className="mt-8 inline-block bg-teal-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-teal-700 transition-colors"
                >
                    Volver a la Página Principal
                </a>
            </div>
        </div>
    );
};

export default StoreNotFound;