import React, { useState } from 'react';
import { CustomerDetails } from '../types';
import UserCircleIcon from './icons/UserCircleIcon';
import MailIcon from './icons/MailIcon';
import MapPinIcon from './icons/MapPinIcon';
import IdentificationIcon from './icons/IdentificationIcon';

interface CartItem {
    name: string;
    quantity: number;
    price: number;
    imageUrl: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customerDetails: CustomerDetails) => void;
  cart: CartItem[];
  total: number;
  formatCurrency: (value: number) => string;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onConfirm, cart, total, formatCurrency }) => {
    const [formData, setFormData] = useState<CustomerDetails>({
        name: '',
        lastName: '',
        address: '',
        email: '',
        idCard: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col h-full max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Finalizar Compra</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Left Column: Form */}
                    <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-700">Información de Contacto y Entrega</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre</label>
                                <div className="relative mt-1">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserCircleIcon className="w-5 h-5 text-gray-400" /></span>
                                    <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" required />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Apellidos</label>
                                <div className="relative mt-1">
                                     <span className="absolute inset-y-0 left-0 flex items-center pl-3"><UserCircleIcon className="w-5 h-5 text-gray-400" /></span>
                                     <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" required />
                                </div>
                            </div>
                        </div>

                         <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
                            <div className="relative mt-1">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><MailIcon className="w-5 h-5 text-gray-400" /></span>
                                <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" required />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="idCard" className="block text-sm font-medium text-gray-700">Carnet de Identidad</label>
                            <div className="relative mt-1">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3"><IdentificationIcon className="w-5 h-5 text-gray-400" /></span>
                                <input type="text" name="idCard" id="idCard" value={formData.idCard} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" required />
                            </div>
                        </div>
                        
                         <div>
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Dirección Completa de Entrega</label>
                            <div className="relative mt-1">
                                 <span className="absolute inset-y-0 left-0 flex items-center pl-3 pt-2"><MapPinIcon className="w-5 h-5 text-gray-400" /></span>
                                <textarea name="address" id="address" value={formData.address} onChange={handleInputChange} rows={3} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500" required />
                            </div>
                        </div>
                    </form>
                    
                    {/* Right Column: Order Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Resumen del Pedido</h3>
                        <div className="flex-grow overflow-y-auto space-y-3">
                            {cart.map(item => (
                                <div key={item.name} className="flex items-center">
                                    <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                                    <div className="ml-3 flex-grow">
                                        <p className="text-sm font-medium text-gray-800">{item.name}</p>
                                        <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between items-center font-bold text-lg text-gray-800">
                                <span>Total:</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="checkout-form"
                        className="bg-teal-600 text-white px-6 py-2 rounded-md text-lg font-semibold hover:bg-teal-700"
                    >
                        Confirmar Pedido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;