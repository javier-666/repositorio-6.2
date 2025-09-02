

import React, { useState, useMemo } from 'react';
import { Product, Order, User } from '../types';

interface CreateOrderProps {
    products: Product[];
    currentUser: User;
    onAddOrder: (order: Omit<Order, 'id' | 'orderDate' | 'status' | 'entityId'>) => void;
    onCancel: () => void;
}

type OrderItem = {
    productId: string;
    quantity: number;
    name: string;
    price: number;
    stock: number;
};

const CreateOrder: React.FC<CreateOrderProps> = ({ products, currentUser, onAddOrder, onCancel }) => {
    const [items, setItems] = useState<OrderItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        const searchLower = searchTerm.toLowerCase();
        return products.filter(p => 
            p.quantity > 0 &&
            (p.name.toLowerCase().includes(searchLower) || (p.sku && p.sku.toLowerCase().includes(searchLower)))
        ).slice(0, 5);
    }, [searchTerm, products]);
    
    const addItem = (product: Product) => {
        setItems(prevItems => {
            const existingItem = prevItems.find(item => item.productId === product.id);
            if (existingItem) {
                const newQuantity = Math.min(product.quantity, existingItem.quantity + 1);
                return prevItems.map(item => item.productId === product.id ? { ...item, quantity: newQuantity } : item);
            }
            return [...prevItems, { productId: product.id, quantity: 1, name: product.name, price: product.price, stock: product.quantity }];
        });
        setSearchTerm('');
    };

    const updateItemQuantity = (productId: string, quantity: number) => {
        setItems(prevItems => prevItems.map(item =>
            item.productId === productId ? { ...item, quantity: Math.max(0, Math.min(item.stock, quantity)) } : item
        ));
    };

    const removeItem = (productId: string) => {
        setItems(prevItems => prevItems.filter(item => item.productId !== productId));
    };

    const total = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [items]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (items.length === 0) {
            setError('Por favor, añada al menos un producto.');
            return;
        }

        // Stock validation
        const invalidItems = items.filter(item => item.quantity > item.stock);
        if (invalidItems.length > 0) {
            const errorMessages = invalidItems
                .map(item => `${item.name} (solicitado: ${item.quantity}, disponible: ${item.stock})`)
                .join(', ');
            setError(`No se puede completar el pedido. Stock insuficiente para: ${errorMessages}.`);
            return;
        }

        onAddOrder({
            userId: currentUser.id,
            items: items.map(({ productId, quantity }) => ({ productId, quantity })),
            total
        });
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Crear Nuevo Pedido</h1>
            <p className="text-gray-600 mb-6">Pedido para: <span className="font-semibold">{currentUser.name}</span></p>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Product Search */}
                    <div className="space-y-6">
                        <div className="relative">
                            <label htmlFor="search" className="block text-sm font-medium text-gray-700">Buscar Producto</label>
                            <input
                                type="text"
                                id="search"
                                placeholder="Escriba para buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
                            />
                            {searchResults.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg">
                                    {searchResults.map(product => (
                                        <li key={product.id} onClick={() => addItem(product)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center">
                                           <span>{product.name}</span>
                                           <span className="text-xs text-gray-500">Stock: {product.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    {/* Right Column: Order Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h2 className="text-xl font-semibold text-gray-700 mb-4">Resumen del Pedido</h2>
                        <div className="space-y-3 max-h-72 overflow-y-auto">
                            {items.length === 0 ? (
                                <p className="text-gray-500">Añada productos al pedido.</p>
                            ) : (
                                items.map(item => (
                                    <div key={item.productId} className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-800 flex-1 pr-2">{item.name}</span>
                                        <div className="flex items-center">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItemQuantity(item.productId, parseInt(e.target.value))}
                                                className="w-16 text-sm border-gray-300 rounded-md py-1 px-2"
                                                min="1"
                                                max={item.stock}
                                            />
                                            <button type="button" onClick={() => removeItem(item.productId)} className="ml-2 text-red-500 hover:text-red-700">&times;</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between items-center font-bold text-lg">
                                <span>Total:</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}


                <div className="mt-8 flex justify-end space-x-3">
                    <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                        Cancelar
                    </button>
                    <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500">
                        Guardar Pedido
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateOrder;